# Future Chat Unified Routing

## TL;DR

- Future Chat gets one unified routing module: `resolveRoutingDecision()`.
- Every assistant message carries an immutable `RoutingDecision` emitted as the authoritative `data-route-decision` data part.
- Everything goes through RovoDev. No standalone media intents — RovoDev uses skills to generate images/audio via AI Gateway internally.
- The classifier is a 3-way decision: `chat` vs `artifact_create` vs `genui`. `artifact_update` is free — determined entirely by UI state (the "editing artifact XYZ" pill).
- Clarification is not a routing intent. It's a pre-routing phase managed by RovoDev tools (`ask_user_question`, `exit_plan_mode`, `update_todo`).
- Voice delegation is rethought as part of this rewrite. GPT Realtime handles casual chat directly; only delegated requests enter the unified router.
- Scope: Future Chat only. Other surfaces (`sidebar-chat`, `fullscreen-chat`) keep current behavior.
- Migration: big bang rewrite in one focused effort.

## Current Architecture

> Reference material. Describes the system as it exists today before the rewrite.

### 1. Main text / tool-backed chat

- Dev flow is `Next proxy -> /api/chat-sdk -> Express -> RovoDev Serve`.
- Main entrypoint is `backend/server.js` `POST /api/chat-sdk`.
- This route is a staged router, in this rough order:
	- local model bypass
	- translation special-case
	- audio/image clarification sessions
	- planning and tool-first gates
	- smart-generation classification
	- media bypass
	- direct Google image shortcut
	- main interactive RovoDev stream
	- post-stream GenUI / image / audio extraction

### 2. Future Chat artifact path

- Future Chat does not rely only on the global `RovoChatProvider`.
- The Future Chat surface keeps its own thread, realtime, artifact, and persistence state in `components/projects/future-chat/hooks/use-future-chat.ts`.
- Delegated or typed Future Chat requests hit `/api/future-chat/chat`, which proxies into `/api/chat-sdk` only after first checking whether the prompt should become an artifact create/update action.
- Artifact routing is handled by:
	- `backend/lib/future-chat-artifact-intent.js`
	- `backend/server.js` `resolveFutureChatArtifactDecision(...)`
	- `backend/server.js` `handleFutureChatArtifactToolRequest(...)`

### 3. GPT Realtime voice path

- Realtime voice is a separate WebSocket system:
	- browser -> `/api/realtime/audio-conversation` -> Express -> OpenAI Realtime
- This path does not go through `/api/chat-sdk` for first-pass intent routing.
- OpenAI Realtime is instructed to call `delegate_to_rovo` when the user asks for workspace actions, artifacts, code changes, or product/data access.
- That delegation is handled in:
	- `backend/lib/openai-realtime.js`
	- `components/projects/future-chat/hooks/use-realtime-voice.ts`
	- `components/projects/future-chat/hooks/use-future-chat.ts`

### 4. Direct AI Gateway media paths

- Image generation fast paths go directly to Google AI Gateway.
- TTS/sound generation fast paths also go directly to Google AI Gateway.
- These bypass RovoDev entirely when the prompt is clearly media-oriented.

### 5. Current intent detection layers

- `backend/lib/prompt-intent.js` — heuristic, outputs `normal | genui | audio | image | both`
- `backend/lib/smart-generation-intent.js` — regex preclassification + LLM classifier with 1500ms timeout
- `backend/lib/future-chat-artifact-intent.js` — artifact create/update/chat with heuristic + LLM fallback
- `backend/lib/smart-audio-routing.js` — deprecated, outputs `CHAT | NEW_TASK | STEER`

---

## Design Decisions

All decisions below were made through a structured interview process.

### D1: Routing decision mutability

**Decision: Immutable per-message.**

Every assistant message gets one `RoutingDecision` locked before streaming begins. The decision does not change mid-stream. If the pre-stream classifier is uncertain, the system routes to RovoDev for clarification (question cards, plan cards) before locking a final artifact/genui decision on a later message.

If the user asks to build something and the classifier detects the intent, we honor that immediately and provide the best experience for that intent. If context is insufficient, RovoDev uses `ask_user_question` to interview the user until it has enough information, then uses `exit_plan_mode` to produce a plan card, and `update_todo` to create tasks before proceeding.

### D2: Presentation authority

**Decision: Backend declares presentation. Desktop-only for now.**

The backend chooses both `intent` and `presentation`. The frontend obeys the declared presentation. No frontend override logic.

Responsive behavior is a component-level concern (handled within the artifact panel component itself), not a routing concern. The focus is on getting the plumbing right first.

### D3: Failure mode

