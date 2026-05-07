"use client";

import { useCallback, useRef, useState } from "react";
import { streamTwgChat, type TwgChatFrame, type TwgChatMessage } from "../lib/personal-graph-api";
import type { VaultExplorer } from "../lib/personal-graph-types";

export type TwgChatStatus = "idle" | "streaming" | "done" | "error";

export interface UseTwgChatState {
	error: string | null;
	messages: TwgChatMessage[];
	send: (prompt: string) => Promise<void>;
	status: TwgChatStatus;
	stop: () => void;
	toolEvents: TwgChatFrame[];
}

interface UseTwgChatOptions {
	onGraph?: (explorer: VaultExplorer) => void;
}

export function useTwgChat({ onGraph }: UseTwgChatOptions = {}): UseTwgChatState {
	const [messages, setMessages] = useState<TwgChatMessage[]>([]);
	const [status, setStatus] = useState<TwgChatStatus>("idle");
	const [error, setError] = useState<string | null>(null);
	const [toolEvents, setToolEvents] = useState<TwgChatFrame[]>([]);
	const controllerRef = useRef<AbortController | null>(null);

	const stop = useCallback(() => {
		controllerRef.current?.abort();
		controllerRef.current = null;
	}, []);

	const send = useCallback(async (prompt: string) => {
		const trimmed = prompt.trim();
		if (!trimmed) return;
		stop();
		const controller = new AbortController();
		controllerRef.current = controller;

		const userMessage: TwgChatMessage = { role: "user", content: trimmed };
		const assistantPlaceholder: TwgChatMessage = { role: "assistant", content: "" };
		const conversation: TwgChatMessage[] = [...messages, userMessage];
		setMessages([...conversation, assistantPlaceholder]);
		setToolEvents([]);
		setError(null);
		setStatus("streaming");

		try {
			let assistantText = "";
			for await (const frame of streamTwgChat({ messages: conversation }, { signal: controller.signal })) {
				if (frame.type === "text_delta") {
					assistantText += frame.delta;
					setMessages((current) => {
						const next = [...current];
						const last = next.at(-1);
						if (last && last.role === "assistant") {
							next[next.length - 1] = { ...last, content: assistantText };
						}
						return next;
					});
				} else if (frame.type === "graph") {
					onGraph?.(frame.explorer);
					setToolEvents((current) => [...current, frame]);
				} else if (frame.type === "tool" || frame.type === "tool_result" || frame.type === "thinking") {
					setToolEvents((current) => [...current, frame]);
				} else if (frame.type === "error") {
					setError(frame.error);
				}
			}
			setStatus("done");
		} catch (nextError) {
			if (nextError instanceof Error && nextError.name === "AbortError") {
				setStatus("idle");
				return;
			}
			setError(nextError instanceof Error ? nextError.message : String(nextError));
			setStatus("error");
		} finally {
			controllerRef.current = null;
		}
	}, [messages, onGraph, stop]);

	return { error, messages, send, status, stop, toolEvents };
}
