# Checkout

A standalone POC repository (feature-first services, infra/features/shared layers, request flows, testing setup, docs layer) in a minimal, locally-runnable shape.

## Prerequisites

- Node 24 (use [nvm](https://github.com/nvm-sh/nvm): `nvm use`)
- pnpm (via corepack: `corepack enable`)
- Docker (with `docker compose`)

## Quickstart

```bash
pnpm install
make up
```

`make up` applies migrations and seeds the snack bar menu before the api starts, so the menu is ready on first run. Startup seeding is safe to repeat: it upserts the menu but never overwrites existing stock.

After `make up` finishes:

- web: http://localhost:8000 (menu and self-checkout UI)
- api: http://localhost:3000
- docs: http://localhost:3000/docs (Swagger UI)
- db: localhost:5432

Stop everything with `make down`.

## Commands

| Command | What it does |
|---|---|
| `make up` | Start postgres, migrations + menu seed, api, and web (dev compose) |
| `make down` | Stop and remove the dev compose stack |
| `make test` | Run api (unit + integration) and web (vitest) tests in Docker (test compose) |
| `make psql` | Open a `psql` shell on the dev database (stack must be running) |
| `make seed` | Re-seed the menu and reset stock to the seeded quantities |
| `make migrate-create name=<migration>` | Create a new Prisma migration (test DB) |
| `make migrate-dev` | Apply pending Prisma migrations (test DB) |
| `make migrate-deploy` | Deploy migrations (test DB) |
| `pnpm lint` | Biome check with auto-fix (whole project) |
| `pnpm format` | Biome format with auto-fix (whole project) |

## How to manually test a payment flow

**Card entry is a stand-in for a card reader.** A real counter kiosk would take payment through a card terminal (tap, chip, or wallet), and the customer would never type card details into the screen. Typed card details keep the flow testable end to end without hardware; in production, the pay step would start a terminal transaction and `POST /orders/:id/pay` would carry the terminal's authorization result instead of raw card data.

Payments are processed by a mock card service — nothing is ever charged. A paid order stores only `paidAt` and the card's last four digits. The full API contract lives in Swagger at http://localhost:3000/docs.

To exercise the payment flow in the web UI (`/cart` → Pay):

- Approved: use any Luhn-valid, non-expired card — for example number `4242 4242 4242 4242`, any future expiry, CVC `123`. The order completes and the confirmation screen appears.
- Declined: use number `4000 0000 0000 0002` (Luhn-valid, but the mock processor rejects it). A "card was declined" toast appears, the order stays pending, and you can retry with another card.
- Rejected before charging: a Luhn-invalid number (e.g. `4242 4242 4242 4241`), a past expiry date, or a malformed CVC are refused by validation (client- and server-side) and never reach the mock processor.

## Testing notes

- api unit tests (`api/tests/unit/`) need no database — they cover validators and pure helpers.
- api integration tests (`api/tests/integration/`) run against the test database (`checkout-test`) and are executed via `make test` (Docker wraps the DB lifecycle). A guard in `tests/helpers` refuses to run integration tests against any other database.
- web tests (`web/tests/unit/`) run via vitest with `fetch` always mocked — no database and no real API calls.

## Documentation

- [api/README.md](./api/README.md): API service overview and commands
- [api/ARCHITECTURE.md](./api/ARCHITECTURE.md): API service architecture blueprint
- [web/README.md](./web/README.md): web app overview
- [web/ARCHITECTURE.md](./web/ARCHITECTURE.md): web app architecture blueprint
