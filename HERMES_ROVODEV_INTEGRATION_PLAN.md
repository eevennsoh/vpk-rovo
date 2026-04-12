# Hermes Capabilities Integrated with RovoDev Serve

## Summary

This branch does **not** make Hermes the runtime. Instead, it integrates
**Hermes-backed capabilities and product patterns** on top of
**`rovodev serve`**.

Mental model:

- **`rovodev serve`** = the actual agent runtime / LLM + tool execution loop
- **this repo** = orchestration layer that adds memory, bootstrap, spaces, scheduling, structured outputs, and UI adaptation
- **Hermes** = the capability substrate for memory, skills, and durable
  local state

In other words:

> Hermes capabilities are integrated into a RovoDev-serve-based architecture.

---

## Direct Answer

### Does this codebase require Hermes to own the runtime?

**No.** `rovodev serve` remains the runtime. Hermes is layered in as a
capability system rather than as the primary executor.

In practice, this architecture runs:

1. the frontend
2. the repo backend
3. `backend/session-manager.js`
4. `rovodev serve` on port `9147`

### Who owns the main agent loop?

There are two useful levels of "loop":

- **Agent runtime loop** → **`rovodev serve`**
- **Application/orchestration loop** → **`backend/session-manager.js`**

If forced to choose one main agent runtime, the answer is:

> **`rovodev serve` remains the main agent loop.**

This repo wraps it with Hermes-backed state and behavior.

---

## Architecture Overview

### Request flow

Based on `agent-workspace/OVERVIEW.md`:

1. User types in chat
2. Frontend sends the request to the backend
3. `session-manager.js` loads the active space
4. It reads identity files, memory, structured memory, and session history
5. It builds a system context string
6. It sends the request to `rovodev serve` on port `9147`
7. `rovodev serve` streams SSE back
8. The frontend parses the stream into text, widgets, images, tool calls, and action item updates
9. Session history is persisted locally

### Main boundary

- **RovoDev serve owns**: chat execution, model/tool loop, SSE stream
- **This repo owns**: memory injection, bootstrap, spaces, scheduling, session persistence, structured output handling, UI behavior

---

## Exact Hermes-backed features integrated into this branch

## 1. File-based identity and memory

### Concept copied
The agent should have durable local state, not just transient chat context.

### Implemented here with
- `agent-workspace/<space>/AGENTS.md`
- `IDENTITY.md`
- `SOUL.md`
- `USER.md`
- `memory.md`
- `memory/*.json`
- `daily-YYYY-MM-DD.md`

### Integration with RovoDev
`backend/session-manager.js` reads these files and injects them into the prompt sent to `rovodev serve`.

Relevant functions:
- `readAgentIdentity()`
- `readSoul()`
- `readUser()`
- `readMemory()`
- `readStructuredMemory()`
- `readDailyFile()`
- `buildSystemContext()`

### Ownership
- **Repo-owned**: file layout, schema, read/injection strategy
- **RovoDev-owned**: reasoning over that injected context

---

## 2. Bootstrap / first-run onboarding

### Concept copied
A new agent should run a guided onboarding process that creates its identity and memory.

### Implemented here with
- `agent-workspace/general/BOOTSTRAP.md`
- `agent-workspace/general/AGENTS.md`
- `backend/session-manager.js`

### What it does
The bootstrap flow instructs the agent to:
- gather role and preference information
- write `SOUL.md`
- write `USER.md`
- seed `memory.md`
- offer history backfill
- run an initial daily brief

### Integration with RovoDev
The repo includes `BOOTSTRAP.md` in the system context when present. `rovodev serve` then executes that behavior as part of the chat.

### Ownership
- **Repo-owned**: bootstrap flow and detection
- **RovoDev-owned**: actual execution of the conversation/tool use

---

## 3. Skills as executable markdown runbooks

### Concept copied
Agent capabilities are expressed as markdown skills/runbooks rather than hardcoded app logic.

### Implemented here with
`agent-workspace/general/skills/*.md`

Examples:
- `daily-brief.md`
- `history-backfill.md`
- `meeting-prep.md`
- `relationship-monitor.md`
- `heartbeat.md`
- `nightly-maintenance.md`
- `create-space.md`

