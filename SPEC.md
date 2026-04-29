# Personal Graph — Spec

> Spec for the Personal Graph art project at `/arts/personal-graph`. Source of truth for what we're building, where the files live, how to verify, and what's out of bounds. Update this file when scope changes.

## Context

Reproduce Nicholas Spisak's `second-brain` (Karpathy LLM-Wiki pattern) experience as a VPK art project — *without* installing the second-brain CLI skills. The Obsidian vault at `/Users/esoh/Documents/Obsidian Vault/Graph` is already structured to second-brain's spec (`raw/`, `wiki/{sources,entities,concepts,synthesis}/`, `index.md`, `log.md`, `schema.md`, `AGENTS.md`). We translate the second-brain *workflow* into a UI loop powered by VPK's existing primitives.

Strong adjacency: the rovo-app **memories** feature (`components/projects/control-plane/memories-surface.tsx` + `memory-explorer-sigma-graph.tsx`) already binds an Obsidian vault to a Sigma+Graphology force-graph through `backend/lib/wiki-memory-provider.js` and `/api/wiki/memory-explorer`. Personal Graph is a focused, art-directed re-skin of that machinery + an LLM ingestion route that doesn't exist yet in VPK.

Locked decisions:
1. **Vault binding** — env var `PERSONAL_GRAPH_VAULT` pointing directly at the existing path; no copy.
2. **Scope** — viewer + editor + AI ingestion (full second-brain UX).
3. **Code reuse** — copy-and-diverge from `memory-explorer-sigma-graph.tsx`; keep production memories untouched.
4. **Ingest UX** — drop-zone + explicit "Ingest" button (no auto-watch).
5. **Optional integrations included** — second-brain's three companions (see §7): `agent-browser` for URL capture, `qmd` for related-page lookup + UI search, `summarize` capability via AI Gateway (no new external CLI dep — flagged for confirmation).

---

## 1. Objective

A live, art-directed view of the user's personal knowledge graph that turns raw clippings into linked wiki pages through a visible "librarian" loop.

**Target user:** the user (single-tenant). Demo viewers see a polished art piece with realistic content.

**Success looks like:**
- Drop a markdown/HTML/URL into the drop-zone → it lands in `raw/`. Click **Ingest** → within ~30s the librarian creates/updates pages under `wiki/sources/`, `wiki/entities/`, `wiki/concepts/`, or `wiki/synthesis/`, appends a parseable `type: ingest` entry to `wiki/log.md`, and updates `wiki/index.md`. The graph re-renders with the new node + wikilink edges. Click any node to read/edit its markdown.
- Opening the route loads in <1s on cached data and never hits the LLM by default.
- Obsidian and Personal Graph stay in sync (same files; both can edit).

**Non-goals (MVP):** multi-tenant or auth; cloud sync / DB persistence; inline rich-text editing of wikilinks; mobile-first responsive design.

---

## 2. Commands

No new top-level scripts. Personal Graph runs inside the existing `pnpm run rovodev` stack.

| Command | Purpose |
|---|---|
| `pnpm run rovodev` | Full dev stack (RovoDev Serve + backend + frontend); includes Personal Graph. |
| `pnpm run dev` | Backend + frontend only (assumes RovoDev Serve already running). |
| `pnpm run lint` / `pnpm run typecheck` | Pre-merge verification. |
| `pnpm exec node --test backend/lib/personal-graph-*.test.js` | Backend unit tests. |
| `pnpm exec playwright test tests/personal-graph.spec.ts` | E2E for drop → ingest → graph update. |

**New env vars** (added to `.env.example` and `.env.local`):
- `PERSONAL_GRAPH_VAULT` — absolute path to vault. Default: `/Users/esoh/Documents/Obsidian Vault/Graph`.
- `PERSONAL_GRAPH_LIBRARIAN_MODEL` — optional override; defaults to `OPENAI_MODEL`.
- `PERSONAL_GRAPH_QMD_COLLECTION` — qmd collection name. Default: `personal-graph`.
- `PERSONAL_GRAPH_QMD_MCP_URL` — optional `qmd mcp --http --daemon` URL; if set, librarian uses MCP instead of CLI shell-out.

Reuses existing AI Gateway env (`AI_GATEWAY_URL`, `AI_GATEWAY_USE_CASE_ID`, `AI_GATEWAY_CLOUD_ID`, `AI_GATEWAY_USER_ID`, `OPENAI_MODEL`) via `backend/lib/ai-gateway-helpers.js`.

