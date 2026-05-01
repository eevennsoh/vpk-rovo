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

const cameraModule = import("./camera.ts");
const interactionModule = import("./interaction.ts");
const layoutModule = import("./layout.ts");
const paramsModule = import("./params.ts");
const rendererModule = import("./renderer.ts");
const storeModule = import("./store.ts");

function node(id, title, kind, connectionCount = 0) {
	return {
		bodyPreview: `${title} preview`,
		connectionCount,
		dangling: false,
		frontmatter: {},
		id,
		kind,
		label: title,
		missing: false,
		path: null,
		relativePath: `${title}.md`,
		size: connectionCount,
		slug: title.toLowerCase(),
		title,
		updatedAt: null,
	};
}

function edge(source, target, kind = "wiki_link") {
	return {
		id: `${source}-${target}`,
		kind,
		label: kind,
		metadata: {},
		relationKinds: [kind],
		source,
		target,
	};
}

const explorer = {
	edges: [
		edge("selected", "beta", "frontmatter_source"),
		edge("selected", "alpha"),
		edge("selected", "gamma"),
		edge("beta", "gamma"),
		...Array.from({ length: 16 }, (_, index) => edge("selected", `extra-${index}`)),
	],
	generatedAt: "2026-04-30T00:00:00.000Z",
	nodes: [
		node("selected", "Selected", "concept", 12),
		node("alpha", "Alpha", "source", 4),
		node("beta", "Beta", "entity", 8),
		node("gamma", "Gamma", "raw", 8),
		...Array.from({ length: 16 }, (_, index) => node(`extra-${index}`, `Extra ${index}`, "concept", index)),
	],
	stats: {
		danglingCount: 0,
		edgeCount: 20,
		nodeCount: 20,
		rawCount: 1,
		wikiCount: 19,
	},
};

function createRecordingCanvasContext() {
	const calls = [];
	const gradient = {
		addColorStop: (...args) => calls.push(["addColorStop", ...args]),
	};

	return {
		calls,
		arc: (...args) => calls.push(["arc", ...args]),
		beginPath: (...args) => calls.push(["beginPath", ...args]),
		bezierCurveTo: (...args) => calls.push(["bezierCurveTo", ...args]),
		clearRect: (...args) => calls.push(["clearRect", ...args]),
		createLinearGradient: (...args) => {
			calls.push(["createLinearGradient", ...args]);
			return gradient;
		},
		createRadialGradient: (...args) => {
			calls.push(["createRadialGradient", ...args]);
			return gradient;
		},
		fill: (...args) => calls.push(["fill", ...args]),
		fillRect: (...args) => calls.push(["fillRect", ...args]),
		fillText: (...args) => calls.push(["fillText", ...args]),
		lineTo: (...args) => calls.push(["lineTo", ...args]),
		moveTo: (...args) => calls.push(["moveTo", ...args]),
		rect: (...args) => calls.push(["rect", ...args]),
		restore: (...args) => calls.push(["restore", ...args]),
		save: (...args) => calls.push(["save", ...args]),
		stroke: (...args) => calls.push(["stroke", ...args]),
	};
}

test("createNeuralGraphStore builds deterministic adjacency and kind groups", async () => {
	const { createNeuralGraphStore, getNodeNeighbors } = await storeModule;
	const store = createNeuralGraphStore(explorer);

	assert.equal(store.nodesById.get("selected").degree, 19);
	assert.deepEqual(
		getNodeNeighbors(store, "selected").slice(0, 3).map(({ node }) => node.id),
		["gamma", "beta", "alpha"],
	);
	assert.deepEqual(
		(store.kindGroups.get("raw") ?? []).map((item) => item.id),
		["gamma"],
	);
});

test("getVisibleGraphNodes preserves selected node and selected neighborhood under caps", async () => {
	const { createNeuralGraphStore, getVisibleGraphNodes } = await storeModule;
	const store = createNeuralGraphStore(explorer);
	const visible = getVisibleGraphNodes(store, "selected", 10).map((item) => item.id);

	assert.equal(visible.length, 10);
	assert.ok(visible.includes("selected"));
	assert.ok(visible.includes("beta"));
	assert.ok(visible.includes("gamma"));
});

test("clampNeuralGraphParams clamps numbers, colors, radius order, and shapes", async () => {
	const { clampNeuralGraphParams } = await paramsModule;
	const params = clampNeuralGraphParams({
		maxVisibleNodes: 900,
		nodeColor: "purple",
		nodeShape: "triangle",
		radiusMax: 20,
		radiusMin: 80,
		speed: -10,
	});

	assert.equal(params.maxVisibleNodes, 200);
	assert.equal(params.nodeColor, "#6b5ce7");
	assert.equal(params.nodeShape, "circle");
	assert.equal(params.radiusMin, 20);
	assert.equal(params.radiusMax, 20);
	assert.equal(params.speed, 0);
});

