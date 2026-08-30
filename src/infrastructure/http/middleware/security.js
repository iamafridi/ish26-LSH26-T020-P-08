/**
 * security.js — senior-security-engineer: helmet, rate-limit, RBAC, validation.
 */

// Helmet-like headers (no dep)
export function helmetHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '0');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
}

// Simple in-memory sliding window rate limiter
const buckets = new Map(); // ip -> {count, reset}
export function rateLimit(req, res, { windowMs = 60000, max = 100 } = {}) {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local';
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || now > b.reset) b = { count: 0, reset: now + windowMs };
  b.count++;
  buckets.set(ip, b);
  res.setHeader('X-RateLimit-Limit', String(max));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, max - b.count)));
  if (b.count > max) {
    res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil((b.reset - now)/1000)) });
    res.end(JSON.stringify({ error: 'Too many requests', retryAfterMs: b.reset - now }));
    return false;
  }
  return true;
}
export function _resetRateLimit() { buckets.clear(); } // test hook

// RBAC stub: V1 checks Bearer token role, V2 verifies JWT
const TOKENS = { // demo tokens — V2 replaces with OIDC
  'admin-token': { role: 'admin', sub: 'admin@school.local' },
  'teacher-token': { role: 'teacher', sub: 'teacher@school.local' },
  'student-token': { role: 'student', sub: 'student@school.local' },
};
export function authGuard(req, res, { roles = [] } = {}) {
  if (roles.length === 0) return { ok: true }; // public
  const auth = req.headers['authorization'] || '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const user = TOKENS[token];
  if (!user) {
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized: missing Bearer token (use admin-token/teacher-token/student-token demo)' }));
    return { ok: false };
  }
  if (roles.length && !roles.includes(user.role)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Forbidden: requires ${roles.join('|')}, got ${user.role}` }));
    return { ok: false };
  }
  return { ok: true, user };
}
