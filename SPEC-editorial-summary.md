# Spec: Personal Graph Editorial HTML Summary

> Replaces the current utility-style Personal Graph summary panel with a generated, self-contained HTML article for both Obsidian vault and Team Work Graph nodes. The article is built from faithful markdown plus graph context, rendered in-page as the exact exported HTML, and downloaded locally as an `.html` file.

## Objective

When a user selects a node on `/personal-graph`, they should be able to generate an editorial, magazine-style HTML summary that explains the selected node and its one-hop graph neighborhood. The output should feel like a readable report, not CLI stdout or raw graph metadata.

The feature serves two source modes:

- **Obsidian vault:** summarize the selected local vault node and its one-hop vault neighborhood.
- **Team Work Graph:** summarize the selected TWG node and its one-hop TWG neighborhood after TWG auth/setup is available.

The generated article must:

- Stay true to source data from the selected graph. It must not invent facts, hidden state, or source relationships.
- Avoid leaking raw implementation metadata such as `id:`, `kind:`, `provider:`, `relativePath:`, ARIs, or frontmatter dumps into reader-facing prose.
- Render as a self-contained HTML document with inline CSS, SVG diagrams, collapsed evidence, source cards, and lightweight deterministic interactions where useful.
- Use the same HTML string for the on-page preview and the exported `.html` file.
- Keep the existing **Short / Medium / Long** control, defaulting to Medium.
- Remove the manual **Confirm into wiki** action. Raw vault ingestion and wiki synthesis are separate automatic pipeline work, not a summary-panel button.
- Remove the visible **Generate slides** / Marp UI for now, while leaving the backend deck branch dormant unless a later cleanup explicitly removes it.

## Users

The primary user is the operator of the Personal Graph art piece: a developer using the graph as a second-brain index across local vault notes and TWG work context. They want to select a node, understand what is going on, and export a readable standalone HTML artifact they can keep or share manually.

## Non-Goals

- Do not create hosted or remote share links in v1.
- Do not save TWG summaries into the Obsidian wiki.
- Do not collect, store, or proxy TWG secrets, passwords, OAuth tokens, or API tokens.
- Do not make the model produce raw HTML.
- Do not build true token-by-token article streaming in v1.
- Do not resurrect the visible Marp deck flow.
- Do not change the graph renderer, TWG chat prompt flow, or automatic ingest pipeline except where required to provide summary context.

## Success Criteria

- [ ] Selecting an Obsidian or TWG node can generate a summary article with the selected node and one-hop neighbors as context.
- [ ] While generation runs, the UI shows a loader/progress state. When complete, the entire HTML article appears at once.
- [ ] The on-page article preview and downloaded `.html` export use the same generated HTML string.
- [ ] Exported HTML opens standalone in a browser without the VPK app running.
- [ ] Source evidence is collapsed by default.
- [ ] The generated HTML includes inline CSS and at least one deterministic visual element when data exists: source cards, a one-hop SVG relationship diagram, or a thumbnail/icon treatment.
- [ ] No raw frontmatter keys or graph implementation metadata appear in reader-facing prose.
- [ ] TWG summary generation is blocked until TWG setup/auth is available; the app provides non-secret setup guidance and retry affordances.
- [ ] Obsidian vault summaries do not require TWG setup.
- [ ] Short/Medium/Long changes generate different depth while preserving a stable article structure.
- [ ] Reopening an unchanged node can reuse a cached generated article; `Regenerate` bypasses cache.
- [ ] The `Confirm into wiki` and visible Marp deck controls are absent from the summary panel.
- [ ] `pnpm run lint`, `pnpm run typecheck`, and targeted Personal Graph tests pass.

## Tech Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4, Motion for React, Base UI, Atlassian Design System tokens.
- **Backend:** Express, Node 20, current Personal Graph routes, `@steipete/summarize` CLI.
- **TWG:** existing `backend/lib/personal-graph-twg-source.js` cache/expand helpers and current TWG source state.
- **Rendering:** deterministic HTML builder from markdown/article data plus graph context. On-page preview uses sandboxed `iframe srcDoc`.
- **Export:** client-side Blob download of the same HTML string as `<slug>.html`.
- **Testing:** `node --test` for backend and source-level frontend tests, plus browser/a11y smoke checks for UI changes.

