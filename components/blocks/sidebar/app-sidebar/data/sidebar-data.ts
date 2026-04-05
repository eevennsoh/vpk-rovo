"use client"

import {
	LayoutDashboardIcon,
	ListIcon,
	ChartBarIcon,
	FolderIcon,
	UsersIcon,
	CameraIcon,
	FileTextIcon,
	Settings2Icon,
	CircleHelpIcon,
	SearchIcon,
	DatabaseIcon,
	FileChartColumnIcon,
	FileIcon,
} from "@/components/ui/vpk-icons"

export const USER_DATA = {
	name: "shadcn",
	email: "m@example.com",
	avatar: "/avatar-user/nova/color/asow-service-yellow.png",
} as const

export const NAV_MAIN_ITEMS = [
	{
		title: "Dashboard",
		url: "#",
		icon: LayoutDashboardIcon,
	},
	{
		title: "Lifecycle",
		url: "#",
		icon: ListIcon,
	},
	{
		title: "Analytics",
		url: "#",
		icon: ChartBarIcon,
	},
	{
		title: "Projects",
		url: "#",
		icon: FolderIcon,
	},
	{
		title: "Team",
		url: "#",
		icon: UsersIcon,
	},
] as const

export const NAV_CLOUDS_ITEMS = [
	{
		title: "Capture",
		icon: CameraIcon,
		isActive: true,
		url: "#",
		items: [
			{
				title: "Active Proposals",
				url: "#",
			},
			{
				title: "Archived",
				url: "#",
			},
		],
	},
	{
		title: "Proposal",
		icon: FileTextIcon,
		url: "#",
		items: [
			{
				title: "Active Proposals",
				url: "#",
			},
			{
				title: "Archived",
				url: "#",
			},
		],
	},
	{
		title: "Prompts",
		icon: FileTextIcon,
		url: "#",
		items: [
			{
				title: "Active Proposals",
				url: "#",
			},
			{
				title: "Archived",
				url: "#",
			},
		],
	},
] as const

export const NAV_SECONDARY_ITEMS = [
	{
		title: "Settings",
		url: "#",
		icon: Settings2Icon,
	},
	{
		title: "Get Help",
		url: "#",
		icon: CircleHelpIcon,
	},
	{
		title: "Search",
		url: "#",
		icon: SearchIcon,
	},
] as const

export const DOCUMENT_ITEMS = [
	{
		name: "Data Library",
		url: "#",
		icon: DatabaseIcon,
	},
	{
		name: "Reports",
		url: "#",
		icon: FileChartColumnIcon,
	},
	{
		name: "Word Assistant",
		url: "#",
		icon: FileIcon,
	},
] as const
