/**
 * health.js — SRP: health route, formerly inline in server.js:54
 */
export function healthHandler(batch) {
  return { status: 'ok', version: '1.0.0', uptime: process.uptime(), cases: batch.globalSummary.totalCases };
}
