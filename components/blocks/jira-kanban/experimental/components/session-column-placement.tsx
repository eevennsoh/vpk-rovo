"use client";

import { createContext, use, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import { cn } from "@/lib/utils";

interface SessionColumnPlacement {
	rootRef: RefObject<HTMLDivElement | null>;
	index: number;
	preview: number | null;
	highlightedIndex: number | null;
	width: number;
	titles: readonly string[];
	setWidth: (width: number) => void;
	setPreview: (index: number | null) => void;
	setHighlightedIndex: (index: number | null) => void;
	move: (index: number) => void;
}

const PlacementContext = createContext<SessionColumnPlacement | null>(null);

export function useSessionColumnPlacement() {
	return use(PlacementContext);
}

export function SessionColumnPlacementProvider({ enabled, titles, children }: Readonly<{
	enabled: boolean;
	titles: readonly string[];
	children: ReactNode;
}>) {
	const rootRef = useRef<HTMLDivElement>(null);
	const [index, setIndex] = useState(0);
	const [preview, setPreview] = useState<number | null>(null);
	const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
	const [width, setWidth] = useState(280);
	const [announcement, setAnnouncement] = useState("");
	const value = useMemo<SessionColumnPlacement>(() => ({
		rootRef,
		index: Math.min(index, titles.length),
		preview,
		highlightedIndex,
		width,
		titles,
		setWidth,
		setPreview,
		setHighlightedIndex,
		move: (nextIndex) => {
			const next = Math.max(0, Math.min(nextIndex, titles.length));
			setIndex(next);
			setPreview(null);
			setHighlightedIndex(null);
			setAnnouncement(next === 0
				? "Session column moved to the leading gutter."
				: `Session column moved after ${titles[next - 1]}.`);
		},
	}), [index, preview, highlightedIndex, width, titles]);

	return (
		<PlacementContext value={enabled ? value : null}>
			<div ref={rootRef} className="relative flex min-h-0 min-w-0 flex-1 items-stretch" data-session-column-placement={enabled ? value.index : undefined}>
				{children}
				<span aria-live="polite" className="sr-only">{announcement}</span>
			</div>
		</PlacementContext>
	);
}

/** Reserves space in the scroll row while the mounted session surface follows it. */
export function SessionColumnSlot({ index }: Readonly<{ index: number }>) {
	const placement = useSessionColumnPlacement();
	if (!placement || placement.index !== index) return null;
	return (
		<div
			aria-hidden="true"
			className="min-h-full shrink-0"
			data-session-column-slot={index}
			style={{ width: Math.max(64, placement.width + 12) }}
		/>
	);
}

/** Zero-width marker leaves the existing layout stable throughout a drag. */
export function SessionColumnDropMarker({ index }: Readonly<{ index: number }>) {
	const placement = useSessionColumnPlacement();
	if (!placement || placement.preview === null) return null;
	const isHighlighted = placement.highlightedIndex === index;
	return (
		<span aria-hidden="true" className="group/session-gap pointer-events-none relative -mx-1 w-0 shrink-0" data-session-column-drop-marker={index} data-session-column-drop-target={placement.highlightedIndex === index || undefined}>
			<span
				className={cn(
					"absolute left-0 z-10 -translate-x-1/2 transition-[top,height,width,background-color,border-radius] duration-medium ease-out-practical motion-reduce:transition-none",
					isHighlighted
						? "w-0.5 rounded-none bg-border-focused"
						: "w-1 rounded-lg bg-neutral-100",
				)}
				style={{
					top: isHighlighted ? 0 : "var(--session-column-marker-top, 40px)",
					height: isHighlighted ? "100%" : 64,
				}}
			/>
		</span>
	);
}
