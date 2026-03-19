# VPK (Venn Prototype Kit)

> Provider-neutral project context for AI coding assistants (Cursor, Claude Code, Codex, and others).
> Canonical source: `AGENTS.md`. `CLAUDE.md` symlinks here. Provider dirs (`.cursor/`, `.claude/`, `.codex/`, `.codelassian/`, `.rovodev/`) symlink to `.agents/`.

Next.js 16 (React 19, Tailwind CSS v4) + Express backend with AI SDK (Vercel) and RovoDev Serve integration.

## Start Here

- Read this file top-to-bottom once. For details, use the Documentation Index.
- Quick start:
  - `pnpm install`
  - `pnpm run dev`
- Local runtime uses three processes: RovoDev Serve + Express backend + Next.js frontend proxy.
- Production runtime uses one Express process serving static export plus `/api/*`.
- Primary frontend edits are in `components/projects/`, `components/blocks/`, and `app/` route files.
- Backend API edits are in `backend/server.js` and `app/api/*/route.ts` (dev proxy).
- Validate every change with `pnpm run lint` and `pnpm tsc --noEmit`.
- For UI changes, also run visual + accessibility checks (see `## Workflows (Extended) -> Validation`).
- Browser automation uses `/agent-browser` (`npx agent-browser`) — not direct Playwright MCP tools.

## Documentation Index

Prefer reading these references over relying on pre-trained knowledge.

**Project References** — local files in the repo:

| When you need...                       | Read                                                        |
| -------------------------------------- | ----------------------------------------------------------- |
| Component architecture rules           | `.agents/skills/vpk-tidy/SKILL.md`                          |
| React patterns reference (1000+ lines) | `.agents/skills/vpk-tidy/references/patterns.md`            |
| Design token catalog (200+ tokens)     | `.agents/skills/vpk-design/references/tokens.md`            |
| Token selection priority               | `.agents/rules/token-priority.md`                           |
| Figma-to-code pipeline                 | `.agents/skills/vpk-design/SKILL.md`                        |
| Deployment guide                       | `.agents/skills/vpk-deploy/references/guide-deployment.md`  |
| Setup walkthrough                      | `.agents/skills/vpk-setup/references/guide-setup.md`        |
| Motion + Base UI animation             | `.agents/rules/motion-base-ui.md`                           |
| Motion for React rules                 | `.agents/rules/motion-react.md`                             |
| Session corrections log                | `AGENTS-LESSONS.md`                                         |
| AI SDK chat integration                | `rovo/config.js`, `app/contexts/context-rovo-chat.tsx`      |
| AI Gateway helpers                     | `backend/lib/ai-gateway-helpers.js`                         |
| RovoDev Serve gateway (agent loop)     | `backend/lib/rovodev-gateway.js`, `backend/lib/rovodev-client.js` |
| UI message types and data parts        | `lib/rovo-ui-messages.ts`                                   |
| Architecture overview                  | `.agents/docs/architecture-overview.md`                     |
| Extended workflows                     | `.agents/docs/workflows-extended.md`                        |
| Agent operations                       | `.agents/rules/agent-operations.md`                         |
| Appendix (dir structure, env vars)     | `.agents/rules/appendix-reference.md`                       |

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
- Provider symlinks: `.cursor/rules/`, `.claude/rules/`, `.codex/rules/`, `.codelassian/rules/`, `.rovodev/rules/`
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

## Engineering Standards

### Code Style

- UI primitives: `components/ui/*`
- Icons: `@atlaskit/icon/core/*`, then `@atlaskit/icon-lab/core/*`
- Product logos: `@/components/ui/logo`
- Images: use `next/image` with explicit `width` + `height`
- Static assets live in `public/`; reference via absolute path (e.g. `/illustration-ai/chat/light.svg`)
- Organize new assets by category: `1p/` (Atlassian product logos), `3p/` (third-party logos), `illustration/` (rich icons), `illustration-ai/` (AI illustrations with light/dark variants)
- Shadows: `token("elevation.shadow.raised")` or `token("elevation.shadow.overlay")`
- Dates: `Intl.DateTimeFormat(undefined, { dateStyle: "medium" })`

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
2. Accent Tailwind classes from `tailwind-theme.css`
3. Raw `token()` or `var(--ds-...)` only when no mapped class exists