**Companion tool prerequisites** (one-time):
- `npm i -g @tobilu/qmd` (Node ≥22, `brew install sqlite` on macOS for extension support; first run downloads ~2GB of GGUF models).
- `qmd collection add "$PERSONAL_GRAPH_VAULT/wiki" --name personal-graph` and `qmd embed`.
- `agent-browser` is already vendored at `utils/agent-browser/`. First call hits `agent-browser install` to ensure Chromium.

---

## 3. Project Structure

### Files to create

**Frontend:**
- `components/arts/personal-graph/index.tsx` — replace placeholder; mounts the surface.
- `components/arts/personal-graph/personal-graph-surface.tsx` — main shell (graph + side panel + drop-zone + search bar). ~300 lines.
- `components/arts/personal-graph/personal-graph-sigma.tsx` — copy-and-diverge of `memory-explorer-sigma-graph.tsx`. Node colors keyed to vault folders (`source`, `entity`, `concept`, `synthesis`, `raw`); edges keyed to `wiki_link` vs `frontmatter_source`.
- `components/arts/personal-graph/personal-graph-page.tsx` — Streamdown reader; toggle to `<textarea>` for edit + Save.
- `components/arts/personal-graph/personal-graph-dropzone.tsx` — drag-and-drop for `.md` / `.txt` / `.html` files **and pasted URLs**; URLs → `POST /api/personal-graph/capture`, files → `POST /api/personal-graph/raw`.
- `components/arts/personal-graph/personal-graph-ingest-button.tsx` — unprocessed-count badge; calls `POST /api/personal-graph/ingest`; streams librarian SSE (takeaways + qmd related hits) into the side panel.
- `components/arts/personal-graph/personal-graph-search.tsx` — search input → `/api/personal-graph/search`; results list links into the page reader and pulses the corresponding graph node.
- `components/arts/personal-graph/personal-graph-log.tsx` — parses `wiki/log.md` ingest entries into a timeline.
- `components/arts/personal-graph/lib/personal-graph-api.ts` — typed client for `/api/personal-graph/*`.
- `components/arts/personal-graph/lib/personal-graph-types.ts` — `VaultNode`, `VaultEdge`, `VaultExplorer`, `IngestEvent`, `LibrarianStream`, `QmdResult`, `CaptureResult`.
- `components/arts/personal-graph/hooks/use-vault-explorer.ts` — fetch + cache; SWR-style revalidate on focus + after ingest.
- `components/arts/personal-graph/hooks/use-librarian-stream.ts` — SSE consumer for librarian progress.
- `components/arts/personal-graph/hooks/use-vault-search.ts` — debounced qmd search hook.

**Backend (Express + Next proxy):**
- `backend/lib/personal-graph-vault.js` — vault FS adapter: list raw, read/write wiki page, parse frontmatter, append log.
- `backend/lib/personal-graph-explorer.js` — builds `{ nodes, edges }` from wiki frontmatter + wikilinks. Mirrors `wiki-memory-explorer.js` shape but vault-folder-driven.
- `backend/lib/personal-graph-librarian.js` — LLM ingestion loop. Reads `AGENTS.md` as system prompt; calls summarize → qmd related → action plan → vault writes; emits SSE.
- `backend/lib/personal-graph-capture.js` — URL/file capture. URLs use `utils/agent-browser/browser.ts` (`AgentBrowser.open` → `snapshot` + `getTitle` + optional `screenshot`) to write a normalized `raw/` markdown source plus optional asset.
- `backend/lib/personal-graph-summarize.js` — `summarize`-equivalent via `ai-gateway-helpers.js`; returns `{ takeaways: string[], summary: string }`.
- `backend/lib/personal-graph-qmd.js` — qmd integration (CLI default; HTTP MCP if `PERSONAL_GRAPH_QMD_MCP_URL` set; grep fallback if qmd missing). Exposes `relatedPages(text)`, `search(query, opts)`, `ensureCollection()`.
- `backend/lib/personal-graph-routes.js` — route handlers; mounted in `backend/server.js` under `/api/personal-graph`.
- `backend/lib/personal-graph-{vault,explorer,librarian,capture,qmd,summarize}.test.js` — `node --test` suites.

