"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useRovoChatControls } from "@/app/contexts";
import {
	buildAsxAgentChatContextBar,
	buildAsxAgentChatPlayback,
	type AsxAgentChatScenario,
} from "@/components/projects/jira-golden-journeys-v0/data/agent-chat-data";
import type { ChatContextBarDescriptor } from "@/components/projects/shared/lib/chat-context-bar";

export interface UseAsxAgentChatDemoResult {
	chatContextBar: ChatContextBarDescriptor | null;
	externalThinkingMessageId: string | null;
	openAgentChat: (scenario: AsxAgentChatScenario) => void;
}

export function useAsxAgentChatDemo(): UseAsxAgentChatDemoResult {
	const { openChat, replaceMessages, selectAgent } = useRovoChatControls();
	const [chatContextBar, setChatContextBar] = useState<ChatContextBarDescriptor | null>(null);
	const [externalThinkingMessageId, setExternalThinkingMessageId] = useState<string | null>(null);
	const playbackTokenRef = useRef(0);
	const runCounterRef = useRef(0);
	const timersRef = useRef(new Set<number>());

	const cancelPlayback = useCallback(() => {
		playbackTokenRef.current += 1;
		for (const timer of timersRef.current) {
			window.clearTimeout(timer);
		}
		timersRef.current.clear();
	}, []);

	useEffect(() => cancelPlayback, [cancelPlayback]);

	const openAgentChat = useCallback((scenario: AsxAgentChatScenario) => {
		cancelPlayback();
		const playbackToken = playbackTokenRef.current;
		const runId = `${scenario.issueKey.toLowerCase()}-${runCounterRef.current += 1}`;
		const playback = buildAsxAgentChatPlayback(scenario, runId);

		selectAgent(scenario.agentId, { preserveCurrentThread: true });
		setChatContextBar(buildAsxAgentChatContextBar(scenario));
		openChat("floating");
		setExternalThinkingMessageId(playback.assistantMessageId);

		let elapsedMs = 0;
		playback.frames.forEach((frame, index) => {
			elapsedMs += frame.delayMs;
			const renderFrame = () => {
				if (playbackTokenRef.current !== playbackToken) return;
				replaceMessages([
					playback.userMessage,
					{ id: playback.assistantMessageId, role: "assistant", parts: frame.parts },
				]);
				if (
					index === playback.frames.length - 1
					&& !playback.keepThinkingActiveAfterLastFrame
				) {
					setExternalThinkingMessageId(null);
				}
			};

			if (elapsedMs === 0) {
				renderFrame();
				return;
			}
			const timer = window.setTimeout(() => {
				timersRef.current.delete(timer);
				renderFrame();
			}, elapsedMs);
			timersRef.current.add(timer);
		});
	}, [cancelPlayback, openChat, replaceMessages, selectAgent]);

	return { chatContextBar, externalThinkingMessageId, openAgentChat };
}
