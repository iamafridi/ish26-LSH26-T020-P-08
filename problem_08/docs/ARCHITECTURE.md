# Architecture — School Result Processing & GPA Engine
*Owners: senior-system-architect (high-level) + senior-system-designer (detailed) — priority 6/7, essential*

## 1. Decision: Modular Monolith with Pure Domain
*Architect: senior-system-architect — rendering strategy: SSR not needed, client-side console + stateless API; cross-service contracts via OpenAPI.*



**Why not microservices V1:** Dataset is 60–1765 rows, not 1M TPS. ACID for mark+calc+trace in one transaction matters more than scale. Engine must be deterministic and unit-testable without DB.

```
                    ┌─────────────────────────────────────────────────┐
                    │  Frameworks & Drivers (Next.js, Node http)      │  apps/web (Next.js 15), src/infrastructure/http
                    │  ┌───────────────────────────────────────────┐  │
                    │  │  Adapters (Controllers, Gateways)         │  │  src/adapters/controllers/CliController.js
                    │  │  ┌─────────────────────────────────────┐  │  │  src/adapters/gateways/FileRuleGateway.js
                    │  │  │  Application (Use Cases, Ports)     │  │  │  src/application/useCases/ProcessCase.js
                    │  │  │  ┌───────────────────────────────┐  │  │  │  src/application/services/ProcessorService.js
                    │  │  │  │  Domain (Entities, Services)  │  │  │  │  src/domain/services/GpaEngine.js
                    │  │  │  │  entities/Student, Subject   │  │  │  │  src/domain/entities/, valueObjects/
                    │  │  │  └───────────────────────────────┘  │  │  │
                    │  │  └─────────────────────────────────────┘  │  │
                    │  └───────────────────────────────────────────┘  │
                    └─────────────────────────────────────────────────┘

Client (apps/web — Next.js App Router) ──► API (Next.js Route Handlers app/api/* + legacy src/infrastructure/http/server.js) ──► Application (ProcessorService) ──► Domain (GpaEngine + GradingService + config/rules.json)
                                       │
                                       └─► output/ artifacts  (V2: Prisma Postgres + Redis + S3)  src/infrastructure/persistence/
```

**Layers (Clean Architecture, `src/` — SOLID, Uncle Bob):**
- `domain/` — **innermost, zero deps** — `entities/Student.js`, `valueObjects/GradePoint.js`, `services/GpaEngine.js` + `GradingService.js` (pure, 100% tested), `ports/RuleConfigPort.js`, `strategies/SubjectStrategy.js` (OCP). Old shims `src/domain/engine.js:1` → `services/GpaEngine.js:1` for compat.
- `application/` — `useCases/ProcessCase.js` (depends on domain ports via DIP), `services/ProcessorService.js` (orchestrates batches), `ports/ProcessCasePort.js` + `dto/StudentResultDTO.js` (ISP). Calls domain only.
- `adapters/` — `controllers/CliController.js` (was `cli.js`), `presenters/ResultPresenter.js`, `gateways/FileRuleGateway.js` (DIP adapter for RuleConfigPort).
- `infrastructure/` — **outermost, framework** — `http/server.js` (vanilla, SRP split into `http/middleware/security.js` + `http/routes/*`), `validation/schemas.js` (zod), `audit/audit.js`, `telemetry/telemetry.js`, `persistence/prisma` + Next.js `apps/web` (App Router `app/api/*` reuses same application services via `apps/web/lib/engine.ts:1`). Dependency rule **inward only** — domain never imports infrastructure.

## 2. Component Map (CLEAN)

