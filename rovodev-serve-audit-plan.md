# RovoDev Serve contract audit and migration plan

This document captures the agreed plan for auditing VPK's RovoDev Serve
integration and migrating it toward the documented Serve contract. The goal is
to preserve the current VPK chat UX where possible, while removing reliance on
undocumented Serve behavior.

## Summary

- Treat `docs/rovodev-serve` as the contract of record.
- Migrate VPK to the documented V3 workflow.
- Preserve the current VPK chat UX where it can be rebuilt on documented Serve
  endpoints.
- Add an explicit regression gate so the migration does not silently remove
  existing user-facing functionality.
- Focus remediation on session ownership, plan-mode handling, and deferred-tool
  or question-card flow.

## Key changes

- Rework the Serve transport in `backend/lib/rovodev-client.js`,
  `backend/lib/rovodev-gateway.js`, and `backend/server.js` to use only
  documented V3 primitives:
  - `POST /v3/set_chat_message`
  - `GET /v3/stream_chat`
  - documented SSE events
  - documented session endpoints
  - documented `default` and `ask` agent modes only
- Replace the current implicit plan-mode path with documented planning:
  - use `enable_deep_plan` on `set_chat_message` for plan-generating turns
  - stop depending on undocumented `plan` agent mode as a required runtime
    feature
  - keep `/api/agent-mode` only for documented `default` and `ask`, or narrow
    it to an internal frontend state API if Serve no longer owns planning mode
- Remove undocumented deferred-tool coupling:
  - stop relying on `enable_deferred_tools=true`
  - stop treating object-shaped `message` payloads as a documented way to
    answer tool calls
  - replace the current question-card and approval continuation flow with
    documented `pause_on_call_tools_start=true` plus
    `POST /v3/resume_tool_calls`
- Introduce explicit Serve session ownership per VPK thread and task:
  - persist Serve `session_id` for each interactive thread
  - create or restore the correct Serve session before continuing a thread
  - use separate ephemeral sessions for background generations that must not
    inherit chat history
  - stop relying on whichever hidden session happens to live on the acquired
    port
- Tighten readiness and health semantics:
  - treat only documented healthy states as ready for normal traffic
  - do not treat every HTTP 200 from `/healthcheck` as ready
  - surface `pending user review`, entitlement failures, and startup or
    transient states explicitly
- Handle documented streamed warnings instead of silently dropping them:
  - log and optionally surface model fallback, rate-limit, and context-pruning
    warnings
  - keep `exception` as a hard failure path

## Public interfaces and type changes

- Change internal RovoDev gateway and client calls from a raw combined string
  to a structured request shape with:
  - `message`
  - optional `context`
  - optional `enableDeepPlan`
  - session identifier or session strategy
- Persist Serve session metadata in thread or run state so Future Chat can
  resume the correct Serve conversation instead of reusing port-local state.
- If `/api/agent-mode` remains, narrow its contract to documented modes.
  Planning should move out of that API.
- Update the message-building layer in `rovo/config.js` so frontend history is
  no longer redundantly stuffed into every Serve message once documented
  session restore is in place.

## Implementation status

This section records what has already landed in the codebase so the remaining
work is explicit.

### Implemented

- Documented V3 session helpers now exist in
  `backend/lib/rovodev-client.js` for session create, current-session lookup,
  session lookup, session restore, and `resume_tool_calls`.
- The low-level RovoDev client now accepts a structured chat request shape
  instead of only a raw string:
  - `message`
  - optional `context`
  - optional `enable_deep_plan`
  - optional `sessionId` via client options for restore-before-stream
- The client now restores a requested Serve session before streaming a turn and
  supports `pause_on_call_tools_start=true`.
- Streamed `warning` events are now parsed distinctly from fatal
  `exception` events.
- Gateway logic was updated to remove the old stale deferred-tool recovery
  path, propagate warning events explicitly, and keep the narrowed documented
  agent-mode contract.
- `/api/agent-mode` is now narrowed to documented `default` and `ask` only.
  Frontend helpers in Future Chat also now treat those as the only backend
  modes.
- Future Chat thread persistence now stores Serve session metadata:
  - `sessionId`
  - `sessionMode`
  - active-run session metadata
- `backend/server.js` now performs best-effort Future Chat session ownership:
  - restore existing Serve session for a persisted thread when available
  - create a new Serve session when the stored one no longer exists
  - persist the synchronized session back to thread state
- Health handling now classifies documented `/healthcheck` states so only
  documented healthy states count as ready for normal traffic.
- Frontend continuation flows in Future Chat, Make, and Sidebar Chat no longer
  build new object-shaped deferred-tool response payloads on submit. They now
  send structured `clarification` or `approval` submissions instead.
