# FlowSave — Personal Finance Tracker for Freelancers

## Core Identity

FlowSave is NOT a tracker.

FlowSave is a **cashflow operating system for freelancers**.

- Projects = pipeline (intent, uncertain)
- Payment Schedule = committed future money
- Payments = realized money

This distinction is NON-NEGOTIABLE.

---

## Product context

FlowSave is a web app that helps freelancers and self-employed professionals
manage irregular income. Unlike YNAB or Mint (built for fixed salaries),
FlowSave is designed around the "feast or famine" reality of freelance work.

Core value props:
- No bank integration required (privacy-first, manual entry)
- "Fixed salary" mode: user sets target monthly pay, app tracks the gap
- Automatic tax reserve: sets aside % per payment received
- Cash flow forecast: projects next 3 months based on confirmed projects + history
- Lean month alert: notifies when projected income falls below survival budget

Target user: freelancers, consultants, gig workers earning $2k–$10k/month
with 2–10 clients and irregular payment dates.

---

## Tech stack

- Frontend: Next.js 15 + Tailwind CSS 4.2 + shadcn/ui
- Backend/DB: Supabase (PostgreSQL + Auth + Storage)
- Auth: Supabase Magic Link (passwordless)
- Payments: Stripe Billing (freemium → $19/month Pro)
- Email: Resend + React Email
- AI: OpenRouter API (NOT direct Anthropic API — see AI section below)
- Deploy: Vercel (Hobby for dev, Pro for commercial launch)
- Analytics: PostHog (free tier)
- Motion: Framer Motion (purposeful, subtle only)

---

## Project structure

```
/app              → Next.js App Router pages
/components       → Reusable UI components (shadcn/ui based)
/lib              → Supabase client, Stripe helpers, utilities
/lib/ai           → OpenRouter integration only (openrouter.ts)
/emails           → React Email templates
/types            → TypeScript interfaces and Supabase types
```

---

## Database schema (Supabase)

Tables:
- users:            id, email, created_at, stripe_customer_id, plan (free|pro)
- clients:          id, user_id, name, currency, created_at
- payments:         id, user_id, client_id, amount, currency, received_at, notes, project_id
- projects:         id, user_id, client_id, name, expected_amount (nullable), expected_date (nullable), status, sub_status, linked_payment_id
- settings:         user_id, target_monthly_salary, tax_reserve_pct, survival_budget,
                    onboarding_completed, lean_alert_sent_at,
                    ai_insight_cache, ai_insight_cached_at, updated_at
- payment_schedule: id, user_id, project_id, amount, currency, expected_date, status, payment_id, label, created_at

Migrations applied:
- 001_init.sql — base schema, RLS, indexes
- 002_project_payment_links.sql — project_id on payments, linked_payment_id on projects
- 003_project_sub_status.sql — sub_status column, nullable expected_amount/expected_date
- 004_payment_schedule.sql — payment_schedule table

RLS: enabled on all tables. Policy: users can only access their own rows.

---

## Database Integrity Rule (CRITICAL)

Before continuing any implementation that involves:
- new columns
- new tables
- updated relationships
- new foreign keys
- new constraints

You MUST verify that the Supabase database schema is fully aligned with the codebase.

If there is any indication of mismatch (e.g. errors like "column not found in schema cache"), STOP implementation and run a schema audit.

### Required Action

Ask:

"We hit a real Supabase schema mismatch.
The app expects database changes that may not yet exist in the live database.

List ALL schema changes introduced in this phase that require a migration to be applied."

Return:

1. Every new column/table/constraint added in code
2. The migration file responsible for each change
3. The exact SQL required in the database
4. Whether anything else is still pending beyond the detected error

### Rule

NEVER assume migrations are already applied.
ALWAYS validate before proceeding.

---

## AI / LLM — OpenRouter

Provider: OpenRouter (openrouter.ai)
Base URL: https://openrouter.ai/api/v1
Env var: OPENROUTER_API_KEY
API is OpenAI-compatible — same fetch/SDK pattern, different baseURL.

Model strategy:
  Primary:  google/gemini-2.5-flash-lite   (env: OPENROUTER_PRIMARY_MODEL)
  Fallback: deepseek/deepseek-chat-v3-0324 (env: OPENROUTER_FALLBACK_MODEL)
  Switching model = change 1 env var. Zero code change.

Gate — STRICT: check plan === 'pro' before any API call.
Free users get null — no network request is made.
Free users see a static upsell card instead of AI insights.

