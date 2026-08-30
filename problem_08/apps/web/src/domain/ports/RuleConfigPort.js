/**
 * RuleConfigPort — DIP: Domain depends on abstraction, not concrete file.
 * senior-system-designer: interface-spec, priority 7
 */

export class RuleConfigPort {
  getRules() { throw new Error('Not implemented'); }
  getVersion() { throw new Error('Not implemented'); }
}

const defaultRulesFallback = {
  "version": "1.0.0",
  "passMarks": { "theory": 25, "practical": 8, "nonPracticalPass": 33 },
  "gpa": { "divisor": 6, "cap": 5.0, "optionalDeduction": 2.0, "decimals": 2, "rounding": "HALF_UP" },
  "gradingScale": [
    { "min": 80, "max": 100, "gradePoint": 5.0, "letter": "A+" },
    { "min": 70, "max": 79, "gradePoint": 4.0, "letter": "A" },
    { "min": 60, "max": 69, "gradePoint": 3.5, "letter": "A-" },
    { "min": 50, "max": 59, "gradePoint": 3.0, "letter": "B" },
    { "min": 40, "max": 49, "gradePoint": 2.0, "letter": "C" },
    { "min": 33, "max": 39, "gradePoint": 1.0, "letter": "D" },
    { "min": 0, "max": 32, "gradePoint": 0.0, "letter": "F" }
  ],
  "letterFromGPA": [
    { "gpa": 5.0, "gpaMax": 5.0, "letter": "A+" },
    { "gpa": 4.0, "gpaMax": 4.99, "letter": "A" },
    { "gpa": 3.5, "gpaMax": 3.99, "letter": "A-" },
    { "gpa": 3.0, "gpaMax": 3.49, "letter": "B" },
    { "gpa": 2.0, "gpaMax": 2.99, "letter": "C" },
    { "gpa": 1.0, "gpaMax": 1.99, "letter": "D" },
    { "gpa": 0.0, "gpaMax": 0.99, "letter": "F" }
  ],
  "checkingLists": { "optionalThreshold": 2.0, "practicalFailThreshold": 8 }
};

export class FileRuleConfigAdapter extends RuleConfigPort {
  #rules;
  constructor(rules = defaultRulesFallback) { super(); this.#rules = rules; }
  getRules() { return this.#rules; }
  getVersion() { return this.#rules.version; }
  update(rules) { this.#rules = { ...this.#rules, ...rules }; return this.#rules; }
}

export const defaultRuleConfig = new FileRuleConfigAdapter();
