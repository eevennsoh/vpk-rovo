"use client";

import { useCallback, useRef, useState } from "react";
import { useRovoChat } from "@/app/contexts";
import type { QueuedPromptItem } from "@/app/contexts";
import type { SendPromptOptions } from "@/app/contexts";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import type { FileUIPart } from "ai";

interface UseChatSubmitReturn {
	prompt: string;
	setPrompt: (prompt: string) => void;
	handleSubmit: (message: { text: string; files: FileUIPart[] }) => Promise<void>;
	submitPrompt: (prompt: string, files?: ReadonlyArray<FileUIPart>) => Promise<void>;
	abort: () => void;
	uiMessages: RovoUIMessage[];
	isStreaming: boolean;
	hasInFlightTurn: boolean;
	isSubmitPending: boolean;
	activeRequestStartedAt: number | null;
	queuedPrompts: ReadonlyArray<QueuedPromptItem>;
	removeQueuedPrompt: (id: string) => void;
}

interface UseChatSubmitOptions {
	defaultPromptOptions?: SendPromptOptions;
}

export function useChatSubmit({
	defaultPromptOptions,
}: Readonly<UseChatSubmitOptions> = {}): UseChatSubmitReturn {
	const [prompt, setPrompt] = useState("");
	const isSubmittingRef = useRef(false);
	const {
		uiMessages,
		sendPrompt,
		stopStreaming,
		isStreaming,
		hasInFlightTurn,
		isSubmitPending,
		pendingSubmitStartedAt,
		activePrompt,
		queuedPrompts,
		removeQueuedPrompt,
	} = useRovoChat();

	const submitPrompt = useCallback(
		async (nextPrompt: string, files: ReadonlyArray<FileUIPart> = []) => {
			const promptText = nextPrompt.trim();
			if ((!promptText && files.length === 0) || isSubmittingRef.current) {
				return;
			}

			isSubmittingRef.current = true;
			setPrompt("");

			try {
				await sendPrompt(promptText, defaultPromptOptions, files);
			} finally {
				isSubmittingRef.current = false;
			}
		},
		[defaultPromptOptions, sendPrompt]
	);

	const handleSubmit = useCallback(async ({ files, text }: { text: string; files: FileUIPart[] }) => {
		await submitPrompt(text || prompt, files);
	}, [prompt, submitPrompt]);

	const abort = useCallback(() => {
		stopStreaming();
	}, [stopStreaming]);

	return {
		prompt,
		setPrompt,
		handleSubmit,
		submitPrompt,
		abort,
		uiMessages,
		isStreaming,
		hasInFlightTurn,
		isSubmitPending,
		activeRequestStartedAt: activePrompt?.createdAt ?? pendingSubmitStartedAt,
		queuedPrompts,
		removeQueuedPrompt,
	};
}
