"use client";

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent, type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import {
	AgentSessionColumn,
	AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX,
	AGENT_SESSION_COLUMN_WIDTH_PX,
	type AgentSessionColumnFrame,
	type AgentSessionColumnProps,
} from "@/components/blocks/agent-session-column";
import { JiraSessionFlyoutSuspensionProvider } from "@/components/blocks/product-sidebar/variants/jira-session-flyout";
import { useSidebarResize } from "@/components/projects/rovo-core/hooks/use-sidebar-resize";
import { SidebarResizeHandle } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";

import {
	IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX,
	IN_FLOW_AGENT_SESSION_COLUMN_SURFACE_LEADING_BORDER_PX,
	resolveInFlowAgentSessionColumnGapPx,
	resolveInFlowResizeHandleOffsetPx,
} from "../lib/in-flow-agent-session-column-geometry";
import { useInFlowGutterScrollMask } from "./use-in-flow-gutter-scroll-mask";

// Extend the preview's 24px session targets to 56px, within the empty gutter.
// The 32px column footprint and marker axis stay fixed; To do remains clickable.
const IN_FLOW_AGENT_SESSION_COLUMN_RAIL_HIT_SLOP_PX = 16;
const IN_FLOW_AGENT_SESSION_COLUMN_TITLE = "Untracked work";
// Centers the rail's 16px dot axis in the 26px visible gutter (24px inset + border).
const IN_FLOW_AGENT_SESSION_COLUMN_GUTTER_OFFSET_PX = -5;
const IN_FLOW_AGENT_SESSION_COLUMN_MAX_WIDTH_PX = 560;
const IN_FLOW_AGENT_SESSION_COLUMN_WIDTH_TRANSITION =
	"width var(--duration-normal) var(--ease-out-practical)";
const IN_FLOW_AGENT_SESSION_COLUMN_EXPANSION_TRANSITION =
	"width var(--duration-medium) var(--ease-in-out)";
const IN_FLOW_AGENT_SESSION_COLUMN_RESIZE_HANDLE_CLASS_NAME = [
	"right-auto -translate-x-1/2",
	"bg-transparent! hover:bg-transparent! data-[active]:bg-transparent! focus-visible:bg-transparent! focus-visible:outline-none focus-visible:ring-0",
	"duration-normal ease-out-practical",
	"[&>div]:h-16 [&>div]:origin-center [&>div]:transition-[opacity,background-color,scale]",
	"group-hover/in-flow-agent-session-column:[&>div]:opacity-100 hover:[&>div]:scale-105",
	"data-[active]:[&>div]:scale-105 focus-visible:[&>div]:scale-105 focus-visible:[&>div]:bg-bg-selected-bold focus-visible:[&>div]:opacity-100",
	"[&>div]:duration-medium [&>div]:ease-out-practical motion-reduce:transition-none motion-reduce:[&>div]:scale-100 motion-reduce:[&>div]:transition-none",
].join(" ");
const IN_FLOW_AGENT_SESSION_COLUMN_VARIANTS: Variants = {
	embedded: {
		transform: `translateX(${IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX}px)`,
		transition: { duration: 0.15, ease: [0.4, 1, 0.6, 1] },
	},
	gutter: {
		transform: `translateX(${IN_FLOW_AGENT_SESSION_COLUMN_GUTTER_OFFSET_PX}px)`,
		transition: { duration: 0.1, ease: [0.6, 0, 0.8, 0.6] },
	},
};
const IN_FLOW_AGENT_SESSION_COLUMN_REDUCED_MOTION_VARIANTS: Variants = {
	embedded: { transform: `translateX(${IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX}px)` },
	gutter: { transform: `translateX(${IN_FLOW_AGENT_SESSION_COLUMN_GUTTER_OFFSET_PX}px)` },
};

export interface InFlowAgentSessionColumnProps {
	agentSessionColumn: AgentSessionColumnProps;
	className?: string;
	columnFrame: AgentSessionColumnFrame;
	paddingBottom?: CSSProperties["paddingBottom"];
	paddingTop?: CSSProperties["paddingTop"];
	sessionFlyoutsSuspended: boolean;
	untrackedDropArmed: boolean;
}

function useInFlowAgentSessionColumnInteraction(
	collapsed: AgentSessionColumnProps["collapsed"],
	onCollapsedChange: AgentSessionColumnProps["onCollapsedChange"],
) {
	const [isHovered, setIsHovered] = useState(false);
	const [uncontrolledPersistentExpanded, setUncontrolledPersistentExpanded] = useState(false);
	const isCollapsedControlled = collapsed !== undefined;
	const isPersistentExpanded = isCollapsedControlled
		? !collapsed
		: uncontrolledPersistentExpanded;

	const handlePointerEnter = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== "touch") {
			setIsHovered(true);
		}
	};

	const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== "touch") {
			setIsHovered(false);
		}
	};

	const handleCollapsedChange = (collapsed: boolean) => {
		if (!isCollapsedControlled) {
			setUncontrolledPersistentExpanded(!collapsed);
		}
		onCollapsedChange?.(collapsed);
	};

	const handleGutterPointerDown = (event: PointerEvent<HTMLDivElement>) => {
		if (event.pointerType !== "touch") {
			return;
		}
		event.preventDefault();
		handleCollapsedChange(false);
	};

	return {
		handleCollapsedChange,
		handleGutterPointerDown,
		handlePointerEnter,
		handlePointerLeave,
		isEmbedded: isHovered || isPersistentExpanded,
		isPersistentExpanded,
	};
}

