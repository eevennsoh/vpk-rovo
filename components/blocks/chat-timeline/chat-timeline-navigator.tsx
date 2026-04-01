"use client";

import { useMemo, useId, useState, type FocusEvent } from "react";
import { useReducedMotion } from "motion/react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

export interface ChatTimelineItem {
	id: string;
	label: string;
	text: string;
	timestampLabel?: string | null;
}

interface ChatTimelineNavigatorProps {
	activeItemId: string | null;
	appearance?: "surface" | "inverse";
	className?: string;
	items: ReadonlyArray<ChatTimelineItem>;
	onSelectItem: (id: string) => void;
}

const BAR_HEIGHT_PX = 2;
const BAR_GAP_PX = 12;
const MINIMAP_PADDING_Y_PX = 12;
const MINIMAP_PADDING_X_PX = 8;
const MINIMAP_WIDTH_PX = 40;

const TIMELINE_OPEN_HEIGHT_PX = 492;
const TIMELINE_OPEN_WIDTH_PX = 320;

function getBarWidth(text: string): number {
	const length = text.length;
	if (length < 40) return 8;
	if (length <= 120) return 16;
	return 24;
}

function toSnippet(text: string, maxLength = 78): string {
	const normalized = text.replace(/\s+/gu, " ").trim();
	if (normalized.length <= maxLength) {
		return normalized;
	}

	return `${normalized.slice(0, maxLength - 1).trimEnd()}...`;
}

