## Spec: TWG Source for Personal Graph

> Adds Team Work Graph (TWG) as an alternative data source for the `/personal-graph` art, alongside the existing Obsidian vault source. Includes a chat that can re-query TWG and reshape the graph from natural-language questions.

## Objective

Today the Personal Graph art at `app/personal-graph/` only visualizes a local Obsidian vault. The user wants a second option: pick "Team Work Graph" instead of a folder, and have the same neural graph render the user's Atlassian work — issues, pages, PRs, goals, focus areas, projects, teammates — pulled via the locally installed `twg` CLI.

**Users:** the project owner (esoh) and other Atlassians running the prototype locally with `twg login` already configured.

**Success looks like:**
1. On `/personal-graph`, the onboarding card offers two options: "Choose vault folder" (existing) and "Connect Team Work Graph" (new).
2. After picking TWG, the graph populates within a few seconds with the user's first-level work context (issues, pages, PRs, goals, projects, focus areas, teammates) and renders with the same node/edge visuals.
3. Search, inspector, refresh, theme, and reset controls all work in TWG mode.
4. The "open external" button on a TWG node opens the Atlassian artifact (Jira issue, Confluence page, PR) in a new tab, not a local route.
5. A chat panel accepts questions like "what did I work on last 7 days?" and returns both:
   - A streamed text answer.
   - A focused graph subset — nodes referenced by the answer become the visible graph.
6. Switching source (Reset → pick the other option) preserves the existing visual onboarding intro.

### Acceptance criteria

- [ ] User can switch between Obsidian and TWG sources from the onboarding card without restarting.
- [ ] `twg` CLI is invoked exclusively from the Express backend; no shell-out from the Next.js client or API proxy routes.
- [ ] First TWG fetch caches normalized JSON under `.twg-cache/` (gitignored). Refresh re-runs the CLI; Reset deletes the cache and returns to source-picker.
- [ ] All TWG nodes carry an `externalUrl` so the inspector's "open" button deep-links to Atlassian.
- [ ] Chat over TWG streams via AI SDK (client) talking to a server-side `streamText` loop powered by `ai-gateway-provider`. Exposes a `query_twg` tool that the model can call to fetch additional slices of work data on demand. **No RovoDev gateway in the chat path.**
- [ ] The graph view filters to the node set returned by the latest chat answer when one is active; "Clear filter" returns to the full graph.
- [ ] Lint + typecheck pass; new backend lib has unit tests; new hook has component tests.

## Tech Stack

Already in repo — no new dependencies expected.

- Next.js 16 / React 19 / Tailwind v4
- Express backend (`backend/server.js`) for `twg` CLI shell-out
- AI SDK (`@ai-sdk/react` `useChat`) on the client
- **AI Gateway** (`backend/lib/ai-gateway-provider.js` — `streamText` / `generateText` over Bedrock/Google via `AI_GATEWAY_*` env vars + ASAP auth) on the server. **No RovoDev** in this feature.
- `twg` CLI installed at `~/.local/bin/twg` (assumed authenticated)
- Existing graph rendering: `components/website/demos/visual/graph.tsx`

## Commands

```
Install:        pnpm install
Dev (full):     pnpm run rovodev
Dev (no rovo):  pnpm run dev
Lint:           pnpm run lint
Typecheck:      pnpm run typecheck
Targeted test:  node --test backend/lib/personal-graph-twg-source.test.js
Build:          pnpm run build
TWG check:      twg context user me --output json --output-summary stats
```

## Project Structure

New files (additive; no rename of existing personal-graph code):

