# Backend Simplification: RovoDev-First Architecture

## Context

The current backend has accumulated complexity from the multi-port pinning project and the two-pass GenUI pipeline. This creates fragile layering: `allowFallback` semantics are ambiguous, `portIndex` propagation threads through frontend → backend → pool → gateway, and a second LLM call generates json-render specs from RovoDev's text output. The goals are:

1. **RovoDev owns interactive chat** — all tool orchestration, clarification, and UI spec generation
2. **AI Gateway owns background helpers** — title generation, follow-up suggestion pills, route classifier
3. **Simple port pool** — remove pinned-port assignment, just acquire any idle port
4. **Single-pass GenUI** — RovoDev emits json-render specs directly, no second LLM call
5. **Clean error UX** — inline error cards, optimistic message rollback

GPT-realtime is out of scope — it's an independent WebSocket relay (`backend/lib/openai-realtime.js`) that doesn't interact with RovoDev port routing.

---

## 1. Backend Routing Cleanup

### 1a. Replace `allowFallback` with explicit `backendPreference`

**Files:** `backend/server.js`, `backend/lib/rovodev-gateway.js`, `backend/lib/smart-generation-gateway-options.js`

- Add a `backendPreference: "rovodev" | "ai-gateway"` field to request options
- `"rovodev"` → acquire from pool, stream via RovoDev
- `"ai-gateway"` → call AI Gateway directly, never touch pool
- Remove `allowFallback`, `resolvePreferredBackend()`, and all ambiguous fallback logic
- When RovoDev is fully down, return a hard error (no silent AI Gateway degradation for interactive chat)

### 1b. Route background tasks to AI Gateway

**File:** `backend/server.js`

These use `backendPreference: "ai-gateway"`:
- Thread title generation
- Suggested follow-up question pills
- Route classifier

These stay on `backendPreference: "rovodev"`:
- Interactive `/api/chat-sdk` main turns
- Clarification (RovoDev uses `ask_user_questions` tool)
- Plan-mode / agent-mode interactions
- Cancel/retry flows

### 1c. Keep existing media routing

Image (`` ```image `` fence → Google AI Gateway) and audio (`` ```audio `` fence → Google TTS) markers are already clean. Translation uses MCP tool calls through RovoDev. No changes needed.

---

## 2. Port Pool Simplification

### 2a. Remove pinned-port system

**Delete entirely:**
- `backend/lib/rovodev-port-assignment.js` — sharding, strict assignment, candidate resolution

**Remove from `backend/lib/rovodev-pool.js`:**
- `acquireByIndex()` method
- Strict port binding logic
- Port candidate sharding

**Simplify to:**
- `pool.acquire()` → returns any idle port (first available)
- `pool.release(port)` → cooldown → health check → available
- Keep health check interval (30s) and stale-busy timeout (120s)

### 2b. Request-to-port Map for cancel

**File:** `backend/server.js`

- Create `activeRequests = new Map()` — maps `threadId → { port, abortController }`
- On stream start: `activeRequests.set(threadId, { port, abortController })`
- On stream end/error: `activeRequests.delete(threadId)`
- Cancel endpoint: look up `activeRequests.get(threadId)` to find the port, send cancel to that port
- Replaces all `portIndex`-based cancel routing

### 2c. Remove portIndex from frontend

**Files:**
- `components/projects/future-chat/hooks/use-future-chat.ts` — remove `portIndex` from request bodies
- `components/projects/future-chat/components/future-chat-shell.tsx` — remove `portIndex` state
- `components/projects/future-chat/page.tsx` — remove `portIndex` prop
- `components/projects/future-chat/lib/api.ts` — remove `portIndex` from API calls

### 2d. Prevent unhealthy ports at the source

- Frontend: disable send button while a stream is active on the same thread (prevent double-send causing 409)
- Backend: ensure `AbortSignal` propagation on client disconnect to free port promptly
- Keep existing cooldown (500ms) + readiness probe (20 attempts × 100ms) after stream end
- Keep background health check interval to detect crashed processes

---

## 3. Single-Pass GenUI (RovoDev Emits Specs Directly)

### 3a. Inject json-render catalog into RovoDev system context

**Files:** `backend/server.js`, `backend/lib/genui-system-prompt.js`

- Load `generated-catalog-prompt.json` at startup
- Prepend catalog prompt to RovoDev's system instructions for interactive chat turns
- Add instruction: "When the response benefits from interactive UI, emit a json-render spec in a `` ```spec `` code fence block"
- RovoDev naturally decides when plain text vs spec is appropriate

