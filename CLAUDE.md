# FlowSave — Personal Finance Tracker for Freelancers

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

## Tech stack
- Frontend: Next.js 15 + Tailwind CSS 4.2 + shadcn/ui
- Backend/DB: Supabase (PostgreSQL + Auth + Storage)
- Auth: Supabase Magic Link (passwordless)
- Payments: Stripe Billing (freemium → $19/month Pro)
- Email: Resend + React Email
- AI: OpenRouter API (NOT direct Anthropic API — see AI section below)
- Deploy: Vercel (Hobby for dev, Pro for commercial launch)
- Analytics: PostHog (free tier)

## Project structure
/app              → Next.js App Router pages
/components       → Reusable UI components (shadcn/ui based)
/lib              → Supabase client, Stripe helpers, utilities
/lib/ai           → OpenRouter integration only (openrouter.ts)
/emails           → React Email templates
/types            → TypeScript interfaces and Supabase types

## Database schema (Supabase)
Tables:
- users:    id, email, created_at, stripe_customer_id, plan (free|pro)
- clients:  id, user_id, name, currency, created_at
- payments: id, user_id, client_id, amount, currency, received_at, notes
- projects: id, user_id, client_id, name, expected_amount, expected_date, status
- settings: user_id, target_monthly_salary, tax_reserve_pct, survival_budget,
            onboarding_completed, lean_alert_sent_at,
            ai_insight_cache, ai_insight_cached_at, updated_at

RLS: enabled on all tables. Policy: users can only access their own rows.

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

## UI/UX philosophy — highest priority

UI/UX quality is the top priority of this product, above speed of delivery.
Every feature must be visually refined before it is considered done.

Principles to follow on every component built:

- Visual hierarchy first: the most important information must be immediately
  obvious. Size, weight, and color must guide the eye. Never let metadata
  compete with primary content.

- Breathing room: generous padding and spacing. Cramped UIs feel cheap.
  When in doubt, add more space.

- Consistent color semantics — never deviate:
    green  #22d87a  = received / positive / money already in
    blue   #7c96ff  = future / expected / money coming (--accent2)
    amber  #f5a623  = warning / lean months / needs attention
    red    #ff5b7f  = negative / danger / deficit

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

## Design system
Reference: todesktop.com style (dark navy, refined, professional)

CSS variables (defined in globals.css):
  --bg:            #07071a   page background
  --bg2:           #0d0d28   elevated surface
  --surface:       rgba(255,255,255,0.04)   card fill
  --border:        rgba(255,255,255,0.08)   default border
  --border-strong: rgba(255,255,255,0.14)   active/hover border
  --accent:        #5b7fff   primary CTA blue
  --accent2:       #7c96ff   accent text / future payments
  --accent-dim:    rgba(91,127,255,0.15)    accent backgrounds
  --text:          #f0f0ff   primary text
  --text2:         rgba(240,240,255,0.55)   secondary text
  --text3:         rgba(240,240,255,0.30)   labels/hints
  --green:         #22d87a   income, positive, received
  --green-dim:     rgba(34,216,122,0.12)
  --red:           #ff5b7f   danger, negative, deficit
  --red-dim:       rgba(255,91,127,0.12)
  --amber:         #f5a623   warning, lean months
  --amber-dim:     rgba(245,166,35,0.12)

Typography:
  Font stack: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif
  Page title:    20px / weight 600 / letter-spacing -0.3px / color --text
  Section label: 11px / weight 400 / letter-spacing 0.08em / --text3 / UPPERCASE
  Body:          13px / weight 400 / color --text2
  Metric values: 22px / weight 600 / letter-spacing -0.5px
  Small labels:  11px / color --text3

