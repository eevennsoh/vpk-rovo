const { getNonEmptyString, isObjectRecord, normalizeSentence, parseMaybeJson } = require("./shared-utils");

const MAX_CODE_LENGTH = 12000;
const URL_PATTERN = /https?:\/\/[^\s<>"')\]}]+/gi;

function clipText(value, maxLength) {
	const text = getNonEmptyString(value);
	if (!text) {
		return null;
	}

	if (text.length <= maxLength) {
		return text;
	}

	return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

function isGenericFigmaDescription(value) {
	const normalized = normalizeSentence(value);
	return (
		normalized === "design context extracted from figma" ||
		normalized === "generated from tool execution results" ||
		normalized === "generated from tool execution results and errors"
	);
}

function decodePathSegment(value) {
	try {
		return decodeURIComponent(value);
	} catch {
		return value;
	}
}

function parseFigmaUrlDetails(href) {
	const resolvedHref = getNonEmptyString(href);
	if (!resolvedHref) {
		return {};
	}

	try {
		const parsedUrl = new URL(resolvedHref);
		if (!/figma\.com$/i.test(parsedUrl.hostname)) {
			return {};
		}

		const segments = parsedUrl.pathname
			.split("/")
			.filter((segment) => segment.length > 0);
		let fileKey = null;
		let fileName = null;

		if (
			segments.length >= 3 &&
			(segments[0] === "design" || segments[0] === "board" || segments[0] === "make")
		) {
			fileKey = getNonEmptyString(segments[1]);
			fileName = decodePathSegment(segments[2]).replace(/[-_]+/g, " ");
		}

		const rawNodeId = parsedUrl.searchParams.get("node-id");
		const nodeId = getNonEmptyString(rawNodeId)?.replace(/-/g, ":") || null;

		return {
			...(fileKey ? { fileKey } : {}),
			...(fileName ? { fileName } : {}),
			...(nodeId ? { nodeId } : {}),
		};
	} catch {
		return {};
	}
}

function normalizeToolName(toolName) {
	const normalized = getNonEmptyString(toolName);
	if (!normalized) {
		return "";
	}

	return normalized
		.toLowerCase()
		.replace(/[_:/.-]+/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function isFigmaToolName(toolName) {
	const normalized = normalizeToolName(toolName);
	if (!normalized) {
		return false;
	}

	return (
		/\bfigma\b/.test(normalized) ||
		/\bget design context\b/.test(normalized) ||
		/\bget screenshot\b/.test(normalized) ||
		/\bget metadata\b/.test(normalized) ||
		/\bget variable defs\b/.test(normalized) ||
		/\bget code connect\b/.test(normalized)
	);
}

function toStructuredPayload(rawValue) {
	if (rawValue === null || rawValue === undefined) {
		return null;
	}

	if (Array.isArray(rawValue) || isObjectRecord(rawValue)) {
		return rawValue;
	}

	if (typeof rawValue === "string") {
		return parseMaybeJson(rawValue);
	}

	return null;
}

/**
 * Detect if a string looks like generated code (JSX/TSX/HTML).
 */
function looksLikeCode(text) {
	if (typeof text !== "string") {
		return false;
	}

	return (
		/^\s*(export\s+default\s+function|function\s+\w+|const\s+\w+\s*=)/m.test(text) ||
		/^\s*<\w+[\s/>]/m.test(text) ||
		/className\s*=/.test(text) ||
		/return\s*\([\s\S]*</.test(text)
	);
}

/**
 * Detect if a string is an AI-to-AI instruction prompt that should NOT be
 * shown to end users. These are the contextual hints that get_design_context
 * returns alongside the code — meant for the AI to adapt the code, not for
 * humans to read.
 */
function isAiInstruction(text) {
	if (typeof text !== "string" || text.length < 10) {
		return false;
	}

	const trimmed = text.trim();
	return (
		/^SUPER CRITICAL/i.test(trimmed) ||
		/^IMPORTANT:/i.test(trimmed) ||
		/^CRITICAL:/i.test(trimmed) ||
		/\bMUST be converted\b/i.test(trimmed) ||
		/\bMUST call\b/i.test(trimmed) ||
		/\btarget project's technology stack\b/i.test(trimmed) ||
		/\bdata-node-id\b/i.test(trimmed) ||
		/\bget_screenshot\b/i.test(trimmed) ||
		/\bImage assets are stored on a localhost server\b/i.test(trimmed) ||
		/\bClients can use these images directly in code\b/i.test(trimmed) ||
		/\bAfter you call this tool\b/i.test(trimmed) ||
		/\bNode ids have been added\b/i.test(trimmed)
	);
}

/**
 * Extract code blocks from markdown-style fenced code.
 */
function extractCodeBlocks(text) {
	if (typeof text !== "string") {
		return [];
	}

	const blocks = [];
	const fencePattern = /```(\w*)\n([\s\S]*?)```/g;
	let match;
	while ((match = fencePattern.exec(text)) !== null) {
		const language = getNonEmptyString(match[1]) || "tsx";
		const code = getNonEmptyString(match[2]);
		if (code) {
			blocks.push({ language, code: clipText(code, MAX_CODE_LENGTH) });
		}
	}

	return blocks;
}

/**
 * Extract URLs from a text string.
 */
function extractUrls(text) {
	if (typeof text !== "string") {
		return [];
	}

	const matches = text.match(URL_PATTERN);
	return Array.isArray(matches) ? matches : [];
}

/**
 * Extract text content from an array entry (plain string or MCP content block).
 */
function resolveEntryText(entry) {
	if (typeof entry === "string") {
		return entry;
	}
	if (isObjectRecord(entry)) {
		return getNonEmptyString(entry.text) || getNonEmptyString(entry.content) || null;
	}
	return null;
}

/**
 * Scan an array of entries (plain strings or MCP content blocks) for code
 * and URLs. Returns extracted code or null.
 */
function extractCodeFromEntries(entries, state) {
	let foundCode = null;

	for (const entry of entries) {
		const entryText = resolveEntryText(entry);
		if (!entryText || !entryText.trim()) {
			continue;
		}

		if (isAiInstruction(entryText)) {
			continue;
		}

		if (!foundCode && looksLikeCode(entryText)) {
			foundCode = clipText(entryText, MAX_CODE_LENGTH);
			continue;
		}

		for (const url of extractUrls(entryText)) {
			state.pushLink(url, "Resource");
		}
	}

	return foundCode;
}

/**
 * Extract data from Figma tool result observations.
 *
 * get_design_context returns an array of strings or MCP content blocks:
 *   [0] = generated React+Tailwind code
 *   [1..N] = AI instructions (filtered out — not user-facing)
 *
 * Object payloads are also supported for other Figma tools.
 */
function extractFigmaData(payloads, texts, rawStrings) {
	let code = null;
	let codeLanguage = "tsx";
	let componentName = null;
	let fileName = null;
	let fileKey = null;
	let nodeId = null;
	const links = [];
	const seenLinks = new Set();

	const pushLink = (href, label) => {
		const url = getNonEmptyString(href);
		if (!url || seenLinks.has(url)) {
			return;
		}
		seenLinks.add(url);
		links.push({ href: url, text: clipText(label, 80) || "Link" });

		const urlDetails = parseFigmaUrlDetails(url);
		if (!fileName && urlDetails.fileName) {
			fileName = clipText(urlDetails.fileName, 120);
		}
		if (!fileKey && urlDetails.fileKey) {
			fileKey = clipText(urlDetails.fileKey, 80);
		}
		if (!nodeId && urlDetails.nodeId) {
			nodeId = clipText(urlDetails.nodeId, 80);
		}
	};

	const linkState = { pushLink };

	for (const payload of payloads) {
		// Handle array format (get_design_context)
		// Entries may be plain strings or MCP content blocks ({ type: "text", text: "..." })
		if (Array.isArray(payload)) {
			if (!code) {
				code = extractCodeFromEntries(payload, linkState);
			}
			continue;
		}

		// Handle object format (other Figma tools or future changes)
		if (isObjectRecord(payload)) {
			// If the object wraps a content array, extract from it
			if (!code && Array.isArray(payload.content)) {
				code = extractCodeFromEntries(payload.content, linkState);
			}

			if (!code) {
				const codeField =
					getNonEmptyString(payload.code) ||
					getNonEmptyString(payload.generatedCode) ||
					getNonEmptyString(payload.reactCode) ||
					getNonEmptyString(payload.html);
				if (codeField) {
					code = clipText(codeField, MAX_CODE_LENGTH);
				}
			}

			if (!componentName) {
				componentName = clipText(
					getNonEmptyString(payload.componentName) ||
					getNonEmptyString(payload.name) ||
					getNonEmptyString(payload.nodeName) ||
					getNonEmptyString(payload.title) ||
					getNonEmptyString(payload.fileName),
					120
				);
			}
			if (!fileName) {
				fileName = clipText(
					getNonEmptyString(payload.fileName) ||
					getNonEmptyString(payload.filename) ||
					getNonEmptyString(payload.documentName),
					120
				);
			}
			if (!fileKey) {
				fileKey = clipText(
					getNonEmptyString(payload.fileKey) ||
					getNonEmptyString(payload.makeFileKey) ||
					getNonEmptyString(payload.branchKey),
					80
				);
			}
			if (!nodeId) {
				nodeId = clipText(
					getNonEmptyString(payload.nodeId) ||
					getNonEmptyString(payload["node-id"]),
					80
				);
			}

			// Extract links from object payloads
			const directLinkKeys = ["documentationUrl", "docUrl", "figmaUrl", "url", "link"];
			for (const key of directLinkKeys) {
				const url = getNonEmptyString(payload[key]);
				if (url) {
					pushLink(url, key.replace(/Url$/, "").replace(/([A-Z])/g, " $1").trim());
				}
			}
		}
	}

	// Fallback: raw strings from observations that didn't parse as structured data.
	// These may be plain code strings returned directly as rawOutput.
	if (!code && rawStrings.length > 0) {
		for (const raw of rawStrings) {
			if (looksLikeCode(raw) && raw.length > 50) {
				code = clipText(raw, MAX_CODE_LENGTH);
				break;
			}
		}
	}

	// Fallback: try extracting code from observation text (fenced code blocks)
	if (!code && texts.length > 0) {
		for (const text of texts) {
			// Try fenced code blocks first (works for any text format)
			const codeBlocks = extractCodeBlocks(text);
			if (codeBlocks.length > 0) {
				code = codeBlocks[0].code;
				codeLanguage = codeBlocks[0].language;
				break;
			}

			// For serialized JSON arrays (stringified tool outputs), try to
			// parse them and extract code from embedded content blocks.
			if (/^\s*\[/.test(text)) {
				const parsed = parseMaybeJson(text);
				if (Array.isArray(parsed)) {
					code = extractCodeFromEntries(parsed, linkState);
					if (code) {
						break;
					}
				}
				// Skip looksLikeCode on JSON array text — would false-positive
				// on embedded code strings within the serialized JSON.
				continue;
			}

			if (looksLikeCode(text) && text.length > 100) {
				code = clipText(text, MAX_CODE_LENGTH);
				break;
			}
		}
	}

	return {
		code,
		codeLanguage,
		componentName,
		fileName,
		fileKey,
		nodeId,
		links: links.slice(0, 6),
	};
}

function collectFigmaObservations(observations) {
	return observations.filter((entry) => isFigmaToolName(entry.toolName));
}

function buildFigmaDescription(data) {
	const fileLabel =
		clipText(data.fileName, 80) ||
		(data.fileKey ? `file ${clipText(data.fileKey, 40)}` : null);
	const nodeLabel = clipText(data.nodeId, 32);

	if (data.componentName && fileLabel) {
		return `Frame ${clipText(data.componentName, 56)} from ${fileLabel}.`;
	}

	if (fileLabel && nodeLabel) {
		return `Design context from ${fileLabel} (${nodeLabel}).`;
	}

	if (fileLabel) {
		return `Design context from ${fileLabel}.`;
	}

	if (data.componentName) {
		return `Design context for ${clipText(data.componentName, 80)}.`;
	}

	return "Figma design context ready.";
}

function buildFigmaStructuredSpec({
	observations,
	title,
	description,
} = {}) {
	const entries = Array.isArray(observations) ? observations : [];
	if (entries.length === 0) {
		return null;
	}

	const figmaObservations = collectFigmaObservations(entries);
	if (figmaObservations.length === 0) {
		return null;
	}

	const resultCount = figmaObservations.filter((entry) => entry.phase === "result").length;
	const errorCount = figmaObservations.filter((entry) => entry.phase === "error").length;
	if (resultCount === 0) {
		return null;
	}

	// Collect structured payloads, raw text, and raw string outputs from
	// result observations. rawStrings captures string rawOutputs that didn't
	// parse as structured JSON — they might be plain code strings.
	const payloads = [];
	const texts = [];
	const rawStrings = [];
	for (const observation of figmaObservations) {
		if (!observation || observation.phase !== "result") {
			continue;
		}

		const payload =
			toStructuredPayload(observation.rawOutput) ||
			toStructuredPayload(observation.text);
		if (payload) {
			payloads.push(payload);
		} else if (typeof observation.rawOutput === "string") {
			const rawStr = getNonEmptyString(observation.rawOutput);
			if (rawStr) {
				rawStrings.push(rawStr);
			}
		}

		const text = getNonEmptyString(observation.text);
		if (text) {
			texts.push(text);
		}
	}

	const data = extractFigmaData(payloads, texts, rawStrings);

	// Build a direct Figma URL from extracted metadata, or find one in links.
	let figmaUrl = null;
	if (data.fileKey) {
		const nodeParam = data.nodeId ? `?node-id=${data.nodeId.replace(/:/g, "-")}` : "";
		figmaUrl = `https://www.figma.com/design/${data.fileKey}${nodeParam}`;
	}
	if (!figmaUrl && data.links.length > 0) {
		const figmaLink = data.links.find((l) => /figma\.com/i.test(l.href));
		if (figmaLink) {
			figmaUrl = figmaLink.href;
		}
	}

	const resolvedTitle = clipText(title, 80) || data.componentName || "Figma Design Context";
	const explicitDescription = clipText(description, 140);
	const resolvedDescription =
		explicitDescription && !isGenericFigmaDescription(explicitDescription)
			? explicitDescription
			: buildFigmaDescription(data);

	const summaryParts = [];
	if (data.code) {
		summaryParts.push("code");
	}
	if (data.links.length > 0) {
		summaryParts.push(`${data.links.length} link${data.links.length === 1 ? "" : "s"}`);
	}
	const summary = summaryParts.length > 0
		? `Rendered Figma design context with ${summaryParts.join(", ")}.`
		: "Rendered Figma design context.";

	return {
		spec: {
			root: "figma-context",
			elements: {
				"figma-context": {
					type: "FigmaDesignContext",
					props: {
						title: resolvedTitle || null,
						description: resolvedDescription || null,
						figmaUrl,
						code: data.code || null,
						codeLanguage: data.codeLanguage || null,
						links: data.links,
					},
				},
			},
		},
		summary,
		source: "tool-observation-figma-structured",
		observationUsed: true,
		observationCount: figmaObservations.length,
		resultCount,
		errorCount,
	};
}

module.exports = {
	buildFigmaStructuredSpec,
};