**Decision: Fallback to `{intent: "chat", presentation: "text"}`.**

If the unified router errors or times out, the request defaults to a basic chat experience. The user gets a degraded but functional text response. They're never stuck.

### D4: Migration strategy

**Decision: Big bang rewrite for Future Chat.**

One focused effort. Build `resolveRoutingDecision()`, update `/api/future-chat/chat`, update the frontend to trust `data-route-decision`, delete old scattered classifiers. One PR.

**Scope is Future Chat only.** Other surfaces (`sidebar-chat`, `fullscreen-chat`, shared thread messages) keep their current routing. They don't have the artifact panel or the "editing artifact XYZ" pill UX, so they don't need artifact routing. They can adopt the unified model later if it proves out.

### D5: Intent taxonomy

**Decision: Everything goes through RovoDev. No standalone media intents.**

| Intent | Description |
| --- | --- |
| `chat` | Normal text conversation |
| `artifact_create` | Build a new artifact (RovoDev generates it) |
| `artifact_update` | Edit an existing artifact (determined by UI pill state) |
| `genui` | Inline GenUI widget card (chart, table, etc.) |

Removed from the original proposal:
- `image` — RovoDev has skills for image generation via AI Gateway
- `audio` — RovoDev has skills for TTS/audio generation via AI Gateway
- `clarification` — not a routing intent (see D6)

Artifacts can contain image generation or TTS audio. RovoDev uses its skills internally to call AI Gateway when needed. RovoDev should also be able to use `find-skill` to discover relevant skills on the fly to solve problems it doesn't have a skill for.

### D6: Clarification flow

**Decision: Clarification is a pre-routing phase, not a routing intent.**

When classifier confidence is below the threshold, the request is routed to RovoDev as `{intent: "chat", presentation: "text"}`. RovoDev then manages the multi-step clarification flow using its tools:

1. RovoDev uses `ask_user_question` → frontend renders question card (from tool call result)
2. User answers → RovoDev continues interviewing as needed
3. RovoDev uses `exit_plan_mode` → frontend renders plan card (from tool call result)
4. RovoDev uses `update_todo` → task list created
5. User approves plan
6. RovoDev generates artifact → this message carries `{intent: "artifact_create", presentation: "artifact_preview"}`

Question cards and plan cards render from RovoDev tool call results, NOT from the `RoutingDecision`. The `RoutingDecision` for clarification messages is `{intent: "chat", presentation: "text"}` — because that's literally what they are.

### D7: Confidence gating

**Decision: Binary threshold. High = lock immediately. Low = clarify via RovoDev.**

No intermediate "proceed but monitor" state. Either the classifier is confident enough to lock the decision, or it triggers the clarification flow (D6). There is no in-between state because we don't have designs to cater for it.

### D8: Artifact update detection

**Decision: Entirely UI-driven. The "editing artifact XYZ" pill is the signal.**

When an artifact is open, the chat composer shows a pill: "editing artifact XYZ". This makes the context unambiguous:

- **Pill showing** → always `artifact_update`. No classification needed. Frontend sends `activeArtifact: {id, title, kind}` in the request body.
- **No pill** → normal routing. Classifier decides between `chat`, `artifact_create`, `genui`.

The chat thread associated with an artifact can be deleted. When the user reopens the same artifact, they get a blank-slate chat interface with the pill showing. There's no confusion about what they're editing.

### D9: Artifact versioning

**Decision: Update = new version of same artifact. Create = new artifact.**

- `artifact_update` creates a new version under the same artifact ID
- `artifact_create` creates an entirely new artifact

This is already implemented. "Start over" or "try again" while the pill is showing → `artifact_update` (new version). Explicit new creation (no pill) → `artifact_create`.

### D10: GenUI routing

**Decision: Pre-stream classification. One flat `genui` intent. Spec determines widget type.**

GenUI is distinct from artifacts:
- GenUI = small, inline widget card in the chat thread (chart, table, data view)
- Artifact = full-size, editable, opens the side artifact panel

The router classifies `genui` as one intent. The specific widget type (bar chart, data table, etc.) is determined by the GenUI spec that RovoDev generates. The router doesn't sub-classify GenUI types.

### D11: Artifact kind

**Decision: RovoDev determines the artifact kind during generation, not the router.**

The RoutingDecision says `artifact_create` but not what kind (react-component, code, document). RovoDev figures that out from the prompt. The kind appears in `data-artifact-result` when generation completes.

The artifact panel shows a generic loading state until the kind is known.

### D12: Protocol / transport

**Decision: Upgrade existing `data-route-decision` data part from telemetry to authoritative.**