| Layer | Component | File (canonical, old shim) | Responsibility | SOLID |
|---|---|---|---|---|
| Domain | GradingService | `src/domain/services/GradingService.js:1` (shim `grading.js`) | `gradePointForTotal`, `letterForGPA`, `roundHalfUp` | SRP |
| Domain | GpaEngine | `src/domain/services/GpaEngine.js:1` (shim `engine.js`) | `evaluateSubject`, `computeGPA`, `processStudent`, `processCase` + trace | SRP |
| Domain | Strategies | `src/domain/strategies/SubjectStrategy.js:1` | Practical vs non-practical (OCP) | OCP |
| Domain | Ports | `src/domain/ports/RuleConfigPort.js:1` | DIP abstraction for rules | DIP |
| Domain | Entities/VO | `src/domain/entities/*`, `valueObjects/*` | Student, Subject, GradePoint, GPA | SRP |
| Application | ProcessCase | `src/application/useCases/ProcessCase.js:1` | Use case, depends on port | DIP |
| Application | ProcessorService | `src/application/services/ProcessorService.js:1` (shim `processor.js`) | `loadInput`, `processFile`, `buildCheckingLists`, `writeOutputs` | SRP |
| Adapters | CLI | `src/adapters/controllers/CliController.js:1` (shim `cli.js`) | Args, `--case`, `--student` | SRP |
| Adapters | Presenter | `src/adapters/presenters/ResultPresenter.js:1` | CSV/trace formatting | SRP |
| Adapters | Gateway | `src/adapters/gateways/FileRuleGateway.js:1` | File adapter for RuleConfigPort | DIP |
| Infra | HTTP | `src/infrastructure/http/server.js:1` (shim `server.js`) | Delegates to `http/middleware` + `http/routes/*` | SRP |
| Infra | Next.js | `apps/web/app/*:1` (App Router) + `apps/web/lib/engine.ts:1` | `app/api/cases/*` route handlers reuse same application services | — |
| Infra | Config | `config/rules.json:1` | Dynamic, versioned, hot-reloadable | — |

## 3. Data Flow

```
P08_school_results_public.json (cases[{subjects, compulsory, students}])
   │ loadInput
   ▼
processCase(case) → results[{subjectTraces, optionalTrace, gpa:{sum, contrib, uncapped, final, failureCause}, checkingLists, checkingListKeys}]
   │ buildCheckingLists
   ▼
output/<case_id>/{results.json, checking_lists.json, summary.csv, traces/<id>.txt} + global_summary.json
   ▲ served via API or static
```

## 4. Domain Invariants (R-*)

- **R-11:** `if practical: theory<25 → GP0 (THEORY_FAIL); else if practical<8 → GP0 (PRACTICAL_FAIL); else GP=scale(total)`. PracticalBelowThreshold tracked separately for R-10 list even when theory also fails (combined rule `THEORY_FAIL+ PRACTICAL_BELOW`). AB → `markUsed=AB`, GP0, `isAbsent`.
- **R-12:** `optionalContribution = max(0, optGP-2)`; `rawUncapped=(Σcomp+contrib)/6`; `uncapped= roundHalfUp(min(5,raw),2)`.
- **R-13:** `if any compGP==0 → final=0.00, letter=F` but `uncappedDisplay` preserved for trace.
- **R-10:** `optional ≤2.0` (incl. AB→0) ; `practical <8` any subject (via `practicalBelowThreshold`); `absent` any AB. Student may be on 1–3 lists.

## 5. Config as Code — Dynamic Features

`config/rules.json` controls:
```json
{ "passMarks": {"theory":25,"practical":8}, "gpa":{"divisor":6,"cap":5,"optionalDeduction":2,"decimals":2,"rounding":"HALF_UP"}, "gradingScale":[...], "checkingLists":{"optionalThreshold":2.0} }
```
Admin `PUT /api/config/rules` can patch without restart (V1 demo-not-persisted; V2 persists to `rule_config` table with `version`, `effective_from`, audit).

## 6. API Design (REST)

| Method | Path | Notes |
|---|---|---|
| GET | /health | uptime, case count |
| GET | /api/config/rules | |
| PUT | /api/config/rules | admin |
| POST | /api/calculate | body { caseData } → { summary, checkingLists, results } |
| GET | /api/cases | summaries |
| GET | /api/cases/:id/results | full traces |
| GET | /api/cases/:id/checking-lists?type= | office artifact |
| GET | /api/cases/:id/trace/:studentId | single trace |
| GET | /api/cases/:id/csv | download |

All endpoints CORS-enabled, stateless (cache `processFile`).

## 7. Frontend IA

Tabs mirror personas:
- **Results:** stats bar, search by id/name, filter PASS/FAIL, filter list membership, table rows → drawer with per-subject grid, failure cause highlight, uncapped vs final.
- **Checking Lists:** 3 cards (optional/practical/absent) counts + detail lists; Sign Off button (writes audit in V2).
- **Admin:** inputs bound to `config/rules.json`, scale textarea, save demo.

## 8. Non-Functional

- **Determinism:** Engine uses `Decimal` HALF_UP; no floats for GPA.
- **Performance:** Pure functions <50ms for 1765 students; batch CLI <1s.
- **Security (V2 hardening):** Secrets via env, RBAC guard on `PUT /rules`, input Zod validation, rate-limit, audit immutability.
- **Observability:** Health check, Docker HEALTHCHECK, structured logs (V2: OpenTelemetry).

## 9. Evolution to DB (V2)

