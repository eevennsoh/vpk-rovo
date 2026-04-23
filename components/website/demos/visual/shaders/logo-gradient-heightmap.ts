export const LOGO_GRADIENT_DEFAULT_IMAGE_SRC = "/website/logo-gradient-path.svg";

export const LOGO_GRADIENT_HEIGHTMAP_TARGET_MIN_SIDE = 1024;
export const LOGO_GRADIENT_HEIGHTMAP_TARGET_MAX_AREA =
	LOGO_GRADIENT_HEIGHTMAP_TARGET_MIN_SIDE * LOGO_GRADIENT_HEIGHTMAP_TARGET_MIN_SIDE;
export const LOGO_GRADIENT_SVG_RASTER_MAX_DIMENSION = 4096;
export const LOGO_GRADIENT_HEIGHTMAP_CACHE_LIMIT = 20;

const LOGO_GRADIENT_SVG_EXTENSION = ".svg";
const FRAMER_RELAXATION_ALPHA = 1.95;
const FRAMER_RELAXATION_EPSILON = 0.01;
const FRAMER_RELAXATION_PASSES = 50;

type LogoGradientImageSource = HTMLCanvasElement | HTMLImageElement;

interface LogoGradientSourceMetadata {
	source: LogoGradientImageSource;
	width: number;
	height: number;
}

const processedHeightmapCache = new Map<string, HTMLCanvasElement>();

function getLogoGradientSourceMetadata(
	source: LogoGradientImageSource,
): LogoGradientSourceMetadata | undefined {
	if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) {
		const width = source.naturalWidth || source.width;
		const height = source.naturalHeight || source.height;
		if (width > 0 && height > 0) {
			return { source, width, height };
		}
		return undefined;
	}

	if (typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement) {
		if (source.width > 0 && source.height > 0) {
			return { source, width: source.width, height: source.height };
		}
	}

	return undefined;
}

function getLogoGradientSourceCacheKey(
	source: LogoGradientImageSource,
): string | undefined {
	if (typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement) {
		return source.src || undefined;
	}

	if (typeof HTMLCanvasElement !== "undefined" && source instanceof HTMLCanvasElement) {
		return source.dataset.src || undefined;
	}

	return undefined;
}

export function isLogoGradientSvgSourceUrl(url: string): boolean {
	try {
		return new URL(url, "https://placeholder").pathname
			.toLowerCase()
			.endsWith(LOGO_GRADIENT_SVG_EXTENSION);
	} catch {
		return url.toLowerCase().includes(LOGO_GRADIENT_SVG_EXTENSION);
	}
}

export function computeLogoGradientSvgRasterSize(width: number, height: number) {
	const scale = LOGO_GRADIENT_SVG_RASTER_MAX_DIMENSION / Math.max(width, height);

	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
}

export function computeLogoGradientHeightmapWorkSize(
	width: number,
	height: number,
) {
	let scale =
		LOGO_GRADIENT_HEIGHTMAP_TARGET_MIN_SIDE / Math.min(width, height);
	const scaledArea = width * scale * (height * scale);

	if (scaledArea > LOGO_GRADIENT_HEIGHTMAP_TARGET_MAX_AREA) {
		scale *= Math.sqrt(
			LOGO_GRADIENT_HEIGHTMAP_TARGET_MAX_AREA / scaledArea,
		);
	}

	return {
		width: Math.max(1, Math.round(width * scale)),
		height: Math.max(1, Math.round(height * scale)),
	};
}

export function buildLogoGradientOccupancyMaskFromAlpha(
	alphaBytes: ArrayLike<number>,
) {
	const occupancy = new Uint8Array(alphaBytes.length);

	for (let index = 0; index < alphaBytes.length; index += 1) {
		occupancy[index] = (alphaBytes[index] ?? 0) > 0 ? 1 : 0;
	}

	return occupancy;
}

