# API Service Architecture

## Purpose

This document describes how `api` is structured and how its modules are expected to work together.

Use it as a blueprint for creating or maintaining backend services in this project.

The focus here is architectural shape and responsibility boundaries, not implementation technology.

## High-Level Shape

`api` is organized as a feature-first HTTP service with a small set of cross-cutting layers around it.

The main areas are:

- `src/main.ts`: service startup and shutdown lifecycle
- `src/infra/`: application wiring and runtime concerns
- `src/features/`: domain and business capabilities
- `src/shared/`: reusable primitives shared across features
- `src/docs/`: API documentation model for public endpoints
- `tests/`: unit and integration coverage

At a high level:

1. The process starts in `src/main.ts`
2. The app is assembled in `src/infra/app.ts`
3. Top-level routes are mounted from `src/infra/http/router.ts`
4. Each feature owns its own routes, controllers, validators, and business logic
5. Shared concerns live in `src/shared`
6. Public API documentation is maintained in `src/docs`

## Request Lifecycle

The dominant request flow in this service is:

1. `src/main.ts` starts the app and runtime dependencies (migrations, Prisma)
2. `src/infra/app.ts` registers global middleware, health endpoints, docs routes, and the HTTP router
3. `src/infra/http/router.ts` mounts feature routers under top-level paths
4. A feature `*.routes.ts` file declares the endpoint and attaches the controller handler
5. A feature `*.controller.ts` validates input via `withValidation` and receives typed validated values
6. A feature `*.service.ts` executes business rules and orchestration
7. A feature `*.repository.ts` or feature-scoped adapter service performs data access or external IO
8. The controller converts the service result into the HTTP response

This gives the service a clear separation:

- routes define exposure
- controllers validate input and adapt HTTP to application logic
- services own business decisions
- repositories and adapters own persistence or external integration details

## Directory Map

### Top Level

- `src/`: runtime source code
- `tests/`: unit and integration tests
- `prisma/`: schema and migration support
- `Dockerfile`, `docker-compose*.yaml` (at the repo root), `Makefile` (at the repo root): local and container execution support
- `.env.example`: environment configuration reference

### `src/`

- `main.ts`
- `infra/`
- `features/`
- `shared/`
- `docs/`

### `src/features/`

Current features: `menu/` and `orders/`. Each feature owns the modules needed for that domain rather than splitting the whole codebase by technical layer first.

## Module Responsibilities

The service uses a recurring set of module types. Not every feature needs every module, but the responsibilities are consistent.

### `index.ts`

Purpose:

- feature barrel export
- single import surface for the rest of the service

Use when:

- the feature exposes multiple modules that other parts of the service import

Avoid turning it into logic-bearing code. It should stay a simple export layer.

### `*.routes.ts`

Purpose:

- define endpoint paths
- compose middleware in the correct order
- attach controller handlers

Routes should stay thin and declarative. They should not contain business rules.

Typical responsibilities:

- create router instance
- attach the correct controller function

### `*.controller.ts`

Purpose:

- act as the HTTP adapter for the feature
- translate request input into service calls
- translate service outcomes into status codes and response bodies

Typical responsibilities:

- read typed validated input from `withValidation`
- call the corresponding feature service
- map service result kinds to HTTP responses

Controllers are intentionally thin. They should not be the place where core business rules accumulate.

### `*.service.ts`

Purpose:

- own business logic
- orchestrate workflows across repositories, mappers, and external adapters
- enforce domain rules and state transitions

Typical responsibilities:

- authorization checks
- existence and ownership checks
- duplicate prevention
- state machine transitions
- multi-step workflows
- combining data from more than one source

This is the main decision-making layer in the service.

### `*.repository.ts`

Purpose:

- isolate data access
- hide storage query details from controllers and most service code

Typical responsibilities:

- lookup by ids or unique fields
- create, update, and delete operations
- paginated or filtered reads
- storage-shaped query details and include/select configuration

Repository conventions:

- repository methods should accept a single `params` object
- Prisma-backed repository methods should accept `options?: { client?: TransactionClient }` as a second parameter
- services may pass `options.client` to make multiple repository calls participate in the same transaction
- repository methods with multiple Prisma operations should use the injected client when present and otherwise create their own `prisma.$transaction(...)`
- transaction handling and query details should stay inside the repository layer

