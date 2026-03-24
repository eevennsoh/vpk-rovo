# PRD: Fix Repeating Question Card Loop in Plan Mode

## 1. Executive Summary

**Problem**: In plan mode, after a user answers an `ask_user_questions` deferred tool card, the same question card re-appears immediately. RovoDev Serve's agent loop does not receive the deferred tool result, so it re-invokes `ask_user_questions` with the same questions — creating an infinite loop.

**Proposed Solution**: Diagnose and fix the deferred tool result delivery pipeline (Path A: `set_chat_message` → `resume_tool_calls` → `replayViaRovoDev`), and add a replay-safe fallback so answered questions never re-appear.

**Success Criteria**:
- Answered question cards never produce the same question card again
- Deferred tool results are delivered to and acknowledged by RovoDev Serve in 100% of cases
- Plan mode completes the QA → plan → approval flow without looping
- Regression test covering the full deferred tool round-trip

---

## 2. Problem Analysis

### 2.1. Observed Behavior (from screenshot)

1. User sends "help me build an app" with Plan mode enabled
2. Agent calls `ask_user_questions` → question card renders with 3 questions
3. User answers all 3 questions → answer card appears (blue bubble)
4. Agent immediately invokes `ask_user_questions` AGAIN with identical questions
5. Loop continues indefinitely

### 2.2. Architecture Trace

The deferred tool flow has 9 steps across 3 layers:

```
Frontend                    Backend (server.js)              RovoDev Serve
─────────                   ──────────────────               ────────────
                            onPausedToolCalls ←────────────── ask_user_questions()
                            registerPausedRovoDevToolCall()   (paused at callback)
question card renders ←──── emitRequestUserInputQuestionCard()
user answers ──────────────→ normalizeClarificationSubmission()
                            _pausedRovoDevToolCallStore.has() → found ✓
                            synthesiseDeferredToolResponseFromClarification()
                            rovoDevRequest("POST", "/v3/set_chat_message", ...)  ──→ queue deferred result
                            rovoDevResumeToolCalls(port, ...)                    ──→ unpause callback
                            replayViaRovoDev(...)                                ──→ stream_chat (replay)
                                                                                     agent loop continues
                                          ← (agent calls ask_user_questions AGAIN)
```

### 2.3. Root Cause Hypothesis

The failure is in **Path A** (`backend/server.js:9139-9207`). The evidence:

| Signal | Implication |
|--------|-------------|
| Re-appears immediately (<5s) | TTL expiry (5min) is NOT the cause |
| Plan mode only | Non-plan mode uses the same Path A code, but plan mode's agent instructions are more likely to re-invoke `ask_user_questions` if it doesn't see the result |
| Same questions, not follow-ups | Agent didn't receive the answer; it's not asking new questions |

**Most likely failure point**: `set_chat_message` at line 9173 sends `{ message: { tool_call_id, result } }` but RovoDev Serve either:
- (a) doesn't recognize this format and discards it (expects plain string), OR
- (b) queues it on `session_ctx.deferred_results` but `resume_tool_calls` with `deny_message: null` doesn't trigger the result resolution, OR
- (c) the result is processed but the format `Record<string, string[]>` doesn't match what the Python `ask_user_questions` tool expects as its return type

**Why it only fails in plan mode**: In non-plan mode, the `enrichedContextDescription` safety net (line 5893) injects the answers as text into a **fresh `streamViaRovoDev` turn** when the store lookup fails on a second attempt. But in plan mode, Path A succeeds on the first attempt (store entry IS found), so the safety net doesn't fire. When the deferred result delivery fails silently, there's no fallback — `replayViaRovoDev` doesn't carry the `enrichedContextDescription`.

### 2.4. Secondary Failure Points to Investigate

