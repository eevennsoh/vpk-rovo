# Fix: Voice mode splitting GPT Realtime responses into 2 message bubbles

## Context

When using voice mode, every GPT Realtime response appears as **2 separate message bubbles** instead of 1. The first bubble is always a short fragment (1-2 words like "It", "Ah"), and the second is the full response.

## Root Cause Analysis

### Investigation findings

The split is caused by **three related issues**:

**Issue 1 (Core bug) — `ensureRealtimeAssistantMessage` creates duplicate messages**: When GPT Realtime sends multiple responses within a single user turn (different `responseId`s), `response_done` resets the voice hook's refs (`currentAssistantItemIdRef`, `assistantTextStartedRef`) but does NOT reset `realtimeAssistantMessageIdRef` in the shell. The next `text_delta`/`audio_transcript_delta` arrives with a new `preferredMessageId` that doesn't match the cached `realtimeAssistantMessageIdRef`, so `ensureRealtimeAssistantMessage` falls through and creates a NEW message instead of reusing the existing one. This causes the split on EVERY response — even without delegation.

**Issue 2 — Delegation creates a new message ID**: When delegation occurs, `delegateToRovodev()` streams the response as a new message with a different ID from the GPT interim fragment.

**Issue 3 — Aggressive delegation**: GPT Realtime calls `delegate_to_rovo` on virtually every message, even simple questions that don't require task execution.

### Fix applied

**Issue 1 fix**: Simplified `ensureRealtimeAssistantMessage` to always reuse the cached `realtimeAssistantMessageIdRef.current` if it's set. The ref is only cleared by `onSpeechStarted` (when the user speaks again), so all GPT responses within the same user turn merge into one bubble.

**Issue 2 fix**: `delegateToRovodev` now accepts `existingRealtimeMessageId` and reuses that ID for the delegation response instead of creating a new message.

**Issue 3 fix**: Strengthened the GPT Realtime system prompt to only delegate for actual task requests, and to call the function immediately without emitting text tokens first.

### Key code paths

| Step | File | Line(s) | What happens |
|------|------|---------|--------------|
| GPT text starts | `use-realtime-voice.ts` | 676-712 | `text_delta` handler calls `onTextResponseStart` with `currentAssistantItemIdRef` as the message ID |
| Message A created | `future-chat-shell.tsx` | 427-461 | `ensureRealtimeAssistantMessage()` creates a new message, caches ID in `realtimeAssistantMessageIdRef` |
| Text streamed | `future-chat-shell.tsx` | 867-881 | `onAssistantTextDelta` appends delta text to Message A via `updateRealtimeMessage` |
| GPT calls delegate | `use-realtime-voice.ts` | 802-829 | `function_call` handler clears all assistant refs, calls `onDelegateToRovo` |
| Delegation starts | `future-chat-shell.tsx` | 738-784 | `onDelegateToRovo` callback calls `c.delegateToRovodev()` |
| Message B created | `use-future-chat.ts` | 1353-1525 | `delegateToRovodev()` streams RovoDev response, creates NEW message via `upsertRealtimeMessage()` with a different ID |

### Unconfirmed: non-delegation split

It is **not yet confirmed** whether the split also occurs for truly non-delegated responses (where GPT answers without calling `delegate_to_rovo`). The `response_done` handler (line 793-800) resets all voice hook refs but does NOT reset `realtimeAssistantMessageIdRef` in the shell, so a single non-delegated response should produce only 1 bubble. **This needs manual testing to confirm.**

## Design Decisions (from review interview)

