# FlowSave — DESIGN.md

> Visual execution source of truth for FlowSave.
> Inspired by todesktop.com, adapted for a financial SaaS product.
> If there is conflict with other docs about visual implementation, this file wins.

## Design intent

FlowSave should feel premium, fluid, and cinematic without becoming decorative.
The product must retain financial clarity while gaining the elegance, motion,
and scroll-based atmosphere seen in todesktop.com.

This is not a flat dashboard.
This is a guided visual journey:
- dark at the top
- brighter as the page opens up
- motion that helps the eye travel
- cards that feel like calm surfaces in motion

## Core principles

1. Silence over noise
- Reduce visual clutter before adding emphasis.
- Space should carry hierarchy more than color.
- Avoid loud contrast jumps unless they clarify a primary action.

2. Environmental contrast, semantic stability
- Background atmosphere may shift from dark to bright.
- Data meaning never changes with environment.
- Green is always received. Blue is always future. Amber is always warning. Red is always deficit.

3. Motion must feel native
- Motion should feel like the interface is breathing, not performing.
- Use short durations, low distances, gentle easing.
- No theatrical bounces or delayed entrances.

4. Cards are surfaces, not boxes
- Cards should feel integrated into the page atmosphere.
- Surface treatment changes by section background.
- Borders do most of the work. Shadows are extremely restrained or omitted.

5. Financial trust first
- Readability outranks visual flourish.
- Totals, dates, and money states must always remain obvious.
- Never sacrifice numerical clarity for style.

## Atmosphere system

### Top-of-page atmosphere
Use a deep navy foundation at the top of app pages.
Suggested background recipe:
- base: `--bg`
- overlay gradient: `linear-gradient(180deg, #07071a 0%, #0d0d28 28%, #151a3a 55%, #dfe7ff 88%, #f7f9ff 100%)`
- optional radial accent near hero/chart:
  `radial-gradient(circle at 20% 10%, rgba(91,127,255,0.18), transparent 35%)`

### Scroll transition behavior
On pages with meaningful vertical depth, the background may brighten gradually as users scroll.
Implementation options:
- section-based backgrounds with progressive tone shift
- sticky gradient layer behind content
- scroll-linked CSS variable update only if performance remains excellent

Do not create a harsh breakpoint from dark to white.
The transition should feel misty and continuous.

### Bright lower sections
Bright sections are allowed and encouraged where the page needs release, contrast, or editorial flow.
Bright section rules:
- use off-white / blue-white, never pure #ffffff slabs
- use translucent light surfaces, not flat white cards
- swap to dark text tokens for readability
- maintain blue accent continuity

Recommended bright tokens:
- background: `--bg4`, `--bg5`
- card: `--surface-light`
- border: `--border-light`
- text: `--text-dark`, `--text-dark-2`, `--text-dark-3`

## Surface system

### Dark section cards
Use when card sits on dark navy atmosphere.
- background: `--surface` or `--surface-2`
- border: `1px solid var(--border)`
- hover border: `var(--border-strong)`
- optional inner highlight via subtle gradient overlay

### Bright section cards
Use when card sits on bright atmospheric background.
- background: `rgba(255,255,255,0.72)`
- backdrop blur allowed if performant
- border: `1px solid var(--border-light)`
- text must switch to dark tokens

### Radius
- cards: 12px standard
- larger hero cards: 16px allowed
- buttons: 8px standard

## Typography system

### Dark sections
- primary: `--text`
- secondary: `--text2`
- metadata: `--text3`

### Bright sections
- primary: `--text-dark`
- secondary: `--text-dark-2`
- metadata: `--text-dark-3`

### Hierarchy
- page title: 20px / 600
- metric value: 22px / 600
- primary line item: 14px / 500
- secondary support text: 13px / 400
- metadata label: 11px / 400 uppercase

Rules:
- numbers must dominate metric cards
- dates must never overpower money values
- metadata should whisper, not speak

## Spacing system