- Plan mode is now treated as local VPK UI state rather than a Serve-owned
  `plan` mode. The server still supports plan-generation turns, but it no
  longer tries to switch Serve into an undocumented plan agent mode.
- Question-card and plan-widget parsing now expose a neutral `toolCallId`
  alias while keeping the legacy field for compatibility during migration.
- The main chat orchestration path now uses documented paused-tool handling for
  interactive Serve tool calls:
  - `pause_on_call_tools_start=true` is enabled for streaming turns that need
    VPK-managed interactive continuation
  - non-interactive paused tool calls are resumed immediately with documented
    `resume_tool_calls` approval decisions
  - interactive `request_user_input` and `exit_plan_mode` tool calls reserve
    their acquired Serve port until the user responds
  - follow-up clarification and plan-approval submissions now preserve the
    originating tool-call ID
  - continuation resumes the paused Serve run with
    `POST /v3/resume_tool_calls`, then streams the buffered and live remainder
    through `POST /v3/replay`
- Clarification and plan-approval submissions now prefer the documented pause,
  resume, and replay path. The old prompt-context adaptation remains only as a
  fallback when a paused tool-call record no longer exists.

### Remaining

The migration is materially closer to completion now. The largest remaining
items are validation depth and background-session isolation, not the basic V3
transport contract.

- Background-generation session strategy is only partially implemented:
  interactive thread ownership is in place, but explicit ephemeral-session
  handling for all isolated background tasks still needs a full audit.
- The prompt-context continuation fallback still exists for stale or unmatched
  clarification and approval submissions. That preserves UX if a paused-tool
  reservation expires, but it means one compatibility path still depends on the
  older adaptation model.
- Full repository validation is still pending. Focused RovoDev transport and
  helper tests pass, but the broader `pnpm run lint` and `pnpm tsc --noEmit`
  checks have not been re-run after the latest continuation changes.
- End-to-end validation of critical user flows is still pending. Current
  coverage is strong at the unit and helper-test level, but it is not yet a
  full UI-level migration sign-off.

### Current parity assessment

Based on the implemented code and current validation, the migration status for
the highest-risk flows is:

- `preserved`: standard chat send and stream
- `preserved`: warning versus exception handling
- `preserved`: Future Chat thread session persistence and resume metadata
- `preserved`: question-card and plan-approval rendering UX from the user's
  perspective
- `adapted`: plan mode, which now uses local VPK state plus
  `enable_deep_plan` instead of a Serve-owned `plan` mode
- `adapted`: clarification and approval continuation, which now use
  documented pause, resume, and replay behavior with structured deny messages
  instead of frontend-built deferred-tool response payloads
- `not finished`: explicit ephemeral-session isolation for all background-only
  generations

## Functionality regression guardrails

The migration needs a parity check, not just a contract-compliance check. Each
change should be evaluated against the current VPK behaviors that users depend
on so the Serve cleanup does not create a feature regression.

- Capture a baseline inventory of current user-visible behaviors before major
  transport changes land. At minimum, cover:
  - standard chat send and stream
  - plan-generation flow and plan widget rendering
  - question-card and approval flow
  - tool execution updates and final assistant completion
  - thread isolation across concurrent chats
  - Future Chat resume behavior
  - background generations that must remain isolated from interactive chat
  - degraded states such as health, entitlement, and model-warning handling
- For each audited behavior, record one of these outcomes:
  - `preserved`: behavior remains unchanged from the user's perspective
  - `adapted`: behavior changes internally but remains functionally equivalent
  - `degraded intentionally`: behavior changes because the old version relied
    on undocumented Serve behavior; the fallback and user impact must be
    documented
  - `removed`: only allowed with explicit sign-off and a documented reason
- Do not treat contract alignment alone as sufficient. A migration step is only
  complete when both of these are true:
  - the implementation uses documented Serve APIs only
  - the expected VPK functionality for that flow is preserved or intentionally
    degraded with sign-off
- If a documented Serve primitive cannot support a current VPK behavior, define
  the replacement UX before removing the old path. Avoid leaving partial flows
  where the backend is compliant but the frontend experience is broken.

## Regression matrix

This matrix is the concrete parity artifact for the migration. Each line maps
the user-facing VPK behavior to the documented Serve primitive and the
verification path that still needs to pass before final sign-off.

- Standard chat send and stream
  Current status: `preserved`
  Serve primitive: `POST /v3/set_chat_message` plus `GET /v3/stream_chat`
  Verification: unit tests for client and gateway streaming, plus manual UI
  validation
