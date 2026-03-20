# Plan: Enable Deferred Tools (`ask_user_questions` + `exit_plan_mode`) in VPK

## Context

RovoDev Serve has two built-in deferred tools — `ask_user_questions` and `exit_plan_mode` — that are **always registered** in the agent but **disabled at runtime** unless the caller passes `enable_deferred_tools=true` as a query parameter to `/v3/stream_chat`.

The VPK backend never passes this parameter, so the agent cannot see or call either tool. When a user asks the agent to use `ask_user_questions`, it replies "that tool isn't available in my current toolset." The instruction injected via `rovo/config.js` (`REQUEST_USER_INPUT_INSTRUCTION`) tells the agent to use the tool, but the tool itself is hidden.

The backend already has **complete interception and resume logic** for both deferred tools (question card widgets, plan approval widgets, paused tool store, `resumeToolCalls` flow, context injection fallback). The only missing piece is the query parameter.

## Changes

### 1. `backend/lib/rovodev-client.js` (~line 1190)

Accept `enableDeferredTools` from options and set the query param on the `/v3/stream_chat` URL.

```js
// ~line 1190, add alongside existing pauseOnCallToolsStart extraction:
const enableDeferredTools =
    options.enableDeferredTools === true ||
    options.enable_deferred_tools === true;

// ~line 1242, after the pauseOnCallToolsStart block:
if (enableDeferredTools) {
    url.searchParams.set("enable_deferred_tools", "true");
}
```

### 2. `backend/lib/rovodev-gateway.js` (~line 1390)

Pass `enableDeferredTools: true` when calling `sendMessageStreaming`, tied to whether the caller provided an `onPausedToolCalls` handler (i.e., the caller is ready to handle deferred tool pauses).

```js
// ~line 1390, the options object passed to sendMessageStreaming:
{
    onTimingStage,
    sessionId,
    pauseOnCallToolsStart: typeof onPausedToolCalls === "function",
    enableDeferredTools: typeof onPausedToolCalls === "function",  // ← ADD
}
```

This means deferred tools are only enabled for call sites that can handle them (call site 3 at `server.js:8562` — the main chat handler). Call sites 1, 2, and 4 (title generation, translation, skip-question) don't pass `onPausedToolCalls` and won't be affected.

## Files Modified

| File | Change |
|------|--------|
| `backend/lib/rovodev-client.js` | Accept + pass `enable_deferred_tools` query param |
| `backend/lib/rovodev-gateway.js` | Pass `enableDeferredTools: true` when `onPausedToolCalls` is provided |

## What This Enables

- `ask_user_questions` — agent can call it, backend emits interactive question card widget, user answers, answers flow back via paused-tool resume or context injection
- `exit_plan_mode` — agent can call it, backend emits plan approval widget, user approves/rejects, decision flows back the same way

## Verification

1. `pnpm run lint` + `pnpm tsc --noEmit` — confirm no regressions
2. Start dev environment: `pnpm run dev`
3. Open Future Chat, send a message like "brainstorm with me ideas on a new app"
4. Verify the agent uses `ask_user_questions` tool and an interactive question card widget appears (instead of plain-text questions or a `spec` card fallback)
5. Answer the question card and verify the agent receives the answers and continues
6. Test plan mode: ask the agent to plan something complex, verify `exit_plan_mode` produces a plan approval widget
