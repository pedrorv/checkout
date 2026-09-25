# Web App Architecture

## Purpose

This document describes how `web` is structured and how its modules are expected to work together.

Use it as a blueprint for creating or maintaining frontend apps in this project.

The focus here is architectural shape and responsibility boundaries, not implementation technology.

This blueprint mirrors `api/ARCHITECTURE.md`. The layer names differ, but the
responsibility boundaries are the same idea: features own behavior, `app`
assembles, `shared` supports.

## High-Level Shape

`web` is organized as a feature-first SPA with a small set of cross-cutting layers around it.

The main areas are:

- `src/main.tsx`: app startup (mounts providers and the router)
- `src/app/`: application wiring (providers, router mounting)
- `src/features/`: product capabilities
- `src/shared/`: reusable primitives shared across features
- `tests/`: unit and component coverage

At a high level:

1. The app starts in `src/main.tsx`
2. Providers are assembled in `src/app/providers.tsx` (QueryClient, Router)
3. Top-level routes are mounted from `src/app/router.tsx`
4. Each feature owns its own routes, hooks, API modules, and screens
5. Shared concerns live in `src/shared`

## Domain Model: Cart IS a Pending Order

This is a self-checkout snack bar. There is no client-side cart:

- the moment the user registers an item, stock is deducted and a pending
  order exists on the server (`POST /orders` decrements stock transactionally)
- updating items restores then re-decrements stock (`PATCH /orders/:id`)
- abandoning the cart restores stock (`POST /orders/:id/cancel`)
- paying completes the order (`POST /orders/:id/pay`)

Consequences:

- **cart state is server state**: items, totals, and status are `OrderDTO`
  cached by TanStack Query — never a client store
- **the only client state is a session pointer**: `useOrderStore`
  (`orders.store.ts`) holds `activeOrderId`, nothing else
- **the cart is a screen, not a feature**: `CartScreen` lives in
  `features/orders/screens/` and composes the feature's own hooks
  (create → update → pay/cancel) around the session pointer

## Request Lifecycle

The dominant data flow is:

1. `src/main.tsx` mounts `AppProviders` and `AppRouter`
2. `src/app/router.tsx` mounts feature route groups under top-level paths
3. A feature `*.routes.tsx` lazily loads its screens
4. A screen reads route params and calls a feature hook
5. A `hooks/*.query.ts` hook reads from the Query cache or fetches through
   `shared/api/http-client.ts` (`apiRequest`)
6. Mutations (`hooks/*.mutation.ts`) write to the server and update or invalidate
   affected query caches via their key getters

This gives the app a clear separation:

- routes define exposure
- hooks own fetching, data access, caching, and cache coordination
- screens render outcomes and adapt user events to hook calls

There is deliberately no feature `*.api.ts` layer: on the web, data access is
URL + `apiRequest`, thin enough to live inside the hook. The transport contract
(base URL, error normalization, `ApiError`) lives once in `shared`.

## Directory Map

```
web/src/
├── main.tsx
├── app/                    # ≈ api infra: assembles, owns no feature behavior
│   ├── providers.tsx       # QueryClientProvider + BrowserRouter
│   ├── router.tsx          # root route + feature route groups
│   ├── health.api.ts       # health check (mirrors api infra/app.ts)
│   └── screens/HomeScreen.tsx
├── features/
│   ├── menu/               # menu browsing (products, categories)
│   └── orders/             # order lifecycle: create/get/update/cancel/pay
│                           # + cart workflow (active order + session pointer)
├── shared/
│   ├── api/http-client.ts  # fetch wrapper: ApiError normalization
│   ├── config/env.ts       # shared constants and app config
│   ├── types/types.ts      # cross-feature shared types
│   └── index.ts
└── index.css               # tailwind entry
```

## Module Responsibilities

Each feature uses a consistent set of module types. Not every feature needs
every module, but the responsibilities are consistent.

### `hooks/`

Service + data access role. One hook per file, each co-exporting its cache
key getter.

- `use{Action}{Entity}.query.ts` — wraps `useQuery` for reads
- `use{Action}{Entity}.mutation.ts` — wraps `useMutation` for writes; owns
  cache updates/invalidation on success

Hooks call `apiRequest` from `@/shared` directly with their URL and typed
generics. Generic request concerns (query strings) use `toQuery` from
`@/shared`.

### Key Getters

Every hook file co-exports `getUse{Action}{Entity}Key(params?)`:

- with params → the precise cache key (`["feature", "entity", params]`)
- without params → the stable base key that prefix-matches every parametrized
  variant (invalidate-all)
- the base key must never embed `undefined` params; a getter called without
  params returns the bare base key only

Cross-feature invalidation imports key getters through the feature barrel:

```ts
// features/orders/hooks/useCreateOrder.mutation.ts
import { getUseListProductsKey } from "@/features/menu";

// stock changed on the server: invalidate all cached product lists
void queryClient.invalidateQueries({ queryKey: getUseListProductsKey() });
```

Rule of thumb:

- same-feature invalidation: precise, pass the params you know
- cross-feature invalidation: broad, call the getter without params

### `{feature}.types.ts`

Contract with the API: DTOs mirrored from the api package (trusted contract —
no runtime validation), payload types for writes, and the feature's error
code union mirroring the api's `*ErrorsCodes` enums.

