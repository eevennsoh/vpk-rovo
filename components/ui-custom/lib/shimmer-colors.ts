const DEFAULT_SHIMMER_HIGHLIGHT_COLOR = "var(--color-background)";
const MAX_RGB_CHANNEL = 255;
const HEX_SHORT_LENGTH = 4;
const HEX_LONG_LENGTH = 7;

type RGBColor = {
	r: number;
	g: number;
	b: number;
};

function parseHexColor(color: string): RGBColor | null {
	if (color.length === HEX_SHORT_LENGTH) {
		const r = parseInt(color[1] + color[1], 16);
		const g = parseInt(color[2] + color[2], 16);
		const b = parseInt(color[3] + color[3], 16);
		if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
			return null;
		}
		return { r, g, b };
	}
	if (color.length === HEX_LONG_LENGTH) {
		const r = parseInt(color.slice(1, 3), 16);
		const g = parseInt(color.slice(3, 5), 16);
		const b = parseInt(color.slice(5, 7), 16);
		if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
			return null;
		}
		return { r, g, b };
	}
	return null;
}

function parseRgbColor(color: string): RGBColor | null {
	const rgbMatch = color.match(
		/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*[\d.]+\s*)?\)$/i
	);
	if (!rgbMatch) {
		return null;
	}
	const r = Number.parseFloat(rgbMatch[1]);
	const g = Number.parseFloat(rgbMatch[2]);
	const b = Number.parseFloat(rgbMatch[3]);
	if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
		return null;
	}
	return {
		r: Math.max(0, Math.min(255, Math.round(r))),
		g: Math.max(0, Math.min(255, Math.round(g))),
		b: Math.max(0, Math.min(255, Math.round(b))),
	};
}

export function parseColor(color: unknown): RGBColor | null {
	if (typeof color !== "string") {
		return null;
	}

	const normalizedColor = color.trim();
	if (normalizedColor.startsWith("#")) {
		return parseHexColor(normalizedColor);
	}
	if (normalizedColor.toLowerCase().startsWith("rgb")) {
		return parseRgbColor(normalizedColor);
	}
	return null;
}

function smoothStep(value: number): number {
	const clamped = Math.max(0, Math.min(1, value));
	return clamped * clamped * (3 - 2 * clamped);
}

function srgbChannelToLinear(channel: number): number {
	const normalized = channel / MAX_RGB_CHANNEL;
	if (normalized <= 0.04045) {
		return normalized / 12.92;
	}
	return Math.pow((normalized + 0.055) / 1.055, 2.4);
}

function linearChannelToSrgb(channel: number): number {
	const normalized =
		channel <= 0.0031308
			? channel * 12.92
			: 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
	return Math.max(0, Math.min(1, normalized)) * MAX_RGB_CHANNEL;
}

function mixColors(left: RGBColor, right: RGBColor, ratio: number): string {
	const easedRatio = smoothStep(ratio);
	const leftLinear = {
		r: srgbChannelToLinear(left.r),
		g: srgbChannelToLinear(left.g),
		b: srgbChannelToLinear(left.b),
	};
	const rightLinear = {
		r: srgbChannelToLinear(right.r),
		g: srgbChannelToLinear(right.g),
		b: srgbChannelToLinear(right.b),
	};
	const mixedLinear = {
		r: leftLinear.r + (rightLinear.r - leftLinear.r) * easedRatio,
		g: leftLinear.g + (rightLinear.g - leftLinear.g) * easedRatio,
		b: leftLinear.b + (rightLinear.b - leftLinear.b) * easedRatio,
	};
	const r = Math.round(linearChannelToSrgb(mixedLinear.r));
	const g = Math.round(linearChannelToSrgb(mixedLinear.g));
	const b = Math.round(linearChannelToSrgb(mixedLinear.b));
	return `rgb(${r}, ${g}, ${b})`;
}

function normalizeGradientPalette(
	baseGradientColor: readonly unknown[]
): string[] {
	return baseGradientColor.flatMap((value) => {
		if (typeof value !== "string") {
			return [];
		}

		const normalizedValue = value.trim();
		return normalizedValue.length > 0 ? [normalizedValue] : [];
	});
}

export function resolveWaveHighlightColor(
	baseGradientColor: string | readonly unknown[] | undefined,
	index: number,
	totalCharacters: number
): string {
	if (Array.isArray(baseGradientColor)) {
		const palette = normalizeGradientPalette(baseGradientColor);
		if (palette.length === 1) {
			return palette[0];
		}
		if (palette.length > 1) {
			const ratio =
				totalCharacters <= 1 ? 0 : index / Math.max(totalCharacters - 1, 1);
			const scaledPosition = ratio * (palette.length - 1);
			const leftIndex = Math.floor(scaledPosition);
			const rightIndex = Math.min(leftIndex + 1, palette.length - 1);
			const mixRatio = scaledPosition - leftIndex;
			const leftColor = palette[leftIndex];
			const rightColor = palette[rightIndex];
			if (leftIndex === rightIndex || mixRatio <= 0) {
				return leftColor;
			}
			if (mixRatio >= 1) {
				return rightColor;
			}
			const parsedLeft = parseColor(leftColor);
			const parsedRight = parseColor(rightColor);
			if (parsedLeft && parsedRight) {
				return mixColors(parsedLeft, parsedRight, mixRatio);
			}
			return mixRatio < 0.5 ? leftColor : rightColor;
		}
	}

	if (typeof baseGradientColor === "string") {
		const normalizedGradientColor = baseGradientColor.trim();
		if (normalizedGradientColor.length > 0) {
			return normalizedGradientColor;
		}
	}

	return DEFAULT_SHIMMER_HIGHLIGHT_COLOR;
}

export { DEFAULT_SHIMMER_HIGHLIGHT_COLOR };