export function ChatTimelineNavigator({
	activeItemId,
	appearance = "surface",
	className,
	items,
	onSelectItem,
}: Readonly<ChatTimelineNavigatorProps>) {
	const navigatorId = useId();
	const shouldReduceMotion = useReducedMotion();
	const [isNavigatorOpen, setIsNavigatorOpen] = useState(false);
	const isInverseAppearance = appearance === "inverse";

	const chronologicalItems = useMemo(() => [...items].reverse(), [items]);
	const closedHeight =
		2 + // 1px border top + bottom (border-box)
		MINIMAP_PADDING_Y_PX * 2 +
		items.length * BAR_HEIGHT_PX +
		Math.max(0, items.length - 1) * BAR_GAP_PX;

	if (items.length <= 1) {
		return null;
	}

	function handleBlur(event: FocusEvent<HTMLDivElement>) {
		if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
			return;
		}

		setIsNavigatorOpen(false);
	}

	const shellBorderColor = isNavigatorOpen
		? (isInverseAppearance ? "rgba(255,255,255,0.10)" : "var(--ds-border)")
		: (isInverseAppearance ? "rgba(255,255,255,0.06)" : "var(--ds-border)");
	const shellBackgroundColor = isNavigatorOpen
		? (isInverseAppearance ? "rgba(42,37,36,0.95)" : "var(--ds-surface-overlay)")
		: (isInverseAppearance ? "rgba(255,255,255,0.02)" : "var(--ds-background-neutral-subtle)");
	const shellBoxShadow = isNavigatorOpen
		? (isInverseAppearance ? "0 32px 80px rgba(0,0,0,0.48)" : token("elevation.shadow.overlay"))
		: "none";
	const shellTransition = shouldReduceMotion
		? undefined
		: isInverseAppearance
			? [
				"width 220ms cubic-bezier(0.22, 1, 0.36, 1)",
				"height 220ms cubic-bezier(0.22, 1, 0.36, 1)",
				"border-radius 220ms cubic-bezier(0.22, 1, 0.36, 1)",
				"background-color 180ms ease-out",
				"border-color 180ms ease-out",
				"box-shadow 220ms ease-out",
			].join(", ")
			: [
				"width var(--duration-medium) var(--ease-in-out)",
				"height var(--duration-medium) var(--ease-in-out)",
				"border-radius var(--duration-medium) var(--ease-in-out)",
				"background-color var(--duration-normal) var(--ease-out)",
				"border-color var(--duration-normal) var(--ease-out)",
				"box-shadow var(--duration-medium) var(--ease-out)",
			].join(", ");

	return (
		<div
			className={className}
			onBlur={handleBlur}
			onFocusCapture={() => setIsNavigatorOpen(true)}
			onMouseEnter={() => setIsNavigatorOpen(true)}
			onMouseLeave={() => setIsNavigatorOpen(false)}
		>
			<div
				className="relative origin-top-right overflow-hidden text-left backdrop-blur-xl"
				id={navigatorId}
				style={{
					boxSizing: "border-box",
					width: isNavigatorOpen
						? TIMELINE_OPEN_WIDTH_PX
						: MINIMAP_WIDTH_PX,
					height: isNavigatorOpen
						? TIMELINE_OPEN_HEIGHT_PX
						: closedHeight,
					borderRadius: isNavigatorOpen ? 28 : 14,
					border: "1px solid",
					borderColor: isNavigatorOpen ? shellBorderColor : "transparent",
					backgroundColor: isNavigatorOpen ? shellBackgroundColor : "transparent",
					boxShadow: shellBoxShadow,
					transition: shellTransition,
				}}
			>
				{/* Minimap bars (collapsed state) */}
				<button
					aria-controls={navigatorId}
					aria-expanded={isNavigatorOpen}
					aria-label="Open prompt timeline"
					className={cn(
						"absolute inset-0 flex flex-col items-end justify-start transition-opacity focus-visible:outline-none focus-visible:ring-2",
						isNavigatorOpen
							? "pointer-events-none opacity-0"
							: "pointer-events-auto opacity-100",
						isInverseAppearance
							? "duration-150 focus-visible:ring-white/35"
							: "duration-normal focus-visible:ring-border-selected",
					)}
					onClick={() => setIsNavigatorOpen(true)}
					style={{
						paddingTop: MINIMAP_PADDING_Y_PX,
						paddingBottom: MINIMAP_PADDING_Y_PX,
						paddingLeft: MINIMAP_PADDING_X_PX,
						paddingRight: MINIMAP_PADDING_X_PX,
						gap: BAR_GAP_PX,
					}}
					type="button"
				>
					{chronologicalItems.map((item) => {
						const isActive = item.id === activeItemId;
						return (
							<div
								className={cn(
									"shrink-0 rounded-full transition-colors",
									isInverseAppearance
										? "duration-150"
										: "duration-normal",
									isActive
										? (isInverseAppearance ? "bg-white/80" : "bg-icon")
										: (isInverseAppearance ? "bg-white/20" : "bg-icon-disabled"),
								)}
								key={item.id}
								style={{
									width: getBarWidth(item.text),
									height: BAR_HEIGHT_PX,
								}}
							/>
						);
					})}
				</button>

				{/* Expanded overlay */}
				<div
					className={cn(
						"absolute inset-0 flex flex-col p-2 text-left ease-out",
						isNavigatorOpen
							? "pointer-events-auto opacity-100"
							: "pointer-events-none opacity-0",
						isInverseAppearance ? "transition-opacity duration-150" : "transition-opacity duration-normal",
					)}
				>
					<div className="px-3 pb-2 pt-2">
						<div
							className={cn(
								"uppercase",
								isInverseAppearance
									? "text-[11px] tracking-[0.22em] text-white/42"
									: "text-xs tracking-widest text-text-subtlest",
							)}
						>
							Prompt timeline
						</div>
						<p
							className={cn(
								"mt-2 text-sm leading-5",
								isInverseAppearance ? "text-white/72" : "text-text-subtle",
							)}
						>
							Jump to an earlier user prompt in the current thread.
						</p>
					</div>

					<ScrollArea className="min-h-0 flex-1">
						<div className="space-y-1 pr-1">
							{items.map((item) => {
								const isActive = item.id === activeItemId;
								return (
									<button
										className={cn(
											"flex w-full flex-col border px-3 py-3 text-left transition-colors ease-out",
											isInverseAppearance
												? "rounded-[18px] duration-150"
												: "rounded-2xl duration-normal",
											isActive
												? (
													isInverseAppearance
														? "border-white/16 bg-white/[0.09] text-white"
														: "border-border-selected bg-bg-selected text-foreground"
												)
												: (
													isInverseAppearance
														? "border-transparent bg-transparent text-white/72 hover:border-white/10 hover:bg-white/[0.06]"
														: "border-transparent bg-transparent text-text-subtle hover:border-border hover:bg-bg-neutral-subtle-hovered"
												),
										)}
										key={item.id}
										onClick={() => onSelectItem(item.id)}
										type="button"
									>
										<div
											className={cn(
												"flex items-center justify-between gap-3 uppercase",
												isInverseAppearance
													? "text-[11px] tracking-[0.18em] text-white/38"
													: "text-xs tracking-widest text-text-subtlest",
											)}
										>
											<span>{item.label}</span>
											{item.timestampLabel ? <span>{item.timestampLabel}</span> : null}
										</div>
										<span className="mt-2 line-clamp-1 text-base leading-6">
											{toSnippet(item.text)}
										</span>
									</button>
								);
							})}
						</div>
					</ScrollArea>
				</div>
			</div>
		</div>
	);
}
