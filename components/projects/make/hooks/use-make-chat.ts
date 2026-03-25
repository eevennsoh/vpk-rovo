"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { QueuedPromptItem, SendPromptOptions } from "@/app/contexts";
import { useCreationModeState, useCreationModeActions } from "@/app/contexts/context-creation-mode";
import type { CreationMode } from "@/app/contexts/context-creation-mode";
import { API_ENDPOINTS } from "@/lib/api-config";
import {
	getMessageText,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import {
	buildClarificationMessageMetadata,
	getLatestQuestionCardPayload,
	buildClarificationDismissPrompt,
	type ClarificationSubmission,
	type ParsedQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import {
	type PlanApprovalDecision,
} from "@/components/projects/shared/lib/plan-approval";
import {
	buildGenerativeWidgetSubmitPrompt,
	type GenerativeWidgetPrimaryActionPayload,
} from "@/components/projects/shared/lib/generative-widget";
import { getLatestPlanWidgetPayload } from "@/components/projects/shared/lib/plan-widget";
import {
	MAKE_INTERVIEW_CONTEXT_DESCRIPTION,
	MAKE_INTERVIEW_FOLLOW_UP_CONTEXT_DESCRIPTION,
	MAKE_MODE_CONTEXT_DESCRIPTION,
	MAKE_MODE_POST_CLARIFICATION_CONTEXT_DESCRIPTION,
	MAKE_MODE_RETRY_PROMPT,
	CHAT_TAB_GUIDANCE_PROMPT,
} from "../lib/make-mode";
import type { ChatHistoryItem } from "../components/sidebar-chat-history";
import {
	MAKE_THREAD_RETENTION_LIMIT,
	createThreadFromPrompt,
	deleteThread,
	getThreadById,
	sortThreadsByUpdatedAtDesc,
	trimTitleText,
	type PlanThread,
	type ThreadCategory,
	updateThreadMessages,
	updateThreadTitle,
	upsertThreadSnapshot,
} from "../lib/thread-store";
import {
	persistThreadToServer,
	updateThreadOnServer,
	deleteThreadOnServer,
	fetchAITitle,
	deriveTitleFromAssistantMessage,
	updateUrlThreadParam,
	areMessageArraysShallowEqual,
	createPlanRequestId,
} from "../lib/thread-api";

type PlanningPhase = "awaiting-plan" | "retrying-missing-plan";

interface ChatRuntime {
	uiMessages: RovoUIMessage[];
	isStreaming: boolean;
	isSubmitPending: boolean;
	sendPrompt: (prompt: string, options?: SendPromptOptions) => Promise<void>;
	stopStreaming: () => Promise<void>;
	replaceMessages: (messages: ReadonlyArray<RovoUIMessage>) => void;
	queuedPrompts: ReadonlyArray<QueuedPromptItem>;
	removeQueuedPrompt: (id: string) => void;
}

interface PlanningSession {
	requestId: string;
	phase: PlanningPhase;
	hasStreamStarted: boolean;
	retryUsed: boolean;
}

interface UsePlanChatReturn {
	prompt: string;
	setPrompt: (value: string) => void;
	isPlanMode: boolean;
	togglePlanMode: () => void;
	isChatMode: boolean;
	isStreaming: boolean;
	isSubmitPending: boolean;
	stopStreaming: () => Promise<void>;
	isGeneratingTitle: boolean;
	pendingTitleChatId: string | null;
	uiMessages: RovoUIMessage[];
	queuedPrompts: ReadonlyArray<QueuedPromptItem>;
	removeQueuedPrompt: (id: string) => void;
	chatHistory: ChatHistoryItem[];
	activeChatId: string | null;
	handleSubmit: () => Promise<void>;
	handleSuggestedQuestionClick: (question: string) => Promise<void>;
	handleWidgetPrimaryAction: (
		payload: GenerativeWidgetPrimaryActionPayload
	) => Promise<void>;
	submitClarification: (
		promptText: string,
		clarification: ClarificationSubmission,
		questionCard?: ParsedQuestionCardPayload
	) => Promise<void>;
	dismissClarification: (
		questionCard: ParsedQuestionCardPayload
	) => Promise<void>;
	sendAgentDirective: (agentName: string, message: string) => Promise<void>;
	handleNewChat: (options?: { clearPrompt?: boolean }) => void;
	handleSelectChat: (id: string) => void;
	handleDeleteChat: (id: string) => void;
	handleDeleteMessage: (messageId: string) => void;
	createThreadWithMessages: (options: {
		title: string;
		messages: ReadonlyArray<RovoUIMessage>;
		status?: "active" | "queued" | "ready";
		sourceChatThreadId?: string;
		sourceChatMessageId?: string;
		setActive?: boolean;
		category?: ThreadCategory;
	}) => Promise<string>;
	appendAssistantTextMessage: (options: {
		text: string;
		threadId?: string | null;
	}) => Promise<void>;
	appendPlanApprovalMarker: (options: {
		decision: PlanApprovalDecision;
		planApprovalPlanKey?: string | null;
		threadId?: string | null;
	}) => Promise<void>;
}

function hasQuestionCardWidget(message: RovoUIMessage): boolean {
	if (message.role !== "assistant") {
		return false;
	}

	return message.parts.some((part) => {
		if (part.type !== "data-widget-data" && part.type !== "data-widget-loading") {
			return false;
		}

		const widgetType = (part as { data?: { type?: unknown } }).data?.type;
		return typeof widgetType === "string" && widgetType === "question-card";
	});
}

function hasClarificationSubmission(message: RovoUIMessage): boolean {
	if (message.role !== "user") {
		return false;
	}

	return message.metadata?.source === "clarification-submit";
}

export function useMakeChat(options: {
	mode?: "make" | "chat";
	syncUrlThreadParam?: boolean;
	chatRuntime: ChatRuntime;
	initialPlanMode?: boolean;
	initialPrompt?: string;
}): UsePlanChatReturn {
	const hookMode = options?.mode ?? "chat";
	const historyCategory: ThreadCategory = "chat";
	const syncUrlThreadParam = options?.syncUrlThreadParam ?? false;
	const [prompt, setPrompt] = useState(() => options.initialPrompt ?? "");
	const [isPlanMode, setIsPlanMode] = useState(() => options.initialPlanMode ?? false);
	const [planningSession, setPlanningSession] =
		useState<PlanningSession | null>(null);
	const [isChatMode, setIsChatMode] = useState(false);
	const [threads, setThreads] = useState<PlanThread[]>([]);
	const [activeChatId, setActiveChatId] = useState<string | null>(null);
	const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
	const [pendingTitleChatId, setPendingTitleChatId] = useState<string | null>(null);
	const pendingTitleChatIdRef = useRef<string | null>(null);
	const activeChatIdRef = useRef<string | null>(null);
	const uiMessagesRef = useRef<RovoUIMessage[]>([]);
	const threadsRef = useRef<PlanThread[]>([]);
	const isRestoringThreadRef = useRef(false);
	const threadTransitionTokenRef = useRef(0);
	const threadTransitionQueueRef = useRef<Promise<void>>(Promise.resolve());
	const {
		uiMessages,
		isStreaming,
		isSubmitPending,
		sendPrompt,
		stopStreaming,
		replaceMessages,
		queuedPrompts,
		removeQueuedPrompt,
	} = options.chatRuntime;

	const hasCompletedInitialMakeInterview = useMemo(
		() =>
			uiMessages.some(hasQuestionCardWidget) ||
			uiMessages.some(hasClarificationSubmission),
		[uiMessages]
	);

	const { mode: creationMode } = useCreationModeState();
	const { clearCreationMode } = useCreationModeActions();
	const creationModeRef = useRef<CreationMode>(null);
	creationModeRef.current = creationMode;

	useEffect(() => {
		return () => {
			void stopStreaming();
		};
	}, [stopStreaming]);

	// Sync activeChatId to URL query param
	useEffect(() => {
		if (!syncUrlThreadParam) {
			return;
		}
		updateUrlThreadParam(isChatMode ? activeChatId : null);
	}, [activeChatId, isChatMode, syncUrlThreadParam]);

	// Restore active thread from URL on mount once threads are loaded
	const hasRestoredFromUrlRef = useRef(false);
	useEffect(() => {
		if (!syncUrlThreadParam || hasRestoredFromUrlRef.current || threads.length === 0) {
			return;
		}
		hasRestoredFromUrlRef.current = true;

		if (typeof window === "undefined") {
			return;
		}
		const params = new URLSearchParams(window.location.search);
		const threadId = params.get("thread");
		if (!threadId) {
			return;
		}

		const thread = getThreadById({ threads, chatId: threadId });
		if (!thread) {
			// Thread not found — clean up the stale URL param
			updateUrlThreadParam(null);
			return;
		}

		replaceMessages(thread.messages);
		setActiveChatId(threadId);
		setIsChatMode(true);
	}, [threads, replaceMessages, syncUrlThreadParam]);

	const pendingTitleMessageRef = useRef<string | null>(null);

	const chatHistory = useMemo<ChatHistoryItem[]>(
		() =>
			threads
				.filter((thread) => thread.category === historyCategory)
				.map((thread) => ({
				id: thread.id,
				title: thread.title,
			})),
		[historyCategory, threads],
	);

	const fetchAndMergeServerThreads = useCallback(() => {
		if (typeof window === "undefined") {
			return;
		}

		fetch(API_ENDPOINTS.chatThreads())
			.then((response) => {
				if (!response.ok) {
					throw new Error(`HTTP ${response.status}`);
				}

				return response.json() as Promise<{ threads?: unknown[] }>;
			})
			.then((data) => {
				const serverThreads = Array.isArray(data.threads)
					? (data.threads
							.map((raw) => {
								if (
									!raw ||
									typeof raw !== "object" ||
									!("id" in raw) ||
									typeof (raw as Record<string, unknown>).id !== "string"
								) {
									return null;
								}

								const record = raw as Record<string, unknown>;
								const createdAt =
									typeof record.createdAt === "string"
										? Date.parse(record.createdAt)
										: typeof record.createdAt === "number"
											? record.createdAt
											: Date.now();
								const updatedAt =
									typeof record.updatedAt === "string"
										? Date.parse(record.updatedAt)
										: typeof record.updatedAt === "number"
											? record.updatedAt
											: createdAt;

								return {
									id: record.id as string,
									title:
										typeof record.title === "string"
											? record.title
											: "New chat",
									messages: Array.isArray(record.messages)
										? (record.messages as RovoUIMessage[])
										: [],
									category: "chat",
									kind: "chat",
									createdAt: Number.isFinite(createdAt)
										? createdAt
										: Date.now(),
									updatedAt: Number.isFinite(updatedAt)
										? updatedAt
										: Date.now(),
								} satisfies PlanThread;
							})
							.filter(Boolean) as PlanThread[])
					: [];

				setThreads((previousThreads) => {
					if (previousThreads.length === 0) {
						return sortThreadsByUpdatedAtDesc(serverThreads);
					}

					const localIds = new Set(previousThreads.map((t) => t.id));
					const newFromServer = serverThreads.filter((t) => !localIds.has(t.id));
					const serverIds = new Set(serverThreads.map((t) => t.id));
					const stillExistLocally = previousThreads.filter((t) => serverIds.has(t.id));

					if (newFromServer.length === 0 && stillExistLocally.length === previousThreads.length) {
						return previousThreads;
					}

					return sortThreadsByUpdatedAtDesc([...stillExistLocally, ...newFromServer]);
				});
			})
			.catch(() => {
				// Silently fall back on server error
			});
	}, []);

	useEffect(() => {
		fetchAndMergeServerThreads();
	}, [fetchAndMergeServerThreads]);

	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				fetchAndMergeServerThreads();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [fetchAndMergeServerThreads]);

	useEffect(() => {
		activeChatIdRef.current = activeChatId;
	}, [activeChatId]);

	useEffect(() => {
		uiMessagesRef.current = uiMessages;
	}, [uiMessages]);

	useEffect(() => {
		threadsRef.current = threads;
	}, [threads]);

	const enqueueThreadTransition = useCallback(
		(operation: () => Promise<void>) => {
			const runTransition = async () => {
				const transitionToken = threadTransitionTokenRef.current + 1;
				threadTransitionTokenRef.current = transitionToken;
				isRestoringThreadRef.current = true;

				try {
					await operation();
				} finally {
					if (threadTransitionTokenRef.current === transitionToken) {
						isRestoringThreadRef.current = false;
					}
				}
			};

			const queuedTransition = threadTransitionQueueRef.current.then(
				runTransition,
				runTransition,
			);
			threadTransitionQueueRef.current = queuedTransition.catch(() => undefined);
			return queuedTransition;
		},
		[],
	);

	const snapshotThreadMessages = useCallback(
		(chatId: string | null, messages: ReadonlyArray<RovoUIMessage>) => {
			if (!chatId) {
				return;
			}

			setThreads((previousThreads) => {
				const currentThread = getThreadById({
					threads: previousThreads,
					chatId,
				});
				if (!currentThread) {
					return previousThreads;
				}

				if (areMessageArraysShallowEqual(currentThread.messages, messages)) {
					return previousThreads;
				}

				return updateThreadMessages({
					threads: previousThreads,
					chatId,
					messages,
					updatedAt: Date.now(),
					maxThreads: MAKE_THREAD_RETENTION_LIMIT,
				});
			});

			updateThreadOnServer(chatId, {
				messages: [...messages],
				updatedAt: new Date().toISOString(),
			});
		},
		[],
	);

	const transitionChatState = useCallback(
		(options: {
			nextChatId: string | null;
			nextMessages: ReadonlyArray<RovoUIMessage>;
			nextIsChatMode: boolean;
			snapshotCurrent?: boolean;
			clearPrompt?: boolean;
		}) => {
			const {
				nextChatId,
				nextMessages,
				nextIsChatMode,
				snapshotCurrent = true,
				clearPrompt = true,
			} = options;

			return enqueueThreadTransition(async () => {
				if (snapshotCurrent) {
					snapshotThreadMessages(activeChatIdRef.current, uiMessagesRef.current);
				}

				// Clear composer input before awaiting async work so follow-up
				// prompt presets (for entry intents) are not overwritten later.
				if (clearPrompt) {
					setPrompt("");
				}

				await stopStreaming();
				replaceMessages(nextMessages);
				setPlanningSession(null);
				setIsChatMode(nextIsChatMode);
				setActiveChatId(nextChatId);
			});
		},
		[enqueueThreadTransition, replaceMessages, snapshotThreadMessages, stopStreaming],
	);

	useEffect(() => {
		if (isRestoringThreadRef.current || !activeChatId) {
			return;
		}

		const scheduledTransitionToken = threadTransitionTokenRef.current;
		queueMicrotask(() => {
			if (isRestoringThreadRef.current) {
				return;
			}
			if (scheduledTransitionToken !== threadTransitionTokenRef.current) {
				return;
			}
			if (activeChatIdRef.current !== activeChatId) {
				return;
			}

			snapshotThreadMessages(activeChatId, uiMessagesRef.current);
		});
	}, [activeChatId, snapshotThreadMessages, uiMessages]);

	const resolveChatTitle = useCallback((chatId: string, title: string) => {
		const normalizedTitle = trimTitleText(title);
		if (!normalizedTitle) {
			return;
		}

		setThreads((previousThreads) =>
			updateThreadTitle({
				threads: previousThreads,
				chatId,
				title: normalizedTitle,
				updatedAt: Date.now(),
				maxThreads: MAKE_THREAD_RETENTION_LIMIT,
			})
		);

		updateThreadOnServer(chatId, {
			title: normalizedTitle,
			updatedAt: new Date().toISOString(),
		});

		if (pendingTitleChatIdRef.current === chatId) {
			pendingTitleChatIdRef.current = null;
			setPendingTitleChatId(null);
			setIsGeneratingTitle(false);
		}
	}, []);

	const resolveFallbackTitle = useCallback(
		(chatId: string): boolean => {
			const assistantMessageWithText = uiMessagesRef.current.find((message) => {
				if (message.role !== "assistant") {
					return false;
				}

				return getMessageText(message).length > 0;
			});

			if (!assistantMessageWithText) {
				return false;
			}

			const assistantText = getMessageText(assistantMessageWithText);
			const fallbackTitle = deriveTitleFromAssistantMessage(assistantText);
			if (!fallbackTitle) {
				return false;
			}

			resolveChatTitle(chatId, fallbackTitle);
			return true;
		},
		[resolveChatTitle],
	);

	const createChatEntry = useCallback(
		(
			firstMessage: string,
			options?: {
				category?: ThreadCategory;
				sourceChatThreadId?: string;
				sourceChatMessageId?: string;
				origin?: "chat" | "make";
			},
		) => {
		// Prevent the URL-restore effect from firing after we create a new thread.
		// Without this, the restore effect sees the new thread (with empty messages)
		// and calls replaceMessages([]), wiping out the in-progress stream.
		hasRestoredFromUrlRef.current = true;
		const thread = createThreadFromPrompt({
			promptText: firstMessage,
			category: options?.category ?? "chat",
		});
		setThreads((previousThreads) =>
			upsertThreadSnapshot({
				threads: previousThreads,
				thread,
				maxThreads: MAKE_THREAD_RETENTION_LIMIT,
			})
		);
		setActiveChatId(thread.id);
		setIsGeneratingTitle(true);
		setPendingTitleChatId(thread.id);
		pendingTitleChatIdRef.current = thread.id;
		pendingTitleMessageRef.current = firstMessage;
		persistThreadToServer(thread);
		return thread.id;
	}, []);

	// Generate title via AI Gateway immediately when the user sends a message.
	// This runs in parallel with the RovoDev chat stream — no conflict since
	// title generation uses AI Gateway only (backendPreference: "ai-gateway").
	useEffect(() => {
		if (!pendingTitleChatId || !pendingTitleMessageRef.current) {
			return;
		}

		const isTitleStillPending = pendingTitleChatIdRef.current === pendingTitleChatId;
		if (!isTitleStillPending) {
			return;
		}

		const chatId = pendingTitleChatId;
		const message = pendingTitleMessageRef.current;
		pendingTitleMessageRef.current = null;

		void fetchAITitle(message).then((aiTitle) => {
			if (aiTitle) {
				resolveChatTitle(chatId, aiTitle);
				return;
			}

			if (resolveFallbackTitle(chatId)) {
				return;
			}

			// Clear generating state so the sidebar doesn't stay in skeleton loading
			if (pendingTitleChatIdRef.current === chatId) {
				pendingTitleChatIdRef.current = null;
				setPendingTitleChatId(null);
				setIsGeneratingTitle(false);
			}
		});
	}, [pendingTitleChatId, resolveChatTitle, resolveFallbackTitle]);

	const setPlanModeEnabled = useCallback((enabled: boolean) => {
		setIsPlanMode(enabled);
		if (!enabled) {
			setPlanningSession(null);
		}
	}, []);

	const sendAgentsPrompt = useCallback(
		async (nextPrompt: string) => {
			if (!nextPrompt.trim()) {
				return;
			}

			const activeCreationMode = creationModeRef.current;
			const usePlanMode = hookMode === "make" || isPlanMode;

			if (usePlanMode) {
				const requestId = createPlanRequestId();
				setPlanningSession({
					requestId,
					phase: "awaiting-plan",
					hasStreamStarted: false,
					retryUsed: false,
				});

				// Make mode uses interview-specific context; plan mode uses
				// generic make-mode context on the initial turn.
				const initialContextDescription = hookMode === "make"
					? MAKE_INTERVIEW_CONTEXT_DESCRIPTION
					: MAKE_MODE_CONTEXT_DESCRIPTION;
				const contextDescription = hasCompletedInitialMakeInterview
					? MAKE_INTERVIEW_FOLLOW_UP_CONTEXT_DESCRIPTION
					: initialContextDescription;

				await sendPrompt(nextPrompt, {
					contextDescription,
					planRequestId: requestId,
					creationMode: activeCreationMode ?? undefined,
				});
				if (activeCreationMode) {
					clearCreationMode();
				}
				return;
			}

			// Chat mode: free-form, with optional guidance
			await sendPrompt(nextPrompt, {
				contextDescription: CHAT_TAB_GUIDANCE_PROMPT,
				creationMode: activeCreationMode ?? undefined,
			});
			if (activeCreationMode) {
				clearCreationMode();
			}
		},
		[
			hookMode,
			isPlanMode,
			sendPrompt,
			clearCreationMode,
			hasCompletedInitialMakeInterview,
		],
	);

	useEffect(() => {
		if (!planningSession) {
			return;
		}

		if (isStreaming) {
			if (!planningSession.hasStreamStarted) {
				queueMicrotask(() => {
					setPlanningSession((previousSession) => {
						if (!previousSession || previousSession.hasStreamStarted) {
							return previousSession;
						}

						return {
							...previousSession,
							hasStreamStarted: true,
						};
					});
				});
			}
			return;
		}

		if (!planningSession.hasStreamStarted) {
			return;
		}

		const latestPlanWidget = getLatestPlanWidgetPayload(uiMessages);
		const hasGeneratedPlan = Boolean(
			latestPlanWidget && latestPlanWidget.tasks.length > 0
		);
		const isAwaitingClarificationAnswers =
			getLatestQuestionCardPayload(uiMessages) !== null;

		if (hasGeneratedPlan) {
			queueMicrotask(() => {
				setPlanningSession(null);
			});
			return;
		}

		if (isAwaitingClarificationAnswers) {
			return;
		}

		if (planningSession.retryUsed) {
			queueMicrotask(() => {
				setPlanModeEnabled(false);
			});
			return;
		}

		const retryRequestId = planningSession.requestId;
		queueMicrotask(() => {
			setPlanningSession((previousSession) => {
				if (!previousSession) {
					return previousSession;
				}

				return {
					...previousSession,
					phase: "retrying-missing-plan",
					retryUsed: true,
					hasStreamStarted: false,
				};
			});
		});

		void sendPrompt(MAKE_MODE_RETRY_PROMPT, {
			contextDescription: MAKE_MODE_POST_CLARIFICATION_CONTEXT_DESCRIPTION,
			planRequestId: retryRequestId,
			messageMetadata: {
				visibility: "hidden",
				source: "plan-retry",
			},
		});
	}, [
		planningSession,
		isStreaming,
		sendPrompt,
		setPlanModeEnabled,
		uiMessages,
	]);

	const submitClarification = useCallback(
		async (
			promptText: string,
			clarification: ClarificationSubmission,
			questionCard?: ParsedQuestionCardPayload
		) => {
			if (!promptText.trim()) {
				return;
			}

			const clarificationMetadata = questionCard
				? buildClarificationMessageMetadata(questionCard, {
					answers: clarification.answers,
					status: "answered",
				})
				: {
					source: "clarification-submit" as const,
				};

			await sendPrompt(promptText, {
				contextDescription: isPlanMode
					? MAKE_MODE_POST_CLARIFICATION_CONTEXT_DESCRIPTION
					: undefined,
				planRequestId: planningSession?.requestId,
				clarification,
				messageMetadata: clarificationMetadata,
			});
		},
		[planningSession?.requestId, isPlanMode, sendPrompt],
	);

	const dismissClarification = useCallback(
		async (questionCard: ParsedQuestionCardPayload) => {
			const dismissPrompt = buildClarificationDismissPrompt(questionCard);
			await sendPrompt(dismissPrompt, {
				contextDescription: isPlanMode
					? MAKE_MODE_POST_CLARIFICATION_CONTEXT_DESCRIPTION
					: undefined,
				planRequestId: planningSession?.requestId,
				messageMetadata: buildClarificationMessageMetadata(questionCard, {
					status: "dismissed",
					visibility: "hidden",
				}),
			});
		},
		[planningSession?.requestId, isPlanMode, sendPrompt],
	);

	const sendAgentDirective = useCallback(
		async (agentName: string, message: string) => {
			const trimmed = message.trim();
			if (!trimmed) {
				return;
			}

			await sendPrompt(`@${agentName}: ${trimmed}`, {
				messageMetadata: {
					visibility: "hidden",
					source: "agent-directive",
				},
			});
		},
		[sendPrompt],
	);

	const ensureChatMode = useCallback(
		(promptText: string) => {
			if (!isChatMode || activeChatIdRef.current === null) {
				setIsChatMode(true);
				createChatEntry(promptText, {
					category: "chat",
					origin: hookMode === "make" ? "make" : "chat",
				});
			}
		},
		[createChatEntry, hookMode, isChatMode],
	);

	const handleSubmit = useCallback(async () => {
		if (!prompt.trim()) {
			return;
		}

		if (isPlanMode && planningSession !== null) {
			return;
		}

		const currentPrompt = prompt;
		setPrompt("");
		ensureChatMode(currentPrompt);
		await sendAgentsPrompt(currentPrompt);
	}, [
		prompt,
		isPlanMode,
		planningSession,
		ensureChatMode,
		sendAgentsPrompt,
	]);

	const handleSuggestedQuestionClick = useCallback(
		async (question: string) => {
			if (!question.trim()) {
				return;
			}

			if (isPlanMode && planningSession !== null) {
				return;
			}

			ensureChatMode(question);
			await sendAgentsPrompt(question);
		},
		[
			isPlanMode,
			planningSession,
			ensureChatMode,
			sendAgentsPrompt,
		],
	);

	const handleWidgetPrimaryAction = useCallback(
		async (payload: GenerativeWidgetPrimaryActionPayload) => {
			const submitPrompt = buildGenerativeWidgetSubmitPrompt(payload);
			if (!submitPrompt.trim()) {
				return;
			}

			ensureChatMode(submitPrompt);
			await sendAgentsPrompt(submitPrompt);
		},
		[ensureChatMode, sendAgentsPrompt],
	);

	const clearPendingTitleState = useCallback(() => {
		setIsGeneratingTitle(false);
		setPendingTitleChatId(null);
		pendingTitleChatIdRef.current = null;
		pendingTitleMessageRef.current = null;
	}, []);

	const handleNewChat = useCallback((options?: { clearPrompt?: boolean }) => {
		const shouldClearPrompt = options?.clearPrompt ?? true;
		void transitionChatState({
			nextChatId: null,
			nextMessages: [],
			nextIsChatMode: false,
			clearPrompt: shouldClearPrompt,
		})
			.catch((error) => {
				console.error("[AGENTS-TEAM] Failed to start new chat:", error);
			})
			.finally(() => {
				clearPendingTitleState();
			});
	}, [clearPendingTitleState, transitionChatState]);

	const handleSelectChat = useCallback(
		(id: string) => {
			if (activeChatIdRef.current === id) {
				return;
			}

			const selectedThread = getThreadById({
				threads: threadsRef.current,
				chatId: id,
			});
			if (!selectedThread) {
				return;
			}

			void transitionChatState({
				nextChatId: id,
				nextMessages: selectedThread.messages,
				nextIsChatMode: true,
			}).catch((error) => {
				console.error("[AGENTS-TEAM] Failed to switch chat thread:", error);
			});
		},
		[transitionChatState],
	);

	const handleDeleteChat = useCallback(
		(id: string) => {
			setThreads((previousThreads) =>
				deleteThread({
					threads: previousThreads,
					chatId: id,
				})
			);

			deleteThreadOnServer(id);

			if (pendingTitleChatIdRef.current === id) {
				clearPendingTitleState();
			}

			// If deleting the active chat, go back to composer
			if (activeChatIdRef.current === id) {
				void transitionChatState({
					nextChatId: null,
					nextMessages: [],
					nextIsChatMode: false,
					snapshotCurrent: false,
				})
					.catch((error) => {
						console.error("[AGENTS-TEAM] Failed to clear deleted chat:", error);
					})
					.finally(() => {
						clearPendingTitleState();
					});
			}
		},
		[clearPendingTitleState, transitionChatState],
	);

	const handleDeleteMessage = useCallback(
		(messageId: string) => {
			const currentMessages = uiMessagesRef.current;
			const messageIndex = currentMessages.findIndex((m) => m.id === messageId);
			if (messageIndex < 0) {
				return;
			}

			const remainingMessages = currentMessages.slice(0, messageIndex);

			if (remainingMessages.length === 0) {
				const chatId = activeChatIdRef.current;
				if (chatId) {
					setThreads((prev) => deleteThread({ threads: prev, chatId }));
					deleteThreadOnServer(chatId);
					if (pendingTitleChatIdRef.current === chatId) {
						clearPendingTitleState();
					}
				}

				void transitionChatState({
					nextChatId: null,
					nextMessages: [],
					nextIsChatMode: false,
					snapshotCurrent: false,
				})
					.catch((error) => {
						console.error("[AGENTS-TEAM] Failed to remove final message:", error);
					})
					.finally(() => {
						clearPendingTitleState();
					});
			} else {
				const activeChatForSnapshot = activeChatIdRef.current;
				void transitionChatState({
					nextChatId: activeChatForSnapshot,
					nextMessages: remainingMessages,
					nextIsChatMode: true,
					snapshotCurrent: false,
					clearPrompt: false,
				})
					.then(() => {
						snapshotThreadMessages(activeChatForSnapshot, remainingMessages);
					})
					.catch((error) => {
						console.error("[AGENTS-TEAM] Failed to delete message:", error);
					});
			}
		},
		[clearPendingTitleState, snapshotThreadMessages, transitionChatState],
	);

	const togglePlanMode = useCallback(() => {
		setIsPlanMode((prev) => {
			const next = !prev;
			if (!next) {
				setPlanningSession(null);
			}

			return next;
		});
	}, []);

	const createThreadWithMessages = useCallback(
		async (options: {
			title: string;
			messages: ReadonlyArray<RovoUIMessage>;
			status?: "active" | "queued" | "ready";
			sourceChatThreadId?: string;
			sourceChatMessageId?: string;
			setActive?: boolean;
			category?: ThreadCategory;
		}) => {
			const now = Date.now();
			const category = options.category ?? "chat";
			const title = trimTitleText(options.title) || "New chat";
			const threadId =
				typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
					? crypto.randomUUID()
					: `thread-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
			const thread: PlanThread = {
				id: threadId,
				title,
				messages: [...options.messages],
				category,
				kind: category,
				status: options.status,
				createdAt: now,
				updatedAt: now,
			};

			setThreads((previousThreads) =>
				upsertThreadSnapshot({
					threads: previousThreads,
					thread,
					maxThreads: MAKE_THREAD_RETENTION_LIMIT,
				})
			);
			persistThreadToServer(thread);

			if (options.setActive) {
				await transitionChatState({
					nextChatId: thread.id,
					nextMessages: thread.messages,
					nextIsChatMode: true,
				});
			}

			return thread.id;
		},
		[transitionChatState],
	);

	const appendAssistantTextMessage = useCallback(
		async (options: { text: string; threadId?: string | null }) => {
			const text = options.text.trim();
			if (!text) {
				return;
			}
			const targetThreadId = options.threadId ?? activeChatIdRef.current;
			if (!targetThreadId) {
				return;
			}

			const assistantMessage: RovoUIMessage = {
				id: `assistant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
				role: "assistant",
				parts: [
					{
						type: "text",
						text,
						state: "done",
					},
				],
			};

			let nextMessages: RovoUIMessage[] | null = null;
			setThreads((previousThreads) => {
				const thread = getThreadById({
					threads: previousThreads,
					chatId: targetThreadId,
				});
				if (!thread) {
					return previousThreads;
				}
				nextMessages = [...thread.messages, assistantMessage];
				return updateThreadMessages({
					threads: previousThreads,
					chatId: targetThreadId,
					messages: nextMessages,
					updatedAt: Date.now(),
					maxThreads: MAKE_THREAD_RETENTION_LIMIT,
				});
			});

			if (activeChatIdRef.current === targetThreadId && nextMessages) {
				replaceMessages(nextMessages);
			}

			if (nextMessages) {
				updateThreadOnServer(targetThreadId, {
					messages: nextMessages,
					updatedAt: new Date().toISOString(),
				});
			}
		},
		[replaceMessages],
	);

	const appendPlanApprovalMarker = useCallback(
		async (options: {
			decision: PlanApprovalDecision;
			planApprovalPlanKey?: string | null;
			threadId?: string | null;
		}) => {
			const targetThreadId = options.threadId ?? activeChatIdRef.current;
			if (!targetThreadId) {
				return;
			}

			const planApprovalPlanKey = options.planApprovalPlanKey ?? null;
			let shouldPersistUpdate = false;
			let nextMessages: RovoUIMessage[] | null = null;
			setThreads((previousThreads) => {
				const thread = getThreadById({
					threads: previousThreads,
					chatId: targetThreadId,
				});
				if (!thread) {
					return previousThreads;
				}

				const hasMatchingMarker = thread.messages.some((message) => {
					if (message.role !== "user") {
						return false;
					}

					if (message.metadata?.source !== "plan-approval-submit") {
						return false;
					}

					return (
						message.metadata?.planApprovalDecision === options.decision &&
						message.metadata?.planApprovalPlanKey === planApprovalPlanKey
					);
				});
				if (hasMatchingMarker) {
					return previousThreads;
				}

				const approvalMarkerMessage: RovoUIMessage = {
					id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
					role: "user",
					parts: [
						{
							type: "text",
							text: "Plan approval submitted.",
							state: "done",
						},
					],
					metadata: {
						visibility: "hidden",
						source: "plan-approval-submit",
						planApprovalDecision: options.decision,
						planApprovalPlanKey: planApprovalPlanKey ?? undefined,
					},
				};

				nextMessages = [...thread.messages, approvalMarkerMessage];
				shouldPersistUpdate = true;
				return updateThreadMessages({
					threads: previousThreads,
					chatId: targetThreadId,
					messages: nextMessages,
					updatedAt: Date.now(),
					maxThreads: MAKE_THREAD_RETENTION_LIMIT,
				});
			});

			if (!shouldPersistUpdate || !nextMessages) {
				return;
			}

			if (activeChatIdRef.current === targetThreadId) {
				replaceMessages(nextMessages);
			}

			updateThreadOnServer(targetThreadId, {
				messages: nextMessages,
				updatedAt: new Date().toISOString(),
			});
		},
		[replaceMessages],
	);

	return {
		prompt,
		setPrompt,
		isPlanMode,
		togglePlanMode,
		isChatMode,
		isStreaming,
		isSubmitPending,
		stopStreaming,
		isGeneratingTitle,
		pendingTitleChatId,
		uiMessages,
		queuedPrompts,
		removeQueuedPrompt,
		chatHistory,
		activeChatId,
		handleSubmit,
			handleSuggestedQuestionClick,
			handleWidgetPrimaryAction,
			submitClarification,
			dismissClarification,
			sendAgentDirective,
			handleNewChat,
		handleSelectChat,
		handleDeleteChat,
		handleDeleteMessage,
		createThreadWithMessages,
		appendAssistantTextMessage,
		appendPlanApprovalMarker,
	};
}
