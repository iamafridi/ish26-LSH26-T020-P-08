/**
 * engine.js - Pure GPA Engine
 * Implements R-11, R-12, R-13, R-10 derivation + per-student trace.
 *
 * Zero dependencies on DB / HTTP. All functions are pure so the engine
 * can be unit-tested with 100% determinism and reused in API, CLI, or Worker.
 */

import rules from '../../../config/rules.json' with { type: 'json' };
import { gradePointForTotal, letterForGPA, roundHalfUp } from './GradingService.js';

/**
 * @typedef {Object} SubjectDef
 * @property {string} code
 * @property {string} name
 * @property {boolean} practical - true if subject has practical part
 */

/**
 * @typedef {Object} MarkInput
 * @property {number|string|{theory:number,practical:number}} value - number 0..100 or {theory:0..75, practical:0..25} or "AB"
 */

/**
 * Evaluate a single subject mark into graded result.
 * R-11: Failing either part fails subject -> GP 0.
 * R-11 Absent compulsory: AB -> GP 0, overall F.
 * @param {MarkInput} rawMark - original mark from JSON (number | {theory,practical} | "AB")
 * @param {SubjectDef} subject
 * @returns {{
 *   markUsed: string,
 *   total: number|null,
 *   gradePoint: number,
 *   isFail: boolean,
 *   isAbsent: boolean,
 *   hasPracticalFail: boolean,
 *   rule: string
 * }}
 */
export function evaluateSubject(rawMark, subject) {
  // AB handling - must be checked before numeric conversion
  if (rawMark === 'AB' || rawMark === 'ab' || rawMark === 'Ab') {
    return {
      markUsed: 'AB',
      total: null,
      gradePoint: 0.0,
      isFail: true,
      isAbsent: true,
      hasPracticalFail: false, // AB is not a practical fail, it's absent (but will be on absent list)
      practicalBelowThreshold: false,
      rule: 'R-11 ABSENT'
    };
  }

  if (subject.practical) {
    // Expect {theory, practical}
    if (typeof rawMark !== 'object' || rawMark === null || typeof rawMark.theory !== 'number' || typeof rawMark.practical !== 'number') {
      throw new Error(`Invalid practical subject mark for ${subject.code}: expected {theory:0..75, practical:0..25}, got ${JSON.stringify(rawMark)}`);
    }
    const { theory, practical } = rawMark;
    const total = theory + practical;

    // Determine practical below threshold for R-10 checking list (independent of theory)
    const practicalBelowThreshold = practical < rules.passMarks.practical;
    // Theory fail check (<25)
    if (theory < rules.passMarks.theory) {
      return {
        markUsed: `${theory}+${practical}=${total}`,
        total,
        gradePoint: 0.0,
        isFail: true,
        isAbsent: false,
        hasPracticalFail: practicalBelowThreshold, // for checking list trigger even when theory also fails
        practicalBelowThreshold,
        rule: practicalBelowThreshold
          ? `R-11 THEORY_FAIL(${theory}<${rules.passMarks.theory})+PRACTICAL_BELOW(${practical}<${rules.passMarks.practical})`
          : `R-11 THEORY_FAIL(${theory}<${rules.passMarks.theory})`
      };
    }
    // Practical fail check (<8)
    if (practicalBelowThreshold) {
      return {
        markUsed: `${theory}+${practical}=${total}`,
        total,
        gradePoint: 0.0,
        isFail: true,
        isAbsent: false,
        hasPracticalFail: true,
        practicalBelowThreshold: true,
        rule: `R-11 PRACTICAL_FAIL(${practical}<${rules.passMarks.practical})`
      };
    }
    // Both parts passed -> grade by total
    const gp = gradePointForTotal(total);
    return {
      markUsed: `${theory}+${practical}=${total}`,
      total,
      gradePoint: gp,
      isFail: gp === 0.0, // total 0..32 also fails
      isAbsent: false,
      hasPracticalFail: false,
      practicalBelowThreshold: false,
      rule: gp === 0.0 ? 'R-11 TOTAL_FAIL(0-32)' : 'R-11 PASS'
    };
  } else {
    // Non-practical: single number 0..100
    if (typeof rawMark !== 'number') {
      throw new Error(`Invalid non-practical mark for ${subject.code}: expected number 0..100, got ${JSON.stringify(rawMark)}`);
    }
    const total = rawMark;
    const gp = gradePointForTotal(total);
    // For non-practical, fail is gp==0 (0..32). But also need to consider AB already handled.
    // Note: theory pass mark 25 does NOT apply here; non-practical uses 33 threshold via grading scale.
    const isFail = gp === 0.0;
    return {
      markUsed: `${total}`,
      total,
      gradePoint: gp,
      isFail,
      isAbsent: false,
      hasPracticalFail: false,
      practicalBelowThreshold: false,
      rule: isFail ? 'R-11 FAIL(0-32)' : 'R-11 PASS'
    };
  }
}

