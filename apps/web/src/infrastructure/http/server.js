/**
 * server.js — Enterprise-ready HTTP API (vanilla http, SRP split, SOLID).
 * - DIP: depends on RuleConfigPort + ProcessCasePort, not concrete file.
 * - SRP: delegates to routes/health,cases + middleware/security,validation,audit,telemetry.
 * Endpoints: same as V1 plus enterprise hardening.
 */
import http from 'node:http';
import fs from 'node:fs';
import url from 'node:url';
import path from 'node:path';
import { processCase } from '../../domain/services/GpaEngine.js';
import { processFile, buildCheckingLists } from '../../application/services/ProcessorService.js';
import { defaultRuleConfig } from '../../domain/ports/RuleConfigPort.js';
import { helmetHeaders, rateLimit, authGuard } from './middleware/security.js';
import { validateCase, ruleConfig as ruleSchema } from '../validation/schemas.js';
import * as audit from '../audit/audit.js';
import * as telemetry from '../telemetry/telemetry.js';
import { healthHandler } from './routes/health.js';
import * as cases from './routes/cases.js';

function resolveInputPath() {
  if (process.env.INPUT_PATH && fs.existsSync(process.env.INPUT_PATH)) return process.env.INPUT_PATH;
  const candidates = [
    path.resolve(process.cwd(), 'P08_school_results_public.json'),
    path.resolve(process.cwd(), '../P08_school_results_public.json'),
    path.resolve(process.cwd(), '../../P08_school_results_public.json')
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.resolve(process.cwd(), 'P08_school_results_public.json');
}

const PORT = process.env.PORT || 3000;
const INPUT_PATH = resolveInputPath();
let cached = null;
function getBatch() {
  if (!cached) cached = processFile(INPUT_PATH);
  return cached;
}

function json(res, status, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body),
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*'
  });
  res.end(body);
}
function notFound(res, msg='Not found') { json(res, 404, { error: msg }); }
function badRequest(res, msg, details) { json(res, 400, { error: msg, details }); }

