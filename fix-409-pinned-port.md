# Route background tasks to AI Gateway & remove pinned-port plumbing

## Context

Background tasks (GenUI tool-first, clarification classifier, question card generation) currently route through RovoDev via `generateTextViaGateway` with `excludePinnedPorts: true`. With pool size 1, this falls back to the pinned port, gets a 409 from the active interactive chat, and marks the port unhealthy — breaking interactive chat too.

These tasks are stateless single-shot generations. They should always use AI Gateway directly and never touch RovoDev.

## Changes

### 1. Route background callers to AI Gateway (`backend/server.js`)

Three callers currently use `excludePinnedPorts: true`. Change each to force AI Gateway by setting `allowFallback: true` and removing `excludePinnedPorts`:

**a) `generateSmartGenuiResult` (~line 1111)**
```js
// Before
const rawText = await generateTextViaGateway({
    ...
    ...buildSmartGenerationGatewayOptions({
        provider,
        excludePinnedPorts: true,
    }),
    gatewayUrl,
});

// After
const rawText = await generateTextViaGateway({
    ...
    allowFallback: true,
    provider,
    gatewayUrl,
});
```

**b) Smart clarification classifier (~line 5462)**
```js
// Before
const classifierText = await generateTextViaGateway({
    ...
    ...buildSmartGenerationGatewayOptions({
        provider,
        excludePinnedPorts: true,
    }),
});

// After
const classifierText = await generateTextViaGateway({
    ...
    allowFallback: true,
    provider,
});
```

**c) Clarification question card (`gatewayOptions` ~line 5507)**
```js
// Before
gatewayOptions: {
    ...buildSmartGenerationGatewayOptions({
        provider,
        excludePinnedPorts: true,
    }),
    signal: clarificationAbort.signal,
},

// After
gatewayOptions: {
    allowFallback: true,
    provider,
    signal: clarificationAbort.signal,
},
```

### 2. Remove `excludePinnedPorts` from gateway options helper (`backend/lib/smart-generation-gateway-options.js`)

Remove the `excludePinnedPorts` parameter and its logic from `buildSmartGenerationGatewayOptions`.

### 3. Remove pinned-port plumbing from gateway (`backend/lib/rovodev-gateway.js`)

Remove:
- `BACKGROUND_ON_PINNED_PORT_TIMEOUT_MS` constant (line 33)
- `_pinnedPortCount` variable (line 41)
- `setPinnedPortCount()` function (line 56)
- `excludePinnedPorts` from `acquirePort()` params and the `acquireExcluding` branch (lines 74-92)
- `isBackgroundOnPinnedPort` detection block (lines 1617-1637)
- `effectiveRetryTimeoutMs` override (lines 1629-1631)
- `excludePinnedPorts` from `generateTextViaRovoDev` params (line 1582)
- `shouldExcludePinned` / `wantsExcludePinned` logic (lines 1602-1603)
- `setPinnedPortCount` from exports (line 1844)

### 4. Remove `acquireExcluding` from pool (`backend/lib/rovodev-pool.js`)

Remove:
- `excludingWaiters` array (line 82)
- `acquireExcluding()` function (lines 381-430)
- Excluding-waiter notification logic in `tryNotifyWaiter` (lines 184-214)
- Excluding-waiter drain in `shutdown` (lines 712-713)
- `acquireExcluding` from return object (line 723)

### 5. Remove `setPinnedPortCount` call from server startup (`backend/server.js`)

Remove:
- `setPinnedPortCount` import (line 64)
- `PINNED_PORT_COUNT` constant (line 491)
- `setPinnedPortCount(PINNED_PORT_COUNT)` call (line 392)

### 6. Remove `excludePinnedPorts` from `generateTextViaGateway` (`backend/server.js`)

Remove the `excludePinnedPorts` parameter from `generateTextViaGateway` (line 759) and its pass-through to `generateTextViaRovoDev` (line 772).

## Verification

1. `node --test backend/lib/*.test.js`
2. `pnpm run lint && pnpm tsc --noEmit`
3. Start with pool size 1: `pnpm run rovodev`
4. Send a chat message — interactive chat works normally, no 409 errors
5. Trigger a background task (e.g., message that fires clarification classifier) — routes through AI Gateway, no pool contention
6. Confirm no `excludePinnedPorts` or `pinnedPort` references remain: `grep -r "excludePinnedPorts\|pinnedPort\|_pinnedPortCount\|PINNED_PORT_COUNT" backend/`