The `data-route-decision` data part already exists in the codebase:
- Backend emits it via `writer.write({type: "data-route-decision", data: {...}})`
- Frontend reads it via `getLatestDataPart(message, "data-route-decision")`
- Types are in `lib/rovo-ui-messages.ts` (`RouteDecisionMeta`)

Changes:
1. Expand `RouteDecisionMeta` to match the new `RoutingDecision` type
2. Frontend renders FROM this data part instead of inferring presentation from scattered part inspection
3. Backend emits it BEFORE content parts

No new SSE event types, no custom HTTP headers. The existing data part pipeline handles everything.

### D13: Per-message decisions

**Decision: Each assistant message gets its own immutable RoutingDecision.**

During a clarification conversation, early messages are `{intent: "chat", presentation: "text"}`. When RovoDev commits to building an artifact, that specific message carries `{intent: "artifact_create", presentation: "artifact_preview"}`. Each decision is immutable per-message.

### D14: Classifier design

**Decision: Consolidated two-layer classifier in one module.**

Replace three separate files with one `resolveRoutingDecision()` module:

**Layer 1 — Deterministic (< 10ms):**
- If `context.activeArtifact` exists → `artifact_update` (no classification)
- If regex matches obvious patterns:
	- `build|create|make` + code-related nouns → `artifact_create`
	- `show|chart|visualize` + data nouns → `genui`
- Otherwise → ambiguous, fall through

**Layer 2 — LLM fallback (< 1500ms, only if needed):**
- Structured prompt to fast model: "Is this: chat, artifact_create, or genui?"
- Returns `{intent, confidence}`
- If confidence < threshold → default to `chat` (safe fallback)

### D15: Classifier input

**Decision: Current prompt + recent history + active artifact context.**

The classifier receives:
- The current prompt text
- Recent message history from the same chat session (helps with prompts like "do the same thing for the signup page")
- Active artifact metadata (from the pill state)
- Origin (`text` or `voice`)
- Voice metadata (if voice-originated)

In the same chat session, a user can receive artifacts, GenUI cards, and plain text responses. Having recent history as extra context helps infer the next best action.

### D16: Voice architecture

**Decision: Two-tier model. GPT Realtime handles casual chat; delegates to RovoDev when needed.**

Voice is fundamentally a normal chat conversation in audio form. Realtime conversations can be more chatty and casual. GPT Realtime is a totally different model from RovoDev.

- **Casual voice chat** → stays on GPT Realtime directly. No routing, no RovoDev.
- **Workspace actions, artifacts, code** → GPT Realtime calls `delegate_to_rovo` → enters the unified routing pipeline.

The unified router never sees pure casual voice chat. It only sees requests that GPT Realtime already decided need RovoDev.

### D17: Voice delegation rethink

**Decision: Include in this rewrite. Redesign `delegate_to_rovo` handoff.**

Changes:
1. `delegate_to_rovo` passes full metadata: `transcribedText`, `intentType`, `urgency`, `referencedFiles`, `conversationSummary`, `origin: "voice"`
2. `delegateToRovodev()` calls `/api/future-chat/chat` instead of a custom code path
3. `resolveRoutingDecision()` handles voice requests with voice-biased confidence thresholds (voice transcription is noisier than typed text)
4. GPT Realtime casual chat is untouched

All realtime voice is converted to text. The classifier evaluates the transcribed text, but is aware that voice-originated text can be noisier or more conversational.

### D18: Cancellation

**Decision: Cancel discards partial output.**

When the user cancels mid-generation:
1. Backend aborts the RovoDev stream
2. Partial artifact/genui is discarded
3. Artifact panel closes (or never opened if cancelled early)
4. Chat shows a "generation stopped" message
5. Next user message starts a fresh routing cycle

Simple model: cancel = nothing was created. User starts over.

### D19: Error handling

**Decision: Errors shown in chat using existing `data-widget-error` pattern.**

When generation fails (RovoDev timeout, crash, bad output):
1. Backend catches the error
2. Emits `data-widget-error` with error details
3. Chat thread shows an error card: "Something went wrong."
4. Artifact panel closes or never opens
5. User sends a new message → fresh routing cycle

No retry logic, no fallback to a different intent. Reuses existing error infrastructure.

### D20: Concurrent messages / message queuing

**Decision: Messages are queued, not blocked.**

Follows the existing multiports queuing pattern. When the user sends a message while an artifact is generating:
1. The message is queued
2. After the current tool call completes, the queued message is injected
3. RovoDev processes it as part of the same conversation
4. The user can steer the generation mid-flight by sending follow-up messages

The user doesn't need to wait for everything to finish. They can look at intermediate tool invocations and steer the behavior by queuing messages.