**Next.js proxies (dev only):**
- `app/api/personal-graph/explorer/route.ts`
- `app/api/personal-graph/page/[...slug]/route.ts` (GET + PUT)
- `app/api/personal-graph/raw/route.ts` (POST drop)
- `app/api/personal-graph/capture/route.ts` (POST URL → raw)
- `app/api/personal-graph/ingest/route.ts` (POST + SSE)
- `app/api/personal-graph/log/route.ts`
- `app/api/personal-graph/search/route.ts` (qmd-backed search)

**Scripts:**
- `scripts/personal-graph-qmd-init.sh` — idempotent `qmd collection add` + `qmd embed`.

### Files to modify
- `app/data/details/arts.ts` — replace `personal-graph` description with the real one + attribution.
- `components/website/demos/arts/personal-graph-demo.tsx` — render the new surface.
- `backend/server.js` — `app.use("/api/personal-graph", require("./lib/personal-graph-routes"))`.
- `.env.example` — add the four new env vars.

### Files NOT to touch
- `components/projects/control-plane/memories-surface.tsx`
- `components/projects/control-plane/memory-explorer-sigma-graph.tsx`
- `backend/lib/wiki-memory-*.js`
- Anything under `/rovo-app/` or `control-plane/`.

### Vault changes
The vault is allowed to change. The librarian writes to `wiki/**`, `wiki/log.md`, and `wiki/index.md`. Folders are not restructured.

---

## 4. Code Style

VPK defaults (CLAUDE.md):
- Tabs in TS/JS. `@/` import alias. React 19 (`use(Context)`, `ref` as prop).
- Components ≤150 lines; logic into hooks; static data into `lib/` files.
- `Readonly<Props>` interfaces. Compound `Surface = { Container, Graph, Side, Drop }` namespace.
- Tokens via `bg-surface`, `text-text-subtle`, etc. — no `bg-[var(--ds-...)]` patterns.
- Streamdown for markdown; `@atlaskit/icon/core/*` for icons.
- `cn()` for class merging; ternaries (no `&&`) for conditional render.
- Motion for React (`motion/react`); use `--duration-medium ease-in-out` tokens.

Backend:
- CommonJS (matches existing `backend/lib/*.js`).
- One responsibility per `personal-graph-*.js` file.
- All FS access goes through `personal-graph-vault.js`. No `fs` calls elsewhere.
- Errors throw with shape `{ code, message, cause }`.

LLM:
- One `librarian.run({ vault, sources })` entry point.
- System prompt = literal contents of `${vault}/AGENTS.md`.
- Per-source user message includes raw content + a JSON-shaped tools descriptor (`write_page`, `append_log`, `update_index`); the librarian responds with a JSON action plan that the backend executes (no model-side FS).
- Stream progress as SSE: `{ type: "stage", stage: "reading" | "summarizing" | "writing" | "linking" | "logging", source, page? }`.

---

## 5. Testing Strategy

**Backend (`node --test`):**
- `personal-graph-vault.test.js` — round-trip read/write; frontmatter preserved; appending log entry produces parseable line; concurrent writes serialized.
- `personal-graph-explorer.test.js` — fixture vault → expected `{ nodes, edges }`; cross-folder wikilinks resolve; orphans become `dangling: true` edges.
- `personal-graph-capture.test.js` — mock `AgentBrowser`; URL → expected `raw/` markdown shape (`url`, `title`, `captured`); screenshot path returned; browser closed even on error.
- `personal-graph-qmd.test.js` — mock `execFile`; `relatedPages` parses `--json`; missing binary → grep fallback; MCP env var → HTTP path.
- `personal-graph-summarize.test.js` — mock AI Gateway; returns `{ takeaways: string[5], summary: string }`; malformed JSON throws typed error.
- `personal-graph-librarian.test.js` — full pipeline with all three companions mocked; expected SSE order; idempotent re-run produces no new pages or log entries.

**Frontend (Playwright, `tests/personal-graph.spec.ts`):**
- `/arts/personal-graph` renders graph from current vault.
- Drop `.md` → unprocessed badge increments.
- Paste URL → "Capturing…" → `raw/<slug>.md` exists on disk (mock `AgentBrowser` in CI).
- Search query → results list → clicking highlights node (mock qmd in CI).
- Click **Ingest** → SSE stages stream (takeaways + qmd related list) → user clicks **Confirm** → graph adds nodes within 30s.
- Click node → page renders → Edit + Save → disk persists → graph rebuilds.

