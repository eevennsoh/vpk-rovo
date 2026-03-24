# Future Chat Planning Feature Spec

> This document combines browser test findings (March 21, 2026) with a full
> feature specification derived from a detailed interview session.
> **Updated March 22, 2026:** live E2E validation + new findings §6.6–§6.8,
> §2.4 semantics, Appendix B.
> **Updated March 22, 2026 (review):** RovoDev serve codebase review —
> corrected `exit_plan_mode` deferred status, `enableDeepPlan` vs plan mode
> distinction, `invoke_subagents` scope, and added new recommendations.
> See §9 for full review notes.

---

## 1. Overview

The planning feature enables collaborative, structured planning between users
and RovoDev. Users send planning-intent messages, optionally answer clarifying
questions, review a proposed plan, approve it, and then RovoDev executes the
plan task-by-task with live progress tracking.

**Key principles:**

- Planning is collaborative, not a rubber stamp.
- Q&A is at agent discretion (RovoDev decides whether to ask questions based
  on prompt specificity).
- Plans are all-or-nothing approval (no partial task selection).
- One active plan per thread at a time.
- Plan execution is backend-orchestrated with per-task RovoDev messages.
- Artifacts stream to the user as they are generated (no waiting for full
  plan completion).

---

## 2. Planning Flow

### 2.1 Trigger mechanisms

Plan mode activates through two paths:

1. **Explicit** — User toggles the "Plan" button in the composer before
   sending. Sets `isPlanMode: true` on the request body.
2. **Implicit (auto-plan)** — The backend's `assessPromptComplexityForPlanMode()`
   heuristic scores every incoming message. Score >= 2 triggers
   `autoPlanTriggered = true`. Heuristic signals: feature/refactor intent,
   high-risk domain, multiple systems, multiple deliverables, tradeoff language,
   planning keywords, long prompt (200+ chars).

Both paths merge into `resolvedPlanModeActive = true`, which the frontend must
translate into the serve-side plan workflow: set `agent_mode="plan"` and use
the v3 chat flow with deferred tools enabled.

> **⚠️ CORRECTION (codebase review):** In the RovoDev serve API,
> `enableDeepPlan` (the `enable_deep_plan` field on `ChatRequest`) controls
> the `create_technical_plan` Nautilus tool — a *separate* feature for
> architecture planning via a planning subagent. **Plan mode** is activated
> via `PUT /v2/agent-mode` (or `/v3/agent-mode`) with
> `SetAgentModeRequest(mode="plan")`, which sets `agent_mode = "plan"` on the
> agent deps. These are independent mechanisms:
>
> | Concept | API surface | What it controls |
> |---------|-------------|-----------------|
> | `enable_deep_plan` | `ChatRequest.enable_deep_plan` | Enables/disables the `create_technical_plan` tool per request |
> | Plan mode | `PUT /agent-mode` with `mode: "plan"` | Sets agent into plan mode (read-only tools, `exit_plan_mode` workflow) |
>
> The frontend's `resolvedPlanModeActive` must therefore trigger **plan
> mode itself** via the mode endpoint and use the v3 chat flow with
> `enable_deferred_tools=true`. For this feature, treat
> `enable_deep_plan` / `create_technical_plan` as **out of scope** and do
> not wire it into the plan-mode UX. If the frontend only sends
> `enable_deep_plan: true` without setting agent mode, the agent will NOT be
> in plan mode and will not follow the plan workflow
> (Q&A → `exit_plan_mode`).

Auto-plan runs on **every message** in a thread, not just the first.
No UI indicator is shown when auto-plan triggers — the question card or plan
widget appearing is the indication.

### 2.2 Expected flow (happy path)

```
User sends message
       |
       v
Backend resolves plan mode (explicit OR auto-plan)
       |
       v
Backend sets agent_mode="plan" via PUT /agent-mode
AND sends chat with enable_deferred_tools=true
       |
       v
RovoDev decides: ask questions first? (agent discretion)
       |
      / \
     /   \
    v     v
ask_user_questions     exit_plan_mode
(deferred tool)        (deferred tool)
    |                       |
    v                       v
Question card           Plan widget (Plan tab + Tasks tab)
renders in chat         with "Build" CTA button on the card
    |                       |
    v                       v
User answers            User clicks "Build"
    |                       |
    v                       v
Resume deferred         Resume deferred exit_plan_mode
tool call (with         tool call → frontend must call
enable_deferred_tools   PUT /agent-mode (default) →
=true on stream_chat)   backend begins task execution loop
    |
    v
RovoDev continues turn,
may call exit_plan_mode
(or ask_user_questions again)
    |
    v
Plan widget with
"Build" CTA button
```

**No separate approval card.** The plan card itself contains the "Build"
CTA button. This serves as the acceptance mechanism. There is no "Yes,
let's start cooking" / "No, keep planning" approval card.

### 2.3 Continue planning

To continue planning (iterate on the plan), the user simply **keeps chatting
with the Plan toggle on** in the composer. The backend retains the previous
planning context (Q&A history, prior plan content) and RovoDev generates a
new plan card with an updated plan.

- Each iteration produces a **new plan card** (not updating the old one).
  Users can scroll through plan iterations and compare.
- Only the **latest** plan card has an active "Build" CTA — earlier plan
  cards' CTAs are grayed out with tooltip: "A newer plan is available."
- If the user **toggles Plan off**, the conversation returns to normal chat
  mode. No planning context is carried forward.
- There is **no hard cap** on planning rounds — RovoDev uses its judgment.

This replaces the previous "No, keep planning" button-based loop with a
more natural chat-driven iteration model.

### 2.4 "Skip" and "Dismiss questions" semantics

**Final product decision:** The **Skip** button on the question card should
**cancel the entire question set** by cancelling the deferred tool and
returning to normal chat without resuming the planning turn.

**Observed (live validation, March 2026):**

- **Skip** — Currently advances to the **next question** in a multi-question
  clarification flow; it does **not** terminate the entire deferred tool by
  itself. This is **not** the desired behavior.
- **Dismiss questions** — Currently removes the question card UI and sends a
  synthetic user message that the user skipped clarification; RovoDev
  **resumes** and may call `ask_user_questions` again. If the second-round
  question card does not render (see §6.6), the session can leave RovoDev
  blocked with no visible UI to respond. This is **not** the desired
  behavior.

**Action:** Align implementation with this final semantics: **Skip** and
**Dismiss questions** both cancel the whole question set via the deferred-tool
cancel path. Document the exact cancel API contract (`toolCallId` required —
see `/api/future-chat/cancel-deferred-tool`).

### 2.5 Plan widget structure

The plan widget has two tabs:

- **Plan tab** — Shows the full markdown content from `exit_plan_mode` output,
  rendered as-is.
- **Tasks tab** — Shows a structured checklist of tasks extracted from the
  markdown via `extractPlanWidgetPayloadFromText()`. Tasks include:
  - Task name
  - Task description
  - Dependencies (agent-defined in `exit_plan_mode` output)
  - Status: pending (default)

Tasks are **extracted from the markdown**, not generated via `update_todo`.
When `update_todo` is available, it is used only during execution for
progress tracking.

### 2.6 Plan title generation

The plan widget title is **auto-generated** via a direct AI Gateway LLM call
(not through RovoDev). This avoids overloading RovoDev with formatting tasks.

### 2.7 Plan card lifecycle

