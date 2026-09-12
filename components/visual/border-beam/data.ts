import type {
	BorderBeamColorVariant,
	BorderBeamSize,
	BorderBeamTheme,
} from "border-beam";

export type BorderBeamFamily = "rotate" | "pulse";

export interface BorderBeamDemoConfig {
	family: BorderBeamFamily;
	size: BorderBeamSize;
	colorVariant: BorderBeamColorVariant;
	theme: BorderBeamTheme;
	staticColors: boolean;
	active: boolean;
	duration: number;
	autoBorderRadius: boolean;
	borderRadius: number;
	brightness: number;
	saturation: number;
	hueRange: number;
	strength: number;
}

export const BORDER_BEAM_FAMILY_OPTIONS: readonly { value: BorderBeamFamily; label: string }[] = [
	{ value: "rotate", label: "Rotate" },
	{ value: "pulse", label: "Pulse" },
];

export const BORDER_BEAM_SIZE_OPTIONS: readonly { value: BorderBeamSize; label: string }[] = [
	{ value: "md", label: "Large" },
	{ value: "sm", label: "Small" },
	{ value: "line", label: "Line" },
	{ value: "pulse-inner", label: "Pulse Inner" },
	{ value: "pulse-outside", label: "Pulse Outside" },
];

export const BORDER_BEAM_ROTATE_SIZE_OPTIONS: readonly { value: BorderBeamSize; label: string }[] = [
	{ value: "md", label: "Large" },
	{ value: "sm", label: "Small" },
	{ value: "line", label: "Line" },
];

export const BORDER_BEAM_PULSE_SIZE_OPTIONS: readonly { value: BorderBeamSize; label: string }[] = [
	{ value: "pulse-inner", label: "Inner" },
	{ value: "pulse-outside", label: "Outside" },
];

export const BORDER_BEAM_COLOR_VARIANT_OPTIONS: readonly {
	value: BorderBeamColorVariant;
	label: string;
}[] = [
	{ value: "colorful", label: "Colorful" },
	{ value: "mono", label: "Mono" },
	{ value: "ocean", label: "Ocean" },
	{ value: "sunset", label: "Sunset" },
];

export const BORDER_BEAM_THEME_OPTIONS: readonly { value: BorderBeamTheme; label: string }[] = [
	{ value: "dark", label: "Dark" },
	{ value: "light", label: "Light" },
	{ value: "auto", label: "Auto" },
];

export const BORDER_BEAM_DEFAULTS: BorderBeamDemoConfig = {
	family: "rotate",
	size: "md",
	colorVariant: "colorful",
	theme: "auto",
	staticColors: false,
	active: true,
	duration: 1.96,
	autoBorderRadius: true,
	borderRadius: 16,
	brightness: 1.3,
	saturation: 1.2,
	hueRange: 30,
	strength: 0.7,
};

export const BORDER_BEAM_SIZE_DEFAULTS: Record<BorderBeamSize, Pick<BorderBeamDemoConfig, "family" | "duration" | "borderRadius" | "brightness" | "saturation">> = {
	md: {
		family: "rotate",
		duration: 1.96,
		borderRadius: 16,
		brightness: 1.3,
		saturation: 1.2,
	},
	sm: {
		family: "rotate",
		duration: 1.96,
		borderRadius: 32,
		brightness: 1.3,
		saturation: 1.2,
	},
	line: {
		family: "rotate",
		duration: 3.1,
		borderRadius: 20,
		brightness: 1.3,
		saturation: 1.2,
	},
	"pulse-inner": {
		family: "pulse",
		duration: 2.3,
		borderRadius: 16,
		brightness: 0.75,
		saturation: 1.2,
	},
	"pulse-outside": {
		family: "pulse",
		duration: 2.3,
		borderRadius: 16,
		brightness: 1.9,
		saturation: 1.2,
	},
};

export const BORDER_BEAM_CONTROL_RANGES = {
	duration: { min: 0.5, max: 8, step: 0.05, unit: "s" },
	borderRadius: { min: 0, max: 48, step: 1, unit: "px" },
	brightness: { min: 0.2, max: 3, step: 0.05 },
	saturation: { min: 0, max: 3, step: 0.05 },
	hueRange: { min: 0, max: 180, step: 1, unit: "deg" },
	strength: { min: 0, max: 1, step: 0.01 },
} as const;

export function getBorderBeamSizeOptions(family: BorderBeamFamily): readonly { value: BorderBeamSize; label: string }[] {
	return family === "pulse" ? BORDER_BEAM_PULSE_SIZE_OPTIONS : BORDER_BEAM_ROTATE_SIZE_OPTIONS;
}

export function getBorderBeamDefaultsForSize(size: BorderBeamSize): BorderBeamDemoConfig {
	return {
		...BORDER_BEAM_DEFAULTS,
		...BORDER_BEAM_SIZE_DEFAULTS[size],
		size,
	};
}
