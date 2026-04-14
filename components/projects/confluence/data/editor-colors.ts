/**
 * Color definitions for the editor bubble menu
 * Using ADS tokens where available
 */

export interface ColorOption {
	token: string;
	value: string;
}

export const TEXT_COLORS: Record<string, ColorOption> = {
	default: { token: "color.text", value: "#172B4D" },
	blue: { token: "color.text.accent.blue.bolder", value: "#0052CC" },
	teal: { token: "color.text.accent.teal.bolder", value: "#008DA6" },
	green: { token: "color.text.accent.green.bolder", value: "#00875A" },
	yellow: { token: "color.text.accent.orange.bolder", value: "#FF8B00" },
	red: { token: "color.text.accent.red.bolder", value: "#DE350B" },
	purple: { token: "color.text.accent.purple.bolder", value: "#5E4DB2" },
	gray: { token: "color.text.subtle", value: "#6B778C" },
	blueLight: { token: "color.text.accent.blue", value: "#0065FF" },
	tealLight: { token: "color.text.accent.teal", value: "#00A3BF" },
	greenLight: { token: "color.text.accent.green", value: "#36B37E" },
	yellowLight: { token: "color.text.accent.orange", value: "#FFAB00" },
	redLight: { token: "color.text.accent.red", value: "#FF5630" },
	purpleLight: { token: "color.text.accent.purple", value: "#6554C0" },
	white: { token: "elevation.surface", value: "#FFFFFF" },
	blueSubtle: { token: "color.text.accent.blue", value: "#B3D4FF" },
	tealSubtle: { token: "color.text.accent.teal", value: "#B3F5FF" },
	greenSubtle: { token: "color.text.accent.green", value: "#ABF5D1" },
	yellowSubtle: { token: "color.text.accent.orange", value: "#FFF0B3" },
	redSubtle: { token: "color.text.accent.red", value: "#FFBDAD" },
	purpleSubtle: { token: "color.text.accent.purple", value: "#EAE6FF" },
} as const;

export const HIGHLIGHT_COLORS: Record<string, ColorOption> = {
	none: { token: "color.background.neutral.subtle", value: "transparent" },
	purple: { token: "color.background.accent.purple.subtlest", value: "#EAE6FF" },
	red: { token: "color.background.accent.red.subtlest", value: "#FFBDAD" },
	yellow: { token: "color.background.accent.yellow.subtlest", value: "#FFF0B3" },
	yellowAlt: { token: "color.background.accent.yellow.subtlest", value: "#FFF4B3" },
	green: { token: "color.background.accent.green.subtlest", value: "#D3F1A7" },
	teal: { token: "color.background.accent.teal.subtlest", value: "#B3F5FF" },
} as const;

// Fixed dropdown positions for each dropdown type
export const DROPDOWN_POSITIONS = {
	textStyle: { top: 40, left: 276 },
	bold: { top: 40, left: 324 },
	list: { top: 40, left: 356 },
	align: { top: 40, left: 404 },
	color: { top: 40, left: 440 },
} as const;
