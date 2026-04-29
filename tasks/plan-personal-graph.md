# Personal Graph — Task Plan

> Spec: [`SPEC.md`](../SPEC.md) (in repo root)
> Companion: [`tasks/todo-personal-graph.md`](todo-personal-graph.md) (flat checklist)
> Plan-mode artifact: `~/.claude/plans/i-would-love-us-fizzy-perlis.md`

This document breaks the SPEC into **vertically-sliced atomic tasks**. Each task ships a complete path from UI through API to vault (or a clear sub-slice of one when a slice is too large for a single sitting). Tasks are ≤2 hours of work, have explicit acceptance criteria, and a runnable verification step.

---

## Vertical Slices

We deliberately avoid horizontal layering ("first all backend, then all frontend"). Each slice produces something demonstrable:

| # | Slice | What you can demo when done |
|---|---|---|
| S1 | Read existing vault as a graph | Open `/arts/personal-graph`, see the placeholder source + wiki pages as a Sigma graph |
| S2 | Click a node to read its markdown | Click → side panel renders Streamdown |
| S3 | Edit a page from the UI | Edit, save, refresh; Obsidian sees the change |
| S4 | Drop a markdown file as a raw source | Drop, badge increments, file in `raw/` |
| S5 | Drop a URL → agent-browser captures it | Paste URL, see "Capturing…", `raw/<slug>.md` + screenshot exist |
| S6 | qmd-backed search | Type query, results render, click pulses graph node |
| S7 | Summarize + librarian + confirmation gate | Drop file → click Ingest → see takeaways → Confirm → new wiki node + log entry |
| S8 | Polish | Log timeline, motion, a11y, attribution |

---

## Dependency Graph

Each task depends on the boxes that flow into it. `[CP]` = checkpoint where the user can pause, demo, and validate before continuing.

```
S1 (read-only graph)
  T1.1 Vault adapter (read paths) ─┬─► T1.4 Explorer module ──► T1.6 Express routes ──► T1.7 Next proxies
  T1.2 Vault read tests ───────────┘                                                              │
  T1.3 .env.example                                                T1.5 Explorer tests             │
                                                                                                  ▼
                                                                    T1.8 Frontend types + API client
                                                                              │
                                                                              ▼
                                                                    T1.9 useVaultExplorer hook
                                                                              │
                                                                              ▼
                                                                    T1.10 Sigma component
                                                                              │
                                                                              ▼
                                                                    T1.11 Surface (read-only)
                                                                              │
                                                                              ▼
                                                                    T1.12 Replace placeholder + demo wrapper
                                                                              │
                                                                            [CP1]
S2 (read page)                                                                │
  T1.13 Page reader (Streamdown) ─────────────────────────────────────────────┤
  T1.14 Wire reader into side panel ──────────────────────────────────────────┘
                                                                            [CP2]
S3 (edit page)
  T2.1 Vault adapter writes ──┬─► T2.3 PUT page route ──► T2.4 Edit toggle in reader
  T2.2 Vault write tests ─────┘
                                                                            [CP3]
S4 (drop file)
  T2.5 POST /raw route + Next proxy
  T2.6 Drop-zone (files only) ──► T2.7 Unprocessed-count helper ──► T2.8 Ingest button (no LLM yet)
                                                                            [CP4]
S5 (capture URL)
  T2.9 agent-browser capture module ──┬─► T2.11 POST /capture route ──► T2.12 Drop-zone URL handling
  T2.10 Capture tests ────────────────┘
                                                                            [CP5]
S6 (search)
  T3.1 qmd init script
  T3.2 qmd module ──┬─► T3.4 GET /search route ──► T3.6 Search input ──► T3.7 Wire into surface header
  T3.3 qmd tests ───┘                              T3.5 useVaultSearch hook ──┘
                                                                            [CP6]
S7 (librarian)
  T4.1 Summarize module ──┬─► T4.3 Librarian skeleton ──► T4.4 summarize stage ──► T4.5 linking stage ──► T4.6 action plan + execute
  T4.2 Summarize tests ───┘                                                                                       │
                                                                                                                  ▼
                                                                                                            T4.7 Librarian tests
                                                                                                                  │
                                                                                                                  ▼
                                                                                                            T4.8 POST /ingest SSE route
                                                                                                                  │
                                                                                                                  ▼
                                                                                                            T4.9 useLibrarianStream hook
                                                                                                                  │
                                                                                                                  ▼
                                                                                                            T4.10 Confirmation gate UI
                                                                            [CP7]
S8 (polish)
  T5.1 Log timeline ──► T5.2 Motion ──► T5.3 a11y pass ──► T5.4 Attribution ──► T5.5 Final verification
                                                                            [CP8 — ship]
```

