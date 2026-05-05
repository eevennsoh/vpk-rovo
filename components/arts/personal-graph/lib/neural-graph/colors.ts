export interface NeuralGraphColorTokenOption {
	aliases?: readonly string[];
	label: string;
	lightHex: string;
	token: string;
	value: string;
}

export const NEURAL_GRAPH_COLOR_TOKEN_OPTIONS = [
	{
		label: "Text",
		lightHex: "#292A2E",
		token: "color.text",
		value: "var(--ds-text)",
		aliases: ["#172B4D"],
	},
	{
		label: "Subtle text",
		lightHex: "#505258",
		token: "color.text.subtle",
		value: "var(--ds-text-subtle)",
		aliases: ["#44546F"],
	},
	{
		label: "Gray chart",
		lightHex: "#8C8F97",
		token: "color.chart.gray.bold",
		value: "var(--ds-chart-gray-bold)",
		aliases: ["#8590A2"],
	},
	{
		label: "Strong gray chart",
		lightHex: "#505258",
		token: "color.chart.gray.boldest",
		value: "var(--ds-chart-gray-boldest)",
		aliases: ["#4B4D51"],
	},
	{
		label: "Blue accent",
		lightHex: "#1868DB",
		token: "color.background.accent.blue.bolder",
		value: "var(--ds-background-accent-blue-bolder)",
	},
	{
		label: "Orange accent",
		lightHex: "#FCA700",
		token: "color.background.accent.orange.subtle",
		value: "var(--ds-background-accent-orange-subtle)",
	},
	{
		label: "Purple chart",
		lightHex: "#AF59E1",
		token: "color.chart.purple.bolder",
		value: "var(--ds-chart-purple-bolder)",
		aliases: ["#6B5CE7"],
	},
	{
		label: "Lime chart",
		lightHex: "#6A9A23",
		token: "color.chart.lime.bold",
		value: "var(--ds-chart-lime-bold)",
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