### Integration with RovoDev
`backend/scheduler.js` reads the skill markdown and sends it to `session-manager.js`, which sends it to `rovodev serve` as a prompt.

In practice:
- scheduler reads skill file
- constructs a prompt like `Run the following skill now:`
- `session-manager.runChat(...)` sends it into `rovodev serve`

### Ownership
- **Repo-owned**: skill files, triggering model, schedule definitions
- **RovoDev-owned**: execution of the skill via model + tools

---

## 4. Scheduled autonomous behavior

### Concept copied
The agent should run on a cron-like schedule and do useful work outside interactive chat.

### Implemented here with
- `backend/scheduler.js`
- `agent-workspace/<space>/schedules.json`

### Examples
- daily brief
- heartbeat
- relationship monitor
- nightly maintenance
- loom digest
- memory builder

### Integration with RovoDev
The scheduler is local to this repo. It checks cron expressions, then invokes the agent through `session-manager.runChat()`, which sends the request to `rovodev serve`.

### Ownership
- **Repo-owned**: scheduling, persistence, cron engine
- **RovoDev-owned**: actual agent execution once scheduled

---

## 5. Persistent sessions with compaction

### Concept copied
Agent conversations should persist and be compacted/summarized instead of being lost.

### Implemented here with
`backend/session-manager.js`

Key functions:
- `readSession()`
- `writeSession()`
- `buildCompactionSummary()`
- `compactSession()`
- `compactAllSessions()`

### What it does
- stores session history in `sessions/*.json`
- auto-compacts old messages
- preserves recent messages verbatim
- injects compacted summaries as system context
- cleans stale cron sessions
- serializes access with locks / queueing

### Integration with RovoDev
This repo stores and curates history, then rehydrates it into prompts for `rovodev serve`.

### Ownership
- **Repo-owned**: persistence, locking, compaction, summary generation
- **RovoDev-owned**: continuing the conversation over the supplied context

---

## 6. Multi-space workspace model

### Concept copied
The agent should have isolated workspaces/contexts ("spaces") with separate identity and memory.

### Implemented here with
- `agent-workspace/general/`
- `agent-workspace/project-1/`
- `agent-workspace/project-2/`
- `backend/session-manager.js`
- `app/rovo/components/hooks/useRovoDev.ts`

### What each space contains
- `AGENTS.md`
- `SOUL.md`
- `USER.md`
- `memory.md`
- `daily-*`
- `sessions/`
- `outbox/`
- `skills/`
- `space.json`

### Integration with RovoDev
The repo chooses the active space and loads that space's context before calling `rovodev serve`.

### Ownership
- **Repo-owned**: space model, switching, fallback behavior, file layout
- **RovoDev-owned**: responding within the supplied space context

---

## 7. Proactive chief-of-staff behaviors

### Concept copied
The assistant should proactively manage your day, relationships, and meetings.

### Implemented here with skills
- `daily-brief.md`
- `meeting-prep.md`
- `relationship-monitor.md`
- `heartbeat.md`

### Examples
#### `daily-brief.md`
Uses structured memory plus live sources to generate morning/midday/afternoon briefings.

#### `meeting-prep.md`
Builds context for upcoming meetings from people, projects, Jira, Confluence, Calendar, and TWG signals.

#### `relationship-monitor.md`
Computes relationship decay/risk and suggests reconnect actions.

### Integration with RovoDev
These are skill prompts + memory conventions implemented locally. `rovodev serve` executes them with tool access.

### Ownership
- **Repo-owned**: the product behaviors and workflows
- **RovoDev-owned**: executing the workflows

---

## 8. Structured memory indexes

### Concept copied
Memory should be partly machine-readable, not just prose.

### Implemented here with
- `memory/action-items.json`
- `memory/people-index.json`
- `memory/project-index.json`
- dated JSON memory files

### Integration with RovoDev
`session-manager.js` injects these JSON structures into the system context under `# Structured Memory`. Skills explicitly depend on them.

### Ownership
- **Repo-owned**: schema, storage, usage patterns
- **RovoDev-owned**: reasoning over the structures when prompted

---

## 9. Structured hidden output for widgets and state updates

### Concept copied
The agent should emit structured data alongside prose so the app can render widgets and update state.

### Implemented here with
- instructions in `agent-workspace/general/AGENTS.md`
- SSE parsing in `app/rovo/components/hooks/processSSEStream.ts`

