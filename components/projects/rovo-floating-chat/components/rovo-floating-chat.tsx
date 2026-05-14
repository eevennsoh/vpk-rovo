"use client";

import { useCallback, useEffect } from "react";
import { motion } from "motion/react";
import { token } from "@/lib/tokens";
import { useRovoChat } from "@/app/contexts";
import type { RovoSuggestion } from "@/lib/rovo-suggestions";
import ChatGreeting from "@/components/projects/sidebar-chat/components/chat-greeting";
import ChatComposer from "@/components/projects/sidebar-chat/components/chat-composer";
import { useChatSubmit } from "@/components/projects/sidebar-chat/hooks/use-chat-submit";
import FloatingChatHeader from "./floating-chat-header";

export default function RovoFloatingChat() {
	const { chatSurface, closeChat, switchSurface, uiMessages, sendPrompt } = useRovoChat();
	const {
		prompt,
		setPrompt,
		handleSubmit,
		abort,
		isStreaming,
		hasInFlightTurn,
		queuedPrompts,
		removeQueuedPrompt,
	} = useChatSubmit();

	const handleSubmitAndPromote = useCallback(async () => {
		const trimmed = prompt.trim();
		if (!trimmed) return;
		await handleSubmit();
		switchSurface("sidebar");
	}, [prompt, handleSubmit, switchSurface]);

	const handleSuggestionClick = useCallback(
		(suggestion: RovoSuggestion) => {
			void sendPrompt(suggestion.prompt ?? suggestion.label);
			switchSurface("sidebar");
		},
		[sendPrompt, switchSurface]
	);

	useEffect(() => {
		if (chatSurface === "floating" && uiMessages.length > 0) {
			switchSurface("sidebar");
		}
	}, [chatSurface, uiMessages.length, switchSurface]);

	return (
		<motion.div
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: 8 }}
			transition={{ duration: 0.2, ease: [0, 0.4, 0, 1] }}
			className="fixed bottom-6 right-6 z-[510] flex w-[440px] flex-col overflow-hidden rounded-2xl bg-surface-overlay"
			style={{
				boxShadow: token("elevation.shadow.overlay"),
				maxHeight: "calc(100dvh - 96px)",
				willChange: "transform, opacity",
			}}
		>
			<FloatingChatHeader onClose={closeChat} />
			<div className="flex flex-col items-center px-4 pt-2 pb-4">
				<ChatGreeting onSuggestionClick={handleSuggestionClick} />
			</div>
			<ChatComposer
				prompt={prompt}
				isStreaming={isStreaming}
				hasInFlightTurn={hasInFlightTurn}
				queuedPrompts={queuedPrompts}
				onPromptChange={setPrompt}
				onSubmit={handleSubmitAndPromote}
				onStop={abort}
				onRemoveQueuedPrompt={removeQueuedPrompt}
			/>
		</motion.div>
	);
}
