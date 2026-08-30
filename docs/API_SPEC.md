# API Spec

Base URL: `http://localhost:3000` (or Docker `http://api:3000`)

## Health

```
GET /api/health → { status:"ok", version:"1.0.0-next", uptime, cases }
```

## Config (Admin)

```
GET  /api/config/rules → rules.json
PUT  /api/config/rules { passMarks, gpa, gradingScale } → { message, received, note }  // V1 demo non-persist; V2 persists & bumps version
```

Dynamic: edit without redeploy; validate with Zod.

## Cases

```
GET /api/cases → { cases:[{case_id,total,passed,failed,optionalFlagged,practicalFailed,absent}], global, meta }

GET /api/cases/:caseId/results → { case_id, summary, results:[ FullStudentResult ] }

GET /api/cases/:caseId/checking-lists?type=optional|practical|absent
  → { optional:{count,rule,students}, practical:{…}, absent:{…} }  or filtered { [type]: … }

GET /api/cases/:caseId/trace/:studentId → FullStudentResult (single)

GET /api/cases/:caseId/csv → text/csv attachment
```

### FullStudentResult shape

```json
{
  "id":"S005","name":"Rafi Rahman","class":"Class 9","optional":"HMT",
  "subjectTraces":[
    {"code":"BAN","type":"compulsory","hasPractical":false,"markUsed":"100","total":100,"gradePoint":5,"isFail":false,"isAbsent":false,"rule":"R-11 PASS"},
    {"code":"CHE","type":"compulsory","hasPractical":true,"markUsed":"24+20=44","total":44,"gradePoint":0,"isFail":true,"hasPracticalFail":false,"practicalBelowThreshold":false,"rule":"R-11 THEORY_FAIL(24<25)"}
  ],
  "optionalTrace":{"code":"HMT","gradePoint":5,"contribution":3,"contributes":"YES","rule":"R-11 PASS"},
  "gpa":{"sumCompulsory":25,"optionalContribution":3,"uncappedGPA":4.67,"rawUncapped":4.6667,"finalGPA":0,"finalGPADisplay":"0.00","letter":"F","hasCompulsoryFail":true,"failureCause":"CHE","failureCauseTrace":{"code":"CHE","markUsed":"24+20=44","rule":"R-11 THEORY_FAIL(24<25)"},"uncappedDisplay":"4.67"},
  "result":"F","isFail":true,
  "checkingLists":{"optional":false,"practicalFail":false,"absent":false},
  "checkingListKeys":[]
}
```

## Errors

```
404 { error:"Case PUB-99 not found" }
400 { error:"Missing subjects/compulsory/students" }
```

## Frontend Routes

```
GET /          → Dashboard
GET /ledger    → Student ledger
GET /checking  → Pre-publish checking lists
GET /admin     → Rule configuration
GET /docs      → Documentation index
```

For production, add auth (Bearer on PUT), rate-limit, OpenTelemetry traces.

## Component Interfaces

**Processor:**
```ts
export function processCase(caseData): {results, checkingLists, summary}
export function buildCheckingLists(results): {optional, practical, absent}
export function writeOutputs(outDir, batch): string
```

**Grading:**
```ts
export function gradePointForTotal(total, scale): number
export function letterForGPA(gpa, isFail): string
export function roundHalfUp(value, decimals): number
```

**Validation (V2):** Zod schemas for `mark 0..75/0..25`, `total 0..100`, `AB` string; 400 on violation.

## Versioning

- `GET /api/cases` includes `meta.schema_version 2.1` from input.
- Breaking changes bump `config/rules.json:1` version + API `Accept-Version` header (designer recommendation).
