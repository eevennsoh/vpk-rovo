# VPK-Rovo architecture: RovoDev Serve loop + Hermes feature integration

> **Status:** Revised prototype plan
> **Date:** April 6, 2026
> **Goal:** Build the Rovo app UI in `vpk-rovo`, keep `rovodev serve`
> (`acra`) as the primary interactive agent loop, and integrate Hermes Agent
> closely for memory, skills, and scheduled jobs.

---

## 1. Working model

The key architectural decision is:

- **Interactive chat stays on `rovodev serve`.**
- **Hermes is integrated as a first-class subsystem for memory, skills, and
  scheduled jobs.**

This keeps the current `rovo-app` behavior aligned with the existing
RovoDev-specific stream and approval model, while still making Hermes a core
part of the product.

This is not "Hermes replaces the loop with a thin VPK bridge." It is
"RovoDev remains the loop owner, Hermes powers important app capabilities."

---

## 2. High-level architecture

```text
┌──────────────────────────────────────────────────────────────┐
│                        VPK-Rovo UI                           │
│                                                              │
│  ┌──────────────┐  ┌────────────┐  ┌───────────┐  ┌───────┐ │
│  │   rovo-app   │  │  Memories  │  │  Skills   │  │ Jobs  │ │
│  │    (chat)    │  │   panel    │  │  browser  │  │ /Cron │ │
│  └──────┬───────┘  └─────┬──────┘  └─────┬─────┘  └───┬───┘ │
│         │                │               │              │     │
│  ┌──────▼────────────────▼───────────────▼──────────────▼───┐ │
│  │                 VPK-Rovo Express backend                 │ │
│  │                                                          │ │
│  │  - Rovo app managed runs / threads / stream attach      │ │
│  │  - RovoDev adapter for interactive chat                 │ │
│  │  - Hermes adapter for memory / skills / jobs           │ │
│  │  - Optional linking of jobs back into Rovo threads     │ │
│  └──────────────┬───────────────────────────┬──────────────┘ │
└─────────────────┼───────────────────────────┼────────────────┘
                  │                           │
                  ▼                           ▼
┌────────────────────────────────┐   ┌──────────────────────────┐
│   RovoDev Serve (`acra`)       │   │   Hermes Agent          │
│   Primary interactive loop     │   │   Feature substrate     │
│                                │   │                          │
│   - /v3/set_chat_message       │   │   - MEMORY.md / USER.md  │
│   - /v3/stream_chat            │   │   - skills + config      │
│   - /v3/resume_tool_calls      │   │   - /api/jobs            │
│   - /v3/sessions/*             │   │   - optional providers   │
│   - /healthcheck               │   │                          │
└────────────────────────────────┘   └──────────────────────────┘
```

### What each runtime owns

**RovoDev Serve owns:**

- interactive chat execution
- streaming response semantics
- paused tool calls and resume flows
- approval / deferred-question mechanics
- session restore and current-session state
- the live agent loop that `rovo-app` already expects

**Hermes owns:**

- persistent memory files and related config
- skill discovery, external skill directories, and disabled-skill config
- scheduled jobs / cron execution
- optional future provider-backed memory/search capabilities

**VPK-Rovo backend owns:**

- app-specific thread and run persistence
- the Rovo app HTTP contract used by the frontend
- attachment of frontend surfaces to the correct runtime
- optional linking across subsystems, such as job output into threads

---

## 3. Why `rovodev serve` stays in the loop

`rovo-app` is not a generic OpenAI chat client. It already depends on a richer
event model and loop behavior than Hermes's OpenAI-compatible chat API
currently provides.

For the prototype, `rovodev serve` remains the **local stand-in agent loop**
for interactive use because it already supports the following product behaviors:

- resumable sessions
- managed streaming runs
- paused tool calls
- explicit resume decisions
- read-only / full agent modes
- richer event and approval flows than plain chat-completions SSE

That makes `rovodev serve` the right runtime for the **interactive Rovo app
surface**, even while Hermes is integrated closely elsewhere in the product.

---

## 4. Hermes's role in the product

Hermes is still a core part of the architecture. The difference is that it is
introduced through well-scoped app capabilities instead of replacing the
interactive loop in one step.

### 4.1 Memory

Hermes provides the memory model:

