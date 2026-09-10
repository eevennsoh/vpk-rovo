"use client";

import { useMemo, useState, type ReactElement, type ReactNode } from "react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import PersonIcon from "@atlaskit/icon/core/person";

import { METADATA_PEOPLE } from "@/components/blocks/jira-work-item/data/metadata-people";
import {
	AgentsRowField,
	DateRowField,
	PersonRowField,
	PriorityRowField,
} from "@/components/blocks/jira-work-item/team-eu26/components/detail-field-editors";
import { DetailFieldRow, DetailValueTrigger } from "@/components/blocks/jira-work-item/team-eu26/components/detail-field-row";
import { TeamEuAppsPanel } from "@/components/blocks/jira-work-item/team-eu26/components/team-eu-apps-panel";
import {
	TeamEuAutomationPanel,
	TeamEuRecentAutomationRuns,
} from "@/components/blocks/jira-work-item/team-eu26/components/team-eu-automation-panel";
import { TeamEuDevelopmentPanel } from "@/components/blocks/jira-work-item/team-eu26/components/team-eu-development-panel";
import {
	useJiraWorkItemActions,
	useJiraWorkItemMeta,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/team-eu26/context-jira-work-item";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Icon } from "@/components/ui/icon";

function FieldValue({ children, icon }: Readonly<{ children: ReactNode; icon: ReactElement }>) {
	return (
		<span className="flex min-w-0 items-center gap-2 text-sm text-text">
			<Icon aria-hidden className="shrink-0 text-icon-subtle" render={icon} />
			<span className="truncate">{children}</span>
		</span>
	);
}

export function HighConfidenceMetadataRail() {
	const { metadata } = useJiraWorkItemState();
	const { workItem } = useJiraWorkItemMeta();
	const actions = useJiraWorkItemActions();
	const [showMoreDetails, setShowMoreDetails] = useState(false);
	const [showRecentAutomationRuns, setShowRecentAutomationRuns] = useState(false);
	const people = useMemo(() => {
		const byName = new Map(METADATA_PEOPLE.map((person) => [person.name, person]));
		for (const person of [workItem.assignee, workItem.reporter, metadata.assignee]) {
			if (person) byName.set(person.name, person);
		}
		return [...byName.values()];
	}, [metadata.assignee, workItem.assignee, workItem.reporter]);

	return (
		<aside aria-label="Work item details" className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto" data-team-eu26-high-confidence-rail>
			{showRecentAutomationRuns ? (
				<TeamEuRecentAutomationRuns onBack={() => setShowRecentAutomationRuns(false)} />
			) : (
				<div className="flex flex-col gap-4">
			<section aria-labelledby="team-eu26-details-heading" className="rounded-lg border border-border bg-surface p-4">
				<h2 className="mb-4 text-sm font-semibold text-text" id="team-eu26-details-heading">Details</h2>
				<div className="space-y-4">
					<DetailFieldRow
						label="Assignee"
						value={(
							<PersonRowField
								ariaLabel="Change assignee"
								onChange={(assignee) => actions.updateMetadata({ assignee })}
								people={people}
								placeholder="Unassigned"
								renderValue={(assignee) => <FieldValue icon={<PersonIcon label="" size="small" />}>{assignee.name}</FieldValue>}
								value={metadata.assignee}
							/>
						)}
					/>
					<DetailFieldRow
						label="Agent sessions"
						value={(
							<AgentsRowField
								onChange={(crew) => actions.updateMetadata({ crew })}
								trigger={(
									<DetailValueTrigger aria-label="Edit agent sessions">
										<FieldValue icon={<AiAgentIcon label="" size="small" />}>
											{metadata.crew.length > 0 ? `${metadata.crew.length} assigned` : "Needs input.."}
										</FieldValue>
									</DetailValueTrigger>
								)}
								value={metadata.crew}
							/>
						)}
					/>
					<DetailFieldRow
						label="Priority"
						value={<PriorityRowField onChange={(priority) => actions.updateMetadata({ priority })} value={metadata.priority} />}
					/>
					<DetailFieldRow
						label="Due date"
						value={(
							<DateRowField
								ariaLabel="Change due date"
								CalendarComponent={Calendar}
								dateValueMode="utc-date"
								leadingVisual={<Icon aria-hidden className="shrink-0 text-icon-subtle" render={<CalendarIcon label="" size="small" />} />}
								onChange={(dueDate) => actions.updateMetadata({ dueDate })}
								placeholder="Add due date"
								value={metadata.dueDate}
							/>
						)}
					/>
					{showMoreDetails ? (
						<>
							<DetailFieldRow label="Start date" value="May 12, 2026" />
							<DetailFieldRow label="Parent" value={<a className="text-text-brand underline" href="#vita-22">VITA-22</a>} />
							<DetailFieldRow label="Labels" value="onboarding, design-system" />
						</>
					) : null}
					<Button className="h-auto px-0 text-text-subtle" onClick={() => setShowMoreDetails((current) => !current)} size="compact" type="button" variant="link">
						{showMoreDetails ? "Show fewer details" : "Show more details"}
					</Button>
				</div>
			</section>
			<TeamEuDevelopmentPanel />
			<TeamEuAutomationPanel onShowRecentRuns={() => setShowRecentAutomationRuns(true)} />
			<TeamEuAppsPanel />
				</div>
			)}
		</aside>
	);
}
