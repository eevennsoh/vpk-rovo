# Simplify Backend Ownership for Future Chat Work-Summary + Pinned-Port Recovery

## Summary

- The main fix should be architectural simplification, not more RovoDev-specific knobs.
- The app should own exactly one backend decision per request:
	- `sessionful` request -> route to RovoDev
	- `stateless helper` request -> route to AI Gateway
- Once a request is on the RovoDev path, RovoDev Serve should own the internal execution decisions for that turn: tool choice, agent behavior, model behavior, and retries inside the session.
- The app must still own transport-level concerns that RovoDev does not know about:
	- pinned `portIndex` / thread affinity
	- health checks and recovery
	- optimistic UI rollback
	- user-facing fallback copy
- The current bug is still two failures on one thread:
	- the work-summary turn ended with `tool_first_no_relevant_result` because no relevant Teamwork Graph/Jira/Confluence tool activity was observed
	- the resend kept `portIndex: 0` and then failed pre-stream with `ROVODEV_STRICT_PORT_UNHEALTHY`
- Treat [fix-409-pinned-port.md](./fix-409-pinned-port.md) as only a partial fix:
	- it removed old pinned-port avoidance plumbing
	- it did not create a clear `AI Gateway only` path for helper generations
	- `allowFallback: true` is still ambiguous because it means `try RovoDev first`

## Key Changes

- Backend routing contract in `backend/server.js`:
	- Replace ambiguous helper semantics like `allowFallback: true` with an explicit backend selector, for example:
		- `backendPreference: "rovodev-session" | "ai-gateway"`
	- Default interactive chat turns to `"rovodev-session"`.
	- When `"ai-gateway"` is selected, bypass `resolvePreferredBackend()` and never acquire or touch a RovoDev port.
	- Limit `resolvePreferredBackend()` to top-level product behavior only, if the app still wants a global degrade mode when RovoDev is fully unavailable before a turn begins.

- Sessionful vs stateless request split:
	- Route these through `ai-gateway` only because they do not require live RovoDev session state:
		- route classifier
		- smart GenUI post-processing
		- clarification classifier
		- clarification question-card generation
		- title generation
		- suggested question generation
		- other standalone summarizers/classifiers
	- Route these through `rovodev-session` only because they depend on session continuity:
		- interactive `/api/chat-sdk` main turns
		- deferred tool responses
		- plan-mode / agent-mode interactions
		- pinned-port cancel/retry flows
		- attached run streaming

- Remove helper-call RovoDev config from stateless paths:
	- Stop passing `portIndex` into helper generations.
	- Stop using `allowFallback` as the way to request AI Gateway helper execution.
	- Do not reintroduce background-task pinned-port avoidance flags.
	- Keep helper call sites simple: the app chooses AI Gateway and that is the whole decision.

- Keep minimal RovoDev config only where the app truly owns transport:
	- strict `portIndex` binding for interactive Future Chat turns
	- one-shot unhealthy-port recovery before returning a user-visible error
	- cancel and agent-mode endpoints that resolve the exact pinned port
	- no silent mid-thread failover from RovoDev to AI Gateway

- Strict unhealthy-port recovery in `backend/server.js` and `backend/lib/rovodev-port-recovery.js`:
	- In `/api/chat-sdk`, if the required pinned port is `unhealthy`, do not immediately return `503`.
	- Attempt one synchronous `restartRovoDevPort({ port, refreshAvailability, cancelChat, healthCheck, getListeningPidsForPort })`.
	- Recompute pool status and strict assignment once after recovery.
	- If the port recovers, continue the turn normally on the same pinned port.
	- If it does not recover, return a typed recoverable error payload:
		- `code: "ROVODEV_STRICT_PORT_UNHEALTHY"`
		- `portIndex`
		- `requiredPort`
		- `recoverable: true`
		- `retryAfterMs: 3000`
		- `userMessage: "RovoDev is recovering for this chat panel. Retry in a few seconds."`

- Frontend resend/error handling in `components/projects/future-chat/hooks/use-future-chat.ts`:
	- Track the optimistic user message id returned by `appendLocalUserMessage`.
	- If `sendMessage()` fails before the backend accepts the turn or any assistant stream starts, remove that optimistic user message from local thread state.
	- Clear pending run state on that pre-stream failure path.
	- Use typed backend error metadata for `ROVODEV_STRICT_PORT_UNHEALTHY` instead of rendering the raw backend JSON/error string.
	- Prevent failed optimistic sends from being persisted into the thread record.

- Tool-first work-summary hardening:
	- Keep RovoDev responsible for tool orchestration inside the interactive work-summary turn.
	- When the turn completes with zero relevant Teamwork Graph/Jira/Confluence tool observations, emit a work-summary-specific failure path instead of the generic `retry with explicit resource identifiers` text.
	- Replace the suggested-question set with targeted recovery actions:
		- `Show Jira work only`
		- `Show Confluence work only`
		- `Retry with my Atlassian user/site ID`
	- If the backend can infer likely site/user ambiguity, route into the existing clarification-card path instead of plain text.
	- Expand execution logging for this path:
		- attempts / retries
		- relevant tool starts / results / errors
		- last relevant tool / error category
		- pinned `portIndex`
		- resolved port
		- zero-tool-call final cause

- Documentation alignment:
	- Update `fix-409-pinned-port.md` to reflect the new design principle:
		- the app chooses `RovoDev session` vs `AI Gateway`
		- RovoDev is no longer the default backend for helper generations
		- pinned-port recovery remains an app responsibility

## Test Plan

- Backend tests:
	- `generateTextViaGateway` and `streamTextViaGateway` honor explicit `"ai-gateway"` routing and never touch RovoDev when that mode is selected.
	- Interactive `/api/chat-sdk` turns still use strict pinned-port routing.
	- `/api/chat-sdk` retries one unhealthy pinned-port recovery before failing.
	- Recovery failure returns the typed `ROVODEV_STRICT_PORT_UNHEALTHY` payload.
	- Work-summary zero-tool-call failure emits the new targeted recovery suggestions and logs the correct cause.

- Frontend tests:
	- Failed pre-stream send rolls back the optimistic user bubble.
	- Failed pre-stream send does not persist duplicate user turns into the thread.
	- `ROVODEV_STRICT_PORT_UNHEALTHY` renders friendly recoverable copy instead of raw backend error text.

- Validation:
	- Run `node --test backend/lib/*.test.js`
	- Run `pnpm run lint`
	- Run `pnpm tsc --noEmit`
	- Manual repro in single-port mode (`.dev-rovodev-ports = [8000]`):
		- confirm stateless helpers do not touch RovoDev
		- confirm interactive chat still uses the pinned port
		- reproduce unhealthy pinned-port state and verify one-shot recovery
		- verify resend no longer leaves orphaned duplicate user messages
		- verify work-summary zero-tool-call path shows targeted recovery actions

## Assumptions

- The current local runtime is single-port (`[8000]`), so this plan must work without relying on a larger RovoDev pool.
- The app should not try to let RovoDev choose between RovoDev and AI Gateway; that boundary belongs to the app because it owns thread affinity, UI state, and local transport health.
- This iteration does not add a new direct Jira/Confluence backend executor for work summaries; it simplifies backend ownership and hardens the existing RovoDev-based path.
