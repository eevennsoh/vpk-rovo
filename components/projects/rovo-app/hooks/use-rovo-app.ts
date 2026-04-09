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
import { useRovoAppQueue } from "@/app/rovo-app/rovo-app-queue-provider";
import { useLatestRef } from "@/lib/use-latest-ref";
import { shouldSendExplicitRovoDevCancel } from "@/lib/rovodev-cancel-strategy";
import { toast } from "sonner";
import {
	appendRovoAppStreamingArtifactDelta,
	getRovoAppStreamingArtifactCheckpoint,
	type RovoAppStreamingArtifact,
} from "@/components/projects/rovo-app/lib/rovo-app-streaming-artifact";
import type { RovoAppPendingArtifactResult } from "@/components/projects/rovo-app/lib/rovo-app-message-artifacts";
import { getLatestDocumentContent } from "@/components/projects/rovo-app/lib/rovo-app-message-artifacts";
import {
	buildRovoAppThreadPath,
	buildRovoAppThreadPersistKey,
	ROVO_APP_ROOT_PATH,
	getRovoAppThreadIdFromPath,
	shouldLoadInitialRovoAppThread,
	shouldSkipRovoAppThreadLoad,
	shouldReplacePendingRovoAppRoute,
	shouldReplaceRovoAppRouteAfterPersistence,
} from "@/components/projects/rovo-app/lib/rovo-app-thread-route-sync";
import {
	buildRecoverableRovoAppThreadInput,
	isRovoAppThreadNotFoundError,
	shouldPersistResolvedRovoAppTitle,
	shouldRecoverRovoAppThreadAfterPersistenceFailure,
} from "@/components/projects/rovo-app/lib/rovo-app-thread-persistence";
import { waitForChatSendSettled } from "@/components/projects/rovo-app/lib/rovo-app-send-guard";
import { shouldSuppressRovoAppPlanRetry } from "@/components/projects/rovo-app/lib/rovo-app-plan-retry-guard";
import { buildRovoAppActiveThreadTransitionPlan } from "@/components/projects/rovo-app/lib/rovo-app-active-thread-transition";
import {
	createRealtimeTextMessage,
	mergeRovoAppMessages,
	updateRealtimeTextMessage,
	upsertRealtimeMessage,
} from "@/components/projects/rovo-app/lib/rovo-app-realtime-message-state";
import { createRovoAppUserMessage } from "@/components/projects/rovo-app/lib/rovo-app-user-message";
import {
	appendSuggestedQuestionsToAssistantMessage,
	buildSuggestedQuestionsRequest,
} from "@/components/projects/rovo-app/lib/rovo-app-suggestions";
import {
	getRovoAppBackgroundRefreshThreadIds,
	shouldHydrateCompletedActiveBackgroundThread,
} from "@/components/projects/rovo-app/lib/rovo-app-background-refresh";
import {
	getLatestRovoAppThinkingStatusLabel,
	resolveRovoAppComposerSubmitState,
	type RovoAppDirectDelegationPhase,
} from "@/components/projects/rovo-app/lib/rovo-app-composer-submit-state";
import {
	canDispatchRovoAppQueuedAction,
	hasQueuedRovoAppFollowUp,
	isRovoAppThreadBusy,
} from "@/components/projects/rovo-app/lib/rovo-app-queue-gate";
import type { RovoAppSmartWidthClass } from "@/components/projects/rovo-app/lib/rovo-app-smart-generation-layout";
import {
	isRovoAppDelegationAbortError,
	readRovoAppDelegationResponseStream,
} from "@/components/projects/rovo-app/lib/rovo-app-delegation-stream";
import { shouldHydratePersistedRealtimeMessages } from "@/components/projects/rovo-app/lib/rovo-app-realtime-persistence";
import {
	filterDeletedRovoAppThreads,
	mergeRovoAppThreadWithLocalTitle,
	updateRovoAppThreadMessagesRecord,
	updateRovoAppThreadTitleRecord,
	upsertRovoAppThreadRecord,
} from "@/components/projects/rovo-app/lib/rovo-app-thread-state";
import {
	getPendingRovoAppTitleRequest,
	shouldDeferRovoAppTitlePersistence,
} from "@/components/projects/rovo-app/lib/rovo-app-title-generation";
import {
	createRovoAppThread,
	cancelRovoAppRun,
	deleteAllRovoAppThreads,
	deleteRovoAppDocument,
	deleteRovoAppThread,
	detachRovoAppStream,
	fetchRovoAppAITitle,
	detachRovoAppRun,
	fetchRovoAppSuggestedQuestions,
	getRovoAppBackendUnavailableUserMessage,
	getRovoAppDocument,
	getRovoAppThread,
	isRovoAppBackendUnavailableError,
	listRovoAppBackgroundStreams,
	listRovoAppDocuments,
	upsertRovoAppRealtimeMessage,
	listRovoAppThreads,
	listRovoAppVotes,
	saveRovoAppDocument,
	setRovoAppVote,
	updateRovoAppThread,
} from "@/components/projects/rovo-app/lib/api";
import {
	type ArtifactMode,
	type RovoAppActiveRun,
	type RovoAppDocument,
	type RovoAppDocumentKind,
	type RovoAppQueuedAction,
	type RovoAppQueuedDelegationAction,
	type RovoAppQueuedPromptAction,
	type RovoAppRunStatus,
	type RovoAppThread,
	type RovoAppVisibility,
	type RovoAppVote,
	type RovoAppActiveArtifact,
	type RovoAppHermesContext,
	type RovoAppPanelState,
	type RovoAppPromptMode,
	type RovoAppRecentHistoryEntry,
	type VoteValue,
	createRovoAppId,
} from "@/lib/rovo-app-types";
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
	buildRovoAppCancelUrl,
	syncRovoAppAgentModeForDispatch,
} from "@/components/projects/rovo-app/lib/rovo-app-agent-mode";
import { appendTurnCompleteToLastAssistantMessage, markClarificationToolResolved } from "@/components/projects/rovo-app/lib/rovo-app-streaming-assistant";
import {
	classifyRovoAppTurnMode,
	getLatestVisibleRovoAppUserPrompt,
	hasPendingRovoAppStructuredContinuation,
} from "@/components/projects/rovo-app/lib/rovo-app-turn-mode";
import {
	getRovoAppPlanningArtifactsSinceBaseline,
	getLatestRovoAppAssistantMessageId,
} from "@/components/projects/rovo-app/lib/rovo-app-planning-session";
import {
	buildExitPlanModeDeferredToolResponse,
	fetchEnrichedPlanTitle,
	getLatestPendingPlanWidget,
	getLatestSourcedPlanWidget,
	type ParsedPlanWidgetPayload,
	updatePlanWidgetMetadataInMessages,
} from "@/components/projects/shared/lib/plan-widget";
import { isGenericPlanTitle } from "@/components/projects/shared/lib/plan-identity";
import {
	buildPlanApprovalPrompt,
	createPlanApprovalSubmission,
	getPlanApprovalKeyFromPlanWidget,
	type PlanApprovalSelection,
	type PlanApprovalSubmission,
} from "@/components/projects/shared/lib/plan-approval";
import { markLastRovoAppAssistantMessageInterrupted } from "@/lib/rovo-app-interruptions";
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
import { createId, sortByUpdatedAtDesc, trimTitleText } from "@/lib/utils";
import {
	buildRovoAppPlanExecutionDismissKey,
	clearRovoAppPlanExecutionDismissalsForThread,
	resolveRovoAppPlanExecutionTracker,
	type RovoAppPlanExecutionTrackerViewModel,
} from "@/components/projects/rovo-app/lib/rovo-app-plan-execution-tracker";

function deriveThreadTitle(promptText: string): string {
	const firstLine = promptText
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.find((line) => line.length > 0);
	return firstLine?.slice(0, 80) || "New chat";
}

function createRovoAppQueueItemId(): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return createId("rovo-app-queue");
}

function upsertDocumentRecord(
	documents: ReadonlyArray<RovoAppDocument>,
	nextDocument: RovoAppDocument,
): RovoAppDocument[] {
	const withoutPrevious = documents.filter((document) => document.id !== nextDocument.id);
	return sortByUpdatedAtDesc([nextDocument, ...withoutPrevious]);
}

function buildVotesMap(votes: ReadonlyArray<RovoAppVote>): Record<string, VoteValue> {
	return votes.reduce<Record<string, VoteValue>>((result, vote) => {
		if (vote.value === "up" || vote.value === "down") {
			result[vote.messageId] = vote.value;
		}
		return result;
	}, {});
}

