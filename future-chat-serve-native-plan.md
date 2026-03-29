# Future Chat: Serve-native exit_plan_mode with simple in-chat accept, revise, and reject

## Summary

Replace Future Chat's custom plan-approval/build orchestration with the actual RovoDev Serve
deferred-tool contract for exit_plan_mode.

The user-facing behavior becomes:

- Build on the pending plan card = accept the plan.
- Typing a normal chat reply while the pending plan is still active and the Plan toggle is on
  = revise the plan.
- Turning the Plan toggle off does not reject immediately.
- Turning the Plan toggle off and then submitting the next prompt while that pending plan is
  still active = reject that plan review and send the new prompt in default mode.
- No make grid, no artifact-panel building state, no Future Chat make-run kickoff from Build.
  Execution stays in the same chat window.

## Behavior Spec

### Pending plan definition

A plan is considered the active pending review only when all of these are true:

- It is the latest visible assistant plan widget.
- Its payload has deferredToolCallId.
- There is no later user message after the assistant message that emitted it.

This replaces the current Future Chat approval-state logic for Build enablement.

### Build button

When the active pending plan exists and the user clicks Build:

- Append a lightweight visible local user message: Accepted the plan.
- Send a Serve-native deferred tool result:
    - { tool_call_id: <deferredToolCallId>, result: "Accept." }
- Send the turn with isPlanMode: false.
- Do not send approval.
- Do not call /api/agent-mode.
- Do not create a make run.
- Do not open the build grid.
- Let the assistant continue in the same chat transcript.

### Free-text reply while pending plan exists

When the active pending plan exists, the composer submits non-empty text, and the Plan toggle
is still on:

- Treat the text as exit_plan_mode feedback.
- Append the real user message normally.
- Send a Serve-native deferred tool result:
    - { tool_call_id: <deferredToolCallId>, result: <submitted text> }
- Send the turn with isPlanMode: true.
- Do not treat that text as a brand-new execution prompt.

### Toggle Plan off, then send prompt

When the active pending plan exists and the user turns Plan off:

- Do not reject immediately.
- Do not call /api/agent-mode yet.
- Keep the plan card pending.
- Record a local UI override that the next submitted prompt should be treated as default-mode
  rejection/new work.

When the next prompt is submitted while that override is active:

- Cancel the specific pending deferred tool by toolCallId.
- Clear the local pending-plan override.
- Clear the local/backend Future Chat plan session.
- Set backend agent mode to default.
- Send the new prompt as a normal default-mode prompt.
- Do not feed that prompt back as plan feedback.

If the user turns Plan back on before submitting, cancel the override and keep the pending
plan review live.

### Toggle behavior outside a pending plan

When there is no active pending plan review:

- Keep the current explicit Plan toggle behavior.
- The toggle continues to talk to /api/agent-mode normally.

## Implementation

### Frontend: Future Chat hook and composer flow

Update use-future-chat.ts:

- Add a helper that resolves the latest pending plan review from rovodevMessagesRef.current.
- Add a local override state/ref for pending-plan toggle intent so UI can show Plan off
  without immediately mutating backend mode.
- Intercept submitPrompt before queueing or normal send logic:
    - pending plan + Plan on => send deferred feedback result
    - pending plan + Plan off => cancel deferred tool, switch backend to default, then send
      normal prompt
    - no pending plan => existing flow
- Replace submitPlanApproval(...) usage in Future Chat with a direct accept handler that
  sends DeferredToolResponse("Accept.").
- Remove Future Chat's make-run/build-session kickoff from Build.

Update future-chat-shell.tsx:

- Keep handleBuildPlan, but make it call the new accept handler only.
- Keep the Plan toggle wiring, but let pending-plan behavior use the new local override
  semantics.

Update future-chat-messages.tsx and plan-widget.ts:

- Replace getPlanApprovalState-based Build enablement with "latest visible pending plan
  widget" logic.
- Disable Build on stale plans once any later user message exists.

### Backend: exit_plan_mode deferred response handling

Update backend/server.js:

- Stop treating exit_plan_mode as the current custom Future Chat approval flow.
- For exit_plan_mode, render the plan card from the real deferred-tool request event only.
- Remove the Future Chat approvalSubmission continuation path from the Build acceptance flow.
- Add explicit handling for string-valued rawDeferredToolResponse.result when the tool call
  belongs to plan-approval:
    - "Accept." => clear the Future Chat plan session and do not restore plan mode on resume
    - any other non-empty string => keep/restore plan mode so the planner revises the plan
- Do not force resolvedPlanModeActive=true for accepted exit_plan_mode continuations.

### Backend: targeted deferred-tool cancel endpoint

Implement the missing backend route for the existing frontend proxy:

- POST /api/future-chat/cancel-deferred-tool

Behavior:

- Accept { toolCallId: string }
- Call clearPausedRovoDevToolCall(toolCallId, { cancel: true })
- If the cancelled tool was the active Future Chat plan review, clear that thread's plan
  session too
- Return success/failure JSON

This endpoint is required for:

- question-card dismissal consistency
- the new "toggle off + next prompt = reject plan" branch

### Remove Future Chat build-grid state

Update future-chat-types.ts:

- Change FutureChatPanelState from "closed" | "building" | "preview" to "closed" | "preview".

Remove Future Chat-only build-grid plumbing from:

- use-future-chat.ts
- future-chat-shell.tsx

Specifically remove:

- FutureChatBuildSession usage
- FutureChatBuildTask usage
- make-run creation/subscription from Build
- MakeGridSurface rendering in Future Chat
- building -> preview transition logic

Do not change the separate Make project flow.

## Public API / Interface Changes

- Future Chat Build acceptance stops sending approval and sends only deferredToolResponse.
- Add backend endpoint:
    - POST /api/future-chat/cancel-deferred-tool
- Type changes in future-chat-types.ts:
    - FutureChatPanelState = "closed" | "preview"
    - remove FutureChatBuildTask
    - remove FutureChatBuildSession

## Tests

Add or update tests for these cases:

- Clicking Build sends { tool_call_id, result: "Accept." }, does not send approval, does not
  call make-run APIs, and does not open building.
- Pending plan + Plan on + typed prompt sends deferred feedback result and keeps plan mode.
- Pending plan + Plan off + typed prompt cancels the deferred tool, switches backend mode to
  default, and sends a normal prompt.
- Pending plan + Plan off only does not cancel immediately.
- Pending plan + Plan off + toggle back on restores revise behavior for the next prompt.
- Old plan cards become non-buildable after any later user message.
- Accepted exit_plan_mode continuations do not restore resolvedPlanModeActive.
- /api/future-chat/cancel-deferred-tool cancels the paused tool and clears plan-session state
  when appropriate.

Validation:

- pnpm run lint
- pnpm tsc --noEmit
- targeted tests around backend/server.js, plan-widget.ts, and Future Chat hook behavior
- one browser check of all three user paths: accept, revise, reject

## Assumptions and Defaults

- Turning Plan off during a pending plan review is only a local intent change until the next
  submit.
- Build always wins over the toggle state and always means accept.
- Free-text plan feedback is text-only while a plan review is pending. Attached files are not
  part of exit_plan_mode feedback.
- Future Chat keeps a short visible local user message Accepted the plan. on Build accept so
  the existing useChat transcript flow stays stable.
- The Make project and any shared approval UI used elsewhere are out of scope unless they
  break from these Future Chat-specific changes.