**Manual a11y checks:**
- `ads_analyze_localhost_a11y` on `/arts/personal-graph`. Drop-zone has visible focus + keyboard alternative ("Add raw source" button).
- Graph canvas has a textual fallback list under `<details>` for screen readers.

**Verification before declaring done:**
1. `pnpm run lint && pnpm run typecheck` — clean.
2. `pnpm exec node --test backend/lib/personal-graph-*.test.js` — pass.
3. `pnpm exec playwright test tests/personal-graph.spec.ts` — pass.
4. With `pnpm run rovodev` running, hit `/arts/personal-graph` via `/agent-browser`; screenshot graph; drop a fixture markdown file; confirm a new wiki page appears in the vault on disk and a new node renders.
5. Open the vault in Obsidian; confirm the new page validates (frontmatter, wikilinks resolve, log entry parseable).

---

## 6. Boundaries

**Always:**
- Treat the vault filesystem as source of truth. Re-read on every explorer fetch (mtime-invalidated cache).
- Append-only to `wiki/log.md`. Never rewrite past entries.
- Pause for human confirmation per `AGENTS.md` step 3: librarian streams takeaways and *waits* for Confirm before writing.
- Use Obsidian wikilinks (`[[wiki/concepts/Name]]`) when writing pages.
- Add second-brain attribution in `arts.ts` description.

**Ask first:**
- Adding a new top-level dependency (`gray-matter`, `chokidar`, etc.).
- Renaming or moving any vault folder.
- Changing the wiki schema (`wiki/schema.md`) or `AGENTS.md`.
- Increasing librarian model spend (e.g., switching to a longer-context model).
- Replacing in-process `summarize` with a shell-out to a real `summarize` CLI.
- Switching qmd from CLI shell-out to MCP HTTP mode by default.
- Embedding agent-browser screenshots into wiki pages (vs. keeping them in `raw/assets/` only).

**Never:**
- Edit anything under `raw/` after creation.
- Modify `components/projects/control-plane/**` or `backend/lib/wiki-memory-*.js`.
- Watch the vault and auto-ingest. Ingestion only runs on explicit button press.
- Ship without CI mocks for the AI Gateway, agent-browser, and qmd. No live external calls in CI.
- Persist anything outside the vault (no SQLite, no `data/` JSON). qmd's `~/.cache/qmd` is qmd's responsibility, not ours.
- Run agent-browser headless against authenticated user sessions without explicit consent. Public URLs only for now.
- Send vault contents anywhere except the AI Gateway and the local qmd process.

---

## 7. Optional integrations (summarize, qmd, agent-browser)

### 7.1 agent-browser — URL capture

Already present at `utils/agent-browser/browser.ts` (`AgentBrowser` class wrapping `npx agent-browser`). Used by `personal-graph-capture.js` exclusively for URL inputs:

```js
const browser = new AgentBrowser();
await browser.open(url);
const snapshot = await browser.snapshot();          // accessibility tree → text
const title = await browser.getTitle();
const screenshotPath = `raw/assets/${slug}.png`;
await browser.screenshot(screenshotPath);
await browser.close();
```

Writes:
```
raw/<YYYY-MM-DD>-<slug>.md     ← frontmatter (url, title, captured) + snapshot text
raw/assets/<YYYY-MM-DD>-<slug>.png
```

UX: URL paste in drop-zone → "Capturing…" state → routes to `/api/personal-graph/capture`. After raw lands, user clicks **Ingest** to run the librarian.

### 7.2 qmd — related-page lookup + UI search

qmd is a local hybrid search engine (BM25 + vector + LLM rerank, all on-device). Two roles:

**Role A — librarian "linking" pass (server-side):** before writing a new wiki page, the librarian asks `personal-graph-qmd.relatedPages(draftSummary)` for top-K matching existing pages. The action plan must reference these as wikilinks if relevant. Stops the wiki from sprouting duplicate concept pages.

**Role B — UI search (client-side):** search box in the Personal Graph header. Debounced calls to `GET /api/personal-graph/search?q=…` → backend issues `qmd query` → results render as a list and pulse the corresponding nodes in the Sigma graph.

