# SPEC: Server-Side Web Clipper for Wiki Ingest

## 1. Objective

Build a server-side web clipping pipeline that captures web pages as normalized
markdown, stores them in the wiki (`/Users/esoh/wiki/raw/`), ingests raw captures
into canonical wiki pages, and regenerates the MEMORY.md digest.

**Target user:** RovoDev agent during web research sessions.

**Core flow:**

```
URL → defuddle extract → normalized markdown → wiki/raw/
     → ingest → canonical wiki pages → MEMORY.md regeneration
```

**What this is NOT:**

- Not a browser extension or manual clipping UX
- Not an autonomous crawler — captures only pages explicitly opened for reading
- Not a replacement for manual Obsidian Web Clipper (that stays as optional parallel input)

## 2. Architecture

### Extraction engine: defuddle

Use [`defuddle`](https://github.com/kepano/defuddle) (`defuddle/node` bundle with
`linkedom` for DOM parsing) as the content extraction and markdown conversion engine.

Why defuddle over alternatives:

- Extracts content + metadata (title, author, published, description, schemaOrgData)
- Built-in markdown conversion (`markdown: true` option)
- Handles code blocks, footnotes, math, callouts out of the box
- Lightweight Node.js API, no headless browser needed for most pages
- Same engine used by Obsidian Web Clipper

### Module layout

Single module at `backend/lib/wiki-clipper.js` with these exports:

```
captureUrl(url, options?)    → { filePath, metadata, isUpdate }
ingestRawSources()           → { processed, skipped, errors }
queryWiki(query)             → { results }
lintWiki()                   → { issues }
regenerateMemoryDigest()     → { entriesWritten }
```

### Integration seam

- Triggered via Hermes skill commands only (no direct REST endpoint in v1)
- Skill file at `~/.hermes/skills/research__llm-wiki/SKILL.md`
- Execution path: skill instructions → RovoDev agent → `runRovoDevBackgroundTask()`
  → structured result parsing
- The backend module is called directly from the task executor, not via HTTP

## 3. Detailed Design

### 3.1 `captureUrl(url, options?)`

Fetches a URL, extracts content via defuddle, saves normalized markdown to
`wiki/raw/`.

**Input:**

```javascript
{
  url: "https://example.com/article",
  category: "articles",  // "articles" | "papers" | "transcripts" | "bookmarks"
  tags: ["rovo", "ai"],  // optional
  forceRefresh: false     // re-capture even if URL already captured
}
```

**Process:**

1. Fetch HTML via `fetch()` (Node.js native)
2. Parse with `linkedom` → DOM Document
3. Extract via `Defuddle(document, url, { markdown: true })`
4. Generate slug from title (lowercase, hyphenated, max 80 chars)
5. Check dedupe: search `wiki/raw/` for matching `source_url` or `canonical_url`
6. If exists and `!forceRefresh`: return existing file path, `isUpdate: false`
7. If exists and `forceRefresh`: update the existing file
8. Write markdown with frontmatter to `wiki/raw/{category}/YYYY/MM/{slug}.md`
9. Append capture event to `wiki/log.md`

**Output frontmatter:**

```yaml
---
title: "Extracted Title"
source_url: "https://example.com/article"
canonical_url: "https://example.com/article"  # resolved from <link rel=canonical>
captured_at: "2026-04-11T12:00:00Z"
capture_method: defuddle
content_type: article
author: "Author Name"
published: "2026-01-15"
description: "Article summary"
word_count: 1234
tags: [rovo, ai]
status: queued
---
```

**Dedupe policy:**

- Primary key: canonical URL (or source URL if no canonical)
- Secondary key: content hash (SHA-256 of markdown body)
- On re-capture with same URL: update existing file, bump `captured_at`, set
  `status: updated`
- On re-capture with same content hash but different URL: link as alias, don't
  duplicate

**Output path convention:**

```
wiki/raw/articles/2026/04/defuddle-content-extraction.md
wiki/raw/papers/2026/04/attention-is-all-you-need.md
wiki/raw/transcripts/2026/04/keynote-team-25.md
wiki/raw/bookmarks/2026/04/useful-tool-link.md
```

Create year/month directories automatically if they don't exist.

**Skip list:** Do not clip these page types (detect via URL pattern or defuddle
word count):

- Search result pages (google.com/search, bing.com/search, etc.)
- Login/auth pages (contains login form, < 100 words content)
- Error pages (HTTP 4xx/5xx)
- Navigation shells (< 50 words extracted content)