Layout:
  Navbar: fixed top, semi-transparent, blur backdrop, height ~56px
  Sidebar: left, 200px wide, border-right 1px solid var(--border)
  Main: flex-1, padding 24px
  Metric row: 4-column grid (2x2 on mobile)
  Mid section: 2-column (chart wider + payments list)
  Bottom: 2-column (reserve card + forecast)
  Card radius: 12px | Button radius: 8px | Nav links: 8px

Chart style:
  Historical bars: rgba(91,127,255,0.15) fill, rgba(91,127,255,0.25) border
  Current month:  solid --accent
  Forecast bars:  --accent if healthy, --amber if lean
  Average line:   dashed --amber, 1px

DO NOT use:
  - Light or white backgrounds inside the app (auth page is the exception)
  - Inter, Roboto, or system-ui fonts
  - Box-shadows (use borders instead)
  - Purple gradient aesthetics
  - UUIDs or raw database values anywhere visible

## Feature scope (phases — no time estimate, one phase at a time)

### Phase 1 — Foundation (COMPLETE)
  [x] Scaffold: Next.js 15, TypeScript strict, Tailwind, shadcn/ui
  [x] Supabase: connect, migrations, RLS on all tables
  [x] Auth: magic link login/signup + callback + middleware
  [x] Settings: target salary, tax %, survival budget
  [x] Clients: form + list + 2-client freemium gate + UpgradeLimitModal
  [x] Payments: form + list grouped by month, color-coded, currency symbols

### Phase 2 — Dashboard
  [ ] App shell: AppShell, Sidebar, Navbar fully refined
  [ ] Metric cards × 4 (month total, tax reserve, salary gap, pending)
  [ ] Cash flow bar chart (Recharts, 6 months, dashed avg line)
  [ ] Recent payments widget (last 10, compact, no month headers)
  [ ] Tax reserve card (per-payment breakdown + monthly total)
  [ ] Salary target progress bar
  [ ] Empty state amber banner with CTAs
  [ ] Onboarding wizard (3 steps + skip logic)

### Phase 3 — Intelligence
  [ ] Projects: form + list (status: pending/confirmed/received/cancelled)
  [ ] forecast.ts algorithm (SPEC.md definition)
  [ ] ForecastPanel on dashboard
  [ ] Lean month detection + LeanMonthAlert email (Resend)

### Phase 4 — Monetization
  [ ] Stripe checkout + webhook handler
  [ ] PlanGate wrapper + upsell cards throughout
  [ ] Customer portal link in settings

### Phase 5 — AI and polish
  [ ] openrouter.ts + AiInsightCard (Pro) / upsell fallback (free)
  [ ] Landing page with signup CTA
  [ ] Final onboarding polish

## Monetization
  Free:   2 clients, basic dashboard, no AI, no forecast
  Pro:    $19/month — unlimited clients, forecast, alerts, AI insights
  Annual: $15/month ($180/year)
  Trial:  14 days, card required at signup

## Code rules
- TypeScript strict always
- Server components default; 'use client' only when strictly required
- All Supabase queries → /lib/supabase/queries/ helpers
- All OpenRouter calls → /lib/ai/openrouter.ts only
- No hardcoded secrets — process.env.* always
- One component per file, named exports
- No over-engineering — no abstractions not yet needed
- Clean up temp files after every task
- Simple over clever, always

## Not building yet
- Bank/Plaid integration
- Native mobile app
- Multi-currency beyond USD and BRL
- Multi-user / team accounts
- Retirement or investment tracking
- Accounting software export

## Environment variables
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

## Commands
dev:       npm run dev
build:     npm run build
db types:  npx supabase gen types typescript --local > types/supabase.ts
deploy:    git push origin main

## Done criteria (per feature)
1. Works end-to-end in browser
2. Empty, loading, and error states handled and visually designed
3. Responsive at 375px minimum
4. Design system applied: dark theme, CSS vars, correct typography
5. Color semantics respected: green/blue/amber/red used correctly
6. No raw data (UUIDs, field names) visible anywhere in the UI
7. npx tsc --noEmit passes with zero errors
