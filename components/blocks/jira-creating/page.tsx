"use client";

import { JiraCreateBoard } from "./components/jira-creating-board";
import { JiraCreateToolbar } from "./components/jira-creating-toolbar";
import type { JiraCreateExample } from "./data/jira-creating-board";
import { useJiraCreateDemo } from "./hooks/use-jira-creating-demo";

export interface JiraCreatePageProps {
	example?: JiraCreateExample;
}

export default function JiraCreatePage({
	example = "work-item",
}: Readonly<JiraCreatePageProps>) {
	const demo = useJiraCreateDemo(example);

	return (
		<div className="relative flex h-[520px] w-full min-w-0 flex-col overflow-hidden bg-surface">
			<JiraCreateToolbar
				example={demo.example}
				onAdd={demo.addCards}
				onExampleChange={demo.setCreateExample}
				onPositionChange={demo.setInsertPosition}
				onRestart={demo.restart}
				position={demo.position}
			/>
			<JiraCreateBoard
				className="min-h-0 flex-1"
				key={demo.boardGeneration}
				revealItemIds={demo.revealItemIds}
				todoItems={demo.todoItems}
			/>
		</div>
	);
}
