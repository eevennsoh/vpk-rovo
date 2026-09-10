# API Surfaces — generated endpoint tables

Generated file. Do not edit by hand — run `node scripts/generate-api-surfaces.js`.

Judgment guidance lives in `.agents/rules/api-surfaces.md`; the tables live here because everything
under `.agents/rules/` is eagerly loaded into every agent session. Source of truth is
`backend/routes/route-manifest.json`.

## Generated Endpoint Tables

<!-- generated:begin -->
<!-- Do not edit this section by hand. Run `node scripts/generate-api-surfaces.js`. -->

Generated from `backend/routes/route-manifest.json`. Backend routes: 164; runtime-admin routes: 41; Next API routes: 140.

### Backend Routes

| Method | Path | Runtime admin | Source |
| --- | --- | --- | --- |
| `GET` | `/api/agent-mode` | no | `backend/routes/agent-mode.js:70` |
| `POST` | `/api/agent-mode` | no | `backend/routes/agent-mode.js:42` |
| `POST` | `/api/agents/rfp-demo/agent/apply` | no | `backend/routes/demos.js:200` |
| `POST` | `/api/agents/rfp-demo/events/ticket-entered-column` | no | `backend/routes/demos.js:214` |
| `POST` | `/api/agents/rfp-demo/reset` | no | `backend/routes/demos.js:184` |
| `GET` | `/api/agents/rfp-demo/state` | no | `backend/routes/demos.js:156` |
| `POST` | `/api/agents/rfp-demo/state` | no | `backend/routes/demos.js:168` |
| `POST` | `/api/agents/rfp-demo/vpk-html-report` | no | `backend/routes/demos.js:67` |
| `GET` | `/api/browser-workspaces` | yes | `backend/routes/browser-workspaces.js:126` |
| `POST` | `/api/browser-workspaces` | yes | `backend/routes/browser-workspaces.js:142` |
| `DELETE` | `/api/browser-workspaces/:workspaceId` | yes | `backend/routes/browser-workspaces.js:182` |
| `GET` | `/api/browser-workspaces/:workspaceId` | yes | `backend/routes/browser-workspaces.js:160` |
| `GET` | `/api/browser-workspaces/:workspaceId/:action` | yes | `backend/routes/browser-workspaces.js:391` |
| `POST` | `/api/browser-workspaces/:workspaceId/:action` | yes | `backend/routes/browser-workspaces.js:479` |
| `POST` | `/api/browser-workspaces/:workspaceId/preview-session` | yes | `backend/routes/browser-workspaces.js:316` |
| `DELETE` | `/api/browser-workspaces/:workspaceId/preview-session/:sessionId` | yes | `backend/routes/browser-workspaces.js:355` |
| `GET` | `/api/browser-workspaces/:workspaceId/tabs` | yes | `backend/routes/browser-workspaces.js:204` |
| `POST` | `/api/browser-workspaces/:workspaceId/tabs` | yes | `backend/routes/browser-workspaces.js:226` |
| `DELETE` | `/api/browser-workspaces/:workspaceId/tabs/:tabIndex` | yes | `backend/routes/browser-workspaces.js:284` |
| `POST` | `/api/browser-workspaces/:workspaceId/tabs/:tabIndex/activate` | yes | `backend/routes/browser-workspaces.js:252` |
| `POST` | `/api/chat-cancel` | no | `backend/routes/chat-control.js:42` |
| `POST` | `/api/chat-sdk` | no | `backend/routes/chat-sdk.js:17` |
| `POST` | `/api/chat-sdk/skip-question` | no | `backend/routes/chat-skip-question.js:60` |
| `POST` | `/api/chat-title` | no | `backend/routes/ai-utilities.js:181` |
| `GET` | `/api/checkpoints` | no | `backend/routes/rovo-app.js:267` |
| `POST` | `/api/checkpoints` | yes | `backend/routes/rovo-app.js:280` |
| `DELETE` | `/api/checkpoints/:id` | yes | `backend/routes/rovo-app.js:313` |
| `POST` | `/api/checkpoints/:id/rollback` | yes | `backend/routes/rovo-app.js:299` |
| `GET` | `/api/chromium-preview` | no | `backend/routes/chromium-preview.js:57` |
| `POST` | `/api/chromium-preview` | no | `backend/routes/chromium-preview.js:83` |
| `POST` | `/api/chromium-preview/back` | no | `backend/routes/chromium-preview.js:116` |
| `POST` | `/api/chromium-preview/click` | no | `backend/routes/chromium-preview.js:152` |
| `POST` | `/api/chromium-preview/click-ref` | no | `backend/routes/chromium-preview.js:164` |
| `POST` | `/api/chromium-preview/fill-ref` | no | `backend/routes/chromium-preview.js:202` |
| `POST` | `/api/chromium-preview/forward` | no | `backend/routes/chromium-preview.js:128` |
| `POST` | `/api/chromium-preview/hover-ref` | no | `backend/routes/chromium-preview.js:183` |
| `POST` | `/api/chromium-preview/press` | no | `backend/routes/chromium-preview.js:317` |
| `POST` | `/api/chromium-preview/reload` | no | `backend/routes/chromium-preview.js:140` |
| `GET` | `/api/chromium-preview/screenshot` | no | `backend/routes/chromium-preview.js:368` |
| `POST` | `/api/chromium-preview/scroll` | no | `backend/routes/chromium-preview.js:280` |
| `POST` | `/api/chromium-preview/select-ref` | no | `backend/routes/chromium-preview.js:252` |
| `GET` | `/api/chromium-preview/snapshot` | no | `backend/routes/chromium-preview.js:355` |
| `GET` | `/api/chromium-preview/stream` | no | `backend/routes/chromium-preview.js:69` |
| `POST` | `/api/chromium-preview/type` | no | `backend/routes/chromium-preview.js:336` |
| `POST` | `/api/chromium-preview/type-ref` | no | `backend/routes/chromium-preview.js:227` |
| `POST` | `/api/chromium-preview/viewport` | no | `backend/routes/chromium-preview.js:102` |
| `POST` | `/api/chromium-preview/wheel` | no | `backend/routes/chromium-preview.js:302` |
| `DELETE` | `/api/claim-test` | no | `backend/routes/demos.js:124` |
| `GET` | `/api/claim-test` | no | `backend/routes/demos.js:98` |
| `POST` | `/api/claim-test` | no | `backend/routes/demos.js:111` |
| `POST` | `/api/genui-chat` | no | `backend/routes/genui.js:33` |
| `POST` | `/api/genui-description-summary` | no | `backend/routes/ai-utilities.js:246` |
| `POST` | `/api/genui-export` | no | `backend/routes/genui.js:39` |
| `GET` | `/api/health` | no | `backend/routes/status.js:205` |
| `POST` | `/api/html-selector/dispatch` | no | `backend/routes/html-selector.js:99` |
| `GET` | `/api/html-selector/tokens` | no | `backend/routes/html-selector.js:168` |
| `GET` | `/api/image-proxy` | no | `backend/routes/media.js:184` |
| `GET` | `/api/jobs` | no | `backend/routes/jobs.js:66` |
| `POST` | `/api/jobs` | yes | `backend/routes/jobs.js:83` |
| `DELETE` | `/api/jobs/:id` | yes | `backend/routes/jobs.js:126` |
| `GET` | `/api/jobs/:id` | no | `backend/routes/jobs.js:98` |
| `PATCH` | `/api/jobs/:id` | yes | `backend/routes/jobs.js:108` |
| `POST` | `/api/jobs/:id/pause` | yes | `backend/routes/jobs.js:146` |
| `POST` | `/api/jobs/:id/resume` | yes | `backend/routes/jobs.js:156` |
| `POST` | `/api/jobs/:id/run` | yes | `backend/routes/jobs.js:136` |
| `DELETE` | `/api/orchestrator/log` | yes | `backend/routes/orchestrator.js:72` |
| `GET` | `/api/orchestrator/log` | no | `backend/routes/orchestrator.js:46` |
| `GET` | `/api/orchestrator/timeline` | no | `backend/routes/orchestrator.js:59` |
| `POST` | `/api/personal-graph/capture` | no | `backend/routes/personal-graph.js:608` |
| `GET` | `/api/personal-graph/explorer` | no | `backend/routes/personal-graph.js:424` |
| `POST` | `/api/personal-graph/ingest` | no | `backend/routes/personal-graph.js:657` |
| `GET` | `/api/personal-graph/log` | no | `backend/routes/personal-graph.js:641` |
| `GET` | `/api/personal-graph/page/*slug` | no | `backend/routes/personal-graph.js:547` |
| `PUT` | `/api/personal-graph/page/*slug` | no | `backend/routes/personal-graph.js:560` |
| `POST` | `/api/personal-graph/raw` | no | `backend/routes/personal-graph.js:574` |
| `GET` | `/api/personal-graph/search` | no | `backend/routes/personal-graph.js:624` |
| `GET` | `/api/personal-graph/source` | no | `backend/routes/personal-graph.js:449` |
| `POST` | `/api/personal-graph/source` | no | `backend/routes/personal-graph.js:463` |
| `POST` | `/api/personal-graph/summarize` | no | `backend/routes/personal-graph.js:653` |
| `POST` | `/api/personal-graph/twg/chat` | no | `backend/routes/personal-graph.js:478` |
| `POST` | `/api/personal-graph/twg/expand` | no | `backend/routes/personal-graph.js:514` |
| `POST` | `/api/personal-graph/twg/refresh` | no | `backend/routes/personal-graph.js:492` |
| `GET` | `/api/personal-graph/unprocessed-count` | no | `backend/routes/personal-graph.js:596` |
| `GET` | `/api/personal-graph/vault` | no | `backend/routes/personal-graph.js:140` |
| `POST` | `/api/personal-graph/vault/reset` | no | `backend/routes/personal-graph.js:166` |
| `POST` | `/api/personal-graph/vault/select` | no | `backend/routes/personal-graph.js:152` |
| `POST` | `/api/plan-title` | no | `backend/routes/ai-utilities.js:213` |
| `GET` | `/api/realtime/audio-conversation-token` | no | `backend/routes/realtime.js:26` |
| `GET` | `/api/rovo/background-streams` | no | `backend/routes/rovo-app.js:480` |
| `POST` | `/api/rovo/cancel-deferred-tool` | no | `backend/routes/chat-control.js:52` |
| `POST` | `/api/rovo/chat` | no | `backend/routes/rovo-chat-proxy.js:21` |
| `POST` | `/api/rovo/detach` | no | `backend/routes/rovo-app.js:458` |
| `DELETE` | `/api/rovo/documents` | no | `backend/routes/rovo-app.js:773` |
| `GET` | `/api/rovo/documents` | no | `backend/routes/rovo-app.js:697` |
| `POST` | `/api/rovo/documents` | no | `backend/routes/rovo-app.js:720` |
| `GET` | `/api/rovo/files/:fileId` | no | `backend/routes/rovo-app.js:818` |
| `POST` | `/api/rovo/files/upload` | no | `backend/routes/rovo-app.js:789` |
| `GET` | `/api/rovo/generated-media` | no | `backend/routes/rovo-app.js:838` |
| `GET` | `/api/rovo/messages` | no | `backend/routes/rovo-app.js:171` |
| `POST` | `/api/rovo/messages` | no | `backend/routes/rovo-app.js:189` |
| `POST` | `/api/rovo/runs/:threadId/cancel` | no | `backend/routes/rovo-app.js:540` |
| `POST` | `/api/rovo/runs/:threadId/detach` | no | `backend/routes/rovo-app.js:516` |
| `GET` | `/api/rovo/runs/:threadId/stream` | no | `backend/routes/rovo-app.js:490` |
| `POST` | `/api/rovo/suggestions` | no | `backend/routes/ai-utilities.js:99` |
| `DELETE` | `/api/rovo/threads` | no | `backend/routes/rovo-app.js:370` |
| `GET` | `/api/rovo/threads` | no | `backend/routes/rovo-app.js:225` |
| `POST` | `/api/rovo/threads` | no | `backend/routes/rovo-app.js:328` |
| `DELETE` | `/api/rovo/threads/:threadId` | no | `backend/routes/rovo-app.js:627` |
| `GET` | `/api/rovo/threads/:threadId` | no | `backend/routes/rovo-app.js:396` |
| `PUT` | `/api/rovo/threads/:threadId` | no | `backend/routes/rovo-app.js:415` |
| `DELETE` | `/api/rovo/threads/:threadId/browser-workspace` | yes | `backend/routes/rovo-app.js:612` |
| `GET` | `/api/rovo/threads/:threadId/browser-workspace` | no | `backend/routes/rovo-app.js:566` |
| `POST` | `/api/rovo/threads/:threadId/browser-workspace` | yes | `backend/routes/rovo-app.js:585` |
| `GET` | `/api/rovo/votes` | no | `backend/routes/rovo-app.js:660` |
| `PATCH` | `/api/rovo/votes` | no | `backend/routes/rovo-app.js:676` |
| `GET` | `/api/sessions/search` | no | `backend/routes/rovo-app.js:246` |
| `GET` | `/api/skills` | no | `backend/routes/skills.js:58` |
| `GET` | `/api/skills/:category/:name` | no | `backend/routes/skills.js:248` |
| `GET` | `/api/skills/:category/:name/bundle` | no | `backend/routes/skills.js:265` |
| `POST` | `/api/skills/:category/:name/toggle` | yes | `backend/routes/skills.js:282` |
| `GET` | `/api/skills/drafts` | yes | `backend/lib/hermes-skill-draft-routes.js:8` |
| `DELETE` | `/api/skills/drafts/:id` | yes | `backend/lib/hermes-skill-draft-routes.js:80` |
| `GET` | `/api/skills/drafts/:id` | yes | `backend/lib/hermes-skill-draft-routes.js:27` |
| `POST` | `/api/skills/drafts/:id/approve` | yes | `backend/lib/hermes-skill-draft-routes.js:42` |
| `POST` | `/api/skills/drafts/:id/reject` | yes | `backend/lib/hermes-skill-draft-routes.js:63` |
| `GET` | `/api/skills/hub/browse` | no | `backend/routes/skills.js:90` |
| `GET` | `/api/skills/hub/check` | no | `backend/routes/skills.js:188` |
| `GET` | `/api/skills/hub/inspect/*identifier` | no | `backend/routes/skills.js:105` |
| `POST` | `/api/skills/hub/install` | yes | `backend/routes/skills.js:133` |
| `POST` | `/api/skills/hub/install-by-id` | yes | `backend/routes/skills.js:151` |
| `GET` | `/api/skills/hub/installed` | no | `backend/routes/skills.js:121` |
| `GET` | `/api/skills/hub/search` | no | `backend/routes/skills.js:72` |
| `GET` | `/api/skills/hub/taps` | no | `backend/routes/skills.js:201` |
| `POST` | `/api/skills/hub/taps` | yes | `backend/routes/skills.js:213` |
| `DELETE` | `/api/skills/hub/taps/*repo` | yes | `backend/routes/skills.js:229` |
| `DELETE` | `/api/skills/hub/uninstall/*name` | yes | `backend/routes/skills.js:169` |
| `POST` | `/api/sound-generation` | no | `backend/routes/media.js:91` |
| `POST` | `/api/speech-transcription` | no | `backend/routes/media.js:133` |
| `POST` | `/api/standup` | no | `backend/routes/demos.js:137` |
| `GET` | `/api/status` | no | `backend/routes/status.js:99` |
| `GET` | `/api/status/hermes` | no | `backend/routes/status.js:81` |
| `GET` | `/api/status/rovo` | no | `backend/routes/status.js:64` |
| `POST` | `/api/studio/agent-data-flow` | no | `backend/routes/ai-utilities.js:144` |
| `POST` | `/api/ticket-classify` | no | `backend/routes/demos.js:79` |
| `GET` | `/api/vpk-html` | no | `backend/routes/vpk-html.js:417` |
| `GET` | `/api/vpk-html/*assetPath` | no | `backend/routes/vpk-html.js:418` |
| `POST` | `/api/vpk-html/apply-tokens` | no | `backend/routes/vpk-html.js:310` |
| `GET` | `/api/vpk-html/notes` | no | `backend/routes/vpk-html.js:335` |
| `PUT` | `/api/vpk-html/notes` | no | `backend/routes/vpk-html.js:356` |
| `POST` | `/api/vpk-html/publish-gist` | no | `backend/routes/vpk-html.js:383` |
| `POST` | `/api/wiki/captures` | yes | `backend/routes/wiki.js:20` |
| `GET` | `/api/wiki/memories` | no | `backend/routes/wiki.js:23` |
| `DELETE` | `/api/wiki/memories/:scope/blocks/:blockId` | yes | `backend/routes/wiki.js:28` |
| `DELETE` | `/api/wiki/memories/proposals/:proposalId` | yes | `backend/routes/wiki.js:29` |
| `POST` | `/api/wiki/memories/reset` | yes | `backend/routes/wiki.js:30` |
| `GET` | `/api/wiki/memory-explorer` | no | `backend/routes/wiki.js:24` |
| `POST` | `/api/wiki/memory-explorer/brief` | no | `backend/routes/wiki.js:26` |
| `POST` | `/api/wiki/memory-explorer/deck` | no | `backend/routes/wiki.js:27` |
| `GET` | `/api/wiki/memory-explorer/export` | no | `backend/routes/wiki.js:25` |
| `GET` | `/api/wiki/search` | no | `backend/routes/wiki.js:21` |
| `GET` | `/api/wiki/status` | no | `backend/routes/wiki.js:19` |
| `POST` | `/api/wiki/sync` | yes | `backend/routes/wiki.js:31` |
| `POST` | `/api/wiki/synthesis` | yes | `backend/routes/wiki.js:22` |
| `GET` | `/healthcheck` | no | `backend/routes/status.js:204` |

