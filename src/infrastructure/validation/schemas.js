/**
 * validation.js — Zod schemas, replaces throw-only in engine.js:55 with 400 details.
 * Runtime validation schemas for API boundaries.
 */
import { z } from 'zod';

export const practicalMark = z.object({
  theory: z.number().int().min(0).max(75),
  practical: z.number().int().min(0).max(25)
});
export const mark = z.union([ z.number().int().min(0).max(100), practicalMark, z.literal('AB') ]);
export const subject = z.object({ code: z.string().min(1), name: z.string().min(1), practical: z.boolean() });
export const student = z.object({
  id: z.string().min(1), name: z.string().min(1), class: z.string().min(1),
  optional: z.string().min(1),
  marks: z.record(z.string(), mark)
});
export const caseData = z.object({
  case_id: z.string().optional(),
  subjects: z.array(subject).min(7),
  compulsory: z.array(z.string()).length(6),
  students: z.array(student).min(1)
}).superRefine((data, ctx) => {
  const codes = new Set(data.subjects.map(s=>s.code));
  for (const c of data.compulsory) if (!codes.has(c)) ctx.addIssue({ code: 'custom', message: `compulsory ${c} not in subjects`, path: ['compulsory'] });
  for (const stu of data.students) {
    if (!codes.has(stu.optional)) ctx.addIssue({ code: 'custom', message: `student ${stu.id} optional ${stu.optional} not in subjects`, path: ['students'] });
    if (data.compulsory.includes(stu.optional)) ctx.addIssue({ code: 'custom', message: `student ${stu.id} optional equals compulsory`, path: ['students'] });
  }
});

export function validateCase(data) {
  const r = caseData.safeParse(data);
  if (!r.success) return { ok: false, error: r.error.flatten() };
  // also validate practical vs non-practical mark shape per subject
  const subjMap = new Map(data.subjects.map(s=>[s.code,s]));
  for (const stu of data.students) {
    for (const [code, val] of Object.entries(stu.marks)) {
      const subj = subjMap.get(code);
      if (!subj) continue;
      if (subj.practical && typeof val === 'number') return { ok: false, error: { formErrors: [`${stu.id} ${code} is practical but got number ${val}, expected {theory,practical}`] } };
      if (!subj.practical && typeof val === 'object') return { ok: false, error: { formErrors: [`${stu.id} ${code} is non-practical but got object`] } };
    }
  }
  return { ok: true, data: r.data };
}

export const ruleConfig = z.object({
  passMarks: z.object({ theory: z.number().int().min(0).max(75), practical: z.number().int().min(0).max(25), nonPracticalPass: z.number().int().optional() }).optional(),
  gpa: z.object({ divisor: z.number().int().min(1).max(10), cap: z.number().min(0).max(5), optionalDeduction: z.number().min(0).max(5), decimals: z.number().int().optional(), rounding: z.string().optional() }).optional(),
  gradingScale: z.array(z.object({ min: z.number(), max: z.number(), gradePoint: z.number(), letter: z.string() })).optional()
});
