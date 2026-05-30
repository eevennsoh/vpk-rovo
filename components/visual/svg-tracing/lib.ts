export type SvgTracePath = Readonly<{
	d: string;
}>;

export type SvgTraceShape = Readonly<{
	id: string;
	label: string;
	viewBox: string;
	paths: readonly SvgTracePath[];
}>;

export type SvgTraceBezier = readonly [number, number, number, number];

export type SvgTraceParseResult =
	| Readonly<{ ok: true; shape: SvgTraceShape }>
	| Readonly<{ ok: false; error: string }>;

export type SvgTraceBezierParseResult =
	| Readonly<{ ok: true; value: SvgTraceBezier }>
	| Readonly<{ ok: false; error: string }>;

const DEFAULT_VIEW_BOX = "0 0 22 14";
const MAX_PATHS = 12;
const MAX_PATH_LENGTH = 4000;
const VALID_PATH_DATA = /^[MmZzLlHhVvCcSsQqTtAa0-9eE,.\-\+\s]+$/;

function decodeSvgAttribute(value: string): string {
	return value
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&amp;/g, "&");
}

function extractAttribute(tag: string, name: string): string | null {
	const pattern = new RegExp(`\\s${name}\\s*=\\s*(["'])(.*?)\\1`, "i");
	const match = tag.match(pattern);
	return match ? decodeSvgAttribute(match[2].trim()) : null;
}

function sanitizeViewBox(rawViewBox: string | null): string {
	if (!rawViewBox) return DEFAULT_VIEW_BOX;

	const values = rawViewBox
		.trim()
		.split(/[\s,]+/)
		.map(Number);

	if (
		values.length !== 4 ||
		values.some((value) => !Number.isFinite(value)) ||
		values[2] <= 0 ||
		values[3] <= 0
	) {
		return DEFAULT_VIEW_BOX;
	}

	return values.join(" ");
}

function sanitizePathData(rawD: string | null): string | null {
	if (!rawD) return null;

	const d = rawD.replace(/\s+/g, " ").trim();
	if (d.length === 0 || d.length > MAX_PATH_LENGTH) return null;
	if (!VALID_PATH_DATA.test(d)) return null;
	if (!/[Mm]/.test(d) || !/[0-9]/.test(d)) return null;

	return d;
}

function extractPathData(source: string): string[] {
	const paths: string[] = [];
	const pathTagPattern = /<path\b[^>]*>/gi;
	let match: RegExpExecArray | null;

	while ((match = pathTagPattern.exec(source)) && paths.length < MAX_PATHS) {
		const d = sanitizePathData(extractAttribute(match[0], "d"));
		if (d) paths.push(d);
	}

	return paths;
}

function looksLikeRawPathData(source: string): boolean {
	return /^[Mm][MmZzLlHhVvCcSsQqTtAa0-9eE,.\-\+\s]+$/.test(source.trim());
}

export function parseSvgTraceInput(source: string): SvgTraceParseResult {
	const normalized = source.trim();
	if (normalized.length === 0) {
		return { ok: false, error: "Paste an SVG with at least one path." };
	}

	if (looksLikeRawPathData(normalized)) {
		const d = sanitizePathData(normalized);
		return d
			? {
					ok: true,
					shape: {
						id: "pasted-path",
						label: "Pasted path",
						viewBox: DEFAULT_VIEW_BOX,
						paths: [{ d }],
					},
				}
			: { ok: false, error: "The pasted path data is not supported." };
	}

	const svgMatch = normalized.match(/<svg\b[^>]*>/i);
	const viewBox = sanitizeViewBox(svgMatch ? extractAttribute(svgMatch[0], "viewBox") : null);
	const paths = extractPathData(normalized).map((d) => ({ d }));

	if (paths.length === 0) {
		return { ok: false, error: "No supported path d attributes were found." };
	}

	return {
		ok: true,
		shape: {
			id: "pasted-svg",
			label: "Pasted SVG",
			viewBox,
			paths,
		},
	};
}

export function clampTraceLength(value: number): number {
	if (!Number.isFinite(value)) return 0.12;
	return Math.max(0.015, Math.min(0.45, value));
}

export function clampColorStopCount(value: number): number {
	if (!Number.isFinite(value)) return 4;
	return Math.max(1, Math.min(12, Math.round(value)));
}

export function formatSvgTraceBezier(value: SvgTraceBezier): string {
	return value.map((coordinate) => Number(coordinate.toFixed(3)).toString()).join(", ");
}

export function parseSvgTraceBezierInput(source: string): SvgTraceBezierParseResult {
	const values = source
		.trim()
		.replace(/^cubic-bezier\(/i, "")
		.replace(/\)$/g, "")
		.split(/[\s,]+/)
		.filter(Boolean)
		.map(Number);

	if (values.length !== 4 || values.some((value) => !Number.isFinite(value))) {
		return { ok: false, error: "Enter four cubic-bezier numbers." };
	}

	const [x1, y1, x2, y2] = values;
	if (x1 < 0 || x1 > 1 || x2 < 0 || x2 > 1) {
		return { ok: false, error: "Bezier x values must be between 0 and 1." };
	}

	return { ok: true, value: [x1, y1, x2, y2] };
}
