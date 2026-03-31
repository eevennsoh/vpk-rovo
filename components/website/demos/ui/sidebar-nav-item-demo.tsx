"use client";

import AddIcon from "@atlaskit/icon/core/add";
import ChevronDownIcon from "@atlaskit/icon/core/chevron-down";
import ChevronRightIcon from "@atlaskit/icon/core/chevron-right";
import ProjectIcon from "@atlaskit/icon/core/project";
import { SidebarNavItem, SidebarNavItemAction, SidebarNavItemCount } from "@/components/ui/sidebar-nav-item";

function DemoFrame({ children }: Readonly<{ children: React.ReactNode }>) {
	return <div className="flex w-[276px] justify-center">{children}</div>;
}

function ChevronAction() {
	return (
		<SidebarNavItemAction
			aria-label="Open item details"
		>
			<ChevronRightIcon label="" />
		</SidebarNavItemAction>
	);
}

function AddAction() {
	return (
		<SidebarNavItemAction aria-label="Add child item">
			<AddIcon label="" />
		</SidebarNavItemAction>
	);
}

export default function SidebarNavItemDemo() {
	return (
		<div className="flex justify-center px-6 py-8">
			<div className="flex w-[276px] flex-col gap-4">
				<SidebarNavItemDemoDefault />
				<SidebarNavItemDemoExpanded />
				<SidebarNavItemDemoHovered />
				<SidebarNavItemDemoSelected />
				<SidebarNavItemDemoFocusVisible />
				<SidebarNavItemDemoWithCount />
				<SidebarNavItemDemoProjectCount />
				<SidebarNavItemDemoWithDescription />
			</div>
		</div>
	);
}

export function SidebarNavItemDemoDefault() {
	return (
		<DemoFrame>
			<SidebarNavItem
				label="Label"
				leading={<ChevronRightIcon label="" />}
				leadingSize="small"
				actions={<ChevronAction />}
			/>
		</DemoFrame>
	);
}

export function SidebarNavItemDemoExpanded() {
	return (
		<DemoFrame>
			<SidebarNavItem
				label="Label"
				leading={<ChevronDownIcon label="" />}
				leadingSize="small"
				isExpanded
				actions={
					<>
						<AddAction />
						<ChevronAction />
					</>
				}
			/>
		</DemoFrame>
	);
}

export function SidebarNavItemDemoHovered() {
	return (
		<DemoFrame>
			<SidebarNavItem
				label="Label"
				leading={<ChevronDownIcon label="" />}
				leadingSize="small"
				interactionState="hovered"
				isExpanded
				actions={
					<>
						<AddAction />
						<ChevronAction />
					</>
				}
			/>
		</DemoFrame>
	);
}

export function SidebarNavItemDemoSelected() {
	return (
		<DemoFrame>
			<SidebarNavItem
				label="Label"
				leading={<ChevronRightIcon label="" />}
				leadingSize="small"
				isSelected
				actions={<ChevronAction />}
			/>
		</DemoFrame>
	);
}

export function SidebarNavItemDemoFocusVisible() {
	return (
		<DemoFrame>
			<SidebarNavItem
				label="Label"
				leading={<ChevronRightIcon label="" />}
				leadingSize="small"
				interactionState="focus-visible"
				actions={<ChevronAction />}
			/>
		</DemoFrame>
	);
}

export function SidebarNavItemDemoWithCount() {
	return (
		<DemoFrame>
			<SidebarNavItem
				label="Label"
				leading={<ChevronRightIcon label="" />}
				leadingSize="small"
				meta={<SidebarNavItemCount>25</SidebarNavItemCount>}
				actions={<ChevronAction />}
			/>
		</DemoFrame>
	);
}

export function SidebarNavItemDemoProjectCount() {
	return (
		<DemoFrame>
			<SidebarNavItem
				label="Label"
				leading={<ProjectIcon label="" />}
				leadingSize="medium"
				meta={<SidebarNavItemCount>25</SidebarNavItemCount>}
				actions={<ChevronAction />}
			/>
		</DemoFrame>
	);
}

export function SidebarNavItemDemoWithDescription() {
	return (
		<DemoFrame>
			<SidebarNavItem
				label="Building a New App Concept"
				description="1 hour ago"
				actions={<ChevronAction />}
			/>
		</DemoFrame>
	);
}
