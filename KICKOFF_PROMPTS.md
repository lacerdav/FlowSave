# FlowSave — Kickoff Prompts for Cursor + Claude Code

---

## PROMPT A — Interview first (recommended for fresh start)
## Paste as first message in Cursor / Claude Code

---

I want to build FlowSave, a personal finance web app for freelancers
with irregular income. Full product context is in CLAUDE.md — read it
completely before proceeding.

Before writing any code, interview me using AskUserQuestion.

Focus only on ambiguous or hard decisions not already answered in CLAUDE.md:

1. Database: Is the schema optimal? Missing indexes, RLS policies,
   or relationships I haven't considered?

2. OpenRouter gate: Where exactly in the stack should I verify
   plan === 'pro'? Middleware, server action, or API route?

3. Freemium UX: When a free user hits the 2-client limit, what's
   the precise UI flow — block the form, modal, redirect?

4. Forecast algorithm: How do I calculate the 3-month projection
   when a user has only 1–2 months of history? What's the fallback?

5. Stripe trial: Card at signup or at trial end? What happens to
   data if the user doesn't convert?

6. Onboarding: What's the minimum first-run experience that gets
   the user to their first "aha moment" as fast as possible?

Don't ask about things already defined in CLAUDE.md unless challenging
a decision. Dig into what's ambiguous. After covering everything,
write a complete SPEC.md. Then stop — I'll open a new session to build.

---

## PROMPT B — Execute Phase 1 (new session after SPEC.md exists)

---

Read CLAUDE.md and SPEC.md completely before writing any code.

Goal: implement Phase 1 of FlowSave end-to-end.

Build in this order:
1. Scaffold: Next.js 15, TypeScript strict, Tailwind, shadcn/ui
2. Supabase: connect client, run migrations from CLAUDE.md schema,
   enable RLS with correct policies on all tables
3. Auth: magic link login + signup + callback route + middleware
4. Settings page: target salary, tax %, survival budget
5. Client form + client list
6. Payment form (amount, client, date, notes) + payment list

Design: apply the design system from CLAUDE.md exactly.
Dark navy theme (#07071a background), accent #5b7fff, no light colors
inside the app. Font: -apple-system / SF Pro Display stack.

Rules:
- Server components default — 'use client' only when required
- All Supabase queries → /lib/supabase/ helpers
- No hardcoded secrets
- Handle empty, loading, and error states for every component
- Responsive at 375px min
- Run npx tsc --noEmit before marking any feature done

Stop and ask before:
- Any destructive DB operation (DROP, RESET)
- Creating files outside the structure in CLAUDE.md
- Architectural decisions not in SPEC.md

Clean up temp files when done with each feature.

---

## PROMPT C — Feature template (daily use)

---

Read CLAUDE.md for context.

Implement: [FEATURE NAME]

Acceptance criteria:
- [ ] Core functionality works end-to-end
- [ ] Empty state: [describe]
- [ ] Loading state: skeleton or spinner
- [ ] Error state: user-facing message
- [ ] Mobile: works at 375px
- [ ] Design: matches dark theme from CLAUDE.md design system

AI gate (if this feature uses OpenRouter):
Check plan === 'pro' before any API call.
Free users see upsell card, no network request is made.

Scope: ONLY what's described above. Nothing extra.
Clean up temp files when done.
Ask before any destructive DB operation.

---

## Tips for Cursor Free + Claude plugin

- Use Cursor as editor and code navigator
- For long prompts (Prompt A, B), paste in claude.ai Pro directly
- Paste Claude's output back into Cursor to apply
- The Claude plugin in Cursor uses your Pro plan — no extra API cost
- Run /clear between different features to keep context clean
- Update CLAUDE.md whenever Claude repeatedly makes the same mistake

## Recommended build order

Phase 1: Auth → Schema → Settings → Clients → Payments
Phase 2: App shell → Metric cards → Chart → Reserve calc → Salary bar
Phase 3: Projects tracker → Forecast → Lean month → Alert email
Phase 4: Freemium gate → Upsell → Stripe → Webhook
Phase 5: OpenRouter insights → Landing page → Onboarding
