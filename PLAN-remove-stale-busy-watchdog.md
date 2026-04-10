# Plan: remove the stale-busy watchdog from the VPK RovoDev pool

## Context

This plan removes VPK's Express-side stale-busy watchdog from the pool layer.
The current ACRA Serve implementation tracks active work explicitly with
`chat_in_progress` and a queued `current_chat_request`, returns `409` when a
second turn arrives during an active chat, and exposes `/v3/cancel` as the
recovery path for an in-progress turn. `GET /healthcheck` reports auth and MCP
readiness. It does not report whether a chat turn is busy, stale, or hung.

VPK currently adds a second inference layer that marks a leased port unhealthy
after 120 seconds of no observed activity. That inference can evict valid
long-running turns, especially wait-for-turn, paused-tool, or otherwise quiet
requests. The goal is to remove that timer-based eviction while keeping the
explicit failure handling that already matches Serve behavior: request-level
stream and sync timeouts, cancel cleanup, unhealthy quarantine, readiness
probing, and port restart flows.

## Important tradeoff

This change intentionally removes the pool's only timer-based recovery path for
a leaked busy lease. After this change, a busy entry remains busy until one of
the explicit release paths runs:

- `handle.release()`
- `handle.releaseAsUnhealthy()`
- `pool.shutdown()`

The periodic pool health check still probes `available` and `unhealthy`
entries, but it continues to skip `busy` and `cooldown` entries. That is
acceptable only because VPK already has explicit request-level timeout, cancel,
and stuck-port recovery paths, and this plan is to rely on those real signals
instead of inactivity inference.

## What to remove

This section lists the concrete cleanup work. The removal must be complete so
no stale-watchdog-only plumbing remains in types, fallback handles, or tests.

### 1. `backend/lib/rovodev-pool.js`

This file contains the stale-busy watchdog. Remove the watchdog fields, handle
methods, and health-check block, but leave the rest of the pool lifecycle
intact.

Remove entirely:

- `DEFAULT_STALE_BUSY_TIMEOUT_MS`
- `staleBusyTimeoutMs` and `onStaleBusyPort` from `createRovoDevPool()`
- `lastBusyActivityAt` and `busyTimeoutMs` from `PortEntry`
- `touch` and `setBusyTimeoutMs` from `PortHandle`
- initialization of `lastBusyActivityAt` and `busyTimeoutMs` in the initial
  entries array
- initialization of `lastBusyActivityAt` and `busyTimeoutMs` when
  `updatePorts()` adds new entries
- `entry.lastBusyActivityAt = now` and
  `entry.busyTimeoutMs = staleBusyTimeoutMs` in `markEntryBusy()`
- resets of `lastBusyActivityAt` and `busyTimeoutMs` in `clearBusyLease()`
- the `touch()` and `setBusyTimeoutMs()` handle implementations
- the entire stale-busy block at the top of `runHealthChecks()`

Update wording:

- change the `markReserved()` comment so it no longer says reserved handles are
  "exempt from stale-busy detection"

Keep:

- `DEFAULT_HEALTH_CHECK_INTERVAL_MS`
- the standard `runHealthChecks()` loop for `available` and `unhealthy` entries
- `unhealthyQuarantineMs`
- `releaseAsUnhealthy()`
- `cooldown` and `waitForReady`
- `reserved` and `markReserved`

### 2. `backend/server.js`

This file wires the pool to the backend. Remove the stale-busy callback, but
keep readiness and queue-drain behavior.

Remove:

- `onStaleBusyPort` from the `createRovoDevPool()` call
- the stale-port `rovoDevCancelChat()` best-effort callback attached to that
  hook

Keep:

- `waitForReady: waitForPortReady`
- `onPortAvailable`
- `waitForPortReady()`
- `POST_STREAM_COOLDOWN_MS`
- `READY_PROBE_INTERVAL_MS`
- `READY_PROBE_MAX_ATTEMPTS`

### 3. `backend/lib/rovodev-gateway.js`

This file carries the stale-watchdog plumbing into stream and sync calls.
Remove the pool-lease refresh and override code, but keep request-level
timeouts and unhealthy release behavior.

Remove:

- `touch` and `setBusyTimeoutMs` from the acquire-handle JSDoc
- `touch: () => {}` and `setBusyTimeoutMs: () => {}` from the no-pool fallback
  handle
- `touch` and `setBusyTimeoutMs` passthroughs in the provided-handle wrapper
- the `handle.setBusyTimeoutMs(...)` call after port acquisition in
  `streamViaRovoDev()`
- the `handle.setBusyTimeoutMs(...)` call after port acquisition in
  `generateTextViaRovoDev()`
- `noteHandleActivity()` and every call site that exists only to refresh the
  stale-busy lease
- comments and test names that describe "extending" or "refreshing" the busy
  lease

Keep:

- `idleTimeoutMs` where it is passed through to `sendMessageStreaming()` as a
  client-side stream silence timeout
- `releaseAsUnhealthy`
- retry logic for `409` conflicts
- `WAIT_FOR_TURN_TIMEOUT_MS`
- explicit cancel paths and stuck-port handling

### 4. `backend/lib/rovodev-pool.test.js`

The pool tests must reflect the new pool contract rather than the removed
watchdog behavior.

Remove:

- `stale busy port is marked unhealthy after staleBusyTimeoutMs`
- `touch refreshes busy activity and prevents stale eviction`
- `setBusyTimeoutMs overrides the stale watchdog for the current lease`
- `release clears busy activity metadata before the next lease`

Add or replace with:

- a regression test that a `busy` lease survives multiple health-check
  intervals until it is explicitly released
- the existing acquire, release, unhealthy quarantine, and recovery coverage

### 5. `backend/lib/rovodev-gateway.test.js`

The gateway tests must stop asserting stale-watchdog behavior.

Remove or rewrite:

- `streamViaRovoDev extends and refreshes the busy lease for wait-for-turn
  streams`
- `generateTextViaRovoDev extends the busy lease for wait-for-turn sync
  requests`
- any mocks or assertions for `touch` or `setBusyTimeoutMs`

Keep:

- wait-for-turn acquire timeout forwarding
- preferred and avoided port forwarding
- abort cleanup, unhealthy release, deferred-tool continuation, and other
  non-watchdog behavior

## What to keep

This plan is narrow. Do not change the failure-handling paths that already
match Serve behavior.

- `rovodev-client.js` first-event and idle stream timeouts
- `rovodev-client.js` sync timeout handling
- `cancelChat()` cleanup paths
- `releaseAsUnhealthy()` and unhealthy quarantine
- `rovodev-port-recovery.js`
- stuck-port recovery in `server.js`
- deferred tool reservation and replay behavior

## Verification

Verification must prove both that the stale watchdog is gone and that the
explicit failure paths still work.

1. Run `node --test backend/lib/rovodev-pool.test.js` and confirm the updated
   pool tests pass.
2. Run `node --test backend/lib/rovodev-gateway.test.js` and confirm the
   updated gateway tests pass.
3. Run `pnpm run lint`.
4. Run `pnpm tsc --noEmit`.
5. Manually verify a normal chat flow after starting the dev server.
6. Manually verify a wait-for-turn or paused-tool flow that holds a port longer
   than the old 120-second watchdog window, then confirm there are no
   stale-busy warnings and no forced unhealthy transition caused only by
   inactivity.
7. Manually verify at least one real failure path, such as an abort or cancel
   failure, and confirm the existing unhealthy-release or restart logic still
   recovers the port.
