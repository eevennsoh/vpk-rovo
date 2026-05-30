# Voice "one message, one turn" + Queue/Send-immediately mode

## Context

Two related problems in the `/studio` chat, both about *how user input becomes a turn*:

1. **Voice double-message.** A single spoken sentence sometimes becomes **two** user chat bubbles (with slightly different wording), and can trigger two/cut-off AI replies. Root causes (confirmed in code): (a) OpenAI `semantic_vad` splits one utterance into two `transcription_completed` events — a known OpenAI issue (filed Oct 2025); (b) a **client-side browser `SpeechRecognition` fallback runs concurrently** with OpenAI's server transcription, and once a turn completes the cross-source guard resets, so both ASR engines emit — hence the slightly-different wording. Nothing downstream de-dupes by content (`appendRealtimeMessage` mints a fresh id, `upsertRealtimeMessage` blindly appends).

2. **No queue/immediate control.** Today the queue logic only governs *typed* text (queue when the AI is busy), and live voice always interrupts. The user wants a user-facing **Queue vs Send-immediately** mode (text only), plus a per-item **"send now"** override in the queue card.

Decisions captured from interview:
- **Voice fix = full, best-practice fix**: relay owns turn-taking (`create_response:false`, coalesce split transcripts on a silence window → **one** user message + **one** `response.create`), `eagerness:'low'` to reduce fragmentation, kill the browser-SR race. **Scoped to `/studio` only** (the relay is shared with `/rovo`).
- **Queue toggle scope = text only.** Voice keeps its current barge-in behavior.
- **Mode control lives in the chat header "..." overflow menu** (always reachable), as a two-option radio. Per-item **arrow** lives in the queue card.
- **Send-immediately semantics** = interrupt the running AI turn and dispatch now, **jumping ahead** of any already-queued items (older queued items are preserved and drain afterward).
- **Persistence = global, localStorage** (`usePersistentState`).
- Scope: `/studio` only (do not touch the `/rovo` mirrors).

