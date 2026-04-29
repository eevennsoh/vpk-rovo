# Wiki Clipper — Task List

## Phase 1: Foundation

- [x] **T1** Install deps — `pnpm add defuddle linkedom turndown`
- [x] **T2** Core utilities — slug, frontmatter, URL validation, dedupe, log append

## Phase 2: Capture

- [x] **T3** `captureUrl` — fetch + defuddle extract + save to `wiki/raw/` with frontmatter

## Phase 3: Read Operations

- [x] **T4** `queryWiki` + `lintWiki` — search and validate wiki state

**--- CHECKPOINT A: PASSED (real URL captured, queried, linted) ---**

## Phase 4: Ingest Pipeline

- [x] **T5** `ingestRawSources` — process queued raw → canonical pages via LLM

## Phase 5: Memory Bridge

- [x] **T7** `regenerateMemoryDigest` — wiki → Hermes memory, USER.md untouched

**--- CHECKPOINT B: PASSED (full pipeline tested with mocks) ---**

## Phase 6: Agent Integration

- [x] **T6** Hermes skill — `~/.hermes/skills/research/llm-wiki/SKILL.md`
- [x] **T8** Hermes jobs — nightly ingest (`0 2 * * *`) + digest regen (`0 6 * * *`)

**--- CHECKPOINT C: skill discoverable, job definitions exported ---**
