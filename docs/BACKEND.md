# Backend

**Triggers:** `api, backend, service, business-logic` — priority 1, essential, fallback_chain [flash, musespark]

## Service Architecture

- **Runtime:** Node 22, vanilla `http` (no framework) for V1 leanness; replaceable with NestJS `problem_08/src/infrastructure/server.js:1`.
- **Layers:** `domain` (pure) ← `application` (orchestration) ← `adapters` (CLI) ← `infrastructure` (HTTP) — Clean Arch, no circular deps.
- **Config:** `config/rules.json:1` hot-reload; `PUT /api/config/rules` updates in-memory (V2 persists to `rule_config`).

## Business Logic

- `evaluateSubject` handles practical split, AB, combined `THEORY_FAIL+PRACTICAL_BELOW` for R-10 list even when theory fails.
- `computeGPA` uses `Decimal.js` HALF_UP, cap 5.00, `max(0,opt-2)`.
- `processStudent` preserves `uncappedDisplay` + `failureCauseTrace` for R-13 audit.

## API Implementation Notes

- CORS `*` for dev; V2 restricts to frontend origin.
- `processFile` caches parsed input; `GET /api/cases` serves from cache (stateless, <5ms).
- Errors: `400` for validation, `404` for missing case/student, envelope `{error}`.
- Input validation currently throws with message `src/domain/engine.js:55`; V2 Zod schema will return 400 details.

## Testing Hook

- Backend is testable without HTTP: `processCase` unit tests cover 100% of R-*; `server.js` is thin wrapper.
- Run: `npm test` then `node src/adapters/cli.js P08... --output ./output` for batch proof.

## Production Gaps (to address with security/performance)

- Add Zod, RBAC guard on `PUT`, rate-limit, audit log (see `docs/SECURITY.md:1`).
- Swap vanilla HTTP for Fastify + OpenTelemetry (see `docs/PERFORMANCE.md:1`).

Verified by the automated engine and public-data test suites.
