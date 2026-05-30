import { ROVO_SHADER_COLOR_HEX } from "@/lib/rovo-colors";

import type { SvgTraceBezier, SvgTraceShape } from "./lib";

export type SvgTraceSegmentCap = "butt" | "round" | "square";
export type SvgTraceEasingId =
	| "linear"
	| "ease"
	| "ease-in"
	| "ease-out"
	| "ease-in-out"
	| "custom"
	| "easeInSine"
	| "easeOutSine"
	| "easeInOutSine"
	| "easeInQuad"
	| "easeOutQuad"
	| "easeInOutQuad"
	| "easeInCubic"
	| "easeOutCubic"
	| "easeInOutCubic"
	| "easeInQuart"
	| "easeOutQuart"
	| "easeInOutQuart"
	| "easeInQuint"
	| "easeOutQuint"
	| "easeInOutQuint"
	| "easeInExpo"
	| "easeOutExpo"
	| "easeInOutExpo"
	| "easeInCirc"
	| "easeOutCirc"
	| "easeInOutCirc"
	| "easeInBack"
	| "easeOutBack"
	| "easeInOutBack"
	| "easeInElastic"
	| "easeOutElastic"
	| "easeInOutElastic"
	| "easeInBounce"
	| "easeOutBounce"
	| "easeInOutBounce";
export type SvgTraceMode = "window" | "draw-eat";

export type SvgTraceConfig = Readonly<{
	duration: number;
	traceLength: number;
	strokeWidth: number;
	colorStopCount: number;
	segmentCap: SvgTraceSegmentCap;
	easingId: SvgTraceEasingId;
	customBezier: SvgTraceBezier;
	traceMode: SvgTraceMode;
	loop: boolean;
	repeatCount: number;
	showOutline: boolean;
}>;

export type SvgTracePreset = SvgTraceShape;

export const SVG_TRACE_ROVO_COLORS = ROVO_SHADER_COLOR_HEX;

export const SVG_TRACE_CAP_OPTIONS: readonly { value: SvgTraceSegmentCap; label: string }[] = [
	{ value: "butt", label: "butt" },
	{ value: "round", label: "round" },
	{ value: "square", label: "square" },
];

export const SVG_TRACE_EASING_OPTIONS: readonly { value: SvgTraceEasingId; label: string }[] = [
	{ value: "linear", label: "linear" },
	{ value: "ease", label: "ease" },
	{ value: "ease-in", label: "ease-in" },
	{ value: "ease-out", label: "ease-out" },
	{ value: "ease-in-out", label: "ease-in-out" },
	{ value: "custom", label: "custom" },
	{ value: "easeInSine", label: "easeInSine" },
	{ value: "easeOutSine", label: "easeOutSine" },
	{ value: "easeInOutSine", label: "easeInOutSine" },
	{ value: "easeInQuad", label: "easeInQuad" },
	{ value: "easeOutQuad", label: "easeOutQuad" },
	{ value: "easeInOutQuad", label: "easeInOutQuad" },
	{ value: "easeInCubic", label: "easeInCubic" },
	{ value: "easeOutCubic", label: "easeOutCubic" },
	{ value: "easeInOutCubic", label: "easeInOutCubic" },
	{ value: "easeInQuart", label: "easeInQuart" },
	{ value: "easeOutQuart", label: "easeOutQuart" },
	{ value: "easeInOutQuart", label: "easeInOutQuart" },
	{ value: "easeInQuint", label: "easeInQuint" },
	{ value: "easeOutQuint", label: "easeOutQuint" },
	{ value: "easeInOutQuint", label: "easeInOutQuint" },
	{ value: "easeInExpo", label: "easeInExpo" },
	{ value: "easeOutExpo", label: "easeOutExpo" },
	{ value: "easeInOutExpo", label: "easeInOutExpo" },
	{ value: "easeInCirc", label: "easeInCirc" },
	{ value: "easeOutCirc", label: "easeOutCirc" },
	{ value: "easeInOutCirc", label: "easeInOutCirc" },
	{ value: "easeInBack", label: "easeInBack" },
	{ value: "easeOutBack", label: "easeOutBack" },
	{ value: "easeInOutBack", label: "easeInOutBack" },
	{ value: "easeInElastic", label: "easeInElastic" },
	{ value: "easeOutElastic", label: "easeOutElastic" },
	{ value: "easeInOutElastic", label: "easeInOutElastic" },
	{ value: "easeInBounce", label: "easeInBounce" },
	{ value: "easeOutBounce", label: "easeOutBounce" },
	{ value: "easeInOutBounce", label: "easeInOutBounce" },
];

export const SVG_TRACE_MODE_OPTIONS: readonly { value: SvgTraceMode; label: string }[] = [
	{ value: "window", label: "Window" },
	{ value: "draw-eat", label: "Draw/eat" },
];

export const SVG_TRACE_PRESETS: readonly SvgTracePreset[] = [
	{
		id: "dialect-loop",
		label: "Dialect loop",
		viewBox: "0 0 22 14",
		paths: [
			{
				d: "M2.8 10.2 C5.4 8.7 6.3 2.7 9.2 3.2 C12.7 3.8 9.2 12.3 12.8 11.3 C15.3 10.6 14.2 7.1 16.6 8.1 C18.4 8.8 18.2 10.8 20.5 10.3",
			},
		],
	},
	{
		id: "orbit",
		label: "Orbit",
		viewBox: "0 0 120 88",
		paths: [
			{
				d: "M25 63 C41 24 96 21 96 49 C96 73 55 79 45 60 C35 41 74 24 91 38",
			},
		],
	},
	{
		id: "switchback",
		label: "Switchback",
		viewBox: "0 0 128 80",
		paths: [
			{
				d: "M14 56 C30 18 50 18 54 44 C58 70 86 67 88 40 C90 18 111 22 116 50",
			},
		],
	},
	{
		id: "constellation",
		label: "Constellation",
		viewBox: "0 0 132 92",
		paths: [
			{ d: "M18 63 C30 30 56 24 66 48 C77 74 105 68 116 35" },
			{ d: "M28 28 C45 48 70 22 88 38 C98 47 105 56 119 57" },
		],
	},
];

export const DEFAULT_SVG_TRACE_CONFIG: SvgTraceConfig = {
	duration: 3.4,
	traceLength: 0.14,
	strokeWidth: 3,
	colorStopCount: 4,
	segmentCap: "butt",
	easingId: "linear",
	customBezier: [0.64, 0, 0.78, 0],
	traceMode: "draw-eat",
	loop: true,
	repeatCount: 1,
	showOutline: false,
};

export const DEFAULT_SVG_SOURCE = `<svg viewBox="0 0 22 14" xmlns="http://www.w3.org/2000/svg">
	<path d="${SVG_TRACE_PRESETS[0].paths[0].d}" />
</svg>`;
