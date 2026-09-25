# AGENTS.md

## Architecture

| Package | Path | Stack |
|---|---|---|
| `@checkout/web` | `web/` | React 19 + TS + Vite |
| `@checkout/api` | `api/` | Express 5 + TS + Prisma 7 + Postgres |

The API follows a feature-first layout with `infra/`, `features/`,
`shared/`, and `docs/` layers. See [api/ARCHITECTURE.md](./api/ARCHITECTURE.md)
for the full blueprint.

## Commands

```bash
make up                 # start postgres, db-migrations, api, web
make down               # stop the dev stack
make test               # unit + integration tests in Docker (never pipe output)
```

Lint/format is Biome, run from the repo root:

```bash
pnpm biome check --write ./api   # scoped to api
pnpm biome check --write ./web   # scoped to web
pnpm lint                        # whole project
```

## Conventions

- Biome for lint/format: 2-space indent, double quotes, LF line endings
- Node 24 (`.nvmrc`), pnpm workspaces
- Tracked env files at root: `.env.dev` (dev ports/DB) and `.env.test`
  (offset ports, `POSTGRES_DB=checkout-test`) — compose injects them via
  `env_file`; the api never loads host dotenv files in containers

## Safety

- No infra, no CI, no prod deploys from this POC
- Never run prisma migrations directly on the host — always through the
  Makefile targets (they wrap Docker compose)

## Gotchas

- `api/jest.config.ts` MUST stay a `.ts` file — do not rename it to `.js`
- Integration tests require `NODE_OPTIONS=--experimental-vm-modules` (the
  test script in `api/package.json` already sets it)
- Prisma migrations only via `make migrate-create` / `make migrate-dev` /
  `make migrate-deploy`
- Run `pnpm --filter @checkout/api prisma:generate` (or `pnpm install`, which
  triggers postinstall) before building the api
- If a public endpoint changes, update the matching docs module in
  `api/src/docs/`
