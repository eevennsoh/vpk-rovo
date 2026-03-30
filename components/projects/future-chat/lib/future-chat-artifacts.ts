import type { FutureChatDocument } from "@/lib/future-chat-types";

const FUTURE_CHAT_ARTIFACT_KIND_LABELS = {
	code: "Code",
	image: "Image",
	react: "App",
	sheet: "Sheet",
	text: "Document",
} as const;

function getDocumentTimestamp(document: FutureChatDocument): number {
	const timestamp = Date.parse(document.updatedAt);
	return Number.isFinite(timestamp) ? timestamp : 0;
}

export function getFutureChatArtifactKindLabel(
	kind: keyof typeof FUTURE_CHAT_ARTIFACT_KIND_LABELS,
): string {
	return FUTURE_CHAT_ARTIFACT_KIND_LABELS[kind];
}

export function getFutureChatArtifactTypeLabel(
	document: Pick<FutureChatDocument, "kind" | "versions">,
): string {
	const latestVersion = document.versions[document.versions.length - 1] ?? null;
	if (
		document.kind === "text"
		&& latestVersion?.changeLabel.trim().toLowerCase() === "plan"
	) {
		return "Plan";
	}

	return getFutureChatArtifactKindLabel(document.kind);
}

export function sortFutureChatArtifacts(
	documents: ReadonlyArray<FutureChatDocument>,
): FutureChatDocument[] {
	return [...documents].sort((left, right) => {
		return getDocumentTimestamp(right) - getDocumentTimestamp(left);
	});
}

export function getFutureChatPrimaryArtifact(
	documents: ReadonlyArray<FutureChatDocument>,
	activeDocumentId: string | null,
): FutureChatDocument | null {
	if (documents.length === 0) {
		return null;
	}

	if (activeDocumentId) {
		const activeDocument = documents.find((document) => document.id === activeDocumentId) ?? null;
		if (activeDocument) {
			return activeDocument;
		}
	}

	return sortFutureChatArtifacts(documents)[0] ?? null;
}
