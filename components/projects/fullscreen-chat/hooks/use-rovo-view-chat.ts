"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useRovoChat } from "@/app/contexts";
import { useSpeechRecognition } from "./use-speech-recognition";
import { useUrlParams } from "./use-url-params";
import {
	buildClarificationMessageMetadata,
	buildClarificationDismissPrompt,
	buildClarificationSummaryPrompt,
	createClarificationSubmission,
	getLatestQuestionCardPayload,
	type ClarificationAnswers,
	type ParsedQuestionCardPayload,
} from "@/components/projects/shared/lib/question-card-widget";
import {
	buildGenerativeWidgetSubmitPrompt,
	type GenerativeWidgetPrimaryActionPayload,
} from "@/components/projects/shared/lib/generative-widget";

export function useRovoViewChat() {
	const [prompt, setPrompt] = useState("");
	const [isChatMode, setIsChatMode] = useState(false);
	const [webResultsEnabled, setWebResultsEnabled] = useState(false);
	const [companyKnowledgeEnabled, setCompanyKnowledgeEnabled] = useState(true);
	const [selectedReasoning, setSelectedReasoning] = useState("deep-research");
	const [contextEnabled, setContextEnabled] = useState(false);

	const {
		uiMessages,
		pendingPrompt,
		setPendingPrompt,
		sendPrompt,
		stopStreaming,
		resetChat,
		isStreaming,
		isSubmitPending,
		queuedPrompts,
		removeQueuedPrompt,
	} = useRovoChat();
	const { name: userName } = useUrlParams();
	const hasProcessedPendingPrompt = useRef(false);

	const { isListening, interimText, toggleDictation } = useSpeechRecognition({
		onFinalTranscript: (transcript) => setPrompt((prev) => prev + transcript),
	});

	const activeQuestionCard = useMemo(
		() => getLatestQuestionCardPayload(uiMessages),
		[uiMessages]
	);

	const buildSendOptions = useCallback(
		() => ({
			userName: userName || undefined,
			smartGeneration: {
				enabled: true,
				surface: "fullscreen" as const,
			},
		}),
		[userName]
	);

	useEffect(() => {
		return () => {
			void stopStreaming();
		};
	}, [stopStreaming]);

	const handleSubmit = useCallback(async () => {
		if (!prompt.trim()) return;

		setIsChatMode(true);
		const currentPrompt = prompt;
		setPrompt("");

		await sendPrompt(currentPrompt, buildSendOptions());
	}, [prompt, sendPrompt, buildSendOptions]);

	const handleSuggestedQuestionClick = useCallback(
		async (question: string) => {
			if (!question.trim()) return;

			setIsChatMode(true);
			await sendPrompt(question, buildSendOptions());
		},
		[sendPrompt, buildSendOptions]
	);

	const handleWidgetPrimaryAction = useCallback(
		async (payload: GenerativeWidgetPrimaryActionPayload) => {
			const submitPrompt = buildGenerativeWidgetSubmitPrompt(payload);
			await sendPrompt(submitPrompt, buildSendOptions());
		},
		[buildSendOptions, sendPrompt]
	);

	const handleBackToStart = useCallback(() => {
		resetChat();
		setPrompt("");
		setIsChatMode(false);
	}, [resetChat]);

	const handleClarificationSubmit = useCallback(
		async (answers: ClarificationAnswers) => {
			if (!activeQuestionCard) {
				return;
			}

			const clarificationSubmission = createClarificationSubmission(
				activeQuestionCard,
				answers
			);
			const clarificationPrompt = buildClarificationSummaryPrompt(
				activeQuestionCard,
				answers
			);

			await sendPrompt(clarificationPrompt, {
				...buildSendOptions(),
				messageMetadata: buildClarificationMessageMetadata(activeQuestionCard, {
					answers,
					status: "answered",
				}),
				clarification: clarificationSubmission,
			});
		},
		[activeQuestionCard, buildSendOptions, sendPrompt]
	);

	const handleClarificationDismiss = useCallback(
		(questionCard: ParsedQuestionCardPayload) => {
			const dismissPrompt = buildClarificationDismissPrompt(questionCard);
			void sendPrompt(dismissPrompt, {
				...buildSendOptions(),
				messageMetadata: buildClarificationMessageMetadata(questionCard, {
					status: "dismissed",
					visibility: "hidden",
				}),
			});
		},
		[buildSendOptions, sendPrompt]
	);

	// Handle pending prompt from external navigation
	useEffect(() => {
		if (hasProcessedPendingPrompt.current) return;
		if (typeof pendingPrompt !== "string" || !pendingPrompt.trim()) return;

		hasProcessedPendingPrompt.current = true;
		const promptToSubmit = pendingPrompt;

		async function submitPendingPrompt() {
			setIsChatMode(true);
			setPendingPrompt(null);

			await sendPrompt(promptToSubmit, buildSendOptions());
		}

		void submitPendingPrompt();
	}, [pendingPrompt, setPendingPrompt, sendPrompt, buildSendOptions]);

	return {
		prompt,
		setPrompt,
		isChatMode,
		uiMessages,
		userName,
		isListening,
		interimText,
		toggleDictation,
		contextEnabled,
		setContextEnabled,
		selectedReasoning,
		setSelectedReasoning,
		webResultsEnabled,
		setWebResultsEnabled,
		companyKnowledgeEnabled,
		setCompanyKnowledgeEnabled,
		queuedPrompts,
		removeQueuedPrompt,
		activeQuestionCard,
		handleSubmit,
		handleSuggestedQuestionClick,
		handleWidgetPrimaryAction,
		handleBackToStart,
		isStreaming,
		isSubmitPending,
		handleClarificationSubmit,
		handleClarificationDismiss,
		stopStreaming,
	};
}