/**
 * Compute GPA from compulsory GP array and optional GP.
 * R-12: GPA = (sum(compulsoryGP) + max(0, optionalGP - 2)) / 6 capped at 5.00
 * R-13: Any compulsory failure -> final GPA 0.00, letter F, but uncapped trace visible.
 * @param {number[]} compulsoryGPs
 * @param {number} optionalGP
 * @returns {{
 *   sumCompulsory: number,
 *   optionalContribution: number,
 *   uncappedGPA: number,
 *   finalGPA: number,
 *   hasCompulsoryFail: boolean,
 *   letter: string
 * }}
 */
export function computeGPA(compulsoryGPs, optionalGP) {
  const sumCompulsory = compulsoryGPs.reduce((a, b) => a + b, 0);
  const optionalContribution = Math.max(0, optionalGP - rules.gpa.optionalDeduction);
  const rawUncapped = (sumCompulsory + optionalContribution) / rules.gpa.divisor;
  const uncappedGPA = roundHalfUp(Math.min(rules.gpa.cap, rawUncapped), rules.gpa.decimals);
  // For trace: also keep unrounded uncapped for visibility
  // But final display is capped & rounded.

  const hasCompulsoryFail = compulsoryGPs.some(gp => gp === 0.0);
  // R-13: fail overrides
  const finalGPA = hasCompulsoryFail ? 0.0 : uncappedGPA;
  const letter = letterForGPA(finalGPA, hasCompulsoryFail);

  return {
    sumCompulsory,
    optionalContribution,
    uncappedGPA: hasCompulsoryFail ? roundHalfUp(Math.min(5.0, rawUncapped), 2) : uncappedGPA,
    // Store both: uncapped is what GPA *would* have been without fail; final is 0 if fail
    rawUncapped, // for debug
    finalGPA,
    hasCompulsoryFail,
    letter
  };
}

/**
 * Process a single student into full trace result.
 * @param {Object} student - {id, name, class, optional, marks:{code: value}}
 * @param {Map<string,SubjectDef>} subjectMap
 * @param {string[]} compulsoryCodes
 * @returns {Object} FullStudentResult with per-subject traces + GPA + checking flags
 */
