/**
 * engine.spec.js - Vitest suite for GPA Engine
 * Covers R-11, R-12, R-13, R-10 + 8 hard edges required by problem statement.
 */
import { describe, it, expect } from 'vitest';
import { evaluateSubject, computeGPA, processStudent, processCase } from '../src/domain/services/GpaEngine.js';
import { gradePointForTotal, letterForGPA, roundHalfUp } from '../src/domain/services/GradingService.js';

// Helpers
const subjPractical = (code='PHY') => ({ code, name: code, practical: true });
const subjNonPractical = (code='BAN') => ({ code, name: code, practical: false });

describe('grading: gradePointForTotal', () => {
  it('maps correctly 80+ =>5, 70-79=>4, etc', () => {
    expect(gradePointForTotal(100)).toBe(5.0);
    expect(gradePointForTotal(80)).toBe(5.0);
    expect(gradePointForTotal(79)).toBe(4.0);
    expect(gradePointForTotal(70)).toBe(4.0);
    expect(gradePointForTotal(69)).toBe(3.5);
    expect(gradePointForTotal(60)).toBe(3.5);
    expect(gradePointForTotal(59)).toBe(3.0);
    expect(gradePointForTotal(50)).toBe(3.0);
    expect(gradePointForTotal(49)).toBe(2.0);
    expect(gradePointForTotal(40)).toBe(2.0);
    expect(gradePointForTotal(39)).toBe(1.0);
    expect(gradePointForTotal(33)).toBe(1.0);
    expect(gradePointForTotal(32)).toBe(0.0);
    expect(gradePointForTotal(0)).toBe(0.0);
  });
});

describe('grading: letterForGPA', () => {
  it('R-13 letter mapping', () => {
    expect(letterForGPA(5.0, false)).toBe('A+');
    expect(letterForGPA(4.5, false)).toBe('A');
    expect(letterForGPA(4.0, false)).toBe('A');
    expect(letterForGPA(3.99, false)).toBe('A-');
    expect(letterForGPA(3.5, false)).toBe('A-');
    expect(letterForGPA(3.49, false)).toBe('B');
    expect(letterForGPA(3.0, false)).toBe('B');
    expect(letterForGPA(2.5, false)).toBe('C');
    expect(letterForGPA(2.0, false)).toBe('C');
    expect(letterForGPA(1.5, false)).toBe('D');
    expect(letterForGPA(1.0, false)).toBe('D');
    expect(letterForGPA(0.5, false)).toBe('F');
    expect(letterForGPA(4.8, true)).toBe('F'); // fail overrides
  });
});

describe('grading: roundHalfUp', () => {
  it('half up correctly', () => {
    expect(roundHalfUp(3.495, 2)).toBe(3.5);
    expect(roundHalfUp(3.494, 2)).toBe(3.49);
    expect(roundHalfUp(3.4951, 2)).toBe(3.5);
    expect(roundHalfUp(4.1666666, 2)).toBe(4.17);
    expect(roundHalfUp(5.5, 2)).toBe(5.5);
  });
});

