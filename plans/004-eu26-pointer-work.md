# 004 — Bound board proximity work to animation frames

Priority P2 · Effort 0.5–1 day · Risk medium · Depends on 001–003 · Planned at `d35d42fc0`, 2026-09-12.

## Evidence and scope

`components/blocks/jira-kanban/experimental/components/create-work-item-exclusive-proximity-context.tsx:53–72` installs a document `pointermove` listener, builds an array of every well's current rectangle, and selects a winner on every event. `:97–100` registers each well using `targetRef.current?.getBoundingClientRect()`; the effect depends on the whole coordinator value, so winner changes re-register wells. The provider is mounted by `experimental-jira-kanban.tsx:745`; EU26 enables the create wells.

Source behavior is confirmed; forced-layout magnitude on this specific handler has not been measured. The earlier 47 ms layout observation belongs to tab-switch React dispatch and must not be attributed to this handler.

Allowed changes: the proximity context, adjacent pure helper/tests, and narrow browser coverage. Inspect `use-board-agent-session-drag.ts:673–680` separately if drag traces show repeated zone collection, but do not combine an unproven drag rewrite with this fix.

## Steps

1. Drift-check scope against `d35d42fc0`. Record a fixed 10-second pointer sweep with stationary wells, then scrolling/resizing/repositioning. Count handler calls, rectangle reads, frames and long tasks at ordinary and high pointer event rates.
2. Store only the latest pointer coordinates and schedule at most one pending animation frame. Resolve that frame using current geometry. Cancel pending work on cleanup; ensure leaving the document/touch input clears the winner correctly. Preserve the existing pure winner algorithm.
3. Depend on stable registration rather than the changing winner-bearing context object. Assert well count and registration order remain correct on winner changes and mount/unmount.
4. Only cache rectangles if the once-per-frame version still costs enough to justify it. Explicitly invalidate on scroll, resize, collapse, reordering and layout changes; otherwise prefer fresh reads once per frame. Batch geometry reads before writes.
5. Re-run exactly the same sweeps and create/drag journeys. Make keyboard focus remain independent of pointer sampling.

## Tests and acceptance

Run `node --test components/blocks/jira-kanban/experimental/lib/create-work-item-exclusive-proximity.test.js`. Extend coverage for frame coalescing, cleanup, latest-pointer semantics and unchanged nearest-well/tie rules using an injectable scheduling boundary if useful. Register any new component node:test suite in `scripts/js-unit-test-manifest.mjs`, then verify with unfiltered `node scripts/run-js-unit-tests.mjs`.

Run `pnpm run lint`, `pnpm run typecheck` and the route browser journey with `next-dev-loop` runtime checks. Verify overlapping halos, touch, horizontal scroll, resized session rail, column collapse and keyboard creation. Preserve the existing 120 px proximity contract and exclusive winner behavior.

Done: rectangle reads bounded by active frames × mounted wells, no registration churn solely from winner changes, lower handler/layout cost beyond noise, and unchanged target correctness. For 60 Hz aim for 16.7 ms frames with no recurring >50 ms tasks. Stop/revert if one-frame sampling causes stale/wrong drop feedback or improvement is neutral. Record before/after and update README status.