AI features (Pro only):
  1. Monthly summary: 2-sentence insight vs average
  2. Lean month alert: warning + 1 concrete action
  3. Pattern detection: 1-sentence seasonal trend

max_tokens: 120 per call. Insights are intentionally short.
Required headers: "HTTP-Referer": "https://getflowsave.com", "X-Title": "FlowSave"
All calls go through /lib/ai/openrouter.ts — never inline elsewhere.

---

## UI/UX philosophy — highest priority

UI/UX quality is the top priority of this product, above speed of delivery.
Every feature must be visually refined before it is considered done.

Principles to follow on every component built:

- Visual hierarchy first: the most important information must be immediately
  obvious. Size, weight, and color must guide the eye. Never let metadata
  compete with primary content.

- Breathing room: generous padding and spacing. Cramped UIs feel cheap.
  When in doubt, add more space.

- Consistent color semantics — never deviate for data meaning:
    green  #22d87a  = received / positive / money already in
    blue   #7c96ff  = future / expected / money coming (--accent2)
    amber  #f5a623  = warning / lean months / needs attention
    red    #ff5b7f  = negative / danger / deficit

- Atmospheric backgrounds may evolve as the user scrolls. The app should start
  in deep navy and can gradually brighten into misty blue, silver-blue, and
  near-white sections where appropriate. This brightening is environmental only,
  not semantic. Never use light backgrounds to represent data states.

- Motion is part of the product language. Use subtle, fluid motion inspired by
  todesktop.com: layered parallax feeling, fade-up reveals, gentle section
  transitions, and responsive hover states. Motion must clarify structure,
  reward interaction, and make the interface feel alive. It must never feel
  ornamental, slow, or distracting.

- Micro-interactions matter: hover states, focus rings, transitions.
  Every interactive element must have a visible response. Nothing should
  feel static or dead.

- Empty states are designed, not forgotten: every page and component must
  have a thoughtful empty state with encouraging language and a clear CTA.

- Mobile is not an afterthought: test every component at 375px minimum.
  If it breaks or feels cramped, fix it before moving on.

- Typography carries meaning — use intentionally:
    14px / weight 500 / --text   = primary content (names, values)
    13px / weight 400 / --text2  = secondary content (dates, notes)
    11px / weight 400 / --text3  = metadata (labels, section headers)
  Never use the same style for different levels of hierarchy.

- No raw data in the UI: UUIDs, raw timestamps, and database field names
  must never appear on screen. Always format, label, and humanize.

- Refinement over features: a polished version of fewer features is always
  better than a rough version of many. If a component looks unfinished,
  stop and fix it before building the next one.

### UI Enforcement Rules

- ONE dominant card per section (Hero)
- No competing cards
- No unused vertical space inside cards
- Every interactive element MUST:
  - have hover feedback
  - have cursor pointer
  - have visual affordance
- If a card has hover → it MUST have action
- If no action → remove hover

### Interaction Rules

- All clickable elements:
  - cursor: pointer
  - subtle glow on hover
  - slight lift (translateY -1px)
- Modals: must open fast, must close smoothly (fade + scale)

---

## Design system

Reference: todesktop.com style (dark-to-light atmospheric gradient, refined, fluid, premium)
Detailed execution rules live in DESIGN.md. If DESIGN.md exists, it is the
source of truth for visual implementation details.

CSS variables (defined in globals.css):
  --bg:            #07071a   page background start
  --bg2:           #0d0d28   elevated surface
  --bg3:           #151a3a   scroll-transition navy
  --bg4:           #dfe7ff   bright atmospheric transition
  --bg5:           #f7f9ff   near-white destination sections
  --surface:       rgba(255,255,255,0.04)   dark card fill
  --surface-2:     rgba(255,255,255,0.06)   elevated dark card fill
  --surface-light: rgba(255,255,255,0.72)   bright section glass fill
  --border:        rgba(255,255,255,0.08)   default border
  --border-strong: rgba(255,255,255,0.14)   active/hover border
  --border-light:  rgba(15,23,42,0.08)      border on bright sections
  --accent:        #5b7fff   primary CTA blue
  --accent2:       #7c96ff   accent text / future payments
  --accent-dim:    rgba(91,127,255,0.15)    accent backgrounds
  --text:          #f0f0ff   primary text on dark
  --text2:         rgba(240,240,255,0.55)   secondary text on dark
  --text3:         rgba(240,240,255,0.30)   labels/hints on dark
  --text-dark:     #101426   primary text on bright sections
  --text-dark-2:   rgba(16,20,38,0.68)      secondary text on bright sections
  --text-dark-3:   rgba(16,20,38,0.42)      metadata on bright sections
  --green:         #22d87a   income, positive, received
  --green-dim:     rgba(34,216,122,0.12)
  --red:           #ff5b7f   danger, negative, deficit
  --red-dim:       rgba(255,91,127,0.12)
  --amber:         #f5a623   warning, lean months
  --amber-dim:     rgba(245,166,35,0.12)
  --glow-green, --glow-blue, --glow-amber, --glow-red — semantic box-shadow glow tokens

