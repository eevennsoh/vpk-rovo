const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const GRAPH_SOURCE = fs.readFileSync(path.join(__dirname, "graph.tsx"), "utf8");
const DEMO_SOURCE = fs.readFileSync(path.join(__dirname, "graph-demo.tsx"), "utf8");
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
	assert.match(GRAPH_SOURCE, /max-w-2xl flex-col/);
	assert.match(GRAPH_SOURCE, /data-visual-graph="true"/);
	assert.doesNotMatch(GRAPH_SOURCE, /PersonalGraphNeuralControls/);
});

test("Graph visual can be embedded as the live Personal Graph renderer", () => {
	assert.match(GRAPH_SOURCE, /variant\?: "demo" \| "fill"/);
	assert.match(GRAPH_SOURCE, /params\?: NeuralGraphParams/);
	assert.match(GRAPH_SOURCE, /selectedNodeId\?: string \| null/);
	assert.match(GRAPH_SOURCE, /onSelectedNodeIdChange\?: \(nodeId: string \| null\) => void/);
	assert.match(GRAPH_SOURCE, /isFillVariant \? "flex h-full w-full flex-col"/);
	assert.match(GRAPH_SOURCE, /isLoading=\{isLoading\}/);
});