function InFlowAgentSessionColumnFootprint({
	columnFrame,
	columnWidthPx,
	isEmbedded,
	isResizing,
	shouldReduceMotion,
}: Readonly<{
	columnFrame: AgentSessionColumnFrame;
	columnWidthPx: number;
	isEmbedded: boolean;
	isResizing: boolean;
	shouldReduceMotion: boolean | null;
}>) {
	const transition = shouldReduceMotion || isResizing
		? "none"
		: IN_FLOW_AGENT_SESSION_COLUMN_WIDTH_TRANSITION;
	const expansionTransition = shouldReduceMotion || isResizing
		? "none"
		: IN_FLOW_AGENT_SESSION_COLUMN_EXPANSION_TRANSITION;

	return (
		<>
			<div
				aria-hidden="true"
				className="shrink-0"
				data-agent-session-column-footprint="width"
				style={{
					transition,
					width: isEmbedded ? resolveInFlowAgentSessionColumnGapPx(columnFrame) : 0,
				}}
			/>
			<div
				aria-hidden="true"
				className="shrink-0"
				style={{
					transition: expansionTransition,
					width: isEmbedded ? columnWidthPx : 0,
				}}
			/>
		</>
	);
}

function InFlowAgentSessionColumnSurface({
	agentSessionColumn,
	className,
	columnFrame,
	expandedWidthPx,
	isEmbedded,
	isPersistentExpanded,
	resize,
	onCollapsedChange,
	onGutterIntroComplete,
	paddingBottom,
	paddingTop,
	playGutterIntro,
	shouldReduceMotion,
	untrackedDropArmed,
}: Readonly<InFlowAgentSessionColumnProps & {
	expandedWidthPx: number;
	isEmbedded: boolean;
	isPersistentExpanded: boolean;
	resize: ReturnType<typeof useSidebarResize>;
	onCollapsedChange: (collapsed: boolean) => void;
	onGutterIntroComplete: () => void;
	playGutterIntro: boolean;
	shouldReduceMotion: boolean | null;
}>) {
	const title = agentSessionColumn.title ?? IN_FLOW_AGENT_SESSION_COLUMN_TITLE;

	return (
		<motion.div
			animate={isEmbedded ? "embedded" : "gutter"}
			className={cn(
				"group/in-flow-agent-session-column absolute inset-y-0 start-0 z-40 flex min-h-0 border-2 border-r-0",
				isEmbedded
					? "pointer-events-auto bg-surface"
					: "pointer-events-none bg-transparent [&_[data-agent-session-notch]]:pointer-events-auto",
				untrackedDropArmed ? "border-ring" : "border-transparent",
				className,
			)}
			data-board-agent-session-drop-zone="untracked"
			data-board-agent-session-target={untrackedDropArmed ? "untracked" : undefined}
			initial={false}
			style={{
				paddingTop,
				paddingBottom,
				willChange: shouldReduceMotion ? undefined : "transform",
			}}
			variants={shouldReduceMotion
				? IN_FLOW_AGENT_SESSION_COLUMN_REDUCED_MOTION_VARIANTS
				: IN_FLOW_AGENT_SESSION_COLUMN_VARIANTS}
		>
			<AgentSessionColumn
				{...agentSessionColumn}
				collapsed={!isPersistentExpanded}
				collapsedPresentation={isEmbedded ? "column" : "gutter"}
				collapsedRailHitSlopPx={isEmbedded && !isPersistentExpanded
					? IN_FLOW_AGENT_SESSION_COLUMN_RAIL_HIT_SLOP_PX
					: 0}
				columnFrame={columnFrame}
				expandedWidthPx={expandedWidthPx}
				widthTransitionDisabled={resize.isResizing}
				onCollapsedChange={onCollapsedChange}
				onGutterIntroComplete={onGutterIntroComplete}
				playGutterIntro={playGutterIntro}
			/>
			{isPersistentExpanded ? (
				<SidebarResizeHandle
					aria-label={`Resize ${title} column`}
					aria-orientation="vertical"
					aria-valuemax={resize.maxWidth}
					aria-valuemin={resize.minWidth}
					aria-valuenow={expandedWidthPx}
					className={IN_FLOW_AGENT_SESSION_COLUMN_RESIZE_HANDLE_CLASS_NAME}
					data-active={resize.isResizing ? "" : undefined}
					data-testid="jira-kanban-agent-session-column-resize-handle"
					onDoubleClick={resize.onResizeHandleDoubleClick}
					onKeyDown={resize.onResizeHandleKeyDown}
					onPointerDown={resize.onResizeHandlePointerDown}
					role="separator"
					side="right"
					style={{
						left: `calc(100% + ${resolveInFlowResizeHandleOffsetPx(columnFrame)}px)`,
						right: "auto",
					}}
					tabIndex={0}
				/>
			) : null}
		</motion.div>
	);
}

