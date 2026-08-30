/**
 * public_data.spec.js - Validate engine against full public dataset (1765 students)
 * Ensures no crash, structural correctness, and invariant compliance.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { processCase } from '../src/domain/services/GpaEngine.js';

const inputPath = 'D:/El Drago/P08_school_results_public.json';
const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

describe('public dataset: 25 cases, 1765 students', () => {
  it('processes all cases without error', () => {
    expect(data.cases.length).toBe(25);
    const total = data.cases.reduce((a,c)=>a+c.students.length,0);
    expect(total).toBe(1765);
    for (const c of data.cases) {
      const res = processCase(c);
      expect(res.results.length).toBe(c.students.length);
      // every student has 6 compulsory traces + 1 optional trace
      for (const r of res.results) {
        expect(r.subjectTraces.length).toBe(6);
        expect(r.optionalTrace).toBeTruthy();
        expect(typeof r.gpa.finalGPADisplay).toBe('string');
        expect(r.gpa.finalGPADisplay).toMatch(/^\d+\.\d{2}$/);
        expect(['A+','A','A-','B','C','D','F']).toContain(r.gpa.letter);
        expect(r.checkingListKeys).toBeDefined();
        // failure cause must be set iff isFail
        if (r.isFail) expect(r.gpa.failureCause).toBeTruthy();
        else expect(r.gpa.failureCause).toBeNull();
        // optional practical list  <=2.0 flag consistency
        const onOpt = r.optionalGP <= 2.0;
        expect(r.checkingLists.optional).toBe(onOpt);
      }
    }
  });

  it('R-11: AB in compulsory gives F and on absent list', () => {
    const pub01 = data.cases.find(c=>c.case_id==='PUB-01');
    const res = processCase(pub01);
    // S032 has BIO AB compulsory
    const s032 = res.results.find(r=>r.id==='S032');
    expect(s032).toBeTruthy();
    expect(s032.subjectTraces.find(t=>t.code==='BIO').markUsed).toBe('AB');
    expect(s032.isFail).toBe(true);
    expect(s032.gpa.finalGPA).toBe(0.0);
    expect(s032.checkingLists.absent).toBe(true);
    // S045 has optional AB -> not fail, but on optional+absent
    // S045 is in Class 10? Check PUB-01 S045 doesn't exist, use find across all
    let s045 = null;
    for (const c of data.cases) {
      const r = processCase(c).results.find(s=>s.id==='S045');
      if (r && r.optionalTrace.isAbsent) { s045 = r; break; }
    }
    expect(s045).toBeTruthy();
    expect(s045.isFail).toBe(false);
    expect(s045.checkingLists.absent).toBe(true);
    expect(s045.checkingLists.optional).toBe(true);
  });

  it('R-13: high average still failed shows uncapped', () => {
    const pub01 = data.cases.find(c=>c.case_id==='PUB-01');
    const res = processCase(pub01);
    const s005 = res.results.find(r=>r.id==='S005'); // BAN 100,ENG100,MAT86,PHY82,CHE24 fail,BIO84,HMT90
    expect(s005.isFail).toBe(true);
    expect(s005.gpa.uncappedGPA).toBeGreaterThan(3);
    expect(s005.gpa.failureCause).toBe('CHE');
    expect(s005.gpa.failureCauseTrace.markUsed).toBe('24+20=44');
  });

  it('R-12: GPA capped at 5.00', () => {
    const pub01 = data.cases.find(c=>c.case_id==='PUB-01');
    const res = processCase(pub01);
    const s003 = res.results.find(r=>r.id==='S003'); // near perfect
    expect(s003.gpa.finalGPA).toBe(5.0);
    expect(s003.gpa.letter).toBe('A+');
  });

  it('checking lists counts consistent', () => {
    for (const c of data.cases) {
      const res = processCase(c);
      const opt = res.results.filter(r=>r.checkingLists.optional).length;
      const prac = res.results.filter(r=>r.checkingLists.practicalFail).length;
      const abs = res.results.filter(r=>r.checkingLists.absent).length;
      expect(res.summary.optionalFlagged).toBe(opt);
      expect(res.summary.practicalFailed).toBe(prac);
      expect(res.summary.absent).toBe(abs);
      expect(res.summary.passed + res.summary.failed).toBe(res.summary.total);
    }
  });

  it('at least 8 hard edges present across PUB-01', () => {
    const pub01 = data.cases.find(c=>c.case_id==='PUB-01');
    const res = processCase(pub01);
    const hasTheoryFailHighAvg = res.results.some(r=> r.isFail && r.gpa.uncappedGPA >=3.5);
    const hasPracticalFail = res.results.some(r=> r.checkingLists.practicalFail);
    const hasOptionalLow = res.results.some(r=> r.optionalGP <=2.0 && !r.optionalTrace.isAbsent);
    const hasAbsentComp = res.results.some(r=> r.subjectTraces.some(t=>t.isAbsent));
    expect(hasTheoryFailHighAvg).toBe(true);
    expect(hasPracticalFail).toBe(true);
    expect(hasOptionalLow).toBe(true);
    expect(hasAbsentComp).toBe(true);
  });
});