export function processStudent(student, subjectMap, compulsoryCodes) {
  const subjectTraces = [];
  const compulsoryGPs = [];
  let optionalGP = 0;
  let optionalTrace = null;
  let hasPracticalFail = false;
  let hasAbsent = false;
  let failedSubjects = [];

  // Evaluate compulsory
  for (const code of compulsoryCodes) {
    const subj = subjectMap.get(code);
    if (!subj) throw new Error(`Unknown compulsory subject code ${code}`);
    const raw = student.marks[code];
    // If mark missing -> treat as error (should be "AB" if absent)
    if (raw === undefined) throw new Error(`Missing mark for ${student.id} subject ${code}`);
    const ev = evaluateSubject(raw, subj);
    if (ev.practicalBelowThreshold || ev.hasPracticalFail) hasPracticalFail = true;
    if (ev.isAbsent) hasAbsent = true;
    if (ev.isFail) failedSubjects.push(code);
    compulsoryGPs.push(ev.gradePoint);
    subjectTraces.push({
      code,
      name: subj.name,
      type: 'compulsory',
      hasPractical: subj.practical,
      markUsed: ev.markUsed,
      total: ev.total,
      gradePoint: ev.gradePoint,
      isFail: ev.isFail,
      isAbsent: ev.isAbsent,
      hasPracticalFail: ev.hasPracticalFail,
      practicalBelowThreshold: ev.practicalBelowThreshold,
      rule: ev.rule
    });
  }

  // Evaluate optional
  const optCode = student.optional;
  const optSubj = subjectMap.get(optCode);
  if (!optSubj) throw new Error(`Unknown optional subject ${optCode} for ${student.id}`);
  const optRaw = student.marks[optCode];
  if (optRaw === undefined) throw new Error(`Missing optional mark for ${student.id} subject ${optCode}`);
  const optEv = evaluateSubject(optRaw, optSubj);
  // For optional, AB and fail do NOT auto-fail overall, but affects contribution and checking lists
  // isFail for optional means GP 0 but doesn't set hasCompulsoryFail
  // hasPracticalFail/hasAbsent for optional also goes to checking lists
  if (optEv.practicalBelowThreshold || optEv.hasPracticalFail) hasPracticalFail = true;
  if (optEv.isAbsent) hasAbsent = true;
  optionalGP = optEv.gradePoint;
  optionalTrace = {
    code: optCode,
    name: optSubj.name,
    type: 'optional',
    hasPractical: optSubj.practical,
    markUsed: optEv.markUsed,
    total: optEv.total,
    gradePoint: optEv.gradePoint,
    isFail: optEv.isFail,
    isAbsent: optEv.isAbsent,
    hasPracticalFail: optEv.hasPracticalFail,
    practicalBelowThreshold: optEv.practicalBelowThreshold,
    rule: optEv.rule,
    // For optional, additional rule: contributes max(0, GP-2)
    contribution: Math.max(0, optEv.gradePoint - rules.gpa.optionalDeduction),
    contributes: Math.max(0, optEv.gradePoint - rules.gpa.optionalDeduction) > 0 ? 'YES' : 'NO (GP<=2.0 or AB)'
  };

  // GPA
  const gpaInfo = computeGPA(compulsoryGPs, optionalGP);

  // Determine failure cause subject (first failed compulsory)
  const failureCause = failedSubjects.length > 0 ? failedSubjects[0] : null;
  // Also find the trace for failure cause to show details
  let failureCauseTrace = null;
  if (failureCause) {
    failureCauseTrace = subjectTraces.find(t => t.code === failureCause);
  }

  // Checking list flags (R-10)
  const onOptionalList = optionalGP <= rules.checkingLists.optionalThreshold; // includes AB->0
  const onPracticalFailList = hasPracticalFail;
  const onAbsentList = hasAbsent;

  return {
    id: student.id,
    name: student.name,
    class: student.class,
    optional: optCode,
    subjectTraces,
    optionalTrace,
    compulsoryGPs,
    optionalGP,
    gpa: {
      sumCompulsory: gpaInfo.sumCompulsory,
      optionalContribution: gpaInfo.optionalContribution,
      uncappedGPA: gpaInfo.uncappedGPA,
      rawUncapped: Number(gpaInfo.rawUncapped.toFixed(4)),
      finalGPA: Number(gpaInfo.finalGPA.toFixed(2)),
      finalGPADisplay: gpaInfo.finalGPA.toFixed(2),
      letter: gpaInfo.letter,
      hasCompulsoryFail: gpaInfo.hasCompulsoryFail,
      failureCause,
      failureCauseTrace: failureCauseTrace ? { code: failureCauseTrace.code, markUsed: failureCauseTrace.markUsed, gradePoint: failureCauseTrace.gradePoint, rule: failureCauseTrace.rule } : null,
      // For trace visibility when failed: show what GPA would have been
      uncappedDisplay: gpaInfo.uncappedGPA.toFixed(2)
    },
    result: gpaInfo.hasCompulsoryFail ? 'F' : gpaInfo.letter,
    isFail: gpaInfo.hasCompulsoryFail,
    checkingLists: {
      optional: onOptionalList,
      practicalFail: onPracticalFailList,
      absent: onAbsentList
    },
    // For output convenience: show which lists
    checkingListKeys: [
      ...(onOptionalList ? ['optional'] : []),
      ...(onPracticalFailList ? ['practical'] : []),
      ...(onAbsentList ? ['absent'] : [])
    ]
  };
}

/**
 * Process entire case (batch of students)
 * @param {Object} caseData - {case_id, subjects:[], compulsory:[], students:[]}
 * @returns {{results: Array, checkingLists: {optional:[], practical:[], absent:[]}, summary:Object}}
 */
export function processCase(caseData) {
  const subjectMap = new Map(caseData.subjects.map(s => [s.code, s]));
  const results = caseData.students.map(stu => processStudent(stu, subjectMap, caseData.compulsory));

  const checkingLists = {
    optional: results.filter(r => r.checkingLists.optional).map(r => r.id),
    practical: results.filter(r => r.checkingLists.practicalFail).map(r => r.id),
    absent: results.filter(r => r.checkingLists.absent).map(r => r.id)
  };

  const summary = {
    case_id: caseData.case_id,
    total: results.length,
    passed: results.filter(r => !r.isFail).length,
    failed: results.filter(r => r.isFail).length,
    optionalFlagged: checkingLists.optional.length,
    practicalFailed: checkingLists.practical.length,
    absent: checkingLists.absent.length
  };

  return { results, checkingLists, summary };
}
