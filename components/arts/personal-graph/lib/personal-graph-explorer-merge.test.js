const assert = require("node:assert/strict");
const { registerHooks } = require("node:module");
const test = require("node:test");

registerHooks({
	resolve(specifier, context, nextResolve) {
		if (specifier.startsWith("./") && !specifier.endsWith(".ts")) {
			try {
				return nextResolve(`${specifier}.ts`, context);
			} catch {
				return nextResolve(specifier, context);
			}
		}
		return nextResolve(specifier, context);
	},
});

const mergeModule = import("./personal-graph-explorer-merge.ts");

function node(id, title, kind = "source", overrides = {}) {
	return {
		bodyPreview: `${title} preview`,
		connectionCount: 0,
		dangling: false,
		externalUrl: null,
		frontmatter: {},
		id,
		kind,
		label: title,
		missing: false,
		path: null,
		provider: "twg",
		relativePath: title,
		size: 1,
		slug: id,
		title,
		updatedAt: null,
		...overrides,
	};
}

function edge(source, target, id = `${source}-${target}`) {
	return {
		id,
		kind: "mentioned-in",
		label: "mentioned in",
		metadata: {},
		relationKinds: ["mentioned-in"],
		source,
		target,
	};
}

function explorer(nodes, edges, generatedAt = "2026-05-07T00:00:00.000Z") {
	return {
		edges,
		generatedAt,
		nodes,
		stats: {
			danglingCount: nodes.filter((candidate) => candidate.dangling).length,
			edgeCount: edges.length,
			nodeCount: nodes.length,
			rawCount: nodes.filter((candidate) => candidate.kind === "raw").length,
			wikiCount: nodes.filter((candidate) => candidate.kind !== "raw").length,
		},
	};
}

test("mergeVaultExplorers de-duplicates nodes and edges from an expansion", async () => {
	const { mergeVaultExplorers } = await mergeModule;
	const base = explorer([node("selected", "Selected"), node("existing", "Existing")], [edge("selected", "existing")]);
	const expansion = explorer(
		[node("selected", "Selected hydrated", "source", { connectionCount: 2 }), node("added", "Added", "entity")],
		[edge("selected", "existing"), edge("selected", "added")],
		"2026-05-07T01:00:00.000Z",
	);

	const merged = mergeVaultExplorers(base, expansion);

	assert.equal(merged.generatedAt, "2026-05-07T01:00:00.000Z");
	assert.deepEqual(merged.nodes.map((candidate) => candidate.id), ["selected", "existing", "added"]);
	assert.equal(merged.nodes.find((candidate) => candidate.id === "selected").title, "Selected hydrated");
	assert.deepEqual(merged.edges.map((candidate) => candidate.id), ["selected-existing", "selected-added"]);
	assert.equal(merged.stats.nodeCount, 3);
	assert.equal(merged.stats.edgeCount, 2);
});

test("mergeSelectedNodeExpansion keeps chat filters scoped to the selected node neighborhood", async () => {
	const { mergeSelectedNodeExpansion } = await mergeModule;
	const filtered = explorer([node("selected", "Selected"), node("chat", "Chat match")], [edge("selected", "chat")]);
	const expanded = explorer(
		[
			node("selected", "Selected hydrated"),
			node("chat", "Chat match"),
			node("new-neighbor", "New neighbor"),
			node("unrelated", "Unrelated"),
		],
		[
			edge("selected", "chat"),
			edge("selected", "new-neighbor"),
			edge("unrelated", "new-neighbor", "unrelated-new-neighbor"),
		],
	);

	const merged = mergeSelectedNodeExpansion(filtered, expanded, "selected");

	assert.deepEqual(merged.nodes.map((candidate) => candidate.id), ["selected", "chat", "new-neighbor"]);
	assert.deepEqual(merged.edges.map((candidate) => candidate.id), ["selected-chat", "selected-new-neighbor"]);
	assert.equal(merged.stats.nodeCount, 3);
	assert.equal(merged.stats.edgeCount, 2);
});

test("mergeSelectedNodeExpansion falls back to the returned cache when the selected node is not displayed", async () => {
	const { mergeSelectedNodeExpansion } = await mergeModule;
	const filtered = explorer([node("chat", "Chat match")], []);
	const expanded = explorer([node("selected", "Selected"), node("added", "Added")], [edge("selected", "added")]);

	const merged = mergeSelectedNodeExpansion(filtered, expanded, "selected");

	assert.equal(merged, expanded);
});
