const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PAGE_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
const LAYOUT_SOURCE = fs.readFileSync(path.join(__dirname, "layout.tsx"), "utf8");
const ROOT_LAYOUT_SOURCE = fs.readFileSync(path.join(__dirname, "../../layout.tsx"), "utf8");
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
const TITLE_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/personal-graph-title-scramble.tsx",
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
const VAULT_PICKER_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/personal-graph-vault-picker.tsx",
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
const NEURAL_RENDERER_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/lib/neural-graph/renderer.ts",
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

test("Personal Graph header keeps controls centered below the title", () => {
	assert.match(SURFACE_SOURCE, /<div className="flex min-w-0 max-w-full flex-wrap items-center justify-center gap-2 text-center">/);
	assert.doesNotMatch(SURFACE_SOURCE, /xl:absolute xl:right-0 xl:top-0 xl:justify-end/);
	assert.doesNotMatch(VAULT_PICKER_SOURCE, /hidden max-w-\[180px\] truncate text-xs text-neutral-600 lg:block/);
});

test("Personal Graph header exposes the capture queue as a top nav popover", () => {
	assert.match(
		SURFACE_SOURCE,
		/import UploadIcon from "@atlaskit\/icon\/core\/upload";/,
	);
	assert.match(
		SURFACE_SOURCE,
		/import \{ Popover, PopoverContent, PopoverTrigger \} from "@\/components\/ui\/popover";/,
	);
	assert.match(SURFACE_SOURCE, /const \[isCaptureQueueOpen, setIsCaptureQueueOpen\] = useState\(false\);/);
	assert.match(SURFACE_SOURCE, /<Popover open=\{isCaptureQueueOpen\} onOpenChange=\{handleCaptureQueueOpenChange\}>/);
	assert.match(SURFACE_SOURCE, /aria-label="Capture queue"/);
	assert.match(SURFACE_SOURCE, /<UploadIcon label="" \/>/);
	assert.match(SURFACE_SOURCE, /<PersonalGraphCaptureQueue onRawAdded=\{handleRefreshAll\} refreshKey=\{refreshKey\} \/>/);
	assert.doesNotMatch(SURFACE_SOURCE, /bottom-6 left-6 z-20 hidden/);
	assert.doesNotMatch(SURFACE_SOURCE, /Collapse capture queue/);
});