**Critical path** (no parallelization): T1.1 → T1.4 → T1.6 → T1.7 → T1.10 → T1.11 → T1.12 → T1.13 → T1.14 → T2.1 → T2.3 → T2.4 → T2.5 → T2.6 → T2.7 → T2.8 → T2.9 → T2.11 → T2.12 → T3.2 → T3.4 → T3.6 → T4.1 → T4.3 → T4.6 → T4.8 → T4.10 → T5.5.

**Parallelizable pairs** (safe to split between two workers): tests vs. implementation within the same slice (T1.2/T1.5 alongside T1.1/T1.4); the qmd init script (T3.1) alongside the qmd module (T3.2); polish tasks T5.1–T5.4 in any order.

---

## Phase 1 — Read-only graph (S1 + S2)

**Goal:** loading `/arts/personal-graph` renders a Sigma graph of the existing vault, and clicking a node opens the underlying markdown in a side panel. Zero LLM cost.

| ID | Task | Files | Acceptance | Verification |
|---|---|---|---|---|
| T1.1 | Vault adapter (read paths) | `backend/lib/personal-graph-vault.js` | Exports `getVaultRoot()`, `listRaw()`, `listWiki()`, `readPage(slug)`, `parseFrontmatter(text)`. Throws `{ code: "VAULT_NOT_FOUND" }` if `PERSONAL_GRAPH_VAULT` unset or path missing. | `node -e "const v = require('./backend/lib/personal-graph-vault'); console.log(v.listWiki().length)"` prints ≥4 |
| T1.2 | Vault read tests | `backend/lib/personal-graph-vault.test.js` (+ tmp fixture) | Tests cover: list shapes, frontmatter round-trip, missing-vault error code, malformed frontmatter graceful fallback. | `pnpm exec node --test backend/lib/personal-graph-vault.test.js` ✓ |
| T1.3 | `.env.example` entries | `.env.example` | Adds `PERSONAL_GRAPH_VAULT` (with default), `PERSONAL_GRAPH_LIBRARIAN_MODEL`, `PERSONAL_GRAPH_QMD_COLLECTION`, `PERSONAL_GRAPH_QMD_MCP_URL`, each with one-line comment. | `grep -c '^PERSONAL_GRAPH_' .env.example` returns 4 |
| T1.4 | Vault explorer | `backend/lib/personal-graph-explorer.js` | `buildExplorer(vault)` returns `{ nodes: VaultNode[], edges: VaultEdge[] }`. Nodes per wiki page + raw file. Edges from frontmatter `sources` + `[[wikilinks]]`. Orphans → `dangling: true`. | Repl smoke: returns ≥1 node per known file in real vault |
| T1.5 | Explorer tests | `backend/lib/personal-graph-explorer.test.js` | Cross-folder wikilinks resolve; orphans flagged; bidirectional edges deduped. | `pnpm exec node --test backend/lib/personal-graph-explorer.test.js` ✓ |
| T1.6 | Express routes | `backend/lib/personal-graph-routes.js`, edit `backend/server.js` | Mounts `GET /api/personal-graph/explorer`, `GET /api/personal-graph/page/*`. Uses vault adapter only. | `curl http://localhost:<backend-port>/api/personal-graph/explorer \| jq '.nodes \| length'` ≥1 |
| T1.7 | Next.js dev proxies | `app/api/personal-graph/explorer/route.ts`, `app/api/personal-graph/page/[...slug]/route.ts` | Forwards GET to backend with body passthrough. | `curl http://localhost:<frontend-port>/api/personal-graph/explorer` returns same JSON as T1.6 |

