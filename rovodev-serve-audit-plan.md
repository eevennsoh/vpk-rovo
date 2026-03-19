# RovoDev Serve contract audit and migration plan

This document captures the agreed plan for auditing VPK's RovoDev Serve
integration and migrating it toward the documented Serve contract. The goal is
to preserve the current VPK chat UX where possible, while removing reliance on
undocumented Serve behavior.

## Summary

- Treat `docs/rovodev-serve` as the contract of record.
- Migrate VPK to the documented V3 workflow.
- Preserve the current VPK chat UX where it can be rebuilt on documented Serve
  endpoints.
- Focus remediation on session ownership, plan-mode handling, and deferred-tool
  or question-card flow.

## Key changes

- Rework the Serve transport in `backend/lib/rovodev-client.js`,
  `backend/lib/rovodev-gateway.js`, and `backend/server.js` to use only
  documented V3 primitives:
  - `POST /v3/set_chat_message`
  - `GET /v3/stream_chat`
  - documented SSE events
  - documented session endpoints
  - documented `default` and `ask` agent modes only
- Replace the current implicit plan-mode path with documented planning:
  - use `enable_deep_plan` on `set_chat_message` for plan-generating turns
  - stop depending on undocumented `plan` agent mode as a required runtime
    feature
  - keep `/api/agent-mode` only for documented `default` and `ask`, or narrow
    it to an internal frontend state API if Serve no longer owns planning mode
- Remove undocumented deferred-tool coupling:
  - stop relying on `enable_deferred_tools=true`
  - stop treating object-shaped `message` payloads as a documented way to
    answer tool calls
  - replace the current question-card and approval continuation flow with
    documented `pause_on_call_tools_start=true` plus
    `POST /v3/resume_tool_calls`
- Introduce explicit Serve session ownership per VPK thread and task:
  - persist Serve `session_id` for each interactive thread
  - create or restore the correct Serve session before continuing a thread
  - use separate ephemeral sessions for background generations that must not
    inherit chat history
  - stop relying on whichever hidden session happens to live on the acquired
    port
- Tighten readiness and health semantics:
  - treat only documented healthy states as ready for normal traffic
  - do not treat every HTTP 200 from `/healthcheck` as ready
  - surface `pending user review`, entitlement failures, and startup or
    transient states explicitly
- Handle documented streamed warnings instead of silently dropping them:
  - log and optionally surface model fallback, rate-limit, and context-pruning
    warnings
  - keep `exception` as a hard failure path

## Public interfaces and type changes

- Change internal RovoDev gateway and client calls from a raw combined string
  to a structured request shape with:
  - `message`
  - optional `context`
  - optional `enableDeepPlan`
  - session identifier or session strategy
- Persist Serve session metadata in thread or run state so Future Chat can
  resume the correct Serve conversation instead of reusing port-local state.
- If `/api/agent-mode` remains, narrow its contract to documented modes.
  Planning should move out of that API.
- Update the message-building layer in `rovo/config.js` so frontend history is
  no longer redundantly stuffed into every Serve message once documented
  session restore is in place.

## Test plan

- Verify normal V3 chat still streams correctly with `set_chat_message` then
  `stream_chat`.
- Verify deep-plan requests use `enable_deep_plan` and preserve the existing
  VPK plan widget UX.
- Verify question-card and approval flows work through documented pause and
  resume tool control only.
- Verify two independent chat threads never inherit each other's Serve history,
  even when they reuse the same port pool.
- Verify background tasks do not contaminate interactive thread sessions.
- Verify `healthcheck` states `healthy`, `unknown`, `pending user review`, and
  entitlement failures map to correct backend behavior.
- Verify streamed `warning` and `exception` events are handled distinctly.
- Re-run the existing RovoDev unit tests and add coverage for:
  - session create and restore ownership
  - deep-plan request shaping
  - pause and resume tool continuation
  - warning-event propagation

## Assumptions and defaults

- `docs/rovodev-serve` is the authoritative contract, even if the current local
  Serve binary supports additional behavior.
- Preserve current VPK UX when it can be rebuilt on documented Serve endpoints.
- Prefer V3 everywhere and do not add new V2 dependencies.
- If a current UX cannot be reproduced with documented Serve behavior, degrade
  gracefully rather than keep an undocumented backend dependency.
