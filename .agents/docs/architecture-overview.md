# Architecture Overview

## Runtime Modes

Local development — single command starts all three processes:

```text
pnpm run rovodev (default pool size: 1) → rovodev serve (:8000) + Express (:8080) + Next.js (:3000)

Browser -> Next.js (:3000) -> app/api/* proxy -> Express (:8080) -> rovodev serve (:8000)
```

Production with static export (single process, requires `NEXT_OUTPUT=export` during build):

```text
Browser -> Express (:8080) -> static export + /api/* -> RovoDev Serve
```

The `rovodev` script starts all three processes concurrently (single-instance by default; use `pnpm run rovodev -- 6` for full pool). The `dev` script starts only backend + frontend (requires RovoDev Serve already running). The backend auto-detects RovoDev Serve via `.dev-rovodev-port` (single) or `.dev-rovodev-ports` (pool) files and will reject chat requests if it's unavailable unless `AUTO_FALLBACK_TO_AI_GATEWAY=true` is enabled and AI Gateway env vars are configured.

## Key Directories

- `app/` - Next.js App Router routes, providers, and dev proxy handlers
- `backend/` - Express production runtime and API handlers
- `components/projects/` - ADS-themed feature surfaces (confluence, dashboard, fullscreen-chat, future-chat, jira, make, search, sidebar-chat, work-items)
- `components/blocks/` - standalone block surfaces (agent-progress, answer-card, approval-card, board, chat, chat-composer, chatbot, chatgpt, cursor, dashboard, data-table, discovery-gallery, figma-demo, generative, generative-card, kanban-sprint, login, make-artifact, make-gallery, make-grid, make-item, make-page, product-sidebar, prompt-gallery, question-card, settings-dialog, shared-ui, sidebar, sidebar-rail, signup, sprint-board, terminal-switch, time-tracker, top-navigation, visual-waveform, work-item-detail, work-item-widget, workflow)
- `components/charts/` - chart components (area, bar, data, line, pie, radar, radial, tooltip)
- `components/ui/` - shared shadcn/Base UI primitives
- `components/website/` - component documentation and demo site
- `lib/` - shared utilities and token helpers
- `backend/lib/` - backend utilities (plan run manager, RovoDev gateway/client/pool, generative UI, planning intent, DAG inference, team run lanes, smart routing)
- `public/` - static assets (illustrations, product logos, third-party logos, avatars)
- `.agents/` - canonical source for rules, skills, agents, docs, and hooks
- `.cursor/`, `.claude/`, `.codex/`, `.codelassian/` - provider symlinks to `.agents/`

See `## Appendix -> Detailed Directory Structure` for expanded layout.

## Component Topology

- Feature components live under `components/{projects,blocks}/[feature]/`
- `page.tsx` is the public API for feature entrypoints
- Sub-components belong in local `components/` folders
- Optional local folders: `hooks/`, `data/`, `lib/`
- Shared project utilities live in `components/projects/shared/`

## Provider Composition

Provider order in `app/providers.tsx`:

```text
ThemeWrapper
  -> SidebarProvider
    -> CreationModeProvider
      -> RovoChatProvider
```

## Route Overview

Common routes:

- `/` -> `app/page.tsx`
- `/make` -> `components/projects/make/`
- `/sidebar-chat` -> `components/projects/sidebar-chat/`
- `/fullscreen-chat` -> `components/projects/fullscreen-chat/`
- `/future-chat` -> `components/projects/future-chat/`
- `/confluence` -> `components/projects/confluence/`
- `/jira` -> `components/projects/jira/`
- `/search` -> `components/projects/search/`
- `/components/[category]/[slug]` -> `app/components/[category]/[slug]/page.tsx`
- `/preview/blocks/[slug]` -> `app/preview/blocks/[slug]/`
- `/preview/projects/[slug]` -> `app/preview/projects/[slug]/`
- `/[category]` -> `app/[category]/page.tsx`

See `## Appendix -> Full Route Mapping` for the complete table.