Best-practice sources: [OpenAI VAD guide](https://platform.openai.com/docs/guides/realtime-vad), [Realtime conversations (manual create_response)](https://developers.openai.com/api/docs/guides/realtime-conversations), [semantic_vad burst bug](https://community.openai.com/t/bug-report-inconsistent-speech-started-speech-ended-behavior-with-semantic-vad-realtime-api/1363428), [AssemblyAI endpointing](https://www.assemblyai.com/blog/turn-detection-endpointing-voice-agent), [Deepgram endpointing](https://developers.deepgram.com/docs/understanding-end-of-speech-detection).

---

## Workstream A — Voice: one message, one turn (studio-scoped)

The relay (`backend/lib/openai-realtime.js`) is shared, so **all new behavior is gated behind a per-session flag that only studio turns on**. Rovo never sends a `session_update`, so it keeps the relay default and is unaffected.

### A1. Studio opts into manual turn-taking (client → relay)
- File: `components/projects/studio/hooks/use-realtime-voice.ts`, in the `case "session_ready":` handler (after `setVoice("listening")`).
- Send once:
  ```ts
  sendWsMessage({ type: "session_update", config: { turn_detection: {
    type: "semantic_vad", eagerness: "low", create_response: false, interrupt_response: true,
  } } });
  ```
- The relay's `_handleClientSessionUpdate` already passes `turn_detection` through verbatim (covered by an existing test in `backend/lib/openai-realtime.test.js`).

### A2. Relay: per-session flag + transcript coalescing + single response (gated)
- File: `backend/lib/openai-realtime.js`.
- Add `this._manualTurnTaking = false` in the constructor; set it `true` in `_handleClientSessionUpdate` when `clientConfig.turn_detection?.create_response === false`. **Do not edit `REALTIME_TURN_DETECTION` or `_sendSessionUpdate`** (shared default → would hit rovo).
- In the `conversation.item.input_audio_transcription.completed` handler:
  - When `_manualTurnTaking === false` → keep the current 1:1 forward (rovo path, unchanged).
  - When `true` → **buffer** the transcript text and (re)arm a silence-window timer (`MANUAL_TURN_COALESCE_MS`, default **800ms**, tunable; research floor ~300ms, ~1000ms for noisy). On each new completed event within the window, append (`prev + " " + next`) and reset the timer. On timer expiry: forward a **single** merged `transcription_completed` to the client, then call `this._requestResponse()` **once**. Add a hard-cap safety flush (e.g. 4s) so a stuck buffer always resolves.
  - `_requestResponse`/`_activeResponseId`/`_pendingResponseCreate` already serialize this against any in-flight response, and the `conversation_already_has_active_response` race is already swallowed as a warning.

### A3. Relay: barge-in under manual mode
- With `create_response:false`, OpenAI no longer auto-interrupts via `interrupt_response`, so the relay must drive it.
- In the `input_audio_buffer.speech_started` handler: when `_manualTurnTaking && this._activeResponseId`, emit `response.cancel` (constant `OPENAI_EVENT.RESPONSE_CANCEL` already exists, currently unused) to stop the model mid-reply. Clear any pending coalesce buffer/timer for the prior turn. Keep forwarding `speech_started` to the client. When `_manualTurnTaking === false`, leave the forward-only behavior (rovo unchanged).
- Client-side `stopPlayback()` flush on `speech_started` already exists in both hooks — keep it (harmless, shared).

### A4. Client: kill the browser-SR race + don't double-drive responses (studio only)
- File: `components/projects/studio/hooks/use-realtime-voice.ts`.
- **Browser-SR race:** introduce a session-scoped `serverTranscriptionActiveRef` set `true` on the first server `transcription_delta`/`transcription_completed` and **never reset within the session** (the current bug is that `hasReceivedServerDeltaRef` resets per `transcription_completed`). Gate `scheduleBrowserTranscriptCompletionFallback` so it can never emit a completion when `serverTranscriptionActiveRef.current` is true. (Simplest viable alternative: don't start browser `SpeechRecognition` at all once server transcription is confirmed available.)
- **Single response source:** when manual mode is active, suppress the client's own `scheduleResponseCreateFallback` / any client-sent `response_create` so the **relay** is the sole driver of `response.create` (prevents a second reply). The studio hook knows it's manual because it sent `create_response:false`.

### A Files
- `components/projects/studio/hooks/use-realtime-voice.ts` (A1, A4) — studio only.
- `backend/lib/openai-realtime.js` (A2, A3) — all changes gated on `_manualTurnTaking`.
- `backend/lib/openai-realtime.test.js` — add cases: coalescing merges N completed events into one forwarded message + one response.create; barge-in emits `response.cancel` only in manual mode; rovo/default path still forwards 1:1.
- **Do not touch:** `components/projects/rovo/hooks/use-realtime-voice.ts`, `REALTIME_TURN_DETECTION`, `_sendSessionUpdate`, `getRealtimeConfig`.

---

## Workstream B — Queue vs Send-immediately mode (text only, studio-scoped)

### B1. Persisted global mode
- Reuse `usePersistentState<"queue" | "immediate">("rovo-app-send-mode", "queue")` from `components/projects/control-plane/lib/use-persistent-state.ts` (SSR-safe localStorage, cross-tab sync).
- Own it in `useRovoApp` (`components/projects/studio/hooks/use-rovo-app.ts`) and expose `sendMode` + `setSendMode` on the hook's return, so both the header menu and `submitPrompt` can read it. Default `"queue"` = today's behavior.

### B2. Mode control in the chat header "..." menu
- File: `components/projects/studio/components/rovo-app-header.tsx` (studio copy only — it's a separate file from rovo's).
- Add `sendMode` + `onSendModeChange` to `RovoAppHeaderProps`; thread them from the shell's `<RovoAppHeader … />` render (`rovo-app-shell.tsx`), reading `chat.sendMode`/`chat.setSendMode`.
- Inside the existing `DropdownMenuContent`, after the `CONTROL_PLANE_HEADER_SURFACES` group, add a `DropdownMenuSeparator` + `DropdownMenuLabel` ("Send mode") + a `DropdownMenuRadioGroup value={sendMode} onValueChange={onSendModeChange}` with two `DropdownMenuRadioItem`s: **Queue** (`value="queue"`) and **Send immediately** (`value="immediate"`), each with a short `description`. Mirror `components/blocks/chatgpt/components/model-selector.tsx`. Import the radio primitives from `@/components/ui/dropdown-menu`.

### B3. Honor the mode at the submit decision
- File: `components/projects/studio/hooks/use-rovo-app.ts`, in `submitPrompt` (the `shouldEnqueue` gate) and the parallel block in `submitDelegation`.
- New logic when `sendMode === "immediate"`:
  - If the thread is **idle** → `dispatchPromptNow(...)` as today (no change).
  - If the thread is **busy** (or has queued items) → **interrupt + dispatch now**: `await interruptActiveTurn({ source: "send-immediately" })` then `dispatchPromptNow(...)`. Do **not** enqueue, and **do not clear** the existing queue (older queued items remain and drain after, via the normal `kickQueue`/`processQueue` on turn end). This implements "jump ahead now."
  - Reuse existing primitives: `interruptActiveTurn` (already used for voice barge-in) + `dispatchPromptNow` (already used by `processQueue`).
- When `sendMode === "queue"` → unchanged (current `shouldEnqueue` behavior).
- Optimistic-bubble logic in the shell (`shouldShowOptimisticPrompt = !chat.shouldQueueNextSubmission && …`) should also treat immediate-mode submits as non-queued so the user bubble shows immediately; verify/adjust.

### B4. Per-item "send now" arrow in the queue card
- File: `components/projects/studio/components/rovo-app-composer.tsx`, inside the existing `<QueueItemActions>` (next to the remove `DeleteIcon` button). Add a `Button` with an arrow/send icon (e.g. `@atlaskit/icon/core/arrow-up` or the existing send glyph), `aria-label="Send now"`, revealed on hover like the remove button.
- New composer prop `onSendQueuedPromptNow?: (id: string) => void` (beside `onRemoveQueuedPrompt`).
- Implement in `useRovoApp` beside `removeQueuedPrompt`: look up the queued action by id (handle both `kind: "prompt"` → `dispatchPromptNow` and `kind: "delegation"` → `dispatchDelegationNow`), `removeQueuedAction(threadId, id)`, and if the thread is busy `await interruptActiveTurn(...)` first, then dispatch that item now. Remaining queued items stay and drain afterward.

### B Files
- `components/projects/studio/hooks/use-rovo-app.ts` (B1, B3, B4)
- `components/projects/studio/components/rovo-app-header.tsx` (B2)
- `components/projects/studio/components/rovo-app-shell.tsx` (thread `sendMode` props to header)
- `components/projects/studio/components/rovo-app-composer.tsx` (B4 arrow button + prop)
- **Do not touch** the `/rovo` mirrors.

---

## Edge cases & risks
- **Queue-processor collision (B3/B4):** if `processQueue` is mid-dispatch (`queueProcessorRunningRef`) when an immediate interrupt fires, the interrupted in-flight item may re-enqueue (it already `prepend`s on error). Add a transient "immediate dispatch in progress" guard so the processor doesn't re-dispatch ahead of the user's immediate message; let the older queue resume after the immediate turn completes.
- **Single response source (A2/A4):** the relay coalesce-timer must be the *only* thing that calls `response.create` in manual mode; the client must not also nudge one, or the AI replies twice.
- **Coalesce latency:** 800ms adds a short pause before the AI answers voice. Tunable constant; revisit after testing.
- **Manual barge-in (A3):** `response.cancel` + client `stopPlayback` must both fire so audio stops promptly; verify no orphaned `_activeResponseId` (cleared on `response.done`/cancel) blocks the next turn.
- **Rovo isolation:** verify rovo voice + rovo queue behavior is byte-identical before/after (it sends no `session_update`; its header/composer/hook files are untouched).

## Out of scope
- Applying the queue/immediate mode to **voice** (explicitly text-only).
- Porting any of this to `/rovo`.
- Changing the relay's shared default turn-detection.

## Verification
- **Unit:** `node --test backend/lib/openai-realtime.test.js` — new coalescing/manual-response + barge-in cases pass; default (rovo) path unchanged. `pnpm run typecheck` + `pnpm exec eslint <changed files>`.
- **Manual, `/studio` (restart backend — no watch mode):**
  1. Voice: speak a sentence with a mid-pause → exactly **one** user bubble and **one** AI reply. Speak again rapidly to barge in → previous reply stops, new turn starts cleanly.
  2. Header "..." → toggle **Send immediately**; while the AI is generating, submit text → it interrupts and answers the new text immediately. Pre-queue 2 items in Queue mode, switch to Immediate, submit a new one → new one jumps ahead; the 2 older items still drain afterward in order.
  3. Queue card → hover an item → **arrow** sends that item now (interrupting if busy); remaining items stay and drain.
  4. Reload → mode persists (localStorage).
- **Rovo regression:** open `/rovo`, confirm voice still auto-replies (no added latency) and typed queue behavior is unchanged.
