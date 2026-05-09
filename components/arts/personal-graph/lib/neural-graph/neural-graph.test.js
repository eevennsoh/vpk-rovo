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
const cameraFitModule = import("./camera-fit.ts");
const colorsModule = import("./colors.ts");
const interactionModule = import("./interaction.ts");
const interactionDynamicsModule = import("./interaction-dynamics.ts");
const layoutModule = import("./layout.ts");
const paramsModule = import("./params.ts");
const raySoundModule = import("./ray-sound.ts");
const responsiveParamsModule = import("./responsive-params.ts");
const rendererModule = import("./renderer.ts");
const nodeTypeColorsModule = import("./node-type-colors.ts");
const storeModule = import("./store.ts");

function node(id, title, kind, connectionCount = 0, overrides = {}) {
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
		...overrides,
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
	let fillStyle = "";
	let globalAlpha = 1;
	let lineWidth = 1;
	let shadowBlur = 0;
	let shadowColor = "";
	let strokeStyle = "";
	let textAlign = "start";
	let textBaseline = "alphabetic";
	const gradient = {
		addColorStop: (...args) => calls.push(["addColorStop", ...args]),
	};

	return {
		calls,
		get fillStyle() {
			return fillStyle;
		},
		set fillStyle(value) {
			fillStyle = value;
			calls.push(["fillStyle", value]);
		},
		get globalAlpha() {
			return globalAlpha;
		},
		set globalAlpha(value) {
			globalAlpha = value;
			calls.push(["globalAlpha", value]);
		},
		get lineWidth() {
			return lineWidth;
		},
		set lineWidth(value) {
			lineWidth = value;
			calls.push(["lineWidth", value]);
		},
		get shadowBlur() {
			return shadowBlur;
		},
		set shadowBlur(value) {
			shadowBlur = value;
			calls.push(["shadowBlur", value]);
		},
		get shadowColor() {
			return shadowColor;
		},
		set shadowColor(value) {
			shadowColor = value;
			calls.push(["shadowColor", value]);
		},
		get strokeStyle() {
			return strokeStyle;
		},
		set strokeStyle(value) {
			strokeStyle = value;
			calls.push(["strokeStyle", value]);
		},
		get textAlign() {
			return textAlign;
		},
		set textAlign(value) {
			textAlign = value;
			calls.push(["textAlign", value]);
		},
		get textBaseline() {
			return textBaseline;
		},
		set textBaseline(value) {
			textBaseline = value;
			calls.push(["textBaseline", value]);
		},
		arc: (...args) => calls.push(["arc", ...args]),
		beginPath: (...args) => calls.push(["beginPath", ...args]),
		bezierCurveTo: (...args) => calls.push(["bezierCurveTo", ...args]),
		closePath: (...args) => calls.push(["closePath", ...args]),
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
		quadraticCurveTo: (...args) => calls.push(["quadraticCurveTo", ...args]),
		rect: (...args) => calls.push(["rect", ...args]),
		restore: (...args) => calls.push(["restore", ...args]),
		rotate: (...args) => calls.push(["rotate", ...args]),
		save: (...args) => calls.push(["save", ...args]),
		stroke: (...args) => calls.push(["stroke", ...args]),
		translate: (...args) => calls.push(["translate", ...args]),
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
	assert.equal(store.kindGroups.get("concept")?.length, 17);
	assert.equal(store.kindGroups.get("concept")?.[0].id, "selected");
});

test("createNeuralGraphStore suppresses duplicate node and edge ids", async () => {
	const { createNeuralGraphStore, getNodeNeighbors } = await storeModule;
	const workedOnEdge = {
		...edge("selected", "beta", "frontmatter_source"),
		id: "worked-on:selected->beta",
		label: "worked on",
	};
	const duplicateExplorer = {
		edges: [workedOnEdge, { ...workedOnEdge }],
		generatedAt: "2026-04-30T00:00:00.000Z",
		nodes: [
			node("selected", "Selected", "concept", 1),
			node("selected", "Selected", "concept", 1),
			node("beta", "Beta", "entity", 1),
		],
		stats: {
			danglingCount: 0,
			edgeCount: 2,
			nodeCount: 3,
			rawCount: 0,
			wikiCount: 2,
		},
	};
	const store = createNeuralGraphStore(duplicateExplorer);

	assert.equal(store.nodes.length, 2);
	assert.equal(store.nodes.filter(({ id }) => id === "selected").length, 1);
	assert.equal(store.edges.length, 1);
	assert.equal(store.edgesById.size, 1);
	assert.equal(getNodeNeighbors(store, "selected").length, 1);
	assert.equal(getNodeNeighbors(store, "beta").length, 1);
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
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const params = clampNeuralGraphParams({
		edgeColor: "#010203",
		edgeHoverColor: "blue",
		edgeSelectedColor: "#040506",
		maxVisibleNodes: 900,
		nodeColor: "purple",
		nodeHoverColor: "#ABCDEF",
		nodeRadius: 900,
		nodeSelectedColor: "gold",
		nodeShape: "triangle",
		radiusMax: 20,
		radiusMin: 80,
		rayColor: "not-a-color",
		rayElasticDamping: 999,
		rayElasticRadius: 999,
		rayElasticStrength: -10,
		rayElasticTension: 1,
		signalColor: "#070809",
		signalFrequency: 20,
		signalGlowEnabled: true,
		signalLength: 2,
		signalOpacity: 2,
		signalWidth: -2,
		speed: -10,
	});

	assert.equal(params.edgeColor, "#010203");
	assert.equal(params.edgeHoverColor, "var(--ds-icon-accent-blue)");
	assert.equal(params.edgeSelectedColor, "#040506");
	assert.equal(params.maxVisibleNodes, 200);
	assert.equal(params.nodeColor, "var(--ds-icon)");
	assert.equal(params.nodeHoverColor, "#ABCDEF");
	assert.equal(params.nodeRadius, 16);
	assert.equal(params.nodeSelectedColor, "var(--ds-icon-accent-purple)");
	assert.equal(params.nodeShape, "circle");
	assert.equal(params.radiusMin, 20);
	assert.equal(params.radiusMax, 20);
	assert.equal(params.rayColor, "var(--ds-icon-accent-purple)");
	assert.equal(params.rayElasticDamping, 80);
	assert.equal(params.rayElasticRadius, 220);
	assert.equal(params.rayElasticStrength, 0);
	assert.equal(params.rayElasticTension, 60);
	assert.equal(params.signalColor, "#070809");
	assert.equal(params.signalFrequency, 4);
	assert.equal(params.signalGlowEnabled, true);
	assert.equal(params.signalLength, 0.6);
	assert.equal(params.signalOpacity, 1);
	assert.equal(params.signalWidth, 0.5);
	assert.equal(params.speed, 0);
	assert.equal(DEFAULT_NEURAL_GRAPH_PARAMS.radialArcAngle, 360);
});

test("ray sound settings and definition stay within UI sound bounds", async () => {
	const {
		NEURAL_RAY_SOUND_DEFINITION,
		NEURAL_NODE_HOVER_SOUND_DEFINITION,
		clampNeuralRaySoundSettings,
	} = await raySoundModule;
	const settings = clampNeuralRaySoundSettings({
		cooldownMs: -10,
		enabled: true,
		pitchSpread: 99,
		volume: 4,
	});

	assert.equal(settings.cooldownMs, 0);
	assert.equal(settings.enabled, true);
	assert.equal(settings.pitchSpread, 36);
	assert.equal(settings.volume, 1);
	assert.equal(NEURAL_RAY_SOUND_DEFINITION.effects.some((effect) => effect.type === "compressor"), true);
	assert.equal(NEURAL_RAY_SOUND_DEFINITION.source.type, "sine");
	assert.equal(NEURAL_RAY_SOUND_DEFINITION.source.fm.ratio, 3.5);
	assert.ok(NEURAL_RAY_SOUND_DEFINITION.source.fm.depth <= 300);
	assert.ok(NEURAL_RAY_SOUND_DEFINITION.envelope.decay <= 0.1);
	assert.ok(NEURAL_RAY_SOUND_DEFINITION.envelope.release <= 0.02);
	assert.ok(NEURAL_RAY_SOUND_DEFINITION.gain <= 0.5);
	assert.equal(Array.isArray(NEURAL_NODE_HOVER_SOUND_DEFINITION.layers), true);
	assert.equal(NEURAL_NODE_HOVER_SOUND_DEFINITION.effects.some((effect) => effect.type === "compressor"), true);
});

test("ray sound trigger state plucks new rays with cooldown protection", async () => {
	const {
		DEFAULT_NEURAL_RAY_SOUND_SETTINGS,
		INITIAL_NEURAL_RAY_SOUND_TRIGGER_STATE,
		getNextNeuralRaySoundTriggerState,
		shouldTriggerNeuralRaySound,
	} = await raySoundModule;
	const settings = { ...DEFAULT_NEURAL_RAY_SOUND_SETTINGS, cooldownMs: 70 };
	let state = INITIAL_NEURAL_RAY_SOUND_TRIGGER_STATE;

	assert.equal(shouldTriggerNeuralRaySound({ nodeId: "alpha", now: 0, settings, state }), true);
	state = getNextNeuralRaySoundTriggerState({ didPlay: true, nodeId: "alpha", now: 0, state });

	assert.equal(shouldTriggerNeuralRaySound({ nodeId: "alpha", now: 90, settings, state }), false);
	assert.equal(shouldTriggerNeuralRaySound({ nodeId: "beta", now: 40, settings, state }), false);
	state = getNextNeuralRaySoundTriggerState({ didPlay: false, nodeId: "beta", now: 40, state });
	assert.equal(shouldTriggerNeuralRaySound({ nodeId: "beta", now: 90, settings, state }), true);
	state = getNextNeuralRaySoundTriggerState({ didPlay: true, nodeId: "beta", now: 90, state });
	state = getNextNeuralRaySoundTriggerState({ didPlay: false, nodeId: null, now: 110, state });

	assert.equal(shouldTriggerNeuralRaySound({ nodeId: "beta", now: 170, settings, state }), true);
	assert.equal(shouldTriggerNeuralRaySound({
		nodeId: "gamma",
		now: 240,
		settings: { ...settings, enabled: false },
		state,
	}), false);
});

