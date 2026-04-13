# FlowSave — Claude Context File

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
- Auth: Supabase Magic Link (passwordless) → evolving to Email/Password + Google + Apple OAuth (Phase 4.5)
- Forms: react-hook-form + zod + @hookform/resolvers (ALL new forms must use this — no exceptions)
- Payments: Stripe Billing (freemium → $19/month Pro)
- Email: Resend + React Email
- AI: OpenRouter API (NOT direct Anthropic API — see AI section below)
- Deploy: Vercel (Hobby for dev, Pro for commercial launch)
- Analytics: PostHog (free tier)
- Motion: motion/react (purposeful, subtle only) — migrated from framer-motion package

---

## Project structure

```
/app              → Next.js App Router pages
/app/styles/      → CSS partials (tokens, layout, typography, components, forms, interactive, animations)
/components       → Reusable UI components (shadcn/ui based)
/lib              → Supabase client, Stripe helpers, utilities
/lib/ai           → OpenRouter integration only (openrouter.ts)
/emails           → React Email templates
/types            → TypeScript interfaces and Supabase types
```

CSS architecture: `globals.css` is the orchestrator — it only contains `@import` statements and the
`@theme` block. All rules live in `app/styles/` partials:
- `tokens.css` — all CSS custom properties + layout height variables (`--navbar-h`, `--mobile-nav-h`)
- `layout.css` — app shell, navbar, sidebar, nav links, scrollbar, responsive breakpoints
- `typography.css` — page-title, dashboard-anchor, metric-value, form-label, etc.
- `components.css` — metric-card, entity-card (with `@property` shimmer), status-chip, hero-month-card
- `forms.css` — payment-form, date-picker, CTA buttons (`@layer components`)
- `interactive.css` — card-interactive, action-menu, surface-action-button, row-hover
- `animations.css` — @keyframes fadeUp, fade-up classes, glow utilities, reduced-motion guard

---

## Database schema (Supabase)

Tables:
- users:            id, email, first_name, last_name, freelance_role, primary_currency, created_at, stripe_customer_id, plan (free|pro)
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

Pending migrations (Phase 4.5):
- 005_user_profile.sql — first_name, last_name, freelance_role, primary_currency columns on users

RLS: enabled on all tables. Policy: users can only access their own rows.

---

## Database Integrity Rule (CRITICAL)

Before continuing any implementation that involves new columns, tables, relationships,
foreign keys, or constraints — MUST verify Supabase schema is fully aligned with codebase.

If any mismatch is detected (e.g. "column not found in schema cache") → STOP and audit.

Return:
1. Every new column/table/constraint added in code
2. The migration file responsible for each change
3. The exact SQL required
4. Whether anything else is pending

NEVER assume migrations are already applied. ALWAYS validate before proceeding.

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

## PRO / FREE Differentiation

### Current state
- users.plan: 'free' | 'pro'
- Client freemium gate: max 2 clients on free tier (UpgradeLimitModal exists)
- AI hard gate: plan === 'pro' checked before any OpenRouter call
- PlanGate wrapper component: to be built in Phase 5

### UI behavior by plan

FREE user:
- Amber "FREE" badge visible in app shell top-center area
- Glowing amber "Upgrade to Pro" button with subtle pulse — always visible
- Clients page: prominent amber usage banner (non-dismissible at 2/2; progress bar at 0–1/2)
- Contextual upgrade modal when hitting any gate (3rd client, AI feature, etc.)
- AI insight card replaced with static upsell card

PRO user:
- Quiet green "PRO ✓" badge in same position — no upsell noise
- No upgrade banners anywhere
- All features unlocked

### Color semantics for plan status (never deviate)
- FREE: amber (--amber, --amber-dim)
- PRO: green (--green, --green-dim)

---

## UI/UX philosophy — highest priority

UI/UX quality is the top priority of this product, above speed of delivery.
Every feature must be visually refined before it is considered done.

**The screenshot test**: would this screen stand out as beautiful and polished
if posted standalone? If not → stop and fix before continuing.

Principles:

- Visual hierarchy first: size, weight, and color must guide the eye.
  Never let metadata compete with primary content.
- Breathing room: generous padding. Cramped UIs feel cheap.
- Consistent color semantics — never deviate:
    green  #22d87a  = received / positive / Pro plan
    blue   #7c96ff  = future / expected / scheduled
    amber  #f5a623  = warning / lean / FREE plan / upgrade CTA
    red    #ff5b7f  = negative / danger / deficit
