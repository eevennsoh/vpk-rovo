import type { ComponentDetail } from "@/app/data/component-detail-types";

export const REASONING_DETAIL: ComponentDetail = {
	description:
		"A collapsible reasoning/thinking indicator that auto-opens when streaming begins and auto-closes when complete. Triggers use AnimatedRovo (bouncy in thinking mode, calm in streaming mode), shimmer text, and animated color dots (optional). Pass streaming to the trigger to settle the AnimatedRovo while the inner color wheel keeps spinning.",
	usage: `import {
  Reasoning,
  ReasoningContent,
  AdsReasoningTrigger,
} from "@/components/ui-custom/reasoning";

// Thinking state — AnimatedRovo bounces
<Reasoning isStreaming={isStreaming}>
  <AdsReasoningTrigger />
  <ReasoningContent>{reasoningText}</ReasoningContent>
</Reasoning>

// Streaming state — AnimatedRovo settles, only inner wheel spins
<Reasoning isStreaming={isStreaming}>
  <AdsReasoningTrigger streaming />
  <ReasoningContent>{reasoningText}</ReasoningContent>
</Reasoning>`,
	props: [
		{
			name: "isStreaming",
			type: "boolean",
			default: "false",
			description: "Whether reasoning content is actively streaming. Controls auto-open/close behavior.",
		},
		{
			name: "streamingWave",
			type: "boolean",
			default: "false",
			description: "Render the label with ShimmerWave (per-character wave) instead of Shimmer (gradient sweep) while streaming. When false, uses the sweep.",
		},
		{
			name: "streamingWaveGradientColor",
			type: "string | string[]",
			description: "Optional wave highlight color (or color stops) forwarded to Shimmer when streamingWave is enabled.",
		},
		{
			name: "streamingWaveDuration",
			type: "number",
			description: "Optional wave duration override (seconds) forwarded to Shimmer while streaming.",
		},
		{
			name: "streamingWaveSpread",
			type: "number",
			description: "Optional wave spread override forwarded to Shimmer while streaming.",
		},
		{
			name: "animatedDots",
			type: "boolean",
			default: "true",
			description: "Show animated color dots after the streaming label. Set false to render label text only.",
		},
		{
			name: "open",
			type: "boolean",
			description: "Controlled open state of the collapsible.",
		},
		{
			name: "defaultOpen",
			type: "boolean",
			description: "Initial open state. Defaults to the value of isStreaming. Set to false to prevent auto-open.",
		},
		{
			name: "onOpenChange",
			type: "(open: boolean) => void",
			description: "Callback when the open state changes.",
		},
		{
			name: "duration",
			type: "number",
			description: "Thinking duration in seconds. Auto-computed from streaming start/stop when not provided.",
		},
	],
		subComponents: [
			{ name: "ReasoningTrigger", description: "Default trigger with Rovo logo, shimmer text, optional animated color dots, and chevron." },
			{ name: "AdsReasoningTrigger", description: "ADS-styled trigger with Rovo logo, shimmer text, optional animated color dots, and optional chevron." },
			{ name: "ReasoningContent", description: "Collapsible content area that shows timeline entries and renders non-timeline text as raw markdown source inside CodeBlock." },
		],
		examples: [
			{ title: "Preload", description: "Immediate feedback on query submission with bouncy AnimatedRovo, gradient wave shimmer, and a plain \"Working\" label.", demoSlug: "reasoning-demo-preload" },
			{ title: "Thinking", description: "Active processing state — calm AnimatedRovo with chevron and expanded tool call timeline.", demoSlug: "reasoning-demo-thinking" },
			{ title: "Completed", description: "Completed state showing duration and static Rovo icon.", demoSlug: "reasoning-demo-completed" },
		],
};
