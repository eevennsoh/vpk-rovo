"use client";

import AddIcon from "@atlaskit/icon/core/add";
import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";
import RepeatIcon from "@atlaskit/icon-lab/core/repeat";

import { TeamEuRailPanel } from "@/components/blocks/jira-work-item/team-eu26/components/team-eu-rail-panel";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";

const AUTOMATIONS = [
	"Send reminder 24 hours before due date",
	"Notify team when status changes to Done",
	"Mark as complete when all subtasks done",
	"Update sprint board when task moves to In Progress",
	"Escalate to manager if overdue by 3 days",
	"Send daily digest of open tasks to team",
	"Log time automatically when status changes",
	"Create Slack notification for high priority items",
] as const;

const RECENT_RUNS = [
	AUTOMATIONS[3],
	AUTOMATIONS[7],
	AUTOMATIONS[0],
	AUTOMATIONS[5],
] as const;
const ACTION_ROW_CLASS =
	"flex min-h-10 w-full min-w-0 items-center gap-2 px-4 text-left text-sm text-text outline-none transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none";

export function TeamEuAutomationPanel({
	onShowRecentRuns,
}: Readonly<{ onShowRecentRuns: () => void }>) {
	return (
		<TeamEuRailPanel title="Automation">
			<div className="pb-3">
				<ul aria-label="Available automations" className="px-2 pb-2">
					{AUTOMATIONS.map((automation) => (
						<li key={automation}>
							<button
								className="flex h-10 w-full min-w-0 items-center gap-2 rounded-md px-2 text-left text-sm text-text outline-none transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
								type="button"
							>
								<IconTile
									aria-hidden
									as="span"
									icon={<AutomationIcon label="" size="small" />}
									label=""
									size="small"
									variant="green"
								/>
								<span className="truncate">{automation}</span>
							</button>
						</li>
					))}
				</ul>
				<button
					className={`${ACTION_ROW_CLASS} border-y border-border`}
					onClick={onShowRecentRuns}
					type="button"
				>
					<span className="min-w-0 flex-1 font-medium">Recent run rules</span>
					<ChevronRightIcon label="" size="small" />
				</button>
				<button className={ACTION_ROW_CLASS} type="button">
					<RepeatIcon label="" size="small" />
					<span>Set to recur</span>
				</button>
				<button className={ACTION_ROW_CLASS} type="button">
					<AddIcon label="" size="small" />
					<span>Create automation</span>
				</button>
			</div>
		</TeamEuRailPanel>
	);
}

export function TeamEuRecentAutomationRuns({
	onBack,
}: Readonly<{ onBack: () => void }>) {
	return (
		<section aria-labelledby="team-eu-recent-runs-heading" className="pt-1">
			<div className="flex min-h-10 items-center gap-1 px-3">
				<Button
					aria-label="Back to work item details"
					onClick={onBack}
					size="icon-compact"
					type="button"
					variant="ghost"
				>
					<ArrowLeftIcon label="" size="small" />
				</Button>
				<h2
					className="text-sm font-semibold text-text"
					id="team-eu-recent-runs-heading"
				>
					Recent run rules
				</h2>
			</div>
			<ul className="px-2" aria-label="Recent automation runs">
				{RECENT_RUNS.map((automation) => (
					<li
						className="flex h-10 min-w-0 items-center gap-2 px-2 text-sm"
						key={automation}
					>
						<Icon
							aria-hidden
							className="shrink-0 text-icon-success"
							render={<StatusSuccessIcon label="" size="small" />}
						/>
						<span className="min-w-0 flex-1 truncate">{automation}</span>
						<time className="shrink-0 text-text-subtlest">167 days ago</time>
					</li>
				))}
			</ul>
		</section>
	);
}
