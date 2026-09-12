"use client";

import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import { motion, useReducedMotion } from "motion/react";
import { useState, type ReactNode } from "react";

import {
	CONTENT_ENTER,
	CONTENT_EXIT,
	panelContentVariants,
	REDUCED_MOTION_TRANSITION,
} from "@/components/blocks/jira-work-item/team-eu26/components/panel-content-motion";
import { cn } from "@/lib/utils";

interface CollapsibleWorkItemSectionProps {
	actions?: (expanded: boolean) => ReactNode;
	children: ReactNode;
	className?: string;
	defaultExpanded?: boolean;
	headingId: string;
	label: string;
	trailingAction?: ReactNode;
	variant?: "body" | "rail";
}

export function CollapsibleWorkItemSection({
	actions,
	children,
	className,
	defaultExpanded = true,
	headingId,
	label,
	trailingAction,
	variant = "body",
}: Readonly<CollapsibleWorkItemSectionProps>) {
	const [expanded, setExpanded] = useState(defaultExpanded);
	const shouldReduceMotion = Boolean(useReducedMotion());
	const contentId = `${headingId}-content`;
	const isRail = variant === "rail";

	return (
		<motion.section
			animate={expanded ? "open" : "closed"}
			aria-labelledby={headingId}
			className={cn("min-w-0", className)}
			initial={false}
		>
			<div
				className={cn(
					"group/section relative flex min-w-0 items-center gap-3",
					isRail ? "min-h-12 px-4" : expanded ? "min-h-9" : "min-h-8",
				)}
			>
				<button
					aria-controls={contentId}
					aria-expanded={expanded}
					aria-label={`${expanded ? "Collapse" : "Expand"} ${label}`}
					className="absolute inset-0 z-0 cursor-pointer rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
					onClick={() => setExpanded((current) => !current)}
					type="button"
				/>
				<h2
					className="pointer-events-none relative z-10 flex min-w-0 flex-1 items-center gap-1 text-sm font-semibold text-text"
					id={headingId}
				>
					<span className="min-w-0 truncate">{label}</span>
					<motion.span
						animate={{ rotate: expanded ? 0 : -90 }}
						aria-hidden
						className={cn(
							"inline-flex shrink-0 origin-center text-icon-subtlest transition-opacity duration-normal ease-out-practical motion-reduce:transition-none",
							expanded
								? "opacity-0 group-hover/section:opacity-100 group-focus-within/section:opacity-100"
								: "opacity-100",
						)}
						initial={false}
						style={shouldReduceMotion ? undefined : { willChange: "transform" }}
						transition={shouldReduceMotion ? REDUCED_MOTION_TRANSITION : expanded ? CONTENT_ENTER : CONTENT_EXIT}
					>
						<ChevronDownIcon label="" size="small" />
					</motion.span>
				</h2>
				{actions ? (
					<div
						aria-hidden={!expanded}
						className={cn("relative z-10 ml-auto flex shrink-0 items-center gap-2", !expanded && "pointer-events-none opacity-0")}
						inert={!expanded ? true : undefined}
					>
						{actions(expanded)}
					</div>
				) : null}
				{trailingAction ? (
					<span
						aria-hidden={!expanded}
						className={cn("relative z-10 shrink-0", !expanded && "pointer-events-none hidden")}
						inert={!expanded ? true : undefined}
					>
						{trailingAction}
					</span>
				) : null}
			</div>
			<motion.div
				aria-hidden={!expanded}
				className={cn("overflow-hidden", expanded ? "has-[:focus-visible]:overflow-visible" : undefined)}
				id={contentId}
				inert={!expanded ? true : undefined}
				style={shouldReduceMotion ? undefined : { willChange: "opacity" }}
				variants={panelContentVariants(shouldReduceMotion)}
			>
				<div className={isRail ? "px-4 pb-4" : "pt-2"}>{children}</div>
			</motion.div>
		</motion.section>
	);
}
