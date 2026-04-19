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
	blurFilterId: string;
}

function scaleToInternalUnits(length: number, renderedMinSide: number, internalMinSide: number): number {
	if (renderedMinSide <= 0) return 0;
	return (length / renderedMinSide) * internalMinSide;
}

export function getLiquidGlassDisplacementMetrics(
	width: number,
	height: number,
	borderRadius: number,
	borderWidth: number,
	blur: number,
): LiquidGlassDisplacementMetrics {
	const aspectRatio = width / height;
	const longSide = 800;
	const innerW = aspectRatio >= 1 ? longSide : Math.round(longSide * aspectRatio);
	const innerH = aspectRatio >= 1 ? Math.round(longSide / aspectRatio) : longSide;
	const internalMinSide = Math.min(innerW, innerH);
	const renderedMinSide = Math.min(width, height);

	return {
		innerW,
		innerH,
		scaledRadius: scaleToInternalUnits(borderRadius, renderedMinSide, internalMinSide),
		edgeSize: internalMinSide * (borderWidth * 0.5),
		scaledBlur: scaleToInternalUnits(blur, renderedMinSide, internalMinSide),
	};
}

export function buildLiquidGlassChannelScales(
	distortionScale: number,
	dispersion: number,
): LiquidGlassChannelScales {
	return {
		red: distortionScale - dispersion,
		green: distortionScale,
		blue: distortionScale + dispersion,
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
	blurFilterId,
}: LiquidGlassDisplacementImageOptions): string {
	const { innerW, innerH, scaledRadius, edgeSize, scaledBlur } = getLiquidGlassDisplacementMetrics(
		width,
		height,
		borderRadius,
		borderWidth,
		blur,
	);

	const blurFilter = scaledBlur > 0
		? `
		<filter id="${blurFilterId}" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
			<feGaussianBlur stdDeviation="${scaledBlur}"/>
		</filter>`
		: "";
	const blurAttribute = scaledBlur > 0 ? ` filter="url(#${blurFilterId})"` : "";

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
		</linearGradient>${blurFilter}
	</defs>
	<rect x="0" y="0" width="${innerW}" height="${innerH}" fill="black"/>
	<rect x="0" y="0" width="${innerW}" height="${innerH}" rx="${scaledRadius}" fill="url(#${redGradId})"/>
	<rect x="0" y="0" width="${innerW}" height="${innerH}" rx="${scaledRadius}" fill="url(#${blueGradId})" style="mix-blend-mode:difference"/>
	<rect x="${edgeSize}" y="${edgeSize}" width="${innerW - edgeSize * 2}" height="${innerH - edgeSize * 2}" rx="${scaledRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})"${blurAttribute}/>
</svg>`;

	return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
