# FlowSave — Master Roadmap

## Product Vision

FlowSave is a **cashflow operating system for freelancers**.

NOT a tracker.

Core pillars: clarity · control · predictability

---

## Core Model (NON-NEGOTIABLE)

```
Projects          →  pipeline (uncertain money, intent only)
Payment Schedule  →  committed future money
Payments          →  realized money (already received)
```

- expected_amount is advisory
- If a schedule exists → it overrides expected_amount
- NEVER mix pipeline projections with committed/received money on the same surface

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 15 (App Router), TypeScript strict |
| Styling | Tailwind CSS 4.2 + shadcn/ui |
| Database | Supabase (PostgreSQL + Auth) |
| Charts | Recharts |
| Motion | motion/react (migrated from framer-motion) |
| Icons | lucide-react |
| Forms | react-hook-form + zod + @hookform/resolvers |
| Payments | Stripe Billing |
| Email | Resend + React Email |
| AI | OpenRouter API |
| Deploy | Vercel |

---

## Database Rules

Before ANY implementation touching the schema:
1. Validate schema vs code
2. List every missing migration
3. Provide exact SQL if needed
4. NEVER assume migrations are applied

Tables: `users`, `clients`, `payments`, `projects`, `settings`, `payment_schedule`

Migrations applied: 001 → 002 → 003 (sub_status) → 004 (payment_schedule)
Pending: 005 (user profile fields — Phase 4.5)

---

## Financial Rules

- Projects ≠ money
- Schedule = future money (committed, installment-aware)
- Payments = real money (received, taxed, banked)

Dashboard must reflect real financial state at all times.

---

## PRO / FREE Summary

- `users.plan`: 'free' | 'pro'
- Free: 2 clients max, no AI, no forecast
- Pro: $19/mo — unlimited clients, forecast, AI insights
- Annual: $15/mo ($180/yr) · Trial: 14 days
- PlanGate wrapper: built in Phase 5
- AI gate: ALWAYS check plan === 'pro' before any OpenRouter call

UI badges:
- FREE → amber glow + upgrade CTA (always visible, top-center shell)
- PRO  → quiet green badge, no upsell

---

## Phase Roadmap

### Phase 1 — Foundation ✅ COMPLETE
Auth (magic link), clients, payments, settings, onboarding, Supabase RLS.

### Phase 2 — Dashboard ✅ COMPLETE
App shell, metric cards ×4, Recharts cash flow chart, recent payments,
tax reserve card, salary progress, empty states, onboarding wizard.

### Phase 2.1 — Dashboard Refinement ✅ COMPLETE
Metric card hierarchy, chart clarity, multi-currency labels, pending empty state,
salary progress labels, micro-interactions, atmospheric background.

### Phase 2.2 — Premium UI Evolution ✅ COMPLETE
Atmospheric gradient system, SF Pro typography, glass kicker header,
sidebar glow + active states, lucide-react standardization, motion system.

### Phase 2.3 — Brand + Controls ✅ COMPLETE
FlowSave wordmark + icon, shadcn/ui as primitive base,
Framer Motion for shell reveals, payment date picker premium finish.

### Phase 3 — Intelligence ✅ COMPLETE
Projects full CRUD, status workflow (pending → confirmed → received → cancelled),
sub-states (prospecting / negotiating), forecast.ts algorithm.

### Phase 3.2 — Visual System Overhaul ✅ COMPLETE
Typography scale, panel-surface depth, CTA press states, status glow system,
row-hover left accent bar, semantic glow CSS tokens, MetricCard valueGlowClass().

### Phase 3.3 — Schedule Layer + Upcoming ✅ COMPLETE
payment_schedule table (migration 004), PaymentPlanModal, lib/schedule.ts,
Upcoming page, CashFlowChart 3-series + toggle, MarkScheduleReceivedModal,
MoveToNegotiatingModal, dashboard pending from schedule entries.

