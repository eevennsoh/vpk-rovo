# Plan: Make the Task toggle always local and per-message

## Context

The Task or Plan toggle in Rovo App needs to be toggleable at all times,
including while a run is streaming, waiting on clarification, or sitting behind
queued follow-ups. The toggle itself must not talk to the backend, cancel the
current run, or change the behavior of any already-submitted prompt.

The actual rule is simpler than the current implementation:

1. Before the user submits a prompt, the toggle is only local UI state.
2. When the user submits a prompt, the app snapshots the current mode for that
   specific message.
3. If the prompt is queued, the queued item stores both the prompt and the
   snapped mode.
4. Once a message is submitted or queued, later toggle changes do not affect
   that message.

This is not just a button-enablement change. It changes the prompt-dispatch
model, the queue contract, and the way pending plan review currently hijacks
the next typed prompt.

## Required behavior

The implementation must follow these rules.

1. The Task toggle is always clickable.
2. Toggling never calls `/api/agent-mode`.
3. Toggling never cancels the current run.
4. Toggling never clears `planningSession`.
5. Every submitted user prompt carries an explicit mode snapshot of
   `"default"` or `"plan"`.
6. Every queued prompt carries the same explicit mode snapshot.
7. If a deferred question card or deferred plan approval card is active, queued
   prompts stay queued until the user resolves that card.
8. When the user resolves a deferred question card or plan approval card, that
   continuation runs immediately and still blocks the queue until RovoDev is
   actually free.
9. Queue release is based on RovoDev being free, not on the toggle state.

## Core design

The toggle becomes a local composer preference, while mode at execution time
becomes a property of the message being dispatched.

That means Rovo App needs two different concepts:

- `isPlanMode`: the current local composer toggle state
- `mode` on a submitted or queued prompt: the snapped mode for that prompt

The snapped prompt mode becomes the only mode value that matters once a prompt
has been submitted.

## Data model changes

The queue and local transcript need to remember mode explicitly.

1. Add `mode: "default" | "plan"` to `RovoAppQueuedPromptAction` in
   `lib/rovo-app-types.ts`.
2. Add a message-level metadata field for submitted mode in
   `lib/rovo-ui-messages.ts`. The exact property name can be
   `submittedMode` or `promptMode`, but it must be stable and explicit.
3. Pass that metadata when appending the optimistic local user message so each
   message can be inspected later without consulting current toggle state.

## Frontend state changes

The local toggle must stop syncing from backend mode.

1. Make `togglePlanMode` a pure local state flip.
2. Remove the current `togglePlanMode` behaviors that:
   - call `/api/agent-mode`
   - cancel pending plan turns
   - cancel clarification flows
   - special-case pending plan review by manipulating
     `pendingPlanModeOverrideRef`
3. Remove `pendingPlanModeOverrideRef` entirely. It represents a mutable
   next-send override, which no longer matches the new model.
4. Remove `syncPlanModeFromBackend` as a source of truth for the composer
   toggle, including the startup effect and the turn-complete resync.

After this change, backend mode no longer drives the toggle. The toggle belongs
to the composer only.

## Prompt submission changes

Prompt submission must snapshot mode immediately.

1. Update `submitPrompt` so it reads the current local toggle and computes:

```typescript
const promptMode: "default" | "plan" = isPlanModeRef.current ? "plan" : "default";
```

2. Pass `promptMode` into both immediate dispatch and queue creation.
3. Update `dispatchPromptNow` to accept `mode`.
4. Update `enqueuePromptAction` to accept and store `mode`.
5. When appending the optimistic local user message, write the snapped mode into
   message metadata.

This guarantees that each user prompt keeps the mode it was submitted with,
even if the user toggles again before that prompt executes.

## Dispatch changes

Dispatch must use the snapped message mode, not the live toggle.

1. Update `dispatchPromptNow` to accept `mode: "default" | "plan"`.
2. Before `sendMessage`, sync `/api/agent-mode` to the snapped mode.
3. Also pass `isPlanMode: mode === "plan"` in the `body` of the
   `sendMessage` call.
4. Use the snapped mode to:
   - decide whether to create `planningSession`
   - set `body.isPlanMode`
   - choose any plan-only context text

Example shape inside `dispatchPromptNow`:

```typescript
const response = await fetch(API_ENDPOINTS.AGENT_MODE, {
	method: "POST",
	headers: { "Content-Type": "application/json" },
	body: JSON.stringify(buildRovoAppAgentModeRequest({ mode })),
});

if (!response.ok) {
	throw new Error(
		`Failed to sync agent mode before dispatch (status ${response.status})`,
	);
}

await sendMessage(
  { text, files, messageId, metadata },
  {
    body: {
      id: threadId,
      isPlanMode: mode === "plan",
      // ...other fields
    },
  },
);
```

The important point is that dispatch mode comes from the message, not from the
current toggle.

### Why dispatch should keep `/api/agent-mode` for now

The Express backend (`backend/server.js`) already determines plan mode
per-request from the `isPlanMode` field in the request body. The flow is:

1. The frontend sends `body.isPlanMode` with each chat request.
2. The Express backend reads `requestBody.isPlanMode` (line 2586), deletes it
   from the forwarded body (line 2587), and stores it as
   `resolvedPlanModeActive`.
3. `resolvedPlanModeActive` drives all downstream behavior for that request:
   routing decisions (line 2618), plan session management (line 5397),
   context setup (line 2730), and auto-plan heuristics (line 2602).
4. However, this only proves what the Express layer does. It does **not** prove
   that RovoDev Serve's own `agent_mode` is irrelevant.
5. In `acra`, Serve still reads `session_ctx.deps.agent_mode` during model
   request setup and injects plan-mode instructions from that state.
6. In `acra`, the `exit_plan_mode` tool explicitly checks that the Serve-side
   mode is `plan` and fails otherwise.

Because Rovo App still relies on deferred `exit_plan_mode` approvals to
produce the approval card, the safe implementation is:

- keep mode snapshotting per message
- keep the toggle purely local
- but still sync `/api/agent-mode` at prompt dispatch time using that snapped
  message mode

This preserves the new UX model without relying on an unverified assumption
about Serve internals.

If a later investigation proves that Serve `agent_mode` is truly unnecessary
for Rovo App, dispatch-time sync can be removed in a follow-up cleanup.

### Why `transport.prepareSendMessagesRequest` already supports this

The existing `prepareSendMessagesRequest` function (around line 1145 in
`use-rovo-app.ts`) already reads `body?.isPlanMode` and forwards it into
the request. When `body.isPlanMode` is explicitly set, it takes precedence
over `isPlanModeRef.current`. So passing the snapped mode through `body` is
the natural integration point — no transport changes are needed.

## Queue changes

The queue must become mode-aware and card-aware.

### Storing mode

When `submitPrompt` creates a queued prompt action, it must include the
snapped mode:

```typescript
enqueuePromptAction({
	text,
	files,
	contextDescription,
	messageMetadata,
	mode: promptMode,
});
```

When `processQueue` picks the next item and dispatches it, it must forward
the stored mode:

```typescript
await dispatchPromptNow({
	text: nextAction.text,
	files: [...nextAction.files],
	contextDescription: nextAction.contextDescription,
	messageMetadata: nextAction.messageMetadata,
	mode: nextAction.mode,
});
```

### Strengthening the queue gate

The current `canDispatchRovoAppQueuedAction` gate is too weak. It currently
only checks that the action is not null. It needs to also block when:

1. A deferred clarification card is active (the user has not answered the
   question).
2. A deferred plan approval card is active (the user has not resolved the
   plan).
3. A tool approval is pending.

This ensures that queued prompts cannot bypass a blocking card.

### Queue error handling and re-enqueue

If `dispatchPromptNow` fails before `sendMessage` completes (for example, if
the request itself fails), the shifted queued action must be re-enqueued so it
is not lost. The current `processQueue` does not re-enqueue on failure — the
shifted action is simply dropped. This must be fixed as part of the queue
changes.

Important ordering detail:

- Re-enqueueing must preserve the original queue order.
- Do not append the failed shifted action to the end of the queue, because
  that would reorder `A`, `B`, `C` into `B`, `C`, `A`.
- Add a prepend or restore-at-front queue helper if needed.

## Deferred card changes

### Clarification cards

When a deferred question card blocks the conversation, the queue stays blocked
until the user answers it. Answering the card sends a continuation request that
does not come from the queue. This continuation must complete and RovoDev must
become idle before the queue can release the next item.

This matches the example flow:

1. User starts in plan mode.
2. RovoDev asks clarifying questions.
3. User has already queued prompts `A`, `B`, and `C`.
4. The user answers the clarification card.
5. RovoDev immediately continues with the clarified planning flow.
6. `A`, `B`, and `C` remain queued until RovoDev is free.

### Plan approval cards

Plan approval needs a stronger change.

Today the next typed prompt can be interpreted as plan feedback or plan
rejection through `resolveRovoAppPlanReviewAction(...)`. That conflicts with
the new rule.

Update the plan-review flow so:

1. The approval card is always shown for the latest pending deferred plan.
2. The user must explicitly choose an approval-card action to close the loop.
3. Regular typed prompts are never repurposed as plan feedback or plan
   rejection.
4. Queued prompts stay blocked while the approval card is unresolved.

This means the prompt-based plan-review shortcut must be removed from
`submitPrompt`.

## Shell and UI changes

The composer button becomes always enabled, but the blocking cards remain in
control of queue release.

1. In `rovo-app-composer.tsx`, remove the busy-state disable from the Task
   button.
2. In `rovo-app-shell.tsx`, keep rendering the clarification card as a
   blocking state.
3. Update the plan approval card behavior so it is not dismissible without a
   decision. The user must accept, continue planning, or submit custom
   instruction through the card.

This matches the latest stated product rule that the deferred approval card
must always be used to close the plan loop.

## Code paths to remove or rewrite

