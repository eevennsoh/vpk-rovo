import type { RovoAppDocumentKind } from "@/lib/rovo-app-types";

export interface RovoAppStreamingArtifact {
	content: string;
	documentId: string | null;
	createdAt: string;
	kind: RovoAppDocumentKind;
	status: "streaming" | "idle";
	title: string;
	updatedAt: string;
}

export interface RovoAppStreamingArtifactCheckpoint {
	content: string;
	documentId: string;
	kind: RovoAppDocumentKind;
	title: string;
}

export function getRovoAppStreamingArtifactCheckpoint(
	artifact: RovoAppStreamingArtifact | null,
): RovoAppStreamingArtifactCheckpoint | null {
	if (!artifact?.documentId) {
		return null;
	}

	if (!artifact.content.trim()) {
		return null;
	}

	return {
		content: artifact.content,
		documentId: artifact.documentId,
		kind: artifact.kind,
		title: artifact.title,
	};
}

export function appendRovoAppStreamingArtifactDelta({
	current,
	delta,
	kind,
	timestamp,
}: Readonly<{
	current: RovoAppStreamingArtifact | null;
	delta: string;
	kind?: RovoAppDocumentKind;
	timestamp: string;
}>): RovoAppStreamingArtifact {
	return {
		content: `${current?.content ?? ""}${delta}`,
		documentId: current?.documentId ?? null,
		createdAt: current?.createdAt ?? timestamp,
		kind: kind ?? current?.kind ?? "text",
		status: "streaming",
		title: current?.title ?? "Artifact draft",
		updatedAt: timestamp,
	};
}
