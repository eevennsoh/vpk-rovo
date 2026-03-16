import type { RovoUIMessage } from "@/lib/rovo-ui-messages";

export type FutureChatVisibility = "private" | "public";
export type FutureChatDocumentKind = "text" | "code" | "image" | "sheet";

export interface FutureChatThread {
	id: string;
	title: string;
	messages: RovoUIMessage[];
	realtimeMessages: RovoUIMessage[];
	visibility: FutureChatVisibility;
	modelId: string | null;
	provider: string | null;
	activeDocumentId: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface FutureChatVote {
	threadId: string;
	messageId: string;
	value: "up" | "down" | null;
	isUpvoted: boolean | null;
}

export interface FutureChatDocumentVersion {
	changeLabel: string;
	id: string;
	content: string;
	createdAt: string;
	title: string;
}

export interface FutureChatDocument {
	id: string;
	threadId: string;
	title: string;
	kind: FutureChatDocumentKind;
	sourceMessageId: string | null;
	createdAt: string;
	updatedAt: string;
	versions: FutureChatDocumentVersion[];
}

export interface FutureChatActiveArtifact {
	id: string;
	title: string;
	kind: string;
}

export interface FutureChatVoiceMetadata {
	intentType?: string;
	urgency?: string;
	conversationSummary?: string;
}

export interface FutureChatRecentHistoryEntry {
	role: "user" | "assistant";
	content: string;
	intent?: string;
}

export interface FutureChatRoutingMetadata {
	activeArtifact?: FutureChatActiveArtifact;
	origin?: "text" | "voice";
	voiceMetadata?: FutureChatVoiceMetadata;
	recentHistory?: FutureChatRecentHistoryEntry[];
}

export function createFutureChatId(prefix = "future-chat"): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
