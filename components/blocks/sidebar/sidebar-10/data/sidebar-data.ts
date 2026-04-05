import {
	AudioWaveformIcon,
	CalendarIcon,
	Columns3Icon,
	CommandIcon,
	HelpCircleIcon,
	HomeIcon,
	InboxIcon,
	SearchIcon,
	SettingsIcon,
	SparklesIcon,
	Trash2Icon,
} from "@/components/ui/vpk-icons"

export const TEAMS = [
	{
		name: "Acme Inc",
		logo: CommandIcon,
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
] as const

export const NAV_MAIN_ITEMS = [
	{
		title: "Search",
		url: "#",
		icon: SearchIcon,
	},
	{
		title: "Ask AI",
		url: "#",
		icon: SparklesIcon,
	},
	{
		title: "Home",
		url: "#",
		icon: HomeIcon,
		isActive: true,
	},
	{
		title: "Inbox",
		url: "#",
		icon: InboxIcon,
		badge: "10",
	},
] as const

export const NAV_SECONDARY_ITEMS = [
	{
		title: "Calendar",
		url: "#",
		icon: CalendarIcon,
	},
	{
		title: "Settings",
		url: "#",
		icon: SettingsIcon,
	},
	{
		title: "Projects",
		url: "#",
		icon: Columns3Icon,
	},
	{
		title: "Trash",
		url: "#",
		icon: Trash2Icon,
	},
	{
		title: "Help",
		url: "#",
		icon: HelpCircleIcon,
	},
] as const

export const FAVORITES = [
	{
		name: "Project Management & Task Tracking",
		url: "#",
		emoji: "📊",
	},
	{
		name: "Family Recipe Collection & Meal Planning",
		url: "#",
		emoji: "🍳",
	},
	{
		name: "Fitness Tracker & Workout Routines",
		url: "#",
		emoji: "💪",
	},
	{
		name: "Book Notes & Reading List",
		url: "#",
		emoji: "📚",
	},
	{
		name: "Sustainable Gardening Tips & Plant Care",
		url: "#",
		emoji: "🌱",
	},
	{
		name: "Language Learning Progress & Resources",
		url: "#",
		emoji: "🗣️",
	},
	{
		name: "Home Renovation Ideas & Budget Tracker",
		url: "#",
		emoji: "🏠",
	},
	{
		name: "Personal Finance & Investment Portfolio",
		url: "#",
		emoji: "💰",
	},
	{
		name: "Movie & TV Show Watchlist with Reviews",
		url: "#",
		emoji: "🎬",
	},
	{
		name: "Daily Habit Tracker & Goal Setting",
		url: "#",
		emoji: "✅",
	},
] as const

export const WORKSPACES = [
	{
		name: "Personal Life Management",
		emoji: "🏠",
		pages: [
			{
				name: "Daily Journal & Reflection",
				url: "#",
				emoji: "📔",
			},
			{
				name: "Health & Wellness Tracker",
				url: "#",
				emoji: "🍏",
			},
			{
				name: "Personal Growth & Learning Goals",
				url: "#",
				emoji: "🌟",
			},
		],
	},
	{
		name: "Professional Development",
		emoji: "💼",
		pages: [
			{
				name: "Career Objectives & Milestones",
				url: "#",
				emoji: "🎯",
			},
			{
				name: "Skill Acquisition & Training Log",
				url: "#",
				emoji: "🧠",
			},
			{
				name: "Networking Contacts & Events",
				url: "#",
				emoji: "🤝",
			},
		],
	},
	{
		name: "Creative Projects",
		emoji: "🎨",
		pages: [
			{
				name: "Writing Ideas & Story Outlines",
				url: "#",
				emoji: "✍️",
			},
			{
				name: "Art & Design Portfolio",
				url: "#",
				emoji: "🖼️",
			},
			{
				name: "Music Composition & Practice Log",
				url: "#",
				emoji: "🎵",
			},
		],
	},
	{
		name: "Home Management",
		emoji: "🏡",
		pages: [
			{
				name: "Household Budget & Expense Tracking",
				url: "#",
				emoji: "💰",
			},
			{
				name: "Home Maintenance Schedule & Tasks",
				url: "#",
				emoji: "🔧",
			},
			{
				name: "Family Calendar & Event Planning",
				url: "#",
				emoji: "📅",
			},
		],
	},
	{
		name: "Travel & Adventure",
		emoji: "🧳",
		pages: [
			{
				name: "Trip Planning & Itineraries",
				url: "#",
				emoji: "🗺️",
			},
			{
				name: "Travel Bucket List & Inspiration",
				url: "#",
				emoji: "🌎",
			},
			{
				name: "Travel Journal & Photo Gallery",
				url: "#",
				emoji: "📸",
			},
		],
	},
] as const
