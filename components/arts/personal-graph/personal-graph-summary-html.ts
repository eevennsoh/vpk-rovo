import { parsePersonalGraphSummaryMarkdown } from "./personal-graph-summary-markdown";
import type {
	GraphProvider,
	PersonalGraphSummaryLength,
	VaultEdge,
	VaultExplorer,
	VaultNode,
} from "./lib/personal-graph-types";

export interface PersonalGraphSummaryHtmlInput {
	articleMarkdown: string;
	edges: ReadonlyArray<VaultEdge>;
	generatedAt: string;
	length: PersonalGraphSummaryLength;
	neighbors: ReadonlyArray<VaultNode>;
	node: VaultNode;
	provider: GraphProvider;
	sourceFingerprint: string;
	sourceNotice?: string | null;
	workWindow?: string | null;
}

export interface PersonalGraphSummaryHtmlDocument {
	filename: string;
	html: string;
	title: string;
}

const LENGTH_CARD_LIMITS: Record<PersonalGraphSummaryLength, number> = {
	long: 10,
	medium: 6,
	short: 3,
};

const NODE_KIND_LABELS: Record<string, string> = {
	concept: "Concept",
	entity: "Entity",
	raw: "Raw source",
	source: "Source",
	synthesis: "Synthesis",
};

function escapeHtml(value: unknown) {
	return String(value ?? "")
		.replace(/&/gu, "&amp;")
		.replace(/</gu, "&lt;")
		.replace(/>/gu, "&gt;")
		.replace(/"/gu, "&quot;")
		.replace(/'/gu, "&#39;");
}

function escapeAttribute(value: unknown) {
	return escapeHtml(value).replace(/`/gu, "&#96;");
}

function slugify(value: string) {
	const slug = value
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "")
		.slice(0, 80);
	return slug || "personal-graph-summary";
}

function isSafeExternalUrl(value: unknown): value is string {
	if (typeof value !== "string" || !value.trim()) return false;
	try {
		const parsed = new URL(value);
		return parsed.protocol === "http:" || parsed.protocol === "https:";
	} catch {
		return false;
	}
}

function getFrontmatterString(node: VaultNode, keys: ReadonlyArray<string>) {
	for (const key of keys) {
		const value = node.frontmatter?.[key];
		if (typeof value === "string" && value.trim()) {
			return value.trim();
		}
	}
	return null;
}

function getMarkdownImage(value: string) {
	const match = value.match(/!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/u);
	return match?.[1] ?? null;
}

function getNodeImage(node: VaultNode) {
	const fromFrontmatter = getFrontmatterString(node, ["image", "cover", "thumbnail", "asset"]);
	const candidate = fromFrontmatter ?? getMarkdownImage(node.bodyPreview);
	if (typeof candidate === "string" && candidate.startsWith("data:image/")) {
		return candidate;
	}
	return null;
}

function getReadableNodeType(node: VaultNode) {
	const rawType = typeof node.frontmatter?.type === "string" ? node.frontmatter.type : node.kind;
	const label = NODE_KIND_LABELS[rawType] ?? rawType.replace(/([a-z])([A-Z])/gu, "$1 $2").replace(/[-_]+/gu, " ");
	return label.charAt(0).toUpperCase() + label.slice(1);
}

function getCardLimit(length: PersonalGraphSummaryLength) {
	return LENGTH_CARD_LIMITS[length] ?? LENGTH_CARD_LIMITS.medium;
}

function renderInlineMarkdown(value: string) {
	const escaped = escapeHtml(value);
	return escaped
		.replace(/\*\*([^*]+)\*\*/gu, "<strong>$1</strong>")
		.replace(/\*([^*]+)\*/gu, "<em>$1</em>")
		.replace(/`([^`]+)`/gu, "<code>$1</code>");
}

function renderMarkdownBlocks(markdown: string) {
	const lines = markdown.split("\n");
	const blocks: string[] = [];
	let paragraph: string[] = [];
	let listItems: string[] = [];

	function flushParagraph() {
		if (paragraph.length === 0) return;
		blocks.push(`<p>${renderInlineMarkdown(paragraph.join(" "))}</p>`);
		paragraph = [];
	}

	function flushList() {
		if (listItems.length === 0) return;
		blocks.push(`<ul>${listItems.map((item) => `<li>${renderInlineMarkdown(item)}</li>`).join("")}</ul>`);
		listItems = [];
	}

	for (const line of lines) {
		const trimmed = line.trim();
		if (!trimmed) {
			flushParagraph();
			flushList();
			continue;
		}
		const itemMatch = trimmed.match(/^[-*]\s+(.+)$/u);
		if (itemMatch) {
			flushParagraph();
			listItems.push(itemMatch[1]);
			continue;
		}
		flushList();
		paragraph.push(trimmed.replace(/^#{1,6}\s+/u, ""));
	}
	flushParagraph();
	flushList();

	return blocks.join("\n");
}

function getVisibleNeighbors(input: PersonalGraphSummaryHtmlInput) {
	return input.neighbors.slice(0, getCardLimit(input.length));
}

function renderNodeGlyph(node: VaultNode) {
	const image = getNodeImage(node);
	if (image) {
		return `<img alt="" class="node-glyph-image" src="${escapeAttribute(image)}" />`;
	}
	const initials = node.title
		.split(/\s+/u)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part.charAt(0).toUpperCase())
		.join("") || "PG";
	return [
		'<svg aria-hidden="true" class="node-glyph-svg" viewBox="0 0 64 64" role="img">',
		'<rect x="4" y="4" width="56" height="56" rx="16" />',
		`<text x="32" y="38" text-anchor="middle">${escapeHtml(initials)}</text>`,
		"</svg>",
	].join("");
}

function renderRelationshipDiagram(input: PersonalGraphSummaryHtmlInput) {
	const visibleNeighbors = getVisibleNeighbors(input);
	if (input.edges.length === 0 || visibleNeighbors.length === 0) {
		return "";
	}

	const center = { x: 260, y: 150 };
	const radius = 100;
	const nodesById = new Map([input.node, ...visibleNeighbors].map((node) => [node.id, node]));
	const positions = visibleNeighbors.map((node, index) => {
		const angle = (Math.PI * 2 * index) / visibleNeighbors.length - Math.PI / 2;
		return {
			node,
			x: center.x + Math.cos(angle) * radius,
			y: center.y + Math.sin(angle) * radius,
		};
	});
	const positionsById = new Map(positions.map((position) => [position.node.id, position]));
	const visibleEdges = input.edges.filter((edge) => (
		(edge.source === input.node.id && positionsById.has(edge.target)) ||
		(edge.target === input.node.id && positionsById.has(edge.source))
	));
	const showLabels = input.length !== "short";
	const hiddenNeighborCount = Math.max(0, input.neighbors.length - visibleNeighbors.length);

	return [
		'<section class="relationship-section" aria-labelledby="relationship-heading">',
		'<div class="section-kicker">Relationship map</div>',
		'<h2 id="relationship-heading">One-hop neighborhood</h2>',
		'<svg class="relationship-diagram" viewBox="0 0 520 300" role="img" aria-label="One-hop relationship diagram">',
		...visibleEdges.map((edge) => {
			const neighborId = edge.source === input.node.id ? edge.target : edge.source;
			const position = positionsById.get(neighborId);
			if (!position) return "";
			const labelX = (center.x + position.x) / 2;
			const labelY = (center.y + position.y) / 2;
			return [
				`<line x1="${center.x}" y1="${center.y}" x2="${position.x.toFixed(1)}" y2="${position.y.toFixed(1)}" />`,
				showLabels ? `<text class="edge-label" x="${labelX.toFixed(1)}" y="${labelY.toFixed(1)}">${escapeHtml(edge.label || "related")}</text>` : "",
			].join("");
		}),
		`<circle class="node-ring node-ring-selected" cx="${center.x}" cy="${center.y}" r="44" />`,
		`<text class="node-title node-title-selected" x="${center.x}" y="${center.y + 5}">${escapeHtml(input.node.title)}</text>`,
		...positions.map(({ node, x, y }) => {
			const label = nodesById.get(node.id)?.title ?? node.title;
			return [
				`<circle class="node-ring" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="34" />`,
				`<text class="node-title" x="${x.toFixed(1)}" y="${(y + 5).toFixed(1)}">${escapeHtml(label)}</text>`,
			].join("");
		}),
		hiddenNeighborCount > 0 ? `<text class="hidden-count" x="260" y="282">${hiddenNeighborCount} more neighbor${hiddenNeighborCount === 1 ? "" : "s"} omitted for this length</text>` : "",
		"</svg>",
		"</section>",
	].join("\n");
}

function renderSourceCards(input: PersonalGraphSummaryHtmlInput) {
	const cards = [input.node, ...getVisibleNeighbors(input)];
	return [
		'<div class="source-card-grid">',
		...cards.map((node, index) => {
			const externalUrl = isSafeExternalUrl(node.externalUrl) ? node.externalUrl : null;
			const excerpt = node.bodyPreview.trim() || "No excerpt is available in the current graph context.";
			return [
				`<article aria-label="${escapeAttribute(node.title)}" class="source-card" data-node-id="${escapeAttribute(node.id)}" role="button" tabindex="0">`,
				`<div class="node-glyph">${renderNodeGlyph(node)}</div>`,
				'<div class="source-card-body">',
				`<p class="source-card-kicker">${index === 0 ? "Selected source" : "Connected source"} - ${escapeHtml(getReadableNodeType(node))}</p>`,
				`<h3>${escapeHtml(node.title)}</h3>`,
				`<p>${escapeHtml(excerpt)}</p>`,
				externalUrl ? `<a class="source-card-link" data-external-link="true" href="${escapeAttribute(externalUrl)}" rel="noreferrer" target="_blank">Open source</a>` : "",
				"</div>",
				"</article>",
			].join("");
		}),
		"</div>",
	].join("\n");
}

function renderSections(input: PersonalGraphSummaryHtmlInput) {
	const article = parsePersonalGraphSummaryMarkdown(input.articleMarkdown);
	const sections = article.sections.length > 0
		? article.sections
		: [{ body: input.articleMarkdown, heading: "Overview" }];

	return sections.map((section) => {
		const isEvidence = /source evidence/iu.test(section.heading);
		const body = renderMarkdownBlocks(section.body);
		if (isEvidence) {
			return [
				'<details class="evidence" id="source-evidence">',
				`<summary>${escapeHtml(section.heading)}</summary>`,
				input.sourceNotice ? `<p class="notice">${escapeHtml(input.sourceNotice)}</p>` : "",
				body,
				'<dl class="evidence-meta">',
				`<div><dt>Source mode</dt><dd>${input.provider === "twg" ? "Team Work Graph" : "Obsidian vault"}</dd></div>`,
				input.workWindow ? `<div><dt>Work window</dt><dd>${escapeHtml(input.workWindow)}</dd></div>` : "",
				`<div><dt>Generated</dt><dd>${escapeHtml(input.generatedAt)}</dd></div>`,
				`<div><dt>Relationship count</dt><dd>${input.edges.length}</dd></div>`,
				"</dl>",
				renderSourceCards(input),
				"</details>",
			].join("\n");
		}
		return [
			`<section class="article-section" aria-labelledby="${escapeAttribute(slugify(section.heading))}">`,
			`<h2 id="${escapeAttribute(slugify(section.heading))}">${escapeHtml(section.heading)}</h2>`,
			body,
			"</section>",
		].join("\n");
	}).join("\n");
}

function renderStyles() {
	return `<style>
:root {
	color-scheme: light dark;
	font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
	background: #f7f5ef;
	color: #1f252e;
}
* { box-sizing: border-box; }
body { margin: 0; background: #f7f5ef; color: #1f252e; }
a { color: inherit; }
.page { max-width: 980px; margin: 0 auto; padding: 44px 24px 56px; }
.masthead { border-bottom: 1px solid rgba(31, 37, 46, 0.16); padding-bottom: 28px; }
.kicker, .section-kicker, .source-card-kicker { color: #5f6c7b; font-size: 0.76rem; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
h1 { font-family: Georgia, "Times New Roman", serif; font-size: clamp(2.25rem, 7vw, 5.25rem); font-weight: 500; letter-spacing: 0; line-height: 0.95; margin: 12px 0; max-width: 11ch; }
.lede { color: #394452; font-size: clamp(1rem, 2.4vw, 1.35rem); line-height: 1.65; max-width: 720px; }
.article-section, .relationship-section, .evidence { margin-top: 34px; }
h2 { font-family: Georgia, "Times New Roman", serif; font-size: clamp(1.55rem, 3vw, 2.35rem); font-weight: 500; letter-spacing: 0; line-height: 1.1; margin: 0 0 14px; }
p, li, dd { font-size: 1rem; line-height: 1.7; }
ul { padding-left: 1.25rem; }
code { background: rgba(31, 37, 46, 0.08); border-radius: 4px; padding: 0.1em 0.3em; }
.relationship-diagram { background: #fffdf8; border: 1px solid rgba(31, 37, 46, 0.14); border-radius: 8px; display: block; min-height: 260px; width: 100%; }
.relationship-diagram line { stroke: #8f9aa7; stroke-width: 1.5; }
.node-ring { fill: #f1f7ff; stroke: #365d8d; stroke-width: 1.5; }
.node-ring-selected { fill: #fff4d8; stroke: #946200; stroke-width: 2; }
.node-title { fill: #1f252e; font-size: 10px; font-weight: 700; text-anchor: middle; }
.node-title-selected { font-size: 11px; }
.edge-label, .hidden-count { fill: #5f6c7b; font-size: 9px; text-anchor: middle; }
.evidence { background: #fffdf8; border: 1px solid rgba(31, 37, 46, 0.14); border-radius: 8px; padding: 16px; }
.evidence > summary { cursor: pointer; font-weight: 700; }
.notice { background: #fff6d6; border: 1px solid #ddad37; border-radius: 6px; padding: 10px 12px; }
.evidence-meta { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); margin: 16px 0; }
.evidence-meta div { border-top: 1px solid rgba(31, 37, 46, 0.12); padding-top: 10px; }
dt { color: #5f6c7b; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
dd { margin: 2px 0 0; }
.source-card-grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top: 16px; }
.source-card { align-items: flex-start; background: #f7f5ef; border: 1px solid rgba(31, 37, 46, 0.14); border-radius: 8px; color: inherit; cursor: pointer; display: flex; gap: 12px; padding: 14px; text-align: left; }
.source-card:focus-visible { outline: 3px solid #4c9aff; outline-offset: 2px; }
.node-glyph { border-radius: 8px; flex: 0 0 auto; height: 44px; overflow: hidden; width: 44px; }
.node-glyph-image, .node-glyph-svg { display: block; height: 44px; width: 44px; }
.node-glyph-svg rect { fill: #263c5c; }
.node-glyph-svg text { fill: #fff; font-size: 18px; font-weight: 800; }
.source-card h3 { font-size: 1rem; line-height: 1.25; margin: 2px 0 6px; }
.source-card p { color: #4b5664; font-size: 0.88rem; line-height: 1.5; margin: 0; }
.source-card-link { display: inline-block; font-size: 0.84rem; font-weight: 700; margin-top: 10px; }
@media (prefers-color-scheme: dark) {
	:root, body { background: #14181f; color: #f3f5f7; }
	.lede, .source-card p { color: #cad1da; }
	.kicker, .section-kicker, .source-card-kicker, dt, .edge-label, .hidden-count { color: #aeb8c4; }
	.relationship-diagram, .evidence { background: #1b2028; border-color: rgba(243, 245, 247, 0.14); }
	.source-card { background: #202632; border-color: rgba(243, 245, 247, 0.14); }
	.node-title { fill: #f3f5f7; }
	.relationship-diagram line { stroke: #7d8997; }
	.node-ring { fill: #23354d; stroke: #8bbcff; }
	.node-ring-selected { fill: #463a1c; stroke: #f0c15a; }
	.notice { background: #3a2f12; border-color: #8f6b18; }
}
</style>`;
}

function renderScript() {
	return `<script>
(() => {
	document.addEventListener("click", (event) => {
		if (event.target.closest("[data-external-link='true']")) return;
		const card = event.target.closest("[data-node-id]");
		if (!card) return;
		const nodeId = card.getAttribute("data-node-id");
		if (!nodeId || window.parent === window) return;
		window.parent.postMessage({ type: "personal-graph-select-node", nodeId }, "*");
	});
	document.addEventListener("keydown", (event) => {
		if (event.key !== "Enter" && event.key !== " ") return;
		const card = event.target.closest("[data-node-id]");
		if (!card) return;
		event.preventDefault();
		card.click();
	});
})();
</script>`;
}

export function getPersonalGraphSummaryHtmlContext(explorer: VaultExplorer | null, node: VaultNode) {
	const neighborIds = new Set<string>();
	const edges = (explorer?.edges ?? []).filter((edge) => {
		if (edge.source === node.id) {
			neighborIds.add(edge.target);
			return true;
		}
		if (edge.target === node.id) {
			neighborIds.add(edge.source);
			return true;
		}
		return false;
	});
	const nodesById = new Map([node, ...(explorer?.nodes ?? [])].map((candidate) => [candidate.id, candidate]));
	const neighbors = [...neighborIds]
		.flatMap((nodeId) => {
			const neighbor = nodesById.get(nodeId);
			return neighbor ? [neighbor] : [];
		})
		.sort((left, right) => left.title.localeCompare(right.title));
	return { edges, neighbors };
}

export function buildPersonalGraphSummaryHtmlDocument(input: PersonalGraphSummaryHtmlInput): PersonalGraphSummaryHtmlDocument {
	const article = parsePersonalGraphSummaryMarkdown(input.articleMarkdown);
	const title = article.title || input.node.title;
	const lede = article.lede || input.node.bodyPreview || "This generated article summarizes the selected Personal Graph source and its current one-hop context.";
	const relationshipDiagram = renderRelationshipDiagram(input);
	const html = [
		"<!doctype html>",
		'<html lang="en">',
		"<head>",
		'<meta charset="utf-8" />',
		'<meta name="viewport" content="width=device-width, initial-scale=1" />',
		`<title>${escapeHtml(title)}</title>`,
		renderStyles(),
		"</head>",
		"<body>",
		'<main class="page">',
		'<header class="masthead">',
		`<div class="kicker">${input.provider === "twg" ? "Team Work Graph" : "Obsidian vault"} editorial summary</div>`,
		`<h1>${escapeHtml(title)}</h1>`,
		`<p class="lede">${renderInlineMarkdown(lede)}</p>`,
		"</header>",
		input.sourceNotice ? `<p class="notice">${escapeHtml(input.sourceNotice)}</p>` : "",
		relationshipDiagram,
		renderSections(input),
		"</main>",
		renderScript(),
		"</body>",
		"</html>",
	].join("\n");

	return {
		filename: `${slugify(title)}.html`,
		html,
		title,
	};
}
