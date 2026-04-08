# FlowSave — Master Roadmap

## Product Vision

FlowSave is a **cashflow operating system for freelancers**.

NOT a tracker.

Core pillars: clarity · control · predictability

---

## Core Model (NON-NEGOTIABLE)

```
Projects       →  pipeline (uncertain money, intent only)
Payment Schedule  →  committed future money
Payments       →  realized money (already received)
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
| Motion | Framer Motion |
| Icons | lucide-react |
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

Migrations applied: 001 (init) → 002 (project-payment links) → 003 (sub_status) → 004 (payment_schedule)

---

## Financial Rules

- Projects ≠ money
- Schedule = future money (committed, installment-aware)
- Payments = real money (received, taxed, banked)

Dashboard must reflect real financial state at all times.

---

## Phase Roadmap

### Phase 1 — Foundation ✅ COMPLETE
Auth (magic link), clients, payments, settings, onboarding, Supabase RLS.

### Phase 2 — Dashboard ✅ COMPLETE
App shell (sidebar, navbar), metric cards ×4, Recharts cash flow chart, recent payments,
tax reserve card, salary progress, empty states, onboarding wizard.

### Phase 2.1 — Dashboard Refinement ✅ COMPLETE
Metric card hierarchy, chart clarity, multi-currency labels, pending empty state,
salary progress state labels, micro-interactions (card-interactive, row-hover),
atmospheric background foundation.

### Phase 2.2 — Premium UI Evolution ✅ COMPLETE
Atmospheric dark→light gradient system, SF Pro typography stack, glass kicker header,
sidebar glow + active states, lucide-react icon standardization, motion system
(fade-up, stagger, card-interactive hover 200ms), payment controls refinement.

### Phase 2.3 — Brand + Controls ✅ COMPLETE
FlowSave wordmark + icon in shell, shadcn/ui as preferred primitive base,
Framer Motion for shell-state and hero reveal, payment date picker premium finish.

### Phase 3 — Intelligence ✅ COMPLETE
Projects full CRUD (form, list, modal flow), status workflow
(pending → confirmed → received → cancelled), sub-states (prospecting / negotiating),
forecast.ts algorithm (baseline avg + schedule → ForecastMonth[]).

### Phase 3.2 — Visual System Overhaul ✅ COMPLETE
Typography scale (metric-value 26px/640, form-label, card-label), panel-surface depth,
CTA active press states, status glow system (all four project statuses),
row-hover left accent bar, semantic glow CSS tokens (--glow-green/blue/amber/red),
MetricCard valueGlowClass() helper.

### Phase 3.3 — Schedule Layer + Upcoming ✅ COMPLETE
`payment_schedule` table (migration 004), PaymentPlanModal (one-time / weekly / monthly
installments), lib/schedule.ts generateScheduleEntries(), Upcoming page (entries grouped
by month), CashFlowChart received/scheduled/gap stacked bars + chart toggle (bars/lines),
MarkScheduleReceivedModal, MoveToNegotiatingModal, dashboard pending card derived from
schedule entries + unscheduled projects.

### Phase 4 — Dashboard 2.0 🔄 IN PROGRESS

**Goal:** Eliminate dead space, clarify financial hierarchy, remove competing cards.

**Completed in this session:**
- [x] HeroMonthCard — split card: top (value + % vs last month + CTA) / bottom (tax reserve integrated)
- [x] SalaryGapCard — centered, deficit/surplus glow states, red/green semantic color
- [x] PendingCard — USD amount / BRL amount / summary line / "View schedule →" CTA + blue hover glow
- [x] Dashboard 2×2 grid: `[Hero | Gap] / [Pending | Recent]`
- [x] TaxReserveCard removed as standalone card
- [x] RecentPayments: verbose header stripped, compact label only
- [x] DashboardMotionShell: spacing reduced to space-y-6 / pb-12

**Remaining:**
- [ ] SalaryProgress: review placement or redesign
- [ ] Mobile validation at 375px

### Phase 5 — Monetization [ ] NOT STARTED
Stripe checkout + webhook, PlanGate wrapper, upsell cards, customer portal.

### Phase 6 — AI and Polish [ ] NOT STARTED
OpenRouter AiInsightCard (Pro only), landing page, final onboarding polish.

---

## Current Priority

```
🔄 Finish Phase 4 — Dashboard 2.0 (mobile validation, SalaryProgress review)
⏭  Phase 5 — Monetization (Stripe)
⏭  Phase 6 — AI + Polish
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
- Value: dominant, large, colored with semantic glow
- Label: quiet, uppercase, 10.5–11px
- Support: secondary, 12–13px

**Color semantics (never deviate):**
- green = received / positive
- blue = future / expected / scheduled
- amber = warning / lean
- red = deficit / danger

---

## Claude Execution Rules

1. NEVER implement blindly — read context first
2. ALWAYS validate schema alignment before touching DB
3. ALWAYS respect visual hierarchy — one dominant element per section
4. NEVER introduce UI inconsistency (hover without action, action without hover)
5. PRIORITIZE clarity over features
6. If it looks unfinished → STOP and fix before continuing
