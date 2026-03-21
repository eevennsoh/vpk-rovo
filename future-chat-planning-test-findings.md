# Future Chat Planning Feature Spec

> This document combines browser test findings (March 21, 2026) with a full
> feature specification derived from a detailed interview session.

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

Both paths merge into `resolvedPlanModeActive = true`, which flows to RovoDev
as `enableDeepPlan: true`.

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
enableDeepPlan: true sent to RovoDev
       |
       v
RovoDev decides: ask questions first? (agent discretion)
       |
      / \
     /   \
    v     v
ask_user_questions     exit_plan_mode
(deferred tool)        (non-deferred, ends RovoDev turn)
    |                       |
    v                       v
Question card           Plan widget (Plan tab + Tasks tab)
renders in chat         with "Build" CTA button on the card
    |                       |
    v                       v
User answers            User clicks "Build"
    |                       |
    v                       v
Resume deferred         Backend begins task execution loop
tool call               Agent progress component appears
    |                   (sticky above composer)
    v                       |
RovoDev calls               v
exit_plan_mode          Tasks execute sequentially/parallel
    |                   Artifacts stream to artifact panel
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

### 2.4 "Skip" action semantics

The "Skip" button on question cards **cancels the deferred tool call and
returns to normal chat**. It does not send a response to RovoDev; it
terminates the planning flow entirely.

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
The `update_todo` tool is used only during execution for progress tracking.

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
- `exit_plan_mode` is **not a deferred tool** — it completes RovoDev's turn
  and emits the plan card. The "Build" CTA on the plan card triggers
  execution as a new backend action (not a deferred tool resume).

---

## 3. Plan Execution

### 3.1 Orchestration model: backend loop + update_todo

After the user clicks "Build" on a plan card:

1. Backend marks the plan as accepted in `planSession`.
2. Backend resolves the plan's task dependency graph.
3. Backend sends the first eligible task (no unresolved dependencies) to
   RovoDev as a new message.
4. RovoDev executes the task, calling `update_todo` to signal completion.
5. Backend receives `agent_run_end` lifecycle event with
   `task_status: "TASK_COMPLETED"`.
6. Backend marks the task as done and sends the next eligible task(s).
7. Repeat until all tasks complete or a failure halts execution.

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

