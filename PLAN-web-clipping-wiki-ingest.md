# Server-Side Web Clipper for Wiki Ingest

## Summary

Do not rebuild the Obsidian browser extension. Reuse only its clipping engine
server-side.

The target design is:

- RovoDev opens a page during web research
- a backend clipper service converts that page into markdown
- the markdown is saved into `/Users/esoh/wiki/raw/...`
- the wiki ingest flow updates canonical pages
- `MEMORY.md` is regenerated from the wiki digest
- `USER.md` remains unchanged

Capture policy:

- clip only pages the agent explicitly opens for reading
- do not auto-save raw search-result pages or every discovered URL
- keep manual Obsidian Web Clipper as an optional parallel input, not the
  primary path

## Deconstruction

### 1. Treat Obsidian Web Clipper as a library, not a UX

Use the existing `obsidian-clipper` engine through its CLI/API rather than
extracting code from the extension UI.

What we keep:

- fetch + parse webpage HTML
- template matching / clip rendering
- markdown generation and metadata shaping

What we discard:

- browser-extension buttons
- manual user action flow
- direct vault handoff UX
- extension-only settings surfaces

Implementation choice:

- prefer a small Node wrapper module in VPK-Rovo that calls the clipper API
  directly
- keep a CLI fallback path for operational simplicity and debugging
- define one house template for wiki capture so output is deterministic

### 2. Normalize clip output for the wiki

Every saved markdown source should include frontmatter with:

- `title`
- `source_url`
- `canonical_url`
- `captured_at`
- `capture_method: obsidian-clipper`
- `content_type`
- `tags`
- `status: queued`

Output path convention:

- `raw/articles/YYYY/MM/<slug>.md` for normal web articles
- `raw/bookmarks/YYYY/MM/<slug>.md` for lightweight saves
- `raw/transcripts/` for transcript-style captures
- `raw/assets/` for downloaded local media when needed

Dedupe policy:

- primary key: canonical URL
- secondary key: content hash
- if the same URL is re-captured, update the existing raw file or create a
  revision note instead of duplicating

## Integration changes

### 3. Add a wiki clipper service in the backend

Create a dedicated backend module responsible for:

- fetching/opening the chosen external URL
- calling the clipper engine
- writing normalized markdown into `/Users/esoh/wiki/raw/...`
- logging capture events into `log.md`
- returning the saved file path and metadata

Primary integration seam:

- use the Rovo/Hermes execution path in
  [backend/lib/rovo-task-executor.js](/Users/esoh/Documents/Labs/VPK-rovo/backend/lib/rovo-task-executor.js)
  for jobs and background workflows
- expose capture actions via backend API so Hermes jobs and the future
  `llm-wiki` skill can trigger clipping
- keep prompt-context assembly in
  [backend/lib/hermes-rovo-context.js](/Users/esoh/Documents/Labs/VPK-rovo/backend/lib/hermes-rovo-context.js)
  unchanged until ingest finishes, then regenerate digest memory

### 4. Connect clipping to “opened pages only”

Define clipping as a post-open action, not a post-search action.

Behavior:

- when web research opens a page judged worth reading, trigger `capture_url`
- save the markdown source immediately
- enqueue ingest for canonical wiki updates
- optionally skip clipping for login pages, SERPs, error pages, and obvious nav
  shells

If browser automation is the page-entry path:

- hook clipping off the page URL after a successful open/navigation event
- use browser-rendered HTML only when simple HTTP fetch extraction is weak
- keep the browser workspace code in
  [backend/lib/browser-workspace-manager.js](/Users/esoh/Documents/Labs/VPK-rovo/backend/lib/browser-workspace-manager.js)
  as the live browsing layer, not the markdown renderer

### 5. Extend the llm-wiki workflow around capture

Create or install the local Hermes `research/llm-wiki` skill and give it four
explicit operations:

- `capture_url`
- `ingest_captured_sources`
- `query_wiki`
- `lint_wiki`

For `capture_url`:

- take URL plus optional category/tags
- save markdown via the clipper service
- append to wiki log
- enqueue ingest

For ingest:

- read new raw markdown
- update canonical wiki pages
- regenerate `MEMORY.md` digest

### 6. Add semi-automatic capture jobs

Use Hermes jobs for curated background capture, not autonomous crawling.

v1 jobs:

- watchlist capture from `ops/watchlists/*.txt` or feed files
- bookmark inbox processing
- nightly ingest of newly captured raw files
- qmd reindex after ingest
- morning digest regeneration

This gives you automatic collection without filling the wiki with low-signal
search noise.

## Test plan

- Clip a normal article URL and confirm markdown is saved with normalized
  frontmatter.
- Re-clip the same URL and confirm dedupe/update behavior.
- Open a search page and confirm it is not auto-saved.
- Open a selected result page and confirm it is auto-saved.
- Run ingest after capture and confirm canonical wiki pages and `log.md`
  update.
- Regenerate `MEMORY.md` and confirm the digest reflects the new source while
  `USER.md` is unchanged.
- Disable browser automation and confirm direct-fetch clipping still works for
  simple pages.
- Force a JS-heavy page and confirm the system can fall back to rendered-page
  capture.

## Assumptions

- `/Users/esoh/wiki` remains the canonical long-term memory store.
- `MEMORY.md` is still being revamped into a generated digest backed by the
  wiki.
- `USER.md` is not changed.
- Auto-capture is limited to pages explicitly opened by the agent.
- Manual Obsidian clipping can continue, but server-side clipping becomes the
  default path for RovoDev research.

## References

- Obsidian Web Clipper: <https://github.com/obsidianmd/obsidian-clipper>
- qmd: <https://github.com/tobi/qmd>
- summarize: <https://github.com/steipete/summarize>
