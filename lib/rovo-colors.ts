export const ROVO_COLOR_SWATCHES = [
	{
		label: "blue-600",
		className: "bg-blue-600",
		cssVar: "var(--color-blue-600)",
		hex: "#1868DB",
	},
	{
		label: "orange-300",
		className: "bg-orange-300",
		cssVar: "var(--color-orange-300)",
		hex: "#FCA700",
	},
	{
		label: "purple-500",
		className: "bg-purple-500",
		cssVar: "var(--color-purple-500)",
		hex: "#AF59E1",
	},
	{
		label: "lime-400",
		className: "bg-lime-400",
		cssVar: "var(--color-lime-400)",
		hex: "#6A9A23",
	},
] as const;

export const ROVO_SHADER_COLOR_HEX = [
	ROVO_COLOR_SWATCHES[0].hex,
	ROVO_COLOR_SWATCHES[1].hex,
	ROVO_COLOR_SWATCHES[2].hex,
	ROVO_COLOR_SWATCHES[3].hex,
] as const;

export const ROVO_SHADER_TRIAD_HEX = [
	ROVO_SHADER_COLOR_HEX[0],
	ROVO_SHADER_COLOR_HEX[1],
	ROVO_SHADER_COLOR_HEX[2],
] as const;

export const ROVO_WAVEFORM_COLOR_CSS_VARS = [
	ROVO_COLOR_SWATCHES[0].cssVar,
	ROVO_COLOR_SWATCHES[1].cssVar,
	ROVO_COLOR_SWATCHES[2].cssVar,
	ROVO_COLOR_SWATCHES[3].cssVar,
] as const;