### Phase 3.4 — Forms Refactor ✅ COMPLETE
Installed react-hook-form + zod + @hookform/resolvers.
Refactored ProjectForm.tsx + EditProjectModal + AddProjectModal + CreateProjectFromPaymentModal.
TypeScript strict checks pass.

### Phase 4 — Dashboard 2.0 ✅ COMPLETE

**Goal:** Eliminate dead space, clarify financial hierarchy, remove competing cards.

- [x] HeroMonthCard — split card: value + % vs last month + tax reserve integrated
- [x] SalaryGapCard — deficit/surplus glow states, red/green semantic color
- [x] PendingCard — USD/BRL amounts + "View schedule →" CTA + blue hover glow
- [x] Dashboard 2×2 grid: [Hero | Gap] / [Pending | Recent]
- [x] TaxReserveCard removed as standalone
- [x] RecentPayments: compact label only
- [x] DashboardMotionShell: space-y-6 / pb-12
- [x] Container queries on dashboard grid — reacts to sidebar collapse, not viewport
- [x] Mobile layout: responsive via CSS variables (no more magic pixel values)

---

### Phase 4.1 — CSS Architecture & Motion Migration ✅ COMPLETE

**Goal:** Eliminate tech debt in styling layer, improve performance and maintainability.

- [x] Geist variable font via `next/font/google` — CSS vars `--font-sans` / `--font-mono`, zero FOUT
- [x] Skip-to-content link for keyboard accessibility (`#main-content` anchor)
- [x] Magic number `pt-[108px]` removed — layout height via `--navbar-h` / `--mobile-nav-h` CSS vars
- [x] Sidebar collapse `[data-collapsed='true']` styles guarded behind `@media (min-width: 768px)`
- [x] `globals.css` split: 2523 lines → 62 lines + 7 partials under `app/styles/`
      (`tokens.css`, `layout.css`, `typography.css`, `components.css`, `forms.css`, `interactive.css`, `animations.css`)
- [x] CTA buttons (`payment-submit`, `primary-cta-button`) moved to `@layer components`
- [x] `@property --shimmer-x` shimmer animation on `.entity-card` hover — 100% CSS, no JS
- [x] `framer-motion` → `motion/react` across all 8 animated components
- Build: ✓ zero TS errors, 22 routes compiled, 0 vulnerabilities

---

### Phase 4.5 — UI/UX Global Review 🆕 NEXT

**Goal:** Every page passes the screenshot test before Stripe goes in.
No monetization work starts until this phase is complete.

#### 4.5.1 — App Shell Redesign (MacOS Frame Style)
- [ ] Content area wrapped in floating "window" frame
      - Rounded corners on right side, subtle border + drop shadow
      - Frame visually extends from left nav — contained "app in browser" feel
      - Subtle breadcrumb/title bar inside frame (minimal)
- [ ] Sign Out: moved to very bottom of left nav panel
- [ ] Upgrade CTA: top-center of app shell, always visible
      - FREE: amber glowing "Upgrade to Pro" button + pulse animation
      - PRO: quiet green "PRO ✓" badge, no CTA

#### 4.5.2 — Clients Page Overhaul
- [ ] Card grid layout (matches Projects/Payments visual language)
- [ ] Add Client: top-right button only
- [ ] ClientCard: name · total received · last payment date · active projects count
- [ ] FREE usage banner (prominent amber, non-dismissible at 2/2)
      - "2/2 clients used · Upgrade to Pro for unlimited clients"
      - Progress variant at 0/2 or 1/2 (informational)
- [ ] Client card click → detail/edit modal

#### 4.5.3 — Auth Pages Redesign
- [ ] Canvas particle background
      - Slow drift, proximity connections, mouse glow halo, idle pulse
      - Use tsparticles lite or vanilla canvas (no heavy lib)
