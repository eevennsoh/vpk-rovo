import type { ComponentDetail } from "./component-detail-types";
import { UI_AUDIO_DETAILS } from "./details/ui-audio";
import { UI_AI_DETAILS } from "./details/ui-ai";
import { BLOCK_DETAILS } from "./details/blocks";
import { PROJECT_DETAILS } from "./details/projects";
import { UI_DETAILS } from "./details/ui";
import { UTILITY_DETAILS } from "./details/utility";
import { VISUAL_DETAILS } from "./details/visual";

export interface ComponentEntry {
	name: string;
	slug: string;
	importPath: string;
	category: "ui-audio" | "ui-ai" | "ui" | "blocks" | "projects" | "utility" | "visual";
	detail?: ComponentDetail;
}

function toTitleCase(slug: string): string {
	return slug
		.split("-")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");
}

function aiComponent(slug: string, name?: string): ComponentEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/ui-ai/${slug}`,
		category: "ui-ai",
		detail: UI_AI_DETAILS[slug],
	};
}

function audioComponent(slug: string, name?: string): ComponentEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/ui-audio/${slug}`,
		category: "ui-audio",
		detail: UI_AUDIO_DETAILS[slug],
	};
}

function uiComponent(slug: string, name?: string): ComponentEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/ui/${slug}`,
		category: "ui",
		detail: UI_DETAILS[slug],
	};
}

function blockComponent(slug: string, name?: string): ComponentEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/blocks/${slug}`,
		category: "blocks",
		detail: BLOCK_DETAILS[slug],
	};
}

