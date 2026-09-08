"use client";

import { useState, type ReactNode } from "react";

import type { KanbanColumnChrome } from "@/components/blocks/jira-kanban/column-chrome";
import ExperimentalJiraKanbanPage from "@/components/blocks/jira-kanban/experimental/page";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

import { AgentSessionColumnPanelDemo } from "./agent-session-column-panel-demo";

function readKanbanColumnChrome(
	values: readonly string[],
): KanbanColumnChrome | undefined {
	const next = values[0];
	if (next === "default" || next === "simple") {
		return next;
	}
	return undefined;
}

function DemoSection({
	action,
	label,
	children,
}: Readonly<{ action?: ReactNode; label: string; children: ReactNode }>) {
	return (
		<div className="flex flex-col gap-3">
			<div className="flex min-w-0 items-center justify-between gap-3">
				<span className="text-xs font-medium text-text-subtlest">{label}</span>
				{action ?? null}
			</div>
			{children}
		</div>
	);
}

export default function AgentSessionColumnPage({
	columnChrome: columnChromeProp = "default",
}: Readonly<{ columnChrome?: KanbanColumnChrome }>) {
	const [columnChrome, setColumnChrome] = useState(columnChromeProp);

	return (
		<div className="flex h-full w-full flex-col gap-10 bg-surface p-6">
			<DemoSection label="Panel">
				<AgentSessionColumnPanelDemo />
			</DemoSection>
			<DemoSection
				action={
					<ToggleGroup
						aria-label="Kanban column chrome"
						onValueChange={(values) => {
							const nextChrome = readKanbanColumnChrome(values);
							if (nextChrome) {
								setColumnChrome(nextChrome);
							}
						}}
						size="sm"
						value={[columnChrome]}
						variant="outline"
					>
						<ToggleGroupItem value="default">Default</ToggleGroupItem>
						<ToggleGroupItem value="simple">Simple</ToggleGroupItem>
					</ToggleGroup>
				}
				label="Kanban board"
			>
				<div className="min-h-[560px] h-[640px] overflow-hidden">
					<ExperimentalJiraKanbanPage
						agentSessionPresentation="column"
						columnChrome={columnChrome}
						insightsEnabled={false}
						showAgentSessionColumn
					/>
				</div>
			</DemoSection>
		</div>
	);
}
