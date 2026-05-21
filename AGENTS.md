# VPK (Venn Prototype Kit)

> Provider-neutral project context for AI coding assistants (Cursor, Claude Code, Codex, and others).
> Canonical source: `AGENTS.md`. `CLAUDE.md` symlinks here. Provider dirs (`.cursor/`, `.claude/`, `.codex/`, `.rovodev/`) contain provider-specific config plus symlinks back to `.agents/`.

Next.js 16 (React 19, Tailwind CSS v4) + Express backend with AI SDK (Vercel), AI Gateway, and RovoDev Serve integration.

## Start Here

- Read this file top-to-bottom once. For details, use the Documentation Index.
- Quick start:
  - `pnpm install`
  - `pnpm run rovodev`
- Local development usually starts frontend + backend with `pnpm run dev`; `pnpm run rovodev` adds RovoDev Serve for flows that explicitly select or delegate to RovoDev.
- Production runtime uses one Express process serving static export plus `/api/*`.
- Primary frontend edits are in `components/projects/`, `components/blocks/`, `components/arts/`, `components/website/` (component docs and demos), and `app/` route files.
- Backend/API edits are in `backend/server.js`, `backend/lib/*.js`, and nested `app/api/**/route.ts` handlers (dev proxy and route-local adapters).
- Validate every change with `pnpm run lint` and `pnpm run typecheck`.
- For UI changes, also run visual + accessibility checks (see `.agents/docs/workflows-extended.md`).
- Browser automation for general UI work uses `/agent-browser` (`npx agent-browser`) — not direct Playwright MCP tools; put ad-hoc artifacts under ignored `output/agent-browser/`.
- Symphony browser evidence is the exception: use the repo-local `vpk-symphony` skill so issue-scoped screenshots, WebM recordings, and traces land under ignored `output/playwright/` for the workpad flow, as specified in `WORKFLOW.md` and `docs/SYMPHONY.md`.

## Documentation Index

Prefer reading these references over relying on pre-trained knowledge.

