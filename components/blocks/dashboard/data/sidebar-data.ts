import {
	ArrowUpCircleIcon,
	BarChartIcon,
	CameraIcon,
	ClipboardListIcon,
	DatabaseIcon,
	FileCodeIcon,
	FileIcon,
	FileTextIcon,
	FolderIcon,
	HelpCircleIcon,
	LayoutDashboardIcon,
	ListIcon,
	SearchIcon,
	SettingsIcon,
	UsersIcon,
} from "@/components/ui/vpk-icons"

export const SIDEBAR_USER = {
	name: "shadcn",
	email: "m@example.com",
	avatar: "/avatar-user/nova/color/asow-service-yellow.png",
} as const;

export const SIDEBAR_NAV_MAIN = [
	{ title: "Dashboard", url: "#", icon: LayoutDashboardIcon },
	{ title: "Lifecycle", url: "#", icon: ListIcon },
	{ title: "Analytics", url: "#", icon: BarChartIcon },
	{ title: "Projects", url: "#", icon: FolderIcon },
	{ title: "Team", url: "#", icon: UsersIcon },
] as const;

export const SIDEBAR_NAV_CLOUDS = [
	{
		title: "Capture",
		icon: CameraIcon,
		isActive: true,
		url: "#",
		items: [
			{ title: "Active Proposals", url: "#" },
			{ title: "Archived", url: "#" },
		],
	},
	{
		title: "Proposal",
		icon: FileTextIcon,
		url: "#",
		items: [
			{ title: "Active Proposals", url: "#" },
			{ title: "Archived", url: "#" },
		],
	},
	{
		title: "Prompts",
		icon: FileCodeIcon,
		url: "#",
		items: [
			{ title: "Active Proposals", url: "#" },
			{ title: "Archived", url: "#" },
		],
	},
] as const;

export const SIDEBAR_NAV_SECONDARY = [
	{ title: "Settings", url: "#", icon: SettingsIcon },
	{ title: "Get Help", url: "#", icon: HelpCircleIcon },
	{ title: "Search", url: "#", icon: SearchIcon },
] as const;

export const SIDEBAR_DOCUMENTS = [
	{ name: "Data Library", url: "#", icon: DatabaseIcon },
	{ name: "Reports", url: "#", icon: ClipboardListIcon },
	{ name: "Word Assistant", url: "#", icon: FileIcon },
] as const;

export const SIDEBAR_LOGO_ICON = ArrowUpCircleIcon;
