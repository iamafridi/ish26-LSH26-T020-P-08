# Problem 8 Requirements Analysis

## Capability Map

| Domain | Capability | Complexity |
|---|---|---|
| Rule Engine | Deterministic GPA calc R-11/R-12/R-13, Decimal HALF_UP, trace | High — must be pure, no float errors |
| Data Ingestion | 25 cases × ~70 students, 6+1 subjects, practical split, AB | Medium — validation, idempotency |
| Verification | 3 checking lists R-10, pre-publish gate, audit | Medium — state management |
| Publishing | Verified result exports and trace artifacts | Medium — immutable output |
| Admin Config | Dynamic `rules.json`, hot-reload, versioning | Medium — config as code |
| UI | Results table, trace drawer, checking lists, and rule editor | Medium — real data, not mocks |
| Security | Authorization, input sanitization, and audit | High — OWASP controls |
| Performance | 1765 rows <50ms and batch <1s | Low — pure functions |
| DevOps | Docker, CI, and health checks | Medium — portable deployment |

## Explicit Invariants (from public.json)

- 9 subjects: BAN/ENG/MAT (non-practical 0..100), PHY/CHE/BIO/HMT/AGR (practical {theory:0..75,practical:0..25}), REL (non-practical). `practical` flag drives evaluation.
- Compulsory fixed: [BAN,ENG,MAT,PHY,CHE,BIO]; optional per student: HMT|AGR|REL.
- Marks: number or {theory,practical} or "AB". Every student exactly 7 marks.
- Schema version 2.1, 25 cases, 1765 total, PUB-01 80.

## Implicit Edge Cases

- Theory fail (<25) vs practical fail (<8) vs total fail (0..32) — all map to GP0 but different rules + checking list implications. Combined `THEORY_FAIL+PRACTICAL_BELOW` when both < threshold.
- AB is distinct from 0 — must show `AB` badge, not `0`.
- Optional GP=2.0 contributes 0 but flagged optional list (not a bug).
- GPA rounding must be HALF_UP, not bankers; cap 5.00 after rounding.
- Student can be on 1-3 lists simultaneously.

## Complexity Estimate

- Engine: O(n) n=students, pure → trivial scale, but correctness is critical (financial-grade).
- UI: O(n) table virtualization not needed for 80 rows, but search/filter must be client-side.

## Suggested Stack (matches implemented)

- TypeScript/Node + Decimal.js + Vitest + vanilla HTTP + static web (modular monolith, clean arch) — chosen over Python FastAPI for front-to-back typing.
- DB V2: Postgres + Prisma + Redis (scaffolded).

## Risks & Mitigations

- Float rounding → Decimal.js
- AB vs 0 confusion → separate `isAbsent` boolean, UI badge
- Rule changes without deploy → `config/rules.json` versioned
- Publish without verification → state machine guard
