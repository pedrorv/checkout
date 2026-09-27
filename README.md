# Checkout

A self-service checkout for a snack bar counter kiosk. Customers browse the menu, build an order, pay, and walk away, with no cashier. The React web app talks to an Express + Postgres API, and the whole stack runs in Docker with one command.

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

## The customer flow

Menu (categories, stock left, product details) → cart (change quantities, clear the cart) → your details → payment → confirmation, which returns to the menu on its own after 15 seconds. If the order has items prepared at the counter, the confirmation shows a pickup code and stays up for 60 seconds.

## Key decisions

- **Two kinds of items: counter and self-serve.** Expensive or prepared items (burgers, hot dogs, fresh lemonade) are stock-controlled and collected at the counter with a 4-character pickup code. Items on display (drinks, packaged sweets) are taken by the customer and only registered on the kiosk; they are not stock-controlled and never sell out. Each product has a `pickupMode`, and each order item keeps a copy of it, so releasing stock always matches what was reserved even if a product changes mode later.
- **The cart is a pending order on the server.** The first item added creates the order and reserves stock for its counter items in a transaction. The customer can't reach the payment step for something that sold out while they were browsing, and stock stays correct across several kiosks.
- **Abandoned orders expire.** A background job cancels orders idle for 15 minutes and returns their stock, so someone walking away mid-order can't hold stock forever.
- **Retries are safe.** Creating an order takes an idempotency key that is kept across ambiguous failures, so a flaky connection can't create two orders. After a timeout during payment, the app checks the order before showing an error, so a customer whose card was charged always sees the confirmation.
- **Failures leave the customer with a next step.** A declined card leaves the order pending so they can try another card. Out of stock, network errors, and an empty menu each have their own message and a retry, so nobody is stuck on a blank screen.
- **Pickup codes are short and unique per day.** Codes are 4 characters from `0-9A-Z`, issued at payment only when the order has counter items. They are stored as `YYYY-MM-DD-CODE` under a unique index (UTC date), and a clash retries with a new code.
- **Nothing lingers between customers.** The confirmation page shows only the first name, the last four card digits, and the pickup code if there is one. It resets on its own and clears the navigation history and the app's cache, so the next person can't see the previous customer's details.
- **Only the last four card digits are stored.** Card details are checked on the client and on the server; the full number is never saved.

## Known limitations and next steps

- **Typing card details stands in for a card terminal.** See the note in [How to manually test a payment flow](#how-to-manually-test-a-payment-flow).
- **Anyone with an order ID can read the order.** There are no accounts; in production the receipt would be emailed and there would be no public read endpoint.
- **No admin tools.** Managing stock and the menu is done through `make seed`.

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