Base spacing: 8px grid.
Preferred dashboard rhythm:
- card padding: 20px to 24px
- gap between metric cards: 16px
- gap between major sections: 32px to 48px
- gap within cards: 10px to 16px depending on density

On mobile:
- reduce padding only when necessary
- never let cards feel cramped
- preserve hierarchy before preserving symmetry

## Motion system

### Motion goals
- reveal structure
- reward interaction
- soften transitions
- keep the app feeling fluid

### Allowed motion patterns
1. Fade-up reveal
- initial: opacity 0, y 10 to 16px
- animate: opacity 1, y 0
- duration: 0.35s to 0.55s
- easing: easeOut or cubic-bezier(0.22, 1, 0.36, 1)

2. Section stagger
- for metric cards or list rows only
- stagger subtly, 0.03s to 0.06s
- never theatrical

3. Hover lift
- translateY(-1px) or (-2px) max
- combine with border or background change
- never float dramatically

4. Background drift
- very subtle radial or gradient motion allowed on hero-like sections
- should be nearly imperceptible

5. Page transition softness
- if page transitions are added, keep them brief and understated

### Motion constraints
- motion cannot delay content comprehension
- avoid springy or bouncy interactions
- do not animate every element
- prefer CSS transitions before heavier JS motion
- respect reduced motion preferences

## Components

### Navbar
- semi-transparent
- blurred backdrop
- should feel like it floats above the page atmosphere
- dark on dark sections, but adaptable if bright sections scroll underneath

### Sidebar
- should remain grounded and calm
- active state may use accent tint, border, or subtle background fill
- avoid chunky pills unless very refined

### Metric cards
- value must dominate immediately
- label small and quiet
- secondary line only if meaningful
- hover should slightly sharpen border and lift 1px

### Cash flow chart card
- one of the visual anchors of the page
- bars are the protagonists
- average/reference lines stay secondary
- chart area should breathe
- tooltip must feel premium and integrated

### Recent payments
- compact but elegant
- amount, client name, and date must read in that order
- future payments use blue; received payments use green
- row hover should feel alive, not clickable by accident unless it is clickable

### Tax reserve card
- should feel precise and trustworthy
- if mixed currencies appear, separate them cleanly
- do not compress money lines too tightly

### Pending / empty states
- empty state must feel intentional
- use gentle copy and a clear path forward
- no dead zero cards when the feature is conceptually empty

### Forms
- inputs should feel premium, not raw shadcn defaults
- spacing around labels and helper text must be generous
- input focus must feel crisp and modern

## Color semantics

Data state colors:
- received / positive: `--green`
- future / expected: `--accent2`
- warning / lean: `--amber`
- negative / deficit: `--red`

Environmental colors:
- deep navy through misty blue to near-white are allowed for page atmosphere only
- environmental colors must not replace state colors

## What to avoid

- pure white slabs dumped into dark sections
- abrupt background color jumps
- overuse of gradients inside cards
- strong drop shadows
- glassmorphism that harms readability
- decorative motion with no UX purpose
- purple-heavy palettes
- dense dashboards that feel like accounting software from 2012

## Implementation notes for Claude Code

When implementing visuals:
1. Read CLAUDE.md first
2. Use this file for visual decisions
3. Prefer incremental refinement over broad redesigns
4. Keep business logic untouched unless visual clarity requires formatting changes
5. Test at 375px minimum
6. Check both dark and bright sections for contrast and readability
7. Use semantic colors only for data states
8. Preserve performance; do not add heavy animation libraries beyond Framer Motion when needed

## Phase 2.1 — Implemented

### Dashboard spacing
- Section gap increased from `space-y-6` to `space-y-8` — sections breathe and feel visually isolated
- Card padding increased to `p-6` on chart, SalaryProgress, and TaxReserveCard
- Layout constrained to `max-w-[1280px]` to prevent over-stretching on wide monitors

### MetricCard
- `gap-2.5` between label → value → subtitle, tighter and cleaner
- Value uses `lineHeight: 1.1` so the number dominates without excessive breathing room above
- `card-interactive` class added: `border-color` transitions to `--border-strong` + `translateY(-1px)` on hover (150ms ease)
- New `isEmpty` / `emptyMessage` / `emptyAction` props: Pending card shows "No upcoming payments" + "Add a project →" CTA instead of dead $0.00

