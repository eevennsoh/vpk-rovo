## Tasks: TWG Source for Personal Graph

> Phase 3 output. Each task is ≤5 files, has explicit acceptance + verify, and is ordered by dependency. Refer back to [SPEC.md](SPEC.md) and [PLAN.md](PLAN.md).
>
> **Spike resolved** before writing these: `ai-gateway-provider.js` is text-only (no native tool roundtrips). Chat uses a hand-rolled JSON-tool loop, not AI SDK `useChat`. See SPEC §"Chat Architecture".

## Pre-flight

- [x] **Task 0a · Verify Node version supports `spawn(..., { signal })`** ✓
  - Result: Node v24.14.1; `spawn` accepts `signal`; abort fires `ABORT_ERR` + SIGTERM as expected.

- [x] **Task 0b · Decide source-state storage location** ✓
  - Result: existing vault config at `<repo>/.tmp/personal-graph/vault.json` parses strictly for `vaultRoot`. Not extending it. New sibling file `<repo>/.tmp/personal-graph/source.json` schema `{ "source": "vault" | "twg" }`. TWG cache at `<repo>/.tmp/personal-graph/twg-cache.json` (also under `.tmp/`, already gitignored).

## Phase 2a · Type model

- [x] **Task 1 · Widen `VaultEdgeKind`, add `externalUrl`, `source` on `VaultNode`**
  - Acceptance:
    - `VaultEdgeKind` widens to include: `"wiki_link" | "frontmatter_source" | "worked-on" | "mentioned-in" | "reports-to" | "aligned-to" | "member-of" | "attended" | "reviewed"`.
    - `VaultNode` gains `externalUrl: string | null` and `provider: "vault" | "twg"` (named `provider`, not `source`, to avoid clash with `VaultSettings.source`).
    - Existing Obsidian-source code defaults `externalUrl: null`, `provider: "vault"`.
  - Verify: `pnpm run typecheck` passes; existing personal-graph tests pass.
  - Files: `components/arts/personal-graph/lib/personal-graph-types.ts`, `backend/lib/personal-graph-explorer.js` (set `source: "vault"`, `externalUrl: null` on every emitted node).

## Phase 2b · Backend (parallel after Task 1)

- [x] **Task 2 · TWG source adapter — happy path**
  - Acceptance:
    - New module `backend/lib/personal-graph-twg-source.js` exports `buildTwgExplorer({ signal, since })` that:
      - Shells `twg context user me --output json --output-summary stats --since 7d`.
      - Parses JSON, walks `data.relationshipSummary[].targets[]`.
      - Maps each target to a `VaultNode` (source `"twg"`, `externalUrl` from `target.url`, `kind` from a `RELATIONSHIP_TO_KIND` map, `id` from `target.ari`).
      - Emits an edge from the user's ARI to each target, `kind` from a `RELATIONSHIP_TO_EDGE_KIND` map.
      - Returns `{ nodes, edges, generatedAt, stats: { nodeCount, edgeCount, ... } }`.
    - Unknown relationship names: log via `console.warn`, drop the edge.
  - Verify: `node --test backend/lib/personal-graph-twg-source.test.js` — fixture-driven tests cover happy path, unknown kind dropped, empty relationships, missing `target.url` (externalUrl null).
  - Files: `backend/lib/personal-graph-twg-source.js`, `backend/lib/personal-graph-twg-source.test.js`, `backend/lib/__fixtures__/twg-context-user.json` (canned CLI output).

- [x] **Task 3 · TWG source adapter — failure modes**
  - Acceptance: extend the adapter to handle:
    - Non-zero exit → throw `Error` with stderr captured.
    - Stderr matching `/login|unauthorized|not authenticated|401/i` → throw `TwgAuthError` (named subclass) so the route layer can surface the dedicated UX.
    - `ENOENT` on spawn → throw with `code: "TWG_NOT_FOUND"` and a message pointing at `~/.local/bin/twg`.
    - Malformed JSON stdout → throw with stdout snippet (≤200 chars).
    - `signal.aborted` → reject with `AbortError`.
  - Verify: `node --test backend/lib/personal-graph-twg-source.test.js` — new cases.
  - Files: `backend/lib/personal-graph-twg-source.js` (extend), `backend/lib/personal-graph-twg-source.test.js` (extend).

- [x] **Task 4 · Cache layer (parallel with Task 2/3)**
  - Acceptance:
    - New module `backend/lib/personal-graph-twg-cache.js` exports `readCache()`, `writeCache(explorer)`, `clearCache()`.
    - Storage: `<repoRoot>/.tmp/personal-graph/twg-cache.json` (per Task 0b). Atomic write (`.tmp` suffix then `rename`). `mkdir -p` on the directory.
    - `readCache` returns `null` on missing or unparsable file (no throw); always returns the explorer's stored `generatedAt`.
    - `clearCache` removes the file; idempotent.
  - Verify: `node --test backend/lib/personal-graph-twg-cache.test.js` — round-trip, missing-file → null, corrupted-file → null + cleaned, atomic-write race not asserted but doc-commented.
  - Files: `backend/lib/personal-graph-twg-cache.js`, `backend/lib/personal-graph-twg-cache.test.js`. (No `.gitignore` change — `.tmp/` already gitignored.)

