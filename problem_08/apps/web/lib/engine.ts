// lib/engine.ts — Next.js server-side wrapper around pure domain engine
import { processFile, buildCheckingLists as buildLists } from "../src/application/services/ProcessorService.js";
import { processCase } from "../src/domain/services/GpaEngine.js";
import { defaultRuleConfig } from "../src/domain/ports/RuleConfigPort.js";
import path from "node:path";
import fs from "node:fs";

function resolveInputPath(): string {
  if (process.env.INPUT_PATH && fs.existsSync(process.env.INPUT_PATH)) {
    return process.env.INPUT_PATH;
  }
  const candidates = [
    path.resolve(process.cwd(), "P08_school_results_public.json"),
    path.resolve(process.cwd(), "../../P08_school_results_public.json"),
    path.resolve(process.cwd(), "../P08_school_results_public.json"),
    path.resolve(process.cwd(), "problem_08/P08_school_results_public.json"),
    path.resolve("D:/El Drago/P08_school_results_public.json")
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
}

const INPUT_PATH = resolveInputPath();

// Cached in Next.js server (per worker)
let cached: ReturnType<typeof processFile> | null = null;

export function getBatch() {
  if (!cached) {
    if (fs.existsSync(INPUT_PATH)) {
      cached = processFile(INPUT_PATH);
    } else {
      // Safe fallback batch for build time
      cached = {
        cases: [],
        globalSummary: {
          total_cases: 0,
          total_students: 0,
          total_passed: 0,
          total_failed: 0,
          overall_pass_rate_pct: 0,
          average_gpa_all: 0,
          average_gpa_passed_only: 0
        }
      };
    }
  }
  return cached;
}

export function getCase(caseId: string) {
  const batch = getBatch();
  return batch.cases.find((c) => c.summary.case_id === caseId) || null;
}

export function resetCache() {
  cached = null;
}

export { buildLists as buildCheckingLists, processCase, defaultRuleConfig };
export function getRules() { return defaultRuleConfig.getRules(); }
