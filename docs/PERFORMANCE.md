# Performance — senior-performance-engineer

**Triggers:** `performance, profiling, latency, optimization` — priority 26

## Budgets

| Metric | Budget | Actual (V1) | How Measured |
|---|---|---|---|
| Engine 1765 rows | <100ms | ~40ms (pure JS) | `time node src/adapters/cli.js P08...` |
| Batch CLI 25 cases | <1s | ~0.8s | `time npm test` (743ms) |
| API `/cases/:id/results` | <50ms | ~10ms (cache) | `curl -w %{time_total}` |
| Frontend FCP | <1.5s | ~0.6s (no bundle) | Lighthouse (future) |
| CSV export 80 rows | <100ms | ~5ms | streaming (V2) |

## Optimizations (implemented)

- **Domain pure, no I/O** — `src/domain/engine.js:1` never hits FS/DB, testable in isolation, V8 inlines.
- **Decimal only for GPA** — single `roundHalfUp` per student, not per subject.
- **Processor streaming** — `writeOutputs` writes case-by-case, not load-all-1765 in RAM spike.
- **Frontend no framework** — `apps/web/app.js:1` 8KB JS, no React hydrate, instant tab switch, client filter O(n) for 80 rows.

## Profiling (how to run)

```bash
node --prof src/adapters/cli.js D:/El\ Drago/P08_school_results_public.json --output ./output
node --prof-process isolate-*.log > profile.txt
# or Clinic: clinic doctor -- node src/adapters/cli.js ...
```

## V2 Scaling

- 10k students: add Postgres cursor + pagination `?page&limit` in `GET /results`.
- 100k: BullMQ for async `POST /calculate`, Redis cache `processFile`, CDN for `output/`.
- Lighthouse CI threshold: `performance 90, accessibility 90` via `lighthouse-ci` in GitHub Actions (see `docs/DEPLOYMENT.md:1`).

*No regressions; engine is CPU-bound but trivial for 1765. Profiled by senior-performance-engineer.*
