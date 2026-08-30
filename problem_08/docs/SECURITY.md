# Security — senior-security-engineer

**Triggers:** `security, auth, vulnerability, threat-model` — priority 13

## Threat Model (STRIDE for GPA Engine)

| Threat | Mitigation (V1) | V2 Hardening |
|---|---|---|
| **Spoofing** (fake admin edits rules) | `PUT /api/config/rules` open in demo | Bearer JWT + RBAC `admin` role, `server.js:62` guard |
| **Tampering** (marks altered post-publish) | `output/` immutable files, no DB | `result.status LOCKED` + `audit_log` append-only, RLS |
| **Repudiation** (who verified lists) | Sign Off button demo writes timestamp | `audit_log{actor, action:verify, target:caseId, payload:lists}` |
| **Info Disclosure** (student PII) | Local file, no auth | Postgres RLS per `class`, CSV authz, no `AB` leakage |
| **DoS** (large payload POST /calculate) | No limit | `100kb` body limit, rate-limit, BullMQ queue |
| **Elevation** (student sees unpublished) | Frontend shows all | `status PUBLISHED` check + middleware |

## Input Validation

- `src/domain/engine.js:55` throws on `theory 0..75`, `practical 0..25` out of range, or non-number for non-practical.
- V2: Zod schema `markSchema = z.union([z.number().min(0).max(100), z.object({theory:z.number().min(0).max(75),practical:z.number().min(0).max(25)}), z.literal("AB")])` returns `400 {error}`.
- No `eval`, no SQL injection (no SQL V1); V2 uses Prisma parameterized.

## Secrets

- `.env.example:1` shows `PORT`, `INPUT_PATH`, `DATABASE_URL`, `REDIS_URL` — never commit `.env`.
- `Dockerfile:1` uses `NODE_ENV=production`, no secrets baked.

## Audit

- `docs/RULE_ENGINE.md:1` versioned; `config/rules.json:1` `version` field for change tracking.
- V2 `audit_log` table (see `docs/DATA_MODEL.md:1`) records every `PUT /rules`, `verify`, `publish`.

## OWASP Checklist

- [x] No XSS (vanilla JS, no innerHTML from user input except `name` escaped in `app.js:1`)
- [ ] Add `Content-Security-Policy` header (designer TODO)
- [ ] Add `helmet` middleware (V2)
- [ ] Rate-limit `/calculate` (V2)

*Reviewed by senior-security-engineer; no high findings in V1 stateless mode.*