test("node hover sound trigger state blooms on node entry with cooldown protection", async () => {
	const {
		INITIAL_NEURAL_NODE_SOUND_TRIGGER_STATE,
		getNextNeuralNodeSoundTriggerState,
		shouldTriggerNeuralNodeSound,
	} = await raySoundModule;
	const settings = { cooldownMs: 95, enabled: true, volume: 0.7 };
	let state = INITIAL_NEURAL_NODE_SOUND_TRIGGER_STATE;

	assert.equal(shouldTriggerNeuralNodeSound({ nodeId: "alpha", now: 0, settings, state }), true);
	state = getNextNeuralNodeSoundTriggerState({ didPlay: true, nodeId: "alpha", now: 0, state });

	assert.equal(shouldTriggerNeuralNodeSound({ nodeId: "alpha", now: 140, settings, state }), false);
	assert.equal(shouldTriggerNeuralNodeSound({ nodeId: "beta", now: 50, settings, state }), false);
	state = getNextNeuralNodeSoundTriggerState({ didPlay: false, nodeId: "beta", now: 50, state });
	assert.equal(shouldTriggerNeuralNodeSound({ nodeId: "beta", now: 100, settings, state }), true);
	state = getNextNeuralNodeSoundTriggerState({ didPlay: true, nodeId: "beta", now: 100, state });
	state = getNextNeuralNodeSoundTriggerState({ didPlay: false, nodeId: null, now: 120, state });

	assert.equal(shouldTriggerNeuralNodeSound({ nodeId: "alpha", now: 190, settings, state }), false);
	assert.equal(shouldTriggerNeuralNodeSound({ nodeId: "alpha", now: 200, settings, state }), true);
	assert.equal(shouldTriggerNeuralNodeSound({
		nodeId: "beta",
		now: 240,
		settings: { ...settings, volume: 0 },
		state,
	}), false);
});

test("ray sound play options map elastic parameters to pitch, rate, pan, and velocity", async () => {
	const {
		DEFAULT_NEURAL_RAY_SOUND_SETTINGS,
		getNeuralRaySoundPlayOptions,
	} = await raySoundModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const baseHit = {
		distance: 2,
		node: layoutNode("alpha", 0),
		point: { x: 200, y: 120 },
		progress: 0.75,
	};
	const viewport = { height: 400, width: 800 };
	const soft = getNeuralRaySoundPlayOptions({
		hit: baseHit,
		params: {
			...DEFAULT_NEURAL_GRAPH_PARAMS,
			rayElasticDamping: 8,
			rayElasticRadius: 220,
			rayElasticStrength: 8,
			rayElasticTension: 60,
		},
		pointer: { x: 80, y: 120 },
		settings: DEFAULT_NEURAL_RAY_SOUND_SETTINGS,
		viewport,
	});
	const tight = getNeuralRaySoundPlayOptions({
		hit: { ...baseHit, node: layoutNode("beta", 0), progress: 0.95 },
		params: {
			...DEFAULT_NEURAL_GRAPH_PARAMS,
			rayElasticDamping: 80,
			rayElasticRadius: 20,
			rayElasticStrength: 80,
			rayElasticTension: 600,
		},
		pointer: { x: 720, y: 120 },
		settings: DEFAULT_NEURAL_RAY_SOUND_SETTINGS,
		viewport,
	});

	assert.ok(soft.detune < tight.detune);
	assert.ok(soft.playbackRate < tight.playbackRate);
	assert.ok(soft.velocity < tight.velocity);
	assert.ok(soft.pan < 0);
	assert.ok(tight.pan > 0);
	assert.ok(tight.volume <= 1);
});

test("node hover sound play options map node identity and hit position", async () => {
	const { getNeuralNodeSoundPlayOptions } = await raySoundModule;
	const viewport = { height: 400, width: 800 };
	const settings = { cooldownMs: 95, enabled: true, volume: 0.7 };
	const entityNode = layoutNode("entity-node", 0);
	entityNode.node = {
		...entityNode.node,
		degree: 12,
		kind: "entity",
	};
	const nearSource = getNeuralNodeSoundPlayOptions({
		hit: { distance: 2, node: layoutNode("source-node", 0) },
		pointer: { x: 80, y: 140 },
		settings,
		viewport,
	});
	const farEntity = getNeuralNodeSoundPlayOptions({
		hit: { distance: 40, node: entityNode },
		pointer: { x: 720, y: 140 },
		settings,
		viewport,
	});

	assert.ok(nearSource.pan < 0);
	assert.ok(farEntity.pan > 0);
	assert.notEqual(nearSource.detune, farEntity.detune);
	assert.ok(nearSource.volume > farEntity.volume);
	assert.ok(farEntity.playbackRate >= nearSource.playbackRate);
});

test("interaction settings clamp and pointer velocity map to vivid target intensity", async () => {
	const {
		DEFAULT_NEURAL_GRAPH_INTERACTION_SETTINGS,
		clampNeuralGraphInteractionSettings,
		getNeuralInteractionTargetIntensity,
		getNeuralPointerVelocity,
		getSmoothedNeuralGraphInteractionState,
	} = await interactionDynamicsModule;
	const settings = clampNeuralGraphInteractionSettings({
		flowBoost: 9,
		intensity: 4,
		nodeSoundCooldownMs: -40,
		nodeSoundVolume: 4,
		rayEmphasis: 3,
	});
	const slow = getNeuralPointerVelocity({
		elapsedMs: 100,
		from: { x: 10, y: 10 },
		to: { x: 14, y: 10 },
		viewport: { height: 400, width: 800 },
	});
	const fast = getNeuralPointerVelocity({
		elapsedMs: 16,
		from: { x: 10, y: 10 },
		to: { x: 240, y: 80 },
		viewport: { height: 400, width: 800 },
	});
	const nodeIntensity = getNeuralInteractionTargetIntensity({ settings, target: "node", velocity: fast.normalized });
	const rayIntensity = getNeuralInteractionTargetIntensity({ settings, target: "ray", velocity: fast.normalized });
	const smoothed = getSmoothedNeuralGraphInteractionState({
		current: {
			activeNodeId: "alpha",
			activeRayNodeId: null,
			flowBoost: 0.85,
			intensity: 0.5,
			pointer: { x: 100, y: 100 },
			rayDistance: 30,
			rayEmphasis: 1,
			rayProgress: 0.2,
			velocity: 0.1,
			velocityPxPerSecond: 120,
		},
		next: {
			activeNodeId: "beta",
			activeRayNodeId: null,
			flowBoost: 0.85,
			intensity: 0.7,
			pointer: { x: 300, y: 180 },
			rayDistance: 10,
			rayEmphasis: 1,
			rayProgress: 0.8,
			velocity: 0.9,
			velocityPxPerSecond: 900,
		},
		smoothing: 0.25,
	});

	assert.equal(settings.flowBoost, 1.5);
	assert.equal(settings.intensity, 1.5);
	assert.equal(settings.nodeSoundCooldownMs, 0);
	assert.equal(settings.nodeSoundVolume, 1);
	assert.equal(settings.rayEmphasis, 1.5);
	assert.ok(DEFAULT_NEURAL_GRAPH_INTERACTION_SETTINGS.nodeSoundEnabled);
	assert.ok(fast.normalized > slow.normalized);
	assert.ok(rayIntensity > nodeIntensity);
	assert.ok(nodeIntensity > getNeuralInteractionTargetIntensity({ settings, target: "none", velocity: slow.normalized }));
	assert.deepEqual(smoothed.pointer, { x: 150, y: 120 });
	assert.equal(smoothed.activeNodeId, "beta");
	assert.ok(smoothed.velocity > 0.1 && smoothed.velocity < 0.9);
});

test("neural graph color helpers translate legacy hex colors to ADS token variables", async () => {
	const {
		getNeuralGraphColorTokenOption,
		normalizeNeuralGraphColorValue,
		resolveNeuralGraphCssColorValue,
	} = await colorsModule;
	const fallback = "var(--ds-icon)";
	const expectations = [
		["#292A2E", "var(--ds-icon)", "color.icon"],
		["#172B4D", "var(--ds-icon)", "color.icon"],
		["#C9372C", "var(--ds-icon-accent-red)", "color.icon.accent.red"],
		["#FCA700", "var(--ds-icon-accent-orange)", "color.icon.accent.orange"],
		["#B38600", "var(--ds-icon-accent-yellow)", "color.icon.accent.yellow"],
		["#6A9A23", "var(--ds-icon-accent-lime)", "color.icon.accent.lime"],
		["#22A06B", "var(--ds-icon-accent-green)", "color.icon.accent.green"],
		["#2898BD", "var(--ds-icon-accent-teal)", "color.icon.accent.teal"],
		["#1868DB", "var(--ds-icon-accent-blue)", "color.icon.accent.blue"],
		["#AF59E1", "var(--ds-icon-accent-purple)", "color.icon.accent.purple"],
		["#6B5CE7", "var(--ds-icon-accent-purple)", "color.icon.accent.purple"],
		["#CD519D", "var(--ds-icon-accent-magenta)", "color.icon.accent.magenta"],
		["#4B4D51", "var(--ds-icon-accent-gray)", "color.icon.accent.gray"],
	];

	for (const [hex, tokenValue, tokenName] of expectations) {
		assert.equal(normalizeNeuralGraphColorValue(hex, fallback), tokenValue);
		assert.equal(getNeuralGraphColorTokenOption(hex).token, tokenName);
	}
	assert.equal(resolveNeuralGraphCssColorValue("var(--ds-icon-accent-purple)"), "#AF59E1");
});