- `~/.hermes/memories/MEMORY.md`
- `~/.hermes/memories/USER.md`
- bounded entries separated by `§`
- add / replace / remove semantics via the Hermes memory tool

The Rovo app gets a dedicated Memory surface backed by Hermes state.

### 4.2 Skills

Hermes provides the skills model:

- `~/.hermes/skills/` as the primary local skills directory
- optional `skills.external_dirs` for shared read-only discovery
- `config.yaml` disabled lists for skill enable / disable behavior
- `SKILL.md` progressive-disclosure structure

The Rovo app gets a Skills browser and configuration UI backed by Hermes.

### 4.3 Jobs / cron

Scheduled tasks are a **first-class Rovo app capability**.

Hermes already has a job system, so Rovo app Jobs/Cron should be backed by
Hermes job execution and CRUD endpoints instead of inventing a parallel
scheduler inside `vpk-rovo`.

This is not a side feature. Jobs belong in the app.

### 4.4 Context and grounding

Hermes has a stronger context model than the current app surface. On top of the
existing interactive loop, `vpk-rovo` should add:

- recursive project context files
- global and project `SOUL.md`-style personality / behavior overlays
- explicit `@` references for files, folders, URLs, diffs, and notes
- thread-scoped context bundles that can be reused across turns

This belongs in the Rovo app composer, attachment flow, and thread metadata.

### 4.5 Checkpoints and rollback

Hermes-style filesystem checkpoints are worth importing into the app as a
product feature, not just a hidden runtime primitive.

`vpk-rovo` should expose:

- thread-scoped run snapshots
- diff previews between checkpoints
- restore / rollback actions
- checkpoint awareness for generated artifacts and workspace files

This should likely live under the existing Artifacts surface or a closely
related recovery/history view.

### 4.6 Provider routing and auxiliary runtimes

Hermes's provider-routing model is worth surfacing in the app. The value is not
just fallback logic, but explicit control over which model/provider handles:

- interactive chat
- vision
- browser extraction
- summarization
- TTS / voice
- scheduled jobs
- research workloads

This should become a visible control plane in Settings rather than remaining
implicit backend configuration.

### 4.7 Hooks, plugins, and startup automation

On top of `rovodev serve`, the app should add a product-facing integration
surface for:

- event hooks
- packaged plugin/integration bundles
- startup / bootstrap automation similar to a `BOOT.md` workflow
- configuration and visibility for advanced automation behavior

The goal is to make these behaviors configurable from the app instead of hiding
them in local config files.

### 4.8 Programmatic code execution

Hermes's code-execution pattern is worth bringing into the product as an
advanced capability. This is especially useful for:

- compact multi-step automations
- data wrangling and transformations
- research pipelines
- richer scheduled jobs

This should be treated as a backend capability surfaced through existing run and
message flows, not as a separate raw developer REPL.

### 4.9 Research workbench

Because research-ready behavior is a stated goal, `vpk-rovo` should add a
dedicated product surface for:

- batch processing
- run inspection
- trajectory export
- dataset generation
- RL / Atropos-oriented experiment workflows

This is distinct from interactive chat and should be modeled as its own app
surface.

---

## 5. Runtime and authentication

In local development, the browser should continue to talk only to `vpk-rovo`.
The backend fans out to the two local runtimes.

### Recommended local ports

- `vpk-rovo` Next.js frontend: `:3000`
- `vpk-rovo` Express backend: `:8080`
- `rovodev serve`: `:8000` by default, or a managed local pool
- Hermes API server: `:8642` by default, or another explicit local port

### Authentication model

**Browser → VPK backend**

- no direct runtime auth exposure
- browser never talks directly to `rovodev serve` or Hermes

**VPK backend → RovoDev Serve**

- use the RovoDev session token / Bearer token required by serve mode
- this is mandatory unless serve mode is explicitly started with auth disabled

**VPK backend → Hermes**

- local HTTP
- optional Bearer auth if `API_SERVER_KEY` is configured
- for the prototype, localhost-only with explicit config is acceptable

### Recommendation

Keep all runtime auth handling in the Express backend. Do not require the
frontend to understand either runtime's auth model.

---

## 6. Interactive chat integration

The interactive chat path should keep the existing Rovo app surface:

```text
POST /api/rovo-app/chat
  -> VPK managed run layer
  -> RovoDev Serve V3 APIs
```

### Source of truth

For v1:

- `vpk-rovo` thread records remain the app-level source of truth
- RovoDev session IDs are stored on those threads
- app runs can be attached / detached / resumed using the existing managed-run
  approach

Do **not** move app thread ownership into Hermes in v1.

### What does not happen in v1

The backend does **not** replace the chat loop with a thin Hermes
chat-completions SSE bridge.

That approach does not match the current `rovo-app` contract closely enough.

---

## 7. Jobs / cron as a first-class app capability

Jobs belong in the Rovo app and should have their own top-level app surface.

### 7.1 Execution engine

Use Hermes as the scheduled-task engine.

### 7.2 Backend mapping

Proxy Rovo app job routes to Hermes job routes:

```text
GET    /api/jobs              -> Hermes GET    /api/jobs
POST   /api/jobs              -> Hermes POST   /api/jobs
GET    /api/jobs/:id          -> Hermes GET    /api/jobs/:id
PATCH  /api/jobs/:id          -> Hermes PATCH  /api/jobs/:id
DELETE /api/jobs/:id          -> Hermes DELETE /api/jobs/:id
POST   /api/jobs/:id/run      -> Hermes POST   /api/jobs/:id/run
POST   /api/jobs/:id/pause    -> Hermes POST   /api/jobs/:id/pause
POST   /api/jobs/:id/resume   -> Hermes POST   /api/jobs/:id/resume
```

### 7.3 Product behavior

The Jobs UI should support:

- list jobs
- create job
- edit job
- delete job
- pause / resume
- run now
- show next run / last run / last error

### 7.4 Optional app-native linkage

Jobs may optionally link back into the Rovo app experience. Add support for
fields such as:

- `linkedThreadId`
- `surface: "rovo-app"`
- `artifactTarget`
- `postResultToThread`

Initial recommendation:

- **v1:** jobs run via Hermes and show status in the Jobs UI
- **v1.1+:** allow job results to append a summary into a linked Rovo thread or
  create/update an artifact

---

## 8. Memory UI

The Memory UI is Hermes-backed.

### 8.1 Backing store

- read `MEMORY.md` and `USER.md`
- split entries by `\n§\n`
- show char usage against Hermes limits

### 8.2 Scope

For v1, support only Hermes built-in memory:

- `memory`
- `user`

Do not attempt to expose multiple external memory providers in the first
version of the UI.

### 8.3 Important behavior note

Hermes memory is a frozen snapshot at session start. Memory writes are visible
to the UI immediately, but they do not automatically rewrite the live prompt of
an already-running Hermes session.

That matters if later you want RovoDev interactive turns to consume Hermes
memory. That should be designed explicitly instead of assumed.

---

## 9. Skills browser

The Skills browser is Hermes-backed.

### 9.1 Discovery model

Read skills from:

- `~/.hermes/skills/`
- optional `skills.external_dirs` from Hermes config

### 9.2 Enable / disable model

Skill toggles should update Hermes config rather than mutating `SKILL.md`
files directly.

Primary config surfaces:

- `skills.disabled`
- `skills.platform_disabled`

### 9.3 Scope

For v1:

- browse installed skills
- view skill metadata and content
- filter/search installed skills
- enable / disable local skills through config

Defer:

- Skills Hub install
- update / publish
- trust / provenance workflows

---

## 10. Backend endpoint plan

### 10.1 Interactive Rovo app chat

Existing Rovo app routes remain the frontend contract:

```text
POST   /api/rovo-app/chat
GET    /api/rovo-app/messages
POST   /api/rovo-app/messages
GET    /api/rovo-app/threads
POST   /api/rovo-app/threads
GET    /api/rovo-app/threads/:threadId
PUT    /api/rovo-app/threads/:threadId
DELETE /api/rovo-app/threads/:threadId
GET    /api/rovo-app/runs/:threadId/stream
POST   /api/rovo-app/runs/:threadId/detach
POST   /api/rovo-app/runs/:threadId/cancel
```

These continue to be backed by the VPK managed-run layer plus `rovodev serve`.

### 10.2 Hermes-backed app surfaces

