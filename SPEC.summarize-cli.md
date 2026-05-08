# Spec: Personal Graph Summarize CLI Integration

## Objective

Integrate `@steipete/summarize` into Personal Graph as a qmd-style local CLI dependency. Users can select a graph node, generate a short, medium, or long summary from the selected node plus one-hop neighbors, optionally generate a Marp markdown slide deck from that preview, and confirm raw vault summaries into the existing librarian ingest flow.

## Implementation Tasks

- [x] Add the `@steipete/summarize` runtime dependency and repository defaults for model and timeout.
- [ ] Replace the default Personal Graph summarizer with a backend CLI adapter that resolves the local `summarize` binary, passes length/model/timeout options, supports abort, and reports setup/runtime errors without AI Gateway fallback.
- [ ] Add a Personal Graph summary context builder that validates selected nodes and assembles selected-node-plus-neighbor context for vault and TWG explorers.
- [ ] Add an SSE endpoint at `/api/personal-graph/summarize` that accepts `{ nodeId, length, action }`, aborts the previous in-flight summary run, streams stage/summary/deck/error/done events, uses cached TWG explorers, and does not refresh TWG on length changes.
- [ ] Extend the librarian confirm path so a validated preview summary can be supplied as an override, qmd related-page lookup still runs, and the existing source page/log writing behavior is preserved.
- [ ] Add a selected-node summary panel above the Personal Graph composer with Short, Medium, Long, Confirm for raw vault nodes, and Generate slides/Download `.md`.
- [ ] Add focused backend and source-level UI tests for the adapter, route, override confirm path, and composer panel contract.

## Commands

- Targeted backend tests: `node --test backend/lib/personal-graph-summarize.test.js backend/lib/personal-graph-routes.test.js backend/lib/personal-graph-librarian.test.js`
- Targeted source UI test: `node --test app/arts/personal-graph/page.test.js`
- Typecheck: `pnpm run typecheck`
- Lint: `pnpm run lint`
- Browser check: run the app and inspect `/personal-graph`

## Boundaries

- Always: use the local `summarize` CLI path, preserve vault-bound input restrictions, and keep generated summaries/decks ephemeral until raw-node Confirm.
- Ask first: adding arbitrary filesystem summarization, binary uploads, PPTX export, or automatic deck persistence.
- Never: silently fall back to AI Gateway summarization when the CLI is missing, misconfigured, times out, or exits non-zero.

## Acceptance Criteria

- Summary generation requires a selected graph node and includes one-hop graph context.
- Length switches abort the previous run and regenerate with the selected length.
- TWG summary generation reads the current cached explorer and does not rerun TWG on every length change.
- Confirm appears only for vault raw nodes and writes through the existing librarian source-page/log flow using the preview summary.
- Deck generation produces Marp markdown preview/download only and does not write into the vault.
