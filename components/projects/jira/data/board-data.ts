export type TagColor = "blue" | "purple" | "discovery" | "teal" | "magenta" | "orange" | "lime" | "green" | "yellow" | "grey" | "red";

export type Priority = "major" | "medium" | "minor";

export interface CardTag {
	text: string;
	color: TagColor;
}

export interface KanbanCardData {
	title: string;
	code: string;
	tags: CardTag[];
	priority: Priority;
	avatarSrc?: string;
}

export interface BoardColumnData {
	title: string;
	count: number;
	cards: KanbanCardData[];
}

export const BOARD_COLUMNS: readonly BoardColumnData[] = [
	{
		title: "Backlog",
		count: 20,
		cards: [
			{
				title: "[Jira Experiment] Gather Feedback",
				code: "CAID-118",
				tags: [
					{ text: "rovo-search", color: "blue" },
					{ text: "jira", color: "discovery" },
				],
				priority: "major",
				avatarSrc: "/avatar-human/andrea-wilson.png",
			},
			{
				title: "SATN Knowledge new design",
				code: "CAID-341",
				tags: [
					{ text: "search", color: "teal" },
					{ text: "design", color: "magenta" },
				],
				priority: "medium",
				avatarSrc: "/avatar-human/andrew-park.png",
			},
			{
				title: "SATN Actions",
				code: "CAID-382",
				tags: [
					{ text: "search", color: "teal" },
					{ text: "actions", color: "orange" },
				],
				priority: "minor",
				avatarSrc: "/avatar-human/annie-clare.png",
			},
			{
				title: "SATN AI Search - Discovery",
				code: "CAID-383",
				tags: [
					{ text: "search", color: "teal" },
					{ text: "ai", color: "discovery" },
					{ text: "discovery", color: "lime" },
				],
				priority: "minor",
				avatarSrc: "/avatar-human/aoife-burke.png",
			},
		],
	},
	{
		title: "Planning",
		count: 27,
		cards: [
			{
				title: "Atlassian Search + Pricing and Packaging for TWC",
				code: "CAID-136",
				tags: [
					{ text: "pricing", color: "green" },
					{ text: "twc", color: "yellow" },
				],
				priority: "minor",
				avatarSrc: "/avatar-human/bradley-phillips.png",
			},
			{
				title: "Rovo Search: Personalized filters in Full Page Search",
				code: "CAID-143",
				tags: [
					{ text: "rovo", color: "blue" },
					{ text: "search", color: "teal" },
				],
				priority: "major",
				avatarSrc: "/avatar-human/brian-lin.png",
			},
			{
				title: "TIP Action Plan",
				code: "CAID-174",
				tags: [{ text: "planning", color: "orange" }],
				priority: "major",
				avatarSrc: "/avatar-human/christine-sanchez.png",
			},
			{
				title: "Rovo 2.0 Shift & Brand Uplift",
				code: "CAID-202",
				tags: [
					{ text: "rovo", color: "blue" },
					{ text: "brand", color: "magenta" },
				],
				priority: "minor",
				avatarSrc: "/avatar-human/darius-pavri.png",
			},
		],
	},
	{
		title: "In Progress",
		count: 54,
		cards: [
			{
				title: "3P Connectors",
				code: "CAID-11",
				tags: [
					{ text: "connectors", color: "discovery" },
					{ text: "integration", color: "lime" },
				],
				priority: "major",
				avatarSrc: "/avatar-human/david-hsieh.png",
			},
			{
				title: "Rovo Search",
				code: "CAID-12",
				tags: [
					{ text: "rovo", color: "blue" },
					{ text: "search", color: "teal" },
				],
				priority: "medium",
				avatarSrc: "/avatar-human/florence-garcia.png",
			},
			{
				title: "Topics, Definitions, Knowledge Cards",
				code: "CAID-14",
				tags: [
					{ text: "knowledge", color: "green" },
					{ text: "rovo", color: "blue" },
				],
				priority: "minor",
				avatarSrc: "/avatar-human/andrea-wilson.png",
			},
			{
				title: "Enriched search (related widgets)",
				code: "CAID-68",
				tags: [
					{ text: "search", color: "teal" },
					{ text: "widgets", color: "orange" },
				],
				priority: "medium",
				avatarSrc: "/avatar-human/andrew-park.png",
			},
		],
	},
	{
		title: "In Review",
		count: 4,
		cards: [
			{
				title: "Content Guidelines",
				code: "CAID-454",
				tags: [
					{ text: "documentation", color: "grey" },
					{ text: "guidelines", color: "yellow" },
				],
				priority: "major",
				avatarSrc: "/avatar-human/annie-clare.png",
			},
			{
				title: "/ commands in editor and command K showing skills",
				code: "CAID-474",
				tags: [
					{ text: "editor", color: "red" },
					{ text: "rovo", color: "blue" },
					{ text: "commands", color: "discovery" },
				],
				priority: "major",
				avatarSrc: "/avatar-human/aoife-burke.png",
			},
			{
				title: "Agent skills, slash commands and other",
				code: "CAID-486",
				tags: [
					{ text: "ai-agents", color: "discovery" },
					{ text: "rovo", color: "blue" },
				],
				priority: "medium",
				avatarSrc: "/avatar-human/bradley-phillips.png",
			},
			{
				title: "Long running AI tasks",
				code: "CAID-488",
				tags: [
					{ text: "ai", color: "discovery" },
					{ text: "performance", color: "orange" },
				],
				priority: "major",
				avatarSrc: "/avatar-human/brian-lin.png",
			},
		],
	},
	{
		title: "Done",
		count: 236,
		cards: [
			{
				title: "AI Platform BB: Proactive Edit Suggestions in Confluence Editor",
				code: "CAID-1",
				tags: [
					{ text: "ai", color: "discovery" },
					{ text: "confluence", color: "blue" },
				],
				priority: "minor",
				avatarSrc: "/avatar-human/christine-sanchez.png",
			},
			{
				title: "Confluence AI 3 Year Vision v2",
				code: "CAID-3",
				tags: [
					{ text: "vision", color: "magenta" },
					{ text: "ai", color: "discovery" },
				],
				priority: "medium",
				avatarSrc: "/avatar-human/darius-pavri.png",
			},
			{
				title: "Rovo branded product experiences and entry points",
				code: "CAID-8",
				tags: [
					{ text: "rovo", color: "blue" },
					{ text: "brand", color: "magenta" },
					{ text: "ux", color: "lime" },
				],
				priority: "medium",
				avatarSrc: "/avatar-human/david-hsieh.png",
			},
			{
				title: "Admin Experiences for Rovo Search",
				code: "CAID-10",
				tags: [
					{ text: "admin", color: "red" },
					{ text: "rovo", color: "blue" },
				],
				priority: "major",
				avatarSrc: "/avatar-human/florence-garcia.png",
			},
		],
	},
] as const;