export function buildLogoGradientInteriorMask(
	occupancy: ArrayLike<number>,
	width: number,
	height: number,
) {
	const interiorMask = new Uint8Array(width * height);

	for (let index = 0; index < interiorMask.length; index += 1) {
		if ((occupancy[index] ?? 0) === 0) {
			continue;
		}

		const x = index % width;
		const y = Math.floor(index / width);

		if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
			continue;
		}

		let touchesTransparency = false;

		for (let offsetY = -1; offsetY <= 1 && !touchesTransparency; offsetY += 1) {
			for (let offsetX = -1; offsetX <= 1 && !touchesTransparency; offsetX += 1) {
				if (offsetX === 0 && offsetY === 0) {
					continue;
				}

				const neighborIndex = (y + offsetY) * width + (x + offsetX);
				if ((occupancy[neighborIndex] ?? 0) === 0) {
					touchesTransparency = true;
				}
			}
		}

		if (!touchesTransparency) {
			interiorMask[index] = 1;
		}
	}

	return interiorMask;
}

function relaxLogoGradientCheckerboard(
	passIndices: Int32Array,
	depthField: Float32Array,
	decay: number,
	weight: number,
	epsilon: number,
) {
	for (let index = 0; index < passIndices.length; index += 5) {
		const center = passIndices[index] ?? 0;
		const up = passIndices[index + 1] ?? -1;
		const down = passIndices[index + 2] ?? -1;
		const left = passIndices[index + 3] ?? -1;
		const right = passIndices[index + 4] ?? -1;

		const upValue = up >= 0 ? depthField[up] ?? 0 : 0;
		const downValue = down >= 0 ? depthField[down] ?? 0 : 0;
		const leftValue = left >= 0 ? depthField[left] ?? 0 : 0;
		const rightValue = right >= 0 ? depthField[right] ?? 0 : 0;

		depthField[center] =
			decay * (depthField[center] ?? 0)
			+ weight * (epsilon + upValue + downValue + leftValue + rightValue);
	}
}

export function relaxLogoGradientInteriorMask(
	interiorMask: ArrayLike<number>,
	width: number,
	height: number,
) {
	const pixelCount = width * height;
	const depthField = new Float32Array(pixelCount);
	const evenPass: number[] = [];
	const oddPass: number[] = [];

	for (let index = 0; index < pixelCount; index += 1) {
		if ((interiorMask[index] ?? 0) === 0) {
			continue;
		}

		const x = index % width;
		const y = Math.floor(index / width);
		const pass = (x + y) % 2 === 0 ? evenPass : oddPass;

		pass.push(
			index,
			y > 0 ? index - width : -1,
			y < height - 1 ? index + width : -1,
			x > 0 ? index - 1 : -1,
			x < width - 1 ? index + 1 : -1,
		);
	}

	const decay = 1 - FRAMER_RELAXATION_ALPHA;
	const weight = FRAMER_RELAXATION_ALPHA / 4;
	const evenPassIndices = new Int32Array(evenPass);
	const oddPassIndices = new Int32Array(oddPass);

	for (let iteration = 0; iteration < FRAMER_RELAXATION_PASSES; iteration += 1) {
		relaxLogoGradientCheckerboard(
			evenPassIndices,
			depthField,
			decay,
			weight,
			FRAMER_RELAXATION_EPSILON,
		);
		relaxLogoGradientCheckerboard(
			oddPassIndices,
			depthField,
			decay,
			weight,
			FRAMER_RELAXATION_EPSILON,
		);
	}

	return depthField;
}

export function buildLogoGradientHeightmapPixels(
	alphaBytes: ArrayLike<number>,
	width: number,
	height: number,
) {
	const occupancy = buildLogoGradientOccupancyMaskFromAlpha(alphaBytes);
	const interiorMask = buildLogoGradientInteriorMask(occupancy, width, height);
	const relaxedDepth = relaxLogoGradientInteriorMask(interiorMask, width, height);

	let maxDepth = 0;
	for (let index = 0; index < relaxedDepth.length; index += 1) {
		const depth = relaxedDepth[index] ?? 0;
		if (depth > maxDepth) {
			maxDepth = depth;
		}
	}

	const heightmapPixels = new Uint8ClampedArray(width * height * 4);

	for (let index = 0; index < occupancy.length; index += 1) {
		const offset = index * 4;
		const alpha = alphaBytes[index] ?? 0;
		const depth = maxDepth > 0 ? (relaxedDepth[index] ?? 0) / maxDepth : 0;

		heightmapPixels[offset] = Math.round(depth * 255);
		heightmapPixels[offset + 1] = 255 - alpha;
		heightmapPixels[offset + 2] = occupancy[index] ? 255 : 0;
		heightmapPixels[offset + 3] = 255;
	}

	return heightmapPixels;
}