/**
 * The Untracked rail rests in the page's leading gutter. Hover temporarily
 * returns that same compact timeline to the board's original 24px column inset
 * and reveals the collapsed header chrome — the session total and the expand
 * control — without swapping dots for cards. Gutter rest is the only state
 * that hides that chrome. Only the column's expand control promotes the full
 * column, and that deliberate state persists after the pointer leaves. The
 * full-height gutter target sits behind each session row so a row can own its
 * whole 24px band while empty gutter space still opens the column preview.
 */
export function InFlowAgentSessionColumn({
	agentSessionColumn,
	className,
	columnFrame,
	paddingBottom,
	paddingTop,
	sessionFlyoutsSuspended,
	untrackedDropArmed,
}: Readonly<InFlowAgentSessionColumnProps>): ReactNode {
	const shouldReduceMotion = useReducedMotion();
	const hostRef = useRef<HTMLDivElement>(null);
	const showGutterScrollMask = useInFlowGutterScrollMask(hostRef);
	const [playGutterIntro, setPlayGutterIntro] = useState(true);
	useEffect(() => {
		if (shouldReduceMotion) {
			setPlayGutterIntro(false);
		}
	}, [shouldReduceMotion]);
	const {
		handleCollapsedChange,
		handleGutterPointerDown,
		handlePointerEnter,
		handlePointerLeave,
		isEmbedded,
		isPersistentExpanded,
	} = useInFlowAgentSessionColumnInteraction(
		agentSessionColumn.collapsed,
		agentSessionColumn.onCollapsedChange,
	);
	const resize = useSidebarResize({
		defaultWidth: agentSessionColumn.expandedWidthPx ?? AGENT_SESSION_COLUMN_WIDTH_PX,
		maxWidth: IN_FLOW_AGENT_SESSION_COLUMN_MAX_WIDTH_PX,
		minWidth: AGENT_SESSION_COLUMN_WIDTH_PX,
		minWidthResistance: true,
	});
	const expandedWidthPx = resize.sidebarWidth;
	const columnWidthPx = isPersistentExpanded
		? expandedWidthPx
		: AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX;

	return (
		<JiraSessionFlyoutSuspensionProvider
			suspended={sessionFlyoutsSuspended || !isEmbedded}
		>
			<div
				ref={hostRef}
				className="relative z-30 flex min-h-0 shrink-0 self-stretch"
				onPointerDown={isEmbedded ? undefined : handleGutterPointerDown}
				onPointerEnter={handlePointerEnter}
				onPointerLeave={handlePointerLeave}
			>
				{isEmbedded ? null : (
					<div
						aria-hidden="true"
						className="absolute inset-y-0 start-0 z-30"
						data-agent-session-column-hit-area=""
						onPointerEnter={handlePointerEnter}
						onPointerDown={handleGutterPointerDown}
						style={{
							width: IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX
								+ IN_FLOW_AGENT_SESSION_COLUMN_SURFACE_LEADING_BORDER_PX,
						}}
					>
						{showGutterScrollMask ? (
							<div
								aria-hidden="true"
								className="pointer-events-none absolute inset-y-0 start-0 z-40 bg-surface"
								data-agent-session-column-gutter-fill=""
								style={{ width: IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX }}
							/>
						) : null}
					</div>
				)}
				<InFlowAgentSessionColumnFootprint
					columnFrame={columnFrame}
					columnWidthPx={columnWidthPx}
					isEmbedded={isEmbedded}
					isResizing={resize.isResizing}
					shouldReduceMotion={shouldReduceMotion}
				/>
				<InFlowAgentSessionColumnSurface
					agentSessionColumn={agentSessionColumn}
					className={className}
					columnFrame={columnFrame}
					expandedWidthPx={expandedWidthPx}
					isEmbedded={isEmbedded}
					isPersistentExpanded={isPersistentExpanded}
					resize={resize}
					onCollapsedChange={handleCollapsedChange}
					onGutterIntroComplete={() => setPlayGutterIntro(false)}
					paddingBottom={paddingBottom}
					paddingTop={paddingTop}
					playGutterIntro={playGutterIntro}
					sessionFlyoutsSuspended={sessionFlyoutsSuspended}
					shouldReduceMotion={shouldReduceMotion}
					untrackedDropArmed={untrackedDropArmed}
				/>
			</div>
		</JiraSessionFlyoutSuspensionProvider>
	);
}
