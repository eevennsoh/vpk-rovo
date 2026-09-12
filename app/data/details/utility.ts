import type { ComponentDetail } from "@/app/data/component-detail-types";

export const UTILITY_DETAILS: Record<string, ComponentDetail> = {
	"cone-safezone": {
		apiName: "ConeSafezone",
		description: "Keeps hover previews open while the pointer travels diagonally between a trigger and a card, in either direction. Nested previews hold their parent open until the pointer leaves the whole interaction. Built on the shared HoverCard primitive, with a 300 ms pause allowance inside the cone.",
		importStatement: 'import { ConeSafezone, ConeSafezoneTrigger, ConeSafezoneContent } from "@/components/utils/cone-safezone";',
		demoLayout: { previewContentWidth: "full", examplesContentWidth: "full" },
		usage: `import { ConeSafezone, ConeSafezoneTrigger, ConeSafezoneContent } from "@/components/utils/cone-safezone";
import { Button } from "@/components/ui/button";

<ConeSafezone openDelay={120} closeDelay={80} graceMs={300}>
	<ConeSafezoneTrigger render={<Button variant="outline" />}>
		Hover session
	</ConeSafezoneTrigger>
	<ConeSafezoneContent side="right" sideOffset={8}>
		<p>Session details</p>
		<ConeSafezone>
			<ConeSafezoneTrigger render={<Button variant="link" />}>
				Preview artifact
			</ConeSafezoneTrigger>
			<ConeSafezoneContent side="right">
				<p>The parent stays open while you visit this card.</p>
			</ConeSafezoneContent>
		</ConeSafezone>
	</ConeSafezoneContent>
</ConeSafezone>`,
		examples: [
			{ title: "Placement", description: "Try physical and logical sides in either reading direction. Left starts open. The cone follows the final popup position after collision handling and protects the return journey too.", demoSlug: "cone-safezone-placement" },
			{ title: "Controlled state", description: "Starts open with externally controlled state. Dismiss explicitly and allow a longer pause. Keyboard focus and Escape continue to work.", demoSlug: "cone-safezone-controlled" },
		],
		props: [
			{ name: "graceMs", type: "number", default: "300", description: "Pause allowance inside the cone, renewed by pointer movement. Moving out of the cone uses normal dismissal." },
			{ name: "debug", type: "boolean", default: "false", description: "Keeps the cursor-to-destination cone visible while the preview is open, following pointer movement and popup positioning without intercepting input. Nested roots inherit the setting unless overridden." },
			{ name: "open / defaultOpen", type: "boolean", description: "Controlled or initial open state, matching HoverCard." },
			{ name: "onOpenChange", type: "(open, details) => void", description: "Called for accepted open-state requests. Cancel through details.cancel() to keep the current state." },
			{ name: "openDelay / closeDelay", type: "number", description: "Normal hover delays, passed to the shared HoverCard trigger." },
			{ name: "handle", type: "HoverCardHandle<Payload>", description: "Optional handle for detached triggers and shared payload viewports. Create one with createConeSafezoneHandle()." },
		],
		subComponents: [
			{ name: "ConeSafezoneTrigger", description: "Shared HoverCard trigger. Supports render, payload, and detached handles." },
			{ name: "ConeSafezoneContent", description: "Shared portalled HoverCard content with cone tracking and nested retention. Supports side, align, offsets, and refs." },
			{ name: "ConeSafezoneViewport", description: "Shared HoverCard viewport for switching content between detached triggers." },
		],
	},
	"agent-browser": {
		description:
			"An AI-assisted browser workspace for VPK. Binds chat actions to a dedicated embedded browser workspace with real tabs, live preview streaming, accessibility snapshots, and an explicit fullscreen preview route.",
		demoLayout: { previewContentWidth: "full" },
	},
	gui: {
		description:
			"A reusable compound component for building dense animation and visual parameter panels. It owns numeric sliders, normalized percentages, toggles, selects, text, color inputs, editable color lists, RGBA tuple editors, local image/SVG uploads, swatch groups, segmented playback controls, sections, panel actions, and mounted value-key copy filtering.",
		demoLayout: {
			previewContentWidth: "full",
			examplesContentWidth: "full",
		},
		usage: `import { GUI } from "@/components/utils/gui";

<GUI.Panel title="Controls" values={config} onPlay={replay}>
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
    valueKeys="duration"
  />
  <GUI.ColorInput
    id="accent"
    label="Accent"
    value={accent}
    defaultValue="#357DE8"
    onChange={setAccent}
    valueKeys="accent"
  />
</GUI.Panel>`,
		examples: [
			{
				title: "Full config",
				description: "Kitchen-sink panel exercising every shared GUI control type plus optional config paths: descriptions, resets, disabled states, sticky selects, image labels, swatch shapes, mounted value keys, section defaults, and panel actions.",
				demoSlug: "gui-demo-full-config",
			},
		],
		props: [
			{ name: "id", type: "string", description: "Unique control identifier used to generate input, select, and upload element IDs." },
			{ name: "label", type: "string", description: "Compact label shown with the control." },
			{ name: "description", type: "string", description: "Optional helper text for controls that need extra context." },
			{ name: "value / checked", type: "number | string | boolean | string[] | [r,g,b,a]", description: "Current value shape for the specific control." },
			{ name: "defaultValue", type: "number | string | string[] | [r,g,b,a]", description: "Optional reset target. Controls with defaults show a reset action." },
			{ name: "onChange", type: "(next) => void", description: "Callback fired when the control commits a value change." },
			{ name: "valueKeys", type: "string | readonly string[]", description: "Registers mounted controls with GUI.Panel so copy-values includes only visible keys when any keys are registered." },
			{ name: "useGUIValueKeys", type: "(valueKeys?: string | readonly string[]) => void", description: "Hook for custom GUI-adjacent controls that need to participate in mounted value-key copy filtering." },
		],
		subComponents: [
			{ name: "GUI.Panel", description: "Collapsible wrapper with title, copy-values action, optional play/refresh action, chevron toggle, capped scroll area, and mounted value-key filtering." },
			{ name: "GUI.Section", description: "Collapsible section used to group related controls inside a panel." },
			{ name: "GUI.Control", description: "Numeric slider/input row with label, optional reset, min/max labels, step precision, disabled state, and unit suffix." },
			{ name: "GUI.PercentControl", description: "Normalized 0..1 numeric control displayed and edited as a percentage." },
			{ name: "GUI.Toggle", description: "Boolean switch row with optional helper text and value-key registration." },
			{ name: "GUI.Select", description: "Compact segmented select for short option sets or dropdown select for larger/enriched options. Options support swatch, description, meta text, sticky option, and default reset." },
			{ name: "GUI.SegmentedControl", description: "Compact option group for string or boolean values with optional Atlaskit icons." },
			{ name: "GUI.TextInput", description: "Small labeled text input for strings and shader text fields." },
			{ name: "GUI.ColorInput", description: "String color input for hex or CSS colors with color picker, draft buffering for partial hex input, disabled state, default reset, and value-key registration." },
			{ name: "GUI.ColorList", description: "Editable string[] color stop list with picker rows, add/remove controls, max color support, disabled state, and default reset." },
			{ name: "GUI.RgbaColorInput", description: "RGBA unit tuple editor with alpha-aware swatch, alpha slider, HEX/RGB/HSL editing, and default reset." },
			{ name: "GUI.ImageInput", description: "Local image/SVG upload control with preview, accept filtering, clear/reset hooks, object-fit options, and file adapter callback." },
			{ name: "GUI.SwatchGroup", description: "Ordered multi-select swatches with minSelected support and canonical option-order output." },
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
