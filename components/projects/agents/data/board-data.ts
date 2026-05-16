import type { KanbanBoardColumnData } from "@/components/blocks/kanban-board";

export type {
	KanbanBoardCardData as KanbanCardData,
	KanbanBoardCardTag as CardTag,
	KanbanBoardColumnData as BoardColumnData,
	KanbanBoardPriority as Priority,
} from "@/components/blocks/kanban-board";

export const BOARD_COLUMNS: readonly KanbanBoardColumnData[] = [
	{
		title: "RFP Intake",
		count: 7,
		cards: [
			{
				title: "Qualify enterprise service-management RFP",
				code: "RFP-101",
				tags: [
					{ text: "qualification", color: "blue" },
					{ text: "enterprise", color: "discovery" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
			},
			{
				title: "Parse supplier questionnaire and requested files",
				code: "RFP-102",
				tags: [
					{ text: "requirements", color: "magenta" },
					{ text: "attachments", color: "teal" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			},
			{
				title: "Build DACI and response-owner matrix",
				code: "RFP-103",
				tags: [
					{ text: "daci", color: "teal" },
					{ text: "owners", color: "orange" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			},
			{
				title: "Inventory ITSM, asset, portal, and reporting requirements",
				code: "RFP-104",
				tags: [
					{ text: "itsm", color: "teal" },
					{ text: "assets", color: "discovery" },
					{ text: "reporting", color: "lime" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			},
			{
				title: "Confirm bid/no-bid risks and mandatory gaps",
				code: "RFP-105",
				tags: [
					{ text: "risk", color: "red" },
					{ text: "gaps", color: "yellow" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/bradley-phillips/color/asow-product-purple.png",
			},
			{
				title: "Create RFP timeline with checkpoints and demos",
				code: "RFP-106",
				tags: [
					{ text: "timeline", color: "blue" },
					{ text: "demo-plan", color: "orange" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/brian-lin/color/asow-teamwork-blue.png",
			},
			{
				title: "Collect customer context, current tools, and success metrics",
				code: "RFP-107",
				tags: [
					{ text: "discovery", color: "discovery" },
					{ text: "metrics", color: "green" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/christine-sanchez/color/asow-strategy-orange.png",
			},
		],
	},
	{
		title: "Drafting",
		count: 3,
		cards: [
			{
				title: "Draft Atlassian System of Work executive narrative",
				code: "RFP-141",
				tags: [
					{ text: "teamwork-graph", color: "discovery" },
					{ text: "rovo", color: "lime" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
			},
			{
				title: "Write JSM service desk, portal, and knowledge answers",
				code: "RFP-142",
				tags: [
					{ text: "jsm", color: "teal" },
					{ text: "knowledge", color: "blue" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/florence-garcia/color/asow-strategy-orange.png",
			},
			{
				title: "Prepare pricing, implementation, and TCO response",
				code: "RFP-143",
				tags: [
					{ text: "pricing", color: "blue" },
					{ text: "tco", color: "teal" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			},
		],
	},
	{
		title: "Review",
		count: 4,
		cards: [
			{
				title: "Review Assets, CMDB, HAM, and SAM positioning",
				code: "RFP-161",
				tags: [
					{ text: "assets", color: "grey" },
					{ text: "cmdb", color: "yellow" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			},
			{
				title: "Legal review for data residency, DPA, and terms",
				code: "RFP-162",
				tags: [
					{ text: "legal", color: "red" },
					{ text: "data-residency", color: "blue" },
					{ text: "terms", color: "discovery" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			},
			{
				title: "Security review for Guard, audit, GRC, and vulnerabilities",
				code: "RFP-163",
				tags: [
					{ text: "security", color: "discovery" },
					{ text: "grc", color: "blue" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/bradley-phillips/color/asow-product-purple.png",
			},
			{
				title: "Executive review of win themes and final pitch",
				code: "RFP-164",
				tags: [
					{ text: "executive-review", color: "discovery" },
					{ text: "win-theme", color: "orange" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/brian-lin/color/asow-teamwork-blue.png",
			},
		],
	},
	{
		title: "Submitted",
		count: 2,
		cards: [
			{
				title: "Submit supplier clarification responses",
				code: "RFP-181",
				tags: [
					{ text: "submitted", color: "discovery" },
					{ text: "clarifications", color: "magenta" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/christine-sanchez/color/asow-strategy-orange.png",
			},
			{
				title: "Archive final response, exhibits, and demo deck",
				code: "RFP-182",
				tags: [
					{ text: "archive", color: "blue" },
					{ text: "exhibits", color: "lime" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
			},
		],
	},
] as const;
