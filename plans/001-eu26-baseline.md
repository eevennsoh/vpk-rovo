# 001 — Establish EU26 performance measurements

Priority P1 · Effort 1–2 days · Risk low · Dependency none · Planned at `d35d42fc0`, 2026-09-12.

## Context and scope

The target is `/jira-team-eu26`: 20 work items, a finite simulated session queue, Board/List and Rovo. Development click samples reached 304–480 ms for Board → List and 336–416 ms in reverse. They need reproduction without development instrumentation before choosing the largest fix.

`scripts/collect-perf-baseline.js:19` defines `FIXED_BASELINE_ROUTES` for home, rovo, studio and components. `scripts/verify-perf-baseline-budget.js:15` has no EU26 budget. The collector's HTTP timing is not browser interaction timing. Keep its existing asset accounting and add route-specific browser coverage.

Allowed owners: these two scripts and their `.test.js` suites; a new focused `tests/projects/jira-team-eu26-performance.spec.ts`; measurement output under ignored `output/agent-browser/`. Do not alter app behavior or existing route budgets to make numbers pass.

## Steps

1. Run `git diff --stat d35d42fc0..HEAD -- scripts/collect-perf-baseline.js scripts/verify-perf-baseline-budget.js components/projects/jira-team-eu26 tests/projects`. Inspect changes and current `AGENTS.md`. Use `corepack pnpm` if the pnpm shim is unavailable. Discover the current server with `pnpm ports`; do not assume port 3000.
2. Build only in an isolated checkout/output; use `pnpm run build:export` for the deployed static-export path. Record commit, build mode, browser, viewport, CPU/network settings, cache state and dataset. Do not contend with a build in the shared checkout. Retain a separate development measurement for the user's local workflow.
3. Add EU26 to the default asset collection and budget coverage with tests for present/missing route metrics. Keep bytes' existing units explicit. Start the new route's limits from measured production data, not arbitrary numbers.
4. Add a repeatable browser journey covering tab changes, search typing, draft typing, session hover, menus, drag/resize, chat opening and local scripted playback. Record input delay, processing and presentation separately with Event Timing; gather long tasks/frames and component profiles in separate diagnostic runs. Use `web-vitals` or existing equivalent for actual INP, not a homemade percentile over click entries. Do not send real external messages.
5. Use 5 cold and 5 warm load runs, and at least 30 repetitions per warm action across independent runs. Report median/p95 and spread. Seed/freeze the finite session arrivals consistently in a test-only harness. Repeat at representative desktop and slower CPU settings, and current/100/500-item isolated fixtures. Keep stress-fixture IDs unique.
6. Run the browser journey without React profiling/React Grab for acceptance timing, then instrument the slow interactions for attribution. Save screenshots and traces of the real route, including keyboard/reduced-motion states. Record all failures as baseline or introduced, with evidence.

## Verification

- `node --test scripts/collect-perf-baseline.test.js scripts/verify-perf-baseline-budget.test.js` → all pass.
- `pnpm run perf:budget:warn` → output includes EU26; `pnpm run perf:budget` → all final budgets pass. Run only after the isolated build is safe to execute.
- `PLAYWRIGHT_BASE_URL=<verified-origin> pnpm exec playwright test tests/projects/jira-team-eu26-performance.spec.ts` → repeatable measurements and usable-content assertions. Replace the placeholder with the discovered origin; it is not a literal command value.
- `pnpm run lint` and `pnpm run typecheck` → exit 0. Preserve unrelated baseline failures with clear evidence rather than silently changing their scope.

Done: versioned reproducible protocol, EU26 present in asset budgets, raw trace paths, median/p95 per journey, and calibrated thresholds. Initial product goals: ≤100 ms acknowledgement, ≤200 ms p95 warm usable-content completion; field p75 INP ≤200 ms if field measurement exists.

Stop if no stable production baseline is available, test data is changing across comparisons, or the fixture contract has drifted. Document the gap rather than presenting development bytes as production size. Keep baseline/treatment conditions identical and update this plan's README status only after the measurements exist.