- **Multiple plan cards** can exist in a thread (from iterative planning).
- Only the **latest** plan card has an active "Build" CTA.
- Older plan cards show grayed-out CTAs with tooltip: "A newer plan is
  available."
- Once a plan is accepted (user clicks "Build"), **all** plan cards in the
  thread have their CTAs disabled.
- One active plan per thread. Clicking "Build" locks the thread to that plan.
- `exit_plan_mode` **is a deferred tool** — it raises `CallDeferred()` just
  like `ask_user_questions` (see `packages/cli-rovodev/src/rovodev/modules/tools/exit_plan_mode.py:36`).
  Both are listed in the serve endpoint's conditional deferred tools
  (`v2/endpoints.py:1078-1079`), disabled unless `enable_deferred_tools=True`.
  The "Build" CTA on the plan card resumes the deferred tool call.
  **In serve mode, the mode switch from PLAN to DEFAULT does NOT happen
  automatically** — the frontend must call `PUT /agent-mode` with
  `mode: "default"` after resuming (see §9.3.7). *(Previous versions of
  this doc incorrectly stated `exit_plan_mode` was non-deferred.)*

---

## 3. Plan Execution

### 3.1 Orchestration model: backend loop + update_todo

After the user clicks "Build" on a plan card:

1. Backend marks the plan as accepted in `planSession`.
2. Backend resolves the plan's task dependency graph.
3. Backend sends the first eligible task (no unresolved dependencies) to
   RovoDev as a new message.
4. During the build phase, RovoDev executes the task and may use
   `invoke_subagents` for parallelizable work, then optionally calls
   `update_todo` (when that tool is enabled) to signal progress/completion.
5. Backend receives `AGENT_RUN_END` lifecycle event via the
   `/v3/agent_lifecycle_events` SSE endpoint.
6. Backend marks the task as done and sends the next eligible task(s).
7. Repeat until all tasks complete or a failure halts execution.

> **⚠️ NOTE (codebase review):** The `AgentLifecycleEventsCallback` emits
> events with types `AGENT_RUN_START`, `AGENT_RUN_END`, and `ERROR`.
> `AGENT_RUN_END` does include a coarse `task_status` classification
> (`TASK_COMPLETED` or `WAITING_FOR_USER`), but that status reflects the
> overall turn outcome, not completion of a specific plan task. The backend
> still needs its own mapping from agent turns and/or `update_todo`
> tool-return events to concrete plan-step progress. The `update_todo` tool
> stores todos in `ctx.deps.state["todos"]` — the backend would need to
> read these from session state or parse the SSE stream for `tool-return`
> events from `update_todo`. **This orchestration layer is future work and
> does not exist in RovoDev serve today.**

**Multi-port parallel execution:** When multiple RovoDev Serve ports are
available and tasks have no dependencies between them, the backend
automatically distributes independent tasks across idle ports for parallel
execution. The dependency graph determines which tasks can run concurrently.

### 3.2 Progress tracking

The **agent progress component** (`components/blocks/agent-progress`)
renders as a sticky bar above the composer:

- Shows plan title, elapsed time, and per-task status.
- Task status groups: `todo`, `inProgress`, `done`, `failed`.
- Progress bar with weighted calculation.
- Auto-expands in-progress and failed groups.
- Collapsible — user can minimize to a compact header.
- Persists until the user dismisses/hides it.

**The plan card itself does not track execution progress.** Once the user
clicks "Build", the plan card's CTA is disabled and the agent progress
component takes over as the sole progress tracker.

### 3.3 Stop / cancel

A **Stop button** on the agent progress component cancels the current task
and halts execution. The composer remains active throughout execution for
normal chat, steering, etc. — it is NOT used for plan cancellation.

In a single-port setup, sending a chat message during execution may fail or
wait because the port is busy. In a multi-port setup, idle ports handle chat
messages without interrupting plan execution.

### 3.4 Error recovery and retry

- On task failure, the system **auto-retries once** (total 2 attempts).
- If the retry also fails, the task moves to `failed` status and the error
  is shown to the user in the agent progress component.
- The agent progress component's retry button allows manual retry of failed
  tasks.
- **Blocking dependencies:** If a failed task blocks other tasks, those
  blocked tasks remain in `todo` status and do not execute until the blocker
  is resolved.

### 3.5 Task dependencies

Dependencies are **agent-defined**: RovoDev declares task dependencies in
the `exit_plan_mode` markdown output (e.g., "Task 3 depends on Task 1, 2").
The backend parses these into a dependency graph used for execution ordering
and parallel distribution.

> **⚠️ NOTE (codebase review):** The `exit_plan_mode` tool takes a single
> `plan: str` argument — free-form markdown. There is no structured schema
> for task dependencies in the tool contract. Dependencies would exist as
> prose within the markdown and must be extracted by the frontend's
> `extractPlanWidgetPayloadFromText()` parser. The reliability of dependency
> extraction depends entirely on the markdown structure RovoDev produces and
> the parser's ability to interpret it. Consider adding structured dependency
> output to the `exit_plan_mode` tool schema (e.g., a `tasks` arg with
> explicit `depends_on` fields) if dependency graphs are critical for Phase 3
> parallel execution.

### 3.6 Mid-execution task addition

**Deferred to future version.** V1 does not support adding tasks to a
running plan. Users must stop the plan and create a new one.

---

## 4. Artifacts

> **⚠️ NOTE (codebase review):** RovoDev serve has no dedicated artifact
> API endpoints. Artifacts are stored internally via
> `session_ctx.deps.artifacts` (a dict-like structure), but there is no
> REST endpoint to list, stream, or retrieve artifacts. The artifact panel
> and streaming described below are entirely **frontend/backend-for-frontend
> responsibilities** — the frontend would need to parse artifact data from
> the SSE stream events (e.g., `tool-return` events that produce file
> content) and render them. This is all Phase 4 future work.

### 4.1 Artifact generation during execution

As RovoDev executes plan tasks, it generates artifacts. These are **dynamic
UI outputs** similar to GenUI cards but without the standard GenUI
header/footer chrome. Artifact types include:

- **App artifacts** — Interactive UI rendered from json-render with logic.
- **Content artifacts** — Pure text, pages, images, video.
- **Skill output artifacts** — Output from agent skills (e.g., HTML landing
  pages), where the skill determines the artifact shape.
- **Domain-specific artifacts** (future) — Agent definitions, skill
  definitions, automation rules, etc., each with purpose-built UI. These
  types are not yet designed.

### 4.2 Artifact panel behavior

- The artifact panel **auto-opens** when the first artifact is generated
  during plan execution.
- Multiple artifacts appear as **tabs** in the panel with a tab selector.
- Artifacts **stream as they are generated** — users see output in real-time,
  not after full plan completion.
- In the chat body, a GenUI card is generated that can open the artifact
  panel to show the output.

---

## 5. State Management

### 5.1 Plan mode persistence across deferred tool resumes

**Problem identified:** `resolvedPlanModeActive` does not persist across
deferred tool resume turns. When the user answers a question card and the
backend resumes the tool call, the plan mode flag is not forwarded to the
continuation, allowing RovoDev to produce GenUI cards instead of calling
`exit_plan_mode`.

**Solution:** Track plan mode as **thread-level state** using a dedicated
plan session object stored on the thread:

