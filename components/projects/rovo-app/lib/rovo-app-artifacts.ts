import type { RovoAppDocument } from "@/lib/rovo-app-types";

const ROVO_APP_ARTIFACT_KIND_LABELS = {
	code: "Code",
	excalidraw: "Diagram",
	image: "Image",
	react: "App",
	sheet: "Sheet",
	text: "Document",
} as const;

function getDocumentTimestamp(document: RovoAppDocument): number {
	const timestamp = Date.parse(document.updatedAt);
	return Number.isFinite(timestamp) ? timestamp : 0;
}

export function getRovoAppArtifactKindLabel(
	kind: keyof typeof ROVO_APP_ARTIFACT_KIND_LABELS,
): string {
	return ROVO_APP_ARTIFACT_KIND_LABELS[kind];
}

export function getRovoAppArtifactTypeLabel(
	document: Pick<RovoAppDocument, "kind" | "versions">,
): string {
	const latestVersion = document.versions[document.versions.length - 1] ?? null;
	if (
		document.kind === "text"
		&& latestVersion?.changeLabel.trim().toLowerCase() === "plan"
	) {
		return "Plan";
	}

	return getRovoAppArtifactKindLabel(document.kind);
}

export function sortRovoAppArtifacts(
	documents: ReadonlyArray<RovoAppDocument>,
): RovoAppDocument[] {
	return [...documents].sort((left, right) => {
		return getDocumentTimestamp(right) - getDocumentTimestamp(left);
	});
}

export function getRovoAppPrimaryArtifact(
	documents: ReadonlyArray<RovoAppDocument>,
	activeDocumentId: string | null,
): RovoAppDocument | null {
	if (documents.length === 0) {
		return null;
	}

	if (activeDocumentId) {
		const activeDocument = documents.find((document) => document.id === activeDocumentId) ?? null;
		if (activeDocument) {
			return activeDocument;
		}
	}

	return sortRovoAppArtifacts(documents)[0] ?? null;
}