---

## Revised Contract

### RoutingContext (input to classifier)

```ts
interface RoutingContext {
	prompt: string;
	origin: "text" | "voice";
	activeArtifact?: {
		id: string;
		title: string;
		kind: string;
	};
	voiceMetadata?: {
		intentType?: string;
		urgency?: string;
		conversationSummary?: string;
	};
	recentHistory?: Array<{
		role: "user" | "assistant";
		content: string;
		intent?: string;
	}>;
	threadId?: string;
}
```

### RoutingDecision (output, emitted as `data-route-decision`)

```ts
interface RoutingDecision {
	intent: "chat" | "artifact_create" | "artifact_update" | "genui";
	presentation: "text" | "genui_card" | "artifact_preview";
	confidence: number;
	reason: string;
	origin: "text" | "voice";
}
```

**What was removed from the original proposal and why:**

| Removed field/value | Reason |
| --- | --- |
| `backend` field | Always `rovodev` now — unnecessary |
| `needsClarification` | Clarification is a pre-routing phase (D6), not a decision field |
| `image` intent | RovoDev skills handle image generation via AI Gateway |
| `audio` intent | RovoDev skills handle TTS/audio generation via AI Gateway |
| `clarification` intent | Not a routing decision — it's RovoDev's tool-driven flow (D6) |
| `question_card` presentation | Rendered from RovoDev tool call results, not routing decisions |
| `image_card` presentation | No standalone image intent (D5) |
| `audio_card` presentation | No standalone audio intent (D5) |
| `openai-realtime` backend | GPT Realtime handles casual chat outside the router (D16) |
| `ai-gateway-*` backends | RovoDev calls AI Gateway internally via skills (D5) |
| `local-model` backend | Out of scope for Future Chat unified routing |

---

## Implementation Plan

> Big bang rewrite. One focused effort targeting Future Chat only.

### Step 1: Build `resolveRoutingDecision()` module

- New file: `backend/lib/resolve-routing-decision.js`
- Implements the two-layer classifier (D14):
	- Layer 1: deterministic heuristic (< 10ms)
	- Layer 2: LLM fallback (< 1500ms, only when ambiguous)
- Accepts `RoutingContext`, returns `RoutingDecision`
- Handles voice-biased confidence thresholds when `origin === "voice"`

### Step 2: Update `/api/future-chat/chat` to use `resolveRoutingDecision()`

- Replace the current scattered routing logic in the Future Chat endpoint
- `resolveRoutingDecision()` runs before streaming starts
- If `activeArtifact` is present in the request → `artifact_update` (no classification)
- Emit `data-route-decision` as the first data part before any content

### Step 3: Update frontend to trust `data-route-decision`

- Replace `RouteDecisionMeta` in `lib/rovo-ui-messages.ts` with the new `RoutingDecision` type
- Future Chat rendering reads the authoritative `data-route-decision` to determine:
	- `"text"` → render as normal text chat
	- `"genui_card"` → expect and render inline widget card
	- `"artifact_preview"` → open artifact side panel
- Stop inferring presentation from scattered data part inspection

### Step 4: Frontend sends artifact metadata

- When the "editing artifact XYZ" pill is showing, include `activeArtifact: {id, title, kind}` in the request body to `/api/future-chat/chat`
- Include `recentHistory` (last N messages) for classifier context

### Step 5: Redesign `delegate_to_rovo` voice handoff

- Update `delegate_to_rovo` tool definition to pass full metadata:
	- `transcribedText`, `intentType`, `urgency`, `referencedFiles`, `conversationSummary`
- Update `delegateToRovodev()` to call `/api/future-chat/chat` with `origin: "voice"` and `voiceMetadata`
- `resolveRoutingDecision()` applies voice-biased confidence thresholds

### Step 6: Delete deprecated code

| What to delete | File |
| --- | --- |
| `/api/realtime/classify-intent` endpoint | `backend/server.js` |
| `AI_GATEWAY_ALLOWED_USE_CASES` | `backend/server.js` |
| `prompt-intent.js` (logic moves to `resolve-routing-decision.js`) | `backend/lib/prompt-intent.js` |
| `smart-generation-intent.js` (logic moves to `resolve-routing-decision.js`) | `backend/lib/smart-generation-intent.js` |
| `future-chat-artifact-intent.js` (artifact_update is UI-driven now) | `backend/lib/future-chat-artifact-intent.js` |
| `smart-audio-routing.js` (deprecated) | `backend/lib/smart-audio-routing.js` |
| Stale `RouteDecisionReason` / `OutputExperience` types | `lib/rovo-ui-messages.ts` |
| Any other redundant routing code discovered during the rewrite | Various |