### `{feature}.store.ts`

Client state, when a feature genuinely has some (Zustand). In this codebase
only `orders.store.ts` exists, and it holds a single session pointer.

### `{feature}.routes.tsx`

Thin, declarative route table for the feature. Lazily loads screens. No
business logic. Mounted by `app/router.tsx`.

Route groups return a fragment of `<Route>` elements — never a nested
`<Routes>`. There is exactly one `<Routes>` (in `app/router.tsx`);
react-router throws when `<Routes>` children contain anything other than
`<Route>`/`<Fragment>`.

### `screens/`

Controller role. Render outcomes and adapt user events to hook calls. Screens
stay thin; component composition lives in `components/` when a feature grows.

All exports are named — never `export default`. Lazy routes use
`lazyNamed` from `shared/utils/lazy-named.ts`.

### `index.ts`

Barrels everywhere (`export *`), mirroring the api convention. Every folder
that groups modules gets an `index.ts`: feature root, `hooks/`, `screens/`,
`app/`, and every `shared/` sub-folder.

One exception: the feature root barrel never re-exports `screens/`. Screens
are loaded exclusively through lazy routes (`lazyNamed(() => import("./screens"))`);
a static barrel edge would defeat code splitting and pull view modules into
every chunk that imports the feature.

Import rules:

- across features, app, tests, and shared layers: import through the owner's
  barrel (`import { useGetProduct } from "@/features/menu"`) — screens aside,
  which are imported from the owning feature's `screens/` barrel directly
- inside a feature: modules import each other directly from sibling files
  (`../menu.types`, `./useGetOrder.query`) — never through the feature's own
  root barrel, which would risk view/hook import cycles
- every export is named; `export default` is never used

## State Contract

| State | Owner | Examples |
|---|---|---|
| Server state | TanStack Query cache | orders, products, categories |
| Session state | Zustand (`orders.store.ts`) | `activeOrderId` |
| URL state | react-router | route params, current screen |

If data lives in Postgres, it belongs in the Query cache — never in a client
store. Client stores hold only pointers or UI state that survives no reload.

## Cache Invalidation Contract

Because cart writes mutate inventory:

| Mutation | Stock effect | Invalidation |
|---|---|---|
| `createOrder` | decrement | order + all product lists/details |
| `updateOrder` | restore + decrement | order + all product lists/details |
| `cancelOrder` | restore | order + all product lists/details |
| `payOrder` | none | order only |

Menu queries never write; no invalidation flows from `menu → orders`.

`useCreateOrder` requires an idempotency key the api validates as UUIDv4 —
generate with `crypto.randomUUID()` at the call site (per attempt, not per
session). `useUpdateOrder` requires at least one payload field; the api
rejects empty PATCH bodies with 400.

## Shared Layer

`src/shared/` contains primitives reused across features:

- `api/http-client.ts`: `apiRequest`, `ApiError` (normalized error codes)
- `utils/lazy-named.ts`: `lazyNamed` for named-export lazy routes
- `utils/to-query.ts`: `toQuery` for query-string building
- `types/types.ts`: shared cross-feature types
- `config/env.ts`: shared constants and app config

What belongs in `shared`: something used by more than one feature, conceptually
cross-cutting, or generic enough to not be owned by one domain.

What stays out: logic used by one feature, feature-domain helpers, abstractions
for hypothetical reuse. Keep code in the feature until there is a real second
use case.

## Testing Strategy

`tests/` is organized by test type and then by feature, mirroring the api:

- `tests/unit/`: stores, key getters, pure logic
- `tests/component/`: screens and hook-driven rendering

Blueprint rules:

- unit test stores, key getters, and pure helpers
- component test screens through their public rendering surface

## Recommended Feature Template

Minimum useful shape:

- `{feature}.routes.tsx`
- `hooks/` (one hook per file)
- `screens/`
- `index.ts`

Add only when earned:

- `{feature}.types.ts` — when the feature has API contracts
- `{feature}.errors.ts` — when the feature has user-facing error messages
- `{feature}.store.ts` — when the feature has genuine client state
- `components/` — when screens grow composition worth extracting

## How To Add a New Feature

1. Create a folder under `src/features/`
2. Add the feature's `routes`, `hooks`, `screens`, and `index` modules
3. Mount the feature routes from `src/app/router.tsx`
4. Import from other features only through their barrels
5. Add unit tests for stores and key getters; component tests for screens

When deciding whether to add more structure, prefer the smallest working shape.

## Maintenance Heuristics

- hooks own cache coordination and data access; screens own rendering
- keep screens thin: if a screen accumulates decisions, move them into hooks
- do not move code into `shared` before a real second use case exists
- do not create a feature for something that is not a product capability:
  landing pages, health checks, and app-level shells belong in `app/`
- key getters are the only public cache contract; never hand-build another
  feature's key inline
- if a mutation changes inventory, invalidate menu keys — that coupling is
  documented in the cache contract above

## Summary

`web` is structured around features, with `app` and `shared` supporting them.

The most important rules to preserve:

- `app` assembles; it owns app-level shell and wiring, not feature behavior
- `features` own behavior and expose it through barrels
- server state lives in the Query cache; client stores hold only session pointers
- the cart is a pending order, not a client-side data structure; the cart
  workflow lives inside `features/orders`
- key getters are the cross-feature cache contract