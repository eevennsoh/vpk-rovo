"use client";

import AddIcon from "@atlaskit/icon/core/add";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import StatusSuccessIcon from "@atlaskit/icon/core/status-success";

import { SetToRecurRow } from "@/components/blocks/jira-work-item/team-eu26/components/set-to-recur-popover";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { IconTile, type IconTileVariant } from "@/components/ui/icon-tile";

export interface WorkItemAutomationRule {
	id: string;
	title: string;
	iconVariant: Extract<IconTileVariant, "blue" | "green" | "purple">;
	lastRunAt?: string;
}

function AutomationRuleRows({ rules }: Readonly<{ rules: readonly WorkItemAutomationRule[] }>) {
	return (
		<ul aria-label="Available automations" className="flex flex-col">
			{rules.map((rule) => (
				<li className="min-w-0" key={rule.id}>
					<button
						className="-mx-2 flex w-[calc(100%+1rem)] min-w-0 items-center gap-3 rounded-md px-2 py-2 text-left outline-none transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
						type="button"
					>
						<IconTile
							aria-hidden
							as="span"
							icon={<AutomationIcon label="" size="small" color="currentColor" />}
							label=""
							size="small"
							variant={rule.iconVariant}
						/>
						<span className="min-w-0 flex-1 truncate text-sm text-text">{rule.title}</span>
					</button>
				</li>
			))}
		</ul>
	);
}

function CreateAutomationRow() {
	return (
		<button
			className="-mx-2 flex w-[calc(100%+1rem)] min-w-0 items-center gap-3 rounded-md px-2 py-2 text-left outline-none transition-colors duration-xxshort ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
			type="button"
		>
			<IconTile
				aria-hidden
				as="span"
				icon={<AddIcon label="" size="small" />}
				label=""
				size="small"
				variant="gray"
			/>
			<span className="min-w-0 flex-1 truncate text-sm text-text">Create automation</span>
		</button>
	);
}

/**
 * The Automation tab: empty-state copy, Recent rule runs, and Set to recur.
 * Visual/mock —
 * no real automation engine.
 */
export function AutomationTab({ rules = [] }: Readonly<{ rules?: readonly WorkItemAutomationRule[] }>) {
	const hasRules = rules.length > 0;
	const latestRule = rules[rules.length - 1];
	const recentRunByline = latestRule?.lastRunAt
		? `${latestRule.title} · ${latestRule.lastRunAt}`
		: "View automation history";

	return (
		<div className="flex flex-col">
			{hasRules ? (
				<div className="flex flex-col py-1">
					<CreateAutomationRow />
					<AutomationRuleRows rules={rules} />
				</div>
			) : (
				<div className="flex flex-col items-center gap-3 px-2 py-4 text-center">
					<p className="text-sm leading-5 text-text-subtle">
						Create an automation to perform tasks with the click of a button. Once created, manually triggered
						automations will appear here.
					</p>
					<Button variant="outline">
						Add manually triggered automation
					</Button>
					<a
						className="text-sm font-medium text-link hover:underline"
						href="#"
						onClick={(event) => event.preventDefault()}
					>
						See templates
					</a>
				</div>
			)}

			<div className="flex flex-col">
				<button
					className="-mx-2 flex items-center gap-2 rounded-md px-2 py-2 text-left outline-none transition-colors duration-normal ease-out-practical hover:bg-bg-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-ring motion-reduce:transition-none"
					type="button"
				>
					<span className="flex min-w-0 flex-1 flex-col">
						<span className="truncate text-sm font-medium text-text">Recent rule runs</span>
						<span className="flex min-w-0 items-center gap-1">
							{latestRule?.lastRunAt ? (
								<Icon
									aria-hidden
									className="size-3 shrink-0 text-icon-success [&_svg]:size-3!"
									render={<StatusSuccessIcon label="" size="small" />}
								/>
							) : null}
							<span className="min-w-0 truncate text-xs text-text-subtlest">{recentRunByline}</span>
						</span>
					</span>
					<Icon aria-hidden className="text-icon-subtle" render={<ChevronRightIcon label="" size="small" />} />
				</button>
				<SetToRecurRow />
			</div>
		</div>
	);
}