**[CP1] Backend serves graph data end-to-end.** Demo: curl both routes; show JSON shape matches `VaultExplorer` and rendered page text.

| ID | Task | Files | Acceptance | Verification |
|---|---|---|---|---|
| T1.8 | Frontend types + API client | `components/arts/personal-graph/lib/personal-graph-types.ts`, `…/lib/personal-graph-api.ts` | Exports `VaultNode`, `VaultEdge`, `VaultExplorer`, `PageBody`. Client: `fetchExplorer()`, `fetchPage(slug)`. | `pnpm run typecheck` clean |
| T1.9 | useVaultExplorer hook | `components/arts/personal-graph/hooks/use-vault-explorer.ts` | SWR-style; revalidates on focus and after manual `.refresh()`. | `pnpm run typecheck` clean |
| T1.10 | Sigma graph (copy-and-diverge) | `components/arts/personal-graph/personal-graph-sigma.tsx` | Copy of `memory-explorer-sigma-graph.tsx` with vault-folder-keyed colors (`source`, `entity`, `concept`, `synthesis`, `raw`); edge colors `wiki_link` vs `frontmatter_source`. ≤200 lines. Props: `explorer`, `selectedNodeId`, `onSelectNode`. | `pnpm run lint && pnpm run typecheck` clean |
| T1.11 | Surface shell (read-only) | `components/arts/personal-graph/personal-graph-surface.tsx` | Mounts `<PersonalGraphSigma>` full-bleed, header reserved, side-panel slot collapsed. Compound `Surface` namespace. | typecheck clean |
| T1.12 | Replace placeholder + demo wrapper + arts.ts | `components/arts/personal-graph/index.tsx`, `components/website/demos/arts/personal-graph-demo.tsx`, `app/data/details/arts.ts` | Both routes (`/arts/personal-graph` and `/personal-graph`) render the surface; demo wrapper renders the surface; `arts.ts` description rewritten with second-brain attribution. | `/agent-browser open` + `screenshot` shows graph |

**[CP2] Read-only graph live in browser.** Demo: open `/arts/personal-graph`, screenshot.

| ID | Task | Files | Acceptance | Verification |
|---|---|---|---|---|
| T1.13 | Page reader (Streamdown) | `components/arts/personal-graph/personal-graph-page.tsx` | Receives `slug`, fetches, renders with Streamdown + plugins (code, math, mermaid, cjk). Handles loading/error states. | typecheck clean; demo with hardcoded slug |
| T1.14 | Wire reader into side panel | edit `personal-graph-surface.tsx` | On node click, side panel slides in (Motion `--duration-medium ease-in-out`) and mounts `<PersonalGraphPage slug={selected.slug}>`. Click-outside / Esc closes. | `/agent-browser` flow: load page, click node, screenshot side panel with rendered markdown |

**[CP3] Read-only viewer fully usable as Obsidian companion view.** Natural milestone — zero LLM cost. Could ship here.

---

## Phase 2 — Edit + capture (S3 + S4 + S5)

**Goal:** users can edit existing pages, drop files into `raw/`, and capture URLs through agent-browser. Still no LLM.

| ID | Task | Files | Acceptance | Verification |
|---|---|---|---|---|
| T2.1 | Vault adapter writes | edit `backend/lib/personal-graph-vault.js` | Adds `writePage(slug, content)`, `writeRaw(slug, body)`, `appendLog(entry)`. Mutex serializes log appends. Atomic via temp-file rename. | unit test |
| T2.2 | Write tests | edit `backend/lib/personal-graph-vault.test.js` | Round-trip; concurrent log appends produce N parseable lines, no interleaving; partial-write recovery (tmp file orphan cleanup). | `node --test` ✓ |
| T2.3 | PUT page route | edit `backend/lib/personal-graph-routes.js`, edit `app/api/personal-graph/page/[...slug]/route.ts` | `PUT /page/*` writes via vault adapter; rejects body without frontmatter. | `curl -X PUT -H 'content-type: application/json' -d '{"content":"..."}'` updates file; `cat` confirms |
| T2.4 | Edit toggle in page reader | edit `personal-graph-page.tsx` | Edit/Save buttons; edit mode swaps to `<textarea>` bound to current content; Save → PUT → success → exit edit mode + refresh. Cancel discards. | `/agent-browser` flow: edit, save, reload, change persists; verify in Obsidian |

