import type { FileUIPart } from "ai";
import type { RovoMessageMetadata, RovoUIMessage } from "@/lib/rovo-ui-messages";
import { createId } from "@/lib/utils";

export type FutureChatVisibility = "private" | "public";
export type FutureChatDocumentKind = "text" | "code" | "image" | "sheet";
export type ArtifactMode = "preview" | "edit";
export type VoteValue = "up" | "down";
export type FutureChatRunStatus = "queued" | "streaming" | "background";

/**
 * Artifact panel state:
 * - `closed`: panel hidden, normal chat mode (GenUI cards)
 * - `preview`: rendered artifact visible, chat input routes to artifact updates
 */
export type FutureChatPanelState = "closed" | "preview";

export interface FutureChatActiveRun {
	id: string;
	status: FutureChatRunStatus;
	rovoPort: number | null;
	startedAt: string;
	updatedAt: string;
}

export interface FutureChatThread {
	id: string;
	title: string;
	messages: RovoUIMessage[];
	realtimeMessages: RovoUIMessage[];
	visibility: FutureChatVisibility;
	modelId: string | null;
	provider: string | null;
	activeDocumentId: string | null;
	sessionId: string | null;
	sessionMode: "persistent" | "ephemeral" | null;
	activeRun?: FutureChatActiveRun | null;
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

export interface FutureChatQueuedActionBase {
	id: string;
	threadId: string;
	text: string;
	createdAt: number;
}

export interface FutureChatQueuedPromptAction
	extends FutureChatQueuedActionBase {
	kind: "prompt";
	files: ReadonlyArray<FileUIPart>;
	contextDescription?: string;
	messageMetadata?: RovoMessageMetadata;
}

export interface FutureChatQueuedDelegationAction
	extends FutureChatQueuedActionBase {
	kind: "delegation";
	contextDescription?: string;
	conversationSummary?: string;
	delegatedMessageId: string;
	existingRealtimeMessageId?: string | null;
	intentType?: string;
	referencedFiles?: string[];
	urgency?: string;
}

export type FutureChatQueuedAction =
	| FutureChatQueuedPromptAction
	| FutureChatQueuedDelegationAction;

export interface FutureChatRoutingMetadata {
	activeArtifact?: FutureChatActiveArtifact;
	origin?: "text" | "voice";
	voiceMetadata?: FutureChatVoiceMetadata;
	recentHistory?: FutureChatRecentHistoryEntry[];
}

export function createFutureChatId(): string {
	return createId("future-chat");
}