```
planSession: {
  isActive: boolean,
  phase: "qa" | "plan" | "execution" | null,
  deferredToolCallId: string | null,   // only for ask_user_questions
  planCardIds: string[],
  acceptedPlanId: string | null,
}
```

This object persists across turns within the same thread. When the Plan
toggle is on, the backend reads `planSession.isActive` to determine whether
plan mode constraints should apply. When the user toggles Plan off,
`planSession.isActive` is set to `false` and planning context is not
carried forward.

### 5.2 GenUI hard-block in plan mode

`genui-post-tool-eligibility.js` already disables GenUI when in plan mode
(line 24). **However, this check must also apply to deferred tool resume
turns.** The fix: when resuming a deferred tool call, read
`planSession.isActive` from the thread and set `resolvedPlanModeActive = true`
before evaluating GenUI eligibility.

This is a **backend enforcement** — not prompt-only. GenUI is hard-blocked
for any continuation turn within a planning session.

### 5.3 Stale deferred tool calls

Deferred tool calls (question cards) **persist and remain resumable** even
if the user navigates away and returns later. The cards remain interactive.

Note: both `ask_user_questions` and `exit_plan_mode` are deferred tools —
both raise `CallDeferred()` and are gated by `enable_deferred_tools` in
the serve endpoint. The "Build" CTA on the plan card resumes the
`exit_plan_mode` deferred tool call. Plan card CTAs are always interactive
(unless disabled by a newer plan or an accepted plan).

### 5.4 Backward compatibility

New behavior applies to **new threads only**. Existing threads with old
plan widgets and question cards retain their current rendering and behavior.

---

## 6. Bug Fixes Required

These are the confirmed issues from browser testing that must be resolved.

### 6.1 Flow ordering violation (Finding #1) — P0

**Problem:** RovoDev skips `ask_user_questions` and generates a plan
immediately, then asks questions after the plan.

**Root cause:** Agent discretion combined with insufficient prompt guidance.
The `REQUEST_USER_INPUT_INSTRUCTION` in `rovo/config.js` (frontend system
prompt) says to use `ask_user_questions` when clarification is needed, but
does not strongly tie it to the planning flow specifically.

> **⚠️ NOTE (codebase review):** There are **two layers** of prompt
> instructions at play:
> 1. **Frontend system prompt** (`rovo/config.js`) — injected by the
>    frontend into the chat context. Contains `REQUEST_USER_INPUT_INSTRUCTION`.
> 2. **RovoDev serve plan mode prompt** (`agent_modes.py` →
>    `MODE_CONFIGS[AgentMode.PLAN].instructions`) — injected by
>    `AgentModeCallback` as a `<system-reminder>` when agent mode is `"plan"`.
>    This already says: "1. Do quick exploration... 2. Ask clarifying
>    questions using ask_user_questions... 3. Call exit_plan_mode..."
>
> Fixes should target **both** layers, but the RovoDev serve plan mode
> prompt is the authoritative source since it's injected directly by the
> agent framework.

**Fix:**
- Update `rovo/config.js` to include a planning-specific instruction: when
  plan mode is active and the user's request is ambiguous or complex,
  RovoDev SHOULD call `ask_user_questions` before `exit_plan_mode`. However,
  this remains agent discretion — if the prompt is sufficiently specific,
  RovoDev may skip directly to `exit_plan_mode`.
- Optionally strengthen `MODE_CONFIGS[AgentMode.PLAN].instructions` in
  `agent_modes.py` to add: "If the request is ambiguous, call
  `ask_user_questions` before producing a plan. Once you have presented a
  plan for approval, do not switch back into more clarification questions
  unless the user explicitly asks to revise the plan."
- The key constraint is: once RovoDev has already presented a plan for
  approval, it should not fall back into more clarification questions unless
  the user explicitly asks to revise or continue planning. If a plan has
  been generated, further iteration happens through subsequent chat messages
  with Plan toggle on.

### 6.2 Wrong widget type after Q&A (Finding #2) — P0

**Problem:** After Q&A, RovoDev generates a GenUI spec card instead of
calling `exit_plan_mode`. No plan card with "Build" CTA appears.

**Root cause:** Two contributing factors:
1. `resolvedPlanModeActive` is not forwarded on the deferred tool resume
   turn, so GenUI eligibility is not blocked.
2. RovoDev's prompt does not strongly enforce `exit_plan_mode` as the
   required tool for plan output during planning sessions.

> **⚠️ NOTE (codebase review):** GenUI does NOT exist in the RovoDev serve
> layer — no 'genui' or 'gen_ui' references exist in the serve codebase or
> in code-nemo. GenUI is a **frontend/backend-for-frontend construct**
> applied to RovoDev's response after the fact. This means root cause #2 is
> more accurately: RovoDev produces free-form text (not calling
> `exit_plan_mode`), and the frontend's GenUI post-processing then converts
> that text into a GenUI spec card. The fix should focus on ensuring RovoDev
> calls `exit_plan_mode` (serve-side fix), not just blocking GenUI
> (frontend-side fix). Also, §9.3.1 identifies that `enable_deferred_tools`
> not being forwarded on resume may be the root cause — if `exit_plan_mode`
> is disabled, RovoDev literally cannot call it.

**Live validation addendum (March 2026):** With Plan mode ON and a **specific**
build request (e.g. React todo app with stack spelled out), RovoDev invoked
**`invoke_subagents`** for extended exploration, then returned **plain text +
follow-up suggestion chips** — still **no** `exit_plan_mode` and **no** plan
widget. Suggestion chips are not the structured question card. This blocks
validation of plan tabs, Build CTA, iterative CTAs, and "no fallback into
extra clarification after a plan-worthy build request" until the agent
reliably calls `exit_plan_mode` (possibly by keeping `invoke_subagents`
available for parallel exploration but ensuring subagent results feed a
mandatory `exit_plan_mode` step before the turn ends).

**Fix:**
- Implement thread-level `planSession` state (Section 5.1) so
  `resolvedPlanModeActive` persists across resume turns.
- Hard-block GenUI on resume turns when `planSession.isActive` (Section 5.2).
- Update `rovo/config.js` to instruct: "When in plan mode, you MUST present
  plans using `exit_plan_mode`. Never generate plan content as free-form
  text or GenUI cards."
- Add tooling/policy so **plan mode** cannot end a turn without
  `exit_plan_mode` when a plan was the user’s goal (contrast with pure Q&A).

### 6.3 Continue-planning widget stall (Finding #3) — P1

**Problem:** After selecting "No, keep planning" (old flow), `ask_user_questions`
stalls at "Loading widget..." indefinitely.

**Relevance to new design:** The separate "No, keep planning" button is
removed. However, the underlying issue — `ask_user_questions` producing
non-renderable widget data on resume turns — can still occur when Q&A
happens during iterative planning (user chats with Plan toggle on, RovoDev
decides to ask follow-up questions).

**Root cause hypothesis:** The `ask_user_questions` tool response from the
deferred tool resume arrives in a format the frontend's
`selectLatestRenderableWidgetPart()` does not recognize. The widget loading
indicator is set but never resolved.

**Partial fix shipped (March 2026):** Immediate `data-widget-loading:
loading: false` after question-card payload in `backend/server.js`, plus
frontend bypass of `!chat.isStreaming` for deferred question cards
(`future-chat-shell.tsx`). **First-turn** question cards now render and clear
loading reliably.