test("Personal Graph header uses the display font lockup", () => {
	assert.match(ROOT_LAYOUT_SOURCE, /Affigere-Regular\.woff2/);
	assert.match(ROOT_LAYOUT_SOURCE, /DepartureMono-Regular\.woff2/);
	assert.match(SURFACE_SOURCE, /PERSONAL_GRAPH_TITLE_FONT_STYLE/);
	assert.match(SURFACE_SOURCE, /var\(--font-affigere\)/);
	assert.match(SURFACE_SOURCE, /var\(--font-departure-mono\)/);
	assert.match(SURFACE_SOURCE, /<div className="mx-auto min-w-0 max-w-full text-center text-neutral-950">/);
	assert.match(SURFACE_SOURCE, /className="text-\[3\.75rem\] leading-\[0\.8\] text-neutral-950/);
	assert.doesNotMatch(SURFACE_SOURCE, /uppercase leading-\[0\.8\]/);
	assert.doesNotMatch(SURFACE_SOURCE, /className="[^"]*tracking-normal[^"]*"\s+style=\{PERSONAL_GRAPH_TITLE_FONT_STYLE\}/);
	assert.match(TITLE_SOURCE, /const PERSONAL_GRAPH_TITLE_TEXT = "PERSONAL\\nGRAPH";/);
	assert.match(TITLE_SOURCE, /aria-label="PERSONAL GRAPH"/);
	assert.match(TITLE_SOURCE, /whitespace-pre-line/);
	assert.doesNotMatch(TITLE_SOURCE, /<span/);
	assert.doesNotMatch(SURFACE_SOURCE, /BranchIcon/);
});

test("Personal Graph omits the standalone zoom control rail", () => {
	assert.doesNotMatch(SURFACE_SOURCE, /function PersonalGraphZoomControls/);
	assert.doesNotMatch(SURFACE_SOURCE, /absolute bottom-6 left-6 z-30 hidden text-neutral-950 lg:block/);
	assert.doesNotMatch(SURFACE_SOURCE, /contentClassName="flex h-full flex-col items-center gap-1 py-1"/);
	assert.doesNotMatch(SURFACE_SOURCE, /aria-label="Zoom in"/);
	assert.doesNotMatch(SURFACE_SOURCE, /aria-label="Zoom out"/);
	assert.doesNotMatch(SURFACE_SOURCE, /Math\.round\(zoom \* 100\)/);
	assert.doesNotMatch(SURFACE_SOURCE, /Reset graph view/);
	assert.doesNotMatch(SURFACE_SOURCE, /TargetIcon/);
});

test("Personal Graph anchors the search and chat composer at the graph origin", () => {
	assert.match(SURFACE_SOURCE, /aria-label="Personal Graph search and chat"/);
	assert.match(SURFACE_SOURCE, /bottom-6 left-4 right-4 z-40 flex justify-center/);
	assert.match(SURFACE_SOURCE, /from-neutral-950\/35 to-transparent/);
	assert.match(SURFACE_SOURCE, /<PersonalGraphSearch/);
	assert.doesNotMatch(SURFACE_SOURCE, /grid-cols-\[1fr_auto_1fr\]/);
	assert.match(SEARCH_SOURCE, /Ask or search your graph\.\.\./);
	assert.match(SEARCH_SOURCE, /bottom-\[calc\(100%\+0\.75rem\)\]/);
	assert.match(SEARCH_SOURCE, /ArrowUpRightIcon/);
	assert.match(SEARCH_SOURCE, /aria-label="Ask or search Personal Graph"/);
});

test("Personal Graph lets the graph renderer fill the route viewport behind the chrome", () => {
	assert.match(SURFACE_SOURCE, /<section className="absolute inset-0 z-10" aria-label="Vault graph">/);
	assert.doesNotMatch(SURFACE_SOURCE, /bottom-\[6\.5rem\] top-\[250px\]/);
	assert.doesNotMatch(SURFACE_SOURCE, /sm:top-\[320px\] lg:top-\[360px\] xl:top-\[400px\]/);
	assert.match(GRAPH_SOURCE, /isFillVariant \? "flex h-full w-full flex-col"/);
	assert.match(NEURAL_CANVAS_SOURCE, /"relative h-full min-h-0 overflow-hidden"/);
	assert.doesNotMatch(NEURAL_CANVAS_SOURCE, /min-h-\[620px\]/);
});

test("Personal Graph uses editor-style surrounding chrome", () => {
	assert.match(SURFACE_SOURCE, /aria-label="Capture queue"/);
	assert.match(SURFACE_SOURCE, /aria-label="Knowledge Graph details"/);
	assert.doesNotMatch(SURFACE_SOURCE, /PersonalGraphZoomControls/);
	assert.match(SURFACE_SOURCE, /themeMode="light"/);
	assert.match(SURFACE_SOURCE, /showSelectionOverlay=\{false\}/);
	assert.match(SURFACE_SOURCE, /PERSONAL_GRAPH_EDITOR_COLOR_LOCK_STYLE/);
	assert.match(SURFACE_SOURCE, /"--color-white": "#FFFFFF"/);
	assert.match(SURFACE_SOURCE, /"--ds-text-inverse": "#FFFFFF"/);
	assert.match(SURFACE_SOURCE, /style=\{\{ \.\.\.PERSONAL_GRAPH_EDITOR_COLOR_LOCK_STYLE, \.\.\.style \}\}/);
	assert.match(SURFACE_SOURCE, /PersonalGraphGlassPanel/);
	assert.match(SURFACE_SOURCE, /border-neutral-950\/8 bg-white\/5/);
	assert.match(SEARCH_SOURCE, /rounded-2xl/);
	assert.match(SURFACE_SOURCE, /CopyIcon/);
});

test("Personal Graph leaves the page header transparent over the backdrop grid", () => {
	assert.match(SURFACE_SOURCE, /<header className="absolute inset-x-4 top-5 z-30 sm:inset-x-6 lg:inset-x-8">/);
	assert.match(SURFACE_SOURCE, /<header className="absolute inset-x-4 top-5 z-30 sm:inset-x-6 lg:inset-x-8">\s*<div className="relative flex flex-col items-center gap-4">/);
	assert.doesNotMatch(
		SURFACE_SOURCE,
		/<header className="absolute inset-x-4 top-5 z-30 sm:inset-x-6 lg:inset-x-8">\s*<PersonalGraphGlassPanel contentClassName="relative flex flex-col items-center gap-4/,
	);
	assert.doesNotMatch(SURFACE_SOURCE, /contentClassName="relative flex flex-col items-center gap-4"/);
});

test("Personal Graph hides node details until a node is selected", () => {
	assert.match(
		SURFACE_SOURCE,
		/const \[selectedNodeId, setSelectedNodeId\] = useState<string \| null>\(null\);/,
	);
	assert.match(SURFACE_SOURCE, /function getSelectedNode\(explorer: VaultExplorer \| null, selectedNodeId: string \| null\)/);
	assert.match(SURFACE_SOURCE, /if \(!explorer \|\| !selectedNodeId\) return null;/);
	assert.doesNotMatch(SURFACE_SOURCE, /right\.connectionCount - left\.connectionCount/);
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
	assert.match(SURFACE_SOURCE, /params=\{neuralParams\}/);
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

test("Personal Graph uses a plain light editor canvas backdrop", () => {
	assert.match(
		SURFACE_SOURCE,
		/import \{ PersonalGraphBackdrop \} from "\.\/personal-graph-backdrop";/,
	);
	assert.match(SURFACE_SOURCE, /<PersonalGraphBackdrop className="z-0" \/>/);
	assert.doesNotMatch(SURFACE_SOURCE, /PersonalGraphAsciiOverlay/);
	assert.match(
		BACKDROP_SOURCE,
		/import Ascii from "@\/components\/website\/demos\/visual\/shaders\/ascii";/,
	);
	assert.match(BACKDROP_SOURCE, /data-personal-graph-editor-backdrop="light-grid"/);
	assert.match(BACKDROP_SOURCE, /data-personal-graph-editor-backdrop="ascii-shader"/);
	assert.match(BACKDROP_SOURCE, /data-personal-graph-editor-backdrop="ascii-grid-overlay"/);
	assert.match(BACKDROP_SOURCE, /overflow-hidden bg-white/);
	assert.match(BACKDROP_SOURCE, /#000 42%, #000 100%/);
	assert.doesNotMatch(BACKDROP_SOURCE, /bg-gradient-to-t from-white/);
	assert.match(
		BACKDROP_SOURCE,
		/import PatternTile, \{ type PatternStrokeOptions \} from "@\/components\/website\/demos\/visual\/pattern-tile";/,
	);
	assert.match(
		BACKDROP_SOURCE,
		/import WaveGradient from "@\/components\/website\/demos\/visual\/shaders\/wave-gradient";/,
	);
	assert.match(BACKDROP_SOURCE, /patternType="grid"/);
	assert.match(BACKDROP_SOURCE, /front=\{PERSONAL_GRAPH_GRID_COLOR\}/);
	assert.match(BACKDROP_SOURCE, /const PERSONAL_GRAPH_GRID_COLOR = "var\(--ds-border\)";/);
	assert.match(BACKDROP_SOURCE, /front=\{PERSONAL_GRAPH_GRID_OVERLAY_COLOR\}/);
	assert.match(BACKDROP_SOURCE, /const PERSONAL_GRAPH_GRID_OVERLAY_COLOR = "var\(--ds-border-bold\)";/);
	assert.match(BACKDROP_SOURCE, /const PERSONAL_GRAPH_GRID_FADE_STYLE = /);
	assert.match(BACKDROP_SOURCE, /style=\{PERSONAL_GRAPH_GRID_FADE_STYLE\}/);
	assert.match(BACKDROP_SOURCE, /const PERSONAL_GRAPH_SHADER_GRID_FADE_STYLE = /);
	assert.match(BACKDROP_SOURCE, /style=\{PERSONAL_GRAPH_SHADER_GRID_FADE_STYLE\}/);
	assert.match(BACKDROP_SOURCE, /transparent 76%/);
	assert.match(BACKDROP_SOURCE, /transparent 62%/);
	assert.match(BACKDROP_SOURCE, /back="transparent"/);
	assert.match(BACKDROP_SOURCE, /scale=\{48\}/);
	assert.match(BACKDROP_SOURCE, /style: "dashed"/);
	assert.match(BACKDROP_SOURCE, /width: 0\.5/);
	assert.match(BACKDROP_SOURCE, /dash: 3/);
	assert.match(BACKDROP_SOURCE, /gap: 6/);
	assert.match(BACKDROP_SOURCE, /<WaveGradient/);
	assert.match(BACKDROP_SOURCE, /colors=\{PERSONAL_GRAPH_WAVE_COLORS\}/);
	assert.match(BACKDROP_SOURCE, /const PERSONAL_GRAPH_WAVE_COLORS: \[string, string, string, string\]/);
	assert.match(BACKDROP_SOURCE, /"#FFFFFF"/);
	assert.doesNotMatch(BACKDROP_SOURCE, /radial-gradient\(ellipse at/);
	assert.match(BACKDROP_SOURCE, /"#1868DB"/);
	assert.match(BACKDROP_SOURCE, /"#FCA700"/);
	assert.match(BACKDROP_SOURCE, /"#AF59E1"/);
	assert.match(BACKDROP_SOURCE, /"#6A9A23"/);
	assert.match(BACKDROP_SOURCE, /sourceMode="field"/);
	assert.match(BACKDROP_SOURCE, /charset="custom"/);
	assert.doesNotMatch(BACKDROP_SOURCE, /characterMode="sequence"/);
	assert.match(BACKDROP_SOURCE, /customChars=" \.:-=\+\*#%@ROVO"/);
	assert.match(BACKDROP_SOURCE, /colorMode="monochrome"/);
	assert.match(BACKDROP_SOURCE, /monoColor="#44546F"/);
	assert.doesNotMatch(BACKDROP_SOURCE, /colorMode="source"/);
	assert.match(BACKDROP_SOURCE, /compositeMode="mask"/);
	assert.match(BACKDROP_SOURCE, /speed=\{1\}/);
	assert.match(BACKDROP_SOURCE, /sourceColors=\{PERSONAL_GRAPH_SHADER_COLORS\}/);
	assert.match(BACKDROP_SOURCE, /signalBlackPoint=\{0\.1\}/);
	assert.match(BACKDROP_SOURCE, /signalWhitePoint=\{0\.88\}/);
	assert.match(BACKDROP_SOURCE, /signalGamma=\{0\.92\}/);
	assert.match(BACKDROP_SOURCE, /presenceThreshold=\{0\.56\}/);
	assert.match(BACKDROP_SOURCE, /presenceSoftness=\{0\.34\}/);
	assert.match(BACKDROP_SOURCE, /transparentBackground/);
	assert.doesNotMatch(BACKDROP_SOURCE, /LiquidGradient/);
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
	assert.match(NEURAL_CANVAS_SOURCE, /focusProgressRef/);
	assert.match(NEURAL_CANVAS_SOURCE, /focusProgress: focusProgressRef\.current/);
	assert.match(NEURAL_LAYOUT_SOURCE, /applySelectionFocusLayout/);
	assert.match(NEURAL_LAYOUT_SOURCE, /getSelectedNeighborhood/);
	assert.match(NEURAL_RENDERER_SOURCE, /getSelectedRelationshipIds/);
	assert.match(NEURAL_RENDERER_SOURCE, /focusProgress > 0/);
	assert.match(NEURAL_RENDERER_SOURCE, /drawOrganicRayPath/);
	assert.match(NEURAL_RENDERER_SOURCE, /drawStraightEdgePath/);
	assert.match(NEURAL_RENDERER_SOURCE, /getEdgeTerminalDirection/);
	assert.match(NEURAL_RENDERER_SOURCE, /bezierCurveTo/);
	assert.match(NEURAL_RENDERER_SOURCE, /lineTo/);
	assert.doesNotMatch(NEURAL_RENDERER_SOURCE, /drawOrganicEdgePath/);
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
