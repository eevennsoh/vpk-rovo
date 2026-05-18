"use client";

import Image from "next/image";
import Heading from "@/components/blocks/shared-ui/heading";
import { token } from "@/lib/tokens";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { JIRA_TABS } from "../data/tabs";
import ExpandHorizontalIcon from "@atlaskit/icon/core/expand-horizontal";
import ShareIcon from "@atlaskit/icon/core/share";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import TeamsIcon from "@atlaskit/icon/core/teams";

interface JiraHeaderProps {
	selectedTab: number;
	onTabChange: (tabIndex: number) => void;
}

export default function JiraHeader({ selectedTab, onTabChange }: Readonly<JiraHeaderProps>) {
	return (
		<div className="pt-4">
			<div className="flex flex-col gap-1">
				{/* Top row: Spaces label and heading with buttons */}
				<div
					className="flex justify-between items-center gap-2"
				>
					<div className="px-4">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm text-text-subtle font-medium">
								Spaces
							</span>
							<div className="flex items-center gap-2">
								<Image
									src="/avatar-project/rocket.svg"
									alt="Project avatar"
									width={16}
									height={16}
									style={{ width: "16px", height: "16px", borderRadius: token("radius.xsmall") }}
								/>
								<Heading size="medium">Omni Live Launch</Heading>
								<Button aria-label="Teams" size="icon-xs" variant="ghost">
									<TeamsIcon label="" size="small" />
								</Button>
								<Button aria-label="More options" size="icon-xs" variant="ghost">
									<ShowMoreHorizontalIcon label="" size="small" />
								</Button>
							</div>
						</div>
					</div>

					<div className="px-4">
						<div className="flex gap-2">
							<Button aria-label="Share" size="icon" variant="ghost">
								<ShareIcon label="" />
							</Button>
							<Button aria-label="Expand" size="icon" variant="ghost">
								<ExpandHorizontalIcon label="" />
							</Button>
						</div>
					</div>
				</div>

				{/* Tabs */}
				<div>
					<Tabs
						value={JIRA_TABS[selectedTab]?.label ?? JIRA_TABS[0]?.label}
						onValueChange={(value) => {
							const nextIndex = JIRA_TABS.findIndex((tab) => tab.label === value);
							if (nextIndex !== -1) {
								onTabChange(nextIndex);
							}
						}}
					>
						<TabsList variant="line" className="w-full justify-start">
							{JIRA_TABS.map((tab, index) => {
								const IconComponent = tab.icon;
								const isFirst = index === 0;
								const isSelected = selectedTab === index;

								return (
									<TabsTrigger
										key={tab.label}
										value={tab.label}
										className={isFirst ? "ml-2 flex-none" : "flex-none"}
									>
										<div className="flex items-center gap-1.5">
											<IconComponent
												label={tab.label}
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
						{JIRA_TABS.map((tab) => (
							<TabsContent key={tab.label} value={tab.label}>
								{tab.hasContent ? (
									<div />
								) : (
									<div style={{ padding: token("space.400") }}>
										<span className="text-sm font-medium text-text-subtlest">
											No Omni Live content here yet
										</span>
									</div>
								)}
							</TabsContent>
						))}
					</Tabs>
				</div>
			</div>
		</div>
	);
}