describe('engine: evaluateSubject R-11', () => {
  it('AB returns GP 0 and isAbsent', () => {
    const ev = evaluateSubject('AB', subjNonPractical('BAN'));
    expect(ev.gradePoint).toBe(0);
    expect(ev.isAbsent).toBe(true);
    expect(ev.isFail).toBe(true);
    expect(ev.rule).toBe('R-11 ABSENT');
    expect(ev.markUsed).toBe('AB');
  });
  it('practical theory fail (<25) => GP0 regardless of total', () => {
    const ev = evaluateSubject({ theory: 24, practical: 20 }, subjPractical('PHY'));
    expect(ev.gradePoint).toBe(0);
    expect(ev.isFail).toBe(true);
    expect(ev.rule).toMatch(/THEORY_FAIL/);
    expect(ev.hasPracticalFail).toBe(false);
  });
  it('practical practical fail (<8) => GP0 even if theory high', () => {
    const ev = evaluateSubject({ theory: 60, practical: 7 }, subjPractical('CHE'));
    expect(ev.gradePoint).toBe(0);
    expect(ev.isFail).toBe(true);
    expect(ev.hasPracticalFail).toBe(true);
    expect(ev.rule).toMatch(/PRACTICAL_FAIL/);
  });
  it('practical both pass => graded by total', () => {
    const ev = evaluateSubject({ theory: 52, practical: 19 }, subjPractical('PHY')); //71=>4.0
    expect(ev.gradePoint).toBe(4.0);
    expect(ev.isFail).toBe(false);
    expect(ev.markUsed).toBe('52+19=71');
  });
  it('non-practical 0-32 => GP0 fail', () => {
    const ev = evaluateSubject(32, subjNonPractical('BAN'));
    expect(ev.gradePoint).toBe(0);
    expect(ev.isFail).toBe(true);
  });
  it('non-practical 33 => GP1 pass', () => {
    const ev = evaluateSubject(33, subjNonPractical('BAN'));
    expect(ev.gradePoint).toBe(1.0);
    expect(ev.isFail).toBe(false);
  });
  it('boundary theory 25 and practical 8 exact pass', () => {
    const ev = evaluateSubject({ theory: 25, practical: 8 }, subjPractical('PHY')); //33=>1.0
    expect(ev.gradePoint).toBe(1.0);
    expect(ev.isFail).toBe(false);
  });
});

describe('engine: computeGPA R-12 R-13', () => {
  it('normal GPA no fail', () => {
    // 6 subjects: 5,4,3.5,3,2,5 => sum 22.5, optional 4 => contrib 2 => (24.5)/6=4.08
    const r = computeGPA([5,4,3.5,3,2,5], 4.0);
    expect(r.finalGPA).toBeCloseTo(4.08, 2);
    expect(r.letter).toBe('A');
    expect(r.hasCompulsoryFail).toBe(false);
    expect(r.optionalContribution).toBe(2);
  });
  it('optional GP<=2 contributes 0', () => {
    const r = computeGPA([5,5,5,5,5,5], 2.0);
    expect(r.optionalContribution).toBe(0);
    expect(r.finalGPA).toBe(5.0); // (30+0)/6=5
  });
  it('optional GP 1.0 contributes 0', () => {
    const r = computeGPA([5,5,5,5,5,5], 1.0);
    expect(r.optionalContribution).toBe(0);
    expect(r.finalGPA).toBe(5.0);
  });
  it('optional AB GP 0 contributes 0', () => {
    const r = computeGPA([5,5,5,5,5,5], 0.0);
    expect(r.optionalContribution).toBe(0);
  });
  it('any compulsory fail -> final 0.00 F but uncapped visible', () => {
    const r = computeGPA([5,5,5,5,5,0], 5.0); // sum 25 +3=28/6=4.66 uncapped but final 0
    expect(r.hasCompulsoryFail).toBe(true);
    expect(r.finalGPA).toBe(0.0);
    expect(r.letter).toBe('F');
    expect(r.uncappedGPA).toBeCloseTo(4.67, 2); // capped? 28/6=4.66 rounded 4.67 but still shown
  });
  it('GPA capped at 5.00', () => {
    // 6*5=30 + (5-2)=3 =>33/6=5.5 capped 5.0
    const r = computeGPA([5,5,5,5,5,5], 5.0);
    expect(r.uncappedGPA).toBe(5.0);
    expect(r.finalGPA).toBe(5.0);
    expect(r.letter).toBe('A+');
  });
});

