# Expect-style browser replay parity for Rovo and demo

This document captures the implementation plan to move the browser preview from
the current screenshot-stream model toward an `expect`-style replay model that
can reproduce cursor motion, typed text, persistent labels, and halo effects
closely in both live and archived runs.

## Summary

- Replace the current canvas-stream-plus-overlay path as the primary browser
  visualization with an `expect`-style replay lane.
- Keep the existing live screenshot or canvas preview as a fallback path.
- Persist browser replay runs per thread so reopening a thread can replay the
  exact browser choreography instead of only restoring the last URL and
  screenshots.
- Land the deeper version in both the Rovo browser artifact and the demo
  preview surface.

## Approach comparison

- **Current solution**
  - Pros: low-risk, simple, already integrated with browser tools and
    screenshots, and shows authoritative pixels from the actual workspace.
  - Cons: cursor and typing are inferred, labels are transient, old threads do
    not replay exact motion, and visual parity with `expect` is limited by the
    screenshot-stream architecture.
- **Expect-style replay**
  - Pros: exact animated cursor path, typed-text playback, persistent labels,
    halo treatment, and durable replay for old threads.
  - Cons: deeper architecture shift, added dependencies such as
    `@posthog/rrweb` and `calligraph`, replay-data persistence, and
    mirror-browser drift risk if the replay source diverges from the
    authoritative workspace.
- **Chosen direction**
  - Adopt `expect`'s replay-style dependency stack directly.
  - Use a dedicated replay mirror browser as the replay source.
  - Keep the current screenshot or canvas path only as a fallback when replay
    is unavailable or desynced.

## Implementation changes

### Replay source and capture

- Add a replay mirror service that receives the same high-level browser tool
  events as the authoritative thread workspace.
- Instrument the mirror browser with rrweb from first page load so cursor
  movement, scroll, DOM changes, and typed input are captured as replay events
  instead of reconstructed later.
- Normalize browser tool actions into one event bus used by both the existing
  browser bridge and the replay mirror: navigate, click-ref, hover-ref,
  fill-ref, type-ref, select-ref, scroll, key press, and screenshot.
- Use the replay mirror as the source for exact cursor animation, typed-text
  playback, and persistent action labels.

### Persistence

- Persist browser replay runs under each thread directory, not inside
  `thread.json`.
- Store runs at
  `backend/data/rovo-app/threads/<threadId>/browser-runs/<runId>/`.
- Persist `manifest.json` for run metadata and `events.ndjson` for appendable
  rrweb event storage. Store any derived replay assets in the same run
  directory if needed.
- Keep `thread.json` lightweight by storing only run references in message
  parts or thread metadata, not full rrweb event arrays.

### Rovo data model and APIs

- Add a new persisted browser replay reference as a `browser-run` data part in
  `lib/rovo-ui-messages.ts`.
- Keep `browser-state` for URL, title, status, and artifact opening.
- Use `browser-run` to carry `runId`, `workspaceId`, replay availability, and
  whether the run is live or archived.
- Add read APIs for browser replay runs:
  - `GET /api/rovo-app/threads/:threadId/browser-runs`
  - `GET /api/rovo-app/threads/:threadId/browser-runs/:runId`
  - `GET /api/rovo-app/threads/:threadId/browser-runs/:runId/events`
  - `WS /api/rovo-app/threads/:threadId/browser-runs/:runId/live`
- Extend the Rovo browser bridge so browser tool start and result hooks create
  and update replay runs, not just `browser-state` and screenshots.

### Frontend replay rendering

- Replace the current primary browser-pane renderer with an rrweb replay
  component styled to match `expect` as closely as practical, including:
  - animated cursor motion
  - exact typed-text playback
  - persistent activity label treatment
  - visible halo around the cursor and browser interaction focus
- Use the same replay component in both the Rovo browser artifact and the demo
  preview surface.
- Preserve the current canvas or screenshot preview as an automatic fallback
  when replay data is missing, the mirror failed to initialize, or rrweb
  playback errors.
- On reopen of an existing thread, load the latest browser run and replay it
  immediately instead of only restoring URL or screenshot state.

### Expect-parity styling

- Port the visual language from `expect` for cursor, halo, and label behavior
  instead of continuing to tune the current custom overlay.
- Match the persistent label lifecycle from replay state, not timer-based
  frontend heuristics.
- Match typed-text cadence and cursor easing to replay timing so the UX feels
  identical in both live and archived playback.

## Important interfaces and types

- Add `RovoDataParts["browser-run"]` with:
  - `runId`
  - `workspaceId`
  - `threadId`
  - `status: "live" | "completed" | "failed"`
  - `replayAvailable: boolean`
  - `currentUrl`
  - `title`
- Add thread-side replay types:
  - `RovoAppBrowserRunManifest`
  - `RovoAppBrowserRunStatus`
  - `RovoAppBrowserReplayEventEnvelope`
- Extend the Rovo browser bridge so browser tool start and result hooks emit
  replay references alongside browser-state updates.

## Test plan

### Backend

- Verify a fresh browser tool call creates a replay run, appends events, and
  emits `browser-run`.
- Verify run metadata is persisted outside `thread.json`.
- Verify archived runs can be reloaded after backend restart.

### Frontend

- Verify live replay renders cursor motion, halo, typed text, and persistent
  labels.
- Verify reopening a thread loads the latest archived run and replays it.
- Verify fallback to the current canvas or screenshot preview when replay data
  is unavailable.

### Acceptance scenarios

- Use `theverge.com`, not `example.com`.
- Run a realistic flow: open the homepage, click into an article, navigate
  again via site chrome, scroll through content, trigger at least one text
  entry or search interaction if available, and capture a screenshot.
- Confirm the same run replays identically after refreshing or reopening the
  thread.
- Validate the same experience in both `/rovo-app` and the demo preview
  surface.

## Assumptions

- It is acceptable to add `expect`-style replay dependencies directly.
- Exact parity is more important than preserving the current lightweight
  overlay architecture.
- A replay mirror browser is acceptable as the primary visual source, while the
  authoritative workspace remains the execution source.
- The current screenshot or canvas preview remains only as a resilience
  fallback, not the main UX.
