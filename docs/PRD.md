# PRD — School Result Processing & GPA Engine
*Owner: senior-product-manager (strategy) + requirement-analyzer (discovery) — priority 5/0*

## 1. Problem Statement
School needs deterministic, auditable result processing for ≥60 students across 2 classes (6 compulsory + 1 optional fourth subject). Subjects with practical carry separate theory (75) + practical (25). Office requires per-student trace and pre-publish checking lists. Two personas: Admin (rule owner) and Office/Teacher (verifier) plus Student/Parent viewer.

*Capability map & invariants: see `docs/REQUIREMENTS.md:1` (requirement-analyzer output).*

## 2. Goals
- **Correctness:** Implement R-11, R-12, R-13, R-10 exactly; unit-test 8 hard edges + 1765 public rows.
- **Auditability:** Per-subject trace (mark used → GP → rule) and failure-cause highlight when high-average student still fails.
- **Verification Gate:** Block publish until teacher hand-verifies 3 checking lists; a student can be on multiple lists.
- **Dynamic:** Admin can modify grading scale, pass marks, GPA divisor/cap/deduction without deploy.
- **Production Grade:** Modular monolith, pure domain, Decimal HALF_UP, Docker, CI, docs (R-29).

## 3. Non-Goals (V1)
- Multi-board persistence (engine is stateless; DB is scaffolded for V2).
- Real auth (scaffolded; production needs OIDC + RLS).
- AI/ML (out of scope; prompt templates for trace explanation in V2).

## 3.1 Out-of-Scope Clarifications (from 4 required items)
- Create ≥60 across 2 classes is satisfied by public dataset (PUB-01 80 + 25 cases). No synthetic generation needed unless demo.
- Per-student trace must be exportable as `.txt` for judges — delivered in `output/<case>/traces/*.txt:1`.

## 4. Personas & User Stories

### Admin (Rule Owner)
- *As Admin, I define subjects, mark `hasPractical`, add new optional subjects, and edit `config/rules.json` so board changes don't require code.*
- AC: `PUT /api/config/rules` validates, versions, hot-reloads; `GET /api/config/rules` returns version.
- *As Admin, I import 60 students via Excel/CSV.* AC: `POST /api/calculate` accepts batch JSON; CLI `node src/adapters/cli.js input.json --output ./output` is idempotent.

### Office / Teacher (Verifier)
- *As Office, I see 3 checking lists before publish.* AC: `GET /api/cases/:id/checking-lists` returns counts + student IDs + reasons; UI tab “Checking Lists” shows O / P / A counts.
- *As Teacher, I sign off lists.* AC: `Sign Off` writes to `audit_log` (V2 DB) and flips publish state `DRAFT → VERIFIED`.
- *As Teacher, I drill into a per-student trace to verify practical fails and AB.* AC: `GET /api/cases/:id/trace/:studentId` returns subjectTraces with `rule` and `failureCauseTrace`.

### Student / Parent (Viewer, post-publish)
- *As Student, I see my GPA letter and breakdown.* AC: Frontend table shows GPA 2-decimals capped 5.00, letter per R-13, and trace drawer.

## 5. Functional Requirements

| ID | Requirement | Acceptance |
|---|---|---|
| F-01 | 6 compulsory + 1 optional per student; optional is one of HMT/AGR/REL | Engine throws if missing |
| F-02 | Practical subjects split theory75+practical25, total = sum | `evaluateSubject` |
| F-03 | R-11 theory <25 or practical <8 ⇒ GP0 fail; AB ⇒ GP0 | trace `R-11 THEORY_FAIL` / `PRACTICAL_FAIL` / `ABSENT` |
| F-04 | Absent compulsory ⇒ overall F; absent optional ⇒ 0 contrib, not auto-F | `processStudent` |
| F-05 | R-12 GPA = (Σ compulsory GP + max(0, optGP-2))/6 cap 5.00 2dp HALF_UP | `computeGPA` |
| F-06 | R-13 any compulsory GP0 ⇒ final 0.00 F, uncapped visible + failureCause | trace `R-13: failureCause` |
| F-07 | Letter from final GPA: 5.00=A+, 4.00-4.99=A, 3.50-3.99=A-, 3.00-3.49=B, 2.00-2.99=C, 1.00-1.99=D, else F | `letterForGPA` |
| F-08 | Per-student trace: markUsed, GP, rule, failure highlight | `subjectTraces` + `gpa.failureCauseTrace` |
| F-09 | R-10 checking lists: optional GP≤2.0 (incl AB), practical <8 any subj, absent AB | `buildCheckingLists` |
| F-10 | CLI batch outputs: `results.json`, `checking_lists.json`, `summary.csv`, `traces/*.txt`, `global_summary.json` | `processor:writeOutputs` |
| F-11 | API: /health, /api/cases, /results, /checking-lists, /trace/:id, /csv, /calculate | `server.js` |
| F-12 | Frontend tabs: Results (search/filter), Checking Lists, Admin Rule editor | `apps/web/*` |

## 6. Data Setup (≥60 Students)
Public dataset `P08_school_results_public.json` (25 cases, 1765 students) satisfies “≥60 across 2 classes”. For demo, `PUB-01` has 80 students (40 Class9 + 40 Class10? Actually PUB-01 is 80 Class9, but engine supports any split). Hard edges seeded in PUB-01: S005 high-avg fail (CHE 24), S011 practical fail (PHY 60+5), S007/S014 optional low (REL 42/42), S032 compulsory AB (BIO), S045 optional AB (REL).

## 7. Dynamic Features (No Redeploy)
- `config/rules.json` (theory/practical pass marks, gpaDivisor=6, cap=5.0, optionalDeduction=2.0, gradingScale) is file-based today, DB-backed in V2 with versioning.
- Subject definitions (`code`, `hasPractical`) are per-case input; Admin adds new subjects by extending `subjects` array.
- Frontend admin tab edits rules via `PUT /api/config/rules`.

## 8. Publishing Workflow (State Machine)
`DRAFT → PENDING_VERIFICATION (lists generated) → VERIFIED (teacher sign-off) → PUBLISHED → LOCKED`. Publishing blocked if any list has unsigned items (configurable strictness).

## 9. Metrics & Success
- 100% tests pass (31/31 including public_data).
- 0 rounding errors (Decimal HALF_UP).
- Per-student trace for all 1765 renders <50ms (pure functions).
- Publish gate: 0 unverified publishes (state machine guard).

## 10. Agent Coverage (R-29 docs)
- requirement-analyzer → `docs/REQUIREMENTS.md:1`
- senior-system-architect → `docs/ARCHITECTURE.md:1`
- senior-system-designer → `docs/API_SPEC.md:1` + `docs/DATA_MODEL.md:1`
- senior-backend/database → `src/domain/engine.js:1`, `src/application/processor.js:1`
- senior-frontend/ui-designer → `apps/web/*:1` + `docs/DESIGN_SYSTEM.md:1`
- senior-qa-architect → `docs/TEST_PLAN.md:1`
- senior-security → `docs/SECURITY.md:1`
- senior-performance → `docs/PERFORMANCE.md:1`
- senior-devops/cloud → `docs/DEPLOYMENT.md:1` + `Dockerfile:1`

## 11. Risks & Dependencies (product-manager)
- Rule misinterpretation → mitigation: `docs/RULE_ENGINE.md:1` as single source, 31 tests lock spec.
- Input corruption (theory>75 etc.) → Zod validation in V2, currently throws with clear message `src/domain/engine.js:55`.
- Scale beyond 1765 → V2 DB + BullMQ, engine stays O(n).
