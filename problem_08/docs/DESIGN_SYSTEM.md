# Design System — senior-product-designer + ui-designer + ux-researcher + design-researcher + brand-guardian

**Triggers:** `design-system, ui-design, visual-design, personas, branding` — priorities 15/18/19/10/27

## Brand

- **Voice:** Office-grade, auditable, no jargon; badges for `F`/`PASS`, tags for `optional`/`practical`/`absent`.
- **Palette:** Dark dashboard `apps/web/style.css:1` — `--bg:#0f172a`, `--panel:#162032`, `--accent:#38bdf8`, `--accent2:#a78bfa`, `--ok:#34d399`, `--bad:#f87171` — WCAG AA contrast (guardian check).
- **Typography:** System-ui, Inter fallback, 13px table, 11px headers, `--radius:12px`.

## Personas & Journeys (ux-researcher)

| Persona | Goal | Journey | Pain Solved |
|---|---|---|---|
| **Admin (Rule Owner)** | Change pass marks without deploy | Open Admin tab → edit `theory 25→30` → Save → see version bump | No code change |
| **Office (Verifier)** | Pre-publish hand-check | Open Checking Lists → see counts O25 P10 A2 → click list item → trace drawer → Sign Off | No missing AB/practical |
| **Student (Viewer)** | See GPA + why failed | Search S005 → row shows `0.00 F` + `failureCause CHE` → drawer shows uncapped 4.67 | Understands high avg still fails |

## Information Architecture (product-designer)

- Topbar: brand + case select + CSV export + health badge
- Tabs: Results (primary) → Checking Lists (gate) → Admin (secondary)
- Drawer: per-student trace grid `apps/web/style.css:1` `.trace-grid` — 4 cols (Subject/Mark/GP/Rule), fail rows tinted.

## Component Specs (ui-designer)

- **Table:** sticky header, hover row, `badgeF` red / `badgePass` green, `tag` pills.
- **Cards:** `card` border `1px var(--border)`, `count` accent pill.
- **Drawer:** fixed `width min(560px,100%)`, overlay, `trace-row` grid `90px 1fr 70px 1fr`.

## Competitive Benchmark (design-researcher)

- Compared to student-info systems (PowerSchool, Bangladeshi board sheets) — this console prioritizes **audit over CRUD**: per-subject rule column and uncapped display are unique, not in generic SIS.

## Visual QA (visual-qa + brand-guardian)

- Breakpoints: `grid3` 3col →1col at 900px, `grid2` 1col at 700px.
- Guardian: No brand drift, accent limited to badges/tabs, consistent radius.

*Design tokens in `apps/web/style.css:1`; future Figma in `/design` (pinterest-researcher optional).*