- Atmospheric backgrounds: deep navy → misty blue → near-white (environmental only, not semantic)
- Motion: subtle, fluid, purposeful. todesktop.com reference. Never ornamental or slow.
- Micro-interactions: every interactive element must respond visually.
- Empty states: designed, not forgotten. Encouraging language + clear CTA.
- Mobile: test every component at 375px. Fix before moving on.
- Typography: 14px/500 primary · 13px/400 secondary · 11px/400 metadata
- No raw data in UI: no UUIDs, no field names, no raw timestamps.
- Refinement over features: polished + fewer > rough + many.

### UI Enforcement Rules
- ONE dominant card per section
- No unused vertical space inside cards
- Every interactive element: hover glow + cursor pointer + visual affordance
- Hover → must have action. No action → remove hover.
- All clickable elements: cursor pointer + subtle glow + translateY(-1px)
- Modals: open fast, close smoothly (fade + scale)

---

## Design system

Reference: todesktop.com (dark-to-light atmospheric, refined, fluid, premium)
DESIGN.md is the source of truth for visual implementation when present.

CSS variables (globals.css):
  --bg:            #07071a
  --bg2:           #0d0d28
  --bg3:           #151a3a
  --bg4:           #dfe7ff
  --bg5:           #f7f9ff
  --surface:       rgba(255,255,255,0.04)
  --surface-2:     rgba(255,255,255,0.06)
  --surface-light: rgba(255,255,255,0.72)
  --border:        rgba(255,255,255,0.08)
  --border-strong: rgba(255,255,255,0.14)
  --border-light:  rgba(15,23,42,0.08)
  --accent:        #5b7fff
  --accent2:       #7c96ff
  --accent-dim:    rgba(91,127,255,0.15)
  --text:          #f0f0ff
  --text2:         rgba(240,240,255,0.55)
  --text3:         rgba(240,240,255,0.30)
  --text-dark:     #101426
  --text-dark-2:   rgba(16,20,38,0.68)
  --text-dark-3:   rgba(16,20,38,0.42)
  --green:         #22d87a
  --green-dim:     rgba(34,216,122,0.12)
  --red:           #ff5b7f
  --red-dim:       rgba(255,91,127,0.12)
  --amber:         #f5a623
  --amber-dim:     rgba(245,166,35,0.12)
  --glow-green, --glow-blue, --glow-amber, --glow-red — semantic box-shadow tokens

Typography:
  Font: Geist (variable, 100–900) loaded via next/font/google — CSS var `--font-sans`.
        Fallback: Inter, system-ui, sans-serif.
        Geist Mono loaded as `--font-mono` for code/numbers.
  Page title:       clamp(30px,4.4vw,36px) / weight 630 / letter-spacing -0.055em
  Dashboard anchor: clamp(48px,8vw,68px) / weight 640
  Section label:    11px / weight 400 / letter-spacing 0.08em / UPPERCASE
  Body:             13px / weight 400
  Metric values:    26px / weight 640 / letter-spacing -0.058em
  Hero values:      clamp(33px,3.7vw,40px) / weight 640 / letter-spacing -0.072em
  Small labels:     10.5–11px

Layout:
  Navbar: fixed top, semi-transparent, blur backdrop, height ~56px
  Sidebar: left, 200px wide, border-right 1px solid var(--border)
  Main: flex-1, padding 24px
  Card radius: 12px | Button radius: 8px | Nav links: 8px | Hero card: 16px
  MacOS frame (Phase 4.5): content area in floating window frame, rounded right, drop shadow

Chart style:
  3 series: received (--green) / scheduled (--accent2) / gap (--red)
  Toggle: bars / lines
  Average line: dashed --amber, 1px
  Tooltip: premium dark surface, no shadow

DO NOT use:
  - Harsh pure white blocks on dark sections
  - Light backgrounds for data state semantics
  - Inter, Roboto, or system-ui fonts
  - Heavy shadows or material elevation
  - Purple gradient aesthetics
  - UUIDs or raw database values in UI
  - Motion that delays usability

---

## Feature scope (phases)

### Phase 1 — Foundation ✅ COMPLETE
### Phase 2 — Dashboard ✅ COMPLETE
### Phase 2.1 — Dashboard Refinement ✅ COMPLETE
### Phase 2.2 — Premium UI Evolution ✅ COMPLETE
### Phase 2.3 — Brand + Controls ✅ COMPLETE
### Phase 3 — Intelligence ✅ COMPLETE
### Phase 3.2 — Visual System Overhaul ✅ COMPLETE
### Phase 3.3 — Schedule Layer + Upcoming ✅ COMPLETE

### Phase 3.4 — Forms Refactor ✅ COMPLETE
  [x] Installed: react-hook-form, zod, @hookform/resolvers
  [x] Refactored: ProjectForm.tsx — full zod schema validation
  [x] Updated: EditProjectModal, AddProjectModal, CreateProjectFromPaymentModal
  [x] TypeScript strict checks pass

