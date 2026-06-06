# Design

## Source of truth
- Status: Active
- Last refreshed: 2026-06-06
- Primary product surfaces: authenticated SaaS dashboard
- Evidence reviewed: `PLAN.md`, `src/app/globals.css`, dashboard routes, layout, KPI cards, and the verified Phase 2 screenshot

## Brand
- Personality: capable, calm, technical, trustworthy
- Trust signals: visible tenant status, clear data provenance, restrained enterprise styling
- Avoid: decorative gradients that reduce readability, dense controls, playful consumer-app styling

## Product goals
- Goals: make organization health understandable at a glance and keep tenant context obvious
- Non-goals: full design-system extraction
- Success signals: KPIs and trends scan quickly; charts remain readable on laptop and mobile; navigation is usable by touch and keyboard

## Personas and jobs
- Primary personas: SaaS operators, founders, and organization admins
- User jobs: review current health, understand recent revenue and acquisition trends, navigate workspace areas
- Key contexts of use: desktop monitoring and quick mobile checks

## Information architecture
- Primary navigation: Dashboard, Team, Settings
- Core routes/screens: dashboard home, team administration, workspace settings
- Content hierarchy: workspace context, page title/status, KPIs, trend charts, activity area, contextual AI assistant

## Design principles
- Prioritize scanability over decoration.
- Keep tenant context persistent.
- Reveal complexity progressively.
- Tradeoffs: charts favor broad trend comprehension over high-density analysis.

## Visual language
- Color: slate surfaces, indigo primary accent, emerald/rose semantic trends
- Typography: Geist with strong numeric emphasis and quiet supporting labels
- Spacing/layout rhythm: 4/6/8 spacing increments; generous card padding
- Shape/radius/elevation: rounded cards with subtle borders and restrained shadows
- Motion: brief sidebar transitions and loading pulses; respect reduced motion
- Imagery/iconography: simple line icons only where they clarify navigation

## Components
- Existing components to reuse: dashboard shell, Clerk organization/user controls, KPI card treatment
- New/changed components: revenue chart, weekly signups chart, activity feed, presence badge, mobile navigation drawer, floating AI chat panel, team member list, invitation modal, organization and personal settings forms, destructive confirmation modal
- Variants and states: loading, empty, error, streaming, stopped response, positive/negative trend, churn inverse trend, saved/unsaved forms, administrator/read-only settings
- Token/component ownership: Tailwind utilities and root CSS variables

## Accessibility
- Target standard: WCAG 2.1 AA
- Keyboard/focus behavior: mobile menu and navigation controls must be keyboard accessible with visible focus
- Contrast/readability: semantic colors retain readable text contrast
- Screen-reader semantics: charts include accessible summaries/tables
- Reduced motion and sensory considerations: disable nonessential animation under reduced-motion preferences

## Responsive behavior
- Supported breakpoints/devices: mobile through wide desktop
- Layout adaptations: sidebar becomes an overlay drawer; KPI and chart grids collapse to one column
- Touch/hover differences: large touch targets; no hover-only functionality; chat becomes a full-screen mobile overlay

## Interaction states
- Loading: card and chart skeletons preserve layout
- Empty: explain how to seed tenant data
- Error: inline recoverable message with retry
- Success: current metrics and date range shown; settings acknowledge saved state
- Disabled: unauthorized settings remain visibly read-only; destructive actions stay disabled until exact confirmation
- Offline/slow network: retained layout with loading and error feedback

## Content voice
- Tone: concise, direct, operational
- Terminology: organization, workspace, metrics, revenue, signups, sessions, churn
- Microcopy rules: explain data timing and unavailable future features without jargon

## Implementation constraints
- Framework/styling system: Next.js App Router, React, Tailwind CSS, Recharts
- Design-token constraints: extend existing slate/indigo palette
- Performance constraints: avoid unnecessary chart re-renders and large client dependencies beyond Recharts
- Compatibility constraints: current stable browser support
- Test/screenshot expectations: lint, typecheck, production build, desktop and mobile visual inspection

## Open questions
- [ ] Final brand assets and logo treatment remain a later polish decision.