Typography:
  Font stack: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Arial, sans-serif
  Page title:    clamp(30px,4.4vw,36px) / weight 630 / letter-spacing -0.055em
  Dashboard anchor: clamp(48px,8vw,68px) / weight 640
  Section label: 11px / weight 400 / letter-spacing 0.08em / UPPERCASE
  Body:          13px / weight 400
  Metric values: 26px / weight 640 / letter-spacing -0.058em
  Hero values:   clamp(33px,3.7vw,40px) / weight 640 / letter-spacing -0.072em
  Small labels:  10.5–11px

Layout:
  Navbar: fixed top, semi-transparent, blur backdrop, height ~56px
  Sidebar: left, 200px wide, border-right 1px solid var(--border)
  Main: flex-1, padding 24px
  Dashboard grid: 2×2 sm:grid-cols-2 for metric cards
  Mid section: CashFlowChart (full width)
  Lower: SalaryProgress
  Card radius: 12px | Button radius: 8px | Nav links: 8px
  Hero card: 16px radius

Chart style:
  3 series: received (--green), scheduled (--accent2), gap (--red)
  Toggle: bars mode / lines mode
  Average line: dashed --amber, 1px
  Tooltip: premium dark surface, no shadow

DO NOT use:
  - Harsh pure white blocks floating abruptly on dark sections
  - Light backgrounds for semantic meaning of data states
  - Inter, Roboto, or system-ui fonts
  - Heavy shadows or material-style elevation
  - Purple gradient aesthetics
  - UUIDs or raw database values anywhere visible
  - Motion that delays usability or reduces clarity

---

## Feature scope (phases)

### Phase 1 — Foundation ✅ COMPLETE
  [x] Scaffold: Next.js 15, TypeScript strict, Tailwind, shadcn/ui
  [x] Supabase: connect, migrations, RLS on all tables
  [x] Auth: magic link login/signup + callback + middleware
  [x] Settings: target salary, tax %, survival budget
  [x] Clients: form + list + 2-client freemium gate + UpgradeLimitModal
  [x] Payments: form + list grouped by month, color-coded, currency symbols

### Phase 2 — Dashboard ✅ COMPLETE
  [x] App shell: AppShell, Sidebar, Navbar fully refined
  [x] Metric cards × 4 (month total, tax reserve, salary gap, pending)
  [x] Cash flow bar chart (Recharts, 6 months, dashed avg line)
  [x] Recent payments widget (last 10, compact)
  [x] Tax reserve card (per-payment breakdown + monthly total)
  [x] Salary target progress bar
  [x] Empty state amber banner with CTAs
  [x] Onboarding wizard (3 steps + skip logic)

### Phase 2.1 — Dashboard Refinement ✅ COMPLETE
  [x] Metric cards hierarchy polish
  [x] Dashboard spacing and layout refinement
  [x] Chart proportion and clarity improvements
  [x] Multi-currency display clarity
  [x] Pending card empty state redesign
  [x] Salary progress UX improvement
  [x] Micro-interactions across dashboard
  [x] Atmospheric background system (dark → light)

### Phase 2.2 — Premium UI Evolution ✅ COMPLETE
  [x] Atmospheric gradient system (true dark → light progression)
  [x] Typography refinement (SF Pro stack, reduce "AI feel")
  [x] Dashboard header redesign (glass kicker, gradient title)
  [x] Sidebar premium interaction (glow + active state)
  [x] Shell icon standardization (lucide-react)
  [x] Shell atmosphere cleanup + hover glow refinement
  [x] Payments controls + calendar refinement
  [x] Visual hierarchy consistency across dashboard
  [x] Motion system (fade-up reveals, stagger, card-interactive)

### Phase 2.3 — Brand + Controls ✅ COMPLETE
  [x] FlowSave wordmark in shell
  [x] App icon / favicon integration
  [x] Payment controls premium dark system
  [x] shadcn/ui as preferred primitive base
  [x] Framer Motion for shell-state and section reveals

