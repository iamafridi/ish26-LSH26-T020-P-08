/**
 * cases.js — SRP: cases routes, depends on ports (DIP)
 */
import { buildCheckingLists } from '../../application/processor.js';

export function listCases(batch) {
  return { cases: batch.cases.map(c=>c.summary), global: batch.globalSummary, meta: batch.meta };
}
export function getResults(batch, caseId) {
  const c = batch.cases.find(x=>x.summary.case_id===caseId);
  return c ? { case_id: caseId, summary: c.summary, results: c.results } : null;
}
export function getCheckingLists(batch, caseId) {
  const c = batch.cases.find(x=>x.summary.case_id===caseId);
  return c ? buildCheckingLists(c.results) : null;
}
export function getTrace(batch, caseId, studentId) {
  const c = batch.cases.find(x=>x.summary.case_id===caseId);
  return c ? c.results.find(r=>r.id===studentId) || null : null;
}
export function buildCsv(batch, caseId) {
  const c = batch.cases.find(x=>x.summary.case_id===caseId);
  if (!c) return null;
  let csv = 'id,name,class,optional,finalGPA,letter,isFail,uncappedGPA,failureCause,optionalGP,optionalContrib,lists\n';
  for (const r of c.results) csv += [r.id, `"${r.name}"`, r.class, r.optional, r.gpa.finalGPADisplay, r.gpa.letter, r.isFail?'FAIL':'PASS', r.gpa.uncappedDisplay, r.gpa.failureCause||'', r.optionalGP, r.gpa.optionalContribution, r.checkingListKeys.join('|')].join(',') + '\n';
  return csv;
}
