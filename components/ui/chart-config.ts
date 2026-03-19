import type { ComponentType, ReactNode } from "react";

export const CHART_THEMES = {
	light: "",
	dark: ".dark",
} as const;

type ChartThemeName = keyof typeof CHART_THEMES;

export type ChartConfigItem = {
	label?: ReactNode;
	icon?: ComponentType;
	color?: string;
	theme?: Partial<Record<ChartThemeName, string>>;
};

export type ChartConfig = Record<string, ChartConfigItem>;

function isObjectRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeThemeRecord(
	value: unknown,
): Partial<Record<ChartThemeName, string>> | undefined {
	if (!isObjectRecord(value)) {
		return undefined;
	}

	const result: Partial<Record<ChartThemeName, string>> = {};
	for (const themeName of Object.keys(CHART_THEMES) as ChartThemeName[]) {
		const themeValue = value[themeName];
		if (typeof themeValue === "string" && themeValue.trim().length > 0) {
			result[themeName] = themeValue;
		}
	}

	return Object.keys(result).length > 0 ? result : undefined;
}

export function getChartColorConfigEntries(
	config: unknown,
): Array<[string, ChartConfigItem]> {
	if (!isObjectRecord(config)) {
		return [];
	}

	const entries: Array<[string, ChartConfigItem]> = [];
	for (const [key, rawItem] of Object.entries(config)) {
		if (!isObjectRecord(rawItem)) {
			continue;
		}

		const color =
			typeof rawItem.color === "string" && rawItem.color.trim().length > 0
				? rawItem.color
				: undefined;
		const theme = normalizeThemeRecord(rawItem.theme);
		if (!color && !theme) {
			continue;
		}

		entries.push([
			key,
			{
				label: rawItem.label as ReactNode,
				icon: rawItem.icon as ComponentType | undefined,
				...(color ? { color } : {}),
				...(theme ? { theme } : {}),
			},
		]);
	}

	return entries;
}
