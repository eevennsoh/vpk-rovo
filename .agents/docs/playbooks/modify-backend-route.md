# Modify Backend Route

Use this when adding, deleting, or changing an Express API route or its Next.js proxy.

## Files To Inspect

1. `backend/routes/<owner>.js` for extracted route groups.
2. `backend/server.js` only for routes not extracted yet, startup wiring, and chat-adjacent endpoints.
3. `app/api/**/route.ts` for dev proxy behavior.
4. `backend/routes/route-manifest.json` and `.agents/knowledge/api-surfaces.md` for generated route tables.
5. Route-local tests next to the owner, plus proxy tests when request rewriting lives in `app/api`.

## Workflow

1. Freeze the current contract with a focused test before moving or changing behavior.
2. Keep request parsing, auth, status codes, response shape, and headers unchanged unless the task explicitly changes them.
3. After route changes, run:

```bash
node backend/routes/route-manifest.js --update
node scripts/generate-api-surfaces.js
pnpm run verify:route-manifest
pnpm run verify:api-surfaces
pnpm run test:backend
pnpm run lint
pnpm run typecheck
```

## Failure Modes

- Adding only the backend route but not the matching `app/api` proxy breaks dev mode.
- Moving a route without regenerating the manifest leaves stale line numbers and API docs.
