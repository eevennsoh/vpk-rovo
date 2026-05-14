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
import { useChat } from "@ai-sdk/react";
import { API_ENDPOINTS } from "@/lib/api-config";
import {
	createAssistantTextMessage,
	type RovoMessageMetadata,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import { shouldSendExplicitRovoDevCancel } from "@/lib/rovodev-cancel-strategy";
import { mergeRovoContextDescriptions } from "@/lib/rovo-context";
import type { RovoAppHermesContext } from "@/lib/rovo-app-types";
import {
	buildWorkItemReportRequestContext,
	hasActiveWorkItemContext,
	isWorkItemReportIntent,
	mergeHermesSkillIds,
	VPK_HTML_SKILL_ID,
} from "@/lib/work-item-report-intent";
import {
	isRateLimitError,
	isChatInProgressError,
	getRateLimitRetryCountdownMessage,
	getRateLimitUserMessage,
	RATE_LIMIT_MAX_RETRIES,
	RATE_LIMIT_RETRY_DELAY_MS,
	CHAT_IN_PROGRESS_MAX_RETRIES,
	CHAT_IN_PROGRESS_RETRY_DELAY_MS,
	getChatInProgressRetryCountdownLabel,
	getChatInProgressRetryContent,
	getChatInProgressUserMessage,
} from "@/lib/chat-error-utils";
import { DefaultChatTransport } from "ai";

export interface SendPromptOptions {
	backendPreference?: "rovodev" | "ai-gateway";
	contextDescription?: string;
	hermesContext?: RovoAppHermesContext;
	userName?: string;
	clientTimeZone?: string;
	messageMetadata?: RovoMessageMetadata;
	clarification?: unknown;
	approval?: unknown;
	deferredToolResponse?: {
		tool_call_id: string;
		result: Record<string, string | string[]>;
	};
	planRequestId?: string;
	creationMode?: "skill" | "agent";
	smartGeneration?: {
		enabled?: boolean;
		surface?: string;
		containerWidthPx?: number;
		viewportWidthPx?: number;
		widthClass?: "compact" | "regular" | "wide";
	};
}

export interface QueuedPromptItem {
	id: string;
	text: string;
	options?: SendPromptOptions;
	createdAt: number;
}

type RovoUIMessagePart = RovoUIMessage["parts"][number];
const INLINE_DATA_PLACEHOLDER = "[inline data omitted]";
const CHAT_REQUEST_MAX_BYTES = 4 * 1024 * 1024;
const CHAT_REQUEST_MIN_MESSAGES = 8;
const EXPLICIT_CANCEL_DEBOUNCE_MS = 2_000;
const EXPLICIT_CANCEL_GRACE_MS = 1_200;
const MEDIA_GENERATION_TIMEOUT_MS = 120_000;

function resolveClientTimeZone(explicitTimeZone?: string): string | undefined {
	if (typeof explicitTimeZone === "string" && explicitTimeZone.trim().length > 0) {
		return explicitTimeZone.trim();
	}

	try {
		const inferredTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		return typeof inferredTimeZone === "string" && inferredTimeZone.trim().length > 0
			? inferredTimeZone.trim()
			: undefined;
	} catch {
		return undefined;
	}
}

function buildSendMessageBody(
	options: SendPromptOptions | undefined,
	hasQueuedPrompts: boolean
): Record<string, unknown> {
	return {
		backendPreference: options?.backendPreference,
		contextDescription: options?.contextDescription,
		hermesContext: options?.hermesContext,
		userName: options?.userName,
		clientTimeZone: resolveClientTimeZone(options?.clientTimeZone),
		clarification: options?.clarification,
		approval: options?.approval,
		deferredToolResponse: options?.deferredToolResponse,
		planRequestId: options?.planRequestId,
		creationMode: options?.creationMode,
		smartGeneration: options?.smartGeneration,
		hasQueuedPrompts,
	};
}

function mergePromptOptionObject<T extends object>(
	defaultValue: T | undefined,
	value: T | undefined
): T | undefined {
	if (!defaultValue && !value) {
		return undefined;
	}

	return {
		...(defaultValue ?? {}),
		...(value ?? {}),
	} as T;
}

function mergeHermesContext(
	defaultValue: RovoAppHermesContext | undefined,
	value: RovoAppHermesContext | undefined
): RovoAppHermesContext | undefined {
	if (!defaultValue && !value) {
		return undefined;
	}

	return {
		selectedSkillIds: Array.from(new Set([
			...(defaultValue?.selectedSkillIds ?? []),
			...(value?.selectedSkillIds ?? []),
		])),
		...(defaultValue?.autoSelectedSkillIds || value?.autoSelectedSkillIds
			? {
					autoSelectedSkillIds: Array.from(new Set([
						...(defaultValue?.autoSelectedSkillIds ?? []),
						...(value?.autoSelectedSkillIds ?? []),
					])),
				}
			: {}),
		...(defaultValue?.pendingDraftIds || value?.pendingDraftIds
			? {
					pendingDraftIds: Array.from(new Set([
						...(defaultValue?.pendingDraftIds ?? []),
						...(value?.pendingDraftIds ?? []),
					])),
				}
			: {}),
		...(defaultValue?.recentMemoryProposalIds || value?.recentMemoryProposalIds
			? {
					recentMemoryProposalIds: Array.from(new Set([
						...(defaultValue?.recentMemoryProposalIds ?? []),
						...(value?.recentMemoryProposalIds ?? []),
					])),
				}
			: {}),
	};
}

function resolveWorkItemReportPromptOptions(
	prompt: string,
	options?: SendPromptOptions
): SendPromptOptions | undefined {
	if (!isWorkItemReportIntent(prompt)) {
		return options;
	}

	const reportContextBlock = buildWorkItemReportRequestContext({
		contextDescription: options?.contextDescription,
		promptText: prompt,
		skillId: VPK_HTML_SKILL_ID,
	});
	if (!reportContextBlock) {
		return options;
	}

	const shouldLoadSkill = hasActiveWorkItemContext(options?.contextDescription);

	return {
		...(options ?? {}),
		contextDescription: mergeRovoContextDescriptions(
			options?.contextDescription,
			reportContextBlock
		),
		...(shouldLoadSkill
			? {
					hermesContext: {
						...(options?.hermesContext ?? {}),
						selectedSkillIds: mergeHermesSkillIds(
							options?.hermesContext?.selectedSkillIds,
							VPK_HTML_SKILL_ID
						),
					},
				}
			: {}),
	};
}

function mergeSendPromptOptions(
	defaultOptions?: SendPromptOptions,
	options?: SendPromptOptions
): SendPromptOptions | undefined {
	if (!defaultOptions) return options;
	if (!options) return defaultOptions;

	return {
		...defaultOptions,
		...options,
		contextDescription: mergeRovoContextDescriptions(
			defaultOptions.contextDescription,
			options.contextDescription
		),
		messageMetadata: mergePromptOptionObject(
			defaultOptions.messageMetadata,
			options.messageMetadata
		),
		smartGeneration: mergePromptOptionObject(
			defaultOptions.smartGeneration,
			options.smartGeneration
		),
		hermesContext: mergeHermesContext(
			defaultOptions.hermesContext,
			options.hermesContext
		),
	};
}

function isValidRovoUiMessagePart(part: unknown): part is RovoUIMessagePart {
	return (
		typeof part === "object" &&
		part !== null &&
		typeof (part as { type?: unknown }).type === "string"
	);
}

function isDataUrl(value: string): boolean {
	return /^data:[^,]+,/i.test(value);
}

function sanitizeValueForTransport(value: unknown): unknown {
	if (typeof value === "string") {
		return isDataUrl(value) ? INLINE_DATA_PLACEHOLDER : value;
	}

	if (Array.isArray(value)) {
		let hasChanged = false;
		const next = value.map((item) => {
			const sanitized = sanitizeValueForTransport(item);
			if (sanitized !== item) {
				hasChanged = true;
			}
			return sanitized;
		});
		return hasChanged ? next : value;
	}

	if (!value || typeof value !== "object") {
		return value;
	}

	let hasChanged = false;
	const record = value as Record<string, unknown>;
	const nextRecord: Record<string, unknown> = {};
	for (const [key, item] of Object.entries(record)) {
		const sanitized = sanitizeValueForTransport(item);
		nextRecord[key] = sanitized;
		if (sanitized !== item) {
			hasChanged = true;
		}
	}

	return hasChanged ? nextRecord : value;
}

function sanitizeMessagePartForTransport(part: RovoUIMessagePart): RovoUIMessagePart | null {
	if (part.type === "file" && isDataUrl(part.url)) {
		return null;
	}

	return sanitizeValueForTransport(part) as RovoUIMessagePart;
}

function sanitizeRovoUiMessages(
	messages: ReadonlyArray<RovoUIMessage>
): RovoUIMessage[] {
	let hasChanged = false;

	const nextMessages = messages.map((message) => {
		const nextParts = Array.isArray(message.parts)
			? message.parts.filter(isValidRovoUiMessagePart)
			: [];

		if (nextParts.length !== message.parts.length) {
			hasChanged = true;
			return { ...message, parts: nextParts };
		}

		return message;
	});

	return hasChanged ? nextMessages : (messages as RovoUIMessage[]);
}

function sanitizeMessagesForTransport(
	messages: ReadonlyArray<RovoUIMessage>
): RovoUIMessage[] {
	let hasChanged = false;

	const nextMessages = messages.map((message) => {
		const nextParts: RovoUIMessagePart[] = [];
		let messageChanged = false;
		const messageParts = Array.isArray(message.parts) ? message.parts : [];

		for (const part of messageParts) {
			const sanitizedPart = sanitizeMessagePartForTransport(part);
			if (!sanitizedPart) {
				hasChanged = true;
				messageChanged = true;
				continue;
			}
			if (sanitizedPart !== part) {
				hasChanged = true;
				messageChanged = true;
			}
			nextParts.push(sanitizedPart);
		}

		if (!messageChanged) {
			return message;
		}

		return { ...message, parts: nextParts };
	});

	return hasChanged ? nextMessages : (messages as RovoUIMessage[]);
}

function estimateChatRequestBytes(
	messages: ReadonlyArray<RovoUIMessage>,
	body: Record<string, unknown>
): number {
	try {
		const json = JSON.stringify({
			...body,
			messages,
		});
		return new TextEncoder().encode(json).byteLength;
	} catch {
		return Number.POSITIVE_INFINITY;
	}
}

function trimMessagesForRequestSize(
	messages: ReadonlyArray<RovoUIMessage>,
	body: Record<string, unknown>
): { messages: RovoUIMessage[]; trimmed: boolean } {
	if (messages.length <= CHAT_REQUEST_MIN_MESSAGES) {
		return {
			messages: [...messages],
			trimmed: false,
		};
	}

	const nextMessages = [...messages];
	let trimmed = false;
	while (
		nextMessages.length > CHAT_REQUEST_MIN_MESSAGES &&
		estimateChatRequestBytes(nextMessages, body) > CHAT_REQUEST_MAX_BYTES
	) {
		nextMessages.shift();
		trimmed = true;
	}

	return {
		messages: nextMessages,
		trimmed,
	};
}

function isInvalidPartStateError(error: unknown): boolean {
	return (
		error instanceof TypeError &&
		typeof error.message === "string" &&
		error.message.includes("reading 'state'")
	);
}

function isPayloadTooLargeError(rawMessage?: string): boolean {
	const extractedMessage = extractErrorMessageFromValue(rawMessage);
	if (!extractedMessage) {
		return false;
	}

	const normalized = extractedMessage.toLowerCase();
	return (
		normalized.includes("payloadtoolargeerror") ||
		normalized.includes("payload too large") ||
		normalized.includes("entity too large") ||
		normalized.includes("request entity too large") ||
		normalized.includes("request payload too large")
	);
}

function getPayloadTooLargeUserMessage(): string {
	return "I couldn't process that request because the chat payload is too large (usually from inline image/file history). I trimmed oversized history data, so you can continue chatting.";
}

function createAssistantThinkingStatusMessage(
	id: string,
	label: string,
	content?: string
): RovoUIMessage {
	return {
		id,
		role: "assistant",
		parts: [
			{
				type: "data-thinking-status",
				data: {
					label,
					content,
				},
			},
		],
	};
}

export type ChatSurface = "floating" | "sidebar";

interface RovoChatContextType {
	chatSurface: ChatSurface | null;
	openChat: (surface: ChatSurface) => void;
	switchSurface: (surface: ChatSurface) => void;
	isOpen: boolean;
	toggleChat: () => void;
	closeChat: () => void;
	/**
	 * Whether at least one caller has pinned the floating surface. When pinned,
	 * the floating chat stays mounted across message activity (i.e., the
	 * auto-promote-to-sidebar effect in RovoFloatingChat is disabled). Multiple
	 * callers can pin with different reasons; the floating surface unpins only
	 * after all reasons release.
	 */
	isFloatingPinned: boolean;
	/**
	 * Pin the floating surface for the given reason. If the chat is currently
	 * on the sidebar surface, switches to floating and remembers the prior
	 * surface so it can be restored when the pin releases.
	 */
	pinFloating: (reason: string) => void;
	/**
	 * Release a previously requested floating pin. When the last pin is
	 * released, restores any surface that was active before the first pin.
	 */
	unpinFloating: (reason: string) => void;
	uiMessages: RovoUIMessage[];
	sendPrompt: (prompt: string, options?: SendPromptOptions) => Promise<void>;
	stopStreaming: () => Promise<void>;
	clearSuggestedQuestions: () => void;
	resetChat: () => void;
	replaceMessages: (messages: ReadonlyArray<RovoUIMessage>) => void;
	isStreaming: boolean;
	isMediaGenerating: boolean;
	hasInFlightTurn: boolean;
	isSubmitPending: boolean;
	pendingSubmitStartedAt: number | null;
	pendingPrompt: string | null;
	setPendingPrompt: (prompt: string | null) => void;
	queuedPrompts: ReadonlyArray<QueuedPromptItem>;
	activePrompt: QueuedPromptItem | null;
	removeQueuedPrompt: (id: string) => void;
	clearQueuedPrompts: () => void;
	queueCount: number;
}

const RovoChatContext = createContext<RovoChatContextType | undefined>(undefined);

function extractErrorMessageFromValue(value: unknown): string | null {
	if (typeof value === "string") {
		const trimmed = value.trim();
		return trimmed.length > 0 ? trimmed : null;
	}

	if (!value || typeof value !== "object") {
		return null;
	}

	const record = value as {
		error?: unknown;
		message?: unknown;
		details?: unknown;
	};

	return (
		extractErrorMessageFromValue(record.error) ??
		extractErrorMessageFromValue(record.message) ??
		extractErrorMessageFromValue(record.details)
	);
}

function toUserFacingChatErrorMessage(rawMessage?: string): string {
	const fallback = "Sorry, I hit an error. Please try again.";
	const directMessage = extractErrorMessageFromValue(rawMessage);
	if (!directMessage) {
		return fallback;
	}

	try {
		const parsed = JSON.parse(directMessage) as unknown;
		return extractErrorMessageFromValue(parsed) ?? directMessage;
	} catch {
		return directMessage;
	}
}

function createQueueItemId(fallbackCounter: number): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return `queue-${Date.now()}-${fallbackCounter}`;
}

