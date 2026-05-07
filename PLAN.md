## Plan: TWG Source for Personal Graph

> Phase 2 output for [SPEC.md](SPEC.md). Implementation order, parallel work, risks, and verification gates. Tasks are deferred to Phase 3.

## Component map (10 deliverables)

| ID | Component | Files | Depends on |
| --- | --- | --- | --- |
| **E** | Type model widening | `components/arts/personal-graph/lib/personal-graph-types.ts`, `lib/rovo-ui-messages.ts` | — |
| **A** | TWG source adapter | `backend/lib/personal-graph-twg-source.{js,test.js}` | E |
| **B** | Cache layer | `backend/lib/personal-graph-twg-cache.{js,test.js}`, `.gitignore` | E |
| **C** | Source-state + explorer dispatch | `backend/lib/personal-graph-source-state.{js,test.js}`, `backend/lib/personal-graph-routes.js` (modify), `app/api/personal-graph/source/route.ts` | A, B |
| **D** | AI Gateway chat handler | `backend/lib/personal-graph-twg-chat.{js,test.js}` | A, E |
| **F** | Next.js proxy routes | `app/api/personal-graph/twg/refresh/route.ts`, `app/api/personal-graph/twg/chat/route.ts` | C, D |
| **G** | Frontend hooks | `components/arts/personal-graph/hooks/use-graph-source.ts`, `use-twg-chat.ts`, `lib/personal-graph-api.ts` (modify) | F |
| **H1** | Source picker UI | `personal-graph-source-picker.tsx`, `personal-graph-surface.tsx` (modify) | G |
| **H2** | Inspector + status-line updates | `personal-graph-surface.tsx` (modify) | G |
| **H3** | Search-as-chat input + auth error card | `personal-graph-search.tsx` (modify), `personal-graph-twg-auth-error.tsx` | G |

## Implementation order

```
Phase 2a: foundations
    E (types) ──────────────┐
                            ▼
Phase 2b: backend (parallel after E)
    A (twg adapter) ──┬──> C (source state + dispatch) ──┐
    B (cache) ────────┘                                  │
    D (chat handler, depends on A) ──────────────────────┤
                                                         ▼
Phase 2c: wire-up
    F (Next.js proxy routes) ───────────────────────────┐
                                                         ▼
Phase 2d: frontend (sequential within, parallel between)
    G (hooks) ──> H1 (source picker)
              ──> H2 (inspector + status)
              ──> H3 (search-as-chat + auth error)
                                                         ▼
Phase 2e: integration
    lint + typecheck + manual walkthrough + a11y check
```

### What can run in parallel