- [x] **Task 5 · Source-state lib + extend `/explorer` route + new `/source` route**
  - Acceptance:
    - New `backend/lib/personal-graph-source-state.js` exports `getActiveSource()`, `setActiveSource("vault" | "twg")` persisted to `<repo>/.tmp/personal-graph/source.json` (per Task 0b). Atomic write. Defaults to `"vault"` when file missing.
    - `personal-graph-routes.js`'s `/explorer` handler dispatches: vault path unchanged when source=`"vault"`; when source=`"twg"`, returns `readCache()` if present else calls `buildTwgExplorer` and writes cache.
    - New backend route `GET /api/personal-graph/source` returns `{ source, generatedAt | null }`. New `POST /api/personal-graph/source` body `{ source }` switches; on switch to `"twg"` with no cache, do **not** auto-fetch (let the client trigger refresh) — keeps switching cheap.
    - On `TwgAuthError`, the explorer route returns HTTP 401 with `{ error: "twg_auth_required", remediation: "Run \`twg login\` and retry." }`.
  - Verify: `node --test backend/lib/personal-graph-routes.test.js` (extend) + new `personal-graph-source-state.test.js`.
  - Files: `backend/lib/personal-graph-source-state.js`, `backend/lib/personal-graph-source-state.test.js`, `backend/lib/personal-graph-routes.js`, `backend/lib/personal-graph-routes.test.js`.