### Output types parsed
- `AGENT_DATA` blocks
- action item markers
- tool calls
- images
- todo updates

### Integration with RovoDev
`rovodev serve` streams raw SSE. The repo interprets hidden markers and converts them into UI features.

### Ownership
- **Repo-owned**: protocol conventions, parsing, UI rendering
- **RovoDev-owned**: transporting the streamed output

---

## 10. Action item mutation via hidden markers

### Concept copied
The agent can update persistent task state through hidden machine-readable markers.

### Implemented here with
`processSSEStream.ts` plus prompt instructions injected by `session-manager.js`

Markers:
- `ACTION_ITEM_ADD:{...}`
- `ACTION_ITEM_DONE:{...}`

### How it works
- `session-manager.js` tells the agent how to emit the markers
- `processSSEStream.ts` parses them
- frontend/app calls:
  - `POST /api/action-items`
  - `PATCH /api/action-items/:id`

### Ownership
- **Repo-owned**: marker protocol and persistence hooks
- **RovoDev-owned**: generating the response that includes the markers

---

## Exact Integration Points with RovoDev

## Frontend: `useRovoDev.ts`

This hook is the frontend adapter for the runtime.

It handles:
- health checks
- sending chat messages
- tracking current space and session
- loading session history
- listing spaces
- invoking SSE processing

Important behavior:
- sends user messages to backend `/api/agent-chat`
- passes `space` and `sessionKey`
- displays a placeholder streaming assistant message
- calls `processSSEStream(...)` to consume output

### Ownership
- **Repo-owned** frontend adapter

---

## Backend: `session-manager.js`

This is the main integration layer.

It handles:
- context assembly
- bootstrap injection
- memory loading
- session persistence
- session compaction
- queueing and locking
- forwarding chat to `rovodev serve`

Important detail:
- It POSTs to `http://localhost:9147/v2/chat`
- It prepends context only at session start
- It tees the SSE stream so it can both stream to the client and capture the assistant response for persistence

### Ownership
- **Repo-owned orchestration layer**

---

## Proxy: `app/api/rovodev-proxy/route.ts`

This route proxies frontend requests to the `rovodev serve` process.

It:
- forwards auth headers
- forwards SSE streams for `v2/chat` and `v2/replay`
- avoids CORS issues

### Ownership
- **Repo-owned transport adapter**

---

## Scheduler: `backend/scheduler.js`

This is the autonomous runner.

It:
- parses cron expressions
- persists schedules
- reads skills
- invokes `session-manager.runChat()`
- updates schedule state

### Ownership
- **Repo-owned automation layer**

---

## SSE Parser: `processSSEStream.ts`

This is where raw streamed output becomes product behavior.

It parses:
- text deltas
- tool-call events
- tool returns
- warnings/exceptions
- image payloads
- AGENT_DATA blocks
- action item markers
- todo list updates

### Ownership
- **Repo-owned stream interpretation layer**

---

## Ownership Map

| Capability | Owned by this repo | Owned by `rovodev serve` |
|---|---|---|
| Agent runtime loop | No | Yes |
| LLM/model execution | No | Yes |
| Tool execution / MCP access | Partly configured externally | Yes |
| SSE response stream | No | Yes |
| File-based identity system | Yes | No |
| `SOUL.md` / `USER.md` / `memory.md` model | Yes | No |
| Bootstrap flow | Yes | No |
| Structured memory schemas | Yes | No |
| Session persistence and compaction | Yes | No |
| Spaces/workspace isolation | Yes | No |
| Scheduled skills / cron loop | Yes | No |
| Skill markdown definitions | Yes | No |
| Dashboard/widget marker protocol | Yes | No |
| Action item hidden-marker protocol | Yes | No |
| UI rendering of streamed artifacts | Yes | No |

---

## What is *not* present here as the main Hermes runtime

This branch does **not** use Hermes as the live backend executor.

Not present as the runtime model here:
- Hermes owning the main agent loop
- a direct Hermes chat backend as the main execution server
- Hermes replacing `rovodev serve` for interactive execution

Instead, those responsibilities are replaced by:
- `rovodev serve`
- repo-local orchestration in `session-manager.js`
- repo-local scheduling in `scheduler.js`
- repo-local agent workspace files