- Plan-generation flow and plan widget rendering
  Current status: `adapted`
  Serve primitive: `enable_deep_plan` on `set_chat_message`, plus normal V3
  streaming and `exit_plan_mode` pause handling
  Verification: manual UI validation, helper tests for plan parsing, and one
  high-level integration flow
- Question-card flow
  Current status: `preserved`
  Serve primitive: paused `request_user_input` tool calls via
  `pause_on_call_tools_start`, `resume_tool_calls`, and `replay`
  Verification: helper tests for question-card parsing and one high-level
  integration flow
- Plan approval flow
  Current status: `preserved`
  Serve primitive: paused `exit_plan_mode` tool calls via
  `pause_on_call_tools_start`, `resume_tool_calls`, and `replay`
  Verification: helper tests for plan approval payload preservation and one
  high-level integration flow
- Tool execution updates and final assistant completion ordering
  Current status: `preserved`
  Serve primitive: documented SSE events and replay streaming
  Verification: gateway unit tests plus manual ordering checks in UI
- Thread isolation across concurrent chats
  Current status: `preserved`
  Serve primitive: per-thread session restore plus pinned pool-port ownership
  Verification: session helper tests and multi-thread manual validation
- Future Chat resume behavior
  Current status: `preserved`
  Serve primitive: persisted `session_id`, session restore, and replay for
  paused continuations
  Verification: thread persistence tests and manual resume validation
- Background generation isolation
  Current status: `not finished`
  Serve primitive: explicit ephemeral-session strategy
  Verification: audit of every background generation entry point plus targeted
  validation
- Health, entitlement, and warning handling
  Current status: `preserved`
  Serve primitive: `/healthcheck` classification and documented `warning` and
  `exception` events
  Verification: health and client or gateway warning tests, plus manual
  degraded-state checks

## Validated so far

The following validations passed against the current implementation after the
latest paused-tool continuation work landed:

- `node --test backend/lib/rovodev-client.test.js`
- `node --test backend/lib/rovodev-gateway.test.js`
- `node --test backend/lib/rovodev-session.test.js`
- `node --test backend/lib/rovodev-health.test.js`
- `node --test components/projects/shared/lib/question-card-widget.test.js
  components/projects/shared/lib/plan-approval.test.js`
- `node --check backend/lib/rovodev-client.js`
- `node --check backend/lib/rovodev-gateway.js`
- `node --check backend/server.js`

These checks confirm the current low-level transport, replay or resume
plumbing, session helpers, health classification, and widget payload shaping.
They do not replace UI-level validation of the full Future Chat, Make, and
Sidebar Chat user journeys.

## Test plan

This test plan defines the minimum validation required before the migration can
be treated as complete.

- Build a regression matrix that maps every existing user-facing RovoDev flow
  to:
  - the current behavior
  - the documented Serve primitive that replaces it
  - the expected post-migration behavior
  - the verification method, such as unit coverage, manual UI validation, or
    an integration script
- Verify normal V3 chat still streams correctly with `set_chat_message` then
  `stream_chat`, including partial output, completion, and error termination.
- Verify deep-plan requests use `enable_deep_plan` and preserve the existing
  VPK plan widget UX or a documented equivalent UX.
- Verify question-card and approval flows work through documented pause and
  resume tool control only, without dropping pending actions or user answers.
- Verify tool execution updates, completion messages, and any intermediate
  status UI still appear in the correct order.
- Verify two independent chat threads never inherit each other's Serve history,
  even when they reuse the same port pool.
- Verify Future Chat resume restores the correct Serve session and does not
  duplicate or lose prior context.
- Verify background tasks do not contaminate interactive thread sessions.
- Verify `healthcheck` states `healthy`, `unknown`, `pending user review`, and
  entitlement failures map to correct backend behavior and user-visible
  messaging.
- Verify streamed `warning` and `exception` events are handled distinctly and
  that warnings are surfaced or logged without breaking the turn.
- Re-run the existing RovoDev unit tests and add coverage for:
  - session create and restore ownership
  - deep-plan request shaping
  - pause and resume tool continuation
  - warning-event propagation
- Add at least one end-to-end or high-level integration check for each critical
  user flow that currently depends on Serve behavior, so backend contract
  changes cannot pass on unit coverage alone.
- Treat parity gaps as release blockers unless the gap is explicitly marked as
  an intentional degradation with approved fallback behavior.

## Assumptions and defaults

These defaults define how to resolve ambiguous migration decisions.

- `docs/rovodev-serve` is the authoritative contract, even if the current local
  Serve binary supports additional behavior.
