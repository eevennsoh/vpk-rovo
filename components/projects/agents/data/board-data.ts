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
				title: "Qualify inbound Acme Mobility RFP",
				code: "RFP-101",
				tags: [
					{ text: "intake", color: "blue" },
					{ text: "enterprise", color: "discovery" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
			},
			{
				title: "Log procurement portal requirements",
				code: "RFP-102",
				tags: [
					{ text: "portal", color: "teal" },
					{ text: "requirements", color: "magenta" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			},
			{
				title: "Assign response owners by section",
				code: "RFP-103",
				tags: [
					{ text: "ownership", color: "teal" },
					{ text: "sales-ops", color: "orange" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			},
			{
				title: "Confirm bid/no-bid criteria",
				code: "RFP-104",
				tags: [
					{ text: "qualification", color: "teal" },
					{ text: "deadline", color: "discovery" },
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
				title: "Draft executive summary and win themes",
				code: "RFP-141",
				tags: [
					{ text: "win-theme", color: "discovery" },
					{ text: "proposal", color: "lime" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
			},
			{
				title: "Complete pricing workbook for 2,500 vehicles",
				code: "RFP-142",
				tags: [
					{ text: "pricing", color: "blue" },
					{ text: "finance", color: "teal" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/florence-garcia/color/asow-strategy-orange.png",
			},
			{
				title: "Answer telematics integration questions",
				code: "RFP-143",
				tags: [
					{ text: "technical", color: "green" },
					{ text: "sales-engineering", color: "blue" },
				],
				priority: "minor",
				avatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
			},
			{
				title: "Write service-level and support response",
				code: "RFP-144",
				tags: [
					{ text: "support", color: "teal" },
					{ text: "sla", color: "orange" },
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
				title: "Review discount guardrails with deal desk",
				code: "RFP-161",
				tags: [
					{ text: "pricing", color: "grey" },
					{ text: "approval", color: "yellow" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			},
			{
				title: "Legal review for data processing terms",
				code: "RFP-162",
				tags: [
					{ text: "legal", color: "red" },
					{ text: "dpa", color: "blue" },
					{ text: "terms", color: "discovery" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			},
			{
				title: "Security signoff on SOC 2 packet",
				code: "RFP-163",
				tags: [
					{ text: "security", color: "discovery" },
					{ text: "compliance", color: "blue" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/bradley-phillips/color/asow-product-purple.png",
			},
			{
				title: "Executive sponsor approval for final price",
				code: "RFP-164",
				tags: [
					{ text: "executive-review", color: "discovery" },
					{ text: "margin", color: "orange" },
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
				title: "Send customer clarification responses",
				code: "RFP-182",
				tags: [
					{ text: "clarifications", color: "magenta" },
					{ text: "customer", color: "discovery" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/darius-pavri/color/asow-strategy-orange.png",
			},
			{
				title: "Archive final response and exhibits",
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
				title: "Update reusable answer library from Q4 bid",
				code: "RFP-184",
				tags: [
					{ text: "answer-library", color: "red" },
					{ text: "retro", color: "blue" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/florence-garcia/color/asow-strategy-orange.png",
			},
		],
	},
] as const;
