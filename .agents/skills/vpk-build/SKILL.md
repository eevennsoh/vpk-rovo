---
name: vpk-build
description: Extract a single VPK-Rovo route into a standalone, minimal Next.js 16 project deployable to Atlassian Micros. Use when the user asks to "build /<route>", "extract /<route>", "carve out /<route>", "standalone prototype from route", "minimal route project", "sibling project from route", "spin out /<route>", "split /<route> into its own project", "make /<route> a separate app", "make /<route> its own repo", "minimal version of /<route>", or points at a localhost route URL (e.g. localhost:3000/<route>) and wants it slimmed down into a separately deployable project. Works for any route at app/<route>/ — arts, projects, or future categories. Produces a Git-initialized sibling directory with only the npm deps the route transitively uses, context providers auto-wrapped in the layout, and a Micros deploy scaffold ready for /vpk-deploy.
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

Works for any VPK route at `app/<route>/` — arts, projects, or any future
category registered via `loadDemoComponent`.

```
/vpk-build /<route>                    # default target: ../vpk-<route>/
/vpk-build /<route> <custom-name>      # override target directory name
```

**Examples across route types:**

| Command | Route type | What gets extracted |
|---|---|---|
| `/vpk-build /awake` | Arts | Minimal: WebGL shaders + audio, no providers, no backend |
| `/vpk-build /jira` | Project | Richer: compound contexts auto-wrapped (CreationMode, RovoChat, Sidebar, WorkItemModal) |
| `/vpk-build /confluence` | Project | Similar shape to /jira; contexts detected automatically |
| `/vpk-build /<anything>` | Any | Trace figures out what's needed; output scales to the route |

The output size scales to what the route actually needs. Arts routes typically
land at ~60 files and ~10 npm deps; project routes at ~100 files and ~15 npm
deps. No per-route configuration is required — detection happens during Phase A.

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
  Confirm `app/globals.css` is imported by `app/layout.tsx` — it's the file
  that runs `@import "tailwindcss"` (required for v4 to emit utility
  classes). The scaffold writes a generated `globals.css` that chains
  tailwind-theme.css + shadcn-theme.css + tailwindcss + tw-animate-css.
- **Blank / unstyled page at runtime**: the generated CSS has theme vars
  but no utilities. Open the compiled CSS chunk in devtools — if you don't
  see rules like `.flex { display: flex }` or `.bg-surface`, Tailwind never
  ran. Either `globals.css` is missing its `@import "tailwindcss"` line or
  the layout is importing `tailwind-theme.css` directly instead of
  `globals.css`.
- **Named fonts fall back to system sans (e.g. `'BBH Bartle'`,
  `'DotGothic16'`, `'JetBrains Mono'` render as Helvetica)**: a component
  references a font family by name but the layout doesn't load the `<link>`
  that makes that family available. The scaffold emits the Atlassian Sans
  DS-CDN preload + Google Fonts (`BBH Bartle`, `Bitcount Grid Single`,
  `DotGothic16`, `JetBrains Mono`) by default. If you delete those to slim
  the page, keep the families any component in your route references.
- **Browser console logs "error checking the feature gate" once on load**:
  the server-side `feature-flags-shim.ts` fired during SSR but nothing
  installed the resolver on the client. The scaffold addresses this with
  `app/feature-flags-shim-client.tsx` (a `"use client"` module) rendered as
  `<FeatureFlagsShim />` inside `<body>`. If you see the warning after a
  regeneration, confirm both files exist and the shim is mounted in the
  layout — module-level side effects only run when the module is actually
  imported from a client-side entry.

## Ports

Extracted projects default to `next dev -p 3001` so they coexist with
VPK-Rovo on 3000. Override via `pnpm dev -- -p <port>` if you need to run
multiple extracted projects side by side.

## Dev tools badge

`next.config.ts` ships with `devIndicators: false`, which hides the
floating "N" Next.js dev tools badge in the bottom-left of every page.
Extracted prototypes are usually being demoed or embedded as iframes
where the badge is visual noise. Remove the flag if you want the
hydration/build indicators back while debugging.

## CSS pipeline the scaffold writes

The extracted `app/layout.tsx` imports `app/globals.css`, which starts
life as a **verbatim copy** of VPK-Rovo's `app/globals.css` (single
source of truth) and then gets post-processed to strip any `@import` /
`@source` directive whose package isn't resolvable in the extracted dep
set. Stripped lines are replaced with a commented marker so diffs
against the source stay readable.

For `/awake`, which doesn't use shadcn preset / excalidraw / streamdown,
the filtered file looks like:

```css
@import "./tailwind-theme.css";
@import "./shadcn-theme.css";
@import "tailwindcss" source(none);  /* <-- this emits utility classes */
@import "tw-animate-css";
/* vpk-build: stripped @import for missing dep "shadcn" */
/* vpk-build: stripped @import for missing dep "@excalidraw/excalidraw" */
@source "../app/**/*.{ts,tsx}";
@source "../components/**/*.{ts,tsx}";
@source "../lib/**/*.{ts,tsx}";
/* vpk-build: stripped @source for missing dep "streamdown" */
/* vpk-build: stripped @source for missing dep "@streamdown/code" */
/* … more streamdown strips … */

@layer base { /* body/a/h1–h6 copied verbatim from VPK-Rovo */ }
@layer components { /* streamdown mermaid styling — harmless without streamdown */ }
/* all of VPK-Rovo's unlayered overrides copied verbatim */
```

Always-kept packages (never stripped regardless of plan): `tailwindcss`,
`@tailwindcss/postcss`, `tw-animate-css`. The scaffold auto-injects
`tw-animate-css` into `package.json` because CSS `@import` statements
aren't walked by the TypeScript trace.

If a future route genuinely needs excalidraw / streamdown / katex /
leaflet, the trace will find those packages in component imports and
add them to `plan.npmPackages` — at which point the filter keeps their
`@import` lines automatically on the next extraction. No skill changes
needed.

To manually re-enable a stripped directive after extraction (e.g. you're
adding a dep by hand), replace the `/* vpk-build: stripped … */` marker
with the original line from VPK-Rovo's `globals.css` and add the package
to `package.json`.

### Deploy handoff (after Phase C passes)

```bash
cd ../vpk-<route-slug>/
# /vpk-deploy --initial    # first time: creates service, sets env vars, deploys
# pnpm run deploy:micros   # subsequent deploys (after .deploy.local exists)
```

The scaffold mirrors VPK-Rovo's canonical-source layout so the wired
skills are discoverable by every orchestrator (Claude Code, Cursor,
Codex):

```
<target>/
├── .agents/
│   └── skills/
│       ├── vpk-setup  → <VPK-Rovo>/.agents/skills/vpk-setup
│       └── vpk-deploy → <VPK-Rovo>/.agents/skills/vpk-deploy
├── .claude/skills  → ../.agents/skills
├── .cursor/skills  → ../.agents/skills
├── .codex/skills   → ../.agents/skills
└── scripts/
    └── deploy.sh   # forwards to .agents/skills/vpk-deploy/scripts/deploy.sh
```

Wired skills (allow-list in `scripts/scaffold-target.mjs` →
`WIRED_SKILLS`):

- `vpk-setup` — generates `.env.local`, `.asap-config`, and the session
  token needed by deploy. Prerequisite for `/vpk-deploy`.
- `vpk-deploy` — Micros deployment flow. Reads `.deploy.local` on fast
  redeploys.

Only a small allow-list is wired intentionally: other VPK skills
(`vpk-build`, `vpk-design`, `vpk-tidy`, `vpk-component`, etc.) assume
VPK's own component library, Figma pipeline, or provider contexts —
they don't apply inside a standalone extraction. Add a future skill by
appending to the `WIRED_SKILLS` array.

This wiring means:

- `/vpk-setup` and `/vpk-deploy` both resolve as slash commands in any
  orchestrator that looks in `.agents/skills/` or its provider-specific
  mirror, without manual setup
- `pnpm run deploy:micros` works because `scripts/deploy.sh` forwards
  `$@` to the canonical skill script
- If VPK-Rovo ships a fix to any wired skill, every extracted project
  picks it up on the next run — no re-scaffold needed

The canonical symlinks are relative
(`../../../VPK-rovo/.agents/skills/<skill>`), so they break if VPK-Rovo
moves and the extracted project doesn't move with it. If that happens,
re-symlink manually:

```bash
cd ../vpk-<route-slug>/
for s in vpk-setup vpk-deploy; do
  rm -f ".agents/skills/$s"
  ln -s "../../../VPK-rovo/.agents/skills/$s" ".agents/skills/$s"
done
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
  `postcss.config.mjs`, `tailwind.config.ts`, `.gitignore`,
  `README.md.tmpl`). The `app/layout.tsx` is NOT a static template —
  `composeLayout()` in `scaffold-target.mjs` generates it dynamically so
  provider nesting, metadata, font `<link>` tags, and the client-side
  FeatureGates shim stay in one place.
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

- **Auto-rewriting internal cross-route `<Link>` hrefs** — warns instead; user rewires manually.
- **Multi-route bundles** — one route per extraction.
- **Auto-generating backend for runtime API calls** — `apiCalls` detected in Phase A are surfaced as warnings. The scaffold proceeds and the project builds, but runtime `/api/*` calls (common in chat-based routes via `useChat`) will fail until a backend is wired up manually or the user adds proxy routes to VPK-Rovo.
- **Provider dependency ordering** — auto-wrapped alphabetically. If a provider needs to be inside another because of a cross-dependency, user reorders the generated `app/layout.tsx`.
- **Non-Micros deploy targets** (Vercel, Netlify, etc.) — Micros only for now; `references/micros/` is the only scaffold.
