"use client";

import AddIcon from "@atlaskit/icon/core/add";
import ArrowLeftIcon from "@atlaskit/icon/core/arrow-left";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";

import type { WorkItemAutomationRule } from "@/components/blocks/jira-work-item/team-eu26/components/automation-tab";
import { SetToRecurRow } from "@/components/blocks/jira-work-item/team-eu26/components/set-to-recur-popover";
import { TeamEuRailPanel } from "@/components/blocks/jira-work-item/team-eu26/components/team-eu-rail-panel";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile } from "@/components/ui/icon-tile";

const REFERENCE_RECENT_ORDER = [
	"sprint-board",
	"slack",
	"reminder",
	"daily-digest",
] as const;
const ACTION_ROW_CLASS =
	"flex min-h-10 w-full min-w-0 items-center gap-2 px-4 text-left text-sm text-text";

function recentRules(rules: readonly WorkItemAutomationRule[]) {
	const order = new Map<string, number>(
		REFERENCE_RECENT_ORDER.map((id, index) => [id, index]),
	);
	return rules
		.filter((rule) => rule.lastRunAt)
		.toSorted(
			(left, right) =>
				(order.get(left.id) ?? Number.MAX_SAFE_INTEGER) -
				(order.get(right.id) ?? Number.MAX_SAFE_INTEGER),
		);
}

export function TeamEuAutomationPanel({
	onShowRecentRuns,
	rules,
}: Readonly<{
	onShowRecentRuns: () => void;
	rules: readonly WorkItemAutomationRule[];
}>) {
	return (
		<TeamEuRailPanel title="Automation">
			<div className="pb-3">
				{rules.length > 0 ? (
					<ul aria-label="Available automations" className="px-2 pb-2">
						{rules.map((rule) => (
							<li key={rule.id}>
								<div className="flex h-10 min-w-0 items-center gap-2 rounded-md px-2 text-sm text-text">
									<IconTile
										aria-hidden
										as="span"
										icon={<AutomationIcon label="" size="small" />}
										label=""
										size="small"
										variant={rule.iconVariant}
									/>
									<span className="truncate">{rule.title}</span>
								</div>
							</li>
						))}
					</ul>
				) : (
					<p className="px-4 pb-3 text-sm text-text-subtle">
						No automation rules have run for this work item.
					</p>
				)}
				<button
					className={`${ACTION_ROW_CLASS} border-y border-border outline-none transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring motion-reduce:transition-none`}
					onClick={onShowRecentRuns}
					type="button"
				>
					<span className="min-w-0 flex-1 font-medium">Recent run rules</span>
					<ChevronRightIcon label="" size="small" />
				</button>
				<div className="px-4">
					<SetToRecurRow />
				</div>
				<div className={ACTION_ROW_CLASS}>
					<AddIcon label="" size="small" />
					<span>Create automation</span>
				</div>
			</div>
		</TeamEuRailPanel>
	);
}

export function TeamEuRecentAutomationRuns({
	onBack,
	rules,
}: Readonly<{ onBack: () => void; rules: readonly WorkItemAutomationRule[] }>) {
	const runs = recentRules(rules);
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
			{runs.length > 0 ? (
				<ul aria-label="Recent automation runs" className="px-2">
					{runs.map((rule) => (
						<li
							className="flex h-10 min-w-0 items-center gap-2 px-2 text-sm"
							key={rule.id}
						>
							<Icon
								aria-hidden
								className="shrink-0 text-icon-success"
								render={<StatusSuccessIcon label="" size="small" />}
							/>
							<span className="min-w-0 flex-1 truncate">{rule.title}</span>
							<time className="shrink-0 text-text-subtlest">
								{rule.lastRunAt}
							</time>
						</li>
					))}
				</ul>
			) : (
				<p className="px-4 py-2 text-sm text-text-subtle">
					No recent rule runs.
				</p>
			)}
		</section>
	);
}
