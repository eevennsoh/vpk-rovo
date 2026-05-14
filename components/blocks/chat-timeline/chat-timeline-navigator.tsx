"use client";

import { useMemo, useId, useState, type FocusEvent } from "react";
import { useReducedMotion } from "motion/react";
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
const MINIMAP_PADDING_X_PX = 4;
const MINIMAP_WIDTH_PX = 32;
const MINIMAP_MAX_BAR_WIDTH_PX = 24;

const TIMELINE_OPEN_HEIGHT_PX = 492;
const TIMELINE_OPEN_WIDTH_PX = 240;

function getBarWidth(text: string): number {
	const length = text.length;
	if (length < 40) return 8;
	if (length <= 120) return 16;
	return MINIMAP_MAX_BAR_WIDTH_PX;
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
		2 * MINIMAP_PADDING_Y_PX +
		chronologicalItems.length * BAR_HEIGHT_PX +
		Math.max(0, chronologicalItems.length - 1) * BAR_GAP_PX;

	if (items.length <= 1) {
		return null;
	}

	function handleBlur(event: FocusEvent<HTMLDivElement>) {
		if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
			return;
		}

		setIsNavigatorOpen(false);
	}

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
				"box-shadow 220ms ease-out",
			].join(", ")
			: [
				"width var(--duration-medium) var(--ease-in-out)",
				"height var(--duration-medium) var(--ease-in-out)",
				"border-radius var(--duration-medium) var(--ease-in-out)",
				"background-color var(--duration-normal) var(--ease-out)",
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
					className="relative origin-top-right overflow-hidden text-left"
				id={navigatorId}
				style={{
					boxSizing: "border-box",
					width: isNavigatorOpen
						? TIMELINE_OPEN_WIDTH_PX
						: MINIMAP_WIDTH_PX,
					height: isNavigatorOpen
						? Math.min(
							16 + items.length * 32 + Math.max(0, items.length - 1) * 2,
							TIMELINE_OPEN_HEIGHT_PX,
						)
						: closedHeight,
					borderRadius: isNavigatorOpen ? 12 : 14,
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
					<div className="min-h-0 flex-1 overflow-y-auto">
						<div className="flex flex-col gap-0.5">
							{chronologicalItems.map((item, index) => {
								const isActive = item.id === activeItemId;
								const isFirst = index === 0;
								const isLast = index === chronologicalItems.length - 1;
								return (
									<button
										className={cn(
											"flex w-full items-center p-2 text-left transition-colors ease-out",
											isInverseAppearance ? "duration-150" : "duration-normal",
											isActive
												? (
													isInverseAppearance
														? "bg-white/[0.09] text-white"
														: "bg-bg-selected text-text-selected"
												)
												: (
													isInverseAppearance
														? "bg-transparent text-white/72 hover:bg-white/[0.06]"
														: "bg-surface text-text-subtle hover:bg-surface-hovered"
												),
										)}
										key={item.id}
										onClick={() => onSelectItem(item.id)}
										style={{
											borderRadius: isFirst
												? "8px 8px 4px 4px"
												: isLast
													? "4px 4px 8px 8px"
													: "4px",
										}}
										type="button"
									>
										<span className="truncate text-xs leading-4">
											{toSnippet(item.text)}
										</span>
									</button>
								);
							})}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