**Setup:** `scripts/personal-graph-qmd-init.sh` — `qmd collection add "$PERSONAL_GRAPH_VAULT/wiki" --name personal-graph` then `qmd embed`. Idempotent. Auto-runs on first ingest if `qmd status` shows the collection missing.

**Degradation:** if `qmd` isn't on PATH, backend falls back to a naive grep over `wiki/**/*.md` and the UI shows a quiet "qmd not installed — semantic search unavailable" hint with a one-line install command. Never blocks core flows.

### 7.3 summarize — pre-ingest takeaways (in-process)

Second-brain's `summarize` CLI is a thin wrapper that turns links/files/media into one-paragraph summaries. We implement the same capability through `backend/lib/personal-graph-summarize.js` against the AI Gateway — no new external dependency.

```js
// personal-graph-summarize.js
async function summarizeRaw({ content, kind }) {
  const completion = await aiGateway.complete({
    model: process.env.PERSONAL_GRAPH_LIBRARIAN_MODEL,
    system: SUMMARIZE_PROMPT,
    user: content,
    response_format: { type: "json_object" },
  });
  return JSON.parse(completion); // { takeaways: string[5], summary: string }
}
```

Drives the librarian's mandatory "Pause and report 3-5 key takeaways" step from `AGENTS.md` line 23. User sees those takeaways streamed into the side panel and clicks **Confirm** before the librarian writes any wiki pages.

**Why not the real `summarize` CLI?** Adds a runtime dep, duplicates the AI Gateway path (separate auth/spend), splits control over model selection. Capability is identical; this route is already paved in VPK. **Only deviation from second-brain's tool list — flagged in §6 Boundaries as "Ask first" so it can be overridden.**

### Cross-cutting integration rules

- All three integrations degrade gracefully when their CLI/binary is missing.
- agent-browser closes the page after every capture (try/finally).
- qmd queries are read-only from request paths; `qmd embed` only from init script or a manual "Reindex" admin button.

---

## Critical files

- `app/data/details/arts.ts:11-17` — current scaffold metadata.
- `components/arts/personal-graph/index.tsx:1-24` — current placeholder.
- `components/projects/control-plane/memory-explorer-sigma-graph.tsx:1-150` — copy source for the Sigma graph.
- `backend/lib/wiki-memory-provider.js`, `wiki-memory-explorer.js`, `wiki-route-handlers.js` — pattern reference for new `personal-graph-*.js` modules.
- `backend/lib/ai-gateway-helpers.js` — JWT-signed completion client to reuse for librarian + summarize.
- `lib/rovo-runtime-types.ts` — `WikiMemoryExplorerNode`/`Edge` shape to mirror.
- `components/website/demos/arts/personal-graph-demo.tsx` — demo registry wrapper.
- `utils/agent-browser/browser.ts:22-84` — `AgentBrowser` class for URL capture.
- `/Users/esoh/Documents/Obsidian Vault/Graph/AGENTS.md` — librarian system prompt (verbatim).
- `/Users/esoh/Documents/Obsidian Vault/Graph/wiki/schema.md` — frontmatter contract.
- `~/Documents/Labs/hermes/optional-skills/research/qmd/SKILL.md` — qmd CLI surface reference.

## Build sequence

1. **Backend vault adapter + tests** — read-only first (`listRaw`, `listWiki`, `readPage`, `parseFrontmatter`).
2. **Explorer + GET routes + Next proxies** — graph data flowing end-to-end with no LLM.
3. **Frontend surface + Sigma graph** — render existing vault; node click opens page in side panel (read-only).
4. **Edit mode** — textarea + PUT page; vault round-trip verified.
5. **Drop-zone + raw POST** — files land in `raw/`; "unprocessed" count appears.
6. **agent-browser capture path** — URL paste → snapshot+screenshot → `raw/`. Mock `AgentBrowser` in tests.
7. **qmd integration** — init script, `personal-graph-qmd.js` (CLI + MCP + grep fallback), search route, UI search box.
8. **summarize-equivalent + librarian + SSE ingest route** — feature-flagged; mock gateway in tests, real gateway in dev.
9. **Confirmation gate UI** — takeaways from summarize step + qmd related-page hits streamed; Confirm/Discard flow before wiki writes.
10. **Polish** — Motion transitions, log timeline, a11y pass, attribution to Spisak's second-brain + Karpathy's LLM Wiki + Lütke's qmd.
