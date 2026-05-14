import type {
	PreviewBody,
	PreviewExcalidrawScene,
} from "@/components/projects/shared/lib/generative-widget";

export type PreviewArtifactKind = "text" | "code" | "html" | "image" | "sheet" | "react" | "excalidraw" | "browser";

function parseExcalidrawSceneString(content: string) {
	const trimmedContent = content.trim();
	if (!trimmedContent.startsWith("{") || !trimmedContent.endsWith("}")) {
		return null;
	}

	try {
		const parsed = JSON.parse(trimmedContent) as unknown;
		return parseExcalidrawPreviewScene(parsed);
	} catch {
		return null;
	}
}

export function buildArtifactPreviewBody({
	content,
	kind,
	summary,
}: Readonly<{
	content: string;
	kind: PreviewArtifactKind;
	summary?: string | null;
}>): PreviewBody {
	const excalidrawScene = parseExcalidrawSceneString(content);
	if (excalidrawScene) {
		return {
			kind: "excalidraw",
			scene: excalidrawScene,
		};
	}

	if (kind === "react") {
		return {
			kind: "app-url",
			url: content,
			...(summary?.trim() ? { summary: summary.trim() } : {}),
		};
	}

	if (kind === "html") {
		return {
			kind: "html",
			html: content,
			...(summary?.trim() ? { summary: summary.trim() } : {}),
		};
	}

	if (kind === "code") {
		return {
			kind: "code",
			code: content,
		};
	}

	if (kind === "excalidraw") {
		return {
			kind: "text",
			text: content,
			markdown: false,
		};
	}

	if (kind === "image" && /^https?:|^data:image\//u.test(content)) {
		return {
			kind: "image",
			images: [{ url: content }],
		};
	}

	return {
		kind: "text",
		text: content,
		markdown: true,
	};
}
function parseExcalidrawPreviewScene(value: unknown): PreviewExcalidrawScene | null {
	if (typeof value !== "object" || value === null || Array.isArray(value)) {
		return null;
	}

	const scene = value as Record<string, unknown>;
	if (!Array.isArray(scene.elements)) {
		return null;
	}

	return {
		...(typeof scene.type === "string" ? { type: scene.type } : {}),
		...(typeof scene.version === "number" ? { version: scene.version } : {}),
		...(typeof scene.source === "string" ? { source: scene.source } : {}),
		elements: scene.elements as unknown[],
		...(typeof scene.appState === "object" && scene.appState !== null && !Array.isArray(scene.appState)
			? { appState: scene.appState as Record<string, unknown> }
			: {}),
		...(typeof scene.files === "object" && scene.files !== null && !Array.isArray(scene.files)
			? { files: scene.files as Record<string, unknown> }
			: {}),
	};
}