Repositories should not return HTTP responses or embed transport behavior.

### `*.validator.ts`

Purpose:

- define request contracts
- validate and normalize request input before controller logic runs

Typical responsibilities:

- declare schemas for `body`, `params`, `query`, `headers`, and `cookies`
- reuse shared validation primitives where appropriate
- enforce endpoint-specific constraints

This service validates requests before entering business logic. Controllers assume validated input exists.

### `*.errors.ts`

Purpose:

- centralize user-facing error messages for a feature
- define the feature's public error codes (`*ErrorsCodes`, UPPERCASE strings like `OUT_OF_STOCK`) that controllers send in error bodies

Every error response has the shape `{ code, message }`: `code` is the machine-readable `*ErrorsCodes` value clients branch on; `message` is the human-readable text clients display. Keep codes stable — rewording a message is safe, renaming a code is a breaking change.

This keeps response text and wire codes consistent and avoids scattering literal strings across controllers.

### `*.result-kinds.ts`

Purpose:

- define named business outcomes for non-success paths

These are used by services to return explicit, typed outcomes that controllers can map to HTTP.

This pattern is important in this service: business failures are represented explicitly rather than mixed into controller code.

### `*.dto.ts`

Purpose:

- define stable output shapes used at feature boundaries

DTOs are useful when the outward response shape deserves a named contract that is separate from storage records.

### `*.mapper.ts`

Purpose:

- translate records or internal objects into DTOs

Use a mapper when output shaping becomes non-trivial or repeated. This prevents controllers and services from assembling responses inline everywhere.

### `*.types.ts`

Purpose:

- hold feature-local domain types, enums, and supporting type definitions

Keep types in the feature when they are owned by that feature's model.

### Feature-Scoped Adapter Services

Purpose:

- wrap an external capability that belongs primarily to one feature

Use this pattern when a dependency is important to a feature's behavior but is not a generic, cross-feature concern.

## Infrastructure Layer

`src/infra/` is responsible for service wiring and runtime concerns.

It should answer questions like:

- how is the app assembled?
- which global middleware runs for every request?
- which top-level routers are mounted?
- how are runtime dependencies started and stopped?

Key responsibilities in this service:

- `app.ts`
  - builds the app
  - registers global middleware (json, cors)
  - exposes health route
  - mounts docs and HTTP routes
- `http/router.ts`
  - registers top-level feature routers
- `prisma-connection.ts` and `run-migrations.ts`
  - startup-time dependency initialization

Boundary rule:

- `infra` wires the application together
- `features` implement the application's behavior

`infra` should depend on features, but feature logic should not depend on app assembly details.

## Shared Layer

`src/shared/` contains primitives that are reused across multiple features.

Current kinds of shared concerns include:

- runtime config (`config.ts`, Zod-validated)
- shared result types and result kinds
- shared validation primitives (`validate.ts`, `RequestValidationSchema`)
- generic utilities (`controller.ts` with `withValidation`)
- shared client access points (`prisma.ts` with the `PrismaPg` adapter)
- repository primitives (`repository.ts` with `TransactionClient`)

What belongs in `shared`:

- something used by more than one feature
- something that is conceptually cross-cutting
- something generic enough that it is not owned by one domain

What should stay out of `shared`:

- logic used only by one feature
- helpers that are actually part of a feature's domain model
- abstractions created only for hypothetical future reuse

Useful rule of thumb:

- keep code in the feature until there is a real second use case

## API Documentation Layer

`src/docs/` is a separate documentation tree for the public API.

It mirrors the exposed API surface more than the runtime module graph.

```
src/docs/
├── docs.router.ts      # swagger-ui route at /docs
├── docs.types.ts       # DocsModule type
├── openapi.ts          # merges doc groups into one document
├── refs.ts             # $ref builders
├── utils.ts            # jsonContent / jsonResponse helpers
├── shared/             # base schemas and responses
└── features/           # per-feature docs modules (menu/, orders/)
```

A `DocsModule` groups the OpenAPI pieces a module owns:

- `params`, `paths`, `responses`, `schemas`, `securitySchemes`, `tags`

`openapi.ts` merges all registered groups into one document:

```ts
const docGroups = [sharedDocs, menuDocs, orderDocs];
```

