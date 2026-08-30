# Data Model

## V1 (Stateless, File-Based)
The current version avoids a database to preserve deterministic, portable evaluation.



Input JSON (`P08_school_results_public.json`):
```json
{
  "subjects":[{"code":"BAN","name":"Bangla","practical":false}],
  "compulsory":["BAN","ENG","MAT","PHY","CHE","BIO"],
  "students":[{"id":"S001","name":"...","class":"Class 9","optional":"HMT","marks":{"BAN":75,"PHY":{"theory":52,"practical":19}}}]
}
```
Practical marks are `{"theory":0..75,"practical":0..25}` or `"AB"`. Non-practical are `0..100` or `"AB"`.

Output per case `output/<case_id>/`:
- `results.json` — `{ case_id, summary, results: FullStudentResult[], checkingLists }`
- `checking_lists.json` — `{ optional, practical, absent }` (office artifact)
- `summary.csv` — spreadsheet-ready
- `traces/<id>.txt` — human-readable per-student trace for judges
- `global_summary.json` — totals across 25 cases

## V2 (DB Evolution — scaffolded, not yet migrated)

Prisma sketch (when `docker-compose --profile with-db up`):

```prisma
model Class { id String @id; name String; students Student[] }
model Subject { code String @id; name String; hasPractical Boolean; theoryMax Int; practicalMax Int; }
model Student { id String @id; name String; classId String; optional String; marks Mark[]; result Result? }
model Mark {
  id String @id @default(cuid())
  studentId String; subjectCode String
  theory Int?; practical Int?; isAbsent Boolean @default(false)
  total Int?; gradePoint Float; isFail Boolean; rule String
  @@unique([studentId, subjectCode])
}
model Result {
  studentId String @id
  finalGPA Float; letter String; isFail Boolean
  sumCompulsory Float; optionalContribution Float
  uncappedGPA Float; failureCause String?; trace Json
  status String // DRAFT|PENDING_VERIFICATION|VERIFIED|PUBLISHED|LOCKED
  verifiedBy String?; verifiedAt DateTime?
}
model RuleConfig { version Int @id; payload Json; effectiveFrom DateTime; createdBy String }
model AuditLog { id String @id; actor String; action String; target String; at DateTime @default(now()); payload Json }
```

**Indexes:** `mark(studentId)`, `result(status)`, `audit_log(at)`. RLS on `result` by `class`.

**Migrations:** `npx prisma migrate dev` when enabling DB. File mode remains supported as import path.

**ER:**
```
Class 1──* Student 1──* Mark *──1 Subject
Student 1──1 Result
RuleConfig 1──* AuditLog
```

## Indexing & Query Perf (database-architect)

- `mark(studentId, subjectCode)` unique, `result(position: studentId)` PK, `audit_log(at)` BRIN for time-range.
- CSV export `GET /api/cases/:id/csv` streams via cursor, not load-all (V2).
- `rule_config(version)` PK, `effective_from` indexed for point-in-time queries.

## Validation Constraints

- `theory 0..75`, `practical 0..25`, `total 0..100`, `AB` allowed — enforced in `src/domain/engine.js:55` (V2: CHECK constraints).
- `optional` must be in `subjects` and not in `compulsory` (V2: FK + exclusion).
