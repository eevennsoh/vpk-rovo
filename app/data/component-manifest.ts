import { compareByNameNatural } from "@/lib/utils";

export type ComponentCategory =
	| "ui-audio"
	| "ui-ai"
	| "ui"
	| "blocks"
	| "projects"
	| "arts"
	| "utility"
	| "visual";

export interface ComponentManifestEntry {
	name: string;
	slug: string;
	importPath: string;
	category: ComponentCategory;
}

function sortEntriesByName<T extends { name: string }>(entries: readonly T[]): T[] {
	return [...entries].sort(compareByNameNatural);
}

function toTitleCase(slug: string): string {
	return slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function aiComponent(slug: string, name?: string): ComponentManifestEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/ui-ai/${slug}`,
		category: "ui-ai",
	};
}

function audioComponent(slug: string, name?: string): ComponentManifestEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/ui-audio/${slug}`,
		category: "ui-audio",
	};
}

function uiComponent(slug: string, name?: string): ComponentManifestEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/ui/${slug}`,
		category: "ui",
	};
}

function blockComponent(slug: string, name?: string): ComponentManifestEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/blocks/${slug}`,
		category: "blocks",
	};
}

function projectComponent(slug: string, name?: string): ComponentManifestEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/projects/${slug}`,
		category: "projects",
	};
}

function artComponent(slug: string, name?: string): ComponentManifestEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/arts/${slug}`,
		category: "arts",
	};
}

