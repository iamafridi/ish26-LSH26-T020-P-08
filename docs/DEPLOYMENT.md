# Deployment — From Local to Production

## Local Quickstart (Stateless)

```bash
cd problem_08
npm install
npm test                          # 31 tests, 1765 rows
node src/adapters/cli.js ../P08_school_results_public.json --output ./output   # batch
node src/infrastructure/server.js # API at http://localhost:3000 + frontend at /index.html
# or: npm run dev:api
```

Open `http://localhost:3000` → Office console (needs API running, else falls back to static `output/`).

CLI options:
```bash
node src/adapters/cli.js ../P08_school_results_public.json --output ./output --case PUB-01
node src/adapters/cli.js ../P08_school_results_public.json --output ./output --case PUB-01 --student S005
node src/adapters/cli.js ../P08_school_results_public.json --check-only --case PUB-01
```

## Docker (Production Image)

```bash
docker build -t gpa-engine:1.0.0 .
docker run -p 3000:3000 -v $(pwd)/P08_school_results_public.json:/app/P08_school_results_public.json:ro -v $(pwd)/output:/app/output gpa-engine:1.0.0
# healthcheck: wget -qO- http://localhost:3000/health
```

## docker-compose

```bash
docker-compose up --build           # api only (stateless)
docker-compose --profile with-db up # + postgres + redis for V2
docker-compose down -v
```

`docker-compose.yml` already defines `db` (postgres:16) and `redis` (7) under `profiles: ["with-db"]`.

## Environment

See `.env.example`. Key vars:
- `PORT` (3000), `INPUT_PATH` (/app/P08_school_results_public.json), `NODE_ENV`.

## CI (GitHub Actions sketch)

```yaml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm, cache-dependency-path: problem_08/package.json }
      - run: npm ci
        working-directory: problem_08
      - run: npm test
        working-directory: problem_08
      - run: node src/adapters/cli.js ../P08_school_results_public.json --output ./output
        working-directory: problem_08
  docker:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t gpa-engine:${{ github.sha }} problem_08
      - run: docker run -d -p 3000:3000 gpa-engine:${{ github.sha }} && sleep 3 && curl -f http://localhost:3000/health
```

## Production Path (Fly.io / Railway / Render / AWS ECS)

1. Push image to registry.
2. Set `INPUT_PATH` to mounted volume or S3 path (V2: stream from S3).
3. Put CloudFront / NGINX in front, TLS, rate-limit.
4. Add OIDC auth guard on `PUT /api/config/rules` and `POST /api/calculate`.
5. Enable DB: run `npx prisma migrate deploy`, point `DATABASE_URL`, enable RLS, backups PITR.
6. Observability: OpenTelemetry → Prometheus/Grafana + Loki + Sentry; alert on `health` failure and `practicalFailed` spikes.

## Release Checklist (R-29)

- [ ] `npm test` green (31/31)
- [ ] `node src/adapters/cli.js` produces 25 case outputs, 1765 traces
- [ ] `curl /health` ok
- [ ] Frontend tabs render, trace drawer shows failureCause for high-average fails
- [ ] `checking_lists.json` counts match CSV and table filters
- [ ] Docker image builds, healthcheck passes
- [ ] Docs updated: PRD, ARCHITECTURE, RULE_ENGINE, API_SPEC, DATA_MODEL, DEPLOYMENT
