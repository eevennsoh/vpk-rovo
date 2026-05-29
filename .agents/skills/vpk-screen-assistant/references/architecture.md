# Screen Assistant (Clicky) — Architecture Map & Plan Reconciliation

This is the verified ground truth for the Clicky / web screen-assistant feature,
reconciled against `CLICKY_SCREEN_ASSISTANT_PLAN.md`. Read this before editing so
you build from what the code actually does, not from the plan's aspirational
naming.

## Feature names

- The user-facing feature is **Clicky** — an AI cursor companion / screen
  assistant. Identifiers use `clicky*`.
- "Screen assistant" is the **studio-only** structured model name
  (`Studio*`-prefixed types, `screen_assistant_result` payloads).
- There is **no** `visualCursorEnabled` or `screenAssistantEnabled` flag. The
  only gate is `isClickyActive` (`= state !== "off"`).

## Critical structural fact: two diverged copies

Clicky exists as **two parallel trees** that began as copies and have diverged.
`studio` is the newer, richer copy; `rovo` is the older `[POINT:...]` copy. The
backend relay is shared and already serves both.

| Concern | `components/projects/rovo/...` | `components/projects/studio/...` | Divergence |
| --- | --- | --- | --- |
| State machine | `hooks/use-clicky.ts` | `hooks/use-clicky.ts` | import path only |
| Voice bridge | `hooks/use-clicky-voice.ts` | `hooks/use-clicky-voice.ts` | studio adds screen-assistant snapshot + structured prompt (~114 lines) |
| Realtime transport | `hooks/use-realtime-voice.ts` | `hooks/use-realtime-voice.ts` | studio adds `screen_assistant_result` (~60 lines) |
| POINT parser | `lib/clicky-point-parser.ts` | `lib/clicky-point-parser.ts` | identical |
| Screen capture | `lib/clicky-screen-capture.ts` | `lib/clicky-screen-capture.ts` | identical |
| Cursor/overlay/bubble/history | `components/clicky/*` | `components/clicky/*` | identical → ~12 lines |
| Shell wiring | `components/rovo-app-shell.tsx` | `components/rovo-app-shell.tsx` | heavily diverged (~2000 lines; studio holds the grounding + agent-draft pipeline) |

The structured model lives **only** in studio:
`components/projects/studio/lib/studio-screen-assistant.ts` (+ `.test.js`).
It defines `SCREEN_ASSISTANT_TARGET_ATTR` (`data-screen-assistant-target`),
`SCREEN_ASSISTANT_AGENT_FIELD_ATTR` (`data-agent-field`),
`StudioScreenAssistantPoint`/`Target`/`Snapshot`, and the functions
`getStudioScreenAssistantPointerContext`,
`getStudioScreenAssistantVisibleTargets` (DOM scan, limit 40),
`groundStudioScreenAssistantTarget` (id → fieldId → label → pointer),
`normalizeAgentDraftPatch`, and `createStudioScreenAssistantSnapshot`.
**Rovo has no grounding model** — there is no `rovo-screen-assistant.ts`.

## Genuinely shared pieces (already consolidated)

- `components/projects/shared/components/rovo-composer-send-controls.tsx` —
  emits `data-screen-assistant-target` via `screenAssistantTargetPrefix`.
- `components/ui-custom/agent.tsx` — emits `data-screen-assistant-target` via
  `screenAssistantTargetId`.
- `lib/rovo-ui-messages.ts` (`RovoUIMessage`, `RovoDataParts`) and
  `lib/rovo-app-types.ts` — `studio-screen-assistant.ts` depends on
  `RovoDataParts["agent-result"]`.

The studio composer passes `screenAssistantTargetPrefix="studio-composer"`; the
studio agent-config panel passes `"studio-agent-config"`. **The rovo composer
passes no prefix** — so rovo emits no visible targets today.

## Backend relay (shared)

- `backend/lib/openai-realtime.js` — `class RealtimeSession` opens
  `Browser ──WS──> Express ──WS──> OpenAI Realtime API`. Dual auth (direct
  OpenAI key or AI Gateway ASAP JWT). Model/URL come from `getRealtimeConfig()`
  in `backend/lib/ai-gateway-helpers.js` — **not hardcoded** to `gpt-realtime`.
  Session config uses `semantic_vad` + `gpt-4o-mini-transcribe`.