**Project References** — local files in the repo (files in `.agents/rules/` that auto-load are listed in [Contextual Rules](#contextual-rules) instead):

| When you need...                       | Read                                                        |
| -------------------------------------- | ----------------------------------------------------------- |
| Component architecture rules           | `.agents/skills/vpk-tidy/SKILL.md`                          |
| React patterns reference (1000+ lines) | `.agents/skills/vpk-tidy/references/patterns.md`            |
| Shared visual contract                 | `DESIGN.md`                                                 |
| Design token catalog (200+ tokens)     | `.agents/skills/vpk-design/references/tokens.md`            |
| Figma-to-code pipeline                 | `.agents/skills/vpk-design/SKILL.md`                        |
| Deployment guide                       | `.agents/skills/vpk-deploy/references/guide-deployment.md`  |
| Setup walkthrough                      | `.agents/skills/vpk-setup/references/guide-setup.md`        |
| Offline HTML artifacts                 | `.agents/skills/vpk-html/SKILL.md`                          |
| Repo-local agent creation              | `.agents/skills/agent-creator/SKILL.md`                     |
| AI SDK chat integration                | `rovo/config.js`, `app/contexts/context-rovo-chat.tsx`      |
| AI Gateway helpers                     | `backend/lib/ai-gateway-helpers.js`                         |
| RovoDev Serve gateway (agent loop)     | `backend/lib/rovodev-gateway.js`, `backend/lib/rovodev-client.js` |
| UI message types and data parts        | `lib/rovo-ui-messages.ts`                                   |
| Hermes control plane                   | `components/projects/control-plane/`, `backend/lib/hermes-*.js`, `scripts/verify-hermes-control-plane.js` |
| Architecture overview                  | `.agents/docs/architecture-overview.md`                     |
| Extended workflows                     | `.agents/docs/workflows-extended.md`                        |
| cmux inter-agent messaging             | `.agents/docs/cmux-messaging.md`                            |
| Symphony orchestrator                  | `.agents/skills/vpk-symphony/SKILL.md`, `docs/SYMPHONY.md`, `WORKFLOW.md`, `scripts/symphony.sh` |

**Global Skills** — installed agent skills (outside repo):

| When you need...                | Read                                                  |
| ------------------------------- | ----------------------------------------------------- |
| Component design fundamentals   | `~/.agents/skills/building-components/references/`    |
| React composition patterns      | `~/.agents/skills/vercel-composition-patterns/rules/` |
| React/Next.js performance rules | `~/.agents/skills/vercel-react-best-practices/rules/` |
| AGENTS.md best practices        | `~/.agents/skills/claude-md-improver/references/`     |

**External Documentation** — fetch via tools when needed:

| When you need...        | URL                                                       |
| ----------------------- | --------------------------------------------------------- |
| Atlassian Design System | `https://atlassian.design` (also via `ads_plan` MCP tool) |
| shadcn/ui components    | `https://ui.shadcn.com/docs`                              |
| Tailwind CSS            | `https://tailwindcss.com/docs`                            |

## Core Rules (Highest Priority)

### Rule Priority

If instructions overlap, use this precedence:

1. Direct user instruction for the current task
2. This file
3. Tool/runtime constraints
4. Skill-specific docs (for the chosen skill)
5. Supplemental references in Appendix

### Rule Sources

- Canonical source: `.agents/rules/`
- Provider symlinks: `.cursor/rules/`, `.claude/rules/`, `.codex/rules/`, `.rovodev/rules/`
- Cursor-only format: `.agents/rules/*.mdc`

### Non-negotiable Defaults

- Package manager: `pnpm`
- Indentation: tabs
- Imports: use `@/` alias
- React 19 patterns:
  - `use(Context)` not `useContext()`
  - `<Context value={}>` not `<Context.Provider>`
  - `ref` as regular prop (no `forwardRef`)
- Conditional rendering: use ternary (`cond ? <X /> : null`), not `&&` patterns that can render `0`
- Use semantic token classes before raw CSS variables
- Do not introduce new `bg-[var(--ds-...)]` / `text-[var(--ds-...)]` patterns in VPK components
- Custom CSS classes: prefer `@utility name { … }` (Tailwind v4 idiom) over `@layer components`. Full rules in `.agents/rules/token-priority.md`.

## Engineering Standards

### Code Style

- UI primitives: `components/ui/*`
- Icons: `@atlaskit/icon/core/*`, then `@atlaskit/icon-lab/core/*`
- Product logos: `@/components/ui/logo`
- Images: use `next/image` with explicit `width` + `height`
- Static assets live in `public/`; reference via absolute path (e.g. `/illustration-ai/chat/light.svg`)
- Organize new assets by category: `1p/` (Atlassian product logos), `3p/` (third-party logos), `illustration/` (rich icons), `illustration-ai/` (AI illustrations with light/dark variants)
- Shadows: `token("elevation.shadow.raised")` or `token("elevation.shadow.overlay")`
- Dates: `Intl.DateTimeFormat("en-US", { dateStyle: "medium" })` (always specify locale to avoid SSR/client hydration mismatch)

Key imports:

```tsx
import { token } from "@/lib/tokens"; // spacing, shadows, dynamic values only
import { cn } from "@/lib/utils"; // class merging (all className props)
import { Button } from "@/components/ui/button";
import { useChat } from "@ai-sdk/react"; // chat message state + streaming
import { DefaultChatTransport, type UIMessage } from "ai"; // transport + message types
```

### UI and Token Standards

Selection priority:

1. Semantic shadcn/ADS utility classes
2. Accent Tailwind classes from `app/tailwind-theme.css`
3. Raw `token()` or `var(--ds-...)` only when no mapped class exists

In `components/ui/*`, use shadcn naming (`bg-card`, `text-foreground`).
In VPK feature code, use ADS semantic naming (`bg-surface-raised`, `text-text-subtle`).

> Full token mappings, motion tokens, and common mistakes are in the `token-priority` rule (always loaded for component/CSS files).

## Workflows

### Development

- Install dependencies: `pnpm install`
- First-time RovoDev bootstrap: run `pnpm run rovodev` (or `acli rovodev`) once, copy the printed `ROVODEV_SESSION_TOKEN` into `.env.local`, then restart the stack
- Start everything: `pnpm run rovodev` (starts 1 rovodev serve instance + backend + frontend; use `pnpm run rovodev -- 6` for full pool)
- Start frontend + backend only: `pnpm run dev` (AI Gateway-backed chat works when credentials are configured; RovoDev-selected flows still need RovoDev Serve)
- Start through explicit Portless routing: `portless run` or `portless run --script rovodev`
- Start RovoDev Serve only: `pnpm run dev:rovodev`
- Start frontend only: `pnpm run dev:frontend`
- Start backend only: `pnpm run dev:backend`
- Start with tmux (8 panes): `pnpm run rovodev:tmux:start`
- Stop tmux dev session: `pnpm run rovodev:tmux:stop`
- Start Symphony issue orchestrator: `pnpm run symphony` (requires `LINEAR_API_KEY`, `SYMPHONY_LINEAR_PROJECT_SLUG`, and `mise`; see `docs/SYMPHONY.md`)
- Verify Hermes/control-plane status after the backend is running: `pnpm run verify:hermes`; refresh the local vendored upstream skills snapshot with `pnpm run import:hermes:upstream` if that check reports it missing.

### Build and deploy

Use these commands when you need to verify the app build locally or prepare the
static export used by deployment.

- Verify the Next.js build locally: `pnpm run build`
- Build the static export used in production deployment: `NEXT_OUTPUT=export pnpm run build`
- Fast redeploy to Micros after `.deploy.local` exists: `pnpm run deploy:micros`

### Testing

- There is no single `pnpm test` script in `package.json`.
- Repo tests are spread across `backend/`, `lib/`, `scripts/`, `app/`,
  `components/`, and `rovo/`; run targeted `node --test` commands against the
  relevant `.test.js` or `.test.ts` files.
- Browser coverage lives under `tests/**/*.spec.ts` with `@playwright/test`;
  run targeted specs with `pnpm exec playwright test <spec>` after
  `pnpm install`.
- GitHub Actions runs `.github/workflows/ci.yml` on PRs, pushes to `main`, and
  manual dispatch. The remote `CI / Lint and typecheck` check installs with
  `pnpm install --frozen-lockfile`, then runs `pnpm run lint` and
  `pnpm run typecheck`; treat it as PR confirmation, not a substitute for local
  validation.
- For UI changes, keep the observational checks too: `pnpm run lint`, `pnpm run
  typecheck`, visual checks via `/agent-browser`, and accessibility checks via
  `ads_analyze_a11y` / `ads_analyze_localhost_a11y`.

### Debugging

- When running inside cmux, use `/cmux` skill + `cmux read-screen` to scrape terminal output from dev server panes before guessing at errors.
- Workflow:
  1. `cmux list-panes` / `cmux list-pane-surfaces` — find the pane running the failing process (backend, frontend, rovodev serve).
  2. `cmux read-screen --surface surface:N --scrollback --lines 200` — capture recent terminal output.
  3. Analyze the captured logs to identify the actual error before proposing a fix.
- Prefer this over re-running commands or reading log files — the terminal pane already has the live output.
- Outside cmux, fall back to reading `.dev-rovodev-port` / `.dev-rovodev-ports`, `.dev-frontend-port`, and `.dev-backend-port` and checking process output manually.

## Gotchas

- Worktree ports are deterministic; check with `pnpm ports` or keep a live dashboard open with `pnpm ports watch`.
- Runtime port files: `.dev-rovodev-port`, `.dev-rovodev-ports`, `.dev-frontend-port`, `.dev-backend-port`
- Dev API calls traverse Next.js proxy then Express; debug both layers.
- No directories are excluded from TypeScript type-checking (only `node_modules`). All errors are visible and trackable.
- Never import transitive pnpm dependencies directly — pnpm's strict isolation only allows imports from `package.json` direct dependencies. Use internal mechanisms (e.g., `globalThis.__PLATFORM_FEATURE_FLAGS__`) or add the package explicitly.
- Do not remove the `@layer theme, base, components, utilities;` statement at the top of `app/globals.css` — it pre-declares cascade layer order; without it `@layer components` can declare too early (via `tailwind-theme.css`) and lose to preflight resets.
- Theme switches via `setGlobalTheme()` from `@atlaskit/tokens` (sets `data-color-mode` + `--ds-*` vars), not Tailwind's `dark:` variant alone. Toggling the `dark` class on `<html>` won't update ADS tokens.
- Fresh worktrees need their own `pnpm install` — `node_modules` does not share across worktrees.
- RovoDev launchers (`pnpm run rovodev`, `pnpm run dev:rovodev`, and `pnpm run rovodev:tmux:start`) seed `.env.local` before startup: they copy the main worktree's `.env.local` first and fall back to `.env.local.example`. Copy or symlink `.env.local` manually only when running backend/frontend entrypoints outside those launchers.

## Architecture

Two runtime modes: **dev** (Next.js proxy + Express, with optional RovoDev Serve for selected chat/tool flows) and **prod** (single Express process serving static export). Key dirs: `app/` (routes), `components/` (UI), `backend/` (API), `rovo/` (AI config). See `.agents/docs/architecture-overview.md` for full details before making architectural changes.

> API endpoints and chat architecture load as contextual rules when editing backend or chat files.
> See `.agents/rules/api-surfaces.md` and `.agents/rules/chat-architecture.md`.

## Behavioral Rules

### Code Quality

- Verify exact file location before UI edits by searching for distinctive text/classes.
- Use macOS/BSD-safe shell patterns (for example `sed -i ''`).
- For Figma work, front-load key specs: spacing, radius, width constraints, shadow token.
- When editing icons, check consistency across all icons in the component.
- When fixing a bug, add a regression test that reproduces the original failure.
- Before marking work complete, verify: root cause addressed (not symptoms), no leftover workarounds, no dead code introduced, lint + typecheck pass.

> Skills, parallel work model, and agent teams reference loads automatically from `.agents/rules/` when editing skill/agent files.

## cmux Inter-Agent Messaging

> Full protocol details: `.agents/docs/cmux-messaging.md`

## Appendix

> Directory structure, env vars, provider reference, skills catalog, and validation checklists load automatically from `.agents/rules/` when editing backend, context, or skill files.

## Contextual Rules

The following `.agents/rules/` files load automatically when editing matching file patterns. All provider dirs (`.cursor/rules/`, `.claude/rules/`, etc.) symlink to `.agents/rules/`.

| Rule file | Loads when editing | Content |
| --- | --- | --- |
| `token-priority.md` | `components/**/*.tsx`, `app/**/*.tsx`, `*.css` | Token selection, theming, motion tokens |
| `component-architecture.md` | `components/**/*.tsx`, `app/contexts/**/*.tsx` | Context pattern, compound components, CVA |
| `chat-architecture.md` | `context-rovo-chat.tsx`, `backend/server.js`, `rovodev-*.js`, `rovo/**` | AI SDK, useChat, RovoDev, data parts |
| `api-surfaces.md` | `backend/server.js`, `app/api/**/*.ts`, `backend/lib/*.js` | All endpoint listings |
| `gotchas-ui.md` | `components/**/*.tsx` | Base UI menus, Popover, Toggle, Sonner |
| `gotchas-chat.md` | `context-rovo-chat.tsx`, `rovodev-*.js` | RovoDev mode, session, message deletion |
| `gotchas-react.md` | `**/*.tsx` | State updates, derived state, CSS gap |
| `motion-base-ui.md` | `*.tsx`, `*.jsx` | Animating Base UI with Motion |
| `motion-react.md` | `*.tsx`, `*.jsx` | Motion for React patterns |
| `agent-operations.md` | `.agents/skills/**`, `.agents/agents/**` | Skills, parallel work, agent teams |
| `appendix-reference.md` | `backend/**`, `app/contexts/**`, `app/providers.tsx`, `.agents/skills/**` | Dir structure, env vars, providers, skills catalog |
| `browser-screenshots.mdc` | `*` (always) | Keep browser screenshots out of workspace root |

## Cursor Cloud specific instructions

### Services overview

| Service | Command | Default Port | Required? |
|---------|---------|-------------|-----------|
| Next.js Frontend | `pnpm run dev:frontend` | 3000 | Yes |
| Express Backend | `pnpm run dev:backend` | 8080 | Yes |
| RovoDev Serve | `pnpm run dev:rovodev` | 8000 | Only for RovoDev-selected chat/tool flows |

Start frontend + backend together: `pnpm run dev`
Start all three locally when the RovoDev CLI is available: `pnpm run rovodev`
Use `portless run` or `portless run --script rovodev` when you specifically want Portless URLs.

### Running checks

- Lint: `pnpm run lint`
- Typecheck: `pnpm run typecheck`
- Build: `pnpm run build`
- No single `pnpm test`; run targeted `node --test` against specific `.test.js`/`.test.ts` files

### Non-obvious caveats

- The `.env.local` file is created from `.env.local.example` on first setup. The dev servers (backend + frontend) start without AI Gateway credentials; the UI renders fully, but AI Gateway-backed chat/media return config errors and RovoDev-selected flows still need `ROVODEV_SESSION_TOKEN` plus RovoDev Serve.
- Backend port is written to `.dev-backend-port`, frontend to `.dev-frontend-port` at startup — these are useful for verifying which ports are in use.
- `pnpm run dev` starts both backend and frontend via `concurrently`; do not run `pnpm run rovodev` at the same time or you'll get port conflicts.
- The `pnpm install` warning about ignored build scripts (better-sqlite3, node-llama-cpp) is expected and does not affect the application — these are transitive deps from optional features.
- Health endpoint: `curl http://localhost:8080/api/health` — returns JSON with service status and auth config summary.
- The `rovodev` CLI (RovoDev Serve) is not available in cloud VMs — use `pnpm run dev` instead of `pnpm run rovodev`. RovoDev-selected chat/tool flows won't work without RovoDev, but AI Gateway-backed chat, UI, component docs, and non-chat API routes can still function when credentials and egress are available.
- AI Gateway endpoints require outbound HTTPS to `ai-gateway.us-east-1.staging.atl-paas.net`. If the cloud VM has restricted egress, gateway-backed chat/helper/media features return config or request errors gracefully.
- When writing `ASAP_PRIVATE_KEY` to `.env.local`, the value already includes surrounding double quotes and literal `\n` escape sequences — do not add extra quotes around it or you'll get "Maximum call stack size exceeded" from Next.js env parsing.
