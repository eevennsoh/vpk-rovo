/**
 * Parses the [POINT:x,y:label] tag from Clicky LLM responses.
 */

export interface ClickyPointResult {
	x: number;
	y: number;
	label: string;
}

export interface ClickyParsedResponse {
	text: string;
	point: ClickyPointResult | null;
}

const POINT_TAG_RE = /\[POINT:(\d+),(\d+):([^\]]+)\]/;

/**
 * Parse a Clicky response for a POINT tag.
 * Returns the cleaned text (tag stripped) and the point coordinates if present.
 * When clampBounds are provided, coordinates are clamped to the valid range.
 */
export function parseClickyResponse(
	raw: string,
	clampBounds?: { width: number; height: number } | null,
): ClickyParsedResponse {
	const match = raw.match(POINT_TAG_RE);
	if (!match) {
		return { text: raw, point: null };
	}

	let x = Number(match[1]);
	let y = Number(match[2]);

	if (clampBounds) {
		x = Math.max(0, Math.min(x, clampBounds.width));
		y = Math.max(0, Math.min(y, clampBounds.height));
	}

	return {
		text: raw.replace(POINT_TAG_RE, "").trim(),
		point: { x, y, label: match[3] },
	};
}