test("personal graph node type colors use TWG metadata before broad graph kinds", async () => {
	const {
		getPersonalGraphNodeTypeAccentToken,
		getPersonalGraphNodeTypeCategory,
	} = await nodeTypeColorsModule;

	const confluencePage = node("page", "Design notes", "source", 1, {
		frontmatter: { type: "ConfluencePage" },
		provider: "twg",
	});
	const jiraIssue = node("ari:cloud:jira:site:issue/123", "ABC-123", "source", 1, {
		frontmatter: {},
		provider: "twg",
	});
	const accountUser = node("user", "Ada", "entity", 1, {
		frontmatter: { type: "AtlassianAccountUser" },
		provider: "twg",
	});
	const vaultConcept = node("wiki:concepts/Graph", "Graph", "concept", 1, {
		frontmatter: { type: "concept" },
		provider: "vault",
	});

	assert.equal(getPersonalGraphNodeTypeCategory(confluencePage), "confluence");
	assert.equal(getPersonalGraphNodeTypeAccentToken(confluencePage), "var(--ds-icon-accent-blue)");
	assert.equal(getPersonalGraphNodeTypeCategory(jiraIssue), "jira");
	assert.equal(getPersonalGraphNodeTypeAccentToken(jiraIssue), "var(--ds-icon-accent-purple)");
	assert.equal(getPersonalGraphNodeTypeCategory(accountUser), "person");
	assert.equal(getPersonalGraphNodeTypeAccentToken(accountUser), "var(--ds-icon-accent-lime)");
	assert.equal(getPersonalGraphNodeTypeCategory(vaultConcept), "concept");
	assert.equal(getPersonalGraphNodeTypeAccentToken(vaultConcept), null);
});

test("drawNeuralGraph rounds square nodes with the shared node radius param", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 200, width: 300 };
	const graphNode = layoutNode("rounded", 0);
	const layout = {
		edges: [],
		nodes: [graphNode],
		nodesById: new Map([[graphNode.id, graphNode]]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const params = {
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		nodeRadius: 6,
		nodeShape: "square",
		showLabels: false,
		showRays: false,
	};
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

	assert.ok(ctx.calls.some(([name]) => name === "quadraticCurveTo"));
	assert.equal(ctx.calls.some(([name]) => name === "fillRect"), false);
});

test("shouldAnimateNeuralGraph skips static reduced-motion layouts while preserving signal motion", async () => {
	const { DEFAULT_NEURAL_GRAPH_PARAMS, shouldAnimateNeuralGraph } = await paramsModule;

	assert.equal(shouldAnimateNeuralGraph(DEFAULT_NEURAL_GRAPH_PARAMS), true);
	assert.equal(shouldAnimateNeuralGraph(DEFAULT_NEURAL_GRAPH_PARAMS, true), false);
	assert.equal(shouldAnimateNeuralGraph({ ...DEFAULT_NEURAL_GRAPH_PARAMS, amplitude: 0 }), true);
	assert.equal(shouldAnimateNeuralGraph({ ...DEFAULT_NEURAL_GRAPH_PARAMS, speed: 0 }), true);
	assert.equal(shouldAnimateNeuralGraph({ ...DEFAULT_NEURAL_GRAPH_PARAMS, amplitude: 0, showSignals: false }), false);
	assert.equal(shouldAnimateNeuralGraph({ ...DEFAULT_NEURAL_GRAPH_PARAMS, signalFrequency: 0, speed: 0 }), false);
});

test("responsive Personal Graph params tighten compact viewports", async () => {
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { getResponsivePersonalGraphParams } = await responsiveParamsModule;

	const params = getResponsivePersonalGraphParams({ height: 700, width: 390 }, DEFAULT_NEURAL_GRAPH_PARAMS);

	assert.ok(params.spread < DEFAULT_NEURAL_GRAPH_PARAMS.spread);
	assert.ok(params.maxVisibleNodes < DEFAULT_NEURAL_GRAPH_PARAMS.maxVisibleNodes);
	assert.ok(params.labelSize < DEFAULT_NEURAL_GRAPH_PARAMS.labelSize);
	assert.equal(params.showLabels, false);
});

test("responsive Personal Graph params preserve wide desktop density", async () => {
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const {
		RESPONSIVE_PERSONAL_GRAPH_NUMERIC_PARAM_KEYS,
		RESPONSIVE_PERSONAL_GRAPH_WIDTHS,
		getResponsivePersonalGraphParams,
	} = await responsiveParamsModule;

	const params = getResponsivePersonalGraphParams(
		{ height: 900, width: RESPONSIVE_PERSONAL_GRAPH_WIDTHS.wide + 120 },
		DEFAULT_NEURAL_GRAPH_PARAMS,
	);

	for (const key of RESPONSIVE_PERSONAL_GRAPH_NUMERIC_PARAM_KEYS) {
		assert.equal(params[key], DEFAULT_NEURAL_GRAPH_PARAMS[key], key);
	}
	assert.equal(params.showLabels, true);
});

test("responsive Personal Graph params interpolate numeric values without changing shared visual treatment", async () => {
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { RESPONSIVE_PERSONAL_GRAPH_WIDTHS, getResponsivePersonalGraphParams } = await responsiveParamsModule;
	const baseParams = {
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		edgeColor: "#444444",
		nodeColor: "#222222",
		signalColor: "var(--ds-icon)",
		signalFrequency: 0.5,
		signalGlowEnabled: false,
		signalLength: 0.5,
		signalOpacity: 1,
		signalWidth: 1,
	};
	const medium = getResponsivePersonalGraphParams(
		{ height: 760, width: RESPONSIVE_PERSONAL_GRAPH_WIDTHS.medium },
		baseParams,
	);
	const midpoint = getResponsivePersonalGraphParams(
		{ height: 760, width: (RESPONSIVE_PERSONAL_GRAPH_WIDTHS.medium + RESPONSIVE_PERSONAL_GRAPH_WIDTHS.wide) / 2 },
		baseParams,
	);
	const wide = getResponsivePersonalGraphParams(
		{ height: 760, width: RESPONSIVE_PERSONAL_GRAPH_WIDTHS.wide },
		baseParams,
	);

	assert.ok(midpoint.spread > medium.spread);
	assert.ok(midpoint.spread < wide.spread);
	assert.ok(midpoint.maxVisibleNodes > medium.maxVisibleNodes);
	assert.ok(midpoint.maxVisibleNodes < wide.maxVisibleNodes);
	assert.equal(midpoint.colorConcept, baseParams.colorConcept);
	assert.equal(midpoint.colorEntity, baseParams.colorEntity);
	assert.equal(midpoint.edgeColor, baseParams.edgeColor);
	assert.equal(midpoint.nodeColor, baseParams.nodeColor);
	assert.equal(midpoint.signalColor, baseParams.signalColor);
	assert.equal(midpoint.signalFrequency, baseParams.signalFrequency);
	assert.equal(midpoint.signalGlowEnabled, baseParams.signalGlowEnabled);
	assert.equal(midpoint.signalLength, baseParams.signalLength);
	assert.equal(midpoint.signalOpacity, baseParams.signalOpacity);
	assert.equal(midpoint.signalWidth, baseParams.signalWidth);
});