```
backend/lib/
  personal-graph-twg-source.js          → shell-out to twg CLI, normalize to VaultExplorer
  personal-graph-twg-source.test.js     → unit tests with mocked CLI output
  personal-graph-twg-cache.js           → read/write .twg-cache/ JSON
  personal-graph-twg-cache.test.js
  personal-graph-twg-chat.js            → AI Gateway streamText loop + query_twg tool
  personal-graph-twg-chat.test.js       → mocks ai-gateway-provider, asserts tool wiring

backend/lib/personal-graph-routes.js    → MODIFIED: route /explorer to active source

app/api/personal-graph/
  source/route.ts                       → GET/POST active source ("vault" | "twg")
  twg/refresh/route.ts                  → POST: re-fetch & cache
  twg/chat/route.ts                     → POST stream: chat over TWG

components/arts/personal-graph/
  hooks/use-graph-source.ts             → which source is active
  hooks/use-twg-chat.ts                 → wraps useChat against /api/personal-graph/twg/chat
  lib/personal-graph-types.ts           → MODIFIED: add externalUrl, source: "vault" | "twg"
  lib/personal-graph-api.ts             → MODIFIED: add fetchSource, selectSource, twg refresh
  personal-graph-source-picker.tsx      → onboarding card: 2 buttons (vault / twg)
  personal-graph-twg-chat.tsx           → chat surface (collapsible panel)
  personal-graph-surface.tsx            → MODIFIED: render source picker, mount chat in TWG mode

.tmp/personal-graph/twg-cache.json       → cache file (under existing gitignored .tmp/, sibling to vault.json)
.tmp/personal-graph/source.json          → active-source state (sibling to vault.json)
```

Modified files only when necessary; behavior for the existing Obsidian path stays unchanged when source is `"vault"`.

## Code Style

Follow project conventions in `AGENTS.md`. One snippet showing the TWG source adapter shape:

```ts
// components/arts/personal-graph/lib/personal-graph-types.ts
export type GraphSource = "vault" | "twg";

export interface VaultNode {
	bodyPreview: string;
	connectionCount: number;
	dangling: boolean;
	externalUrl: string | null;          // NEW: deep-link for "open" button
	frontmatter: Record<string, unknown>;
	id: string;
	kind: VaultNodeKind;
	label: string;
	missing: boolean;
	path: string | null;
	relativePath: string;
	size: number;
	slug: string;
	provider: GraphSource;               // NEW: which provider produced this (avoids clash with VaultSettings.source)
	title: string;
	updatedAt: string | null;
	wikiLinks?: string[];
}
```

```js
// backend/lib/personal-graph-twg-source.js
const { spawn } = require("node:child_process");

async function runTwg(args, { signal } = {}) {
	return new Promise((resolve, reject) => {
		const child = spawn("twg", [...args, "--output", "json"], { signal });
		const stdoutChunks = [];
		const stderrChunks = [];
		child.stdout.on("data", (chunk) => stdoutChunks.push(chunk));
		child.stderr.on("data", (chunk) => stderrChunks.push(chunk));
		child.on("error", reject);
		child.on("close", (code) => {
			if (code !== 0) {
				return reject(new Error(`twg ${args.join(" ")} exited ${code}: ${Buffer.concat(stderrChunks)}`));
			}
			resolve(Buffer.concat(stdoutChunks).toString("utf8"));
		});
	});
}

async function buildTwgExplorer({ signal } = {}) {
	const me = await runTwg(["context", "user", "me", "--detail", "summary"], { signal });
	// ...fan out: recently-viewed, focus-areas, projects, goals, pull-requests, org-tree (1 hop)
	// normalize to { nodes, edges, stats, generatedAt }
}

module.exports = { buildTwgExplorer };
```

Reuse `cn`, `token`, ADS semantic classes, `@/` imports, tabs, and the existing intro/glass-panel components for the TWG surface.

## Data Model — TWG → VaultExplorer mapping

Root node: the current user (`me`). Fan out **one level** from the root using these TWG calls and merging into the existing `VaultNode` / `VaultEdge` shape:

| TWG command | Becomes nodes (kind) | Edges to root |
| --- | --- | --- |
| `twg context user me` | self → `entity` | n/a (root) |
| `twg recently-viewed` | jira issues + confluence pages → `source` | `viewed` |
| `twg pull-requests --me` (or equivalent) | PRs → `source` | `authored` / `reviewed` |
| `twg goals --owner me` | goals → `concept` | `owns` |
| `twg projects --member me` | projects → `concept` | `member-of` |
| `twg focus-areas` | focus areas → `synthesis` | `aligned-to` |
| `twg org-tree` (depth 1) | manager + direct reports → `entity` | `reports-to` |
| `twg meetings --since -7d` | meetings → `source` | `attended` |

Each fetched item gets:
- `id`: TWG ARI or stable identifier
- `title`: artifact title
- `kind`: mapped per the table
- `externalUrl`: from `webUrl`/`self` field on the TWG payload
- `source: "twg"`
- `connectionCount`: count of inbound+outbound edges in the resulting explorer
- `bodyPreview`: short description (first 200 chars of summary/description)