**Fallback:** If defuddle extraction produces < 50 words of content and the page
is likely JS-heavy, return a structured error indicating browser rendering may be
needed. Do NOT auto-fall-back to a headless browser in v1 — just report the
failure. The caller (agent) can decide to use browser workspace for rendering.

### 3.2 `ingestRawSources()`

Reads new/updated raw captures and generates or updates canonical wiki pages.

**Process:**

1. Scan `wiki/raw/` for files with `status: queued` or `status: updated`
2. For each raw file:
   a. Read frontmatter + markdown body
   b. Determine target wiki section (entity, concept, comparison) from tags and content
   c. Generate or update canonical page in appropriate directory
   d. Add `[[wikilinks]]` to related existing pages (minimum 2 outbound links)
   e. Update `wiki/index.md` with new entries
   f. Set raw file `status: ingested`
   g. Append ingest event to `wiki/log.md`
3. Return summary of processed/skipped/errored files

**Canonical page generation:** Uses RovoDev (via `runRovoDevBackgroundTask()`) to:

- Summarize raw article into wiki-format page
- Extract key facts, entities, relationships
- Determine page type (entity/concept/comparison/query)
- Generate proper frontmatter per wiki SCHEMA.md
- Identify and create wikilinks to existing pages

### 3.3 `queryWiki(query)`

Search the wiki for relevant pages. Simple text search in v1.

**Process:**

1. Read all wiki pages (entities, concepts, comparisons, queries)
2. Search frontmatter titles, tags, and body content
3. Return ranked results with title, path, relevance snippet

### 3.4 `lintWiki()`

Validate wiki consistency.

**Checks:**

- Every page has valid frontmatter per SCHEMA.md
- Every page is listed in `index.md`
- All `[[wikilinks]]` resolve to existing pages
- No duplicate canonical URLs across raw files
- No orphaned raw files (status stuck at "queued" for > 7 days)

### 3.5 `regenerateMemoryDigest()`

Rebuild MEMORY.md from wiki content. This is the bridge between the wiki
knowledge store and the agent's working memory.

**Process:**

1. Read all canonical wiki pages
2. Generate a condensed digest: key entities, recent captures, important facts
3. Write to the Hermes memory system via `addHermesMemoryEntry()`
4. Do NOT modify USER.md — that's a separate concern

## 4. Skill Definition

### Skill: `research/llm-wiki`

Location: `~/.hermes/skills/research__llm-wiki/SKILL.md`

**Operations exposed to the agent:**

| Command | Description |
| --- | --- |
| `capture_url <URL> [--category X] [--tags a,b]` | Clip a URL to wiki/raw/ |
| `ingest` | Process queued raw captures into canonical pages |
| `query <search terms>` | Search wiki for relevant pages |
| `lint` | Validate wiki consistency |
| `digest` | Regenerate memory digest from wiki |

The skill SKILL.md provides instructions for the agent on when and how to use
each command. The actual execution happens via the backend module functions.

### Hermes Jobs (v1)

| Job | Schedule | Action |
| --- | --- | --- |
| `wiki-nightly-ingest` | `0 2 * * *` | Run `ingestRawSources()` |
| `wiki-digest-regen` | `0 6 * * *` | Run `regenerateMemoryDigest()` |

Watchlist capture and bookmark inbox processing deferred to v2.

## 5. Dependencies

### New npm packages

| Package | Purpose | Size |
| --- | --- | --- |
| `defuddle` | Content extraction + markdown conversion | ~50KB |
| `linkedom` | Server-side DOM for defuddle | ~200KB |

No other dependencies required. `fetch()` is native in Node.js 18+.

### Existing code reused

- `backend/lib/rovo-task-executor.js` — `runRovoDevBackgroundTask()` for LLM-assisted ingest
- `backend/lib/hermes-skills.js` — skill registration and discovery
- `backend/lib/hermes-rovo-context.js` — memory system integration
- `backend/lib/hermes-jobs-local.js` — scheduled job execution
- Wiki filesystem at `/Users/esoh/wiki/` — storage target

## 6. Files to Create / Modify

### Create

| File | Purpose |
| --- | --- |
| `backend/lib/wiki-clipper.js` | Core clipper module (captureUrl, ingest, query, lint, digest) |
| `backend/lib/wiki-clipper.test.js` | Tests |
| `~/.hermes/skills/research__llm-wiki/SKILL.md` | Hermes skill definition |

### Modify

| File | Change |
| --- | --- |
| `package.json` | Add `defuddle`, `linkedom` |
| `backend/lib/hermes-jobs-local.js` | Register nightly ingest + digest jobs (or create job config files) |

### No changes to

