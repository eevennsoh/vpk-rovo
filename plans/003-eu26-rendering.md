# 003 — Contain Board/List rendering and transient UI state

Priority P1 · Effort 2–3 days · Risk medium · Depends on 001 and 002 · Planned at `d35d42fc0`, 2026-09-12.

## Current state and scope

Development Board/List switching produced 304–480 ms click samples, but the slow component boundary still needs attribution.

- `components/blocks/jira-kanban/experimental/page.tsx:990` chooses List or Board, remounting the alternate surface. Collapse state is deliberately held above that boundary at `:298`; preserve that decision.
- `components/blocks/jira-list/index.tsx:303–316` reads row bounds and updates List-level hover state on row/zone changes. `:356–379` creates columns; `:707–806` maps all rows and calls cell renderers on each List render. The same-zone state equality guard already exists.
- `components/projects/jira-team-eu26/hooks/use-jira-team-eu26-list.ts:277–285` recreates row models/order inside `getProps`; `:323–326` puts every draft summary keystroke in project-owned hook state.
- `components/blocks/jira-kanban/experimental/page.tsx:161–165,580–597` records hovered sessions and derives a preview key even though EU26 `page.tsx:360` disables `suggestSessionBoardLinkOnHover`.

Modify only these owners and narrowly extracted modules beside them, with their relevant tests. Shared primitives remain generic; project behavior stays in the project adapter. No blanket virtualization or global rendering defaults.

## Steps

1. Drift-check these paths against `d35d42fc0`; use plan 001's fixed current and larger fixtures. Profile a single Board→List→Board cycle, row hover sweep, draft typing and session hover separately. Separate React mount/commit work from forced layout and tooling overhead.
2. First remove unused link-preview updates when the existing capability is off. Keep `onAgentSessionsReviewed` acknowledgement and flyout behavior independent; do not suppress them together with preview state. Check a suggestions-enabled shared consumer as well as EU26.
3. Stabilize unchanged list row models and column definitions at their canonical data boundaries. Input identity must reflect board content, ordering and relevant callbacks. Preserve the `visibleKeysRef` semantics for filtered select/reorder/create operations; never cache across changed filters accidentally.
4. Extract stable row/cell content from high-frequency hover/insertion chrome so moving across a row does not recreate unrelated cell content. Use targeted memoization only after stable inputs exist. Keep draft input state near its owner if its root updates are expensive; commit via existing project callbacks without changing create/cancel behavior.
5. Reprofile view switching. If mount cost still dominates, evaluate a bounded warm-view retention strategy versus reducing mount cost. Do not keep both full interactive trees running invisibly by default. Account for suspended observers/listeners, focus, scroll and memory. Choose only the measured option.
6. Consider windowing only if larger supported datasets still exceed the target after these changes. Define row heights, overscan, sticky regions, screen-reader structure and offscreen drag targets before implementing it as a separate plan.

## Validation

`node --test components/projects/jira-team-eu26/lib/list-rows.test.js components/projects/jira-team-eu26/data/agent-session-sync.test.js components/blocks/jira-list/jira-list.test.js components/blocks/jira-list/jira-list-row-flash.test.js` must pass. Add behavioral coverage for filtered ordering, unrelated-row identity, hover-zone transitions, disabled/enabled suggestions, and draft create/cancel. Use existing pure list-model tests as the pattern; avoid implementation-shaped tests that merely require memo calls.

Run `pnpm run lint`, `pnpm run typecheck`, and the performance journey. Revalidate relevant current browser tests including session title hover, session resizing and list sticky footer with `PLAYWRIGHT_BASE_URL` set to the verified origin. Reconcile stale selectors with the intended contract; do not delete meaningful assertions. Load `next-dev-loop` for changed Next app runtime verification and capture screenshots/a11y on the real route.

Done: fewer unrelated row commits, improved repeated tab/typing/hover timings beyond variance, unchanged selection, draft/order and session semantics, and no hidden-tree memory regression. Preserve full long-title text at rest and equivalent hover/focus actions. Stop if a proposed shortcut drops required rendering or breaks drag/focus. Record rejected experiments and the final before/after numbers in the README.