- **Never delete messages** — no `removeRealtimeMessage` utility needed
- **Merge approach** — when delegation happens, stream the delegation response into the existing GPT message (reuse Message A's ID) instead of creating a new Message B
- **Keep all GPT text** — the fragment text ("Ah") is from GPT Realtime and should be kept (it will be replaced by the delegation response content streaming into the same message)
- **Flicker is acceptable** — the brief appearance of "Ah" before the delegation response replaces it is fine; the existing Streamdown blur animation handles this gracefully
- **Two-phase fix** — fix the message split first (Phase 1), then address aggressive delegation via system prompt tuning (Phase 2)

## Phase 1: Fix message split during delegation (merge approach)

### Approach

Instead of `delegateToRovodev()` creating a new message (Message B), pass Message A's existing ID so the delegation response streams into the same bubble.

### 1. Pass the interim message ID to `delegateToRovodev`

**File**: `components/projects/future-chat/components/future-chat-shell.tsx`

In the `onDelegateToRovo` callback (~line 738), pass the current GPT message ID to `delegateToRovodev` so it can reuse it:

```typescript
onDelegateToRovo: useCallback(
	async (request: DelegationRequest) => {
		try {
			const c = chatRef.current as FutureChatRealtimeShellAdapter;
			// ... existing code ...

			// Pass the existing GPT message ID so delegation streams into the same bubble
			const existingMessageId = realtimeAssistantMessageIdRef.current;

			if (delegatedMessageId && typeof c.delegateToRovodev === "function") {
				await c.delegateToRovodev(delegatedMessageId, {
					...,
					existingRealtimeMessageId: existingMessageId,
				});
				return;
			}
			// ... rest of existing code ...
```

### 2. Update `delegateToRovodev` to reuse the existing message ID

**File**: `components/projects/future-chat/hooks/use-future-chat.ts`

In `delegateToRovodev()` (~line 1353), accept an optional `existingRealtimeMessageId` in the options. When streaming the response, if an existing message ID is provided, update that message instead of creating a new one:

- Accept `existingRealtimeMessageId` in the delegation options type
- When processing streamed messages, if `existingRealtimeMessageId` is set, replace Message A's content with the delegation response content (same ID, same bubble)
- Clear the existing fragment text ("Ah") when the first delegation chunk arrives, then stream normally

### 3. Review the `FutureChatRealtimeShellAdapter` type

**File**: `components/projects/future-chat/components/future-chat-shell.tsx`

Update the `delegateToRovodev` signature in the adapter type to accept the new option (~line 90).

## Phase 2: Fix aggressive delegation (system prompt tuning)

### Approach

Tune the GPT Realtime system prompt/instructions to be stricter about when to call `delegate_to_rovo`.

**File**: `backend/lib/openai-realtime.js` (system prompt / instructions)

- Add explicit instructions telling GPT to only call `delegate_to_rovo` for actual task requests (create ticket, search, execute action, etc.)
- Tell GPT to answer simple questions, greetings, and casual conversation directly without delegating
- Example prompt additions:
  - "Only call `delegate_to_rovo` when the user explicitly asks you to perform a task that requires RovoDev capabilities (creating issues, searching, executing workflows, etc.)"
  - "For greetings, simple questions, clarifications, and casual conversation, respond directly without delegating"

## Files Modified

### Phase 1 (message split fix)
1. `components/projects/future-chat/components/future-chat-shell.tsx` — pass existing message ID to delegation, update adapter type
2. `components/projects/future-chat/hooks/use-future-chat.ts` — update `delegateToRovodev` to accept and reuse existing message ID

### Phase 2 (delegation prompt fix)
3. `backend/lib/openai-realtime.js` — tune system prompt to restrict delegation to actual tasks

## Open Questions

1. **Non-delegation split**: Does the 2-bubble split also occur for non-delegated responses? Needs manual testing with delegation disabled or a prompt that prevents delegation.
2. **Message content replacement**: When the delegation response streams into Message A, should it fully replace the "Ah" text or append after it? (Current decision: replace, since "Ah" is just GPT thinking aloud before delegating)
3. **`delegateToRovodev` message stream format**: The delegation response comes from the backend as a stream of messages with their own IDs. Need to verify how `readUIMessageStream` assigns IDs and whether we can override them with the existing message ID.

## Verification

1. `pnpm run lint` — ensure no lint errors
2. `pnpm tsc --noEmit` — ensure no type errors
3. Manual test (Phase 1):
   - Start the app with `pnpm run dev`
   - Open future-chat, activate voice mode (realtime)
   - Speak a message that triggers delegation
   - Verify: only 1 assistant message bubble appears, not 2
   - Verify: the short GPT fragment ("Ah") is replaced by the delegation response in the same bubble
   - Verify: navigating away and back to the thread still shows clean messages
4. Manual test (Phase 2):
   - Speak a simple greeting or question ("Hello", "What time is it?")
   - Verify: GPT responds directly without delegating to RovoDev
   - Verify: single message bubble with GPT's direct response
   - Speak a task request ("Create a Jira ticket for the login bug")
   - Verify: GPT correctly delegates to RovoDev for actual tasks