**[CP4] Two-way sync with Obsidian works.**

| ID | Task | Files | Acceptance | Verification |
|---|---|---|---|---|
| T2.5 | POST /raw route + proxy | edit `backend/lib/personal-graph-routes.js`, new `app/api/personal-graph/raw/route.ts` | Accepts multipart file or JSON `{ slug, content }`. Writes through vault adapter. Rejects paths outside `raw/`. | `curl -F file=@fixture.md` creates `raw/fixture.md` |
| T2.6 | Drop-zone (files only) | `components/arts/personal-graph/personal-graph-dropzone.tsx` | Drag-and-drop overlay for `.md`/`.txt`/`.html`; calls `/api/personal-graph/raw`; success toast. Keyboard alternative button. | `/agent-browser` drop |
| T2.7 | Unprocessed-count helper + route | edit `backend/lib/personal-graph-vault.js` (`unprocessedRawSources()`), add `GET /unprocessed-count` to routes, add proxy | Compares files in `raw/` to `source:` values in `wiki/log.md` ingest entries; returns `{ count, paths }`. | curl returns correct count |
| T2.8 | Ingest button (LLM disabled) | `components/arts/personal-graph/personal-graph-ingest-button.tsx` | Renders unprocessed-count badge from T2.7; **Ingest** button disabled with tooltip "Coming in Phase 4". | `/agent-browser`: drop file → badge = 1 |

**[CP5a] File capture pipeline.** Demo: drop a file, see badge, see file on disk.

| ID | Task | Files | Acceptance | Verification |
|---|---|---|---|---|
| T2.9 | agent-browser capture module | `backend/lib/personal-graph-capture.js` | `captureUrl(url)` → uses `AgentBrowser` (`open` → `snapshot` → `getTitle` → `screenshot` → `close` in try/finally). Returns `{ slug, rawPath, assetPath, frontmatter }`. Slug = `<YYYY-MM-DD>-<sanitized-title>`. | smoke node script against example.com creates raw + asset |
| T2.10 | Capture tests | `backend/lib/personal-graph-capture.test.js` | Mocks `AgentBrowser` (constructor → fake instance); asserts close even on error; slug stable across runs. | `node --test` ✓ |
| T2.11 | POST /capture route + proxy | edit routes, new `app/api/personal-graph/capture/route.ts` | Body `{ url }`; returns `{ slug, rawPath, assetPath }`. Rejects non-http(s) URLs. | curl creates raw + asset |
| T2.12 | Drop-zone URL handling | edit `personal-graph-dropzone.tsx` | Detects pasted/dropped URL strings; shows "Capturing…" state; routes URLs to `/capture`, files to `/raw`. | `/agent-browser`: paste URL, observe state, badge increments |

**[CP5b] Capture pipeline full.** Demo: drop file, paste URL, both land in `raw/`. Still no LLM.

---

## Phase 3 — Search (S6)

**Goal:** vault is fully navigable via qmd-powered search. Bonus: this also unblocks the librarian's "linking" pass in Phase 4.