```text
GET    /api/memories
GET    /api/memories/:target
PUT    /api/memories/:target
POST   /api/memories/:target/entry
DELETE /api/memories/:target/entry

GET    /api/skills
GET    /api/skills/:category/:name
POST   /api/skills/:category/:name/toggle

GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/:id
PATCH  /api/jobs/:id
DELETE /api/jobs/:id
POST   /api/jobs/:id/run
POST   /api/jobs/:id/pause
POST   /api/jobs/:id/resume
```

### 10.3 Status endpoints

Add explicit runtime status visibility:

```text
GET /api/status/rovodev
GET /api/status/hermes
GET /api/status
```

This should report:

- whether `rovodev serve` is reachable
- whether Hermes is reachable
- which app subsystems are degraded if one runtime is down

### 10.4 Hermes-on-top app capabilities

Add dedicated endpoints for Hermes-inspired product features layered on top of
the existing RovoDev loop:

```text
# Context / references
GET    /api/context/files
POST   /api/context/resolve
POST   /api/context/references
GET    /api/context/bundles
POST   /api/context/bundles

# Checkpoints / rollback
GET    /api/checkpoints
GET    /api/checkpoints/:id
GET    /api/checkpoints/:id/diff
POST   /api/checkpoints/:id/restore

# Hooks / integrations / bootstrap
GET    /api/integrations
GET    /api/hooks
POST   /api/hooks
PATCH  /api/hooks/:id
DELETE /api/hooks/:id
POST   /api/bootstrap/run

# Provider routing / runtime config
GET    /api/providers
PUT    /api/providers

# Research workbench
GET    /api/research/runs
POST   /api/research/runs
GET    /api/research/runs/:id
GET    /api/research/trajectories/:id
POST   /api/research/datasets/export
```

These endpoints are app-level capabilities. They do not replace the interactive
chat routes or the RovoDev serve loop.

---

## 11. Frontend pages and routes

```text
app/
  rovo-app/[[...id]]/       <- interactive chat, still RovoDev-backed
  memories/                 <- Hermes memory browser/editor
  skills/                   <- Hermes skills browser
  skills/[category]/[name]/ <- skill detail view
  jobs/                     <- Hermes jobs / cron manager
  context/                  <- context files, bundles, and @ reference management
  research/                 <- batch runs, trajectories, dataset export
  integrations/             <- hooks, plugins, bootstrap automation
  settings/                 <- runtime status, provider routing, and integration settings
```

---

## 12. Reusable VPK components

Existing VPK components that still map well:

| Existing component | Path | Planned reuse |
| --- | --- | --- |
| `panel.tsx` | `components/ui-ai/panel.tsx` | Memory and skill side panels |
| `artifact.tsx` | `components/ui-ai/artifact.tsx` | Skill detail rendering (markdown content) |
| `sources.tsx` | `components/ui-ai/sources.tsx` | Memory entry list patterns |
| `schema-display.tsx` | `components/ui-ai/schema-display.tsx` | Metadata / config display |
| `queue.tsx` | `components/ui-ai/queue.tsx` | Job list patterns |
| `task.tsx` | `components/ui-ai/task.tsx` | Job card patterns |
| `model-selector.tsx` | `components/ui-ai/model-selector.tsx` | RovoDev model picker and optional job model picker |
| `file-tree.tsx` | `components/ui-ai/file-tree.tsx` | Skill category tree |
| `tool.tsx` | `components/ui-ai/tool.tsx` | Interactive chat tool rendering |
| `chat-composer.tsx` | `components/projects/sidebar-chat/components/chat-composer.tsx` | Interactive chat composer |
| `message.tsx` | `components/ui-ai/message.tsx` | Interactive chat message rendering |
| `confirmation.tsx` | `components/ui-ai/confirmation.tsx` | Delete / destructive action confirmations |

---

## 13. Implementation phases

### Phase 1: Stabilize interactive chat on `rovodev serve`

- [ ] Keep `rovo-app` wired to the current VPK managed-run system
- [ ] Confirm `rovodev serve` remains the only interactive chat loop
- [ ] Preserve thread, session, attach/detach, and approval behaviors
- [ ] Make runtime health visible in the app

### Phase 2: Add jobs / cron as a first-class app surface