Dependencies are **agent-defined**: RovoDev explicitly declares task
dependencies in the `exit_plan_mode` output (e.g., "Task 3 depends on
Task 1, 2"). The backend parses these into a dependency graph used for
execution ordering and parallel distribution.

### 3.6 Mid-execution task addition

**Deferred to future version.** V1 does not support adding tasks to a
running plan. Users must stop the plan and create a new one.

---

## 4. Artifacts

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

Note: only `ask_user_questions` uses deferred tools. `exit_plan_mode` is
not deferred — it completes the RovoDev turn and emits the plan card. The
"Build" CTA on plan cards is always interactive (unless disabled by a newer
plan or an accepted plan).

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
The `REQUEST_USER_INPUT_INSTRUCTION` in `rovo/config.js` says to use
`ask_user_questions` when clarification is needed, but does not strongly
tie it to the planning flow specifically.

**Fix:**
- Update `rovo/config.js` to include a planning-specific instruction: when
  `enableDeepPlan` is active and the user's request is ambiguous or complex,
  RovoDev SHOULD call `ask_user_questions` before `exit_plan_mode`. However,
  this remains agent discretion — if the prompt is sufficiently specific,
  RovoDev may skip directly to `exit_plan_mode`.
- The key constraint is: RovoDev must NEVER call `ask_user_questions` AFTER
  `exit_plan_mode` in the same turn. If a plan has been generated, further
  iteration happens through subsequent chat messages with Plan toggle on.

### 6.2 Wrong widget type after Q&A (Finding #2) — P0

**Problem:** After Q&A, RovoDev generates a GenUI spec card instead of
calling `exit_plan_mode`. No plan card with "Build" CTA appears.

**Root cause:** Two contributing factors:
1. `resolvedPlanModeActive` is not forwarded on the deferred tool resume
   turn, so GenUI eligibility is not blocked.
2. RovoDev's prompt does not strongly enforce `exit_plan_mode` as the
   required tool for plan output during planning sessions.

**Fix:**
- Implement thread-level `planSession` state (Section 5.1) so
  `resolvedPlanModeActive` persists across resume turns.
- Hard-block GenUI on resume turns when `planSession.isActive` (Section 5.2).
- Update `rovo/config.js` to instruct: "When in plan mode, you MUST present
  plans using `exit_plan_mode`. Never generate plan content as free-form
  text or GenUI cards."

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

**Fix:**
- Investigate the data part format emitted by `emitRequestUserInputQuestionCard()`
  on resume turns vs initial turns. Ensure the widget payload structure
  matches what `selectLatestRenderableWidgetPart()` in
  `thread-message-root.tsx` expects.
- Add a timeout fallback: if the widget loading indicator persists for > 30
  seconds without a renderable payload, show an error state with a retry
  option rather than hanging indefinitely.

### 6.4 RovoDev port stuck error (Finding #4) — P2

**Problem:** Intermittent "RovoDev port is stuck" error blocks any
continuation flow.

**Root cause:** The `retryChatInProgress` mechanism in `rovodev-gateway.js`
times out (10s retry window with 250ms->1s exponential backoff) when the
RovoDev session is slow or unresponsive.

**Fix:**
- Investigate port acquisition and session cleanup in `rovodev-gateway.js`.
- Consider increasing the retry window for deferred tool resumes (which
  are expected to be slower due to context restoration).
- Ensure `cancelChat()` reliably interrupts stuck sessions.
- Surface better error messaging to the user with a retry action.

### 6.5 Infinite re-render crash (Finding #5) — P3

**Problem:** React "Maximum update depth exceeded" error after Q&A
submission.

**Status:** Not reproduced in validation round 2. Monitor for recurrence.
No active fix planned unless it reproduces consistently.

---

## 7. Key Files

| File | Role |
| --- | --- |
| `backend/server.js` | Chat endpoint, plan mode resolution, deferred tool handling, task execution orchestration |
| `backend/lib/rovodev-client.js` | Normalizes `enableDeepPlan`, communicates with RovoDev Serve |
| `backend/lib/rovodev-gateway.js` | Port management, retry logic, session lifecycle |
| `backend/lib/plan-mode-complexity-heuristic.js` | Auto-plan scoring heuristic |
| `backend/lib/genui-post-tool-eligibility.js` | GenUI blocking logic (must respect plan session state) |
| `backend/lib/ask-user-questions-adapter.js` | Adapts question card answers to RovoDev tool contract |
| `rovo/config.js` | System prompt instructions for `ask_user_questions`, planning behavior |
| `components/projects/future-chat/hooks/use-future-chat.ts` | Frontend plan mode toggle state, submission logic |
| `components/projects/shared/lib/question-card-widget.ts` | Question card data structures |
| `components/projects/shared/lib/plan-widget.ts` | Plan widget data structures |
| `components/projects/shared/thread-message/thread-message-root.tsx` | Widget rendering, `selectLatestRenderableWidgetPart()` |
| `components/blocks/agent-progress/page.tsx` | Agent progress component (reuse for plan execution tracking) |
| `lib/rovo-ui-messages.ts` | UI message types and data parts |

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
6. Fix "Skip" on question cards to cancel deferred tool call and return to
   normal chat.
7. Disable older plan card CTAs (gray + tooltip) when a newer plan exists.
8. Remove separate approval card rendering — plan card "Build" CTA is the
   sole acceptance mechanism.
9. Make `exit_plan_mode` non-deferred: it completes RovoDev's turn and
   emits the plan card directly.

### Phase 2: Plan execution orchestration

1. Build backend task execution loop (sequential with dependency graph).
2. Integrate RovoDev's `update_todo` tool for task completion signaling.
3. Listen to `agent_lifecycle_events` SSE for `agent_run_end`.
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
3. Continue-planning widget stall (P1)
4. RovoDev port stuck (P2)
5. Infinite re-render crash (P3)