export function rasterizeLogoGradientSvgSource(
	source: HTMLImageElement,
) {
	if (typeof document === "undefined" || !isLogoGradientSvgSourceUrl(source.src)) {
		return undefined;
	}

	const sourceMetadata = getLogoGradientSourceMetadata(source);
	if (!sourceMetadata) {
		return undefined;
	}

	const { width, height } = computeLogoGradientSvgRasterSize(
		sourceMetadata.width,
		sourceMetadata.height,
	);

	const canvas = document.createElement("canvas");
	canvas.width = width;
	canvas.height = height;
	canvas.dataset.src = source.src;

	const context = canvas.getContext("2d");
	if (!context) {
		return undefined;
	}

	context.drawImage(source, 0, 0, width, height);
	return canvas;
}

export function createLogoGradientHeightmapCanvas(
	source: LogoGradientImageSource,
) {
	if (typeof document === "undefined") {
		return undefined;
	}

	const processedSource =
		typeof HTMLImageElement !== "undefined" && source instanceof HTMLImageElement
			? rasterizeLogoGradientSvgSource(source) ?? source
			: source;
	const cacheKey = getLogoGradientSourceCacheKey(processedSource);

	if (cacheKey) {
		const cachedHeightmap = processedHeightmapCache.get(cacheKey);
		if (cachedHeightmap) {
			return cachedHeightmap;
		}
	}

	const sourceMetadata = getLogoGradientSourceMetadata(processedSource);
	if (!sourceMetadata) {
		return undefined;
	}

	const workSize = computeLogoGradientHeightmapWorkSize(
		sourceMetadata.width,
		sourceMetadata.height,
	);
	const workCanvas = document.createElement("canvas");
	workCanvas.width = workSize.width;
	workCanvas.height = workSize.height;

	const workContext = workCanvas.getContext("2d");
	if (!workContext) {
		return undefined;
	}

	workContext.drawImage(
		sourceMetadata.source,
		0,
		0,
		workSize.width,
		workSize.height,
	);

	const sourcePixels = workContext.getImageData(
		0,
		0,
		workSize.width,
		workSize.height,
	).data;
	const alphaBytes = new Uint8Array(workSize.width * workSize.height);

	for (let index = 0; index < alphaBytes.length; index += 1) {
		alphaBytes[index] = sourcePixels[index * 4 + 3] ?? 0;
	}

	const encodedPixels = buildLogoGradientHeightmapPixels(
		alphaBytes,
		workSize.width,
		workSize.height,
	);
	const heightmapCanvas = document.createElement("canvas");
	heightmapCanvas.width = workSize.width;
	heightmapCanvas.height = workSize.height;

	const heightmapContext = heightmapCanvas.getContext("2d");
	if (!heightmapContext) {
		return undefined;
	}

	const heightmapImage = heightmapContext.createImageData(
		workSize.width,
		workSize.height,
	);
	heightmapImage.data.set(encodedPixels);
	heightmapContext.putImageData(heightmapImage, 0, 0);

	const outputCanvas = document.createElement("canvas");
	outputCanvas.width = sourceMetadata.width;
	outputCanvas.height = sourceMetadata.height;

	const outputContext = outputCanvas.getContext("2d");
	if (!outputContext) {
		return undefined;
	}

	outputContext.imageSmoothingEnabled = true;
	outputContext.drawImage(
		heightmapCanvas,
		0,
		0,
		sourceMetadata.width,
		sourceMetadata.height,
	);

	if (cacheKey) {
		if (processedHeightmapCache.size >= LOGO_GRADIENT_HEIGHTMAP_CACHE_LIMIT) {
			const oldestKey = processedHeightmapCache.keys().next().value;
			if (oldestKey !== undefined) {
				processedHeightmapCache.delete(oldestKey);
			}
		}

		processedHeightmapCache.set(cacheKey, outputCanvas);
	}

	return outputCanvas;
}