- `backend/server.js` — no new REST endpoints in v1
- `backend/lib/hermes-rovo-context.js` — memory system API already exists
- `USER.md` — explicitly out of scope
- `backend/lib/browser-workspace-manager.js` — no auto-fallback to browser rendering

## 7. Testing Strategy

### Unit tests (`backend/lib/wiki-clipper.test.js`)

Run with: `node --test backend/lib/wiki-clipper.test.js`

| Test | Validates |
| --- | --- |
| `captureUrl` with valid article URL | Markdown saved with correct frontmatter, path convention |
| `captureUrl` dedupe on same URL | Returns existing path, no duplicate file created |
| `captureUrl` with `forceRefresh` | Updates existing file, bumps `captured_at` |
| `captureUrl` with SERP URL | Skipped, returns skip reason |
| `captureUrl` with low-content page | Returns extraction failure, no file written |
| `captureUrl` path generation | Correct YYYY/MM/slug.md convention |
| Frontmatter normalization | All required fields present, dates ISO 8601 |
| `ingestRawSources` with queued files | Status updated to ingested, log.md appended |
| `lintWiki` with broken wikilinks | Reports unresolved links |
| `lintWiki` with missing index entries | Reports missing entries |
| Slug generation edge cases | Unicode, long titles, special chars |

### Integration tests (manual via Hermes)

| Test | Validates |
| --- | --- |
| Clip a normal article URL | Full flow: fetch → extract → save → frontmatter correct |
| Re-clip same URL | Dedupe works, no duplicate |
| Clip a JS-heavy page | Graceful failure with message, no crash |
| Run ingest after capture | Canonical page created, index.md updated, log.md entry |
| Regenerate digest | Memory entries updated, USER.md unchanged |
| Disable browser automation | Direct-fetch clipping still works |

## 8. Boundaries

### Always

- Validate URLs before fetching (no private IPs, no file:// URIs)
- Write frontmatter on every raw capture
- Append to `wiki/log.md` on every write
- Respect `wiki/SCHEMA.md` conventions for canonical pages
- Use ISO 8601 dates everywhere
- Create year/month directories if missing

### Ask First

- Adding new npm dependencies beyond defuddle + linkedom
- Changing the wiki SCHEMA.md format
- Adding REST endpoints for clipper operations
- Modifying existing wiki pages during ingest (vs. creating new ones)

### Never

- Auto-clip search result pages or navigation shells
- Modify USER.md
- Fetch private/internal network URLs
- Fall back to headless browser automatically (report failure instead)
- Delete or modify files in `wiki/raw/` during ingest (raw sources are immutable
  per SCHEMA.md — only `status` field may be updated)
- Crawl/spider links from captured pages

## 9. Acceptance Criteria

- [ ] `pnpm install` adds defuddle + linkedom without conflicts
- [ ] `captureUrl("https://example.com/article")` saves markdown with correct
      frontmatter to `wiki/raw/articles/YYYY/MM/slug.md`
- [ ] Re-capturing same URL returns existing path (dedupe works)
- [ ] SERP URLs are rejected with skip reason
- [ ] `ingestRawSources()` processes queued files into canonical pages
- [ ] `wiki/index.md` updated after ingest
- [ ] `wiki/log.md` has entries for both capture and ingest events
- [ ] `regenerateMemoryDigest()` updates Hermes memory without touching USER.md
- [ ] `lintWiki()` detects broken wikilinks and missing index entries
- [ ] All unit tests pass: `node --test backend/lib/wiki-clipper.test.js`
- [ ] Lint passes: `pnpm run lint`
- [ ] TypeScript passes: `pnpm tsc --noEmit`

## 10. Assumptions

- `/Users/esoh/wiki` is the canonical long-term memory store
- Wiki SCHEMA.md conventions are stable and should be followed as-is
- MEMORY.md is a generated digest backed by the wiki (ongoing revamp)
- USER.md is not changed by this feature
- defuddle's Node.js bundle (`defuddle/node`) works with linkedom
- Node.js 18+ is available (native fetch)
- RovoDev Serve is available for LLM-assisted canonical page generation during ingest
- Raw sources are immutable once written (per wiki SCHEMA.md: "never modify files in raw/")
  — only the `status` frontmatter field is updated

## References

- Plan: `PLAN-web-clipping-wiki-ingest.md`
- defuddle: https://github.com/kepano/defuddle
- Obsidian Web Clipper: https://github.com/obsidianmd/obsidian-clipper
- Wiki schema: `/Users/esoh/wiki/SCHEMA.md`
- qmd: https://github.com/tobi/qmd (deferred — possible v2 fallback)
- summarize: https://github.com/steipete/summarize (deferred)
