import {
	AppWindowIcon,
	AudioWaveformIcon,
	BookOpenIcon,
	BotIcon,
	ChartPieIcon,
	CommandIcon,
	GalleryVerticalEndIcon,
	GlobeIcon,
	SettingsIcon,
	TerminalIcon,
} from "@/components/ui/vpk-icons"

export const USER_DATA = {
	name: "shadcn",
	email: "m@example.com",
	avatar: "/avatar-user/nova/color/asow-service-yellow.png",
} as const

export const TEAMS = [
	{
		name: "Acme Inc",
		logo: GalleryVerticalEndIcon,
		plan: "Enterprise",
	},
	{
		name: "Acme Corp.",
		logo: AudioWaveformIcon,
		plan: "Startup",
	},
	{
		name: "Evil Corp.",
		logo: CommandIcon,
		plan: "Free",
	},
]

export const NAV_MAIN_ITEMS = [
	{
		title: "Playground",
		url: "#",
		icon: TerminalIcon,
		isActive: true,
		items: [
			{
				title: "History",
				url: "#",
			},
			{
				title: "Starred",
				url: "#",
			},
			{
				title: "Settings",
				url: "#",
			},
		],
	},
	{
		title: "Models",
		url: "#",
		icon: BotIcon,
		items: [
			{
				title: "Genesis",
				url: "#",
			},
			{
				title: "Explorer",
				url: "#",
			},
			{
				title: "Quantum",
				url: "#",
			},
		],
	},
	{
		title: "Documentation",
		url: "#",
		icon: BookOpenIcon,
		items: [
			{
				title: "Introduction",
				url: "#",
			},
			{
				title: "Get Started",
				url: "#",
			},
			{
				title: "Tutorials",
				url: "#",
			},
			{
				title: "Changelog",
				url: "#",
			},
		],
	},
	{
		title: "Settings",
		url: "#",
		icon: SettingsIcon,
		items: [
			{
				title: "General",
				url: "#",
			},
			{
				title: "Team",
				url: "#",
			},
			{
				title: "Billing",
				url: "#",
			},
			{
				title: "Limits",
				url: "#",
			},
		],
	},
]

export const PROJECTS = [
	{
		name: "Design Engineering",
		url: "#",
		icon: AppWindowIcon,
	},
	{
		name: "Sales & Marketing",
		url: "#",
		icon: ChartPieIcon,
	},
	{
		name: "Travel",
		url: "#",
		icon: GlobeIcon,
	},
]
