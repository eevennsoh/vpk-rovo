import type { FutureChatStreamingArtifact } from "@/components/projects/future-chat/lib/future-chat-streaming-artifact";
import type {
	FutureChatDocument,
	FutureChatDocumentKind,
} from "@/lib/future-chat-types";
import {
	getMessageArtifactResult,
	type RovoDataParts,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import { sortByUpdatedAtDesc, toNonEmptyString } from "@/lib/utils";

export interface FutureChatPendingArtifactResult {
	action: RovoDataParts["artifact-result"]["action"] | null;
	documentId: string | null;
	kind: FutureChatDocumentKind;
	title: string;
}

export interface FutureChatMessageArtifactDisplay {
	action: RovoDataParts["artifact-result"]["action"] | null;
	displayMode: "preview" | "chip";
	document: FutureChatDocument | null;
	documentId: string;
	isStreaming: boolean;
	kind: FutureChatDocumentKind;
	previewContent: string;
	previewSummary: string | null;
	title: string;
}

export interface FutureChatOrphanArtifactDisplay
	extends FutureChatMessageArtifactDisplay {
	anchorMessageId: string;
}

export function getLatestDocumentContent(document: FutureChatDocument | null): string {
	if (!document || document.versions.length === 0) {
		return "";
	}

	return document.versions[document.versions.length - 1]?.content ?? "";
}

export function getMessageTimestamp(
	message: Pick<RovoUIMessage, "metadata">,
): number | null {
	const createdAt = Date.parse(message.metadata?.createdAt ?? "");
	if (Number.isFinite(createdAt)) {
		return createdAt;
	}

	const updatedAt = Date.parse(message.metadata?.updatedAt ?? "");
	if (Number.isFinite(updatedAt)) {
		return updatedAt;
	}

	return null;
}

function getDocumentAnchorTimestamp(document: FutureChatDocument): number | null {
	const latestVersion = document.versions.at(-1) ?? null;
	const versionTimestamp = Date.parse(latestVersion?.createdAt ?? "");
	if (Number.isFinite(versionTimestamp)) {
		return versionTimestamp;
	}

	const updatedAt = Date.parse(document.updatedAt);
	if (Number.isFinite(updatedAt)) {
		return updatedAt;
	}

	const createdAt = Date.parse(document.createdAt);
	if (Number.isFinite(createdAt)) {
		return createdAt;
	}

	return null;
}

function sortDocumentsNewestFirst(
	documents: ReadonlyArray<FutureChatDocument>,
): FutureChatDocument[] {
	return sortByUpdatedAtDesc(documents);
}

const DEFAULT_REACT_ROUTE_TITLE = "App";
const DEFAULT_ARTIFACT_TITLE = "Artifact";

function normalizeTitleKey(value: string): string {
	return value.trim().replace(/\s+/gu, " ").toLowerCase();
}

function deriveReactArtifactRouteTitle(content: string): string | null {
	const normalizedContent = toNonEmptyString(content);
	if (!normalizedContent || !normalizedContent.startsWith("/")) {
		return null;
	}

	const pathWithoutQuery = normalizedContent.split(/[?#]/u, 1)[0] ?? normalizedContent;
	if (pathWithoutQuery === "/") {
		return DEFAULT_REACT_ROUTE_TITLE;
	}

	const title = pathWithoutQuery
		.split("/")
		.filter(Boolean)
		.flatMap((segment) => segment.split("-"))
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(" ");

	return title || DEFAULT_REACT_ROUTE_TITLE;
}

function resolveLegacyPlanExecutionArtifactTitle({
	fallbackTitle,
	kind,
	previewContent,
	title,
}: Readonly<{
	fallbackTitle?: string | null;
	kind: FutureChatDocumentKind;
	previewContent: string;
	title?: string | null;
}>): string {
	const normalizedTitle = toNonEmptyString(title);
	const normalizedFallbackTitle = toNonEmptyString(fallbackTitle);
	if (!normalizedFallbackTitle) {
		return normalizedTitle ?? DEFAULT_ARTIFACT_TITLE;
	}

	if (kind !== "react") {
		return normalizedTitle ?? normalizedFallbackTitle;
	}

	const routeTitle = deriveReactArtifactRouteTitle(previewContent);
	if (!routeTitle) {
		return normalizedTitle ?? normalizedFallbackTitle;
	}

	if (!normalizedTitle) {
		return normalizedFallbackTitle;
	}

	const normalizedTitleKey = normalizeTitleKey(normalizedTitle);
	return normalizedTitleKey === normalizeTitleKey(routeTitle)
		? normalizedFallbackTitle
		: normalizedTitle;
}

export function resolveFutureChatMessageArtifactDisplay({
	documents,
	fallbackPreviewSummary,
	fallbackTitle,
	message,
	pendingArtifactResult,
	streamingArtifact,
	streamingArtifactMessageId,
}: Readonly<{
	documents: ReadonlyArray<FutureChatDocument>;
	fallbackPreviewSummary?: string | null;
	fallbackTitle?: string | null;
	message: Pick<RovoUIMessage, "id" | "parts">;
	pendingArtifactResult: FutureChatPendingArtifactResult | null;
	streamingArtifact: FutureChatStreamingArtifact | null;
	streamingArtifactMessageId: string | null;
}>): FutureChatMessageArtifactDisplay | null {
	const messageArtifact = getMessageArtifactResult(message);
	const pendingArtifact =
		streamingArtifactMessageId === message.id ? pendingArtifactResult : null;
	const documentId =
		messageArtifact?.documentId ??
		pendingArtifact?.documentId ??
		(streamingArtifactMessageId === message.id ? streamingArtifact?.documentId : null) ??
		null;

	if (!documentId) {
		return null;
	}

	const document = documents.find((candidate) => candidate.id === documentId) ?? null;
	const usesStreamingPreview =
		streamingArtifactMessageId === message.id &&
		streamingArtifact?.documentId === documentId;
	const isStreaming =
		usesStreamingPreview && streamingArtifact?.status === "streaming";
	const resolvedKind =
		(usesStreamingPreview ? streamingArtifact?.kind : null) ??
		messageArtifact?.kind ??
		pendingArtifact?.kind ??
		document?.kind ??
		"text";
	const resolvedFallbackPreviewSummary = toNonEmptyString(fallbackPreviewSummary);
	const previewContent = usesStreamingPreview
		? streamingArtifact?.content ?? ""
		: getLatestDocumentContent(document);
	const resolvedTitle = resolveLegacyPlanExecutionArtifactTitle({
		fallbackTitle,
		kind: resolvedKind,
		previewContent,
		title:
			(usesStreamingPreview ? streamingArtifact?.title : null) ??
			messageArtifact?.title ??
			pendingArtifact?.title ??
			document?.title,
	});

	return {
		action: messageArtifact?.action ?? pendingArtifact?.action ?? null,
		displayMode: "preview",
		document,
		documentId,
		isStreaming,
		kind: resolvedKind,
		previewContent,
		previewSummary:
			document?.previewSummary
			?? (resolvedKind === "react" ? resolvedFallbackPreviewSummary : null),
		title: resolvedTitle,
	};
}

export function resolveFutureChatOrphanArtifactDisplay({
	activeDocumentId,
	documents,
	fallbackPreviewSummary,
	fallbackTitle,
	messages,
}: Readonly<{
	activeDocumentId: string | null;
	documents: ReadonlyArray<FutureChatDocument>;
	fallbackPreviewSummary?: string | null;
	fallbackTitle?: string | null;
	messages: ReadonlyArray<Pick<RovoUIMessage, "id" | "metadata" | "parts" | "role">>;
}>): FutureChatOrphanArtifactDisplay | null {
	const anchoredDocumentIds = new Set(
		messages
			.map((message) => getMessageArtifactResult(message)?.documentId ?? null)
			.filter((documentId): documentId is string => Boolean(documentId)),
	);

	const fallbackDocument = (() => {
		if (activeDocumentId) {
			const activeDocument =
				documents.find((document) => document.id === activeDocumentId) ?? null;
			if (activeDocument && !activeDocument.sourceMessageId && !anchoredDocumentIds.has(activeDocumentId)) {
				return activeDocument;
			}
		}

		return (
			sortDocumentsNewestFirst(documents).find((document) => {
				return !document.sourceMessageId && !anchoredDocumentIds.has(document.id);
			}) ?? null
		);
	})();
	if (!fallbackDocument) {
		return null;
	}

	const targetTimestamp = getDocumentAnchorTimestamp(fallbackDocument);
	const assistantMessages = messages.filter((message) => message.role === "assistant");
	const anchorMessage = targetTimestamp === null
		? [...assistantMessages].reverse()[0] ?? null
		: assistantMessages.reduce<Pick<RovoUIMessage, "id" | "metadata" | "parts" | "role"> | null>((closestMessage, message) => {
			const messageTimestamp = getMessageTimestamp(message);
			if (messageTimestamp === null) {
				return closestMessage;
			}

			if (!closestMessage) {
				return message;
			}

			const closestTimestamp = getMessageTimestamp(closestMessage);
			if (closestTimestamp === null) {
				return message;
			}

			const currentDistance = Math.abs(messageTimestamp - targetTimestamp);
			const closestDistance = Math.abs(closestTimestamp - targetTimestamp);
			return currentDistance < closestDistance ? message : closestMessage;
		}, null) ?? [...assistantMessages].reverse()[0] ?? null;
	if (!anchorMessage) {
		return null;
	}

	const resolvedFallbackPreviewSummary = toNonEmptyString(fallbackPreviewSummary);
	const previewContent = getLatestDocumentContent(fallbackDocument);
	const resolvedTitle = resolveLegacyPlanExecutionArtifactTitle({
		fallbackTitle,
		kind: fallbackDocument.kind,
		previewContent,
		title: fallbackDocument.title,
	});

	return {
		action: null,
		anchorMessageId: anchorMessage.id,
		displayMode: "preview",
		document: fallbackDocument,
		documentId: fallbackDocument.id,
		isStreaming: false,
		kind: fallbackDocument.kind,
		previewContent,
		previewSummary:
			fallbackDocument.previewSummary
			?? (fallbackDocument.kind === "react" ? resolvedFallbackPreviewSummary : null),
		title: resolvedTitle,
	};
}
