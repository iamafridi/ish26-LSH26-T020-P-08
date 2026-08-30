/**
 * processor.js - Application layer: orchestrates engine over batches/files.
 * Handles I/O, aggregation, and output formatting. Keeps domain pure.
 */
import fs from 'node:fs';
import path from 'node:path';
import { processCase } from '../../domain/services/GpaEngine.js';

/**
 * Load JSON input file (absolute or relative)
 * @param {string} inputPath
 * @returns {Object} parsed JSON {cases:[], ...}
 */
export function loadInput(inputPath) {
  const raw = fs.readFileSync(inputPath, 'utf-8');
  return JSON.parse(raw);
}

/**
 * Process all cases from file into enriched results.
 * @param {string} inputPath
 * @returns {{ cases: Array<{case_id, results, checkingLists, summary}>, globalSummary:Object }}
 */
export function processFile(inputPath) {
  const data = loadInput(inputPath);
  const cases = data.cases || [data]; // support single-case wrapper
  const processed = cases.map(c => processCase(c));
  const globalSummary = {
    totalCases: processed.length,
    totalStudents: processed.reduce((a, p) => a + p.summary.total, 0),
    totalPassed: processed.reduce((a, p) => a + p.summary.passed, 0),
    totalFailed: processed.reduce((a, p) => a + p.summary.failed, 0)
  };
  return { cases: processed, globalSummary, meta: { schema_version: data.schema_version, problem_id: data.problem_id } };
}

/**
 * Generate checking lists as teacher verification artifact.
 * R-10: optional <=2.0 (incl AB), practical <8, absent AB
 * @param {Array} results
 * @returns {{optional:{count, students:[]}, practical:{count,...}, absent:{...}}}
 */
export function buildCheckingLists(results) {
  const lists = {
    optional: results.filter(r => r.checkingLists.optional),
    practical: results.filter(r => r.checkingLists.practicalFail),
    absent: results.filter(r => r.checkingLists.absent)
  };
  return {
    optional: {
      count: lists.optional.length,
      rule: 'R-10 optional grade point ≤2.0 (including AB→0) — contributes 0',
      students: lists.optional.map(r => ({
        id: r.id,
        name: r.name,
        class: r.class,
        optional: r.optional,
        optionalGP: r.optionalGP,
        markUsed: r.optionalTrace.markUsed,
        contribution: r.optionalTrace.contribution,
        reason: r.optionalTrace.isAbsent ? 'AB in optional' : `GP ${r.optionalGP} ≤2.0`
      }))
    },
    practical: {
      count: lists.practical.length,
      rule: 'R-10 practical part <8 in any subject — verify by hand',
      students: lists.practical.map(r => {
        const failedSubs = [...r.subjectTraces, r.optionalTrace].filter(s => s && (s.hasPracticalFail || s.practicalBelowThreshold));
        return {
          id: r.id,
          name: r.name,
          class: r.class,
          failedSubjects: failedSubs.map(s => ({ code: s.code, markUsed: s.markUsed, rule: s.rule }))
        };
      })
    },
    absent: {
      count: lists.absent.length,
      rule: 'R-11 AB in any subject (compulsory→F, optional→0) — verify attendance',
      students: lists.absent.map(r => {
        const absentSubs = [...r.subjectTraces, r.optionalTrace].filter(s => s && s.isAbsent);
        return {
          id: r.id,
          name: r.name,
          class: r.class,
          absentSubjects: absentSubs.map(s => s.code),
          overall: r.isFail ? 'F (fail)' : 'Pass (optional absent does not auto-fail)'
        };
      })
    }
  };
}

/**
 * Write output artifacts to disk.
 * @param {string} outDir
 * @param {{cases:Array, globalSummary:Object}} batch
 */