## Commands

```bash
pnpm install
pnpm run lint
pnpm run typecheck
node --test backend/lib/personal-graph-summarize.test.js backend/lib/personal-graph-routes.test.js
node --test components/arts/personal-graph/personal-graph-summary-panel.test.js
```

If implementation adds new focused test files, run them explicitly, for example:

```bash
node --test backend/lib/personal-graph-summary-context.test.js
node --test components/arts/personal-graph/personal-graph-summary-html.test.js
node --test components/arts/personal-graph/hooks/use-personal-graph-summary.test.js
```

For UI verification, run the local app and inspect `/personal-graph` with the repo-standard browser workflow.

## Current Baseline

The existing summary path is CLI-backed:

- `backend/lib/personal-graph-summary-context.js` prepares selected-node context and calls `summarize.runSummarizeCli(...)`.
- `backend/lib/personal-graph-summarize.js` runs `@steipete/summarize` through `execFile`, with `--stream off`.
- `backend/lib/personal-graph-routes.js` exposes `/api/personal-graph/summarize` and currently emits SSE-style events.
- `components/arts/personal-graph/hooks/use-personal-graph-summary.ts` manages summary, takeaways, deck state, confirmation state, and cancellation.
- `components/arts/personal-graph/personal-graph-summary-panel.tsx` renders the current utility-style summary, takeaways, confirm button, and Marp deck UI.

The implementation must update this path rather than add a parallel endpoint unless a specific route-level constraint is discovered.

## Product Behavior

### Generation

The user selects a node and clicks a length option or `Regenerate`.

The frontend sends:

- selected `nodeId`
- `length`
- `clientId`
- current source mode
- optional `bypassCache` for `Regenerate`

The backend:

1. Validates the selected node exists in the active graph.
2. Builds a clean context bundle from the selected node and one-hop neighbors.
3. For TWG, requires valid source/cache setup first.
4. For TWG, optionally performs one bounded selected-node expansion when supported and caches the expanded explorer.
5. Runs the existing summarize CLI once.
6. Returns a completed article payload.

The frontend:

1. Parses/normalizes the markdown article.
2. Builds one self-contained HTML document from the article plus graph context.
3. Displays that HTML in a sandboxed iframe.
4. Enables local `.html` export.

### Length

All lengths use the same section model so the renderer stays predictable:

- `short`: concise lede and sections, up to 3 neighbor/source cards.
- `medium`: default, fuller prose, 3-6 neighbor/source cards.
- `long`: richer source evidence, up to 10 neighbor/source cards, more detailed relationship diagram labels.

Changing to a different length generates or loads that length. Clicking the currently selected length does not regenerate. The explicit `Regenerate` button bypasses cache.

### TWG Setup

TWG auth/setup is a prerequisite for TWG summaries. The app must not collect or store secrets.

TWG setup UI may show:

- current TWG status/error
- detected site/domain if available
- non-secret site/domain field only if TWG reports it missing
- work window control, default `7d`
- command guidance such as `twg login` or `twg setup --force-auth`
- retry/refresh button

No password, API token, OAuth token, ASAP token, or Authorization header is accepted in the UI.

### Work Window

TWG work window belongs to the source refresh, not per-summary generation.

- Default TWG window: `7d`.
- Changing the window refreshes the TWG explorer and invalidates cached summaries.
- A generated TWG article should mention the window in the collapsed source evidence area.
- Obsidian vault mode has no time-window control.

### Weak Context

If TWG auth/cache is missing, block generation with setup guidance.

If TWG is available but the selected node has thin context, still generate the article and include a subtle limited-context notice in the HTML and UI. Do not silently fall back to the vault graph.

If an Obsidian node has no neighbors, generate a selected-node-only article and include a limited-context notice.

## Article Content Contract

The model output remains markdown, not HTML. Use a light fixed heading contract to make deterministic HTML rendering reliable while keeping prose natural:

```md
# <article title>
<short lede>

## What this is
...

## Why it matters
...

## Connected work
...

## Source evidence
...
```

The prompt must instruct the model:

- Use only the selected node and supplied one-hop graph context.
- Use source titles and human-readable relationship labels.
- Do not print raw IDs, ARIs, `provider`, `kind`, `relativePath`, or frontmatter keys.
- Do not include YAML frontmatter.
- Do not include markdown fences around the whole answer.
- Do not invent images, links, people, dates, or relationships.
- If evidence is thin, say so plainly.

The implementation may tolerate missing headings by placing unmatched prose into a fallback section, but tests should cover the expected heading contract.

## HTML Document Contract

The HTML builder is deterministic application code. It receives:

```ts
export interface PersonalGraphSummaryHtmlInput {
	articleMarkdown: string;
	edges: ReadonlyArray<VaultEdge>;
	generatedAt: string;
	length: PersonalGraphSummaryLength;
	neighbors: ReadonlyArray<VaultNode>;
	node: VaultNode;
	provider: GraphProvider;
	sourceFingerprint: string;
	sourceNotice?: string;
	workWindow?: string | null;
}
```

It returns:

```ts
export interface PersonalGraphSummaryHtmlDocument {
	filename: string;
	html: string;
	title: string;
}
```

The generated HTML must be self-contained:

- Full `<!doctype html>` document.
- Inline CSS.
- Inline SVG relationship diagram when edges exist.
- Collapsed source evidence using native `<details>` by default.
- Source/neighbor cards derived from graph data.
- Thumbnail/icon treatment derived from source data.
- No external JavaScript bundles.
- No dependency on the VPK app runtime.

Lightweight inline JavaScript is allowed only for deterministic local interactions such as tabs, copy buttons, or diagram filters. The model never writes JavaScript.

### On-Page Rendering

Render the generated HTML with a sandboxed iframe:

```tsx
<iframe
	title="Personal Graph summary article"
	sandbox="allow-popups allow-scripts"
	srcDoc={summaryHtml}
/>
```

Do not use `allow-same-origin` unless a later implementation proves it is necessary. The export/download button lives outside the iframe.

The iframe exists so the exact exported HTML can be previewed without CSS bleed, theme collision, or script access to the parent app.

### Export

Export only `.html` in v1.

The export action creates a `Blob` with `text/html;charset=utf-8` and downloads the same `html` string currently shown in the iframe.

No `.md` export is required. The markdown is an internal source format.

No hosted or shareable remote link is required in v1.

## Visual Data Rules

Visuals come from graph data and source metadata, not model invention.

### Relationship Diagram

Generate an inline SVG showing:

- selected node as the center/root
- one-hop neighbors around it
- edge labels when length is `medium` or `long`
- node type styling from existing Personal Graph kind semantics

For large neighborhoods, cap visible nodes according to length and include a count for hidden neighbors.

### Source Cards

Neighbor/source cards should:

- navigate/select the neighbor node when clicked in-app
- include a separate external link affordance when `externalUrl` exists
- degrade to plain cards in exported HTML where in-app selection is unavailable
- preserve external URLs in exported HTML with `target="_blank"` and `rel="noreferrer"`

### Thumbnail Fallbacks

TWG fallback order:

1. explicit image/avatar/icon URL from TWG metadata
2. favicon/product icon from `externalUrl` or TWG type
3. inline SVG type icon

Obsidian fallback order:

1. frontmatter `image`, `cover`, `thumbnail`, or captured `asset`
2. first markdown image in the page/source body
3. favicon from frontmatter/source URL
4. inline SVG type icon

For self-contained export, local images should be embedded as data URIs when practical. Remote/auth-gated images should fall back to inline SVG icons unless the backend can fetch and embed them safely without credentials.

## Caching

Cache generated summaries by:

```txt
provider + nodeId + length + sourceFingerprint + rendererVersion
```

TWG `sourceFingerprint` includes:

- TWG explorer `generatedAt`
- work window
- selected node ID
- selected node title/body preview hash
- one-hop neighbor IDs and titles

Obsidian `sourceFingerprint` includes:

- selected node ID
- selected node `updatedAt`
- selected node title/body preview hash
- one-hop neighbor IDs
- one-hop neighbor `updatedAt` values

Use in-memory/session cache first unless implementation finds an existing durable cache that cleanly fits. Regenerate bypasses cache. TWG refresh, work-window change, vault ingest, source reset, or node expansion invalidates affected cache entries.

## API and Event Contract

Keep `/api/personal-graph/summarize` as the primary endpoint.

The route may keep SSE framing for compatibility, but v1 does not require content streaming. It should emit progress stages and then one terminal article event.

Recommended event union:

```ts
export type PersonalGraphSummaryStatusStage =
	| "validating"
	| "enriching"
	| "writing"
	| "rendering"
	| "done";

export type PersonalGraphSummarizeEvent =
	| {
		type: "stage";
		action: "summary";
		stage: PersonalGraphSummaryStatusStage;
		nodeId: string;
		length: PersonalGraphSummaryLength;
	}
	| {
		type: "article";
		action: "summary";
		articleMarkdown: string;
		cache: "hit" | "miss" | "bypass";
		inputKind: "url" | "vault-file" | "context-file";
		length: PersonalGraphSummaryLength;
		nodeId: string;
		source: GraphProvider;
		sourceFingerprint: string;
		sourceNotice?: string;
		workWindow?: string | null;
	}
	| {
		type: "error";
		code?: string;
		error: string;
		stage: "error";
	}
	| {
		type: "done";
		action: "summary";
		nodeId: string;
		source: GraphProvider;
		stage: "done";
	};
```

The visible Marp deck UI is removed. The backend `deck` action can remain dormant for now, but new frontend code should not call it.

## Project Structure

Likely files to modify:

```txt
backend/lib/
  personal-graph-summary-context.js
  personal-graph-routes.js
  personal-graph-summarize.js
  personal-graph-routes.test.js
  personal-graph-summarize.test.js

components/arts/personal-graph/
  personal-graph-summary-panel.tsx
  hooks/use-personal-graph-summary.ts
  lib/personal-graph-types.ts
  lib/personal-graph-api.ts
```

Likely new files:

```txt
components/arts/personal-graph/
  personal-graph-summary-html.ts
  personal-graph-summary-html.test.js
  personal-graph-summary-markdown.ts
  personal-graph-summary-markdown.test.js
```

Optional if the implementation becomes large:

```txt
components/arts/personal-graph/
  personal-graph-summary-iframe.tsx
  personal-graph-summary-actions.tsx
```

Avoid touching unrelated Personal Graph graph renderer internals unless a test proves they are needed for summary context.

## UI Requirements

The summary panel should include:

- selected node title
- Short / Medium / Long segmented controls
- Generate / Regenerate action
- progress/loading state
- error/setup state
- sandboxed HTML preview once generated
- Export HTML action once generated
- cache-hit indicator only if useful and unobtrusive

The summary panel should not include:

- Confirm into wiki
- Generate slides
- Marp deck preview/download
- raw markdown preview as the primary UI
- visible raw graph metadata

TWG auth/setup state should block TWG generation before spending a summarize call. Obsidian vault generation should continue to work independently.

## Automatic Ingestion Boundary

Manual confirmation is removed because raw-source ingestion should become automatic. That automatic ingest pipeline is separate work and should emulate the second-brain pattern: raw inputs become structured, linked knowledge entries without requiring the user to press a summary-panel confirm button.

This spec only removes the manual summary-panel action and ensures the generated article can be exported locally. It does not implement the full automatic ingest pipeline unless a separate task explicitly scopes it.

## Testing Strategy

### Backend

- Prompt builder strips or demotes raw metadata from reader-facing instructions.
- Summary route emits `stage -> article -> done` for a cache miss.
- Summary route emits article payload for cache hit without invoking summarize.
- `Regenerate` bypasses cache.
- TWG auth/cache missing returns setup/actionable error instead of falling back to vault.
- TWG selected-node expansion is bounded and failures degrade to limited-context notice when base TWG graph exists.
- Existing deck backend branch remains uncalled by new frontend path.