---

## Final Interpretation

The exact features copied over were mostly:

- file-based identity
- `SOUL.md`-style behavior shaping
- persistent memory
- structured memory indexes
- bootstrap onboarding
- markdown skills
- scheduled autonomous runs
- meeting prep / relationship monitoring / daily brief patterns
- session persistence and compaction
- structured hidden output for UI/state mutation

The integration pattern is:

1. this repo stores identity, memory, skills, and schedules
2. `session-manager.js` assembles those into prompt context
3. the request is sent to `rovodev serve`
4. `rovodev serve` performs the actual agent/tool loop
5. the repo parses the stream and turns it into a rich assistant product experience

### Best one-sentence summary

> This branch integrates Hermes-backed product capabilities into a
> RovoDev-serve architecture by wrapping `rovodev serve` with a repo-owned
> layer for memory, bootstrap, spaces, scheduling, structured outputs, and
> UI/state integration.

---

---

# Plan: Make RovoDev the only executor and use Hermes as capabilities

## Goal

The goal is not to make Hermes replace `rovodev serve`. The goal is to make
`rovodev serve` the only task executor while Hermes remains the source of
memory, skills, and durable local state.

After this change, the system should have one execution model:

1. Interactive chat runs through `rovodev serve`
2. Scheduled jobs also run through `rovodev serve`
3. Hermes contributes capabilities through filesystem state and app-owned data
   models

That removes the split-brain model where RovoDev runs interactive work but
Hermes separately runs jobs through its own HTTP gateway.

## Problem

Today, two backend flows still treat Hermes as a separate execution runtime:

1. **Jobs API**: `hermes-jobs.js` calls `fetchHermes("/api/jobs/...")` for
   CRUD and action endpoints
2. **Memory companion**: `hermes-memory-companion.js` calls
   `fetchHermes("/v1/chat/completions")` for post-turn durable memory review

Everything else is already aligned with the desired architecture:

- memories are file-backed
- skills are file-backed
- config is file-backed
- Hermes memory and selected skills are injected into RovoDev turns as context

The architectural issue is not "Hermes exists." The issue is that Hermes still
acts like a second executor in a few places.

### Current Hermes integration surfaces

This table describes the current state and the target state.

| Surface | Current owner | Target owner |
|---|---|---|
| Memories (`hermes-memory.js`) | Local filesystem | Keep local filesystem |
| Skills (`hermes-skills.js`) | Local filesystem | Keep local filesystem |
| Config (`hermes-config.js`) | Local filesystem | Keep local filesystem |
| Context injection (`hermes-rovo-context.js`) | Backend builds context for RovoDev | Keep as backend context builder |
| Job Links (`hermes-job-links.js`) | Local JSON file | Keep local JSON file |
| Jobs CRUD + run/pause/resume | Hermes HTTP API | Move to backend-owned local provider |
| Memory companion execution | Hermes HTTP API | Move to RovoDev-first execution path |

## Target model

The target model is "Hermes capabilities, RovoDev executor."

### Canonical execution path

Every unit of work should go through one backend execution path that ultimately
invokes `rovodev serve`.

That applies to:

- interactive chat
- scheduled jobs
- background memory review
- future proactive automations

Hermes remains available to that executor through:

- `~/.hermes/memories/*`
- `~/.hermes/skills/*`
- `~/.hermes/config.yaml`
- app-owned persistence and context assembly

### What Hermes means in this architecture

Hermes is still a first-class subsystem, but it is no longer a separate task
runtime that competes with RovoDev for ownership of work execution.

In this model, Hermes provides:

- durable memory
- skill discovery and enablement
- compatibility data models for app surfaces such as memory, skills, and jobs

In this model, Hermes does **not** own the primary execution loop.
All tool execution stays in `rovodev serve`. If a needed tool is missing, add
it to the RovoDev Serve surface instead of reintroducing a Hermes tool bridge.

## Solution

The implementation should unify all work under RovoDev while preserving Hermes
capabilities.

### 1. Create a canonical task executor

Create `backend/lib/rovo-task-executor.js` as the backend entry point for all
non-UI execution.

This module should:

- accept normalized task input such as `prompt`, `source`, `threadId`,
  `artifactTarget`, and `hermesContext`
