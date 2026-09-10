"use client";

import AgentAssignmentPage from "@/components/blocks/agent-assignment/page";

export default function AgentAssignmentDemo() {
	return (
		<div className="flex min-h-72 items-start justify-center p-8 pt-16">
			<AgentAssignmentPage />
		</div>
	);
}

export function AgentAssignmentDemoDefault() {
	return (
		<div className="flex min-h-72 items-start justify-center p-8 pt-16">
			<AgentAssignmentPage variant="default" />
		</div>
	);
}

export function AgentAssignmentDemoSimple() {
	return (
		<div className="flex min-h-72 items-start justify-center p-8 pt-16">
			<AgentAssignmentPage variant="simple" />
		</div>
	);
}
