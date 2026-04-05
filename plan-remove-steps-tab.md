# Plan: Remove Steps Tab — Rely on `update_todo` During Build Execution

## Goal
Remove the pre-parsed "Steps" tab from the plan card UI. The plan card should only show the **Summary** (markdown content from `exit_plan_mode`). No tasks are extracted or displayed before the user clicks **Build**. After Build, RovoDev Serve is fully autonomous — it decides its own `update_todo` breakdown at runtime. The agent should never pre-seed `update_todo` from plan tasks, either before or after `exit_plan_mode`.

## Key Insight
Currently there are two problems:
1. Tasks are extracted from `exit_plan_mode` markdown and displayed in a "Steps" tab — this is redundant with the summary and fragile.
2. System prompts mandate calling `update_todo` either before `exit_plan_mode` (make mode) or immediately after Build approval (rovo-app rule 5a) to seed a checklist from the plan tasks — this is prescriptive and unnecessary.

The fix: `exit_plan_mode` produces a markdown-only plan. No task extraction, no pre-seeded `update_todo`. After Build, RovoDev Serve decides how to decompose and track work.

---

## Changes

### 1. `components/ui-ai/plan.tsx` — Remove tabs, show summary only
- Replace `PlanTabContent` internals: remove `Tabs`/`TabsList`/`TabsTrigger`/`TabsContent` wrapper. Render only the `PlanSummary` directly (no tabs UI).
- Keep `PlanTabContentProps` interface but make `tasks` optional/deprecated (or remove it) so existing callers don't break immediately.
- `PlanTaskList`, `PlanTaskItem`, `PlanAgentBar` components can remain exported (used by execution tracker) but are no longer used by `PlanTabContent`.

### 2. `components/projects/shared/components/plan-widget-inline-card.tsx`
- Remove the early return `if (!title.trim() || visibleTasks.length === 0) return null` — a plan with 0 tasks should now render (it has markdown/summary). Keep the `!title.trim()` guard.
- Remove `visibleTasks`, `streamRevealCount`, `revealedCount` logic related to task streaming animation.
- Stop passing `tasks`/`taskDisplayLabels`/`revealedCount` to `PlanTabContent`.

### 3. `components/projects/shared/lib/plan-widget.ts`
- In `parsePlanWidgetPayload()`: make `tasks` default to `[]` instead of returning `null` when no tasks found. A plan widget with 0 tasks but valid title/markdown is now valid.
- In `isPlanCardBuildable()`: remove the task-count-based equality check for "is latest plan" — compare by title + markdown or deferredToolCallId instead.

### 4. `components/projects/shared/lib/plan-approval.ts`
- `planWidgetRequiresApproval()`: remove `planWidget.tasks.length > 0` check — approval is based on `deferredToolCallId` presence (already checked first).
- `createPlanApprovalSubmission()`: set `planTasks: []` always (or remove the field). The backend/RovoDev Serve shouldn't rely on pre-parsed tasks in the approval payload.
- `extractTaskInfo()`: can be removed or kept as dead code cleanup.

### 5. `backend/lib/plan-widget-fallback.js`
- **Keep task extraction logic as-is** — do not remove or stub it out. The frontend simply stops consuming the `tasks` field from the parsed payload.
- Rationale: the RovoDev Serve backend (`endpoints.py`) is a passive pass-through — it emits `exit_plan_mode` args as a raw `deferred-request` SSE event with no task awareness. Task parsing is purely a JS-layer concern, and other consumers (e.g. `update-todo-plan-payload.js`) may still reference the extracted `tasks` field. Removing parsing here risks breaking those consumers silently.

### 6. `components/projects/rovo-app/lib/rovo-app-plan-execution-tracker.ts`
- `mergeTodoItemsWithPlanTasks()`: when `planTasks` is empty (which it now always will be for new plans), just return the snapshot items directly — no merge needed.
- `resolveRovoAppPlanExecutionTracker()`: handle `acceptedPlanWidget.tasks` being empty gracefully — derive `taskCount` and `taskStatusGroups` purely from `update_todo` snapshot.
- ⚠️ **Risk**: audit this function carefully for any implicit guard like `if (planTasks.length === 0) return early` that could short-circuit execution tracking before `update_todo` items arrive. The tracker must remain active and wait for `update_todo` snapshots even when `planTasks` is empty.