**Live validation:** On **deferred resume turns** (after Q&A answers or after
"Dismiss questions"), the tool row still shows `ask_user_questions` **Running**
but **no question card appears** — worse than a stall; the user has nothing
to click (see §6.6).

**Fix:**
- Investigate the data part format emitted by `emitRequestUserInputQuestionCard()`
  on resume turns vs initial turns. Ensure the widget payload structure
  matches what `selectLatestRenderableWidgetPart()` in
  `thread-message-root.tsx` expects.
- Fix **resume-turn** binding of `activeQuestionCard` / shell rendering (§6.6).
- Review `emittedQuestionCardToolCalls` dedupe in `emitRequestUserInputQuestionCard()`
  for same-thread multi-round Q&A.
- Add a timeout fallback: if the widget loading indicator persists for > 30
  seconds without a renderable payload, show an error state with a retry
  option rather than hanging indefinitely.

### 6.4 RovoDev port stuck error (Finding #4) — P2 (often P0 in practice)

**Problem:** "RovoDev port is stuck" error blocks new chats and continuations.

**Root cause:** The `retryChatInProgress` mechanism in `rovodev-gateway.js`
times out (10s retry window with 250ms->1s exponential backoff) when the
RovoDev session is slow or unresponsive.

**Live validation addendum:** The error also appears when a **deferred tool
remains paused** (e.g. second-round `ask_user_questions` with **no visible
question card** — §6.6). The user cannot answer; the port stays claimed.
Toggling **Plan OFF** in the composer does **not** cancel the deferred tool on
the backend (§6.8), so the stuck state persists until backend restart or a
successful `cancel-deferred-tool` call with a known `toolCallId`.

**Fix:**
- Investigate port acquisition and session cleanup in `rovodev-gateway.js`.
- Consider increasing the retry window for deferred tool resumes (which
  are expected to be slower due to context restoration).
- Ensure `cancelChat()` reliably interrupts stuck sessions.
- On Plan toggle OFF, **clear or cancel** active deferred tools for the
  thread (§6.8).
- Surface better error messaging to the user with a retry action.

### 6.5 Infinite re-render crash (Finding #5) — P3

**Problem:** React "Maximum update depth exceeded" error after Q&A
submission.

**Status:** Not reproduced in validation round 2. Monitor for recurrence.
No active fix planned unless it reproduces consistently.

### 6.6 Question card invisible on deferred resume turns (Finding #6) — P0

**Problem:** After the user **answers** the first question card (or uses
**Dismiss questions**), RovoDev often calls `ask_user_questions` **again** on
the resume continuation. The tools UI shows `ask_user_questions` **Running**,
but **no clarification card** is rendered — sometimes for minutes until Stop
or timeout. User cannot complete the flow; port often remains blocked (§6.4).

**Hypotheses:**
- Frontend: `activeQuestionCard` / `shouldShowQuestionCard` only wired for
  the first assistant message’s widget, not the **latest** deferred tool in a
  multi-message thread.
- Backend: `emittedQuestionCardToolCalls` dedupe (`resolvedDedupeKey`) may
  suppress a second emission when richness scores or keys collide across
  rounds.
- Streaming: residual interaction between `isStreaming`, message parts, and
  shell vs thread message rendering on continuation turns.

**Fix:**
- Trace widget parts on resume from `data-widget-data` through
  `future-chat-shell.tsx` and `selectLatestRenderableWidgetPart()`.
- Ensure each new `toolCallId` always produces a visible card or explicit
  error state.
- Add integration test or manual checklist for **two consecutive**
  `ask_user_questions` in one thread.

### 6.7 `invoke_subagents` vs `exit_plan_mode` (Finding #7) — P1

**Problem:** When **plan mode** is active (`agent_mode = "plan"`), RovoDev
may run **`invoke_subagents`** instead of (or before) calling
**`exit_plan_mode`**, producing no plan widget and no structured plan
approval path. The agent returns plain text + suggestion chips instead.

> **⚠️ CORRECTION (codebase review):** The original finding attributed this
> to `enableDeepPlan`. In reality, `enable_deep_plan` controls the
> `create_technical_plan` tool (a separate Nautilus feature), NOT plan mode.
> The issue occurs under **plan mode** (`agent_mode = "plan"`) when
> subagents are configured. `invoke_subagents` is registered at the Nemo
> Core layer (`AgentDefinition.__init__`) and is available whenever subagents
> exist — it is NOT restricted by plan mode's read-only enforcement (which
> only affects the `filesystem-tools` MCP server via `AgentModeCallback`).
> `invoke_subagents` is also not in the `_always_allowed_tools` list but
> defaults to `"allow"` in permission config.
>
> **Severity reassessed to P1** because the plan mode prompt explicitly
> instructs the agent to call `exit_plan_mode`, making this a prompt
> adherence issue rather than a missing guardrail. However, there is no
> hard constraint preventing the model from calling `invoke_subagents`
> during plan mode.

**Final product direction:**
1. **Plan first:** In plan mode, the agent must always present the plan via
   `exit_plan_mode` before any build-phase execution starts.
2. **Build after approval:** Once the user clicks the **Build** CTA and the
   frontend switches the agent back to default mode, the implementation
   phase may use `invoke_subagents` for parallelizable work.
3. **Prompt fix:** Strengthen `MODE_CONFIGS[AgentMode.PLAN].instructions`
   in `agent_modes.py` so the agent does not treat subagent exploration as a
   substitute for plan approval. In plan mode, the end state for build
   requests must be `exit_plan_mode`.
4. **Serve-level follow-up (optional):** If prompt-only steering is not
   reliable enough, add a lightweight enforcement/reminder path for plan
   mode turns that finish with plain text after subagent work but without
   `exit_plan_mode`.

> **⚠️ NOTE:** `AgentModeCallback` does not directly control non-MCP tools
> like `invoke_subagents` or `get_skill`; it only changes filesystem-tools
> behavior. For this feature, the policy is: **preserve** `invoke_subagents`
> for the build phase, but make the **plan-mode** end state deterministic by
> requiring `exit_plan_mode` before build execution begins.

### 6.8 Plan toggle OFF does not cancel deferred tool (Finding #8) — P0

**Problem:** Turning **Plan** off in the composer updates UI state but does
**not** reliably cancel an in-flight **`ask_user_questions`** deferred tool
on the backend. Stale pauses keep RovoDev ports busy → "port stuck" on
unrelated new threads (§6.4).

> **⚠️ NOTE (codebase review):** RovoDev serve has a unified `/cancel`
> endpoint (POST to `/v2/cancel` or `/v3/cancel`) that handles both ongoing
> chats AND pending deferred tool requests. It calls
> `_cancel_pending_deferred_tools()` which writes `ToolReturnPart` entries
> with content `"User cancelled the request"` into message history. This
> does NOT require a `toolCallId` — it cancels ALL pending deferred tools.
> The frontend's `/api/future-chat/cancel-deferred-tool` endpoint (which
> requires `toolCallId`) is a separate frontend API that must ultimately
> call RovoDev serve's `/cancel`. Plan toggle OFF should also call
> `PUT /agent-mode` with `mode: "default"` to reset the agent mode.

**Fix:**
- On Plan toggle OFF for the active thread, call RovoDev serve's `/cancel`
  endpoint to cancel pending deferred tools, AND call `PUT /agent-mode`
  with `mode: "default"` to reset agent mode.