function projectComponent(slug: string, name?: string): ComponentEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/projects/${slug}`,
		category: "projects",
		detail: PROJECT_DETAILS[slug],
	};
}

function utilityComponent(slug: string, name?: string): ComponentEntry {
	return {
		name: name ?? toTitleCase(slug),
		slug,
		importPath: `@/components/website/demos/utils/${slug}-demo`,
		category: "utility",
		detail: UTILITY_DETAILS[slug],
	};
}

function visualComponent(slug: string, name: string, importPath: string): ComponentEntry {
	return {
		name,
		slug,
		importPath,
		category: "visual",
		detail: VISUAL_DETAILS[slug],
	};
}

export const AI_COMPONENTS: ComponentEntry[] = [
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
] as const;

export const AUDIO_COMPONENTS: ComponentEntry[] = [
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
] as const;

export const UI_COMPONENTS: ComponentEntry[] = [
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
	uiComponent("footer", "Footer"),
	{
		name: "Forms",
		slug: "forms",
		importPath: "@/components/ui/forms",
		category: "ui",
		detail: UI_DETAILS.forms,
	},

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
] as const;

export const BLOCK_COMPONENTS: ComponentEntry[] = [
	blockComponent("agent-progress", "Agent Progress"),
	blockComponent("task-progress", "Task Progress"),
	blockComponent("answer-card", "Answer Card"),
	blockComponent("approval-card", "Approval Card"),
	blockComponent("chatbot", "Chatbot"),
	blockComponent("chatgpt", "ChatGPT"),
	blockComponent("cursor", "Cursor"),
	blockComponent("dashboard", "Dashboard"),
	blockComponent("data-table", "Data Table"),
	blockComponent("generative-card", "Generative Card"),
	blockComponent("generative", "Generative UI"),
	blockComponent("kanban-sprint", "Kanban Sprint"),
	blockComponent("make-artifact", "Make Artifact"),
	blockComponent("make-gallery", "Make Gallery"),
	blockComponent("make-grid", "Make Grid"),
	blockComponent("make-item", "Make Item"),
	blockComponent("make-page", "Make Page"),
	blockComponent("mermaid-diagram", "Mermaid Diagram"),
	{ name: "Login 01", slug: "login-01", importPath: "@/components/blocks/login/login-01", category: "blocks", detail: BLOCK_DETAILS["login-01"] },
	{ name: "Login 02", slug: "login-02", importPath: "@/components/blocks/login/login-02", category: "blocks", detail: BLOCK_DETAILS["login-02"] },
	{ name: "Login 03", slug: "login-03", importPath: "@/components/blocks/login/login-03", category: "blocks", detail: BLOCK_DETAILS["login-03"] },
	{ name: "Login 04", slug: "login-04", importPath: "@/components/blocks/login/login-04", category: "blocks", detail: BLOCK_DETAILS["login-04"] },
	{ name: "Login 05", slug: "login-05", importPath: "@/components/blocks/login/login-05", category: "blocks", detail: BLOCK_DETAILS["login-05"] },
	blockComponent("product-sidebar", "Product Sidebar"),
	blockComponent("prompt-gallery", "Prompt Gallery"),
	blockComponent("question-card", "Question Card"),
	blockComponent("settings-dialog", "Settings Dialog"),
	blockComponent("visual-waveform", "Visual Waveform"),
	{ name: "Chat Configuration", slug: "chat-configuration", importPath: "@/components/blocks/chat-configuration", category: "blocks", detail: BLOCK_DETAILS["chat-configuration"] },
	{ name: "App Sidebar", slug: "app-sidebar", importPath: "@/components/blocks/sidebar/app-sidebar", category: "blocks", detail: BLOCK_DETAILS["app-sidebar"] },
	{ name: "Sidebar 01", slug: "sidebar-01", importPath: "@/components/blocks/sidebar/sidebar-01", category: "blocks", detail: BLOCK_DETAILS["sidebar-01"] },
	{ name: "Sidebar 02", slug: "sidebar-02", importPath: "@/components/blocks/sidebar/sidebar-02", category: "blocks", detail: BLOCK_DETAILS["sidebar-02"] },
	{ name: "Sidebar 03", slug: "sidebar-03", importPath: "@/components/blocks/sidebar/sidebar-03", category: "blocks", detail: BLOCK_DETAILS["sidebar-03"] },
	{ name: "Sidebar 04", slug: "sidebar-04", importPath: "@/components/blocks/sidebar/sidebar-04", category: "blocks", detail: BLOCK_DETAILS["sidebar-04"] },
	{ name: "Sidebar 05", slug: "sidebar-05", importPath: "@/components/blocks/sidebar/sidebar-05", category: "blocks", detail: BLOCK_DETAILS["sidebar-05"] },
	{ name: "Sidebar 06", slug: "sidebar-06", importPath: "@/components/blocks/sidebar/sidebar-06", category: "blocks", detail: BLOCK_DETAILS["sidebar-06"] },
	{ name: "Sidebar 07", slug: "sidebar-07", importPath: "@/components/blocks/sidebar/sidebar-07", category: "blocks", detail: BLOCK_DETAILS["sidebar-07"] },
	{ name: "Sidebar 08", slug: "sidebar-08", importPath: "@/components/blocks/sidebar/sidebar-08", category: "blocks", detail: BLOCK_DETAILS["sidebar-08"] },
	{ name: "Sidebar 09", slug: "sidebar-09", importPath: "@/components/blocks/sidebar/sidebar-09", category: "blocks", detail: BLOCK_DETAILS["sidebar-09"] },
	{ name: "Sidebar 10", slug: "sidebar-10", importPath: "@/components/blocks/sidebar/sidebar-10", category: "blocks", detail: BLOCK_DETAILS["sidebar-10"] },
	{ name: "Sidebar 11", slug: "sidebar-11", importPath: "@/components/blocks/sidebar/sidebar-11", category: "blocks", detail: BLOCK_DETAILS["sidebar-11"] },
	{ name: "Sidebar 12", slug: "sidebar-12", importPath: "@/components/blocks/sidebar/sidebar-12", category: "blocks", detail: BLOCK_DETAILS["sidebar-12"] },
	{ name: "Sidebar 13", slug: "sidebar-13", importPath: "@/components/blocks/sidebar/sidebar-13", category: "blocks", detail: BLOCK_DETAILS["sidebar-13"] },
	{ name: "Sidebar 14", slug: "sidebar-14", importPath: "@/components/blocks/sidebar/sidebar-14", category: "blocks", detail: BLOCK_DETAILS["sidebar-14"] },
	{ name: "Sidebar 15", slug: "sidebar-15", importPath: "@/components/blocks/sidebar/sidebar-15", category: "blocks", detail: BLOCK_DETAILS["sidebar-15"] },
	{ name: "Sidebar 16", slug: "sidebar-16", importPath: "@/components/blocks/sidebar/sidebar-16", category: "blocks", detail: BLOCK_DETAILS["sidebar-16"] },
	blockComponent("sidebar-rail", "Sidebar Rail"),
	{ name: "Signup 01", slug: "signup-01", importPath: "@/components/blocks/signup/signup-01", category: "blocks", detail: BLOCK_DETAILS["signup-01"] },
	{ name: "Signup 02", slug: "signup-02", importPath: "@/components/blocks/signup/signup-02", category: "blocks", detail: BLOCK_DETAILS["signup-02"] },
	{ name: "Signup 03", slug: "signup-03", importPath: "@/components/blocks/signup/signup-03", category: "blocks", detail: BLOCK_DETAILS["signup-03"] },
	{ name: "Signup 04", slug: "signup-04", importPath: "@/components/blocks/signup/signup-04", category: "blocks", detail: BLOCK_DETAILS["signup-04"] },
	{ name: "Signup 05", slug: "signup-05", importPath: "@/components/blocks/signup/signup-05", category: "blocks", detail: BLOCK_DETAILS["signup-05"] },
	blockComponent("top-navigation", "Top Navigation"),
	blockComponent("terminal-switch", "Terminal Switch"),
	blockComponent("work-item-widget", "Work Item Widget"),
	blockComponent("work-item-detail", "Work Item Detail"),
	blockComponent("workflow", "Workflow"),
] as const;

export const PROJECT_COMPONENTS: ComponentEntry[] = [
	{ ...projectComponent("make", "Make"), importPath: "@/components/projects/make" },
	projectComponent("sidebar-chat", "Sidebar Chat"),
	projectComponent("confluence", "Confluence Editor"),
	projectComponent("jira", "Jira Board"),
	projectComponent("fullscreen-chat", "Fullscreen Chat"),
	projectComponent("future-chat", "Future Chat"),
	projectComponent("search", "Search Results"),
] as const;

export const UTILITY_COMPONENTS: ComponentEntry[] = [
	{ name: "Agent Browser", slug: "agent-browser", importPath: "@/components/website/demos/utils/agent-browser", category: "utility", detail: UTILITY_DETAILS["agent-browser"] },
	utilityComponent("gui", "GUI"),
	utilityComponent("image-generation", "Image Generation"),
	utilityComponent("multiports", "Multiports"),
	utilityComponent("sound-generation", "Sound Generation"),
	utilityComponent("streamdown", "Streamdown"),
	utilityComponent("tools-invocation", "Tools Invocation"),
	utilityComponent("ui-generation", "UI Generation"),
	utilityComponent("visual-json", "Visual JSON"),
] as const;

export const VISUAL_COMPONENTS: ComponentEntry[] = [
	visualComponent("typography", "Typography", "@/lib/tokens"),
	visualComponent("color", "Color", "@/app/tailwind-theme.css\n@/app/shadcn-theme.css"),
	visualComponent("shadow", "Shadow", "@/lib/tokens"),
] as const;

const ALL_COMPONENTS = [...AUDIO_COMPONENTS, ...AI_COMPONENTS, ...UI_COMPONENTS, ...BLOCK_COMPONENTS, ...PROJECT_COMPONENTS, ...UTILITY_COMPONENTS, ...VISUAL_COMPONENTS];

export function findComponent(category: string, slug: string): ComponentEntry | undefined {
	return ALL_COMPONENTS.find((c) => c.category === category && c.slug === slug);
}

export function getAllComponents(): ComponentEntry[] {
	return ALL_COMPONENTS;
}