- [ ] Centered glass card on particle background
- [ ] Sign Up fields:
      - First name + Last name
      - Email
      - Password + Confirm password
      - Freelance role (select): Frontend Dev · Backend Dev · Full Stack Dev · Designer ·
        Product Manager · Product Engineer · Marketing · Copywriter · Consultant · Other
      - Monthly income goal (optional — pre-fills target_monthly_salary)
      - Primary currency: BRL / USD / EUR (pre-fills default currency in settings)
- [ ] Login fields: email + password only
- [ ] Animated tab toggle: Login ↔ Sign Up
- [ ] Google OAuth + Apple OAuth buttons
- [ ] Supabase: enable Google + Apple OAuth providers
- [ ] Migration 005: first_name, last_name, freelance_role, primary_currency on users

#### 4.5.4 — Cross-Page Consistency Pass
- [ ] All surfaces: --surface / --surface-2 / --border tokens consistent
- [ ] All hover states: glow + translateY(-1px) + cursor-pointer
- [ ] All pages: designed empty states present
- [ ] Payments page: visual parity with Projects post-refactor
- [ ] Upcoming page: card style matches Dashboard cards
- [ ] Settings page: form label/input consistency

---

### Phase 5 — Monetization [ ] NOT STARTED
- [ ] Stripe checkout + webhook handler
- [ ] PlanGate wrapper component (blocks + shows upsell)
- [ ] Upsell cards throughout (AI, extra clients, forecast)
- [ ] Contextual upgrade modal (triggered at any gate)
- [ ] Customer portal link in settings
- [ ] Upgrade flow accessible from inside app

### Phase 6 — AI and Polish [ ] NOT STARTED
- [ ] openrouter.ts + AiInsightCard (Pro) / upsell fallback (free)
- [ ] Insights personalized by freelance_role
- [ ] Landing page with pricing section + signup CTA
- [ ] Final onboarding polish (personalized by role)

---

## Current Priority

```
✅ Phase 4    — Dashboard 2.0 complete
✅ Phase 4.1  — CSS architecture + motion migration complete
🆕 Phase 4.5.1 — App shell MacOS frame + Sign Out + Upgrade badge
🆕 Phase 4.5.2 — Clients page card grid + FREE banner
🆕 Phase 4.5.3 — Auth pages redesign (particles + OAuth + new fields + migration 005)
🆕 Phase 4.5.4 — Cross-page consistency pass (hover states, empty states, token audit)
⏭  Phase 5    — Monetization (Stripe checkout + PlanGate + upsell)
⏭  Phase 6    — AI insights (OpenRouter) + landing page
```

---

## UI Rules

**Cards:**
- No empty space
- Clear hierarchy — one dominant value per card
- One purpose per card

**Clickable elements must have:**
- cursor: pointer
- hover glow
- slight lift (translateY -1px)

**Motion:**
- Allowed: fade-up, subtle lift, smooth modal close
- Forbidden: bounce, delay, flashy entrance animations

**Typography:**
- Title: strong, tightly spaced
- Value: dominant, large, semantic glow
- Label: quiet, uppercase, 10.5–11px
- Support: secondary, 12–13px

**Color semantics (never deviate):**
- green = received / positive / Pro plan
- blue  = future / expected / scheduled
- amber = warning / lean / FREE plan / upgrade CTA
- red   = deficit / danger

---

## Claude Execution Rules

1. NEVER implement blindly — read context first
2. ALWAYS validate schema alignment before touching DB
3. ALWAYS respect visual hierarchy — one dominant element per section
4. NEVER introduce UI inconsistency (hover without action, action without hover)
5. PRIORITIZE clarity over features
6. If it looks unfinished → STOP and fix before continuing
7. ALL new forms → react-hook-form + zod, no exceptions
8. NEVER call OpenRouter/AI for free-tier users — check plan first
9. Auth pages: particle canvas background required
10. Phase 4.5 must be complete before any Phase 5 (Stripe) work begins
