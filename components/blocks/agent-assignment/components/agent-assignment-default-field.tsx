"use client";

import { useReducedMotion } from "motion/react";

import type { AgentAssignmentAgent } from "@/components/blocks/agent-assignment/components/agent-assignment";
import { toAssignmentActivity } from "@/components/blocks/agent-assignment/components/assignment-session";
import { JiraIssueAgentActivityRows } from "@/components/blocks/jira-issue/agent-activity";
import { cn } from "@/lib/utils";

export function AgentAssignmentDefaultField({
	assignedAgents,
	className,
}: Readonly<{
	assignedAgents: readonly AgentAssignmentAgent[];
	className?: string;
}>) {
	const shouldReduceMotion = useReducedMotion();
	const activities = assignedAgents.map(toAssignmentActivity);

	if (assignedAgents.length === 0) {
		return (
			<span className={cn("pointer-events-none relative z-10 text-sm text-text-subtlest", className)}>
				Assign agent
			</span>
		);
	}

	return (
		<div className={cn("pointer-events-none relative z-10 w-full min-w-0", className)}>
			<JiraIssueAgentActivityRows
				activities={activities}
				avatarLayout="animated"
				inheritChinSurface
				showAssignmentFlyout={false}
				shouldReduceMotion={shouldReduceMotion}
				usesStrokeChrome
			/>
		</div>
	);
}
