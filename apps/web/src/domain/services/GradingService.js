/**
 * grading.js - Pure grading utilities.
 * No external dependencies except config. Fully testable.
 */

import rules from '../../../config/rules.json' with { type: 'json' };

/**
 * Map total mark (0-100) to grade point using configurable scale.
 * @param {number} total - 0..100
 * @param {Array} scale - optional override
 * @returns {number} grade point 0.0..5.0
 */
export function gradePointForTotal(total, scale = rules.gradingScale) {
  // Defensive: clamp
  const t = Math.max(0, Math.min(100, Math.floor(total)));
  for (const band of scale) {
    if (t >= band.min && t <= band.max) return band.gradePoint;
  }
  // If no band matches (shouldn't happen), return 0
  return 0.0;
}

/**
 * Map final GPA to letter grade using configured thresholds.
 * R-13: A+ = 5.00 exactly, A=4.00-4.99, A-=3.50-3.99, B=3.00-3.49, C=2.00-2.99, D=1.00-1.99, F=fail
 * Note: if overall fail, caller should pass isFail=true to force F regardless of GPA number.
 * @param {number} gpa - 0.00..5.00
 * @param {boolean} isFail - if any compulsory failed
 * @returns {string} letter
 */
export function letterForGPA(gpa, isFail = false) {
  if (isFail) return 'F';
  // Use epsilon-safe comparison: round to 2 decimals for bracket
  const v = Number(gpa.toFixed(2));
  if (v === 5.0) return 'A+';
  if (v >= 4.0 && v <= 4.99) return 'A';
  if (v >= 3.5 && v <= 3.99) return 'A-';
  if (v >= 3.0 && v <= 3.49) return 'B';
  if (v >= 2.0 && v <= 2.99) return 'C';
  if (v >= 1.0 && v <= 1.99) return 'D';
  return 'F';
}

/**
 * HALF_UP rounding to N decimals using Decimal.js for correctness.
 * Avoids floating point 3.495 -> 3.49 errors.
 */
import Decimal from 'decimal.js';

export function roundHalfUp(value, decimals = 2) {
  return new Decimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP).toNumber();
}
