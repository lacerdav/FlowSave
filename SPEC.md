# FlowSave — Complete Build Specification

> Generated from CLAUDE.md + pre-build interview (2026-04-01).
> This is the authoritative spec for the build session. Do not deviate without updating it.
> DESIGN.md is the authoritative source for visual execution details.

---

## Decision Log (interview outcomes)

| Topic | Decision |
|---|---|
| DB indexes | Add `payments(user_id, received_at)` and `projects(user_id, status)` in migration 001 |
| Pro gate | Double-gate: Server Action + API route both check `plan === 'pro'` independently |
| Freemium UX | Inline upsell modal on "Add Client" click when free user has ≥ 2 clients |
| Forecast fallback | Average available months; fall back to `target_monthly_salary` if zero history; label "estimated" |
| Stripe trial | Card at signup; non-conversion = auto-downgrade to free; data preserved forever, never deleted |
| Onboarding | 3-step wizard on first login; skip allowed; redirects to `/dashboard` after |
| Visual direction | todesktop-inspired fluid product UI with atmospheric dark-to-light page transitions on long pages |
| Motion direction | subtle reveal, parallax feel, hover motion, and section transitions where they improve perceived quality |

---

## Architecture Overview

```text
/app
  (auth)/
    login/page.tsx
    callback/route.ts
  (app)/
    layout.tsx
    dashboard/page.tsx
    clients/page.tsx
    payments/page.tsx
    projects/page.tsx
    settings/page.tsx
    upgrade/page.tsx
    onboarding/page.tsx
  api/
    ai/summary/route.ts
    ai/lean-alert/route.ts
    webhooks/stripe/route.ts

/components
  ui/
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
    AiInsightCard.tsx
  clients/
    ClientForm.tsx
    ClientList.tsx
    UpgradeLimitModal.tsx
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
    PlanGate.tsx

/lib
  supabase/
    client.ts
    server.ts
    middleware.ts
    queries/
      payments.ts
      clients.ts
      projects.ts
      settings.ts
      user.ts
  ai/
    openrouter.ts
  stripe/
    client.ts
    helpers.ts
  forecast.ts
  utils.ts

/emails
  LeanMonthAlert.tsx

/types
  supabase.ts
  index.ts

/middleware.ts
/DESIGN.md                ← source of truth for visual execution
```

---

## Visual system authority

- CLAUDE.md defines product philosophy, rules, and phase scope.
- SPEC.md defines architecture, business logic, and flows.
- DESIGN.md defines visual execution, spacing, backgrounds, motion, contrast, and component behavior.
- If there is conflict about visual implementation, DESIGN.md wins.
- If there is conflict about feature behavior or data logic, SPEC.md wins.

---

## Visual direction

FlowSave is not a flat dark dashboard. It should feel fluid and premium.
The app begins in deep navy and may gradually brighten into airy blue and near-white
zones as the user scrolls on long pages. This mirrors the cinematic flow seen in the
todesktop.com reference while preserving financial clarity.

Rules:
- Environmental gradients can shift from dark to bright by scroll depth or section.
- Semantic data colors remain fixed: green/blue/amber/red only.
- Cards must adapt to the section they live in: dark-section cards use dark surfaces;
  bright-section cards use translucent bright surfaces with dark text.
- Motion must support hierarchy, not distract from it.
- Use CSS and Framer Motion sparingly and intentionally.

---

## App Shell

`/app/(app)/layout.tsx` — server component:
1. Read session — middleware handles redirect if unauthenticated
2. Fetch `users.plan` (passed to `AppShell` for `PlanGate` throughout the app)
3. Apply page background wrappers that support long-form atmospheric transitions on pages that need it

`AppShell.tsx`:
- Fixed navbar (56px, semi-transparent, blur backdrop)
- Left sidebar (200px, `border-right: 1px var(--border)` in dark sections)
- Main content (flex-1, padding 24px)
- Sidebar links: Dashboard, Clients, Payments, Projects, Settings
- Navbar: logo left | email + plan badge + upgrade CTA right (upgrade CTA hidden for Pro)
- On long pages, background treatment may shift from dark navy near the top toward brighter sections lower on the page

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
- Chart card should behave like a hero element, with enough space and motion polish to feel premium

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

Visual notes:
- Dashboard top starts in dark navy
- Lower sections may transition into brighter atmospheric zones
- Cards, text color, and borders must adapt to their section background
- Reveal motion for sections should be subtle and polished

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

Visual notes:
- Wizard may use a more cinematic full-page progression than the current dashboard
- Motion between steps should feel continuous and calm

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

## Forecast Algorithm (`/lib/forecast.ts`)

```text
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
const PRIMARY  = process.env.OPENROUTER_PRIMARY_MODEL!;
const FALLBACK = process.env.OPENROUTER_FALLBACK_MODEL!;

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

### Phase 2.1 — Dashboard refinement
1. Metric cards visual polish
2. Chart hierarchy and spacing polish
3. Multi-currency clarity pass
4. Pending card empty state redesign
5. Salary gap and progress language refinement
6. Dashboard micro-interactions
7. Mobile polish at 375px

### Phase 2.2 — Visual refinement (todesktop-inspired)
1. Create DESIGN.md if missing
2. Implement atmospheric dark-to-light page backgrounds on long pages
3. Implement motion system for section reveal, hover, and fluid page progression
4. Adapt cards and typography for bright lower sections where used
5. Align Dashboard, Clients, and Payments to DESIGN.md

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

## Done Criteria (per feature)

1. Works end-to-end in browser
2. Empty, loading, and error states handled
3. Responsive at 375px minimum
4. Design system applied correctly per CLAUDE.md and DESIGN.md
5. Dark-to-light atmospheric transitions are smooth where used and never damage readability
6. Motion is fluid, subtle, and purposeful
7. `npx tsc --noEmit` passes

---

## Out of Scope

- Bank/Plaid integration
- Native mobile app
- Multi-currency beyond USD and BRL
- Multi-user/team accounts
- Retirement or investment tracking
- Accounting software export
