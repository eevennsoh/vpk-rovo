"use client";

import { useState } from "react";

import { AgentSessionFlyout } from "@/components/blocks/agent-session-flyout/components/agent-session-flyout";
import type { JiraSidebarSessionItem } from "@/components/blocks/product-sidebar/variants/jira";
import type { JiraSessionFlyoutContent } from "@/components/blocks/product-sidebar/variants/jira-session-flyout";

export {
	AgentSessionFlyout,
	type AgentSessionFlyoutProps,
} from "@/components/blocks/agent-session-flyout/components/agent-session-flyout";
export {
	AGENT_SESSION_FLYOUT_CODING_LIFECYCLE_SESSIONS,
	AGENT_SESSION_FLYOUT_SESSIONS,
} from "@/components/blocks/agent-session-flyout/agent-session-flyout-data";

export default function AgentSessionFlyoutPage({
	content = "details",
	sessions,
}: Readonly<{
	content?: JiraSessionFlyoutContent;
	sessions?: readonly JiraSidebarSessionItem[];
}>): React.ReactElement {
	const [actionStatus, setActionStatus] = useState("No untracked work action taken.");

	return (
		<div className="flex h-full w-full flex-col items-center justify-center gap-6 p-6">
			<AgentSessionFlyout
				content={content}
				sessions={sessions}
				onAddAsSubtask={(session, workItemKey) => {
					setActionStatus(`Added ${session.title} as a subtask of ${workItemKey}.`);
				}}
				onArchiveSession={(session) => {
					setActionStatus(`Archived ${session.title}.`);
				}}
				onCreateWorkItem={(session) => {
					setActionStatus(`Started a new work item from ${session.title}.`);
				}}
				onLinkWorkItem={(session, workItemKey) => {
					setActionStatus(`Linked ${session.title} to ${workItemKey}.`);
				}}
			/>
			<p aria-live="polite" className="sr-only">{actionStatus}</p>
		</div>
	);
}