### Step 7: Write prompt-to-decision test matrix

- New file: `backend/lib/resolve-routing-decision.test.js`
- Test cases:

| Prompt | Context | Expected Intent | Expected Presentation |
| --- | --- | --- | --- |
| `"hello"` | no artifact | `chat` | `text` |
| `"build a login page"` | no artifact | `artifact_create` | `artifact_preview` |
| `"make the button red"` | artifact active | `artifact_update` | `artifact_preview` |
| `"show Q3 revenue"` | no artifact | `genui` | `genui_card` |
| `"asdfghjkl"` | no artifact | `chat` | `text` |
| `"create something"` | no artifact | low confidence → `chat` | `text` |
| `"build me a dashboard"` | voice origin | `artifact_create` (or low confidence → clarify) | `artifact_preview` |
| `"do the same thing for signup"` | recent history has artifact_create | `artifact_create` | `artifact_preview` |

- Run with: `node --test backend/lib/resolve-routing-decision.test.js`

---

## Key Flows

### Flow A: High-confidence artifact creation

```
User: "build me a login page"
  → resolveRoutingDecision(): confident artifact_create
  → RoutingDecision locked: {intent: "artifact_create", presentation: "artifact_preview"}
  → data-route-decision emitted
  → Frontend opens artifact panel (loading state)
  → RovoDev generates artifact
  → data-artifact-result emitted with {kind: "react-component"}
  → Frontend renders artifact preview
```

### Flow B: Low-confidence → clarification → artifact

```
User: "build me something"
  → resolveRoutingDecision(): low confidence
  → RoutingDecision: {intent: "chat", presentation: "text"}
  → RovoDev asks questions via ask_user_question tool
  → Frontend renders question card (from tool call result)

User answers: "a dashboard with charts"
  → RovoDev asks more questions or generates plan
  → RovoDev uses exit_plan_mode → plan card rendered
  → RovoDev uses update_todo → task list created

User approves plan
  → RovoDev generates artifact
  → This message: {intent: "artifact_create", presentation: "artifact_preview"}
  → Frontend opens artifact panel
```

### Flow C: Artifact update (pill showing)

```
User: "make the button red" (pill: "editing Login Page")
  → Frontend sends: {prompt: "...", activeArtifact: {id: "doc_123", ...}}
  → resolveRoutingDecision(): activeArtifact present → artifact_update (no classification)
  → RoutingDecision: {intent: "artifact_update", presentation: "artifact_preview"}
  → RovoDev updates artifact
  → New version created under same artifact ID
```

### Flow D: GenUI inline card

```
User: "show me Q3 revenue"
  → resolveRoutingDecision(): confident genui
  → RoutingDecision: {intent: "genui", presentation: "genui_card"}
  → RovoDev generates GenUI spec
  → data-widget-data emitted with {type: "bar-chart", ...}
  → Frontend renders inline chart card in chat thread
```

### Flow E: Voice delegation

```
User speaks: "build me a dashboard"
  → GPT Realtime transcribes text
  → GPT Realtime calls delegate_to_rovo tool
  → delegateToRovodev() sends:
    POST /api/future-chat/chat {
      prompt: "build me a dashboard",
      origin: "voice",
      voiceMetadata: {intentType: "artifact", ...}
    }
  → resolveRoutingDecision() with voice-biased thresholds
  → Normal artifact creation flow proceeds
```

### Flow F: Message queuing during generation

```
User: "build a login page"
  → artifact generation begins
User types: "also add dark mode support" (while generating)
  → message is queued
  → current tool call completes
  → queued message is injected into the RovoDev session
  → RovoDev processes the steering message
  → artifact generation continues with dark mode incorporated
```

---

## What Stays Unchanged

- **GPT Realtime casual voice chat** — stays on OpenAI Realtime, no routing
- **Other chat surfaces** (`sidebar-chat`, `fullscreen-chat`, `/api/chat-sdk`) — keep current routing
- **RovoDev Serve pool management** — pinned ports, wait-for-turn, unhealthy marking all stay
- **Data part protocol** — `data-widget-data`, `data-artifact-result`, `data-widget-error` all stay
- **Tool call rendering** — question cards, plan cards, and other tool results render as they do today
- **Artifact versioning** — existing version management stays

## Bottom Line

The routing rewrite is narrower than it first appears. The classifier only needs to make a 3-way decision (`chat` / `artifact_create` / `genui`), because `artifact_update` is free from UI state and all media generation goes through RovoDev skills. The main change is making `data-route-decision` authoritative instead of telemetry, and having the frontend trust it for rendering decisions.
