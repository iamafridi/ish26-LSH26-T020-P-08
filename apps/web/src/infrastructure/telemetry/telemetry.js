/**
 * telemetry.js — Structured logs + OpenTelemetry stub (V2: @opentelemetry/sdk-node).
 * Lightweight runtime telemetry helpers.
 */
export function log(level, msg, fields = {}) {
  const entry = { level, msg, at: new Date().toISOString(), ...fields };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}
export function info(msg, fields) { log('info', msg, fields); }
export function warn(msg, fields) { log('warn', msg, fields); }
export function error(msg, fields) { log('error', msg, fields); }

// Trace stub: wraps fn with timing
export function traced(name, fn) {
  return async (...args) => {
    const start = performance.now();
    try { const r = await fn(...args); info(`${name} ok`, { durationMs: +(performance.now()-start).toFixed(2) }); return r; }
    catch (e) { error(`${name} fail`, { durationMs: +(performance.now()-start).toFixed(2), error: e.message }); throw e; }
  };
}
