---
name: vpk-build
description: This skill should be used when the user asks to "build /<route>",
  "extract /<route>", "carve out <route>", "standalone prototype from route",
  "minimal route project", "sibling project from route", "spin out /<route>",
  "split /<route> into its own project", "give /<route> its own deploy",
  "make /<route> a separate app", "extract route as standalone", or in general
  wants to take a single VPK-Rovo route (e.g. `/awake`, `/plan`, `/confluence`)
  and turn it into a standalone sibling Next.js 16 project with only the
  dependencies that one route actually uses. The produced project is
  Git-initialized, installable, and deployable to Atlassian Micros via the
  existing `/vpk-deploy` skill. Use this skill whenever the user points at a
  route URL (e.g. `localhost:3000/awake`) and asks for a slimmed-down, separately
  deployable version of that route — even if they don't say the word "extract"
  or "build". Also triggers on "make /<route> its own repo", "how do I ship
  just /<route>", "minimal version of /<route>", or similar wording focused on
  isolating a single prototype.
argument-hint: "<route-path> [target-name]"
prerequisites: {}
produces: ["../vpk-<route>/"]
---

# VPK Build — extract a route into a standalone sibling project

> Translate a single VPK route into a standalone, minimal Next.js 16 project
> ready to deploy to Atlassian Micros. Mirrors VPK's repo layout so imports
> copy verbatim, pulls only the deps that route's import graph actually
> uses, and hands off deployment to `/vpk-deploy`.

## Quick Start

```
/vpk-build /awake                  # extracts to ../vpk-awake/
/vpk-build /awake vpk-awake-demo   # custom target name
/vpk-build /plan                   # extracts to ../vpk-plan/
```

**Typical result** (for `/awake`): ~55 files copied, ~8 npm deps in
`package.json`, no backend, no AI SDK, no RovoChatProvider. Build and deploy
independently of VPK-Rovo.

## When to use vs. when to stay in VPK-Rovo

**Use `/vpk-build`** when you're ready to hand a prototype off as its own
deliverable — demo to stakeholders, give a separate URL, ship independently, or
iterate on the prototype without carrying VPK's 101 deps and 8 GB Docker memory
footprint.

**Stay in VPK-Rovo** while you're still composing the prototype, need the shared
chat / backend infrastructure, or want cross-route navigation between prototypes.

## Pipeline Overview

Three phases run in order. Each phase is a checkpoint — stop and show the user
a summary before continuing if anything unexpected comes up (backend imports
detected, non-literal dynamic imports, unresolved deps).

### Phase A — Plan (read-only)

Trace the route's full import graph, resolve npm deps, identify public assets,
detect backend calls. Produce `.cache/<route>.plan.json` and a human-readable
summary. **Ask the user to confirm before Phase B.**

```bash
node .agents/skills/vpk-build/scripts/trace-imports.mjs <route-path> \
  --out .agents/skills/vpk-build/.cache/<route-slug>.plan.json
```

The plan JSON includes `summary.fileCount`, `summary.npmCount`,
`summary.assetCount`, and `summary.backendRouteCount`. If `backendRouteCount > 0`,
**stop**: v1 only supports pure frontend routes. Tell the user to keep deploying
the route through VPK's own `/vpk-deploy` until backend support lands.

Also check `skippedDispatchers` — if unexpected files appear there, the trace
may be missing legitimate graph edges. The common entry (`demo-registry-loader.ts`)
is intentional and resolved via the `loadDemoComponent` special case.

### Phase B — Scaffold & copy

Create the sibling directory, copy files verbatim (preserving repo-relative
paths so `@/*` imports resolve without rewriting), rewrite the route entry,
fill in the Micros deploy scaffold, `git init`.

```bash
node .agents/skills/vpk-build/scripts/scaffold-target.mjs \
  .agents/skills/vpk-build/.cache/<route-slug>.plan.json \
  [--target <custom-dir>] [--force]
```

Default target path is `<VPK-parent>/vpk-<route-slug>/` — e.g. running
`/vpk-build /awake` from `~/Documents/Labs/VPK-rovo/` produces
`~/Documents/Labs/vpk-awake/`.

The scaffold rewrites the route entry so it imports the demo component
directly, bypassing `loadDemoComponent`. Example transformation:

```tsx
// Before (app/awake/page.tsx in VPK-Rovo)
const Demo = use(loadDemoComponent("awake", "arts"));
return createElement(Demo);

// After (app/page.tsx in vpk-awake)
import AwakeDemo from "@/components/website/demos/arts/awake-demo";
export default function Page() { return <AwakeDemo />; }
```

### Phase C — Verify

Run install → typecheck → build in the target project. Success = the
extracted project is complete and deployable.

```bash
.agents/skills/vpk-build/scripts/verify-target.sh <target-dir>
```

If any step fails, read the output for the specific cause:
- **Install failure**: usually a dep version mismatch. Edit the target
  `package.json` manually to adjust a version and re-run.
- **Typecheck failure**: most often an `@/` import that resolved into VPK but
  wasn't copied by the plan. Copy the file manually or widen the trace.
- **Build failure**: typically a Tailwind semantic class that can't resolve.
  Confirm `app/tailwind-theme.css` and `@atlaskit/tokens/css-reset.css` are
  imported by `app/layout.tsx`.

### Deploy handoff (after Phase C passes)

```bash
cd ../vpk-<route-slug>/
# /vpk-deploy --initial    # first time: creates service, sets env vars, deploys
# pnpm run deploy:micros   # subsequent deploys (after .deploy.local exists)
```

## Scripts

- [`scripts/trace-imports.mjs`](scripts/trace-imports.mjs) — TypeScript compiler
  API import walker. Produces the Phase A plan JSON. This is the deterministic
  load-bearing piece of the skill; tracing the import graph via LLM would be
  too lossy.
- [`scripts/scaffold-target.mjs`](scripts/scaffold-target.mjs) — Plan-driven
  copy + `git init`.
- [`scripts/verify-target.sh`](scripts/verify-target.sh) — `pnpm install`
  through `next build` in the extracted project.

## References

- [`references/scaffold/`](references/scaffold/) — Static templates for the
  target project (`package.json.tmpl`, `next.config.ts`, `tsconfig.json`,
  `app/layout.tsx.tmpl`, etc.).
- [`references/micros/`](references/micros/) — Micros deploy scaffold
  (`service-descriptor.yml`, `backend/Dockerfile`, `backend/server.js`,
  `backend/package.json`).
- [`references/ui-allowlist.md`](references/ui-allowlist.md) — Notes on which
  `components/ui/*` primitives are known-standalone-safe vs. known to pull in
  heavy subgraphs. Consulted during Phase A when the plan flags oversized
  transitives.

## Deploy Handoff

Once Phase C passes, the extracted project is ready for `/vpk-deploy --initial`.
The copied Micros scaffold (`service-descriptor.yml` + `backend/Dockerfile` +
minimal `backend/server.js`) mirrors VPK's structure, so `/vpk-deploy`'s
existing workflow — service create, env vars, Docker build, push, deploy —
works without modification.

Inside the sibling project:

```bash
cd ../vpk-<route>/
# /vpk-deploy --initial  (asks for service name + Docker creds, deploys)
```

## Out of scope (v1)

- Auto-rewriting internal cross-route `<Link>` hrefs (warns instead).
- Multi-route bundles — one route per extraction.
- Routes that hit `/api/*` or need RovoDev backend — Phase A detects and errors
  out with an explanation pointing to VPK's own deploy flow.
- Non-Micros deploy targets (Vercel, Netlify, etc.) — Micros only for now.
