# API Service

This document covers the current state of `api`.

## Overview

`api` is the service proving the architecture: feature-first organization, the request flow (routes → validate → controller → service → repository), the testing setup, and the docs layer.

The service is versioned as `@checkout/api` and runs as a containerized service in local development.

## Current Scope

The current API surface includes:

- `GET /health`: health check (defined in `src/infra/app.ts`)
- `GET /docs`: Swagger UI for the OpenAPI document (development only)
- `GET /menu/categories`: list categories (position-ordered, cursor pagination)
- `GET /menu/products`: list products, optional `category` slug filter
- `GET /menu/products/:id`: get a product by id
- `POST /orders`: create a pending order (decrements stock transactionally, requires a UUIDv4 idempotency key)
- `GET /orders/:id`: get an order by id
- `PATCH /orders/:id`: update order items (restores then re-decrements stock)
- `POST /orders/:id/cancel`: cancel an order (restores stock)
- `POST /orders/:id/pay`: pay an order (completes it via the mock payment service)

Features live in `src/features/`: `menu/` (browsing) and `orders/` (order lifecycle and cart workflow — see [ARCHITECTURE.md](./ARCHITECTURE.md) for the module layout they follow).

## Important Paths

- `api/src/main.ts`: service bootstrap and lifecycle
- `api/src/infra/`: app wiring, top-level router, middleware, startup dependencies
- `api/src/features/`: feature-owned routes, controllers, services, repositories, validators, and related modules (`menu/` and `orders/`)
- `api/src/shared/`: shared utilities, config, validation primitives, result types, and helpers
- `api/src/docs/`: OpenAPI documentation modules
- `api/prisma/`: schema, migrations, and seed script
- `api/tests/`: unit and integration tests
- [ARCHITECTURE.md](./ARCHITECTURE.md): detailed architecture blueprint for this service

## Runtime Config

Environment variables are injected by Docker compose via `env_file` (`.env.dev` for dev, `.env.test` for tests) — the api never loads host dotenv files in containers.

Key variables are documented in [`.env.example`](./.env.example) for reference. `DATABASE_URL` uses the `postgres` host inside compose.

## Local Development

To start the whole stack (postgres, migrations, api, web):

```bash
make up
```

To stop it:

```bash
make down
```

## Scripts

### Development

```bash
pnpm --filter @checkout/api dev
pnpm --filter @checkout/api build
pnpm --filter @checkout/api start
```

### Database and Migrations

Migrations always run through the Makefile (Docker compose wraps the database):

```bash
make migrate-create name=your_migration_name
make migrate-dev
make migrate-deploy
```

To seed the dev database with the snack bar menu:

```bash
make seed
```

## Testing

Run both suites in Docker (unit + integration against the `checkout-test` database):

```bash
make test
```

Unit tests need no database and can also run on the host:

```bash
pnpm --filter @checkout/api test:unit
```

Integration tests require the test database and must run via `make test`.

## Related Docs

- [ARCHITECTURE.md](./ARCHITECTURE.md): service-specific architecture and maintenance blueprint
- [../README.md](../README.md): project overview
