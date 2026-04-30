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
const BACKDROP_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/personal-graph-backdrop.tsx",
	),
	"utf8",
);
const SEARCH_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/personal-graph-search.tsx",
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

test("Personal Graph anchors the search and chat composer at the graph origin", () => {
	assert.match(SURFACE_SOURCE, /aria-label="Personal Graph search and chat"/);
	assert.match(SURFACE_SOURCE, /bottom-6 z-30 flex justify-center/);
	assert.match(SURFACE_SOURCE, /bottom-\[6\.5rem\] top-\[84px\]/);
	assert.match(SURFACE_SOURCE, /from-neutral-950\/35 to-transparent/);
	assert.match(SURFACE_SOURCE, /<PersonalGraphSearch/);
	assert.doesNotMatch(SURFACE_SOURCE, /grid-cols-\[1fr_auto_1fr\]/);
	assert.match(SEARCH_SOURCE, /Ask or search your graph\.\.\./);
	assert.match(SEARCH_SOURCE, /bottom-\[calc\(100%\+0\.75rem\)\]/);
	assert.match(SEARCH_SOURCE, /ArrowUpRightIcon/);
	assert.match(SEARCH_SOURCE, /aria-label="Ask or search Personal Graph"/);
});

test("Personal Graph uses editor-style surrounding chrome", () => {
	assert.match(SURFACE_SOURCE, /aria-label="Capture queue"/);
	assert.match(SURFACE_SOURCE, /aria-label="Knowledge Graph details"/);
	assert.match(SURFACE_SOURCE, /PersonalGraphZoomControls/);
	assert.match(SURFACE_SOURCE, /themeMode="light"/);
	assert.match(SURFACE_SOURCE, /showSelectionOverlay=\{false\}/);
	assert.match(SURFACE_SOURCE, /PERSONAL_GRAPH_EDITOR_COLOR_LOCK_STYLE/);
	assert.match(SURFACE_SOURCE, /"--color-white": "#FFFFFF"/);
	assert.match(SURFACE_SOURCE, /"--ds-text-inverse": "#FFFFFF"/);
	assert.match(SURFACE_SOURCE, /style=\{\{ \.\.\.PERSONAL_GRAPH_EDITOR_COLOR_LOCK_STYLE, \.\.\.style \}\}/);
	assert.match(SURFACE_SOURCE, /rounded-\[2px\] border border-neutral-950\/70 bg-white\/95/);
	assert.match(SEARCH_SOURCE, /rounded-\[2px\] border border-neutral-950\/80 bg-white\/95/);
	assert.match(SURFACE_SOURCE, /CopyIcon/);
	assert.match(SURFACE_SOURCE, /TargetIcon/);
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
	assert.match(SURFACE_SOURCE, /background="transparent"/);
	assert.match(SURFACE_SOURCE, /params=\{renderedNeuralParams\}/);
	assert.match(SURFACE_SOURCE, /selectedNodeId=\{selectedNodeId\}/);
	assert.match(SURFACE_SOURCE, /onSelectedNodeIdChange=\{setSelectedNodeId\}/);
	assert.doesNotMatch(SURFACE_SOURCE, /<PersonalGraphNeuralCanvas/);
	assert.doesNotMatch(SURFACE_SOURCE, /PersonalGraphSigma/);
	assert.match(GRAPH_SOURCE, /<PersonalGraphNeuralCanvas/);
	assert.match(NEURAL_CANVAS_SOURCE, /data-neural-graph-renderer="owned-canvas"/);
	assert.match(NEURAL_CANVAS_SOURCE, /backgroundClass = background === "transparent" \? "bg-transparent" : "bg-surface"/);
	assert.match(NEURAL_CANVAS_SOURCE, /<canvas aria-hidden="true"/);
	assert.match(NEURAL_CANVAS_SOURCE, /<SelectedNodeOverlay/);
});

test("Personal Graph uses a light editor canvas backdrop", () => {
	assert.match(
		SURFACE_SOURCE,
		/import \{ PersonalGraphBackdrop \} from "\.\/personal-graph-backdrop";/,
	);
	assert.match(SURFACE_SOURCE, /<PersonalGraphBackdrop className="z-0" \/>/);
	assert.doesNotMatch(SURFACE_SOURCE, /PersonalGraphAsciiOverlay/);
	assert.match(BACKDROP_SOURCE, /data-personal-graph-editor-backdrop="light-grid"/);
	assert.match(BACKDROP_SOURCE, /overflow-hidden bg-white/);
	assert.match(BACKDROP_SOURCE, /backgroundImage:/);
	assert.match(BACKDROP_SOURCE, /backgroundSize: "72px 72px"/);
	assert.match(BACKDROP_SOURCE, /radial-gradient\(circle at 50% 75%/);
	assert.doesNotMatch(BACKDROP_SOURCE, /LiquidGradient/);
	assert.doesNotMatch(BACKDROP_SOURCE, /Ascii/);
	assert.match(GRAPH_SOURCE, /background\?: "default" \| "transparent"/);
	assert.match(NEURAL_CANVAS_SOURCE, /background\?: "default" \| "transparent"/);
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
