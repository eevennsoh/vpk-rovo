export interface NeuralGraphColorTokenOption {
	aliases?: readonly string[];
	label: string;
	lightHex: string;
	token: string;
	value: string;
}

export const NEURAL_GRAPH_COLOR_TOKEN_OPTIONS = [
	{
		label: "Default icon",
		lightHex: "#292A2E",
		token: "color.icon",
		value: "var(--ds-icon)",
		aliases: ["#172B4D"],
	},
	{
		label: "Red icon accent",
		lightHex: "#C9372C",
		token: "color.icon.accent.red",
		value: "var(--ds-icon-accent-red)",
	},
	{
		label: "Orange icon accent",
		lightHex: "#E06C00",
		token: "color.icon.accent.orange",
		value: "var(--ds-icon-accent-orange)",
		aliases: ["#FCA700", "var(--ds-background-accent-orange-subtle)"],
	},
	{
		label: "Yellow icon accent",
		lightHex: "#B38600",
		token: "color.icon.accent.yellow",
		value: "var(--ds-icon-accent-yellow)",
	},
	{
		label: "Lime icon accent",
		lightHex: "#6A9A23",
		token: "color.icon.accent.lime",
		value: "var(--ds-icon-accent-lime)",
		aliases: ["var(--ds-chart-lime-bold)"],
	},
	{
		label: "Green icon accent",
		lightHex: "#22A06B",
		token: "color.icon.accent.green",
		value: "var(--ds-icon-accent-green)",
	},
	{
		label: "Teal icon accent",
		lightHex: "#2898BD",
		token: "color.icon.accent.teal",
		value: "var(--ds-icon-accent-teal)",
	},
	{
		label: "Blue icon accent",
		lightHex: "#357DE8",
		token: "color.icon.accent.blue",
		value: "var(--ds-icon-accent-blue)",
		aliases: ["#1868DB", "var(--ds-background-accent-blue-bolder)"],
	},
	{
		label: "Purple icon accent",
		lightHex: "#AF59E1",
		token: "color.icon.accent.purple",
		value: "var(--ds-icon-accent-purple)",
		aliases: ["#6B5CE7", "var(--ds-chart-purple-bolder)"],
	},
	{
		label: "Magenta icon accent",
		lightHex: "#CD519D",
		token: "color.icon.accent.magenta",
		value: "var(--ds-icon-accent-magenta)",
	},
	{
		label: "Gray icon accent",
		lightHex: "#7D818A",
		token: "color.icon.accent.gray",
		value: "var(--ds-icon-accent-gray)",
		aliases: [
			"#44546F",
			"#4B4D51",
			"#505258",
			"#8590A2",
			"#8C8F97",
			"var(--ds-chart-gray-bold)",
			"var(--ds-chart-gray-boldest)",
			"var(--ds-text-subtle)",
		],
	},
] as const satisfies ReadonlyArray<NeuralGraphColorTokenOption>;

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const CSS_VAR_PATTERN = /^var\(\s*(--[a-zA-Z0-9-_]+)\s*(?:,\s*([^)]+))?\)$/;
const RGB_COLOR_PATTERN = /^rgba?\(\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)\s*,\s*(\d+(?:\.\d+)?)/i;

function getTokenAliases(option: NeuralGraphColorTokenOption): readonly string[] {
	return option.aliases ?? [];
}

const TOKEN_OPTION_BY_VALUE = new Map<string, NeuralGraphColorTokenOption>(
	NEURAL_GRAPH_COLOR_TOKEN_OPTIONS.map((option) => [normalizeColor(option.value), option]),
);

const TOKEN_OPTION_BY_HEX = new Map<string, NeuralGraphColorTokenOption>(
	NEURAL_GRAPH_COLOR_TOKEN_OPTIONS.flatMap((option) => [
		[normalizeColor(option.lightHex), option],
		...getTokenAliases(option).map((alias) => [normalizeColor(alias), option] as const),
	]),
);

const TOKEN_VALUE_BY_HEX = new Map<string, string>(
	NEURAL_GRAPH_COLOR_TOKEN_OPTIONS.flatMap((option) => [
		[normalizeColor(option.lightHex), option.value],
		...getTokenAliases(option).map((alias) => [normalizeColor(alias), option.value] as const),
	]),
);

function normalizeColor(value: string): string {
	return value.trim().toLowerCase();
}

export function isNeuralGraphHexColor(value: unknown): boolean {
	return typeof value === "string" && HEX_COLOR_PATTERN.test(value.trim());
}

export function isNeuralGraphCssVariableColor(value: unknown): boolean {
	return typeof value === "string" && CSS_VAR_PATTERN.test(value.trim());
}

export function isNeuralGraphColorValue(value: unknown): value is string {
	return typeof value === "string" && (isNeuralGraphHexColor(value) || isNeuralGraphCssVariableColor(value));
}

export function getNeuralGraphColorTokenOption(value: unknown): NeuralGraphColorTokenOption | null {
	if (typeof value !== "string") return null;
	const normalized = normalizeColor(value);
	return TOKEN_OPTION_BY_VALUE.get(normalized) ?? TOKEN_OPTION_BY_HEX.get(normalized) ?? null;
}

export function normalizeNeuralGraphColorValue(value: unknown, fallback: string): string {
	if (typeof value !== "string") return fallback;
	const trimmed = value.trim();
	const tokenValue = TOKEN_VALUE_BY_HEX.get(normalizeColor(trimmed));
	if (tokenValue) return tokenValue;
	return isNeuralGraphColorValue(trimmed) ? trimmed : fallback;
}

export function getNeuralGraphColorFallback(value: string): string {
	if (isNeuralGraphHexColor(value)) return value;
	const token = TOKEN_OPTION_BY_VALUE.get(normalizeColor(value));
	if (token) return token.lightHex;
	const fallback = value.trim().match(CSS_VAR_PATTERN)?.[2]?.trim();
	return fallback && isNeuralGraphHexColor(fallback) ? fallback : "#000000";
}

function resolveCssVariableValue(value: string, styles: CSSStyleDeclaration, seen = new Set<string>()): string | null {
	const match = value.trim().match(CSS_VAR_PATTERN);
	if (!match) return value.trim();
	const [, variableName, fallback] = match;
	if (seen.has(variableName)) return fallback?.trim() ?? null;
	seen.add(variableName);

	const resolved = styles.getPropertyValue(variableName).trim();
	if (!resolved) return fallback?.trim() ?? null;
	if (CSS_VAR_PATTERN.test(resolved)) {
		return resolveCssVariableValue(resolved, styles, seen);
	}
	return resolved;
}

export function resolveNeuralGraphCssColorValue(value: string, root?: Element | null): string {
	if (isNeuralGraphHexColor(value) || RGB_COLOR_PATTERN.test(value.trim())) {
		return value;
	}

	const fallback = getNeuralGraphColorFallback(value);
	const target = root ?? globalThis.document?.documentElement;
	if (!target || !globalThis.getComputedStyle) return fallback;

	const resolved = resolveCssVariableValue(value, globalThis.getComputedStyle(target));
	return resolved && resolved.length > 0 ? resolved : fallback;
}
