import type { KanbanBoardColumnData } from "@/components/blocks/kanban-board";

export type {
	KanbanBoardCardData as KanbanCardData,
	KanbanBoardCardTag as CardTag,
	KanbanBoardColumnData as BoardColumnData,
	KanbanBoardPriority as Priority,
} from "@/components/blocks/kanban-board";

export const RFP_CLIENT_NAMES_BY_CODE = {
	"RFP-101": "Acmecorp",
	"RFP-102": "Northstar Bank",
	"RFP-103": "Meridian Health",
	"RFP-104": "HelioWorks Energy",
	"RFP-105": "BluePeak Telecom",
	"RFP-106": "Redwood Retail Group",
	"RFP-107": "Summit Grove Insurance",
	"RFP-141": "Orion Motors",
	"RFP-142": "NimbusCare",
	"RFP-143": "Copperline Logistics",
	"RFP-161": "VertexRail",
	"RFP-162": "Greenfield BioSystems",
	"RFP-163": "HarborPoint Finance",
	"RFP-164": "Silverline Manufacturing",
	"RFP-181": "TidalWorks Utilities",
	"RFP-182": "Novacore University",
} as const;

function createClientTag(code: keyof typeof RFP_CLIENT_NAMES_BY_CODE) {
	return { text: RFP_CLIENT_NAMES_BY_CODE[code], color: "discovery" } as const;
}

function createClientTitle(code: keyof typeof RFP_CLIENT_NAMES_BY_CODE, title: string) {
	return `${RFP_CLIENT_NAMES_BY_CODE[code]}: ${title}`;
}

export const BOARD_COLUMNS: readonly KanbanBoardColumnData[] = [
	{
		title: "RFP Intake",
		count: 7,
		cards: [
			{
				title: createClientTitle("RFP-101", "Prepare for bid recommendation for ESM RFP"),
				code: "RFP-101",
				tags: [
					createClientTag("RFP-101"),
					{ text: "qualification", color: "blue" },
					{ text: "enterprise", color: "discovery" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
			},
			{
				title: createClientTitle("RFP-102", "Parse supplier questionnaire and requested files"),
				code: "RFP-102",
				tags: [
					createClientTag("RFP-102"),
					{ text: "requirements", color: "magenta" },
					{ text: "attachments", color: "teal" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			},
			{
				title: createClientTitle("RFP-103", "Build DACI and response-owner matrix"),
				code: "RFP-103",
				tags: [
					createClientTag("RFP-103"),
					{ text: "daci", color: "teal" },
					{ text: "owners", color: "orange" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			},
			{
				title: createClientTitle("RFP-104", "Inventory ITSM, asset, portal, and reporting requirements"),
				code: "RFP-104",
				tags: [
					createClientTag("RFP-104"),
					{ text: "itsm", color: "teal" },
					{ text: "assets", color: "discovery" },
					{ text: "reporting", color: "lime" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			},
			{
				title: createClientTitle("RFP-105", "Confirm bid/no-bid risks and mandatory gaps"),
				code: "RFP-105",
				tags: [
					createClientTag("RFP-105"),
					{ text: "risk", color: "red" },
					{ text: "gaps", color: "yellow" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/bradley-phillips/color/asow-product-purple.png",
			},
			{
				title: createClientTitle("RFP-106", "Create RFP timeline with checkpoints and demos"),
				code: "RFP-106",
				tags: [
					createClientTag("RFP-106"),
					{ text: "timeline", color: "blue" },
					{ text: "demo-plan", color: "orange" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/brian-lin/color/asow-teamwork-blue.png",
			},
			{
				title: createClientTitle("RFP-107", "Collect customer context, current tools, and success metrics"),
				code: "RFP-107",
				tags: [
					createClientTag("RFP-107"),
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
				title: createClientTitle("RFP-141", "Draft Atlassian System of Work executive narrative"),
				code: "RFP-141",
				tags: [
					createClientTag("RFP-141"),
					{ text: "teamwork-graph", color: "discovery" },
					{ text: "rovo", color: "lime" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
			},
			{
				title: createClientTitle("RFP-142", "Write JSM service desk, portal, and knowledge answers"),
				code: "RFP-142",
				tags: [
					createClientTag("RFP-142"),
					{ text: "jsm", color: "teal" },
					{ text: "knowledge", color: "blue" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/florence-garcia/color/asow-strategy-orange.png",
			},
			{
				title: createClientTitle("RFP-143", "Prepare pricing, implementation, and TCO response"),
				code: "RFP-143",
				tags: [
					createClientTag("RFP-143"),
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
				title: createClientTitle("RFP-161", "Review Assets, CMDB, HAM, and SAM positioning"),
				code: "RFP-161",
				tags: [
					createClientTag("RFP-161"),
					{ text: "assets", color: "grey" },
					{ text: "cmdb", color: "yellow" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			},
			{
				title: createClientTitle("RFP-162", "Legal review for data residency, DPA, and terms"),
				code: "RFP-162",
				tags: [
					createClientTag("RFP-162"),
					{ text: "legal", color: "red" },
					{ text: "data-residency", color: "blue" },
					{ text: "terms", color: "discovery" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			},
			{
				title: createClientTitle("RFP-163", "Security review for Guard, audit, GRC, and vulnerabilities"),
				code: "RFP-163",
				tags: [
					createClientTag("RFP-163"),
					{ text: "security", color: "discovery" },
					{ text: "grc", color: "blue" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/bradley-phillips/color/asow-product-purple.png",
			},
			{
				title: createClientTitle("RFP-164", "Executive review of win themes and final pitch"),
				code: "RFP-164",
				tags: [
					createClientTag("RFP-164"),
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
				title: createClientTitle("RFP-181", "Submit supplier clarification responses"),
				code: "RFP-181",
				tags: [
					createClientTag("RFP-181"),
					{ text: "submitted", color: "discovery" },
					{ text: "clarifications", color: "magenta" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/christine-sanchez/color/asow-strategy-orange.png",
			},
			{
				title: createClientTitle("RFP-182", "Archive final response, exhibits, and demo deck"),
				code: "RFP-182",
				tags: [
					createClientTag("RFP-182"),
					{ text: "archive", color: "blue" },
					{ text: "exhibits", color: "lime" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
			},
		],
	},
] as const;
