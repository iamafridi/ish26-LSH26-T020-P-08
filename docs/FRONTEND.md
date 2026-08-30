# Frontend — senior-frontend-engineer

**Triggers:** `frontend, react, ui-implementation, client` — priority 2, essential, fallback_chain [musespark, flash]

## Stack Choice

- **No framework** (vanilla HTML/CSS/JS modules) for V1 speed; aligns with `problem_08/apps/web/*:1`. V2 can migrate to Next.js without touching `src/domain`.
- `apps/web/index.html:1` — topbar + tabs (Results / Checking Lists / Admin), `style.css:1` dark theme, `app.js:1` fetch-based, no build step.

## Features (by persona)

- **Office (verifier):** Results table with stats bar (Total/Passed/Failed/O/P/A), client search/filter, row click → drawer `output/PUB-01/traces/S005.txt:1`-style trace with failure cause highlight. Checking Lists tab shows 3 cards with counts + detail lists + Sign Off (demo, V2 writes audit).
- **Admin:** Rule editor bound to `GET/PUT /api/config/rules` — edits `theory/practical pass`, `divisor/cap/deduction`, `gradingScale` JSON.
- **Student (future):** Filter by `class`, CSV export `GET /api/cases/:id/csv`.

## State & Performance

- All 1765 students fetched once per case (`/results`), filtered client-side (80 rows → no pagination needed; V2 paginates at 100+).
- No React state mgmt needed; `app.js` uses simple DOM + `fetch` fallback to `output/*.json` when API offline (static mode).
- FCP <1s (no bundle), Lighthouse-ready (see `docs/PERFORMANCE.md:1`).

## Accessibility

- Semantic table, keyboard drawer close, color contrast via CSS vars (`--bg:#0f172a` etc.), badges for F/PASS.

*Built by senior-frontend-engineer; visual QA by `visual-qa` agent (pixel, responsive) — see `docs/DESIGN_SYSTEM.md:1`.*
