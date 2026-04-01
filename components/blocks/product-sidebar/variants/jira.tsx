"use client";

import { useState } from "react";
import { token } from "@/lib/tokens";
import { NavigationItem } from "../components/navigation-item";
import { NavigationItemWithHoverChevron } from "../components/navigation-item-with-hover-chevron";
import { Divider } from "../components/divider";
import { ProjectItem } from "../components/project-item";
import { SectionHeading } from "../components/section-heading";
import { STARRED_PROJECTS, JIRA_EXTERNAL_LINKS } from "../data/jira-navigation";
import AlignTextLeftIcon from "@atlaskit/icon/core/align-text-left";
import AppsIcon from "@atlaskit/icon/core/apps";
import ChartTrendIcon from "@atlaskit/icon/core/chart-trend";
import ClockIcon from "@atlaskit/icon/core/clock";
import DashboardIcon from "@atlaskit/icon/core/dashboard";
import PersonAvatarIcon from "@atlaskit/icon/core/person-avatar";
import PlanIcon from "@atlaskit/icon/core/list-checklist";
import ShowMoreHorizontalIcon from "@atlaskit/icon/core/show-more-horizontal";
import SpacesIcon from "@atlaskit/icon-lab/core/spaces";
import StarUnstarredIcon from "@atlaskit/icon/core/star-unstarred";
import BoardIcon from "@atlaskit/icon/core/board";
import FolderIcon from "@atlaskit/icon/core/folder-closed";
import TaskIcon from "@atlaskit/icon/core/task";

interface JiraSidebarProps {
	selectedItem: string;
	onSelectItem: (item: string) => void;
}

export function JiraSidebar({
	selectedItem,
	onSelectItem,
}: Readonly<JiraSidebarProps>) {
	const [isSpacesExpanded, setIsSpacesExpanded] = useState(true);

	return (
		<>
			<NavigationItem
				icon={PersonAvatarIcon}
				label="For you"
				isSelected={selectedItem === "For you"}
				onClick={() => onSelectItem("For you")}
			/>
			<NavigationItem
				icon={ClockIcon}
				label="Recent"
				hasChevron
				onClick={() => onSelectItem("Recent")}
			/>
			<NavigationItem
				icon={StarUnstarredIcon}
				label="Starred"
				hasChevron
				onClick={() => onSelectItem("Starred")}
			/>
			<NavigationItem
				icon={BoardIcon}
				label="Sprint Board"
				href="/sprint-board"
				isSelected={selectedItem === "Sprint Board"}
				onClick={() => onSelectItem("Sprint Board")}
			/>
			<NavigationItem
				icon={FolderIcon}
				label="Projects"
				href="/projects"
				isSelected={selectedItem === "Projects"}
				onClick={() => onSelectItem("Projects")}
			/>
			<NavigationItem
				icon={ChartTrendIcon}
				label="Analytics"
				href="/analytics"
				isSelected={selectedItem === "Analytics"}
				onClick={() => onSelectItem("Analytics")}
			/>
			<NavigationItem
				icon={TaskIcon}
				label="To-Do"
				href="/todo"
				isSelected={selectedItem === "To-Do"}
				onClick={() => onSelectItem("To-Do")}
			/>

			<NavigationItemWithHoverChevron
				icon={AppsIcon}
				label="Apps"
				isExpanded={false}
				onClick={() => onSelectItem("Apps")}
			/>

			<NavigationItemWithHoverChevron
				icon={PlanIcon}
				label="Plans"
				isExpanded={false}
				hasActions={true}
				onClick={() => onSelectItem("Plans")}
			/>

			<NavigationItemWithHoverChevron
				icon={SpacesIcon}
				label="Spaces"
				isExpanded={isSpacesExpanded}
				hasActions={true}
				onClick={() => setIsSpacesExpanded((prev) => !prev)}
			/>

			{isSpacesExpanded && (
				<>
					<SectionHeading>Starred</SectionHeading>
					<div style={{ paddingLeft: token("space.150") }}>
						{STARRED_PROJECTS.map((project) => (
							<ProjectItem
								key={project.id}
								name={project.name}
								imageSrc={project.imageSrc}
								isSelected={selectedItem === project.name}
								onClick={() => onSelectItem(project.name)}
							/>
						))}
					</div>

					<div style={{ paddingLeft: token("space.150") }}>
						<NavigationItem
							icon={AlignTextLeftIcon}
							label="View all plans"
							onClick={() => onSelectItem("View all plans")}
						/>
					</div>
					<NavigationItem
						icon={DashboardIcon}
						label="Dashboards"
						onClick={() => onSelectItem("Dashboards")}
					/>
				</>
			)}

			<Divider />

			{JIRA_EXTERNAL_LINKS.map((link) => (
				<NavigationItem
					key={link.id}
					icon={link.icon}
					label={link.label}
					href={link.href}
					hasExternalLink
					onClick={() => onSelectItem(link.label)}
				/>
			))}

			<Divider />

			<NavigationItem
				icon={ShowMoreHorizontalIcon}
				label="More"
				onClick={() => onSelectItem("More")}
			/>
		</>
	);
}