### 3b. Detect and validate specs from RovoDev output

**File:** `backend/server.js`

- After RovoDev streams text, check for `` ```spec `` blocks using existing `analyzeGeneratedText()` from `backend/lib/genui-spec-utils.js`
- If valid spec found → emit as `data-widget-data` with type `genui-preview`
- If no spec found → stream as plain text (no fallback LLM call)
- Use existing `validateSpec()` and `autoFixSpec()` for safety

### 3c. Keep genui-chat-handler as standalone utility

**File:** `backend/lib/genui-chat-handler.js`

- Remove the automatic two-pass invocation from the main chat flow in `server.js`
- Keep the file as a standalone utility — useful if the app runs without RovoDev (e.g., AI Gateway-only mode in the future)
- Remove the call to `generateGenuiFromRovodevResponse()` from the main `/api/chat-sdk` handler

---

## 4. Frontend Error Handling

### 4a. Optimistic message rollback

**File:** `components/projects/future-chat/hooks/use-future-chat.ts`

- Track the optimistic user message ID from `appendLocalUserMessage()`
- If `sendMessage()` fails before any assistant stream starts (pre-stream failure):
  - Remove the optimistic user message from local thread state
  - Clear pending run state
  - Do not persist the failed message to the thread record

### 4b. Inline error card for RovoDev down

**Files:** `components/projects/future-chat/components/future-chat-messages.tsx`, `lib/rovo-ui-messages.ts`

- When backend returns a typed error (e.g., `code: "ROVODEV_UNAVAILABLE"`), render an inline error card in the chat thread
- Card shows: friendly message, retry button, optional details toggle
- Replace raw JSON/error string rendering with structured error widget
- Remove `ROVODEV_STRICT_PORT_UNHEALTHY` error code (no longer applicable without pinned ports)
- New error codes: `ROVODEV_UNAVAILABLE` (all ports down), `ROVODEV_BUSY` (all ports busy, retry)

---

## 5. Work-Summary Hardening

### 5a. Zero-tool-call failure path

**File:** `backend/lib/tool-first-genui-policy.js`

- When a work-summary turn completes with zero relevant tool observations, emit a specific failure response instead of generic retry text
- Suggested recovery actions (as question card options):
  - "Show Jira work only"
  - "Show Confluence work only"
  - "Retry with my Atlassian user/site ID"

### 5b. Execution logging

**File:** `backend/server.js`

- Log for work-summary turns: attempts, tool starts/results/errors, zero-tool-call cause
- Include: resolved port, request duration, tool names attempted

---

## Key Files to Modify

| File | Change |
|------|--------|
| `backend/server.js` | Routing cleanup, activeRequests Map, spec detection, remove GenUI two-pass, error codes |
| `backend/lib/rovodev-gateway.js` | Remove pinned-port retry loops, simplify acquire, backendPreference |
| `backend/lib/rovodev-pool.js` | Remove acquireByIndex, simplify to acquire-any |
| `backend/lib/rovodev-port-assignment.js` | **DELETE** |
| `backend/lib/smart-generation-gateway-options.js` | Remove allowFallback, use backendPreference |
| `backend/lib/genui-chat-handler.js` | Keep as standalone, remove auto-invocation |
| `backend/lib/tool-first-genui-policy.js` | Zero-tool-call failure path |
| `components/projects/future-chat/hooks/use-future-chat.ts` | Remove portIndex, optimistic rollback |
| `components/projects/future-chat/components/future-chat-shell.tsx` | Remove portIndex state |
| `components/projects/future-chat/components/future-chat-messages.tsx` | Inline error card |
| `components/projects/future-chat/lib/api.ts` | Remove portIndex from API calls |

---

## Verification

1. `node --test backend/lib/*.test.js` — all backend tests pass
2. `pnpm run lint` — no lint errors
3. `pnpm tsc --noEmit` — no type errors
4. Manual: start with `pnpm run rovodev`, send a chat message → verify RovoDev handles it on any port
5. Manual: start with `pnpm run rovodev -- 3`, open multiple panels → verify each acquires an idle port
6. Manual: cancel a running stream → verify cancel reaches the correct port via activeRequests Map
7. Manual: kill the RovoDev process → verify inline error card appears (not raw JSON)
8. Manual: trigger a work-summary with no tool results → verify targeted recovery suggestions appear
9. Manual: verify title generation and follow-up pills still work via AI Gateway
10. Manual: verify image/audio fence markers still route to Google AI Gateway
