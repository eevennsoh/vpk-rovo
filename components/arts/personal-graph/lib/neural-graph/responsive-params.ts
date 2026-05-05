import {
	clamp,
	clampNeuralGraphParams,
	type NeuralGraphNumberKey,
	type NeuralGraphParams,
} from "./params";

export interface ResponsivePersonalGraphViewport {
	height: number;
	width: number;
}

export const RESPONSIVE_PERSONAL_GRAPH_WIDTHS = {
	compact: 360,
	medium: 768,
	wide: 1200,
} as const;

export const RESPONSIVE_PERSONAL_GRAPH_NUMERIC_PARAM_KEYS = [
	"coneAngle",
	"labelMetaSize",
	"labelSize",
	"maxVisibleNodes",
	"nodeSize",
	"originOffset",
	"originY",
	"radiusMax",
	"radiusMin",
	"rayOpacity",
	"rayOriginY",
	"spread",
	"tiltX",
	"tiltZ",
] as const satisfies ReadonlyArray<NeuralGraphNumberKey>;

type ResponsivePersonalGraphNumberKey = (typeof RESPONSIVE_PERSONAL_GRAPH_NUMERIC_PARAM_KEYS)[number];
type ResponsivePersonalGraphNumericPreset = Pick<NeuralGraphParams, ResponsivePersonalGraphNumberKey>;

const COMPACT_PERSONAL_GRAPH_PARAMS = {
	coneAngle: 68,
	labelMetaSize: 7,
	labelSize: 10,
	maxVisibleNodes: 42,
	nodeSize: 5,
	originOffset: 0,
	originY: 0.9,
	radiusMax: 74,
	radiusMin: 42,
	rayOpacity: 0.008,
	rayOriginY: 1.08,
	spread: 290,
	tiltX: -2,
	tiltZ: -3,
} as const satisfies ResponsivePersonalGraphNumericPreset;

const MEDIUM_PERSONAL_GRAPH_PARAMS = {
	coneAngle: 82,
	labelMetaSize: 9,
	labelSize: 12,
	maxVisibleNodes: 72,
	nodeSize: 6.5,
	originOffset: 0,
	originY: 0.84,
	radiusMax: 88,
	radiusMin: 52,
	rayOpacity: 0.014,
	rayOriginY: 1.04,
	spread: 440,
	tiltX: -3,
	tiltZ: -5,
} as const satisfies ResponsivePersonalGraphNumericPreset;

function lerp(start: number, end: number, progress: number) {
	return start + (end - start) * progress;
}

function getResponsiveWidthProgress(width: number, startWidth: number, endWidth: number) {
	return clamp((width - startWidth) / Math.max(1, endWidth - startWidth), 0, 1);
}

function interpolateNumericParams({
	from,
	progress,
	to,
}: {
	from: ResponsivePersonalGraphNumericPreset;
	progress: number;
	to: ResponsivePersonalGraphNumericPreset;
}) {
	const params = {} as Record<ResponsivePersonalGraphNumberKey, number>;

	for (const key of RESPONSIVE_PERSONAL_GRAPH_NUMERIC_PARAM_KEYS) {
		params[key] = lerp(from[key], to[key], progress);
	}

	return params;
}

function pickResponsiveBaseParams(baseParams: NeuralGraphParams): ResponsivePersonalGraphNumericPreset {
	const params = {} as Record<ResponsivePersonalGraphNumberKey, number>;

	for (const key of RESPONSIVE_PERSONAL_GRAPH_NUMERIC_PARAM_KEYS) {
		params[key] = baseParams[key];
	}

	return params;
}

export function getResponsivePersonalGraphParams(
	viewport: ResponsivePersonalGraphViewport,
	baseParams: NeuralGraphParams,
) {
	const width = Math.max(1, viewport.width);
	const wideParams = pickResponsiveBaseParams(baseParams);
	const numericParams = width < RESPONSIVE_PERSONAL_GRAPH_WIDTHS.medium
		? interpolateNumericParams({
			from: COMPACT_PERSONAL_GRAPH_PARAMS,
			progress: getResponsiveWidthProgress(
				width,
				RESPONSIVE_PERSONAL_GRAPH_WIDTHS.compact,
				RESPONSIVE_PERSONAL_GRAPH_WIDTHS.medium,
			),
			to: MEDIUM_PERSONAL_GRAPH_PARAMS,
		})
		: interpolateNumericParams({
			from: MEDIUM_PERSONAL_GRAPH_PARAMS,
			progress: getResponsiveWidthProgress(
				width,
				RESPONSIVE_PERSONAL_GRAPH_WIDTHS.medium,
				RESPONSIVE_PERSONAL_GRAPH_WIDTHS.wide,
			),
			to: wideParams,
		});

	return clampNeuralGraphParams({
		...baseParams,
		...numericParams,
		showLabels: width >= 430,
		showRays: true,
	});
}

export function shouldAnimateResponsivePersonalGraphParams({
	hasMeasuredViewport,
	prefersReducedMotion,
}: {
	hasMeasuredViewport: boolean;
	prefersReducedMotion: boolean;
}) {
	return hasMeasuredViewport && !prefersReducedMotion;
}