- The frontend's `/api/future-chat/cancel-deferred-tool` should internally
  call RovoDev serve's `/cancel` endpoint.
- Optionally expose thread-level "cancel pending question" in UI when a
  deferred tool is active without a visible card.

---

## 7. Key Files

### 7a. Frontend / backend-for-frontend

| File | Role |
| --- | --- |
| `backend/server.js` | Chat endpoint, plan mode resolution, deferred tool handling, task execution orchestration |
| `backend/lib/rovodev-client.js` | Communicates with RovoDev Serve |
| `backend/lib/rovodev-gateway.js` | Port management, retry logic, session lifecycle |
| `backend/lib/plan-mode-complexity-heuristic.js` | Auto-plan scoring heuristic |
| `backend/lib/genui-post-tool-eligibility.js` | GenUI blocking logic (must respect plan session state) |
| `backend/lib/ask-user-questions-adapter.js` | Adapts question card answers to RovoDev tool contract |
| `rovo/config.js` | Frontend system prompt instructions for `ask_user_questions`, planning behavior |
| `components/projects/future-chat/hooks/use-future-chat.ts` | Frontend plan mode toggle state, submission logic |
| `components/projects/shared/lib/question-card-widget.ts` | Question card data structures |
| `components/projects/shared/lib/plan-widget.ts` | Plan widget data structures |
| `components/projects/shared/thread-message/thread-message-root.tsx` | Widget rendering, `selectLatestRenderableWidgetPart()` |
| `components/blocks/agent-progress/page.tsx` | Agent progress component (reuse for plan execution tracking) |
| `lib/rovo-ui-messages.ts` | UI message types and data parts |

### 7b. RovoDev serve (see also §9.5)

| File | Role |
| --- | --- |
| `packages/cli-rovodev/src/rovodev/modules/tools/exit_plan_mode.py` | `exit_plan_mode` tool — validates plan mode, raises `CallDeferred()` |
| `packages/cli-rovodev/src/rovodev/modules/tools/ask_user_questions.py` | `ask_user_questions` tool — raises `CallDeferred()` |
| `packages/cli-rovodev/src/rovodev/modules/agent_modes.py` | `AgentMode` enum, plan mode prompt, `AgentModeCallback` (read-only enforcement) |
| `packages/cli-rovodev/src/rovodev/commands/serve/common/models.py` | `ChatRequest`, `SetAgentModeRequest`, `DeferredToolResponse` |
| `packages/cli-rovodev/src/rovodev/commands/serve/v2/endpoints.py` | V2 endpoints, deferred tool gating, `/cancel` with `_cancel_pending_deferred_tools()` |
| `packages/cli-rovodev/src/rovodev/commands/serve/v3/endpoints.py` | V3 endpoints, `stream_chat` with `enable_deferred_tools` param, lifecycle events |
| `packages/code-nemo/src/nemo/core/agent_definition.py` | `invoke_subagents` / `get_skill` tool registration |
| `packages/code-nemo/src/nemo/utils/tools.py` | `update_todo` tool implementation |
| `packages/cli-rovodev/src/rovodev/modules/tool_permission_resolver.py` | `_always_allowed_tools` list |

> **⚠️ NOTE (codebase review):** The v2 `/chat` endpoint hardcodes
> `enable_deferred_tools=False` (line 865 in v2/endpoints.py). **Plan mode
> cannot work via v2 `/chat`.** V3's `/stream_chat` accepts
> `enable_deferred_tools` as a query param but defaults to `False` (line 131
> in v3/endpoints.py). The frontend must explicitly pass
> `enable_deferred_tools=true` on **every** `stream_chat` call — including
> resume calls. See §9.3.1 and §9.3.5 for details.

---

## 8. Implementation Phases

### Phase 1: Fix the planning flow (P0 + P1 bugs)

1. Implement thread-level `planSession` state object.
2. Forward `resolvedPlanModeActive` on deferred tool resume turns.
3. Hard-block GenUI when `planSession.isActive` on resume turns.
4. Update `rovo/config.js` with planning-specific instructions (Q&A before
   plan, must use `exit_plan_mode`).
5. Fix widget stall: ensure `ask_user_questions` on resume produces
   renderable widget data. Add 30s timeout fallback.
6. **Finding #6:** Fix question card **not rendering** on deferred **resume**
   turns (second+ `ask_user_questions` in a thread).
7. **Finding #8:** On Plan toggle OFF, cancel the active deferred tool and
   let the orchestrator reuse the serve slot or port.
8. **Finding #7:** Ensure plan mode always ends with `exit_plan_mode`
   before build execution starts. After the user clicks **Build**, the
   implementation phase may use `invoke_subagents` for parallelizable work
   (see §6.7).
9. Align **Skip** / **Dismiss** behavior with §2.4. Final product rule:
   **Skip cancels the entire question set** rather than moving to the next
   question.
10. Disable older plan card CTAs (gray + tooltip) when a newer plan exists.
11. Remove separate approval card rendering — plan card "Build" CTA is the
   sole acceptance mechanism.
12. ~~Make `exit_plan_mode` non-deferred.~~ **REMOVED (codebase review):**
   `exit_plan_mode` is deferred by design — it raises `CallDeferred()` so
   the user can approve/decline the plan before execution begins. Making it
   non-deferred would break the approval flow. The "Build" CTA resumes the
   deferred tool call. No change needed here.
13. **(NEW)** Ensure frontend sets **agent mode** (`PUT /agent-mode` with
   `mode: "plan"`) when the Plan toggle is activated. Do not rely on
   `enable_deep_plan` for this feature. Without agent mode, the agent won't
   follow the plan workflow. See §2.1 correction.

### Phase 2: Plan execution orchestration

1. Build backend task execution loop (sequential with dependency graph).
2. Integrate RovoDev's `update_todo` tool, when enabled, for progress/task
   signaling.
3. Listen to `agent_lifecycle_events` SSE for `agent_run_end` as a coarse
   turn-level status signal, not the sole source of per-plan-task truth.
4. Wire agent progress component as sticky bar above composer.
5. Implement stop button on agent progress to cancel execution.
6. Implement auto-retry (1 retry) with error escalation to user.
7. Plan card CTA disabled after "Build" is clicked.
8. Auto-generate plan title via AI Gateway LLM call.

### Phase 3: Multi-port parallel execution

1. Build dependency graph resolver to identify parallelizable tasks.
2. Distribute independent tasks across available idle RovoDev ports.
3. Aggregate progress from multiple concurrent task executions.
4. Handle partial failure in parallel execution (one port fails, others
   continue).

### Phase 4: Artifact streaming

1. Define artifact type system (app, content, skill output).
2. Auto-open artifact panel on first artifact generation.
3. Implement tab selector for multiple artifacts.
4. Stream artifacts in real-time as tasks produce output.
5. Generate GenUI cards in chat body that link to artifact panel.

### Phase 5: Port stability (P2 bug)

1. Investigate `retryChatInProgress` timeout for deferred resumes.
2. Improve `cancelChat()` reliability.
3. Surface retry actions in error UI.

---

## Appendix A: Test Findings (March 21, 2026)

This appendix preserves the original browser test findings that informed
this spec.

### Test setup

Testing used `cmux-browser` against the local app at
`http://localhost:3000`. Seeded threads via `POST /api/future-chat/threads`
with question card and plan widget payloads. Navigated to each thread and
interacted with the live UI. Waited 15-35 seconds per submission to confirm
final state.

