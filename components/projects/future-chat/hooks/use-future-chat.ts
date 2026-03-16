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
import { toast } from "sonner";
import {
	appendFutureChatStreamingArtifactDelta,
	getFutureChatStreamingArtifactCheckpoint,
	type FutureChatStreamingArtifact,
} from "@/components/projects/future-chat/lib/future-chat-streaming-artifact";
import type { FutureChatPendingArtifactResult } from "@/components/projects/future-chat/lib/future-chat-message-artifacts";
import {
	buildFutureChatThreadPersistKey,
	shouldReplacePendingFutureChatRoute,
	shouldReplaceFutureChatRouteAfterPersistence,
} from "@/components/projects/future-chat/lib/future-chat-thread-route-sync";
import {
	buildRecoverableFutureChatThreadInput,
	shouldRecoverFutureChatThreadAfterPersistenceFailure,
} from "@/components/projects/future-chat/lib/future-chat-thread-persistence";
import {
	createRealtimeTextMessage,
	mergeFutureChatMessages,
	updateRealtimeTextMessage,
	upsertRealtimeMessage,
} from "@/components/projects/future-chat/lib/future-chat-realtime-message-state";
import {
	getLatestFutureChatThinkingStatusLabel,
	resolveFutureChatComposerSubmitState,
	type FutureChatDirectDelegationPhase,
} from "@/components/projects/future-chat/lib/future-chat-composer-submit-state";
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
	deleteAllFutureChatThreads,
	deleteFutureChatDocument,
	deleteFutureChatThread,
	getFutureChatBackendUnavailableUserMessage,
	getFutureChatDocument,
	getFutureChatThread,
	isFutureChatBackendUnavailableError,
	listFutureChatDocuments,
	upsertFutureChatRealtimeMessage,
	listFutureChatThreads,
	listFutureChatVotes,
	saveFutureChatDocument,
	setFutureChatVote,
	updateFutureChatThread,
} from "@/components/projects/future-chat/lib/api";
import {
	type FutureChatDocument,
	type FutureChatDocumentKind,
	type FutureChatThread,
	type FutureChatVisibility,
	type FutureChatVote,
	type FutureChatActiveArtifact,
	type FutureChatRecentHistoryEntry,
	createFutureChatId,
} from "@/lib/future-chat-types";
import {
	buildClarificationDismissPrompt,
	buildClarificationSummaryPrompt,
	createClarificationSubmission,
	type ClarificationAnswers,
	type ParsedQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import {
	buildPlanApprovalPrompt,
	createPlanApprovalSubmission,
	type PlanApprovalSelection,
} from "@/components/projects/shared/lib/plan-approval";
import {
	buildFutureChatAgentModeRequest,
	getFutureChatPortRoutingPayload,
} from "@/components/projects/future-chat/lib/future-chat-agent-mode";
import type { ParsedPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import { markLastFutureChatAssistantMessageInterrupted } from "@/lib/future-chat-interruptions";
import {
	getLatestDataPart,
	getMessageArtifactResult,
	getMessageText,
	type RovoMessageInterruptionSource,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import { API_ENDPOINTS } from "@/lib/api-config";

function deriveThreadTitle(promptText: string): string {
	const firstLine = promptText
		.split(/\r?\n/u)
		.map((line) => line.trim())
		.find((line) => line.length > 0);
	return firstLine?.slice(0, 80) || "New chat";
}

function getLatestDocumentContent(document: FutureChatDocument | null): string {
	if (!document || document.versions.length === 0) {
		return "";
	}

	return document.versions[document.versions.length - 1]?.content ?? "";
}

function upsertDocumentRecord(
	documents: ReadonlyArray<FutureChatDocument>,
	nextDocument: FutureChatDocument,
): FutureChatDocument[] {
	const withoutPrevious = documents.filter((document) => document.id !== nextDocument.id);
	return [nextDocument, ...withoutPrevious].sort((left, right) => {
		return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
	});
}

function buildVotesMap(votes: ReadonlyArray<FutureChatVote>): Record<string, "up" | "down"> {
	return votes.reduce<Record<string, "up" | "down">>((result, vote) => {
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

const EXPLICIT_CANCEL_DEBOUNCE_MS = 750;
const ACTIVE_TURN_STOP_TIMEOUT_MS = 1_200;

function areFutureChatMessagesEqual(
	left: ReadonlyArray<RovoUIMessage>,
	right: ReadonlyArray<RovoUIMessage>,
): boolean {
	return JSON.stringify(left) === JSON.stringify(right);
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
	portIndex?: number;
	smartGenerationLayout?: {
		containerWidthPx?: number;
		viewportWidthPx?: number;
		widthClass?: FutureChatSmartWidthClass;
	};
}

export interface FutureChatHookResult {
	activeDocument: FutureChatDocument | null;
	activeDocumentContent: string;
	activeThreadId: string | null;
	applyVoiceSteer: (payload: {
		text: string;
		contextDescription?: string;
	}) => Promise<void>;
	artifactMode: "preview" | "edit";
	artifactDraftContent: string;
	deleteAllThreads: () => Promise<void>;
	deleteDocument: (documentId: string) => Promise<void>;
	deleteThread: (threadId: string) => Promise<void>;
	documents: FutureChatDocument[];
	editMessage: (messageId: string, nextText: string) => Promise<void>;
	editingMessageId: string | null;
	inputError: string | null;
	interruptActiveTurn: (options?: {
		source: RovoMessageInterruptionSource;
	}) => Promise<void>;
	isArtifactOpen: boolean;
	isStreaming: boolean;
	isPlanMode: boolean;
	isVoiceMode: boolean;
	loadThread: (threadId: string) => Promise<void>;
	messages: RovoUIMessage[];
	openDocument: (documentId: string) => Promise<void>;
	openArtifactFromMessage: (message: RovoUIMessage) => Promise<void>;
	openNewChat: () => Promise<void>;
	regenerateLatest: () => void;
	runtimeThreadId: string;
	saveArtifactDraft: () => Promise<void>;
	selectedVersionId: string | null;
	setActiveDocumentId: (documentId: string | null) => void;
	setArtifactDraftContent: (value: string) => void;
	setArtifactMode: (mode: "preview" | "edit") => void;
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
	submitClarification: (questionCard: ParsedQuestionCardPayload, answers: ClarificationAnswers) => Promise<void>;
	submitClarificationDismiss: (questionCard: ParsedQuestionCardPayload) => Promise<void>;
	submitPlanApproval: (planWidget: ParsedPlanWidgetPayload, selection: PlanApprovalSelection) => Promise<void>;
	submitPrompt: (payload: { text: string; files: FileUIPart[]; contextDescription?: string }) => Promise<void>;
	suggestedPrompt: (text: string) => Promise<void>;
	togglePlanMode: () => Promise<void>;
	resetPlanMode: () => void;
	toggleVoiceMode: () => void;
	pendingArtifactResult: FutureChatPendingArtifactResult | null;
	hideArtifactPane: () => void;
	streamingArtifact: FutureChatStreamingArtifact | null;
	streamingArtifactMessageId: string | null;
	visibleArtifactDocumentId: string | null;
	setVisibleArtifactDocumentId: (documentId: string | null) => void;
	threads: FutureChatThread[];
	threadVisibility: FutureChatVisibility;
	votes: Record<string, "up" | "down">;
	voteOnMessage: (messageId: string, value: "up" | "down" | null) => Promise<void>;
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
	portIndex,
	smartGenerationLayout,
}: Readonly<FutureChatHookOptions>): FutureChatHookResult {
	const router = useRouter();
	const [draftThreadId, setDraftThreadId] = useState(() => initialThreadId ?? createFutureChatId());
	const [activeThreadId, setActiveThreadId] = useState<string | null>(initialThreadId);
	const [threads, setThreads] = useState<FutureChatThread[]>([]);
	const [documents, setDocuments] = useState<FutureChatDocument[]>([]);
	const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
	const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
	const [threadVisibility, setThreadVisibility] = useState<FutureChatVisibility>("private");
	const [sidebarOpen, setSidebarOpen] = useState(() => !embedded);
	const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
	const [artifactMode, setArtifactMode] = useState<"preview" | "edit">("preview");
	const [artifactDraftContent, setArtifactDraftContent] = useState("");
	const [visibleArtifactDocumentId, setVisibleArtifactDocumentId] = useState<string | null>(null);
	const [pendingArtifactResult, setPendingArtifactResult] =
		useState<FutureChatPendingArtifactResult | null>(null);
	const [streamingArtifact, setStreamingArtifact] = useState<FutureChatStreamingArtifact | null>(null);
	const [streamingArtifactMessageId, setStreamingArtifactMessageId] = useState<string | null>(null);
	const pendingArtifactAssociationRef = useRef(false);
	const [votes, setVotes] = useState<Record<string, "up" | "down">>({});
	const [inputError, setInputError] = useState<string | null>(null);
	const [isLoadingThread, setIsLoadingThread] = useState(() => initialThreadId !== null);
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
	const clearDirectDelegationState = useCallback(() => {
		setBackgroundDelegationMessageId(null);
		setDelegationTurnStatus("ready");
		setDirectDelegationPhase("idle");
	}, []);
	const activeDocument = useMemo(() => {
		return documents.find((document) => document.id === activeDocumentId) ?? null;
	}, [activeDocumentId, documents]);
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
	const lastPersistedKeyRef = useRef<string>("");
	const isHydratingThreadRef = useRef(false);
	const activeThreadIdRef = useRef<string | null>(initialThreadId);
	const activeDocumentRef = useRef<FutureChatDocument | null>(null);
	const pendingArtifactResultRef = useRef<FutureChatPendingArtifactResult | null>(null);
	const streamingArtifactRef = useRef<FutureChatStreamingArtifact | null>(null);
	const queuedStreamingArtifactDeltaRef = useRef("");
	const queuedStreamingArtifactKindRef = useRef<FutureChatDocumentKind | null>(null);
	const queuedStreamingArtifactFrameRef = useRef<number | null>(null);
	const streamingArtifactMessageIdRef = useRef<string | null>(null);
	const visibleArtifactDocumentIdRef = useRef<string | null>(null);
	const lastCompletedArtifactDocumentIdRef = useRef<string | null>(null);
	const suppressedStreamingAutoOpenDocumentIdRef = useRef<string | null>(null);
	const isVoiceModeRef = useRef(isVoiceMode);
	const rovodevMessagesRef = useRef<RovoUIMessage[]>([]);
	const realtimeMessagesRef = useRef<RovoUIMessage[]>([]);
	const realtimeMessagesVersionRef = useRef(0);
	const statusRef = useRef<ChatStatus>("ready");
	const delegationAbortControllerRef = useRef<AbortController | null>(null);
	const interruptPromiseRef = useRef<Promise<void> | null>(null);
	const lastExplicitCancelAtRef = useRef(0);
	const pendingRouteThreadIdRef = useRef<string | null>(null);
	const pendingThreadCreationRef = useRef<Promise<string> | null>(null);
	const deletedThreadIdsRef = useRef<Set<string>>(new Set());

	useEffect(() => {
		activeThreadIdRef.current = activeThreadId;
	}, [activeThreadId]);

	useEffect(() => {
		activeDocumentRef.current = activeDocument;
	}, [activeDocument]);

	useEffect(() => {
		pendingArtifactResultRef.current = pendingArtifactResult;
	}, [pendingArtifactResult]);

	useEffect(() => {
		streamingArtifactRef.current = streamingArtifact;
	}, [streamingArtifact]);

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
		visibleArtifactDocumentIdRef.current = visibleArtifactDocumentId;
	}, [visibleArtifactDocumentId]);

	useEffect(() => {
		return () => {
			if (queuedStreamingArtifactFrameRef.current !== null) {
				window.cancelAnimationFrame(queuedStreamingArtifactFrameRef.current);
			}
		};
	}, []);

	useEffect(() => {
		isVoiceModeRef.current = isVoiceMode;
	}, [isVoiceMode]);

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
					const existingContextDescription =
						typeof body?.contextDescription === "string" &&
						body.contextDescription.trim()
							? body.contextDescription.trim()
							: null;

					const resolvedContextDescription =
						existingContextDescription ?? (isVoiceModeRef.current ? VOICE_MODE_CONTEXT : undefined);
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
							...getFutureChatPortRoutingPayload(portIndex),
							smartGeneration: smartGenerationRequest,
							activeArtifact: buildActiveArtifactMetadata(activeDocument),
							origin: body?.origin === "voice" ? "voice" : "text",
							recentHistory: buildRecentHistory(messages),
						},
					};
				},
			}),
		[
			activeDocument,
			activeDocumentId,
			artifactDraftContent,
			activeDocumentContent,
			runtimeThreadId,
			portIndex,
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
	}, [visibleArtifactDocumentId]);

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
		setDocuments((previousDocuments) => upsertDocumentRecord(previousDocuments, document));
		setActiveDocumentId(document.id);
		setSelectedVersionId(document.versions.at(-1)?.id ?? null);
		setArtifactDraftContent(getLatestDocumentContent(document));
		setArtifactMode("preview");
		return document;
	}, []);

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
				setActiveDocumentId(null);
				setVisibleArtifactDocumentId(null);
				setSelectedVersionId(null);
				return null;
			}

			setDocuments((previousDocuments) => upsertDocumentRecord(previousDocuments, document));
			setActiveDocumentId(document.id);
			setSelectedVersionId(document.versions.at(-1)?.id ?? null);
			setArtifactDraftContent(getLatestDocumentContent(document));
			setArtifactMode("preview");
			return document;
		} catch (error) {
			if (isFutureChatBackendUnavailableError(error)) {
				setInputError(getFutureChatBackendUnavailableUserMessage());
				return null;
			}

			console.error("[FutureChat] Failed to hydrate streamed artifact:", error);
			return null;
		}
	}, []);

	const {
		messages: rovodevMessages,
		setMessages: setRovodevMessages,
		sendMessage,
		stop,
		regenerate,
		status: useChatStatus,
	} = useChat<RovoUIMessage>({
		transport,
		onData: (dataPart) => {
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
					case "data-id":
						updateArtifact({ documentId: dataPart.data });
						updatePendingArtifact({ documentId: dataPart.data });
						suppressedStreamingAutoOpenDocumentIdRef.current = null;
						setActiveDocumentId(dataPart.data);
						persistActiveDocumentSelection(dataPart.data);
					setSelectedVersionId("streaming");
					setArtifactMode("preview");
					pendingArtifactAssociationRef.current = true;
					break;

				case "data-title":
					updateArtifact({ title: dataPart.data });
					updatePendingArtifact({ title: dataPart.data });
					break;

				case "data-kind":
					updateArtifact({ kind: dataPart.data });
					updatePendingArtifact({ kind: dataPart.data });
					break;

				case "data-clear":
					clearQueuedStreamingArtifactDelta();
					setStreamingArtifact((prev) =>
						prev
							? { ...prev, content: "", status: "streaming", updatedAt: new Date().toISOString() }
							: null,
					);
					break;

				case "data-textDelta":
				case "data-codeDelta":
					queueStreamingArtifactDelta(
						dataPart.data,
						dataPart.type === "data-codeDelta" ? "code" : undefined,
					);
					break;

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

				case "data-artifact-result":
					lastCompletedArtifactDocumentIdRef.current = dataPart.data.documentId;
					updatePendingArtifact({
						action: dataPart.data.action,
						documentId: dataPart.data.documentId,
						kind: dataPart.data.kind,
						title: dataPart.data.title,
					});
					break;

				case "data-cancel-streaming":
					// Backend confirmed it saved the partial v1 and is starting a
					// new version. The old stream was already interrupted by
					// submitPrompt, so this is purely a confirmation signal.
					toast("Previous version saved", {
						description: "A partial version was saved before starting the new one.",
					});
					break;

				default:
					break;
			}
		},
		onError: (error) => {
			const streamingDocumentId = streamingArtifactRef.current?.documentId;
			clearStreamingArtifactState();
			resetPendingArtifactAssociation();
			if (!activeDocumentRef.current && streamingDocumentId) {
				setActiveDocumentId(null);
				setVisibleArtifactDocumentId(null);
				setSelectedVersionId(null);
				setArtifactDraftContent("");
				setArtifactMode("preview");
			}
			setInputError(toFutureChatUserErrorMessage(error));
		},
		onFinish: () => {},
	});

	useEffect(() => {
		rovodevMessagesRef.current = rovodevMessages;
	}, [rovodevMessages]);

	useEffect(() => {
		const normalizedMessages = normalizeRovodevMessagesForMerge(
			rovodevMessages,
			rovodevMessagesRef.current,
		);
		if (!normalizedMessages.changed) {
			return;
		}

		rovodevMessagesRef.current = normalizedMessages.messages;
		setRovodevMessages(normalizedMessages.messages);
	}, [rovodevMessages, setRovodevMessages]);

	const messages = useMemo(() => {
		return mergeFutureChatMessages({
			realtimeMessages,
			rovodevMessages,
		});
	}, [realtimeMessages, rovodevMessages]);
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
	const composerState = useMemo(() => {
		return resolveFutureChatComposerSubmitState({
			useChatStatus,
			delegationPhase: directDelegationPhase,
			latestThinkingStatusLabel,
			streamingArtifactStatus: streamingArtifact?.status ?? null,
		});
	}, [directDelegationPhase, latestThinkingStatusLabel, streamingArtifact?.status, useChatStatus]);
	const status =
		useChatStatus === "submitted" || useChatStatus === "streaming"
			? useChatStatus
			: delegationTurnStatus;
	const isStreaming = status === "submitted" || status === "streaming";

	useEffect(() => {
		statusRef.current = status;
	}, [status]);

	useEffect(() => {
		if (!pendingArtifactAssociationRef.current) return;
		if (streamingArtifactMessageId) return;
		const lastMessage = rovodevMessages[rovodevMessages.length - 1];
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
	}, [rovodevMessages, streamingArtifactMessageId]);

	useEffect(() => {
		if (!streamingArtifactMessageId) {
			return;
		}

		const associatedMessage = rovodevMessages.find(
			(message) => message.id === streamingArtifactMessageId && message.role === "assistant",
		);
		if (!associatedMessage || !getMessageArtifactResult(associatedMessage)) {
			return;
		}

		setPendingArtifactResult(null);
	}, [rovodevMessages, streamingArtifactMessageId]);

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
			return;
		}

		const timeoutId = window.setTimeout(() => {
			if (
				streamingArtifactRef.current?.documentId === streamingDocumentId &&
				suppressedStreamingAutoOpenDocumentIdRef.current !== streamingDocumentId &&
				meetsStreamingAutoOpenContentThreshold(streamingArtifactRef.current)
			) {
				setVisibleArtifactDocumentId(streamingDocumentId);
			}
		}, remainingDelay);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [streamingArtifact, visibleArtifactDocumentId]);

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
		} catch (error) {
			if (isFutureChatBackendUnavailableError(error)) {
				setThreads([]);
				setInputError(getFutureChatBackendUnavailableUserMessage());
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
			setActiveThreadId(thread.id);
			setRovodevMessages(thread.messages);
			replaceRealtimeMessagesState(thread.realtimeMessages ?? [], {
				incrementVersion: false,
			});
			clearDirectDelegationState();
			clearStreamingArtifactState();
			resetPendingArtifactAssociation();
			setThreadVisibility(thread.visibility);
			setDocuments(nextDocuments);
			setActiveDocumentId(thread.activeDocumentId);
			setVisibleArtifactDocumentId(thread.activeDocumentId);
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
			window.setTimeout(() => {
				isHydratingThreadRef.current = false;
			}, 0);
		},
		[
			clearDirectDelegationState,
			clearStreamingArtifactState,
			replaceRealtimeMessagesState,
			resetPendingArtifactAssociation,
			setRovodevMessages,
		],
	);

	const resetToBlankChatState = useCallback((nextDraftId: string) => {
		isHydratingThreadRef.current = true;
		pendingThreadCreationRef.current = null;
		setDraftThreadId(nextDraftId);
		activeThreadIdRef.current = null;
		setActiveThreadId(null);
		setRovodevMessages([]);
		replaceRealtimeMessagesState([], {
			incrementVersion: false,
		});
		clearDirectDelegationState();
		clearStreamingArtifactState();
		resetPendingArtifactAssociation();
		setDocuments([]);
		setActiveDocumentId(null);
		setVisibleArtifactDocumentId(null);
		setSelectedVersionId(null);
		setVotes({});
		setThreadVisibility("private");
		setEditingMessageId(null);
		setArtifactMode("preview");
		setArtifactDraftContent("");
		lastPersistedKeyRef.current = buildFutureChatThreadPersistKey({
			messages: [],
			realtimeMessages: [],
			visibility: "private",
			activeDocumentId: null,
			title: "New chat",
		});
		pendingRouteThreadIdRef.current = null;
		window.setTimeout(() => {
			isHydratingThreadRef.current = false;
		}, 0);
	}, [clearDirectDelegationState, clearStreamingArtifactState, replaceRealtimeMessagesState, resetPendingArtifactAssociation, setRovodevMessages]);

	const loadThread = useCallback(
		async (threadId: string) => {
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
							router.replace("/future-chat");
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
			} catch (error) {
				setInputError(toFutureChatUserErrorMessage(error));
			} finally {
				setIsLoadingThread(false);
			}
		},
		[embedded, hydrateThreadState, resetToBlankChatState, router],
	);

	useEffect(() => {
		void refreshThreads();
	}, [refreshThreads]);

	useEffect(() => {
		if (initialThreadId) {
			void loadThread(initialThreadId);
		}
	}, [initialThreadId, loadThread]);

	useEffect(() => {
		setArtifactDraftContent(activeDocumentContent);
		setSelectedVersionId(activeDocument?.versions.at(-1)?.id ?? null);
	}, [activeDocument, activeDocumentContent]);

	const openNewChat = useCallback(async () => {
		if (isStreaming) {
			await stop();
			delegationAbortControllerRef.current?.abort();
			delegationAbortControllerRef.current = null;
			clearDirectDelegationState();
		}

		const nextDraftId = createFutureChatId();
		resetToBlankChatState(nextDraftId);
		if (!embedded) {
			startTransition(() => {
				router.push("/future-chat");
			});
		}
	}, [
		clearDirectDelegationState,
		embedded,
		isStreaming,
		resetToBlankChatState,
		router,
		stop,
	]);

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
					}
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
						await stop();
					}
					delegationAbortControllerRef.current?.abort();
					delegationAbortControllerRef.current = null;
					clearDirectDelegationState();
				}

				const resolvedArtifactContext = resolveActiveArtifactContext(
					activeDocument, artifactDraftContent, activeDocumentContent, streamingArtifact,
				);
				const threadId = await ensureThread(trimmedText || files[0]?.filename || "New chat");
				resetPendingArtifactAssociation();
				await sendMessage({
					text: trimmedText,
					files,
				}, {
					body: {
						id: threadId,
						artifactContext: resolvedArtifactContext ?? undefined,
						contextDescription,
						streamingArtifact: streamingArtifactPayload,
					},
				});
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
			ensureThread,
			flushQueuedStreamingArtifactDeltaNow,
			resetPendingArtifactAssociation,
			sendMessage,
			stop,
			streamingArtifact,
			useChatStatus,
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
			const promptText = buildClarificationSummaryPrompt(questionCard, answers);
			const threadId = await ensureThread(promptText || "Clarification");
			resetPendingArtifactAssociation();

			const deferredToolCallId = questionCard.deferredToolCallId;
			const body: Record<string, unknown> = { id: threadId };

			if (deferredToolCallId) {
				body.deferredToolResponse = {
					tool_call_id: deferredToolCallId,
					result: submission.answers,
				};
			} else {
				body.clarification = submission;
			}

			await sendMessage({ text: promptText, files: [] }, { body });
		},
		[ensureThread, resetPendingArtifactAssociation, sendMessage],
	);

	const submitClarificationDismiss = useCallback(
		async (questionCard: ParsedQuestionCardPayload) => {
			const dismissPrompt = buildClarificationDismissPrompt(questionCard);
			const threadId = await ensureThread(dismissPrompt || "Skipped clarification");
			resetPendingArtifactAssociation();
			await sendMessage({ text: dismissPrompt, files: [] }, { body: { id: threadId } });
		},
		[ensureThread, resetPendingArtifactAssociation, sendMessage],
	);

	const submitPlanApproval = useCallback(
		async (planWidget: ParsedPlanWidgetPayload, selection: PlanApprovalSelection) => {
			const submission = createPlanApprovalSubmission(selection, planWidget);
			const promptText = buildPlanApprovalPrompt(submission);
			const threadId = await ensureThread(promptText || "Plan approval");
			resetPendingArtifactAssociation();

			const deferredToolCallId = planWidget.deferredToolCallId;
			const body: Record<string, unknown> = {
				id: threadId,
			};

			if (deferredToolCallId) {
				const approved = selection.decision === "auto-accept";
				body.deferredToolResponse = {
					tool_call_id: deferredToolCallId,
					result: {
						approved,
						feedback: approved ? undefined : selection.customInstruction?.trim() || undefined,
					},
				};
			}

			await sendMessage({ text: promptText, files: [] }, { body });

			if (selection.decision === "auto-accept") {
				setIsPlanMode(false);
			}
		},
		[ensureThread, resetPendingArtifactAssociation, sendMessage],
	);

	const togglePlanMode = useCallback(async () => {
		const nextMode = isPlanMode ? "default" : "plan";
		try {
			const response = await fetch(API_ENDPOINTS.AGENT_MODE, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(
					buildFutureChatAgentModeRequest({
						mode: nextMode,
						portIndex,
					}),
				),
			});
			if (!response.ok) {
				throw new Error(`Agent mode request failed with status ${response.status}`);
			}
			setIsPlanMode((prev) => !prev);
		} catch (error) {
			console.warn("[FutureChat] Failed to toggle plan mode:", error);
		}
	}, [isPlanMode, portIndex]);

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
			const messageId = options?.messageId ?? createFutureChatId("future-chat-realtime");
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

			const hadActiveTurn =
				statusRef.current === "submitted" || statusRef.current === "streaming";
			const checkpointDocument = hadActiveTurn
				? await saveStreamingArtifactCheckpoint()
				: null;
			if (hadActiveTurn) {
				if (useChatStatus === "submitted" || useChatStatus === "streaming") {
					await stop();
				}
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
			stop,
			streamingArtifact,
			threadVisibility,
			useChatStatus,
		],
	);

	const requestExplicitCancel = useCallback(async () => {
		const now = Date.now();
		if (now - lastExplicitCancelAtRef.current < EXPLICIT_CANCEL_DEBOUNCE_MS) {
			return;
		}

		lastExplicitCancelAtRef.current = now;

		try {
			await fetch(API_ENDPOINTS.CHAT_CANCEL, {
				method: "POST",
			});
		} catch (error) {
			console.warn("[FutureChat] Explicit cancel request failed:", error);
		}
	}, []);

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
				const directDelegationAbortController = delegationAbortControllerRef.current;

				try {
					if (hadActiveTurn) {
						await Promise.allSettled([
							hasUseChatTurn ? stop() : Promise.resolve(),
							hasUseChatTurn ? requestExplicitCancel() : Promise.resolve(),
						]);
						directDelegationAbortController?.abort();
						clearDirectDelegationState();
						delegationAbortControllerRef.current = null;

						const stoppedInTime = await waitForActiveTurnToStop();
						if (!stoppedInTime) {
							console.warn(
								"[FutureChat] Proceeding after cancel timeout while interrupting active turn.",
							);
						}
					}

					const interruptedAt = new Date().toISOString();
					let didMarkInterruptedReply = false;
					if (hasUseChatTurn) {
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
			clearDirectDelegationState,
			mutateRealtimeMessagesState,
			requestExplicitCancel,
			setRovodevMessages,
			stop,
			useChatStatus,
			waitForActiveTurnToStop,
		],
	);

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

				const threadId = await ensureThread(trimmedText);
				resetPendingArtifactAssociation();
				void sendMessage(
					{
						text: trimmedText,
						files: [],
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
			ensureThread,
			interruptActiveTurn,
			resetPendingArtifactAssociation,
			saveStreamingArtifactCheckpoint,
			sendMessage,
		],
	);

	const deleteThread = useCallback(
		async (threadId: string) => {
			deletedThreadIdsRef.current.add(threadId);
			setThreads((previousThreads) =>
				previousThreads.filter((thread) => thread.id !== threadId),
			);

			try {
				await deleteFutureChatThread(threadId);
				if (activeThreadIdRef.current === threadId) {
					await openNewChat();
				}
			} catch (error) {
				deletedThreadIdsRef.current.delete(threadId);
				void refreshThreads();
				setInputError(toFutureChatUserErrorMessage(error));
			}
		},
		[openNewChat, refreshThreads],
	);

	const deleteAllThreads = useCallback(async () => {
		const previousThreadIds = threads.map((thread) => thread.id);
		for (const threadId of previousThreadIds) {
			deletedThreadIdsRef.current.add(threadId);
		}
		setThreads([]);

		try {
			await deleteAllFutureChatThreads();
			await openNewChat();
		} catch (error) {
			for (const threadId of previousThreadIds) {
				deletedThreadIdsRef.current.delete(threadId);
			}
			void refreshThreads();
			setInputError(toFutureChatUserErrorMessage(error));
		}
	}, [openNewChat, refreshThreads, threads]);

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
				setDocuments((previousDocuments) => [document, ...previousDocuments]);
				setActiveDocumentId(document.id);
				setVisibleArtifactDocumentId(document.id);
				setArtifactMode("preview");
				setSelectedVersionId(document.versions.at(-1)?.id ?? null);
				setArtifactDraftContent(getLatestDocumentContent(document));
			} catch (error) {
				setInputError(toFutureChatUserErrorMessage(error));
			}
		},
		[documents, ensureThread],
	);

	const openDocument = useCallback(
		async (documentId: string) => {
			const existingDocument = documents.find((document) => document.id === documentId) ?? null;
			if (existingDocument) {
				setActiveDocumentId(existingDocument.id);
				setVisibleArtifactDocumentId(existingDocument.id);
				setSelectedVersionId(existingDocument.versions.at(-1)?.id ?? null);
				setArtifactDraftContent(getLatestDocumentContent(existingDocument));
				setArtifactMode("preview");
				return;
			}

			await hydratePersistedArtifact(documentId);
			setVisibleArtifactDocumentId(documentId);
		},
		[documents, hydratePersistedArtifact],
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
					setActiveDocumentId(null);
					setVisibleArtifactDocumentId(null);
					setSelectedVersionId(null);
					setArtifactDraftContent("");
				}
			} catch (error) {
				setInputError(toFutureChatUserErrorMessage(error));
			}
		},
		[activeDocumentId],
	);

	const editMessage = useCallback(
		async (messageId: string, nextText: string) => {
			const trimmedText = nextText.trim();
			if (!trimmedText) {
				return;
			}

			const messageIndex = rovodevMessages.findIndex((message) => message.id === messageId);
			if (messageIndex === -1) {
				return;
			}

			const updatedMessages = rovodevMessages
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
				regenerate();
			}, 0);
			setEditingMessageId(null);
		},
		[regenerate, resetPendingArtifactAssociation, rovodevMessages, setRovodevMessages],
	);

	const regenerateLatest = useCallback(() => {
		resetPendingArtifactAssociation();
		regenerate();
	}, [regenerate, resetPendingArtifactAssociation]);

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
			messages: rovodevMessages,
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
			messages: rovodevMessages,
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
					!embedded &&
					!isVoiceMode &&
					shouldReplaceFutureChatRouteAfterPersistence({
						pendingThreadId: pendingRouteThreadIdRef.current,
						thread,
						messages: rovodevMessages,
						realtimeMessages,
						visibility: threadVisibility,
						activeDocumentId,
						title: nextTitle,
					})
				) {
					pendingRouteThreadIdRef.current = null;
					startTransition(() => {
						router.replace(`/future-chat/${encodeURIComponent(thread.id)}`);
					});
				}
				if (!areFutureChatMessagesEqual(thread.messages, rovodevMessages)) {
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
					messages: rovodevMessages,
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
								if (!isVoiceMode) {
									startTransition(() => {
										router.replace(`/future-chat/${encodeURIComponent(thread.id)}`);
									});
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
		resetToBlankChatState,
		router,
		rovodevMessages,
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
			isStreaming,
			isVoiceMode,
			pendingThreadId: pendingRouteThreadIdRef.current,
		})) {
			return;
		}

		pendingRouteThreadIdRef.current = null;
		startTransition(() => {
			router.replace(`/future-chat/${encodeURIComponent(resolvedActiveThreadId)}`);
		});
	}, [activeThreadId, embedded, isStreaming, isVoiceMode, router]);

	return {
		activeDocument,
		activeDocumentContent,
		activeThreadId,
		applyVoiceSteer,
		artifactMode,
		artifactDraftContent,
		backgroundArtifactLabel: composerState.backgroundArtifactLabel,
		backgroundDelegationLabel: composerState.backgroundDelegationLabel,
		composerStatus: composerState.composerStatus,
		deleteAllThreads,
		deleteDocument,
		deleteThread,
		documents,
		editMessage,
		editingMessageId,
		hideArtifactPane,
		hasBackgroundDelegation: composerState.hasBackgroundDelegation,
		inputError,
		interruptActiveTurn,
		isArtifactOpen: visibleArtifactDocumentId !== null,
		isPlanMode,
		isStreaming,
		isVoiceMode,
		loadThread,
		messages,
		openDocument,
		openArtifactFromMessage,
		openNewChat,
		regenerateLatest,
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
		sidebarOpen,
		status,
		stop,
		submitClarification,
		submitClarificationDismiss,
		submitPlanApproval,
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
		threadVisibility,
		votes,
		voteOnMessage,
		appendRealtimeMessage,
		delegateToRovodev,
		setRealtimeMessageContent,
		updateRealtimeMessage,
	};
}