- **A + B** after E ships (B mocks A's normalized output for tests).
- **C + D** after A ships (C dispatches `/explorer`, D builds the chat tool — both consume `buildTwgExplorer`).
- **H1 + H2 + H3** after G ships (independent UI surfaces).

### What must be sequential

- E precedes everything (type changes ripple).
- A precedes C (dispatch needs adapter) and D (tool wraps adapter).
- F precedes G (hooks consume routes).
- G precedes H* (hooks back the UI).

## Risk register

| # | Risk | Likelihood | Mitigation |
| --- | --- | --- | --- |
| 1 | `twg context user me` returns relationship names we don't yet have a `VaultEdgeKind` for. | High | A logs unknown kinds and drops the edge; we add kinds intentionally rather than auto-coercing. Captured as a known partial-fan-out case in tests. |
| 2 | `data.relationshipSummary.targets` lacks a `url` for some entity types (e.g. people, focus areas). | High | Inspector "open" button only shows when `externalUrl != null`. For people, fall back to a `mailto:` or no link. |
| 3 | AI SDK `streamText` over `ai-gateway-provider` has different tool-roundtrip semantics than RovoDev did. | Medium | Spike before D: write a 30-line throwaway script that calls `aiGatewayProvider.streamText` with a trivial tool, confirms multiple roundtrips, and SSE shape matches `DefaultChatTransport`. If gap, write a custom transport on the client. |
| 4 | Streaming response body shape from Express must match what AI SDK `useChat` expects. | Medium | Use AI SDK's `result.toDataStreamResponse()` if available in the installed version, or replicate its SSE protocol. Confirmed by mocking the gateway in the chat handler test and asserting the wire format. |
| 5 | Search-vs-chat heuristic on prompt input misroutes ("what" as a search query). | Medium | Make the heuristic a single function with unit tests; expose an explicit "Ask" button beside the input that overrides the routing. Default routing is best-effort, the button is the escape hatch. |
| 6 | `twg` CLI not on `PATH` for the Express child process. | Low | Resolve `twg` via `process.env.PATH` on adapter init; on `ENOENT`, surface a clear error pointing to `~/.local/bin/twg` and the install script. |
| 7 | Cache file gets corrupted (interrupted write). | Low | Write to `.twg-cache/explorer.json.tmp` then atomic `rename`; on read, validate JSON shape and treat parse error as cache miss. |
| 8 | Long-running `twg context user me` blocks reset. | Low | Adapter accepts an `AbortSignal`; reset cancels in-flight fetch. |

## Verification gates (between phases)

A phase is **not done** until its gate passes.

| Gate | Check | Pass criteria |
| --- | --- | --- |
| **after E** | `pnpm run typecheck` | Zero errors. Existing personal-graph code compiles against widened types. |
| **after A** | `node --test backend/lib/personal-graph-twg-source.test.js` | Adapter tests pass: success, malformed JSON, non-zero exit, abort signal, unknown relationship kinds dropped, auth-error detection. |
| **after B** | `node --test backend/lib/personal-graph-twg-cache.test.js` | Cache: round-trip, atomic write, corrupted-file recovery, clear. |
| **after C** | `node --test backend/lib/personal-graph-routes.test.js` (extended) | `/explorer` returns vault data when source=vault, TWG data when source=twg. `/source` GET/POST persists across calls. |
| **after D** | `node --test backend/lib/personal-graph-twg-chat.test.js` | Mocked gateway: chat streams text, calls `query_twg` tool, emits final `data-twg-graph` data part with the right node/edge subset. |
| **after F** | manual `curl` against dev server | Each new route returns expected status + body. |
| **after G** | `pnpm run typecheck` + `pnpm run lint` | Zero errors. |
| **after H** | manual walkthrough | Source picker → TWG → graph + chat answers "what did I work on last 7 days" with focused subgraph + external link opens correctly. |
| **final** | `pnpm run lint`, `pnpm run typecheck`, all `node --test` files, manual flow, `ads_analyze_localhost_a11y` | All green; no regressions in existing Obsidian flow. |

## Pre-flight spike (recommended before D)

A 30-minute investigation to de-risk #3 and #4:

1. Read `backend/lib/ai-gateway-provider.js` end-to-end — confirm whether `streamText` is an AI-SDK-compatible export or a custom function. (Helpers list shows `streamBedrockGatewayManualSse` and `streamGoogleGatewayManualSse` — these are likely manual SSE, not AI SDK's `streamText`. That changes plan D significantly.)
2. Look at one existing call site (e.g. `personal-graph-librarian.js` or `genui-chat-handler.js`) to learn the established pattern for tool-calling through this provider.
3. If the provider does **not** support tool roundtrips natively, plan D becomes: implement a manual loop in our handler — call gateway → if response includes a tool call, run `query_twg`, append result to messages, call gateway again, repeat until done. Document the loop bound (`MAX_TOOL_ROUNDTRIPS = 4`).

This spike output feeds the Phase 3 task description for D.

## Out of scope (explicit)

- Running `twg` from the Next.js Route Handler layer.
- Importing or reusing `rovodev-*.js`.
- Recursive fan-out beyond the first relationship hop.
- Multi-site support (we use whatever `twg` resolves from `auth.conf`).
- Background refresh or push notifications.
- Persisting chat history across reloads (chat is ephemeral per session).
- Editing TWG entities (graph is read-only — no equivalent of Obsidian's capture/ingest/page edit).

## Open ambiguities to resolve in Phase 3

- ~~**Where does active-source state live?**~~ **Resolved (Task 0b):** new sibling file `<repo>/.tmp/personal-graph/source.json` next to existing `vault.json`. The vault file parses strictly for `vaultRoot`; not extending it. Schema: `{ "source": "vault" | "twg" }`.
- **TWG cache location:** moved from SPEC's original `.twg-cache/` at repo root to `<repo>/.tmp/personal-graph/twg-cache.json` for colocation. `.tmp/` already gitignored — no `.gitignore` change needed (Task 4 step amended).
- ~~**`AbortSignal` plumbing through `child_process.spawn`**~~ **Resolved (Task 0a):** Node v24.14.1 honors `spawn(..., { signal })`; aborts trigger `ABORT_ERR` + SIGTERM.
- ~~**AI SDK version installed**~~ **Resolved during spike:** `ai@^6.0.172`, `@ai-sdk/react@^3.0.174`. Moot anyway — chat uses hand-rolled NDJSON, not AI SDK protocol.