### 7. `components/projects/rovo-app/lib/rovo-app-plan-task-labels.ts`
- `buildRovoAppPlanTaskDisplayLabels()` and `resolveRovoAppPlanTaskDisplayLabels()`: when `planTasks` is empty, return labels from snapshot items only.

### 8. `components/projects/shared/thread-message/lib/plan-description-fallback.ts`
- Remove mermaid graph generation from `planPayload.tasks` (line 23-24) since tasks will be empty.
- ⚠️ **Note**: check whether this affects session restore / conversation buffer replay — if the mermaid graph is reconstructed from persisted plan data during replay, removing it here will silently produce no graph for older sessions too. Acceptable if mermaid-from-tasks was already considered cosmetic.

### 9. `components/projects/make/components/plan-preview-modal.tsx`
- Update `PlanTabContent` usage to not pass tasks (or pass `[]`).

### 10. `components/website/demos/ui-ai/plan-demo.tsx`
- Update demo to reflect new summary-only plan card (no tasks tab).

### 11. `rovo/config.js` — Remove rule 5a (mandatory `update_todo` after Build approval)
- **Remove rule 5a entirely**: _"Post-approval task setup: After approval switches you to `default` mode, your FIRST action must be calling `update_todo` to create a structured checklist from the plan tasks..."_
- The agent should no longer be instructed to pre-seed `update_todo` from plan tasks after Build. RovoDev Serve decides autonomously how to decompose and track work during execution.
- Rule 5 ("Implementation happens after approval") stays — the mode switch to `default` is still correct.

### 12. `components/projects/make/lib/make-mode.ts` — Remove `update_todo`-before-`exit_plan_mode` instructions
- Remove all instances of these patterns across all make mode prompts:
  - _"After generating the plan, call update_todo to organize tasks into a structured checklist."_
  - _"Keep plan mode active until update_todo completes. Do not call exit_plan_mode before update_todo."_
  - _"If update_todo fails, do not retry it repeatedly; continue by returning a concrete plan widget task list."_
  - _"When writing update_todo task content, use strict dependency prefixes..."_
  - _"Return a plan widget with concrete tasks derived from that checklist."_
  - _"Do not finish without generating a plan widget with a concrete task list."_
- Replace with simpler instruction: the agent should generate a plan markdown and call `exit_plan_mode` directly. No `update_todo` call during planning.
- Affects: `MAKE_MODE_CONTEXT_DESCRIPTION`, `MAKE_MODE_POST_CLARIFICATION_CONTEXT_DESCRIPTION`, `MAKE_MODE_RETRY_PROMPT`, `MAKE_INTERVIEW_CONTEXT_DESCRIPTION`, `MAKE_INTERVIEW_FOLLOW_UP_CONTEXT_DESCRIPTION`.

### 14. `components/projects/rovo-app/components/rovo-app-messages.tsx` — Remove `taskDisplayLabels` prop
- Line 1092 passes `taskDisplayLabels={planTaskDisplayLabels}` to `PlanTabContent`. Remove this prop since the Steps tab no longer exists.

### 15. `components/projects/make/components/make-card-widget-inline.tsx` — Handle 0-task rendering
- Lines 39-49: derives `visibleTasks` from `planPayload.tasks`, computes `taskCount`, and early-returns `null` when `visibleTasks.length === 0`.
- Change the early return to only guard on `!title.trim()` (keep title guard, remove task-count guard).
- Remove `visibleTasks`/`taskCount` logic or adapt it so the inline card renders with summary only.

### 16. `components/projects/shared/lib/plan-identity.ts` — Handle 0-task description
- Update `sanitizePlanDescription()` or `formatPlanStepCount()` to handle `taskCount === 0` gracefully. Currently `formatPlanStepCount(0)` returns `"0 steps"` which is displayed as the plan card subtitle.
- Options:
  - (a) `formatPlanStepCount` returns `""` when count is 0.
  - (b) `sanitizePlanDescription` skips the step-count prefix when `taskCount === 0` and returns just the cleaned description text.
  - (c) Callers (e.g. `plan-widget-inline-card.tsx`) stop passing `visibleTasks.length` and use the description directly.

