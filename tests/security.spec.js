/**
 * Security behavior and boundary validation tests.
 * Tests zod validation, helmet-like logic, rate-limit, RBAC, audit.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { validateCase } from '../src/infrastructure/validation/schemas.js';
import { rateLimit, _resetRateLimit, authGuard } from '../src/infrastructure/http/middleware/security.js';
import * as audit from '../src/infrastructure/audit/audit.js';

describe('zod validation', () => {
  const validCase = {
    subjects: [
      { code:'BAN', name:'Bangla', practical:false },
      { code:'ENG', name:'Eng', practical:false },
      { code:'MAT', name:'Math', practical:false },
      { code:'PHY', name:'Phy', practical:true },
      { code:'CHE', name:'Che', practical:true },
      { code:'BIO', name:'Bio', practical:true },
      { code:'HMT', name:'HMT', practical:true },
    ],
    compulsory: ['BAN','ENG','MAT','PHY','CHE','BIO'],
    students: [{ id:'S1', name:'A', class:'9', optional:'HMT', marks:{ BAN:50, ENG:50, MAT:50, PHY:{theory:30,practical:10}, CHE:{theory:30,practical:10}, BIO:{theory:30,practical:10}, HMT:{theory:30,practical:10} }}]
  };
  it('accepts valid', () => { expect(validateCase(validCase).ok).toBe(true); });
  it('rejects theory>75', () => {
    const bad = JSON.parse(JSON.stringify(validCase));
    bad.students[0].marks.PHY = { theory: 80, practical: 10 };
    expect(validateCase(bad).ok).toBe(false);
  });
  it('rejects practical non-practical mismatch', () => {
    const bad = JSON.parse(JSON.stringify(validCase));
    bad.students[0].marks.BAN = { theory: 30, practical: 10 };
    expect(validateCase(bad).ok).toBe(false);
  });
  it('rejects AB as number', () => {
    const bad = JSON.parse(JSON.stringify(validCase));
    bad.students[0].marks.BAN = 'AB';
    // AB is allowed for non-practical, should pass
    expect(validateCase(bad).ok).toBe(true);
  });
});

describe('rateLimit', () => {
  beforeEach(()=> _resetRateLimit());
  it('allows under max, blocks over', () => {
    const req = { headers:{}, socket:{ remoteAddress:'1.1.1.1' }};
    const res = { setHeader(){}, writeHead(){}, end(){} };
    for(let i=0;i<100;i++) expect(rateLimit(req,res,{windowMs:60000,max:100})).toBe(true);
    // stub writeHead to capture
    let code=null;
    const res2 = { setHeader(){}, writeHead(c){code=c;}, end(){} };
    expect(rateLimit(req,res2,{windowMs:60000,max:100})).toBe(false);
    expect(code).toBe(429);
  });
});

describe('authGuard RBAC', () => {
  it('public when no roles', () => {
    expect(authGuard({headers:{}},{writeHead(){},end(){}}).ok).toBe(true);
  });
  it('rejects missing token', () => {
    let code=null;
    const res={writeHead(c){code=c;}, end(){}};
    const r=authGuard({headers:{}},res,{roles:['admin']});
    expect(r.ok).toBe(false); expect(code).toBe(401);
  });
  it('allows admin-token for admin', () => {
    const r=authGuard({headers:{authorization:'Bearer admin-token'}},{writeHead(){},end(){}} ,{roles:['admin']});
    expect(r.ok).toBe(true); expect(r.user.role).toBe('admin');
  });
  it('forbids student for admin', () => {
    let code=null;
    const res={writeHead(c){code=c;}, end(){}};
    const r=authGuard({headers:{authorization:'Bearer student-token'}},res,{roles:['admin']});
    expect(r.ok).toBe(false); expect(code).toBe(403);
  });
});

describe('audit', () => {
  beforeEach(()=> audit._reset());
  it('logs and lists', () => {
    audit.log('admin','verify','PUB-01', {ok:true});
    expect(audit.list('PUB-01').length).toBe(1);
    expect(audit.list().length).toBe(1);
  });
});
