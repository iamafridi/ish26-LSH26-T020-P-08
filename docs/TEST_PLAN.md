# Test Plan

## Quality Gates

- **Gate 1:** Unit 31/31 pass (engine + public data) — `npm test`
- **Gate 2:** Batch proof `node src/adapters/cli.js P08... --output ./output` produces 1765 traces, 0 crashes
- **Gate 3:** API manual smoke `/health` + `/cases` + `/trace` + `/csv`
- **Gate 4:** Frontend visual QA tabs + drawer + checking lists counts match

## Unit (Vitest)

Run: `npm test` → `vitest run` (2 suites, 31 tests)

### `tests/engine.spec.js` — Pure domain
- grading scale bands (80→5, 70→4, 60→3.5, 50→3, 40→2, 33→1, 0→0)
- GPA letter R-13 + fail override
- `roundHalfUp` HALF_UP (3.495→3.50)
- `evaluateSubject` R-11:
  - AB → absent, GP0
  - theory<25 → THEORY_FAIL (including +PRACTICAL_BELOW when applicable)
  - practical<8 → PRACTICAL_FAIL
  - boundary 25+8 → pass GP1
  - non-practical 32→0, 33→1
- `computeGPA` R-12/R-13:
  - normal, optional ≤2 contributes 0, AB 0, capped 5.00, fail→0 but uncapped visible
- `processStudent` 8 hard edges:
  - E01 high avg fail (CHE 24) → uncapped>3.5, failureCause CHE
  - E02 practical fail with passing theory (PHY 55+7)
  - E03 optional GP2.0 contributes 0, flagged optional
  - E04 AB compulsory → F + absent list
  - E05 AB optional → not fail, on optional+absent
  - E06 boundary 25/8 → GP1
  - E07 cap 5.00
  - E08 one fail with combined rule
- multi-list: student on optional+practical+absent

### `tests/public_data.spec.js` — Dataset invariants (1765 rows)
- All 25 cases process without error, correct counts
- AB compulsory → F, AB optional → not F but on lists
- High-avg fail S005 shows CHE failure + uncapped>3
- Cap 5.00 (S003 A+)
- Checking counts = filtered results, passed+failed==total
- At least 4 hard-edge archetypes present in PUB-01

## Batch / CLI

- `node src/adapters/cli.js P08_school_results_public.json --output ./output` → 25 `results.json` + 25 `checking_lists.json` + 25 `summary.csv` + 1765 `traces/*.txt` + `global_summary.json`
- `--case PUB-01` filters single case
- `--student S005 --case PUB-01` prints JSON trace
- `--check-only` prints lists
- Verify: `output/PUB-01/trace/S005.txt` contains `R-13: … CHE: 24+20=44` and `Checking lists: none` vs `S011` contains `practical`

## API (manual)

```bash
curl http://localhost:3000/health
curl http://localhost:3000/api/cases | jq .cases[0]
curl http://localhost:3000/api/cases/PUB-01/results | jq .summary
curl http://localhost:3000/api/cases/PUB-01/checking-lists | jq '.optional.count'
curl http://localhost:3000/api/cases/PUB-01/trace/S011 | jq .gpa
curl http://localhost:3000/api/cases/PUB-01/csv -o pub01.csv
curl -X POST http://localhost:3000/api/calculate -H 'Content-Type: application/json' -d @payload.json | jq .
```

## Frontend (visual QA)

- Open `http://localhost:3000` → tabs switch without reload
- PUB-01 stats: Total 80, Passed 59, Failed 21, Optional 25, Practical 10, Absent 2
- Search "S011" → highlights PHY fail row, practical tag
- Filter FAIL only → 21 rows
- Filter optional list → 25 rows
- Click S005 row → drawer shows CHE THEORY_FAIL, uncapped 4.67 vs final 0.00, failureCause highlighted (R-13)
- Click S045 (optional AB) → drawer shows AB, GPA 4.67 A, lists optional+absent, not failed
- Checking Lists tab counts match stats; Sign Off shows timestamp
- Admin tab loads rules, edit theory pass to 30, save shows demo echo

## Hard-Edge Coverage (per problem statement “at least eight”)

| # | Archetype | Example ID | Verified |
|---|---|---|---|
| 1 | High avg + 1 fail (CHE 24) | PUB-01 S005 | ✓ trace + uncapped 4.67→F |
| 2 | Practical fail passing theory | PUB-01 S011 PHY 60+5 | ✓ PRACTICAL_FAIL, on practical list |
| 3 | Practical fail + theory fail combined | PUB-01 S002 PHY 21+6 | ✓ THEORY_FAIL+PRACTICAL_BELOW |
| 4 | Optional low ≤2.0 | PUB-01 S007 REL 42→2.0 | ✓ optional list, contrib 0 |
| 5 | Optional AB | PUB-01? Across dataset S045 | ✓ optional+absent, not auto-F |
| 6 | Absent compulsory | PUB-01 S032 BIO AB | ✓ AB, F, absent list |
| 7 | Boundary 25+8 pass | Synthetic E06 | ✓ GP1 |
| 8 | GPA cap 5.00 | PUB-01 S003/S028 etc | ✓ 5.00 A+ |

Add more synthetic in `engine.spec.js` E07/E08 for determinism.

## QA Strategy

**Framework:** Vitest `vitest.config.js:1`, ESM, no mocks for domain (pure). `tests/engine.spec.js:1` covers R-11/R-12/R-13, 8 hard edges, multi-list. `tests/public_data.spec.js:1` is integration over `D:/El Drago/P08_school_results_public.json:1` (1765 rows) checking invariants (passed+failed==total, AB handling, cap, checking counts).

**Coverage Target:** 100% for `src/domain` (branch coverage includes combined THEORY+PRACTICAL_BELOW). `npm run test:coverage` (future).

**Edge Matrix (beyond 8):** Theory 24+20 vs 25+8 boundary, optional 2.0 exact, AB optional vs compulsory, practical 7 vs 8, GPA 3.495 HALF_UP, cap 5.5→5.0, multi-list student.

**Regression:** Any change to `config/rules.json:1` must re-run `public_data.spec.js`.

**Automation:** CI in `docs/DEPLOYMENT.md:1` runs `npm test` + batch + `curl /health`.

## Visual QA

- Pixel: dark theme vars, table sticky header, badge colors (F red, PASS green)
- Responsive: `grid3` → 1col at 900px, `grid2` → 1col at 700px
- Checks: `apps/web/style.css:1` contrast, drawer overlay, no layout shift on filter
