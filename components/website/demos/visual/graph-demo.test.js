const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const GRAPH_SOURCE = fs.readFileSync(path.join(__dirname, "graph.tsx"), "utf8");
const DEMO_SOURCE = fs.readFileSync(path.join(__dirname, "graph-demo.tsx"), "utf8");
const RENDERER_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../arts/personal-graph/lib/neural-graph/renderer.ts"),
	"utf8",
);
const PARAMS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../arts/personal-graph/lib/neural-graph/params.ts"),
	"utf8",
);
const COMPONENTS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../../app/data/components.ts"),
	"utf8",
);
const MANIFEST_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../../app/data/component-manifest.ts"),
	"utf8",
);
const DETAILS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../../app/data/details/visual.ts"),
	"utf8",
);
const REGISTRY_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../registry.ts"),
	"utf8",
);

function getGraphDetailsSource() {
	const start = DETAILS_SOURCE.indexOf('"graph": {');
	const end = DETAILS_SOURCE.indexOf('\n\t"squircle": {', start);
	assert.notEqual(start, -1);
	assert.notEqual(end, -1);
	return DETAILS_SOURCE.slice(start, end);
}

test("Graph is registered as a visual component", () => {
	assert.match(
		COMPONENTS_SOURCE,
		/visualComponent\("graph", "Graph", "@\/components\/website\/demos\/visual\/graph"\)/,
	);
	assert.match(
		MANIFEST_SOURCE,
		/visualComponent\("graph", "Graph", "@\/components\/website\/demos\/visual\/graph"\)/,
	);
	assert.match(REGISTRY_SOURCE, /graph: dynamic\(\(\) => import\("\.\/demos\/visual\/graph-demo"\)/);
	assert.match(DETAILS_SOURCE, /"graph": \{/);
});

test("Graph demo renders the reusable Graph visual", () => {
	assert.match(DEMO_SOURCE, /import Graph from "\.\/graph";/);
	assert.match(DEMO_SOURCE, /return <Graph \/>;/);
});

test("Graph visual follows the VPK visual demo control structure", () => {
	assert.match(GRAPH_SOURCE, /PersonalGraphNeuralCanvas/);
	assert.match(GRAPH_SOURCE, /GUI\.Panel title="Graph controls"/);
	assert.match(GRAPH_SOURCE, /GUI\.Control/);
	assert.match(GRAPH_SOURCE, /GUI\.Select/);
	assert.match(GRAPH_SOURCE, /NEURAL_GRAPH_PARAM_SECTIONS/);
	assert.match(GRAPH_SOURCE, /DEFAULT_NEURAL_GRAPH_PARAMS/);
	assert.match(GRAPH_SOURCE, /VISUAL_GRAPH_EXPLORER/);
	assert.match(GRAPH_SOURCE, /max-w-4xl flex-col/);
	assert.match(GRAPH_SOURCE, /data-visual-graph="true"/);
	assert.doesNotMatch(GRAPH_SOURCE, /PersonalGraphNeuralControls/);
});

test("Graph visual can be embedded as the live Personal Graph renderer", () => {
	const graphDetailsSource = getGraphDetailsSource();

	assert.match(GRAPH_SOURCE, /variant\?: "demo" \| "fill"/);
	assert.match(GRAPH_SOURCE, /params\?: NeuralGraphParams/);
	assert.match(GRAPH_SOURCE, /selectedNodeId\?: string \| null/);
	assert.match(GRAPH_SOURCE, /onSelectedNodeIdChange\?: \(nodeId: string \| null\) => void/);
	assert.match(GRAPH_SOURCE, /isFillVariant \? "flex h-full w-full flex-col"/);
	assert.match(GRAPH_SOURCE, /isLoading=\{isLoading\}/);
	for (const propName of [
		"background",
		"params",
		"onParamsChange",
		"selectedNodeId",
		"onSelectedNodeIdChange",
		"showSelectionOverlay",
		"themeMode",
		"variant",
	]) {
		assert.match(graphDetailsSource, new RegExp(`name: "${propName}"`));
	}
	assert.match(graphDetailsSource, /flow, structure, cone, node, edge, ray, hover, label, and node style controls/);
});

test("Graph renderer keeps the default connector stroke width at 2 via params", () => {
	assert.match(PARAMS_SOURCE, /edgeWidth: 2,/);
	assert.match(PARAMS_SOURCE, /rayWidth: 2,/);
	assert.match(RENDERER_SOURCE, /ctx\.lineWidth = options\.params\.rayWidth;/);
	assert.match(RENDERER_SOURCE, /const edgeWidths = getEdgeLineWidth\(options\.params\);/);
	assert.match(
		RENDERER_SOURCE,
		/ctx\.lineWidth = active \? lerp\(edgeWidths\.active, edgeWidths\.focused, focusProgress\) : edgeWidths\.idle;/,
	);
});

test("Graph renderer exposes hover, ray, edge, and label toggles through params", () => {
	assert.match(RENDERER_SOURCE, /if \(!options\.params\.showRays\) return;/);
	assert.match(RENDERER_SOURCE, /if \(!options\.params\.showEdges\) return;/);
	assert.match(RENDERER_SOURCE, /if \(!options\.params\.showLabels\) return;/);
	assert.match(GRAPH_SOURCE, /rayOriginY: 0\.95/);
	assert.match(PARAMS_SOURCE, /key: "rayOriginY", label: "Tail Y"/);
	assert.match(RENDERER_SOURCE, /function getRayOrigin/);
	assert.match(RENDERER_SOURCE, /viewport\.height \* params\.rayOriginY/);
	assert.match(RENDERER_SOURCE, /options\.params\.hoverScale/);
	assert.match(RENDERER_SOURCE, /options\.params\.selectedScale/);
	assert.match(RENDERER_SOURCE, /options\.params\.glowSize/);
	assert.match(RENDERER_SOURCE, /options\.params\.glowIntensity/);
	assert.match(RENDERER_SOURCE, /options\.params\.labelSize/);
	assert.match(RENDERER_SOURCE, /options\.params\.labelMetaSize/);
});

test("Graph controls render booleans as toggles", () => {
	assert.match(GRAPH_SOURCE, /GUI\.Toggle/);
	assert.match(GRAPH_SOURCE, /definition\.kind === "boolean"/);
});
