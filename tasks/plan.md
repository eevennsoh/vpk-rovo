# Wiki Clipper — Task Plan

> Spec: `SPEC-web-clipping-wiki-ingest.md`

## Dependency Graph

```
T1: Install deps (defuddle + linkedom)
 │
 ├──► T2: Core utilities (slug, frontmatter, URL validation, dedupe scan)
 │     │
 │     ├──► T3: captureUrl — fetch + extract + save to wiki/raw/
 │     │     │
 │     │     └──► T5: ingestRawSources — process queued → canonical pages
 │     │          │
 │     │          └──► T7: regenerateMemoryDigest — wiki → Hermes memory
 │     │
 │     └──► T4: queryWiki + lintWiki — read-only wiki operations
 │
 ├──► T6: Hermes skill (research/llm-wiki SKILL.md)
 │
 └──► T8: Hermes jobs (nightly ingest + digest regen)
```

## Design Decisions

**Frontmatter parsing:** Regex-based YAML parser (split on `---` delimiters).
Wiki frontmatter is simple key-value with arrays — no YAML library needed.

**Dedupe index:** In-memory URL→file map built by scanning `wiki/raw/` frontmatter.
No persistent index file — the raw/ directory IS the index. Scan cost is fine for
a personal wiki (< 10K files).

**Ingest LLM integration:** `ingestRawSources()` calls `runRovoDevBackgroundTask()`
with a structured prompt including `wiki/SCHEMA.md` and `wiki/index.md` so the LLM
generates canonical pages with correct frontmatter and valid wikilinks.

**Memory digest:** `regenerateMemoryDigest()` reads canonical pages, produces a
condensed summary, and writes via `addHermesMemoryEntry("memory", ...)`. Clears
old wiki-digest entries first to avoid accumulation.

**No REST endpoints:** All operations triggered via Hermes skill only. Backend
module functions are called directly from the task executor.

## Phases

### Phase 1: Foundation (T1–T2)

Install deps, build shared utilities. No wiki writes yet.

### Phase 2: Capture (T3)

Full captureUrl flow: fetch → extract → dedupe → save → log. First wiki writes.

### Phase 3: Read operations (T4)

queryWiki and lintWiki for validation.

**─── CHECKPOINT A: capture a real URL, lint it, query it ───**

### Phase 4: Ingest pipeline (T5)

Raw → canonical wiki pages via LLM. Most complex task.

### Phase 5: Memory bridge (T7)

Wiki → Hermes memory digest regeneration.

**─── CHECKPOINT B: full pipeline works end-to-end ───**

### Phase 6: Skill + jobs (T6, T8)

Wire into agent execution model.

**─── CHECKPOINT C: agent can invoke capture/ingest via skill ───**

---

## Task Details

### T1: Install Dependencies

**Files:** `package.json`
**Action:** `pnpm add defuddle linkedom`

**AC:**
- `pnpm install` succeeds without conflicts
- `require("defuddle/node")` resolves
- `require("linkedom")` resolves

**Verify:** `pnpm install && node -e "require('defuddle/node'); require('linkedom'); console.log('ok')"`

---

### T2: Core Utilities

**Create:** `backend/lib/wiki-clipper.js` (initial scaffold with utilities only)
**Create:** `backend/lib/wiki-clipper.test.js` (utility tests)

Implement these internal functions:

| Function | Purpose |
| --- | --- |
| `generateSlug(title)` | Lowercase, hyphenated, max 80 chars, ASCII-safe |
| `buildOutputPath(category, slug)` | `wiki/raw/{category}/YYYY/MM/{slug}.md` |
| `serializeFrontmatter(metadata)` | Object → YAML frontmatter string |
| `parseFrontmatter(content)` | Markdown string → `{ frontmatter, body }` |
| `validateUrl(url)` | Reject private IPs, file://, non-http(s) |
| `isSkippableUrl(url)` | Detect SERPs, login pages by URL pattern |
| `buildDedupeIndex(wikiRawDir)` | Scan raw/ frontmatter → `Map<canonicalUrl, filePath>` |
| `computeContentHash(body)` | SHA-256 of markdown body |
| `appendToLog(wikiDir, action, subject, details)` | Append to `wiki/log.md` per log format |

**AC:**
- `generateSlug("Hello World — A Test!")` → `"hello-world-a-test"`
- `generateSlug` truncates at 80 chars on word boundary
- `generateSlug` handles Unicode by transliterating or stripping
- `buildOutputPath("articles", "my-article")` → correct `YYYY/MM/` prefix
- `serializeFrontmatter` produces valid YAML between `---` delimiters
- `parseFrontmatter` round-trips with `serializeFrontmatter`
- `validateUrl` rejects `file://`, `127.0.0.1`, `192.168.*`, `10.*`, `localhost`
- `validateUrl` accepts `https://example.com`
- `isSkippableUrl` catches `google.com/search`, `bing.com/search`
- `buildDedupeIndex` returns Map of canonical URLs from existing raw files
- `computeContentHash` returns hex SHA-256

