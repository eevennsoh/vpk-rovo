const { normalizeArtifactKind } = require("./rovo-app-artifact-intent");
const { getNonEmptyString } = require("./shared-utils");

function getLatestRovoAppDocumentContent(document) {
	if (!document || !Array.isArray(document.versions) || document.versions.length === 0) {
		return "";
	}

	return typeof document.versions[document.versions.length - 1]?.content === "string"
		? document.versions[document.versions.length - 1].content
		: "";
}

function normalizeArtifactContext(rawArtifactContext) {
	if (!rawArtifactContext || typeof rawArtifactContext !== "object") {
		return null;
	}

	const content = getNonEmptyString(rawArtifactContext.content);
	if (!content) {
		return null;
	}

	return {
		content,
		id: getNonEmptyString(rawArtifactContext.id),
		kind: normalizeArtifactKind(rawArtifactContext.kind),
		title: getNonEmptyString(rawArtifactContext.title) || "Untitled artifact",
	};
}

async function resolveRovoAppActiveArtifact({
	activeDocumentId,
	artifactContext,
	rovoAppDocumentManager,
	rovoAppThreadManager,
	threadId,
}) {
	const normalizedArtifactContext = normalizeArtifactContext(artifactContext);
	const normalizedThreadId = getNonEmptyString(threadId);
	const normalizedActiveDocumentId = getNonEmptyString(activeDocumentId);
	const persistedThread =
		normalizedThreadId && rovoAppThreadManager?.getThread
			? await rovoAppThreadManager.getThread(normalizedThreadId)
			: null;
	const candidateDocumentIds = [
		normalizedActiveDocumentId,
		normalizedArtifactContext?.id ?? null,
		getNonEmptyString(persistedThread?.activeDocumentId),
	].filter((value, index, values) => value && values.indexOf(value) === index);

	for (const documentId of candidateDocumentIds) {
		const document = await rovoAppDocumentManager?.getDocument?.(documentId);
		if (!document) {
			continue;
		}
		if (normalizedThreadId && document.threadId !== normalizedThreadId) {
			continue;
		}

		return {
			activeArtifact: {
				content:
					normalizedArtifactContext?.content || getLatestRovoAppDocumentContent(document),
				id: document.id,
				kind: normalizeArtifactKind(normalizedArtifactContext?.kind || document.kind),
				title: normalizedArtifactContext?.title || document.title,
			},
			activeDocument: document,
			thread: persistedThread,
		};
	}

	return {
		activeArtifact: normalizedArtifactContext,
		activeDocument: null,
		thread: persistedThread,
	};
}

module.exports = {
	getLatestRovoAppDocumentContent,
	resolveRovoAppActiveArtifact,
};
