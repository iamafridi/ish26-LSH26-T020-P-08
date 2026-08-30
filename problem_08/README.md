# ResultIQ — Deterministic GPA Engine & Executive Result Verification System

[![Build & Test Status](https://img.shields.io/badge/Vitest-41%2F41%20Passed-00875A?style=for-the-badge&logo=vitest&logoColor=white)](file:///d:/El%20Drago/problem_08/tests)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.9%20App%20Router-000000?style=for-the-badge&logo=next.js&logoColor=white)](file:///d:/El%20Drago/problem_08/apps/web)
[![Architecture](https://img.shields.io/badge/Architecture-Clean%20%2F%20Hexagonal-2684FF?style=for-the-badge)](file:///d:/El%20Drago/problem_08/docs/ARCHITECTURE.md)
[![License](https://img.shields.io/badge/License-MIT-6554C0?style=for-the-badge)](file:///d:/El%20Drago/problem_08/LICENSE)

An enterprise-grade, deterministic school result processing and GPA calculation engine engineered for high-throughput batch grading across complex academic curricula (6 compulsory + 1 optional subject with theoretical and practical mark splits). 

Features **Clean Architecture** (Uncle Bob / Hexagonal), rigorous R-10 through R-13 rule compliance, sub-millisecond calculation traces, and a modern **Bento & Floating Capsule Executive UI**.

---

## 👥 Team

| Member | GitHub |
| --- | --- |
| Afridi Akbar Ifty | [iamafridi](https://github.com/iamafridi) |
| Asif Zaman | [A-K-M-Asifuzzaman](https://github.com/A-K-M-Asifuzzaman) |
| Akram Rahat | [akramrafid](https://github.com/akramrafid) |

---

## ⚡ Core Deterministic Engine Rules

The engine adheres strictly to deterministic grading specifications:

- **R-10 (Pre-publish Checking Lists)**: Automatically flags edge cases into 3 quality assurance lists before results are published:
  - *Optional Subject Review*: Optional Grade Point $\le 2.0$ (yields 0 additional GPA contribution, flagged for verification).
  - *Practical Subject Failures*: Any practical subject score $< 8$ marks.
  - *Absent Candidates*: Absent (`AB`) status propagation across individual or all subjects.
- **R-11 (Subject Pass Criteria & Absent Rules)**:
  - Non-practical subjects: Pass mark $\ge 33$ / 100.
  - Practical subjects (75 Theory + 25 Practical): Must score $\ge 25$ in theory **and** $\ge 8$ in practical. Failure in either component yields Grade Point `0.00 (F)`.
  - Absent (`AB`) marks resolve strictly to `0.00 (F)` with audit provenance.
- **R-12 (GPA Calculation & Optional Subject Contribution)**:
  $$\text{Raw GPA} = \frac{\sum (\text{Compulsory GP}) + \max(0, \text{Optional GP} - 2.0)}{6}$$
  - Capped at `5.00` maximum.
  - Formatted to 2 decimal places using deterministic `HALF_UP` rounding.
- **R-13 (Compulsory Failure Override)**:
  - If a student fails **any** compulsory subject, their official certified result is strictly **`0.00 (F)`** (`FAIL`), regardless of a high uncapped average.
  - Uncapped potential GPA and root-cause failure trace are preserved for administrative audit.

---

## 🏗️ Clean Hexagonal Architecture

```
                                  +---------------------------------------------+
                                  |            Frameworks & Drivers             |
                                  |   Next.js 15 App Router (apps/web)          |
                                  |   Node.js HTTP Server (src/infrastructure)  |
                                  +----------------------+----------------------+
                                                         |
                                  +----------------------v----------------------+
                                  |            Adapters & Gateways              |
                                  |   CliController.js   FileRuleGateway.js     |
                                  +----------------------+----------------------+
                                                         |
                                  +----------------------v----------------------+
                                  |          Application Services               |
                                  |   ProcessorService.js   ProcessCase.js      |
                                  +----------------------+----------------------+
                                                         |
                                  +----------------------v----------------------+
                                  |          Domain Engine & Rules              |
                                  |   GpaEngine.js       GradingService.js      |
                                  |   Value Objects      Domain Entities        |
                                  +---------------------------------------------+
```

### Layer Responsibilities
- **Domain Layer (`src/domain/`)**: Pure business logic containing `GpaEngine.js` and `GradingService.js`. Zero external dependencies.
- **Application Layer (`src/application/`)**: Use cases and batch processing workflows (`ProcessorService.js`).
- **Adapters Layer (`src/adapters/`)**: Interface controllers (`CliController.js`) and rule persistence gateways (`FileRuleGateway.js`).
- **Infrastructure & Web (`src/infrastructure/`, `apps/web/`)**: Next.js App Router, Route Handlers, HTTP servers, telemetry, and security middleware.

---

## 🚀 Quickstart Guide

### Prerequisites
- Node.js `20.x` or `22.x`
- npm `10.x+`

### 1. Installation & Test Suite
```bash
# Clone the repository
git clone https://github.com/iamafridi/ish26--Team-El-Drago---Problem-Set-1.git
cd ish26--Team-El-Drago---Problem-Set-1/problem_08

# Install dependencies
npm install

# Run the complete test suite (41/41 Vitest tests)
npm test
```

### 2. Running the Executive Next.js Web Application
```bash
# Run web console
npm run dev:web

# Open your browser at:
# http://localhost:3000
```

### 3. CLI Batch Processing
Process large school datasets directly from the command line:
```bash
node src/adapters/controllers/CliController.js "D:/El Drago/P08_school_results_public.json" --output ./output
```

---

## 📊 Output Artifacts

Running the engine produces structured, immutable audit files in `./output/<CASE_ID>/`:

| Artifact | Format | Description |
| :--- | :--- | :--- |
| `results.json` | JSON | Complete candidate results, individual subject marks, grade points, and formula breakdown. |
| `checking_lists.json` | JSON | Pre-publish verification lists for Optional review, Practical fails, and Absent records. |
| `summary.csv` | CSV | Standard spreadsheet export formatted for school board records. |
| `traces/<STUDENT_ID>.txt` | Text | Human-readable audit log tracing every calculation step and rule invocation. |
| `global_summary.json` | JSON | Macro-level statistics, pass/fail totals, and batch averages. |

---

## 🔌 REST API Reference

The engine provides RESTful Route Handlers under `/api/*`:

| Method | Endpoint | Description | Auth / Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Service health status and uptime | Public |
| `GET` | `/api/cases` | List all available evaluation batches | Public |
| `GET` | `/api/cases/:id/results` | Complete evaluation results & summary | Public |
| `GET` | `/api/cases/:id/checking-lists` | Pre-publish audit checking lists | Public |
| `GET` | `/api/cases/:id/trace/:studentId` | Granular per-subject calculation trace | Public |
| `GET` | `/api/cases/:id/csv` | Download batch summary as CSV | Public |
| `GET` | `/api/config/rules` | Read dynamic engine thresholds | Public |
| `PUT` | `/api/config/rules` | Update rule thresholds (`config/rules.json`) | `Bearer admin-token` |

---

## 📁 Project Directory Structure

```
problem_08/
├── apps/
│   └── web/                     # Next.js 15 App Router Web Application
│       ├── app/                 # Pages, layout, globals.css & API route handlers
│       ├── components/          # Reusable UI components
│       └── lib/engine.ts        # Clean bridge to src/ domain engine
├── config/
│   └── rules.json               # Dynamic engine rule thresholds & grading scale
├── docs/                        # Complete technical documentation suite
│   ├── ARCHITECTURE.md          # System architecture and Hexagonal layout
│   ├── API_SPEC.md              # OpenAPI 3.1 & REST contract specification
│   ├── REQUIREMENTS.md          # Formal mapping of problem requirements
│   ├── RULE_ENGINE.md           # Formal R-10, R-11, R-12, R-13 rule specs
│   └── SECURITY.md              # Security hardening, RBAC, and input schemas
├── prisma/
│   └── schema.prisma            # PostgreSQL relational schema for future DB scaling
├── src/                         # Pure Core Calculation Engine (Clean Layers)
│   ├── domain/                  # GpaEngine.js, GradingService.js, entities, VOs
│   ├── application/             # ProcessorService.js, ProcessCase use cases
│   ├── adapters/                # CliController.js, FileRuleGateway.js
│   └── infrastructure/          # Node HTTP server, rate limiter, security middleware
├── tests/                       # Vitest Test Suites (41 tests)
│   ├── engine.spec.js           # Unit tests for edge cases, rounding & capping
│   ├── public_data.spec.js      # Integration test over all 25 official cases (1765+ records)
│   └── security.spec.js         # Security, schema validation & RBAC tests
└── package.json                 # Project configuration and lifecycle scripts
```

---

## 🧪 Testing & Verification

```bash
# Execute Vitest test runner
npm test

# Expected Output:
# ✓ tests/engine.spec.js (25 tests)
# ✓ tests/security.spec.js (10 tests)
# ✓ tests/public_data.spec.js (6 tests)
# Test Files  3 passed (3)
#      Tests  41 passed (41)
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
