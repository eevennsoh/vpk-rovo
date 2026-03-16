"use client";

export type RGBAColor = [number, number, number, number];
export type HSLAColor = [number, number, number, number];

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function clampUnit(value: number): number {
	return clamp(value, 0, 1);
}

function clampByte(value: number): number {
	return clamp(Math.round(value), 0, 255);
}

function normalizeHue(value: number): number {
	const normalized = value % 360;
	return normalized < 0 ? normalized + 360 : normalized;
}

function toHexByte(value: number): string {
	return clampByte(value).toString(16).padStart(2, "0");
}

export function rgbaUnitToRgb255(color: RGBAColor): [number, number, number] {
	return [
		clampByte(color[0] * 255),
		clampByte(color[1] * 255),
		clampByte(color[2] * 255),
	];
}

export function rgbaUnitToHex(color: RGBAColor): string {
	return `#${toHexByte(color[0] * 255)}${toHexByte(color[1] * 255)}${toHexByte(color[2] * 255)}${toHexByte(color[3] * 255)}`.toUpperCase();
}

export function rgbaUnitToRgbHex(color: RGBAColor): string {
	return `#${toHexByte(color[0] * 255)}${toHexByte(color[1] * 255)}${toHexByte(color[2] * 255)}`.toUpperCase();
}

export function rgbaUnitToCss(color: RGBAColor): string {
	const [r, g, b] = rgbaUnitToRgb255(color);
	return `rgba(${r}, ${g}, ${b}, ${color[3].toFixed(3)})`;
}

export function rgbaUnitToHsla(color: RGBAColor): HSLAColor {
	const r = clampUnit(color[0]);
	const g = clampUnit(color[1]);
	const b = clampUnit(color[2]);
	const a = clampUnit(color[3]);

	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const delta = max - min;
	const lightness = (max + min) / 2;

	let hue = 0;
	let saturation = 0;

	if (delta !== 0) {
		saturation =
			delta / (1 - Math.abs(2 * lightness - 1));

		switch (max) {
			case r:
				hue = 60 * (((g - b) / delta) % 6);
				break;
			case g:
				hue = 60 * ((b - r) / delta + 2);
				break;
			default:
				hue = 60 * ((r - g) / delta + 4);
				break;
		}
	}

	return [
		normalizeHue(hue),
		clamp(saturation * 100, 0, 100),
		clamp(lightness * 100, 0, 100),
		a,
	];
}

export function hslaToRgbaUnit(h: number, s: number, l: number, a: number): RGBAColor {
	const hue = normalizeHue(h);
	const saturation = clamp(s, 0, 100) / 100;
	const lightness = clamp(l, 0, 100) / 100;
	const alpha = clampUnit(a);

	const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
	const huePrime = hue / 60;
	const x = chroma * (1 - Math.abs((huePrime % 2) - 1));

	let rPrime = 0;
	let gPrime = 0;
	let bPrime = 0;

	if (huePrime >= 0 && huePrime < 1) {
		rPrime = chroma;
		gPrime = x;
	} else if (huePrime < 2) {
		rPrime = x;
		gPrime = chroma;
	} else if (huePrime < 3) {
		gPrime = chroma;
		bPrime = x;
	} else if (huePrime < 4) {
		gPrime = x;
		bPrime = chroma;
	} else if (huePrime < 5) {
		rPrime = x;
		bPrime = chroma;
	} else {
		rPrime = chroma;
		bPrime = x;
	}

	const match = lightness - chroma / 2;

	return [
		clampUnit(rPrime + match),
		clampUnit(gPrime + match),
		clampUnit(bPrime + match),
		alpha,
	];
}

export function hexToRgbaUnit(hex: string, fallbackAlpha = 1): RGBAColor | null {
	const clean = hex.trim().replace(/^#/, "");

	if (![3, 4, 6, 8].includes(clean.length)) {
		return null;
	}

	const expanded =
		clean.length === 3 || clean.length === 4
			? clean
					.split("")
					.map((char) => `${char}${char}`)
					.join("")
			: clean;

	const hasExplicitAlpha = expanded.length === 8;
	const normalized = hasExplicitAlpha
		? expanded
		: `${expanded}${toHexByte(clampUnit(fallbackAlpha) * 255)}`;

	if (!/^[0-9a-fA-F]{8}$/.test(normalized)) {
		return null;
	}

	return [
		parseInt(normalized.slice(0, 2), 16) / 255,
		parseInt(normalized.slice(2, 4), 16) / 255,
		parseInt(normalized.slice(4, 6), 16) / 255,
		parseInt(normalized.slice(6, 8), 16) / 255,
	];
}

export function rgbaColorsEqual(a: RGBAColor, b: RGBAColor): boolean {
	return a.every((value, index) => value === b[index]);
}