### 17. Test files — Update task-related assertions
- **`components/projects/shared/lib/plan-widget-buildable.test.js`** — Lines 32-34 compare `planPayload.tasks.length === latestPlan.tasks.length` and `task.id === latestPlan.tasks[index]?.id` to determine if a plan is the "latest". This matches the `isPlanCardBuildable` logic being changed in item #3. Update assertions to use `deferredToolCallId` comparison instead.
- **`components/projects/rovo-app/lib/rovo-app-plan-execution-tracker.test.js`** — Multiple tests assert plan-task-seeded behavior:
  - Line 122: _"falls back to accepted plan tasks while running"_ — update to verify tracker works with empty plan tasks + `update_todo` snapshots only.
  - Line 150: _"preserves exact approved plan labels before update_todo runs"_ — this scenario no longer applies (no pre-approved plan labels). Remove or rewrite.
  - Line 266: _"aliases numeric todo ids to the original plan tasks"_ — update to verify `update_todo` items render directly without aliasing.
  - Line 304: _"prefers exact update_todo labels over plan labels"_ — simplify since there are no plan labels to prefer over.
- **`components/projects/rovo-app/lib/rovo-app-plan-task-labels.test.js`** — Line 84: _"preserves exact approved plan labels before approval"_ — this scenario no longer applies. Update or remove.
- **`backend/lib/plan-widget-fallback.test.js`** — Line 359: _"exit_plan_mode payload has required structure for frontend PlanTabContent (Test Case 6)"_ — the `tasks` field will still exist in the payload (backend parsing unchanged), but the test description references `PlanTabContent` which no longer uses tasks. Update test description. Lines 415, 423 test task IDs and extraction strategies — these still pass since backend parsing is unchanged.

---

## Acra Verification
- ✅ **No blockers in acra**. `exit_plan_mode` handler (`deferred_tools/exit_plan_mode.py`) is a pure markdown pass-through with zero task processing. No callback or middleware enforces `update_todo` ordering.
- ✅ **`update_todo` is not referenced in acra Python code** — it's a VPK-side tool definition. The `TodoListReminderCallback` in acra nudges the agent to use `update_todo` for multi-step tasks, but this is a generic reminder unrelated to plan tasks.
- ⚠️ **Soft prompt in acra**: The plan mode workflow text (in agent system prompts) says _"IMMEDIATELY create a todolist with update_todo tool"_ as step 5 after approval. This is a soft recommendation, not enforced. **No acra code change required** — the VPK-side prompt changes (items #11 and #12) override this since the VPK system prompts take precedence for web GUI sessions. For TUI sessions, the generic reminder is acceptable since RovoDev Serve is autonomous.

---

## What stays the same
- `backend/lib/plan-widget-fallback.js` task parsing logic — keep it (don't delete) for backward compat; just the frontend stops using tasks.
- `backend/lib/update-todo-plan-payload.js` — untouched, this is the execution-time path. ⚠️ **Verify**: confirm this file does not guard on `planTasks.length > 0` before seeding `update_todo` state — if it does, the execution tracker will never receive initial task data and will appear broken until the agent calls `update_todo` itself.
- `update_todo` tool itself — stays available. RovoDev Serve can still call it during execution whenever it chooses. It just won't be pre-seeded from plan tasks.
- The Build button, plan approval flow, and deferred tool response mechanism — all unchanged.
- RovoDev Serve backend (`endpoints.py`) — no changes needed. It is a passive pass-through: `exit_plan_mode` args are emitted as a raw `deferred-request` SSE event, and `update_todo` is emitted as a standard tool-call event. Neither path involves task awareness on the backend.
- acra TUI (`deferred_tools/exit_plan_mode.py`) — zero task parsing, renders raw plan markdown. No changes needed.

## Testing
- `pnpm run lint` and `pnpm tsc --noEmit` must pass.
- Verify `plan-widget-fallback.test.js` still passes (backend extraction unchanged).
- Verify plan card renders with summary only (no tabs).
- Verify plan card renders even with 0 pre-parsed tasks.
- Verify plan card subtitle does NOT show "0 steps".
- Verify execution tracker works from `update_todo` alone (no pre-seeded tasks).
- Verify `update-todo-plan-payload.js` does not short-circuit when `planTasks` is empty — execution tracking must still activate and pick up `update_todo` snapshots.
- Verify session restore / replay still renders correctly for older sessions that had pre-parsed tasks (mermaid graph absence is acceptable).
- Verify make mode: agent calls `exit_plan_mode` directly without `update_todo` first. Plan card renders with summary only.
- Verify rovo-app: after Build approval, agent does NOT pre-seed `update_todo` — RovoDev Serve decides autonomously.
