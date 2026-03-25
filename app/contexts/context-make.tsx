"use client";

import {
	createContext,
	use,
	useCallback,
	useEffect,
	useMemo,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { API_ENDPOINTS } from "@/lib/api-config";
import type {
	AgentRunListItem,
	AgentRun,
} from "@/lib/make-run-types";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { isMessageVisibleInTranscript } from "@/lib/rovo-ui-messages";
import type { QueuedPromptItem } from "@/app/contexts";
import type { MakeSkill, MakeAgent } from "@/lib/make-config-types";
import type { ParsedQuestionCardPayload, ClarificationAnswers } from "@/components/projects/shared/lib/question-card-widget";
import type { ParsedPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import type { GenerativeWidgetPrimaryActionPayload } from "@/components/projects/shared/lib/generative-widget";
import type { TaskExecution } from "@/components/projects/make/lib/execution-data";
import type { ExecutionState } from "@/components/projects/make/hooks/use-execution-mode";
import type { ChatHistoryItem } from "@/components/projects/make/components/sidebar-chat-history";
import type { SkillDialogProps, AgentDialogProps, SidebarConfigHandlers, ImportDialogState, DeleteAlertState } from "@/components/projects/make/hooks/use-config-dialogs";
import type { RetryTaskGroupKey } from "@/components/projects/make/lib/retry-task-groups";
import {
	buildClarificationSummaryPrompt,
	createClarificationSubmission,
	getLatestQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import {
	getPlanApprovalKeyFromPlanWidget,
} from "@/components/projects/shared/lib/plan-approval";
import { getLatestPlanWidgetPayload, fetchEnrichedPlanTitle } from "@/components/projects/shared/lib/plan-widget";
import {
	selectRetryTasks,
} from "@/components/projects/make/lib/retry-task-groups";
import {
	normalizePlanMessages,
	isAnyWidgetCurrentlyLoading,
	getLoadingWidgetType,
	isPlanResponseComplete,
	toConversationItems,
	getLatestVisibleUserPrompt,
} from "@/components/projects/make/lib/message-utils";
import {
	parseMakeNavigationIntent,
	parseMakeNavigationPrompt,
	clearMakeNavigationIntentParams,
} from "@/components/projects/make/lib/navigation-intent";
import { useMakeChat } from "@/components/projects/make/hooks/use-make-chat";
import { useLocalRovoChat } from "@/components/projects/make/hooks/use-local-rovo-chat";
import { useExecutionMode } from "@/components/projects/make/hooks/use-execution-mode";
import { useMakeConfig } from "@/components/projects/make/hooks/use-make-config";
import { useConfigDialogs } from "@/components/projects/make/hooks/use-config-dialogs";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

export interface MakeState {
	// Sidebar
	sidebarOpen: boolean;
	sidebarHovered: boolean;

	// Chat
	prompt: string;
	isStreaming: boolean;
	isSubmitPending: boolean;
	chatTabMessages: RovoUIMessage[];
	chatTabPrompt: string;
	chatTabIsStreaming: boolean;
	chatTabIsSubmitPending: boolean;
	chatTabQueuedPrompts: ReadonlyArray<QueuedPromptItem>;
	chatTabHistory: ChatHistoryItem[];
	chatTabActiveChatId: string | null;
	chatTabIsGeneratingTitle: boolean;
	chatTabPendingTitleChatId: string | null;
	chatTabNormalizedMessages: RovoUIMessage[];
	chatTabActiveQuestionCard: ParsedQuestionCardPayload | null;
	chatTabIsPlanMessageComplete: boolean;
	isMakeInterviewActive: boolean;
	isMakeToggleActive: boolean;

	// Messages
	uiMessages: RovoUIMessage[];
	normalizedUiMessages: RovoUIMessage[];
	queuedPrompts: ReadonlyArray<QueuedPromptItem>;

	// Derived
	activeQuestionCard: ParsedQuestionCardPayload | null;
	activePlanWidget: ParsedPlanWidgetPayload | null;
	enrichedPlanTitle: { title: string; description: string } | null;
	isWidgetLoading: boolean;
	loadingWidgetType: string | null;
	isPlanMessageComplete: boolean;

	// Execution
	isExecutionActive: boolean;
	executionState: ExecutionState;
	runId: string | null;
	taskExecutions: TaskExecution[];
	run: AgentRun | null;
	agentCount: number;

	// History
	chatHistory: ChatHistoryItem[];
	activeChatId: string | null;
	sidebarRunHistory: AgentRunListItem[];
	hasLoadedRunHistory: boolean;

	// Title
	activeChatTitle: string | null;
	isActiveChatTitlePending: boolean;
	isGeneratingTitle: boolean;
	pendingTitleChatId: string | null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export interface MakeActions {
	// Sidebar
	setSidebarOpen: (open: boolean) => void;
	handleHoverEnter: () => void;
	handleHoverLeave: () => void;
	handlePinSidebar: () => void;

	// Chat
	setPrompt: (value: string) => void;
	handleSubmit: () => Promise<void> | void;
	stopStreaming: () => Promise<void>;
	removeQueuedPrompt: (id: string) => void;
	handleNewChat: () => void;
	handleSelectChat: (id: string) => void;
	handleDeleteChat: (id: string) => void;

	// Clarification
	handleClarificationSubmit: (answers: ClarificationAnswers) => void;
	handleClarificationDismiss: (questionCard: ParsedQuestionCardPayload) => void;

	// Build
	handleBuild: (
		planWidget: ParsedPlanWidgetPayload,
		source?: "chat" | "make",
	) => void;

	// Suggestions / Widgets
	handleSuggestedQuestionClick: (question: string) => Promise<void> | void;
	handleWidgetPrimaryAction: (payload: GenerativeWidgetPrimaryActionPayload) => Promise<void> | void;

	// Runs
	handleSelectRun: (runId: string) => void;
	handleDeleteRun: (runId: string) => void;
	handleRetryRunGroup: (runId: string, groupKey: RetryTaskGroupKey, taskIds: string[]) => Promise<void> | void;
	handleAddTask: (message: string) => void;
	handleCreatePlan: () => void;
	handleNewMakeChat: () => void;

	// Chat tab (independent stream)
	setChatTabPrompt: (value: string) => void;
	handleChatTabSubmit: () => Promise<void> | void;
	stopChatTabStreaming: () => Promise<void>;
	removeChatTabQueuedPrompt: (id: string) => void;
	handleNewChatTabChat: () => void;
	handleSelectChatTabChat: (id: string) => void;
	handleDeleteChatTabChat: (id: string) => void;
	handleChatTabSuggestedQuestionClick: (question: string) => Promise<void> | void;
	handleChatTabWidgetPrimaryAction: (
		payload: GenerativeWidgetPrimaryActionPayload
	) => Promise<void> | void;
	handleChatTabClarificationSubmit: (answers: ClarificationAnswers) => void;
	handleChatTabClarificationDismiss: (questionCard: ParsedQuestionCardPayload) => void;

	// Make toggle
	toggleMakeMode: () => void;
	activateMakeMode: () => void;
	deactivateMakeMode: () => void;

	// Agent multiplier
	setAgentCount: (count: number) => void;
}

// ---------------------------------------------------------------------------
// Meta
// ---------------------------------------------------------------------------

export interface MakeMeta {
	skills: MakeSkill[];
	agents: MakeAgent[];
	skillDialogProps: SkillDialogProps;
	agentDialogProps: AgentDialogProps;
	sidebarConfigHandlers: SidebarConfigHandlers;
	importDialog: ImportDialogState;
	closeImportDialog: () => void;
	handleImport: (content: string) => Promise<void>;
	deleteAlert: DeleteAlertState;
	closeDeleteAlert: () => void;
	handleDeleteConfirm: () => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

export interface MakeContextValue {
	state: MakeState;
	actions: MakeActions;
	meta: MakeMeta;
}

const MakeContext = createContext<MakeContextValue | null>(null);

// ---------------------------------------------------------------------------
// Helpers (pure)
// ---------------------------------------------------------------------------

function toDateTimestamp(value: string): number {
	const timestamp = Date.parse(value);
	return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortRunsByRecency(leftRun: AgentRunListItem, rightRun: AgentRunListItem): number {
	const updatedDelta =
		toDateTimestamp(rightRun.updatedAt) - toDateTimestamp(leftRun.updatedAt);
	if (updatedDelta !== 0) {
		return updatedDelta;
	}

	const createdDelta =
		toDateTimestamp(rightRun.createdAt) - toDateTimestamp(leftRun.createdAt);
	if (createdDelta !== 0) {
		return createdDelta;
	}

	return rightRun.runId.localeCompare(leftRun.runId);
}

function parseErrorMessage(payload: unknown): string {
	if (!payload || typeof payload !== "object") {
		return "Request failed";
	}

	const record = payload as { error?: unknown; details?: unknown };
	if (typeof record.error === "string" && record.error.trim()) {
		return record.error.trim();
	}
	if (typeof record.details === "string" && record.details.trim()) {
		return record.details.trim();
	}

	return "Request failed";
}

function toErrorMessage(error: unknown): string {
	if (error instanceof Error && error.message.trim()) {
		return error.message.trim();
	}

	return "Request failed";
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

interface MakeProviderProps {
	children: ReactNode;
}

export function MakeProvider({ children }: MakeProviderProps) {
	const router = useRouter();
	const pathname = usePathname();
	const initialMakeEntryStateRef = useRef<{
		intent: ReturnType<typeof parseMakeNavigationIntent>;
		prompt: string | null;
	} | null>(null);
	if (initialMakeEntryStateRef.current === null) {
		if (typeof window === "undefined") {
			initialMakeEntryStateRef.current = {
				intent: null,
				prompt: null,
			};
		} else {
			const initialSearchParams = new URLSearchParams(window.location.search);
			initialMakeEntryStateRef.current = {
				intent: parseMakeNavigationIntent(initialSearchParams),
				prompt: parseMakeNavigationPrompt(initialSearchParams),
			};
		}
	}
	const initialMakeEntryState = initialMakeEntryStateRef.current;

	// ---- Local sidebar state ----
	const [isOpen, setIsOpen] = useState(true);
	const [isHovered, setIsHovered] = useState(false);
	const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// ---- Navigation tab ----
	const [agentCount, setAgentCount] = useState(4);
	const [enrichedPlanTitle, setEnrichedPlanTitle] = useState<{ title: string; description: string } | null>(null);

	// ---- Run history ----
	const [runHistory, setRunHistory] = useState<AgentRunListItem[]>([]);
	const [hasLoadedRunHistory, setHasLoadedRunHistory] = useState(false);
	const hasNavigatedToSummaryRef = useRef(false);
	const hasHandledNavigationIntentRef = useRef(false);
	const makeRuntime = useLocalRovoChat();
	const chatRuntime = useLocalRovoChat();

	// ---- Hooks ----
	const {
		prompt,
		setPrompt,
		isStreaming,
		isSubmitPending,
		stopStreaming,
		uiMessages: rawUiMessages,
		queuedPrompts,
		removeQueuedPrompt,
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		handleSubmit: _handleMakeSubmit,
		handleSuggestedQuestionClick,
		handleWidgetPrimaryAction,
		submitClarification,
		dismissClarification,
		appendPlanApprovalMarker: appendMakePlanApprovalMarker,
	} = useMakeChat({
		mode: "make",
		syncUrlThreadParam: false,
		chatRuntime: makeRuntime,
	});

	const {
		prompt: chatTabPrompt,
		setPrompt: setChatTabPrompt,
		isStreaming: chatTabIsStreaming,
		isSubmitPending: chatTabIsSubmitPending,
		stopStreaming: stopChatTabStreaming,
		isGeneratingTitle: chatTabIsGeneratingTitle,
		pendingTitleChatId: chatTabPendingTitleChatId,
		uiMessages: chatTabRawUiMessages,
		queuedPrompts: chatTabQueuedPrompts,
		removeQueuedPrompt: removeChatTabQueuedPrompt,
		chatHistory: chatTabHistory,
		activeChatId: chatTabActiveChatId,
		handleSubmit: handleChatTabSubmit,
		handleSuggestedQuestionClick: handleChatTabSuggestedQuestionClick,
		handleWidgetPrimaryAction: handleChatTabWidgetPrimaryAction,
		handleNewChat: handleNewChatTabChat,
		handleSelectChat: handleSelectChatTabChat,
		handleDeleteChat: handleDeleteChatTabChat,
		submitClarification: submitChatTabClarification,
		dismissClarification: dismissChatTabClarification,
		appendPlanApprovalMarker: appendChatTabPlanApprovalMarker,
		isPlanMode: chatTabIsPlanMode,
		togglePlanMode: chatTabTogglePlanMode,
	} = useMakeChat({
		mode: "chat",
		syncUrlThreadParam: true,
		chatRuntime,
		initialPlanMode: initialMakeEntryState.intent === "fresh-make",
		initialPrompt: initialMakeEntryState.prompt ?? "",
	});

	const {
		skills,
		agents,
		availableTools,
		createSkill,
		updateSkill,
		deleteSkill,
		createAgent,
		updateAgent,
		deleteAgent,
		exportSkill,
		exportAgent,
		importSkill,
		importAgent,
	} = useMakeConfig();

	const {
		skillDialogProps,
		agentDialogProps,
		sidebarConfigHandlers,
		importDialog,
		closeImportDialog,
		handleImport,
		deleteAlert,
		closeDeleteAlert,
		handleDeleteConfirm,
	} = useConfigDialogs({
		skills,
		agents,
		createSkill,
		updateSkill,
		deleteSkill,
		createAgent,
		updateAgent,
		deleteAgent,
		exportSkill,
		exportAgent,
		importSkill,
		importAgent,
		availableTools,
	});

	const {
		isExecutionActive,
		executionState,
		runId,
		runStatus,
		taskExecutions,
		run,
		startExecution,
		sendDirective,
	} = useExecutionMode();

	// ---- Derived state (memos) ----
	const normalizedUiMessages = useMemo(
		() => normalizePlanMessages(rawUiMessages, isStreaming),
		[rawUiMessages, isStreaming],
	);
	const uiMessages = useMemo(
		() => normalizedUiMessages.filter(isMessageVisibleInTranscript),
		[normalizedUiMessages],
	);
	const latestUserPrompt = useMemo(
		() => getLatestVisibleUserPrompt(uiMessages),
		[uiMessages],
	);
	const conversationItems = useMemo(
		() => toConversationItems(uiMessages),
		[uiMessages],
	);
	const activeQuestionCard = useMemo(
		() => getLatestQuestionCardPayload(rawUiMessages),
		[rawUiMessages],
	);
	const activePlanWidget = useMemo(
		() => getLatestPlanWidgetPayload(rawUiMessages),
		[rawUiMessages],
	);
	const isWidgetLoading = useMemo(
		() => isAnyWidgetCurrentlyLoading(rawUiMessages),
		[rawUiMessages],
	);
	const loadingWidgetType = useMemo(
		() => getLoadingWidgetType(rawUiMessages),
		[rawUiMessages],
	);
	const isPlanMessageComplete = useMemo(
		() => isPlanResponseComplete(rawUiMessages),
		[rawUiMessages],
	);
	const chatTabNormalizedMessages = useMemo(
		() => normalizePlanMessages(chatTabRawUiMessages, chatTabIsStreaming),
		[chatTabRawUiMessages, chatTabIsStreaming],
	);
	const chatTabMessages = useMemo(
		() => chatTabNormalizedMessages.filter(isMessageVisibleInTranscript),
		[chatTabNormalizedMessages],
	);
	const chatTabActiveQuestionCard = useMemo(
		() => getLatestQuestionCardPayload(chatTabRawUiMessages),
		[chatTabRawUiMessages],
	);
	const chatTabIsPlanMessageComplete = useMemo(
		() => isPlanResponseComplete(chatTabRawUiMessages),
		[chatTabRawUiMessages],
	);
	const latestChatTabUserPrompt = useMemo(
		() => getLatestVisibleUserPrompt(chatTabMessages),
		[chatTabMessages],
	);
	const chatTabConversationItems = useMemo(
		() => toConversationItems(chatTabMessages),
		[chatTabMessages],
	);

	// Reset enriched title when the active plan widget changes
	const enrichedPlanWidgetKeyRef = useRef<string | null>(null);
	const currentPlanWidgetKey = activePlanWidget
		? `${activePlanWidget.title}::${activePlanWidget.tasks.length}`
		: null;
	if (enrichedPlanWidgetKeyRef.current !== currentPlanWidgetKey) {
		enrichedPlanWidgetKeyRef.current = currentPlanWidgetKey;
		if (enrichedPlanTitle !== null) {
			setEnrichedPlanTitle(null);
		}
	}

	// Enrich plan title via AI after streaming completes
	useEffect(() => {
		if (!isPlanMessageComplete || !activePlanWidget || isExecutionActive || isStreaming) {
			return;
		}
		if (enrichedPlanTitle !== null) {
			return;
		}

		const enrichDelay = setTimeout(() => {
			void fetchEnrichedPlanTitle(activePlanWidget).then((result) => {
				if (result) {
					setEnrichedPlanTitle(result);
				}
			});
		}, 2000);

		return () => clearTimeout(enrichDelay);
	}, [activePlanWidget, enrichedPlanTitle, isExecutionActive, isPlanMessageComplete, isStreaming]);

	const activeChatTabTitle =
		chatTabActiveChatId !== null
			? chatTabHistory.find((item) => item.id === chatTabActiveChatId)?.title ?? null
			: null;
	const isActiveChatTabTitlePending =
		chatTabActiveChatId !== null &&
		chatTabPendingTitleChatId === chatTabActiveChatId;

	const sidebarRunHistory = useMemo(() => {
		const runsById = new Map<string, AgentRunListItem>();
		for (const runItem of runHistory) {
			runsById.set(runItem.runId, runItem);
		}
		if (run) {
			runsById.set(run.runId, run);
		}

		return Array.from(runsById.values()).sort(sortRunsByRecency);
	}, [run, runHistory]);

	const isMakeInterviewActive = uiMessages.length > 0 && !isExecutionActive;

	// ---- Effects ----

	useEffect(() => {
		if (hasHandledNavigationIntentRef.current) {
			return;
		}
		hasHandledNavigationIntentRef.current = true;

		if (typeof window === "undefined") {
			return;
		}

		const currentUrl = new URL(window.location.href);
		const entryIntent = parseMakeNavigationIntent(currentUrl.searchParams);
		if (!entryIntent) {
			return;
		}

		const entryPrompt = parseMakeNavigationPrompt(currentUrl.searchParams);

		// Explicit entry intent should win over summary auto-navigation.
		hasNavigatedToSummaryRef.current = true;
		handleNewChatTabChat({ clearPrompt: !entryPrompt });

		if (entryIntent === "fresh-make") {
			if (!chatTabIsPlanMode) {
				chatTabTogglePlanMode();
			}
		} else if (chatTabIsPlanMode) {
			chatTabTogglePlanMode();
		}

		if (entryPrompt && chatTabPrompt !== entryPrompt) {
			setChatTabPrompt(entryPrompt);
		}

		const nextParams = clearMakeNavigationIntentParams(currentUrl.searchParams);
		const nextSearch = nextParams.toString();
		const nextUrl = `${currentUrl.pathname}${nextSearch ? `?${nextSearch}` : ""}${currentUrl.hash}`;
		const previousUrl = `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`;
		if (nextUrl !== previousUrl) {
			window.history.replaceState({}, "", nextUrl);
		}
	}, [
		chatTabIsPlanMode,
		chatTabPrompt,
		chatTabTogglePlanMode,
		handleNewChatTabChat,
		setChatTabPrompt,
	]);

	useEffect(() => {
		if (!runId || executionState === "idle") {
			hasNavigatedToSummaryRef.current = false;
			return;
		}

		if (!hasNavigatedToSummaryRef.current) {
			hasNavigatedToSummaryRef.current = true;
			router.push(`/make/runs/${runId}`);
		}
	}, [executionState, router, runId]);

	const fetchRunHistory = useCallback(async () => {
		try {
			const response = await fetch(API_ENDPOINTS.makeRuns(), {
				cache: "no-store",
			});
			if (!response.ok) {
				return;
			}

			const payload = (await response.json()) as { runs?: AgentRunListItem[] };
			if (Array.isArray(payload.runs)) {
				setRunHistory(payload.runs);
			}
		} catch {
			// Network errors are expected during dev when the backend restarts.
		} finally {
			setHasLoadedRunHistory(true);
		}
	}, []);

	useEffect(() => {
		void fetchRunHistory();
	}, [fetchRunHistory, runId, runStatus]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void fetchRunHistory();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [fetchRunHistory]);

	// ---- Callbacks ----

	const handleClarificationSubmit = useCallback(
		(answers: ClarificationAnswers) => {
			if (!activeQuestionCard) {
				return;
			}

			const clarificationSubmission = createClarificationSubmission(
				activeQuestionCard,
				answers,
			);
			const clarificationPrompt = buildClarificationSummaryPrompt(
				activeQuestionCard,
				answers,
			);
			void submitClarification(clarificationPrompt, clarificationSubmission, activeQuestionCard);
		},
		[activeQuestionCard, submitClarification],
	);

	const handleClarificationDismiss = useCallback(
		(questionCard: ParsedQuestionCardPayload) => {
			void dismissClarification(questionCard);
		},
		[dismissClarification],
	);

	const handleChatTabClarificationSubmit = useCallback(
		(answers: ClarificationAnswers) => {
			if (!chatTabActiveQuestionCard) {
				return;
			}

			const clarificationSubmission = createClarificationSubmission(
				chatTabActiveQuestionCard,
				answers,
			);
			const clarificationPrompt = buildClarificationSummaryPrompt(
				chatTabActiveQuestionCard,
				answers,
			);
			void submitChatTabClarification(
				clarificationPrompt,
				clarificationSubmission,
				chatTabActiveQuestionCard,
			);
		},
		[chatTabActiveQuestionCard, submitChatTabClarification],
	);

	const handleChatTabClarificationDismiss = useCallback(
		(questionCard: ParsedQuestionCardPayload) => {
			void dismissChatTabClarification(questionCard);
		},
		[dismissChatTabClarification],
	);

	const handleBuild = useCallback(
		(planWidget: ParsedPlanWidgetPayload, source: "chat" | "make" = "make") => {
			if (!planWidget.tasks || planWidget.tasks.length === 0) {
				return;
			}
			const planApprovalPlanKey = getPlanApprovalKeyFromPlanWidget(planWidget);

			const runUserPrompt = source === "chat" ? latestChatTabUserPrompt : latestUserPrompt;
			const runConversation =
				source === "chat" ? chatTabConversationItems : conversationItems;
			if (source === "chat") {
				void appendChatTabPlanApprovalMarker({
					decision: "auto-accept",
					planApprovalPlanKey,
				});
			} else {
				void appendMakePlanApprovalMarker({
					decision: "auto-accept",
					planApprovalPlanKey,
				});
			}

			void (async () => {
				try {
					const { runId: nextRunId } = await startExecution({
						plan: planWidget,
						userPrompt: runUserPrompt,
						conversation: runConversation,
						agentCount,
					});
					hasNavigatedToSummaryRef.current = true;
					router.push(`/make/runs/${nextRunId}`);
				} catch (error) {
					console.error(
						"[MAKE] Failed to start run:",
						toErrorMessage(error),
					);
				}
			})();
		},
		[
			agentCount,
			chatTabConversationItems,
			conversationItems,
			latestChatTabUserPrompt,
			latestUserPrompt,
			router,
			startExecution,
			appendChatTabPlanApprovalMarker,
			appendMakePlanApprovalMarker,
		],
	);

	const handleHoverEnter = useCallback(() => {
		if (hoverTimeoutRef.current) {
			clearTimeout(hoverTimeoutRef.current);
			hoverTimeoutRef.current = null;
		}
		setIsHovered(true);
	}, []);

	const handleHoverLeave = useCallback(() => {
		hoverTimeoutRef.current = setTimeout(() => {
			setIsHovered(false);
		}, 100);
	}, []);

	const handlePinSidebar = useCallback(() => {
		setIsOpen(true);
		setIsHovered(false);
	}, []);

	const handleAddTask = useCallback(
		(message: string) => {
			void sendDirective("", message);
		},
		[sendDirective],
	);

	// When submitting from the make tab's initial view, redirect to the chat
	// tab so the streaming response is visible.
	const handleMakeTabSubmit = useCallback(async () => {
		const currentPrompt = prompt.trim();
		if (!currentPrompt) return;

		// Clear the make tab prompt
		setPrompt("");

		// Send via the chat runtime (accepts prompt directly, no state timing issues)
		await handleChatTabSuggestedQuestionClick(currentPrompt);
	}, [prompt, setPrompt, handleChatTabSuggestedQuestionClick]);

	const handleCreatePlan = useCallback(() => {
		// no-op: tab system removed
	}, []);

	const activateMakeMode = useCallback(() => {
		if (!chatTabIsPlanMode) {
			chatTabTogglePlanMode();
		}
	}, [chatTabIsPlanMode, chatTabTogglePlanMode]);

	const deactivateMakeMode = useCallback(() => {
		if (chatTabIsPlanMode) {
			chatTabTogglePlanMode();
		}
	}, [chatTabIsPlanMode, chatTabTogglePlanMode]);

	const handleSelectChatWithTab = useCallback(
		(id: string) => {
			if (pathname !== "/make") {
				const encodedChatId = encodeURIComponent(id);
				router.push(`/make?thread=${encodedChatId}`);
				return;
			}
			handleSelectChatTabChat(id);
		},
		[handleSelectChatTabChat, pathname, router],
	);

	const handleSelectRun = useCallback(
		(selectedRunId: string) => {
			router.push(`/make/runs/${selectedRunId}`);
		},
		[router],
	);

	const handleDeleteRun = useCallback(
		async (deletedRunId: string) => {
			try {
				const response = await fetch(
					API_ENDPOINTS.makeRun(deletedRunId),
					{ method: "DELETE" },
				);
				if (!response.ok) {
					console.error("[PLAN] Failed to delete run:", response.status);
					return;
				}
				setRunHistory((prev) => prev.filter((r) => r.runId !== deletedRunId));
			} catch (error) {
				console.error("[PLAN] Failed to delete run:", error);
			}
		},
		[],
	);

	const handleRetryRunGroup = useCallback(
		async (targetRunId: string, groupKey: RetryTaskGroupKey, taskIds: string[]) => {
			const targetRun = sidebarRunHistory.find((item) => item.runId === targetRunId);
			if (!targetRun) {
				return;
			}

			const selectedTasks = selectRetryTasks(targetRun.tasks, groupKey, taskIds);
			if (selectedTasks.length === 0) {
				return;
			}

			try {
				const response = await fetch(API_ENDPOINTS.makeRunTasks(targetRunId), {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						retryTaskIds: selectedTasks.map((task) => task.id),
					}),
				});
				if (!response.ok) {
					const payload = (await response.json().catch(() => ({}))) as unknown;
					throw new Error(parseErrorMessage(payload));
				}

				const payload = (await response.json()) as { run?: AgentRunListItem };
				const nextRun = payload.run;
				if (nextRun) {
					setRunHistory((previousHistory) => {
						const nextRunsById = new Map(
							previousHistory.map((historyRun) => [historyRun.runId, historyRun] as const),
						);
						nextRunsById.set(nextRun.runId, nextRun);
						return Array.from(nextRunsById.values()).sort(sortRunsByRecency);
					});
				}

				router.push(`/make/runs/${targetRunId}`);
			} catch (error) {
				console.error(
					"[PLAN] Failed to retry run task group:",
					toErrorMessage(error),
				);
			}
		},
		[router, sidebarRunHistory],
	);

	// ---- Context value ----

	const state: MakeState = useMemo(
		() => ({
			sidebarOpen: isOpen,
			sidebarHovered: isHovered,
			prompt,
			isStreaming,
			isSubmitPending,
			chatTabMessages,
			chatTabPrompt,
			chatTabIsStreaming,
			chatTabIsSubmitPending,
			chatTabQueuedPrompts,
			chatTabHistory,
			chatTabActiveChatId,
			chatTabIsGeneratingTitle,
			chatTabPendingTitleChatId,
			chatTabNormalizedMessages,
			chatTabActiveQuestionCard,
			chatTabIsPlanMessageComplete,
			isMakeInterviewActive,
			isMakeToggleActive: chatTabIsPlanMode,
			uiMessages,
			normalizedUiMessages,
			queuedPrompts,
			activeQuestionCard,
			activePlanWidget,
			enrichedPlanTitle,
			isWidgetLoading,
			loadingWidgetType,
			isPlanMessageComplete,
			isExecutionActive,
			executionState,
			runId,
			taskExecutions,
			run,
			agentCount,
			chatHistory: chatTabHistory,
			activeChatId: chatTabActiveChatId,
			sidebarRunHistory,
			hasLoadedRunHistory,
			activeChatTitle: activeChatTabTitle,
			isActiveChatTitlePending: isActiveChatTabTitlePending,
			isGeneratingTitle: chatTabIsGeneratingTitle,
			pendingTitleChatId: chatTabPendingTitleChatId,
		}),
		[
			isOpen,
			isHovered,
			prompt,
			isStreaming,
			isSubmitPending,
			chatTabMessages,
			chatTabPrompt,
			chatTabIsStreaming,
			chatTabIsSubmitPending,
			chatTabQueuedPrompts,
			chatTabHistory,
			chatTabActiveChatId,
			chatTabIsGeneratingTitle,
			chatTabPendingTitleChatId,
			chatTabNormalizedMessages,
			chatTabActiveQuestionCard,
			chatTabIsPlanMessageComplete,
			isMakeInterviewActive,
			chatTabIsPlanMode,
			uiMessages,
			normalizedUiMessages,
			queuedPrompts,
			activeQuestionCard,
			activePlanWidget,
			enrichedPlanTitle,
			isWidgetLoading,
			loadingWidgetType,
			isPlanMessageComplete,
			isExecutionActive,
			executionState,
			runId,
			taskExecutions,
			run,
			agentCount,
			sidebarRunHistory,
			hasLoadedRunHistory,
			activeChatTabTitle,
			isActiveChatTabTitlePending,
		],
	);

	const actions: MakeActions = useMemo(
		() => ({
			setSidebarOpen: setIsOpen,
			handleHoverEnter,
			handleHoverLeave,
			handlePinSidebar,
			setPrompt,
			handleSubmit: handleMakeTabSubmit,
			stopStreaming,
			removeQueuedPrompt,
			handleNewChat: handleNewChatTabChat,
			handleSelectChat: handleSelectChatWithTab,
			handleDeleteChat: handleDeleteChatTabChat,
			handleClarificationSubmit,
			handleClarificationDismiss,
			handleBuild,
			handleSuggestedQuestionClick,
			handleWidgetPrimaryAction,
			handleSelectRun,
			handleDeleteRun,
			handleRetryRunGroup,
			handleAddTask,
			handleCreatePlan,
			handleNewMakeChat: handleNewChatTabChat,
			setChatTabPrompt,
			handleChatTabSubmit,
			stopChatTabStreaming,
			removeChatTabQueuedPrompt,
			handleNewChatTabChat,
			handleSelectChatTabChat: handleSelectChatWithTab,
			handleDeleteChatTabChat,
			handleChatTabSuggestedQuestionClick,
			handleChatTabWidgetPrimaryAction,
			handleChatTabClarificationSubmit,
			handleChatTabClarificationDismiss,
			toggleMakeMode: chatTabTogglePlanMode,
			activateMakeMode,
			deactivateMakeMode,
			setAgentCount,
		}),
		[
			handleHoverEnter,
			handleHoverLeave,
			handlePinSidebar,
			setPrompt,
			handleMakeTabSubmit,
			stopStreaming,
			removeQueuedPrompt,
			handleNewChatTabChat,
			handleSelectChatWithTab,
			handleDeleteChatTabChat,
			handleClarificationSubmit,
			handleClarificationDismiss,
			handleChatTabClarificationSubmit,
			handleChatTabClarificationDismiss,
			handleBuild,
			handleSuggestedQuestionClick,
			handleWidgetPrimaryAction,
			handleSelectRun,
			handleDeleteRun,
			handleRetryRunGroup,
			handleAddTask,
			handleCreatePlan,
			setChatTabPrompt,
			handleChatTabSubmit,
			stopChatTabStreaming,
			removeChatTabQueuedPrompt,
			handleChatTabSuggestedQuestionClick,
			handleChatTabWidgetPrimaryAction,
			chatTabTogglePlanMode,
			activateMakeMode,
			deactivateMakeMode,
		],
	);

	const meta: MakeMeta = useMemo(
		() => ({
			skills,
			agents,
			skillDialogProps,
			agentDialogProps,
			sidebarConfigHandlers,
			importDialog,
			closeImportDialog,
			handleImport,
			deleteAlert,
			closeDeleteAlert,
			handleDeleteConfirm,
		}),
		[skills, agents, skillDialogProps, agentDialogProps, sidebarConfigHandlers, importDialog, closeImportDialog, handleImport, deleteAlert, closeDeleteAlert, handleDeleteConfirm],
	);

	const contextValue: MakeContextValue = useMemo(
		() => ({ state, actions, meta }),
		[state, actions, meta],
	);

	return (
		<MakeContext value={contextValue}>
			{children}
		</MakeContext>
	);
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useMake(): MakeContextValue {
	const context = use(MakeContext);
	if (context === null) {
		throw new Error("useMake must be used within a MakeProvider");
	}
	return context;
}

export function useMakeState(): MakeState {
	return useMake().state;
}

export function useMakeActions(): MakeActions {
	return useMake().actions;
}

export function useMakeMeta(): MakeMeta {
	return useMake().meta;
}