**Verify:** `node --test backend/lib/wiki-clipper.test.js`

---

### T3: captureUrl

**Modify:** `backend/lib/wiki-clipper.js` (add `captureUrl` export)
**Modify:** `backend/lib/wiki-clipper.test.js` (add capture tests)

**Process:**
1. Validate URL (reject private IPs, skip SERPs)
2. `fetch(url)` to get HTML
3. `parseHTML(html)` via linkedom → DOM Document
4. `Defuddle(document, url, { markdown: true })` → extracted content + metadata
5. Check word count — if < 50, return `{ skipped: true, reason: "low-content" }`
6. Generate slug from extracted title
7. Build dedupe index, check for existing capture of same canonical URL
8. If exists and `!forceRefresh`: return `{ filePath, metadata, isUpdate: false }`
9. If exists and `forceRefresh`: overwrite, set `status: updated`
10. Write frontmatter + body to `wiki/raw/{category}/YYYY/MM/{slug}.md`
11. Create year/month directories if missing (`fs.mkdir recursive`)
12. Append capture event to `wiki/log.md`
13. Return `{ filePath, metadata, isUpdate }`

**AC:**
- Valid URL produces markdown file at correct path
- File has all required frontmatter fields (title, source_url, canonical_url, captured_at, capture_method, content_type, word_count, tags, status)
- `captured_at` is ISO 8601
- `capture_method` is `"defuddle"`
- `status` is `"queued"` for new captures
- Duplicate URL returns existing path without creating new file
- `forceRefresh: true` overwrites existing, sets `status: "updated"`
- SERP URL returns `{ skipped: true, reason: "search-results-page" }`
- Low-content page (< 50 words) returns `{ skipped: true, reason: "low-content" }`
- Year/month directories created automatically
- `wiki/log.md` has capture entry

**Verify:** `node --test backend/lib/wiki-clipper.test.js`

---

### T4: queryWiki + lintWiki

**Modify:** `backend/lib/wiki-clipper.js` (add `queryWiki`, `lintWiki` exports)
**Modify:** `backend/lib/wiki-clipper.test.js`

**queryWiki(query):**
1. Read all wiki pages (entities/, concepts/, comparisons/, queries/)
2. Parse frontmatter for title + tags
3. Simple substring match on title, tags, body
4. Return `{ results: [{ title, path, snippet, score }] }` sorted by relevance

**lintWiki():**
1. Check every canonical page has valid frontmatter (title, created, updated, type, tags, sources)
2. Check every page is listed in `index.md`
3. Check all `[[wikilinks]]` resolve to existing files
4. Check no duplicate canonical URLs in raw/
5. Check no orphaned raw files (queued > 7 days)
6. Return `{ issues: [{ type, path, message }] }`

**AC:**
- `queryWiki("atlassian")` returns the existing atlassian entity page
- `queryWiki("nonexistent")` returns empty results
- `lintWiki()` returns clean for a valid wiki state
- `lintWiki()` detects missing index entry
- `lintWiki()` detects broken `[[wikilink]]`
- `lintWiki()` detects duplicate canonical URLs in raw/

**Verify:** `node --test backend/lib/wiki-clipper.test.js`

---

### ── CHECKPOINT A ──

Manually test the capture flow:

```javascript
const { captureUrl, queryWiki, lintWiki } = require("./backend/lib/wiki-clipper");

// 1. Capture a real article
const result = await captureUrl({ url: "https://www.atlassian.com/software/rovo" });
console.log(result.filePath);  // wiki/raw/articles/2026/04/...

// 2. Verify dedupe
const dup = await captureUrl({ url: "https://www.atlassian.com/software/rovo" });
console.log(dup.isUpdate);  // false — already exists

// 3. Query
const q = await queryWiki("rovo");
console.log(q.results.length > 0);  // true

// 4. Lint
const lint = await lintWiki();
console.log(lint.issues);  // should be clean or show expected issues
```

Also run: `pnpm run lint && pnpm tsc --noEmit`

---

### T5: ingestRawSources

**Modify:** `backend/lib/wiki-clipper.js` (add `ingestRawSources` export)
**Modify:** `backend/lib/wiki-clipper.test.js`

**Process:**
1. Scan `wiki/raw/` for files with `status: queued` or `status: updated`
2. For each raw file:
   a. Read frontmatter + body
   b. Read `wiki/SCHEMA.md` and `wiki/index.md` for context
   c. Call `runRovoDevBackgroundTask()` with prompt:
      - "Generate a canonical wiki page from this raw source"
      - Include SCHEMA.md, current index.md, existing page list
      - Ask for: page type, frontmatter, body with wikilinks, suggested index entry
   d. Parse structured JSON response for generated page content
   e. Write canonical page to `wiki/{type}s/{slug}.md` (e.g., `wiki/entities/rovo.md`)
   f. Update `wiki/index.md` with new entry
   g. Update raw file `status` field to `"ingested"` (only field modified in raw/)
   h. Append ingest event to `wiki/log.md`