- build Hermes memory and skill context the same way chat already does
- invoke `rovodev serve` through the existing RovoDev gateway/client helpers
- normalize result metadata for jobs, memory review, and future background work

The key rule is simple:

> If something is "running a task," it should go through the same executor.

### 2. Replace Hermes jobs execution with a local provider

Create `backend/lib/hermes-jobs-local.js` as an in-process job definition store
and scheduler.

This module should:

- store jobs in `backend/data/hermes-jobs.json`
- preserve the current API shape used by the Jobs UI:
  `listHermesJobs`, `createHermesJob`, `getHermesJob`, `updateHermesJob`,
  `deleteHermesJob`, and `performHermesJobAction`
- run a ticker such as `startJobTicker()` every 60 seconds
- resolve due jobs and execute them through `rovo-task-executor.js`
- write back local status such as `lastRunAt`, `nextRunAt`, `lastError`, and
  `status`

This makes jobs a Hermes-compatible app surface, but a RovoDev-executed
runtime path.

### 3. Normalize schedule semantics instead of cloning Hermes server behavior

The local jobs provider should not claim full Hermes server parity unless that
behavior is deliberately implemented.

For v1, the backend should:

- support a bounded schedule format
- validate and normalize schedules on write
- treat unsupported schedule syntax as invalid input instead of silently
  accepting it

This keeps the local scheduler explicit and debuggable.

### 4. Make the memory companion RovoDev-first

Update `backend/lib/hermes-memory-companion.js` so it no longer calls the
Hermes HTTP chat endpoint.

The companion currently assumes a tool-capable runtime because it instructs the
model to use Hermes-backed memory operations. That means the correct
replacement is:

1. run the companion through `rovodev serve`
2. persist structured memory actions through backend-owned memory helpers

Do **not** treat plain AI Gateway text generation as an equivalent fallback.
If a non-tool fallback is needed, it must return structured memory actions and
the backend must persist those actions through `hermes-memory.js`.

### 5. Keep remote Hermes HTTP as an optional compatibility mode only

If remote compatibility is still useful during migration, add
`backend/lib/hermes-jobs-provider.js`.

This provider should:

- default to the local provider
- use remote Hermes only when explicitly configured
- treat remote Hermes as a compatibility bridge, not the primary execution path

The default mode should not require a separate Hermes gateway process.

### 6. Update server wiring

Update `backend/server.js` to:

- replace direct `hermes-jobs` imports with the local or provider-backed layer
- start the local job ticker on backend boot
- route memory companion review through the canonical RovoDev task executor
- keep Hermes job links and thread sync behavior unchanged

### 7. Update runtime status semantics

Update `backend/lib/hermes-status.js` so Hermes status no longer depends
entirely on Hermes HTTP reachability.

Status should report:

- whether Hermes filesystem stores are accessible
- whether jobs are running in `embedded` mode or optional `remote` mode

If the separate Hermes HTTP gateway is disabled, Hermes should still report as
partially available when its local capabilities are healthy.

## Files to create

- `backend/lib/rovo-task-executor.js`
- `backend/lib/hermes-jobs-local.js`
- `backend/lib/hermes-jobs-local.test.js`
- `backend/lib/hermes-jobs-provider.js`

## Files to modify

- `backend/lib/hermes-memory-companion.js`
- `backend/lib/hermes-status.js`
- `backend/server.js`
- `scripts/verify-hermes-control-plane.js`

## What stays the same

These modules already fit the target architecture and should stay in place:

- `hermes-memory.js`
- `hermes-skills.js`
- `hermes-config.js` and `hermes-paths.js`
- `hermes-job-links.js`
- `hermes-rovo-context.js`

## Important non-goal

This plan removes the need to run a separate Hermes **gateway** process by
default. It does **not** remove Hermes as a capability layer.

The system still depends on Hermes-local assets such as:

- `~/.hermes/memories`
- `~/.hermes/skills`
- `~/.hermes/config.yaml`

## Result

After this change:

- `rovodev serve` remains the single executor for chat and background work
- Hermes remains the capability substrate for memory, skills, and durable
  local state
- the backend no longer needs a separate Hermes gateway process in the default
  development path

For the full local stack, `pnpm run rovodev` should remain the primary startup
command. If `rovodev serve` is already running, `pnpm run dev` is still enough
for frontend and backend work.
