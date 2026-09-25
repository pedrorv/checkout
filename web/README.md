# Web App

`web` is the minimal React frontend for the checkout POC. It renders a Home
screen that calls `GET /health` on the API and reports whether the API is
online.

UI libraries (Chakra, a shared ui-library) are intentionally excluded from
this POC.

## Commands

```bash
pnpm --filter @checkout/web dev      # vite dev server (uses ../.env.dev for WEB_PORT/VITE_API_URL)
pnpm --filter @checkout/web build     # production build
pnpm --filter @checkout/web preview  # preview the build
```

In Docker, the web service starts via `make up` at http://localhost:8000.

## Structure

- `src/main.tsx`: app entry — mounts the router inside `BrowserRouter`
- `src/router.tsx`: route table (`/` → Home, everything else redirects to `/`)
- `src/screens/Home.tsx`: calls the API health endpoint on mount
- `src/api/client.ts`: thin fetch wrapper for the API
- `src/env.ts`: typed access to `import.meta.env` (`VITE_API_URL`)
- `vite.config.ts`: `@` alias for `src/`, port from `WEB_PORT`

## Related Docs

- [../README.md](../README.md): project overview
- [../api/README.md](../api/README.md): API service overview