### What worked

- Unresolved clarification question card rendered correctly.
- Question card showed expected prompt, options, custom answer input, and
  Skip action.
- Selecting a clarification option created the expected synthetic user
  summary message.
- Unresolved plan widget rendered correctly.
- Plan widget displayed plan content and task list.

> Note: The original test findings reference an "approval card" with "Yes,
> let's start cooking" / "No, keep planning" buttons. This has been replaced
> in the spec by a "Build" CTA directly on the plan card. The approval card
> is no longer part of the design.

### Finding details

**1. Flow ordering violation** — Confirmed. Thread:
`/future-chat/planning-plan-test-1774081341740`. RovoDev immediately
generated a plan without Q&A. When user selected "No, keep planning," it
then asked questions after the plan.

**2. Wrong widget type after Q&A** — Confirmed. Thread:
`/future-chat/planning-qcard-test-1774081341740`. After answering "Launch
quickly," continuation rendered a GenUI spec card instead of a plan widget.
No approval card appeared.

**3. Continue-planning stall** — Confirmed, reliably reproducible. After
"No, keep planning," `ask_user_questions` stalled at "Loading widget..." for
35+ seconds. Widget payload never arrived or was not recognized.

**4. RovoDev port stuck** — Confirmed, intermittent. Threads:
`planning-plan-accept-test-1774081501199`, `test-plan-accept-1774088855`,
`test-clarification-1774088782`. Error appeared in round 1 and round 3 but
not round 2. Not specific to plan acceptance.

**5. Infinite re-render crash** — Not reproduced in validation. Downgraded
to monitoring.

### Priority ranking

