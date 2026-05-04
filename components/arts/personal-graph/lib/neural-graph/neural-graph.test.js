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

function layoutNode(id, x) {
	return {
		alpha: 1,
		baseSize: 4,
		depthScale: 1,
		id,
		node: {
			degree: 1,
			dangling: false,
			id,
			kind: "concept",
			missing: false,
			original: { frontmatter: {} },
			title: id,
		},
		phase: 0,
		x,
		y: 0,
		z: 0,
	};
}

function layoutEdge(id, source, target) {
	return {
		edge: {
			id,
			index: 0,
			kind: "wiki_link",
			label: "link",
			original: {},
			source: source.id,
			target: target.id,
			weight: 1,
		},
		id,
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
	let globalAlpha = 1;
	let strokeStyle = "#000000";
	const gradient = {
		addColorStop: (...args) => calls.push(["addColorStop", ...args]),
	};

	return {
		calls,
		get globalAlpha() {
			return globalAlpha;
		},
		set globalAlpha(value) {
			globalAlpha = value;
			calls.push(["globalAlpha", value]);
		},
		get strokeStyle() {
			return strokeStyle;
		},
		set strokeStyle(value) {
			strokeStyle = value;
			calls.push(["strokeStyle", value]);
		},
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
		store.rankedNodes.slice(0, 3).map((item) => item.id),
		["selected", "gamma", "beta"],
	);
	assert.deepEqual(
		getNodeNeighbors(store, "selected").slice(0, 3).map(({ node }) => node.id),
		["gamma", "beta", "alpha"],
	);
	assert.deepEqual(
		(store.kindGroups.get("raw") ?? []).map((item) => item.id),
		["gamma"],
	);
});

test("getVisibleGraphNodes reuses the precomputed ranked node order under caps", async () => {
	const { createNeuralGraphStore, getVisibleGraphNodes } = await storeModule;
	const store = createNeuralGraphStore(explorer);
	const alpha = store.nodesById.get("alpha");
	const extra = store.nodesById.get("extra-0");

	store.rankedNodes = [alpha, extra, ...store.rankedNodes.filter((item) => item !== alpha && item !== extra)];

	assert.deepEqual(
		getVisibleGraphNodes(store, null, 2).map((item) => item.id),
		[alpha, extra].sort((left, right) => left.index - right.index).map((item) => item.id),
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
		rayColor: "not-a-color",
		speed: -10,
	});

	assert.equal(params.maxVisibleNodes, 200);
	assert.equal(params.nodeColor, "#6b5ce7");
	assert.equal(params.nodeShape, "circle");
	assert.equal(params.radiusMin, 20);
	assert.equal(params.radiusMax, 20);
	assert.equal(params.rayColor, "#6B5CE7");
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

test("drawNeuralGraph clamps boosted ray opacity to valid canvas alpha", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { computeNeuralGraphLayout } = await layoutModule;
	const { drawNeuralGraph } = await rendererModule;
	const { createNeuralGraphStore } = await storeModule;
	const viewport = { height: 700, width: 1000 };
	const store = createNeuralGraphStore(explorer);
	const params = clampNeuralGraphParams({
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		rayOpacity: 1,
	});
	const layout = computeNeuralGraphLayout({
		params,
		selectedNodeId: null,
		store,
		viewport,
	});
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(ctx, layout, {
		background: "transparent",
		camera: createNeuralCamera(),
		focusProgress: 0,
		hoveredNodeId: null,
		params,
		selectedNodeId: null,
		theme: "light",
		viewport,
	});

	const alphaValues = ctx.calls
		.filter(([name]) => name === "globalAlpha")
		.map(([, value]) => value);

	assert.ok(alphaValues.length > 0);
	for (const value of alphaValues) {
		assert.ok(value >= 0 && value <= 1, `expected ${value} to stay within canvas globalAlpha bounds`);
	}
});

test("drawNeuralGraph uses the configured ray color for fan strokes", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { computeNeuralGraphLayout } = await layoutModule;
	const { drawNeuralGraph } = await rendererModule;
	const { createNeuralGraphStore } = await storeModule;
	const viewport = { height: 700, width: 1000 };
	const store = createNeuralGraphStore(explorer);
	const params = clampNeuralGraphParams({
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		rayColor: "#123ABC",
		rayOpacity: 1,
	});
	const layout = computeNeuralGraphLayout({
		params,
		selectedNodeId: null,
		store,
		viewport,
	});
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(ctx, layout, {
		background: "transparent",
		camera: createNeuralCamera(),
		focusProgress: 0,
		hoveredNodeId: null,
		params,
		selectedNodeId: null,
		theme: "light",
		viewport,
	});

	assert.deepEqual(
		ctx.calls.find(([name]) => name === "strokeStyle"),
		["strokeStyle", "#123ABC"],
	);
});

test("drawNeuralGraph keeps idle edge order and layers selected edges last", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 200, width: 300 };
	const selected = layoutNode("selected", 0);
	const neighbor = layoutNode("neighbor", 80);
	const idleSource = layoutNode("idle-source", -80);
	const idleTarget = layoutNode("idle-target", -40);
	const layout = {
		edges: [
			layoutEdge("active", selected, neighbor),
			layoutEdge("idle", idleSource, idleTarget),
		],
		nodes: [selected, neighbor, idleSource, idleTarget],
		nodesById: new Map([
			[selected.id, selected],
			[neighbor.id, neighbor],
			[idleSource.id, idleSource],
			[idleTarget.id, idleTarget],
		]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const params = {
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		showLabels: false,
		showRays: false,
	};
	const getDrawnEdgeTargets = (selectedNodeId) => {
		const ctx = createRecordingCanvasContext();
		drawNeuralGraph(ctx, layout, {
			background: "transparent",
			camera: createNeuralCamera(),
			focusProgress: selectedNodeId ? 1 : 0,
			hoveredNodeId: null,
			params,
			selectedNodeId,
			theme: "light",
			viewport,
		});
		return ctx.calls
			.filter(([name]) => name === "lineTo")
			.map(([, x]) => Number(x.toFixed(3)));
	};

	assert.deepEqual(getDrawnEdgeTargets(null), [230, 110]);
	assert.deepEqual(getDrawnEdgeTargets("selected"), [110, 230]);
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
