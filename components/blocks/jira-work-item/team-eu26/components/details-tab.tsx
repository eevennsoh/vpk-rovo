"use client";

import type { ReactNode } from "react";

import AiAgentIcon from "@atlaskit/icon/core/ai-agent";

import type { WorkItemPerson } from "@/app/contexts/context-work-item-modal";
import type { AgentPlannerMetadata } from "@/components/blocks/jira-work-item/data/planner-state";
import {
	DateRowField,
	PersonRowField,
	PriorityRowField,
	StatusPill,
} from "@/components/blocks/jira-work-item/team-eu26/components/detail-field-editors";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Icon } from "@/components/ui/icon";

export { seedMetadataDraft } from "@/components/blocks/jira-work-item/data/planner-state";

export type MetadataDraft = AgentPlannerMetadata;

function DetailRow({ children, label }: Readonly<{ children: ReactNode; label: string }>) {
	return (
		<div className="grid min-h-8 min-w-0 grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-2 text-sm">
			<span className="text-text-subtlest">{label}</span>
			<div className="min-w-0">{children}</div>
		</div>
	);
}

/** TeamEU's deliberately compact Details set for the VITA-1 work item. */
export function DetailsTab({
	draft,
	onChange,
	onShowMoreChange,
	people,
	showMore,
}: Readonly<{
	draft: MetadataDraft;
	onChange: (patch: Partial<MetadataDraft>) => void;
	onShowMoreChange: (showMore: boolean) => void;
	people: readonly WorkItemPerson[];
	showMore: boolean;
}>) {
	return (
		<div className="flex flex-col gap-1">
			<h2 className="mb-2 text-sm font-medium text-text-subtle">Details</h2>
			<DetailRow label="Assignee">
				<PersonRowField
					ariaLabel="Change assignee"
					onChange={(person) => onChange({ assignee: person })}
					people={people}
					placeholder="Unassigned"
					value={draft.assignee}
				/>
			</DetailRow>
			<DetailRow label="Status">
				<StatusPill onChange={(status) => onChange({ status })} value={draft.status} />
			</DetailRow>
			<DetailRow label="Priority">
				<PriorityRowField onChange={(priority) => onChange({ priority })} value={draft.priority} />
			</DetailRow>
			<DetailRow label="Agents">
				<Button className="-ml-2 justify-start gap-2 font-normal" size="compact" type="button" variant="ghost">
					<Icon aria-hidden className="text-icon-subtle" render={<AiAgentIcon label="" size="small" />} />
					Needs input
				</Button>
			</DetailRow>
			{showMore ? (
				<>
					<DetailRow label="Reporter">
						<PersonRowField
							ariaLabel="Change reporter"
							onChange={(person) => onChange({ reporter: person })}
							people={people}
							placeholder="Unassigned"
							value={draft.reporter}
						/>
					</DetailRow>
					<DetailRow label="Due date">
						<DateRowField
							ariaLabel="Change due date"
							CalendarComponent={Calendar}
							onChange={(dueDate) => onChange({ dueDate })}
							placeholder="Add due date"
							value={draft.dueDate}
						/>
					</DetailRow>
				</>
			) : null}
			<Button
				className="mt-1 self-start px-0 text-text-subtle"
				onClick={() => onShowMoreChange(!showMore)}
				size="compact"
				type="button"
				variant="link"
			>
				{showMore ? "See less" : "See more"}
			</Button>
		</div>
	);
}