- Preserve current VPK UX when it can be rebuilt on documented Serve endpoints.
- Prefer V3 everywhere and do not add new V2 dependencies.
- If a current UX cannot be reproduced with documented Serve behavior, degrade
  gracefully rather than keep an undocumented backend dependency.

## Remaining implementation workstreams

The transport migration is mostly in place. The remaining work is now about
closing known gaps methodically and proving the resulting behavior end to end.

- Finish background-session ownership.
  - Audit every non-interactive `generateTextViaRovoDev`,
    `streamViaRovoDev`, and `streamTextViaGateway` call site and classify it as
    one of:
    - inherit the active thread's persistent session
    - force a new ephemeral Serve session
    - route through AI Gateway only
  - Prioritize the currently visible background-style entry points:
    - Future Chat artifact generation in `backend/server.js`
    - translation execution in `backend/server.js`
    - GenUI assistant generation in `backend/lib/genui-chat-handler.js`
  - Add one helper that makes session strategy explicit at the call site so
    background flows stop relying on whichever Serve session happens to be
    active on the acquired port.
- Decide the end state of the compatibility fallback.
  - Keep the prompt-context continuation fallback only as a compatibility path
    for expired or missing paused-tool reservations.
  - Add logging or counters for fallback usage so the team can measure whether
    real traffic still depends on it.
  - Remove legacy `rawDeferredToolResponse` normalization only after the
    documented pause, resume, and replay path is stable in soak testing.
- Complete release-grade validation.
  - Re-run `pnpm run lint` and `pnpm tsc --noEmit`.
  - Add at least one high-level validation per critical user journey in Future
    Chat, Make, and Sidebar Chat.
  - Record the final regression-matrix outcome for each flow instead of leaving
    verification implied by code changes alone.

## Recommended execution order

The remaining work should happen in this order so session semantics are settled
before broader validation and cleanup.

1. Audit and label every remaining background RovoDev call site.
2. Introduce or finish the explicit ephemeral-session strategy where needed.
3. Run the regression matrix and repository-wide validation checks.
4. Remove compatibility-only fallback code if usage data shows it is no longer
   needed. If usage remains, keep it documented and tracked as a follow-up.

## Plan Mode Architecture (Investigated 2026-03-20)

This section documents the end-to-end plan mode flow as verified by code
tracing. The Plan button in `/future-chat/` is fully wired through two
complementary mechanisms.

### Mechanism 1 — Agent Mode Toggle (persistent Serve state)

1. User clicks the Plan button in `future-chat-composer.tsx`
2. `togglePlanMode()` in `use-future-chat.ts` fires
3. Calls `fetchFutureChatAgentMode("ask")` which sends
   `POST /api/agent-mode { mode: "ask" }`
4. Next.js proxy → Express handler at `POST /api/agent-mode` in `server.js`
5. Express calls `setAgentMode(port, "ask")` in `rovodev-agent-mode.js`
6. Which sends `PUT /v3/agent-mode { mode: "ask" }` to RovoDev Serve

This sets a persistent mode on the Serve instance. The only documented modes
are `"default"` and `"ask"`.

### Mechanism 2 — Per-message `enable_deep_plan` flag

1. On each chat send, `use-future-chat.ts` reads `isPlanModeRef.current`
2. Adds `isPlanMode: true` to the request body sent to `POST /api/future-chat`
3. `server.js` reads `requestBody.isPlanMode`, resolves
   `resolvedPlanModeActive` (also includes auto-plan heuristic from
   `assessPromptComplexityForPlanMode()`)
4. Passes `{ message: userMessage, enableDeepPlan: resolvedPlanModeActive }`
   to `streamViaRovoDev()`
5. `rovodev-gateway.js` → `sendMessageStreaming(message, ...)` in
   `rovodev-client.js`
6. `normalizeChatRequestInput(input)` maps `enableDeepPlan` →
   `enable_deep_plan`
7. Sends `POST /v3/set_chat_message { message: "...", enable_deep_plan: true }`

### Plan Output Flow (Serve → Plan Widget → User Approval)

1. RovoDev Serve (in plan/ask mode) generates a plan
2. Serve calls `exit_plan_mode` tool — this is a paused/deferred tool call
   because `pause_on_call_tools_start=true` is set
3. Backend intercepts in `onPausedToolCalls` callback, registers as
   `kind: "plan-approval"` with the `deferredToolCallId`
4. In `onToolCallInputResolved`, extracts the plan markdown from tool input
5. Emits a `plan` widget with the plan content and `deferredToolCallId`
6. Frontend renders `PlanWidgetInlineCard` (from
   `components/projects/shared/lib/plan-widget.ts`) with approve/reject/custom
   buttons
