const DEFAULT_EXCALIDRAW_APP_STATE = {
	viewBackgroundColor: "#ffffff",
};
const EXCALIDRAW_REQUEST_PATTERN =
	/\b(excalidraw|diagram|flowchart|sequence\s+diagram|architecture\s+diagram|system\s+diagram)\b/i;
const EXCALIDRAW_APP_URL = "https://excalidraw.com";

function getNonEmptyString(value) {
	return typeof value === "string" && value.trim().length > 0
		? value.trim()
		: null;
}

function isObjectRecord(value) {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractJsonObject(rawText) {
	const normalizedText = getNonEmptyString(rawText);
	if (!normalizedText) {
		return null;
	}

	const fencedMatch = normalizedText.match(/```(?:json)?\s*([\s\S]*?)```/i);
	const candidateText = fencedMatch?.[1] ? fencedMatch[1].trim() : normalizedText;

	try {
		return JSON.parse(candidateText);
	} catch {
		const objectMatch = candidateText.match(/\{[\s\S]*\}/);
		if (!objectMatch) {
			return null;
		}

		try {
			return JSON.parse(objectMatch[0]);
		} catch {
			return null;
		}
	}
}

function buildExcalidrawArtifactSystemPrompt({
	mode,
	title,
}) {
	const header = mode === "update"
		? `You are updating an existing excalidraw diagram artifact titled "${title}".`
		: `You are generating a new excalidraw diagram artifact titled "${title}".`;

	return [
		header,
		"Return ONLY valid Excalidraw scene JSON.",
		"Do not use markdown fences. Do not add commentary before or after the JSON.",
		"Return a single JSON object with this top-level shape: {\"type\":\"excalidraw\",\"version\":2,\"source\":\"rovo-app\",\"appState\":{\"viewBackgroundColor\":\"#ffffff\"},\"elements\":[...]}",
		"Use Excalidraw-compatible elements for diagrams. Prefer only these element types: text, rectangle, diamond, ellipse, arrow, and line.",
		"Each element must include realistic Excalidraw fields needed for import, including id, type, x, y, width, height, angle, strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, seed, version, versionNonce, isDeleted, groupIds, boundElements, updated, link, locked, and any text-specific properties when applicable.",
		"For arrows and lines, include points arrays and arrowhead metadata when needed.",
		"Lay out the diagram clearly from top to bottom or left to right with readable spacing.",
		mode === "update"
			? "Preserve the intent of the current diagram but regenerate the full JSON scene so the new version is complete and self-contained."
			: "Generate a complete self-contained scene with all required elements.",
		"If the request is architectural, use grouped layers, labeled nodes, and directional arrows.",
	].join("\n");
}

function buildExcalidrawWidgetSystemPrompt({ title }) {
	const resolvedTitle = getNonEmptyString(title) || "Diagram";
	return [
		`You are generating a transient Excalidraw diagram preview titled "${resolvedTitle}".`,
		"Return ONLY valid Excalidraw scene JSON.",
		"Do not use markdown fences. Do not add commentary before or after the JSON.",
		"Return a single JSON object with this top-level shape: {\"type\":\"excalidraw\",\"version\":2,\"source\":\"rovo-app\",\"appState\":{\"viewBackgroundColor\":\"#ffffff\"},\"elements\":[...]}",
		"Use Excalidraw-compatible elements for diagrams. Prefer only these element types: text, rectangle, diamond, ellipse, arrow, and line.",
		"Each element must include realistic Excalidraw fields needed for import, including id, type, x, y, width, height, angle, strokeColor, backgroundColor, fillStyle, strokeWidth, strokeStyle, roughness, opacity, seed, version, versionNonce, isDeleted, groupIds, boundElements, updated, link, locked, and any text-specific properties when applicable.",
		"For arrows and lines, include points arrays and arrowhead metadata when needed.",
		"Lay out the diagram clearly from top to bottom or left to right with readable spacing.",
		"Generate a complete self-contained scene with all required elements.",
	].join("\n");
}

function isExcalidrawDiagramRequest(prompt) {
	return EXCALIDRAW_REQUEST_PATTERN.test(getNonEmptyString(prompt) || "");
}

function deriveExcalidrawTitle(prompt) {
	const text = getNonEmptyString(prompt);
	if (!text) {
		return "Diagram";
	}

	const stripped = text
		.replace(/^(?:please\s+)?(?:(?:can|could|would)\s+you\s+)?(?:create|build|generate|make|draw|design|render|show)\b[\s:,-]*/i, "")
		.replace(/[?.!]+$/g, "")
		.trim();
	if (!stripped) {
		return "Diagram";
	}

	const architectureTarget = stripped.match(/\barchitecture\s+diagram\s+(?:for|of)\s+(.+)$/i)?.[1];
	if (architectureTarget) {
		return toTitleCase(`${normalizeDiagramTarget(architectureTarget)} architecture diagram`);
	}

	const sequenceTarget = stripped.match(/\bsequence\s+diagram\s+(?:for|of)\s+(.+)$/i)?.[1];
	if (sequenceTarget) {
		return toTitleCase(`${normalizeDiagramTarget(sequenceTarget)} sequence diagram`);
	}

	const flowTarget = stripped.match(/\bflowchart\s+(?:for|of)\s+(.+)$/i)?.[1];
	if (flowTarget) {
		return toTitleCase(`${normalizeDiagramTarget(flowTarget)} flowchart`);
	}

	const genericTarget = stripped.match(/\bdiagram\s+(?:for|of)\s+(.+)$/i)?.[1];
	if (genericTarget) {
		return toTitleCase(`${normalizeDiagramTarget(genericTarget)} diagram`);
	}

	if (/\barchitecture\s+diagram\b/i.test(stripped)) {
		return "System Architecture Diagram";
	}

	if (/\bsequence\s+diagram\b/i.test(stripped)) {
		return "Sequence Diagram";
	}

	if (/\bflowchart\b/i.test(stripped)) {
		return "Flowchart";
	}

	return toTitleCase(
		stripped.length <= 72 ? stripped : `${stripped.slice(0, 71).trimEnd()}…`,
	);
}

function normalizeDiagramTarget(value) {
	return value
		.replace(/^(?:the|a|an)\s+/i, "")
		.replace(/\b(?:this|that)\s+system\b/i, "system")
		.replace(/\b(?:this|that)\s+service\b/i, "service")
		.replace(/\b(?:this|that)\s+workflow\b/i, "workflow")
		.replace(/[?.!]+$/g, "")
		.trim();
}

function toTitleCase(value) {
	return value
		.split(/\s+/)
		.filter(Boolean)
		.map((word) => {
			if (/^[A-Z0-9_-]{2,}$/.test(word)) {
				return word;
			}

			return word.charAt(0).toUpperCase() + word.slice(1);
		})
		.join(" ");
}

function buildExcalidrawWidgetDescription(prompt) {
	const text = getNonEmptyString(prompt) || "";

	if (/\barchitecture\s+diagram\b/i.test(text)) {
		return "Transient system map with labeled nodes and directional flows.";
	}

	if (/\bsequence\s+diagram\b/i.test(text)) {
		return "Transient interaction flow between actors and services.";
	}

	if (/\bflowchart\b/i.test(text)) {
		return "Transient process diagram laid out for quick scanning.";
	}

	return "Transient Excalidraw diagram preview.";
}

function normalizeExcalidrawArtifactOutput(rawText) {
	const parsed = extractJsonObject(rawText);
	if (!isObjectRecord(parsed) || !Array.isArray(parsed.elements)) {
		return null;
	}

	const normalizedElements = parsed.elements.filter((element) => isObjectRecord(element));
	if (normalizedElements.length === 0) {
		return null;
	}

	const appState = isObjectRecord(parsed.appState)
		? {
			...DEFAULT_EXCALIDRAW_APP_STATE,
			...parsed.appState,
		}
		: DEFAULT_EXCALIDRAW_APP_STATE;

	const normalizedScene = {
		type: getNonEmptyString(parsed.type) || "excalidraw",
		version: typeof parsed.version === "number" && Number.isFinite(parsed.version)
			? parsed.version
			: 2,
		source: getNonEmptyString(parsed.source) || "rovo-app",
		appState,
		elements: normalizedElements,
		...(isObjectRecord(parsed.files) ? { files: parsed.files } : {}),
	};

	return JSON.stringify(normalizedScene, null, 2);
}

function isExcalidrawArtifactOutput(rawText) {
	return normalizeExcalidrawArtifactOutput(rawText) !== null;
}

function buildExcalidrawWidgetPayload({
	prompt,
	normalizedSceneJson,
}) {
	const title = deriveExcalidrawTitle(prompt);
	return {
		title,
		description: buildExcalidrawWidgetDescription(prompt),
		summary: getNonEmptyString(prompt) || title,
		contentTypeHint: "ui",
		iconHint: "diagram",
		source: {
			name: "Excalidraw",
		},
		actions: [
			{
				label: "Open Excalidraw App",
				href: EXCALIDRAW_APP_URL,
			},
		],
		body: {
			kind: "excalidraw",
			scene: JSON.parse(normalizedSceneJson),
		},
	};
}

module.exports = {
	buildExcalidrawArtifactSystemPrompt,
	buildExcalidrawWidgetDescription,
	buildExcalidrawWidgetPayload,
	buildExcalidrawWidgetSystemPrompt,
	deriveExcalidrawTitle,
	isExcalidrawDiagramRequest,
	isExcalidrawArtifactOutput,
	normalizeExcalidrawArtifactOutput,
};
