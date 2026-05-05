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
const NEURAL_CANVAS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../arts/personal-graph/personal-graph-neural-canvas.tsx"),
	"utf8",
);
const PARAMS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../arts/personal-graph/lib/neural-graph/params.ts"),
	"utf8",
);
const COLORS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../../arts/personal-graph/lib/neural-graph/colors.ts"),
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
	assert.doesNotMatch(GRAPH_SOURCE, /ShaderColorInput/);
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
		"rayOriginBottomOffset",
		"selectedNodeId",
		"onSelectedNodeIdChange",
		"showSelectionOverlay",
		"themeMode",
		"variant",
	]) {
		assert.match(graphDetailsSource, new RegExp(`name: "${propName}"`));
	}
	assert.match(graphDetailsSource, /flow, structure, cone, token-backed node and edge color states, ray, origin node, hover, label, and node style controls/);
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
	assert.match(GRAPH_SOURCE, /rayOriginY: 1/);
	assert.match(PARAMS_SOURCE, /key: "rayOriginY", label: "Tail Y"/);
	assert.match(RENDERER_SOURCE, /function getRayOrigin/);
	assert.match(RENDERER_SOURCE, /viewport\.height \* params\.rayOriginY/);
	assert.match(NEURAL_CANVAS_SOURCE, /data-neural-graph-origin-node="true"/);
	assert.match(NEURAL_CANVAS_SOURCE, /style=\{getOriginMarkerStyleForViewport\(params, viewport, rayOriginBottomOffset\)\}/);
	assert.match(NEURAL_CANVAS_SOURCE, /params\.showRays && params\.showOriginMarker \? \(/);
	assert.match(NEURAL_CANVAS_SOURCE, /backgroundColor: params\.originMarkerColor/);
	assert.match(NEURAL_CANVAS_SOURCE, /borderRadius: params\.nodeShape === "square" \? params\.nodeRadius : 9999/);
	assert.match(NEURAL_CANVAS_SOURCE, /height: params\.originMarkerSize/);
	assert.doesNotMatch(NEURAL_CANVAS_SOURCE, /border-2/);
	assert.match(RENDERER_SOURCE, /options\.params\.hoverScale/);
	assert.match(RENDERER_SOURCE, /options\.params\.selectedScale/);
	assert.match(RENDERER_SOURCE, /options\.params\.nodeHoverColor/);
	assert.match(RENDERER_SOURCE, /options\.params\.nodeSelectedColor/);
	assert.match(RENDERER_SOURCE, /options\.params\.edgeColor/);
	assert.match(RENDERER_SOURCE, /options\.params\.edgeHoverColor/);
	assert.match(RENDERER_SOURCE, /options\.params\.edgeSelectedColor/);
	assert.match(RENDERER_SOURCE, /options\.params\.glowSize/);
	assert.match(RENDERER_SOURCE, /options\.params\.glowIntensity/);
	assert.match(RENDERER_SOURCE, /options\.params\.labelSize/);
	assert.match(RENDERER_SOURCE, /options\.params\.labelMetaSize/);
});

test("Graph controls expose node and edge state color fields", () => {
	for (const expected of [
		/{ kind: "color", key: "nodeHoverColor", label: "Hover color"/,
		/{ kind: "color", key: "nodeSelectedColor", label: "Selected color"/,
		/{ kind: "number", key: "nodeRadius", label: "Radius"/,
		/{ kind: "color", key: "edgeColor", label: "Default color"/,
		/{ kind: "color", key: "edgeHoverColor", label: "Hover color"/,
		/{ kind: "color", key: "edgeSelectedColor", label: "Selected color"/,
	]) {
		assert.match(PARAMS_SOURCE, expected);
	}
	assert.match(GRAPH_SOURCE, /<GUI\.Section borderTop title="Default node colors">/);
	assert.match(GRAPH_SOURCE, /id="graph-node-color"/);
	assert.match(GRAPH_SOURCE, /label="Fallback"/);
});

test("Graph color controls use design token selectors instead of hex-only pickers", () => {
	assert.match(GRAPH_SOURCE, /NEURAL_GRAPH_COLOR_TOKEN_OPTIONS/);
	assert.match(GRAPH_SOURCE, /function GraphColorTokenControl/);
	assert.match(GRAPH_SOURCE, /getNeuralGraphColorTokenOption/);
	assert.match(GRAPH_SOURCE, /useGUIValueKeys\(valueKey\)/);
	assert.match(GRAPH_SOURCE, /<Select[\s\S]*value=\{selectedOption\.value\}[\s\S]*onValueChange=\{\(nextValue\) => \{/);
	assert.match(GRAPH_SOURCE, /style=\{\{ backgroundColor: option\.value \}\}/);
	assert.match(COLORS_SOURCE, /color\.background\.accent\.blue\.bolder/);
	assert.match(COLORS_SOURCE, /color\.chart\.purple\.bolder/);
	assert.match(GRAPH_SOURCE, /colorConcept: ROVO_GRAPH_COLORS\.orange/);
	assert.match(GRAPH_SOURCE, /colorEntity: ROVO_GRAPH_COLORS\.lime/);
	assert.match(GRAPH_SOURCE, /colorRaw: ROVO_GRAPH_COLORS\.neutral/);
	assert.match(GRAPH_SOURCE, /colorSource: ROVO_GRAPH_COLORS\.blue/);
	assert.match(GRAPH_SOURCE, /colorSynthesis: ROVO_GRAPH_COLORS\.purple/);
	assert.match(GRAPH_SOURCE, /edgeColor: "var\(--ds-chart-gray-boldest\)"/);
	assert.match(GRAPH_SOURCE, /nodeHoverColor: "var\(--ds-background-accent-orange-subtle\)"/);
	assert.match(GRAPH_SOURCE, /frontmatter: \{ graphColor: node\.color, visual: "graph" \}/);
	assert.doesNotMatch(GRAPH_SOURCE, /colorConcept: "var\(--ds-text\)"/);
	assert.doesNotMatch(GRAPH_SOURCE, /colorConcept: "#292A2E"/);
	assert.doesNotMatch(GRAPH_SOURCE, /edgeColor: "#4B4D51"/);
});

test("Graph controls expose origin node visual fields", () => {
	for (const expected of [
		/{ kind: "boolean", key: "showOriginMarker", label: "Show origin node"/,
		/{ kind: "number", key: "originMarkerSize", label: "Origin size"/,
		/{ kind: "color", key: "originMarkerColor", label: "Origin color"/,
		/NEURAL_GRAPH_ORIGIN_COLOR_PARAM_KEYS/,
	]) {
		assert.match(PARAMS_SOURCE, expected);
	}
	assert.match(GRAPH_SOURCE, /originMarkerSize: 12/);
	assert.match(GRAPH_SOURCE, /originMarkerColor: "var\(--ds-text\)"/);
	assert.match(GRAPH_SOURCE, /nodeRadius: 2/);
	assert.doesNotMatch(PARAMS_SOURCE, /originMarkerBorderColor/);
	assert.doesNotMatch(PARAMS_SOURCE, /Origin border/);
});

test("Graph controls render booleans as toggles", () => {
	assert.match(GRAPH_SOURCE, /GUI\.Toggle/);
	assert.match(GRAPH_SOURCE, /definition\.kind === "boolean"/);
});