1. **`set_chat_message` response**: Does it return 200 even when the deferred result isn't recognized? (line 9180)
2. **`resume_tool_calls` with `deny_message: null`**: Does this properly trigger `PauseOnToolCallsCallback` to resolve the deferred tool rather than suppressing it? (line 9189)
3. **Replay stream handling**: During `replayViaRovoDev`, does `handlePausedContinuation` filter out the original tool call correctly via `skipReplayUntilToolCallId`? (line 9205)

---

## 3. User Stories

**US-1**: As a user in plan mode, when I answer clarification questions, the agent should use my answers and proceed to generate a plan — not re-ask the same questions.

- **AC-1.1**: After submitting answers, the question card shows "answered" state and no new identical card appears
- **AC-1.2**: The agent's next turn references the user's answers (visible in its thinking/output)
- **AC-1.3**: If the deferred result delivery fails, the answers are still delivered as text context (safety net)

**US-2**: As a developer debugging this flow, I should have clear visibility into whether the deferred result was delivered successfully.

- **AC-2.1**: Backend logs show the `set_chat_message` response status AND body
- **AC-2.2**: Backend logs show whether `resume_tool_calls` succeeded
- **AC-2.3**: The debug log at `/tmp/vpk-deferred-debug.log` includes Path A execution result

### Non-Goals

- Changing the RovoDev Serve Python codebase (we can only fix the VPK backend/frontend)
- Redesigning the deferred tool protocol (keep the existing 3-step approach)
- Fixing non-plan-mode question card issues (not currently broken)

---

## 4. Technical Specifications

### 4.1. Investigation Steps (Phase 1)

Before writing code, verify the root cause:

**Step 1**: Check the debug log
```bash
cat /tmp/vpk-deferred-debug.log
```
Expected fields: `hasPausedClarificationToolCall`, `clarificationToolCallId`, `storeKeys`

**Step 2**: Add temporary logging to Path A
```javascript
// After set_chat_message (line 9180)
console.log("[chat-sdk] set_chat_message response", {
    status: setChatRes.status,
    body: JSON.stringify(setChatRes.data),
});

// After resume_tool_calls (line 9197)
console.log("[chat-sdk] resume_tool_calls completed");
```

**Step 3**: Reproduce and check backend console for:
- `[chat-sdk] Sending deferredToolResponse via Path A` (confirms Path A is entered)
- `set_chat_message` response status/body
- Whether `handlePausedContinuation` fires during replay (agent re-pausing)

### 4.2. Fix: Add Replay-Safe Fallback (Phase 2)

**Key Files**:
| File | Change |
|------|--------|
| `backend/server.js` ~9200 | Pass `enrichedContextDescription` into `replayViaRovoDev` options |
| `backend/lib/rovodev-gateway.js` ~1559 | Accept optional `contextFallback` in `replayViaRovoDev` and inject into onPausedToolCalls if agent re-asks |
| `backend/server.js` ~9060 | In `handlePausedContinuation`, if the new `ask_user_questions` matches the answered one, suppress it and inject answers as `deny_message` |

**Approach**: When `handlePausedContinuation` detects `ask_user_questions` during replay AND we have a `clarificationSubmission` for the same session, instead of emitting a new question card:

```javascript
// Inside handlePausedContinuation, when interactivePart is found during replay:
if (interactivePart && clarificationSubmission && isReplayAfterClarification) {
    // Don't emit a new question card — resume with the answers as deny_message
    const answerSummary = buildClarificationResumeDenyMessage(clarificationSubmission);
    await control.resume({
        decisions: [{
            tool_call_id: interactivePart.tool_call_id,
            deny_message: answerSummary,
        }],
    });
    return { disconnect: false }; // Continue streaming
}
```

### 4.3. Fix: Validate `set_chat_message` Response (Phase 2)

If `set_chat_message` returns non-200, immediately fall back to injecting answers as context:

```javascript
// After line 9184
if (setChatRes.status !== 200) {
    console.error("[chat-sdk] set_chat_message failed, falling back to deny_message approach");
    // Fall through to Path B (resume with deny_message containing answers)
    const answerText = buildClarificationResumeDenyMessage(clarificationSubmission);
    await rovoDevResumeToolCalls(pausedToolCallRecord.port, {
        decisions: [{
            tool_call_id: pausedToolCallRecord.toolCallId,
            deny_message: answerText,
        }],
    });
    // Then replay
    await replayViaRovoDev({ ... });
    return; // Skip the rest of Path A
}
```

### 4.4. Fix: Deduplication Guard (Phase 2)

Add a session-level guard that prevents the same `ask_user_questions` from being emitted twice with identical question fingerprints:

```javascript
// In handlePausedContinuation:
const questionFingerprint = JSON.stringify(deferredQuestionInput);
if (answeredQuestionFingerprints.has(questionFingerprint)) {
    console.warn("[ROVODEV-REPLAY] Suppressing duplicate ask_user_questions after prior answer");
    await control.resume({
        decisions: [{ tool_call_id: interactivePart.tool_call_id, deny_message: lastAnswerText }],
    });
    return { disconnect: false };
}
```

### 4.5. Architecture Overview

```
User answers → submitClarification() → POST /api/chat-sdk
                                            │
                                            ▼
                                 normalizeClarificationSubmission()
                                            │
                            ┌───────────────┴────────────────┐
                            │ hasPausedClarificationToolCall? │
                            └───────┬──────────────┬─────────┘
                                  YES             NO
                                    │               │
                              [Path A]         [Fresh stream]
                           set_chat_message     enrichedContextDescription
                           resume_tool_calls    (safety net text injection)
                           replayViaRovoDev     streamViaRovoDev
                                    │
                           ┌────────▼─────────┐
                           │ Agent resumes...  │
                           │ ask_user_questions│
                           │ called AGAIN?     │
                           └──┬───────────┬───┘
                            YES          NO
                              │            │
                     [NEW: suppress &     [Success ✓]
                      inject answers
                      via deny_message]
```

---

## 5. Testing

### 5.1. Regression Test (`backend/lib/deferred-clarification.test.js`)

Add test: "Path A fallback when set_chat_message fails" — verify that when `set_chat_message` returns non-200, the system falls back to `deny_message` approach.

### 5.2. Manual Validation

1. Enable plan mode, send "build me a todo app"
2. Wait for question card to appear
3. Answer all questions
4. Verify: agent proceeds to generate plan (no loop)
5. Verify: debug log shows `hasPausedClarificationToolCall: true` and Path A execution
6. Repeat 3x to confirm no intermittent failures

### 5.3. Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User takes >5 min to answer | TTL expiry error shown, user retries |
| User answers only 1 of 3 questions | Partial answers delivered, agent proceeds or asks remaining |
| Network error during `set_chat_message` | Fallback to deny_message approach |
| Agent asks follow-up questions (different from original) | New question card renders normally |
| User dismisses question card | Dismiss prompt sent, agent proceeds without answers |

---

## 6. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| `set_chat_message` format change on RovoDev Serve side | High — breaks all deferred tool result delivery | Add response body validation; fall back to deny_message |
| Deduplication guard too aggressive | Medium — blocks legitimate follow-up questions | Fingerprint by exact question content, not just tool name |
| `deny_message` approach loses answer fidelity | Low — answers are text, not structured result | Build deny_message in the same format the agent would parse |

---

## 7. Phased Rollout

**Phase 1 (Investigate)**: Add diagnostic logging to Path A, reproduce, read debug log.

**Phase 2 (Fix)**: Implement the replay-safe fallback + `set_chat_message` validation + deduplication guard.

**Phase 3 (Harden)**: Add regression tests, clean up temporary debug logging, update `AGENTS-LESSONS.md`.

---
---

# SPEC: Fix Repeating Question Card Loop in Plan Mode

> Appended after interview and cross-codebase investigation. This spec supersedes the PRD's root cause hypotheses (Section 2.3) with findings from the RovoDev Serve source code.

## S1. Updated Root Cause Analysis

### S1.1. Two-Mechanism Discovery