test("shouldAnimateNeuralGraph skips static reduced-motion and zero-flow layouts", async () => {
	const { DEFAULT_NEURAL_GRAPH_PARAMS, shouldAnimateNeuralGraph } = await paramsModule;

	assert.equal(shouldAnimateNeuralGraph(DEFAULT_NEURAL_GRAPH_PARAMS), true);
	assert.equal(shouldAnimateNeuralGraph(DEFAULT_NEURAL_GRAPH_PARAMS, true), false);
	assert.equal(shouldAnimateNeuralGraph({ ...DEFAULT_NEURAL_GRAPH_PARAMS, amplitude: 0 }), false);
	assert.equal(shouldAnimateNeuralGraph({ ...DEFAULT_NEURAL_GRAPH_PARAMS, speed: 0 }), false);
});

test("computeNeuralGraphLayout is deterministic and keeps selected nodes visible", async () => {
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const store = createNeuralGraphStore(explorer);
	const params = clampNeuralGraphParams({ ...DEFAULT_NEURAL_GRAPH_PARAMS, maxVisibleNodes: 10 });
	const viewport = { height: 700, width: 1000 };
	const first = computeNeuralGraphLayout({ params, selectedNodeId: "selected", store, viewport });
	const second = computeNeuralGraphLayout({ params, selectedNodeId: "selected", store, viewport });

	assert.equal(first.nodes.length, 10);
	assert.ok(first.nodesById.has("selected"));
	assert.deepEqual(
		first.nodes.map(({ id, x, y }) => [id, Number(x.toFixed(3)), Number(y.toFixed(3))]),
		second.nodes.map(({ id, x, y }) => [id, Number(x.toFixed(3)), Number(y.toFixed(3))]),
	);
});

test("drawNeuralGraph clears transparent embeds without painting the default background", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 480, width: 640 };
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(
		ctx,
		{
			edges: [],
			nodes: [],
			nodesById: new Map(),
			origin: { x: 0, y: 0 },
			viewport,
		},
		{
			background: "transparent",
			camera: createNeuralCamera(),
			focusProgress: 0,
			hoveredNodeId: null,
			params: DEFAULT_NEURAL_GRAPH_PARAMS,
			selectedNodeId: null,
			theme: "light",
			viewport,
		},
	);

	assert.deepEqual(ctx.calls[0], ["clearRect", 0, 0, viewport.width, viewport.height]);
	assert.equal(
		ctx.calls.some(([name]) => name === "createLinearGradient" || name === "createRadialGradient" || name === "fillRect"),
		false,
	);
});

test("camera transforms round-trip and focus selected points", async () => {
	const { createNeuralCamera, focusNeuralCameraOnPoint, viewportToWorld, worldToViewport } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const viewport = { height: 600, width: 900 };
	const camera = createNeuralCamera({ x: 24, y: -30, zoom: 1.4 });
	const world = { x: 120, y: -250 };
	const screen = worldToViewport(world, camera, viewport, DEFAULT_NEURAL_GRAPH_PARAMS);
	const roundTrip = viewportToWorld(screen, camera, viewport, DEFAULT_NEURAL_GRAPH_PARAMS);
	const focused = focusNeuralCameraOnPoint({
		camera,
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		point: world,
		viewport,
	});

	assert.ok(Math.abs(roundTrip.x - world.x) < 0.001);
	assert.ok(Math.abs(roundTrip.y - world.y) < 0.001);
	assert.ok(focused.zoom > camera.zoom * 0.8);
});

test("hitTestNeuralNode returns the nearest rendered node", async () => {
	const { createNeuralCamera, worldToViewport } = await cameraModule;
	const { hitTestNeuralNode } = await interactionModule;
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const store = createNeuralGraphStore(explorer);
	const viewport = { height: 700, width: 1000 };
	const camera = createNeuralCamera();
	const layout = computeNeuralGraphLayout({
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		selectedNodeId: "selected",
		store,
		viewport,
	});
	const target = layout.nodesById.get("selected");
	const point = worldToViewport(target, camera, viewport, DEFAULT_NEURAL_GRAPH_PARAMS);

	assert.equal(
		hitTestNeuralNode({
			camera,
			layout,
			params: DEFAULT_NEURAL_GRAPH_PARAMS,
			point,
			viewport,
		}).node.id,
		"selected",
	);
});