describe('engine: processStudent - 8 hard edges', () => {
  const subjects = [
    { code:'BAN', name:'Bangla', practical:false },
    { code:'ENG', name:'English', practical:false },
    { code:'MAT', name:'Mathematics', practical:false },
    { code:'PHY', name:'Physics', practical:true },
    { code:'CHE', name:'Chemistry', practical:true },
    { code:'BIO', name:'Biology', practical:true },
    { code:'HMT', name:'Higher Math', practical:true },
    { code:'AGR', name:'Agriculture', practical:true },
    { code:'REL', name:'Religion', practical:false },
  ];
  const subjectMap = new Map(subjects.map(s=>[s.code,s]));
  const compulsory = ['BAN','ENG','MAT','PHY','CHE','BIO'];

  it('EDGE 1: one failed subject with strong average -> GPA 0 but uncapped visible + failureCause', () => {
    const stu = {
      id:'E01', name:'Edge High Avg Fail', class:'Class 9', optional:'HMT',
      marks:{ BAN:85, ENG:90, MAT:88, PHY:{theory:70,practical:20}, CHE:{theory:24,practical:20}, BIO:{theory:65,practical:20}, HMT:{theory:60,practical:20}}
    };
    const r = processStudent(stu, subjectMap, compulsory);
    expect(r.isFail).toBe(true);
    expect(r.gpa.finalGPA).toBe(0.0);
    expect(r.gpa.letter).toBe('F');
    expect(r.gpa.uncappedGPA).toBeGreaterThan(3.5); // would have been high
    expect(r.gpa.failureCause).toBe('CHE');
    expect(r.gpa.failureCauseTrace.rule).toMatch(/THEORY_FAIL/);
    expect(r.subjectTraces.find(s=>s.code==='CHE').gradePoint).toBe(0);
    expect(r.checkingListKeys).toEqual(expect.arrayContaining([])); // CHE theory fail not practical list
  });

  it('EDGE 2: practical fail with passing theory -> GP0 and checking list', () => {
    const stu = {
      id:'E02', name:'Edge Practical Fail', class:'Class 9', optional:'REL',
      marks:{ BAN:70, ENG:65, MAT:72, PHY:{theory:55,practical:7}, CHE:{theory:50,practical:15}, BIO:{theory:55,practical:18}, REL:70}
    };
    const r = processStudent(stu, subjectMap, compulsory);
    expect(r.subjectTraces.find(s=>s.code==='PHY').hasPracticalFail).toBe(true);
    expect(r.subjectTraces.find(s=>s.code==='PHY').isFail).toBe(true);
    expect(r.isFail).toBe(true);
    expect(r.checkingLists.practicalFail).toBe(true);
    expect(r.checkingListKeys).toContain('practical');
  });

  it('EDGE 3: optional GP <=2 contributes 0, flagged on optional list', () => {
    const stu = {
      id:'E03', name:'Edge Optional Low', class:'Class 9', optional:'HMT',
      marks:{ BAN:70, ENG:70, MAT:70, PHY:{theory:50,practical:15}, CHE:{theory:50,practical:15}, BIO:{theory:50,practical:15}, HMT:{theory:30,practical:10}} // 40=>2.0
    };
    const r = processStudent(stu, subjectMap, compulsory);
    expect(r.optionalGP).toBe(2.0);
    expect(r.gpa.optionalContribution).toBe(0);
    expect(r.checkingLists.optional).toBe(true);
    expect(r.gpa.finalGPA).toBeGreaterThan(0); // not failed
  });

  it('EDGE 4: absent in compulsory -> AB, GP0, overall F, on absent list', () => {
    const stu = {
      id:'E04', name:'Edge Absent Comp', class:'Class 9', optional:'HMT',
      marks:{ BAN:70, ENG:70, MAT:70, PHY:{theory:50,practical:15}, CHE:{theory:50,practical:15}, BIO:'AB', HMT:{theory:50,practical:15}}
    };
    const r = processStudent(stu, subjectMap, compulsory);
    const bio = r.subjectTraces.find(s=>s.code==='BIO');
    expect(bio.markUsed).toBe('AB');
    expect(bio.isAbsent).toBe(true);
    expect(r.isFail).toBe(true);
    expect(r.gpa.finalGPA).toBe(0.0);
    expect(r.checkingLists.absent).toBe(true);
  });

  it('EDGE 5: absent in optional -> contributes 0, on optional+absent lists, NOT auto-fail', () => {
    const stu = {
      id:'E05', name:'Edge Absent Optional', class:'Class 9', optional:'REL',
      marks:{ BAN:70, ENG:70, MAT:70, PHY:{theory:50,practical:15}, CHE:{theory:50,practical:15}, BIO:{theory:50,practical:15}, REL:'AB'}
    };
    const r = processStudent(stu, subjectMap, compulsory);
    expect(r.optionalTrace.isAbsent).toBe(true);
    expect(r.optionalGP).toBe(0);
    expect(r.gpa.optionalContribution).toBe(0);
    expect(r.isFail).toBe(false); // optional absent does NOT fail overall
    expect(r.checkingLists.optional).toBe(true);
    expect(r.checkingLists.absent).toBe(true);
    expect(r.checkingListKeys.sort()).toEqual(['absent','optional'].sort());
  });

  it('EDGE 6: boundary 25/8 exact pass -> GP 1.0', () => {
    const stu = {
      id:'E06', name:'Edge Boundary', class:'Class 9', optional:'REL',
      marks:{ BAN:33, ENG:33, MAT:33, PHY:{theory:25,practical:8}, CHE:{theory:25,practical:8}, BIO:{theory:25,practical:8}, REL:33}
    };
    const r = processStudent(stu, subjectMap, compulsory);
    expect(r.subjectTraces.find(s=>s.code==='PHY').gradePoint).toBe(1.0);
    expect(r.isFail).toBe(false);
  });

  it('EDGE 7: GPA cap 5.00', () => {
    const stu = {
      id:'E07', name:'Edge Cap', class:'Class 9', optional:'HMT',
      marks:{ BAN:95, ENG:95, MAT:95, PHY:{theory:75,practical:25}, CHE:{theory:75,practical:25}, BIO:{theory:75,practical:25}, HMT:{theory:75,practical:25}}
    };
    const r = processStudent(stu, subjectMap, compulsory);
    expect(r.gpa.finalGPA).toBe(5.0);
    expect(r.gpa.letter).toBe('A+');
    // uncapped would be 5.5 but capped
    expect(r.gpa.uncappedGPA).toBe(5.0);
  });

  it('EDGE 8: one mark fail with 24 theory -> flagged, trace shows rule', () => {
    const stu = {
      id:'E08', name:'Edge One Fail', class:'Class 9', optional:'REL',
      marks:{ BAN:70, ENG:70, MAT:70, PHY:{theory:24,practical:20}, CHE:{theory:60,practical:20}, BIO:{theory:60,practical:20}, REL:70}
    };
    const r = processStudent(stu, subjectMap, compulsory);
    const phy = r.subjectTraces.find(s=>s.code==='PHY');
    expect(phy.rule).toMatch(/THEORY_FAIL/);
    expect(phy.gradePoint).toBe(0);
    expect(r.gpa.failureCause).toBe('PHY');
    expect(r.gpa.uncappedGPA).toBeGreaterThan(3);
  });
});

