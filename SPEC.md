# FlowSave — Complete Build Specification

> Generated from CLAUDE.md + pre-build interview (2026-04-01).
> This is the authoritative spec for the build session. Do not deviate without updating it.

---

## Decision Log (interview outcomes)

| Topic | Decision |
|---|---|
| DB indexes | Add `payments(user_id, received_at)` and `projects(user_id, status)` in migration 001 |
| Pro gate | Double-gate: Server Action + API route both check `plan === 'pro'` independently |
| Freemium UX | Inline upsell modal on "Add Client" click when free user has ≥ 2 clients |
| Forecast fallback | Average available months; fall back to `target_monthly_salary` if zero history; label "estimated" |
| Stripe trial | Card at signup; non-conversion = auto-downgrade to free; data preserved forever, never deleted |
| Onboarding | 3-step wizard on first login; skip allowed; redirects to /dashboard after |

---

## Architecture Overview

```
/app
  (auth)/
    login/page.tsx          ← magic link entry
    callback/route.ts       ← Supabase auth callback
  (app)/
    layout.tsx              ← app shell (sidebar + navbar), auth-guarded
    dashboard/page.tsx
    clients/page.tsx
    payments/page.tsx
    projects/page.tsx
    settings/page.tsx
    upgrade/page.tsx
    onboarding/page.tsx     ← 3-step wizard (shown once)
  api/
    ai/summary/route.ts     ← Pro-gated, calls OpenRouter
    ai/lean-alert/route.ts  ← Pro-gated
    webhooks/stripe/route.ts

/components
  ui/                       ← shadcn/ui primitives
  layout/
    Sidebar.tsx
    Navbar.tsx
    AppShell.tsx
  dashboard/
    MetricCard.tsx
    CashFlowChart.tsx
    RecentPayments.tsx
    TaxReserveCard.tsx
    SalaryProgress.tsx
    ForecastPanel.tsx
    AiInsightCard.tsx       ← Pro only; shows upsell card for free users
  clients/
    ClientForm.tsx
    ClientList.tsx
    UpgradeLimitModal.tsx   ← shown when free user hits 2-client limit
  payments/
    PaymentForm.tsx
    PaymentList.tsx
  projects/
    ProjectForm.tsx
    ProjectList.tsx
  onboarding/
    OnboardingWizard.tsx
    StepTargets.tsx
    StepAddClient.tsx
    StepAddPayment.tsx
  shared/
    PlanGate.tsx            ← wrapper: renders children for Pro, upsell card for free

/lib
  supabase/
    client.ts               ← browser client (createBrowserClient)
    server.ts               ← server client (createServerClient)
    middleware.ts           ← session refresh
    queries/
      payments.ts
      clients.ts
      projects.ts
      settings.ts
      user.ts
  ai/
    openrouter.ts           ← all OpenRouter calls, nowhere else
  stripe/
    client.ts
    helpers.ts              ← createCheckoutSession, createPortalSession
  forecast.ts               ← 3-month projection algorithm
  utils.ts                  ← currency format, date helpers

/emails
  LeanMonthAlert.tsx

/types
  supabase.ts               ← generated (npx supabase gen types)
  index.ts                  ← app-level types

/middleware.ts              ← route protection (redirect unauthenticated to /login)
```

---

## Database Schema (final)

```sql
-- migrations/001_init.sql

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  created_at timestamptz default now(),
  stripe_customer_id text,
  plan text not null default 'free' check (plan in ('free', 'pro'))
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  name text not null,
  currency text not null default 'USD',
  created_at timestamptz default now()
);

create table payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  received_at date not null,
  notes text,
  created_at timestamptz default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  client_id uuid references clients(id) on delete set null,
  name text not null,
  expected_amount numeric(12,2) not null,
  expected_date date not null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'received', 'cancelled')),
  created_at timestamptz default now()
);

create table settings (
  user_id uuid primary key references users(id) on delete cascade,
  target_monthly_salary numeric(12,2) not null default 0,
  tax_reserve_pct numeric(5,2) not null default 25,
  survival_budget numeric(12,2) not null default 0,
  onboarding_completed boolean not null default false,
  lean_alert_sent_at timestamptz,           -- freq cap: 1 email per lean month
  ai_insight_cache text,                    -- cached Pro insight string
  ai_insight_cached_at timestamptz,         -- cache timestamp; invalidate after 24h
  updated_at timestamptz default now()
);

-- Indexes
create index idx_payments_user_date on payments(user_id, received_at desc);
create index idx_projects_user_status on projects(user_id, status);

-- RLS
alter table users enable row level security;
alter table clients enable row level security;
alter table payments enable row level security;
alter table projects enable row level security;
alter table settings enable row level security;

create policy "own rows" on users for all using (id = auth.uid());
create policy "own rows" on clients for all using (user_id = auth.uid());
create policy "own rows" on payments for all using (user_id = auth.uid());
create policy "own rows" on projects for all using (user_id = auth.uid());
create policy "own rows" on settings for all using (user_id = auth.uid());
```

