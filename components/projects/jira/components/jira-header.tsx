"use client";

import { ExperimentalJiraKanbanBoardHeader } from "@/components/blocks/jira-kanban/experimental/experimental-board-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { token } from "@/lib/tokens";

import { DEFAULT_JIRA_WORK_ITEM_VIEW, type JiraWorkItemView } from "../data/tabs";
import { useJiraTabs } from "../hooks/use-jira-tabs";
import { resolveJiraTab } from "../lib/jira-tab-model";

interface JiraViewTabsProps {
	/**
	 * Selection is tracked by label, not index: the Simple views property
	 * decides whether work items is one tab or two, so an index would silently
	 * point at a different destination after a flip.
	 */
	selectedTabLabel: string;
	onTabChange: (tabLabel: string) => void;
	/**
	 * Current board/list choice. Only consulted when the selected label is absent
	 * from this catalog, so the reader keeps their view across a Simple views flip.
	 */
	workItemView?: JiraWorkItemView;
	/**
	 * Work item surfaces this route renders. A board-only route omits `list` so
	 * Team EU without Simple views shows `Board` instead of splitting into a
	 * `List` tab it cannot fill.
	 */
	supportedWorkItemViews?: readonly JiraWorkItemView[];
}

export function JiraViewTabs({
	selectedTabLabel,
	onTabChange,
	workItemView = DEFAULT_JIRA_WORK_ITEM_VIEW,
	supportedWorkItemViews,
}: Readonly<JiraViewTabsProps>) {
	const tabs = useJiraTabs(supportedWorkItemViews);
	const activeTab = resolveJiraTab(tabs, selectedTabLabel, workItemView);

	return (
		<Tabs value={activeTab?.label} onValueChange={onTabChange}>
			<TabsList variant="line" className="w-full justify-start">
				{tabs.map((tab, index) => {
					const IconComponent = tab.icon;
					const isFirst = index === 0;
					const isSelected = activeTab?.label === tab.label;

					return (
						<TabsTrigger
							key={tab.label}
							value={tab.label}
							className={isFirst ? "ml-4 flex-none" : "flex-none"}
						>
							<div className="flex items-center gap-1.5">
								<IconComponent
									label=""
									color={isSelected ? token("color.icon.selected") : "currentColor"}
								/>
								<span className={`text-sm font-medium${isSelected ? " text-text-selected" : ""}`}>
									{tab.label}
								</span>
							</div>
						</TabsTrigger>
					);
				})}
			</TabsList>
			{tabs.map((tab) => (
				<TabsContent key={tab.label} value={tab.label}>
					{tab.hasContent ? (
						<div />
					) : (
						<div style={{ padding: token("space.400") }}>
							<span className="text-sm font-medium text-text-subtlest">
								No RFP content here yet
							</span>
						</div>
					)}
				</TabsContent>
			))}
		</Tabs>
	);
}

export default function JiraHeader({
	selectedTabLabel,
	onTabChange,
	workItemView,
	supportedWorkItemViews,
}: Readonly<JiraViewTabsProps>) {
	return (
		<ExperimentalJiraKanbanBoardHeader
			showBoardControls={false}
			title="Enterprise RFP Response"
			viewTabs={(
				<JiraViewTabs
					selectedTabLabel={selectedTabLabel}
					onTabChange={onTabChange}
					supportedWorkItemViews={supportedWorkItemViews}
					workItemView={workItemView}
				/>
			)}
		/>
	);
}
