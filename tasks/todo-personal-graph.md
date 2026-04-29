# Personal Graph — Todo

> Companion to [`tasks/plan-personal-graph.md`](plan-personal-graph.md)
> Spec: [`SPEC.md`](../SPEC.md)

Flat checklist of every atomic task. Check tasks off as they ship. Each `[CP]` line is a checkpoint — pause to demo before proceeding.

## Phase 1 — Read-only graph (S1 + S2)

- [ ] **T1.1** Vault adapter (read paths) — `backend/lib/personal-graph-vault.js` exports `getVaultRoot`, `listRaw`, `listWiki`, `readPage`, `parseFrontmatter`
- [ ] **T1.2** Vault read tests — `backend/lib/personal-graph-vault.test.js` with tmp fixture
- [ ] **T1.3** `.env.example` — add 4 `PERSONAL_GRAPH_*` env vars
- [ ] **T1.4** Vault explorer — `backend/lib/personal-graph-explorer.js` `buildExplorer()` returning `{ nodes, edges }`
- [ ] **T1.5** Explorer tests — cross-folder wikilinks resolve, orphans flagged
- [ ] **T1.6** Express routes + mount — `backend/lib/personal-graph-routes.js` + `backend/server.js` edit; `GET /explorer`, `GET /page/*`
- [ ] **T1.7** Next.js dev proxies — `app/api/personal-graph/{explorer,page/[...slug]}/route.ts`

**[CP1]** Backend serves graph data end-to-end. `curl /api/personal-graph/explorer` returns JSON.

- [ ] **T1.8** Frontend types + API client — `lib/personal-graph-{types,api}.ts`
- [ ] **T1.9** `useVaultExplorer` hook — `hooks/use-vault-explorer.ts`
- [ ] **T1.10** Sigma graph component — `personal-graph-sigma.tsx` (copy-and-diverge from `memory-explorer-sigma-graph.tsx`)
- [ ] **T1.11** Surface shell (read-only) — `personal-graph-surface.tsx`
- [ ] **T1.12** Replace placeholder + demo wrapper + arts.ts — `index.tsx`, `…/demos/arts/personal-graph-demo.tsx`, `app/data/details/arts.ts`

**[CP2]** Read-only graph live in browser at `/arts/personal-graph`.

- [ ] **T1.13** Page reader (Streamdown) — `personal-graph-page.tsx`
- [ ] **T1.14** Wire reader into side panel — edit `personal-graph-surface.tsx`

**[CP3]** Read-only viewer fully usable as Obsidian companion view. **Shippable milestone — zero LLM cost.**

## Phase 2 — Edit + capture (S3 + S4 + S5)

- [ ] **T2.1** Vault adapter writes — extend with `writePage`, `writeRaw`, `appendLog` + mutex
- [ ] **T2.2** Write tests — extend test file with concurrency + atomicity coverage
- [ ] **T2.3** PUT page route — `personal-graph-routes.js` + `app/api/personal-graph/page/[...slug]/route.ts`
- [ ] **T2.4** Edit toggle in page reader — `personal-graph-page.tsx` Edit/Save/Cancel + textarea

**[CP4]** Two-way sync with Obsidian works.

- [ ] **T2.5** POST /raw route + proxy — `app/api/personal-graph/raw/route.ts`
- [ ] **T2.6** Drop-zone (files only) — `personal-graph-dropzone.tsx`
- [ ] **T2.7** Unprocessed-count helper + route — `unprocessedRawSources()` in vault adapter, `GET /unprocessed-count` route + proxy
- [ ] **T2.8** Ingest button (LLM disabled) — `personal-graph-ingest-button.tsx`

**[CP5a]** File capture pipeline.

- [ ] **T2.9** agent-browser capture module — `backend/lib/personal-graph-capture.js`
- [ ] **T2.10** Capture tests — `backend/lib/personal-graph-capture.test.js`
- [ ] **T2.11** POST /capture route + proxy — `app/api/personal-graph/capture/route.ts`
- [ ] **T2.12** Drop-zone URL handling — extend `personal-graph-dropzone.tsx` to detect URLs and route to `/capture`

**[CP5b]** Full capture pipeline (files + URLs).

## Phase 3 — Search (S6)

- [ ] **T3.1** qmd init script — `scripts/personal-graph-qmd-init.sh`
- [ ] **T3.2** qmd module — `backend/lib/personal-graph-qmd.js` with CLI/MCP/grep modes
- [ ] **T3.3** qmd tests — `backend/lib/personal-graph-qmd.test.js`
- [ ] **T3.4** GET /search route + proxy — `app/api/personal-graph/search/route.ts`
- [ ] **T3.5** `useVaultSearch` hook — `hooks/use-vault-search.ts`
- [ ] **T3.6** Search input component — `personal-graph-search.tsx`
- [ ] **T3.7** Wire search into surface header — edit `personal-graph-surface.tsx`

**[CP6]** Vault fully navigable: graph + read + edit + capture + search. **Strong demo milestone — still no LLM cost.**

## Phase 4 — Librarian + ingestion (S7)

- [ ] **T4.1** Summarize module — `backend/lib/personal-graph-summarize.js`
- [ ] **T4.2** Summarize tests — `backend/lib/personal-graph-summarize.test.js`
- [ ] **T4.3** Librarian skeleton — `backend/lib/personal-graph-librarian.js` with stages enum + AsyncIterable shape
- [ ] **T4.4** Librarian summarize stage — read source + emit takeaways + pause
- [ ] **T4.5** Librarian linking stage — qmd related-pages call
- [ ] **T4.6** Librarian action plan + execute — LLM JSON tools schema → vault writes; idempotency lock
- [ ] **T4.7** Librarian tests (full pipeline) — `backend/lib/personal-graph-librarian.test.js`
- [ ] **T4.8** POST /ingest SSE route + proxy — `app/api/personal-graph/ingest/route.ts` with stream passthrough
- [ ] **T4.9** `useLibrarianStream` hook — `hooks/use-librarian-stream.ts`
- [ ] **T4.10** Confirmation gate UI — extend `personal-graph-ingest-button.tsx` with takeaways list, related-pages list, Confirm/Discard

**[CP7]** Full second-brain UX works end-to-end. Drop → Ingest → Confirm → graph grows.

## Phase 5 — Polish + ship (S8)

- [ ] **T5.1** Log timeline — `personal-graph-log.tsx` + `GET /log` route + proxy
- [ ] **T5.2** Motion transitions — side panel slide, node pulse, ingest stage transitions; respect `prefers-reduced-motion`
- [ ] **T5.3** a11y pass — `ads_analyze_localhost_a11y` clean; `<details>` graph fallback; drop-zone keyboard alternative
- [ ] **T5.4** Attribution — update `arts.ts` description with second-brain + Karpathy LLM Wiki + qmd credits
- [ ] **T5.5** Final verification — SPEC.md §5 commands all green

**[CP8]** Ready to ship.