### Phase 4 — Dashboard 2.0 ✅ COMPLETE
  [x] HeroMonthCard (value + % badge + tax reserve integrated)
  [x] SalaryGapCard (deficit/surplus glow states)
  [x] PendingCard (USD/BRL amounts + "View schedule →" CTA)
  [x] Dashboard 2×2 grid (Hero | Gap / Pending | Recent)
  [x] TaxReserveCard removed as standalone
  [x] RecentPayments: compact
  [x] DashboardMotionShell: spacing reduced
  [x] Container queries on dashboard grid (@container / @sm:grid-cols-2)
  [x] SalaryProgress: reviewed (deferred to Phase 4.5 cross-page pass)
  [x] Mobile validation: layout responsive via CSS variables

### Phase 4.1 — CSS Architecture & Motion Migration ✅ COMPLETE
  [x] Geist font via next/font/google (--font-sans / --font-mono, eliminates FOUT)
  [x] Skip-to-content link (#main-content) for keyboard accessibility
  [x] Magic number pt-[108px] removed — layout padding via CSS vars (--navbar-h, --mobile-nav-h)
  [x] Sidebar collapse guard: [data-collapsed='true'] styles scoped to @media (min-width: 768px)
  [x] globals.css split: 2523 lines → 62 lines (orchestrator only) + 7 partials in app/styles/
  [x] payment-submit / primary-cta-button moved to @layer components (no more !important fights)
  [x] @property --shimmer-x shimmer animation on .entity-card hover (100% CSS, no JS)
  [x] framer-motion → motion/react across all 8 components (API identical, package updated)

### Phase 4.5 — UI/UX Global Review 🆕 NEXT
  Goal: every page passes the screenshot test before Phase 5.

  4.5.1 — App Shell (MacOS Frame Style)
  [ ] Content area in floating window frame (rounded right, border + drop shadow)
  [ ] Frame bleeds from left nav — contained "app window in browser" feel
  [ ] Subtle breadcrumb page title inside frame
  [ ] Sign Out: bottom of left nav
  [ ] Upgrade CTA: top-center of app shell
      FREE → amber glowing "Upgrade to Pro" + pulse
      PRO  → quiet green "PRO ✓" badge

  4.5.2 — Clients Page Overhaul
  [ ] Card grid matching Projects/Payments visual language
  [ ] Add Client: top-right only
  [ ] ClientCard: name, total received, last payment date, active projects count
  [ ] FREE usage banner (amber, non-dismissible at 2/2; progress variant at 0–1/2)
  [ ] Client card click → detail/edit modal

  4.5.3 — Auth Pages Redesign
  [ ] Canvas particle background (tsparticles lite or vanilla canvas)
      - Slow drift, proximity connections, mouse glow halo, idle pulse
  [ ] Centered glass card layout
  [ ] Sign Up fields: first name, last name, email, password, confirm password,
      freelance role (select), monthly income goal (optional), primary currency
  [ ] Login fields: email + password
  [ ] Animated tab toggle Login ↔ Sign Up
  [ ] Google OAuth + Apple OAuth (Supabase providers must be enabled)
  [ ] Migration 005: first_name, last_name, freelance_role, primary_currency on users

  4.5.4 — Cross-Page Consistency
  [ ] All surfaces: consistent CSS token usage
  [ ] All hover states: glow + lift + pointer
  [ ] All pages: designed empty states
  [ ] Payments, Upcoming, Settings: visual parity check

### Phase 5 — Monetization [ ] NOT STARTED
  [ ] Stripe checkout + webhook
  [ ] PlanGate wrapper + upsell cards
  [ ] Contextual upgrade modal (triggered at gates)
  [ ] Customer portal in settings
  [ ] Upgrade accessible from inside app

### Phase 6 — AI and Polish [ ] NOT STARTED
  [ ] openrouter.ts + AiInsightCard (Pro) / upsell fallback (free)
  [ ] Insights personalized by freelance_role
  [ ] Landing page + pricing
  [ ] Final onboarding polish (personalized by role)

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
- All forms → react-hook-form + zod (required, no exceptions)
- Follow DESIGN.md when present
- Prefer shadcn/ui primitives as control base
- No hardcoded secrets — process.env.* always
- One component per file, named exports
- No over-engineering
- Clean up temp files after every task
- Simple over clever, always
- Money formatting: BRL → 1.000,00 / USD → 1,000.00

---

## Not building yet

Bank/Plaid integration · Native mobile · Multi-currency beyond USD/BRL ·
Multi-user/team · Retirement/investment · Accounting export

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
4. Design system applied: dark theme, CSS vars, correct typography
5. Color semantics respected (green/blue/amber/red)
6. Motion is fluid, subtle, purposeful
7. No raw data visible in UI
8. npx tsc --noEmit passes with zero errors
9. Screenshot test passes: screen looks polished standalone
