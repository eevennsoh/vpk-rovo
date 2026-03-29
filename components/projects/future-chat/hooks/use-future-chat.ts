"use client";

import type { FileUIPart } from "ai";
import type { ChatStatus } from "ai";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useRouter } from "next/navigation";
import {
	startTransition,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
} from "react";
import { useFutureChatQueue } from "@/app/future-chat/future-chat-queue-provider";
import { useLatestRef } from "@/lib/use-latest-ref";
import { shouldSendExplicitRovoDevCancel } from "@/lib/rovodev-cancel-strategy";
import { toast } from "sonner";
import {
	appendFutureChatStreamingArtifactDelta,
	getFutureChatStreamingArtifactCheckpoint,
	type FutureChatStreamingArtifact,
} from "@/components/projects/future-chat/lib/future-chat-streaming-artifact";
import type { FutureChatPendingArtifactResult } from "@/components/projects/future-chat/lib/future-chat-message-artifacts";
import { getLatestDocumentContent } from "@/components/projects/future-chat/lib/future-chat-message-artifacts";
import {
	buildFutureChatThreadPath,
	buildFutureChatThreadPersistKey,
	FUTURE_CHAT_ROOT_PATH,
	getFutureChatThreadIdFromPath,
	shouldLoadInitialFutureChatThread,
	shouldSkipFutureChatThreadLoad,
	shouldReplacePendingFutureChatRoute,
	shouldReplaceFutureChatRouteAfterPersistence,
} from "@/components/projects/future-chat/lib/future-chat-thread-route-sync";
import {
	buildRecoverableFutureChatThreadInput,
	shouldRecoverFutureChatThreadAfterPersistenceFailure,
} from "@/components/projects/future-chat/lib/future-chat-thread-persistence";
import { waitForChatSendSettled } from "@/components/projects/future-chat/lib/future-chat-send-guard";
import { shouldSuppressFutureChatPlanRetry } from "@/components/projects/future-chat/lib/future-chat-plan-retry-guard";
import { buildFutureChatActiveThreadTransitionPlan } from "@/components/projects/future-chat/lib/future-chat-active-thread-transition";
import {
	createRealtimeTextMessage,
	mergeFutureChatMessages,
	updateRealtimeTextMessage,
	upsertRealtimeMessage,
} from "@/components/projects/future-chat/lib/future-chat-realtime-message-state";
import { createFutureChatUserMessage } from "@/components/projects/future-chat/lib/future-chat-user-message";
import {
	appendSuggestedQuestionsToAssistantMessage,
	buildSuggestedQuestionsRequest,
} from "@/components/projects/future-chat/lib/future-chat-suggestions";
import {
	getFutureChatBackgroundRefreshThreadIds,
	shouldHydrateCompletedActiveBackgroundThread,
} from "@/components/projects/future-chat/lib/future-chat-background-refresh";
import {
	getLatestFutureChatThinkingStatusLabel,
	resolveFutureChatComposerSubmitState,
	type FutureChatDirectDelegationPhase,
} from "@/components/projects/future-chat/lib/future-chat-composer-submit-state";
import {
	buildFutureChatQueuedPromptsFromTodoQueue,
	normalizeFutureChatTodoQueuePayload,
} from "@/components/projects/future-chat/lib/future-chat-todo-queue";
import { resolveFutureChatPlanReviewAction } from "@/components/projects/future-chat/lib/future-chat-plan-review";
import {
	canDispatchFutureChatQueuedAction,
	hasQueuedFutureChatFollowUp,
	isFutureChatThreadBusy,
} from "@/components/projects/future-chat/lib/future-chat-queue-gate";
import type { FutureChatSmartWidthClass } from "@/components/projects/future-chat/lib/future-chat-smart-generation-layout";
import {
	isFutureChatDelegationAbortError,
	readFutureChatDelegationResponseStream,
} from "@/components/projects/future-chat/lib/future-chat-delegation-stream";
import { shouldHydratePersistedRealtimeMessages } from "@/components/projects/future-chat/lib/future-chat-realtime-persistence";
import {
	filterDeletedFutureChatThreads,
	upsertFutureChatThreadRecord,
} from "@/components/projects/future-chat/lib/future-chat-thread-state";
import {
	createFutureChatThread,
	cancelFutureChatRun,
	deleteAllFutureChatThreads,
	deleteFutureChatDocument,
	deleteFutureChatThread,
	detachFutureChatStream,
	fetchFutureChatAITitle,
	detachFutureChatRun,
	fetchFutureChatSuggestedQuestions,
	getFutureChatBackendUnavailableUserMessage,
	getFutureChatDocument,
	getFutureChatThread,
	isFutureChatBackendUnavailableError,
	listFutureChatBackgroundStreams,
	listFutureChatDocuments,
	upsertFutureChatRealtimeMessage,
	listFutureChatThreads,
	listFutureChatVotes,
	saveFutureChatDocument,
	setFutureChatVote,
	updateFutureChatThread,
} from "@/components/projects/future-chat/lib/api";
import {
	type ArtifactMode,
	type FutureChatActiveRun,
	type FutureChatDocument,
	type FutureChatDocumentKind,
	type FutureChatQueuedAction,
	type FutureChatQueuedDelegationAction,
	type FutureChatQueuedPromptAction,
	type FutureChatPlanExecutionTask,
	type FutureChatRunStatus,
	type FutureChatThread,
	type FutureChatVisibility,
	type FutureChatVote,
	type FutureChatActiveArtifact,
	type FutureChatPanelState,
	type FutureChatRecentHistoryEntry,
	type VoteValue,
	createFutureChatId,
} from "@/lib/future-chat-types";
import {
	buildClarificationMessageMetadata,
	buildDeferredToolResponse,
	buildClarificationDismissPrompt,
	buildClarificationSummaryPrompt,
	createClarificationSubmission,
	getLatestQuestionCardPayload,
	type ClarificationAnswers,
	type ParsedQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import {
	type FutureChatAgentMode,
	buildFutureChatAgentModeRequest,
	buildFutureChatCancelUrl,
} from "@/components/projects/future-chat/lib/future-chat-agent-mode";
import { cancelDeferredToolCall } from "@/components/blocks/question-card/lib/cancel-deferred-tool";
import { appendTurnCompleteToLastAssistantMessage, markClarificationToolResolved } from "@/components/projects/future-chat/lib/future-chat-streaming-assistant";
import {
	classifyFutureChatTurnMode,
	getLatestVisibleFutureChatUserPrompt,
	hasPendingFutureChatStructuredContinuation,
} from "@/components/projects/future-chat/lib/future-chat-turn-mode";
import {
	buildExitPlanModeDeferredToolResponse,
	getLatestPendingPlanWidget,
	getLatestPlanWidgetPayload,
	type ParsedPlanWidgetPayload,
} from "@/components/projects/shared/lib/plan-widget";
import { markLastFutureChatAssistantMessageInterrupted } from "@/lib/future-chat-interruptions";
import {
	getLatestDataPart,
	getLatestPendingToolApproval,
	getMessageArtifactResult,
	getMessageText,
	hasTurnCompleteSignal,
	type RovoMessageInterruptionSource,
	type ToolApprovalPayload,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import { API_ENDPOINTS } from "@/lib/api-config";
import { createId, sortByUpdatedAtDesc } from "@/lib/utils";

function deriveThreadTitle(promptText: string): string {
	const firstLine = promptText
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.find((line) => line.length > 0);
	return firstLine?.slice(0, 80) || "New chat";
}

function createFutureChatQueueItemId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return createId("future-chat-queue");
}

function upsertDocumentRecord(
	documents: ReadonlyArray<FutureChatDocument>,
	nextDocument: FutureChatDocument,
): FutureChatDocument[] {
	const withoutPrevious = documents.filter((document) => document.id !== nextDocument.id);
	return sortByUpdatedAtDesc([nextDocument, ...withoutPrevious]);
}

function buildVotesMap(votes: ReadonlyArray<FutureChatVote>): Record<string, VoteValue> {
	return votes.reduce<Record<string, VoteValue>>((result, vote) => {
		if (vote.value === "up" || vote.value === "down") {
			result[vote.messageId] = vote.value;
		}
		return result;
	}, {});
}

function inferArtifactKind(message: RovoUIMessage, content: string): FutureChatDocumentKind {
	if (/```[\w-]*[\s\S]+```/u.test(content)) {
		return "code";
	}

	const widget = getLatestDataPart(message, "data-widget-data");
	if (widget?.data.type === "image") {
		return "image";
	}
	if (widget?.data.type === "table") {
		return "sheet";
	}

	return "text";
}

function buildArtifactContentFromMessage(message: RovoUIMessage): string {
	const text = getMessageText(message);
	if (text) {
		return text;
	}

	const widget = getLatestDataPart(message, "data-widget-data");
	if (!widget) {
		return "";
	}

	try {
		return JSON.stringify(widget.data.payload, null, 2);
	} catch {
		return String(widget.data.payload ?? "");
	}
}

function getFutureChatArtifactDocumentIdsFromMessages(
	messages: ReadonlyArray<RovoUIMessage>,
): string[] {
	const seenDocumentIds = new Set<string>();
	const documentIds: string[] = [];

	for (const message of messages) {
		const artifactResult = getMessageArtifactResult(message);
		if (!artifactResult?.documentId || seenDocumentIds.has(artifactResult.documentId)) {
			continue;
		}

		seenDocumentIds.add(artifactResult.documentId);
		documentIds.push(artifactResult.documentId);
	}

	return documentIds;
}

const PLAN_MODE_CONTEXT = [
	"Plan mode is enabled.",
	"If the request is missing essential build details, ask clarifying questions with ask_user_questions before proposing a plan.",
	"If you ask clarifying questions first, the next answer turn must end by calling exit_plan_mode unless a hard blocker still makes planning impossible.",
	"For build-oriented requests, finish the planning turn by calling exit_plan_mode with a concise markdown plan.",
	"Do not use free-form text, suggestion chips, invoke_subagents, or update_todo as a substitute for the exit_plan_mode handoff.",
].join(" ");

const PLAN_MODE_POST_CLARIFICATION_CONTEXT = [
	"[POST-CLARIFICATION — Plan Mode]",
	"Plan mode is enabled. The user has already answered clarification questions for this planning request.",
	"If the answers provide enough detail, proceed directly to plan generation now by calling exit_plan_mode with a concise markdown plan.",
	"If essential details are still missing, you may call ask_user_questions again to gather what you need before planning.",
	"Use the answered clarification details to finish planning, not implementation.",
	"Do not use free-form text, suggestion chips, invoke_subagents, or update_todo as a substitute for the exit_plan_mode handoff.",
	"[End POST-CLARIFICATION]",
].join(" ");

const PLAN_MODE_RETRY_PROMPT = [
	"The previous response did not include a plan widget with tasks.",
	"If you still need essential details, you may ask clarification questions. Otherwise, generate the plan.",
	"Generate the plan now by calling exit_plan_mode with a concise markdown plan.",
	"Do not explore the codebase. Do not use workspace tools.",
	"Your only action: call exit_plan_mode with the plan.",
].join(" ");

type FutureChatPlanningPhase = "awaiting-plan" | "retrying-missing-plan";

interface FutureChatPlanningSession {
	requestId: number;
	phase: FutureChatPlanningPhase;
	hasStreamStarted: boolean;
	retryUsed: boolean;
}

type FutureChatPlanMode = "default" | "plan";

function parseFutureChatPlanMode(value: unknown): FutureChatPlanMode | null {
	return value === "default" || value === "plan" ? value : null;
}

const VOICE_MODE_CONTEXT = [
	"The user is in voice mode — they are speaking to you and hearing your response read aloud.",
	"Keep responses concise and conversational, suitable for text-to-speech.",
	"Avoid heavy markdown formatting, bullet lists, and code blocks unless the user explicitly asks for them.",
	"You have access to browser automation tools. When the user asks you to browse a website, use the available browser tools to navigate, take snapshots, interact with elements, and describe what you see.",
].join(" ");

function toFutureChatUserErrorMessage(error: unknown): string {
	if (isFutureChatBackendUnavailableError(error)) {
		return getFutureChatBackendUnavailableUserMessage();
	}

	return error instanceof Error ? error.message : String(error);
}

function waitForFutureChat(ms: number): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function pushFutureChatHistoryPath(path: string): void {
	window.history.pushState(null, "", path);
}

function replaceFutureChatHistoryPath(path: string): void {
	window.history.replaceState(null, "", path);
}

const EXPLICIT_CANCEL_DEBOUNCE_MS = 750;
const ACTIVE_TURN_STOP_TIMEOUT_MS = 1_200;

function areFutureChatMessagesEqual(
	left: ReadonlyArray<RovoUIMessage>,
	right: ReadonlyArray<RovoUIMessage>,
): boolean {
	if (left === right) {
		return true;
	}

	if (left.length !== right.length) {
		return false;
	}

	for (let i = 0; i < left.length; i++) {
		if (left[i] !== right[i]) {
			return false;
		}
	}

	return true;
}

function normalizeRovodevMessagesForMerge(
	messages: ReadonlyArray<RovoUIMessage>,
	previousMessages: ReadonlyArray<RovoUIMessage>,
): {
	changed: boolean;
	messages: RovoUIMessage[];
} {
	const previousMessagesById = new Map(
		previousMessages.map((message) => [message.id, message]),
	);
	let didChange = false;

	const normalizedMessages = messages.map((message, index) => {
		const previousMessage = previousMessagesById.get(message.id);
		const previousText = previousMessage ? getMessageText(previousMessage) : "";
		const nextText = getMessageText(message);
		const existingCreatedAt = previousMessage?.metadata?.createdAt ?? message.metadata?.createdAt;
		const createdAt =
			existingCreatedAt ??
			new Date(Date.now() + index).toISOString();
		const updatedAt =
			previousMessage && previousText !== nextText
				? new Date().toISOString()
				: previousMessage?.metadata?.updatedAt ??
					message.metadata?.updatedAt ??
					createdAt;
		const metadata = {
			...(message.metadata ?? {}),
			origin: "rovodev" as const,
			createdAt,
			updatedAt,
		};

		if (
			message.metadata?.origin !== "rovodev"
			|| message.metadata?.createdAt !== createdAt
			|| message.metadata?.updatedAt !== updatedAt
		) {
			didChange = true;
		}

		return {
			...message,
			metadata,
		};
	});

	return {
		changed: didChange,
		messages: normalizedMessages,
	};
}

interface FutureChatArtifactContextPayload {
	content: string;
	id: string;
	kind: FutureChatDocumentKind;
	title: string;
}

interface FutureChatArtifactSteeringPayload {
	preferCurrentArtifact: true;
	source: "voice";
}

function buildArtifactContextPayload(
	document: Pick<FutureChatDocument, "id" | "title" | "kind">,
	content: string,
): FutureChatArtifactContextPayload {
	return {
		content,
		id: document.id,
		kind: document.kind,
		title: document.title,
	};
}

function buildStreamingArtifactContextPayload(
	artifact: FutureChatStreamingArtifact,
): FutureChatArtifactContextPayload | null {
	if (!artifact.documentId || !artifact.content.trim()) {
		return null;
	}

	return {
		content: artifact.content,
		id: artifact.documentId,
		kind: artifact.kind,
		title: artifact.title,
	};
}

function resolveActiveArtifactContext(
	activeDocument: FutureChatDocument | null,
	artifactDraftContent: string,
	activeDocumentContent: string,
	streamingArtifact: FutureChatStreamingArtifact | null,
): FutureChatArtifactContextPayload | null {
	if (activeDocument && artifactDraftContent.trim()) {
		return buildArtifactContextPayload(activeDocument, artifactDraftContent);
	}
	if (activeDocument) {
		return buildArtifactContextPayload(activeDocument, activeDocumentContent);
	}
	if (streamingArtifact) {
		return buildStreamingArtifactContextPayload(streamingArtifact);
	}
	return null;
}

function buildActiveArtifactMetadata(
	activeDocument: FutureChatDocument | null,
): FutureChatActiveArtifact | undefined {
	if (!activeDocument) {
		return undefined;
	}
	return {
		id: activeDocument.id,
		title: activeDocument.title,
		kind: activeDocument.kind,
	};
}

function buildRecentHistory(
	messages: ReadonlyArray<RovoUIMessage>,
	limit = 5,
): FutureChatRecentHistoryEntry[] {
	const history: FutureChatRecentHistoryEntry[] = [];
	for (let i = messages.length - 1; i >= 0 && history.length < limit; i--) {
		const message = messages[i];
		if (message.role !== "user" && message.role !== "assistant") {
			continue;
		}
		const text = getMessageText(message);
		if (!text.trim()) {
			continue;
		}
		history.unshift({
			role: message.role,
			content: text.slice(0, 500),
		});
	}
	return history;
}

export interface FutureChatHookOptions {
	embedded?: boolean;
	initialThreadId?: string | null;
	smartGenerationLayout?: {
		containerWidthPx?: number;
		viewportWidthPx?: number;
		widthClass?: FutureChatSmartWidthClass;
	};
}

export interface FutureChatHookResult {
	activeDocument: FutureChatDocument | null;
	activeToolApproval: ToolApprovalPayload | null;
	activeDocumentContent: string;
	activeThreadId: string | null;
	applyVoiceSteer: (payload: {
		text: string;
		contextDescription?: string;
	}) => Promise<void>;
	artifactMode: ArtifactMode;
	artifactDraftContent: string;
	backgroundStreamThreadIds: ReadonlySet<string>;
	deleteAllThreads: () => Promise<void>;
	deleteDocument: (documentId: string) => Promise<void>;
	deleteThread: (threadId: string) => Promise<void>;
	cancelThreadRun: (threadId: string) => Promise<boolean>;
	documents: FutureChatDocument[];
	editMessage: (messageId: string, nextText: string) => Promise<void>;
	editingMessageId: string | null;
	inputError: string | null;
	interruptActiveTurn: (options?: {
		source: RovoMessageInterruptionSource;
	}) => Promise<void>;
	isArtifactOpen: boolean;
	isGeneratingTitle: boolean;
	isLoadingThread: boolean;
	isStreaming: boolean;
	isPlanMode: boolean;
	isVoiceMode: boolean;
	loadThread: (threadId: string) => Promise<void>;
	messages: RovoUIMessage[];
	panelState: FutureChatPanelState;
	setPanelState: (state: FutureChatPanelState) => void;
	pendingTitleThreadId: string | null;
	openDocument: (documentId: string) => Promise<void>;
	openPlanAsDocument: (plan: { title: string; markdown: string; sourceMessageId?: string | null }) => void;
	openArtifactFromMessage: (message: RovoUIMessage) => Promise<void>;
	openNewChat: () => Promise<void>;
	regenerateLatest: () => void;
	removeQueuedPrompt: (id: string) => void;
	runtimeThreadId: string;
	saveArtifactDraft: () => Promise<void>;
	selectedVersionId: string | null;
	setActiveDocumentId: (documentId: string | null) => void;
	setArtifactDraftContent: (value: string) => void;
	setArtifactMode: (mode: ArtifactMode) => void;
	setEditingMessageId: (messageId: string | null) => void;
	setSelectedVersionId: (versionId: string | null) => void;
	setSidebarOpen: (isOpen: boolean) => void;
	setThreadVisibility: (visibility: FutureChatVisibility) => void;
	setVoiceMode: (next: boolean) => void;
	sidebarOpen: boolean;
	backgroundArtifactLabel: string | null;
	backgroundDelegationLabel: string | null;
	composerStatus: ChatStatus;
	hasBackgroundDelegation: boolean;
	status: ChatStatus;
	stop: () => Promise<void>;
	submitToolApproval: (
		toolApproval: ToolApprovalPayload,
		decisions: Array<{ toolCallId: string; approved: boolean; denyMessage?: string }>,
	) => Promise<void>;
	cancelClarificationQuestionSet: (questionCard: ParsedQuestionCardPayload) => Promise<boolean>;
	submitClarification: (questionCard: ParsedQuestionCardPayload, answers: ClarificationAnswers) => Promise<void>;
	submitClarificationDismiss: (questionCard: ParsedQuestionCardPayload) => Promise<void>;
	acceptPlanReview: (planWidget: ParsedPlanWidgetPayload) => Promise<void>;
	submitPrompt: (payload: { text: string; files: FileUIPart[]; contextDescription?: string }) => Promise<void>;
	suggestedPrompt: (text: string) => Promise<void>;
	togglePlanMode: () => Promise<void>;
	resetPlanMode: () => void;
	toggleVoiceMode: () => void;
	pendingArtifactResult: FutureChatPendingArtifactResult | null;
	queuedPrompts: ReadonlyArray<FutureChatQueuedAction>;
	shouldSuppressLatestAssistantSuggestions: boolean;
	shouldQueueNextSubmission: boolean;
	hideArtifactPane: () => void;
	streamingArtifact: FutureChatStreamingArtifact | null;
	streamingArtifactMessageId: string | null;
	visibleArtifactDocumentId: string | null;
	setVisibleArtifactDocumentId: (documentId: string | null) => void;
	threads: FutureChatThread[];
	threadsLoaded: boolean;
	threadVisibility: FutureChatVisibility;
	votes: Record<string, VoteValue>;
	voteOnMessage: (messageId: string, value: VoteValue | null) => Promise<void>;
	appendRealtimeMessage: (
		role: "user" | "assistant",
		content: string,
		options?: {
			createdAt?: string;
			messageId?: string;
			metadata?: RovoUIMessage["metadata"];
			state?: "done" | "streaming";
		},
	) => Promise<string>;
	delegateToRovodev: (
		messageId: string,
		options?: {
			contextDescription?: string;
			conversationSummary?: string;
			intentType?: string;
			prompt?: string;
			referencedFiles?: string[];
			urgency?: string;
		},
	) => Promise<void>;
	setRealtimeMessageContent: (messageId: string, content: string) => void;
	updateRealtimeMessage: (messageId: string, contentDelta: string) => void;
}

function meetsStreamingAutoOpenContentThreshold(
	artifact: FutureChatStreamingArtifact | null,
): boolean {
	if (!artifact?.documentId) {
		return false;
	}

	if (artifact.kind === "sheet") {
		return artifact.content.trim().length > 0;
	}

	if (artifact.kind === "code") {
		return artifact.content.length >= 300;
	}

	if (artifact.kind === "image") {
		return artifact.content.trim().length > 0;
	}

	return artifact.content.length >= 400;
}

export function useFutureChat({
	embedded = false,
	initialThreadId = null,
	smartGenerationLayout,
}: Readonly<FutureChatHookOptions>): FutureChatHookResult {
	const router = useRouter();
	const [draftThreadId, setDraftThreadId] = useState(() => initialThreadId ?? createFutureChatId());
	const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId);
	const [threads, setThreads] = useState<FutureChatThread[]>([]);
	const [threadsLoaded, setThreadsLoaded] = useState(false);
	const [documents, setDocuments] = useState<FutureChatDocument[]>([]);
	const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
	const [threadVisibility, setThreadVisibility] = useState<FutureChatVisibility>("private");
	const [sidebarOpen, setSidebarOpen] = useState(() => !embedded);
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [artifactMode, setArtifactMode] = useState<ArtifactMode>("preview");
	const [artifactDraftContent, setArtifactDraftContent] = useState("");
	const [visibleArtifactDocumentId, setVisibleArtifactDocumentId] = useState<string | null>(null);
	const [panelState, setPanelState] = useState<FutureChatPanelState>("closed");
	const [pendingArtifactResult, setPendingArtifactResult] =
		useState<FutureChatPendingArtifactResult | null>(null);
	const [streamingArtifact, setStreamingArtifact] = useState<FutureChatStreamingArtifact | null>(null);
	const [streamingArtifactMessageId, setStreamingArtifactMessageId] = useState<string | null>(null);
	const pendingArtifactAssociationRef = useRef(false);
	const [votes, setVotes] = useState<Record<string, VoteValue>>({});
	const [inputError, setInputError] = useState<string | null>(null);
	const [isLoadingThread, setIsLoadingThread] = useState(() => initialThreadId !== null);
	const [hasActiveDispatch, setHasActiveDispatch] = useState(false);
	const queueProcessorRunningRef = useRef(false);
	const processQueueRef = useRef<() => Promise<void>>(async () => {});
	const kickQueue = useCallback(() => {
		void processQueueRef.current();
	}, []);
	const [isVoiceMode, setIsVoiceMode] = useState(false);
	const [realtimeMessages, setRealtimeMessages] = useState<RovoUIMessage[]>([]);
	const [delegationTurnStatus, setDelegationTurnStatus] =
		useState<ChatStatus>("ready");
	const [directDelegationPhase, setDirectDelegationPhase] =
		useState<FutureChatDirectDelegationPhase>("idle");
	const [backgroundDelegationMessageId, setBackgroundDelegationMessageId] =
		useState<string | null>(null);
	const toggleVoiceMode = useCallback(() => setIsVoiceMode((prev) => !prev), []);
	const setVoiceMode = useCallback((next: boolean) => setIsVoiceMode(next), []);
	const [isPlanMode, setIsPlanMode] = useState(false);
	const [planningSession, setPlanningSession] = useState<FutureChatPlanningSession | null>(null);
	const [attachedRunStatus, setAttachedRunStatus] = useState<FutureChatRunStatus | null>(null);
	const attachedRunStatusRef = useRef<FutureChatRunStatus | null>(null);
	const [hasObservedTurnComplete, setHasObservedTurnComplete] = useState(false);
	const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
	const [pendingTitleThreadId, setPendingTitleThreadId] = useState<string | null>(null);
	const {
		appendQueuedActionsForThread,
		clearQueuedActionsForThread,
		enqueueQueuedAction,
		peekNextQueuedActionForThread,
		queuedActionsByThreadId,
		removeQueuedAction,
		shiftNextQueuedActionForThread,
	} = useFutureChatQueue();
	const hasObservedTurnCompleteRef = useRef(false);
	const pendingTitleThreadIdRef = useRef<string | null>(null);
	const pendingTitleMessageRef = useRef<string | null>(null);
	const planModeSyncRequestIdRef = useRef(0);
	const pendingPlanModeOverrideRef = useRef<FutureChatAgentMode | null>(null);
	const resetObservedTurnComplete = useCallback(() => {
		hasObservedTurnCompleteRef.current = false;
		setHasObservedTurnComplete(false);
	}, []);
	const markObservedTurnComplete = useCallback(() => {
		hasObservedTurnCompleteRef.current = true;
		setHasObservedTurnComplete(true);
	}, []);
	const clearDirectDelegationState = useCallback(() => {
		setBackgroundDelegationMessageId(null);
		setDelegationTurnStatus("ready");
		setDirectDelegationPhase("idle");
	}, []);
	const clearArtifactState = useCallback(() => {
		setActiveDocumentId(null);
		setVisibleArtifactDocumentId(null);
		setPanelState("closed");
		setSelectedVersionId(null);
		setArtifactDraftContent("");
		setArtifactMode("preview");
	}, []);
	const resolveChatTitle = useCallback(
		(threadId: string, title: string) => {
			const normalizedTitle = title.trim().replace(/^["']|["']$/g, "").replace(/\.+$/, "").trim();
			if (!normalizedTitle) return;

			setThreads((previousThreads) =>
				upsertFutureChatThreadRecord(
					previousThreads,
					{
						...previousThreads.find((t) => t.id === threadId)!,
						title: normalizedTitle,
						updatedAt: new Date().toISOString(),
					},
					{ deletedThreadIds: deletedThreadIdsRef.current },
				),
			);

			void updateFutureChatThread(threadId, { title: normalizedTitle });

			if (pendingTitleThreadIdRef.current === threadId) {
				pendingTitleThreadIdRef.current = null;
				setPendingTitleThreadId(null);
				setIsGeneratingTitle(false);
			}
		},
		[],
	);

	const selectDocumentForDisplay = useCallback((document: FutureChatDocument) => {
		setDocuments((previousDocuments) => upsertDocumentRecord(previousDocuments, document));
		setActiveDocumentId(document.id);
		setSelectedVersionId(document.versions.at(-1)?.id ?? null);
		setArtifactDraftContent(getLatestDocumentContent(document));
		setArtifactMode("preview");
	}, []);
	const activeDocument = useMemo(() => {
		return documents.find((document) => document.id === activeDocumentId) ?? null;
	}, [activeDocumentId, documents]);
	const currentThread = useMemo(() => {
		return threads.find((thread) => thread.id === activeThreadId) ?? null;
	}, [activeThreadId, threads]);
	const backgroundStreamThreadIds = useMemo(() => {
		return new Set(
			threads
				.filter((thread) => thread.activeRun != null)
				.map((thread) => thread.id),
		);
	}, [threads]);
	const backgroundRefreshThreadIds = useMemo(() => {
		return getFutureChatBackgroundRefreshThreadIds({
			activeThreadId,
			threads,
		});
	}, [activeThreadId, threads]);
	const backgroundRefreshThreadIdsKey = useMemo(() => {
		return JSON.stringify(backgroundRefreshThreadIds);
	}, [backgroundRefreshThreadIds]);
	const activeDocumentContent = useMemo(() => {
		return getLatestDocumentContent(activeDocument);
	}, [activeDocument]);
	const smartGenerationRequest = useMemo(() => {
		return {
			enabled: true,
			surface: embedded ? "future-chat-preview" : "future-chat",
			containerWidthPx: smartGenerationLayout?.containerWidthPx,
			viewportWidthPx: smartGenerationLayout?.viewportWidthPx,
			widthClass: smartGenerationLayout?.widthClass,
		};
	}, [
		embedded,
		smartGenerationLayout?.containerWidthPx,
		smartGenerationLayout?.viewportWidthPx,
		smartGenerationLayout?.widthClass,
	]);
	const runtimeThreadId = activeThreadId ?? draftThreadId;
	const queuedPrompts = useMemo(
		() => queuedActionsByThreadId[runtimeThreadId] ?? [],
		[queuedActionsByThreadId, runtimeThreadId],
	);
	const lastPersistedKeyRef = useRef<string>("");
	const isHydratingThreadRef = useRef(false);
	const activeThreadIdRef = useRef<string | null>(initialThreadId);
	const activeDocumentRef = useLatestRef(activeDocument);
	const streamingArtifactRef = useLatestRef(streamingArtifact);
	const queuedStreamingArtifactDeltaRef = useRef("");
	const queuedStreamingArtifactKindRef = useRef<FutureChatDocumentKind | null>(null);
	const queuedStreamingArtifactFrameRef = useRef<number | null>(null);
	const streamingArtifactMessageIdRef = useRef<string | null>(null);
	const visibleArtifactDocumentIdRef = useLatestRef(visibleArtifactDocumentId);
	const lastCompletedArtifactDocumentIdRef = useRef<string | null>(null);
	const pendingArtifactCreationRetryRef = useRef(false);
	const currentTurnIntentRef = useRef<string | null>(null);
	const suppressedStreamingAutoOpenDocumentIdRef = useRef<string | null>(null);
	const isVoiceModeRef = useLatestRef(isVoiceMode);
	const isPlanModeRef = useLatestRef(isPlanMode);
	const rovodevMessagesRef = useRef<RovoUIMessage[]>([]);
	const realtimeMessagesRef = useRef<RovoUIMessage[]>([]);
	const realtimeMessagesVersionRef = useRef(0);
	const statusRef = useRef<ChatStatus>("ready");
	const useChatStatusRef = useRef<ChatStatus>("ready");
	const lastUseChatBusyAtRef = useRef(0);
	const delegationAbortControllerRef = useRef<AbortController | null>(null);
	const runSubscriptionAbortControllerRef = useRef<AbortController | null>(null);
	const runSubscriptionThreadIdRef = useRef<string | null>(null);
	const interruptPromiseRef = useRef<Promise<void> | null>(null);
	const lastExplicitCancelAtRef = useRef(0);
	const hasHydratedActiveThreadRef = useRef(false);
	const lastLoadedInitialThreadIdRef = useRef<string | null>(null);
	const pendingRouteThreadIdRef = useRef<string | null>(null);
	const pendingRouteReadyRef = useRef(false);
	const pendingThreadCreationRef = useRef<Promise<string> | null>(null);
	const deletedThreadIdsRef = useRef<Set<string>>(new Set());
	const requestedSuggestionMessageIdsRef = useRef<Set<string>>(new Set());
	const suggestionsAbortControllerRef = useRef<AbortController | null>(null);
	const syncPlanModeFromBackend = useCallback(async () => {
		const localModeOverride = pendingPlanModeOverrideRef.current;
		if (localModeOverride) {
			setIsPlanMode(localModeOverride === "plan");
			return localModeOverride;
		}

		const requestId = planModeSyncRequestIdRef.current + 1;
		planModeSyncRequestIdRef.current = requestId;

		try {
			const response = await fetch(API_ENDPOINTS.AGENT_MODE, {
				method: "GET",
			});
			if (!response.ok) {
				return null;
			}

			const payload = await response.json().catch(() => null);
			const mode = parseFutureChatPlanMode(payload?.mode);
			if (
				mode === null ||
				planModeSyncRequestIdRef.current !== requestId
			) {
				return null;
			}

			setIsPlanMode(mode === "plan");
			return mode;
		} catch {
			return null;
		}
	}, []);

	const removeQueuedPrompt = useCallback(
		(id: string) => {
			if (!id) {
				return;
			}

			removeQueuedAction(runtimeThreadId, id);
		},
		[removeQueuedAction, runtimeThreadId],
	);

	useEffect(() => {
		activeThreadIdRef.current = activeThreadId;
	}, [activeThreadId]);

	useEffect(() => {
		void syncPlanModeFromBackend();
	}, [syncPlanModeFromBackend]);

	const setLocalThreadActiveRun = useCallback(
		(threadId: string, activeRun: FutureChatActiveRun | null) => {
			setThreads((previousThreads) =>
				previousThreads.map((thread) => {
					if (thread.id !== threadId) {
						return thread;
					}

					return {
						...thread,
						activeRun,
						updatedAt: new Date().toISOString(),
					};
				}),
			);
		},
		[],
	);

	const markLocalThreadRunPending = useCallback(
		(threadId: string, status: FutureChatRunStatus = "streaming") => {
			const now = new Date().toISOString();
			resetObservedTurnComplete();
			setLocalThreadActiveRun(threadId, {
				id: `future-chat-run-local-${threadId}`,
				status,
				rovoPort: null,
				startedAt: now,
				updatedAt: now,
			});
			setAttachedRunStatus(status);
		},
		[resetObservedTurnComplete, setLocalThreadActiveRun],
	);

	const clearQueuedStreamingArtifactDelta = useCallback(() => {
		if (queuedStreamingArtifactFrameRef.current !== null) {
			window.cancelAnimationFrame(queuedStreamingArtifactFrameRef.current);
			queuedStreamingArtifactFrameRef.current = null;
		}

		queuedStreamingArtifactDeltaRef.current = "";
		queuedStreamingArtifactKindRef.current = null;
	}, []);

	const flushQueuedStreamingArtifactDelta = useCallback(() => {
		const delta = queuedStreamingArtifactDeltaRef.current;
		if (!delta) {
			return;
		}

		const kind = queuedStreamingArtifactKindRef.current ?? undefined;
		queuedStreamingArtifactDeltaRef.current = "";
		queuedStreamingArtifactKindRef.current = null;

		setStreamingArtifact((prev) =>
			appendFutureChatStreamingArtifactDelta({
				current: prev,
				delta,
				kind,
				timestamp: new Date().toISOString(),
			}),
		);
	}, []);

	const flushQueuedStreamingArtifactDeltaNow = useCallback(() => {
		if (queuedStreamingArtifactFrameRef.current !== null) {
			window.cancelAnimationFrame(queuedStreamingArtifactFrameRef.current);
			queuedStreamingArtifactFrameRef.current = null;
		}

		flushQueuedStreamingArtifactDelta();
	}, [flushQueuedStreamingArtifactDelta]);

	const queueStreamingArtifactDelta = useCallback(
		(delta: string, kind?: FutureChatDocumentKind) => {
			if (!delta) {
				return;
			}

			queuedStreamingArtifactDeltaRef.current += delta;
			if (kind) {
				queuedStreamingArtifactKindRef.current = kind;
			}
			if (queuedStreamingArtifactFrameRef.current !== null) {
				return;
			}

			queuedStreamingArtifactFrameRef.current = window.requestAnimationFrame(() => {
				queuedStreamingArtifactFrameRef.current = null;
				flushQueuedStreamingArtifactDelta();
			});
		},
		[flushQueuedStreamingArtifactDelta],
	);

	const clearStreamingArtifactState = useCallback(() => {
		clearQueuedStreamingArtifactDelta();
		setStreamingArtifact(null);
	}, [clearQueuedStreamingArtifactDelta]);

	useEffect(() => {
		streamingArtifactMessageIdRef.current = streamingArtifactMessageId;
	}, [streamingArtifactMessageId]);

	useEffect(() => {
		return () => {
			if (queuedStreamingArtifactFrameRef.current !== null) {
				window.cancelAnimationFrame(queuedStreamingArtifactFrameRef.current);
			}
			runSubscriptionAbortControllerRef.current?.abort();
		};
	}, []);

	useEffect(() => {
		realtimeMessagesRef.current = realtimeMessages;
	}, [realtimeMessages]);

	const replaceRealtimeMessagesState = useCallback(
		(
			nextMessages: RovoUIMessage[],
			{
				incrementVersion = true,
			}: {
				incrementVersion?: boolean;
			} = {},
		): RovoUIMessage[] => {
			realtimeMessagesRef.current = nextMessages;
			if (incrementVersion) {
				realtimeMessagesVersionRef.current += 1;
			}
			setRealtimeMessages(nextMessages);
			return nextMessages;
		},
		[],
	);

	const mutateRealtimeMessagesState = useCallback(
		(
			updater: (currentMessages: RovoUIMessage[]) => RovoUIMessage[],
			{
				incrementVersion = true,
			}: {
				incrementVersion?: boolean;
			} = {},
		): RovoUIMessage[] => {
			return replaceRealtimeMessagesState(
				updater(realtimeMessagesRef.current),
				{ incrementVersion },
			);
		},
		[replaceRealtimeMessagesState],
	);

	const transport = useMemo(
		() =>
			new DefaultChatTransport<RovoUIMessage>({
				api: API_ENDPOINTS.FUTURE_CHAT_CHAT,
				prepareSendMessagesRequest: ({ messages, body }) => {
					const requestedPlanMode =
						typeof body?.isPlanMode === "boolean"
							? body.isPlanMode
							: isPlanModeRef.current;
					const existingContextDescription =
						typeof body?.contextDescription === "string" &&
						body.contextDescription.trim()
							? body.contextDescription.trim()
							: null;

					const resolvedContextDescription =
						existingContextDescription
						?? (requestedPlanMode ? PLAN_MODE_CONTEXT : undefined)
						?? (isVoiceModeRef.current ? VOICE_MODE_CONTEXT : undefined);
					const artifactContextFromBody =
						body?.artifactContext &&
						typeof body.artifactContext === "object" &&
						"id" in body.artifactContext &&
						"title" in body.artifactContext &&
						"kind" in body.artifactContext &&
						"content" in body.artifactContext
							? body.artifactContext
							: null;
					const activeArtifactContext = resolveActiveArtifactContext(
						activeDocument, artifactDraftContent, activeDocumentContent, streamingArtifact,
					);

					const explicitThreadId =
						typeof body?.id === "string" && body.id.trim()
							? body.id.trim()
							: null;
					const latestVisibleUserPrompt =
						getLatestVisibleFutureChatUserPrompt(messages);
					const hasPendingStructuredContinuation =
						hasPendingFutureChatStructuredContinuation(messages);
					const isVoiceTurn =
						body?.origin === "voice" || isVoiceModeRef.current;
					const hasStructuredTurnBody = Boolean(
						body?.clarification
						|| body?.deferredToolResponse
						|| body?.approval
						|| body?.toolApproval
					);
					const turnMode = classifyFutureChatTurnMode({
						prompt: latestVisibleUserPrompt?.text ?? "",
						hasActiveArtifact: Boolean(
							activeArtifactContext?.id
							|| artifactContextFromBody?.id
							|| activeDocumentId
						),
						hasAttachments: latestVisibleUserPrompt?.hasAttachments ?? false,
						hasPendingStructuredContinuation,
						hasStreamingArtifact: Boolean(streamingArtifact?.documentId),
						hasStructuredTurnBody,
						isPlanMode: requestedPlanMode,
						isVoiceTurn,
					});
					const resolvedSmartGenerationRequest =
						turnMode === "plain_chat"
							? undefined
							: smartGenerationRequest;

					return {
						body: {
							...(body ?? {}),
							activeDocumentId:
								artifactContextFromBody?.id ??
								activeArtifactContext?.id ??
								activeDocumentId ??
								null,
							id: explicitThreadId ?? runtimeThreadId,
							messages,
							contextDescription: resolvedContextDescription,
							visibility: threadVisibility,
							artifactContext:
								artifactContextFromBody ??
								activeArtifactContext ??
								undefined,
							smartGeneration: resolvedSmartGenerationRequest,
							activeArtifact: buildActiveArtifactMetadata(activeDocument),
							artifactCreationRetry: pendingArtifactCreationRetryRef.current || undefined,
							origin: body?.origin === "voice" ? "voice" : "text",
							recentHistory: buildRecentHistory(messages),
							isPlanMode: requestedPlanMode,
						},
					};
				},
			}),
		[
			activeDocument,
			activeDocumentId,
			artifactDraftContent,
			activeDocumentContent,
			isPlanModeRef,
			isVoiceModeRef,
			runtimeThreadId,
			smartGenerationRequest,
			streamingArtifact,
			threadVisibility,
		],
	);

	const resetPendingArtifactAssociation = useCallback(() => {
		setPendingArtifactResult(null);
		setStreamingArtifactMessageId(null);
		streamingArtifactMessageIdRef.current = null;
		pendingArtifactAssociationRef.current = false;
		lastCompletedArtifactDocumentIdRef.current = null;
		suppressedStreamingAutoOpenDocumentIdRef.current = null;
	}, []);

	const hideArtifactPane = useCallback(() => {
		const streamingDocumentId = streamingArtifactRef.current?.documentId ?? null;
		if (
			streamingDocumentId &&
			visibleArtifactDocumentId === streamingDocumentId
		) {
			suppressedStreamingAutoOpenDocumentIdRef.current = streamingDocumentId;
		}

		setVisibleArtifactDocumentId(null);
		setPanelState("closed");
	}, [streamingArtifactRef, visibleArtifactDocumentId]);

	const persistActiveDocumentSelection = useCallback((documentId: string | null) => {
		const threadId = activeThreadIdRef.current;
		if (!threadId) {
			return;
		}

		void updateFutureChatThread(threadId, {
			activeDocumentId: documentId,
		})
			.then((thread) => {
				setThreads((previousThreads) =>
					upsertFutureChatThreadRecord(previousThreads, thread, {
						deletedThreadIds: deletedThreadIdsRef.current,
					}),
				);
			})
			.catch((error) => {
				console.warn(
					"[FutureChat] Failed to persist active artifact selection:",
					toFutureChatUserErrorMessage(error),
				);
			});
	}, []);

	const saveStreamingArtifactCheckpoint = useCallback(async () => {
		const checkpoint = getFutureChatStreamingArtifactCheckpoint(streamingArtifactRef.current);
		if (!checkpoint) {
			return null;
		}

		const document = await saveFutureChatDocument({
			changeLabel: "Steered checkpoint",
			documentId: checkpoint.documentId,
			title: checkpoint.title,
			kind: checkpoint.kind,
			content: checkpoint.content,
		});
		selectDocumentForDisplay(document);
		return document;
	}, [selectDocumentForDisplay, streamingArtifactRef]);

	const hydratePersistedArtifact = useCallback(async (documentId: string) => {
		try {
			let document = null;
			for (let attempt = 0; attempt < 5; attempt++) {
				document = await getFutureChatDocument(documentId);
				if (document) {
					break;
				}

				await waitForFutureChat(150 * (attempt + 1));
			}

			if (!document) {
				clearArtifactState();
				return null;
			}

			selectDocumentForDisplay(document);
			return document;
		} catch (error) {
			if (isFutureChatBackendUnavailableError(error)) {
				setInputError(getFutureChatBackendUnavailableUserMessage());
				return null;
			}

			console.error("[FutureChat] Failed to hydrate streamed artifact:", error);
			return null;
		}
	}, [clearArtifactState, selectDocumentForDisplay]);

	const handleFutureChatDataPart = useCallback(
		(dataPart: { data: unknown; type: string }) => {
			const updateArtifact = (
				patch: Partial<FutureChatStreamingArtifact>,
			) => {
				const now = new Date().toISOString();
				setStreamingArtifact((prev) => ({
					content: prev?.content ?? "",
					documentId: prev?.documentId ?? null,
					createdAt: prev?.createdAt ?? now,
					kind: prev?.kind ?? "text",
					status: "streaming" as const,
					title: prev?.title ?? "Artifact draft",
					updatedAt: now,
					...patch,
				}));
			};
			const updatePendingArtifact = (
				patch: Partial<FutureChatPendingArtifactResult>,
			) => {
				setPendingArtifactResult((prev) => ({
					action: prev?.action ?? null,
					documentId: prev?.documentId ?? null,
					kind: prev?.kind ?? "text",
					title: prev?.title ?? "Artifact draft",
					...patch,
				}));
			};

			switch (dataPart.type) {
				case "data-id": {
					const documentId =
						typeof dataPart.data === "string" && dataPart.data.trim()
							? dataPart.data
							: null;
					if (!documentId) {
						break;
					}

					updateArtifact({ documentId });
					updatePendingArtifact({ documentId });
					suppressedStreamingAutoOpenDocumentIdRef.current = null;
					setActiveDocumentId(documentId);
					persistActiveDocumentSelection(documentId);
					setSelectedVersionId("streaming");
					setArtifactMode("preview");
					pendingArtifactAssociationRef.current = true;
					break;
				}

				case "data-title": {
					const title =
						typeof dataPart.data === "string" && dataPart.data.trim()
							? dataPart.data
							: null;
					if (!title) {
						break;
					}

					updateArtifact({ title });
					updatePendingArtifact({ title });
					break;
				}

				case "data-kind": {
					const kind =
						dataPart.data === "text"
						|| dataPart.data === "code"
						|| dataPart.data === "image"
						|| dataPart.data === "sheet"
							? dataPart.data
							: null;
					if (!kind) {
						break;
					}

					updateArtifact({ kind });
					updatePendingArtifact({ kind });
					break;
				}

				case "data-clear":
					clearQueuedStreamingArtifactDelta();
					setStreamingArtifact((prev) =>
						prev
							? { ...prev, content: "", status: "streaming", updatedAt: new Date().toISOString() }
							: null,
					);
					break;

				case "data-textDelta":
				case "data-codeDelta": {
					if (typeof dataPart.data !== "string" || !dataPart.data) {
						break;
					}

					queueStreamingArtifactDelta(
						dataPart.data,
						dataPart.type === "data-codeDelta" ? "code" : undefined,
					);
					break;
				}

				case "data-finish": {
					flushQueuedStreamingArtifactDeltaNow();
					const documentId = streamingArtifactRef.current?.documentId;
					setStreamingArtifact((prev) =>
						prev
							? { ...prev, status: "idle", updatedAt: new Date().toISOString() }
							: prev,
					);
					if (documentId) {
						void hydratePersistedArtifact(documentId)
							.then((document) => {
								setStreamingArtifact((prev) => {
									if (!prev || prev.documentId !== documentId) {
										return prev;
									}

									if (document) {
										return null;
									}

									return visibleArtifactDocumentIdRef.current === documentId
										? prev
										: null;
								});
							});
					}
					break;
				}

				case "data-artifact-result": {
					if (
						!dataPart.data
						|| typeof dataPart.data !== "object"
						|| !("documentId" in dataPart.data)
						|| !("action" in dataPart.data)
						|| !("kind" in dataPart.data)
						|| !("title" in dataPart.data)
					) {
						break;
					}

					const artifactResult = dataPart.data as {
						action: "create" | "update";
						documentId: string;
						kind: FutureChatDocumentKind;
						title: string;
					};
					lastCompletedArtifactDocumentIdRef.current = artifactResult.documentId;
					if (artifactResult.action === "create") {
						pendingArtifactCreationRetryRef.current = false;
					}
					updatePendingArtifact({
						action: artifactResult.action,
						documentId: artifactResult.documentId,
						kind: artifactResult.kind,
						title: artifactResult.title,
					});
					break;
				}

				case "data-todo-queue": {
					const normalizedTodoQueuePayload =
						normalizeFutureChatTodoQueuePayload(dataPart.data);
					const threadId = activeThreadIdRef.current ?? draftThreadId;
					if (!normalizedTodoQueuePayload || !threadId) {
						break;
					}

					appendQueuedActionsForThread(
						threadId,
						buildFutureChatQueuedPromptsFromTodoQueue(
							normalizedTodoQueuePayload,
							threadId,
							createFutureChatQueueItemId,
						),
					);
					kickQueue();
					break;
				}

				case "data-cancel-streaming":
					toast("Previous version saved", {
						description: "A partial version was saved before starting the new one.",
					});
					break;

					case "data-turn-complete": {
						markObservedTurnComplete();
						setAttachedRunStatus(null);
						const threadId = activeThreadIdRef.current;
						if (threadId) {
							setLocalThreadActiveRun(threadId, null);
						}
						currentTurnIntentRef.current = null;
						void syncPlanModeFromBackend();
						kickQueue();
						break;
					}

				case "data-route-decision": {
					const routeData = dataPart.data as { intent?: string } | null;
					if (routeData?.intent) {
						currentTurnIntentRef.current = routeData.intent;
					}
					break;
				}

				default:
					break;
			}
		},
			[
				clearQueuedStreamingArtifactDelta,
				flushQueuedStreamingArtifactDeltaNow,
				hydratePersistedArtifact,
				kickQueue,
				markObservedTurnComplete,
				appendQueuedActionsForThread,
				persistActiveDocumentSelection,
				queueStreamingArtifactDelta,
				setLocalThreadActiveRun,
				syncPlanModeFromBackend,
				draftThreadId,
				streamingArtifactRef,
				visibleArtifactDocumentIdRef,
			],
		);

	const {
		messages: rovodevMessages,
		setMessages: setRovodevMessages,
		sendMessage,
		stop: stopUseChat,
		regenerate,
		status: useChatStatus,
	} = useChat<RovoUIMessage>({
		transport,
		onData: handleFutureChatDataPart,
			onError: (error) => {
			const streamingDocumentId = streamingArtifactRef.current?.documentId;
			const turnIntent = currentTurnIntentRef.current;
			clearStreamingArtifactState();
			resetPendingArtifactAssociation();
			if (!activeDocumentRef.current && streamingDocumentId) {
				clearArtifactState();
			}
			// If artifact creation was in progress but failed, mark for retry on next turn
			if (turnIntent === "artifact_create") {
				pendingArtifactCreationRetryRef.current = true;
			}
			currentTurnIntentRef.current = null;
			setInputError(toFutureChatUserErrorMessage(error));
		},
			onFinish: () => {
				if (activeThreadIdRef.current) {
					setLocalThreadActiveRun(activeThreadIdRef.current, null);
				}
				setAttachedRunStatus(null);
				kickQueue();
			},
	});

	const handleAttachedRunChunk = useCallback(
		(chunk: { data?: unknown; type?: string }) => {
			if (!chunk?.type || !chunk.type.startsWith("data-")) {
				return;
			}

			if (attachedRunStatus === "queued") {
				setAttachedRunStatus("streaming");
				const threadId = runSubscriptionThreadIdRef.current;
				if (threadId) {
					setThreads((previousThreads) =>
						previousThreads.map((thread) => {
							if (thread.id !== threadId || !thread.activeRun) {
								return thread;
							}

							return {
								...thread,
								activeRun: {
									...thread.activeRun,
									status: "streaming",
									updatedAt: new Date().toISOString(),
								},
							};
						}),
					);
				}
			}

			handleFutureChatDataPart({
				type: chunk.type,
				data: chunk.data,
			});
		},
		[attachedRunStatus, handleFutureChatDataPart],
	);

	const normalizedRovodevMessages = useMemo(() => {
		return normalizeRovodevMessagesForMerge(
			rovodevMessages,
			rovodevMessagesRef.current,
		).messages;
	}, [rovodevMessages]);

	useEffect(() => {
		rovodevMessagesRef.current = normalizedRovodevMessages;
	}, [normalizedRovodevMessages]);

	const messages = useMemo(() => {
		return mergeFutureChatMessages({
			realtimeMessages,
			rovodevMessages: normalizedRovodevMessages,
		});
	}, [normalizedRovodevMessages, realtimeMessages]);
	const activeToolApproval = useMemo(() => {
		return getLatestPendingToolApproval(normalizedRovodevMessages);
	}, [normalizedRovodevMessages]);
	const latestThinkingStatusLabel = useMemo(() => {
		if (!backgroundDelegationMessageId) {
			return null;
		}

		const backgroundDelegationMessage = messages.find((message) => {
			return message.id === backgroundDelegationMessageId;
		});
		if (!backgroundDelegationMessage) {
			return null;
		}

		return getLatestFutureChatThinkingStatusLabel([backgroundDelegationMessage]);
	}, [backgroundDelegationMessageId, messages]);
	const activeRunStatus = currentThread?.activeRun?.status ?? null;
	const isAttachedActiveRun =
		activeThreadId !== null && runSubscriptionThreadIdRef.current === activeThreadId;
	const composerState = useMemo(() => {
		return resolveFutureChatComposerSubmitState({
			activeRunStatus,
			backgroundDelegationLabelOverride:
				activeRunStatus === "queued"
					? "Queued. This thread will start when a RovoDev port is free."
					: null,
			hasObservedTurnComplete,
			isAttachedActiveRun,
			useChatStatus,
			delegationPhase: directDelegationPhase,
			latestThinkingStatusLabel,
			streamingArtifactStatus: streamingArtifact?.status ?? null,
		});
	}, [
		activeRunStatus,
		directDelegationPhase,
		hasObservedTurnComplete,
		isAttachedActiveRun,
		latestThinkingStatusLabel,
		streamingArtifact?.status,
		useChatStatus,
	]);
	const status =
		(
			useChatStatus === "submitted" || useChatStatus === "streaming"
		) && !hasObservedTurnComplete
			? useChatStatus
			: attachedRunStatus === "streaming"
				? "streaming"
				: attachedRunStatus === "queued"
					? "submitted"
					: delegationTurnStatus;
	const isStreaming = status === "submitted" || status === "streaming";
	const isThreadBusy = useMemo(() => {
		return isFutureChatThreadBusy({
			activeRunStatus,
			attachedRunStatus,
			status,
		});
	}, [activeRunStatus, attachedRunStatus, status]);
	const shouldQueueNextSubmission = useMemo(() => {
		return hasActiveDispatch || isThreadBusy || queuedPrompts.length > 0;
	}, [hasActiveDispatch, isThreadBusy, queuedPrompts.length]);
	const shouldSuppressLatestAssistantSuggestions = useMemo(() => {
		return hasQueuedFutureChatFollowUp({
			hasActiveQueuedAction: hasActiveDispatch,
			queuedCount: queuedPrompts.length,
		});
	}, [hasActiveDispatch, queuedPrompts.length]);

	// ── Plan-mode planning session monitor ──
	// Tracks the full plan-mode lifecycle: initial prompt → stream →
	// plan detection → retry.  Modeled after Make's planningSession effect.
	useEffect(() => {
		if (!planningSession) {
			return;
		}

		if (isStreaming) {
			if (!planningSession.hasStreamStarted) {
				queueMicrotask(() => {
					setPlanningSession((prev) => {
						if (!prev || prev.hasStreamStarted) {
							return prev;
						}
						return { ...prev, hasStreamStarted: true };
					});
				});
			}
			return;
		}

		if (!planningSession.hasStreamStarted) {
			return;
		}

		// Stream just finished — check for a plan widget.
		const latestPlanWidget = getLatestPlanWidgetPayload(rovodevMessages);
		const hasGeneratedPlan = Boolean(
			latestPlanWidget && latestPlanWidget.tasks.length > 0,
		);
		const isAwaitingClarificationAnswers =
			getLatestQuestionCardPayload(rovodevMessages) !== null;

		if (hasGeneratedPlan) {
			queueMicrotask(() => {
				setPlanningSession(null);
			});
			return;
		}

		if (isAwaitingClarificationAnswers) {
			return;
		}

		const latestAssistantMessage = [...rovodevMessages]
			.reverse()
			.find((message) => message.role === "assistant");
		if (shouldSuppressFutureChatPlanRetry(latestAssistantMessage)) {
			queueMicrotask(() => {
				setPlanningSession(null);
			});
			return;
		}

		if (planningSession.retryUsed) {
			queueMicrotask(() => {
				setPlanningSession(null);
			});
			return;
		}

		// No plan widget — send a hidden retry.
		queueMicrotask(() => {
			setPlanningSession((prev) => {
				if (!prev) {
					return prev;
				}
				return {
					...prev,
					phase: "retrying-missing-plan",
					retryUsed: true,
					hasStreamStarted: false,
				};
			});
		});

		const retryAsync = async () => {
			try {
				await releaseCompletedUseChatTurnIfNeeded();
				await waitForChatSendSettled({
					statusRef: useChatStatusRef,
					lastBusyAtRef: lastUseChatBusyAtRef,
				});
				const threadId = activeThreadIdRef.current;
				if (!threadId) return;
				const activeThread =
					threads.find((thread) => thread.id === threadId) ?? null;
				if (!activeThread?.sessionId) {
					queueMicrotask(() => {
						setPlanningSession(null);
					});
					return;
				}
				const { message, messageId } = appendLocalUserMessage({
					files: [],
					metadata: { visibility: "hidden", source: "plan-retry" },
					text: PLAN_MODE_RETRY_PROMPT,
				});
				await sendMessage(
					{
						text: PLAN_MODE_RETRY_PROMPT,
						files: [],
						messageId,
						metadata: message.metadata,
					},
					{
						body: {
							id: threadId,
							isPlanMode: true,
							contextDescription: PLAN_MODE_POST_CLARIFICATION_CONTEXT,
							sessionId: activeThread.sessionId,
							sessionMode: activeThread.sessionMode ?? "persistent",
						},
					},
				);
			} catch {
				// Best-effort retry.
			}
		};
		retryAsync();
	// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isStreaming, planningSession, rovodevMessages, threads]);

	const resolveFallbackTitle = useCallback(
		(): boolean => {
			const threadId = pendingTitleThreadIdRef.current;
			if (!threadId) return false;

			const assistantMessageWithText = messages.find(
				(message) => message.role === "assistant" && getMessageText(message).length > 0,
			);
			if (!assistantMessageWithText) return false;

			const assistantText = getMessageText(assistantMessageWithText);
			const firstLine = assistantText
				.split(/\r?\n/u)
				.map((line) => line.trim())
				.find((line) => line.length > 0);
			const fallbackTitle = firstLine?.slice(0, 60);
			if (!fallbackTitle) return false;

			resolveChatTitle(threadId, fallbackTitle);
			return true;
		},
		[messages, resolveChatTitle],
	);

	// Generate title via AI Gateway immediately when the user sends a message.
	// This runs in parallel with the RovoDev chat stream — no conflict since
	// title generation uses AI Gateway only (backendPreference: "ai-gateway").
	useEffect(() => {
		if (!pendingTitleThreadId || !pendingTitleMessageRef.current) {
			return;
		}

		const isTitleStillPending = pendingTitleThreadIdRef.current === pendingTitleThreadId;
		if (!isTitleStillPending) {
			return;
		}

		const threadId = pendingTitleThreadId;
		const message = pendingTitleMessageRef.current;
		pendingTitleMessageRef.current = null;

		void fetchFutureChatAITitle(message).then((aiTitle) => {
			if (aiTitle) {
				resolveChatTitle(threadId, aiTitle);
				return;
			}

			if (resolveFallbackTitle()) {
				return;
			}

			// Clear generating state so the sidebar doesn't stay in shimmer
			if (pendingTitleThreadIdRef.current === threadId) {
				pendingTitleThreadIdRef.current = null;
				setPendingTitleThreadId(null);
				setIsGeneratingTitle(false);
			}
		});
	}, [pendingTitleThreadId, resolveChatTitle, resolveFallbackTitle]);

	useEffect(() => {
		statusRef.current = status;
	}, [status]);

	useEffect(() => {
		useChatStatusRef.current = useChatStatus;
		if (useChatStatus === "submitted" || useChatStatus === "streaming") {
			lastUseChatBusyAtRef.current = Date.now();
		}
	}, [useChatStatus]);

	useEffect(() => {
		attachedRunStatusRef.current = attachedRunStatus;
	}, [attachedRunStatus]);

	useEffect(() => {
		if (isStreaming) {
			suggestionsAbortControllerRef.current?.abort();
			suggestionsAbortControllerRef.current = null;
			return;
		}

		if (shouldSuppressLatestAssistantSuggestions) {
			suggestionsAbortControllerRef.current?.abort();
			suggestionsAbortControllerRef.current = null;
			return;
		}

		const latestAssistantMessage = [...normalizedRovodevMessages]
			.reverse()
			.find((message) => {
				if (
					message.role !== "assistant" ||
					!hasTurnCompleteSignal(message) ||
					getMessageText(message).trim().length === 0 ||
					getLatestDataPart(message, "data-suggested-questions")
				) {
					return false;
				}

				const widgetType = getLatestDataPart(message, "data-widget-data")?.data?.type;
				if (widgetType === "question-card" || widgetType === "plan") {
					return false;
				}

				return true;
			});
		if (!latestAssistantMessage?.id) {
			return;
		}

		if (requestedSuggestionMessageIdsRef.current.has(latestAssistantMessage.id)) {
			return;
		}

		const suggestionRequest = buildSuggestedQuestionsRequest(
			normalizedRovodevMessages,
			latestAssistantMessage.id,
		);
		if (!suggestionRequest) {
			return;
		}

		// Abort any in-flight suggestion request before starting a new one
		suggestionsAbortControllerRef.current?.abort();
		const abortController = new AbortController();
		suggestionsAbortControllerRef.current = abortController;

		requestedSuggestionMessageIdsRef.current.add(suggestionRequest.assistantMessageId);
		const threadIdAtRequest = activeThreadIdRef.current;
		void fetchFutureChatSuggestedQuestions({
			...suggestionRequest,
			signal: abortController.signal,
		})
			.then((questions) => {
				if (questions.length === 0) {
					return;
				}

				if (activeThreadIdRef.current !== threadIdAtRequest) {
					return;
				}

				setRovodevMessages((currentMessages) =>
					appendSuggestedQuestionsToAssistantMessage(
						currentMessages,
						suggestionRequest.assistantMessageId,
						questions,
					),
				);
			})
			.catch((error) => {
				requestedSuggestionMessageIdsRef.current.delete(
					suggestionRequest.assistantMessageId,
				);
				if (abortController.signal.aborted) {
					return;
				}
				if (isFutureChatBackendUnavailableError(error)) {
					return;
				}

				console.warn(
					"[FutureChat] Failed to fetch suggested questions:",
					error,
				);
			});
	}, [
		isStreaming,
		normalizedRovodevMessages,
		setRovodevMessages,
		shouldSuppressLatestAssistantSuggestions,
	]);

	useEffect(() => {
		if (!pendingArtifactAssociationRef.current) return;
		if (streamingArtifactMessageId) return;
		const lastMessage =
			normalizedRovodevMessages[normalizedRovodevMessages.length - 1];
		if (lastMessage?.role === "assistant") {
			pendingArtifactAssociationRef.current = false;
			setStreamingArtifactMessageId(lastMessage.id);
			streamingArtifactMessageIdRef.current = lastMessage.id;
			const documentId = streamingArtifactRef.current?.documentId;
			if (documentId) {
				void saveFutureChatDocument({
					documentId,
					sourceMessageId: lastMessage.id,
				}).then((updatedDocument) => {
					setDocuments((prev) => upsertDocumentRecord(prev, updatedDocument));
				}).catch((error) => {
					console.warn("[FutureChat] Failed to persist sourceMessageId:", error);
				});
			}
		}
		}, [normalizedRovodevMessages, streamingArtifactMessageId, streamingArtifactRef]);

	useEffect(() => {
		if (!streamingArtifactMessageId) {
			return;
		}

		const associatedMessage = normalizedRovodevMessages.find(
			(message) => message.id === streamingArtifactMessageId && message.role === "assistant",
		);
		if (!associatedMessage || !getMessageArtifactResult(associatedMessage)) {
			return;
		}

		setPendingArtifactResult(null);
	}, [normalizedRovodevMessages, streamingArtifactMessageId]);

	useEffect(() => {
		const currentStreamingArtifact = streamingArtifact;
		if (!currentStreamingArtifact || !currentStreamingArtifact.documentId) {
			return;
		}
		const streamingDocumentId = currentStreamingArtifact.documentId;

		if (visibleArtifactDocumentId === streamingDocumentId) {
			return;
		}

		if (suppressedStreamingAutoOpenDocumentIdRef.current === streamingDocumentId) {
			return;
		}

		if (!meetsStreamingAutoOpenContentThreshold(currentStreamingArtifact)) {
			return;
		}

		const createdAt = Date.parse(currentStreamingArtifact.createdAt);
		const remainingDelay = Number.isFinite(createdAt)
			? Math.max(0, 600 - (Date.now() - createdAt))
			: 0;

		if (remainingDelay === 0) {
			setVisibleArtifactDocumentId(streamingDocumentId);
			if (panelState === "closed") {
				setPanelState("preview");
			}
			return;
		}

		const timeoutId = window.setTimeout(() => {
			if (
				streamingArtifactRef.current?.documentId === streamingDocumentId &&
				suppressedStreamingAutoOpenDocumentIdRef.current !== streamingDocumentId &&
				meetsStreamingAutoOpenContentThreshold(streamingArtifactRef.current)
			) {
				setVisibleArtifactDocumentId(streamingDocumentId);
				setPanelState((prev) => prev === "closed" ? "preview" : prev);
			}
		}, remainingDelay);

		return () => {
			window.clearTimeout(timeoutId);
		};
		}, [panelState, streamingArtifact, streamingArtifactRef, visibleArtifactDocumentId]);

	useEffect(() => {
		const completedDocumentId = lastCompletedArtifactDocumentIdRef.current;
		if (
			!completedDocumentId ||
			isStreaming ||
			visibleArtifactDocumentId !== null ||
			suppressedStreamingAutoOpenDocumentIdRef.current === completedDocumentId
		) {
			return;
		}

		const completedDocument = documents.find(
			(document) => document.id === completedDocumentId,
		);
		if (!completedDocument) {
			return;
		}

		lastCompletedArtifactDocumentIdRef.current = null;
		setVisibleArtifactDocumentId(completedDocumentId);
		setPanelState((prev) => prev === "closed" ? "preview" : prev);
	}, [documents, isStreaming, visibleArtifactDocumentId]);

	const refreshThreads = useCallback(async () => {
		try {
			const nextThreads = await listFutureChatThreads();
			setThreads(
				filterDeletedFutureChatThreads(
					nextThreads,
					deletedThreadIdsRef.current,
				),
			);
			setInputError((previousError) =>
				previousError === getFutureChatBackendUnavailableUserMessage()
					? null
					: previousError,
			);
			setThreadsLoaded(true);
		} catch (error) {
			if (isFutureChatBackendUnavailableError(error)) {
				setThreads([]);
				setInputError(getFutureChatBackendUnavailableUserMessage());
				setThreadsLoaded(true);
				return;
			}

			console.error("[FutureChat] Failed to refresh threads:", error);
		}
	}, []);

	const hydrateThreadState = useCallback(
		(thread: FutureChatThread, nextDocuments: FutureChatDocument[], nextVotes: FutureChatVote[]) => {
			isHydratingThreadRef.current = true;
			pendingThreadCreationRef.current = null;
			activeThreadIdRef.current = thread.id;
			hasHydratedActiveThreadRef.current = true;
			setActiveThreadId(thread.id);
			setRovodevMessages(thread.messages);
			replaceRealtimeMessagesState(thread.realtimeMessages ?? [], {
				incrementVersion: false,
			});
			clearDirectDelegationState();
			clearStreamingArtifactState();
			resetPendingArtifactAssociation();
			resetObservedTurnComplete();
			queueProcessorRunningRef.current = false;
			setHasActiveDispatch(false);
			setAttachedRunStatus(thread.activeRun?.status ?? null);
			setThreadVisibility(thread.visibility);
			setDocuments(nextDocuments);
			setActiveDocumentId(thread.activeDocumentId);
			setVisibleArtifactDocumentId(thread.activeDocumentId);
			// Restore panel state: preview if thread has an active artifact, otherwise closed
			setPanelState(thread.activeDocumentId ? "preview" : "closed");
			setSelectedVersionId(
				thread.activeDocumentId
					? nextDocuments.find((document) => document.id === thread.activeDocumentId)?.versions.at(-1)?.id ?? null
					: null,
			);
			setVotes(buildVotesMap(nextVotes));
			const persistedKey = buildFutureChatThreadPersistKey({
				messages: thread.messages,
				realtimeMessages: thread.realtimeMessages ?? [],
				visibility: thread.visibility,
				activeDocumentId: thread.activeDocumentId,
				title: thread.title,
			});
			lastPersistedKeyRef.current = persistedKey;
			pendingRouteThreadIdRef.current = null;
			pendingRouteReadyRef.current = false;
			window.setTimeout(() => {
				isHydratingThreadRef.current = false;
			}, 0);
		},
		[
			clearDirectDelegationState,
			clearStreamingArtifactState,
			replaceRealtimeMessagesState,
			resetObservedTurnComplete,
			resetPendingArtifactAssociation,
			setRovodevMessages,
		],
	);

	const hydrateThreadById = useCallback(
		async (threadId: string) => {
			const [thread, nextDocuments, nextVotes] = await Promise.all([
				getFutureChatThread(threadId),
				listFutureChatDocuments(threadId),
				listFutureChatVotes(threadId),
			]);
			if (thread) {
				hydrateThreadState(thread, nextDocuments, nextVotes);
				setThreads((previousThreads) =>
					upsertFutureChatThreadRecord(previousThreads, thread, {
						deletedThreadIds: deletedThreadIdsRef.current,
					}),
				);
			}
		},
		[hydrateThreadState],
	);

	useEffect(() => {
		if (!activeThreadId || !currentThread?.activeRun) {
			return;
		}

		if (
			useChatStatus === "submitted"
			|| useChatStatus === "streaming"
			|| attachedRunStatus !== null
		) {
			return;
		}

		const latestAssistantMessage = [...messages]
			.reverse()
			.find((message) => message.role === "assistant");
		if (!latestAssistantMessage || !hasTurnCompleteSignal(latestAssistantMessage)) {
			return;
		}

		setLocalThreadActiveRun(activeThreadId, null);
		void hydrateThreadById(activeThreadId).catch(() => {});
	}, [
		activeThreadId,
		attachedRunStatus,
		currentThread?.activeRun,
		hydrateThreadById,
		messages,
		setLocalThreadActiveRun,
		useChatStatus,
	]);

	const subscribeToFutureChatRun = useCallback(
		async (
			threadId: string,
			activeRun: FutureChatActiveRun | null,
		) => {
			runSubscriptionAbortControllerRef.current?.abort();
			const abortController = new AbortController();
			runSubscriptionAbortControllerRef.current = abortController;
			runSubscriptionThreadIdRef.current = threadId;
			setAttachedRunStatus(activeRun?.status === "queued" ? "queued" : "streaming");

			try {
				const response = await fetch(API_ENDPOINTS.futureChatRunStream(threadId), {
					method: "GET",
					signal: abortController.signal,
				});
				if (response.status === 404) {
					setAttachedRunStatus(null);
					setLocalThreadActiveRun(threadId, null);
					if (activeThreadIdRef.current === threadId) {
						setInputError("The previous run is no longer active.");
						void hydrateThreadById(threadId);
					}
					return;
				}
				if (!response.ok || !response.body) {
					throw new Error(
						(await response.text().catch(() => "")) || "Failed to attach Future Chat run.",
					);
				}

				for await (const streamedMessage of readFutureChatDelegationResponseStream({
					stream: response.body,
					onChunk: handleAttachedRunChunk,
					onError: (error) => {
						console.error("[FutureChat] Failed to read attached run stream:", error);
					},
					terminateOnError: true,
				})) {
					setAttachedRunStatus("streaming");
					setRovodevMessages((previousMessages) =>
						upsertRealtimeMessage(previousMessages, streamedMessage),
					);
				}

				setAttachedRunStatus(null);
				setLocalThreadActiveRun(threadId, null);
				if (activeThreadIdRef.current === threadId) {
					void hydrateThreadById(threadId);
				}
			} catch (error) {
				if (isFutureChatDelegationAbortError(error) || abortController.signal.aborted) {
					return;
				}

				setInputError(toFutureChatUserErrorMessage(error));
			} finally {
				if (runSubscriptionAbortControllerRef.current === abortController) {
					runSubscriptionAbortControllerRef.current = null;
				}
				if (runSubscriptionThreadIdRef.current === threadId) {
					runSubscriptionThreadIdRef.current = null;
				}
			}
		},
		[handleAttachedRunChunk, hydrateThreadById, setLocalThreadActiveRun, setRovodevMessages],
	);

const resetToBlankChatState = useCallback((nextDraftId: string) => {
		isHydratingThreadRef.current = true;
		pendingThreadCreationRef.current = null;
		setDraftThreadId(nextDraftId);
		activeThreadIdRef.current = null;
		hasHydratedActiveThreadRef.current = false;
		setActiveThreadId(null);
		setRovodevMessages([]);
		replaceRealtimeMessagesState([], {
			incrementVersion: false,
		});
		runSubscriptionAbortControllerRef.current?.abort();
		runSubscriptionAbortControllerRef.current = null;
		runSubscriptionThreadIdRef.current = null;
			setAttachedRunStatus(null);
			resetObservedTurnComplete();
			queueProcessorRunningRef.current = false;
			setHasActiveDispatch(false);
			clearDirectDelegationState();
		clearStreamingArtifactState();
		resetPendingArtifactAssociation();
		setDocuments([]);
		clearArtifactState();
		setVotes({});
		setThreadVisibility("private");
		setEditingMessageId(null);
		lastPersistedKeyRef.current = buildFutureChatThreadPersistKey({
			messages: [],
			realtimeMessages: [],
			visibility: "private",
			activeDocumentId: null,
			title: "New chat",
		});
		pendingRouteThreadIdRef.current = null;
		pendingRouteReadyRef.current = false;
		window.setTimeout(() => {
			isHydratingThreadRef.current = false;
		}, 0);
	}, [clearArtifactState, clearDirectDelegationState, clearStreamingArtifactState, replaceRealtimeMessagesState, resetObservedTurnComplete, resetPendingArtifactAssociation, setRovodevMessages]);

	const leaveActiveThreadForBackground = useCallback(async () => {
		const threadId = activeThreadIdRef.current;
		const activeRun = currentThread?.activeRun ?? null;
		const hasActiveTurn =
			statusRef.current === "submitted"
			|| statusRef.current === "streaming"
			|| activeRun !== null
			|| attachedRunStatus !== null;
		if (!hasActiveTurn) {
			return;
		}

		const transitionPlan = buildFutureChatActiveThreadTransitionPlan({
			activeDocumentId,
			isStreaming: hasActiveTurn,
			messages: rovodevMessagesRef.current,
			realtimeMessages: realtimeMessagesRef.current,
			threadId,
			visibility: threadVisibility,
		});

		if (transitionPlan.shouldDetachStream && transitionPlan.threadId) {
			const detachThreadId = transitionPlan.threadId;
			await detachFutureChatRun(detachThreadId)
				.catch(() => detachFutureChatStream(detachThreadId).catch(() => false));
		}

		await stopUseChat();
		runSubscriptionAbortControllerRef.current?.abort();
		runSubscriptionAbortControllerRef.current = null;
		runSubscriptionThreadIdRef.current = null;
		setAttachedRunStatus(null);
		delegationAbortControllerRef.current?.abort();
		delegationAbortControllerRef.current = null;
		clearDirectDelegationState();

		if (transitionPlan.persistence) {
			void updateFutureChatThread(
				transitionPlan.persistence.threadId,
				transitionPlan.persistence.input,
			).catch((error) => {
				console.warn(
					"[FutureChat] Failed to persist the active thread before switching views:",
					error,
				);
			});
		}

		if (transitionPlan.shouldTrackBackgroundStream && transitionPlan.threadId) {
			const now = new Date().toISOString();
			setLocalThreadActiveRun(
				transitionPlan.threadId,
				activeRun
					? {
						...activeRun,
						status: activeRun.status === "queued" ? "queued" : "background",
						updatedAt: now,
					}
					: {
						id: `future-chat-run-local-${transitionPlan.threadId}`,
						status: "background",
						rovoPort: null,
						startedAt: now,
						updatedAt: now,
					},
			);
		}
	}, [
		activeDocumentId,
		attachedRunStatus,
		clearDirectDelegationState,
		currentThread?.activeRun,
		setLocalThreadActiveRun,
		stopUseChat,
		threadVisibility,
	]);

	const loadThread = useCallback(
		async (threadId: string) => {
			// Skip only when the current thread state is already hydrated.
			// A cold route mount initializes activeThreadId from the URL before
			// messages are loaded, so it still needs to fetch and hydrate.
			if (
				shouldSkipFutureChatThreadLoad({
					activeThreadId: activeThreadIdRef.current,
					hasHydratedThreadState: hasHydratedActiveThreadRef.current,
					requestedThreadId: threadId,
				})
			) {
				return;
			}

			// Persist any in-flight local snapshot before hydrating the next thread.
			// The reactive persistence effect can't safely cover this transition,
			// because hydrateThreadState will overwrite the current local messages.
			await leaveActiveThreadForBackground();

			setInputError(null);
			setIsLoadingThread(true);
			try {
				const [thread, nextDocuments, nextVotes] = await Promise.all([
					getFutureChatThread(threadId),
					listFutureChatDocuments(threadId),
					listFutureChatVotes(threadId),
				]);
				if (!thread) {
					const nextDraftId = createFutureChatId();
					resetToBlankChatState(nextDraftId);
					if (!embedded) {
						startTransition(() => {
							router.replace(FUTURE_CHAT_ROOT_PATH);
						});
					}
					return;
				}
				if (deletedThreadIdsRef.current.has(thread.id)) {
					return;
				}

				const referencedDocumentIds = getFutureChatArtifactDocumentIdsFromMessages([
					...thread.messages,
					...(thread.realtimeMessages ?? []),
				]);
				const missingDocumentIds = referencedDocumentIds.filter(
					(documentId) => !nextDocuments.some((document) => document.id === documentId),
				);
				const recoveredDocuments = (
					await Promise.all(missingDocumentIds.map((documentId) => getFutureChatDocument(documentId)))
				).filter((document): document is FutureChatDocument => Boolean(document));
				const hydratedDocuments = recoveredDocuments.reduce(
					(previousDocuments, document) => upsertDocumentRecord(previousDocuments, document),
					nextDocuments,
				);

				hydrateThreadState(thread, hydratedDocuments, nextVotes);
				setThreads((previousThreads) =>
					upsertFutureChatThreadRecord(previousThreads, thread, {
						deletedThreadIds: deletedThreadIdsRef.current,
					}),
				);
				if (thread.activeRun) {
					void subscribeToFutureChatRun(thread.id, thread.activeRun);
				} else {
					runSubscriptionAbortControllerRef.current?.abort();
					runSubscriptionAbortControllerRef.current = null;
					runSubscriptionThreadIdRef.current = null;
					setAttachedRunStatus(null);
				}
			} catch (error) {
				setInputError(toFutureChatUserErrorMessage(error));
			} finally {
				setIsLoadingThread(false);
			}
		},
		[
			embedded,
			hydrateThreadState,
			leaveActiveThreadForBackground,
			resetToBlankChatState,
			router,
			subscribeToFutureChatRun,
		],
	);
	const loadThreadRef = useLatestRef(loadThread);

	useEffect(() => {
		void refreshThreads();
	}, [refreshThreads]);

	useEffect(() => {
		if (!initialThreadId) {
			lastLoadedInitialThreadIdRef.current = null;
			return;
		}

		if (
			!shouldLoadInitialFutureChatThread({
				initialThreadId,
				lastLoadedInitialThreadId: lastLoadedInitialThreadIdRef.current,
			})
		) {
			return;
		}

		// The route param seeds the first hydration only. After that, the live
		// in-memory thread state owns navigation so "New chat" can stay blank.
		lastLoadedInitialThreadIdRef.current = initialThreadId;
		void loadThreadRef.current(initialThreadId);
	}, [initialThreadId, loadThreadRef]);

	useEffect(() => {
		setArtifactDraftContent(activeDocumentContent);
		setSelectedVersionId(activeDocument?.versions.at(-1)?.id ?? null);
	}, [activeDocument, activeDocumentContent]);

	const activateBlankChatState = useCallback(
		async ({
			syncHistory = true,
		}: {
			syncHistory?: boolean;
		} = {}) => {
			await leaveActiveThreadForBackground();

			const nextDraftId = createFutureChatId();
			resetToBlankChatState(nextDraftId);
			if (!embedded && syncHistory) {
				pushFutureChatHistoryPath(FUTURE_CHAT_ROOT_PATH);
			}
		},
		[embedded, leaveActiveThreadForBackground, resetToBlankChatState],
	);

	const openNewChat = useCallback(async () => {
		await activateBlankChatState();
	}, [activateBlankChatState]);

	useEffect(() => {
		if (embedded) {
			return;
		}

		const handlePopState = () => {
			const threadId = getFutureChatThreadIdFromPath(window.location.pathname);
			if (threadId) {
				void loadThread(threadId);
				return;
			}

			if (
				window.location.pathname === FUTURE_CHAT_ROOT_PATH
				|| window.location.pathname === `${FUTURE_CHAT_ROOT_PATH}/`
			) {
				if (activeThreadIdRef.current === null && !hasHydratedActiveThreadRef.current) {
					return;
				}

				void activateBlankChatState({ syncHistory: false });
			}
		};

		window.addEventListener("popstate", handlePopState);
		return () => {
			window.removeEventListener("popstate", handlePopState);
		};
	}, [activateBlankChatState, embedded, loadThread]);

	const ensureThread = useCallback(
		async (seedText: string) => {
			if (activeThreadIdRef.current) {
				return activeThreadIdRef.current;
			}

			if (pendingThreadCreationRef.current) {
				return pendingThreadCreationRef.current;
			}

			const threadCreationPromise = createFutureChatThread({
				id: draftThreadId,
				title: deriveThreadTitle(seedText),
				messages: [],
				realtimeMessages: [],
				visibility: threadVisibility,
				activeDocumentId,
			})
				.then((nextThread) => {
					activeThreadIdRef.current = nextThread.id;
					hasHydratedActiveThreadRef.current = true;
					setActiveThreadId(nextThread.id);
					setThreads((previousThreads) =>
						upsertFutureChatThreadRecord(previousThreads, nextThread, {
							deletedThreadIds: deletedThreadIdsRef.current,
						}),
					);
					lastPersistedKeyRef.current = buildFutureChatThreadPersistKey({
						messages: nextThread.messages,
						realtimeMessages: nextThread.realtimeMessages ?? [],
						visibility: nextThread.visibility,
						activeDocumentId: nextThread.activeDocumentId,
						title: nextThread.title,
					});
					if (!embedded) {
						pendingRouteThreadIdRef.current = nextThread.id;
						pendingRouteReadyRef.current = false;
					}
					setIsGeneratingTitle(true);
					setPendingTitleThreadId(nextThread.id);
					pendingTitleThreadIdRef.current = nextThread.id;
					pendingTitleMessageRef.current = seedText;
					return nextThread.id;
				})
				.finally(() => {
					if (pendingThreadCreationRef.current === threadCreationPromise) {
						pendingThreadCreationRef.current = null;
					}
				});

			pendingThreadCreationRef.current = threadCreationPromise;
			return threadCreationPromise;
		},
			[
				activeDocumentId,
				draftThreadId,
				embedded,
				threadVisibility,
			],
		);

	const appendLocalUserMessage = useCallback(
		({
			files,
			metadata,
			text,
		}: {
			files: ReadonlyArray<FileUIPart>;
			metadata?: RovoUIMessage["metadata"];
			text: string;
		}) => {
			const createdAt = new Date().toISOString();
			const messageId = createId("future-chat-user");
			const message = createFutureChatUserMessage({
				id: messageId,
				createdAt,
				files,
				metadata,
				text,
			});

			setRovodevMessages((previousMessages) => [...previousMessages, message]);
			return { message, messageId };
		},
		[setRovodevMessages],
	);

	const getActivePendingPlanReview = useCallback(() => {
		return getLatestPendingPlanWidget(rovodevMessagesRef.current);
	}, []);

	const releaseCompletedUseChatTurnIfNeeded = useCallback(async () => {
		const hasBusyUseChatTurn =
			useChatStatus === "submitted" || useChatStatus === "streaming";
		if (!hasBusyUseChatTurn || !hasObservedTurnCompleteRef.current) {
			return;
		}

		const threadId = activeThreadIdRef.current;
		if (threadId) {
			setLocalThreadActiveRun(threadId, null);
		}
		setAttachedRunStatus(null);
		await stopUseChat();

		const startedAt = Date.now();
		while (
			statusRef.current === "submitted"
			|| statusRef.current === "streaming"
		) {
			if (Date.now() - startedAt > ACTIVE_TURN_STOP_TIMEOUT_MS) {
				break;
			}
			await waitForFutureChat(25);
		}
	}, [setLocalThreadActiveRun, stopUseChat, useChatStatus]);

	const sendPlanReviewResult = useCallback(
		async ({
			isPlanMode,
			planWidget,
			result,
			userMessageText,
		}: {
			isPlanMode: boolean;
			planWidget: ParsedPlanWidgetPayload;
			result: string;
			userMessageText: string;
		}) => {
			const deferredToolResponse = buildExitPlanModeDeferredToolResponse(
				planWidget,
				result,
			);
			if (!deferredToolResponse) {
				throw new Error("The pending plan review is missing a deferred tool call.");
			}

			await releaseCompletedUseChatTurnIfNeeded();
			await waitForChatSendSettled({
				statusRef: useChatStatusRef,
				lastBusyAtRef: lastUseChatBusyAtRef,
			});

			const threadId = await ensureThread(userMessageText || "Plan review");
			const { message, messageId } = appendLocalUserMessage({
				files: [],
				text: userMessageText,
			});
			resetPendingArtifactAssociation();
			pendingPlanModeOverrideRef.current = null;
			planModeSyncRequestIdRef.current += 1;
			setIsPlanMode(isPlanMode);
			if (isPlanMode) {
				setPlanningSession({
					requestId: planModeSyncRequestIdRef.current,
					phase: "awaiting-plan",
					hasStreamStarted: false,
					retryUsed: false,
				});
			} else {
				setPlanningSession(null);
			}

			markLocalThreadRunPending(threadId);
			await sendMessage(
				{
					text: userMessageText,
					files: [],
					messageId,
					metadata: message.metadata,
				},
				{
					body: {
						id: threadId,
						isPlanMode,
						contextDescription: isPlanMode
							? PLAN_MODE_POST_CLARIFICATION_CONTEXT
							: undefined,
						deferredToolResponse,
					},
				},
			);
		},
		[
			appendLocalUserMessage,
			ensureThread,
			markLocalThreadRunPending,
			releaseCompletedUseChatTurnIfNeeded,
			resetPendingArtifactAssociation,
			sendMessage,
		],
	);

	const rejectPendingPlanReview = useCallback(
		async (planWidget: ParsedPlanWidgetPayload) => {
			const toolCallId =
				planWidget.deferredToolCallId ?? planWidget.toolCallId ?? null;
			if (!toolCallId) {
				throw new Error("The pending plan review is missing a deferred tool call.");
			}

			const didCancelDeferredTool = await cancelDeferredToolCall(toolCallId);
			if (!didCancelDeferredTool) {
				throw new Error("Couldn't reject the pending plan review.");
			}

			const response = await fetch(API_ENDPOINTS.AGENT_MODE, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(
					buildFutureChatAgentModeRequest({
						mode: "default",
					}),
				),
			});
			if (!response.ok) {
				throw new Error(`Agent mode toggle failed with status ${response.status}`);
			}

			pendingPlanModeOverrideRef.current = null;
			planModeSyncRequestIdRef.current += 1;
			setPlanningSession(null);
			setIsPlanMode(false);
		},
		[],
	);

	const submitToolApproval = useCallback(
		async (
			toolApproval: ToolApprovalPayload,
			decisions: Array<{
				toolCallId: string;
				approved: boolean;
				denyMessage?: string;
			}>,
		) => {
			if (!toolApproval?.approvalId || toolApproval.items.length === 0) {
				throw new Error("The pending tool approval is missing approval data.");
			}

			const normalizedDecisions = decisions
				.map((decision) => ({
					toolCallId: decision.toolCallId?.trim(),
					approved: decision.approved === true,
					denyMessage: decision.denyMessage?.trim() || undefined,
				}))
				.filter((decision) => Boolean(decision.toolCallId));
			if (normalizedDecisions.length !== toolApproval.items.length) {
				throw new Error("Every paused tool requires an explicit Allow or Deny decision.");
			}

			hasObservedTurnCompleteRef.current = true;
			setHasObservedTurnComplete(true);
			const activeThreadId = activeThreadIdRef.current;
			if (activeThreadId) {
				setLocalThreadActiveRun(activeThreadId, null);
			}
			setAttachedRunStatus(null);
			if (useChatStatusRef.current === "submitted" || useChatStatusRef.current === "streaming") {
				try {
					await stopUseChat();
				} catch (error) {
					console.warn(
						"[FutureChat] Failed to stop UI stream before submitting tool approval:",
						error,
					);
				}
			}

			await releaseCompletedUseChatTurnIfNeeded();
			await waitForChatSendSettled({
				statusRef: useChatStatusRef,
				lastBusyAtRef: lastUseChatBusyAtRef,
			});

			const threadId = await ensureThread("Tool approval");
			const approvedCount = normalizedDecisions.filter((decision) => decision.approved).length;
			const deniedCount = normalizedDecisions.length - approvedCount;
			const approvalSummaryText = [
				`Submitted tool approvals for ${toolApproval.items.length} step${toolApproval.items.length === 1 ? "" : "s"}.`,
				`${approvedCount} approved, ${deniedCount} denied.`,
			].join(" ");
			const { message, messageId } = appendLocalUserMessage({
				files: [],
				metadata: {
					source: "tool-approval-submit",
					toolApprovalId: toolApproval.approvalId,
					visibility: "hidden",
				},
				text: approvalSummaryText,
			});
			resetPendingArtifactAssociation();
			markLocalThreadRunPending(threadId);

			try {
				await sendMessage(
					{
						text: approvalSummaryText,
						files: [],
						messageId,
						metadata: message.metadata,
					},
					{
						body: {
							id: threadId,
							toolApproval: {
								approvalId: toolApproval.approvalId,
								decisions: normalizedDecisions,
							},
						},
					},
				);
			} catch (sendError) {
				setRovodevMessages((previousMessages) =>
					previousMessages.filter((existingMessage) => existingMessage.id !== messageId),
				);
				setLocalThreadActiveRun(threadId, null);
				setAttachedRunStatus(null);
				throw sendError;
			}
		},
		[
			appendLocalUserMessage,
			ensureThread,
			markLocalThreadRunPending,
			releaseCompletedUseChatTurnIfNeeded,
			resetPendingArtifactAssociation,
			sendMessage,
			setLocalThreadActiveRun,
			setRovodevMessages,
			stopUseChat,
		],
	);

	const dispatchPromptNow = useCallback(
		async ({
			text,
			files,
			contextDescription,
			executionMode,
			executionTask,
			messageMetadata,
		}: {
			text: string;
			files: FileUIPart[];
			contextDescription?: string;
			executionMode?: "plan-task";
			executionTask?: FutureChatPlanExecutionTask;
			messageMetadata?: RovoUIMessage["metadata"];
		}) => {
			setInputError(null);
			const trimmedText = text.trim();
			if (!trimmedText && files.length === 0) {
				return;
			}

			try {
				// When an artifact is actively streaming, interrupt the current
				// turn, save a checkpoint, and re-submit with the streaming
				// artifact context so the backend can classify the intent.
				const currentStreamingArtifact = streamingArtifactRef.current;
				const isArtifactStreaming =
					currentStreamingArtifact?.status === "streaming" &&
					currentStreamingArtifact.documentId;
				let streamingArtifactPayload:
					| { id: string; title: string; kind: string; content: string }
					| undefined;

				if (isArtifactStreaming) {
					const savedTitle = currentStreamingArtifact.title;
					flushQueuedStreamingArtifactDeltaNow();
					const freshSnapshot = streamingArtifactRef.current;
					streamingArtifactPayload = {
						id: freshSnapshot?.documentId ?? currentStreamingArtifact.documentId!,
						title: freshSnapshot?.title ?? savedTitle,
						kind: freshSnapshot?.kind ?? currentStreamingArtifact.kind,
						content: freshSnapshot?.content ?? currentStreamingArtifact.content,
					};
					clearStreamingArtifactState();
					const hadUseChatTurn =
						useChatStatus === "submitted" || useChatStatus === "streaming";
					if (hadUseChatTurn) {
						await stopUseChat();
					}
					delegationAbortControllerRef.current?.abort();
					delegationAbortControllerRef.current = null;
					clearDirectDelegationState();
				}

				await releaseCompletedUseChatTurnIfNeeded();
				await waitForChatSendSettled({
					statusRef: useChatStatusRef,
					lastBusyAtRef: lastUseChatBusyAtRef,
				});

				const resolvedArtifactContext = resolveActiveArtifactContext(
					activeDocument, artifactDraftContent, activeDocumentContent, streamingArtifact,
				);
				const threadId = await ensureThread(trimmedText || files[0]?.filename || "New chat");
				const { message, messageId } = appendLocalUserMessage({
					files,
					metadata: messageMetadata,
					text: trimmedText,
				});
				markLocalThreadRunPending(threadId);
				resetPendingArtifactAssociation();
				if (isPlanModeRef.current) {
					setPlanningSession({
						requestId: planModeSyncRequestIdRef.current,
						phase: "awaiting-plan",
						hasStreamStarted: false,
						retryUsed: false,
					});
				}
				try {
					await sendMessage({
						text: trimmedText,
						files,
						messageId,
						metadata: message.metadata,
					}, {
						body: {
							id: threadId,
							artifactContext: resolvedArtifactContext ?? undefined,
							contextDescription,
							executionMode,
							executionTask,
							streamingArtifact: streamingArtifactPayload,
						},
					});
				} catch (sendError) {
					// Pre-stream failure: roll back the optimistic user message
					setRovodevMessages((prev) => prev.filter((m) => m.id !== messageId));
					setLocalThreadActiveRun(threadId, null);
					setAttachedRunStatus(null);
					throw sendError;
				}
			} catch (error) {
				setInputError(toFutureChatUserErrorMessage(error));
				throw error;
			}
		},
		[
			activeDocument,
			activeDocumentContent,
			artifactDraftContent,
			clearStreamingArtifactState,
			clearDirectDelegationState,
			appendLocalUserMessage,
			ensureThread,
			flushQueuedStreamingArtifactDeltaNow,
			markLocalThreadRunPending,
			releaseCompletedUseChatTurnIfNeeded,
			resetPendingArtifactAssociation,
			sendMessage,
				setLocalThreadActiveRun,
				setRovodevMessages,
				isPlanModeRef,
				stopUseChat,
				streamingArtifact,
				streamingArtifactRef,
				useChatStatus,
			],
		);

	const enqueuePromptAction = useCallback(
		({
			contextDescription,
			files,
			text,
			threadId,
		}: {
			contextDescription?: string;
			files: ReadonlyArray<FileUIPart>;
			text: string;
			threadId: string;
		}) => {
			const queuedAction: FutureChatQueuedPromptAction = {
				id: createFutureChatQueueItemId(),
				threadId,
				text,
				createdAt: Date.now(),
				kind: "prompt",
				files: [...files],
				contextDescription,
			};
			enqueueQueuedAction(queuedAction);
		},
		[enqueueQueuedAction],
	);


	const submitPrompt = useCallback(
		async ({
			text,
			files,
			contextDescription,
		}: {
			text: string;
			files: FileUIPart[];
			contextDescription?: string;
		}) => {
			setInputError(null);
			const trimmedText = text.trim();
			if (!trimmedText && files.length === 0) {
				return;
			}

			const pendingPlanReview = getActivePendingPlanReview();
			const planReviewAction = resolveFutureChatPlanReviewAction({
				fileCount: files.length,
				hasPendingPlanReview: Boolean(pendingPlanReview),
				isRejectOnNextPrompt: pendingPlanModeOverrideRef.current === "default",
				text: trimmedText,
			});
			if (pendingPlanReview && planReviewAction === "send-plan-feedback") {
				await sendPlanReviewResult({
					isPlanMode: true,
					planWidget: pendingPlanReview.planWidget,
					result: trimmedText,
					userMessageText: trimmedText,
				});
				return;
			}

			if (pendingPlanReview && planReviewAction === "reject-plan-and-send-prompt") {
				await rejectPendingPlanReview(pendingPlanReview.planWidget);
				await dispatchPromptNow({
					text: trimmedText,
					files,
					contextDescription,
				});
				return;
			}

			const resolvedThreadId = activeThreadIdRef.current ?? draftThreadId;
			const shouldEnqueue =
				queueProcessorRunningRef.current ||
				isFutureChatThreadBusy({
					activeRunStatus: currentThread?.activeRun?.status ?? null,
					attachedRunStatus,
					status: statusRef.current,
				}) ||
				(queuedActionsByThreadId[resolvedThreadId]?.length ?? 0) > 0;

			if (shouldEnqueue) {
				enqueuePromptAction({
					contextDescription,
					files,
					text: trimmedText,
					threadId: resolvedThreadId,
				});
				kickQueue();
				return;
			}

			await dispatchPromptNow({
				text: trimmedText,
				files,
				contextDescription,
			});
		},
		[
			attachedRunStatus,
			currentThread?.activeRun?.status,
			dispatchPromptNow,
			draftThreadId,
			enqueuePromptAction,
			getActivePendingPlanReview,
			kickQueue,
			queuedActionsByThreadId,
			rejectPendingPlanReview,
			sendPlanReviewResult,
		],
	);

	const suggestedPrompt = useCallback(
		async (text: string) => {
			try {
				await submitPrompt({ text, files: [] });
			} catch {
				// submitPrompt already sets a user-visible error state.
			}
		},
		[submitPrompt],
	);

	const submitClarification = useCallback(
		async (questionCard: ParsedQuestionCardPayload, answers: ClarificationAnswers) => {
			const submission = createClarificationSubmission(questionCard, answers);
			// Use isPlanModeRef as the primary signal, but also check whether
			// the question card was emitted during a plan-mode turn (indicated
			// by the presence of a deferredToolCallId, which only happens when
			// ask_user_questions is called via the plan-mode deferred tool
			// flow).  This protects against isPlanModeRef being transiently
			// reset by syncPlanModeFromBackend after a port recovery.
			const wasPlanModeActive =
				isPlanModeRef.current || Boolean(questionCard.deferredToolCallId);
			const promptText = buildClarificationSummaryPrompt(questionCard, answers);
			hasObservedTurnCompleteRef.current = true;
			setRovodevMessages((previousMessages) => {
				const resolved = markClarificationToolResolved(previousMessages);
				return appendTurnCompleteToLastAssistantMessage(resolved).messages;
			});
			await releaseCompletedUseChatTurnIfNeeded();
			await waitForChatSendSettled({
				statusRef: useChatStatusRef,
				lastBusyAtRef: lastUseChatBusyAtRef,
			});
			const threadId = await ensureThread(promptText || "Clarification");
			const { message, messageId } = appendLocalUserMessage({
				files: [],
				metadata: buildClarificationMessageMetadata(questionCard, {
					answers,
					status: "answered",
				}),
				text: promptText,
			});
			resetPendingArtifactAssociation();

			const deferredToolCallId = questionCard.deferredToolCallId;
			const deferredToolResponse = buildDeferredToolResponse(questionCard, answers);
			const body: Record<string, unknown> = {
				id: threadId,
				isPlanMode: wasPlanModeActive || undefined,
				contextDescription: wasPlanModeActive
					? PLAN_MODE_POST_CLARIFICATION_CONTEXT
					: undefined,
				clarification: {
					...submission,
					toolCallId: deferredToolCallId ?? submission.toolCallId,
					deferredToolCallId: deferredToolCallId ?? submission.deferredToolCallId,
				},
				deferredToolResponse: deferredToolResponse ?? undefined,
			};

			markLocalThreadRunPending(threadId);
			if (wasPlanModeActive) {
				setPlanningSession((prev) =>
					prev
						? { ...prev, phase: "awaiting-plan", hasStreamStarted: false }
						: {
							requestId: planModeSyncRequestIdRef.current,
							phase: "awaiting-plan",
							hasStreamStarted: false,
							retryUsed: false,
						},
				);
			}
			await sendMessage(
				{
					text: promptText,
					files: [],
					messageId,
					metadata: message.metadata,
				},
				{ body },
			);
		},
		[
			appendLocalUserMessage,
			ensureThread,
			isPlanModeRef,
			markLocalThreadRunPending,
			releaseCompletedUseChatTurnIfNeeded,
			resetPendingArtifactAssociation,
			sendMessage,
			setRovodevMessages,
		],
	);

	const submitClarificationDismiss = useCallback(
		async (questionCard: ParsedQuestionCardPayload) => {
			const dismissPrompt = buildClarificationDismissPrompt(questionCard);
			await releaseCompletedUseChatTurnIfNeeded();
			await waitForChatSendSettled({
				statusRef: useChatStatusRef,
				lastBusyAtRef: lastUseChatBusyAtRef,
			});
			const threadId = await ensureThread(dismissPrompt || "Skipped clarification");
			const { message, messageId } = appendLocalUserMessage({
				files: [],
				metadata: buildClarificationMessageMetadata(questionCard, {
					status: "dismissed",
					visibility: "hidden",
				}),
				text: dismissPrompt,
			});
			resetPendingArtifactAssociation();
			markLocalThreadRunPending(threadId);
			await sendMessage(
				{
					text: dismissPrompt,
					files: [],
					messageId,
					metadata: message.metadata,
				},
				{ body: { id: threadId } },
			);
		},
		[
			appendLocalUserMessage,
			ensureThread,
			markLocalThreadRunPending,
			releaseCompletedUseChatTurnIfNeeded,
			resetPendingArtifactAssociation,
			sendMessage,
		],
	);

	const finalizeCancelledClarificationTurn = useCallback(async () => {
		const threadId = activeThreadIdRef.current;
		if (threadId) {
			setLocalThreadActiveRun(threadId, null);
		}

		queueProcessorRunningRef.current = false;
		setHasActiveDispatch(false);
		runSubscriptionAbortControllerRef.current?.abort();
		runSubscriptionAbortControllerRef.current = null;
		runSubscriptionThreadIdRef.current = null;
		setAttachedRunStatus(null);
		hasObservedTurnCompleteRef.current = true;
		setRovodevMessages((previousMessages) => {
			const resolved = markClarificationToolResolved(previousMessages, "Clarification cancelled.");
			return appendTurnCompleteToLastAssistantMessage(resolved).messages;
		});

		try {
			await stopUseChat();
		} catch (error) {
			console.warn(
				"[FutureChat] Failed to stop UI stream after clarification cancel:",
				error,
			);
		}

		planModeSyncRequestIdRef.current += 1;
		setPlanningSession(null);
		setIsPlanMode(false);
		void syncPlanModeFromBackend();
	}, [setLocalThreadActiveRun, setRovodevMessages, stopUseChat, syncPlanModeFromBackend]);

	const cancelClarificationQuestionSet = useCallback(
		async (questionCard: ParsedQuestionCardPayload) => {
			const toolCallId =
				questionCard.deferredToolCallId ?? questionCard.toolCallId ?? null;
			if (!toolCallId) {
				await submitClarificationDismiss(questionCard);
				return true;
			}

			const didCancelDeferredTool = await cancelDeferredToolCall(toolCallId);
			if (!didCancelDeferredTool) {
				toast.error("Couldn't cancel the clarification step.", {
					description: "The question card is still active. Try again.",
				});
				return false;
			}

			await finalizeCancelledClarificationTurn();
			return true;
		},
		[
			finalizeCancelledClarificationTurn,
			submitClarificationDismiss,
		],
	);

	const acceptPlanReview = useCallback(
		async (planWidget: ParsedPlanWidgetPayload) => {
			await sendPlanReviewResult({
				isPlanMode: false,
				planWidget,
				result: "Accept.",
				userMessageText: "Accepted the plan.",
			});
		},
		[sendPlanReviewResult],
	);

	const togglePlanMode = useCallback(async () => {
		const pendingPlanReview = getActivePendingPlanReview();
		if (pendingPlanReview) {
			planModeSyncRequestIdRef.current += 1;
			setPlanningSession(null);
			if (isPlanMode) {
				pendingPlanModeOverrideRef.current = "default";
				setIsPlanMode(false);
				return;
			}

			if (pendingPlanModeOverrideRef.current === "default") {
				pendingPlanModeOverrideRef.current = null;
				setIsPlanMode(true);
				return;
			}
		}

		const nextMode = isPlanMode ? "default" : "plan";
		const threadId = activeThreadIdRef.current;
		planModeSyncRequestIdRef.current += 1;
		pendingPlanModeOverrideRef.current = null;
		setPlanningSession(null);
		setIsPlanMode(nextMode === "plan");
		try {
			if (isPlanMode && threadId) {
				const activeQuestionCard = getLatestQuestionCardPayload(
					rovodevMessagesRef.current,
				);
				const didCancelDeferredQuestion =
					activeQuestionCard
					&& (activeQuestionCard.deferredToolCallId
						|| activeQuestionCard.toolCallId)
						? await cancelClarificationQuestionSet(activeQuestionCard)
						: null;

				if (didCancelDeferredQuestion === false) {
					setIsPlanMode(true);
					return;
				}

				if (didCancelDeferredQuestion === null) {
					await fetch(buildFutureChatCancelUrl(threadId), {
						method: "POST",
					}).catch((error) => {
						console.warn("[FutureChat] Failed to cancel pending plan turn:", error);
					});
				}
			}

			const response = await fetch(API_ENDPOINTS.AGENT_MODE, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(buildFutureChatAgentModeRequest({ mode: nextMode })),
			});

			if (!response.ok) {
				throw new Error(`Agent mode toggle failed with status ${response.status}`);
			}
		} catch (error) {
			console.warn("[FutureChat] Failed to toggle plan mode:", error);
			setIsPlanMode(isPlanMode);
		}
	}, [cancelClarificationQuestionSet, getActivePendingPlanReview, isPlanMode]);

	const resetPlanMode = useCallback(() => {
		planModeSyncRequestIdRef.current += 1;
		pendingPlanModeOverrideRef.current = null;
		setPlanningSession(null);
		setIsPlanMode(false);
	}, []);

	const appendRealtimeMessage = useCallback(
		async (
			role: "user" | "assistant",
			content: string,
			options?: {
				createdAt?: string;
				messageId?: string;
				metadata?: RovoUIMessage["metadata"];
				state?: "done" | "streaming";
			},
		) => {
			const createdAt = options?.createdAt ?? new Date().toISOString();
			const messageId = options?.messageId ?? createId("future-chat-realtime");
			const threadId = await ensureThread(content || `${role} message`);
			const message = createRealtimeTextMessage({
				id: messageId,
				role,
				content,
				createdAt,
				state: options?.state ?? "done",
				metadata: {
					...(options?.metadata ?? {}),
					realtimeMessageId: messageId,
				},
			});

			const nextRealtimeMessages = mutateRealtimeMessagesState((previousMessages) => {
				return upsertRealtimeMessage(previousMessages, message);
			});
			setThreads((previousThreads) =>
				previousThreads.map((thread) => {
					if (thread.id !== threadId) {
						return thread;
					}

					return {
						...thread,
						realtimeMessages: upsertRealtimeMessage(
							thread.realtimeMessages ?? [],
							message,
						),
						updatedAt: new Date().toISOString(),
					};
				}),
			);
			void upsertFutureChatRealtimeMessage({
				threadId,
				message:
					nextRealtimeMessages.find((existingMessage) => existingMessage.id === messageId)
					?? message,
			}).catch((error) => {
				console.warn("[FutureChat] Failed to persist realtime message:", error);
			});

			return messageId;
		},
		[ensureThread, mutateRealtimeMessagesState],
	);

	const mutateRealtimeMessageContent = useCallback(
		(messageId: string, content: string, options: { append: boolean; state: "done" | "streaming" }) => {
			if (!messageId || (!content && options.append)) {
				return;
			}

			const updatedAt = new Date().toISOString();
			const threadId = activeThreadIdRef.current;
			const nextRealtimeMessages = mutateRealtimeMessagesState((previousMessages) =>
				updateRealtimeTextMessage(previousMessages, messageId, content, {
					append: options.append,
					metadata: { updatedAt },
					state: options.state,
				}),
			);
			if (threadId) {
				const nextMessage = nextRealtimeMessages.find((message) => message.id === messageId);
				if (nextMessage) {
					void upsertFutureChatRealtimeMessage({
						threadId,
						message: nextMessage,
					}).catch((error) => {
						console.warn("[FutureChat] Failed to persist realtime message:", error);
					});
				}
			}
		},
		[mutateRealtimeMessagesState],
	);

	const setRealtimeMessageContent = useCallback(
		(messageId: string, content: string) => {
			mutateRealtimeMessageContent(messageId, content, { append: false, state: "done" });
		},
		[mutateRealtimeMessageContent],
	);

	const updateRealtimeMessage = useCallback(
		(messageId: string, contentDelta: string) => {
			mutateRealtimeMessageContent(messageId, contentDelta, { append: true, state: "streaming" });
		},
		[mutateRealtimeMessageContent],
	);

	const dispatchDelegationNow = useCallback(
		async (
			messageId: string,
			options?: {
				contextDescription?: string;
				conversationSummary?: string;
				existingRealtimeMessageId?: string | null;
				intentType?: string;
				prompt?: string;
				referencedFiles?: string[];
				urgency?: string;
			},
		) => {
			if (!messageId) {
				return;
			}

			setInputError(null);
			const delegatedMessage =
				realtimeMessagesRef.current.find((message) => message.id === messageId)
				?? messages.find((message) => message.id === messageId)
				?? null;
			const delegatedText =
				options?.prompt?.trim()
				|| (delegatedMessage ? getMessageText(delegatedMessage).trim() : "");
			if (!delegatedText) {
				return;
			}

			const hadActiveTurn =
				statusRef.current === "submitted" || statusRef.current === "streaming";
			const checkpointDocument = hadActiveTurn
				? await saveStreamingArtifactCheckpoint()
				: null;
			if (hadActiveTurn) {
				if (useChatStatus === "submitted" || useChatStatus === "streaming") {
					await stopUseChat();
				} else if (attachedRunStatus !== null || currentThread?.activeRun !== null) {
					const activeThreadId = activeThreadIdRef.current;
					if (activeThreadId) {
						await cancelFutureChatRun(activeThreadId).catch(() => false);
						setLocalThreadActiveRun(activeThreadId, null);
					}
				}
				runSubscriptionAbortControllerRef.current?.abort();
				runSubscriptionAbortControllerRef.current = null;
				runSubscriptionThreadIdRef.current = null;
				setAttachedRunStatus(null);
				delegationAbortControllerRef.current?.abort();
				delegationAbortControllerRef.current = null;
				clearDirectDelegationState();
			}

			const resolvedArtifactContext = checkpointDocument
				? buildArtifactContextPayload(checkpointDocument, getLatestDocumentContent(checkpointDocument))
				: resolveActiveArtifactContext(
					activeDocument, artifactDraftContent, activeDocumentContent, streamingArtifact,
				);
			const threadId = await ensureThread(delegatedText);
			resetPendingArtifactAssociation();

			const abortController = new AbortController();
			delegationAbortControllerRef.current = abortController;
			setDelegationTurnStatus("submitted");
			setDirectDelegationPhase("requesting");

			try {
				const response = await fetch(API_ENDPOINTS.FUTURE_CHAT_CHAT, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						id: threadId,
						messages: [
							...rovodevMessagesRef.current,
							...realtimeMessagesRef.current,
						],
						artifactContext: resolvedArtifactContext ?? undefined,
						artifactSteering: checkpointDocument
							? ({
								preferCurrentArtifact: true,
								source: "voice",
							} satisfies FutureChatArtifactSteeringPayload)
							: undefined,
						contextDescription: options?.contextDescription,
						conversationSummary: options?.conversationSummary,
						delegatedMessageId: messageId,
						smartGeneration: smartGenerationRequest,
						activeArtifact: buildActiveArtifactMetadata(activeDocument),
						origin: "voice" as const,
						voiceMetadata: {
							intentType: options?.intentType,
							urgency: options?.urgency,
							conversationSummary: options?.conversationSummary,
						},
						recentHistory: buildRecentHistory([
							...rovodevMessagesRef.current,
							...realtimeMessagesRef.current,
						]),
						visibility: threadVisibility,
					}),
					signal: abortController.signal,
				});
				if (!response.ok || !response.body) {
					throw new Error((await response.text().catch(() => "")) || "Failed to stream delegated response");
				}

				setDelegationTurnStatus("streaming");
				setDirectDelegationPhase("background");
				const existingRealtimeMessageId = options?.existingRealtimeMessageId;
				let mappedStreamedId: string | null = null;
				for await (const streamedMessage of readFutureChatDelegationResponseStream({
					stream: response.body,
					onError: (error) => {
						console.error("[FutureChat] Failed to read delegated UI message stream:", error);
					},
					terminateOnError: true,
				})) {
					let effectiveId = streamedMessage.id;
					if (existingRealtimeMessageId) {
						if (!mappedStreamedId || mappedStreamedId === streamedMessage.id) {
							mappedStreamedId = streamedMessage.id;
							effectiveId = existingRealtimeMessageId;
						}
					}

					mutateRealtimeMessagesState((previousMessages) => {
						// When an existing GPT interim message ID is provided, reuse it
						// so the delegation response merges into the same bubble instead
						// of creating a second one.
						const existingMessage = previousMessages.find(
							(message) => message.id === effectiveId,
						);
						const normalizedMessage: RovoUIMessage = {
							...streamedMessage,
							id: effectiveId,
							metadata: {
								...(streamedMessage.metadata ?? {}),
								createdAt:
									existingMessage?.metadata?.createdAt ??
									streamedMessage.metadata?.createdAt ??
									new Date().toISOString(),
								delegatedFromId: messageId,
								origin: "rovodev",
								realtimeMessageId:
									streamedMessage.metadata?.realtimeMessageId ??
									existingMessage?.metadata?.realtimeMessageId ??
									streamedMessage.id,
								updatedAt: new Date().toISOString(),
							},
						};
						void upsertFutureChatRealtimeMessage({
							threadId,
							message: normalizedMessage,
						}).catch((error) => {
							console.warn("[FutureChat] Failed to persist delegated realtime message:", error);
						});
						return upsertRealtimeMessage(previousMessages, normalizedMessage);
					});
					setBackgroundDelegationMessageId((currentId) => currentId ?? effectiveId);
				}
				clearDirectDelegationState();
			} catch (error) {
				if (
					abortController.signal.aborted
					|| isFutureChatDelegationAbortError(error)
				) {
					clearDirectDelegationState();
					return;
				}

				const errorMessage = toFutureChatUserErrorMessage(error);
				setInputError(errorMessage);
				await appendRealtimeMessage("assistant", errorMessage, {
					metadata: {
						origin: "rovodev",
						delegatedFromId: messageId,
					},
				});
				clearDirectDelegationState();
				throw error;
			} finally {
				if (delegationAbortControllerRef.current === abortController) {
					delegationAbortControllerRef.current = null;
				}
			}
		},
		[
			activeDocument,
			activeDocumentContent,
			appendRealtimeMessage,
			artifactDraftContent,
			clearDirectDelegationState,
			ensureThread,
			messages,
			mutateRealtimeMessagesState,
			resetPendingArtifactAssociation,
			saveStreamingArtifactCheckpoint,
			smartGenerationRequest,
			attachedRunStatus,
			currentThread?.activeRun,
			setLocalThreadActiveRun,
			stopUseChat,
			streamingArtifact,
			threadVisibility,
			useChatStatus,
		],
	);

	const enqueueDelegationAction = useCallback(
		(
			delegatedMessageId: string,
			options: {
				contextDescription?: string;
				conversationSummary?: string;
				existingRealtimeMessageId?: string | null;
				intentType?: string;
				prompt: string;
				referencedFiles?: string[];
				threadId: string;
				urgency?: string;
			},
		) => {
			const queuedAction: FutureChatQueuedDelegationAction = {
				id: createFutureChatQueueItemId(),
				threadId: options.threadId,
				text: options.prompt,
				createdAt: Date.now(),
				kind: "delegation",
				contextDescription: options.contextDescription,
				conversationSummary: options.conversationSummary,
				delegatedMessageId,
				existingRealtimeMessageId: options.existingRealtimeMessageId,
				intentType: options.intentType,
				referencedFiles: options.referencedFiles,
				urgency: options.urgency,
			};
			enqueueQueuedAction(queuedAction);
		},
		[enqueueQueuedAction],
	);
	const processQueue = useCallback(async () => {
		if (queueProcessorRunningRef.current) {
			return;
		}
		queueProcessorRunningRef.current = true;
		let dispatched = false;

		try {
			while (queueProcessorRunningRef.current) {
				// Wait until the thread is idle before dispatching.
				// activeRunStatus is tracked via attachedRunStatusRef once
				// the run subscription is attached, so we pass null here.
				while (
					queueProcessorRunningRef.current &&
					isFutureChatThreadBusy({
						activeRunStatus: null,
						attachedRunStatus: attachedRunStatusRef.current,
						status: statusRef.current,
					})
				) {
					await waitForFutureChat(50);
				}

				if (!queueProcessorRunningRef.current) {
					break;
				}

				const threadId = activeThreadIdRef.current;
				if (!threadId) {
					break;
				}

				const nextQueuedAction = peekNextQueuedActionForThread(threadId);
				if (!nextQueuedAction) {
					break;
				}

				if (
					!canDispatchFutureChatQueuedAction({
						action: nextQueuedAction,
						hasPendingPlanReview: Boolean(getActivePendingPlanReview()),
					})
				) {
					break;
				}

				const nextAction = shiftNextQueuedActionForThread(threadId);
				if (!nextAction) {
					break;
				}

				// If cancelled between shift and dispatch, re-enqueue the action
				if (!queueProcessorRunningRef.current) {
					enqueueQueuedAction(nextAction);
					break;
				}

				if (!dispatched) {
					dispatched = true;
					setHasActiveDispatch(true);
				}

				try {
					if (nextAction.kind === "delegation") {
						await dispatchDelegationNow(nextAction.delegatedMessageId, {
							contextDescription: nextAction.contextDescription,
							conversationSummary: nextAction.conversationSummary,
							existingRealtimeMessageId:
								nextAction.existingRealtimeMessageId ?? undefined,
							intentType: nextAction.intentType,
							prompt: nextAction.text,
							referencedFiles: nextAction.referencedFiles,
							urgency: nextAction.urgency,
						});
					} else {
						await dispatchPromptNow({
							text: nextAction.text,
							files: [...nextAction.files],
							contextDescription: nextAction.contextDescription,
							executionMode: nextAction.executionMode,
							executionTask: nextAction.executionTask,
							messageMetadata: nextAction.messageMetadata,
						});
					}
				} catch (error) {
					console.error("[FutureChat] Failed to dispatch queued action:", error);
					setInputError(toFutureChatUserErrorMessage(error));
					break;
				}
			}
		} finally {
			queueProcessorRunningRef.current = false;
			if (dispatched) {
				setHasActiveDispatch(false);
			}
		}
	}, [
		dispatchDelegationNow,
		dispatchPromptNow,
		enqueueQueuedAction,
		getActivePendingPlanReview,
		peekNextQueuedActionForThread,
		shiftNextQueuedActionForThread,
	]);

	processQueueRef.current = processQueue;



	const delegateToRovodev = useCallback(
		async (
			messageId: string,
			options?: {
				contextDescription?: string;
				conversationSummary?: string;
				existingRealtimeMessageId?: string | null;
				intentType?: string;
				prompt?: string;
				referencedFiles?: string[];
				urgency?: string;
			},
		) => {
			if (!messageId) {
				return;
			}

			setInputError(null);
			const delegatedMessage =
				realtimeMessagesRef.current.find((message) => message.id === messageId)
				?? messages.find((message) => message.id === messageId)
				?? null;
			const delegatedText =
				options?.prompt?.trim()
				|| (delegatedMessage ? getMessageText(delegatedMessage).trim() : "");
			if (!delegatedText) {
				return;
			}

			const resolvedThreadId = activeThreadIdRef.current ?? draftThreadId;
			const shouldEnqueue =
				queueProcessorRunningRef.current ||
				isFutureChatThreadBusy({
					activeRunStatus: currentThread?.activeRun?.status ?? null,
					attachedRunStatus,
					status: statusRef.current,
				}) ||
				(queuedActionsByThreadId[resolvedThreadId]?.length ?? 0) > 0;

			if (shouldEnqueue) {
				enqueueDelegationAction(messageId, {
					contextDescription: options?.contextDescription,
					conversationSummary: options?.conversationSummary,
					existingRealtimeMessageId: options?.existingRealtimeMessageId,
					intentType: options?.intentType,
					prompt: delegatedText,
					referencedFiles: options?.referencedFiles,
					threadId: resolvedThreadId,
					urgency: options?.urgency,
				});
				kickQueue();
				return;
			}

			await dispatchDelegationNow(messageId, {
				...options,
				prompt: delegatedText,
			});
		},
		[
			attachedRunStatus,
			currentThread?.activeRun?.status,
			dispatchDelegationNow,
			draftThreadId,
			enqueueDelegationAction,
			kickQueue,
			messages,
			queuedActionsByThreadId,
		],
	);



	const requestExplicitCancel = useCallback(async () => {
		const now = Date.now();
		if (now - lastExplicitCancelAtRef.current < EXPLICIT_CANCEL_DEBOUNCE_MS) {
			return;
		}

		lastExplicitCancelAtRef.current = now;

		try {
			const activeThreadId = activeThreadIdRef.current;
				if (activeThreadId && (currentThread?.activeRun || attachedRunStatus !== null)) {
					const cancelled = await cancelFutureChatRun(activeThreadId).catch(() => false);
					if (cancelled) {
						queueProcessorRunningRef.current = false;
						setHasActiveDispatch(false);
						setLocalThreadActiveRun(activeThreadId, null);
						setAttachedRunStatus(null);
						return;
				}
			}

			await fetch(buildFutureChatCancelUrl(activeThreadIdRef.current), {
				method: "POST",
			});
			queueProcessorRunningRef.current = false;
			setHasActiveDispatch(false);
			} catch (error) {
				console.warn("[FutureChat] Explicit cancel request failed:", error);
			}
		}, [attachedRunStatus, currentThread?.activeRun, setLocalThreadActiveRun]);

	const cancelThreadRun = useCallback(
		async (threadId: string) => {
			try {
				const cancelled = await cancelFutureChatRun(threadId);
				if (!cancelled) {
					await refreshThreads();
					return false;
				}

					setLocalThreadActiveRun(threadId, null);
					if (activeThreadIdRef.current === threadId) {
						queueProcessorRunningRef.current = false;
						setHasActiveDispatch(false);
						runSubscriptionAbortControllerRef.current?.abort();
						runSubscriptionAbortControllerRef.current = null;
					runSubscriptionThreadIdRef.current = null;
					setAttachedRunStatus(null);
				}
				return true;
			} catch (error) {
				setInputError(toFutureChatUserErrorMessage(error));
				return false;
			}
		},
			[refreshThreads, setLocalThreadActiveRun],
		);

	const waitForActiveTurnToStop = useCallback(async () => {
		const startedAt = Date.now();
		while (
			statusRef.current === "submitted" ||
			statusRef.current === "streaming"
		) {
			if (Date.now() - startedAt > ACTIVE_TURN_STOP_TIMEOUT_MS) {
				return false;
			}
			await new Promise<void>((resolve) => {
				window.setTimeout(resolve, 25);
			});
		}
		return true;
	}, []);

	const interruptActiveTurn = useCallback(
		async ({
			source = "user-stop",
		}: {
			source?: RovoMessageInterruptionSource;
		} = {}) => {
			if (interruptPromiseRef.current) {
				return interruptPromiseRef.current;
			}

			const interruptPromise = (async () => {
				const hadActiveTurn =
					statusRef.current === "submitted" ||
					statusRef.current === "streaming";
				const hasUseChatTurn =
					useChatStatus === "submitted" || useChatStatus === "streaming";
				const hasAttachedRun =
					attachedRunStatus !== null || currentThread?.activeRun !== null;
				const directDelegationAbortController = delegationAbortControllerRef.current;

				try {
					if (hadActiveTurn) {
						let stoppedInTime = true;
						if (hasUseChatTurn) {
							await stopUseChat();
							stoppedInTime = await waitForActiveTurnToStop();
						}

						if (
							shouldSendExplicitRovoDevCancel({
								hasUseChatTurn,
								stopSettledInTime: stoppedInTime,
							})
						) {
							if (hasUseChatTurn && !stoppedInTime) {
								console.warn(
									"[FutureChat] useChat turn did not stop within grace period; escalating to explicit cancel.",
								);
							}
							await requestExplicitCancel();
							stoppedInTime = await waitForActiveTurnToStop();
						}

						runSubscriptionAbortControllerRef.current?.abort();
						runSubscriptionAbortControllerRef.current = null;
						runSubscriptionThreadIdRef.current = null;
						setAttachedRunStatus(null);
						directDelegationAbortController?.abort();
						clearDirectDelegationState();
						delegationAbortControllerRef.current = null;

						if (!stoppedInTime) {
							console.warn(
								"[FutureChat] Proceeding after cancel timeout while interrupting active turn.",
							);
						}
					}

					const interruptedAt = new Date().toISOString();
					let didMarkInterruptedReply = false;
					if (hasUseChatTurn || hasAttachedRun) {
						setRovodevMessages((previousMessages) => {
							const result = markLastFutureChatAssistantMessageInterrupted(
								previousMessages,
								{
									interruptedAt,
									source,
								},
							);
							didMarkInterruptedReply = result.messageId !== null;
							return didMarkInterruptedReply ? result.messages : previousMessages;
						});
					} else {
						mutateRealtimeMessagesState((previousMessages) => {
							const result = markLastFutureChatAssistantMessageInterrupted(
								previousMessages,
								{
									interruptedAt,
									source,
								},
							);
							didMarkInterruptedReply = result.messageId !== null;
							return didMarkInterruptedReply ? result.messages : previousMessages;
						});
					}

					if (didMarkInterruptedReply) {
						await new Promise<void>((resolve) => {
							window.setTimeout(resolve, 0);
						});
					}
				} catch (error) {
					setInputError(toFutureChatUserErrorMessage(error));
					throw error;
				}
			})().finally(() => {
				interruptPromiseRef.current = null;
			});

			interruptPromiseRef.current = interruptPromise;
			return interruptPromise;
		},
		[
			attachedRunStatus,
			clearDirectDelegationState,
			currentThread?.activeRun,
			mutateRealtimeMessagesState,
			requestExplicitCancel,
			setRovodevMessages,
			stopUseChat,
			useChatStatus,
			waitForActiveTurnToStop,
		],
	);

	const stop = useCallback(async () => {
		await interruptActiveTurn({ source: "user-stop" });
	}, [interruptActiveTurn]);

	const applyVoiceSteer = useCallback(
		async ({
			text,
			contextDescription,
		}: {
			text: string;
			contextDescription?: string;
		}) => {
			const trimmedText = text.trim();
			if (!trimmedText) {
				return;
			}

			setInputError(null);

			try {
				const hadActiveTurn =
					statusRef.current === "submitted" || statusRef.current === "streaming";
				const checkpointDocument = hadActiveTurn
					? await saveStreamingArtifactCheckpoint()
					: null;
				if (hadActiveTurn) {
					await interruptActiveTurn({ source: "voice-barge-in" });
				}

				await releaseCompletedUseChatTurnIfNeeded();

				const threadId = await ensureThread(trimmedText);
				const { message, messageId } = appendLocalUserMessage({
					files: [],
					text: trimmedText,
				});
				markLocalThreadRunPending(threadId);
				resetPendingArtifactAssociation();
				void sendMessage(
					{
						text: trimmedText,
						files: [],
						messageId,
						metadata: message.metadata,
					},
					{
						body: {
							id: threadId,
							contextDescription,
							origin: "voice" as const,
							artifactSteering: {
								preferCurrentArtifact: true,
								source: "voice",
							} satisfies FutureChatArtifactSteeringPayload,
							artifactContext: checkpointDocument
								? buildArtifactContextPayload(
									checkpointDocument,
									getLatestDocumentContent(checkpointDocument),
								)
								: undefined,
						},
					},
				).catch((error) => {
					setInputError(toFutureChatUserErrorMessage(error));
				});
			} catch (error) {
				setInputError(toFutureChatUserErrorMessage(error));
				throw error;
			}
		},
		[
			appendLocalUserMessage,
			ensureThread,
			interruptActiveTurn,
			markLocalThreadRunPending,
			releaseCompletedUseChatTurnIfNeeded,
			resetPendingArtifactAssociation,
			saveStreamingArtifactCheckpoint,
			sendMessage,
		],
	);

	const deleteThread = useCallback(
		async (threadId: string) => {
			deletedThreadIdsRef.current.add(threadId);
			clearQueuedActionsForThread(threadId);
			setThreads((previousThreads) =>
				previousThreads.filter((thread) => thread.id !== threadId),
			);

			try {
				await deleteFutureChatThread(threadId);
				if (activeThreadIdRef.current === threadId) {
					runSubscriptionAbortControllerRef.current?.abort();
					runSubscriptionAbortControllerRef.current = null;
					runSubscriptionThreadIdRef.current = null;
					setAttachedRunStatus(null);
					await openNewChat();
				}
			} catch (error) {
				deletedThreadIdsRef.current.delete(threadId);
				void refreshThreads();
				setInputError(toFutureChatUserErrorMessage(error));
			}
		},
		[clearQueuedActionsForThread, openNewChat, refreshThreads],
	);

	const deleteAllThreads = useCallback(async () => {
		const previousThreadIds = threads.map((thread) => thread.id);
		for (const threadId of previousThreadIds) {
			deletedThreadIdsRef.current.add(threadId);
			clearQueuedActionsForThread(threadId);
		}
		setThreads([]);

		try {
			await deleteAllFutureChatThreads();
			runSubscriptionAbortControllerRef.current?.abort();
			runSubscriptionAbortControllerRef.current = null;
			runSubscriptionThreadIdRef.current = null;
			setAttachedRunStatus(null);
			await openNewChat();
		} catch (error) {
			for (const threadId of previousThreadIds) {
				deletedThreadIdsRef.current.delete(threadId);
			}
			void refreshThreads();
			setInputError(toFutureChatUserErrorMessage(error));
		}
	}, [clearQueuedActionsForThread, openNewChat, refreshThreads, threads]);

	const voteOnMessage = useCallback(
		async (messageId: string, value: "up" | "down" | null) => {
			if (!activeThreadId) {
				return;
			}

			try {
				const vote = await setFutureChatVote({
					threadId: activeThreadId,
					messageId,
					value,
				});
				setVotes((previousVotes) => {
					const nextVotes = { ...previousVotes };
					if (vote.value === "up" || vote.value === "down") {
						nextVotes[messageId] = vote.value;
					} else {
						delete nextVotes[messageId];
					}
					return nextVotes;
				});
			} catch (error) {
				setInputError(toFutureChatUserErrorMessage(error));
			}
		},
		[activeThreadId],
	);

	const openArtifactFromMessage = useCallback(
		async (message: RovoUIMessage) => {
			const content = buildArtifactContentFromMessage(message);
			if (!content.trim()) {
				return;
			}

			try {
				const threadId = await ensureThread("Artifact context");
				const existingDocument = documents.find((document) => document.sourceMessageId === message.id);
				if (existingDocument) {
					setActiveDocumentId(existingDocument.id);
					setVisibleArtifactDocumentId(existingDocument.id);
					setPanelState("preview");
					setArtifactMode("preview");
					return;
				}

				const document = await saveFutureChatDocument({
					threadId,
					title: deriveThreadTitle(getMessageText(message) || "Artifact"),
					kind: inferArtifactKind(message, content),
					content,
					sourceMessageId: message.id,
				});
				selectDocumentForDisplay(document);
				setVisibleArtifactDocumentId(document.id);
				setPanelState("preview");
			} catch (error) {
				setInputError(toFutureChatUserErrorMessage(error));
			}
		},
			[documents, ensureThread, selectDocumentForDisplay],
		);

	const openDocument = useCallback(
		async (documentId: string) => {
			const existingDocument = documents.find((document) => document.id === documentId) ?? null;
			if (existingDocument) {
				selectDocumentForDisplay(existingDocument);
				setVisibleArtifactDocumentId(existingDocument.id);
				setPanelState("preview");
				return;
			}

			await hydratePersistedArtifact(documentId);
			setVisibleArtifactDocumentId(documentId);
			setPanelState("preview");
		},
			[documents, hydratePersistedArtifact, selectDocumentForDisplay],
		);

	const openPlanAsDocument = useCallback(
		(plan: { title: string; markdown: string; sourceMessageId?: string | null }) => {
			const now = new Date().toISOString();
			const documentId = createId();
			const versionId = createId();
			const content = plan.markdown.trim() || plan.title;
			const document: FutureChatDocument = {
				id: documentId,
				threadId: activeThreadId ?? "",
				title: plan.title,
				kind: "text",
				sourceMessageId: plan.sourceMessageId ?? null,
				createdAt: now,
				updatedAt: now,
				versions: [{ id: versionId, changeLabel: "Plan", content, createdAt: now, title: plan.title }],
			};
			selectDocumentForDisplay(document);
			setVisibleArtifactDocumentId(documentId);
			setPanelState("preview");
		},
		[activeThreadId, selectDocumentForDisplay],
	);

	const saveArtifactDraft = useCallback(async () => {
		if (!activeDocumentId || !artifactDraftContent.trim()) {
			return;
		}

		try {
			const document = await saveFutureChatDocument({
				changeLabel: "Manual edit",
				documentId: activeDocumentId,
				title: activeDocument?.title ?? "Artifact",
				kind: activeDocument?.kind ?? "text",
				content: artifactDraftContent,
			});
			setDocuments((previousDocuments) => {
				const withoutPrevious = previousDocuments.filter((item) => item.id !== document.id);
				return [document, ...withoutPrevious];
			});
			setSelectedVersionId(document.versions.at(-1)?.id ?? null);
			setArtifactMode("preview");
		} catch (error) {
			setInputError(toFutureChatUserErrorMessage(error));
		}
	}, [activeDocument, activeDocumentId, artifactDraftContent]);

	const deleteDocument = useCallback(
		async (documentId: string) => {
			try {
				await deleteFutureChatDocument(documentId);
				setDocuments((previousDocuments) =>
					previousDocuments.filter((document) => document.id !== documentId),
				);
				if (activeDocumentId === documentId) {
					clearArtifactState();
				}
			} catch (error) {
				setInputError(toFutureChatUserErrorMessage(error));
			}
		},
			[activeDocumentId, clearArtifactState],
		);

	const editMessage = useCallback(
		async (messageId: string, nextText: string) => {
			const trimmedText = nextText.trim();
			if (!trimmedText) {
				return;
			}

			const messageIndex = normalizedRovodevMessages.findIndex((message) => message.id === messageId);
			if (messageIndex === -1) {
				return;
			}

			const updatedMessages = normalizedRovodevMessages
				.slice(0, messageIndex + 1)
				.map((message, index) => {
					if (index !== messageIndex) {
						return message;
					}

					return {
						...message,
						parts: [{ type: "text" as const, text: trimmedText }],
					};
				});
			isHydratingThreadRef.current = true;
			setRovodevMessages(updatedMessages);
			window.setTimeout(() => {
				isHydratingThreadRef.current = false;
				resetPendingArtifactAssociation();
				resetObservedTurnComplete();
				regenerate();
			}, 0);
			setEditingMessageId(null);
		},
		[regenerate, resetObservedTurnComplete, resetPendingArtifactAssociation, normalizedRovodevMessages, setRovodevMessages],
	);

	const regenerateLatest = useCallback(() => {
		resetPendingArtifactAssociation();
		resetObservedTurnComplete();
		regenerate();
	}, [regenerate, resetObservedTurnComplete, resetPendingArtifactAssociation]);

	useEffect(() => {
		if (!activeThreadId || isLoadingThread || isStreaming || isHydratingThreadRef.current) {
			return;
		}

		const currentThread =
			threads.find((thread) => thread.id === activeThreadId) ?? null;
		const nextTitle =
			currentThread?.title && currentThread.title.trim() !== "New chat"
				? currentThread.title
				: deriveThreadTitle(getMessageText(messages.find((message) => message.role === "user") ?? { parts: [] }));
			const nextPersistKey = buildFutureChatThreadPersistKey({
				messages: normalizedRovodevMessages,
			realtimeMessages,
			visibility: threadVisibility,
			activeDocumentId,
			title: nextTitle,
		});
		if (nextPersistKey === lastPersistedKeyRef.current) {
			return;
		}

		let cancelled = false;
		const realtimeRequestVersion = realtimeMessagesVersionRef.current;
			void updateFutureChatThread(activeThreadId, {
				title: nextTitle,
				messages: normalizedRovodevMessages,
			realtimeMessages,
			visibility: threadVisibility,
			activeDocumentId,
		})
			.then((thread) => {
				if (cancelled) {
					return;
				}

				const persistedKey = buildFutureChatThreadPersistKey({
					messages: thread.messages,
					realtimeMessages: thread.realtimeMessages ?? [],
					visibility: thread.visibility,
					activeDocumentId: thread.activeDocumentId,
					title: thread.title,
				});
				lastPersistedKeyRef.current = persistedKey;
				setThreads((previousThreads) =>
					upsertFutureChatThreadRecord(previousThreads, thread, {
						deletedThreadIds: deletedThreadIdsRef.current,
					}),
				);
				if (
					shouldReplaceFutureChatRouteAfterPersistence({
						pendingThreadId: pendingRouteThreadIdRef.current,
						thread,
							messages: normalizedRovodevMessages,
						realtimeMessages,
						visibility: threadVisibility,
						activeDocumentId,
						title: nextTitle,
					})
				) {
					pendingRouteReadyRef.current = true;
					if (!embedded && !isVoiceMode) {
						pendingRouteThreadIdRef.current = null;
						pendingRouteReadyRef.current = false;
						replaceFutureChatHistoryPath(buildFutureChatThreadPath(thread.id));
					}
				}
					if (!areFutureChatMessagesEqual(thread.messages, normalizedRovodevMessages)) {
					isHydratingThreadRef.current = true;
					setRovodevMessages(thread.messages);
					window.setTimeout(() => {
						isHydratingThreadRef.current = false;
					}, 0);
				}
				if (
					!areFutureChatMessagesEqual(
						thread.realtimeMessages ?? [],
						realtimeMessagesRef.current,
					)
					&& shouldHydratePersistedRealtimeMessages({
						currentMessages: realtimeMessagesRef.current,
						currentVersion: realtimeMessagesVersionRef.current,
						requestVersion: realtimeRequestVersion,
					})
				) {
					isHydratingThreadRef.current = true;
					replaceRealtimeMessagesState(thread.realtimeMessages ?? [], {
						incrementVersion: false,
					});
					window.setTimeout(() => {
						isHydratingThreadRef.current = false;
					}, 0);
				}
			})
			.catch((error) => {
				if (cancelled) {
					return;
				}

					const recoveryState = {
						activeDocumentId,
						messages: normalizedRovodevMessages,
					realtimeMessages,
					threadId: activeThreadId,
					title: nextTitle,
					visibility: threadVisibility,
				};
				if (
					shouldRecoverFutureChatThreadAfterPersistenceFailure({
						error,
						state: recoveryState,
					})
				) {
					const recoveryInput =
						buildRecoverableFutureChatThreadInput(recoveryState);
					void createFutureChatThread(recoveryInput)
						.then((thread) => {
							if (
								cancelled ||
								activeThreadIdRef.current !== recoveryInput.id
							) {
								return;
							}

							lastPersistedKeyRef.current = buildFutureChatThreadPersistKey({
								messages: thread.messages,
								realtimeMessages: thread.realtimeMessages ?? [],
								visibility: thread.visibility,
								activeDocumentId: thread.activeDocumentId,
								title: thread.title,
							});
							setThreads((previousThreads) =>
								upsertFutureChatThreadRecord(previousThreads, thread, {
									deletedThreadIds: deletedThreadIdsRef.current,
								}),
							);
							if (!embedded) {
								pendingRouteThreadIdRef.current = thread.id;
								pendingRouteReadyRef.current = true;
								if (!isVoiceMode) {
									pendingRouteThreadIdRef.current = null;
									pendingRouteReadyRef.current = false;
									replaceFutureChatHistoryPath(buildFutureChatThreadPath(thread.id));
								}
							}
						})
						.catch((recoveryError) => {
							if (!cancelled) {
								setInputError(toFutureChatUserErrorMessage(recoveryError));
							}
						});
					return;
				}

				setInputError(toFutureChatUserErrorMessage(error));
			});

		return () => {
			cancelled = true;
		};
	}, [
		activeDocumentId,
		activeThreadId,
		embedded,
		isLoadingThread,
		isStreaming,
		isVoiceMode,
		messages,
		realtimeMessages,
		replaceRealtimeMessagesState,
			normalizedRovodevMessages,
		setRovodevMessages,
		threadVisibility,
		threads,
	]);

	useEffect(() => {
		const resolvedActiveThreadId = activeThreadId;
		if (!resolvedActiveThreadId) {
			return;
		}

		if (!shouldReplacePendingFutureChatRoute({
			activeThreadId: resolvedActiveThreadId,
			embedded,
			hasPersistedThreadState: pendingRouteReadyRef.current,
			isStreaming,
			isVoiceMode,
			pendingThreadId: pendingRouteThreadIdRef.current,
		})) {
			return;
		}

		pendingRouteThreadIdRef.current = null;
		pendingRouteReadyRef.current = false;
		replaceFutureChatHistoryPath(buildFutureChatThreadPath(resolvedActiveThreadId));
	}, [activeThreadId, embedded, isStreaming, isVoiceMode]);

	useEffect(() => {
		if (backgroundRefreshThreadIdsKey === "[]") {
			return;
		}

		const trackedThreadIds = JSON.parse(backgroundRefreshThreadIdsKey) as string[];
		let cancelled = false;
		const poll = async () => {
			if (cancelled) return;
			try {
				const streams = await listFutureChatBackgroundStreams();
				if (cancelled) return;
				const activeIds = new Set(streams.map((stream) => stream.threadId));
				const nextThreads = filterDeletedFutureChatThreads(
					await listFutureChatThreads(),
					deletedThreadIdsRef.current,
				);
				if (cancelled) return;
				setThreads((prevThreads) => {
					if (
						prevThreads.length === nextThreads.length
						&& prevThreads.every(
							(thread, index) =>
								thread.id === nextThreads[index].id
								&& thread.updatedAt === nextThreads[index].updatedAt,
						)
					) {
						return prevThreads;
					}

					return nextThreads;
				});

				// If any completed threads include the active one, refresh it
				for (const id of trackedThreadIds) {
					if (shouldHydrateCompletedActiveBackgroundThread({
						activeStreamThreadIds: activeIds,
						activeThreadId: activeThreadIdRef.current,
						status: statusRef.current,
						threadId: id,
					})) {
						await hydrateThreadById(id);
					}
				}
			} catch {
				// Polling failure is non-critical
			}
		};

		const intervalId = window.setInterval(poll, 3000);
		void poll(); // Run immediately on first render

		return () => {
			cancelled = true;
			window.clearInterval(intervalId);
		};
	}, [backgroundRefreshThreadIdsKey, hydrateThreadById]);

	return {
		activeDocument,
		activeToolApproval,
		activeDocumentContent,
		activeThreadId,
		applyVoiceSteer,
		artifactMode,
		artifactDraftContent,
		backgroundArtifactLabel: composerState.backgroundArtifactLabel,
		backgroundDelegationLabel: composerState.backgroundDelegationLabel,
		backgroundStreamThreadIds,
		composerStatus: composerState.composerStatus,
		deleteAllThreads,
		deleteDocument,
		deleteThread,
		cancelThreadRun,
		documents,
		editMessage,
		editingMessageId,
		hideArtifactPane,
		hasBackgroundDelegation: composerState.hasBackgroundDelegation,
		inputError,
		interruptActiveTurn,
		isArtifactOpen: panelState !== "closed",
		isGeneratingTitle,
		isLoadingThread,
		isPlanMode,
		isStreaming,
		isVoiceMode,
		loadThread,
		messages,
		pendingTitleThreadId,
		openDocument,
		openPlanAsDocument,
		openArtifactFromMessage,
		openNewChat,
		panelState,
		setPanelState,
		queuedPrompts,
		regenerateLatest,
		removeQueuedPrompt,
		runtimeThreadId,
		saveArtifactDraft,
		selectedVersionId,
		setActiveDocumentId,
		setArtifactDraftContent,
		setArtifactMode,
		setEditingMessageId,
		setSelectedVersionId,
		setSidebarOpen,
		setThreadVisibility,
		setVoiceMode,
		shouldSuppressLatestAssistantSuggestions,
		shouldQueueNextSubmission,
		sidebarOpen,
		status,
		stop,
		submitToolApproval,
		cancelClarificationQuestionSet,
		submitClarification,
		submitClarificationDismiss,
		acceptPlanReview,
		submitPrompt,
		suggestedPrompt,
		togglePlanMode,
		toggleVoiceMode,
		resetPlanMode,
		pendingArtifactResult,
		streamingArtifact,
		streamingArtifactMessageId,
		visibleArtifactDocumentId,
		setVisibleArtifactDocumentId,
		threads,
		threadsLoaded,
		threadVisibility,
		votes,
		voteOnMessage,
		appendRealtimeMessage,
		delegateToRovodev,
		setRealtimeMessageContent,
		updateRealtimeMessage,
	};
}
