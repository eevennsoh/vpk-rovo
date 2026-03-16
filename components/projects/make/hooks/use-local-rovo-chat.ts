"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { API_ENDPOINTS } from "@/lib/api-config";
import {
	createAssistantTextMessage,
	type RovoUIMessage,
} from "@/lib/rovo-ui-messages";
import type { QueuedPromptItem, SendPromptOptions } from "@/app/contexts";

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
	hasQueuedPrompts: boolean,
): Record<string, unknown> {
	return {
		contextDescription: options?.contextDescription,
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

function createQueueItemId(fallbackCounter: number): string {
	if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
		return crypto.randomUUID();
	}

	return `queue-${Date.now()}-${fallbackCounter}`;
}

interface UseLocalRovoChatResult {
	uiMessages: RovoUIMessage[];
	isStreaming: boolean;
	isSubmitPending: boolean;
	sendPrompt: (prompt: string, options?: SendPromptOptions) => Promise<void>;
	stopStreaming: () => Promise<void>;
	replaceMessages: (messages: ReadonlyArray<RovoUIMessage>) => void;
	queuedPrompts: ReadonlyArray<QueuedPromptItem>;
	removeQueuedPrompt: (id: string) => void;
}

export function useLocalRovoChat(): UseLocalRovoChatResult {
	const [isSubmitPending, setIsSubmitPending] = useState(false);
	const [queuedPrompts, setQueuedPrompts] = useState<QueuedPromptItem[]>([]);
	const [activePrompt, setActivePrompt] = useState<QueuedPromptItem | null>(null);

	const queueIdRef = useRef(0);
	const queuedPromptsRef = useRef<QueuedPromptItem[]>([]);
	const activePromptRef = useRef<QueuedPromptItem | null>(null);
	const isDispatchingRef = useRef(false);
	const isStreamingRef = useRef(false);

	const transport = useMemo(
		() =>
			new DefaultChatTransport<RovoUIMessage>({
				api: API_ENDPOINTS.CHAT_SDK,
			}),
		[],
	);

	const {
		messages: rawUiMessages,
		sendMessage,
		setMessages,
		stop,
		status,
	} = useChat<RovoUIMessage>({
		transport,
	});

	const isStreaming = status === "submitted" || status === "streaming";

	useEffect(() => {
		queuedPromptsRef.current = queuedPrompts;
	}, [queuedPrompts]);

	useEffect(() => {
		activePromptRef.current = activePrompt;
	}, [activePrompt]);

	useEffect(() => {
		isStreamingRef.current = isStreaming;
	}, [isStreaming]);

	const dispatchPrompt = useCallback(
		async (item: QueuedPromptItem) => {
			isDispatchingRef.current = true;
			setActivePrompt(item);
			setIsSubmitPending(true);

			try {
				await sendMessage(
					{
						text: item.text,
						metadata: item.options?.messageMetadata,
					},
					{
						body: buildSendMessageBody(
							item.options,
							queuedPromptsRef.current.length > 0,
						),
					},
				);
			} catch (error) {
				const message =
					error instanceof Error && error.message.trim().length > 0
						? error.message.trim()
						: "Sorry, I hit an error. Please try again.";
				setMessages((previousMessages) => [
					...previousMessages,
					createAssistantTextMessage(`local-error-${Date.now()}`, message),
				]);
			} finally {
				setActivePrompt(null);
				setIsSubmitPending(false);
				isDispatchingRef.current = false;
			}
		},
		[sendMessage, setMessages],
	);

	const processQueue = useCallback(async () => {
		if (isDispatchingRef.current || isStreamingRef.current) {
			return;
		}
		if (activePromptRef.current !== null) {
			return;
		}
		if (queuedPromptsRef.current.length === 0) {
			return;
		}

		const [nextPrompt, ...remaining] = queuedPromptsRef.current;
		queuedPromptsRef.current = remaining;
		setQueuedPrompts(remaining);
		await dispatchPrompt(nextPrompt);
	}, [dispatchPrompt]);

	useEffect(() => {
		void processQueue();
	}, [isStreaming, queuedPrompts.length, processQueue]);

	const sendPrompt = useCallback(
		async (prompt: string, options?: SendPromptOptions) => {
			const trimmedPrompt = prompt.trim();
			if (!trimmedPrompt) {
				return;
			}

			const queueItem: QueuedPromptItem = {
				id: createQueueItemId(queueIdRef.current++),
				text: trimmedPrompt,
				options,
				createdAt: Date.now(),
			};

			if (
				isStreamingRef.current ||
				isDispatchingRef.current ||
				activePromptRef.current !== null
			) {
				setQueuedPrompts((previousQueuedPrompts) => [
					...previousQueuedPrompts,
					queueItem,
				]);
				return;
			}

			await dispatchPrompt(queueItem);
		},
		[dispatchPrompt],
	);

	const stopStreaming = useCallback(async () => {
		await stop();
		setIsSubmitPending(false);
		setActivePrompt(null);
	}, [stop]);

	const replaceMessages = useCallback(
		(messages: ReadonlyArray<RovoUIMessage>) => {
			setMessages([...messages]);
		},
		[setMessages],
	);

	const removeQueuedPrompt = useCallback((id: string) => {
		setQueuedPrompts((previousQueuedPrompts) =>
			previousQueuedPrompts.filter((queuedPrompt) => queuedPrompt.id !== id),
		);
	}, []);

	return {
		uiMessages: rawUiMessages,
		isStreaming,
		isSubmitPending,
		sendPrompt,
		stopStreaming,
		replaceMessages,
		queuedPrompts,
		removeQueuedPrompt,
	};
}
