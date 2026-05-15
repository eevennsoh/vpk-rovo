import type { TagColor } from "@/components/ui/tag";

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
		title: "RFP Intake",
		count: 9,
		cards: [
			{
				title: "Qualify global ITSM platform replacement RFP",
				code: "RFP-101",
				tags: [
					{ text: "itsm", color: "blue" },
					{ text: "enterprise", color: "discovery" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
			},
			{
				title: "Extract requirement areas from supplier packet",
				code: "RFP-102",
				tags: [
					{ text: "requirements", color: "magenta" },
					{ text: "cmdb", color: "teal" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			},
			{
				title: "Map response owners to demo topics",
				code: "RFP-103",
				tags: [
					{ text: "ownership", color: "teal" },
					{ text: "demo-plan", color: "orange" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			},
			{
				title: "Confirm bid risks for ITAM and SecOps gaps",
				code: "RFP-104",
				tags: [
					{ text: "qualification", color: "teal" },
					{ text: "itam", color: "discovery" },
					{ text: "risk", color: "lime" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			},
		],
	},
	{
		title: "Drafting",
		count: 18,
		cards: [
			{
				title: "Draft Atlassian System of Work narrative",
				code: "RFP-141",
				tags: [
					{ text: "teamwork-graph", color: "discovery" },
					{ text: "rovo", color: "lime" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
			},
			{
				title: "Complete pricing and TCO workbook for 7k agents",
				code: "RFP-142",
				tags: [
					{ text: "pricing", color: "blue" },
					{ text: "tco", color: "teal" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/florence-garcia/color/asow-strategy-orange.png",
			},
			{
				title: "Answer AI, integrations, and CI/CD questions",
				code: "RFP-143",
				tags: [
					{ text: "ai", color: "green" },
					{ text: "integrations", color: "blue" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
			},
			{
				title: "Write service desk, request, and portal response",
				code: "RFP-144",
				tags: [
					{ text: "jsm", color: "teal" },
					{ text: "portal", color: "orange" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			},
		],
	},
	{
		title: "Review",
		count: 6,
		cards: [
			{
				title: "Review Assets, CMDB, HAM, and SAM answer",
				code: "RFP-161",
				tags: [
					{ text: "assets", color: "grey" },
					{ text: "approval", color: "yellow" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			},
			{
				title: "Legal review for data residency and DPA terms",
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
				title: "Security review for Guard, audit, and vulnerability content",
				code: "RFP-163",
				tags: [
					{ text: "security", color: "discovery" },
					{ text: "grc", color: "blue" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/bradley-phillips/color/asow-product-purple.png",
			},
			{
				title: "Executive approval for onsite final pitch",
				code: "RFP-164",
				tags: [
					{ text: "executive-review", color: "discovery" },
					{ text: "final-pitch", color: "orange" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/brian-lin/color/asow-teamwork-blue.png",
			},
		],
	},
	{
		title: "Submitted",
		count: 24,
		cards: [
			{
				title: "Submit signed intent-to-bid package",
				code: "RFP-181",
				tags: [
					{ text: "submitted", color: "discovery" },
					{ text: "intake", color: "blue" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/christine-sanchez/color/asow-strategy-orange.png",
			},
			{
				title: "Send supplier clarification responses",
				code: "RFP-182",
				tags: [
					{ text: "clarifications", color: "magenta" },
					{ text: "customer", color: "discovery" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/darius-pavri/color/asow-strategy-orange.png",
			},
			{
				title: "Archive final response, exhibits, and demo deck",
				code: "RFP-183",
				tags: [
					{ text: "archive", color: "blue" },
					{ text: "proposal", color: "magenta" },
					{ text: "exhibits", color: "lime" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
			},
			{
				title: "Capture retro gaps for ITAM and SecOps roadmap",
				code: "RFP-184",
				tags: [
					{ text: "retro", color: "red" },
					{ text: "roadmap", color: "blue" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/florence-garcia/color/asow-strategy-orange.png",
			},
		],
	},
] as const;