| ID | Task | Files | Acceptance | Verification |
|---|---|---|---|---|
| T3.1 | qmd init script | `scripts/personal-graph-qmd-init.sh` | `qmd status` check; if collection missing, `qmd collection add "$PERSONAL_GRAPH_VAULT/wiki" --name personal-graph` then `qmd embed`. Idempotent. | run twice; second run no-ops |
| T3.2 | qmd module | `backend/lib/personal-graph-qmd.js` | Exposes `relatedPages(text, opts)`, `search(query, opts)`, `ensureCollection()`. Mode: CLI (`execFile`) by default; HTTP MCP if `PERSONAL_GRAPH_QMD_MCP_URL`; grep fallback if `qmd` missing. Each result has `{ slug, title, score, excerpt }`. | smoke search returns results |
| T3.3 | qmd tests | `backend/lib/personal-graph-qmd.test.js` | Mocks `execFile`; covers JSON parse, MCP HTTP path, missing-binary fallback. | `node --test` ✓ |
| T3.4 | GET /search route + proxy | edit routes, new `app/api/personal-graph/search/route.ts` | `?q=...&limit=10` returns array of results. | `curl /api/personal-graph/search?q=ingestion` returns hits |
| T3.5 | useVaultSearch hook | `components/arts/personal-graph/hooks/use-vault-search.ts` | Debounced 200ms; AbortController on new query; exposes `{ results, status }`. | typecheck clean |
| T3.6 | Search input component | `components/arts/personal-graph/personal-graph-search.tsx` | Header search bar; results list; hover highlights graph node; click loads page. | typecheck + visual |
| T3.7 | Wire search into surface header | edit `personal-graph-surface.tsx` | Mounts `<PersonalGraphSearch>` in header; on result click → `setSelectedNodeId`. | `/agent-browser`: query → result click → page open |

**[CP6] Vault is fully navigable: graph + read + edit + capture + search. No LLM yet.** Strong demo milestone.

---

## Phase 4 — Librarian + ingestion (S7)

**Goal:** the magical loop — drop a source, click Ingest, see takeaways, Confirm, watch the graph grow. This is the only phase that costs LLM tokens.

| ID | Task | Files | Acceptance | Verification |
|---|---|---|---|---|
| T4.1 | Summarize module | `backend/lib/personal-graph-summarize.js` | `summarizeRaw({ content, kind })` calls AI Gateway with `response_format: json_object`; returns `{ takeaways: string[5], summary: string }`; throws typed error on malformed JSON. | smoke against gateway returns valid shape |
| T4.2 | Summarize tests | `backend/lib/personal-graph-summarize.test.js` | Mocks gateway; covers happy path + malformed JSON + gateway error. | `node --test` ✓ |
| T4.3 | Librarian skeleton | `backend/lib/personal-graph-librarian.js` | Exports `run({ vault, sourcePath, signal, confirmation })`; returns AsyncIterable<LibrarianStreamEvent>. Stages enum: `reading`, `summarizing`, `linking`, `awaiting-confirmation`, `writing`, `logging`, `done`. | typecheck clean |
| T4.4 | Librarian summarize stage | edit `personal-graph-librarian.js` | Reads source via vault adapter; calls summarize module; emits `{ stage: "summarizing", takeaways, summary }`; emits `{ stage: "awaiting-confirmation" }` and pauses. | unit test (mocked summarize) emits expected events |
| T4.5 | Librarian linking stage | edit `personal-graph-librarian.js` | Calls `qmd.relatedPages(summary)`; emits `{ stage: "linking", related: [...] }`. Runs after summarize, before awaiting-confirmation. | unit test (mocked qmd) |
| T4.6 | Librarian action plan + execute | edit `personal-graph-librarian.js` | After confirmation: builds prompt with AGENTS.md system + raw source + summary + related pages + tools schema (`write_page`, `append_log`, `update_index`); LLM returns JSON action plan; validates against schema; executes via vault adapter; idempotent (re-run produces no new pages or log entries). | integration test against tmp vault produces expected files |
| T4.7 | Librarian tests (full pipeline) | `backend/lib/personal-graph-librarian.test.js` | All companions mocked; happy path; idempotency; partial failure (write succeeds but log append fails) leaves vault consistent or rolls back. | `node --test` ✓ |
| T4.8 | POST /ingest SSE route + proxy | edit routes, new `app/api/personal-graph/ingest/route.ts` | `POST /ingest` body `{ sourcePath }` → SSE stream of librarian events; `?confirm=<token>` continues a paused librarian. Sets `text/event-stream` headers; flushes per event; cleans up on disconnect. Next.js proxy uses `ReadableStream` passthrough. | `curl --no-buffer -X POST` streams events live |
| T4.9 | useLibrarianStream hook | `components/arts/personal-graph/hooks/use-librarian-stream.ts` | EventSource consumer; exposes `{ stages, takeaways, related, status, confirm(), discard() }`. Cleanup on unmount. | typecheck clean |
| T4.10 | Confirmation gate UI | edit `personal-graph-ingest-button.tsx` | Side panel: streamed stages timeline → takeaways list → "Related pages found by qmd" list → Confirm/Discard buttons. Confirm triggers second-leg POST; Discard closes panel and emits no log entry. | `/agent-browser` end-to-end: drop file → click Ingest → see takeaways within 5s → Confirm → new node visible within 30s; verify wiki page exists on disk and log entry appended |