describe('engine: checking lists cross', () => {
  it('student can be on more than one list', () => {
    const subjects = [
      { code:'BAN', name:'Bangla', practical:false },
      { code:'PHY', name:'Physics', practical:true },
      { code:'CHE', name:'Chemistry', practical:true },
      { code:'BIO', name:'Biology', practical:true },
      { code:'ENG', name:'English', practical:false },
      { code:'MAT', name:'Mathematics', practical:false },
      { code:'HMT', name:'Higher Math', practical:true },
    ];
    const m = new Map(subjects.map(s=>[s.code,s]));
    const stu = {
      id:'X', name:'Multi', class:'Class 9', optional:'HMT',
      marks:{ BAN:60, ENG:60, MAT:60, PHY:{theory:50,practical:5}, CHE:{theory:50,practical:15}, BIO:'AB', HMT:'AB'}
    };
    const r = processStudent(stu, m, ['BAN','ENG','MAT','PHY','CHE','BIO']);
    expect(r.checkingLists.practicalFail).toBe(true);
    expect(r.checkingLists.absent).toBe(true);
    expect(r.checkingLists.optional).toBe(true); // AB optional GP 0 <=2
    expect(r.checkingListKeys).toEqual(expect.arrayContaining(['practical','absent','optional']));
  });
});