- [ ] Add Hermes-backed `/api/jobs*` proxy routes
- [ ] Build Jobs page in the Rovo app shell
- [ ] Support create / edit / pause / resume / run-now
- [ ] Show next run, last run, and last error
- [ ] Add optional `linkedThreadId` support for future result publishing

### Phase 3: Add Hermes-backed Memory UI

- [ ] Add `/api/memories*` backend routes
- [ ] Build memory browser/editor
- [ ] Support add / replace / remove entry flows
- [ ] Show char usage and capacity state

### Phase 4: Add Hermes-backed Skills browser

- [ ] Add `/api/skills*` backend routes
- [ ] Read local plus external skill directories
- [ ] Build search / category browse / detail view
- [ ] Implement enable / disable through Hermes config

### Phase 5: Add deeper cross-runtime integration

- [ ] Decide whether Hermes memory should be injected into interactive RovoDev
      sessions
- [ ] Allow jobs to post summaries into linked Rovo threads
- [ ] Allow jobs to create or update artifacts/documents when appropriate
- [ ] Evaluate whether selected Hermes skill metadata should influence the
      interactive loop

### Phase 6: Add context and grounding surfaces

- [ ] Add context file discovery and thread-scoped context bundles
- [ ] Support inline `@` references in the composer flow
- [ ] Add support for project/global `SOUL.md`-style overlays
- [ ] Render reference state in thread metadata and turn payloads

### Phase 7: Add rollback and recovery

- [ ] Add checkpoint creation and listing APIs
- [ ] Build diff preview and restore flows
- [ ] Link checkpoints to artifacts and workspace snapshots
- [ ] Surface rollback in the app as a user-visible recovery feature

### Phase 8: Add integrations and provider control plane

- [ ] Build integrations page for hooks/plugins/bootstrap actions
- [ ] Add provider-routing controls to settings
- [ ] Expose advanced runtime selection for chat, vision, summarization, and
      jobs
- [ ] Add visibility for which provider handled each relevant workload

### Phase 9: Add research workbench

- [ ] Build batch-run creation and inspection flows
- [ ] Add trajectory export UI
- [ ] Add dataset export flows for training/evals
- [ ] Add Atropos-oriented experiment support where the backend can support it

---

## 14. Recommendations and open questions

### Recommended answers

1. **Who owns the interactive loop?**
   `rovodev serve` owns it in v1.

2. **Should jobs be included in the app?**
   Yes. Jobs / cron are a first-class Rovo app feature and should be exposed in
   the product.

3. **Who executes jobs?**
   Hermes executes them.

4. **Should memory plugins be in v1 UI?**
   No. Built-in Hermes memory only in v1.

5. **Should Skills Hub install/update be in v1 UI?**
   No. Browse/configure installed skills first.

6. **Multi-user?**
   No. Single-user, localhost-focused prototype.

7. **Which Hermes-on-top features are worth bringing into the app next?**
   Prioritize:
   - context files / `SOUL.md` / `@` references
   - rollback / checkpoints
   - provider-routing controls
   - integrations/hooks/bootstrap automation
   - research workbench

### Remaining design questions

1. **Should Hermes job output be visible only in the Jobs UI, or also in linked
   Rovo threads and artifacts?**
   Recommendation: start with Jobs UI only, then add optional thread linkage.

2. **How should Hermes memory influence the interactive RovoDev loop?**
   Recommendation: do not assume automatic shared prompt state. Design an
   explicit sync or injection step later.

3. **Should Hermes skills affect interactive chat behavior, or remain a
   browse/config surface first?**
   Recommendation: browse/config first, then selectively integrate into the
   interactive loop if needed.

4. **Where should rollback appear in the product?**
   Recommendation: treat rollback as part of Artifacts/history rather than a
   hidden backend-only concept.

5. **How much provider routing should be user-visible?**
   Recommendation: expose high-level routing controls in Settings, not every
   internal fallback edge.

6. **Should hooks/plugins/bootstrap be user-facing in v1 or v2?**
   Recommendation: v2, after Jobs/Memory/Skills land cleanly.

7. **Long-term direction**
   Recommendation: validate the product first with
   `RovoDev interactive loop + Hermes subsystems`. Only revisit "Hermes replaces
   the loop" after the app proves which runtime semantics actually need to be
   unified.
