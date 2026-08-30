# Deployment Guide

## Supported runtime

- Node.js 20.9 or newer (Node.js 22 LTS recommended)
- npm 10 or newer
- Stateless Next.js deployment

## Local verification

```bash
npm ci
npm test
npm run build
npm run dev
```

Open `http://localhost:3000`. Health is available at
`http://localhost:3000/api/health`.

To generate the complete Problem 8 evaluation artifacts locally:

```bash
npm run process
```

This processes all 25 supplied cases and 1765 student records into `output/`.

## Vercel deployment

The repository includes `vercel.json`, and the Next.js configuration explicitly
includes the official Problem 8 dataset and rule configuration in serverless output
tracing.

### Dashboard workflow

1. Import the GitHub repository into Vercel.
2. Leave the project root at the repository root.
3. Framework preset: Next.js.
4. Install command: `npm install`.
5. Build command: `npm run build`.
6. Output directory: `apps/web/.next`.
7. Deploy and verify `/api/health`, `/`, `/ledger`, `/checking`, and `/admin`.

### CLI workflow

```bash
npx vercel@latest
npx vercel@latest --prod
```

The web deployment is stateless. Rule changes made through the admin console are
held in the active serverless instance and should be treated as a demonstration.
For durable rule administration, store versioned rules in a database or managed
configuration service and replace the in-memory adapter.

## Docker deployment

```bash
docker build -t resultiq:1.0.0 .
docker run --rm -p 3000:3000 resultiq:1.0.0
```

Verify `http://localhost:3000/api/health` after startup.

## Release checklist

- [ ] `EVENT.md` identifies team `LSH26-T020` and problem `P08`.
- [ ] `evaluation-manifest.json` is valid JSON and lists all required features.
- [ ] `npm test` passes all 41 tests.
- [ ] `npm run build` completes without errors or warnings.
- [ ] `npm audit --audit-level=moderate` reports zero vulnerabilities.
- [ ] `npm run process` produces 25 case outputs and 1765 traces.
- [ ] Dashboard, ledger, checking lists, admin, docs, CSV, and trace routes respond.
- [ ] Mobile navigation and horizontally scrollable result tables are usable.
- [ ] `LICENSES.md`, `LICENSE`, and submission documentation are present.
