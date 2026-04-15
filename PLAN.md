# FlowSave — Master Roadmap

## Product Vision

FlowSave is a cashflow operating system for freelancers.

Core model:

```text
Projects          → pipeline (uncertain money, intent only)
Payment Schedule  → committed future money
Payments          → realized money
```

Rules:
- `expected_amount` is advisory only.
- If a payment schedule exists, it is the committed source of truth.
- Never mix pipeline money with committed or received money on the same financial surface.

## Current State

Implemented and working now:
- Auth with email/password and OAuth entry points
- Clients, payments, projects, schedule, upcoming page, settings, onboarding
- Dashboard 2.0 layout and cashflow visual hierarchy
- Floating app frame, collapsible sidebar, bottom-pinned sign out
- Clients card grid with free-tier usage banner and upgrade gating
- Auth redesign with particle background, tabbed sign in/sign up, and profile fields
- Migration `005_user_profile_fields.sql` exists in repo and should be treated as current schema truth

Needs refinement before monetization:
- Cross-page consistency pass across `Payments`, `Upcoming`, `Settings`, and `Upgrade`
- Plan status shell polish and upgrade surface consistency
- Repo health and doc truth must stay aligned with the shipped UI

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript strict |
| Styling | Tailwind CSS 4.2 + shadcn/ui |
| Database | Supabase (PostgreSQL + Auth) |
| Charts | Recharts |
| Motion | motion/react |
| Forms | react-hook-form + zod + @hookform/resolvers |
| Payments | Stripe Billing |
| Email | Resend + React Email |
| AI | OpenRouter API |
| Deploy | Vercel |

## Database Rules

Before any schema work:
1. Validate schema vs code.
2. List every missing migration.
3. Provide exact SQL if needed.
4. Never assume migrations are already applied.

Migrations present:
- `001_init.sql`
- `002_project_payment_links.sql`
- `003_project_sub_status.sql`
- `004_payment_schedule.sql`
- `005_user_profile_fields.sql`

## Roadmap

### Phase 4.5 — UI/UX Global Review [IN PROGRESS]

Goal: every page passes the screenshot test before Stripe goes in.

App shell:
- [x] Floating frame treatment around app content
- [x] Sign out pinned to bottom of left nav
- [x] FREE / PRO status visible in shell
- [x] Minimal internal frame title bar
- [ ] Final responsive QA for shell at desktop and mobile widths

Clients:
- [x] Card grid layout
- [x] Add Client top-right action
- [x] Client stats on each card
- [x] FREE usage banner and upgrade routing
- [x] Card click opens edit/detail modal

Auth:
- [x] Particle background and glass card
- [x] Email/password login
- [x] Expanded sign-up fields
- [x] Google + Apple OAuth buttons
- [x] Setup route writes profile data after sign-up
- [ ] Supabase provider configuration must still be enabled in the hosted project

Cross-page consistency:
- [x] Payments page aligned more closely with Projects visual language
- [x] Upcoming page uses designed empty state and premium list styling
- [x] Settings page moved onto shared form conventions and premium surface treatment
- [x] Upgrade page replaced placeholder copy with real free vs pro positioning
- [ ] Final hover-state and spacing audit across all app pages

### Phase 5 — Monetization [NEXT]

Build order:
- [ ] Shared `PlanGate` wrapper and central upsell modal pattern
- [ ] Upgrade cards/fallbacks wired through `PlanGate`
- [ ] Stripe checkout flow
- [ ] Webhook handler and `users.plan` sync
- [ ] Customer portal entry in settings

### Phase 6 — AI and Launch Polish [LATER]

- [ ] `openrouter.ts` integration for Pro insights only
- [ ] AI upsell fallback for Free users
- [ ] Personalized insights by `freelance_role`
- [ ] Landing page and pricing surface
- [ ] Final onboarding polish

## Current Priority

```text
1. Keep the repo green: build must pass before feature work.
2. Finish cross-page polish and consistency.
3. Start monetization with shared gating, then Stripe.
4. Ship AI and landing page after billing and plan sync are stable.
```