Edges use existing `VaultEdgeKind` plus extensions if needed (`worked-on`, `reports-to`, `aligned-to`); keep the union narrow and explicit.

Exact CLI flags must come from live `twg help <cmd>` during implementation — the table above is intent, not final syntax.

## Chat Architecture

Pure **AI Gateway** path. No RovoDev anywhere. Hand-rolled JSON-tool loop on the server (matches the existing `personal-graph-librarian.js` pattern) — `ai-gateway-provider.js` is text-only and offers no native tool roundtrips, so we run the loop ourselves.

- **Frontend**: a small custom hook `useTwgChat` wraps `fetch("/api/personal-graph/twg/chat", { method: "POST", body, signal })` and reads NDJSON deltas off the response stream. **Not** `useChat` from AI SDK — server doesn't speak AI SDK protocol.
- **Next.js proxy**: `app/api/personal-graph/twg/chat/route.ts` forwards the request body + stream to Express. Pass-through, no transformation.
- **Express handler** (`backend/lib/personal-graph-twg-chat.js`):
  - Builds a system prompt instructing the LLM to reply **only** with one of two JSON envelopes:
    - `{ "action": "tool_call", "name": "query_twg", "arguments": { "slice": "...", "params": {...} } }`
    - `{ "action": "answer", "text": "...", "nodeIds": ["..."] }`
  - Calls `aiGatewayProvider.streamText({ system, messages, ... })` with `onTextDelta` discarded (we only act on the final string for tool-call frames).
  - Loop: parse the JSON envelope. If `tool_call`, run `personalGraphTwgSource.fetchSlice(...)`, append the tool result as a user-role message, call again. Cap at `MAX_TOOL_ROUNDTRIPS = 4`.
  - Streams a custom **NDJSON** wire format to the client:
    - `{"type":"thinking","step":1}` — at each LLM call boundary
    - `{"type":"tool","name":"query_twg","args":{...}}` — when the model requests a tool
    - `{"type":"tool_result","summary":"…","count":N}` — after each tool completes
    - `{"type":"text_delta","delta":"…"}` — final answer streamed token-by-token (or as one chunk if the gateway didn't stream)
    - `{"type":"graph","explorer":{...}}` — final focused subgraph derived from accumulated tool results
    - `{"type":"done"}` — terminal frame
- **Auth / env**: ASAP token via existing `ai-gateway-helpers.generateAsapToken()` from `ASAP_PRIVATE_KEY`. Reuses `AI_GATEWAY_URL`, `AI_GATEWAY_USE_CASE_ID`, `AI_GATEWAY_CLOUD_ID`, `AI_GATEWAY_USER_ID`. **No new env vars. No new dependency.** No imports from `rovodev-*.js`. Nothing added to `lib/rovo-ui-messages.ts` (that file belongs to the RovoDev chat flow which we don't touch).

When the user clears the chat or asks a new question, the prior subgraph filter resets.

## Testing Strategy

- **Unit (Node):** `node --test backend/lib/personal-graph-twg-source.test.js` etc. Mock `child_process.spawn` to feed canned `twg` JSON outputs. Cover: success, non-zero exit, abort signal, malformed JSON, partial fan-out (one slice fails, others continue).
- **Cache tests:** read-from-empty, read-after-write, stale invalidation on reset.
- **API tests:** existing pattern in `backend/lib/personal-graph-routes.test.js` — add cases for `/source`, `/twg/refresh`, `/twg/chat` (chat tests assert tool wiring with mocked LLM stream).
- **Hook tests:** `use-graph-source.test.js` — toggles persist; loading + error states.
- **UI smoke:** add a Playwright spec under `tests/` if existing personal-graph specs cover the route; otherwise just lint + typecheck + manual `/agent-browser` walk-through.
- **Manual:** with `twg login` set up, run `pnpm run rovodev`, hit `/personal-graph`, click "Connect Team Work Graph", confirm graph + chat. Run an a11y check via `ads_analyze_localhost_a11y` on the populated state.

No mocking of the real `twg` CLI in integration tests — those run against fixtures only.

## Boundaries

- **Always:**
  - Shell out to `twg` only from the Express backend; never from a Next.js Route Handler or client.
  - Use `--output json` (or jsonl) on every `twg` call and parse defensively.
  - Pass an `AbortSignal` from request → spawn so cancellations propagate.
  - Add `.twg-cache/` to `.gitignore`.
  - Discover exact `twg` flags via `twg help <cmd>` (per the `/twg` skill contract) before hardcoding.
  - Use ADS semantic Tailwind classes; keep `dark:` modifiers off ADS-mapped tokens (per memory).
  - Ternary, not `&&`, for conditional rendering.
  - Keep React 19 patterns (`use(Context)`, `<Context value={}>`, `ref` as prop).

- **Ask first:**
  - Adding any new dependency.
  - Changing the existing Obsidian flow's behavior, types, or endpoints in any user-visible way.
  - Introducing a new chat endpoint outside `/api/personal-graph/twg/chat` or extending `lib/rovo-ui-messages.ts`.
  - Recursing TWG fan-out beyond first level (cost / runtime explodes).
  - Switching the LLM model — defer to whatever `ai-gateway-provider.js` resolves from env.

- **Never:**
  - Send TWG payloads to any third-party endpoint. LLM calls go **only** through `backend/lib/ai-gateway-provider.js` (AI Gateway via ASAP).
  - Import or call anything from `rovodev-*.js` (gateway, client, session, pool, etc.) in new code. RovoDev is out of scope for this feature.
  - Touch RovoDev Serve / ACRA / `.rovodev/` / `acli` internals.
  - Cache anything containing OAuth tokens, refresh tokens, ASAP tokens, or `Authorization` headers.
  - Hardcode account IDs, ARIs, or site URLs — derive from `twg context user me`.
  - Hardcode an LLM model name in new code. Read from `OPENAI_MODEL` (or whatever the gateway provider resolves) and let the provider pick the endpoint.
  - Commit `.twg-cache/` contents.
  - Block the UI on a TWG fetch longer than the existing loading affordance handles — surface errors via the existing error path in `useVaultExplorer`.

## Success Criteria (testable)

- [ ] `pnpm run lint` and `pnpm run typecheck` pass with new code.
- [ ] All new test files pass under `node --test`.
- [ ] Manual walk-through: source picker → TWG → graph populated within 10s on a typical Atlassian site.
- [ ] Chat answers "what did I work on last 7 days?" with a text response and a focused subgraph; the inspector's external link opens the right Jira/Confluence/Bitbucket URL in a new tab.
- [ ] Reset returns the page to source-picker state with no stale TWG nodes.
- [ ] Cache file appears under `.twg-cache/` after first load and is reused on subsequent reloads (verified by stub timing or log line).
- [ ] No regressions in the Obsidian flow — existing `personal-graph-*.test.js` suites still pass.

## Decisions (resolved)

1. **Root identity → `twg context user me`.** Single call returns relationship summary + hydrated targets (ari, name, url, key, type) for the current user. Use `--detail summary --since 7d` as defaults, exposed for tuning. `twg user search` is reserved for future "look up someone else" flows; not used in the primary fetch.
2. **Edge kind union → widen `VaultEdgeKind`.** Add explicit kinds for the relationships we surface, e.g. `worked-on`, `mentioned-in`, `reports-to`, `aligned-to`, `member-of`, `attended`, `reviewed`. Keep the union narrow and explicit; if `twg context user` returns a relationship name we don't have a kind for, log + drop until we add it intentionally.
3. **Chat UI placement → reuse `PersonalGraphSearch`'s input.** One prompt-input handles both search and chat in TWG mode. Detection: if the input ends with `?` or starts with a question-word ("what", "how", "who", "when", "did", etc.), treat as chat; otherwise as search. Add a small affordance (icon or hint) so the user knows they can ask questions. The existing flyout actions and inspector stay put.
4. **Cache TTL → manual invalidation + "Updated Nm ago" badge.** No automatic TTL. The cache file persists `generatedAt`; the existing status line (`getGraphStatsText`) renders a relative timestamp alongside node counts (e.g. "12 issues · 4 PRs · updated 3m ago"). Refresh button re-runs `twg`. Reset clears the cache.
5. **`twg login` failure UX → dedicated CTA.** When the CLI exits with an auth-related error (detect via stderr containing `login`, `unauthorized`, `not authenticated`, or a non-zero code with empty stdout), show an inline error card with the literal `twg login` command in a copy-to-clipboard button + a one-line explanation. After the user runs it externally, "Refresh" retries.

## Open Questions

_(none — all five from the prior revision are resolved above.)_
