#!/usr/bin/env node
/**
 * cli.js - CLI entry for batch processing.
 * Usage: node src/adapters/cli.js <input.json> --output ./output [--case PUB-01] [--format json|csv]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { processFile, writeOutputs, buildCheckingLists } from '../application/services/ProcessorService.js';
import { processCase } from '../domain/services/GpaEngine.js';

const args = process.argv.slice(2);
if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
School Result Processing & GPA Engine - CLI
Usage:
  node src/adapters/cli.js <input.json> [options]

Options:
  --output <dir>     Output directory (default: ./output)
  --case <id>        Process only this case_id
  --check-only       Only print checking lists to stdout (no file write)
  --student <id>     Print single student trace (with --case)
  --help             Show this help

Examples:
  node src/adapters/cli.js P08_school_results_public.json --output ./output
  node src/adapters/cli.js ../P08_school_results_public.json --case PUB-01 --student S005
`);
  process.exit(0);
}

const inputPath = args[0];
const outIdx = args.indexOf('--output');
const outDir = outIdx !== -1 ? args[outIdx + 1] : './output';
const caseIdx = args.indexOf('--case');
const caseFilter = caseIdx !== -1 ? args[caseIdx + 1] : null;
const studentIdx = args.indexOf('--student');
const studentFilter = studentIdx !== -1 ? args[studentIdx + 1] : null;
const checkOnly = args.includes('--check-only');

if (!fs.existsSync(inputPath)) {
  console.error(`Input not found: ${inputPath}`);
  process.exit(1);
}

if (studentFilter && caseFilter) {
  // Single student trace mode
  const data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const caseData = data.cases.find(c => c.case_id === caseFilter);
  if (!caseData) { console.error(`Case ${caseFilter} not found`); process.exit(1); }
  const res = processCase(caseData);
  const stu = res.results.find(r => r.id === studentFilter);
  if (!stu) { console.error(`Student ${studentFilter} not found in ${caseFilter}`); process.exit(1); }
  console.log(JSON.stringify(stu, null, 2));
  process.exit(0);
}

if (checkOnly) {
  const batch = processFile(inputPath);
  const target = caseFilter ? batch.cases.find(c=>c.summary.case_id===caseFilter) : batch.cases[0];
  if (!target) { console.error(`Case ${caseFilter} not found`); process.exit(1); }
  console.log(JSON.stringify(buildCheckingLists(target.results), null, 2));
  process.exit(0);
}

console.log(`[engine] Processing ${inputPath} ...`);
const batch = processFile(inputPath);
let casesToWrite = batch.cases;
if (caseFilter) {
  casesToWrite = batch.cases.filter(c=>c.summary.case_id===caseFilter);
  if (casesToWrite.length===0) { console.error(`Case ${caseFilter} not found`); process.exit(1); }
  batch.cases = casesToWrite;
}
const outAbs = path.resolve(outDir);
writeOutputs(outAbs, batch);
console.log(`[engine] Done. Cases: ${casesToWrite.length} Students: ${casesToWrite.reduce((a,c)=>a+c.summary.total,0)}`);
console.log(`[engine] Output: ${outAbs}`);
for (const c of casesToWrite) {
  console.log(`  ${c.summary.case_id}: ${c.summary.total} students, passed ${c.summary.passed}, failed ${c.summary.failed}, lists O:${c.checkingLists.optional.length} P:${c.checkingLists.practical.length} A:${c.checkingLists.absent.length}`);
}
