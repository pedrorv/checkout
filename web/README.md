# Web App

`web` is the React frontend for the checkout POC: a self-checkout snack bar UI. Customers browse the menu (`/`), build a cart (`/cart`), and track an order (`/orders/:id`).

There is no client-side cart: registering an item creates a *pending order* on the api, and the cart screen edits that order (see [ARCHITECTURE.md](./ARCHITECTURE.md) for the domain model). Server state lives in the TanStack Query cache; the only client store is the active-order session pointer.

UI stack: React 19, React Router, TanStack Query, Zustand, Tailwind CSS 4, Radix UI primitives, and sonner for toasts.

## Commands

```bash
pnpm --filter @checkout/web dev      # vite dev server (uses ../.env.dev for WEB_PORT/VITE_API_URL)
pnpm --filter @checkout/web build    # production build
pnpm --filter @checkout/web preview  # preview the build
pnpm --filter @checkout/web test     # vitest (unit: stores, key getters, screens)
```

In Docker, the web service starts via `make up` at http://localhost:8000.

## Structure

- `src/main.tsx`: app entry — mounts `AppProviders` (QueryClient, Router, Toaster) and `AppRouter`
- `src/app/`: application wiring — `providers.tsx`, `router.tsx`
- `src/features/menu/`: menu browsing (categories, products)
- `src/features/orders/`: order lifecycle and cart workflow (create, get, update, cancel, pay)
- `src/shared/`: cross-cutting primitives — `api/http-client.ts`, UI components, theme store, utils, config
- `tests/`: unit coverage (stores, key getters, pure logic, screens — `fetch` is always mocked, no real API calls)

Feature layout, module responsibilities, and the cache invalidation contract are documented in [ARCHITECTURE.md](./ARCHITECTURE.md).

## Related Docs

- [../README.md](../README.md): project overview
- [../api/README.md](../api/README.md): API service overview
- [ARCHITECTURE.md](./ARCHITECTURE.md): web architecture blueprint