3. Return `{ processed, skipped, errors }`

**AC:**
- Queued raw file is processed into a canonical page
- Canonical page has valid frontmatter per SCHEMA.md
- Canonical page has at least 2 `[[wikilinks]]`
- `wiki/index.md` updated with new entry
- Raw file status changed to `"ingested"`
- `wiki/log.md` has ingest entry
- Already-ingested files are skipped
- LLM failure for one file doesn't block others

**Verify:** `node --test backend/lib/wiki-clipper.test.js`

---

### T7: regenerateMemoryDigest

**Modify:** `backend/lib/wiki-clipper.js` (add `regenerateMemoryDigest` export)
**Modify:** `backend/lib/wiki-clipper.test.js`

**Process:**
1. Read all canonical wiki pages (entities, concepts, comparisons, queries)
2. Build condensed digest: entity list, recent captures, key facts
3. Read current Hermes memory entries via `getHermesMemory("memory")`
4. Remove any existing wiki-digest entries (identified by prefix marker)
5. Write new digest entry via `addHermesMemoryEntry("memory", digestText)`
6. Return `{ entriesWritten }`

**AC:**
- Digest reflects current wiki state (entities, concepts present)
- Old wiki-digest entries removed before writing new one
- USER.md / user memory target NOT touched
- Digest fits within Hermes memory char limits (truncate if needed)
- Empty wiki produces empty/minimal digest

**Verify:** `node --test backend/lib/wiki-clipper.test.js`

---

### ── CHECKPOINT B ──

Full pipeline test:

```javascript
// 1. Capture
await captureUrl({ url: "https://www.atlassian.com/software/rovo" });

// 2. Ingest
const ingestResult = await ingestRawSources();
console.log(ingestResult.processed);  // 1

// 3. Verify canonical page exists
// Check wiki/entities/ or wiki/concepts/ for new page

// 4. Regenerate digest
const digestResult = await regenerateMemoryDigest();
console.log(digestResult.entriesWritten);  // > 0

// 5. Lint should be clean
const lint = await lintWiki();
console.log(lint.issues);  // minimal/zero issues
```

Run: `node --test backend/lib/wiki-clipper.test.js && pnpm run lint && pnpm tsc --noEmit`

---

### T6: Hermes Skill Definition

**Create:** `~/.hermes/skills/research__llm-wiki/SKILL.md`

The SKILL.md instructs the agent when and how to use each wiki operation:

- `capture_url <URL> [--category X] [--tags a,b]` — clip a page worth reading
- `ingest` — process queued raw captures into canonical wiki pages
- `query <terms>` — search wiki for relevant pages
- `lint` — validate wiki consistency, report issues
- `digest` — regenerate memory digest from wiki

Include guidance on:
- When to capture (pages opened for reading, not SERPs)
- What categories to use
- When to run ingest (after a batch of captures)
- Tagging conventions (match wiki SCHEMA.md taxonomy)

**AC:**
- Skill appears in `listHermesSkills()` output
- Skill has title, summary, and full instructions
- Agent can discover and load the skill
- Instructions are clear about capture vs. skip criteria

**Verify:** `node -e "const { listHermesSkills } = require('./backend/lib/hermes-skills'); listHermesSkills({ query: 'wiki' }).then(s => console.log(s.map(x => x.id)))"`

---

### T8: Hermes Scheduled Jobs

**Create:** Job config files in `~/.hermes/jobs/` (or register via job provider API)

| Job | Schedule | Action |
| --- | --- | --- |
| `wiki-nightly-ingest` | `0 2 * * *` | `ingestRawSources()` |
| `wiki-digest-regen` | `0 6 * * *` | `regenerateMemoryDigest()` |

**Modify:** Wire job execution to call wiki-clipper module functions. This may
require a small bridge in `backend/lib/hermes-jobs-local.js` or a job handler
registration pattern — inspect `createHermesJobsLocalProvider` to determine the
right integration point.

**AC:**
- Jobs listed by job provider
- Jobs have valid cron schedules
- Manual trigger of each job succeeds
- Job errors are logged, not thrown

**Verify:** `node -e "..." // list jobs via provider API`

---

### ── CHECKPOINT C ──

End-to-end via agent:

1. Load skill: select `research/llm-wiki` in Hermes
2. Ask agent: "capture https://www.atlassian.com/software/rovo"
3. Verify raw file created
4. Ask agent: "ingest"
5. Verify canonical page created
6. Ask agent: "digest"
7. Verify memory updated
8. Ask agent: "lint"
9. Verify clean report
10. Ask agent: "query rovo"
11. Verify results returned

Final validation:
```bash
node --test backend/lib/wiki-clipper.test.js
pnpm run lint
pnpm tsc --noEmit
```