- `backend/server.js` only **wires** it: `require("./lib/openai-realtime")`,
  WS upgrade handler for `/api/realtime/audio-conversation` (token-gated via
  `verifyRuntimeSocketUpgrade`, scope `realtime:audio-conversation`).
- Token route: `app/api/realtime/audio-conversation-token/route.ts` +
  backend `GET /api/realtime/audio-conversation-token`.
- Tests: `backend/lib/openai-realtime.test.js`,
  `backend/lib/runtime-socket-security.test.js`.

### Vision + parsing (server-side)

- `_handleClickyVision` routes Clicky screenshots to **Claude via AI Gateway**
  (`streamBedrockGatewayManualSse`), injecting structured `screenAssistant`
  context as text, then re-injects the spoken text into OpenAI for TTS while
  suppressing that response's transcript (`_clickyTtsResponseId`).
- `parseScreenAssistantVisionResponse` tries structured JSON first
  (` ```json `, ` ```screen_assistant_result `, or `[SCREEN_ASSISTANT:{...}]`),
  normalizes `point`/`target`/`agentDraftPatch`, emits
  `{ type: "screen_assistant_result", turnId, text, point?, target?, agentDraftPatch? }`,
  and **falls back** to legacy `[POINT:x,y:label]` (`POINT_TAG_RE`) when no JSON
  is present.

### Tools / function calls (already present)

- `SESSION_TOOLS` = `end_voice_session` and `delegate_to_rovo`.
- `RESPONSE_FUNCTION_CALL_ARGUMENTS_DONE` sends `function_call_output` back to
  OpenAI and forwards `{ type: "function_call", name, arguments, callId }` to
  the client. Client handles it in `use-realtime-voice.ts`.

## Composer API (both routes)

There is **no imperative `setComposer`/`submitComposer`**. Text is set via the
controlled `prefillText` prop (`controller.textInput.setInput(prefillText)`);
submission is the shell's `onSubmit` callback (which also calls
`clickyStartProcessing`). To "set composer text" Clicky uses the shell's
`setPrefillText`; to submit, it invokes the shell submit path.

## Plan claims — verdicts

ACCURATE: duplication across routes; relay in `backend/lib`; studio structured
vs rovo legacy POINT; Claude vision + OpenAI TTS; `delegate_to_rovo` /
`end_voice_session` + `function_call_output`; no imperative composer API.

CORRECT BEFORE BUILDING:
- "Decouple `visualCursorEnabled` from `screenAssistantEnabled`" — those flags
  do not exist. The real task is: formalize the single `isClickyActive` gate
  into cursor-visibility vs voice/screen-context concerns, and bring rovo up to
  studio's partial decoupling (studio's `use-clicky-voice.ts` already keeps a
  separately-started voice session alive on cursor deactivate via
  `connectedForClickyRef`; **rovo still unconditionally disconnects**).
- "Preserve `clicky_text_completed`" — it is **dead client code**; the backend
  emits `screen_assistant_result` / `response_done`, never
  `clicky_text_completed`. Don't build new behavior on it; treat removal as
  cleanup, not a compatibility surface.
- "Move Studio's model into shared types" — there is no shared module yet.
  Promote `studio-screen-assistant.ts` (`Studio*` types) into a shared,
  route-neutral module with adapters; do not assume one exists.
- Don't hardcode `gpt-realtime`; the model is config-driven via
  `getRealtimeConfig()`.

## Target shared interfaces (from the plan, validated as new work)

- `ScreenAssistantSnapshot`, `ScreenAssistantRegion`, `ScreenAssistantTarget`,
  `ScreenAssistantAction` (whitelisted app actions only — never raw DOM
  click/type), `ScreenAssistantAdapter` (`getSnapshot()`, `groundTarget()`,
  `executeAction()`).
- Protocol additions: client→server `function_call_output` (extend beyond
  delegate-only), server→client route-safe screen-assistant tool calls;
  keep legacy `[POINT]` parsing temporarily during migration.
- New app-owned Realtime tools: `show_screen_cue`, `set_composer_text`,
  `submit_composer`, `apply_agent_draft_patch` (where supported),
  `delegate_to_rovo` (exists).
- Paint-region UX: a paint/region button beside the AI cursor control;
  next drag paints a freeform region storing path points, viewport rect,
  screenshot-relative rect, and target hints; region persists until next
  region, Escape, or a voice/tool clear.
