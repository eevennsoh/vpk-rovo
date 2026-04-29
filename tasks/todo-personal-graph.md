# Personal Graph — Todo

> Companion to [`tasks/plan-personal-graph.md`](plan-personal-graph.md)
> Spec: [`SPEC.md`](../SPEC.md)

Flat checklist of every atomic task. Check tasks off as they ship. Each `[CP]` line is a checkpoint — pause to demo before proceeding.

## Phase 1 — Read-only graph (S1 + S2)

- [x] **T1.1** Vault adapter (read paths) — `backend/lib/personal-graph-vault.js` exports `getVaultRoot`, `listRaw`, `listWiki`, `readPage`, `parseFrontmatter`
- [x] **T1.2** Vault read tests — `backend/lib/personal-graph-vault.test.js` with tmp fixture
- [x] **T1.3** `.env.local.example` — document optional `PERSONAL_GRAPH_*` env fallbacks
- [x] **T1.4** Vault explorer — `backend/lib/personal-graph-explorer.js` `buildExplorer()` returning `{ nodes, edges }`
- [x] **T1.5** Explorer tests — cross-folder wikilinks resolve, orphans flagged
- [x] **T1.6** Express routes + mount — `backend/lib/personal-graph-routes.js` + `backend/server.js` edit; `GET /explorer`, `GET /page/*`
- [x] **T1.7** Next.js dev proxies — `app/api/personal-graph/{explorer,page/[...slug]}/route.ts`

**[CP1]** Backend serves graph data end-to-end. `curl /api/personal-graph/explorer` returns JSON.

- [x] **T1.8** Frontend types + API client — `lib/personal-graph-{types,api}.ts`
- [x] **T1.9** `useVaultExplorer` hook — `hooks/use-vault-explorer.ts`
- [x] **T1.10** Sigma graph component — `personal-graph-sigma.tsx` (copy-and-diverge from `memory-explorer-sigma-graph.tsx`)
- [x] **T1.11** Surface shell (read-only) — `personal-graph-surface.tsx`
- [x] **T1.12** Replace placeholder + demo wrapper + arts.ts — `index.tsx`, `…/demos/arts/personal-graph-demo.tsx`, `app/data/details/arts.ts`

**[CP2]** Read-only graph live in browser at `/arts/personal-graph`.

- [x] **T1.13** Page reader (Streamdown) — `personal-graph-page.tsx`
- [x] **T1.14** Wire reader into side panel — edit `personal-graph-surface.tsx`
- [x] **T1.15** Local vault picker — `GET /vault`, `POST /vault/select`, `.tmp/personal-graph/vault.json`, header selector UI

**[CP3]** Read-only viewer fully usable as Obsidian companion view. **Shippable milestone — zero LLM cost.**

## Phase 2 — Edit + capture (S3 + S4 + S5)

- [x] **T2.1** Vault adapter writes — extend with `writePage`, `writeRaw`, `appendLog` + mutex
- [x] **T2.2** Write tests — extend test file with concurrency + atomicity coverage
- [x] **T2.3** PUT page route — `personal-graph-routes.js` + `app/api/personal-graph/page/[...slug]/route.ts`
- [x] **T2.4** Edit toggle in page reader — `personal-graph-page.tsx` Edit/Save/Cancel + textarea

**[CP4]** Two-way sync with Obsidian works.

- [x] **T2.5** POST /raw route + proxy — `app/api/personal-graph/raw/route.ts`
- [x] **T2.6** Drop-zone (files only) — `personal-graph-dropzone.tsx`
- [x] **T2.7** Unprocessed-count helper + route — `unprocessedRawSources()` in vault adapter, `GET /unprocessed-count` route + proxy
- [x] **T2.8** Ingest button (LLM disabled) — `personal-graph-ingest-button.tsx`

**[CP5a]** File capture pipeline.

- [x] **T2.9** agent-browser capture module — `backend/lib/personal-graph-capture.js`
- [x] **T2.10** Capture tests — `backend/lib/personal-graph-capture.test.js`
- [x] **T2.11** POST /capture route + proxy — `app/api/personal-graph/capture/route.ts`
- [x] **T2.12** Drop-zone URL handling — extend `personal-graph-dropzone.tsx` to detect URLs and route to `/capture`

**[CP5b]** Full capture pipeline (files + URLs).

## Phase 3 — Search (S6)

- [x] **T3.1** qmd init script — `scripts/personal-graph-qmd-init.sh`
- [x] **T3.2** qmd module — `backend/lib/personal-graph-qmd.js` with CLI/MCP/grep modes
- [x] **T3.3** qmd tests — `backend/lib/personal-graph-qmd.test.js`
- [x] **T3.4** GET /search route + proxy — `app/api/personal-graph/search/route.ts`
- [x] **T3.5** `useVaultSearch` hook — `hooks/use-vault-search.ts`
- [x] **T3.6** Search input component — `personal-graph-search.tsx`
- [x] **T3.7** Wire search into surface header — edit `personal-graph-surface.tsx`

**[CP6]** Vault fully navigable: graph + read + edit + capture + search. **Strong demo milestone — still no LLM cost.**

## Phase 4 — Librarian + ingestion (S7)

- [x] **T4.1** Summarize module — `backend/lib/personal-graph-summarize.js`
- [x] **T4.2** Summarize tests — `backend/lib/personal-graph-summarize.test.js`
- [x] **T4.3** Librarian skeleton — `backend/lib/personal-graph-librarian.js` with stages enum + AsyncIterable shape
- [x] **T4.4** Librarian summarize stage — read source + emit takeaways + pause
- [x] **T4.5** Librarian linking stage — qmd related-pages call
- [x] **T4.6** Librarian action plan + execute — LLM JSON tools schema → vault writes; idempotency lock
- [x] **T4.7** Librarian tests (full pipeline) — `backend/lib/personal-graph-librarian.test.js`
- [x] **T4.8** POST /ingest SSE route + proxy — `app/api/personal-graph/ingest/route.ts` with stream passthrough
- [x] **T4.9** `useLibrarianStream` hook — `hooks/use-librarian-stream.ts`
- [x] **T4.10** Confirmation gate UI — extend `personal-graph-ingest-button.tsx` with takeaways list, related-pages list, Confirm/Discard

**[CP7]** Full second-brain UX works end-to-end. Drop → Ingest → Confirm → graph grows.

## Phase 5 — Polish + ship (S8)

- [x] **T5.1** Log timeline — `personal-graph-log.tsx` + `GET /log` route + proxy
- [x] **T5.2** Motion transitions — side panel slide, node pulse, ingest stage transitions; respect `prefers-reduced-motion`
- [x] **T5.3** a11y pass — `<details>` graph fallback lists nodes/edges; drop-zone has visible focus + keyboard alternative; ADS analyzer unavailable in this session
- [x] **T5.4** Attribution — update `arts.ts` description with second-brain + Karpathy LLM Wiki + qmd credits
- [x] **T5.5** Final verification — SPEC.md §5 commands all green

**[CP8]** Ready to ship.
