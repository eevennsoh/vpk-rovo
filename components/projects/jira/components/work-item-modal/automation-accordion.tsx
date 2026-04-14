"use client";

import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import Heading from "@/components/blocks/shared-ui/heading";

import { useWorkItemModal } from "@/app/contexts/context-work-item-modal";
import AutomationIcon from "@atlaskit/icon/core/automation";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronUpIcon from "@atlaskit/icon/core/chevron-up";

interface AutomationRuleProps {
	name: string;
	lastExecuted: string;
}

function AutomationRule({ name, lastExecuted }: Readonly<AutomationRuleProps>) {
	return (
		<div>
			<div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
				<AutomationIcon label="Automation" color={token("color.icon.success")} />
				<span className="text-sm font-medium">{name}</span>
			</div>
			<span className="text-xs text-text-subtlest">Last executed: {lastExecuted}</span>
		</div>
	);
}

export function AutomationAccordion() {
	const { state, actions } = useWorkItemModal();

	return (
		<div style={{ border: `1px solid ${token("color.border")}`, borderRadius: token("radius.medium") }}>
			<div style={{ padding: "8px" }}>
				<div className="flex items-center justify-between gap-2">
					<div className="flex items-center gap-2">
						<Heading size="small">Automation</Heading>
						<span className="text-xs text-text-subtlest">Rule executions</span>
					</div>
					<Button aria-label={state.isAutomationOpen ? "Collapse" : "Expand"} size="icon" variant="ghost" onClick={actions.toggleAutomation}>
						{state.isAutomationOpen ? <ChevronUpIcon label="" /> : <ChevronDownIcon label="" />}
					</Button>
				</div>
			</div>

			{state.isAutomationOpen && (
				<div style={{ padding: "8px 12px 12px" }}>
					<div className="flex flex-col gap-3">
						<AutomationRule name="Auto-assign rule" lastExecuted="2 hours ago" />
						<AutomationRule name="Status transition" lastExecuted="5 days ago" />
					</div>
				</div>
			)}
		</div>
	);
}
