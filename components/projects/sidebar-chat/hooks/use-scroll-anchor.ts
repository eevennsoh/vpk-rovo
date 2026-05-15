"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import type {
	ConversationContextValue,
	ConversationFollowMode,
	GetTargetScrollTop,
	ScrollToBottomOptions,
} from "@/components/ui-ai/conversation";
import {
	getLatestUserMessageId,
} from "@/lib/rovo-ui-messages";
import type { RovoUIMessage } from "@/lib/rovo-ui-messages";
import { resolveRovoAppScrollAnchorLayout } from "@/components/projects/rovo/lib/rovo-app-scroll-anchor";

const LATEST_TURN_SELECTOR = "[data-chat-latest-turn='true']";
const FAST_TURN_SCROLL_ANIMATION = {
	damping: 0.72,
	stiffness: 0.1,
	mass: 0.9,
} as const;

interface UseScrollAnchorOptions {
	uiMessages: RovoUIMessage[];
	isGenerationActive: boolean;
}

interface UseScrollAnchorReturn {
	conversationContextRef: React.RefObject<ConversationContextValue | null>;
	scrollSpacerRef: React.RefObject<HTMLDivElement | null>;
	getLatestTurnTargetTop: GetTargetScrollTop;
	scrollFollowMode: ConversationFollowMode;
}

export function useScrollAnchor({
	isGenerationActive,
	uiMessages,
}: Readonly<UseScrollAnchorOptions>): UseScrollAnchorReturn {
	const conversationContextRef = useRef<ConversationContextValue | null>(null);
	const scrollSpacerRef = useRef<HTMLDivElement>(null);
	const hasInitializedScrollRef = useRef(false);
	const previousLatestUserMessageIdRef = useRef<string | null>(null);
	const pendingAnchorScrollAnimationRef = useRef<ScrollToBottomOptions["animation"]>("instant");
	const [scrollAnchorMessageId, setScrollAnchorMessageId] = useState<string | null>(null);
	const [scrollFollowMode, setScrollFollowMode] = useState<ConversationFollowMode>("bottom");

	const latestUserMessageId = useMemo(
		() => getLatestUserMessageId(uiMessages),
		[uiMessages]
	);

	useEffect(() => {
		const scrollElement = conversationContextRef.current?.scrollRef.current;
		if (!scrollElement) {
			return;
		}

		const hasLatestUserMessage = latestUserMessageId !== null;
		const hasNewUserTurn =
			hasInitializedScrollRef.current &&
			hasLatestUserMessage &&
			latestUserMessageId !== previousLatestUserMessageIdRef.current;
		const shouldActivateTargetFollow =
			isGenerationActive &&
			hasLatestUserMessage &&
			(
				!hasInitializedScrollRef.current ||
				hasNewUserTurn ||
				scrollAnchorMessageId !== latestUserMessageId ||
				scrollFollowMode !== "target"
			);

		if (shouldActivateTargetFollow) {
			pendingAnchorScrollAnimationRef.current = hasInitializedScrollRef.current
				? FAST_TURN_SCROLL_ANIMATION
				: "instant";
			setScrollAnchorMessageId(latestUserMessageId);
			setScrollFollowMode("target");
		} else if (!isGenerationActive && scrollFollowMode !== "bottom") {
			setScrollAnchorMessageId(null);
			setScrollFollowMode("bottom");
		}

		if (!hasInitializedScrollRef.current && !shouldActivateTargetFollow) {
			void conversationContextRef.current?.scrollToBottom({
				animation: "instant",
				ignoreEscapes: true,
			});
		}

		previousLatestUserMessageIdRef.current = latestUserMessageId;
		hasInitializedScrollRef.current = true;
	}, [
		isGenerationActive,
		latestUserMessageId,
		scrollAnchorMessageId,
		scrollFollowMode,
		uiMessages.length,
	]);

	useEffect(() => {
		if (scrollFollowMode !== "target" || !scrollAnchorMessageId) {
			return;
		}

		const frameId = window.requestAnimationFrame(() => {
			void conversationContextRef.current?.scrollToBottom({
				animation: pendingAnchorScrollAnimationRef.current,
				ignoreEscapes: true,
			});
		});

		return () => window.cancelAnimationFrame(frameId);
	}, [scrollAnchorMessageId, scrollFollowMode]);

	useEffect(() => {
		if (scrollFollowMode !== "bottom" || !scrollSpacerRef.current) {
			return;
		}

		scrollSpacerRef.current.style.height = "0px";
	}, [scrollFollowMode]);

	const getLatestTurnTargetTop = useMemo<GetTargetScrollTop>(
		() => (defaultTargetTop, { scrollElement }) => {
			const latestTurnElement = scrollElement.querySelector<HTMLElement>(
				LATEST_TURN_SELECTOR
			);
			if (!latestTurnElement) {
				if (scrollSpacerRef.current) {
					scrollSpacerRef.current.style.height = "0px";
				}
				return defaultTargetTop;
			}

			const scrollRect = scrollElement.getBoundingClientRect();
			const latestTurnRect = latestTurnElement.getBoundingClientRect();
			const { spacerHeight, targetScrollTop } = resolveRovoAppScrollAnchorLayout({
				anchorOffsetTop: latestTurnRect.top - scrollRect.top,
				clientHeight: scrollElement.clientHeight,
				currentSpacerHeight: scrollSpacerRef.current?.offsetHeight ?? 0,
				defaultTargetTop,
				scrollHeight: scrollElement.scrollHeight,
				scrollTop: scrollElement.scrollTop,
			});

			if (scrollSpacerRef.current) {
				scrollSpacerRef.current.style.height = `${spacerHeight}px`;
			}

			return targetScrollTop;
		},
		[]
	);

	return {
		conversationContextRef,
		scrollSpacerRef,
		getLatestTurnTargetTop,
		scrollFollowMode,
	};
}
