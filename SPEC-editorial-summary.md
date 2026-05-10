# Spec: Personal Graph — Editorial Node Summary

> Extends the existing TWG-source personal-graph feature (see `SPEC.md`). Replaces the utility-style summary panel with a magazine-style article that synthesizes the selected node and its one-hop neighborhood.

## Objective

When a node is selected on the personal-graph page, replace today's utility-style summary panel (raw markdown + bullet takeaways + Marp deck) with an **editorial, magazine-style article** that synthesizes the selected node *and* its one-hop graph neighborhood into a piece a person would actually read.

The article must:

- Read like editorial prose, not like a CLI's stdout. No frontmatter dumps, no "Markdown summary" preamble, no `id / kind / provider` metadata leaking into copy.
- Pull richer context from TWG when the active source is TWG, falling back gracefully when `twg login` is absent or the selected node has no TWG affinity.
- Render in distinct visual sections (hero, body, callouts, neighbor cards, mini relationship diagram, source thumbnail) revealed section-by-section as the backend streams them.
- Keep the existing **Short / Medium / Long** toggle (default: Medium). Length affects content depth, not just font size.
- Keep the **Confirm into wiki** action for vault-raw nodes. Drop the **Generate slides** (Marp deck) flow.

### Users

The single user is the operator of the personal-graph art piece (Ee Venn): a developer using the graph as a second-brain index over their TWG/vault content. They want to glance at a node and instantly understand "what's going on here" without parsing raw `summarize` output.

### Success criteria

