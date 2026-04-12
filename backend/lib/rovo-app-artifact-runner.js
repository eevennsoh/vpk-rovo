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
		const normalizedAssistantText =
			typeof assistantText === "string" ? assistantText.trim() : "";
		if (!normalizedAssistantText) {
			throw new Error("Rovo App artifact generation returned no content.");
		}

		const contentToPersist = normalizedAssistantText;
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
			throw new Error("Rovo App artifact document could not be persisted.");
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
	resolvePersistedRovoAppArtifactTitle,
};
