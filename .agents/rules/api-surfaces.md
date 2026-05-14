---
description: API endpoint reference — backend routes, orchestrator, and dev proxy mappings
globs: backend/server.js, app/api/**/*.ts, backend/lib/*.js
alwaysApply: false
paths:
  - backend/server.js
  - app/api/**/*.ts
  - backend/lib/*.js
---

# API Surfaces

## Dev Proxy JSON Contracts

- When a `POST` route consumes JSON before proxying, use `readJsonBody()` or a route-local wrapper around it instead of manual `request.json()` / `JSON.parse()` handling.
- Add or keep focused route tests for malformed JSON. The test should assert the public error shape for that route and prove the backend/proxy call is not reached.
- When a proxy route rewrites query params, path params, or JSON field names before forwarding, add or keep a focused route test that proves the forwarded request shape. Cover the exact behavior that lives in the proxy layer, not just the backend handler behind it.
- Prefer `app/api/**/route.test.js` coverage when the contract risk is in the Next.js proxy route. Backend tests alone do not prove that the proxy preserved the public request contract.
- Match the route's existing response contract: most dev proxy routes return JSON errors, while transport-specific routes such as `app/api/chat-sdk/route.ts` intentionally normalize client-body errors to `text/plain`.

## Backend (`backend/server.js`)

### Chat

- `POST /api/chat-sdk` — main chat streaming endpoint
- `POST /api/chat-cancel` — cancel in-progress chat
- `POST /api/chat-title` — generate thread title
- `POST /api/plan-title` — generate plan title
- `POST /api/chat-sdk/skip-question` — skip deferred question
- `POST /api/agent-mode` — set agent mode
- `GET  /api/agent-mode` — get agent mode

### Rovo

- `POST /api/rovo/chat` — send message
- `GET  /api/rovo/messages` — list messages
- `POST /api/rovo/messages` — create message
- `POST /api/rovo/suggestions` — generate suggestions
- `POST /api/rovo/cancel-deferred-tool` — cancel deferred tool
- `GET  /api/rovo/threads` — list threads
- `POST /api/rovo/threads` — create thread
- `DELETE /api/rovo/threads` — delete all threads
- `GET  /api/rovo/threads/:threadId` — get thread
- `PUT  /api/rovo/threads/:threadId` — update thread
- `DELETE /api/rovo/threads/:threadId` — delete thread
- `GET  /api/rovo/threads/:threadId/browser-workspace` — get thread browser workspace
- `POST /api/rovo/threads/:threadId/browser-workspace` — create thread browser workspace
- `DELETE /api/rovo/threads/:threadId/browser-workspace` — delete thread browser workspace
- `POST /api/rovo/detach` — detach stream
- `GET  /api/rovo/background-streams` — list background streams
- `GET  /api/rovo/runs/:threadId/stream` — stream run output
- `POST /api/rovo/runs/:threadId/detach` — detach run
- `POST /api/rovo/runs/:threadId/cancel` — cancel run
- `GET  /api/rovo/votes` — get votes
- `PATCH /api/rovo/votes` — update vote
- `GET  /api/rovo/documents` — list documents
- `POST /api/rovo/documents` — create document
- `DELETE /api/rovo/documents` — delete document
- `POST /api/rovo/files/upload` — upload file
- `GET  /api/rovo/files/:fileId` — get file
- `GET  /api/rovo/generated-media` — serve generated media

### GenUI

- `POST /api/genui-chat` — GenUI chat streaming
- `POST /api/genui-export` — export GenUI output

### Make (build/deploy pipeline)

- `POST /api/make/runs` — create run
- `GET  /api/make/runs` — list runs
- `GET  /api/make/runs/:runId` — get run
- `DELETE /api/make/runs/:runId` — delete run
- `POST /api/make/runs/:runId/tasks` — add tasks to run
- `GET  /api/make/runs/:runId/stream` — stream run output
- `POST /api/make/runs/:runId/directives` — send directive
- `POST /api/make/runs/:runId/share` — share run
- `GET  /api/make/runs/:runId/summary` — get summary
- `GET  /api/make/runs/:runId/publish` — get publish status
- `POST /api/make/runs/:runId/publish` — publish run
- `GET  /api/make/tools` — list tools
- `GET  /api/make/skills` — list skills
- `POST /api/make/skills` — create skill
- `PUT  /api/make/skills/:name` — update skill
- `DELETE /api/make/skills/:name` — delete skill
- `GET  /api/make/skills/:name/raw` — get raw skill
- `GET  /api/make/agents` — list agents
- `POST /api/make/agents` — create agent
- `PUT  /api/make/agents/:name` — update agent
- `DELETE /api/make/agents/:name` — delete agent
- `GET  /api/make/agents/:name/raw` — get raw agent
- `GET  /api/make/config-summary` — get config summary
- `GET  /api/make/forge/sites` — list Forge sites
- `GET  /api/make/forge/dev-spaces` — list Forge dev spaces

### Browser workspaces

- `GET  /api/browser-workspaces` — list workspaces
- `POST /api/browser-workspaces` — create workspace
- `GET  /api/browser-workspaces/:workspaceId` — get workspace
- `DELETE /api/browser-workspaces/:workspaceId` — delete workspace
- `GET  /api/browser-workspaces/:workspaceId/tabs` — list tabs
- `POST /api/browser-workspaces/:workspaceId/tabs` — open tab
- `POST /api/browser-workspaces/:workspaceId/tabs/:tabIndex/navigate` — navigate tab
- `DELETE /api/browser-workspaces/:workspaceId/tabs/:tabIndex` — close tab
- `POST /api/browser-workspaces/:workspaceId/preview-session` — create preview session
- `DELETE /api/browser-workspaces/:workspaceId/preview-session/:sessionId` — delete preview session
- `GET  /api/browser-workspaces/:workspaceId/:action` — generic GET action
- `POST /api/browser-workspaces/:workspaceId/:action` — generic POST action

### Chromium preview

- `GET  /api/chromium-preview` — get preview state
- `GET  /api/chromium-preview/stream` — SSE stream of preview updates
- `POST /api/chromium-preview` — navigate preview
- `POST /api/chromium-preview/viewport` — set viewport
- `POST /api/chromium-preview/back` — go back
- `POST /api/chromium-preview/forward` — go forward
- `POST /api/chromium-preview/reload` — reload
- `POST /api/chromium-preview/click` — click at coordinates
- `POST /api/chromium-preview/click-ref` — click element by ref
- `POST /api/chromium-preview/hover-ref` — hover element by ref
- `POST /api/chromium-preview/fill-ref` — fill input by ref
- `POST /api/chromium-preview/type-ref` — type into element by ref
- `POST /api/chromium-preview/select-ref` — select option by ref
- `POST /api/chromium-preview/scroll` — scroll
- `POST /api/chromium-preview/wheel` — mouse wheel
- `POST /api/chromium-preview/press` — press key
- `POST /api/chromium-preview/type` — type text
- `GET  /api/chromium-preview/snapshot` — accessibility snapshot
- `GET  /api/chromium-preview/screenshot` — take screenshot

### Media & proxy

- `POST /api/sound-generation` — generate sound
- `POST /api/speech-transcription` — transcribe speech
- `GET  /api/image-proxy` — proxy external images
- `GET  /api/web-proxy` — proxy external web content

### Apps

- `GET  /api/apps` — list apps
- `GET  /api/apps/:slug` — get app
- `DELETE /api/apps/:slug` — delete app

### Personal Graph

- `GET  /api/personal-graph/vault` — get local vault selection/status
- `POST /api/personal-graph/vault/select` — open the local folder picker and persist the vault selection
- `GET  /api/personal-graph/explorer` — build graph nodes/edges from raw and wiki files
- `GET  /api/personal-graph/page/*slug` — read a wiki page
- `PUT  /api/personal-graph/page/*slug` — write a wiki page
- `POST /api/personal-graph/raw` — write a raw source
- `GET  /api/personal-graph/unprocessed-count` — count raw sources not recorded in the ingest log
- `POST /api/personal-graph/capture` — capture a URL into a raw source
- `GET  /api/personal-graph/search` — qmd/grep search
- `GET  /api/personal-graph/log` — read ingest log entries
- `POST /api/personal-graph/ingest` — stream librarian ingest events

### Misc

- `POST /api/ticket-classify` — classify ticket
- `POST /api/standup` — generate standup
- `GET  /api/claim-test` — get claim test
- `POST /api/claim-test` — create claim test
- `DELETE /api/claim-test` — delete claim test

### Health

- `GET  /healthcheck`
- `GET  /api/health`

## Orchestrator (cross-panel debugging)

- `GET  /api/orchestrator/log`
- `GET  /api/orchestrator/timeline`
- `DELETE /api/orchestrator/log`

## Dev proxy routes (`app/api/*/route.ts`)

Forward to backend. Grouped by feature:

- `app/api/chat-sdk/route.ts`
- `app/api/chat-sdk/skip-question/route.ts`
- `app/api/chat-cancel/route.ts`
- `app/api/chat-title/route.ts`
- `app/api/plan-title/route.ts`
- `app/api/agent-mode/route.ts`
- `app/api/chat/threads/route.ts`
- `app/api/chat/threads/[threadId]/route.ts`
- `app/api/rovo/chat/route.ts`
- `app/api/rovo/messages/route.ts`
- `app/api/rovo/suggestions/route.ts`
- `app/api/rovo/cancel-deferred-tool/route.ts`
- `app/api/rovo/threads/route.ts`
- `app/api/rovo/threads/[threadId]/route.ts`
- `app/api/rovo/detach/route.ts`
- `app/api/rovo/background-streams/route.ts`
- `app/api/rovo/runs/[threadId]/stream/route.ts`
- `app/api/rovo/runs/[threadId]/detach/route.ts`
- `app/api/rovo/runs/[threadId]/cancel/route.ts`
- `app/api/rovo/votes/route.ts`
- `app/api/rovo/documents/route.ts`
- `app/api/rovo/files/upload/route.ts`
- `app/api/rovo/files/[fileId]/route.ts`
- `app/api/rovo/generated-media/route.ts`
- `app/api/genui-chat/route.ts`
- `app/api/genui-export/route.ts`
- `app/api/make/runs/route.ts`
- `app/api/make/runs/[runId]/route.ts`
- `app/api/make/runs/[runId]/stream/route.ts`
- `app/api/make/runs/[runId]/directives/route.ts`
- `app/api/make/runs/[runId]/share/route.ts`
- `app/api/make/runs/[runId]/summary/route.ts`
- `app/api/make/runs/[runId]/tasks/route.ts`
- `app/api/make/runs/[runId]/publish/route.ts`
- `app/api/make/tools/route.ts`
- `app/api/make/skills/route.ts`
- `app/api/make/skills/[id]/route.ts`
- `app/api/make/skills/[id]/raw/route.ts`
- `app/api/make/agents/route.ts`
- `app/api/make/agents/[id]/route.ts`
- `app/api/make/agents/[id]/raw/route.ts`
- `app/api/make/config-summary/route.ts`
- `app/api/make/forge/sites/route.ts`
- `app/api/make/forge/dev-spaces/route.ts`
- `app/api/browser-workspaces/route.ts`
- `app/api/browser-workspaces/[workspaceId]/route.ts`
- `app/api/browser-workspaces/[workspaceId]/[action]/route.ts`
- `app/api/browser-workspaces/[workspaceId]/tabs/route.ts`
- `app/api/browser-workspaces/[workspaceId]/tabs/[tabIndex]/route.ts`
- `app/api/browser-workspaces/[workspaceId]/preview-session/route.ts`
- `app/api/browser-workspaces/[workspaceId]/preview-session/[sessionId]/route.ts`
- `app/api/chromium-preview/route.ts`
- `app/api/chromium-preview/stream/route.ts`
- `app/api/chromium-preview/[action]/route.ts`
- `app/api/chromium-preview/screenshot/route.ts`
- `app/api/chromium-preview/snapshot/route.ts`
- `app/api/sound-generation/route.ts`
- `app/api/speech-transcription/route.ts`
- `app/api/web-proxy/route.ts`
- `app/api/apps/route.ts`
- `app/api/apps/[slug]/route.ts`
- `app/api/personal-graph/vault/route.ts`
- `app/api/personal-graph/vault/select/route.ts`
- `app/api/personal-graph/explorer/route.ts`
- `app/api/personal-graph/page/[...slug]/route.ts`
- `app/api/personal-graph/raw/route.ts`
- `app/api/personal-graph/unprocessed-count/route.ts`
- `app/api/personal-graph/capture/route.ts`
- `app/api/personal-graph/search/route.ts`
- `app/api/personal-graph/log/route.ts`
- `app/api/personal-graph/ingest/route.ts`
- `app/api/ticket-classify/route.ts`
- `app/api/standup/route.ts`
- `app/api/sprint-board/tasks/route.ts`
- `app/api/realtime/ws-url/route.ts`
- `app/api/orchestrator/log/route.ts`
- `app/api/orchestrator/timeline/route.ts`
- `app/api/health/route.ts`