- [ ] Selecting a node and choosing a length renders a hero section within ~2s of the first stream event (skeleton-then-fill is acceptable; total time should not exceed today's summarize run by more than 30%).
- [ ] No raw frontmatter keys (`id:`, `kind:`, `provider:`, `relativePath:`) appear in any user-visible string.
- [ ] All four visual elements are reachable in a Long article on a node with ≥3 neighbors: hero thumbnail, mini relationship diagram, neighbor cards, at least one pull-quote.
- [ ] When `twg login` is missing, the article still generates from local context. A subtle inline notice ("TWG context unavailable — using local graph only.") appears, but no error blocks the article.
- [ ] Switching length re-streams a fresh article (no stale Long content showing under a Short toggle).
- [ ] Lint, typecheck, and existing personal-graph tests pass; new tests cover the prompt builder and the streaming protocol.

## Tech Stack

- **Frontend:** Next.js 16 (React 19), Tailwind v4, Motion for React, Base UI, Atlassian Design System tokens via `@/lib/tokens`.
- **Backend:** Express (Node 20), `@steipete/summarize` CLI, existing `personal-graph-twg-source.js` for TWG slice/expand.
- **Streaming:** existing SSE pipeline (`streamIterable` → `streamPersonalGraphSummarize`) extended with new event types.
- **Testing:** `node --test` for backend (`*.test.js` co-located), `node --test` for frontend hooks/components where established, Playwright for any new end-to-end coverage.

## Commands

```
Install:    pnpm install
Dev (full): pnpm run rovodev
Lint:       pnpm run lint
Typecheck:  pnpm run typecheck
Build:      pnpm run build
Targeted backend test: node --test backend/lib/personal-graph-summary-context.test.js
Targeted frontend test: node --test components/arts/personal-graph/personal-graph-summary-panel.test.js
```

## Project Structure

Files this feature **will create or modify**:

```
backend/lib/
  personal-graph-summary-context.js          (modify) — split prompt builder into editorial sections; remove buildMarpDeck
  personal-graph-routes.js                   (modify) — emit new section/visual event types from runSummarizeStream
  personal-graph-twg-source.js               (modify) — export per-node enrichment helper used by summarize
  personal-graph-summary-context.test.js     (new)    — cover prompt builder, section parser, TWG-fallback branch
  personal-graph-routes.test.js              (modify) — assert new event sequence (hero → body → visuals)

components/arts/personal-graph/
  personal-graph-summary-panel.tsx           (modify) — thin shell hosting the new article view
  personal-graph-summary-article.tsx         (new)    — editorial article renderer (hero, body, callouts)
  personal-graph-summary-relationship-mini.tsx (new)  — inline SVG one-hop diagram
  personal-graph-summary-neighbor-cards.tsx  (new)    — clickable neighbor card list
  hooks/use-personal-graph-summary.ts        (modify) — accumulate sections + visuals; remove deck state
  lib/personal-graph-types.ts                (modify) — add SummaryArticle, SummarySection, SummaryVisual types
  personal-graph-summary-article.test.js     (new)    — render contract tests (sections, fallbacks)

app/api/personal-graph/summarize/route.ts    (no change — already proxies)
```

Files this feature **will retire**:

```
- "Generate slides" (Marp deck) UI block in personal-graph-summary-panel.tsx
- generateDeck / deck / deckStatus state in use-personal-graph-summary.ts
- buildMarpDeck export in personal-graph-summary-context.js (and its tests)
- The "deck" branch in runSummarizeStream
```

> Note: `confirm` / `confirmStatus` flow stays intact for vault-raw nodes.

## Code Style

- Tabs for indentation, `Readonly<Props>` interfaces, ADS semantic Tailwind classes (no raw `var(--ds-*)`), Motion for React for section reveals.
- Streaming events extend the existing event union — discriminated by `type`.

Canonical event union:

```ts
// lib/personal-graph-types.ts
export type SummaryArticleSection = {
	id: "hero" | "body" | "context" | "callout";
	heading?: string;
	markdown: string; // already cleaned: no frontmatter, no raw IDs
	pullQuote?: string;
};

export type SummaryVisual =
	| { kind: "thumbnail"; src: string; alt: string }
	| { kind: "relationship-mini"; nodeId: string; neighborIds: string[] }
	| { kind: "neighbor-cards"; nodeIds: string[] };

export type PersonalGraphSummaryEvent =
	| { type: "stage"; stage: "validating" | "enriching" | "writing" | "done" }
	| { type: "twg-status"; status: "online" | "offline" | "skipped" }
	| { type: "section"; section: SummaryArticleSection }
	| { type: "visual"; visual: SummaryVisual }
	| { type: "error"; error: string; stage: string }
	| { type: "done"; nodeId: string; source: "vault" | "twg" };
```

Article reveal sketch:

```tsx
// personal-graph-summary-article.tsx
"use client";

import { motion } from "motion/react";
import { token } from "@/lib/tokens";

interface PersonalGraphSummaryArticleProps {
	sections: ReadonlyArray<SummaryArticleSection>;
	visuals: ReadonlyArray<SummaryVisual>;
	node: VaultNode;
}

export function PersonalGraphSummaryArticle({
	sections,
	visuals,
	node,
}: Readonly<PersonalGraphSummaryArticleProps>) {
	const hero = sections.find((section) => section.id === "hero");
	const thumbnail = visuals.find((visual) => visual.kind === "thumbnail");

	return (
		<article className="space-y-6 text-text">
			{thumbnail ? (
				<motion.figure
					animate={{ opacity: 1, y: 0 }}
					initial={{ opacity: 0, y: 8 }}
					style={{ willChange: "opacity, transform" }}
					transition={{ duration: 0.25, ease: "easeOut" }}
				>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img alt={thumbnail.alt} className="w-full rounded-md" src={thumbnail.src} />
				</motion.figure>
			) : null}
			{hero ? (
				<header>
					<h1 className="text-text" style={{ font: token("font.heading.large") }}>
						{hero.heading ?? node.title}
					</h1>
					<p className="mt-2 text-text-subtle">{hero.markdown}</p>
				</header>
			) : null}
			{/* body / callout / context sections rendered in stream order */}
		</article>
	);
}
```

### Naming conventions

- Section IDs: `hero | body | context | callout` — fixed enum, validated at the SSE boundary.
- Length values: `short | medium | long` — unchanged from today.
- Reuse generic `section` / `visual` event types rather than prefixing.

## Testing Strategy

| Concern | Where | What |
| --- | --- | --- |
| Prompt builds editorial structure | `backend/lib/personal-graph-summary-context.test.js` | Asserts the prompt requests sections, forbids leaking IDs/frontmatter, adapts to length. |
| Section parser is robust | same | Accepts well-formed model output, recovers gracefully from missing sections, never throws on partial output. |
| TWG-offline fallback | same | When TWG enrichment throws auth error, summary still completes from local context and emits `twg-status: offline`. |
| New stream contract | `backend/lib/personal-graph-routes.test.js` | Existing tests updated; new test asserts ordered event sequence (`stage → twg-status → section* → visual* → done`). |
| Hook accumulates correctly | `hooks/use-personal-graph-summary.test.js` (new) | Multiple `section` events append in order; switching length resets state cleanly. |
| Article renders all visual paths | `personal-graph-summary-article.test.js` (new) | Render with 0 neighbors, 1 neighbor, ≥3 neighbors; with/without thumbnail; with/without pull-quote. |

Non-goals for tests: pixel-snapshot of magazine layout (visual review only), live TWG integration tests (mock the slice fetcher).

Coverage expectation: every new exported function has at least one happy-path test plus one fallback/error-path test.

## Boundaries

### Always do

- Use ADS semantic Tailwind classes (`text-text`, `bg-surface-raised`, etc.) and `token("font.heading.*")` for typography.
- Surface `twg-status: offline` to the UI so the user knows when context is degraded.
- Abort previous summarize runs for the same client when length changes (preserve today's `activeSummarizeRuns` behavior).
- Run `pnpm run lint` and `pnpm run typecheck` before declaring the task done.
- Write a regression test alongside any bug fix discovered during implementation.

### Ask first

- Adding a new dependency (e.g., a markdown→AST library for section parsing). Try regex-based section markers first; only escalate if parsing proves fragile.
- Changing the `@steipete/summarize` invocation (model, timeout, prompt size). Today's defaults are tuned; budget any growth in tokens explicitly.
- Adding a new endpoint. Prefer extending the existing `/api/personal-graph/summarize` event stream.
- Touching anything outside `backend/lib/personal-graph-*` and `components/arts/personal-graph/`.

### Never do

- Modify ACRA / RovoDev Serve. All changes live in VPK-Rovo.
- Use `dark:` modifiers on ADS-mapped classes — they auto-flip via `--ds-*` tokens.
- Render frontmatter keys (`id:`, `kind:`, `provider:`, `relativePath:`) anywhere visible to the user.
- Hard-fail the article when TWG is offline. Always degrade to local-only context with a notice.
- Resurrect the Marp deck path. If slides are wanted later, they're a separate feature.
- Block on TWG enrichment for nodes that obviously have no TWG affinity (vault-only raw notes when `source !== "twg"`).

## Open Questions

1. **Section streaming granularity.** Does the `@steipete/summarize` CLI emit progressive output we can parse mid-run, or does it return a single completed string we then split into sections? If single-string only, "section-by-section reveal" is a frontend animation rather than a true backend stream — confirm this is acceptable, or we'll need a model that supports streaming.
2. **TWG enrichment shape.** What concrete data does `personal-graph-twg-source.js` expose per-node beyond what the explorer cache already holds? If the answer is "nothing useful per-node," runtime TWG fetch collapses back to "use the cached explorer better" — fine, but worth flagging before we budget latency for a non-existent network call.
3. **Thumbnail source of truth.** For TWG nodes, should we use the work-item icon, the project avatar, or fetch a cover image? For vault nodes, do raw frontmatter `image:` keys exist in your current vault?
4. **Pull-quote selection.** Algorithmic (longest sentence in body, first sentence with a number, etc.) or model-instructed (the prompt asks the model to mark a quote)? Model-instructed is cleaner but adds prompt tokens.

These don't block starting; they shape the Plan phase.
