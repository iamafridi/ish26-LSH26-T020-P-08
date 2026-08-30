# LofiStack Hackathon Submission

## Registration

| Field | Value |
|---|---|
| Team ID | `LSH26-T020` |
| Start code | `LSH26-T020` |
| Problem ID | `P08` |
| Problem | School Result Processing and GPA Engine |
| Product | ResultIQ |
| Status | Ready for evaluation |

## Problem 8 solution

ResultIQ is a deterministic result-processing system for six compulsory subjects
and one optional subject. It handles theory/practical pass requirements, absence
propagation, optional-subject contribution, GPA capping and rounding, compulsory
failure overrides, verification lists, and calculation traces.

### Required feature coverage

| Requirement | Implementation |
|---|---|
| Deterministic GPA engine | R-11/R-12/R-13 logic in `src/domain/` using Decimal.js HALF_UP rounding |
| Pre-publish checking lists | Optional, practical-failure, and absent lists exposed at `/checking` |
| Student calculation trace | Per-subject rule and GPA trace available from the ledger drawer and trace API |
| Batch CLI and API | `npm run process` plus Next.js route handlers under `/api/cases` |
| Admin rule configuration | Rule editor at `/admin` backed by the rule configuration adapter |

## Evaluation dataset

- Dataset: `P08_school_results_public.json`
- Schema: `2.1`
- Cases: `25`
- Students: `1,765`
- Compulsory subjects: `BAN`, `ENG`, `MAT`, `PHY`, `CHE`, `BIO`
- Optional subjects: `HMT`, `AGR`, or `REL`

## Run locally

Requirements: Node.js 20.9 or newer and npm 10 or newer.

```bash
npm ci
npm test
npm run build
npm run dev
```

Open `http://localhost:3000`.

## Application routes

| Route | Purpose |
|---|---|
| `/` | Result and performance dashboard |
| `/ledger` | Searchable student result ledger |
| `/checking` | Pre-publish checking lists |
| `/admin` | Rule configuration |
| `/docs` | Product documentation |
| `/api/health` | Deployment health check |

## Generate evaluation artifacts

```bash
npm run process
```

Output is written to `output/`, including results JSON, checking lists, CSV files,
global summaries, and individual student traces.

## Vercel deployment

The repository root includes `vercel.json`. Import the repository into Vercel and
retain the detected commands:

- Install: `npm install`
- Build: `npm run build`
- Output: `apps/web/.next`

The official dataset and rule configuration are included through Next.js output
file tracing. Full local, Vercel, and Docker instructions are in
`docs/DEPLOYMENT.md`.

## Verification evidence

- 3 test files passed
- 41 of 41 automated tests passed
- 25 of 25 public cases processed
- 1,765 of 1,765 student records processed
- Production Next.js build passed
- TypeScript validation passed
- Dependency audit reports zero vulnerabilities
- Dedicated dashboard, ledger, checking, admin, and documentation routes built
- Responsive desktop, tablet, and mobile layouts included

## Submission contents

- `EVENT.md` — registration identifiers
- `evaluation-manifest.json` — machine-readable evaluation manifest
- `SUBMISSION.md` — judge-facing submission summary
- `README.md` — product overview and quick start
- `docs/REQUIREMENTS.md` — Problem 8 requirements mapping
- `docs/RULE_ENGINE.md` — grading rules
- `docs/API_SPEC.md` — endpoint contracts
- `docs/TEST_PLAN.md` — quality gates and edge cases
- `docs/DEPLOYMENT.md` — deployment instructions
- `LICENSE` and `LICENSES.md` — licensing records

## Final checklist

- [x] Team and Problem 8 identifiers recorded
- [x] All required Problem 8 capabilities implemented
- [x] Public dataset included and processed successfully
- [x] Automated tests passing
- [x] Production build passing
- [x] Security dependency audit clean
- [x] Frontend and backend ready for Vercel
- [x] Responsive navigation and layouts verified
- [x] License and deployment documentation included