### Next API Proxy Routes

| Method | Next path | Backend targets | Source |
| --- | --- | --- | --- |
| `GET` | `/api/agent-mode` | `GET /api/agent-mode` | `app/api/agent-mode/route.ts:5` |
| `POST` | `/api/agent-mode` | `POST /api/agent-mode` | `app/api/agent-mode/route.ts:13` |
| `POST` | `/api/agents/rfp-demo/agent/apply` | `POST /api/agents/rfp-demo/agent/apply` | `app/api/agents/rfp-demo/agent/apply/route.ts:5` |
| `POST` | `/api/agents/rfp-demo/events/ticket-entered-column` | `POST /api/agents/rfp-demo/events/ticket-entered-column` | `app/api/agents/rfp-demo/events/ticket-entered-column/route.ts:5` |
| `POST` | `/api/agents/rfp-demo/reset` | `POST /api/agents/rfp-demo/reset` | `app/api/agents/rfp-demo/reset/route.ts:5` |
| `GET` | `/api/agents/rfp-demo/state` | `GET /api/agents/rfp-demo/state` | `app/api/agents/rfp-demo/state/route.ts:11` |
| `POST` | `/api/agents/rfp-demo/state` | `POST /api/agents/rfp-demo/state` | `app/api/agents/rfp-demo/state/route.ts:21` |
| `POST` | `/api/agents/rfp-demo/vpk-html-report` | `POST /api/agents/rfp-demo/vpk-html-report` | `app/api/agents/rfp-demo/vpk-html-report/route.ts:5` |
| `GET` | `/api/browser-workspaces` | `GET /api/browser-workspaces` | `app/api/browser-workspaces/route.ts:5` |
| `POST` | `/api/browser-workspaces` | `POST /api/browser-workspaces` | `app/api/browser-workspaces/route.ts:12` |
| `DELETE` | `/api/browser-workspaces/:workspaceId` | `DELETE /api/browser-workspaces/:workspaceId` | `app/api/browser-workspaces/[workspaceId]/route.ts:21` |
| `GET` | `/api/browser-workspaces/:workspaceId` | `GET /api/browser-workspaces/:workspaceId` | `app/api/browser-workspaces/[workspaceId]/route.ts:9` |
| `GET` | `/api/browser-workspaces/:workspaceId/:action` | `GET /api/browser-workspaces/:workspaceId/:action` | `app/api/browser-workspaces/[workspaceId]/[action]/route.ts:31` |
| `POST` | `/api/browser-workspaces/:workspaceId/:action` | `POST /api/browser-workspaces/:workspaceId/:action` | `app/api/browser-workspaces/[workspaceId]/[action]/route.ts:49` |
| `POST` | `/api/browser-workspaces/:workspaceId/preview-session` | `POST /api/browser-workspaces/:workspaceId/preview-session` | `app/api/browser-workspaces/[workspaceId]/preview-session/route.ts:11` |
| `DELETE` | `/api/browser-workspaces/:workspaceId/preview-session/:sessionId` | `DELETE /api/browser-workspaces/:workspaceId/preview-session/:sessionId` | `app/api/browser-workspaces/[workspaceId]/preview-session/[sessionId]/route.ts:10` |
| `GET` | `/api/browser-workspaces/:workspaceId/tabs` | `GET /api/browser-workspaces/:workspaceId/tabs` | `app/api/browser-workspaces/[workspaceId]/tabs/route.ts:11` |
| `POST` | `/api/browser-workspaces/:workspaceId/tabs` | `POST /api/browser-workspaces/:workspaceId/tabs` | `app/api/browser-workspaces/[workspaceId]/tabs/route.ts:23` |
| `DELETE` | `/api/browser-workspaces/:workspaceId/tabs/:tabIndex` | `DELETE /api/browser-workspaces/:workspaceId/tabs/:tabIndex` | `app/api/browser-workspaces/[workspaceId]/tabs/[tabIndex]/route.ts:10` |
| `POST` | `/api/browser-workspaces/:workspaceId/tabs/:tabIndex/activate` | `POST /api/browser-workspaces/:workspaceId/tabs/:tabIndex/activate` | `app/api/browser-workspaces/[workspaceId]/tabs/[tabIndex]/activate/route.ts:10` |
| `POST` | `/api/chat-cancel` | `POST /api/chat-cancel` | `app/api/chat-cancel/route.ts:4` |
| `POST` | `/api/chat-sdk` | `POST /api/chat-sdk` | `app/api/chat-sdk/route.ts:51` |
| `POST` | `/api/chat-sdk/skip-question` | `POST /api/chat-sdk/skip-question` | `app/api/chat-sdk/skip-question/route.ts:5` |
| `POST` | `/api/chat-title` | `POST /api/chat-title` | `app/api/chat-title/route.ts:5` |
| `GET` | `/api/checkpoints` | `GET /api/checkpoints` | `app/api/checkpoints/route.ts:5` |
| `POST` | `/api/checkpoints` | `POST /api/checkpoints` | `app/api/checkpoints/route.ts:12` |
| `DELETE` | `/api/checkpoints/:id` | `DELETE /api/checkpoints/:id` | `app/api/checkpoints/[id]/route.ts:4` |
| `POST` | `/api/checkpoints/:id/rollback` | `POST /api/checkpoints/:id/rollback` | `app/api/checkpoints/[id]/rollback/route.ts:4` |
| `GET` | `/api/chromium-preview` | `GET /api/chromium-preview` | `app/api/chromium-preview/route.ts:5` |
| `POST` | `/api/chromium-preview` | `POST /api/chromium-preview` | `app/api/chromium-preview/route.ts:12` |
| `POST` | `/api/chromium-preview/:action` | `POST /api/chromium-preview/:action` | `app/api/chromium-preview/[action]/route.ts:22` |
| `GET` | `/api/chromium-preview/screenshot` | `GET /api/chromium-preview/screenshot` | `app/api/chromium-preview/screenshot/route.ts:4` |
| `GET` | `/api/chromium-preview/snapshot` | `GET /api/chromium-preview/snapshot` | `app/api/chromium-preview/snapshot/route.ts:4` |
| `GET` | `/api/chromium-preview/stream` | `GET /api/chromium-preview/stream` | `app/api/chromium-preview/stream/route.ts:3` |
| `POST` | `/api/genui-chat` | `POST /api/genui-chat` | `app/api/genui-chat/route.ts:16` |
| `POST` | `/api/genui-description-summary` | `POST /api/genui-description-summary` | `app/api/genui-description-summary/route.ts:5` |
| `POST` | `/api/genui-export` | `POST /api/genui-export` | `app/api/genui-export/route.ts:13` |
| `GET` | `/api/health` | `GET /api/health` | `app/api/health/route.ts:3` |
| `POST` | `/api/html-selector/dispatch` | `POST /api/html-selector/dispatch` | `app/api/html-selector/dispatch/route.ts:5` |
| `GET` | `/api/html-selector/tokens` | `GET /api/html-selector/tokens` | `app/api/html-selector/tokens/route.ts:3` |
| `GET` | `/api/jobs` | `GET /api/jobs` | `app/api/jobs/route.ts:5` |
| `POST` | `/api/jobs` | `POST /api/jobs` | `app/api/jobs/route.ts:12` |
| `DELETE` | `/api/jobs/:id` | `DELETE /api/jobs/:id` | `app/api/jobs/[id]/route.ts:33` |
| `GET` | `/api/jobs/:id` | `GET /api/jobs/:id` | `app/api/jobs/[id]/route.ts:11` |
| `PATCH` | `/api/jobs/:id` | `PATCH /api/jobs/:id` | `app/api/jobs/[id]/route.ts:19` |
| `POST` | `/api/jobs/:id/pause` | `POST /api/jobs/:id/pause` | `app/api/jobs/[id]/pause/route.ts:11` |
| `POST` | `/api/jobs/:id/resume` | `POST /api/jobs/:id/resume` | `app/api/jobs/[id]/resume/route.ts:11` |
| `POST` | `/api/jobs/:id/run` | `POST /api/jobs/:id/run` | `app/api/jobs/[id]/run/route.ts:11` |
| `DELETE` | `/api/orchestrator/log` | `DELETE /api/orchestrator/log` | `app/api/orchestrator/log/route.ts:21` |
| `GET` | `/api/orchestrator/log` | `GET /api/orchestrator/log` | `app/api/orchestrator/log/route.ts:4` |
| `GET` | `/api/orchestrator/timeline` | `GET /api/orchestrator/timeline` | `app/api/orchestrator/timeline/route.ts:4` |
| `POST` | `/api/personal-graph/capture` | `POST /api/personal-graph/capture` | `app/api/personal-graph/capture/route.ts:5` |
| `GET` | `/api/personal-graph/explorer` | `GET /api/personal-graph/explorer` | `app/api/personal-graph/explorer/route.ts:3` |
| `POST` | `/api/personal-graph/ingest` | `POST /api/personal-graph/ingest` | `app/api/personal-graph/ingest/route.ts:5` |
| `GET` | `/api/personal-graph/log` | `GET /api/personal-graph/log` | `app/api/personal-graph/log/route.ts:3` |
| `GET` | `/api/personal-graph/page/*slug` | `GET /api/personal-graph/page/*slug` | `app/api/personal-graph/page/[...slug]/route.ts:9` |
| `PUT` | `/api/personal-graph/page/*slug` | `PUT /api/personal-graph/page/*slug` | `app/api/personal-graph/page/[...slug]/route.ts:18` |
| `POST` | `/api/personal-graph/raw` | `POST /api/personal-graph/raw` | `app/api/personal-graph/raw/route.ts:6` |
| `GET` | `/api/personal-graph/search` | `GET /api/personal-graph/search` | `app/api/personal-graph/search/route.ts:4` |
| `GET` | `/api/personal-graph/source` | `GET /api/personal-graph/source` | `app/api/personal-graph/source/route.ts:4` |
| `POST` | `/api/personal-graph/source` | `POST /api/personal-graph/source` | `app/api/personal-graph/source/route.ts:11` |
| `POST` | `/api/personal-graph/summarize` | `POST /api/personal-graph/summarize` | `app/api/personal-graph/summarize/route.ts:5` |
| `POST` | `/api/personal-graph/twg/chat` | `POST /api/personal-graph/twg/chat` | `app/api/personal-graph/twg/chat/route.ts:4` |
| `POST` | `/api/personal-graph/twg/expand` | `POST /api/personal-graph/twg/expand` | `app/api/personal-graph/twg/expand/route.ts:5` |
| `POST` | `/api/personal-graph/twg/refresh` | `POST /api/personal-graph/twg/refresh` | `app/api/personal-graph/twg/refresh/route.ts:3` |
| `GET` | `/api/personal-graph/unprocessed-count` | `GET /api/personal-graph/unprocessed-count` | `app/api/personal-graph/unprocessed-count/route.ts:3` |
| `GET` | `/api/personal-graph/vault` | `GET /api/personal-graph/vault` | `app/api/personal-graph/vault/route.ts:3` |
| `POST` | `/api/personal-graph/vault/reset` | `POST /api/personal-graph/vault/reset` | `app/api/personal-graph/vault/reset/route.ts:3` |
| `POST` | `/api/personal-graph/vault/select` | `POST /api/personal-graph/vault/select` | `app/api/personal-graph/vault/select/route.ts:3` |
| `POST` | `/api/plan-title` | `POST /api/plan-title` | `app/api/plan-title/route.ts:5` |
| `GET` | `/api/realtime/audio-conversation-token` | `GET /api/realtime/audio-conversation-token` | `app/api/realtime/audio-conversation-token/route.ts:3` |
| `GET` | `/api/realtime/ws-url` |  | `app/api/realtime/ws-url/route.ts:12` |
| `GET` | `/api/rovo/background-streams` | `GET /api/rovo/background-streams` | `app/api/rovo/background-streams/route.ts:3` |
| `POST` | `/api/rovo/cancel-deferred-tool` | `POST /api/rovo/cancel-deferred-tool` | `app/api/rovo/cancel-deferred-tool/route.ts:4` |
| `POST` | `/api/rovo/chat` | `POST /api/rovo/chat` | `app/api/rovo/chat/route.ts:5` |
| `POST` | `/api/rovo/detach` | `POST /api/rovo/detach` | `app/api/rovo/detach/route.ts:5` |
| `DELETE` | `/api/rovo/documents` | `DELETE /api/rovo/documents` | `app/api/rovo/documents/route.ts:47` |
| `GET` | `/api/rovo/documents` | `GET /api/rovo/documents` | `app/api/rovo/documents/route.ts:9` |
| `POST` | `/api/rovo/documents` | `POST /api/rovo/documents` | `app/api/rovo/documents/route.ts:32` |
| `GET` | `/api/rovo/files/:fileId` | `GET /api/rovo/files/:fileId` | `app/api/rovo/files/[fileId]/route.ts:8` |
| `POST` | `/api/rovo/files/upload` | `POST /api/rovo/files/upload` | `app/api/rovo/files/upload/route.ts:5` |
| `GET` | `/api/rovo/generated-media` | `GET /api/rovo/generated-media` | `app/api/rovo/generated-media/route.ts:4` |
| `GET` | `/api/rovo/messages` | `GET /api/rovo/messages` | `app/api/rovo/messages/route.ts:6` |
| `POST` | `/api/rovo/messages` | `POST /api/rovo/messages` | `app/api/rovo/messages/route.ts:18` |
| `POST` | `/api/rovo/runs/:threadId/cancel` | `POST /api/rovo/runs/:threadId/cancel` | `app/api/rovo/runs/[threadId]/cancel/route.ts:7` |
| `POST` | `/api/rovo/runs/:threadId/detach` | `POST /api/rovo/runs/:threadId/detach` | `app/api/rovo/runs/[threadId]/detach/route.ts:7` |
| `GET` | `/api/rovo/runs/:threadId/stream` | `GET /api/rovo/runs/:threadId/stream` | `app/api/rovo/runs/[threadId]/stream/route.ts:7` |
| `POST` | `/api/rovo/suggestions` | `POST /api/rovo/suggestions` | `app/api/rovo/suggestions/route.ts:6` |
| `DELETE` | `/api/rovo/threads` | `DELETE /api/rovo/threads` | `app/api/rovo/threads/route.ts:31` |
| `GET` | `/api/rovo/threads` | `GET /api/rovo/threads` | `app/api/rovo/threads/route.ts:6` |
| `POST` | `/api/rovo/threads` | `POST /api/rovo/threads` | `app/api/rovo/threads/route.ts:18` |
| `DELETE` | `/api/rovo/threads/:threadId` | `DELETE /api/rovo/threads/:threadId` | `app/api/rovo/threads/[threadId]/route.ts:35` |
| `GET` | `/api/rovo/threads/:threadId` | `GET /api/rovo/threads/:threadId` | `app/api/rovo/threads/[threadId]/route.ts:10` |
| `PUT` | `/api/rovo/threads/:threadId` | `PUT /api/rovo/threads/:threadId` | `app/api/rovo/threads/[threadId]/route.ts:21` |
| `GET` | `/api/rovo/votes` | `GET /api/rovo/votes` | `app/api/rovo/votes/route.ts:6` |
| `PATCH` | `/api/rovo/votes` | `PATCH /api/rovo/votes` | `app/api/rovo/votes/route.ts:18` |
| `GET` | `/api/sessions/search` | `GET /api/sessions/search` | `app/api/sessions/search/route.ts:4` |
| `GET` | `/api/skills` | `GET /api/skills` | `app/api/skills/route.ts:4` |
| `GET` | `/api/skills/:category/:name` | `GET /api/skills/:category/:name` | `app/api/skills/[category]/[name]/route.ts:11` |
| `GET` | `/api/skills/:category/:name/bundle` | `GET /api/skills/:category/:name/bundle` | `app/api/skills/[category]/[name]/bundle/route.ts:11` |
| `POST` | `/api/skills/:category/:name/toggle` | `POST /api/skills/:category/:name/toggle` | `app/api/skills/[category]/[name]/toggle/route.ts:11` |
| `GET` | `/api/skills/drafts` | `GET /api/skills/drafts` | `app/api/skills/drafts/route.ts:4` |
| `DELETE` | `/api/skills/drafts/:id` | `DELETE /api/skills/drafts/:id` | `app/api/skills/drafts/[id]/route.ts:18` |
| `GET` | `/api/skills/drafts/:id` | `GET /api/skills/drafts/:id` | `app/api/skills/drafts/[id]/route.ts:10` |
| `POST` | `/api/skills/drafts/:id/approve` | `POST /api/skills/drafts/:id/approve` | `app/api/skills/drafts/[id]/approve/route.ts:10` |
| `POST` | `/api/skills/drafts/:id/reject` | `POST /api/skills/drafts/:id/reject` | `app/api/skills/drafts/[id]/reject/route.ts:10` |
| `GET` | `/api/skills/hub` | `GET /api/skills/hub/browse`<br>`GET /api/skills/hub/inspect/*identifier`<br>`GET /api/skills/hub/installed`<br>`GET /api/skills/hub/search` | `app/api/skills/hub/route.ts:5` |
| `POST` | `/api/skills/hub` | `POST /api/skills/hub/install`<br>`POST /api/skills/hub/install-by-id` | `app/api/skills/hub/route.ts:36` |
| `GET` | `/api/skills/hub/browse` | `GET /api/skills/hub/browse` | `app/api/skills/hub/browse/route.ts:4` |
| `GET` | `/api/skills/hub/inspect/*identifier` | `GET /api/skills/hub/inspect/*identifier` | `app/api/skills/hub/inspect/[...identifier]/route.ts:9` |
| `POST` | `/api/skills/hub/install` | `POST /api/skills/hub/install` | `app/api/skills/hub/install/route.ts:5` |
| `POST` | `/api/skills/hub/install-by-id` | `POST /api/skills/hub/install-by-id` | `app/api/skills/hub/install-by-id/route.ts:5` |
| `GET` | `/api/skills/hub/installed` | `GET /api/skills/hub/installed` | `app/api/skills/hub/installed/route.ts:3` |
| `GET` | `/api/skills/hub/search` | `GET /api/skills/hub/search` | `app/api/skills/hub/search/route.ts:4` |
| `POST` | `/api/sound-generation` | `POST /api/sound-generation` | `app/api/sound-generation/route.ts:5` |
| `POST` | `/api/speech-transcription` | `POST /api/speech-transcription` | `app/api/speech-transcription/route.ts:5` |
| `POST` | `/api/sprint-board/tasks` |  | `app/api/sprint-board/tasks/route.ts:20` |
| `POST` | `/api/standup` | `POST /api/standup` | `app/api/standup/route.ts:5` |
| `GET` | `/api/status` | `GET /api/status` | `app/api/status/route.ts:3` |
| `GET` | `/api/status/hermes` | `GET /api/status/hermes` | `app/api/status/hermes/route.ts:3` |
| `GET` | `/api/status/rovo` | `GET /api/status/rovo` | `app/api/status/rovo/route.ts:3` |
| `POST` | `/api/studio/agent-data-flow` | `POST /api/studio/agent-data-flow` | `app/api/studio/agent-data-flow/route.ts:6` |
| `POST` | `/api/ticket-classify` | `POST /api/ticket-classify` | `app/api/ticket-classify/route.ts:5` |
| `GET` | `/api/vpk-html` | `GET /api/vpk-html` | `app/api/vpk-html/route.ts:4` |
| `GET` | `/api/vpk-html/*assetPath` | `GET /api/vpk-html/*assetPath` | `app/api/vpk-html/[...assetPath]/route.ts:10` |
| `POST` | `/api/vpk-html/apply-tokens` | `POST /api/vpk-html/apply-tokens` | `app/api/vpk-html/apply-tokens/route.ts:5` |
| `GET` | `/api/vpk-html/notes` | `GET /api/vpk-html/notes` | `app/api/vpk-html/notes/route.ts:5` |
| `PUT` | `/api/vpk-html/notes` | `PUT /api/vpk-html/notes` | `app/api/vpk-html/notes/route.ts:14` |
| `POST` | `/api/vpk-html/publish-gist` | `POST /api/vpk-html/publish-gist` | `app/api/vpk-html/publish-gist/route.ts:5` |
| `DELETE` | `/api/wiki/memories` | `DELETE /api/wiki/memories/proposals/:proposalId` | `app/api/wiki/memories/route.ts:11` |
| `GET` | `/api/wiki/memories` | `GET /api/wiki/memories` | `app/api/wiki/memories/route.ts:4` |
| `DELETE` | `/api/wiki/memories/:scope/blocks/:blockId` | `DELETE /api/wiki/memories/:scope/blocks/:blockId` | `app/api/wiki/memories/[scope]/blocks/[blockId]/route.ts:12` |
| `POST` | `/api/wiki/memories/reset` | `POST /api/wiki/memories/reset` | `app/api/wiki/memories/reset/route.ts:3` |
| `GET` | `/api/wiki/memory-explorer` | `GET /api/wiki/memory-explorer` | `app/api/wiki/memory-explorer/route.ts:3` |
| `POST` | `/api/wiki/memory-explorer/brief` | `POST /api/wiki/memory-explorer/brief` | `app/api/wiki/memory-explorer/brief/route.ts:4` |
| `POST` | `/api/wiki/memory-explorer/deck` | `POST /api/wiki/memory-explorer/deck` | `app/api/wiki/memory-explorer/deck/route.ts:4` |
| `GET` | `/api/wiki/memory-explorer/export` | `GET /api/wiki/memory-explorer/export` | `app/api/wiki/memory-explorer/export/route.ts:3` |
| `GET` | `/api/wiki/search` | `GET /api/wiki/search` | `app/api/wiki/search/route.ts:4` |
| `GET` | `/api/wiki/status` | `GET /api/wiki/status` | `app/api/wiki/status/route.ts:3` |
| `POST` | `/api/wiki/sync` | `POST /api/wiki/sync` | `app/api/wiki/sync/route.ts:5` |

<!-- generated:end -->
