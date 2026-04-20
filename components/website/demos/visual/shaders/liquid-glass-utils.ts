export interface LiquidGlassChannelScales {
	red: number;
	green: number;
	blue: number;
}

export interface LiquidGlassDisplacementMetrics {
	innerW: number;
	innerH: number;
	scaledRadius: number;
	edgeSize: number;
	scaledBlur: number;
}

interface LiquidGlassDisplacementImageOptions {
	width: number;
	height: number;
	borderRadius: number;
	borderWidth: number;
	brightness: number;
	blur: number;
	opacity: number;
	redGradId: string;
	blueGradId: string;
	/**
	 * Retained for backwards compatibility with callers that previously needed an
	 * id for an internal `<filter>` element. The current implementation applies
	 * the inner-rect blur via a raw CSS `filter:blur()` declaration to match the
	 * Framer reference, so this id is no longer rendered into the SVG.
	 */
	blurFilterId?: string;
}

export function getLiquidGlassDisplacementMetrics(
	width: number,
	height: number,
	borderRadius: number,
	borderWidth: number,
	blur: number,
): LiquidGlassDisplacementMetrics {
	// The displacement-map SVG is rendered at the same dimensions as the glass
	// element (Framer's approach). This keeps user-facing parameters such as
	// `borderRadius` and `displace` in raw pixels relative to the rendered
	// element, so visual intensity does not depend on element size.
	const innerW = width;
	const innerH = height;
	const minSide = Math.min(innerW, innerH);

	return {
		innerW,
		innerH,
		scaledRadius: borderRadius,
		edgeSize: minSide * (borderWidth * 0.5),
		scaledBlur: blur,
	};
}

export interface LiquidGlassChromaticOffsets {
	red?: number;
	green?: number;
	blue?: number;
}

/**
 * Combine a base displacement scale, an additive `dispersion` boost (matching
 * Framer's reference, which applies the boost uniformly to every channel —
 * not as a per-channel chromatic offset), and optional per-channel offsets
 * for chromatic-aberration-style fringes.
 */
export function buildLiquidGlassChannelScales(
	distortionScale: number,
	dispersion: number,
	offsets: LiquidGlassChromaticOffsets = {},
): LiquidGlassChannelScales {
	const base = distortionScale + dispersion;
	return {
		red: base + (offsets.red ?? 0),
		green: base + (offsets.green ?? 0),
		blue: base + (offsets.blue ?? 0),
	};
}

export function buildLiquidGlassDisplacementImageHref({
	width,
	height,
	borderRadius,
	borderWidth,
	brightness,
	blur,
	opacity,
	redGradId,
	blueGradId,
}: LiquidGlassDisplacementImageOptions): string {
	const { innerW, innerH, scaledRadius, edgeSize, scaledBlur } = getLiquidGlassDisplacementMetrics(
		width,
		height,
		borderRadius,
		borderWidth,
		blur,
	);

	// Apply the inner-rect blur as a raw CSS `filter:blur()` (Framer's approach).
	// This avoids the resolution-dependence of an internal SVG <filter>, so the
	// `displace` parameter behaves consistently across element sizes.
	const blurStyle = scaledBlur > 0 ? `filter:blur(${scaledBlur}px);` : "";
	const innerStyle = `mix-blend-mode:normal;${blurStyle}`;

	const svg = `
<svg viewBox="0 0 ${innerW} ${innerH}" xmlns="http://www.w3.org/2000/svg">
	<defs>
		<linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
			<stop offset="0%" stop-color="#0000"/>
			<stop offset="100%" stop-color="red"/>
		</linearGradient>
		<linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
			<stop offset="0%" stop-color="#0000"/>
			<stop offset="100%" stop-color="blue"/>
		</linearGradient>
	</defs>
	<rect x="0" y="0" width="${innerW}" height="${innerH}" fill="black"/>
	<rect x="0" y="0" width="${innerW}" height="${innerH}" rx="${scaledRadius}" fill="url(#${redGradId})"/>
	<rect x="0" y="0" width="${innerW}" height="${innerH}" rx="${scaledRadius}" fill="url(#${blueGradId})" style="mix-blend-mode:difference"/>
	<rect x="${edgeSize}" y="${edgeSize}" width="${innerW - edgeSize * 2}" height="${innerH - edgeSize * 2}" rx="${scaledRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" style="${innerStyle}"/>
</svg>`;

	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