**[CP7] Full second-brain UX works end-to-end.** This is the spec's main success criterion.

---

## Phase 5 — Polish + ship (S8)

| ID | Task | Files | Acceptance | Verification |
|---|---|---|---|---|
| T5.1 | Log timeline | `components/arts/personal-graph/personal-graph-log.tsx`, add `GET /log` route + proxy | Backend parses `wiki/log.md` ingest entries → `{ date, source, pagesWritten[] }[]`. Frontend renders chronological timeline; click entry → load source. | `/agent-browser` shows past ingests |
| T5.2 | Motion transitions | edit surface + side panel + ingest panel | Side panel slide; node selection pulse; ingest stage transitions. Use `motion/react` with `--duration-medium ease-in-out`. Respects `prefers-reduced-motion`. | screencast |
| T5.3 | a11y pass | edit components as needed | `ads_analyze_localhost_a11y` reports 0 critical issues. Drop-zone has visible focus + keyboard "Add raw source" button. Graph canvas has `<details>` textual fallback listing nodes/edges. | tool output saved to PR description |
| T5.4 | Attribution | edit `app/data/details/arts.ts` | Description names Spisak's second-brain, Karpathy's LLM Wiki pattern, Lütke's qmd. | `cat` |
| T5.5 | Final verification | — | All steps from SPEC.md §5 Verification pass. | green outputs of all 5 commands |

**[CP8 — ready to ship.]**

---

## Verification commands (reference)

```bash
# Per-task verification
pnpm run lint
pnpm run typecheck
pnpm exec node --test backend/lib/personal-graph-*.test.js
pnpm exec playwright test tests/personal-graph.spec.ts

# Manual end-to-end (CP7)
pnpm run rovodev                                       # one terminal
npx agent-browser open http://localhost:3000/arts/personal-graph
# drop tests/fixtures/personal-graph/sample.md into the dropzone
# click Ingest, observe takeaways, click Confirm
ls "$PERSONAL_GRAPH_VAULT/wiki/sources/" | tail -3      # new page exists
tail -5 "$PERSONAL_GRAPH_VAULT/wiki/log.md"             # log entry appended
```

## Risk notes

- **AI Gateway latency / cost.** First-time librarian run can take 10-30s + spend tokens. Phase 4 is the only LLM-dependent phase; everything before CP6 ships without it. Keep the librarian model env-overridable so we can A/B between models.
- **qmd model download.** First `qmd embed` downloads ~2GB of GGUF models — surface this in the init script with a clear message.
- **agent-browser Chromium install.** First `npx agent-browser open` triggers a Chromium download — surface in T2.9 docs.
- **Vault concurrent edits.** If the user edits in Obsidian while the librarian writes, the explorer cache could serve stale data briefly. Mitigated by mtime invalidation (T1.4) and the librarian's append-only log (no rewrites).
- **Idempotency drift.** If the librarian's slug-generation logic changes, an old source could be re-ingested. T4.6 idempotency test must lock the slug rule.

## What's NOT in this plan

- Per SPEC §3 "Files NOT to touch": no edits to `components/projects/control-plane/**` or `backend/lib/wiki-memory-*.js`.
- No multi-tenant work, no auth, no DB persistence.
- No rich-text wikilink editor (textarea is enough for MVP).
- No mobile responsive design.

## Pause points

The natural places to stop, demo, and decide whether to continue:

1. **CP3** — Read-only viewer with edit. Shippable as a polished Obsidian companion view; no LLM cost.
2. **CP6** — Add capture + search. Shippable as a "personal knowledge browser." Still no LLM cost.
3. **CP7** — Full librarian. Shippable as the complete art project.
4. **CP8** — Polish + a11y. Production-ready.
