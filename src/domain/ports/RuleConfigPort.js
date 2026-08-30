/**
 * RuleConfigPort — DIP: Domain depends on abstraction, not concrete file.
 * Defines the rule configuration interface used by the domain layer.
 */

/**
 * @typedef {Object} RuleConfig
 * @property {string} version
 * @property {{theory:number,practical:number,nonPracticalPass:number}} passMarks
 * @property {{divisor:number,cap:number,optionalDeduction:number,decimals:number,rounding:string}} gpa
 * @property {Array<{min:number,max:number,gradePoint:number,letter:string}>} gradingScale
 * @property {Array<{gpa:number,gpaMax:number,letter:string}>} letterFromGPA
 * @property {{optionalThreshold:number,practicalFailThreshold:number}} checkingLists
 */

/**
 * @interface RuleConfigPort
 * @method getRules(): RuleConfig
 * @method getVersion(): string
 */
export class RuleConfigPort {
  getRules() { throw new Error('Not implemented'); }
  getVersion() { throw new Error('Not implemented'); }
}

// Concrete file adapter (V1), DB adapter (V2) implements same port
import fileRules from '../../../config/rules.json' with { type: 'json' };
export class FileRuleConfigAdapter extends RuleConfigPort {
  #rules;
  constructor(rules = fileRules) { super(); this.#rules = rules; }
  getRules() { return this.#rules; }
  getVersion() { return this.#rules.version; }
  update(rules) { this.#rules = { ...this.#rules, ...rules }; return this.#rules; }
}

export const defaultRuleConfig = new FileRuleConfigAdapter();