const server = http.createServer(async (req, res) => {
  helmetHeaders(res);
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    });
    return res.end();
  }
  // Rate limit: 100 req/min global, 20/min for calculate
  const isCalculate = req.url.startsWith('/api/calculate');
  if (!rateLimit(req, res, { windowMs: 60000, max: isCalculate ? 20 : 100 })) return;

  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname || '/';
  const method = req.method || 'GET';
  telemetry.info('request', { method, pathname, ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress });

  // Health — public, SRP via routes/health
  if (pathname === '/health' && method === 'GET') {
    return json(res, 200, healthHandler(getBatch()));
  }

  // Config — GET public, PUT admin-only + zod + audit
  if (pathname === '/api/config/rules' && method === 'GET') {
    return json(res, 200, defaultRuleConfig.getRules());
  }
  if (pathname === '/api/config/rules' && method === 'PUT') {
    const auth = authGuard(req, res, { roles: ['admin'] });
    if (!auth.ok) return;
    let body = '';
    req.on('data', c=> {
      body+=c;
      if (body.length > 50_000) { res.writeHead(413); res.end(JSON.stringify({ error: 'Payload too large' })); req.destroy(); }
    });
    req.on('end', () => {
      try {
        const incoming = JSON.parse(body);
        const parsed = ruleSchema.safeParse(incoming);
        if (!parsed.success) return badRequest(res, 'Invalid rule config', parsed.error.flatten());
        const updated = defaultRuleConfig.update(parsed.data);
        audit.auditRuleUpdate(auth.user, updated.version);
        telemetry.info('rules.update', { user: auth.user.sub, version: updated.version });
        json(res, 200, { message: 'Rules updated', version: updated.version, rules: updated });
      } catch (e) { badRequest(res, e.message); }
    });
    return;
  }

  // Calculate — zod validated, rate-limited, audited
  if (pathname === '/api/calculate' && method === 'POST') {
    // Optional auth for enterprise: require teacher/admin for calculate
    // const auth = authGuard(req,res,{roles:['admin','teacher']}); if(!auth.ok) return;
    let body='';
    req.on('data', c=> {
      body+=c;
      if (body.length > 100_000) { res.writeHead(413); res.end(JSON.stringify({ error: 'Payload too large (100kb)' })); req.destroy(); }
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const caseData = payload.caseData || payload;
        const v = validateCase(caseData);
        if (!v.ok) return badRequest(res, 'Validation failed', v.error);
        const result = processCase(v.data);
        audit.log('anon', 'calculate', caseData.case_id || 'adhoc', { students: caseData.students.length });
        const lists = buildCheckingLists(result.results);
        json(res, 200, { summary: result.summary, checkingLists: lists, results: result.results });
      } catch (e) { badRequest(res, e.message); }
    });
    return;
  }

  // Audit log — admin only (new enterprise endpoint)
  if (pathname === '/api/audit' && method === 'GET') {
    const auth = authGuard(req, res, { roles: ['admin'] });
    if (!auth.ok) return;
    const target = parsed.query.target;
    return json(res, 200, { entries: audit.list(target) });
  }

  // Cases — delegate to SRP routes/cases.js
  if (pathname === '/api/cases' && method === 'GET') {
    return json(res, 200, cases.listCases(getBatch()));
  }
  const mResults = pathname.match(/^\/api\/cases\/([^\/]+)\/results$/);
  if (mResults && method === 'GET') {
    const data = cases.getResults(getBatch(), decodeURIComponent(mResults[1]));
    return data ? json(res, 200, data) : notFound(res, `Case ${decodeURIComponent(mResults[1])} not found`);
  }
  const mLists = pathname.match(/^\/api\/cases\/([^\/]+)\/checking-lists$/);
  if (mLists && method === 'GET') {
    const caseId = decodeURIComponent(mLists[1]);
    const type = parsed.query.type;
    if (type && !['optional','practical','absent'].includes(type)) return badRequest(res, 'type must be optional|practical|absent');
    const lists = cases.getCheckingLists(getBatch(), caseId);
    if (!lists) return notFound(res, `Case ${caseId} not found`);
    return json(res, 200, type ? { [type]: lists[type] } : lists);
  }
  const mTrace = pathname.match(/^\/api\/cases\/([^\/]+)\/trace\/([^\/]+)$/);
  if (mTrace && method === 'GET') {
    const stu = cases.getTrace(getBatch(), decodeURIComponent(mTrace[1]), decodeURIComponent(mTrace[2]));
    return stu ? json(res, 200, stu) : notFound(res, `Student ${decodeURIComponent(mTrace[2])} not found in ${decodeURIComponent(mTrace[1])}`);
  }
  const mCsv = pathname.match(/^\/api\/cases\/([^\/]+)\/csv$/);
  if (mCsv && method === 'GET') {
    const csv = cases.buildCsv(getBatch(), decodeURIComponent(mCsv[1]));
    if (!csv) return notFound(res, `Case ${decodeURIComponent(mCsv[1])} not found`);
    res.writeHead(200, { 'Content-Type':'text/csv', 'Content-Disposition': `attachment; filename="${decodeURIComponent(mCsv[1])}.csv"`, 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*', 'X-Content-Type-Options': 'nosniff' });
    return res.end(csv);
  }
  // Verify / Publish — enterprise state machine (new)
  if (pathname.match(/^\/api\/cases\/[^\/]+\/verify$/) && method === 'POST') {
    const auth = authGuard(req, res, { roles: ['admin','teacher'] });
    if (!auth.ok) return;
    const caseId = pathname.split('/')[3];
    audit.auditVerify(caseId, auth.user);
    return json(res, 200, { status: 'VERIFIED', caseId, by: auth.user.sub, at: new Date().toISOString() });
  }
  if (pathname.match(/^\/api\/cases\/[^\/]+\/publish$/) && method === 'POST') {
    const auth = authGuard(req, res, { roles: ['admin'] });
    if (!auth.ok) return;
    const caseId = pathname.split('/')[3];
    // Gate: check lists must be verified — V2 checks audit log
    const verified = audit.list(caseId).some(e=>e.action==='verify');
    if (!verified) return badRequest(res, 'Publish blocked: verify checking lists first (/verify)');
    audit.auditPublish(caseId, auth.user);
    return json(res, 200, { status: 'PUBLISHED', caseId, by: auth.user.sub });
  }

  // Frontend static
  if (method === 'GET' && pathname === '/') {
    res.writeHead(302, { Location: '/index.html' }); return res.end();
  }
  if (method === 'GET') {
    const webRoot = path.resolve('./apps/web');
    const filePath = path.join(webRoot, pathname === '/' ? 'index.html' : pathname.replace(/^\//,''));
    if (!filePath.startsWith(webRoot)) return notFound(res);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mime = { '.html':'text/html', '.js':'application/javascript', '.css':'text/css', '.json':'application/json', '.svg':'image/svg+xml' }[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mime, 'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*', 'X-Content-Type-Options': 'nosniff' });
      return res.end(fs.readFileSync(filePath));
    }
  }
  notFound(res, `Route ${method} ${pathname} not found. Try /health or /api/cases`);
});

server.listen(PORT, () => {
  telemetry.info('api.start', { port: PORT, input: INPUT_PATH, cors: process.env.CORS_ORIGIN || '*' });
  console.log(`[api] Listening on http://localhost:${PORT}`);
  console.log(`[api] Input: ${INPUT_PATH}`);
  console.log(`[api] Enterprise: helmet + rate-limit + RBAC + zod + audit + telemetry + /verify /publish /audit`);
});