1. Flow ordering violation (P0)
2. Wrong widget type after Q&A (P0)
3. Question card invisible on resume turns (P0) — Finding #6
4. Plan toggle OFF without deferred cancel (P0) — Finding #8
5. `invoke_subagents` instead of `exit_plan_mode` (P1) — Finding #7
6. Continue-planning widget stall (P1) — Finding #3 (first-turn mitigated)
7. RovoDev port stuck (P2, often triggered by #6 / #8)
8. Infinite re-render crash (P3)

---

## Appendix B: Live browser validation (March 21–22, 2026)

Second validation round used **Cursor IDE browser** against
`http://localhost:3000/future-chat`, with backend/frontend restarted as
needed. Unit/contract tests from the planning test plan were already green;
this round focused on **end-to-end** behavior with real RovoDev.

### Environment notes

- Backend port for this worktree was **8080** (see `.dev-backend-port`).
- `POST /api/future-chat/cancel-deferred-tool` requires **`toolCallId`** (not
  threadId alone); without it, stuck sessions need restart or UI that
  surfaces the id.

### Summary table

| Area | Result | Notes |
| --- | --- | --- |
| Plan toggle ON/OFF (UI) | Pass | Pressed/released states observable. |
| First-turn question card | Pass | Card visible during streaming; loading cleared after payload + backend `loading: false`. |
| Q&A → second `ask_user_questions` | **Fail** | Tool shows Running; **no card** (Finding #6). |
| Dismiss questions | Partial | Card dismissed; skip message sent; agent often asks again → **Fail** on second card (Finding #6). |
| Skip (per-question) | Spec gap | Advances to **next** question; not full cancel (§2.4). |
| Plan widget / Plan+Tasks / Build | **Blocked** | No `exit_plan_mode` output in sampled runs; `invoke_subagents` + text instead (Finding #7). |
| GenUI vs plan after Q&A | Not re-proven E2E | Blocked by invisible second card and missing plan widget. |
| Port stuck | **Observed** | Follows invisible deferred tool + no cancel on Plan OFF (§6.4, §6.8). |
| Toggle Plan off → new chat | Partial | New thread can still hit port stuck if previous thread left deferred pause. |

### Screenshots (local)

- Deferred second-round state: `VPK-rovodev/output/test4-waiting-for-question-card.png` (path used during session).
- Cursor temp screenshots also captured under system temp `cursor/screenshots/` during automation.

### Follow-up engineering tasks (ordered)

1. Fix **resume-turn** question card visibility (Finding #6).
2. **Cancel deferred tool** when Plan toggles off + improve cancel API UX
   (Finding #8).
3. Enforce or steer **`exit_plan_mode`** when **plan mode** is active and
   user intent is a plan/build (Finding #7). Keep `invoke_subagents`
   available for parallel planning, but make `exit_plan_mode` the required
   approval handoff.
4. Re-run E2E checklist: plan widget tabs, Build, iterative plans, Build
   disabled after accept.
5. Retest port-stuck recovery after (1)–(2).

---

## 9. Codebase Review Notes (March 22, 2026)

This section documents findings from a systematic review of the RovoDev
serve codebase against the claims in this spec. Corrections have been
applied inline (marked with "⚠️ CORRECTION") and are summarized here.

### 9.1 Factual corrections applied

| Section | Incorrect claim | Actual behavior | Source |
|---------|----------------|-----------------|--------|
| §2.1 | Plan toggle "flows to RovoDev as `enableDeepPlan: true`" | `enable_deep_plan` controls the `create_technical_plan` tool, not plan mode. Plan mode is set via `PUT /agent-mode` with `mode: "plan"`. | `ChatRequest` model (`serve/common/models.py:85`), `v2/endpoints.py:1076` |
| §2.2 | `exit_plan_mode` is "non-deferred, ends RovoDev turn" | `exit_plan_mode` raises `CallDeferred()` — it IS a deferred tool | `exit_plan_mode.py:36` |
| §2.2 | Flow diagram: "enableDeepPlan: true sent to RovoDev" | Should be: set `agent_mode="plan"` + `enable_deferred_tools=true` | `serve/common/models.py`, `v3/endpoints.py:131` |
| §2.2 | "Build" CTA "begins task execution loop" directly | "Build" resumes the `exit_plan_mode` deferred tool. Mode switch to DEFAULT only happens in TUI/CLI, NOT serve (§9.3.7). | `deferred_tools/exit_plan_mode.py` (TUI handler), `v3/endpoints.py:433-437` |
| §2.7 | `exit_plan_mode` is "not a deferred tool" | Same as §2.2 | `exit_plan_mode.py:36`, `v2/endpoints.py:1079` |
| §3.1 | `agent_run_end` lifecycle event can directly mark a plan task complete | `AGENT_RUN_END` includes a coarse `task_status` (`TASK_COMPLETED` or `WAITING_FOR_USER`), but it is not a per-plan-task completion signal | `agent_lifecycle_events_callback.py` |
| §3.5 | RovoDev "explicitly declares task dependencies" in `exit_plan_mode` output | `exit_plan_mode` takes a single `plan: str` — free-form markdown. No structured dependency schema. | `exit_plan_mode.py:6-29` |
| §5.3 | "only `ask_user_questions` uses deferred tools" | Both `ask_user_questions` and `exit_plan_mode` are deferred | `v2/endpoints.py:1078-1079` |
| §6.1 | Fix only in `rovo/config.js` | Plan mode prompt also exists in `agent_modes.py` `MODE_CONFIGS[AgentMode.PLAN]` — both layers need fixing | `agent_modes.py:49-71` |
| §6.2 | "forbid `invoke_subagents` when `enableDeepPlan` is true" | Should be: when **plan mode** (`agent_mode="plan"`) is active | `agent_modes.py`, `agent_definition.py:131` |
| §6.7 | "Under `enableDeepPlan`" causes invoke_subagents issue | Issue occurs under **plan mode** (`agent_mode="plan"`), not `enableDeepPlan` | `agent_modes.py`, `agent_definition.py:131` |
| §8 Phase 1 #12 | "Make `exit_plan_mode` non-deferred" | Already deferred by design; making it non-deferred would break approval flow | `exit_plan_mode.py:35-36` |
| §2.7 | "Build" CTA "switches the agent from plan mode to default mode" | Mode switch does NOT happen in serve mode — only in TUI/CLI handlers. Frontend must call `PUT /agent-mode` manually. | `v3/endpoints.py:433-437`, `deferred_tools/exit_plan_mode.py:62-64` |
| §6.2 | GenUI is a RovoDev serve mechanism | GenUI does not exist in RovoDev serve or code-nemo. It's a frontend post-processing construct. | No `genui`/`gen_ui` references in serve or nemo codebase |
| §9.2 (original) | Paraphrased plan mode instructions | Replaced with exact `MODE_CONFIGS[AgentMode.PLAN].instructions` text. Instructions do NOT mention `invoke_subagents` or `get_skill`. | `agent_modes.py:49-71` |
| §9.3.8 (original) | `exit_plan_mode` can be called multiple times or alongside `ask_user_questions` | Impossible: `CallDeferred` is a pydantic-ai exception that immediately terminates the turn. | `pydantic_ai.CallDeferred` semantics |

### 9.2 How plan mode actually works in RovoDev serve

Based on codebase analysis:

1. **Activation:** Frontend calls `PUT /v2/agent-mode` (or `/v3/agent-mode`)
   with `SetAgentModeRequest(mode="plan")`. This sets
   `agent_def.deps.agent_mode = "plan"`.

2. **Prompt injection:** `AgentModeCallback.on_model_request_start()` injects
   the plan mode instructions as a `<system-reminder>` UserPromptPart before
   the first user prompt in every model request. The exact instructions are:
   ```
   You are in plan mode. Your goal is to create a concise implementation
   plan before making any code changes.

   WORKFLOW:
   1. Do quick exploration of the codebase using readonly tools to
      understand the context
   2. Ask clarifying questions using the ask_user_questions tool based
      on what you learned
   3. Think through the plan and call exit_plan_mode with your concise
      markdown plan
   4. If the user approves, you will switch to default mode
   5. After approval, IMMEDIATELY create a todolist with update_todo
      tool to track implementation
   6. Then begin implementing the changes
   IMPORTANT:
   - Keep your plan CONCISE - focus on what needs to change, not
     lengthy explanations
   - DO NOT use any file editing, creation, deletion, or command
     execution tools
   - The user will approve/decline your plan after you call
     exit_plan_mode
   - If declined, revise the plan based on their feedback
   - After approval, always create a todolist before starting
     implementation
   ```
   **Notable omissions:** The instructions do NOT mention
   `invoke_subagents` or `get_skill` — neither is forbidden nor
   encouraged. The "DO NOT use" restriction only covers file editing,
   creation, deletion, and command execution tools.

3. **Tool restriction:** `AgentModeCallback.on_call_tools_start()` sets
   `filesystem_server.readonly_enabled = True`, blocking file writes. It
   also permits some **safe readonly bash commands** by leaving auto-allowed
   command tool calls enabled, including readonly git inspection commands.
   BUT this enforcement only applies to the `filesystem-tools` MCP server —
   other tools like `invoke_subagents` remain unrestricted.

4. **Deferred tools:** Both `ask_user_questions` and `exit_plan_mode` raise
   `CallDeferred()`. In serve mode, they are disabled unless
   `enable_deferred_tools=True` is passed to the `stream_chat` endpoint.
   The frontend must pass this flag for plan mode to work.

5. **Tool gating in serve:** The `_chat` method in `v2/endpoints.py`
   (lines 1075-1080) dynamically enables/disables:
   - `create_technical_plan` → controlled by `request.enable_deep_plan`
   - `ask_user_questions` → controlled by `enable_deferred_tools`
   - `exit_plan_mode` → controlled by `enable_deferred_tools`

### 9.3 New risks identified

#### 9.3.1 `enable_deferred_tools` not forwarded on resume — HIGH RISK

When the frontend resumes a deferred tool call (e.g., user answers a
question card), the resume is sent as a `DeferredToolResponse` in the
`ChatRequest.message` field. The `enable_deferred_tools` flag is a query
parameter on `stream_chat`, NOT part of `ChatRequest`. If the frontend
doesn't pass `enable_deferred_tools=True` on the resume call, both
`ask_user_questions` and `exit_plan_mode` will be disabled for the
continuation turn — the agent literally cannot call `exit_plan_mode` after
Q&A.

**Verified detail:** The `disabled_tools` mutation logic in V2's `_chat`
method (lines 1075-1080) runs **unconditionally** — including when the
message is a `DeferredToolResponse`. This means:
- If `enable_deferred_tools=False` on a resume call, `exit_plan_mode` and
  `ask_user_questions` get added to `disabled_tools`
- Pydantic-ai resumes the agent turn with these tools disabled
- The agent cannot produce a plan card or ask follow-up questions
- The agent falls back to plain text output instead

**This is very likely a contributing root cause for Finding #2 (wrong widget
type after Q&A).** The fix is either: (a) frontend always passes
`enable_deferred_tools=True` on resume calls, or (b) the `_chat` method
skips the disabled_tools mutation when processing a `DeferredToolResponse`.

#### 9.3.2 Agent mode is session-scoped, so resume must stay on the same serve session

`agent_mode` is set on `agent_def.deps`, which persists across turns within
the same serve session. If the frontend sets agent mode via
`PUT /agent-mode` and then resumes a deferred tool on that same session,
the mode should still be preserved. The real risk is session routing:
if a multi-port orchestrator resumes on a different serve instance or
session, the previously set mode will not be there. Verify the frontend
keeps all plan-session traffic pinned to the same serve session and sends
`enable_deferred_tools=True` on every `stream_chat` call during that
plan session, not just the first.

#### 9.3.3 `get_skill` tool also unrestricted in plan mode

Like `invoke_subagents`, the `get_skill` tool (Nemo Core layer) is not
restricted by plan mode. If skills are configured, the agent could load a
skill and follow its instructions instead of calling `exit_plan_mode`.
Lower risk than `invoke_subagents` but worth noting. For this feature, do
not hard-code any requirement to use or avoid specific skills; leave skill
selection to RovoDev serve unless it proves to interfere with the approval
flow in practice.

#### 9.3.4 Plan mode does not disable `update_todo` when that tool is enabled

The plan mode instructions say to use `update_todo` *after* approval (step
5), but `update_todo` is in the `_always_allowed_tools` list and is not
disabled during plan mode. However, the tool is only registered when
RovoDev's todolist feature is enabled in agent setup; it is not guaranteed
to exist in every serve deployment. When it is registered, the agent could
still call it prematurely. Low severity since the prompt is clear, but no
hard guardrail exists.

#### 9.3.5 V2 `/chat` endpoint cannot support plan mode

The v2 `/chat` endpoint hardcodes `enable_deferred_tools=False` (line 865
in v2/endpoints.py). Both `ask_user_questions` and `exit_plan_mode` are
disabled. **Plan mode is impossible via v2 `/chat`.**

V3's `/stream_chat` endpoint accepts `enable_deferred_tools` as a query
parameter, but it also **defaults to `False`** (line 131 in
v3/endpoints.py). The frontend MUST explicitly pass
`enable_deferred_tools=true` on **every** `stream_chat` call — including
resume calls after `DeferredToolResponse`. If omitted even once, deferred
tools get disabled and the plan workflow breaks.

#### 9.3.6 `exit_plan_mode` lacks structured task/dependency schema

The `exit_plan_mode` tool accepts `plan: str` — free-form markdown. The
spec assumes tasks and dependencies can be extracted from this markdown via
`extractPlanWidgetPayloadFromText()`. This creates two risks:
1. **Fragile parsing:** Task extraction depends on RovoDev producing
   consistently structured markdown, which varies by model.
2. **No dependency validation:** Dependencies declared in prose ("Task 3
   depends on Task 1") may be unparseable or inconsistent.

For Phase 3 (parallel execution), consider extending `exit_plan_mode` to
accept structured args like `tasks: list[{name, description, depends_on}]`
in addition to the markdown plan.

#### 9.3.7 `exit_plan_mode` mode switch happens in TUI/CLI handler, not serve

**Verified:** When `exit_plan_mode` is resumed with approval, the mode
switch from PLAN to DEFAULT happens in the handler, NOT in pydantic-ai or
the serve layer:
- **TUI** (`deferred_tools/exit_plan_mode.py` lines 62-64): sets both
  `app.agent_mode` and `app.agent_def.deps.agent_mode` to `DEFAULT`
- **CLI** (`commands/run/command.py` `_handle_deferred_tools`): also
  switches mode on approval
- **Serve** (`v3/endpoints.py` `set_chat_message` lines 433-437): does
  **nothing** — it only stores the `DeferredToolResults` and returns. No
  mode switch occurs.

This means **in serve mode, after "Build" approval, the agent continues in
plan mode.** The next `stream_chat` call will still have `agent_mode =
"plan"` — the plan mode prompt will be injected, filesystem tools stay
read-only, and the agent will try to produce another plan instead of
implementing.

**The frontend MUST call `PUT /agent-mode` with `mode: "default"` after
the user clicks "Build" and before the next `stream_chat` call.** This is
not optional — without it, plan execution is impossible.

#### 9.3.8 No enforcement that `exit_plan_mode` is called per turn

The plan mode prompt says "call exit_plan_mode with your concise markdown
plan" but nothing prevents the agent from **never calling it** (producing
only text or calling `invoke_subagents` instead).

> **⚠️ SELF-CORRECTION:** The original version of this section claimed the
> agent could call `exit_plan_mode` multiple times or alongside
> `ask_user_questions` in the same turn. This is **wrong**: `CallDeferred`
> is a pydantic-ai exception that immediately terminates the agent's turn.
> Once either `exit_plan_mode` or `ask_user_questions` raises
> `CallDeferred()`, no further tool calls can execute in that turn. They
> are mutually exclusive within a single turn.
>
> The actual risk is:
> - Agent calls `invoke_subagents` (which does NOT raise `CallDeferred`)
>   and then produces text without ever reaching `exit_plan_mode`
> - Agent produces only text output without calling any deferred tools
> - Agent calls `ask_user_questions` when it should have called
>   `exit_plan_mode` (or vice versa)

A `prepare` function could enforce that `exit_plan_mode` must be called
(not just may be called), or the plan mode callback could detect turns
that end without a deferred tool call and inject a reminder.

### 9.4 Recommendations

**API integration (critical — without these, plan mode cannot work):**

1. **Frontend must use v3 API** — v2 `/chat` hardcodes
   `enable_deferred_tools=False` and cannot support plan mode (§9.3.5).

2. **Frontend must call two APIs for plan mode:** `PUT /agent-mode` with
   `mode: "plan"` AND pass `enable_deferred_tools=True` on every
   `stream_chat` call (including resume calls). Do not wire
   `enable_deep_plan` / `create_technical_plan` into this feature for now
   (§2.1 correction).

3. **Frontend resume calls must forward `enable_deferred_tools=True`** —
   without this, the agent cannot call `exit_plan_mode` on the continuation
   turn after Q&A, which may explain Finding #2 (§9.3.1).

4. **Plan toggle OFF must:** (a) call `PUT /agent-mode` with
   `mode: "default"` to reset agent mode, and (b) call `/cancel` to
   cancel pending deferred tools. In a multi-port orchestrator, wait for
   cancel to complete so the serve slot or port becomes reusable
   (§6.8, §9.3.7).

5. **After "Build" approval, frontend must switch agent mode** to
   `"default"` via `PUT /agent-mode` — the mode switch is not automatic
   in serve mode (§9.3.7).

**Tool policy (important — prevents agent misbehavior):**

6. **Require `exit_plan_mode` as the plan-mode handoff** for build-oriented
   requests. `invoke_subagents` belongs in the post-approval build phase,
   not as a replacement for plan approval.

7. **Strengthen plan mode prompt** in `agent_modes.py` — add constraints
   like "If you need clarification, ask before presenting the plan" and
   "For build-oriented requests, always finish plan mode by calling
   `exit_plan_mode` before implementation begins." Do not hard-code any
   requirement to use or forbid specific skills (§6.1, §9.3.3).

**Architecture (for Phase 2+):**

8. **Extend `exit_plan_mode` schema** to support structured task output
   with explicit dependency fields, rather than relying on markdown parsing
   for dependency graphs (§9.3.6).

9. **Document that this feature uses `agent_mode="plan"` only** and parks
   `enable_deep_plan` / `create_technical_plan` for future consideration.

10. **Consider adding enforcement** that `exit_plan_mode` is called per
    turn when in plan mode — e.g., detect turns that end without a deferred
    tool call and inject a reminder. Note: `CallDeferred` already prevents
    multiple deferred tools per turn (§9.3.8).

### 9.5 Key files (RovoDev serve codebase)

| File | Role |
|------|------|
| `packages/cli-rovodev/src/rovodev/modules/tools/exit_plan_mode.py` | `exit_plan_mode` tool — validates plan mode, raises `CallDeferred()` |
| `packages/cli-rovodev/src/rovodev/modules/agent_modes.py` | `AgentMode` enum, `MODE_CONFIGS` with plan mode instructions, `AgentModeCallback` |
| `packages/cli-rovodev/src/rovodev/commands/serve/common/models.py` | `ChatRequest`, `SetAgentModeRequest` |
| `packages/cli-rovodev/src/rovodev/commands/serve/v2/endpoints.py` | V2 serve endpoints, deferred tool gating (lines 1075-1080) |
| `packages/cli-rovodev/src/rovodev/commands/serve/v3/endpoints.py` | V3 serve endpoints, `stream_chat` with `enable_deferred_tools` param |
| `packages/code-nemo/src/nemo/core/agent_definition.py` | `invoke_subagents` tool registration and implementation |
| `packages/cli-rovodev/src/rovodev/modules/tool_permission_resolver.py` | `_always_allowed_tools` list (includes `exit_plan_mode`) |
| `ROVODEV_SERVE_TOOLS.md` | Complete tool inventory for `rovodev serve` |
