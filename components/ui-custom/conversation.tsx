"use client"

import type { ComponentProps, ReactNode, RefObject } from "react"
import { createContext, use, useCallback, useEffect, useMemo, useRef, useState } from "react"
import type { UIMessage } from "ai"
import {
  ArrowDownIcon,
  DownloadIcon,
} from "@/components/ui/vpk-icons"

import { Button } from "@/components/ui/button"
import { token } from "@/lib/tokens"
import { cn } from "@/lib/utils"

const DEFAULT_SCROLL_THRESHOLD_PX = 24
const USER_SCROLL_INTENT_TIMEOUT_MS = 180

type ScrollAnimation = boolean | ScrollBehavior | "instant" | {
	damping: number
	stiffness: number
	mass: number
}

export interface ScrollToBottomOptions {
	animation?: ScrollAnimation
	ignoreEscapes?: boolean
	target?: "bottom" | "follow"
}

export interface ConversationScrollTargetOptions {
	scrollElement: HTMLElement
}

export type ConversationFollowMode = "bottom" | "target"

export type GetTargetScrollTop = (
	defaultTargetTop: number,
	options: ConversationScrollTargetOptions
) => number

export interface ConversationContextValue {
	scrollRef: RefObject<HTMLDivElement | null>
	contentRef: RefObject<HTMLDivElement | null>
	isAtBottom: boolean
	scrollToBottom: (options?: ScrollToBottomOptions) => Promise<void>
}

const ConversationContext = createContext<ConversationContextValue | null>(null)

function resolveScrollBehavior(animation: ScrollAnimation | undefined): ScrollBehavior {
	if (animation === false || animation === "instant") {
		return "auto"
	}

	if (animation === "auto" || animation === "smooth") {
		return animation
	}

	if (typeof animation === "object") {
		return "smooth"
	}

	return "smooth"
}

function setContextRef(
	contextRef: { current: ConversationContextValue | null } | undefined,
	value: ConversationContextValue | null
) {
	if (contextRef) {
		contextRef.current = value
	}
}

export function useConversationContext(): ConversationContextValue {
	const context = use(ConversationContext)

	if (!context) {
		throw new Error("useConversationContext must be used within <Conversation>")
	}

	return context
}

export interface ConversationProps extends ComponentProps<"div"> {
	contextRef?: { current: ConversationContextValue | null }
	followMode?: ConversationFollowMode
	initial?: ScrollAnimation
	resize?: ScrollAnimation
	resizeTarget?: ScrollToBottomOptions["target"]
	targetScrollTop?: GetTargetScrollTop
}

