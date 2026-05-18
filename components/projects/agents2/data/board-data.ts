import type { KanbanBoardColumnData } from "@/components/blocks/kanban-board";

export type {
	KanbanBoardCardData as KanbanCardData,
	KanbanBoardCardTag as CardTag,
	KanbanBoardColumnData as BoardColumnData,
	KanbanBoardPriority as Priority,
} from "@/components/blocks/kanban-board";

export const OMNI_WORKSTREAM_NAMES_BY_CODE = {
	"OMNI-101": "Live demo",
	"OMNI-102": "Audience pain",
	"OMNI-103": "Brand voice",
	"OMNI-104": "Proof points",
	"OMNI-105": "Launch timeline",
	"OMNI-106": "Demo assets",
	"OMNI-107": "Consent story",
	"OMNI-141": "VoiceMate",
	"OMNI-142": "Differentiation",
	"OMNI-143": "Proof sections",
	"OMNI-161": "Hero module",
	"OMNI-162": "Interaction states",
	"OMNI-163": "Trust review",
	"OMNI-164": "Executive review",
	"OMNI-181": "Developer Preview",
	"OMNI-182": "Beta and GA archive",
} as const;

export const RFP_CLIENT_NAMES_BY_CODE = OMNI_WORKSTREAM_NAMES_BY_CODE;

function createWorkstreamTag(code: keyof typeof OMNI_WORKSTREAM_NAMES_BY_CODE) {
	return { text: OMNI_WORKSTREAM_NAMES_BY_CODE[code], color: "discovery" } as const;
}

function createWorkstreamTitle(code: keyof typeof OMNI_WORKSTREAM_NAMES_BY_CODE, title: string) {
	return `${OMNI_WORKSTREAM_NAMES_BY_CODE[code]}: ${title}`;
}

export const BOARD_COLUMNS: readonly KanbanBoardColumnData[] = [
	{
		title: "Briefing",
		count: 7,
		cards: [
			{
				title: createWorkstreamTitle("OMNI-101", "Define live-demo-first landing page narrative"),
				code: "OMNI-101",
				tags: [
					createWorkstreamTag("OMNI-101"),
					{ text: "hero", color: "blue" },
					{ text: "multimodal", color: "discovery" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
			},
			{
				title: createWorkstreamTitle("OMNI-102", "Map fragmented AI mode switching pain"),
				code: "OMNI-102",
				tags: [
					createWorkstreamTag("OMNI-102"),
					{ text: "positioning", color: "magenta" },
					{ text: "pain", color: "teal" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			},
			{
				title: createWorkstreamTitle("OMNI-103", "Collect brand guide, voice, and tone inputs"),
				code: "OMNI-103",
				tags: [
					createWorkstreamTag("OMNI-103"),
					{ text: "voice-tone", color: "teal" },
					{ text: "brand", color: "orange" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			},
			{
				title: createWorkstreamTitle("OMNI-104", "Inventory voice loop, camera feed, and action proof"),
				code: "OMNI-104",
				tags: [
					createWorkstreamTag("OMNI-104"),
					{ text: "voice", color: "teal" },
					{ text: "vision", color: "discovery" },
					{ text: "action", color: "lime" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			},
			{
				title: createWorkstreamTitle("OMNI-105", "Sequence Preview, Beta, and GA launch milestones"),
				code: "OMNI-105",
				tags: [
					createWorkstreamTag("OMNI-105"),
					{ text: "may-28", color: "red" },
					{ text: "roadmap", color: "yellow" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/bradley-phillips/color/asow-product-purple.png",
			},
			{
				title: createWorkstreamTitle("OMNI-106", "Gather demo assets for troubleshooting and workflows"),
				code: "OMNI-106",
				tags: [
					createWorkstreamTag("OMNI-106"),
					{ text: "demo-assets", color: "blue" },
					{ text: "workflow", color: "orange" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/brian-lin/color/asow-teamwork-blue.png",
			},
			{
				title: createWorkstreamTitle("OMNI-107", "Define enterprise consent and trust story"),
				code: "OMNI-107",
				tags: [
					createWorkstreamTag("OMNI-107"),
					{ text: "consent", color: "discovery" },
					{ text: "trust", color: "green" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/christine-sanchez/color/asow-strategy-orange.png",
			},
		],
	},
	{
		title: "Outline Drafting",
		count: 3,
		cards: [
			{
				title: createWorkstreamTitle("OMNI-141", "Draft landing-page outline from brand voice"),
				code: "OMNI-141",
				tags: [
					createWorkstreamTag("OMNI-141"),
					{ text: "outline", color: "discovery" },
					{ text: "voicemate", color: "lime" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
			},
			{
				title: createWorkstreamTitle("OMNI-142", "Write how Omni Live differs from regular assistants"),
				code: "OMNI-142",
				tags: [
					createWorkstreamTag("OMNI-142"),
					{ text: "differentiation", color: "teal" },
					{ text: "assistant", color: "blue" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/florence-garcia/color/asow-strategy-orange.png",
			},
			{
				title: createWorkstreamTitle("OMNI-143", "Plan developer and enterprise proof sections"),
				code: "OMNI-143",
				tags: [
					createWorkstreamTag("OMNI-143"),
					{ text: "developers", color: "blue" },
					{ text: "enterprise", color: "teal" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			},
		],
	},
	{
		title: "Experience Build",
		count: 4,
		cards: [
			{
				title: createWorkstreamTitle("OMNI-161", "Build live demo hero module"),
				code: "OMNI-161",
				tags: [
					createWorkstreamTag("OMNI-161"),
					{ text: "hero-demo", color: "grey" },
					{ text: "motion", color: "yellow" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			},
			{
				title: createWorkstreamTitle("OMNI-162", "Build voice, vision, and action interaction states"),
				code: "OMNI-162",
				tags: [
					createWorkstreamTag("OMNI-162"),
					{ text: "interaction", color: "red" },
					{ text: "states", color: "blue" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			},
			{
				title: createWorkstreamTitle("OMNI-163", "Validate brand voice, accessibility, and consent copy"),
				code: "OMNI-163",
				tags: [
					createWorkstreamTag("OMNI-163"),
					{ text: "accessibility", color: "discovery" },
					{ text: "consent", color: "blue" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/bradley-phillips/color/asow-product-purple.png",
			},
			{
				title: createWorkstreamTitle("OMNI-164", "Executive review of launch story and CTA path"),
				code: "OMNI-164",
				tags: [
					createWorkstreamTag("OMNI-164"),
					{ text: "executive-review", color: "discovery" },
					{ text: "cta", color: "orange" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/brian-lin/color/asow-teamwork-blue.png",
			},
		],
	},
	{
		title: "Launch Ready",
		count: 2,
		cards: [
			{
				title: createWorkstreamTitle("OMNI-181", "Package Developer Preview landing page"),
				code: "OMNI-181",
				tags: [
					createWorkstreamTag("OMNI-181"),
					{ text: "preview", color: "discovery" },
					{ text: "may-28", color: "magenta" },
				],
				priority: "major",
				avatarSrc: "/avatar-user/christine-sanchez/color/asow-strategy-orange.png",
			},
			{
				title: createWorkstreamTitle("OMNI-182", "Archive beta, GA, and sales enablement notes"),
				code: "OMNI-182",
				tags: [
					createWorkstreamTag("OMNI-182"),
					{ text: "beta-ga", color: "blue" },
					{ text: "enablement", color: "lime" },
				],
				priority: "medium",
				avatarSrc: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
			},
		],
	},
] as const;