test("responsive Personal Graph params do not animate before measurement or for reduced motion", async () => {
	const { shouldAnimateResponsivePersonalGraphParams } = await responsiveParamsModule;

	assert.equal(
		shouldAnimateResponsivePersonalGraphParams({ hasMeasuredViewport: false, prefersReducedMotion: false }),
		false,
	);
	assert.equal(
		shouldAnimateResponsivePersonalGraphParams({ hasMeasuredViewport: true, prefersReducedMotion: true }),
		false,
	);
	assert.equal(
		shouldAnimateResponsivePersonalGraphParams({ hasMeasuredViewport: true, prefersReducedMotion: false }),
		true,
	);
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

test("computeNeuralGraphLayout arranges radial cluster leaves on a shared outer radius", async () => {
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const treeExplorer = {
		edges: [
			edge("root", "alpha"),
			edge("root", "beta"),
			edge("beta", "gamma"),
			edge("beta", "delta"),
		],
		generatedAt: "2026-04-30T00:00:00.000Z",
		nodes: [
			node("root", "Root", "synthesis", 2),
			node("alpha", "Alpha", "concept", 1),
			node("beta", "Beta", "entity", 3),
			node("gamma", "Gamma", "raw", 1),
			node("delta", "Delta", "source", 1),
		],
		stats: { danglingCount: 0, edgeCount: 4, nodeCount: 5, rawCount: 1, wikiCount: 4 },
	};
	const params = clampNeuralGraphParams({
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		amplitude: 0,
		layoutShape: "radialCluster",
		maxVisibleNodes: 10,
		radialArcAngle: 180,
		speed: 0,
		spread: 400,
	});
	const layout = computeNeuralGraphLayout({
		params,
		selectedNodeId: "root",
		store: createNeuralGraphStore(treeExplorer),
		viewport: { height: 700, width: 1000 },
	});
	const radius = (nodeId) => {
		const node = layout.nodesById.get(nodeId);
		return Number(Math.hypot(node.x, node.y).toFixed(3));
	};

	assert.equal(layout.layoutShape, "radialCluster");
	assert.equal(layout.treeBranches.filter((branch) => branch.sourceId === null).at(0).targetId, "root");
	assert.deepEqual(layout.treeBranches.map((branch) => branch.targetId).sort(), ["alpha", "beta", "delta", "gamma", "root"]);
	assert.equal(radius("alpha"), radius("gamma"));
	assert.equal(radius("gamma"), radius("delta"));
	assert.ok(radius("root") < radius("beta"));
	assert.ok(radius("beta") < radius("alpha"));
});

test("computeNeuralGraphLayout distributes full-circle radial leaves without duplicating endpoints", async () => {
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const radialExplorer = {
		edges: ["alpha", "beta", "gamma", "delta"].map((target) => edge("root", target)),
		generatedAt: "2026-04-30T00:00:00.000Z",
		nodes: [
			node("root", "Root", "synthesis", 4),
			node("alpha", "Alpha", "concept", 1),
			node("beta", "Beta", "concept", 1),
			node("gamma", "Gamma", "concept", 1),
			node("delta", "Delta", "concept", 1),
		],
		stats: { danglingCount: 0, edgeCount: 4, nodeCount: 5, rawCount: 0, wikiCount: 5 },
	};
	const params = clampNeuralGraphParams({
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		amplitude: 0,
		layoutShape: "radialCluster",
		maxVisibleNodes: 10,
		radialArcAngle: 360,
		speed: 0,
		spread: 400,
	});
	const layout = computeNeuralGraphLayout({
		params,
		selectedNodeId: "root",
		store: createNeuralGraphStore(radialExplorer),
		viewport: { height: 700, width: 1000 },
	});
	const angles = ["alpha", "beta", "gamma", "delta"]
		.map((nodeId) => {
			const layoutNode = layout.nodesById.get(nodeId);
			const angle = Math.atan2(layoutNode.y, layoutNode.x);
			return angle < 0 ? angle + Math.PI * 2 : angle;
		})
		.sort((left, right) => left - right);
	const gaps = angles.map((angle, index) => {
		const next = angles[(index + 1) % angles.length] + (index === angles.length - 1 ? Math.PI * 2 : 0);
		return Number((next - angle).toFixed(3));
	});

	assert.deepEqual(gaps, [1.571, 1.571, 1.571, 1.571]);
});

test("computeNeuralGraphLayout averages radial branch angles across the seam", async () => {
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const seamExplorer = {
		edges: [
			edge("root", "wrap"),
			edge("wrap", "wrap-a"),
			edge("wrap", "wrap-b"),
			edge("wrap", "wrap-c"),
			edge("wrap", "wrap-d"),
			edge("root", "tail"),
			edge("tail", "tail-a"),
			edge("tail", "tail-b"),
			edge("tail", "tail-c"),
		],
		generatedAt: "2026-04-30T00:00:00.000Z",
		nodes: [
			node("root", "Root", "synthesis", 2),
			node("wrap", "Wrap", "concept", 5),
			node("wrap-a", "Wrap A", "concept", 1),
			node("wrap-b", "Wrap B", "concept", 1),
			node("wrap-c", "Wrap C", "concept", 1),
			node("wrap-d", "Wrap D", "concept", 1),
			node("tail", "Tail", "concept", 4),
			node("tail-a", "Tail A", "concept", 1),
			node("tail-b", "Tail B", "concept", 1),
			node("tail-c", "Tail C", "concept", 1),
		],
		stats: { danglingCount: 0, edgeCount: 9, nodeCount: 9, rawCount: 0, wikiCount: 9 },
	};
	const params = clampNeuralGraphParams({
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		amplitude: 0,
		layoutShape: "radialCluster",
		maxVisibleNodes: 20,
		radialArcAngle: 360,
		speed: 0,
		spread: 400,
	});
	const layout = computeNeuralGraphLayout({
		params,
		selectedNodeId: "root",
		store: createNeuralGraphStore(seamExplorer),
		viewport: { height: 700, width: 1000 },
	});
	const wrap = layout.nodesById.get("wrap");
	const wrapAngle = Math.atan2(wrap.y, wrap.x);
	const wrapDegrees = (wrapAngle < 0 ? wrapAngle + Math.PI * 2 : wrapAngle) * 180 / Math.PI;

	assert.ok(wrapDegrees > 120 && wrapDegrees < 220, `expected wrap branch to stay on the left side, got ${wrapDegrees}`);
});

test("computeNeuralGraphLayout keeps radial cycles as cross-links without duplicating nodes", async () => {
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const cycleExplorer = {
		edges: [
			edge("root", "alpha"),
			edge("alpha", "beta"),
			edge("beta", "root"),
		],
		generatedAt: "2026-04-30T00:00:00.000Z",
		nodes: [
			node("root", "Root", "synthesis", 2),
			node("alpha", "Alpha", "concept", 2),
			node("beta", "Beta", "entity", 2),
		],
		stats: { danglingCount: 0, edgeCount: 3, nodeCount: 3, rawCount: 0, wikiCount: 3 },
	};
	const params = clampNeuralGraphParams({
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		amplitude: 0,
		layoutShape: "radialCluster",
		maxVisibleNodes: 10,
		speed: 0,
	});
	const layout = computeNeuralGraphLayout({
		params,
		selectedNodeId: "root",
		store: createNeuralGraphStore(cycleExplorer),
		viewport: { height: 700, width: 1000 },
	});

	assert.deepEqual(layout.nodes.map((item) => item.id).sort(), ["alpha", "beta", "root"]);
	assert.equal(new Set(layout.nodes.map((item) => item.id)).size, 3);
	assert.equal(layout.treeBranches.length, 3);
	assert.equal(layout.crossEdges.length, 1);
	assert.equal(layout.edges.length, 3);
});

test("computeNeuralGraphLayout gives disconnected radial components separate origin branches", async () => {
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const forestExplorer = {
		edges: [
			edge("root", "alpha"),
			edge("orphan", "leaf"),
		],
		generatedAt: "2026-04-30T00:00:00.000Z",
		nodes: [
			node("root", "Root", "synthesis", 1),
			node("alpha", "Alpha", "concept", 1),
			node("orphan", "Orphan", "entity", 1),
			node("leaf", "Leaf", "source", 1),
		],
		stats: { danglingCount: 0, edgeCount: 2, nodeCount: 4, rawCount: 0, wikiCount: 4 },
	};
	const params = clampNeuralGraphParams({
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		amplitude: 0,
		layoutShape: "radialCluster",
		maxVisibleNodes: 10,
		speed: 0,
	});
	const layout = computeNeuralGraphLayout({
		params,
		selectedNodeId: null,
		store: createNeuralGraphStore(forestExplorer),
		viewport: { height: 700, width: 1000 },
	});

	const originBranches = layout.treeBranches.filter((branch) => branch.sourceId === null);
	assert.equal(originBranches.length, 2);
	assert.equal(new Set(originBranches.map((branch) => branch.targetId)).size, 2);
});

test("smoothNeuralGraphLayout eases animated node movement while preserving edge bindings", async () => {
	const { smoothNeuralGraphLayout } = await layoutModule;
	const viewport = { height: 200, width: 300 };
	const currentAlpha = layoutNode("alpha", 0);
	const currentBeta = layoutNode("beta", 100);
	const current = {
		edges: [layoutEdge("alpha-beta", currentAlpha, currentBeta)],
		nodes: [currentAlpha, currentBeta],
		nodesById: new Map([
			[currentAlpha.id, currentAlpha],
			[currentBeta.id, currentBeta],
		]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const nextAlpha = layoutNode("alpha", 80);
	const nextBeta = layoutNode("beta", 180);
	const next = {
		edges: [layoutEdge("alpha-beta", nextAlpha, nextBeta)],
		nodes: [nextAlpha, nextBeta],
		nodesById: new Map([
			[nextAlpha.id, nextAlpha],
			[nextBeta.id, nextBeta],
		]),
		origin: { x: 0, y: 0 },
		viewport,
	};

	const smoothed = smoothNeuralGraphLayout({ amount: 0.25, current, next });

	assert.equal(smoothed.nodesById.get("alpha").x, 20);
	assert.equal(smoothed.nodesById.get("beta").x, 120);
	assert.equal(smoothed.edges[0].source, smoothed.nodesById.get("alpha"));
	assert.equal(smoothed.edges[0].target, smoothed.nodesById.get("beta"));
});

test("pinNeuralGraphNodePosition freezes one node and rebinds connected edges", async () => {
	const { pinNeuralGraphNodePosition } = await layoutModule;
	const viewport = { height: 200, width: 300 };
	const source = layoutNode("source", 80);
	const target = layoutNode("target", 180);
	const layout = {
		edges: [layoutEdge("source-target", source, target)],
		nodes: [source, target],
		nodesById: new Map([
			[source.id, source],
			[target.id, target],
		]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const frozen = { ...layoutNode("source", 24), depthScale: 0.8, y: -42, z: 12 };

	const pinned = pinNeuralGraphNodePosition({ layout, nodeId: "source", position: frozen });

	assert.equal(pinned.nodesById.get("source").x, 24);
	assert.equal(pinned.nodesById.get("source").y, -42);
	assert.equal(pinned.nodesById.get("source").z, 12);
	assert.equal(pinned.nodesById.get("target").x, 180);
	assert.equal(pinned.edges[0].source, pinned.nodesById.get("source"));
	assert.equal(pinned.edges[0].target, pinned.nodesById.get("target"));
});

test("computeNeuralGraphLayout applies transient cursor flow without mutating params", async () => {
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const store = createNeuralGraphStore(explorer);
	const params = clampNeuralGraphParams({ ...DEFAULT_NEURAL_GRAPH_PARAMS, maxVisibleNodes: 10 });
	const viewport = { height: 700, width: 1000 };
	const neutral = computeNeuralGraphLayout({ params, selectedNodeId: null, store, time: 1, viewport });
	const active = computeNeuralGraphLayout({
		interaction: {
			activeNodeId: "selected",
			activeRayNodeId: null,
			flowBoost: 0.85,
			intensity: 0.9,
			pointer: { x: 880, y: 120 },
			rayDistance: 0,
			rayEmphasis: 0.9,
			rayProgress: 0,
			velocity: 0.8,
			velocityPxPerSecond: 980,
		},
		params,
		selectedNodeId: null,
		store,
		time: 1,
		viewport,
	});

	assert.notDeepEqual(
		active.nodes.map(({ id, x, y }) => [id, Number(x.toFixed(3)), Number(y.toFixed(3))]),
		neutral.nodes.map(({ id, x, y }) => [id, Number(x.toFixed(3)), Number(y.toFixed(3))]),
	);
	assert.equal(params.speed, DEFAULT_NEURAL_GRAPH_PARAMS.speed);
});

test("computeNeuralGraphLayout keeps ray-only hover motion out of node layout", async () => {
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const store = createNeuralGraphStore(explorer);
	const params = clampNeuralGraphParams({ ...DEFAULT_NEURAL_GRAPH_PARAMS, maxVisibleNodes: 10 });
	const viewport = { height: 700, width: 1000 };
	const neutral = computeNeuralGraphLayout({ params, selectedNodeId: null, store, time: 1, viewport });
	const rayOnly = computeNeuralGraphLayout({
		interaction: {
			activeNodeId: null,
			activeRayNodeId: "selected",
			flowBoost: 0.85,
			intensity: 0.9,
			pointer: { x: 880, y: 120 },
			rayDistance: 12,
			rayEmphasis: 1,
			rayProgress: 0.72,
			velocity: 0.8,
			velocityPxPerSecond: 980,
		},
		params,
		selectedNodeId: null,
		store,
		time: 1,
		viewport,
	});

	assert.deepEqual(
		rayOnly.nodes.map(({ id, x, y }) => [id, Number(x.toFixed(3)), Number(y.toFixed(3))]),
		neutral.nodes.map(({ id, x, y }) => [id, Number(x.toFixed(3)), Number(y.toFixed(3))]),
	);
});

test("computeNeuralGraphLayout keeps missing and dangling nodes fully opaque", async () => {
	const { computeNeuralGraphLayout } = await layoutModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { createNeuralGraphStore } = await storeModule;
	const viewport = { height: 700, width: 1000 };
	const missingExplorer = {
		edges: [],
		generatedAt: "2026-04-30T00:00:00.000Z",
		nodes: [
			node("missing", "Missing", "concept", 0, {
				dangling: true,
				missing: true,
			}),
		],
		stats: {
			danglingCount: 1,
			edgeCount: 0,
			nodeCount: 1,
			rawCount: 0,
			wikiCount: 1,
		},
	};
	const store = createNeuralGraphStore(missingExplorer);
	const layout = computeNeuralGraphLayout({
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		selectedNodeId: null,
		store,
		viewport,
	});

	assert.equal(layout.nodesById.get("missing").alpha, 1);
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

test("drawNeuralGraph fills missing and dangling nodes with full node color", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 200, width: 300 };
	const graphNode = layoutNode("missing", 0);
	graphNode.node.dangling = true;
	graphNode.node.missing = true;
	const layout = {
		edges: [],
		nodes: [graphNode],
		nodesById: new Map([[graphNode.id, graphNode]]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const params = {
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		colorConcept: "#292A2E",
		nodeOpacity: 1,
		showLabels: false,
		showRays: false,
	};
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

	assert.ok(ctx.calls.some(([name, value]) => name === "fillStyle" && value === "#292A2E"));
	assert.equal(
		ctx.calls.some(([name, value]) => name === "fillStyle" && typeof value === "string" && value.includes("0.5")),
		false,
	);
	assert.deepEqual(
		ctx.calls.filter(([name]) => name === "globalAlpha").map(([, value]) => value),
		[1],
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

test("drawNeuralGraph renders radial branches separately from cross-links", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 300, width: 400 };
	const root = { ...layoutNode("root", 0), y: -80 };
	const child = { ...layoutNode("child", 80), y: -160 };
	const sibling = { ...layoutNode("sibling", -80), y: -160 };
	const treeEdge = layoutEdge("root-child", root, child);
	const crossEdge = layoutEdge("child-sibling", child, sibling);
	const layout = {
		crossEdges: [crossEdge],
		edges: [treeEdge, crossEdge],
		layoutShape: "radialCluster",
		nodes: [root, child, sibling],
		nodesById: new Map([
			[root.id, root],
			[child.id, child],
			[sibling.id, sibling],
		]),
		origin: { x: 0, y: 0 },
		treeBranches: [
			{
				edge: null,
				id: "origin-root",
				source: null,
				sourceId: null,
				target: root,
				targetId: root.id,
			},
			{
				edge: treeEdge.edge,
				id: treeEdge.id,
				source: root,
				sourceId: root.id,
				target: child,
				targetId: child.id,
			},
		],
		viewport,
	};
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(ctx, layout, {
		background: "transparent",
		camera: createNeuralCamera(),
		focusProgress: 0,
		hoveredNodeId: null,
		params: {
			...DEFAULT_NEURAL_GRAPH_PARAMS,
			layoutShape: "radialCluster",
			glowIntensity: 0,
			nodeRadius: 0,
			nodeShape: "square",
			showLabels: false,
			showSignals: false,
		},
		selectedNodeId: child.id,
		theme: "light",
		viewport,
	});

	const firstCrossLinkIndex = ctx.calls.findIndex(([name]) => name === "lineTo");
	const radialPathIndexes = ctx.calls.flatMap(([name], index) => name === "bezierCurveTo" ? [index] : []);
	const firstBranchIndex = radialPathIndexes[2];
	assert.ok(firstCrossLinkIndex >= 0);
	assert.ok(firstBranchIndex >= 0);
	assert.ok(firstCrossLinkIndex < firstBranchIndex);
	assert.equal(radialPathIndexes.length, 4);
	const firstCrossLinkAlpha = ctx.calls
		.slice(0, firstCrossLinkIndex)
		.filter(([name]) => name === "globalAlpha")
		.at(-1)
		?.at(1);
	const firstBranchAlpha = ctx.calls
		.slice(0, firstBranchIndex)
		.filter(([name]) => name === "globalAlpha")
		.at(-1)
		?.at(1);
	assert.ok(firstCrossLinkAlpha < firstBranchAlpha);
});

test("drawNeuralGraph draws rotated outer labels for radial leaves", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 720, width: 960 };
	const root = { ...layoutNode("root", 0), y: 0 };
	const child = {
		...layoutNode("child", 200),
		node: { ...layoutNode("child", 200).node, title: "Child" },
		y: 0,
	};
	const sibling = {
		...layoutNode("sibling", -200),
		node: { ...layoutNode("sibling", -200).node, title: "Sibling" },
		y: 0,
	};
	const childEdge = layoutEdge("root-child", root, child);
	const siblingEdge = layoutEdge("root-sibling", root, sibling);
	const layout = {
		edges: [childEdge, siblingEdge],
		layoutShape: "radialCluster",
		nodes: [root, child, sibling],
		nodesById: new Map([
			[root.id, root],
			[child.id, child],
			[sibling.id, sibling],
		]),
		origin: { x: 0, y: 0 },
		treeBranches: [
			{
				edge: null,
				id: "origin-root",
				source: null,
				sourceId: null,
				target: root,
				targetId: root.id,
			},
			{
				edge: childEdge.edge,
				id: childEdge.id,
				source: root,
				sourceId: root.id,
				target: child,
				targetId: child.id,
			},
			{
				edge: siblingEdge.edge,
				id: siblingEdge.id,
				source: root,
				sourceId: root.id,
				target: sibling,
				targetId: sibling.id,
			},
		],
		viewport,
	};
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(ctx, layout, {
		background: "transparent",
		camera: createNeuralCamera(),
		focusProgress: 0,
		hoveredNodeId: null,
		params: {
			...DEFAULT_NEURAL_GRAPH_PARAMS,
			layoutShape: "radialCluster",
			showEdges: false,
			showLabels: true,
			showRays: false,
			showSignals: false,
		},
		selectedNodeId: null,
		theme: "light",
		viewport,
	});

	assert.deepEqual(
		ctx.calls.filter(([name]) => name === "fillText").map(([, text]) => text).sort(),
		["Child", "Sibling"],
	);
	assert.ok(ctx.calls.some(([name]) => name === "rotate"));
	assert.ok(ctx.calls.some(([name, value]) => name === "textAlign" && value === "right"));
});

test("drawNeuralGraph keeps radial branches centered while ray tails start at the prompt origin", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 400, width: 600 };
	const root = { ...layoutNode("root", 0), y: 0 };
	const child = { ...layoutNode("child", 120), y: -120 };
	const sibling = { ...layoutNode("sibling", -120), y: -120 };
	const childEdge = layoutEdge("root-child", root, child);
	const siblingEdge = layoutEdge("root-sibling", root, sibling);
	const layout = {
		edges: [childEdge, siblingEdge],
		layoutShape: "radialCluster",
		nodes: [root, child, sibling],
		nodesById: new Map([
			[root.id, root],
			[child.id, child],
			[sibling.id, sibling],
		]),
		origin: { x: 0, y: 0 },
		treeBranches: [
			{
				edge: null,
				id: "origin-root",
				source: null,
				sourceId: null,
				target: root,
				targetId: root.id,
			},
			{
				edge: childEdge.edge,
				id: childEdge.id,
				source: root,
				sourceId: root.id,
				target: child,
				targetId: child.id,
			},
			{
				edge: siblingEdge.edge,
				id: siblingEdge.id,
				source: root,
				sourceId: root.id,
				target: sibling,
				targetId: sibling.id,
			},
		],
		viewport,
	};
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(ctx, layout, {
		background: "transparent",
		camera: createNeuralCamera(),
		focusProgress: 0,
		hoveredNodeId: null,
		params: {
			...DEFAULT_NEURAL_GRAPH_PARAMS,
			glowIntensity: 0,
			layoutShape: "radialCluster",
			nodeRadius: 0,
			nodeShape: "square",
			originY: 0.5,
			showEdges: false,
			showLabels: false,
			showRays: true,
			showSignals: false,
		},
		rayOriginY: 360,
		selectedNodeId: null,
		theme: "light",
		viewport,
	});

	const moveTos = ctx.calls.filter(([name]) => name === "moveTo");
	assert.deepEqual(moveTos.slice(0, 2).map(([, x, y]) => [x, y]), [[300, 360], [300, 360]]);
	assert.deepEqual(moveTos[2].slice(1), [300, 200]);
	assert.equal(ctx.calls.filter(([name]) => name === "bezierCurveTo").length, 5);
});

test("drawNeuralGraph bends ray curves with the elastic hover field", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 200, width: 300 };
	const graphNode = layoutNode("ray-target", 0);
	graphNode.y = -100;
	const layout = {
		edges: [],
		nodes: [graphNode],
		nodesById: new Map([[graphNode.id, graphNode]]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const params = {
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		showEdges: false,
		showLabels: false,
		showRays: true,
		showSignals: false,
	};
	const renderRayControls = (overrides = {}, rayElastic = null) => {
		const ctx = createRecordingCanvasContext();
		drawNeuralGraph(ctx, layout, {
			background: "transparent",
			camera: createNeuralCamera(),
			focusProgress: 0,
			hoveredNodeId: null,
			params: { ...params, ...overrides },
			rayElastic,
			selectedNodeId: null,
			theme: "light",
			viewport,
		});
		return ctx.calls.find(([name]) => name === "bezierCurveTo").slice(1);
	};
	const elasticPoint = { x: viewport.width / 2 + 30, y: viewport.height * 0.8 };
	const neutral = renderRayControls();
	const elastic = renderRayControls({}, { point: elasticPoint, progress: 1 });
	const disabled = renderRayControls({ rayElasticStrength: 0 }, { point: elasticPoint, progress: 1 });

	assert.notDeepEqual(elastic, neutral);
	assert.deepEqual(disabled, neutral);
});

test("drawNeuralGraph brightens the touched ray without changing width", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 200, width: 300 };
	const activeNode = layoutNode("ray-target", 0);
	activeNode.y = -100;
	const idleNode = layoutNode("idle-target", 80);
	idleNode.y = -120;
	const layout = {
		edges: [],
		nodes: [activeNode, idleNode],
		nodesById: new Map([
			[activeNode.id, activeNode],
			[idleNode.id, idleNode],
		]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const params = {
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		rayOpacity: 0.02,
		rayWidth: 2,
		showEdges: false,
		showLabels: false,
		showRays: true,
		showSignals: false,
	};
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(ctx, layout, {
		background: "transparent",
		camera: createNeuralCamera(),
		focusProgress: 0,
		hoveredNodeId: null,
		interaction: {
			activeNodeId: null,
			activeRayNodeId: activeNode.id,
			flowBoost: 0.85,
			intensity: 0.8,
			pointer: { x: 170, y: 160 },
			rayDistance: 1,
			rayEmphasis: 1,
			rayProgress: 0.7,
			velocity: 0.7,
			velocityPxPerSecond: 900,
		},
		params,
		rayElastic: {
			hitProgress: 0.7,
			nodeId: activeNode.id,
			point: { x: 170, y: 160 },
			progress: 1,
			velocity: 0.7,
		},
		selectedNodeId: null,
		theme: "light",
		viewport,
	});
	const lineWidths = ctx.calls
		.filter(([name]) => name === "lineWidth")
		.map(([, value]) => value);
	const alphaValues = ctx.calls
		.filter(([name]) => name === "globalAlpha")
		.map(([, value]) => value);

	assert.ok(lineWidths.includes(params.rayWidth));
	assert.ok(Math.max(...lineWidths) <= params.rayWidth);
	assert.equal(Math.max(...alphaValues), 1);
});

test("drawNeuralGraph resolves design-token colors before drawing on canvas", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS, clampNeuralGraphParams } = await paramsModule;
	const { computeNeuralGraphLayout } = await layoutModule;
	const { drawNeuralGraph } = await rendererModule;
	const { createNeuralGraphStore } = await storeModule;
	const viewport = { height: 700, width: 1000 };
	const store = createNeuralGraphStore(explorer);
	const params = clampNeuralGraphParams({
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		rayColor: "var(--ds-icon-accent-purple)",
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
		resolveColor: (color) => color === "var(--ds-icon-accent-purple)" ? "#B56AF0" : color,
		selectedNodeId: null,
		theme: "light",
		viewport,
	});

	assert.deepEqual(
		ctx.calls.find(([name]) => name === "strokeStyle"),
		["strokeStyle", "#B56AF0"],
	);
});

test("drawNeuralGraph resolves each repeated design token once per frame", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 240, width: 360 };
	const alpha = layoutNode("alpha", -80);
	const beta = layoutNode("beta", 0);
	const gamma = layoutNode("gamma", 80);
	const layout = {
		edges: [
			layoutEdge("alpha-beta", alpha, beta),
			layoutEdge("beta-gamma", beta, gamma),
			layoutEdge("gamma-alpha", gamma, alpha),
		],
		nodes: [alpha, beta, gamma],
		nodesById: new Map([
			[alpha.id, alpha],
			[beta.id, beta],
			[gamma.id, gamma],
		]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const callsByColor = new Map();
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(ctx, layout, {
		animationTime: 0,
		background: "transparent",
		camera: createNeuralCamera(),
		focusProgress: 0,
		hoveredNodeId: null,
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		resolveColor: (color) => {
			callsByColor.set(color, (callsByColor.get(color) ?? 0) + 1);
			return color === "var(--ds-icon)" ? "#172B4D" : "#6554C0";
		},
		selectedNodeId: null,
		theme: "light",
		viewport,
	});

	assert.equal(callsByColor.get("var(--ds-icon)"), 1);
	assert.equal(callsByColor.get("var(--ds-icon-accent-gray)"), 1);
	assert.equal(callsByColor.get("var(--ds-icon-accent-purple)"), 1);
	assert.equal(
		[...callsByColor.values()].reduce((total, count) => total + count, 0),
		3,
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

test("drawNeuralGraph layers selected edges without sorting the edge array", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 200, width: 300 };
	const selected = layoutNode("selected", 0);
	const nodes = Array.from({ length: 21 }, (_, index) => layoutNode(`node-${index}`, index * 8));
	const edges = Array.from({ length: 20 }, (_, index) => {
		const source = index < 4 ? selected : nodes[index];
		const target = nodes[index + 1] ?? nodes[0];
		return layoutEdge(`edge-${index}`, source, target);
	});
	const layout = {
		edges,
		nodes: [],
		nodesById: new Map(),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const originalSort = Array.prototype.sort;
	let edgeSorts = 0;

	Array.prototype.sort = function sortWithEdgeCounter(compareFn) {
		if (this.length > 0 && this[0] && typeof this[0] === "object" && "source" in this[0] && "target" in this[0]) {
			edgeSorts += 1;
		}
		return originalSort.call(this, compareFn);
	};

	try {
		drawNeuralGraph(createRecordingCanvasContext(), layout, {
			background: "transparent",
			camera: createNeuralCamera(),
			focusProgress: 1,
			hoveredNodeId: null,
			params: {
				...DEFAULT_NEURAL_GRAPH_PARAMS,
				showLabels: false,
				showRays: false,
				showSignals: false,
			},
			selectedNodeId: "selected",
			theme: "light",
			viewport,
		});
	} finally {
		Array.prototype.sort = originalSort;
	}

	assert.equal(edgeSorts, 0);
});

test("drawNeuralGraph traces momentary signal streaks along animated edges", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 200, width: 300 };
	const source = layoutNode("source", 0);
	const target = layoutNode("target", 80);
	const freeSource = layoutNode("free-source", -80);
	const freeTarget = layoutNode("free-target", -20);
	const layout = {
		edges: [
			layoutEdge("signal", source, target),
			layoutEdge("free-6", freeSource, freeTarget),
		],
		nodes: [source, target, freeSource, freeTarget],
		nodesById: new Map([
			[source.id, source],
			[target.id, target],
			[freeSource.id, freeSource],
			[freeTarget.id, freeTarget],
		]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const params = {
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		showLabels: false,
		showRays: false,
	};
	const render = (animationTime, overrides = {}, selectedNodeId = null, hoveredNodeId = null) => {
		const ctx = createRecordingCanvasContext();
		drawNeuralGraph(ctx, layout, {
			animationTime,
			background: "transparent",
			camera: createNeuralCamera(),
			focusProgress: selectedNodeId ? 1 : 0,
			hoveredNodeId,
			params: { ...params, ...overrides },
			selectedNodeId,
			theme: "light",
			viewport,
		});
		return ctx.calls;
	};

	assert.equal(render(undefined).some(([name]) => name === "createLinearGradient"), false);

	const animatedCalls = render(0.8);
	assert.equal(animatedCalls.filter(([name]) => name === "createLinearGradient").length, 2);
	assert.equal(animatedCalls.some(([name]) => name === "shadowBlur"), false);
	assert.ok(
		animatedCalls.some(([name, , value]) => (
			name === "addColorStop"
			&& typeof value === "string"
			&& value.startsWith("rgba(175, 89, 225,")
		)),
	);
	assert.ok(render(0.8, { signalGlowEnabled: true }).some(([name]) => name === "shadowBlur"));
	assert.equal(render(0.8, { showSignals: false }).some(([name]) => name === "createLinearGradient"), false);
	assert.equal(render(0.8, {}, null, "source").filter(([name]) => name === "createLinearGradient").length, 1);
	assert.equal(render(0.8, {}, "source").filter(([name]) => name === "createLinearGradient").length, 1);
	assert.ok(
		render(0.8, { signalColor: "#123ABC", signalOpacity: 0.5 }).some(([name, , value]) => (
			name === "addColorStop"
			&& typeof value === "string"
			&& value.startsWith("rgba(18, 58, 188,")
		)),
	);
});

test("drawNeuralGraph reveals node type colors during hover and selection", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 200, width: 300 };
	const selected = layoutNode("selected", 0);
	const neighbor = layoutNode("neighbor", 80);
	neighbor.node.kind = "entity";
	const layout = {
		edges: [layoutEdge("active", selected, neighbor)],
		nodes: [selected, neighbor],
		nodesById: new Map([
			[selected.id, selected],
			[neighbor.id, neighbor],
		]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const params = {
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		colorConcept: "#111111",
		colorEntity: "#888888",
		edgeColor: "#222222",
		edgeHoverColor: "#333333",
		edgeSelectedColor: "#444444",
		nodeColor: "#555555",
		nodeHoverColor: "#666666",
		nodeSelectedColor: "#777777",
		showLabels: false,
		showRays: false,
	};
	const render = (hoveredNodeId, selectedNodeId, focusProgress) => {
		const ctx = createRecordingCanvasContext();
		drawNeuralGraph(ctx, layout, {
			background: "transparent",
			camera: createNeuralCamera(),
			focusProgress,
			hoveredNodeId,
			params,
			selectedNodeId,
			theme: "light",
			viewport,
		});
		return ctx.calls;
	};

	const defaultCalls = render(null, null, 0);
	assert.ok(defaultCalls.some(([name, value]) => name === "strokeStyle" && value === "#222222"));
	assert.ok(defaultCalls.some(([name, value]) => name === "fillStyle" && value === "#555555"));
	assert.equal(defaultCalls.some(([name, value]) => name === "fillStyle" && value === "#111111"), false);
	assert.ok(render("selected", null, 0).some(([name, value]) => name === "strokeStyle" && value === "#333333"));
	assert.ok(render(null, "selected", 1).some(([name, value]) => name === "strokeStyle" && value === "#444444"));
	const hoverCalls = render("selected", null, 0);
	assert.ok(hoverCalls.some(([name, value]) => name === "fillStyle" && value === "#111111"));
	assert.ok(hoverCalls.some(([name, value]) => name === "fillStyle" && value === "#888888"));
	assert.equal(hoverCalls.some(([name, value]) => name === "fillStyle" && value === "#666666"), false);
	const selectedCalls = render(null, "selected", 1);
	assert.ok(selectedCalls.some(([name, value]) => name === "fillStyle" && value === "#111111"));
	assert.ok(selectedCalls.some(([name, value]) => name === "fillStyle" && value === "#888888"));
	assert.equal(selectedCalls.some(([name, value]) => name === "fillStyle" && value === "#777777"), false);
});

test("drawNeuralGraph keeps selected scale exclusive to the selected node", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 200, width: 300 };
	const selected = layoutNode("selected", 0);
	const root = layoutNode("root", 80);
	root.node.kind = "entity";
	const layout = {
		edges: [layoutEdge("active", selected, root)],
		nodes: [selected, root],
		nodesById: new Map([
			[selected.id, selected],
			[root.id, root],
		]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const params = {
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		glowIntensity: 0,
		nodeRadius: 0,
		nodeShape: "square",
		selectedScale: 2,
		showLabels: false,
		showRays: false,
	};
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(ctx, layout, {
		background: "transparent",
		camera: createNeuralCamera(),
		focusProgress: 1,
		hoveredNodeId: null,
		params,
		selectedNodeId: "selected",
		theme: "light",
		viewport,
	});

	const rectWidths = ctx.calls
		.filter(([name]) => name === "rect")
		.map(([, , , width]) => width);

	assert.deepEqual(rectWidths, [8, 8, 20, 20]);
});

test("drawNeuralGraph keeps hovered nodes stationary while showing hover affordance", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const { drawNeuralGraph } = await rendererModule;
	const viewport = { height: 200, width: 300 };
	const hovered = layoutNode("hovered", 0);
	const layout = {
		edges: [],
		nodes: [hovered],
		nodesById: new Map([[hovered.id, hovered]]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const params = {
		...DEFAULT_NEURAL_GRAPH_PARAMS,
		hoverScale: 4,
		nodeRadius: 0,
		nodeShape: "square",
		showLabels: false,
		showRays: false,
	};
	const ctx = createRecordingCanvasContext();

	drawNeuralGraph(ctx, layout, {
		background: "transparent",
		camera: createNeuralCamera(),
		focusProgress: 0,
		hoveredNodeId: "hovered",
		params,
		selectedNodeId: null,
		theme: "light",
		viewport,
	});

	const rectWidths = ctx.calls
		.filter(([name]) => name === "rect")
		.map(([, , , width]) => width);

	assert.deepEqual(rectWidths, [8, 8]);
	assert.ok(ctx.calls.some(([name]) => name === "createRadialGradient"));
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

test("hitTestNeuralRay detects origin rays without treating graph edges as rays", async () => {
	const { createNeuralCamera, getNeuralOrigin, worldToViewport } = await cameraModule;
	const {
		getCubicBezierPoint,
		getOrganicRayCurve,
		hitTestNeuralRay,
	} = await interactionModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const viewport = { height: 200, width: 300 };
	const camera = createNeuralCamera();
	const source = layoutNode("source", -80);
	source.y = -100;
	const target = layoutNode("target", 80);
	target.y = -100;
	const layout = {
		edges: [layoutEdge("source-target", source, target)],
		nodes: [source, target],
		nodesById: new Map([
			[source.id, source],
			[target.id, target],
		]),
		origin: { x: 0, y: 0 },
		viewport,
	};
	const origin = {
		...getNeuralOrigin(viewport, DEFAULT_NEURAL_GRAPH_PARAMS),
		y: viewport.height * DEFAULT_NEURAL_GRAPH_PARAMS.rayOriginY,
	};
	const sourcePoint = worldToViewport(source, camera, viewport, DEFAULT_NEURAL_GRAPH_PARAMS);
	const rayPoint = getCubicBezierPoint(getOrganicRayCurve(origin, sourcePoint), 0.5);
	const edgeMidpoint = {
		x: viewport.width / 2,
		y: sourcePoint.y,
	};

	assert.equal(
		hitTestNeuralRay({
			camera,
			layout,
			params: DEFAULT_NEURAL_GRAPH_PARAMS,
			point: rayPoint,
			viewport,
		}).node.id,
		"source",
	);
	assert.equal(
		hitTestNeuralRay({
			camera,
			layout,
			params: DEFAULT_NEURAL_GRAPH_PARAMS,
			point: edgeMidpoint,
			viewport,
		}),
		null,
	);
});

test("fitNeuralCameraToLayout scales an oversized layout down so all nodes stay within the canvas padding", async () => {
	const { createNeuralCamera, worldToViewport } = await cameraModule;
	const { NEURAL_GRAPH_FIT_PADDING, fitNeuralCameraToLayout } = await cameraFitModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const viewport = { height: 600, width: 800 };
	const nodes = [
		{ ...layoutNode("left", -2000), y: -1500 },
		{ ...layoutNode("right", 2000), y: 1500 },
	];
	const layout = {
		edges: [],
		nodes,
		nodesById: new Map(nodes.map((node) => [node.id, node])),
		origin: { x: 0, y: 0 },
		viewport,
	};

	const fitted = fitNeuralCameraToLayout({
		camera: createNeuralCamera(),
		layout,
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		viewport,
	});

	assert.ok(fitted.zoom < 1, `expected scale-down zoom but got ${fitted.zoom}`);
	for (const node of nodes) {
		const screen = worldToViewport(node, fitted, viewport, DEFAULT_NEURAL_GRAPH_PARAMS);
		assert.ok(
			screen.x >= NEURAL_GRAPH_FIT_PADDING - 0.5 && screen.x <= viewport.width - NEURAL_GRAPH_FIT_PADDING + 0.5,
			`node ${node.id} x ${screen.x} outside padded canvas`,
		);
		assert.ok(
			screen.y >= NEURAL_GRAPH_FIT_PADDING - 0.5 && screen.y <= viewport.height - NEURAL_GRAPH_FIT_PADDING + 0.5,
			`node ${node.id} y ${screen.y} outside padded canvas`,
		);
	}
});

test("fitNeuralCameraToLayout scales a tiny layout up while keeping nodes within the padded canvas", async () => {
	const { createNeuralCamera, worldToViewport } = await cameraModule;
	const { NEURAL_GRAPH_FIT_PADDING, fitNeuralCameraToLayout } = await cameraFitModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const viewport = { height: 600, width: 800 };
	const nodes = [
		{ ...layoutNode("left", -10), y: -8 },
		{ ...layoutNode("right", 10), y: 8 },
	];
	const layout = {
		edges: [],
		nodes,
		nodesById: new Map(nodes.map((node) => [node.id, node])),
		origin: { x: 0, y: 0 },
		viewport,
	};

	const fitted = fitNeuralCameraToLayout({
		camera: createNeuralCamera(),
		layout,
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		viewport,
	});

	assert.ok(fitted.zoom > 1, `expected scale-up zoom but got ${fitted.zoom}`);
	const center = worldToViewport({ x: 0, y: 0 }, fitted, viewport, DEFAULT_NEURAL_GRAPH_PARAMS);
	assert.ok(Math.abs(center.x - viewport.width / 2) < 0.5);
	assert.ok(Math.abs(center.y - viewport.height / 2) < 0.5);
	for (const node of nodes) {
		const screen = worldToViewport(node, fitted, viewport, DEFAULT_NEURAL_GRAPH_PARAMS);
		assert.ok(
			screen.x >= NEURAL_GRAPH_FIT_PADDING - 0.5 && screen.x <= viewport.width - NEURAL_GRAPH_FIT_PADDING + 0.5,
			`node ${node.id} x ${screen.x} outside padded canvas`,
		);
		assert.ok(
			screen.y >= NEURAL_GRAPH_FIT_PADDING - 0.5 && screen.y <= viewport.height - NEURAL_GRAPH_FIT_PADDING + 0.5,
			`node ${node.id} y ${screen.y} outside padded canvas`,
		);
	}
});

test("fitNeuralCameraToLayout centers radial clusters on the graph origin", async () => {
	const { createNeuralCamera, worldToViewport } = await cameraModule;
	const { NEURAL_GRAPH_FIT_PADDING, fitNeuralCameraToLayout } = await cameraFitModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const viewport = { height: 600, width: 800 };
	const params = { ...DEFAULT_NEURAL_GRAPH_PARAMS, originY: 0.5, showLabels: false };
	const nodes = [
		{ ...layoutNode("left", -260), y: -360 },
		{ ...layoutNode("right", 260), y: -360 },
		{ ...layoutNode("lower", 120), y: 80 },
	];
	const layout = {
		edges: [],
		layoutShape: "radialCluster",
		nodes,
		nodesById: new Map(nodes.map((node) => [node.id, node])),
		origin: { x: 0, y: 0 },
		treeBranches: [],
		viewport,
	};

	const fitted = fitNeuralCameraToLayout({
		camera: createNeuralCamera(),
		layout,
		params,
		viewport,
	});
	const origin = worldToViewport({ x: 0, y: 0 }, fitted, viewport, params);

	assert.ok(Math.abs(origin.x - viewport.width / 2) < 0.5);
	assert.ok(Math.abs(origin.y - viewport.height / 2) < 0.5);
	assert.ok(fitted.zoom <= 1);
	for (const node of nodes) {
		const screen = worldToViewport(node, fitted, viewport, params);
		assert.ok(
			screen.x >= NEURAL_GRAPH_FIT_PADDING - 0.5 && screen.x <= viewport.width - NEURAL_GRAPH_FIT_PADDING + 0.5,
			`node ${node.id} x ${screen.x} outside padded canvas`,
		);
		assert.ok(
			screen.y >= NEURAL_GRAPH_FIT_PADDING - 0.5 && screen.y <= viewport.height - NEURAL_GRAPH_FIT_PADDING + 0.5,
			`node ${node.id} y ${screen.y} outside padded canvas`,
		);
	}
});

test("fitNeuralCameraToLayout keeps radial clusters pulled back when they already fit", async () => {
	const { createNeuralCamera, worldToViewport } = await cameraModule;
	const { fitNeuralCameraToLayout } = await cameraFitModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const viewport = { height: 720, width: 1280 };
	const params = { ...DEFAULT_NEURAL_GRAPH_PARAMS, originY: 0.5, showLabels: false };
	const nodes = [
		{ ...layoutNode("left", -310), y: -310 },
		{ ...layoutNode("top", 0), y: -360 },
		{ ...layoutNode("right", 310), y: -310 },
	];
	const layout = {
		edges: [],
		layoutShape: "radialCluster",
		nodes,
		nodesById: new Map(nodes.map((node) => [node.id, node])),
		origin: { x: 0, y: 0 },
		treeBranches: [],
		viewport,
	};

	const fitted = fitNeuralCameraToLayout({
		camera: createNeuralCamera(),
		layout,
		params,
		viewport,
	});
	const origin = worldToViewport({ x: 0, y: 0 }, fitted, viewport, params);

	assert.ok(Math.abs(origin.x - viewport.width / 2) < 0.5);
	assert.ok(Math.abs(origin.y - viewport.height / 2) < 0.5);
	assert.ok(fitted.zoom <= 0.85, `expected radial camera to pull back, got zoom ${fitted.zoom}`);
});

test("fitNeuralCameraToLayout returns finite cameras for empty and single-node layouts", async () => {
	const { createNeuralCamera, worldToViewport } = await cameraModule;
	const { fitNeuralCameraToLayout } = await cameraFitModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const viewport = { height: 600, width: 800 };

	const emptyFitted = fitNeuralCameraToLayout({
		camera: createNeuralCamera(),
		layout: { edges: [], nodes: [], nodesById: new Map(), origin: { x: 0, y: 0 }, viewport },
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		viewport,
	});

	assert.ok(Number.isFinite(emptyFitted.zoom));
	assert.ok(Number.isFinite(emptyFitted.x));
	assert.ok(Number.isFinite(emptyFitted.y));
	assert.ok(emptyFitted.zoom > 0);

	const single = { ...layoutNode("only", 42), y: -17 };
	const singleFitted = fitNeuralCameraToLayout({
		camera: createNeuralCamera(),
		layout: {
			edges: [],
			nodes: [single],
			nodesById: new Map([[single.id, single]]),
			origin: { x: 0, y: 0 },
			viewport,
		},
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		viewport,
	});

	assert.equal(singleFitted.zoom, 1);
	const screen = worldToViewport(single, singleFitted, viewport, DEFAULT_NEURAL_GRAPH_PARAMS);
	assert.ok(Math.abs(screen.x - viewport.width / 2) < 0.5);
	assert.ok(Math.abs(screen.y - viewport.height / 2) < 0.5);
});

test("fitNeuralCameraToLayout damps small animated bounds changes", async () => {
	const { createNeuralCamera } = await cameraModule;
	const { fitNeuralCameraToLayout } = await cameraFitModule;
	const { DEFAULT_NEURAL_GRAPH_PARAMS } = await paramsModule;
	const viewport = { height: 600, width: 800 };
	const createLayout = (offset) => {
		const nodes = [
			{ ...layoutNode("left", -120 + offset), y: -80 },
			{ ...layoutNode("right", 120 + offset), y: 80 },
		];
		return {
			edges: [],
			nodes,
			nodesById: new Map(nodes.map((node) => [node.id, node])),
			origin: { x: 0, y: 0 },
			viewport,
		};
	};
	const fitted = fitNeuralCameraToLayout({
		camera: createNeuralCamera(),
		layout: createLayout(0),
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		viewport,
	});
	const tinyShift = fitNeuralCameraToLayout({
		camera: fitted,
		layout: createLayout(0.2),
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		positionDeadbandPx: 1,
		smoothing: 0.2,
		viewport,
		zoomDeadband: 0.01,
	});
	const target = fitNeuralCameraToLayout({
		camera: fitted,
		layout: createLayout(80),
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		viewport,
	});
	const dampedShift = fitNeuralCameraToLayout({
		camera: fitted,
		layout: createLayout(80),
		params: DEFAULT_NEURAL_GRAPH_PARAMS,
		positionDeadbandPx: 0.1,
		smoothing: 0.25,
		viewport,
	});

	assert.equal(tinyShift.x, fitted.x);
	assert.equal(tinyShift.zoom, fitted.zoom);
	assert.ok(dampedShift.x > fitted.x);
	assert.ok(dampedShift.x < target.x);
});
