# Checkout

A standalone POC repository (feature-first services, infra/features/shared
layers, request flows, testing setup, docs layer) in a minimal,
locally-runnable shape.

## Prerequisites

- Node 24 (use [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- pnpm (via corepack: `corepack enable`)
- Docker (with `docker compose`)

## Quickstart

```bash
pnpm install
make up
```

After `make up` finishes:

- web: http://localhost:8000 (Home shows "API: online")
- api: http://localhost:3000
- docs: http://localhost:3000/docs (Swagger UI)
- db: localhost:5432

Stop everything with `make down`.

## Commands

| Command | What it does |
|---|---|
| `make up` | Start postgres, migrations, api, and web (dev compose) |
| `make down` | Stop and remove the dev compose stack |
| `make test` | Run api unit + integration tests in Docker (test compose) |
| `make migrate-create name=<migration>` | Create a new Prisma migration (test DB) |
| `make migrate-dev` | Apply pending Prisma migrations (test DB) |
| `make migrate-deploy` | Deploy migrations (test DB) |
| `pnpm lint` | Biome check with auto-fix (whole project) |
| `pnpm format` | Biome format with auto-fix (whole project) |

## Testing notes

- Unit tests (`api/tests/unit/`) need no database — they cover validators and
  pure helpers.
- Integration tests (`api/tests/integration/`) run against the test database
  (`checkout-test`) and are executed via `make test` (Docker wraps the DB
  lifecycle). A guard in `tests/helpers` refuses to run integration tests
  against any other database.

## Documentation

- [api/README.md](./api/README.md): API service overview and commands
- [api/ARCHITECTURE.md](./api/ARCHITECTURE.md): API service architecture blueprint
- [web/README.md](./web/README.md): web app overview

## Scope

This is a POC: no CI, no infra, no prod deploys. Naming uses `@checkout/*`
with no env-var prefix, so spawning a real project from it is a
search-and-replace on "checkout".
