const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PAGE_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
const LAYOUT_SOURCE = fs.readFileSync(path.join(__dirname, "layout.tsx"), "utf8");
const ROOT_LAYOUT_SOURCE = fs.readFileSync(path.join(__dirname, "../../layout.tsx"), "utf8");
const TAILWIND_THEME_SOURCE = fs.readFileSync(path.join(__dirname, "../../tailwind-theme.css"), "utf8");
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
const GLASS_PANEL_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/personal-graph-glass-panel.tsx",
	),
	"utf8",
);
const CONTROL_FLYOUT_SOURCE = fs.readFileSync(
	path.join(
		__dirname,
		"../../../components/arts/personal-graph/personal-graph-control-flyout.tsx",
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

test("Personal Graph control flyout exposes the app theme toggle", () => {
	assert.match(
		SURFACE_SOURCE,
		/import \{ useTheme \} from "@\/components\/utils\/theme-wrapper";/,
	);
	assert.match(SURFACE_SOURCE, /const \{ actualTheme, setTheme, theme \} = useTheme\(\);/);
	assert.match(SURFACE_SOURCE, /const handleToggleTheme = useCallback/);
	assert.match(SURFACE_SOURCE, /key: "theme"/);
	assert.match(SURFACE_SOURCE, /label: themeLabel/);
	assert.match(SURFACE_SOURCE, /aria-label=\{themeLabel\}/);
	assert.match(SURFACE_SOURCE, /onClick=\{handleToggleTheme\}/);
});

test("Personal Graph header keeps controls centered below the title", () => {
	assert.match(SURFACE_SOURCE, /className="relative flex flex-col items-center"/);
	assert.match(SEARCH_SOURCE, /<PersonalGraphControlFlyoutTrigger/);
	assert.match(SEARCH_SOURCE, /<PersonalGraphControlFlyoutActions/);
	assert.doesNotMatch(SURFACE_SOURCE, /xl:absolute xl:right-0 xl:top-0 xl:justify-end/);
	assert.doesNotMatch(SURFACE_SOURCE, /personal-graph-vault-picker/);
});

test("Personal Graph exposes the capture queue inside the control flyout", () => {
	assert.match(
		SURFACE_SOURCE,
		/import \{ Popover, PopoverContent, PopoverTrigger \} from "@\/components\/ui\/popover";/,
	);
	assert.match(
		SURFACE_SOURCE,
		/PixelIngestIcon/,
	);
	assert.match(SURFACE_SOURCE, /const \[isCaptureQueueOpen, setIsCaptureQueueOpen\] = useState\(false\);/);
	assert.match(SURFACE_SOURCE, /key: "capture"/);
	assert.match(SURFACE_SOURCE, /label: "Capture queue"/);
	assert.match(SURFACE_SOURCE, /<Popover open=\{isCaptureQueueOpen\} onOpenChange=\{handleCaptureQueueOpenChange\}>/);
	assert.match(SURFACE_SOURCE, /aria-label="Capture queue"/);
	assert.match(SURFACE_SOURCE, /<PixelIngestIcon \/>/);
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
	assert.match(SURFACE_SOURCE, /PERSONAL_GRAPH_TITLE_SCRAMBLE_LINE_CHAR_COUNT = 8/);
	assert.match(SURFACE_SOURCE, /PERSONAL_GRAPH_INITIAL_TITLE_SIZE/);
	assert.match(SURFACE_SOURCE, /PERSONAL_GRAPH_SETTLED_TITLE_SIZE/);
	assert.match(SURFACE_SOURCE, /100cqw - 1rem/);
	assert.match(
		SURFACE_SOURCE,
		/className="mx-auto w-full min-w-0 max-w-full text-center text-text \[container-type:inline-size\]"/,
	);
	assert.match(SURFACE_SOURCE, /className="leading-\[0\.8\] text-text"/);
	assert.match(SURFACE_SOURCE, /initial=\{\{ fontSize: PERSONAL_GRAPH_INITIAL_TITLE_SIZE \}\}/);
	assert.match(
		SURFACE_SOURCE,
		/fontSize: isPostSettle \? PERSONAL_GRAPH_SETTLED_TITLE_SIZE : PERSONAL_GRAPH_INITIAL_TITLE_SIZE/,
	);
	assert.doesNotMatch(SURFACE_SOURCE, /uppercase leading-\[0\.8\]/);
	assert.doesNotMatch(SURFACE_SOURCE, /className="[^"]*tracking-normal[^"]*"\s+style=\{PERSONAL_GRAPH_TITLE_FONT_STYLE\}/);
	assert.match(TITLE_SOURCE, /<ScrambleText/);
	assert.match(TITLE_SOURCE, />\s*PERSONAL\s*<\/ScrambleText>/);
	assert.match(TITLE_SOURCE, />\s*GRAPH\s*<\/ScrambleText>/);
	assert.match(TITLE_SOURCE, /className="block whitespace-nowrap"/);
	assert.match(TITLE_SOURCE, /aria-label="PERSONAL GRAPH"/);
	assert.match(TITLE_SOURCE, /aria-hidden className="block whitespace-nowrap"/);
	assert.doesNotMatch(SURFACE_SOURCE, /BranchIcon/);
});

test("Personal Graph omits the standalone zoom control rail", () => {
	assert.doesNotMatch(SURFACE_SOURCE, /function PersonalGraphZoomControls/);
	assert.doesNotMatch(SURFACE_SOURCE, /absolute bottom-6 left-6 z-30 hidden text-text lg:block/);
	assert.doesNotMatch(SURFACE_SOURCE, /contentClassName="flex h-full flex-col items-center gap-1 py-1"/);
	assert.doesNotMatch(SURFACE_SOURCE, /aria-label="Zoom in"/);
	assert.doesNotMatch(SURFACE_SOURCE, /aria-label="Zoom out"/);
	assert.doesNotMatch(SURFACE_SOURCE, /Math\.round\(zoom \* 100\)/);
	assert.doesNotMatch(SURFACE_SOURCE, /Reset graph view/);
	assert.doesNotMatch(SURFACE_SOURCE, /TargetIcon/);
});

test("Personal Graph anchors the search and chat composer at the graph origin", () => {
	assert.match(SURFACE_SOURCE, /aria-label="Personal Graph search and chat"/);
	assert.match(SURFACE_SOURCE, /left-4 right-4 z-40 flex justify-center/);
	assert.match(SURFACE_SOURCE, /initial=\{\{ bottom: -120 \}\}/);
	assert.match(SURFACE_SOURCE, /bottom: isSearchRevealed \? 24 : -120/);
	assert.doesNotMatch(SURFACE_SOURCE, /opacity: isSearchRevealed \? 1 : 0/);
	assert.doesNotMatch(SURFACE_SOURCE, /opacity: \{ duration: 0\.5, ease: easeOut \}/);
	assert.match(SURFACE_SOURCE, /border-border-inverse bg-bg-neutral-bold/);
	assert.match(SURFACE_SOURCE, /<PersonalGraphSearch/);
	assert.doesNotMatch(SURFACE_SOURCE, /grid-cols-\[1fr_auto_1fr\]/);
	assert.match(SEARCH_SOURCE, /Ask or search your graph\.\.\./);
	assert.match(
		SEARCH_SOURCE,
		/<PersonalGraphGlassPanel[\s\S]*className="relative z-10"[\s\S]*contentClassName="flex h-16 items-center gap-2 p-4 pl-6"[\s\S]*radius=\{30\}/,
	);
	assert.match(SEARCH_SOURCE, /contentClassName="flex h-16 items-center gap-2 p-4 pl-6"/);
	assert.match(GLASS_PANEL_SOURCE, /\[&>div\]:p-0/);
	assert.doesNotMatch(SEARCH_SOURCE, /SearchIcon/);
	assert.match(SEARCH_SOURCE, /import \{ token \} from "@\/lib\/tokens";/);
	assert.match(SEARCH_SOURCE, /className="min-w-0 flex-1 bg-transparent text-text outline-none placeholder:text-text-subtlest"/);
	assert.match(SEARCH_SOURCE, /style=\{\{ font: token\("font\.body"\) \}\}/);
	assert.doesNotMatch(SEARCH_SOURCE, /text-base text-text/);
	assert.doesNotMatch(SEARCH_SOURCE, /sm:text-lg/);
	assert.match(SEARCH_SOURCE, /bottom-\[calc\(100%\+0\.75rem\)\]/);
	assert.match(SEARCH_SOURCE, /PixelArrowRightIcon/);
	assert.match(SEARCH_SOURCE, /PersonalGraphControlFlyoutTrigger/);
	assert.match(SEARCH_SOURCE, /PersonalGraphControlFlyoutActions/);
	assert.match(SEARCH_SOURCE, /aria-label="Ask or search Personal Graph"/);
	assert.match(SEARCH_SOURCE, /aria-label="Open top search result"[\s\S]*className="size-8 rounded-full border-0 text-text-subtle/);
	assert.doesNotMatch(SEARCH_SOURCE, /aria-label="Open graph parameters"/);
	assert.match(SEARCH_SOURCE, /actions=\{flyoutActions\}/);
});

test("Personal Graph lets the graph renderer fill the route viewport behind the chrome", () => {
	assert.match(SURFACE_SOURCE, /<motion\.section\s+className="absolute inset-0 z-10"\s+aria-label="Vault graph"/);
	assert.match(SURFACE_SOURCE, /const isGraphRevealed = isSearchRevealed;/);
	assert.doesNotMatch(SURFACE_SOURCE, /bottom-\[6\.5rem\] top-\[250px\]/);
	assert.doesNotMatch(SURFACE_SOURCE, /sm:top-\[320px\] lg:top-\[360px\] xl:top-\[400px\]/);
	assert.match(GRAPH_SOURCE, /isFillVariant \? "flex h-full w-full flex-col"/);
	assert.match(NEURAL_CANVAS_SOURCE, /"relative h-full min-h-0 overflow-hidden"/);
	assert.doesNotMatch(NEURAL_CANVAS_SOURCE, /min-h-\[620px\]/);
});

test("Personal Graph uses theme-aware editor-style surrounding chrome", () => {
	assert.match(SURFACE_SOURCE, /aria-label="Capture queue"/);
	assert.match(SURFACE_SOURCE, /aria-label="Knowledge Graph details"/);
	assert.doesNotMatch(SURFACE_SOURCE, /PersonalGraphZoomControls/);
	assert.doesNotMatch(SURFACE_SOURCE, /themeMode="light"/);
	assert.match(SURFACE_SOURCE, /showSelectionOverlay=\{false\}/);
	assert.doesNotMatch(SURFACE_SOURCE, /PERSONAL_GRAPH_EDITOR_COLOR_LOCK_STYLE/);
	assert.doesNotMatch(SURFACE_SOURCE, /dark:bg-white/);
	assert.doesNotMatch(SURFACE_SOURCE, /dark:text-neutral-950/);
	assert.match(SURFACE_SOURCE, /bg-surface text-text/);
	assert.match(SURFACE_SOURCE, /style=\{style\}/);
	assert.match(SURFACE_SOURCE, /PersonalGraphGlassPanel/);
	assert.match(SURFACE_SOURCE, /border-border bg-bg-neutral-subtle/);
	assert.match(SEARCH_SOURCE, /bg-transparent text-text/);
	assert.match(SEARCH_SOURCE, /rounded-2xl/);
	assert.match(SURFACE_SOURCE, /CopyIcon/);
});

test("Personal Graph leaves the page header transparent over the backdrop grid", () => {
	assert.match(SURFACE_SOURCE, /<header className="absolute inset-x-4 top-6 z-30 sm:inset-x-6 lg:inset-x-8">/);
	assert.match(SURFACE_SOURCE, /<header className="absolute inset-x-4 top-6 z-30 sm:inset-x-6 lg:inset-x-8">\s*<motion\.div\s+className="relative flex flex-col items-center"/);
	assert.doesNotMatch(
		SURFACE_SOURCE,
		/<header className="absolute inset-x-4 top-6 z-30 sm:inset-x-6 lg:inset-x-8">\s*<PersonalGraphGlassPanel contentClassName="relative flex flex-col items-center gap-4/,
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
	assert.match(SURFACE_SOURCE, /<section className="sr-only" aria-label="Personal Graph text fallback">/);
	assert.doesNotMatch(SURFACE_SOURCE, /<summary>/);
	assert.match(
		SURFACE_SOURCE,
		/import Graph, \{ ROVO_GRAPH_DEFAULT_PARAMS \} from "@\/components\/website\/demos\/visual\/graph";/,
	);
	assert.match(SURFACE_SOURCE, /<Graph/);
	assert.match(SURFACE_SOURCE, /variant="fill"/);
	assert.match(SURFACE_SOURCE, /showControls=\{false\}/);
	assert.match(SURFACE_SOURCE, /background="transparent"/);
	assert.match(SURFACE_SOURCE, /params=\{ROVO_GRAPH_DEFAULT_PARAMS\}/);
	assert.doesNotMatch(SURFACE_SOURCE, /PERSONAL_GRAPH_NEURAL_PARAMS_STORAGE_KEY/);
	assert.match(GRAPH_SOURCE, /nodeShape: "square"/);
	assert.match(GRAPH_SOURCE, /nodeSize: 8/);
	assert.match(GRAPH_SOURCE, /rayOriginY: 0\.95/);
	assert.match(SURFACE_SOURCE, /function PersonalGraphPromptTailConnector/);
	assert.match(SURFACE_SOURCE, /data-personal-graph-tail-connector="prompt"/);
	assert.match(SURFACE_SOURCE, /top-\[-7rem\]/);
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

test("Personal Graph uses a theme-aware editor canvas backdrop", () => {
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
	assert.doesNotMatch(BACKDROP_SOURCE, /data-personal-graph-editor-backdrop="ascii-grid-overlay"/);
	assert.match(BACKDROP_SOURCE, /overflow-hidden bg-surface/);
	assert.match(BACKDROP_SOURCE, /#000 42%, #000 100%/);
	assert.doesNotMatch(BACKDROP_SOURCE, /bg-gradient-to-t from-white/);
	assert.doesNotMatch(BACKDROP_SOURCE, /"#FFFFFF"/);
	assert.match(
		BACKDROP_SOURCE,
		/import PatternTile, \{ type PatternStrokeOptions \} from "@\/components\/website\/demos\/visual\/pattern-tile";/,
	);
	assert.match(
		BACKDROP_SOURCE,
		/import WaveGradient from "@\/components\/website\/demos\/visual\/shaders\/wave-gradient";/,
	);
	assert.match(
		BACKDROP_SOURCE,
		/import \{ useTheme \} from "@\/components\/utils\/theme-wrapper";/,
	);
	assert.match(BACKDROP_SOURCE, /patternType="grid"/);
	assert.match(BACKDROP_SOURCE, /className="text-border"/);
	assert.match(BACKDROP_SOURCE, /front="currentColor"/);
	assert.match(BACKDROP_SOURCE, /back="transparent"/);
	assert.match(TAILWIND_THEME_SOURCE, /--color-neutral-400: var\(--ds-chart-gray-bold\);/);
	assert.doesNotMatch(BACKDROP_SOURCE, /blendMode="multiply"/);
	assert.match(BACKDROP_SOURCE, /const PERSONAL_GRAPH_SURFACE_COLOR = "var\(--ds-surface\)";/);
	assert.doesNotMatch(BACKDROP_SOURCE, /PERSONAL_GRAPH_GRID_COLORS/);
	assert.doesNotMatch(BACKDROP_SOURCE, /PERSONAL_GRAPH_GRID_OVERLAY_COLORS/);
	assert.doesNotMatch(BACKDROP_SOURCE, /front=\{gridColor\}/);
	assert.doesNotMatch(BACKDROP_SOURCE, /front=\{gridOverlayColor\}/);
	assert.doesNotMatch(BACKDROP_SOURCE, /color-mix\(in srgb, var\(--ds-surface\)/);
	assert.doesNotMatch(BACKDROP_SOURCE, /const PERSONAL_GRAPH_GRID_COLOR = "var\(--ds-border\)";/);
	assert.doesNotMatch(BACKDROP_SOURCE, /className="text-text-subtlest"/);
	assert.doesNotMatch(BACKDROP_SOURCE, /className="text-blanket"/);
	assert.match(BACKDROP_SOURCE, /const PERSONAL_GRAPH_GRID_MASK = /);
	assert.match(BACKDROP_SOURCE, /WebkitMaskImage: PERSONAL_GRAPH_GRID_MASK/);
	assert.doesNotMatch(BACKDROP_SOURCE, /PERSONAL_GRAPH_GRID_FADE_STYLE/);
	assert.doesNotMatch(BACKDROP_SOURCE, /PERSONAL_GRAPH_SHADER_GRID_FADE_STYLE/);
	assert.match(BACKDROP_SOURCE, /transparent 76%/);
	assert.doesNotMatch(BACKDROP_SOURCE, /transparent 62%/);
	assert.match(BACKDROP_SOURCE, /back="transparent"/);
	assert.match(BACKDROP_SOURCE, /scale=\{48\}/);
	assert.match(BACKDROP_SOURCE, /style: "dashed"/);
	assert.doesNotMatch(BACKDROP_SOURCE, /width: 0\.5/);
	assert.match(BACKDROP_SOURCE, /dash: 3/);
	assert.match(BACKDROP_SOURCE, /gap: 6/);
	assert.match(BACKDROP_SOURCE, /<WaveGradient/);
	assert.match(BACKDROP_SOURCE, /colors=\{PERSONAL_GRAPH_WAVE_COLORS\}/);
	assert.match(BACKDROP_SOURCE, /const PERSONAL_GRAPH_WAVE_COLORS: \[string, string, string, string\]/);
	assert.match(BACKDROP_SOURCE, /PERSONAL_GRAPH_SURFACE_COLOR,\s+PERSONAL_GRAPH_SURFACE_COLOR,\s+PERSONAL_GRAPH_SURFACE_COLOR,\s+PERSONAL_GRAPH_SURFACE_COLOR,/);
	assert.match(BACKDROP_SOURCE, /key=\{`personal-graph-wave-\$\{actualTheme\}`\}/);
	assert.doesNotMatch(BACKDROP_SOURCE, /absolute inset-x-0 top-0 h-32/);
	assert.doesNotMatch(BACKDROP_SOURCE, /bg-gradient-to-b from-surface via-surface\/90 to-transparent/);
	assert.doesNotMatch(BACKDROP_SOURCE, /radial-gradient\(ellipse at/);
	assert.match(BACKDROP_SOURCE, /"#1868DB"/);
	assert.match(BACKDROP_SOURCE, /"#FCA700"/);
	assert.match(BACKDROP_SOURCE, /"#AF59E1"/);
	assert.match(BACKDROP_SOURCE, /"#6A9A23"/);
	assert.doesNotMatch(BACKDROP_SOURCE, /sourceMode="field"/);
	assert.match(BACKDROP_SOURCE, /charset="custom"/);
	assert.doesNotMatch(BACKDROP_SOURCE, /characterMode="sequence"/);
	assert.match(BACKDROP_SOURCE, /customChars=" \.:-=\+\*#%@ROVO"/);
	assert.doesNotMatch(BACKDROP_SOURCE, /colorMode="monochrome"/);
	assert.match(BACKDROP_SOURCE, /const PERSONAL_GRAPH_ASCII_COLOR = "var\(--ds-text-subtle\)";/);
	assert.match(BACKDROP_SOURCE, /monoColor=\{PERSONAL_GRAPH_ASCII_COLOR\}/);
	assert.match(BACKDROP_SOURCE, /backgroundColor=\{PERSONAL_GRAPH_SURFACE_COLOR\}/);
	assert.match(BACKDROP_SOURCE, /key=\{`personal-graph-ascii-\$\{actualTheme\}`\}/);
	assert.doesNotMatch(BACKDROP_SOURCE, /colorMode="source"/);
	assert.match(BACKDROP_SOURCE, /compositeMode="mask"/);
	assert.doesNotMatch(BACKDROP_SOURCE, /speed=\{1\}/);
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

test("Personal Graph exposes primary graph actions through a curved control flyout", () => {
	assert.match(SURFACE_SOURCE, /const flyoutActions = useMemo<ReadonlyArray<PersonalGraphControlFlyoutAction>>/);
	assert.match(SURFACE_SOURCE, /key: "vault"/);
	assert.match(SURFACE_SOURCE, /aria-label="Choose Personal Graph vault folder"/);
	assert.match(SURFACE_SOURCE, /key: "refresh"/);
	assert.match(SURFACE_SOURCE, /aria-label="Refresh graph"/);
	assert.match(SURFACE_SOURCE, /key: "reset-vault"/);
	assert.match(SURFACE_SOURCE, /label: "Reset vault"/);
	assert.match(SURFACE_SOURCE, /aria-label="Reset Personal Graph vault selection"/);
	assert.match(SURFACE_SOURCE, /disabled=\{isVaultResetting\}/);
	assert.match(SURFACE_SOURCE, /onClick=\{handleResetVault\}/);
	assert.match(SURFACE_SOURCE, /if \(isVaultReady\) \{/);
	assert.match(CONTROL_FLYOUT_SOURCE, /offsetPath: `path\("\$\{ARC_PATH\}"\)`/);
	assert.match(CONTROL_FLYOUT_SOURCE, /offsetDistance: `\$\{distance\}%`/);
	assert.doesNotMatch(SURFACE_SOURCE, /PersonalGraphNeuralControls/);
	assert.doesNotMatch(SURFACE_SOURCE, /aria-label="Graph parameters"/);
	assert.match(NEURAL_PARAMS_SOURCE, /speed: 0\.8/);
	assert.match(NEURAL_PARAMS_SOURCE, /amplitude: 0\.15/);
	assert.match(NEURAL_PARAMS_SOURCE, /coneAngle: 75/);
	assert.match(NEURAL_PARAMS_SOURCE, /nodeColor: "#6b5ce7"/);
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
	assert.match(NEURAL_CANVAS_SOURCE, /addEventListener\("wheel", handleWheel, \{ passive: false \}\)/);
	assert.doesNotMatch(NEURAL_CANVAS_SOURCE, /sigma\.on/);
});