The PRD assumed a single pause/resume mechanism. Investigation of the RovoDev Serve source (`/Users/esoh/Documents/Labs/acra-21-mar`) revealed that `ask_user_questions` uses **two independent pause mechanisms** in sequence:

| # | Mechanism | Where it fires | Who resumes it |
|---|-----------|----------------|----------------|
| 1 | `PauseOnToolCallsCallback` | Before tool execution (`on_call_tools_start`) | `/v3/resume_tool_calls` with `deny_message: null` (auto-approve) |
| 2 | `CallDeferred()` (pydantic-ai) | During tool execution (inside `ask_user_questions`) | `/v3/set_chat_message` with `DeferredToolResponse` + a fresh `/v3/stream_chat` call |

**VPK's Path A currently does:**
1. `POST /v3/set_chat_message` — stores `deferred_results` on the session ✓
2. `POST /v3/resume_tool_calls` — unpauses `PauseOnToolCallsCallback` ✓
3. `replayViaRovoDev` → `POST /v3/replay` — replays buffered events + continues live stream

**The problem:** Step 3 uses `/v3/replay`, which replays buffered events and continues live streaming, but **does NOT re-run the agent**. After step 2 unpauses the callback, the tool executes and raises `CallDeferred()`. pydantic-ai then pauses the agent and emits a `DeferredToolRequests` event. The `deferred_results` from step 1 ARE stored on the session, but pydantic-ai requires a fresh `/v3/stream_chat` call to pick them up and inject them into the agent. `/v3/replay` never triggers that re-run.

Result: the agent never receives the answers → re-invokes `ask_user_questions` → loop.

### S1.2. Why Non-Plan Mode Works (Safety Net)

In non-plan mode, when a user answers and the `_pausedRovoDevToolCallStore` lookup fails on a second attempt, the `enrichedContextDescription` safety net fires. This injects the answers as text into a **fresh `streamViaRovoDev` call** (which uses `/v3/stream_chat`). The fresh `stream_chat` naturally picks up any stored `deferred_results` — so the agent gets the answers one way or another.

In plan mode, Path A succeeds on the first attempt (store entry IS found), so the safety net never fires. When `replay` fails to deliver the deferred results, there's no fallback.

### S1.3. PRD Hypothesis Reassessment

| PRD Hypothesis | Status |
|----------------|--------|
| (a) `set_chat_message` doesn't recognize format | **Disproven** — RovoDev Serve accepts `DeferredToolResponse` and stores it correctly in `session_ctx.deferred_results` |
| (b) `resume_tool_calls` with `deny_message: null` doesn't trigger resolution | **Partially correct** — it correctly unpauses the callback, but this is mechanism #1. Mechanism #2 (`CallDeferred`) requires a separate `stream_chat` call |
| (c) Result format mismatch | **Unlikely** — `ask_user_questions` expects `dict[str, list[str]]` and VPK's `adaptClarificationAnswersForToolContract` produces exactly that format |

### S1.4. RovoDev Serve API Contract (Reference)

Source: `/Users/esoh/Documents/Labs/acra-21-mar/packages/cli-rovodev/src/rovodev/commands/serve/`

```
POST /v3/set_chat_message
  Body: { message: { tool_call_id: string, result: any } }  (DeferredToolResponse)
  Effect: state.session_ctx.deferred_results = DeferredToolResults(calls={tool_id: result})
  Response: { response: "Deferred tools set" }

POST /v3/resume_tool_calls
  Body: { decisions: [{ tool_call_id: string, deny_message: string | null }] }
  deny_message: null  → approve (no modification)
  deny_message: string → suppress tool, inject { _suppress_tool_call: deny_message } as args
  Effect: sets pending_call.future result → unblocks PauseOnToolCallsCallback

POST /v3/stream_chat
  Effect: runs _chat() → chat_generator() → _run_agent(session_ctx)
  Consumes: session_ctx.deferred_results (injects into agent as tool results)
  Consumes: state.current_chat_request (user message)

POST /v3/replay
  Effect: yields state.conversation_buffer events → emits replay_end → streams live events
  Does NOT re-run the agent. Does NOT consume deferred_results.
```