interface RovoChatProviderProps {
	children: ReactNode;
	defaultPromptOptions?: SendPromptOptions;
	portIndex?: number;
}

export function RovoChatProvider({
	children,
	defaultPromptOptions,
	portIndex,
}: Readonly<RovoChatProviderProps>) {
	const [chatSurface, setChatSurface] = useState<ChatSurface | null>(null);
	const isOpen = chatSurface !== null;
	const [isSubmitPending, setIsSubmitPending] = useState(false);
	const [pendingSubmitStartedAt, setPendingSubmitStartedAt] = useState<number | null>(
		null
	);
	const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
	const [submissionErrorMessage, setSubmissionErrorMessage] =
		useState<RovoUIMessage | null>(null);
	const [queuedPrompts, setQueuedPrompts] = useState<QueuedPromptItem[]>([]);
	const [activePrompt, setActivePrompt] = useState<QueuedPromptItem | null>(null);

	const errorCounterRef = useRef(0);
	const queueIdRef = useRef(0);
	const queuedPromptsRef = useRef<QueuedPromptItem[]>([]);
	const activePromptRef = useRef<QueuedPromptItem | null>(null);
	const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const retryCountdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
		null
	);
	const retryCountRef = useRef(0);
	const lastPromptRef = useRef<{
		text: string;
		options?: SendPromptOptions;
	} | null>(null);
	const isStreamingRef = useRef(false);
	const isDispatchingPromptRef = useRef(false);
	const isCancellingRef = useRef(false);
	const cancelStreamPromiseRef = useRef<Promise<void> | null>(null);
	const lastExplicitCancelAtRef = useRef(0);
	const lastExplicitCancelKeyRef = useRef("");
	const isSubmitPendingRef = useRef(false);
	const shouldFinalizeActivePromptRef = useRef(false);
	const hasTurnCompleteSignalRef = useRef(false);
	const isMediaGeneratingRef = useRef(false);
	const mediaGenerationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [isMediaGenerating, setIsMediaGenerating] = useState(false);
	const maybeFinalizeAndProcessRef = useRef<() => void>(() => {});
	const processNextPromptRef = useRef<() => Promise<void>>(async () => {});
	const sendChatMessageRef = useRef<(promptItem: QueuedPromptItem) => Promise<void>>(async () => {});

	const startSubmitPending = useCallback((startedAt: number) => {
		if (isSubmitPendingRef.current) {
			return;
		}

		isSubmitPendingRef.current = true;
		setIsSubmitPending(true);
		setPendingSubmitStartedAt(startedAt);
	}, []);

	const clearSubmitPending = useCallback(() => {
		if (!isSubmitPendingRef.current) {
			return;
		}

		isSubmitPendingRef.current = false;
		setIsSubmitPending(false);
		setPendingSubmitStartedAt(null);
	}, []);

	const clearRetryCountdownInterval = useCallback(() => {
		if (retryCountdownIntervalRef.current !== null) {
			clearInterval(retryCountdownIntervalRef.current);
			retryCountdownIntervalRef.current = null;
		}
	}, []);

	const cancelRetryTimer = useCallback(() => {
		if (retryTimerRef.current !== null) {
			clearTimeout(retryTimerRef.current);
			retryTimerRef.current = null;
		}
		clearRetryCountdownInterval();
	}, [clearRetryCountdownInterval]);

	const clearMediaGenerating = useCallback(() => {
		if (mediaGenerationTimeoutRef.current !== null) {
			clearTimeout(mediaGenerationTimeoutRef.current);
			mediaGenerationTimeoutRef.current = null;
		}
		if (isMediaGeneratingRef.current) {
			isMediaGeneratingRef.current = false;
			setIsMediaGenerating(false);
		}
	}, []);

	const startRetryCountdown = useCallback(
		(errorMessageId: string) => {
			clearRetryCountdownInterval();
			let secondsRemaining = Math.ceil(RATE_LIMIT_RETRY_DELAY_MS / 1000);

			setSubmissionErrorMessage(
				createAssistantTextMessage(
					errorMessageId,
					getRateLimitRetryCountdownMessage(secondsRemaining)
				)
			);

			retryCountdownIntervalRef.current = setInterval(() => {
				secondsRemaining -= 1;
				if (secondsRemaining <= 0) {
					clearRetryCountdownInterval();
					return;
				}

				setSubmissionErrorMessage(
					createAssistantTextMessage(
						errorMessageId,
						getRateLimitRetryCountdownMessage(secondsRemaining)
					)
				);
			}, 1000);
		},
		[clearRetryCountdownInterval]
	);

	const startChatInProgressRetryCountdown = useCallback(
		(errorMessageId: string) => {
			clearRetryCountdownInterval();
			let secondsRemaining = Math.ceil(CHAT_IN_PROGRESS_RETRY_DELAY_MS / 1000);

			setSubmissionErrorMessage(
				createAssistantThinkingStatusMessage(
					errorMessageId,
					getChatInProgressRetryCountdownLabel(secondsRemaining),
					getChatInProgressRetryContent()
				)
			);

			retryCountdownIntervalRef.current = setInterval(() => {
				secondsRemaining -= 1;
				if (secondsRemaining <= 0) {
					clearRetryCountdownInterval();
					return;
				}

				setSubmissionErrorMessage(
					createAssistantThinkingStatusMessage(
						errorMessageId,
						getChatInProgressRetryCountdownLabel(secondsRemaining),
						getChatInProgressRetryContent()
					)
				);
			}, 1000);
		},
		[clearRetryCountdownInterval]
	);

	useEffect(() => cancelRetryTimer, [cancelRetryTimer]);
	useEffect(() => clearMediaGenerating, [clearMediaGenerating]);

	const queueTick = useCallback(() => {
		Promise.resolve().then(() => {
			maybeFinalizeAndProcessRef.current();
		});
	}, []);

	const transport = useMemo(
		() =>
			new DefaultChatTransport<RovoUIMessage>({
				api: API_ENDPOINTS.CHAT_SDK,
				prepareSendMessagesRequest: ({ messages, body }) => {
					const normalizedMessages = sanitizeRovoUiMessages(messages);
					const sanitizedMessages = sanitizeMessagesForTransport(normalizedMessages);
					const sanitizedBody = sanitizeValueForTransport(
						(body ?? {}) as Record<string, unknown>
					) as Record<string, unknown>;
					const { messages: trimmedMessages, trimmed } = trimMessagesForRequestSize(
						sanitizedMessages,
						sanitizedBody
					);

					return {
						body: {
							...sanitizedBody,
							messages: trimmedMessages,
							payloadTrimmed: trimmed,
							...(portIndex !== undefined ? { portIndex } : {}),
						},
					};
				},
			}),
		[portIndex]
	);

	const {
		messages: rawUiMessages,
		sendMessage,
		setMessages,
		stop,
		status,
	} = useChat<RovoUIMessage>({
		transport,
		onError: (error) => {
			clearSubmitPending();
			errorCounterRef.current += 1;
			const errorMessageId = `error-${errorCounterRef.current}`;
			const userFacingErrorMessage = toUserFacingChatErrorMessage(error.message);
			const hasChatInProgressError =
				isChatInProgressError(error.message) ||
				isChatInProgressError(userFacingErrorMessage);
			const activeQueuedPrompt = activePromptRef.current;

			const removeLatestUserMessage = () => {
				setMessages((prev) => {
					const lastUserIndex = prev.findLastIndex((m) => m.role === "user");
					if (lastUserIndex === -1) {
						return prev;
					}
					return prev.filter((_, i) => i !== lastUserIndex);
				});
			};

			const resendSavedPrompt = async (saved: {
				text: string;
				options?: SendPromptOptions;
			}) => {
				if (isStreamingRef.current) {
					await stop();
				}

				const messagePayload = {
					text: saved.text,
					metadata: saved.options?.messageMetadata,
				};
				const bodyPayload = {
					body: buildSendMessageBody(
						saved.options,
						queuedPromptsRef.current.length > 0
					),
				};

				try {
					await sendMessage(messagePayload, bodyPayload);
				} catch (sendError) {
					if (!isInvalidPartStateError(sendError)) {
						throw sendError;
					}

					setMessages((prev) => sanitizeRovoUiMessages(prev));
					await Promise.resolve();
					await sendMessage(messagePayload, bodyPayload);
				}
			};

			const scheduleRetry = (params: {
				delayMs: number;
				startCountdown: (messageId: string) => void;
				saved: { text: string; options?: SendPromptOptions };
			}) => {
				params.startCountdown(errorMessageId);
				retryTimerRef.current = setTimeout(async () => {
					retryTimerRef.current = null;
					clearRetryCountdownInterval();
					setSubmissionErrorMessage(null);
					removeLatestUserMessage();
					retryCountRef.current += 1;
					shouldFinalizeActivePromptRef.current = false;
					isDispatchingPromptRef.current = true;

					try {
						await resendSavedPrompt(params.saved);
					} catch (retryError) {
						shouldFinalizeActivePromptRef.current = true;
						console.error("[RovoChatProvider] Retry send failed:", retryError);
					} finally {
						isDispatchingPromptRef.current = false;
						queueTick();
					}
				}, params.delayMs);
			};

			if (isRateLimitError(error.message)) {
				if (
					retryCountRef.current < RATE_LIMIT_MAX_RETRIES &&
					activeQueuedPrompt
				) {
					const saved = {
						text: activeQueuedPrompt.text,
						options: activeQueuedPrompt.options,
					};
					lastPromptRef.current = saved;
					scheduleRetry({
						delayMs: RATE_LIMIT_RETRY_DELAY_MS,
						startCountdown: startRetryCountdown,
						saved,
					});
					return;
				}

				retryCountRef.current = 0;
				clearRetryCountdownInterval();
				setSubmissionErrorMessage(
					createAssistantTextMessage(
						errorMessageId,
						getRateLimitUserMessage(RATE_LIMIT_MAX_RETRIES)
					)
				);
				shouldFinalizeActivePromptRef.current = true;
				queueTick();
				return;
			}

			if (hasChatInProgressError) {
				if (
					retryCountRef.current < CHAT_IN_PROGRESS_MAX_RETRIES &&
					activeQueuedPrompt
				) {
					startSubmitPending(Date.now());
					const saved = {
						text: activeQueuedPrompt.text,
						options: activeQueuedPrompt.options,
					};
					lastPromptRef.current = saved;
					scheduleRetry({
						delayMs: CHAT_IN_PROGRESS_RETRY_DELAY_MS,
						startCountdown: startChatInProgressRetryCountdown,
						saved,
					});
					return;
				}

				retryCountRef.current = 0;
				clearRetryCountdownInterval();
				setSubmissionErrorMessage(
					createAssistantTextMessage(
						errorMessageId,
						getChatInProgressUserMessage(CHAT_IN_PROGRESS_MAX_RETRIES)
					)
				);
				shouldFinalizeActivePromptRef.current = true;
				queueTick();
				return;
			}

			clearRetryCountdownInterval();
			if (
				isPayloadTooLargeError(error.message) ||
				isPayloadTooLargeError(userFacingErrorMessage)
			) {
				setMessages((prev) =>
					sanitizeMessagesForTransport(sanitizeRovoUiMessages(prev))
				);
				setSubmissionErrorMessage(
					createAssistantTextMessage(
						errorMessageId,
						getPayloadTooLargeUserMessage()
					)
				);
				shouldFinalizeActivePromptRef.current = true;
				queueTick();
				return;
			}

			setSubmissionErrorMessage(
				createAssistantTextMessage(errorMessageId, userFacingErrorMessage)
			);
			shouldFinalizeActivePromptRef.current = true;
			queueTick();
		},
	});

	const isStreaming = status === "submitted" || status === "streaming";

	useEffect(() => {
		if (
			status !== "submitted" &&
			status !== "streaming" &&
			status !== "error"
		) {
			return;
		}

		if (retryTimerRef.current !== null) {
			return;
		}

		clearSubmitPending();
	}, [clearSubmitPending, status]);

	useEffect(() => {
		isStreamingRef.current = isStreaming;
		if (!isStreaming) {
			queueTick();
		}
	}, [isStreaming, queueTick]);

	// Watch for the data-turn-complete sentinel on the last assistant message.
	// This fires when the backend has finished all post-stream work (suggestions,
	// orchestrator log, etc.) and signals it is safe to advance the queue.
	// Only accept a sentinel whose timestamp is >= the active prompt's createdAt
	// to avoid picking up a stale signal from the previous turn.
	useEffect(() => {
		if (!activePromptRef.current || hasTurnCompleteSignalRef.current) {
			return;
		}

		const activeCreatedAt = activePromptRef.current.createdAt;

		for (let i = rawUiMessages.length - 1; i >= 0; i--) {
			const msg = rawUiMessages[i];
			if (msg.role !== "assistant") {
				continue;
			}

			const turnCompletePart = msg.parts.find(
				(part) => part.type === "data-turn-complete"
			);
			if (!turnCompletePart) {
				break;
			}

			const partData = turnCompletePart as {
				data?: { timestamp?: string };
			};
			const ts = partData.data?.timestamp;
			if (ts && new Date(ts).getTime() >= activeCreatedAt) {
				hasTurnCompleteSignalRef.current = true;
				queueTick();
			}
			break;
		}
	}, [rawUiMessages, queueTick]);

	// Watch for data-widget-loading parts on the last assistant message to track
	// media generation (image/audio) independently from the SSE stream. If the
	// stream drops before the backend emits loading:false, this ref keeps the
	// queue blocked so the next message is not sent prematurely.
	const scheduleMediaGenerationTimeout = useCallback(() => {
		if (mediaGenerationTimeoutRef.current !== null) {
			clearTimeout(mediaGenerationTimeoutRef.current);
		}
		mediaGenerationTimeoutRef.current = setTimeout(() => {
			mediaGenerationTimeoutRef.current = null;
			if (isMediaGeneratingRef.current) {
				isMediaGeneratingRef.current = false;
				setIsMediaGenerating(false);
				queueTick();
			}
		}, MEDIA_GENERATION_TIMEOUT_MS);
	}, [queueTick]);

	useEffect(() => {
		for (let i = rawUiMessages.length - 1; i >= 0; i--) {
			const msg = rawUiMessages[i];
			if (msg.role !== "assistant") {
				continue;
			}

			let latestMediaLoadingPart: { loading: boolean } | null = null;
			for (const part of msg.parts) {
				if (part.type !== "data-widget-loading") {
					continue;
				}
				const partData = part as { data?: { type?: string; loading?: boolean } };
				const widgetType = partData.data?.type;
				if (
					widgetType === "image-preview" ||
					widgetType === "audio-preview" ||
					widgetType === "video-preview"
				) {
					latestMediaLoadingPart = { loading: !!partData.data?.loading };
				}
			}

			if (!latestMediaLoadingPart) {
				break;
			}

			if (latestMediaLoadingPart.loading && !isMediaGeneratingRef.current) {
				isMediaGeneratingRef.current = true;
				setIsMediaGenerating(true);
				scheduleMediaGenerationTimeout();
			} else if (!latestMediaLoadingPart.loading && isMediaGeneratingRef.current) {
				clearMediaGenerating();
				queueTick();
			}
			break;
		}
	}, [rawUiMessages, queueTick, clearMediaGenerating, scheduleMediaGenerationTimeout]);

	const uiMessages = useMemo(() => {
		if (!submissionErrorMessage) {
			return rawUiMessages;
		}

		const hasErrorMessage = rawUiMessages.some(
			(message) => message.id === submissionErrorMessage.id
		);
		if (hasErrorMessage) {
			return rawUiMessages;
		}

		return [...rawUiMessages, submissionErrorMessage];
	}, [rawUiMessages, submissionErrorMessage]);

	const toggleChat = useCallback(
		() => setChatSurface((prev) => (prev === "sidebar" ? null : "sidebar")),
		[]
	);
	const closeChat = useCallback(() => setChatSurface(null), []);
	const openChat = useCallback((surface: ChatSurface) => setChatSurface(surface), []);
	const switchSurface = useCallback(
		(surface: ChatSurface) => setChatSurface(surface),
		[]
	);

	const [floatingPinReasons, setFloatingPinReasons] = useState<ReadonlySet<string>>(
		() => new Set()
	);
	const isFloatingPinned = floatingPinReasons.size > 0;
	// Surface to restore once the last pin releases. Captured on first pin only.
	const surfaceBeforePinRef = useRef<ChatSurface | null>(null);

	const pinFloating = useCallback((reason: string) => {
		setFloatingPinReasons((prev) => {
			if (prev.has(reason)) return prev;
			if (prev.size === 0) {
				// First pin — capture current surface so we can restore it on release.
				// Don't auto-open chat that was closed: only switch from "sidebar".
				setChatSurface((current) => {
					surfaceBeforePinRef.current = current;
					return current === "sidebar" ? "floating" : current;
				});
			}
			const next = new Set(prev);
			next.add(reason);
			return next;
		});
	}, []);

	const unpinFloating = useCallback((reason: string) => {
		setFloatingPinReasons((prev) => {
			if (!prev.has(reason)) return prev;
			const next = new Set(prev);
			next.delete(reason);
			if (next.size === 0) {
				const restored = surfaceBeforePinRef.current;
				surfaceBeforePinRef.current = null;
				setChatSurface((current) => {
					// User closed the chat during the pin — honor that.
					if (current === null) return current;
					// Restore only if the original surface before pinning was sidebar.
					return restored === "sidebar" ? "sidebar" : current;
				});
			}
			return next;
		});
	}, []);

	const clearSuggestedQuestions = useCallback(() => {
		setMessages((prev) =>
			sanitizeRovoUiMessages(prev).map((message) => {
				if (message.role !== "assistant") {
					return message;
				}

				return {
					...message,
					parts: message.parts.filter(
						(part) => part.type !== "data-suggested-questions"
					),
				};
			})
		);
	}, [setMessages]);

	const sendChatMessage = useCallback(
		async (promptItem: QueuedPromptItem) => {
			lastPromptRef.current = {
				text: promptItem.text,
				options: promptItem.options,
			};
			retryCountRef.current = 0;
			setSubmissionErrorMessage(null);

			if (isStreamingRef.current) {
				await stop();
			}

			const messagePayload = {
				text: promptItem.text,
				metadata: promptItem.options?.messageMetadata,
			};
			const bodyPayload = {
				body: buildSendMessageBody(
					promptItem.options,
					queuedPromptsRef.current.length > 0
				),
			};

			try {
				await sendMessage(messagePayload, bodyPayload);
			} catch (error) {
				if (!isInvalidPartStateError(error)) {
					throw error;
				}

				setMessages((prev) => sanitizeRovoUiMessages(prev));
				await Promise.resolve();
				await sendMessage(messagePayload, bodyPayload);
			}
		},
		[sendMessage, setMessages, stop]
	);

	useEffect(() => {
		sendChatMessageRef.current = sendChatMessage;
	}, [sendChatMessage]);

	const finalizeActivePrompt = useCallback(() => {
		if (!activePromptRef.current) {
			return;
		}

		activePromptRef.current = null;
		setActivePrompt(null);
		shouldFinalizeActivePromptRef.current = false;
		hasTurnCompleteSignalRef.current = false;
		retryCountRef.current = 0;
		lastPromptRef.current = null;
		clearMediaGenerating();
	}, [clearMediaGenerating]);

	const maybeFinalizeAndProcess = useCallback(() => {
		const hasActivePrompt = activePromptRef.current !== null;

		if (hasActivePrompt) {
			const canFinalizeFromStreamEnd =
				hasTurnCompleteSignalRef.current && !isStreamingRef.current;
			const canFinalizeFromError =
				shouldFinalizeActivePromptRef.current &&
				!isStreamingRef.current &&
				!isMediaGeneratingRef.current;

			if (
				(canFinalizeFromStreamEnd || canFinalizeFromError) &&
				retryTimerRef.current === null &&
				!isDispatchingPromptRef.current &&
				!isCancellingRef.current
			) {
				finalizeActivePrompt();
			}
		}

		if (!activePromptRef.current && !isCancellingRef.current) {
			void processNextPromptRef.current();
		}
	}, [finalizeActivePrompt]);

	useEffect(() => {
		maybeFinalizeAndProcessRef.current = maybeFinalizeAndProcess;
	}, [maybeFinalizeAndProcess]);

	const processNextPrompt = useCallback(async () => {
		if (
			activePromptRef.current ||
			isDispatchingPromptRef.current ||
			isCancellingRef.current ||
			isStreamingRef.current ||
			isMediaGeneratingRef.current ||
			retryTimerRef.current !== null
		) {
			return;
		}

		const nextPrompt = queuedPromptsRef.current[0];
		if (!nextPrompt) {
			return;
		}

		queuedPromptsRef.current = queuedPromptsRef.current.slice(1);
		setQueuedPrompts((prev) => prev.slice(1));
		activePromptRef.current = nextPrompt;
		setActivePrompt(nextPrompt);
		shouldFinalizeActivePromptRef.current = false;
		hasTurnCompleteSignalRef.current = false;

		isDispatchingPromptRef.current = true;
		try {
			await sendChatMessageRef.current(nextPrompt);
		} catch (error) {
			shouldFinalizeActivePromptRef.current = true;
			console.error("[RovoChatProvider] Failed to send queued prompt:", error);
		} finally {
			isDispatchingPromptRef.current = false;
			if (!isStreamingRef.current && retryTimerRef.current === null) {
				queueTick();
			}
		}
	}, [queueTick]);

	useEffect(() => {
		processNextPromptRef.current = processNextPrompt;
	}, [processNextPrompt]);

	useEffect(() => {
		queuedPromptsRef.current = queuedPrompts;
		queueTick();
	}, [queuedPrompts, queueTick]);

	useEffect(() => {
		if (!isSubmitPendingRef.current) {
			return;
		}

		if (
			queuedPrompts.length > 0 ||
			activePromptRef.current !== null ||
			isDispatchingPromptRef.current ||
			isStreamingRef.current ||
			isCancellingRef.current ||
			retryTimerRef.current !== null
		) {
			return;
		}

		clearSubmitPending();
	}, [clearSubmitPending, queuedPrompts]);

	useEffect(() => {
		activePromptRef.current = activePrompt;
	}, [activePrompt]);

	const sendPrompt = useCallback(
		async (prompt: string, options?: SendPromptOptions) => {
			const trimmedPrompt = prompt.trim();
			if (!trimmedPrompt) {
				return;
			}
			const resolvedOptions = resolveWorkItemReportPromptOptions(
				trimmedPrompt,
				mergeSendPromptOptions(
					defaultPromptOptions,
					options
				)
			);

			const shouldStartSubmitPending =
				!isSubmitPendingRef.current &&
				!isStreamingRef.current &&
				activePromptRef.current === null &&
				!isDispatchingPromptRef.current &&
				!isCancellingRef.current &&
				retryTimerRef.current === null;
			if (shouldStartSubmitPending) {
				startSubmitPending(Date.now());
			}

			const id = createQueueItemId(queueIdRef.current);
			queueIdRef.current += 1;

			setQueuedPrompts((prev) => [
				...prev,
				{
					id,
					text: trimmedPrompt,
					options: resolvedOptions,
					createdAt: Date.now(),
				},
			]);
		},
		[defaultPromptOptions, startSubmitPending]
	);

	const removeQueuedPrompt = useCallback((id: string) => {
		setQueuedPrompts((prev) => prev.filter((prompt) => prompt.id !== id));
	}, []);

	const clearQueuedPrompts = useCallback(() => {
		setQueuedPrompts([]);
	}, []);

	const waitForStreamStop = useCallback(async () => {
		const startedAt = Date.now();
		while (isStreamingRef.current) {
			if (Date.now() - startedAt > EXPLICIT_CANCEL_GRACE_MS) {
				return false;
			}
			await new Promise<void>((resolve) => {
				window.setTimeout(resolve, 25);
			});
		}
		return true;
	}, []);

	const cancelCurrentStream = useCallback(async () => {
		if (cancelStreamPromiseRef.current) {
			await cancelStreamPromiseRef.current;
			return;
		}

		// Skip cancel if no stream is active — avoids sending HTTP requests to
		// RovoDev Serve during startup before the instances are ready.
		if (!isStreamingRef.current) {
			try {
				await stop();
			} catch {}
			return;
		}

		const cancelPromise = (async () => {
			try {
				await stop();
			} catch (error) {
				console.error("[RovoChatProvider] Failed to stop chat stream:", error);
			}

			const stoppedInTime = await waitForStreamStop();

			// Belt-and-suspenders: explicitly tell the backend to cancel the RovoDev
			// stream only if the primary req.on("close") → AbortSignal path did
			// not settle the turn within a short grace period.
			if (
				!shouldSendExplicitRovoDevCancel({
					hasBackgroundCancelableWork: false,
					hasUseChatTurn: true,
					stopSettledInTime: stoppedInTime,
				})
			) {
				return;
			}

			try {
				const cancelKey =
					typeof portIndex === "number" ? `port:${portIndex}` : "default";
				const now = Date.now();
				const recentlyCancelledSameTarget =
					lastExplicitCancelKeyRef.current === cancelKey &&
					now - lastExplicitCancelAtRef.current < EXPLICIT_CANCEL_DEBOUNCE_MS;

				if (!recentlyCancelledSameTarget) {
					lastExplicitCancelKeyRef.current = cancelKey;
					lastExplicitCancelAtRef.current = now;
					const cancelEndpoint =
						typeof portIndex === "number"
							? `${API_ENDPOINTS.CHAT_CANCEL}?portIndex=${encodeURIComponent(String(portIndex))}`
							: API_ENDPOINTS.CHAT_CANCEL;
					await fetch(cancelEndpoint, { method: "POST" });
				}
			} catch {
				// Ignore cancel endpoint errors — the stream may have already ended.
			}
		})();

		cancelStreamPromiseRef.current = cancelPromise;
		try {
			await cancelPromise;
		} finally {
			cancelStreamPromiseRef.current = null;
		}
	}, [portIndex, stop, waitForStreamStop]);

	const stopStreaming = useCallback(async () => {
		if (activePromptRef.current) {
			shouldFinalizeActivePromptRef.current = true;
		}

		clearMediaGenerating();
		clearSubmitPending();
		isCancellingRef.current = true;
		try {
			await cancelCurrentStream();
		} finally {
			isCancellingRef.current = false;
			queueTick();
		}
	}, [cancelCurrentStream, clearMediaGenerating, clearSubmitPending, queueTick]);

	const resetChat = useCallback(() => {
		isCancellingRef.current = true;
		cancelRetryTimer();
		clearMediaGenerating();
		clearSubmitPending();
		retryCountRef.current = 0;
		lastPromptRef.current = null;
		queuedPromptsRef.current = [];
		activePromptRef.current = null;
		shouldFinalizeActivePromptRef.current = false;
		hasTurnCompleteSignalRef.current = false;
		isDispatchingPromptRef.current = false;
		setQueuedPrompts([]);
		setActivePrompt(null);
		setMessages([]);
		setSubmissionErrorMessage(null);

		void cancelCurrentStream().finally(() => {
			// Old stream chunks can still arrive briefly while cancellation settles.
			// Clear message state one more time so the next session starts clean.
			setMessages([]);
			setSubmissionErrorMessage(null);
			isCancellingRef.current = false;
			queueTick();
		});
	}, [
		cancelCurrentStream,
		cancelRetryTimer,
		clearMediaGenerating,
		clearSubmitPending,
		queueTick,
		setMessages,
	]);

	const replaceMessages = useCallback(
		(messages: ReadonlyArray<RovoUIMessage>) => {
			isCancellingRef.current = false;
			cancelRetryTimer();
			clearMediaGenerating();
			clearSubmitPending();
			retryCountRef.current = 0;
			lastPromptRef.current = null;
			queuedPromptsRef.current = [];
			activePromptRef.current = null;
			shouldFinalizeActivePromptRef.current = false;
			hasTurnCompleteSignalRef.current = false;
			isDispatchingPromptRef.current = false;
			setQueuedPrompts([]);
			setActivePrompt(null);
			setSubmissionErrorMessage(null);
			setMessages(sanitizeRovoUiMessages([...messages]));
			queueTick();
		},
		[cancelRetryTimer, clearMediaGenerating, clearSubmitPending, queueTick, setMessages]
	);

	const queueCount = queuedPrompts.length;
	const hasInFlightTurn =
		isSubmitPending ||
		isStreaming ||
		isMediaGenerating ||
		activePrompt !== null;

	return (
		<RovoChatContext
			value={{
				chatSurface,
				openChat,
				switchSurface,
				isOpen,
				toggleChat,
				closeChat,
				isFloatingPinned,
				pinFloating,
				unpinFloating,
				uiMessages,
				sendPrompt,
				stopStreaming,
				clearSuggestedQuestions,
				resetChat,
				replaceMessages,
				isStreaming,
				isMediaGenerating,
				hasInFlightTurn,
				isSubmitPending,
				pendingSubmitStartedAt,
				pendingPrompt,
				setPendingPrompt,
				queuedPrompts,
				activePrompt,
				removeQueuedPrompt,
				clearQueuedPrompts,
				queueCount,
			}}
		>
			{children}
		</RovoChatContext>
	);
}

export function useRovoChat() {
	const context = use(RovoChatContext);
	if (context === undefined) {
		throw new Error("useRovoChat must be used within a RovoChatProvider");
	}
	return context;
}