This separation has a tradeoff:

- runtime code stays cleaner because docs are not embedded everywhere
- but documentation updates must be maintained intentionally alongside endpoint changes

Blueprint rule:

- if a public endpoint changes, update the matching documentation module in `src/docs/`

## Testing Strategy

`tests/` is organized by test type and then by feature or shared concern.

### Unit Tests

Located under `tests/unit/`.

Best suited for:

- validators
- utility functions
- mappers
- feature-local pure logic
- small adapter behavior that can be isolated

### Integration Tests

Located under `tests/integration/`.

Best suited for:

- endpoint behavior
- request validation behavior
- controller and service integration
- persistence-backed feature flows

In practice, this service tests public behavior mostly at the feature route level.

Blueprint rule:

- unit test contracts and pure helpers
- integration test real feature flows through the public HTTP surface

A guard in `tests/helpers` refuses to run integration tests unless `DATABASE_URL` points at the `checkout-test` database.

## Recommended Feature Template

When creating a new feature, start with the smallest shape that matches the problem.

Minimum useful template:

- `feature.routes.ts`
- `feature.controller.ts`
- `feature.service.ts`
- `feature.validator.ts`
- `index.ts`

Add the following only when the feature needs them:

- `feature.repository.ts`
  - when the feature has meaningful data access or query logic
- `feature.mapper.ts`
  - when response shaping is non-trivial or repeated
- `feature.dto.ts`
  - when output contracts deserve named types
- `feature.errors.ts`
  - when the feature exposes multiple reusable error messages
- `feature.result-kinds.ts`
  - when the feature has named non-success business outcomes
- `feature.types.ts`
  - when the feature has local domain types or enums
- feature-scoped adapter service modules
  - when the feature integrates with an external capability

## How To Add a New Feature

Recommended sequence:

1. Create a new folder under `src/features/`
2. Add the feature's `routes`, `controller`, `service`, `validator`, and `index` modules
3. Mount the feature router from `src/infra/http/router.ts`
4. Add repositories or adapter services only if the feature truly needs them
5. Add a docs module under `src/docs/features/` and register it in `docGroups` in `src/docs/openapi.ts` if the feature exposes public endpoints
6. Add unit tests for validators and pure logic
7. Add integration tests for endpoint behavior and feature flows

When deciding whether to add more structure, prefer the smallest working shape.

## Maintenance Heuristics

Use these rules to keep the service understandable over time.

### Put Logic In the Right Layer

- request parsing and status-code mapping belong in controllers
- business rules belong in services
- persistence logic belongs in repositories
- schema validation belongs in validators
- generic cross-feature helpers belong in `shared`

### Prefer Concrete Feature Ownership

- keep feature-specific code inside the feature
- do not move code into `shared` too early
- do not invent abstractions before there is real pressure for reuse

### Keep Controllers Thin

- if a controller starts making business decisions, move that logic into the service
- if response shaping becomes repetitive, introduce a mapper

### Keep Repositories Focused

- repositories should expose storage operations and query behavior
- they should not become general business-rule containers

### Grow Features Gradually

- not every feature needs every module type
- add complexity only when the feature has earned it
- split a feature into a broader domain cluster only when multiple surfaces share the same underlying model and rules

### Keep Docs and Tests in Step With Public Behavior

- endpoint changes should trigger docs updates
- new feature behavior should trigger integration coverage
- validation changes should usually trigger unit coverage

## What Makes This a Good Blueprint

The strongest reusable ideas in `api` are:

- feature-first organization
- thin HTTP layer
- business logic centered in services
- persistence and external integrations behind dedicated modules
- shared cross-feature primitives in a separate layer
- documentation maintained as a first-class concern
- tests organized by behavior and feature ownership

If another backend service follows these boundaries consistently, it will be easier to extend, review, and maintain.

## Summary

`api` is not structured around technical layers alone. It is primarily structured around features, with `infra`, `shared`, and `docs` supporting those features.

The most important rule to preserve is responsibility clarity:

- `infra` assembles
- `routes` expose
- `controllers` validate input and adapt HTTP
- `services` decide
- `repositories` and adapters talk to outside systems
- `shared` supports cross-feature reuse
- `docs` describe the public contract

That separation is the core blueprint.
