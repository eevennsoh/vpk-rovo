"use client";

import { useState, type ReactElement, type ReactNode } from "react";
import AiAgentIcon from "@atlaskit/icon/core/ai-agent";
import CalendarIcon from "@atlaskit/icon/core/calendar";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import PersonIcon from "@atlaskit/icon/core/person";
import PriorityHighIcon from "@atlaskit/icon/core/priority-high";

import { StatusPill } from "@/components/blocks/jira-work-item/team-eu26/components/detail-field-editors";
import {
	useJiraWorkItemActions,
	useJiraWorkItemState,
} from "@/components/blocks/jira-work-item/team-eu26/context-jira-work-item";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

function DetailRow({ children, icon, label }: Readonly<{ children: ReactNode; icon?: ReactElement; label: string }>) {
	return (
		<div className="space-y-1">
			<div className="text-xs text-text-subtlest">{label}</div>
			<div className="flex min-h-6 items-center gap-2 text-sm text-text">
				{icon ? <Icon aria-hidden className="shrink-0 text-icon-subtle" render={icon} /> : null}
				{children}
			</div>
		</div>
	);
}

function DisclosureCard({ children, title }: Readonly<{ children: ReactNode; title: string }>) {
	const [open, setOpen] = useState(false);
	return (
		<section className="overflow-hidden rounded-lg border border-border bg-surface" aria-labelledby={`team-eu26-${title.toLowerCase()}-heading`}>
			<Button
				aria-expanded={open}
				className="h-14 w-full justify-between rounded-none px-4 font-semibold"
				onClick={() => setOpen((current) => !current)}
				type="button"
				variant="ghost"
			>
				<span id={`team-eu26-${title.toLowerCase()}-heading`}>{title}</span>
				<span className={open ? "rotate-90 motion-reduce:transform-none" : undefined}>
					<ChevronRightIcon label="" size="small" />
				</span>
			</Button>
			{open ? <div className="border-t border-border px-4 py-3 text-sm text-text-subtle">{children}</div> : null}
		</section>
	);
}

export function HighConfidenceMetadataRail() {
	const { metadata } = useJiraWorkItemState();
	const actions = useJiraWorkItemActions();
	const [showMoreDetails, setShowMoreDetails] = useState(false);

	return (
		<aside aria-label="Work item details" className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto" data-team-eu26-high-confidence-rail>
			<div className="flex h-12 shrink-0 items-center rounded-lg bg-bg-selected px-3">
				<StatusPill onChange={(status) => actions.updateMetadata({ status })} value={metadata.status} />
			</div>
			<section aria-labelledby="team-eu26-details-heading" className="rounded-lg border border-border bg-surface p-4">
				<h2 className="mb-4 text-sm font-semibold text-text" id="team-eu26-details-heading">Details</h2>
				<div className="space-y-4">
					<DetailRow icon={<PersonIcon label="" size="small" />} label="Assignee">Automatic</DetailRow>
					<DetailRow icon={<AiAgentIcon label="" size="small" />} label="Agent sessions">Needs input..</DetailRow>
					<DetailRow icon={<PriorityHighIcon label="" size="small" />} label="Priority">High</DetailRow>
					<DetailRow icon={<CalendarIcon label="" size="small" />} label="Due date">May 25, 2026</DetailRow>
					{showMoreDetails ? (
						<>
							<DetailRow label="Start date">May 12, 2026</DetailRow>
							<DetailRow label="Parent"><a className="text-text-brand underline" href="#vita-22">VITA-22</a></DetailRow>
							<DetailRow label="Labels">onboarding, design-system</DetailRow>
						</>
					) : null}
					<Button className="h-auto px-0 text-text-subtle" onClick={() => setShowMoreDetails((current) => !current)} size="compact" type="button" variant="link">
						{showMoreDetails ? "Show fewer details" : "Show more details"}
					</Button>
				</div>
			</section>
			<DisclosureCard title="Development">
				<a className="text-text-brand underline" href="#development">aclare/MOB-142-rate-limiting</a>
			</DisclosureCard>
			<DisclosureCard title="Automation">No automation rules have run for this work item.</DisclosureCard>
			<DisclosureCard title="Apps">No connected apps are showing content.</DisclosureCard>
			<p aria-live="polite" className="sr-only">Current status: {metadata.status}</p>
		</aside>
	);
}
