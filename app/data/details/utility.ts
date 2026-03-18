import type { ComponentDetail } from "@/app/data/component-detail-types";

export const UTILITY_DETAILS: Record<string, ComponentDetail> = {
	"agent-browser": {
		description:
			"An AI-assisted browser workspace for VPK. Binds chat actions to a dedicated embedded browser workspace with real tabs, live preview streaming, accessibility snapshots, and an explicit fullscreen preview route.",
		demoLayout: { previewContentWidth: "full" },
	},
	gui: {
		description:
			"A reusable compound component for building interactive animation and parameter control panels. Includes a slider/input control row (GUI.Control) and a card wrapper with copy-values button (GUI.Panel). Used by Shimmer and Generative Card demo pages.",
		demoLayout: { previewContentWidth: "full" },
		usage: `import { GUI } from "@/components/utils/gui";

<GUI.Panel title="Controls" values={config}>
  <GUI.Control
    id="my-param"
    label="Duration"
    description="How long the animation takes."
    value={duration}
    min={0.1}
    max={3}
    step={0.05}
    unit="s"
    onChange={setDuration}
  />
</GUI.Panel>`,
		props: [
			{ name: "id", type: "string", description: "Unique identifier for the control. Used to generate input element IDs." },
			{ name: "label", type: "string", description: "Display label shown next to the input." },
			{ name: "description", type: "string", description: "Optional helper text below the label." },
			{ name: "value", type: "number", description: "Current numeric value." },
			{ name: "defaultValue", type: "number", description: "Optional default value. When provided, shows an undo button that resets to this value." },
			{ name: "min", type: "number", description: "Minimum value for the slider range." },
			{ name: "max", type: "number", description: "Maximum value for the slider range." },
			{ name: "step", type: "number", description: "Step increment for the slider. Also determines decimal precision in the readout." },
			{ name: "unit", type: "string", description: "Optional unit label displayed after the input (e.g. \"px\", \"s\", \"deg\")." },
			{ name: "onChange", type: "(next: number) => void", description: "Callback fired when the value changes via input or slider." },
		],
		subComponents: [
			{ name: "GUI.Control", description: "A single parameter row with label, undo button, number input, slider, and min/max range labels." },
			{ name: "GUI.Panel", description: "Collapsible card wrapper with a title, copy-values button, chevron toggle, and content area for controls." },
		],
	},
	"streamdown": {
		description: "A streaming-optimized React Markdown renderer with syntax highlighting, Mermaid diagrams, math rendering, and CJK support. The demo showcases the current animated streaming API, line numbers, link-safety handling, custom HTML tags, normalized HTML indentation, and both streaming and static rendering modes.",
	},
	"multiports": {
		description: "A concurrent chat testing surface that renders three independent Sidebar Chat panels side by side. Supports Tab key navigation between panels for multi-stream validation.",
	},
	"image-generation": {
		description: "An interactive test harness for image generation via AI Gateway. Sends prompts to /api/chat-sdk with provider: \"google\", streams SSE responses, and displays both text and generated images with download support. Configure AI_GATEWAY_URL_GOOGLE (preferred), or use a Google/Gemini AI_GATEWAY_URL, to enable native image generation.",
	},
	"sound-generation": {
		description: "An interactive text-to-speech harness that posts text input to /api/sound-generation, synthesizes voice output with tts-latest, and returns playable downloadable audio.",
	},
	"ui-generation": {
		description: "A client-side showcase of json-render, rendering structured JSON specs into live UI with data dashboards, interactive forms, chart visualizations, and 3D scenes powered by React Three Fiber.",
		demoLayout: { previewContentWidth: "full" },
	},
	"tools-invocation": {
		description:
			"A simulated chat interface demonstrating real-time AI agent tool invocations with permission control. Shows tool calls with expandable arguments, results, Allow/Deny permission flows, and various tool states (running, completed, denied, error). Inspired by streaming agent architectures.",
		demoLayout: { previewContentWidth: "full" },
	},
	"visual-json": {
		description: "A schema-aware, embeddable visual JSON editor by Vercel Labs. Provides tree navigation, form editing, diff comparison, search, drag-and-drop reordering, and keyboard navigation for inspecting and editing JSON data.",
		demoLayout: { previewContentWidth: "full" },
		usage: `import { JsonEditor, DiffView, VisualJson, TreeView, FormView } from "@visual-json/react";

// All-in-one editor
<JsonEditor value={data} onChange={setData} schema={schema} height={500} />

// Composable: provider + views
<VisualJson value={data} onChange={setData} schema={schema}>
  <TreeView />
  <FormView />
</VisualJson>

// Diff comparison
<DiffView originalJson={original} currentJson={edited} />`,
	},
};