The following parts of the current implementation no longer match the desired
behavior and must be removed or reworked.

1. Prompt-based pending-plan interception in `submitPrompt`
2. `resolveRovoAppPlanReviewAction(...)`
3. `pendingPlanModeOverrideRef`
4. Backend-driven composer-mode resync through `syncPlanModeFromBackend`
5. Any toggle path that cancels the active plan or clarification loop
6. All `/api/agent-mode` calls from `togglePlanMode` and
   `syncPlanModeFromBackend` — these are no longer needed as toggle-time state
   sync mechanisms
7. Leave dispatch-time `/api/agent-mode` calls in place, but rewrite them to
   use the snapped message mode instead of the live toggle state

## Suggestions

These are the safest ways to execute the change.

### Suggested implementation path

Ship this in two phases:

1. Phase 1:
   - make the toggle purely local and always clickable
   - snapshot mode per submitted message
   - snapshot mode per queued prompt
   - block queue release on unresolved deferred cards
   - keep dispatch-time `/api/agent-mode` sync based on snapped mode
2. Phase 2:
   - run a focused verification spike to prove whether Serve `agent_mode`
     can be ignored
   - only remove dispatch-time sync if that spike passes

This gets the requested UX without taking an avoidable backend risk.

### Suggested verification spike

Before removing dispatch-time `/api/agent-mode`, verify all of the following in
an isolated test flow:

1. Force Serve `agent_mode` to `default`.
2. Send a Rovo App request with `body.isPlanMode: true`.
3. Confirm the assistant still behaves as plan mode inside Serve.
4. Confirm `ask_user_questions` still behaves correctly for plan turns.
5. Confirm `exit_plan_mode` still succeeds and emits the deferred approval
   widget.
6. Confirm plan revision after approval-card feedback still works.

If any of those fail, dispatch-time sync must remain.

### Suggested fallback if complexity grows

If the full queue and approval-card rewrite becomes too large for one change,
the minimum acceptable slice is:

1. Make the toggle always local and always clickable.
2. Snapshot mode per submitted and queued prompt.
3. Keep current deferred-card blocking behavior.
4. Keep dispatch-time `/api/agent-mode` sync.

That still delivers the main UX improvement while deferring riskier cleanup.

### Suggested UX decision to make explicit

The plan currently treats the toggle as local composer state, but it does not
specify whether that local state:

1. persists across thread switches, or
2. resets when the user opens a new thread or changes threads

Pick one explicitly before implementation. The simpler default is to keep the
toggle local to the current composer session and preserve it until the user
changes it, but either choice is valid if it is intentional.

## Edge cases

The plan must cover these cases explicitly.

| Scenario | Required behavior |
|----------|-------------------|
| User toggles on and off repeatedly before submitting | Nothing happens except local UI state changes. |
| User submits prompt while toggle is ON | That prompt gets `mode: "plan"` permanently. |
| User toggles OFF immediately after submitting a plan-mode prompt | The already-submitted prompt still runs in plan mode. |
| User submits prompt while run is busy | Queue the prompt together with its snapped mode. |
| User queues prompts `A`, `B`, `C` while a plan-mode run is in progress | Each queued prompt stores its own mode snapshot. |
| Clarification card appears while queued prompts exist | Queue remains blocked. |
| User answers clarification card while queued prompts exist | Clarification continuation runs immediately. Queue remains blocked until RovoDev is free. |
| Plan approval card appears while queued prompts exist | Queue remains blocked. |
| User resolves plan approval card | Approval continuation runs immediately. Queue remains blocked until RovoDev is free. |
| Tool approval is pending | Queue remains blocked until tool approval is resolved and the resulting continuation is complete. |
| Delegation actions in the queue | Delegation actions (voice/artifact) do not carry a plan mode and are dispatched through `dispatchDelegationNow`, not `dispatchPromptNow`. They are unaffected by this change. |

## Verification

Run the normal checks first:

1. `pnpm run lint`
2. `pnpm tsc --noEmit`

Then verify behavior manually:

1. Start a normal stream and toggle Task on and off several times. Confirm that
   nothing is sent to the backend until a prompt is submitted.
2. Submit a prompt with Task on, then toggle it off immediately. Confirm the
   submitted prompt still runs in plan mode.
3. Submit a prompt with Task off, then toggle it on immediately. Confirm the
   submitted prompt still runs in default mode.
4. While a run is busy, queue multiple prompts with different toggle states.
   Confirm each queued prompt preserves its own snapped mode.
5. Trigger a deferred clarification card while queued prompts already exist.
   Confirm the queue does not release.
6. Answer the clarification card. Confirm the clarification continuation runs
   immediately and the queue still does not release until RovoDev is free.
7. Trigger a deferred plan approval card while queued prompts already exist.
   Confirm the queue does not release.
8. Resolve the plan approval card. Confirm the approval continuation runs
   immediately and the queue only resumes once RovoDev is free.
9. Confirm typed prompts are no longer interpreted as plan feedback or plan
   rejection while an approval card is pending.
