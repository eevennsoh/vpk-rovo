"use client";

import { startTransition, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";
import { ChatTimelineNavigator } from "@/components/blocks/chat-timeline/chat-timeline-navigator";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";
import {
	CHAT_TIMELINE_DEMO_MESSAGES,
	type ChatTimelineMessage,
} from "@/components/blocks/chat-timeline/data/mock-thread";

export interface ChatTimelineProps {
	className?: string;
	description?: string;
	messages?: ReadonlyArray<ChatTimelineMessage>;
	title?: string;
}

function buildJumpTarget(container: HTMLDivElement, element: HTMLDivElement): number {
	const containerRect = container.getBoundingClientRect();
	const elementRect = element.getBoundingClientRect();
	const targetTop =
		container.scrollTop +
		(elementRect.top - containerRect.top) -
		Math.max(40, container.clientHeight * 0.18);

	return Math.max(0, Math.min(targetTop, container.scrollHeight - container.clientHeight));
}

export default function ChatTimeline({
	className,
	description = "Hover the navigator on the right to reopen earlier prompts without breaking your place in the thread.",
	messages = CHAT_TIMELINE_DEMO_MESSAGES,
	title = "Chat Timeline",
}: Readonly<ChatTimelineProps>) {
	const userMessages = useMemo(
		() => messages.filter((message) => message.role === "user"),
		[messages],
	);
	const timelineItems = [...userMessages].reverse().map((message, index) => ({
		id: message.id,
		label: `Prompt ${userMessages.length - index}`,
		text: message.text,
		timestampLabel: message.timestamp,
	}));
	const latestUserMessageId = userMessages.at(-1)?.id ?? null;
	const showTimeline = userMessages.length > 1;
	const shouldReduceMotion = useReducedMotion();
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const messageNodesRef = useRef<Record<string, HTMLDivElement | null>>({});
	const [scrollActiveId, setScrollActiveId] = useState<string | null>(() => userMessages[0]?.id ?? null);
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
	const activeSelectionId = scrollActiveId ?? latestUserMessageId;

	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		function handleScroll() {
			const containerRect = container!.getBoundingClientRect();
			const threshold = containerRect.top + containerRect.height * 0.3;

			let activeId = userMessages[0]?.id ?? null;
			for (const message of userMessages) {
				const node = messageNodesRef.current[message.id];
				if (!node) continue;

				const nodeRect = node.getBoundingClientRect();
				if (nodeRect.top <= threshold) {
					activeId = message.id;
				}
			}

			setScrollActiveId((prev) => (prev === activeId ? prev : activeId));
		}

		container.addEventListener("scroll", handleScroll, { passive: true });
		return () => container.removeEventListener("scroll", handleScroll);
	}, [userMessages]);

	useEffect(() => {
		if (!highlightedMessageId) {
			return;
		}

		const timeoutId = window.setTimeout(() => {
			setHighlightedMessageId((current) =>
				current === highlightedMessageId ? null : current
			);
		}, 1800);

		return () => window.clearTimeout(timeoutId);
	}, [highlightedMessageId]);

	function handleSelectMessage(messageId: string) {
		const scrollContainer = scrollContainerRef.current;
		const messageNode = messageNodesRef.current[messageId];

		startTransition(() => {
			setHighlightedMessageId(messageId);
		});

		if (!scrollContainer || !messageNode) {
			return;
		}

		scrollContainer.scrollTo({
			top: buildJumpTarget(scrollContainer, messageNode),
			behavior: shouldReduceMotion ? "auto" : "smooth",
		});
	}

	return (
		<section
			className={cn(
				"relative overflow-hidden rounded-[30px] border border-white/10 bg-[#141210] text-white",
				className,
			)}
			style={{
				boxShadow: token("elevation.shadow.overlay"),
			}}
		>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_22%),linear-gradient(180deg,_rgba(255,255,255,0.04),_transparent_24%),linear-gradient(135deg,_#171311_0%,_#0f0d0c_100%)]"
			/>
			<div
				aria-hidden
				className="pointer-events-none absolute inset-0 opacity-40 [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_0)] [background-position:0_0] [background-size:18px_18px]"
			/>

			<div className="relative flex flex-col">
				<div className="border-b border-white/8 px-6 pb-5 pt-6 md:px-8">
					<div className="flex flex-wrap items-start justify-between gap-4">
						<div className="max-w-2xl">
							<div className="text-[11px] uppercase tracking-[0.28em] text-white/45">
								Prompt memory
							</div>
							<h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-white">
								{title}
							</h2>
							<p className="mt-3 max-w-xl text-sm leading-6 text-white/62">
								{description}
							</p>
						</div>

						<div className="hidden rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs uppercase tracking-[0.22em] text-white/45 md:flex">
							{userMessages.length} prompts in thread
						</div>
					</div>
				</div>

				<div className="relative">
					{showTimeline ? (
						<ChatTimelineNavigator
							activeItemId={activeSelectionId}
							appearance="inverse"
							className="absolute right-4 top-5 z-20 hidden md:block"
							items={timelineItems}
							onSelectItem={handleSelectMessage}
						/>
					) : null}

					<div
						className="h-[680px] overflow-y-auto px-4 py-6 md:px-8"
						ref={scrollContainerRef}
					>
						<div className="mx-auto flex max-w-3xl flex-col gap-5 pb-20">
							{messages.map((message) => {
								const isUser = message.role === "user";
								const isActive = message.id === highlightedMessageId;

								return (
									<div
										className={cn(
											"flex",
											isUser ? "justify-end" : "justify-start",
										)}
										data-chat-timeline-message-id={message.id}
										key={message.id}
										ref={(node) => {
											messageNodesRef.current[message.id] = node;
										}}
									>
										<article
											className={cn(
												"max-w-[88%] rounded-[26px] border px-5 py-4 transition-all duration-300 md:max-w-[78%]",
												isUser
													? "border-white/10 bg-[linear-gradient(180deg,_rgba(255,255,255,0.1),_rgba(255,255,255,0.05))] text-white"
													: "border-white/8 bg-[#1b1817] text-white/78",
												isActive
													? "scale-[1.01] border-white/28 shadow-[0_0_0_1px_rgba(255,255,255,0.08),0_22px_60px_rgba(0,0,0,0.42)]"
													: null,
											)}
										>
											<div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-white/38">
												<span>{isUser ? "You" : "Assistant"}</span>
												<span className="h-1 w-1 rounded-full bg-white/22" />
												<span>{message.timestamp}</span>
											</div>
											<p
												className={cn(
													"mt-3 whitespace-pre-wrap text-[15px] leading-7 text-inherit",
												)}
											>
												{message.text}
											</p>
										</article>
									</div>
								);
							})}
						</div>
					</div>
				</div>

				<div className="border-t border-white/8 px-6 py-4 md:px-8">
					<div className="flex items-center justify-between gap-4 rounded-[22px] border border-white/8 bg-white/[0.03] px-4 py-3">
						<div>
							<div className="text-[11px] uppercase tracking-[0.22em] text-white/38">
								Desktop-only interaction
							</div>
							<p className="mt-2 text-sm text-white/62">
								Use the timeline to relocate older prompts without scanning the entire thread.
							</p>
						</div>
						<div className="hidden rounded-full border border-white/10 bg-black/20 px-3 py-2 text-xs text-white/45 md:block">
							Notion-inspired floating navigator
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

export type { ChatTimelineMessage } from "@/components/blocks/chat-timeline/data/mock-thread";