export function writeOutputs(outDir, batch) {
  fs.mkdirSync(outDir, { recursive: true });
  for (const c of batch.cases) {
    const caseDir = path.join(outDir, c.summary.case_id);
    fs.mkdirSync(caseDir, { recursive: true });

    // 1) Full results with traces
    fs.writeFileSync(path.join(caseDir, 'results.json'), JSON.stringify({
      case_id: c.summary.case_id,
      summary: c.summary,
      results: c.results,
      checkingLists: buildCheckingLists(c.results)
    }, null, 2), 'utf-8');

    // 2) Checking lists standalone (office artifact)
    fs.writeFileSync(path.join(caseDir, 'checking_lists.json'), JSON.stringify(buildCheckingLists(c.results), null, 2), 'utf-8');

    // 3) CSV summary for office (spreadsheet import)
    const csvLines = ['id,name,class,optional,finalGPA,letter,isFail,uncappedGPA,failureCause,optionalGP,optionalContrib,lists'];
    for (const r of c.results) {
      csvLines.push([
        r.id, `"${r.name}"`, r.class, r.optional,
        r.gpa.finalGPADisplay, r.gpa.letter, r.isFail ? 'FAIL' : 'PASS',
        r.gpa.uncappedDisplay, r.gpa.failureCause || '',
        r.optionalGP, r.gpa.optionalContribution,
        r.checkingListKeys.join('|')
      ].join(','));
    }
    fs.writeFileSync(path.join(caseDir, 'summary.csv'), csvLines.join('\n'), 'utf-8');

    // 4) Per-student trace text files (for judges: show calculation)
    const tracesDir = path.join(caseDir, 'traces');
    fs.mkdirSync(tracesDir, { recursive: true });
    for (const r of c.results) {
      const lines = [];
      lines.push(`Student: ${r.id} - ${r.name} (${r.class})  Optional: ${r.optional}`);
      lines.push('='.repeat(70));
      lines.push('Subject traces:');
      for (const t of r.subjectTraces) {
        lines.push(`  ${t.code} (${t.type}) ${t.hasPractical?'(Theory+Pract)':'(100)'} : markUsed=${t.markUsed} -> GP=${t.gradePoint} | ${t.rule} ${t.isFail?'[FAIL]':''} ${t.isAbsent?'[AB]':''}`);
      }
      const o = r.optionalTrace;
      lines.push(`  ${o.code} (optional) : markUsed=${o.markUsed} -> GP=${o.gradePoint} contrib=${o.contribution} (${o.contributes}) | ${o.rule}`);
      lines.push('---');
      lines.push(`Compulsory sum: ${r.gpa.sumCompulsory}  Optional contrib max(0,${r.optionalGP}-2)=${r.gpa.optionalContribution}`);
      lines.push(`Uncapped GPA: (${r.gpa.sumCompulsory}+${r.gpa.optionalContribution})/6 = ${r.gpa.rawUncapped} -> capped/rounded ${r.gpa.uncappedDisplay}`);
      if (r.gpa.hasCompulsoryFail) {
        lines.push(`R-13: Compulsory fail detected (${r.gpa.failureCause}: ${r.gpa.failureCauseTrace?.markUsed} -> GP0) => finalGPA 0.00 F (uncancelled ${r.gpa.uncappedDisplay} visible)`);
        lines.push(`Failure cause: ${r.gpa.failureCauseTrace?.code} ${r.gpa.failureCauseTrace?.rule}`);
      }
      lines.push(`FINAL: GPA ${r.gpa.finalGPADisplay}  Letter ${r.gpa.letter}  Result ${r.result}`);
      lines.push(`Checking lists: ${r.checkingListKeys.length? r.checkingListKeys.join(', '): 'none'}`);
      fs.writeFileSync(path.join(tracesDir, `${r.id}.txt`), lines.join('\n'), 'utf-8');
    }
  }
  // Global summary
  fs.writeFileSync(path.join(outDir, 'global_summary.json'), JSON.stringify({ globalSummary: batch.globalSummary, meta: batch.meta, perCase: batch.cases.map(c=>c.summary) }, null, 2), 'utf-8');
  return outDir;
}
