# FlowSave

FlowSave is a cashflow operating system for freelancers.

It is built around three distinct layers of money:

```text
Projects          → pipeline
Payment Schedule  → committed future revenue
Payments          → realized cash
```

That separation is the core product rule and should remain visible throughout the app.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + shadcn/ui primitives
- Supabase for auth and Postgres
- motion/react for interface motion
- Recharts for dashboard visuals
- Stripe planned for billing
- OpenRouter planned for Pro AI insights

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` with the required Supabase values and any optional service keys used in your environment.

Expected environment variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENROUTER_API_KEY` when testing Pro AI later
- Stripe and Resend keys when monetization/email work begins

3. Start the app:

```bash
npm run dev
```

4. Production validation:

```bash
npm run build
```

## Database

Supabase migrations live in `supabase/migrations`.

Current migrations in repo:
- `001_init.sql`
- `002_project_payment_links.sql`
- `003_project_sub_status.sql`
- `004_payment_schedule.sql`
- `005_user_profile_fields.sql`

Before any schema change, verify the code and database are aligned. Do not assume a migration has already been applied remotely.

## Current Product Status

Implemented:
- Dashboard 2.0 with hero/gap/pending/recent hierarchy
- Clients, payments, projects, schedule, and upcoming views
- Auth redesign with richer sign-up form and OAuth buttons
- Free-tier client gating and upgrade entry points
- Floating app shell with collapsible sidebar

Next:
- Finish cross-page polish and consistency
- Build shared monetization gates
- Add Stripe checkout and plan sync
- Add Pro AI insights after billing is stable

## Notes

- `PLAN.md` is the current roadmap snapshot.
- `CLAUDE.md` contains product, design, and implementation constraints for the project.