### CashFlowChart
- Removed rogue `Line` element that used a cyan→purple gradient (violates design system)
- Chart height increased from 200px to 240px
- `barCategoryGap` reduced to 28% so bars are more prominent
- Tooltip redesigned: 10px uppercase label, 14px bold value, amber "Lean month" hint, rounded-10px, no shadow
- Forecast bars use `rgba(91,127,255,0.55)` (semi-transparent accent) instead of full solid, distinguishing them from "current" month
- Empty state improved with two-line copy

### Multi-currency
- `multiCurrencyLabel()` helper computes per-currency totals and joins with " + "
- "This Month" metric shows e.g. "R$400 + $64" when currencies are mixed
- "Tax Reserve" metric derived per-currency from same map
- "Pending" metric aggregates per client's currency from projects
- TaxReserveCard was already multi-currency correct — no logic change needed

### Pending card empty state
- When `pendingCount === 0`: renders `isEmpty` MetricCard with "No upcoming payments" + link to Projects
- No amber warning color used (nothing is wrong — it's just empty)

### SalaryProgress
- Progress bar height increased to 8px
- Bar color graduated: full `--accent` when ≥50%, dimmed `rgba(91,127,255,0.55)` when below
- State labels: "Early in the month" / "Getting started" / "On track" / "Almost there" / "Target exceeded"
- Percentage shown right-aligned next to state label
- `card-interactive` hover applied

### RecentPayments
- Converted to `'use client'` for per-row hover state
- Rows use `row-hover` utility (background tints to `--surface-2` on hover) + rounded `-mx-1 px-1`
- Amount uses `fontWeight: 600` and `letterSpacing: -0.2px` — more financial feel
- Empty state: two-line copy + "Log your first payment →" link

### TaxReserveCard
- `card-interactive` hover applied
- Padding increased to `p-6`
- Empty state improved: two-line explanatory copy

### Atmospheric background (layout)
- App layout background changed from flat `var(--bg)` to:
  `linear-gradient(180deg, #07071a 0%, #0b0b22 25%, #0f1230 55%, #131830 100%)`
- Subtle deepening gradient — dark navy stays consistent but the midtones shift slightly warmer as content grows
- No harsh breaks; the gradient is a gentle atmospheric foundation for Phase 2.2's full dark→light scroll treatment

### Micro-interactions
- `card-interactive` CSS utility: `border-color` → `--border-strong`, `translateY(-1px)`, 150ms ease — applied to MetricCard, CashFlowChart, SalaryProgress, TaxReserveCard
- `row-hover` CSS utility: background → `--surface-2`, 120ms ease — applied to RecentPayments rows, ClientList rows, PaymentList rows
- ClientList: remove button appears only on hover (opacity transition), turns red on hover
- PaymentList: rows highlight on hover; remove button follows existing opacity pattern

### CSS variables added
- `--bg3`, `--bg4`, `--bg5` (atmospheric light section colors)
- `--surface-2` (elevated dark card fill)
- `--surface-light` (bright section glass fill)
- `--border-light` (border on bright sections)
- `--text-dark`, `--text-dark-2`, `--text-dark-3` (text tokens for bright sections)

## Phase 2.2 — Implemented

### Atmospheric gradient
- App shell atmosphere was rebuilt to stay predominantly deep navy while opening gradually into softer blue haze lower on the page
- Brightening is now carried by low-opacity radial and linear layers instead of a strong top-to-bottom bright slab, so the page never reads like it is split in half
- Decorative layers sit behind all content and stay non-interactive through `pointer-events: none` plus dedicated low z-order shell layers
- The lighter lower-zone treatment is now diffused and environmental only, keeping cards and content as the visual priority

### Correction note
- The earlier correction still left the atmosphere too forceful, too linear, and too visually present in the middle of the page.
- Phase 2.2 was reopened again to soften the environmental system, reduce abrupt tonal change, and make the gradient feel more like depth behind the interface than a layer on top of it.
- The new shell uses restrained navy foundations, slow blue expansion, and diffused lower-page haze so there is no harsh white band or mid-page slab.
- Sidebar interaction safety remains protected by keeping decorative layers in isolated shell backgrounds with `pointer-events: none` and by keeping navbar, sidebar, and main content on higher interaction-safe layers.

### Typography refinement
- Global font stack now follows a cleaner Apple-like system stack:
  `-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif`
- Page titles were enlarged and tightened, section kickers gained more intent, and supporting copy was opened up so the hierarchy feels calmer and less AI-generic
- Card labels, values, subtitles, metadata, and nav text now carry more distinct spacing and weight roles instead of clustering around the same visual tone
- Dashboard supporting copy was expanded slightly and given more breathing room so the hero reads like a brand-led anchor instead of dashboard boilerplate

### Dashboard header redesign
- Dashboard hero now uses a glass-like kicker, a much stronger central title, and softer halo depth behind the title block
- “Dashboard” is treated as the primary visual anchor, with “Overview” clearly secondary and separated by more intentional spacing
- Clients, Payments, and Settings inherit the upgraded kicker-plus-title hierarchy so page headers feel related but not generic
- Header treatment stays controlled: subtle glow, no neon, no theatrical gradients

### Sidebar premium interaction
- Sidebar gained a calmer liquid-glass treatment with softer panel depth, centered nav text, and more intentional internal spacing
- A dedicated divider treatment now separates sidebar and content more clearly on desktop without relying on heavy shadows
- Hover states use restrained soft-glow text response plus subtle liquid highlights, while active items feel selected through refined border and tint layering
- The mobile version keeps the same interaction language in a horizontal rail below the navbar, preserving clickability and legibility at narrow widths

### Brand asset integration
- Real FlowSave brand assets now drive the app shell identity instead of synthetic text styling
- The top-left brand area uses the provided FlowSave wordmark asset for immediate recognition and stronger brand presence
- The provided solo icon is used for the app icon / favicon, with `apple-icon.png` mirrored for Apple surfaces
- Brand presentation is intentionally restrained: real asset first, supporting glass treatment second

### Card hierarchy and surfaces
- `card-interactive` relies on border sharpening and a 1px lift only — no shadow-based emphasis
- `MetricCard`: label reduced and quieted further, value increased and tightened, subtitle softened to secondary text for a clearer hierarchy
- `CashFlowChart`: inner radial glow overlay for atmospheric depth; upgraded header with subline "6-month overview"
- `TaxReserveCard`: header now shows "Set aside X% per payment" subline; rate shown as pill badge; total reserve font bumped to 16px / 600
- `SalaryProgress`: progress track thinned to 6px for more refined feel
- Forms and list surfaces now share a calmer layered dark treatment with quieter gradients so they feel integrated with the app shell rather than dropped on top of it

### Motion system
- CSS `@keyframes fadeUp` added: opacity 0 → 1, translateY 14px → 0, 0.45s cubic-bezier(0.22, 1, 0.36, 1)
- `.fade-up`, `.fade-up-1/2/3/4`: individual element animations with 0.04s stagger increments
- `.fade-up-section`, `.fade-up-section-2`, `.fade-up-section-3`: section-level reveals staggered at 0.05s, 0.12s, 0.20s
- Applied to dashboard: header, metric grid, chart+payments row, reserve+progress row — sequential depth
- `@media (prefers-reduced-motion: reduce)` disables all fade-up animations
- `card-interactive` hover transition extended from 150ms → 200ms for smoother lift feel

## Phase 2.2 remaining items / known limitations

- Final authenticated browser validation at desktop and 375px width is still required before Phase 2.2 can be marked complete in CLAUDE.md.
- Explicit user visual approval is still required before Phase 2.2 can be considered complete.
- Framer Motion not installed; all motion is pure CSS — sufficient for current needs, Framer Motion
  can be added in Phase 3 for more sophisticated scroll-linked reveals.