export function Conversation({
	children,
	className,
	contextRef,
	followMode,
	initial = "smooth",
	resize = "smooth",
	resizeTarget = "follow",
	role = "log",
	targetScrollTop,
	...props
}: Readonly<ConversationProps>) {
	const scrollRef = useRef<HTMLDivElement>(null)
	const contentRef = useRef<HTMLDivElement>(null)
	const [isAtBottom, setIsAtBottom] = useState(true)
	const hasInitializedScrollRef = useRef(false)
	const lastKnownScrollHeightRef = useRef(0)
	const lastUserScrollIntentAtRef = useRef(0)
	const isPointerScrollingRef = useRef(false)
	const isFollowPausedRef = useRef(false)
	const resolvedFollowMode = followMode ?? (targetScrollTop ? "target" : "bottom")

	const hasActiveUserScrollIntent = useCallback(() => {
		return (
			isPointerScrollingRef.current ||
			Date.now() - lastUserScrollIntentAtRef.current <= USER_SCROLL_INTENT_TIMEOUT_MS
		)
	}, [])

	const getDefaultTargetTop = useCallback((scrollElement: HTMLElement) => {
		return Math.max(0, scrollElement.scrollHeight - scrollElement.clientHeight)
	}, [])

	const getScrollTargetTop = useCallback((scrollElement: HTMLElement) => {
		const defaultTargetTop = getDefaultTargetTop(scrollElement)
		if (resolvedFollowMode === "target" && targetScrollTop) {
			return targetScrollTop(defaultTargetTop, { scrollElement })
		}

		return defaultTargetTop
	}, [getDefaultTargetTop, resolvedFollowMode, targetScrollTop])

	const updateIsAtBottom = useCallback(() => {
		const scrollElement = scrollRef.current
		if (!scrollElement) {
			return true
		}

		const actualBottomTop = getDefaultTargetTop(scrollElement)
		const distanceFromActualBottom = Math.abs(scrollElement.scrollTop - actualBottomTop)
		const nextIsAtBottom = distanceFromActualBottom <= DEFAULT_SCROLL_THRESHOLD_PX
		setIsAtBottom(nextIsAtBottom)
		return nextIsAtBottom
	}, [getDefaultTargetTop])

	const scrollToBottom = useCallback(
		async (options?: ScrollToBottomOptions) => {
			const scrollElement = scrollRef.current
			if (!scrollElement) {
				return
			}

			if (options?.ignoreEscapes) {
				isFollowPausedRef.current = false
				isPointerScrollingRef.current = false
				lastUserScrollIntentAtRef.current = 0
			}

			const targetMode = options?.target ?? "follow"
			const targetTop = targetMode === "bottom"
				? getDefaultTargetTop(scrollElement)
				: getScrollTargetTop(scrollElement)

			scrollElement.scrollTo({
				top: Math.max(0, targetTop),
				behavior: resolveScrollBehavior(options?.animation),
			})
			updateIsAtBottom()
		},
		[getDefaultTargetTop, getScrollTargetTop, updateIsAtBottom]
	)

	const contextValue = useMemo<ConversationContextValue>(
		() => ({
			scrollRef,
			contentRef,
			isAtBottom,
			scrollToBottom,
		}),
		[isAtBottom, scrollToBottom]
	)

	useEffect(() => {
		setContextRef(contextRef, contextValue)
		return () => {
			setContextRef(contextRef, null)
		}
	}, [contextRef, contextValue])

	useEffect(() => {
		const scrollElement = scrollRef.current
		if (!scrollElement) {
			return
		}

		const markUserScrollIntent = () => {
			lastUserScrollIntentAtRef.current = Date.now()
		}

		const handlePointerDown = () => {
			isPointerScrollingRef.current = true
			markUserScrollIntent()
		}

		const handlePointerUp = () => {
			isPointerScrollingRef.current = false
		}

		scrollElement.addEventListener("wheel", markUserScrollIntent, { passive: true })
		scrollElement.addEventListener("touchmove", markUserScrollIntent, { passive: true })
		scrollElement.addEventListener("pointerdown", handlePointerDown, { passive: true })
		window.addEventListener("pointerup", handlePointerUp, { passive: true })
		window.addEventListener("pointercancel", handlePointerUp, { passive: true })

		return () => {
			scrollElement.removeEventListener("wheel", markUserScrollIntent)
			scrollElement.removeEventListener("touchmove", markUserScrollIntent)
			scrollElement.removeEventListener("pointerdown", handlePointerDown)
			window.removeEventListener("pointerup", handlePointerUp)
			window.removeEventListener("pointercancel", handlePointerUp)
		}
	}, [])

	useEffect(() => {
		const scrollElement = scrollRef.current
		if (!scrollElement) {
			return
		}

		const handleScroll = () => {
			const nextIsAtBottom = updateIsAtBottom()
			const didUserInitiateScroll = hasActiveUserScrollIntent()
			if (didUserInitiateScroll) {
				isFollowPausedRef.current = !nextIsAtBottom
				return
			}

			if (isFollowPausedRef.current || !hasInitializedScrollRef.current) {
				return
			}
		}

		handleScroll()
		scrollElement.addEventListener("scroll", handleScroll, { passive: true })

		return () => {
			scrollElement.removeEventListener("scroll", handleScroll)
		}
	}, [hasActiveUserScrollIntent, updateIsAtBottom])

	useEffect(() => {
		const scrollElement = scrollRef.current
		if (!scrollElement) {
			return
		}

		lastKnownScrollHeightRef.current = scrollElement.scrollHeight

		if (hasInitializedScrollRef.current) {
			return
		}

		hasInitializedScrollRef.current = true
		if (initial === false) {
			return
		}

		const frameId = window.requestAnimationFrame(() => {
			void scrollToBottom({ animation: initial })
		})

		return () => {
			window.cancelAnimationFrame(frameId)
		}
	}, [initial, scrollToBottom])

	useEffect(() => {
		const scrollElement = scrollRef.current
		const observedContentElement = contentRef.current
		if (!scrollElement || typeof ResizeObserver === "undefined") {
			return
		}

		const observer = new ResizeObserver(() => {
			const previousScrollHeight = lastKnownScrollHeightRef.current
			const nextScrollHeight = scrollElement.scrollHeight
			const shouldYieldToUserScroll =
				hasInitializedScrollRef.current && hasActiveUserScrollIntent()
			const shouldFollowContent =
				!shouldYieldToUserScroll &&
				(
					!isFollowPausedRef.current ||
					previousScrollHeight === 0 ||
					!hasInitializedScrollRef.current
				)

			lastKnownScrollHeightRef.current = nextScrollHeight

			if (resize === false || !shouldFollowContent) {
				updateIsAtBottom()
				return
			}

			void scrollToBottom({ animation: resize, target: resizeTarget })
		})

		observer.observe(scrollElement)
		if (observedContentElement && observedContentElement !== scrollElement) {
			observer.observe(observedContentElement)
		}

		return () => {
			observer.disconnect()
		}
	}, [hasActiveUserScrollIntent, resize, resizeTarget, scrollToBottom, updateIsAtBottom])

	return (
		<ConversationContext value={contextValue}>
			<div
				className={cn("relative flex min-h-0 min-w-0 flex-1 flex-col overflow-y-hidden", className)}
				role={role}
				{...props}
			>
				{children}
			</div>
		</ConversationContext>
	)
}

export type ConversationContentProps = ComponentProps<"div">