function inferArtifactKind(message: RovoUIMessage, content: string): RovoAppDocumentKind {
	if (
		/^\s*\{\s*"type"\s*:\s*"excalidraw"/iu.test(content) &&
		/"elements"\s*:\s*\[/iu.test(content)
	) {
		return "excalidraw";
	}

	if (/```[\w-]*[\s\S]+```/u.test(content)) {
		return "code";
	}

	const widget = getLatestDataPart(message, "data-widget-data");
	if (widget?.data?.type === "image-preview") {
		return "image";
	}
	if (widget?.data?.type === "table") {
		return "sheet";
	}
	if (
		widget?.data?.type === "genui-preview" &&
		widget.data.payload &&
		typeof widget.data.payload === "object" &&
		"body" in widget.data.payload &&
		widget.data.payload.body &&
		typeof widget.data.payload.body === "object" &&
		"kind" in widget.data.payload.body &&
		widget.data.payload.body.kind === "excalidraw"
	) {
		return "excalidraw";
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

function getRovoAppArtifactDocumentIdsFromMessages(
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

type RovoAppPlanningPhase = "awaiting-plan" | "retrying-missing-plan";

interface RovoAppPlanningSession {
	requestId: number;
	phase: RovoAppPlanningPhase;
	hasStreamStarted: boolean;
	retryUsed: boolean;
	baselineAssistantMessageId: string | null;
}

const VOICE_MODE_CONTEXT = [
	"The user is in voice mode — they are speaking to you and hearing your response read aloud.",
	"Keep responses concise and conversational, suitable for text-to-speech.",
	"Avoid heavy markdown formatting, bullet lists, and code blocks unless the user explicitly asks for them.",
	"You have access to browser automation tools. When the user asks you to browse a website, use the available browser tools to navigate, take snapshots, interact with elements, and describe what you see.",
].join(" ");

function toRovoAppUserErrorMessage(error: unknown): string {
	if (isRovoAppBackendUnavailableError(error)) {
		return getRovoAppBackendUnavailableUserMessage();
	}

	return error instanceof Error ? error.message : String(error);
}

function buildPromptModeMetadata(
	metadata: RovoUIMessage["metadata"] | undefined,
	mode: RovoAppPromptMode,
): RovoUIMessage["metadata"] {
	return {
		...(metadata ?? {}),
		submittedMode: mode,
	};
}

function waitForRovoApp(ms: number): Promise<void> {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

function pushRovoAppHistoryPath(path: string): void {
	window.history.pushState(null, "", path);
}

function replaceRovoAppHistoryPath(path: string): void {
	window.history.replaceState(null, "", path);
}

const EXPLICIT_CANCEL_DEBOUNCE_MS = 750;
const ACTIVE_TURN_STOP_TIMEOUT_MS = 1_200;

function areRovoAppMessagesEqual(
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

interface RovoAppArtifactContextPayload {
	content: string;
	id: string;
	kind: RovoAppDocumentKind;
	title: string;
}

interface RovoAppArtifactSteeringPayload {
	preferCurrentArtifact: true;
	source: "voice";
}

function buildArtifactContextPayload(
	document: Pick<RovoAppDocument, "id" | "title" | "kind">,
	content: string,
): RovoAppArtifactContextPayload {
	return {
		content,
		id: document.id,
		kind: document.kind,
		title: document.title,
	};
}

function buildStreamingArtifactContextPayload(
	artifact: RovoAppStreamingArtifact,
): RovoAppArtifactContextPayload | null {
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
	activeDocument: RovoAppDocument | null,
	artifactDraftContent: string,
	activeDocumentContent: string,
	streamingArtifact: RovoAppStreamingArtifact | null,
): RovoAppArtifactContextPayload | null {
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
	activeDocument: RovoAppDocument | null,
): RovoAppActiveArtifact | undefined {
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
): RovoAppRecentHistoryEntry[] {
	const history: RovoAppRecentHistoryEntry[] = [];
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

export interface RovoAppHookOptions {
	embedded?: boolean;
	initialThreadId?: string | null;
	smartGenerationLayout?: {
		containerWidthPx?: number;
		viewportWidthPx?: number;
		widthClass?: RovoAppSmartWidthClass;
	};
}

export interface RovoAppHookResult {
	activeDocument: RovoAppDocument | null;
	activeToolApproval: ToolApprovalPayload | null;
	activeDocumentContent: string;
	activeThreadId: string | null;
	applyVoiceSteer: (payload: {
		text: string;
		contextDescription?: string;
		hermesContext?: RovoAppHermesContext;
	}) => Promise<void>;
	artifactMode: ArtifactMode;
	artifactDraftContent: string;
	backgroundStreamThreadIds: ReadonlySet<string>;
	deleteAllThreads: () => Promise<void>;
	deleteDocument: (documentId: string) => Promise<void>;
	deleteThread: (threadId: string) => Promise<void>;
	cancelThreadRun: (threadId: string) => Promise<boolean>;
	documents: RovoAppDocument[];
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
	panelState: RovoAppPanelState;
	pendingPlanMetadataMessageIds: ReadonlySet<string>;
	setPanelState: (state: RovoAppPanelState) => void;
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
	setThreadVisibility: (visibility: RovoAppVisibility) => void;
	setVoiceMode: (next: boolean) => void;
	sidebarOpen: boolean;
	backgroundArtifactLabel: string | null;
	backgroundDelegationLabel: string | null;
	composerStatus: ChatStatus;
	hasBackgroundDelegation: boolean;
	planExecutionTracker: RovoAppPlanExecutionTrackerViewModel | null;
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
	submitPlanApproval: (planWidget: ParsedPlanWidgetPayload, selection: PlanApprovalSelection) => Promise<void>;
	submitPrompt: (payload: {
		text: string;
		files: FileUIPart[];
		contextDescription?: string;
		hermesContext?: RovoAppHermesContext;
	}) => Promise<void>;
	suggestedPrompt: (text: string) => Promise<void>;
	togglePlanMode: () => void;
	resetPlanMode: () => void;
	toggleVoiceMode: () => void;
	dismissPlanExecutionTracker: () => void;
	pendingArtifactResult: RovoAppPendingArtifactResult | null;
	queuedPrompts: ReadonlyArray<RovoAppQueuedAction>;
	shouldSuppressLatestAssistantSuggestions: boolean;
	shouldQueueNextSubmission: boolean;
	hideArtifactPane: () => void;
	streamingArtifact: RovoAppStreamingArtifact | null;
	streamingArtifactMessageId: string | null;
	visibleArtifactDocumentId: string | null;
	setVisibleArtifactDocumentId: (documentId: string | null) => void;
	threads: RovoAppThread[];
	threadsLoaded: boolean;
	threadVisibility: RovoAppVisibility;
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
			hermesContext?: RovoAppHermesContext;
			intentType?: string;
			prompt?: string;
			referencedFiles?: string[];
			urgency?: string;
		},
	) => Promise<void>;
	upsertRealtimeSyntheticMessage: (message: RovoUIMessage) => Promise<void>;
	setRealtimeMessageContent: (messageId: string, content: string) => void;
	updateRealtimeMessage: (messageId: string, contentDelta: string) => void;
}

function meetsStreamingAutoOpenContentThreshold(
	artifact: RovoAppStreamingArtifact | null,
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

export function useRovoApp({
	embedded = false,
	initialThreadId = null,
	smartGenerationLayout,
}: Readonly<RovoAppHookOptions>): RovoAppHookResult {
	const router = useRouter();
	const [draftThreadId, setDraftThreadId] = useState(() => initialThreadId ?? createRovoAppId());
	const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId);
	const [threads, setThreads] = useState<RovoAppThread[]>([]);
	const threadsRef = useRef(threads);
	threadsRef.current = threads;
	const [threadsLoaded, setThreadsLoaded] = useState(false);
	const [documents, setDocuments] = useState<RovoAppDocument[]>([]);
	const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
	const [threadVisibility, setThreadVisibility] = useState<RovoAppVisibility>("private");
	const [sidebarOpen, setSidebarOpen] = useState(() => !embedded);
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [artifactMode, setArtifactMode] = useState<ArtifactMode>("preview");
	const [artifactDraftContent, setArtifactDraftContent] = useState("");
	const [visibleArtifactDocumentId, setVisibleArtifactDocumentId] = useState<string | null>(null);
	const [panelState, setPanelState] = useState<RovoAppPanelState>("closed");
	const [pendingArtifactResult, setPendingArtifactResult] =
		useState<RovoAppPendingArtifactResult | null>(null);
	const [streamingArtifact, setStreamingArtifact] = useState<RovoAppStreamingArtifact | null>(null);
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
		useState<RovoAppDirectDelegationPhase>("idle");
	const [backgroundDelegationMessageId, setBackgroundDelegationMessageId] =
		useState<string | null>(null);
	const toggleVoiceMode = useCallback(() => setIsVoiceMode((prev) => !prev), []);
	const setVoiceMode = useCallback((next: boolean) => setIsVoiceMode(next), []);
	const [isPlanMode, setIsPlanMode] = useState(false);
	const [dismissedPlanExecutionTrackerKeys, setDismissedPlanExecutionTrackerKeys] =
		useState<Set<string>>(() => new Set());
	const [planningSession, setPlanningSession] = useState<RovoAppPlanningSession | null>(null);
	const [attachedRunStatus, setAttachedRunStatus] = useState<RovoAppRunStatus | null>(null);
	const attachedRunStatusRef = useRef<RovoAppRunStatus | null>(null);
	const [hasObservedTurnComplete, setHasObservedTurnComplete] = useState(false);
	const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
	const [pendingPlanMetadataMessageIds, setPendingPlanMetadataMessageIds] =
		useState<Set<string>>(() => new Set<string>());
	const [pendingTitleThreadId, setPendingTitleThreadId] = useState<string | null>(null);
	const [threadHydrationVersion, setThreadHydrationVersion] = useState(0);
	const {
		clearQueuedActionsForThread,
		enqueueQueuedAction,
		peekNextQueuedActionForThread,
		prependQueuedAction,
		queuedActionsByThreadId,
		removeQueuedAction,
		shiftNextQueuedActionForThread,
	} = useRovoAppQueue();
	const hasObservedTurnCompleteRef = useRef(false);
	const pendingTitleThreadIdRef = useRef<string | null>(null);
	const pendingTitleMessageRef = useRef<string | null>(null);
	const planModeSyncRequestIdRef = useRef(0);
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
	const clearPendingTitleGeneration = useCallback((threadId?: string | null) => {
		if (
			threadId
			&& pendingTitleThreadIdRef.current !== null
			&& pendingTitleThreadIdRef.current !== threadId
		) {
			return;
		}

		pendingTitleThreadIdRef.current = null;
		pendingTitleMessageRef.current = null;
		setPendingTitleThreadId(null);
		setIsGeneratingTitle(false);
	}, []);
	const setPlanMetadataPendingState = useCallback(
		(sourceMessageId: string, isPending: boolean) => {
			setPendingPlanMetadataMessageIds((previousMessageIds) => {
				if (isPending && previousMessageIds.has(sourceMessageId)) {
					return previousMessageIds;
				}
				if (!isPending && !previousMessageIds.has(sourceMessageId)) {
					return previousMessageIds;
				}

				const nextMessageIds = new Set<string>(previousMessageIds);
				if (isPending) {
					nextMessageIds.add(sourceMessageId);
				} else {
					nextMessageIds.delete(sourceMessageId);
				}
				return nextMessageIds;
			});
		},
		[],
	);
	const clearPendingPlanMetadataGeneration = useCallback(
		(sourceMessageId?: string | null) => {
			if (!sourceMessageId) {
				setPendingPlanMetadataMessageIds((previousMessageIds) => (
					previousMessageIds.size === 0 ? previousMessageIds : new Set<string>()
				));
				return;
			}

			setPlanMetadataPendingState(sourceMessageId, false);
		},
		[setPlanMetadataPendingState],
	);
	const beginThreadHydration = useCallback(() => {
		isHydratingThreadRef.current = true;
	}, []);
	const completeThreadHydration = useCallback(() => {
		isHydratingThreadRef.current = false;
		setThreadHydrationVersion((currentVersion) => currentVersion + 1);
	}, []);
	const resolveChatTitle = useCallback(
		(threadId: string, title: string) => {
			const normalizedTitle = trimTitleText(title);
			if (!normalizedTitle) {
				clearPendingTitleGeneration(threadId);
				return;
			}

			if (!shouldPersistResolvedRovoAppTitle({
				deletedThreadIds: deletedThreadIdsRef.current,
				threadId,
				threads: threadsRef.current,
			})) {
				clearPendingTitleGeneration(threadId);
				return;
			}

			const updatedAt = new Date().toISOString();
			setThreads((previousThreads) =>
				updateRovoAppThreadTitleRecord(
					previousThreads,
					{
						threadId,
						title: normalizedTitle,
						updatedAt,
					},
					{ deletedThreadIds: deletedThreadIdsRef.current },
				).threads,
			);

			void updateRovoAppThread(threadId, { title: normalizedTitle }).catch((error) => {
				if (isRovoAppThreadNotFoundError(error)) {
					deletedThreadIdsRef.current.add(threadId);
					setThreads((previousThreads) =>
						previousThreads.filter((thread) => thread.id !== threadId),
					);
					return;
				}

				console.warn("[RovoApp] Failed to persist generated chat title:", error);
			});
			clearPendingTitleGeneration(threadId);
		},
		[clearPendingTitleGeneration],
	);

	const selectDocumentForDisplay = useCallback((document: RovoAppDocument) => {
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
		return getRovoAppBackgroundRefreshThreadIds({
			activeThreadId,
			threads,
		});
	}, [activeThreadId, threads]);
	const backgroundRefreshThreadIdsKey = useMemo(() => {
		return JSON.stringify(backgroundRefreshThreadIds);
	}, [backgroundRefreshThreadIds]);
	const reconcileThreadWithLocalTitle = useCallback((thread: RovoAppThread) => {
		return mergeRovoAppThreadWithLocalTitle(threadsRef.current, thread);
	}, []);
	const activeDocumentContent = useMemo(() => {
		return getLatestDocumentContent(activeDocument);
	}, [activeDocument]);
	const smartGenerationRequest = useMemo(() => {
		return {
			enabled: true,
			surface: embedded ? "rovo-app-preview" : "rovo-app",
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
	const attemptedPlanMetadataMessageIdsRef = useRef<Set<string>>(new Set());
	const isHydratingThreadRef = useRef(false);
	const activeThreadIdRef = useRef<string | null>(initialThreadId);
	const activeDocumentRef = useLatestRef(activeDocument);
	const streamingArtifactRef = useLatestRef(streamingArtifact);
	const queuedStreamingArtifactDeltaRef = useRef("");
	const queuedStreamingArtifactKindRef = useRef<RovoAppDocumentKind | null>(null);
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
	const lastSyncedAgentModeRef = useRef<"default" | "plan" | null>(null);
	const syncAgentModeForDispatch = useCallback(
		async (mode: "default" | "plan") => {
			if (lastSyncedAgentModeRef.current === mode) {
				return;
			}

			const result = await syncRovoAppAgentModeForDispatch(fetch, mode);
			if (result.applied) {
				lastSyncedAgentModeRef.current = mode;
			}
		},
		[],
	);

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
		lastSyncedAgentModeRef.current = null;
	}, [activeThreadId]);

	const setLocalThreadActiveRun = useCallback(
		(threadId: string, activeRun: RovoAppActiveRun | null) => {
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
		(threadId: string, status: RovoAppRunStatus = "streaming") => {
			const now = new Date().toISOString();
			resetObservedTurnComplete();
			setLocalThreadActiveRun(threadId, {
				id: `rovo-app-run-local-${threadId}`,
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
			appendRovoAppStreamingArtifactDelta({
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
		(delta: string, kind?: RovoAppDocumentKind) => {
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
				api: API_ENDPOINTS.ROVO_APP_CHAT,
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
						getLatestVisibleRovoAppUserPrompt(messages);
					const hasPendingStructuredContinuation =
						hasPendingRovoAppStructuredContinuation(messages);
					const isVoiceTurn =
						body?.origin === "voice" || isVoiceModeRef.current;
					const hasStructuredTurnBody = Boolean(
						body?.clarification
						|| body?.deferredToolResponse
						|| body?.approval
						|| body?.toolApproval
					);
					const turnMode = classifyRovoAppTurnMode({
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

		void updateRovoAppThread(threadId, {
			activeDocumentId: documentId,
		})
			.then((thread) => {
				const resolvedThread = reconcileThreadWithLocalTitle(thread);
				setThreads((previousThreads) =>
					upsertRovoAppThreadRecord(previousThreads, resolvedThread, {
						deletedThreadIds: deletedThreadIdsRef.current,
					}),
				);
			})
			.catch((error) => {
				console.warn(
					"[RovoApp] Failed to persist active artifact selection:",
					toRovoAppUserErrorMessage(error),
				);
			});
	}, [reconcileThreadWithLocalTitle]);

	const saveStreamingArtifactCheckpoint = useCallback(async () => {
		const checkpoint = getRovoAppStreamingArtifactCheckpoint(streamingArtifactRef.current);
		if (!checkpoint) {
			return null;
		}

		const document = await saveRovoAppDocument({
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
				document = await getRovoAppDocument(documentId);
				if (document) {
					break;
				}

				await waitForRovoApp(150 * (attempt + 1));
			}

			if (!document) {
				clearArtifactState();
				return null;
			}

			// Skip display update if the thread was rehydrated while we were fetching
			if (isHydratingThreadRef.current) {
				return document;
			}

			selectDocumentForDisplay(document);
			return document;
		} catch (error) {
			if (isRovoAppBackendUnavailableError(error)) {
				setInputError(getRovoAppBackendUnavailableUserMessage());
				return null;
			}

			console.error("[RovoApp] Failed to hydrate streamed artifact:", error);
			return null;
		}
	}, [clearArtifactState, selectDocumentForDisplay]);

	const handleRovoAppDataPart = useCallback(
		(dataPart: { data: unknown; type: string }) => {
			const updateArtifact = (
				patch: Partial<RovoAppStreamingArtifact>,
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
				patch: Partial<RovoAppPendingArtifactResult>,
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
						kind: RovoAppDocumentKind;
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
				persistActiveDocumentSelection,
				queueStreamingArtifactDelta,
				setLocalThreadActiveRun,
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
		onData: handleRovoAppDataPart,
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
			setInputError(toRovoAppUserErrorMessage(error));
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

			handleRovoAppDataPart({
				type: chunk.type,
				data: chunk.data,
			});
		},
		[attachedRunStatus, handleRovoAppDataPart],
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
	const latestSourcedPlanWidget = useMemo(() => {
		return getLatestSourcedPlanWidget(normalizedRovodevMessages);
	}, [normalizedRovodevMessages]);
	const persistPlanWidgetMetadata = useCallback(
		(options: {
			threadId: string;
			messages: ReadonlyArray<RovoUIMessage>;
			sourceMessageId?: string | null;
			title?: string;
			shortDescription?: string;
		}) => {
			const sourceMessageId = options.sourceMessageId ?? null;
			const normalizedTitle = options.title ? trimTitleText(options.title) : undefined;
			const normalizedShortDescription = options.shortDescription ? trimTitleText(options.shortDescription) : undefined;
			if (!normalizedTitle && !normalizedShortDescription) {
				clearPendingPlanMetadataGeneration(sourceMessageId);
				return;
			}
			if (!shouldPersistResolvedRovoAppTitle({
				deletedThreadIds: deletedThreadIdsRef.current,
				threadId: options.threadId,
				threads: threadsRef.current,
			})) {
				clearPendingPlanMetadataGeneration(sourceMessageId);
				return;
			}

			const updatedMessages = updatePlanWidgetMetadataInMessages(
				options.messages,
				{
					sourceMessageId,
					title: normalizedTitle,
					shortDescription: normalizedShortDescription,
				},
			);
			if (areRovoAppMessagesEqual(updatedMessages, options.messages)) {
				clearPendingPlanMetadataGeneration(sourceMessageId);
				return;
			}

			const updatedAt = new Date().toISOString();
			setThreads((previousThreads) =>
				updateRovoAppThreadMessagesRecord(
					previousThreads,
					{
						threadId: options.threadId,
						messages: updatedMessages,
						updatedAt,
					},
					{ deletedThreadIds: deletedThreadIdsRef.current },
				).threads,
			);

			if (activeThreadIdRef.current === options.threadId) {
				setRovodevMessages(updatedMessages);
			}
			clearPendingPlanMetadataGeneration(sourceMessageId);

			void updateRovoAppThread(options.threadId, {
				messages: updatedMessages,
			})
				.then((thread) => {
					const resolvedThread = reconcileThreadWithLocalTitle(thread);
						const persistedKey = buildRovoAppThreadPersistKey({
							messages: resolvedThread.messages,
							realtimeMessages: resolvedThread.realtimeMessages ?? [],
							visibility: resolvedThread.visibility,
							activeDocumentId: resolvedThread.activeDocumentId,
							hermesContext: resolvedThread.hermesContext ?? null,
							title: resolvedThread.title,
						});
					lastPersistedKeyRef.current = persistedKey;
					setThreads((previousThreads) =>
						upsertRovoAppThreadRecord(previousThreads, resolvedThread, {
							deletedThreadIds: deletedThreadIdsRef.current,
						}),
					);
					if (
						activeThreadIdRef.current === options.threadId
						&& !areRovoAppMessagesEqual(resolvedThread.messages, updatedMessages)
					) {
						beginThreadHydration();
						setRovodevMessages(resolvedThread.messages);
						window.setTimeout(() => {
							completeThreadHydration();
						}, 0);
					}
				})
				.catch((error) => {
					if (isRovoAppThreadNotFoundError(error)) {
						deletedThreadIdsRef.current.add(options.threadId);
						setThreads((previousThreads) =>
							previousThreads.filter((thread) => thread.id !== options.threadId),
						);
						return;
					}

					console.warn("[RovoApp] Failed to persist plan widget metadata:", error);
				});
		},
		[
			beginThreadHydration,
			clearPendingPlanMetadataGeneration,
			completeThreadHydration,
			reconcileThreadWithLocalTitle,
			setRovodevMessages,
		],
	);

	const messages = useMemo(() => {
		return mergeRovoAppMessages({
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

		return getLatestRovoAppThinkingStatusLabel([backgroundDelegationMessage]);
	}, [backgroundDelegationMessageId, messages]);
	const resolvedPlanExecutionTracker = useMemo(() => {
		return resolveRovoAppPlanExecutionTracker({
			activeRun: currentThread?.activeRun ?? null,
			messages,
			threadId: activeThreadId,
			threadUpdatedAt: currentThread?.updatedAt ?? null,
		});
	}, [activeThreadId, currentThread?.activeRun, currentThread?.updatedAt, messages]);
	const planExecutionTracker = useMemo(() => {
		if (!activeThreadId || !resolvedPlanExecutionTracker) {
			return null;
		}

		const dismissKey = buildRovoAppPlanExecutionDismissKey(
			activeThreadId,
			resolvedPlanExecutionTracker.planKey,
		);
		return dismissedPlanExecutionTrackerKeys.has(dismissKey)
			? null
			: resolvedPlanExecutionTracker;
	}, [
		activeThreadId,
		dismissedPlanExecutionTrackerKeys,
		resolvedPlanExecutionTracker,
	]);
	const dismissPlanExecutionTracker = useCallback(() => {
		if (!activeThreadId || !resolvedPlanExecutionTracker) {
			return;
		}

		const dismissKey = buildRovoAppPlanExecutionDismissKey(
			activeThreadId,
			resolvedPlanExecutionTracker.planKey,
		);
		setDismissedPlanExecutionTrackerKeys((previousKeys) => {
			const nextKeys = new Set(previousKeys);
			nextKeys.add(dismissKey);
			return nextKeys;
		});
	}, [activeThreadId, resolvedPlanExecutionTracker]);
	const activeRunStatus = currentThread?.activeRun?.status ?? null;
	const isAttachedActiveRun =
		activeThreadId !== null && runSubscriptionThreadIdRef.current === activeThreadId;
	const composerState = useMemo(() => {
		return resolveRovoAppComposerSubmitState({
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
	const flushPendingRouteReplacement = useCallback(
		(nextActiveThreadId: string | null = activeThreadIdRef.current) => {
			if (!nextActiveThreadId) {
				return false;
			}

			if (!shouldReplacePendingRovoAppRoute({
				activeThreadId: nextActiveThreadId,
				embedded,
				hasPersistedThreadState: pendingRouteReadyRef.current,
				isStreaming,
				isVoiceMode,
				pendingThreadId: pendingRouteThreadIdRef.current,
			})) {
				return false;
			}

			pendingRouteThreadIdRef.current = null;
			pendingRouteReadyRef.current = false;
			replaceRovoAppHistoryPath(buildRovoAppThreadPath(nextActiveThreadId));
			return true;
		},
		[embedded, isStreaming, isVoiceMode],
	);
	const isThreadBusy = useMemo(() => {
		return isRovoAppThreadBusy({
			activeRunStatus,
			attachedRunStatus,
			status,
		});
	}, [activeRunStatus, attachedRunStatus, status]);
	const shouldQueueNextSubmission = useMemo(() => {
		return hasActiveDispatch || isThreadBusy || queuedPrompts.length > 0;
	}, [hasActiveDispatch, isThreadBusy, queuedPrompts.length]);
	const shouldSuppressLatestAssistantSuggestions = useMemo(() => {
		return hasQueuedRovoAppFollowUp({
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

		// Stream just finished — check whether this request produced a new
		// plan/question card, not whether the thread has any historical one.
		const {
			hasGeneratedPlan,
			isAwaitingClarificationAnswers,
			latestAssistantMessage,
		} = getRovoAppPlanningArtifactsSinceBaseline(
			normalizedRovodevMessages,
			planningSession.baselineAssistantMessageId,
		);

		if (hasGeneratedPlan) {
			queueMicrotask(() => {
				setPlanningSession(null);
			});
			return;
		}

		if (isAwaitingClarificationAnswers) {
			return;
		}

		if (shouldSuppressRovoAppPlanRetry(latestAssistantMessage)) {
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
					baselineAssistantMessageId:
						getLatestRovoAppAssistantMessageId(
							rovodevMessagesRef.current,
						),
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
				await syncAgentModeForDispatch("plan");
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
	}, [
		isStreaming,
		normalizedRovodevMessages,
		planningSession,
		syncAgentModeForDispatch,
		threads,
	]);

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

	// Generate title via AI Gateway immediately after the thread is created.
	// This bypasses RovoDev Serve and preserves the original fast title flow.
	useEffect(() => {
		const pendingTitleRequest = getPendingRovoAppTitleRequest({
			pendingTitleThreadId,
			pendingTitleThreadIdRef: pendingTitleThreadIdRef.current,
			pendingTitleMessage: pendingTitleMessageRef.current,
		});
		if (!pendingTitleRequest) {
			return;
		}

		const { threadId, message } = pendingTitleRequest;
		pendingTitleMessageRef.current = null;

		void fetchRovoAppAITitle(message).then((aiTitle) => {
			if (aiTitle) {
				resolveChatTitle(threadId, aiTitle);
				return;
			}

			if (resolveFallbackTitle()) {
				return;
			}

			clearPendingTitleGeneration(threadId);
		});
	}, [clearPendingTitleGeneration, pendingTitleThreadId, resolveChatTitle, resolveFallbackTitle]);

	useEffect(() => {
		const threadId = activeThreadId;
		const sourceMessageId = latestSourcedPlanWidget?.sourceMessageId ?? null;
		const planWidget = latestSourcedPlanWidget?.planWidget ?? null;
		if (!threadId || isLoadingThread || isStreaming || isHydratingThreadRef.current) {
			return;
		}
		if (!sourceMessageId || !planWidget) {
			return;
		}
		if (planWidget.shortDescription?.trim() && !isGenericPlanTitle(planWidget.title)) {
			return;
		}
		if (attemptedPlanMetadataMessageIdsRef.current.has(sourceMessageId)) {
			return;
		}

		const enrichDelay = window.setTimeout(() => {
			attemptedPlanMetadataMessageIdsRef.current.add(sourceMessageId);
			setPlanMetadataPendingState(sourceMessageId, true);
			void fetchEnrichedPlanTitle(planWidget).then((result) => {
				if (!result) {
					clearPendingPlanMetadataGeneration(sourceMessageId);
					return;
				}

				persistPlanWidgetMetadata({
					threadId,
					messages: rovodevMessagesRef.current,
					sourceMessageId,
					title: result.title,
					shortDescription: result.shortDescription,
				});
			});
		}, 2000);

		return () => {
			window.clearTimeout(enrichDelay);
		};
	}, [
		activeThreadId,
		clearPendingPlanMetadataGeneration,
		isLoadingThread,
		isStreaming,
		latestSourcedPlanWidget,
		persistPlanWidgetMetadata,
		setPlanMetadataPendingState,
		threadHydrationVersion,
	]);

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
		void fetchRovoAppSuggestedQuestions({
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
				if (isRovoAppBackendUnavailableError(error)) {
					return;
				}

				console.warn(
					"[RovoApp] Failed to fetch suggested questions:",
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
				void saveRovoAppDocument({
					documentId,
					sourceMessageId: lastMessage.id,
				}).then((updatedDocument) => {
					setDocuments((prev) => upsertDocumentRecord(prev, updatedDocument));
				}).catch((error) => {
					console.warn("[RovoApp] Failed to persist sourceMessageId:", error);
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
		if (isHydratingThreadRef.current) {
			return;
		}

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
		if (isHydratingThreadRef.current) {
			return;
		}

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
			const nextThreads = await listRovoAppThreads();
			const resolvedThreads = nextThreads.map((thread) =>
				reconcileThreadWithLocalTitle(thread),
			);
			setThreads(
				filterDeletedRovoAppThreads(
					resolvedThreads,
					deletedThreadIdsRef.current,
				),
			);
			setInputError((previousError) =>
				previousError === getRovoAppBackendUnavailableUserMessage()
					? null
					: previousError,
			);
			setThreadsLoaded(true);
		} catch (error) {
			if (isRovoAppBackendUnavailableError(error)) {
				setThreads([]);
				setInputError(getRovoAppBackendUnavailableUserMessage());
				setThreadsLoaded(true);
				return;
			}

			console.error("[RovoApp] Failed to refresh threads:", error);
		}
	}, [reconcileThreadWithLocalTitle]);

	const hydrateThreadState = useCallback(
		(thread: RovoAppThread, nextDocuments: RovoAppDocument[], nextVotes: RovoAppVote[]) => {
			beginThreadHydration();
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
				const persistedKey = buildRovoAppThreadPersistKey({
					messages: thread.messages,
					realtimeMessages: thread.realtimeMessages ?? [],
					visibility: thread.visibility,
					activeDocumentId: thread.activeDocumentId,
					hermesContext: thread.hermesContext ?? null,
					title: thread.title,
				});
			lastPersistedKeyRef.current = persistedKey;
			clearPendingPlanMetadataGeneration();
			pendingRouteThreadIdRef.current = null;
			pendingRouteReadyRef.current = false;
			window.setTimeout(() => {
				completeThreadHydration();
			}, 0);
		},
		[
			beginThreadHydration,
			clearDirectDelegationState,
			clearPendingPlanMetadataGeneration,
			clearStreamingArtifactState,
			completeThreadHydration,
			replaceRealtimeMessagesState,
			resetObservedTurnComplete,
			resetPendingArtifactAssociation,
			setRovodevMessages,
		],
	);

	const hydrateThreadById = useCallback(
		async (threadId: string) => {
			const [thread, nextDocuments, nextVotes] = await Promise.all([
				getRovoAppThread(threadId),
				listRovoAppDocuments(threadId),
				listRovoAppVotes(threadId),
			]);
			if (thread) {
				const resolvedThread = reconcileThreadWithLocalTitle(thread);
				hydrateThreadState(resolvedThread, nextDocuments, nextVotes);
				setThreads((previousThreads) =>
					upsertRovoAppThreadRecord(previousThreads, resolvedThread, {
						deletedThreadIds: deletedThreadIdsRef.current,
					}),
				);
			}
		},
		[hydrateThreadState, reconcileThreadWithLocalTitle],
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

	const subscribeToRovoAppRun = useCallback(
		async (
			threadId: string,
			activeRun: RovoAppActiveRun | null,
		) => {
			runSubscriptionAbortControllerRef.current?.abort();
			const abortController = new AbortController();
			runSubscriptionAbortControllerRef.current = abortController;
			runSubscriptionThreadIdRef.current = threadId;
			setAttachedRunStatus(activeRun?.status === "queued" ? "queued" : "streaming");

			try {
				const response = await fetch(API_ENDPOINTS.rovoAppRunStream(threadId), {
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
						(await response.text().catch(() => "")) || "Failed to attach Rovo App run.",
					);
				}

				for await (const streamedMessage of readRovoAppDelegationResponseStream({
					stream: response.body,
					onChunk: handleAttachedRunChunk,
					onError: (error) => {
						console.error("[RovoApp] Failed to read attached run stream:", error);
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
				if (isRovoAppDelegationAbortError(error) || abortController.signal.aborted) {
					return;
				}

				setInputError(toRovoAppUserErrorMessage(error));
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
		beginThreadHydration();
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
		clearPendingPlanMetadataGeneration();
			lastPersistedKeyRef.current = buildRovoAppThreadPersistKey({
				messages: [],
				realtimeMessages: [],
				visibility: "private",
				activeDocumentId: null,
				hermesContext: null,
				title: "New chat",
			});
		pendingRouteThreadIdRef.current = null;
		pendingRouteReadyRef.current = false;
		window.setTimeout(() => {
			completeThreadHydration();
		}, 0);
	}, [beginThreadHydration, clearArtifactState, clearDirectDelegationState, clearPendingPlanMetadataGeneration, clearStreamingArtifactState, completeThreadHydration, replaceRealtimeMessagesState, resetObservedTurnComplete, resetPendingArtifactAssociation, setRovodevMessages]);

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

		const transitionPlan = buildRovoAppActiveThreadTransitionPlan({
			activeDocumentId,
			isStreaming: hasActiveTurn,
			messages: rovodevMessagesRef.current,
			realtimeMessages: realtimeMessagesRef.current,
			threadId,
			visibility: threadVisibility,
		});

		if (transitionPlan.shouldDetachStream && transitionPlan.threadId) {
			const detachThreadId = transitionPlan.threadId;
			await detachRovoAppRun(detachThreadId)
				.catch(() => detachRovoAppStream(detachThreadId).catch(() => false));
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
			void updateRovoAppThread(
				transitionPlan.persistence.threadId,
				transitionPlan.persistence.input,
			).catch((error) => {
				console.warn(
					"[RovoApp] Failed to persist the active thread before switching views:",
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
						id: `rovo-app-run-local-${transitionPlan.threadId}`,
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
				shouldSkipRovoAppThreadLoad({
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
					getRovoAppThread(threadId),
					listRovoAppDocuments(threadId),
					listRovoAppVotes(threadId),
				]);
				if (!thread) {
					const nextDraftId = createRovoAppId();
					resetToBlankChatState(nextDraftId);
					if (!embedded) {
						startTransition(() => {
							router.replace(ROVO_APP_ROOT_PATH);
						});
					}
					return;
				}
				if (deletedThreadIdsRef.current.has(thread.id)) {
					return;
				}

				const referencedDocumentIds = getRovoAppArtifactDocumentIdsFromMessages([
					...thread.messages,
					...(thread.realtimeMessages ?? []),
				]);
				const missingDocumentIds = referencedDocumentIds.filter(
					(documentId) => !nextDocuments.some((document) => document.id === documentId),
				);
				const recoveredDocuments = (
					await Promise.all(missingDocumentIds.map((documentId) => getRovoAppDocument(documentId)))
				).filter((document): document is RovoAppDocument => Boolean(document));
				const hydratedDocuments = recoveredDocuments.reduce(
					(previousDocuments, document) => upsertDocumentRecord(previousDocuments, document),
					nextDocuments,
				);

				const resolvedThread = reconcileThreadWithLocalTitle(thread);
				hydrateThreadState(resolvedThread, hydratedDocuments, nextVotes);
				setThreads((previousThreads) =>
					upsertRovoAppThreadRecord(previousThreads, resolvedThread, {
						deletedThreadIds: deletedThreadIdsRef.current,
					}),
				);
				if (resolvedThread.activeRun) {
					void subscribeToRovoAppRun(resolvedThread.id, resolvedThread.activeRun);
				} else {
					runSubscriptionAbortControllerRef.current?.abort();
					runSubscriptionAbortControllerRef.current = null;
					runSubscriptionThreadIdRef.current = null;
					setAttachedRunStatus(null);
				}
			} catch (error) {
				setInputError(toRovoAppUserErrorMessage(error));
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
			reconcileThreadWithLocalTitle,
			subscribeToRovoAppRun,
		],
	);
	const loadThreadRef = useLatestRef(loadThread);

	useEffect(() => {
		void refreshThreads();
	}, [refreshThreads]);

	useEffect(() => {
		const handleFocus = () => {
			void refreshThreads();
		};
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void refreshThreads();
			}
		};
		const intervalId = window.setInterval(() => {
			if (document.visibilityState === "visible") {
				void refreshThreads();
			}
		}, 3000);

		window.addEventListener("focus", handleFocus);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.clearInterval(intervalId);
			window.removeEventListener("focus", handleFocus);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [refreshThreads]);

	useEffect(() => {
		if (!initialThreadId) {
			lastLoadedInitialThreadIdRef.current = null;
			return;
		}

		if (
			!shouldLoadInitialRovoAppThread({
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
		if (!activeDocument) {
			return;
		}

		setArtifactDraftContent((prev) =>
			prev !== activeDocumentContent ? activeDocumentContent : prev,
		);
		setSelectedVersionId((prev) => {
			const nextId = activeDocument.versions.at(-1)?.id ?? null;
			return prev !== nextId ? nextId : prev;
		});
	}, [activeDocument, activeDocumentContent]);

	const activateBlankChatState = useCallback(
		async ({
			syncHistory = true,
		}: {
			syncHistory?: boolean;
		} = {}) => {
			await leaveActiveThreadForBackground();

			const nextDraftId = createRovoAppId();
			resetToBlankChatState(nextDraftId);
			if (!embedded && syncHistory) {
				pushRovoAppHistoryPath(ROVO_APP_ROOT_PATH);
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
			const threadId = getRovoAppThreadIdFromPath(window.location.pathname);
			if (threadId) {
				void loadThread(threadId);
				return;
			}

			if (
				window.location.pathname === ROVO_APP_ROOT_PATH
				|| window.location.pathname === `${ROVO_APP_ROOT_PATH}/`
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

				const threadCreationPromise = createRovoAppThread({
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
						upsertRovoAppThreadRecord(previousThreads, nextThread, {
							deletedThreadIds: deletedThreadIdsRef.current,
						}),
					);
						lastPersistedKeyRef.current = buildRovoAppThreadPersistKey({
							messages: nextThread.messages,
							realtimeMessages: nextThread.realtimeMessages ?? [],
							visibility: nextThread.visibility,
							activeDocumentId: nextThread.activeDocumentId,
							hermesContext: nextThread.hermesContext ?? null,
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
			const messageId = createId("rovo-app-user");
			const message = createRovoAppUserMessage({
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
			await waitForRovoApp(25);
		}
	}, [setLocalThreadActiveRun, stopUseChat, useChatStatus]);

	const sendPlanReviewResult = useCallback(
		async ({
			isPlanMode,
			messageMetadata,
			planWidget,
			result,
			userMessageText,
			approval,
		}: {
			isPlanMode: boolean;
			messageMetadata?: RovoUIMessage["metadata"];
			planWidget: ParsedPlanWidgetPayload;
			result: string;
			userMessageText: string;
			approval?: PlanApprovalSubmission;
		}) => {
			// When approval is provided, route through the resume_tool_calls
			// backend path instead of the deferredToolResponse path.
			const deferredToolResponse = approval
				? null
				: buildExitPlanModeDeferredToolResponse(planWidget, result);
			if (!deferredToolResponse && !approval) {
				throw new Error("The pending plan review is missing a deferred tool call.");
			}

			await releaseCompletedUseChatTurnIfNeeded();
			await waitForChatSendSettled({
				statusRef: useChatStatusRef,
				lastBusyAtRef: lastUseChatBusyAtRef,
			});

			const threadId = await ensureThread(userMessageText || "Plan review");
			await syncAgentModeForDispatch(isPlanMode ? "plan" : "default");
			const { message, messageId } = appendLocalUserMessage({
				files: [],
				metadata: messageMetadata,
				text: userMessageText,
			});
			setDismissedPlanExecutionTrackerKeys((previousKeys) =>
				clearRovoAppPlanExecutionDismissalsForThread(previousKeys, threadId),
			);
			resetPendingArtifactAssociation();
			if (isPlanMode) {
				planModeSyncRequestIdRef.current += 1;
				setPlanningSession({
					requestId: planModeSyncRequestIdRef.current,
					phase: "awaiting-plan",
					hasStreamStarted: false,
					retryUsed: false,
					baselineAssistantMessageId:
						getLatestRovoAppAssistantMessageId(
							rovodevMessagesRef.current,
						),
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
						...(deferredToolResponse ? { deferredToolResponse } : {}),
						...(approval ? { approval } : {}),
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
			syncAgentModeForDispatch,
		],
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
						"[RovoApp] Failed to stop UI stream before submitting tool approval:",
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
				hermesContext,
				messageMetadata,
				mode,
			}: {
				text: string;
				files: FileUIPart[];
				contextDescription?: string;
				hermesContext?: RovoAppHermesContext;
				messageMetadata?: RovoUIMessage["metadata"];
				mode: RovoAppPromptMode;
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
				setDismissedPlanExecutionTrackerKeys((previousKeys) =>
					clearRovoAppPlanExecutionDismissalsForThread(previousKeys, threadId),
				);
				await syncAgentModeForDispatch(mode);
				const { message, messageId } = appendLocalUserMessage({
					files,
					metadata: buildPromptModeMetadata(messageMetadata, mode),
					text: trimmedText,
				});
				markLocalThreadRunPending(threadId);
				resetPendingArtifactAssociation();
				if (mode === "plan") {
					planModeSyncRequestIdRef.current += 1;
					setPlanningSession({
						requestId: planModeSyncRequestIdRef.current,
						phase: "awaiting-plan",
						hasStreamStarted: false,
						retryUsed: false,
						baselineAssistantMessageId:
							getLatestRovoAppAssistantMessageId(
								rovodevMessagesRef.current,
							),
					});
				} else {
					setPlanningSession(null);
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
								hermesContext,
								isPlanMode: mode === "plan",
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
				setInputError(toRovoAppUserErrorMessage(error));
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
				stopUseChat,
				streamingArtifact,
				streamingArtifactRef,
				syncAgentModeForDispatch,
				useChatStatus,
			],
		);

	const enqueuePromptAction = useCallback(
			({
				contextDescription,
				hermesContext,
				files,
				messageMetadata,
				mode,
				text,
				threadId,
			}: {
				contextDescription?: string;
				hermesContext?: RovoAppHermesContext;
				files: ReadonlyArray<FileUIPart>;
				messageMetadata?: RovoUIMessage["metadata"];
				mode: RovoAppPromptMode;
			text: string;
			threadId: string;
		}) => {
			const queuedAction: RovoAppQueuedPromptAction = {
				id: createRovoAppQueueItemId(),
				threadId,
				text,
				createdAt: Date.now(),
					kind: "prompt",
					files: [...files],
					contextDescription,
					hermesContext,
					messageMetadata,
					mode,
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
				hermesContext,
			}: {
				text: string;
				files: FileUIPart[];
				contextDescription?: string;
				hermesContext?: RovoAppHermesContext;
			}) => {
			setInputError(null);
			const trimmedText = text.trim();
			if (!trimmedText && files.length === 0) {
				return;
			}
			const promptMode: RovoAppPromptMode =
				isPlanModeRef.current ? "plan" : "default";
			const promptMessageMetadata = buildPromptModeMetadata(
				undefined,
				promptMode,
			);

			const resolvedThreadId = activeThreadIdRef.current ?? draftThreadId;
			const shouldEnqueue =
				queueProcessorRunningRef.current ||
				isRovoAppThreadBusy({
					activeRunStatus: currentThread?.activeRun?.status ?? null,
					attachedRunStatus,
					status: statusRef.current,
				}) ||
				(queuedActionsByThreadId[resolvedThreadId]?.length ?? 0) > 0;

			if (shouldEnqueue) {
					enqueuePromptAction({
						contextDescription,
						hermesContext,
						files,
						messageMetadata: promptMessageMetadata,
					mode: promptMode,
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
					hermesContext,
					messageMetadata: promptMessageMetadata,
					mode: promptMode,
				});
		},
		[
			attachedRunStatus,
			currentThread?.activeRun?.status,
			dispatchPromptNow,
			draftThreadId,
			enqueuePromptAction,
			isPlanModeRef,
			kickQueue,
			queuedActionsByThreadId,
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
			// flow).
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
					status: "answered",
					toolCallId: deferredToolCallId ?? submission.toolCallId,
					deferredToolCallId: deferredToolCallId ?? submission.deferredToolCallId,
				},
				deferredToolResponse: deferredToolResponse ?? undefined,
			};

			markLocalThreadRunPending(threadId);
			if (wasPlanModeActive) {
				await syncAgentModeForDispatch("plan");
				setPlanningSession((prev) =>
					prev
						? {
							...prev,
							phase: "awaiting-plan",
							hasStreamStarted: false,
							baselineAssistantMessageId:
								getLatestRovoAppAssistantMessageId(
									rovodevMessagesRef.current,
								),
						}
						: {
							requestId: planModeSyncRequestIdRef.current,
							phase: "awaiting-plan",
							hasStreamStarted: false,
							retryUsed: false,
							baselineAssistantMessageId:
								getLatestRovoAppAssistantMessageId(
									rovodevMessagesRef.current,
								),
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
			syncAgentModeForDispatch,
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
			const threadId = await ensureThread(dismissPrompt || "Dismissed clarification");
			const { message, messageId } = appendLocalUserMessage({
				files: [],
				metadata: buildClarificationMessageMetadata(questionCard, {
					status: "dismissed",
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

	/**
	 * Dismiss a deferred-tool-backed clarification by resuming the paused tool
	 * call with an explicit dismissal result instead of cancelling the session.
	 * This mirrors {@link submitClarification} but with empty answers and
	 * dismissal semantics so the paused tool receives a concrete "wait for the
	 * user's next instructions" response.
	 */
	const submitDeferredClarificationDismiss = useCallback(
		async (questionCard: ParsedQuestionCardPayload) => {
			const emptyAnswers: ClarificationAnswers = {};
			const submission = createClarificationSubmission(questionCard, emptyAnswers);
			const wasPlanModeActive =
				isPlanModeRef.current || Boolean(questionCard.deferredToolCallId);
			const dismissPrompt = buildClarificationDismissPrompt(questionCard);

			hasObservedTurnCompleteRef.current = true;
			setRovodevMessages((previousMessages) => {
				const resolved = markClarificationToolResolved(
					previousMessages,
					"Clarification dismissed.",
				);
				return appendTurnCompleteToLastAssistantMessage(resolved).messages;
			});
			await releaseCompletedUseChatTurnIfNeeded();
			await waitForChatSendSettled({
				statusRef: useChatStatusRef,
				lastBusyAtRef: lastUseChatBusyAtRef,
			});
			const threadId = await ensureThread(dismissPrompt || "Dismissed clarification");
			const { message, messageId } = appendLocalUserMessage({
				files: [],
				metadata: buildClarificationMessageMetadata(questionCard, {
					status: "dismissed",
				}),
				text: dismissPrompt,
			});
			resetPendingArtifactAssociation();

			const deferredToolCallId = questionCard.deferredToolCallId;
			const toolCallId =
				deferredToolCallId ?? questionCard.toolCallId ?? submission.toolCallId;
			const body: Record<string, unknown> = {
				id: threadId,
				isPlanMode: wasPlanModeActive || undefined,
				contextDescription: wasPlanModeActive
					? PLAN_MODE_POST_CLARIFICATION_CONTEXT
					: undefined,
				clarification: {
					...submission,
					status: "dismissed",
					toolCallId: deferredToolCallId ?? submission.toolCallId,
					deferredToolCallId: deferredToolCallId ?? submission.deferredToolCallId,
				},
				deferredToolResponse: toolCallId
					? {
						tool_call_id: toolCallId,
						result: dismissPrompt,
					}
					: undefined,
			};

			markLocalThreadRunPending(threadId);
			if (wasPlanModeActive) {
				await syncAgentModeForDispatch("plan");
				setPlanningSession((prev) =>
					prev
						? {
							...prev,
							phase: "awaiting-plan",
							hasStreamStarted: false,
							baselineAssistantMessageId:
								getLatestRovoAppAssistantMessageId(
									rovodevMessagesRef.current,
								),
						}
						: {
							requestId: planModeSyncRequestIdRef.current,
							phase: "awaiting-plan",
							hasStreamStarted: false,
							retryUsed: false,
							baselineAssistantMessageId:
								getLatestRovoAppAssistantMessageId(
									rovodevMessagesRef.current,
								),
						},
				);
			}
			await sendMessage(
				{
					text: dismissPrompt,
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
			syncAgentModeForDispatch,
		],
	);

	const cancelClarificationQuestionSet = useCallback(
		async (questionCard: ParsedQuestionCardPayload) => {
			const toolCallId =
				questionCard.deferredToolCallId ?? questionCard.toolCallId ?? null;
			if (!toolCallId) {
				await submitClarificationDismiss(questionCard);
				return true;
			}

			// Resume the deferred tool call with an explicit dismiss result so the
			// paused ask_user_questions call resolves cleanly without implying the
			// user wants best-effort execution to continue.
			await submitDeferredClarificationDismiss(questionCard);
			return true;
		},
		[submitClarificationDismiss, submitDeferredClarificationDismiss],
	);

	const acceptPlanReview = useCallback(
		async (planWidget: ParsedPlanWidgetPayload) => {
			const planApprovalPlanKey =
				getPlanApprovalKeyFromPlanWidget(planWidget) ?? undefined;
			await sendPlanReviewResult({
				isPlanMode: false,
				messageMetadata: {
					source: "plan-approval-submit",
					planApprovalDecision: "auto-accept",
					planApprovalPlanKey,
				},
				planWidget,
				result: "Accept.",
				userMessageText: "Accepted the plan.",
			});
		},
		[sendPlanReviewResult],
	);

	const submitPlanApproval = useCallback(
		async (planWidget: ParsedPlanWidgetPayload, selection: PlanApprovalSelection) => {
			if (selection.decision === "auto-accept") {
				await acceptPlanReview(planWidget);
				return;
			}

			const approvalSubmission = createPlanApprovalSubmission(selection, planWidget);
			const planApprovalPlanKey =
				getPlanApprovalKeyFromPlanWidget(planWidget) ?? undefined;
			const userMessageText = buildPlanApprovalPrompt(approvalSubmission);
			const result =
				selection.decision === "custom" && selection.customInstruction?.trim()
					? selection.customInstruction.trim()
					: "Continue planning. Please revise the plan.";

			await sendPlanReviewResult({
				isPlanMode: true,
				messageMetadata: {
					source: "plan-approval-submit",
					planApprovalDecision: selection.decision,
					planApprovalPlanKey,
				},
				planWidget,
				result,
				userMessageText,
				approval: approvalSubmission,
			});
		},
		[acceptPlanReview, sendPlanReviewResult],
	);

	const togglePlanMode = useCallback(() => {
		setIsPlanMode((previousMode) => !previousMode);
	}, []);

	const resetPlanMode = useCallback(() => {
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
			const messageId = options?.messageId ?? createId("rovo-app-realtime");
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
			void upsertRovoAppRealtimeMessage({
				threadId,
				message:
					nextRealtimeMessages.find((existingMessage) => existingMessage.id === messageId)
					?? message,
			}).catch((error) => {
				console.warn("[RovoApp] Failed to persist realtime message:", error);
			});

			return messageId;
		},
			[ensureThread, mutateRealtimeMessagesState],
		);

		const upsertRealtimeSyntheticMessage = useCallback(
			async (message: RovoUIMessage) => {
				const threadId = await ensureThread(message.id || "hermes-context");
				const nextRealtimeMessages = mutateRealtimeMessagesState((previousMessages) =>
					upsertRealtimeMessage(previousMessages, message),
				);
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
				void upsertRovoAppRealtimeMessage({
					threadId,
					message:
						nextRealtimeMessages.find((existingMessage) => existingMessage.id === message.id)
						?? message,
				}).catch((error) => {
					console.warn("[RovoApp] Failed to persist synthetic realtime message:", error);
				});
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
					void upsertRovoAppRealtimeMessage({
						threadId,
						message: nextMessage,
					}).catch((error) => {
						console.warn("[RovoApp] Failed to persist realtime message:", error);
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
					hermesContext?: RovoAppHermesContext;
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
						await cancelRovoAppRun(activeThreadId).catch(() => false);
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
				const response = await fetch(API_ENDPOINTS.ROVO_APP_CHAT, {
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
							} satisfies RovoAppArtifactSteeringPayload)
							: undefined,
							contextDescription: options?.contextDescription,
							hermesContext: options?.hermesContext,
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
				for await (const streamedMessage of readRovoAppDelegationResponseStream({
					stream: response.body,
					onError: (error) => {
						console.error("[RovoApp] Failed to read delegated UI message stream:", error);
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
						void upsertRovoAppRealtimeMessage({
							threadId,
							message: normalizedMessage,
						}).catch((error) => {
							console.warn("[RovoApp] Failed to persist delegated realtime message:", error);
						});
						return upsertRealtimeMessage(previousMessages, normalizedMessage);
					});
					setBackgroundDelegationMessageId((currentId) => currentId ?? effectiveId);
				}
				clearDirectDelegationState();
			} catch (error) {
				if (
					abortController.signal.aborted
					|| isRovoAppDelegationAbortError(error)
				) {
					clearDirectDelegationState();
					return;
				}

				const errorMessage = toRovoAppUserErrorMessage(error);
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
					hermesContext?: RovoAppHermesContext;
					conversationSummary?: string;
				existingRealtimeMessageId?: string | null;
				intentType?: string;
				prompt: string;
				referencedFiles?: string[];
				threadId: string;
				urgency?: string;
			},
		) => {
			const queuedAction: RovoAppQueuedDelegationAction = {
				id: createRovoAppQueueItemId(),
				threadId: options.threadId,
				text: options.prompt,
				createdAt: Date.now(),
					kind: "delegation",
					contextDescription: options.contextDescription,
					hermesContext: options.hermesContext,
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
					isRovoAppThreadBusy({
						activeRunStatus: null,
						attachedRunStatus: attachedRunStatusRef.current,
						status: statusRef.current,
					})
				) {
					await waitForRovoApp(50);
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
					!canDispatchRovoAppQueuedAction({
						action: nextQueuedAction,
						hasPendingClarification:
							getLatestQuestionCardPayload(rovodevMessagesRef.current) !== null,
						hasPendingPlanApproval:
							getActivePendingPlanReview() !== null,
						hasPendingToolApproval: activeToolApproval !== null,
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
					prependQueuedAction(nextAction);
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
								hermesContext: nextAction.hermesContext,
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
								hermesContext: nextAction.hermesContext,
								messageMetadata: nextAction.messageMetadata,
								mode: nextAction.mode,
							});
					}
				} catch (error) {
					prependQueuedAction(nextAction);
					console.error("[RovoApp] Failed to dispatch queued action:", error);
					setInputError(toRovoAppUserErrorMessage(error));
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
		activeToolApproval,
		dispatchDelegationNow,
		dispatchPromptNow,
		getActivePendingPlanReview,
		peekNextQueuedActionForThread,
		prependQueuedAction,
		shiftNextQueuedActionForThread,
	]);

	processQueueRef.current = processQueue;



	const delegateToRovodev = useCallback(
		async (
				messageId: string,
				options?: {
					contextDescription?: string;
					hermesContext?: RovoAppHermesContext;
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
				isRovoAppThreadBusy({
					activeRunStatus: currentThread?.activeRun?.status ?? null,
					attachedRunStatus,
					status: statusRef.current,
				}) ||
				(queuedActionsByThreadId[resolvedThreadId]?.length ?? 0) > 0;

			if (shouldEnqueue) {
					enqueueDelegationAction(messageId, {
						contextDescription: options?.contextDescription,
						hermesContext: options?.hermesContext,
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
					const cancelled = await cancelRovoAppRun(activeThreadId).catch(() => false);
					if (cancelled) {
						queueProcessorRunningRef.current = false;
						setHasActiveDispatch(false);
						setLocalThreadActiveRun(activeThreadId, null);
						setAttachedRunStatus(null);
						return;
				}
			}

			await fetch(buildRovoAppCancelUrl(activeThreadIdRef.current), {
				method: "POST",
			});
			queueProcessorRunningRef.current = false;
			setHasActiveDispatch(false);
			if (activeThreadId) {
				setLocalThreadActiveRun(activeThreadId, null);
			}
			setAttachedRunStatus(null);
			} catch (error) {
				console.warn("[RovoApp] Explicit cancel request failed:", error);
			}
		}, [attachedRunStatus, currentThread?.activeRun, setLocalThreadActiveRun]);

	const cancelThreadRun = useCallback(
		async (threadId: string) => {
			try {
				const cancelled = await cancelRovoAppRun(threadId);
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
				setInputError(toRovoAppUserErrorMessage(error));
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
				const hasBackgroundCancelableWork =
					hasAttachedRun || directDelegationAbortController !== null;
				try {
					let stoppedInTime = true;
					if (hadActiveTurn && hasUseChatTurn) {
						await stopUseChat();
						stoppedInTime = await waitForActiveTurnToStop();
					}

					const shouldRequestExplicitCancel = hadActiveTurn
						? shouldSendExplicitRovoDevCancel({
								hasBackgroundCancelableWork,
								hasUseChatTurn,
								stopSettledInTime: stoppedInTime,
							})
						: hasBackgroundCancelableWork;

					if (shouldRequestExplicitCancel) {
						if (hadActiveTurn && hasUseChatTurn && !stoppedInTime) {
							console.warn(
								"[RovoApp] useChat turn did not stop within grace period; escalating to explicit cancel.",
							);
						}
						await requestExplicitCancel();
						if (hadActiveTurn) {
							stoppedInTime = await waitForActiveTurnToStop();
						}
					}

					if (hadActiveTurn || hasBackgroundCancelableWork) {
						runSubscriptionAbortControllerRef.current?.abort();
						runSubscriptionAbortControllerRef.current = null;
						runSubscriptionThreadIdRef.current = null;
						setAttachedRunStatus(null);
						directDelegationAbortController?.abort();
						clearDirectDelegationState();
						delegationAbortControllerRef.current = null;

						const threadIdForCleanup = activeThreadIdRef.current;
						if (threadIdForCleanup && hasAttachedRun) {
							setLocalThreadActiveRun(threadIdForCleanup, null);
						}
					}

					if (hadActiveTurn) {
						if (!stoppedInTime) {
							console.warn(
								"[RovoApp] Proceeding after cancel timeout while interrupting active turn.",
							);
						}
					}

					const interruptedAt = new Date().toISOString();
					let didMarkInterruptedReply = false;
					if (hasUseChatTurn || hasBackgroundCancelableWork) {
						setRovodevMessages((previousMessages) => {
							const result = markLastRovoAppAssistantMessageInterrupted(
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
							const result = markLastRovoAppAssistantMessageInterrupted(
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
					setInputError(toRovoAppUserErrorMessage(error));
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
			setLocalThreadActiveRun,
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
				hermesContext,
			}: {
				text: string;
				contextDescription?: string;
				hermesContext?: RovoAppHermesContext;
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
								hermesContext,
								origin: "voice" as const,
								artifactSteering: {
								preferCurrentArtifact: true,
								source: "voice",
							} satisfies RovoAppArtifactSteeringPayload,
							artifactContext: checkpointDocument
								? buildArtifactContextPayload(
									checkpointDocument,
									getLatestDocumentContent(checkpointDocument),
								)
								: undefined,
						},
					},
				).catch((error) => {
					setInputError(toRovoAppUserErrorMessage(error));
				});
			} catch (error) {
				setInputError(toRovoAppUserErrorMessage(error));
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
			clearPendingTitleGeneration(threadId);
			deletedThreadIdsRef.current.add(threadId);
			clearQueuedActionsForThread(threadId);
			setThreads((previousThreads) =>
				previousThreads.filter((thread) => thread.id !== threadId),
			);

			try {
				await deleteRovoAppThread(threadId);
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
				setInputError(toRovoAppUserErrorMessage(error));
			}
		},
		[clearPendingTitleGeneration, clearQueuedActionsForThread, openNewChat, refreshThreads],
	);

	const deleteAllThreads = useCallback(async () => {
		clearPendingTitleGeneration();
		const previousThreadIds = threadsRef.current.map((thread) => thread.id);
		for (const threadId of previousThreadIds) {
			deletedThreadIdsRef.current.add(threadId);
			clearQueuedActionsForThread(threadId);
		}
		setThreads([]);

		try {
			await deleteAllRovoAppThreads();
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
			setInputError(toRovoAppUserErrorMessage(error));
		}
	}, [clearPendingTitleGeneration, clearQueuedActionsForThread, openNewChat, refreshThreads]);

	const voteOnMessage = useCallback(
		async (messageId: string, value: "up" | "down" | null) => {
			if (!activeThreadId) {
				return;
			}

			try {
				const vote = await setRovoAppVote({
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
				setInputError(toRovoAppUserErrorMessage(error));
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

				const document = await saveRovoAppDocument({
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
				setInputError(toRovoAppUserErrorMessage(error));
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
			const document: RovoAppDocument = {
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
			const document = await saveRovoAppDocument({
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
			setInputError(toRovoAppUserErrorMessage(error));
		}
	}, [activeDocument, activeDocumentId, artifactDraftContent]);

	const deleteDocument = useCallback(
		async (documentId: string) => {
			try {
				await deleteRovoAppDocument(documentId);
				setDocuments((previousDocuments) =>
					previousDocuments.filter((document) => document.id !== documentId),
				);
				if (activeDocumentId === documentId) {
					clearArtifactState();
				}
			} catch (error) {
				setInputError(toRovoAppUserErrorMessage(error));
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
			beginThreadHydration();
			setRovodevMessages(updatedMessages);
			window.setTimeout(() => {
				completeThreadHydration();
				resetPendingArtifactAssociation();
				resetObservedTurnComplete();
				regenerate();
			}, 0);
			setEditingMessageId(null);
		},
		[beginThreadHydration, completeThreadHydration, regenerate, resetObservedTurnComplete, resetPendingArtifactAssociation, normalizedRovodevMessages, setRovodevMessages],
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
			const nextPersistKey = buildRovoAppThreadPersistKey({
				messages: normalizedRovodevMessages,
				realtimeMessages,
				visibility: threadVisibility,
				activeDocumentId,
				hermesContext: currentThread?.hermesContext ?? null,
				title: nextTitle,
			});
		if (nextPersistKey === lastPersistedKeyRef.current) {
			return;
		}

		let cancelled = false;
		const realtimeRequestVersion = realtimeMessagesVersionRef.current;
			const nextThreadUpdate: Parameters<typeof updateRovoAppThread>[1] = {
				messages: normalizedRovodevMessages,
				realtimeMessages,
				visibility: threadVisibility,
				activeDocumentId,
			};
		if (!shouldDeferRovoAppTitlePersistence({
			activeThreadId,
			isGeneratingTitle,
			pendingTitleThreadId,
		})) {
			nextThreadUpdate.title = nextTitle;
		}
		void updateRovoAppThread(activeThreadId, nextThreadUpdate)
			.then((thread) => {
				if (cancelled) {
					return;
				}

				const resolvedThread = reconcileThreadWithLocalTitle(thread);
					const persistedKey = buildRovoAppThreadPersistKey({
						messages: resolvedThread.messages,
						realtimeMessages: resolvedThread.realtimeMessages ?? [],
						visibility: resolvedThread.visibility,
						activeDocumentId: resolvedThread.activeDocumentId,
						hermesContext: resolvedThread.hermesContext ?? null,
						title: resolvedThread.title,
					});
				lastPersistedKeyRef.current = persistedKey;
				setThreads((previousThreads) =>
					upsertRovoAppThreadRecord(previousThreads, resolvedThread, {
						deletedThreadIds: deletedThreadIdsRef.current,
					}),
				);
					if (
						shouldReplaceRovoAppRouteAfterPersistence({
							pendingThreadId: pendingRouteThreadIdRef.current,
							thread: resolvedThread,
							messages: normalizedRovodevMessages,
							realtimeMessages,
							visibility: threadVisibility,
							activeDocumentId,
							hermesContext: currentThread?.hermesContext ?? null,
							title: resolvedThread.title,
						})
					) {
					pendingRouteReadyRef.current = true;
					flushPendingRouteReplacement(resolvedThread.id);
				}
				if (!areRovoAppMessagesEqual(resolvedThread.messages, normalizedRovodevMessages)) {
					beginThreadHydration();
					setRovodevMessages(resolvedThread.messages);
					window.setTimeout(() => {
						completeThreadHydration();
					}, 0);
				}
				if (
					!areRovoAppMessagesEqual(
						resolvedThread.realtimeMessages ?? [],
						realtimeMessagesRef.current,
					)
					&& shouldHydratePersistedRealtimeMessages({
						currentMessages: realtimeMessagesRef.current,
						currentVersion: realtimeMessagesVersionRef.current,
						requestVersion: realtimeRequestVersion,
					})
				) {
					beginThreadHydration();
					replaceRealtimeMessagesState(resolvedThread.realtimeMessages ?? [], {
						incrementVersion: false,
					});
					window.setTimeout(() => {
						completeThreadHydration();
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
					shouldRecoverRovoAppThreadAfterPersistenceFailure({
						error,
						state: recoveryState,
					})
				) {
					const recoveryInput =
						buildRecoverableRovoAppThreadInput(recoveryState);
					void createRovoAppThread(recoveryInput)
						.then((thread) => {
							if (
								cancelled ||
								activeThreadIdRef.current !== recoveryInput.id
							) {
								return;
							}

							const resolvedThread = reconcileThreadWithLocalTitle(thread);
							lastPersistedKeyRef.current = buildRovoAppThreadPersistKey({
								messages: resolvedThread.messages,
								realtimeMessages: resolvedThread.realtimeMessages ?? [],
								visibility: resolvedThread.visibility,
								activeDocumentId: resolvedThread.activeDocumentId,
								title: resolvedThread.title,
							});
							setThreads((previousThreads) =>
								upsertRovoAppThreadRecord(previousThreads, resolvedThread, {
									deletedThreadIds: deletedThreadIdsRef.current,
								}),
							);
							if (!embedded) {
								pendingRouteThreadIdRef.current = resolvedThread.id;
								pendingRouteReadyRef.current = true;
								flushPendingRouteReplacement(resolvedThread.id);
							}
						})
						.catch((recoveryError) => {
							if (!cancelled) {
								setInputError(toRovoAppUserErrorMessage(recoveryError));
							}
						});
					return;
				}

				setInputError(toRovoAppUserErrorMessage(error));
			});

		return () => {
			cancelled = true;
		};
	}, [
		activeDocumentId,
		activeThreadId,
		beginThreadHydration,
		completeThreadHydration,
		embedded,
		isGeneratingTitle,
		isLoadingThread,
		isStreaming,
		isVoiceMode,
		messages,
		realtimeMessages,
		replaceRealtimeMessagesState,
		flushPendingRouteReplacement,
		normalizedRovodevMessages,
		pendingTitleThreadId,
		reconcileThreadWithLocalTitle,
		setRovodevMessages,
		threadVisibility,
		threads,
	]);

	useEffect(() => {
		flushPendingRouteReplacement(activeThreadId);
	}, [activeThreadId, flushPendingRouteReplacement]);

	useEffect(() => {
		if (backgroundRefreshThreadIdsKey === "[]") {
			return;
		}

		const trackedThreadIds = JSON.parse(backgroundRefreshThreadIdsKey) as string[];
		let cancelled = false;
		const poll = async () => {
			if (cancelled) return;
			try {
				const streams = await listRovoAppBackgroundStreams();
				if (cancelled) return;
				const activeIds = new Set(streams.map((stream) => stream.threadId));
				const nextThreads = filterDeletedRovoAppThreads(
					(await listRovoAppThreads()).map((thread) =>
						reconcileThreadWithLocalTitle(thread),
					),
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
	}, [backgroundRefreshThreadIdsKey, hydrateThreadById, reconcileThreadWithLocalTitle]);

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
		pendingPlanMetadataMessageIds,
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
		planExecutionTracker,
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
		submitPlanApproval,
		dismissPlanExecutionTracker,
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
			upsertRealtimeSyntheticMessage,
			delegateToRovodev,
		setRealtimeMessageContent,
		updateRealtimeMessage,
	};
}