### Phase 3 — Intelligence ✅ COMPLETE
  [x] Projects: form + list + status workflow (pending/confirmed/received/cancelled)
  [x] Project sub-states: prospecting / negotiating
  [x] forecast.ts algorithm (baseline avg + confirmed schedule → ForecastMonth[])
  [x] Lean month detection

### Phase 3.2 — Visual System Overhaul ✅ COMPLETE
  [x] Typography scale upgrade (.metric-value 26px/640, .form-label, .card-label)
  [x] Panel surface depth (inner highlight + micro shadow)
  [x] CTA active states (press-down feel)
  [x] Status glow system (dotGlow + badgeGlow for all project statuses)
  [x] Row hover upgrade (horizontal gradient + left accent bar)
  [x] Glow token CSS variables (--glow-green/blue/amber/red)
  [x] MetricCard semantic glow via valueGlowClass()

### Phase 3.3 — Schedule Layer + Upcoming ✅ COMPLETE
  [x] payment_schedule table (migration 004)
  [x] PaymentPlanModal: one-time / weekly / monthly installments
  [x] lib/schedule.ts — generateScheduleEntries() pure function
  [x] Upcoming page: schedule entries grouped by month
  [x] CashFlowChart: received (green) / scheduled (blue) / gap (red) stacked
  [x] Chart toggle: bars mode / lines mode
  [x] MarkScheduleReceivedModal
  [x] MoveToNegotiatingModal
  [x] Dashboard: pending derived from schedule entries + unscheduled projects

### Phase 4 — Dashboard 2.0 🔄 IN PROGRESS
  [x] HeroMonthCard: split card (value + % badge + tax reserve integrated)
  [x] SalaryGapCard: centered, colored glow, deficit/surplus states
  [x] PendingCard: USD/BRL amounts, "View schedule →" CTA, blue hover glow
  [x] Dashboard grid: 2×2 sm:grid-cols-2 (Hero | Gap / Pending | Recent)
  [x] TaxReserveCard removed as standalone
  [x] RecentPayments: verbose header stripped, compact
  [x] DashboardMotionShell: spacing reduced (space-y-6, pb-12)
  [ ] SalaryProgress: consider redesign or removal
  [ ] Mobile validation at 375px

### Phase 5 — Monetization [ ] NOT STARTED
  [ ] Stripe checkout + webhook handler
  [ ] PlanGate wrapper + upsell cards throughout
  [ ] Customer portal link in settings

### Phase 6 — AI and Polish [ ] NOT STARTED
  [ ] openrouter.ts + AiInsightCard (Pro) / upsell fallback (free)
  [ ] Landing page with signup CTA
  [ ] Final onboarding polish

---

## Monetization

  Free:   2 clients, basic dashboard, no AI, no forecast
  Pro:    $19/month — unlimited clients, forecast, alerts, AI insights
  Annual: $15/month ($180/year)
  Trial:  14 days, card required at signup

---

## Code rules

- TypeScript strict always
- Server components default; 'use client' only when strictly required
- All Supabase queries → /lib/supabase/queries/ helpers
- All OpenRouter calls → /lib/ai/openrouter.ts only
- All visual implementation details must follow DESIGN.md when present
- Prefer `shadcn/ui` primitives/components as the control base when they improve consistency
- No hardcoded secrets — process.env.* always
- One component per file, named exports
- No over-engineering — no abstractions not yet needed
- Clean up temp files after every task
- Simple over clever, always
- All money formatted correctly: BRL → 1.000,00 / USD → 1,000.00

---

## Not building yet

- Bank/Plaid integration
- Native mobile app
- Multi-currency beyond USD and BRL
- Multi-user / team accounts
- Retirement or investment tracking
- Accounting software export

---

## Environment variables

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

## Commands

```
dev:       npm run dev
build:     npm run build
db types:  npx supabase gen types typescript --local > types/supabase.ts
deploy:    git push origin main
```

---

## Done criteria (per feature)

1. Works end-to-end in browser
2. Empty, loading, and error states handled and visually designed
3. Responsive at 375px minimum
4. Design system applied: dark theme + atmospheric transitions, CSS vars, correct typography
5. Color semantics respected: green/blue/amber/red used only for data meaning
6. Motion is fluid, subtle, and purposeful
7. No raw data (UUIDs, field names) visible anywhere in the UI
8. npx tsc --noEmit passes with zero errors