7. On approval → `handlePlanApproval()` in `plan-approval.ts` sends the
   approval back to the backend
8. Backend calls `POST /v3/resume_tool_calls` with the approval decision
9. RovoDev Serve exits plan mode and begins execution
10. Backend streams the execution output via `POST /v3/replay`

### Auto-plan heuristic

Even without the Plan button toggled, `assessPromptComplexityForPlanMode()` in
`plan-mode-complexity-heuristic.js` can auto-trigger `resolvedPlanModeActive`
for complex prompts, so `enable_deep_plan` may be set automatically.

### Key files reference

| Layer              | File                                                              | Role                                              |
| ------------------ | ----------------------------------------------------------------- | ------------------------------------------------- |
| UI Button          | `components/projects/future-chat/components/future-chat-composer.tsx` | Plan toggle button rendering                     |
| Chat Hook          | `components/projects/future-chat/hooks/use-future-chat.ts`       | `togglePlanMode()`, `isPlanModeRef`, sends body   |
| Agent Mode Lib     | `components/projects/future-chat/lib/future-chat-agent-mode.ts`  | Request builders for `/api/agent-mode`            |
| API Route Proxy    | `app/api/agent-mode/route.ts`                                    | Next.js proxy to Express                          |
| Express Handler    | `backend/server.js` (~line 9920)                                 | `POST /api/agent-mode` → `setAgentMode()`         |
| Serve Agent Mode   | `backend/lib/rovodev-agent-mode.js`                              | `PUT /v3/agent-mode` on RovoDev Serve             |
| Chat Send          | `backend/server.js` (~line 2377)                                 | Reads `isPlanMode`, sets `resolvedPlanModeActive` |
| Serve Call         | `backend/server.js` (~line 8122)                                 | Builds `enableDeepPlan` message object            |
| Normalize Input    | `backend/lib/rovodev-client.js` (~line 640)                      | `enableDeepPlan` → `enable_deep_plan`             |
| Set Chat Message   | `backend/lib/rovodev-client.js` (~line 1207)                     | `POST /v3/set_chat_message` with normalized body  |
| Tool Intercept     | `backend/server.js` (~line 8165)                                 | Catches paused `exit_plan_mode` tool call         |
| Plan Widget        | `components/projects/shared/lib/plan-widget.ts`                  | Parses plan payload for rendering                 |
| Plan Approval      | `components/projects/shared/lib/plan-approval.ts`                | Approval/reject logic                             |
| Complexity Heuristic | `backend/lib/plan-mode-complexity-heuristic.js`                | Auto-plan for complex prompts                     |

### Manual testing checklist

- [ ] Start dev stack (`pnpm run rovodev` or `pnpm run dev`)
- [ ] Navigate to `http://localhost:3000/future-chat/`
- [ ] Toggle the Plan button ON — verify it shows pressed state
- [ ] Check backend logs for agent-mode set confirmation
- [ ] Send a complex prompt (e.g. "Refactor the login page to use a new design")
- [ ] Verify backend logs show `enableDeepPlan: true` on the `set_chat_message`
- [ ] Verify RovoDev Serve enters plan mode and generates a plan
- [ ] Verify `exit_plan_mode` paused tool call is intercepted
- [ ] Verify plan widget card appears in the chat with approve/reject buttons
- [ ] Approve the plan and verify RovoDev starts executing
- [ ] Toggle Plan button OFF — verify agent mode resets to `default`
- [ ] Send a simple prompt without Plan button — verify `enable_deep_plan: false`
- [ ] Send a very complex prompt without Plan button — verify auto-plan heuristic
      may trigger `enable_deep_plan: true`

## Sign-off criteria

The migration is ready for sign-off only when the codebase and the regression
matrix both show the documented Serve contract is now the primary path.

- Every interactive plan, clarification, and approval continuation uses the
  documented pause, `resume_tool_calls`, and replay flow as the default path.
- Every remaining RovoDev generation entry point declares its session strategy
  explicitly instead of inheriting ambient port-local session state.
- Every row in the regression matrix is marked `preserved`, `adapted`, or
  `degraded intentionally`, with no unclassified gaps.
- `pnpm run lint`, `pnpm tsc --noEmit`, and the targeted RovoDev tests pass on
  the final branch.
- Manual UI validation passes for Future Chat, Make, and Sidebar Chat on the
  flows listed in the regression matrix.

The prompt-context continuation fallback does not have to block sign-off if it
remains compatibility-only, fallback usage is observable, and the documented
path is already validated as the default. If those conditions are not true, the
fallback remains a migration blocker rather than a safety net.
