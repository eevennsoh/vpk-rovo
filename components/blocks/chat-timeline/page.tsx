"use client";

import { startTransition, useEffect, useId, useRef, useState, type FocusEvent } from "react";
import { useReducedMotion } from "motion/react";
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

const TIMELINE_CLOSED_SIZE_PX = 48;
const TIMELINE_OPEN_HEIGHT_PX = 492;
const TIMELINE_OPEN_WIDTH_PX = 320;

function toSnippet(text: string, maxLength = 78): string {
	const normalized = text.replace(/\s+/gu, " ").trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}
	return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
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
	const userMessages = messages.filter((message) => message.role === "user");
	const timelineItems = [...userMessages].reverse();
	const latestUserMessageId = userMessages.at(-1)?.id ?? null;
	const showTimeline = userMessages.length > 1;
	const navigatorId = useId();
	const shouldReduceMotion = useReducedMotion();
	const scrollContainerRef = useRef<HTMLDivElement | null>(null);
	const messageNodesRef = useRef<Record<string, HTMLDivElement | null>>({});
	const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
	const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
	const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
	const activeSelectionId = selectedMessageId ?? latestUserMessageId;

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

	function handleBlur(event: FocusEvent<HTMLDivElement>) {
		if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
			return;
		}

		setIsNavigatorOpen(false);
	}

	function handleSelectMessage(messageId: string) {
		const scrollContainer = scrollContainerRef.current;
		const messageNode = messageNodesRef.current[messageId];

		startTransition(() => {
			setSelectedMessageId(messageId);
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
						<div
							className="absolute right-4 top-5 z-20 hidden md:block"
							onBlur={handleBlur}
							onFocusCapture={() => setIsNavigatorOpen(true)}
							onMouseEnter={() => setIsNavigatorOpen(true)}
							onMouseLeave={() => setIsNavigatorOpen(false)}
						>
							<div
								className="relative origin-top-right overflow-hidden border text-left backdrop-blur-xl"
								id={navigatorId}
								style={{
									width: isNavigatorOpen
										? TIMELINE_OPEN_WIDTH_PX
										: TIMELINE_CLOSED_SIZE_PX,
									height: isNavigatorOpen
										? TIMELINE_OPEN_HEIGHT_PX
										: TIMELINE_CLOSED_SIZE_PX,
									borderRadius: isNavigatorOpen ? 28 : 18,
									borderColor: isNavigatorOpen
										? "rgba(255,255,255,0.10)"
										: "rgba(255,255,255,0.08)",
									backgroundColor: isNavigatorOpen
										? "rgba(42,37,36,0.95)"
										: "rgba(255,255,255,0.03)",
									boxShadow: isNavigatorOpen
										? "0 32px 80px rgba(0,0,0,0.48)"
										: "0 14px 36px rgba(0,0,0,0.28)",
									transition: shouldReduceMotion
										? undefined
										: [
											"width 220ms cubic-bezier(0.22, 1, 0.36, 1)",
											"height 220ms cubic-bezier(0.22, 1, 0.36, 1)",
											"border-radius 220ms cubic-bezier(0.22, 1, 0.36, 1)",
											"background-color 180ms ease-out",
											"border-color 180ms ease-out",
											"box-shadow 220ms ease-out",
										].join(", "),
								}}
							>
								<button
									aria-controls={navigatorId}
									aria-expanded={isNavigatorOpen}
									aria-label="Open prompt timeline"
									className={cn(
										"group absolute inset-0 flex items-center justify-center text-white/55 transition-opacity duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/35",
										isNavigatorOpen
											? "pointer-events-none opacity-0"
											: "pointer-events-auto opacity-100 hover:text-white",
									)}
									onClick={() => setIsNavigatorOpen(true)}
									type="button"
								>
									<span className="flex flex-col gap-[4px]">
										<span className="h-[2px] w-5 rounded-full bg-current transition-transform duration-200 group-hover:translate-x-0.5" />
										<span className="h-[2px] w-4 rounded-full bg-current" />
										<span className="h-[2px] w-5 rounded-full bg-current transition-transform duration-200 group-hover:-translate-x-0.5" />
									</span>
								</button>

								<div
									className={cn(
										"absolute inset-0 flex flex-col p-2 text-left transition-opacity duration-150",
										isNavigatorOpen
											? "pointer-events-auto opacity-100"
											: "pointer-events-none opacity-0",
									)}
								>
									<div className="px-3 pb-2 pt-2">
										<div className="text-[11px] uppercase tracking-[0.22em] text-white/42">
											Prompt timeline
										</div>
										<p className="mt-2 text-sm leading-5 text-white/72">
											Jump to an earlier user prompt in the current thread.
										</p>
									</div>

									<div className="min-h-0 flex-1 space-y-1 overflow-y-auto pr-1">
										{timelineItems.map((message, index) => {
											const isActive = message.id === activeSelectionId;
											return (
												<button
													className={cn(
														"flex w-full flex-col rounded-[18px] border px-3 py-3 text-left transition-colors duration-150",
														isActive
															? "border-white/16 bg-white/[0.09] text-white"
															: "border-transparent bg-transparent text-white/72 hover:border-white/10 hover:bg-white/[0.06]",
													)}
													key={message.id}
													onClick={() => handleSelectMessage(message.id)}
													type="button"
												>
													<div className="flex items-center justify-between gap-3 text-[11px] uppercase tracking-[0.18em] text-white/38">
														<span>Prompt {timelineItems.length - index}</span>
														<span>{message.timestamp}</span>
													</div>
													<span className="mt-2 line-clamp-1 text-base leading-6">
														{toSnippet(message.text)}
													</span>
												</button>
											);
										})}
									</div>
								</div>
							</div>
						</div>
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
											<p className="mt-3 whitespace-pre-wrap text-[15px] leading-7 text-inherit">
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
