const {
	extractRovoAppRequestedTitle,
} = require("./rovo-app-artifact-updates");
const {
	isExcalidrawArtifactOutput,
} = require("./excalidraw-artifact");
const {
	extractRovoAppArtifactTitleFromContent,
	sanitizeRovoAppArtifactTitle,
} = require("./rovo-app-artifact-titles");

async function resolvePersistedRovoAppArtifactTitle({
	artifactAction,
	content,
	fallbackTitle,
	latestUserMessage,
	resolveGeneratedTitle,
}) {
	const requestedTitle =
		artifactAction === "updateDocument"
			? extractRovoAppRequestedTitle({ latestUserMessage })
			: null;
	if (requestedTitle) {
		return requestedTitle;
	}

	const extractedTitle = extractRovoAppArtifactTitleFromContent(content);
	if (extractedTitle) {
		return extractedTitle;
	}

	if (isExcalidrawArtifactOutput(content)) {
		return sanitizeRovoAppArtifactTitle(fallbackTitle) || "Diagram";
	}

	if (typeof resolveGeneratedTitle === "function") {
		try {
			const generatedTitle = sanitizeRovoAppArtifactTitle(
				await resolveGeneratedTitle({ content }),
			);
			if (generatedTitle) {
				return generatedTitle;
			}
		} catch {
			// Title generation is best-effort. Fall back to the local title below.
		}
	}

	return sanitizeRovoAppArtifactTitle(fallbackTitle) || "Artifact draft";
}

function validateGeneratedArtifactContent({
	content,
	kind,
}) {
	if (kind !== "html") {
		return;
	}

	if (!/<!doctype html>/iu.test(content) || !/<html[\s>]/iu.test(content)) {
		throw new Error("HTML report generation returned content that is not a complete HTML document.");
	}

	if (/\{\{[^}]+\}\}|\[(?:insert|placeholder|tbd)[^\]]*\]|\blorem ipsum\b/iu.test(content)) {
		throw new Error("HTML report generation left unresolved placeholders.");
	}

	if (
		/<script\b[^>]*\bsrc\s*=\s*["']https?:/iu.test(content) ||
		/<link\b[^>]*\bhref\s*=\s*["']https?:/iu.test(content) ||
		/<img\b[^>]*\bsrc\s*=\s*["']https?:/iu.test(content)
	) {
		throw new Error("HTML report generation included remote dependencies.");
	}
}

function normalizeGeneratedArtifactContent({
	content,
	kind,
}) {
	const normalizedContent = typeof content === "string" ? content.trim() : "";
	if (kind !== "html") {
		return normalizedContent;
	}

	return normalizedContent
		.replace(/^```(?:html)?\s*\n/iu, "")
		.replace(/\n```\s*$/u, "")
		.trim();
}

async function generateAndPersistRovoAppArtifact({
	artifactAction,
	artifactDocument,
	changeLabel,
	fallbackTitle,
	latestUserMessage,
	generateArtifactText,
	inferArtifactKindFromContent,
	rovoAppDocumentManager,
	onCreateFailure,
	onTextDelta,
	resolveGeneratedTitle,
}) {
	let shouldRunCreateFailureCleanup = artifactAction === "createDocument" &&
		typeof onCreateFailure === "function";

	try {
		const assistantText = await generateArtifactText({ onTextDelta });
		const normalizedAssistantText = normalizeGeneratedArtifactContent({
			content: assistantText,
			kind: artifactDocument.kind,
		});
		if (!normalizedAssistantText) {
			throw new Error("Rovo artifact generation returned no content.");
		}

		const contentToPersist = normalizedAssistantText;
		validateGeneratedArtifactContent({
			content: contentToPersist,
			kind: artifactDocument.kind,
		});
		const finalArtifactTitle = await resolvePersistedRovoAppArtifactTitle({
			artifactAction,
			content: contentToPersist,
			fallbackTitle,
			latestUserMessage,
			resolveGeneratedTitle,
		});
		const persistedArtifactDocument = {
			...artifactDocument,
			title: finalArtifactTitle,
			kind: inferArtifactKindFromContent(
				contentToPersist,
				artifactDocument.kind,
			),
		};

		let persistedDocument = null;
		if (artifactAction === "updateDocument") {
			persistedDocument =
				await rovoAppDocumentManager.appendDocumentVersion(
					persistedArtifactDocument.id,
					{
						changeLabel,
						content: contentToPersist,
						title: persistedArtifactDocument.title,
						kind: persistedArtifactDocument.kind,
					},
				);
		} else {
			persistedDocument =
				await rovoAppDocumentManager.finalizeDocumentShell(
					persistedArtifactDocument.id,
					{
						changeLabel,
						content: contentToPersist,
						title: persistedArtifactDocument.title,
						kind: persistedArtifactDocument.kind,
					},
				);
		}

		if (!persistedDocument) {
			throw new Error("Rovo artifact document could not be persisted.");
		}

		shouldRunCreateFailureCleanup = false;

		return {
			contentToPersist,
			persistedArtifactDocument,
			titleChanged:
				persistedArtifactDocument.title !== artifactDocument.title,
			kindChanged:
				persistedArtifactDocument.kind !== artifactDocument.kind,
		};
	} catch (error) {
		if (shouldRunCreateFailureCleanup) {
			try {
				await onCreateFailure({ error });
			} catch {
				// Preserve the original generation failure.
			}
		}

		throw error;
	}
}

module.exports = {
	generateAndPersistRovoAppArtifact,
	normalizeGeneratedArtifactContent,
	resolvePersistedRovoAppArtifactTitle,
};
