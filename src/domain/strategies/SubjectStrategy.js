/**
 * strategies.js — OCP: Strategy pattern for subject evaluation.
 * Replaces if-branch in engine.js with pluggable strategies.
 * Open for extension (new subject types) without modifying engine.
 */

export class PracticalSubjectStrategy {
  constructor(ruleConfig) { this.rules = ruleConfig; }
  evaluate(raw) {
    const { theory, practical } = raw;
    const total = theory + practical;
    const practicalBelow = practical < this.rules.passMarks.practical;
    if (theory < this.rules.passMarks.theory) {
      return {
        markUsed: `${theory}+${practical}=${total}`,
        total, gradePoint: 0, isFail: true, hasPracticalFail: practicalBelow, practicalBelowThreshold: practicalBelow,
        rule: practicalBelow ? `R-11 THEORY_FAIL(${theory}<${this.rules.passMarks.theory})+PRACTICAL_BELOW(${practical}<${this.rules.passMarks.practical})` : `R-11 THEORY_FAIL(${theory}<${this.rules.passMarks.theory})`
      };
    }
    if (practicalBelow) {
      return { markUsed: `${theory}+${practical}=${total}`, total, gradePoint: 0, isFail: true, hasPracticalFail: true, practicalBelowThreshold: true, rule: `R-11 PRACTICAL_FAIL(${practical}<${this.rules.passMarks.practical})` };
    }
    return null; // delegate to grading
  }
}

export class NonPracticalSubjectStrategy {
  evaluate(raw, gradePointForTotal) {
    // raw is number
    const gp = gradePointForTotal(raw);
    return { markUsed: `${raw}`, total: raw, gradePoint: gp, isFail: gp===0, hasPracticalFail: false, practicalBelowThreshold: false, rule: gp===0 ? 'R-11 FAIL(0-32)' : 'R-11 PASS' };
  }
}