`settings.onboarding_completed` tracks whether the wizard has been seen. On auth callback: if no settings row or `onboarding_completed: false`, redirect to `/onboarding`.

---

## Auth Flow

1. `/login` — email input → `supabase.auth.signInWithOtp({ email })`
2. Supabase sends magic link → user clicks → `/auth/callback`
3. `/auth/callback/route.ts` — exchange code, set session, check settings row:
   - No settings row → insert default row (`onboarding_completed: false`) → redirect `/onboarding`
   - `onboarding_completed: false` → redirect `/onboarding`
   - Otherwise → redirect `/dashboard`
4. `middleware.ts` — refresh session on every request; redirect unauthenticated to `/login`

---

## Onboarding Wizard

Route: `/onboarding` — server component wrapper, `'use client'` wizard component.

**Step 1 — Targets** (`StepTargets.tsx`)
- Fields: Monthly target ($), Tax reserve (%), Survival budget ($)
- On submit: upsert into `settings`, advance to step 2

**Step 2 — First Client** (`StepAddClient.tsx`)
- Fields: Client name, Currency (USD / BRL)
- On submit: insert into `clients`, advance to step 3

**Step 3 — First Payment** (`StepAddPayment.tsx`)
- Fields: Amount, Date, Notes (optional)
- Client auto-selected from step 2
- On submit: insert into `payments`, set `onboarding_completed: true`, redirect `/dashboard`

**Skip behavior**: "Skip for now" on any step marks `onboarding_completed: true`. Wizard never re-appears. Dashboard shows empty-state banner until data exists.

---

## App Shell

`/app/(app)/layout.tsx` — server component:
1. Read session — middleware handles redirect if unauthenticated
2. Fetch `users.plan` (passed to `AppShell` for `PlanGate` throughout the app)

`AppShell.tsx`:
- Fixed navbar (56px, semi-transparent, blur backdrop)
- Left sidebar (200px, `border-right: 1px var(--border)`)
- Main content (flex-1, padding 24px)
- Sidebar links: Dashboard, Clients, Payments, Projects, Settings
- Navbar: logo left | email + plan badge + upgrade CTA right (upgrade CTA hidden for Pro)

---

## Dashboard Page

**Four metric cards:**
1. This month — `SUM(payments.amount)` where `received_at` in current month
2. Tax reserve — metric 1 × `tax_reserve_pct / 100`
3. Salary gap — `target_monthly_salary − metric 1` (green if surplus, red if deficit)
4. Pending — `SUM(projects.expected_amount)` where `status IN ('pending','confirmed')`

**Cash flow chart** (Recharts `BarChart`):
- 6 months: 3 historical + current + 2 forecast
- Historical: `rgba(91,127,255,0.15)` fill
- Current month: solid `--accent`
- Forecast: `--accent` if ≥ `survival_budget`, `--amber` if lean
- Dashed `--amber` reference line = rolling average of historical months

**Recent payments list:** last 10, client color dot + name, amount, date

**Tax reserve card:** per-payment breakdown for current month + monthly total

**Salary target progress:** progress bar, `received / target_monthly_salary`, label "X% of target" or "Target exceeded"

**AI insights (Pro only):**
- Monthly summary (2 sentences) + lean month alert if applicable
- Cache: serve `settings.ai_insight_cache` if `ai_insight_cached_at` < 24h ago; otherwise call OpenRouter and update cache
- Free users: static upsell card

**Empty state banner:**
- Condition: `onboarding_completed: true` AND (`clientCount === 0` OR `paymentCount === 0`)
- Amber banner, non-dismissible: "Your dashboard is empty — Add a client → or Log a payment →"
- Disappears automatically once both exist

---

## Freemium Gate: Client Limit

- "Add Client" button: if `plan === 'free'` and `clientCount >= 2`, opens `<UpgradeLimitModal />`
- Modal: limit explanation, Pro feature list, "Upgrade to Pro — $19/mo" CTA, "Maybe later" dismiss
- Server Action for client insert: independently checks count and returns error for over-limit free users

---

## Pro Gate: AI Features

```
Client component
  └─ Server Action: getMonthlyInsight(userId)
        └─ check plan === 'pro'
              free  → return null (no network call)
              pro   → POST /api/ai/summary
                          └─ re-check plan === 'pro'  (independent)
                                fail → 403
                                pass → lib/ai/openrouter.ts → string
```

`/lib/ai/openrouter.ts` is the only file that calls OpenRouter. Never inline elsewhere.