Swap `processFile` cache with Postgres:
```
Table student(id, class_id, name), subject(code, has_practical), mark(student_id, subject_code, theory, practical, is_absent), result(student_id, final_gpa, letter, trace_json, status), rule_config(version, payload, effective_from), audit_log
```
Enable `with-db` profile in `docker-compose.yml` (already scaffolded Postgres+Redis). Add Prisma migrations, RLS, BullMQ for async imports.

## 10. System Contracts (senior-system-designer)

**Input Port (processor):**
```ts
interface ProcessCasePort { (caseData: {subjects, compulsory, students}): {results, checkingLists, summary} }
```

**Output Port:**
```ts
type FullStudentResult = { id, subjectTraces[], optionalTrace, gpa{sumCompulsory, optionalContribution, uncappedGPA, finalGPA, failureCause}, checkingLists, checkingListKeys }
```

**API Contract:** OpenAPI in `docs/API_SPEC.md:1`; Zod validation in V2; error envelope `{error}`.

**Frontend Contract:** `GET /api/cases` → summaries; `GET /trace/:id` → drawer; SSE not needed (batch <1s).

## 11. Decision Log (ADR)

| ADR | Decision | Alternatives | Rationale |
|---|---|---|---|
| 01 | Vanilla HTTP over NestJS (V1) | NestJS/Fastify | Zero deps for V1, pure domain focus — **now also Next.js Route Handlers** as alternative |
| 02 | Decimal.js for GPA | Math.round | Correct HALF_UP, avoids 3.495 bug |
| 03 | File-based rules.json | DB from day 1 | Dynamic without migration, V2 DB versioned via `RuleConfigPort` DIP |
| 04 | Static web + API (V1) | **Next.js 15 App Router (now)** | Migrated: `apps/web` is Next.js, no SEO need but React + API routes unify stack |
| 05 | Clean folders `entities/valueObjects/services` | Flat `domain/` | Enforces SRP/OCP, strategies for subject types |
| 06 | Shims for compat (`src/domain/engine.js` → `services/GpaEngine.js`) | Big-bang rename | No breaking change for `tests/engine.spec.js:1` |

## 12. Repo Layout (CLEAN — new canonical, old shims kept for compat)

```
problem_08/
├── config/rules.json
├── src/
│   ├── domain/
│   │   ├── entities/{Student.js,Subject.js,Result.js}
│   │   ├── valueObjects/{GradePoint.js,GPA.js}
│   │   ├── services/{GpaEngine.js,GradingService.js}  ← canonical (shims: src/domain/engine.js, grading.js)
│   │   ├── strategies/SubjectStrategy.js
│   │   └── ports/RuleConfigPort.js
│   ├── application/
│   │   ├── useCases/ProcessCase.js
│   │   ├── services/ProcessorService.js               ← canonical (shim: processor.js)
│   │   ├── ports/{ProcessCasePort.js,AuditPort.js}
│   │   └── dto/StudentResultDTO.js
│   ├── adapters/
│   │   ├── controllers/CliController.js               ← canonical (shim: cli.js)
│   │   ├── presenters/ResultPresenter.js
│   │   └── gateways/FileRuleGateway.js
│   └── infrastructure/
│       ├── http/{server.js, middleware/security.js, routes/health.js, routes/cases.js} ← canonical (shims: server.js, middleware/security.js, routes/*)
│       ├── validation/schemas.js (zod)                ← shim: validation.js
│       ├── audit/audit.js                             ← shim: audit.js
│       ├── telemetry/telemetry.js                     ← shim: telemetry.js
│       └── persistence/prisma/ (schema.prisma)        ← also /prisma/schema.prisma
├── apps/web/  (Next.js 15 — framework driver, Clean outermost)
│   ├── app/{layout.tsx, page.tsx, admin/page.tsx, api/{health,cases,config/rules}/route.ts}
│   ├── lib/engine.ts  (wraps application services via DIP)
│   ├── app/globals.css (from style.css)
│   └── package.json, next.config.mjs, tsconfig.json
├── tests/{engine.spec.js, public_data.spec.js, security.spec.js}
├── output/<case_id>/{results.json, checking_lists.json, summary.csv, traces/*.txt}
├── docs/{PRD.md, REQUIREMENTS.md, ARCHITECTURE.md, API_SPEC.md, DATA_MODEL.md, RULE_ENGINE.md, DEPLOYMENT.md, SECURITY.md, PERFORMANCE.md, DESIGN_SYSTEM.md, TEST_PLAN.md, AGENT_RUN_REPORT.md}
├── prisma/schema.prisma, docker-compose.yml, Dockerfile
```