export function ConversationContent({
	className,
	...props
}: Readonly<ConversationContentProps>) {
	const context = use(ConversationContext)

	useEffect(() => {
		const el = context?.scrollRef?.current
		if (!el) return
		let timeout: ReturnType<typeof setTimeout>
		function onScroll() {
			el!.setAttribute("data-scrolling", "")
			clearTimeout(timeout)
			timeout = setTimeout(() => {
				el!.removeAttribute("data-scrolling")
			}, 1000)
		}
		el.addEventListener("scroll", onScroll, { passive: true })
		return () => {
			el.removeEventListener("scroll", onScroll)
			clearTimeout(timeout)
		}
	}, [context?.scrollRef])

	return (
		<div
			className="min-h-0 w-full flex-1 overflow-x-hidden overflow-y-auto scrollbar-auto-hide"
			ref={context?.scrollRef}
		>
			<div
				className={cn("flex flex-col gap-8 p-4", className)}
				ref={context?.contentRef}
				{...props}
			/>
		</div>
	)
}

export type ConversationEmptyStateProps = ComponentProps<"div"> & {
	title?: string
	description?: string
	icon?: ReactNode
}

export function ConversationEmptyState({
	className,
	title = "No messages yet",
	description = "Start a conversation to see messages here",
	icon,
	children,
	...props
}: Readonly<ConversationEmptyStateProps>) {
	return (
		<div
			className={cn(
				"flex size-full flex-col items-center justify-center gap-3 p-8 text-center",
				className
			)}
			{...props}
		>
			{children ?? (
				<>
					{icon ? <div className="text-muted-foreground">{icon}</div> : null}
					<div className="space-y-1">
						<h3 className="text-sm font-medium">{title}</h3>
						{description ? (
							<p className="text-muted-foreground text-sm">{description}</p>
						) : null}
					</div>
				</>
			)}
		</div>
	)
}

export type ConversationScrollButtonProps = ComponentProps<typeof Button>

export function ConversationScrollButton({
	className,
	style,
	"aria-label": ariaLabel = "Scroll to bottom",
	...props
}: Readonly<ConversationScrollButtonProps>) {
	const { isAtBottom, scrollToBottom } = useConversationContext()

	const handleScrollToBottom = useCallback(() => {
		void scrollToBottom({ ignoreEscapes: true, target: "bottom" })
	}, [scrollToBottom])

	return !isAtBottom ? (
		<Button
			aria-label={ariaLabel}
			className={cn(
				"absolute bottom-4 left-[50%] translate-x-[-50%] rounded-full border-0 bg-surface hover:bg-surface-hovered",
				className
			)}
			onClick={handleScrollToBottom}
			size="icon"
			style={{
				boxShadow: token("elevation.shadow.overlay"),
				...style,
			}}
			type="button"
			variant="ghost"
			{...props}
		>
			<ArrowDownIcon className="size-4" />
		</Button>
	) : null
}

export interface ConversationMessage {
	role: "user" | "assistant" | "system" | "data" | "tool"
	content: string
}

const getMessageText = (message: ConversationMessage | UIMessage): string => {
	if ("parts" in message && Array.isArray(message.parts)) {
		return message.parts
			.filter((part): part is { type: "text"; text: string } => part.type === "text")
			.map((part) => part.text)
			.join("")
	}
	return (message as ConversationMessage).content
}

export type ConversationDownloadProps = Omit<
	ComponentProps<typeof Button>,
	"onClick"
> & {
	messages: ConversationMessage[] | UIMessage[]
	filename?: string
	formatMessage?: (message: ConversationMessage | UIMessage, index: number) => string
}

const defaultFormatMessage = (message: ConversationMessage | UIMessage): string => {
	const roleLabel =
		message.role.charAt(0).toUpperCase() + message.role.slice(1)
	return `**${roleLabel}:** ${getMessageText(message)}`
}

export const messagesToMarkdown = (
	messages: ConversationMessage[] | UIMessage[],
	formatMessage: (
		message: ConversationMessage | UIMessage,
		index: number
	) => string = defaultFormatMessage
): string => messages.map((msg, index) => formatMessage(msg, index)).join("\n\n")

export function ConversationDownload({
	messages,
	filename = "conversation.md",
	formatMessage = defaultFormatMessage,
	className,
	children,
	"aria-label": ariaLabel = "Download conversation",
	...props
}: Readonly<ConversationDownloadProps>) {
	const handleDownload = useCallback(() => {
		const markdown = messagesToMarkdown(messages, formatMessage)
		const blob = new Blob([markdown], { type: "text/markdown" })
		const url = URL.createObjectURL(blob)
		const link = document.createElement("a")
		link.href = url
		link.download = filename
		document.body.append(link)
		link.click()
		link.remove()
		URL.revokeObjectURL(url)
	}, [messages, filename, formatMessage])

	return (
		<Button
			aria-label={ariaLabel}
			className={cn("absolute top-4 right-4 rounded-full", className)}
			onClick={handleDownload}
			size="icon"
			type="button"
			variant="outline"
			{...props}
		>
			{children ?? <DownloadIcon className="size-4" />}
		</Button>
	)
}
