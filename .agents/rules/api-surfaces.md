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

## Backend (`backend/server.js`)

### Chat

- `POST /api/chat-sdk` — main chat streaming endpoint
- `POST /api/chat-cancel` — cancel in-progress chat
- `POST /api/chat-title` — generate thread title
- `POST /api/plan-title` — generate plan title
- `POST /api/chat-sdk/skip-question` — skip deferred question
- `POST /api/agent-mode` — set agent mode
- `GET  /api/agent-mode` — get agent mode

### Future Chat

- `POST /api/future-chat/chat` — send message
- `GET  /api/future-chat/messages` — list messages
- `POST /api/future-chat/messages` — create message
- `POST /api/future-chat/suggestions` — generate suggestions
- `POST /api/future-chat/cancel-deferred-tool` — cancel deferred tool
- `GET  /api/future-chat/threads` — list threads
- `POST /api/future-chat/threads` — create thread
- `DELETE /api/future-chat/threads` — delete all threads
- `GET  /api/future-chat/threads/:threadId` — get thread
- `PUT  /api/future-chat/threads/:threadId` — update thread
- `DELETE /api/future-chat/threads/:threadId` — delete thread
- `POST /api/future-chat/detach` — detach stream
- `GET  /api/future-chat/background-streams` — list background streams
- `GET  /api/future-chat/runs/:threadId/stream` — stream run output
- `POST /api/future-chat/runs/:threadId/detach` — detach run
- `POST /api/future-chat/runs/:threadId/cancel` — cancel run
- `GET  /api/future-chat/votes` — get votes
- `PATCH /api/future-chat/votes` — update vote
- `GET  /api/future-chat/documents` — list documents
- `POST /api/future-chat/documents` — create document
- `DELETE /api/future-chat/documents` — delete document
- `POST /api/future-chat/files/upload` — upload file
- `GET  /api/future-chat/files/:fileId` — get file

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
- `app/api/future-chat/chat/route.ts`
- `app/api/future-chat/messages/route.ts`
- `app/api/future-chat/suggestions/route.ts`
- `app/api/future-chat/cancel-deferred-tool/route.ts`
- `app/api/future-chat/threads/route.ts`
- `app/api/future-chat/threads/[threadId]/route.ts`
- `app/api/future-chat/detach/route.ts`
- `app/api/future-chat/background-streams/route.ts`
- `app/api/future-chat/runs/[threadId]/stream/route.ts`
- `app/api/future-chat/runs/[threadId]/detach/route.ts`
- `app/api/future-chat/runs/[threadId]/cancel/route.ts`
- `app/api/future-chat/votes/route.ts`
- `app/api/future-chat/documents/route.ts`
- `app/api/future-chat/files/upload/route.ts`
- `app/api/future-chat/files/[fileId]/route.ts`
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
- `app/api/ticket-classify/route.ts`
- `app/api/standup/route.ts`
- `app/api/sprint-board/tasks/route.ts`
- `app/api/realtime/ws-url/route.ts`
- `app/api/orchestrator/log/route.ts`
- `app/api/orchestrator/timeline/route.ts`
- `app/api/health/route.ts`
