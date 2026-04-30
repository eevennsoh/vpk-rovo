const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PAGE_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
const LAYOUT_SOURCE = fs.readFileSync(path.join(__dirname, "layout.tsx"), "utf8");
const COMPONENTS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../data/components.ts"),
	"utf8",
);
const MANIFEST_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../data/component-manifest.ts"),
	"utf8",
);
const REGISTRY_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../components/website/registry.ts"),
	"utf8",
);
const DEMO_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/website/demos/arts/personal-graph-demo.tsx",
	),
	"utf8",
);
const SURFACE_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/personal-graph-surface.tsx",
	),
	"utf8",
);
const GRAPH_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/website/demos/visual/graph.tsx",
	),
	"utf8",
);
const NEURAL_CANVAS_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/personal-graph-neural-canvas.tsx",
	),
	"utf8",
);
const NEURAL_CONTROLS_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/personal-graph-neural-controls.tsx",
	),
	"utf8",
);
const NEURAL_PARAMS_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/lib/neural-graph/params.ts",
	),
	"utf8",
);
const NEURAL_STORE_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/lib/neural-graph/store.ts",
	),
	"utf8",
);
const NEURAL_LAYOUT_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/lib/neural-graph/layout.ts",
	),
	"utf8",
);
const NEURAL_CAMERA_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/lib/neural-graph/camera.ts",
	),
	"utf8",
);
const NEURAL_INTERACTION_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/lib/neural-graph/interaction.ts",
	),
	"utf8",
);

test("Personal Graph route loads the arts demo registry entry", () => {
	assert.match(
		PAGE_SOURCE,
		/loadDemoComponent\("personal-graph", "arts"\)/,
	);
	assert.match(LAYOUT_SOURCE, /getArtPageTitle\("personal-graph"\)/);
});

test("Personal Graph is registered as an arts project", () => {
	assert.match(
		COMPONENTS_SOURCE,
		/artComponent\("personal-graph", "Personal Graph"\)/,
	);
	assert.match(
		MANIFEST_SOURCE,
		/artComponent\("personal-graph", "Personal Graph"\)/,
	);
	assert.match(
		REGISTRY_SOURCE,
		/import\("\.\/demos\/arts\/personal-graph-demo"\)/,
	);
	assert.match(
		DEMO_SOURCE,
		/import PersonalGraph from "@\/components\/arts\/personal-graph";/,
	);
});

test("Personal Graph header exposes the app theme toggle", () => {
	assert.match(
		SURFACE_SOURCE,
		/import \{ ThemeToggle \} from "@\/components\/utils\/theme-wrapper";/,
	);
	assert.match(SURFACE_SOURCE, /<ThemeToggle \/>/);
});

test("Personal Graph keeps the owned canvas renderer accessible", () => {
	assert.match(SURFACE_SOURCE, /<details className="sr-only" open>/);
	assert.match(
		SURFACE_SOURCE,
		/import Graph from "@\/components\/website\/demos\/visual\/graph";/,
	);
	assert.match(SURFACE_SOURCE, /<Graph/);
	assert.match(SURFACE_SOURCE, /variant="fill"/);
	assert.match(SURFACE_SOURCE, /showControls=\{false\}/);
	assert.match(SURFACE_SOURCE, /params=\{neuralParams\}/);
	assert.match(SURFACE_SOURCE, /selectedNodeId=\{selectedNodeId\}/);
	assert.match(SURFACE_SOURCE, /onSelectedNodeIdChange=\{setSelectedNodeId\}/);
	assert.doesNotMatch(SURFACE_SOURCE, /<PersonalGraphNeuralCanvas/);
	assert.doesNotMatch(SURFACE_SOURCE, /PersonalGraphSigma/);
	assert.match(GRAPH_SOURCE, /<PersonalGraphNeuralCanvas/);
	assert.match(NEURAL_CANVAS_SOURCE, /data-neural-graph-renderer="owned-canvas"/);
	assert.match(NEURAL_CANVAS_SOURCE, /<canvas aria-hidden="true"/);
	assert.match(NEURAL_CANVAS_SOURCE, /<SelectedNodeOverlay/);
});

test("Personal Graph decomposes graphology, ForceAtlas2, and Sigma concepts without runtime Sigma", () => {
	assert.match(NEURAL_STORE_SOURCE, /nodesById = new Map/);
	assert.match(NEURAL_STORE_SOURCE, /adjacency = new Map/);
	assert.match(NEURAL_LAYOUT_SOURCE, /RELAXATION_ITERATIONS/);
	assert.match(NEURAL_LAYOUT_SOURCE, /repulsion/);
	assert.match(NEURAL_CAMERA_SOURCE, /worldToViewport/);
	assert.match(NEURAL_CAMERA_SOURCE, /viewportToWorld/);
	assert.match(NEURAL_INTERACTION_SOURCE, /hitTestNeuralNode/);
	assert.doesNotMatch(NEURAL_CANVAS_SOURCE, /from "sigma"/);
	assert.doesNotMatch(NEURAL_CANVAS_SOURCE, /from "graphology"/);
});

test("Personal Graph exposes a hidden Neural Burst parameter panel", () => {
	assert.match(SURFACE_SOURCE, /isParameterPanelOpen/);
	assert.match(SURFACE_SOURCE, /aria-label="Graph parameters"/);
	assert.match(SURFACE_SOURCE, /<PersonalGraphNeuralControls/);
	assert.match(NEURAL_CONTROLS_SOURCE, /NEURAL_GRAPH_PARAM_SECTIONS/);
	assert.match(NEURAL_PARAMS_SOURCE, /speed: 0\.8/);
	assert.match(NEURAL_PARAMS_SOURCE, /amplitude: 0\.15/);
	assert.match(NEURAL_PARAMS_SOURCE, /coneAngle: 75/);
	assert.match(NEURAL_PARAMS_SOURCE, /nodeColor: "#6b5ce7"/);
	assert.match(NEURAL_PARAMS_SOURCE, /localStorage/);
});

test("Personal Graph focuses and clears selection through the owned interaction layer", () => {
	assert.match(NEURAL_CANVAS_SOURCE, /focusNeuralCameraOnPoint/);
	assert.match(NEURAL_CANVAS_SOURCE, /hitTestNeuralNode/);
	assert.match(NEURAL_CANVAS_SOURCE, /onClearSelection\(\)/);
	assert.match(GRAPH_SOURCE, /onClearSelection=\{handleClearSelection\}/);
	assert.match(GRAPH_SOURCE, /onSelectedNodeIdChange\?\.\(null\)/);
	assert.match(SURFACE_SOURCE, /onSelectedNodeIdChange=\{setSelectedNodeId\}/);
});

test("Personal Graph owned renderer supports pan and zoom without Sigma events", () => {
	assert.match(NEURAL_CANVAS_SOURCE, /panNeuralCamera/);
	assert.match(NEURAL_CANVAS_SOURCE, /zoomNeuralCameraAtPoint/);
	assert.match(NEURAL_CANVAS_SOURCE, /onPointerMove/);
	assert.match(NEURAL_CANVAS_SOURCE, /onWheel/);
	assert.doesNotMatch(NEURAL_CANVAS_SOURCE, /sigma\.on/);
});