function utilityComponent(slug: string, name?: string): ComponentManifestEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/website/demos/utils/${slug}-demo`,
		category: "utility",
	};
}

function visualComponent(
	slug: string,
	name: string,
	importPath: string,
): ComponentManifestEntry {
	return {
		name,
		slug,
		importPath,
		category: "visual",
	};
}

export const AI_COMPONENTS: ComponentManifestEntry[] = sortEntriesByName([
	aiComponent("agent"),
	aiComponent("animated-dots", "Animated Dots"),
	aiComponent("animated-rovo", "Animated Rovo"),
	aiComponent("artifact"),
	aiComponent("attachments"),
	aiComponent("audio-player", "Audio Player"),
	aiComponent("canvas"),
	aiComponent("chain-of-thought", "Chain of Thought"),
	aiComponent("checkpoint"),
	aiComponent("code-block", "Code Block"),
	aiComponent("commit"),
	aiComponent("confirmation"),
	aiComponent("connection"),
	aiComponent("context"),
	aiComponent("controls"),
	aiComponent("conversation"),
	aiComponent("edge"),
	aiComponent("environment-variables", "Environment Variables"),
	aiComponent("file-tree", "File Tree"),
	aiComponent("image"),
	aiComponent("inline-citation", "Inline Citation"),
	aiComponent("jsx-preview", "JSX Preview"),
	aiComponent("message"),
	aiComponent("mic-selector", "Mic Selector"),
	aiComponent("model-selector", "Model Selector"),
	aiComponent("morphing-rovo", "Morphing Rovo"),
	aiComponent("node"),
	aiComponent("open-in-chat", "Open in Chat"),
	aiComponent("package-info", "Package Info"),
	aiComponent("panel"),
	aiComponent("persona"),
	aiComponent("plan"),
	aiComponent("prompt-input", "Prompt Input"),
	aiComponent("queue"),
	aiComponent("reasoning"),
	aiComponent("sandbox"),
	aiComponent("schema-display", "Schema Display"),
	aiComponent("shimmer"),
	aiComponent("snippet"),
	aiComponent("sources"),
	aiComponent("speech-input", "Speech Input"),
	aiComponent("stack-trace", "Stack Trace"),
	aiComponent("suggestion"),
	aiComponent("task"),
	aiComponent("terminal"),
	aiComponent("test-results", "Test Results"),
	aiComponent("tool"),
	aiComponent("toolbar"),
	aiComponent("transcription"),
	aiComponent("voice-selector", "Voice Selector"),
	aiComponent("web-preview", "Web Preview"),
]);

export const AUDIO_COMPONENTS: ComponentManifestEntry[] = sortEntriesByName([
	audioComponent("audio-player", "Audio Player"),
	audioComponent("bar-visualizer", "Bar Visualizer"),
	audioComponent("conversation"),
	audioComponent("conversation-bar", "Conversation Bar"),
	audioComponent("live-waveform", "Live Waveform"),
	audioComponent("matrix"),
	audioComponent("message"),
	audioComponent("mic-selector", "Mic Selector"),
	audioComponent("orb", "Orb"),
	audioComponent("response"),
	audioComponent("scrub-bar", "Scrub Bar"),
	audioComponent("shimmering-text", "Shimmering Text"),
	audioComponent("speech-input", "Speech Input"),
	audioComponent("transcript-viewer", "Transcript Viewer"),
	audioComponent("voice-button", "Voice Button"),
	audioComponent("voice-picker", "Voice Picker"),
	audioComponent("waveform", "Waveform"),
]);

export const UI_COMPONENTS: ComponentManifestEntry[] = sortEntriesByName([
	uiComponent("accordion"),
	uiComponent("alert"),
	uiComponent("alert-dialog", "Alert Dialog"),
	uiComponent("aspect-ratio", "Aspect Ratio"),
	uiComponent("avatar"),
	uiComponent("badge"),
	uiComponent("banner"),
	uiComponent("blanket"),
	uiComponent("breadcrumb"),
	uiComponent("button"),
	uiComponent("button-group", "Button Group"),
	uiComponent("calendar"),
	uiComponent("card"),
	uiComponent("carousel"),
	uiComponent("chart"),
	uiComponent("checkbox"),
	uiComponent("collapsible"),
	uiComponent("combobox"),
	uiComponent("comment"),
	uiComponent("command"),
	uiComponent("context-menu", "Context Menu"),
	uiComponent("date-picker", "Date Picker"),
	uiComponent("date-time-picker", "Date Time Picker"),
	uiComponent("dialog"),
	uiComponent("direction"),
	uiComponent("drawer"),
	uiComponent("dropdown-menu", "Dropdown Menu"),
	uiComponent("empty"),
	uiComponent("field"),
	{
		name: "Forms",
		slug: "forms",
		importPath: "@/components/ui/forms",
		category: "ui",
	},
	uiComponent("footer", "Footer"),
	uiComponent("hover-card", "Hover Card"),
	uiComponent("icon"),
	uiComponent("icon-tile", "Icon Tile"),
	uiComponent("inline-edit", "Inline Edit"),
	uiComponent("input-group", "Input Group"),
	uiComponent("input-otp", "Input OTP"),
	uiComponent("item"),
	uiComponent("kbd", "Kbd"),
	uiComponent("label"),
	uiComponent("logo", "Logo"),
	uiComponent("lozenge"),
	uiComponent("menu-group", "Menu Group"),
	uiComponent("menubar"),
	uiComponent("native-select", "Native Select"),
	uiComponent("navigation-menu", "Navigation Menu"),
	uiComponent("object-tile", "Object Tile"),
	uiComponent("page-header", "Page Header"),
	uiComponent("pagination"),
	uiComponent("popover"),
	uiComponent("progress"),
	uiComponent("progress-circle", "Progress Circle"),
	uiComponent("progress-rovo", "Progress Rovo"),
	uiComponent("progress-indicator", "Progress Indicator"),
	uiComponent("progress-tracker", "Progress Tracker"),
	uiComponent("radio"),
	uiComponent("radio-group", "Radio Group"),
	uiComponent("resizable"),
	uiComponent("scroll-area", "Scroll Area"),
	uiComponent("select"),
	uiComponent("separator"),
	uiComponent("sheet"),
	uiComponent("sidebar"),
	uiComponent("sidebar-nav-item", "Sidebar Nav Item"),
	uiComponent("skeleton"),
	uiComponent("skill-card", "Skill Card"),
	uiComponent("skill-tag", "Skill Tag"),
	uiComponent("slider"),
	uiComponent("sonner"),
	uiComponent("split-button", "Split Button"),
	uiComponent("spinner"),
	uiComponent("switch"),
	uiComponent("tag"),
	uiComponent("table"),
	uiComponent("tabs"),
	uiComponent("time-picker", "Time Picker"),
	uiComponent("tile"),
	uiComponent("toggle"),
	uiComponent("toggle-group", "Toggle Group"),
	uiComponent("tooltip"),
]);

export const BLOCK_COMPONENTS: ComponentManifestEntry[] = sortEntriesByName([
	blockComponent("agent-progress", "Agent Progress"),
	blockComponent("task-progress", "Task Progress"),
	blockComponent("answer-card", "Answer Card"),
	blockComponent("approval-card", "Approval Card"),
	blockComponent("chat-timeline", "Chat Timeline"),
	blockComponent("tool-approval", "Tool Approval"),
	blockComponent("chat-gallery", "Chat gallery"),
	blockComponent("chatbot", "Chatbot"),
	blockComponent("chatgpt", "ChatGPT"),
	blockComponent("cursor", "Cursor"),
	blockComponent("dashboard", "Dashboard"),
	blockComponent("data-table", "Data Table"),
	blockComponent("generative-card", "Generative Card"),
	blockComponent("generative", "Generative UI"),
	blockComponent("kanban-sprint", "Kanban Sprint"),
	blockComponent("mermaid-diagram", "Mermaid Diagram"),
	{
		name: "Login 01",
		slug: "login-01",
		importPath: "@/components/blocks/login/login-01",
		category: "blocks",
	},
	{
		name: "Login 02",
		slug: "login-02",
		importPath: "@/components/blocks/login/login-02",
		category: "blocks",
	},
	{
		name: "Login 03",
		slug: "login-03",
		importPath: "@/components/blocks/login/login-03",
		category: "blocks",
	},
	{
		name: "Login 04",
		slug: "login-04",
		importPath: "@/components/blocks/login/login-04",
		category: "blocks",
	},
	{
		name: "Login 05",
		slug: "login-05",
		importPath: "@/components/blocks/login/login-05",
		category: "blocks",
	},
	blockComponent("product-sidebar", "Product Sidebar"),
	blockComponent("prompt-gallery", "Prompt Gallery"),
	blockComponent("question-card", "Question Card"),
	blockComponent("settings-dialog", "Settings Dialog"),
	blockComponent("visual-waveform", "Visual Waveform"),
	{
		name: "Chat Configuration",
		slug: "chat-configuration",
		importPath: "@/components/blocks/chat-configuration",
		category: "blocks",
	},
	{
		name: "App Sidebar",
		slug: "app-sidebar",
		importPath: "@/components/blocks/sidebar/app-sidebar",
		category: "blocks",
	},
	{
		name: "Sidebar 01",
		slug: "sidebar-01",
		importPath: "@/components/blocks/sidebar/sidebar-01",
		category: "blocks",
	},
	{
		name: "Sidebar 02",
		slug: "sidebar-02",
		importPath: "@/components/blocks/sidebar/sidebar-02",
		category: "blocks",
	},
	{
		name: "Sidebar 03",
		slug: "sidebar-03",
		importPath: "@/components/blocks/sidebar/sidebar-03",
		category: "blocks",
	},
	{
		name: "Sidebar 04",
		slug: "sidebar-04",
		importPath: "@/components/blocks/sidebar/sidebar-04",
		category: "blocks",
	},
	{
		name: "Sidebar 05",
		slug: "sidebar-05",
		importPath: "@/components/blocks/sidebar/sidebar-05",
		category: "blocks",
	},
	{
		name: "Sidebar 06",
		slug: "sidebar-06",
		importPath: "@/components/blocks/sidebar/sidebar-06",
		category: "blocks",
	},
	{
		name: "Sidebar 07",
		slug: "sidebar-07",
		importPath: "@/components/blocks/sidebar/sidebar-07",
		category: "blocks",
	},
	{
		name: "Sidebar 08",
		slug: "sidebar-08",
		importPath: "@/components/blocks/sidebar/sidebar-08",
		category: "blocks",
	},
	{
		name: "Sidebar 09",
		slug: "sidebar-09",
		importPath: "@/components/blocks/sidebar/sidebar-09",
		category: "blocks",
	},
	{
		name: "Sidebar 10",
		slug: "sidebar-10",
		importPath: "@/components/blocks/sidebar/sidebar-10",
		category: "blocks",
	},
	{
		name: "Sidebar 11",
		slug: "sidebar-11",
		importPath: "@/components/blocks/sidebar/sidebar-11",
		category: "blocks",
	},
	{
		name: "Sidebar 12",
		slug: "sidebar-12",
		importPath: "@/components/blocks/sidebar/sidebar-12",
		category: "blocks",
	},
	{
		name: "Sidebar 13",
		slug: "sidebar-13",
		importPath: "@/components/blocks/sidebar/sidebar-13",
		category: "blocks",
	},
	{
		name: "Sidebar 14",
		slug: "sidebar-14",
		importPath: "@/components/blocks/sidebar/sidebar-14",
		category: "blocks",
	},
	{
		name: "Sidebar 15",
		slug: "sidebar-15",
		importPath: "@/components/blocks/sidebar/sidebar-15",
		category: "blocks",
	},
	{
		name: "Sidebar 16",
		slug: "sidebar-16",
		importPath: "@/components/blocks/sidebar/sidebar-16",
		category: "blocks",
	},
	blockComponent("sidebar-rail", "Sidebar Rail"),
	{
		name: "Signup 01",
		slug: "signup-01",
		importPath: "@/components/blocks/signup/signup-01",
		category: "blocks",
	},
	{
		name: "Signup 02",
		slug: "signup-02",
		importPath: "@/components/blocks/signup/signup-02",
		category: "blocks",
	},
	{
		name: "Signup 03",
		slug: "signup-03",
		importPath: "@/components/blocks/signup/signup-03",
		category: "blocks",
	},
	{
		name: "Signup 04",
		slug: "signup-04",
		importPath: "@/components/blocks/signup/signup-04",
		category: "blocks",
	},
	{
		name: "Signup 05",
		slug: "signup-05",
		importPath: "@/components/blocks/signup/signup-05",
		category: "blocks",
	},
	blockComponent("top-navigation", "Top Navigation"),
	blockComponent("terminal-switch", "Terminal Switch"),
	blockComponent("work-item-widget", "Work Item Widget"),
	blockComponent("work-item-detail", "Work Item Detail"),
	blockComponent("workflow", "Workflow"),
]);

export const PROJECT_COMPONENTS: ComponentManifestEntry[] = sortEntriesByName([
	projectComponent("confluence", "Confluence"),
	projectComponent("jira", "Jira"),
	projectComponent("rovo-app", "Rovo App"),
	projectComponent("search", "Search"),
	projectComponent("sidebar-chat", "Sidebar Chat"),
]);

export const ART_COMPONENTS: ComponentManifestEntry[] = sortEntriesByName([
	artComponent("awake", "Awake"),
	artComponent("personal-graph", "Personal Graph"),
]);

export const UTILITY_COMPONENTS: ComponentManifestEntry[] = sortEntriesByName([
	{
		name: "Agent Browser",
		slug: "agent-browser",
		importPath: "@/components/website/demos/utils/agent-browser",
		category: "utility",
	},
	utilityComponent("gui", "GUI"),
	utilityComponent("image-generation", "Image Generation"),
	utilityComponent("multiports", "Multiports"),
	utilityComponent("sound-generation", "Sound Generation"),
	utilityComponent("streamdown", "Streamdown"),
	utilityComponent("tools-invocation", "Tools Invocation"),
	utilityComponent("ui-generation", "UI Generation"),
	utilityComponent("visual-json", "Visual JSON"),
]);

export const VISUAL_COMPONENTS: ComponentManifestEntry[] = sortEntriesByName([
	visualComponent("typography", "Typography", "@/lib/tokens"),
	visualComponent("color", "Color", "@/app/tailwind-theme.css\n@/app/shadcn-theme.css"),
	visualComponent("shadow", "Shadow", "@/lib/tokens"),
	visualComponent("shadow-overlay", "Shadow Overlay", "@/components/website/demos/visual/shadow-overlay"),
	visualComponent("melt", "Melt", "@/components/website/demos/visual/melt"),
	visualComponent("squircle", "Squircle", "@/components/website/demos/visual/shaders/squircle"),
	visualComponent("ascii", "ASCII", "@/components/website/demos/visual/shaders/ascii"),
	visualComponent("bloom", "Bloom", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("circuit-bent", "Circuit Bent", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("custom-shader", "Custom Shader", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("directional-blur", "Directional Blur", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("crt", "CRT", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("displacement-map", "Displacement Map", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("dithering", "Dithering", "@/components/website/demos/visual/shaders/dithering"),
	visualComponent("edge-detect", "Edge Detect", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("fluid", "Fluid", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("halftone", "Halftone", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("ink", "Ink", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("magnify-lens", "Magnify Lens", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("mesh-gradient", "Mesh Gradient", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("particle-grid", "Particle Grid", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("pixelation", "Pixelation", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("pixel-sorting", "Pixel Sorting", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("pixel-trail", "Pixel Trail", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("plotter", "Plotter", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("posterize", "Posterize", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("slice", "Slice", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("smear", "Smear", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("threshold", "Threshold", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent(
		"particles",
		"Particles",
		"@/components/website/demos/visual/shaders/particles",
	),
	visualComponent("pattern-tile", "Pattern Tile", "@/components/website/demos/visual/pattern-tile"),
	visualComponent("pattern-v2", "Pattern v2", "@/components/website/demos/visual/shader-lab-effect-demo"),
	visualComponent("noise", "Noise", "@/components/website/demos/visual/shaders/noise"),
	visualComponent(
		"wave-gradient",
		"Wave Gradient",
		"@/components/website/demos/visual/shaders/wave-gradient",
	),
	visualComponent(
		"liquid-gradient",
		"Liquid Gradient",
		"@/components/website/demos/visual/shaders/liquid-gradient",
	),
	visualComponent(
		"logo-gradient",
		"Logo Gradient",
		"@/components/website/demos/visual/shaders/logo-gradient",
	),
	visualComponent("bands", "Bands", "@/components/website/demos/visual/shaders/bands"),
	visualComponent("rings", "Rings", "@/components/website/demos/visual/shaders/rings"),
	visualComponent(
		"blockify",
		"Blockify",
		"@/components/website/demos/visual/shaders/blockify",
	),
	visualComponent("pixels", "Pixels", "@/components/website/demos/visual/shaders/pixels"),
	visualComponent("truchet", "Truchet", "@/components/website/demos/visual/shaders/truchet"),
	visualComponent(
		"fluted-glass",
		"Fluted Glass",
		"@/components/website/demos/visual/shaders/fluted-glass",
	),
	visualComponent(
		"fluted-glass-v2",
		"Fluted Glass v2",
		"@/components/website/demos/visual/shader-lab-effect-demo",
	),
	visualComponent("liquid-glass", "Liquid Glass", "@/components/website/demos/visual/shaders/liquid-glass"),
	visualComponent("logo-glass", "Logo Glass", "@/components/website/demos/visual/shaders/logo-glass"),
	visualComponent("glass-tabs", "Glass tabs", "@/components/ui/glass-tabs"),
	visualComponent(
		"glass-slider",
		"Glass Slider",
		"@/components/arts/awake/glass-slider",
	),
	visualComponent("graph", "Graph", "@/components/website/demos/visual/graph"),
	visualComponent("holo", "Holo", "@/components/website/demos/visual/shaders/holo"),
	visualComponent("mesh", "Mesh SVG", "@/components/website/demos/visual/shaders/mesh"),
	visualComponent("mesh-02", "Mesh", "@/components/website/demos/visual/shaders/mesh2"),
	visualComponent(
		"chromatic-aberration",
		"Chromatic Aberration",
		"@/components/website/demos/visual/shaders/chromatic-aberration",
	),
	visualComponent(
		"chromatic-aberration-v2",
		"Chromatic Aberration v2",
		"@/components/website/demos/visual/shader-lab-effect-demo",
	),
	]);

const ALL_COMPONENTS = [
	...AUDIO_COMPONENTS,
	...AI_COMPONENTS,
	...UI_COMPONENTS,
	...BLOCK_COMPONENTS,
	...PROJECT_COMPONENTS,
	...ART_COMPONENTS,
	...UTILITY_COMPONENTS,
	...VISUAL_COMPONENTS,
];

export function findComponent(
	category: string,
	slug: string,
): ComponentManifestEntry | undefined {
	return ALL_COMPONENTS.find((component) => {
		return component.category === category && component.slug === slug;
	});
}

export function getAllComponents(): ComponentManifestEntry[] {
	return ALL_COMPONENTS;
}
