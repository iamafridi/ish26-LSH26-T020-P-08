/**
 * audit.js — Append-only audit log, RLS-ready for V2 Postgres.
 * senior-security + senior-database
 */
import fs from 'node:fs';
import path from 'node:path';

const LOG_FILE = path.resolve('./output/audit.log.jsonl');
const memory = []; // V1 in-memory, V2 persists to audit_log table

export function log(actor, action, target, payload = {}) {
  const entry = { at: new Date().toISOString(), actor, action, target, payload };
  memory.push(entry);
  try {
    fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
    fs.appendFileSync(LOG_FILE, JSON.stringify(entry) + '\n', 'utf-8');
  } catch {}
  return entry;
}
export function list(target) {
  if (!target) return [...memory];
  return memory.filter(e => e.target === target);
}
export function _reset() { memory.length = 0; try { fs.unlinkSync(LOG_FILE); } catch {} }

// Helpers for routes
export function auditVerify(caseId, user) { return log(user?.sub || 'anon', 'verify', caseId, { lists: 'optional|practical|absent' }); }
export function auditPublish(caseId, user) { return log(user?.sub || 'anon', 'publish', caseId, {}); }
export function auditRuleUpdate(user, version) { return log(user?.sub || 'anon', 'rule.update', 'rules', { version }); }