### Frontend/Shared Helpers

- Markdown section parser accepts expected headings and falls back on malformed markdown.
- HTML builder returns full self-contained HTML document.
- HTML builder escapes user/source/model text.
- HTML builder includes collapsed source evidence by default.
- HTML builder includes SVG relationship diagram when edges exist.
- HTML builder applies thumbnail/icon fallback order.
- Export action downloads exactly the current HTML string.
- Hook resets article/html state on node or length change.
- Cache key changes when source fingerprint changes.

### UI/Browsers

- Obsidian node can generate and preview HTML.
- TWG node can generate and preview HTML after setup.
- TWG missing auth shows setup guidance and does not call summarize.
- Exported HTML opens standalone in a browser.
- The preview and exported file visually match for the same generated HTML.
- Basic accessibility check on the summary controls and generated iframe title.

## Rollout Plan

1. Remove manual summary-panel actions that are no longer product behavior: confirm-to-wiki UI and Marp UI.
2. Update backend summary payload from raw `summary/takeaways` to article markdown plus source fingerprint.
3. Add deterministic markdown parser and HTML builder with tests.
4. Update hook state to track `articleMarkdown`, `summaryHtml`, cache status, and export filename.
5. Render generated HTML in sandboxed iframe and add local `.html` export.
6. Add TWG setup gating and work-window invalidation.
7. Validate Obsidian and TWG paths with targeted tests, lint, typecheck, and browser smoke checks.

## Boundaries

### Always do

- Use existing Personal Graph route and source context where practical.
- Keep generation non-streaming in v1.
- Use markdown as model output and deterministic code for HTML.
- Escape all model/source text before injecting into generated HTML.
- Keep exported HTML self-contained.
- Keep source evidence collapsed by default.
- Preserve cancellation behavior for active summarize runs by `clientId`.
- Run focused tests, lint, and typecheck before completion.

### Ask first

- Adding a markdown parser dependency.
- Adding server-side storage for generated summaries.
- Adding hosted/shareable links.
- Removing the dormant backend deck branch.
- Changing the summarize CLI model, timeout, or invocation strategy.
- Implementing the automatic ingest pipeline beyond removing the manual button.

### Never do

- Collect or store TWG secrets.
- Send TWG data to an unapproved third-party endpoint.
- Let model output raw HTML or JavaScript for direct rendering.
- Use `dangerouslySetInnerHTML` in the React app for the generated document preview.
- Render raw frontmatter, ARIs, IDs, or graph implementation fields in reader-facing prose.
- Fall back from TWG to vault silently.
- Reintroduce the manual Confirm into wiki button.

## Risks and Mitigations

| Risk | Mitigation |
| --- | --- |
| HTML preview and export diverge | Use one generated HTML string for both iframe `srcDoc` and download. |
| Generated HTML leaks app CSS or breaks app layout | Render in sandboxed iframe, not inline React DOM. |
| Model leaks raw metadata | Clean context builder, explicit prompt rules, output tests for forbidden strings. |
| HTML injection from model/source text | Escape text before HTML insertion; model markdown is parsed into a limited internal structure. |
| TWG summary is stale | Tie summaries to source fingerprint and invalidate on refresh/window change. |
| Repeated model calls are expensive | Cache by provider/node/length/source fingerprint; add explicit Regenerate for bypass. |
| Exported HTML references unavailable images | Embed local assets as data URIs or fall back to inline SVG icons. |
| Automatic ingestion scope creeps into summary work | Keep ingest pipeline as separate task; remove manual button only. |

## Open Questions

No blocking product questions remain after the interview. Non-blocking follow-ups:

- Whether a later version should add hosted/shareable links with explicit data/privacy controls.
- Whether a later version should remove the dormant backend deck action entirely.
- Whether automatic raw-source ingestion should be specified in a separate `SPEC.md` or as a follow-up phase of the Personal Graph project.
