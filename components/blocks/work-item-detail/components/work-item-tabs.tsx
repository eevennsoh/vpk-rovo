"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { WorkItemDetails } from "./work-item-details";
import { WorkItemComments } from "./work-item-comments";
import { WorkItemLinks } from "./work-item-links";
import type { WorkItem, Comment, LinkedItem } from "../types";

const TABS = ["details", "comments", "links", "history"] as const;
type TabValue = (typeof TABS)[number];

interface WorkItemTabsProps {
	workItem: WorkItem;
	comments: Comment[];
	linkedItems: LinkedItem[];
}

function getTabLabel(tab: TabValue, commentsCount: number, linksCount: number): string {
	switch (tab) {
		case "details":
			return "Details";
		case "comments":
			return `Comments (${commentsCount})`;
		case "links":
			return `Links (${linksCount})`;
		case "history":
			return "History";
	}
}

export function WorkItemTabs({ workItem, comments, linkedItems }: Readonly<WorkItemTabsProps>) {
	const [activeTab, setActiveTab] = useState<TabValue>("details");

	return (
		<>
			{/* Tabs */}
			<div className="border-b border-border">
				<div className="flex gap-1" role="tablist">
					{TABS.map((tab) => (
						<button
							key={tab}
							type="button"
							id={`tab-${tab}`}
							role="tab"
							aria-selected={activeTab === tab}
							aria-controls={`panel-${tab}`}
							tabIndex={activeTab === tab ? 0 : -1}
							onClick={() => setActiveTab(tab)}
							className={cn(
								"px-4 py-3 font-medium text-sm transition-colors border-b-2",
								activeTab === tab
									? "text-text border-b-border-bold"
									: "text-text-subtle border-b-transparent hover:text-text"
							)}
						>
							{getTabLabel(tab, comments.length, linkedItems.length)}
						</button>
					))}
				</div>
			</div>

			{/* Tab Content */}
			<div
				id={`panel-${activeTab}`}
				role="tabpanel"
				aria-labelledby={`tab-${activeTab}`}
				className="bg-surface rounded-lg p-6"
			>
				{activeTab === "details" ? <WorkItemDetails workItem={workItem} /> : null}
				{activeTab === "comments" ? <WorkItemComments comments={comments} /> : null}
				{activeTab === "links" ? <WorkItemLinks linkedItems={linkedItems} /> : null}
				{activeTab === "history" ? (
					<div className="text-center py-8 text-text-subtle">
						Activity history coming soon
					</div>
				) : null}
			</div>
		</>
	);
}