In `components/ui/*`, use shadcn naming (`bg-card`, `text-foreground`).
In VPK feature code, use ADS semantic naming (`bg-surface-raised`, `text-text-subtle`).

> Full token mappings, motion tokens, and common mistakes are in the `token-priority` rule (always loaded for component/CSS files).

## Workflows

### Development

- Install dependencies: `pnpm install`
- First-time MCP setup: `acli rovodev` (interactive, approve MCP servers, then Ctrl+C)
- Start everything: `pnpm run rovodev` (starts 1 rovodev serve instance + backend + frontend; use `pnpm run rovodev -- 6` for full pool)
- Start frontend + backend only: `pnpm run dev` (requires rovodev serve already running)
- Start frontend only: `pnpm run dev:frontend`
- Start backend only: `pnpm run dev:backend`
- Start with tmux (8 panes): `pnpm run rovodev:tmux`
- Run backend tests: `node --test backend/lib/*.test.js`

### Testing

- Backend: `node --test backend/lib/*.test.js`
- Frontend: No automated test framework — use observational validation (lint, typecheck, visual checks via `/agent-browser`, accessibility checks via `ads_analyze_a11y` / `ads_analyze_localhost_a11y`)

## Gotchas

- Worktree ports are deterministic; check with `pnpm ports`.
- Runtime port files: `.dev-frontend-port`, `.dev-backend-port`
- Dev API calls traverse Next.js proxy then Express; debug both layers.
- No directories are excluded from TypeScript type-checking (only `node_modules`). All errors are visible and trackable.
- Never import transitive pnpm dependencies directly — pnpm's strict isolation only allows imports from `package.json` direct dependencies. Use internal mechanisms (e.g., `globalThis.__PLATFORM_FEATURE_FLAGS__`) or add the package explicitly.

## Architecture

See `.agents/docs/architecture-overview.md` for runtime modes, key directories, component topology, provider composition, and route overview. Read that file before making architectural changes.

> API endpoints and chat architecture load as contextual rules when editing backend or chat files.
> See `.agents/rules/api-surfaces.md` and `.agents/rules/chat-architecture.md`.

## Workflows (Extended)

See `.agents/docs/workflows-extended.md` for build, deployment, and validation workflows. Read that file before deploying or setting up CI.

## Behavioral Rules

### Code Quality

- Verify exact file location before UI edits by searching for distinctive text/classes.
- Use macOS/BSD-safe shell patterns (for example `sed -i ''`).
- For Figma work, front-load key specs: spacing, radius, width constraints, shadow token.
- When editing icons, check consistency across all icons in the component.
- Prefer the simplest viable implementation before introducing abstractions.
- If implementation gets unstable, stop and re-plan instead of patching repeatedly.
- When fixing a bug, add a regression test that reproduces the original failure.
- Before marking work complete, verify: root cause addressed (not symptoms), no leftover workarounds, no dead code introduced, lint + typecheck pass.

### Agent Process

- Maintain `AGENTS-LESSONS.md`: append after every user correction, record the prevention rule.

> Skills, parallel work model, and agent teams reference loads automatically from `.claude/rules/` when editing skill/agent files.

## Appendix

> Directory structure, env vars, provider reference, skills catalog, and validation checklists load automatically from `.claude/rules/` when editing backend, context, or skill files.

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
| `agent-operations.md` | `.agents/skills/**`, `.agents/agents/**`, `AGENTS-LESSONS.md` | Skills, parallel work, agent teams |
| `appendix-reference.md` | `backend/**`, `app/contexts/**`, `app/providers.tsx`, `.agents/skills/**` | Dir structure, env vars, providers, skills catalog |