- [x] **Task 6 · Chat handler — JSON-tool loop (parallel with Task 5 after Task 3)**
  - Acceptance:
    - New `backend/lib/personal-graph-twg-chat.js` exports `handleTwgChat(req, res)` (Express handler).
    - System prompt instructs the LLM to reply with strict JSON envelopes (see SPEC §"Chat Architecture"). Includes a list of valid `slice` names.
    - Loop: call `aiGatewayProvider.streamText`, parse JSON. If `tool_call`, dispatch to a small router that maps `slice` → an existing `personal-graph-twg-source.js` helper (refactor Task 2's `buildTwgExplorer` to expose `fetchSlice(slice, params, { signal })` returning `{ nodes, edges, summary }`). Append tool result as user-role message. Repeat. Cap at `MAX_TOOL_ROUNDTRIPS = 4`.
    - Streams NDJSON frames per SPEC: `thinking`, `tool`, `tool_result`, `text_delta`, `graph`, `done`. Final `graph` frame contains the union of nodes/edges from all `tool_result`s, deduped by id.
    - `Content-Type: application/x-ndjson; charset=utf-8`. Flush after each frame.
  - Verify: `node --test backend/lib/personal-graph-twg-chat.test.js` — mock `aiGatewayProvider` to return canned tool_call → answer envelopes; assert frames, final graph dedupe, roundtrip cap (4 → bail with error frame), and that a malformed JSON reply triggers a single retry with a "respond only with JSON" reminder.
  - Files: `backend/lib/personal-graph-twg-chat.js`, `backend/lib/personal-graph-twg-chat.test.js`, `backend/lib/personal-graph-twg-source.js` (extract `fetchSlice`).

## Phase 2c · Next.js proxies

- [x] **Task 7 · Proxy routes**
  - Acceptance:
    - `app/api/personal-graph/source/route.ts` — `GET`, `POST` proxy to Express, JSON pass-through (mirror existing `app/api/personal-graph/vault/route.ts` shape).
    - `app/api/personal-graph/twg/refresh/route.ts` — `POST` clears cache and triggers a fresh `buildTwgExplorer` server-side, returns the new explorer JSON.
    - `app/api/personal-graph/twg/chat/route.ts` — `POST`, body pass-through, returns `Response` whose body is the upstream `ReadableStream` (NDJSON pass-through). Headers preserve `Content-Type`.
  - Verify: manual `curl http://localhost:3000/api/personal-graph/source` returns `{source:"vault"|"twg",...}`; curl chat with a stub body streams NDJSON frames.
  - Files: `app/api/personal-graph/source/route.ts`, `app/api/personal-graph/twg/refresh/route.ts`, `app/api/personal-graph/twg/chat/route.ts`.

## Phase 2d · Frontend hooks

- [x] **Task 8 · `personal-graph-api.ts` extensions + `use-graph-source.ts`**
  - Acceptance:
    - `personal-graph-api.ts` gains: `fetchActiveSource()`, `setActiveSource(source)`, `refreshTwg()`, `streamTwgChat({ messages, signal })` (returns an async iterator of NDJSON frames).
    - `use-graph-source.ts` exposes `{ source, setSource, isSwitching, error, generatedAt }`. Polls on mount and on focus (mirroring `useVaultSettings`).
  - Verify: `pnpm run typecheck` + `pnpm run lint` clean.
  - Files: `components/arts/personal-graph/lib/personal-graph-api.ts`, `components/arts/personal-graph/hooks/use-graph-source.ts`, `components/arts/personal-graph/hooks/use-graph-source.test.js` (mocks fetch, asserts state machine).

- [x] **Task 9 · `use-twg-chat.ts`**
  - Acceptance:
    - Hook signature: `useTwgChat({ onGraph: (explorer) => void })` returning `{ status, messages, send(prompt), stop() }`.
    - Maintains a local message log (user + assistant). Streams NDJSON; appends `text_delta` frames to the assistant message; calls `onGraph` once on the `graph` frame; flips `status` to `"done"` on `done`.
    - Handles abort via `AbortController` from `stop()`.
  - Verify: `node --test components/arts/personal-graph/hooks/use-twg-chat.test.js` (mock `streamTwgChat`).
  - Files: `components/arts/personal-graph/hooks/use-twg-chat.ts`, `components/arts/personal-graph/hooks/use-twg-chat.test.js`.

## Phase 2e · Frontend UI (H1 / H2 / H3 — parallel after hooks land)

- [x] **Task 10 · H1 · Source picker in onboarding card**
  - Acceptance:
    - New `personal-graph-source-picker.tsx` renders two buttons: "Choose vault folder" (existing handler) and "Connect Team Work Graph" (new). When the user picks TWG, calls `setActiveSource("twg")` then `refreshTwg()`.
    - `personal-graph-surface.tsx` mounts the picker in the existing onboarding slot when `vaultSettings?.status === "unconfigured"` AND no TWG cache. After selection, the existing intro animation runs and the graph reveals.
    - Reset (existing flyout action) clears whichever source is active and returns to the picker.
  - Verify: `pnpm run typecheck` + manual flow on `/personal-graph`.
  - Files: `components/arts/personal-graph/personal-graph-source-picker.tsx`, `components/arts/personal-graph/personal-graph-surface.tsx` (modify; ≤80 lines diff).

- [x] **Task 11 · H2 · Inspector + status-line updates**
  - Acceptance:
    - Inspector "open" button uses `node.externalUrl` when set; falls back to `/api/personal-graph/page/${slug}` only when `node.source === "vault"`. Hide the button entirely when there's no link target.
    - Status line (`getGraphStatsText`) renders `"<N issues · M PRs · …> · updated <Nm ago>"` when source is `"twg"`. Compute the relative time client-side from `generatedAt`.
  - Verify: `pnpm run typecheck` + manual flow.
  - Files: `components/arts/personal-graph/personal-graph-surface.tsx` (modify; status line + inspector handler).

- [x] **Task 12 · H3 · Search-as-chat + auth error card**
  - Acceptance:
    - In `personal-graph-search.tsx`, when `source === "twg"`: pass input to `routePromptIntent(input)` which returns `"search" | "chat"`. Heuristic: starts with question word (`what`, `how`, `who`, `when`, `where`, `why`, `did`, `is`, `are`, `can`, `should`) OR ends with `?`. Add a small "Ask" toggle button as explicit override.
    - Chat invokes `useTwgChat`. UI: assistant message renders inline below the input; `onGraph` filters the visible explorer to that subset (lift filtering state to surface).
    - "Clear" action removes the chat filter.
    - New `personal-graph-twg-auth-error.tsx`: shown when the explorer fetch errors with `twg_auth_required`. Includes a copy-to-clipboard button for the literal `twg login` command and a "Retry" button calling `refreshTwg`.
  - Verify: `pnpm run typecheck` + `pnpm run lint` + manual flow with an authenticated TWG; manual flow with `twg logout` to confirm the error card.
  - Files: `components/arts/personal-graph/personal-graph-search.tsx`, `components/arts/personal-graph/personal-graph-twg-auth-error.tsx`, `components/arts/personal-graph/personal-graph-surface.tsx` (modify; mounts auth-error card + lifts filter state), `components/arts/personal-graph/lib/route-prompt-intent.ts` (+ test).

## Phase 2f · Integration

- [x] **Task 13 · Final pass**
  - Acceptance:
    - `pnpm run lint` clean.
    - `pnpm run typecheck` clean.
    - All `*.test.js` files pass under `node --test`.
    - Manual walkthrough: pick TWG → graph populates → ask "what did I work on last 7 days?" → text answer + filtered graph → click a node → "open" goes to the right Atlassian URL → reset → picker again.
    - `ads_analyze_localhost_a11y` against `/personal-graph` shows no new violations vs. baseline.
    - Commit history: each task lands as a focused commit, referencing SPEC + PLAN.
  - Verify: all of the above; run `pnpm ports` if dev server flakes.
  - Files: none new.

## Stop conditions / when to halt and ask

Halt and ping me before continuing if any of these happen:

- `twg context user me` returns relationship names not yet mapped, AND dropping them removes >25% of edges.
- AI Gateway gives non-JSON responses for >2 of 5 trial prompts after the system-prompt fix → tool-loop strategy is failing; revisit Option 2 (build OpenAI-compatible AI SDK provider).
- A modification to `personal-graph-routes.js` would force a breaking change to the existing Obsidian flow.
- Any test in `backend/lib/personal-graph-*.test.js` (existing) starts failing — likely a regression in the type-widening (Task 1).
