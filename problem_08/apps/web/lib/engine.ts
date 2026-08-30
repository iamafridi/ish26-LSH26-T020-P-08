// lib/engine.ts — Next.js server-side wrapper around pure domain (reuses src/*)
// This keeps the domain pure and lets Next.js API routes call it without extra HTTP hop.

import { processFile, buildCheckingLists as buildLists } from "../../../src/application/services/ProcessorService.js";
import { processCase } from "../../../src/domain/services/GpaEngine.js";
import { defaultRuleConfig } from "../../../src/domain/ports/RuleConfigPort.js";
import path from "node:path";

const INPUT_PATH = process.env.INPUT_PATH || path.resolve("D:/El Drago/P08_school_results_public.json");

// Cached in Next.js server (per worker)
let cached: ReturnType<typeof processFile> | null = null;

export function getBatch() {
  if (!cached) {
    cached = processFile(INPUT_PATH);
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
