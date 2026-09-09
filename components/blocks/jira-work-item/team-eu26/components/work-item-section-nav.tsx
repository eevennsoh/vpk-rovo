"use client";

import type { ReactNode } from "react";

import {
	useSectionNavigation,
	useWorkItemHeaderVariant,
} from "@/components/blocks/jira-work-item/team-eu26/context-section-navigation";
import type { WorkItemSectionId } from "@/components/blocks/jira-work-item/team-eu26/lib/work-item-section-tabs";
import { FOCUS_RING_CLIP_GUTTER } from "@/components/ui/focus-ring";
import {
	tabsExperimentalListClass,
	tabsExperimentalTriggerClass,
} from "@/components/ui/tabs-experimental";
import { cn } from "@/lib/utils";

const NAV_LIST_CLASS = cn(
	"flex h-8 w-fit items-stretch justify-start text-text-subtle",
	tabsExperimentalListClass,
);

const NAV_LINK_CLASS = tabsExperimentalTriggerClass;

function sectionTabCount(
	sectionId: WorkItemSectionId,
	activityCount: number | null,
	insightsCount: number | null,
): number | null {
	switch (sectionId) {
		case "activity":
			return activityCount;
		case "insights":
			return insightsCount;
		case "description":
		case "guide":
		case "files":
			return null;
		default: {
			const exhaustive: never = sectionId;
			return exhaustive;
		}
	}
}

interface WorkItemSectionNavProps {
	endControl?: ReactNode;
	onSectionSelect?: () => void;
}

/**
 * Section navigation for the stacked work-item page.
 *
 * Deliberately a `<nav>` of links rather than ARIA tabs. Tab semantics promise
 * exactly one visible panel referenced by `aria-controls`; here every section is
 * on screen at once and the control only moves the scroll position, so
 * `aria-current="location"` describes it truthfully. Anchors also give keyboard
 * activation, focus order, and a working no-JS fallback for free.
 */
export function WorkItemSectionNav({
	endControl,
	onSectionSelect,
}: Readonly<WorkItemSectionNavProps>) {
	const { activeSectionId, activityCount, insightsCount, sectionElementId, sections, selectSection } = useSectionNavigation();
	const variant = useWorkItemHeaderVariant();
	if (sections.length === 0 && endControl == null) return null;

	return (
		<div
			className={cn(
				"group/work-item-navigation @container/resource-row border-b transition-colors duration-normal ease-out-practical motion-reduce:transition-none",
				variant === "compact" ? "border-border-disabled" : "border-transparent",
			)}
			data-header-variant={variant}
			data-work-item-header-navigation
		>
			<div className="flex items-center gap-1 px-4.5">
				<nav
					aria-label="Work item sections"
					className={cn(
						"box-content min-w-0 overflow-x-auto overflow-y-hidden",
						FOCUS_RING_CLIP_GUTTER,
					)}
					data-work-item-section-nav
				>
					<ul className={NAV_LIST_CLASS}>
						{sections.map((section) => {
							const count = sectionTabCount(section.id, activityCount, insightsCount);
							return (
								<li className="flex" key={section.id}>
									<a
										aria-current={section.id === activeSectionId ? "location" : undefined}
										className={NAV_LINK_CLASS}
										href={`#${sectionElementId(section.id)}`}
										onClick={(event) => {
											event.preventDefault();
											onSectionSelect?.();
											selectSection(section.id);
										}}
									>
										<span>{section.label}</span>
										{count != null ? (
											<span
												className={cn(
													"shrink-0 text-xs font-normal",
													section.id === activeSectionId ? "text-text" : "text-text-subtlest",
												)}
											>
												{count}
											</span>
										) : null}
										{section.diff ? (
											<span className="inline-flex items-center gap-1 tabular-nums">
												<span className="text-text-success">+{section.diff.additions}</span>
												<span className="text-text-danger">-{section.diff.deletions}</span>
											</span>
										) : null}
									</a>
								</li>
							);
						})}
						{endControl != null ? (
							<li
								className="flex h-8 shrink-0"
								data-work-item-navigation-end-control
							>
								{endControl}
							</li>
						) : null}
					</ul>
				</nav>
			</div>
		</div>
	);
}