---

## Forecast Algorithm (`/lib/forecast.ts`)

```
Input:  payments[], projects[], settings, today: Date
Output: ForecastMonth[] — { month: Date, projected: number, isLean: boolean, isEstimated: boolean }

1. Group payments by calendar month → monthlyTotals[]
2. baselineAvg:
     length === 0 → settings.target_monthly_salary, isEstimated = true
     length  >  0 → average(monthlyTotals), isEstimated = length < 3
3. For each of next 3 months:
     confirmed = SUM(projects.expected_amount)
       where status === 'confirmed' AND expected_date in that month
     projected = baselineAvg + confirmed
     isLean    = projected < settings.survival_budget
4. Return 3 ForecastMonth objects
```

---

## Stripe Integration

**Checkout:**
1. User clicks any "Upgrade to Pro" surface
2. Server Action `createCheckoutSession(userId)`:
   - Get/create Stripe customer, store `stripe_customer_id`
   - Create Checkout Session: `mode=subscription`, 14-day trial, $19/month, card required
   - Return `session.url` → client redirects
3. Success → Stripe redirects to `/dashboard?upgraded=1`

**Webhook** (`/api/webhooks/stripe/route.ts`):
- `checkout.session.completed` → `plan = 'pro'`
- `customer.subscription.deleted` → `plan = 'free'` (covers trial non-conversion + cancellation)
- `invoice.payment_failed` (after Stripe retry exhaustion) → `plan = 'free'`
- Data never deleted on downgrade

**Customer portal:** `createPortalSession(userId)` from settings page

---

## OpenRouter Integration (`/lib/ai/openrouter.ts`)

```typescript
const PRIMARY  = process.env.OPENROUTER_PRIMARY_MODEL!;   // google/gemini-2.5-flash-lite
const FALLBACK = process.env.OPENROUTER_FALLBACK_MODEL!;  // deepseek/deepseek-chat-v3-0324

export async function callOpenRouter(prompt: string): Promise<string | null>
// - Try PRIMARY; on error try FALLBACK; return null on both failing
// - max_tokens: 120
// - Headers: "HTTP-Referer": "https://getflowsave.com", "X-Title": "FlowSave"
```

---

## Lean Month Alert Email

- Template: `LeanMonthAlert.tsx` (React Email + Resend)
- Triggered server-side when forecast contains a lean month
- Frequency cap: send only if `settings.lean_alert_sent_at` is null or > 30 days ago; update after sending
- Content: lean month name, projected vs survival_budget, 1 AI action (Pro) or generic tip (free)

---

## Phase Build Order

### Phase 1 — Foundation
1. Scaffold: `npx create-next-app@latest` — TypeScript strict, Tailwind, App Router
2. Install: `@supabase/ssr`, `stripe`, `resend`, `recharts`, shadcn/ui
3. `globals.css`: all CSS variables from design system
4. Supabase migration 001 (full schema above)
5. `npx supabase gen types typescript --local > types/supabase.ts`
6. Auth: login page, magic link, `/auth/callback`, `middleware.ts`
7. Settings page: target salary, tax %, survival budget
8. Clients: form + list + 2-client gate
9. Payments: form + list

### Phase 2 — Dashboard
1. AppShell: Sidebar, Navbar, layout
2. Metric cards × 4, CashFlowChart, RecentPayments
3. TaxReserveCard, SalaryProgress
4. Onboarding wizard (3 steps + skip logic)

### Phase 3 — Intelligence
1. Projects: form + list
2. `forecast.ts` algorithm
3. ForecastPanel on dashboard + lean month detection
4. LeanMonthAlert email via Resend

### Phase 4 — Monetization
1. Stripe checkout + webhook
2. UpgradeLimitModal
3. PlanGate wrapper + upsell cards throughout
4. Customer portal in settings

### Phase 5 — AI + Polish
1. `openrouter.ts` + AiInsightCard (Pro) / upsell fallback (free)
2. Landing page
3. Onboarding polish

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
OPENROUTER_API_KEY=
OPENROUTER_PRIMARY_MODEL=google/gemini-2.5-flash-lite
OPENROUTER_FALLBACK_MODEL=deepseek/deepseek-chat-v3-0324
RESEND_API_KEY=
NEXT_PUBLIC_APP_URL=https://getflowsave.com
```

---

## Done Criteria (per feature)

1. Works end-to-end in browser
2. Empty, loading, and error states handled
3. Responsive at 375px minimum
4. Design system applied: dark theme, CSS vars, correct typography
5. `npx tsc --noEmit` passes

---

## Out of Scope

- Bank/Plaid integration
- Native mobile app
- Multi-currency beyond USD and BRL
- Multi-user/team accounts
- Retirement or investment tracking
- Accounting software export
