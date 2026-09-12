"use client";

import type { ReactNode } from "react";

import { useSectionNavigation } from "@/components/blocks/jira-work-item/team-eu26/context-section-navigation";
import { type WorkItemSectionId } from "@/components/blocks/jira-work-item/team-eu26/lib/work-item-section-tabs";
import { cn } from "@/lib/utils";

/**
 * One anchor target in the stacked scroll flow.
 *
 * `scroll-mt-6` matches the guided-review chapter convention so every anchor in
 * the scrollport is measured the same way by the shared spy. The heading is
 * always emitted — visibly for Activity, `sr-only` elsewhere where the content
 * already carries its own title — so each section has an accessible name.
 */
export function WorkItemSection({
	children,
	className,
	headingAction,
	headingVisible = false,
	id,
	label,
}: Readonly<{
	children?: ReactNode;
	className?: string;
	/** Trailing control on the heading row, e.g. Activity's filter/sort menu. */
	headingAction?: ReactNode;
	headingVisible?: boolean;
	id: WorkItemSectionId;
	label: string;
}>) {
	const { registerSection, sectionElementId, sectionHeadingId } = useSectionNavigation();
	const headingId = sectionHeadingId(id);
	return (
		<section
			aria-labelledby={headingId}
			className={cn(
				"min-w-0 scroll-mt-6",
				id === "activity" ? "group/activity" : null,
				className,
			)}
			data-work-item-section-id={id}
			id={sectionElementId(id)}
			ref={(node) => {
				registerSection(id, node);
			}}
		>
			{headingVisible || headingAction ? (
				<div className={cn("mb-2 flex min-w-0 items-center gap-2", id === "activity" ? "mb-4" : null)}>
					<h2
						className={cn(
							"min-w-0 shrink-0 truncate text-xs leading-4 font-semibold text-text-subtlest",
							id === "activity" ? "text-sm leading-5 font-medium text-text" : null,
							headingVisible ? null : "sr-only",
						)}
						id={headingId}
					>
						{label}
					</h2>
					{id === "activity" ? (
						<span aria-hidden className="min-w-6 flex-1 border-t border-dashed border-border" />
					) : null}
					<span className="shrink-0">{headingAction}</span>
				</div>
			) : (
				<h2 className="sr-only" id={headingId}>
					{label}
				</h2>
			)}
			{children}
		</section>
	);
}