### S1.5. Constraint: RovoDev Serve is Hosted

RovoDev Serve runs as a hosted service — VPK cannot modify it. The source at `acra-21-mar/` is a reference copy only. All fixes must be VPK-side.

---

## S2. Scope & Constraints

### In Scope

- Fix the question card loop in plan mode (questions → answers → agent proceeds)
- Verify and fix plan approval flow (`exit_plan_mode` deferred tool) if it has the same issue
- Full plan flow must work end-to-end: questions → answers → plan generated → plan approval → execution
- Permanent structured logging for the deferred tool pipeline
- Require all questions answered before submission (block partial answers)

### Out of Scope

- Changes to the RovoDev Serve Python codebase (hosted, not under our control)
- Fixing non-plan-mode question card issues (working via safety net)
- Automated regression tests (manual validation sufficient)
- Redesigning the deferred tool protocol

### Constraints

- VPK-only changes
- Plan mode scoped (don't change behavior for non-plan flows)
- Turn restart is acceptable (agent can re-run its current turn with answers available)
- Prefer proper deferred tool result delivery; accept text injection workaround only if the root cause is fundamentally a RovoDev Serve limitation

---

## S3. Investigation Phase (Do First)

All investigation tasks must be completed before writing any fix code. The goal is to confirm or revise the root cause hypothesis from S1.1.

### Task 1: Add Diagnostic Logging to Path A

**File:** `backend/server.js` (Path A, ~lines 9139-9207)

Add permanent structured logging at each step:

```javascript
// Before set_chat_message
console.info("[DEFERRED-TOOL] Path A: delivering deferred result", {
	toolCallId: pausedToolCallRecord.toolCallId,
	port: pausedToolCallRecord.port,
	hasResult: !!deferredToolResponse?.result,
});

// After set_chat_message
console.info("[DEFERRED-TOOL] Path A: set_chat_message response", {
	status: setChatRes.status,
	body: JSON.stringify(setChatRes.data),
});

// After resume_tool_calls
console.info("[DEFERRED-TOOL] Path A: resume_tool_calls completed", {
	toolCallId: pausedToolCallRecord.toolCallId,
});

// Before replayViaRovoDev
console.info("[DEFERRED-TOOL] Path A: starting replay", {
	port: pausedToolCallRecord.port,
	skipReplayUntilToolCallId: pausedToolCallRecord.toolCallId,
});
```

Also add logging inside `handlePausedContinuation` when it receives pause events during replay:

```javascript
console.info("[DEFERRED-TOOL] handlePausedContinuation fired during replay", {
	toolName: interactivePart?.tool_name,
	toolCallId: interactivePart?.tool_call_id,
	isReplay: true,
});
```

### Task 2: Reproduce and Capture Logs

1. Start dev server: `pnpm run dev`
2. Enable plan mode, send "Help me create an app"
3. Wait for question card → answer all questions
4. Capture backend console output
5. Verify:
   - `[DEFERRED-TOOL] Path A: set_chat_message response` shows `status: 200`
   - `[DEFERRED-TOOL] Path A: resume_tool_calls completed` fires
   - `[DEFERRED-TOOL] handlePausedContinuation fired during replay` fires (confirms agent re-invoked `ask_user_questions`)

### Task 3: Verify `/v3/replay` Does Not Consume Deferred Results

Add a temporary log inside `replayViaRovoDev` (in `rovodev-gateway.js`) to capture what events come back through the replay stream:

```javascript
// Inside replayViaRovoDev's event handlers:
console.info("[DEFERRED-TOOL] Replay stream event", {
	eventType: event.type,
	hasToolCallParts: !!event.parts?.length,
});
```

Confirm whether the replay stream contains a new `PauseOnToolCallsCallback` event with `ask_user_questions` — proving the agent re-invoked the tool because it didn't receive the deferred result.

### Task 4: Compare Make Project Flow

**Goal:** Understand why Make doesn't have the loop bug.

1. Check if Make uses plan mode at all (search for plan mode activation in `components/projects/make/`)
2. Check if Make encounters `ask_user_questions` in a deferred tool context
3. If Make does use question cards, trace which code path handles the answer submission:
   - Does Make hit Path A (`_pausedRovoDevToolCallStore` found) or the safety net (`enrichedContextDescription` + fresh `streamViaRovoDev`)?
   - If Make uses the safety net path, this confirms the hypothesis: the safety net works because `streamViaRovoDev` calls `/v3/stream_chat` which re-runs the agent with `deferred_results`
4. Document the key differences between Make's and plan mode's clarification flows

### Task 5: Verify Port Handle Reusability

If the fix involves switching from `replayViaRovoDev` to `streamViaRovoDev`:

1. Check whether `streamViaRovoDev` can reuse the same port handle that was reserved during the initial stream
2. Check whether the RovoDev Serve session state (conversation history, tool state) is preserved across calls to the same port
3. Determine whether `stream_chat` requires `set_chat_message` with a user message first, or if it can run with only `deferred_results` populated

### Task 6: Verify Plan Approval Has Same Issue

The plan approval step uses `exit_plan_mode` which may also be a deferred tool using `CallDeferred()`.

1. Check the RovoDev Serve source for `exit_plan_mode` tool implementation
2. If it also raises `CallDeferred()`, it has the same bug pattern
3. Document whether the fix needs to cover plan approval too

---

## S4. Fix Implementation

The fix depends on investigation findings. Two strategies are defined below — choose based on what Task 3-5 reveal.

### Strategy A: Replace `replay` with `stream_chat` (Preferred)

**Hypothesis confirmed by:** Task 3 showing replay doesn't deliver deferred results, Task 5 showing `stream_chat` can reuse the port.

**Approach:** After `set_chat_message` + `resume_tool_calls`, use `streamViaRovoDev` (which calls `/v3/stream_chat`) instead of `replayViaRovoDev` (which calls `/v3/replay`). The fresh `stream_chat` re-runs the agent, which picks up `deferred_results` from the session context.

**Key changes:**

| File | Change |
|------|--------|
| `backend/server.js` ~9200 | Replace `replayViaRovoDev(...)` call with `streamViaRovoDev(...)` using the same port handle |
| `backend/server.js` ~9200 | Pass `enrichedContextDescription` as context to `streamViaRovoDev` as a safety net |
| `backend/server.js` ~9200 | Ensure `onPausedToolCalls: handlePausedContinuation` is still passed so subsequent deferred tools (plan approval) are handled |

**Pseudocode:**
```javascript
// Path A (after set_chat_message + resume_tool_calls succeed):

// OLD:
// await replayViaRovoDev({
//     port, portHandle, skipReplayUntilToolCallId, ...streamCommonOptions
// });

// NEW:
await streamViaRovoDev({
	port: pausedToolCallRecord.port,
	portHandle: pausedToolCallRecord.handle,
	...streamCommonOptions,
	onPausedToolCalls: handlePausedContinuation,
	// No skipReplayUntilToolCallId needed — stream_chat re-runs the agent
});
```

**Risk:** `stream_chat` may require a user message to be queued first (via `set_chat_message` with a string). If `set_chat_message` was already called with `DeferredToolResponse` (not a string), the server might reject a second `set_chat_message` or `stream_chat` might fail without a queued user message. Investigation Task 5 must verify this.

**Mitigation if `stream_chat` needs a message:** Send a synthetic user message via `set_chat_message` that contains the answers as text, THEN call `stream_chat`. This effectively combines Path A's deferred result delivery with the safety net's text injection.

### Strategy B: Replay-Safe Fallback (If Strategy A Not Viable)

**Use when:** `stream_chat` cannot reuse the port, or requires a user message that conflicts with the deferred result.

**Approach:** Keep `replayViaRovoDev` but intercept the re-invoked `ask_user_questions` in `handlePausedContinuation` and suppress it by injecting the answers via `deny_message`.

**Key changes:**

| File | Change |
|------|--------|
| `backend/server.js` ~9015 | In `handlePausedContinuation`, detect when the replayed `ask_user_questions` matches an already-answered session |
| `backend/server.js` ~9015 | Instead of emitting a new question card, call `resume_tool_calls` with `deny_message` containing the formatted answers |
| `backend/server.js` ~9139 | Pass `clarificationSubmission` into `replayViaRovoDev` options so `handlePausedContinuation` has access to the answers |

**Pseudocode:**
```javascript
// Inside handlePausedContinuation, when interactivePart is found during replay:
if (interactivePart && isReplayAfterClarification && clarificationSubmission) {
	console.info("[DEFERRED-TOOL] Suppressing re-invoked ask_user_questions, injecting answers via deny_message");

	const answerText = buildClarificationResumeDenyMessage(clarificationSubmission);
	await rovoDevResumeToolCalls(port, {
		decisions: [{
			tool_call_id: interactivePart.tool_call_id,
			deny_message: answerText,
		}],
	});

	return { disconnect: false }; // Continue streaming — don't emit question card
}
```

**Tradeoff:** The agent receives answers as a `_suppress_tool_call` arg (text) instead of structured `dict[str, list[str]]`. The agent should still understand the answers from the text, but it's a workaround rather than proper deferred tool delivery.

### Strategy Selection Criteria

```
Investigation findings:
├── Task 5: stream_chat reusable with same port + deferred_results only?
│   ├── YES → Strategy A (preferred)
│   └── NO
│       ├── Can send synthetic user message + stream_chat?
│       │   ├── YES → Strategy A (modified: synthetic message)
│       │   └── NO → Strategy B (fallback)
```

### Additional Fix: `set_chat_message` Failure Handling

Regardless of strategy chosen, add response validation after `set_chat_message`:

```javascript
const setChatRes = await rovoDevRequest("POST", "/v3/set_chat_message", port, {
	message: deferredToolResponse,
}, { timeout: 30_000 });

if (setChatRes.status !== 200) {
	console.error("[DEFERRED-TOOL] set_chat_message failed", {
		status: setChatRes.status,
		body: JSON.stringify(setChatRes.data),
		toolCallId: deferredToolResponse.tool_call_id,
	});
	// Fall through to text injection approach (Strategy B behavior)
}
```

### Additional Fix: Block Partial Answer Submission

Ensure the question card UI requires all questions to be answered before the submit button is enabled. Check `components/blocks/question-card/` for the submit logic and add validation.

---

## S5. Plan Approval Flow

If Investigation Task 6 confirms that `exit_plan_mode` also uses `CallDeferred()`, apply the same fix pattern:

- If Strategy A: use `streamViaRovoDev` instead of `replayViaRovoDev` after delivering the plan approval result
- If Strategy B: intercept re-invoked `exit_plan_mode` in `handlePausedContinuation` and suppress it

The plan approval deferred result format should be verified against the RovoDev Serve `exit_plan_mode` tool's expected return type.

---

## S6. Validation

### Manual Test Plan

All tests performed with plan mode enabled.

| # | Step | Expected Result |
|---|------|-----------------|
| 1 | Send "Help me create an app" | Question card appears with clarification questions |
| 2 | Answer ALL questions, submit | Answer card appears (blue bubble). No identical question card re-appears |
| 3 | Wait for agent response | Agent references user's answers and generates a plan |
| 4 | Verify plan approval card | Plan approval card appears (not a repeated question card) |
| 5 | Approve the plan | Agent proceeds to implementation guidance |
| 6 | Check backend logs | `[DEFERRED-TOOL]` logs show successful Path A execution without re-invocation |
| 7 | Repeat steps 1-6 three times | No intermittent failures |

### Edge Cases

| Scenario | Expected Behavior |
|----------|-------------------|
| User takes >5 min to answer | TTL expiry error shown, user retries |
| Network error during `set_chat_message` | Fallback to text injection, agent proceeds |
| Agent asks follow-up questions (different from original) | New question card renders normally |
| User dismisses/skips question card | Skip flow works as before (already verified) |
| User submits with unanswered questions | Submit button disabled until all answered |

---

## S7. Key File Reference

| File | Relevance |
|------|-----------|
| `backend/server.js` ~9139-9207 | Path A implementation (primary fix target) |
| `backend/server.js` ~9015-9113 | `handlePausedContinuation` (replay event handler) |
| `backend/server.js` ~3814-3864 | `registerPausedRovoDevToolCall` (paused tool storage) |
| `backend/server.js` ~3794-3812 | `consumePausedRovoDevToolCall` (paused tool retrieval) |
| `backend/server.js` ~8808-8892 | Initial pause detection + question card emission |
| `backend/lib/rovodev-gateway.js` ~1559 | `replayViaRovoDev` implementation |
| `backend/lib/rovodev-gateway.js` ~streamViaRovoDev | `streamViaRovoDev` implementation |
| `backend/lib/rovodev-client.js` ~1347 | `/v3/replay` HTTP call |
| `backend/lib/rovodev-client.js` ~522 | `/v3/set_chat_message` HTTP call |
| `backend/lib/deferred-clarification.js` ~50 | `synthesiseDeferredToolResponseFromClarification` |
| `backend/lib/ask-user-questions-adapter.js` ~23 | Answer format adaptation |
| `components/blocks/question-card/` | Question card UI (partial answer blocking) |
| `components/projects/make/hooks/use-make-chat.ts` | Make comparison reference |
| `components/projects/future-chat/hooks/use-future-chat.ts` | Plan mode clarification submission |

**RovoDev Serve reference (read-only):**

| File | Relevance |
|------|-----------|
| `acra-21-mar/.../serve/v3/endpoints.py` ~426-438 | `set_chat_message` endpoint |
| `acra-21-mar/.../serve/v3/endpoints.py` ~143-147 | `resume_tool_calls` endpoint |
| `acra-21-mar/.../serve/v2/endpoints.py` ~740-757 | `replay_generator` (replay does not re-run agent) |
| `acra-21-mar/.../modules/tools/ask_user_questions.py` | Tool impl — raises `CallDeferred()` |
| `acra-21-mar/.../modules/pause_on_tool_calls_callback.py` | Callback impl — mechanism #1 |
| `acra-21-mar/.../serve/common/models.py` ~78-80 | `DeferredToolResponse` model |

---

## S8. Architecture Diagram (Updated)

```
User answers → submitClarification() → POST /api/chat-sdk
                                            │
                                            ▼
                                 normalizeClarificationSubmission()
                                            │
                            ┌───────────────┴────────────────┐
                            │ hasPausedClarificationToolCall? │
                            └───────┬──────────────┬─────────┘
                                  YES             NO
                                    │               │
                              [Path A]         [Safety Net]
                                    │          enrichedContextDescription
                                    │          streamViaRovoDev (/v3/stream_chat)
                                    │          (works — stream_chat re-runs agent)
                                    │
                    ┌───────────────┴───────────────┐
                    │ 1. set_chat_message            │
                    │    (stores deferred_results)   │
                    │ 2. resume_tool_calls            │
                    │    (unpauses callback #1)       │
                    │ 3. ???                          │
                    └───────────┬─────────────────────┘
                                │
               ┌────────────────┴────────────────┐
               │                                  │
          [CURRENT: replay]              [FIX: stream_chat or
           /v3/replay                     suppress+deny_message]
           Does NOT re-run agent          Re-runs agent with
           → agent never gets answers     deferred_results
           → re-invokes ask_user_questions  → agent gets answers
           → LOOP ✗                       → proceeds to plan ✓
```
