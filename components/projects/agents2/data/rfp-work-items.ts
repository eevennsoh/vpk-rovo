import type {
	WorkItemAttachment,
	WorkItemChildItem,
	WorkItemComment,
	WorkItemData,
	WorkItemLabelTag,
	WorkItemPerson,
	WorkItemRfpTeamMember,
} from "@/app/contexts/context-work-item-modal";
import type { KanbanBoardCardData, KanbanBoardCardTag } from "@/components/blocks/kanban-board";
import type { ChatContextBarDescriptor } from "@/components/projects/sidebar-chat/lib/chat-context-bar";
import FileIcon from "@atlaskit/icon/core/file";
import { defaultSuggestions, type RovoSuggestion } from "@/lib/rovo-suggestions";
import { BOARD_COLUMNS, RFP_CLIENT_NAMES_BY_CODE } from "./board-data";

export const RFP_101_WORK_ITEM_CODE = "OMNI-101";
export const AGENTS_BOARD_CONTEXT_LABEL = "Omni Live Launch";
const AGENTS_BOARD_CONTEXT_SIGNATURE = "agents2-board:omni-live-launch";

function findBoardCardByCode(code: string): KanbanBoardCardData | undefined {
	for (const column of BOARD_COLUMNS) {
		const card = column.cards.find((boardCard) => boardCard.code === code);
		if (card) return card;
	}
	return undefined;
}

function findBoardColumnTitleByCardCode(code: string): string | undefined {
	for (const column of BOARD_COLUMNS) {
		if (column.cards.some((boardCard) => boardCard.code === code)) return column.title;
	}
	return undefined;
}

function createWorkItemLabelFields(
	tags: readonly KanbanBoardCardTag[] | undefined,
): Pick<WorkItemData, "labels" | "labelTags"> {
	if (!tags || tags.length === 0) return {};
	const labelTags: WorkItemLabelTag[] = tags.map((tag) => ({
		text: tag.text,
		color: tag.color,
	}));
	return {
		labels: labelTags.map((tag) => tag.text),
		labelTags,
	};
}

export interface AgentsChatScreenContext {
	chatContextBar: ChatContextBarDescriptor;
	contextDescription: string;
	greeting?: AgentsChatGreeting;
}

interface AgentsChatGreeting {
	suggestions?: ReadonlyArray<RovoSuggestion>;
}

const ACTIVE_WORK_ITEM_GREETING: AgentsChatGreeting = {
	suggestions: defaultSuggestions.map((suggestion) => (
		suggestion.id === "translate-text"
			? {
					...suggestion,
					label: "Draft the landing page outline",
					prompt: "Draft the landing page outline for Omni Live.",
					icon: FileIcon,
				}
			: suggestion
	)),
};

export const RFP_101_WORK_ITEM = {
	code: RFP_101_WORK_ITEM_CODE,
	title: `${RFP_CLIENT_NAMES_BY_CODE[RFP_101_WORK_ITEM_CODE]}: Define live-demo-first landing page narrative`,
	description:
		"Omni Live needs a public landing page that makes a unified multimodal AI interface feel immediate. The page should lead with a live demo of an AI companion that sees, hears, and acts in one continuous stream, then explain why that is different from switching between separate voice, vision, and action tools. Shape the launch story for developers and enterprise teams, using the May 28 Developer Preview, June 18 Public Beta, and July 9 General Availability milestones as concrete proof of momentum.",
	assignee: {
		name: "Maya Chen",
		avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
		role: "Launch content lead",
	},
	reporter: {
		name: "Jordan Lee",
		avatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
		role: "Product marketing",
	},
	priority: "High",
	status: "Briefing",
	startDate: "May 12, 2026",
	dueDate: "May 28, 2026",
	parent: {
		code: "OMNI-100",
		title: "Omni Live Launch",
	},
	...createWorkItemLabelFields(findBoardCardByCode(RFP_101_WORK_ITEM_CODE)?.tags),
	childItems: [
		{
			type: "Sub-task",
			key: "OMNI-105",
			summary: "Map Developer Preview, Public Beta, and GA launch promises",
			priority: "high",
			assignee: "Maya Chen",
			assigneeAvatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
			status: "inprogress",
		},
		{
			type: "Sub-task",
			key: "OMNI-106",
			summary: "Collect live demo clips for voice loop, camera feed, and multi-app action",
			priority: "medium",
			assignee: "Priya Shah",
			assigneeAvatarUrl: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			status: "todo",
		},
		{
			type: "Sub-task",
			key: "OMNI-107",
			summary: "Draft consent and enterprise trust notes for the hero narrative",
			priority: "high",
			assignee: "Jordan Lee",
			assigneeAvatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			status: "done",
		},
		{
			type: "Sub-task",
			key: "OMNI-108",
			summary: "Confirm brand voice constraints before VoiceMate drafts the outline",
			priority: "medium",
			assignee: "Elena Ruiz",
			assigneeAvatarUrl: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			status: "todo",
		},
	],
	attachments: [
		{
			name: "omni-live-brand-guide",
			displayName: "Omni Live brand guide",
			ext: "page",
			date: "12 May 2026, 09:12 AM",
			thumbnailKind: "document",
			previewSrc: "/generated/rfp-confluence-intake-notes.png",
			previewAlt: "Flat preview of Omni Live brand guide notes",
			sourceLabel: "Confluence page",
			sourceProduct: "confluence",
		},
		{
			name: "omni-live-page-outline-inputs",
			displayName: "Landing page outline inputs",
			ext: "xlsx",
			date: "12 May 2026, 09:24 AM",
			thumbnailKind: "document",
			previewSrc: "/generated/rfp-compliance-matrix.png",
			previewAlt: "Flat preview of structured landing page outline inputs",
		},
		{
			name: "voice-tone-brief",
			displayName: "Voice and tone brief",
			ext: "docx",
			date: "14 May 2026, 03:42 PM",
			thumbnailKind: "document",
			previewSrc: "/generated/rfp-response-brief.png",
			previewAlt: "Flat preview of a voice and tone brief",
		},
		{
			name: "omni-live-launch-brief",
			displayName: "Omni Live launch brief",
			ext: "pdf",
			date: "15 May 2026, 11:05 AM",
			thumbnailKind: "file",
			previewSrc: "/generated/rfp-pdf-packet.png",
			previewAlt: "Flat preview of an Omni Live launch brief document",
		},
		{
			name: "voice-loop-demo-audio",
			displayName: "voice-loop-demo-audio.mp3",
			ext: "mp3",
			date: "18 May 2026, 10:30 AM",
			thumbnailKind: "audio",
		},
		{
			name: "camera-feed-debugging-capture",
			displayName: "Camera feed debugging capture",
			ext: "png",
			date: "21 May 2026, 01:16 PM",
			thumbnailKind: "image",
			previewSrc: "/generated/rfp-portal-screenshot.png",
			previewAlt: "Flat preview of an Omni Live camera feed demo screenshot",
		},
		{
			name: "multi-app-workflow-walkthrough",
			displayName: "Multi-app workflow walkthrough",
			ext: "mp4",
			date: "2 Jun 2026, 04:10 PM",
			thumbnailKind: "video",
			previewSrc: "/generated/rfp-loom-walkthrough.png",
			previewAlt: "Flat preview of a multi-app workflow recording",
			sourceLabel: "Loom video",
			sourceProduct: "loom",
		},
	],
	comments: [
		{
			id: "comment-1",
			author: {
				name: "Maya Chen",
				avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
				role: "Launch content lead",
			},
			timestamp: "15 minutes ago",
			content:
				"The first viewport should show Omni Live doing the work: camera sees the issue, voice captures intent, and the agent executes the next step without forcing the user into a new mode.",
			replies: [
				{
					id: "comment-1-reply-1",
					author: {
						name: "Priya Shah",
						avatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
						role: "Developer advocate",
					},
					timestamp: "10 minutes ago",
					content:
						"I can supply a developer troubleshooting clip that starts with a broken UI, talks through the problem, and ends with Omni Live opening the right app and preparing the fix.",
				},
			],
		},
		{
			id: "comment-2",
			author: {
				name: "Jordan Lee",
				avatarUrl: "/avatar-user/brian-lin/color/asow-teamwork-blue.png",
				role: "Product marketing",
			},
			timestamp: "4 minutes ago",
			content:
				"The page needs to contrast continuous context with today's fragmented assistant experience. The line is not more AI features; it is one companion that is present across seeing, hearing, and acting.",
		},
	],
	approvers: [
		{
			name: "Elena Ruiz",
			avatarUrl: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			role: "Consent and trust reviewer",
		},
		{
			name: "Darius Pavri",
			avatarUrl: "/avatar-user/darius-pavri/color/asow-strategy-orange.png",
			role: "Launch readiness approver",
		},
	],
	effortEstimate: "21 pts",
	account: "Omni Live",
	dealSize: "Developer Preview by May 28; Public Beta by June 18; GA by July 9",
	rfpContext: {
		customerName: "Omni Live",
		opportunityName: "Omni Live public landing page launch",
		seatCount: "developers and enterprise teams",
		competitorProduct: "disconnected voice assistants, vision tools, and action agents split across tabs and apps",
		salesGoal:
			"Create a landing-page outline that starts with a tangible live demo, then explains why a continuous voice, vision, and action stream is more capable than a regular assistant.",
		procurementStage: "Developer Preview launch content briefing",
		responseDueDate: "May 28, 2026",
		submissionPortal: "Omni Live launch site",
		buyerPriorities: [
			"Developers need an AI companion that can see the current problem, hear intent, and act without repeated prompting.",
			"Enterprise teams need consent controls, partner integrations, and a clear path from preview to beta to GA.",
			"The page must make multimodal continuity tangible with a live demo before explaining the product architecture.",
			"The story should avoid passive assistant language and show Omni Live as present, responsive, and context-aware.",
		],
		evaluationCriteria: [
			"Hero section leads with the live demo rather than a generic product claim.",
			"Core narrative clearly contrasts continuous context with fragmented voice, vision, and action modes.",
			"Section outline covers Developer Preview, Public Beta, General Availability, partner integrations, and consent controls.",
			"Voice and tone match the company brand guide while staying concrete and demo-led.",
			"CTA path supports developers signing up for preview and enterprise teams evaluating controls.",
		],
		winThemes: [
			"Omni Live sees, hears, and acts in the same stream, so users do not lose momentum when moving from observation to action.",
			"Real-time camera and voice make troubleshooting feel collaborative instead of prompt-heavy.",
			"Agentic multi-app execution turns the assistant from passive responder into an active launch companion.",
			"Consent controls and partner integrations make the experience credible for enterprise adoption.",
		],
		risks: [
			"Live demo assets may not yet show the full voice, vision, and action loop in one continuous sequence.",
			"Consent copy needs legal review before it appears in a public launch surface.",
			"Partner integration language must distinguish Developer Preview capability from beta and GA commitments.",
			"Voice and tone inputs must be explicit enough for VoiceMate to draft a usable outline.",
		],
		nextActions: [
			"Lock the hero demo thesis and the first three page sections.",
			"Attach the brand guide, voice and tone brief, and launch milestone source notes.",
			"Use VoiceMate to draft the first landing-page outline once OMNI-141 enters Outline Drafting.",
			"Review the generated outline for demo clarity, consent language, and CTA specificity.",
		],
		responseTeam: [
			{
				role: "Launch content lead",
				owner: "Maya Chen",
				need: "Page structure, section hierarchy, proof points, and final outline approval.",
			},
			{
				role: "Product marketing",
				owner: "Jordan Lee",
				need: "Positioning, audience pain, differentiator language, and CTA story.",
			},
			{
				role: "Developer advocate",
				owner: "Priya Shah",
				need: "Live demo sequence, developer workflow examples, and troubleshooting proof.",
			},
			{
				role: "Consent and trust",
				owner: "Elena Ruiz",
				need: "Enterprise consent controls, privacy language, and GA readiness claims.",
			},
			{
				role: "Launch readiness",
				owner: "Darius Pavri",
				need: "Milestone accuracy, sales enablement hooks, and partner integration framing.",
			},
		],
	},
} satisfies WorkItemData;

const WORK_ITEMS_BY_CODE: Record<string, WorkItemData> = {
	[RFP_101_WORK_ITEM_CODE]: RFP_101_WORK_ITEM,
};

const WORK_ITEM_DESCRIPTIONS_BY_CODE: Record<string, string> = {
	"OMNI-102": "Turn the fragmented AI experience into crisp landing-page copy. Show how users lose momentum when voice lives in one app, vision in another, and action in a third. The output should make the pain specific enough that the live demo feels like the answer, not a decorative product clip.",
	"OMNI-103": "Collect the company brand guide, voice and tone rules, forbidden phrases, preferred product language, and example launches VoiceMate should follow. The goal is to make the landing-page outline sound like the company while keeping the page concrete, demo-led, and free of generic assistant claims.",
	"OMNI-104": "Inventory proof points for the core Omni Live loop: real-time camera feed, low-latency voice loop, agentic action, and multi-app workflow execution. Separate Developer Preview proof from Public Beta and GA claims so the landing page does not overpromise.",
	"OMNI-105": "Sequence the launch story around May 28 Developer Preview, June 18 Public Beta, and July 9 General Availability. Show what each milestone unlocks for the page narrative, the CTA, partner integrations, sales enablement, and enterprise consent controls.",
	"OMNI-106": "Gather demo assets that make Omni Live visible: a troubleshooting clip, a camera-feed state, a voice loop moment, and a multi-app workflow execution sequence. The page should show Omni Live working before it explains why the product is different.",
	"OMNI-107": "Define the enterprise trust story for consent controls, workspace boundaries, partner integrations, and action approval. The copy should reassure enterprise teams without burying the demo-led product story under policy language.",
	"OMNI-141": "Use VoiceMate to draft the landing-page outline from the brand guide, voice and tone notes, launch milestones, audience pain, demo goals, and consent/trust requirements. The outline should begin with the live demo, then move through pain, differentiated capability, proof, timeline, trust, and CTA.",
	"OMNI-142": "Write the section that explains how Omni Live differs from a regular assistant. Focus on continuity: seeing the context, hearing intent, and taking action in one stream rather than asking users to restate the problem across tools.",
	"OMNI-143": "Plan proof sections for developers and enterprise teams. Developers need the troubleshooting and workflow execution story; enterprise teams need consent controls, partner integration readiness, and a credible GA path.",
	"OMNI-161": "Build the live demo hero module content model. It should make the first viewport feel active, with a clear moment where Omni Live sees the screen, hears the user, and acts across apps.",
	"OMNI-162": "Review voice, vision, and action states for copy clarity. The page should avoid three disconnected feature cards and instead show one continuous loop moving from perception to instruction to execution.",
	"OMNI-163": "Validate brand voice, accessibility, and consent copy before the outline moves toward launch. Ensure the language is specific, readable, legally reviewable, and respectful of enterprise control expectations.",
	"OMNI-164": "Prepare the executive review package for the launch story and CTA path. Summarize the hero thesis, audience pain, capability proof, milestone plan, consent narrative, and any open content gaps.",
	"OMNI-181": "Package the Developer Preview landing page content for May 28 with the hero outline, CTA copy, preview scope, demo proof, and known limitations ready for implementation.",
	"OMNI-182": "Archive beta, GA, sales enablement, partner integration, and consent-control notes so the launch narrative can expand after the Developer Preview without rewriting the page from scratch.",
};

const OMNI_WORK_ITEM_PEOPLE: readonly WorkItemPerson[] = [
	RFP_101_WORK_ITEM.assignee,
	RFP_101_WORK_ITEM.reporter,
	{
		name: "Priya Shah",
		avatarUrl: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
		role: "Developer advocate",
	},
	{
		name: "Elena Ruiz",
		avatarUrl: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
		role: "Consent and trust reviewer",
	},
	{
		name: "Darius Pavri",
		avatarUrl: "/avatar-user/darius-pavri/color/asow-strategy-orange.png",
		role: "Launch readiness approver",
	},
	{
		name: "Florence Garcia",
		avatarUrl: "/avatar-user/florence-garcia/color/asow-strategy-orange.png",
		role: "Web experience designer",
	},
	{
		name: "David Hsieh",
		avatarUrl: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
		role: "Product engineer",
	},
] as const;

const CHILD_ITEM_STATUSES = ["todo", "inprogress", "done"] as const satisfies readonly WorkItemChildItem["status"][];

const CHILD_ITEM_TEMPLATES: ReadonlyArray<{
	priority: WorkItemChildItem["priority"];
	summary: (workstreamName: string) => string;
}> = [
	{ priority: "high", summary: (name) => `Confirm ${name} inputs for the landing-page outline` },
	{ priority: "medium", summary: (name) => `Map ${name} owner and review path` },
	{ priority: "high", summary: (name) => `Validate ${name} against launch milestones` },
	{ priority: "medium", summary: (name) => `Draft ${name} content gaps for VoiceMate` },
	{ priority: "low", summary: (name) => `Collect reusable ${name} proof snippets` },
	{ priority: "medium", summary: (name) => `Review ${name} consent and enterprise language` },
] as const;

interface AttachmentVariant {
	ext: WorkItemAttachment["ext"];
	name: string;
	displayName: (workstreamName: string) => string;
	thumbnailKind: WorkItemAttachment["thumbnailKind"];
	thumbnailTone: WorkItemAttachment["thumbnailTone"];
	sourceLabel?: WorkItemAttachment["sourceLabel"];
	sourceProduct?: WorkItemAttachment["sourceProduct"];
}

const ATTACHMENT_VARIANTS: readonly AttachmentVariant[] = [
	{ name: "brand-guide", displayName: (name) => `${name} brand guide`, ext: "page", thumbnailKind: "document", thumbnailTone: "discovery", sourceLabel: "Confluence page", sourceProduct: "confluence" },
	{ name: "demo-notes", displayName: (name) => `${name} demo notes`, ext: "docx", thumbnailKind: "document", thumbnailTone: "success" },
	{ name: "launch-milestones", displayName: (name) => `${name} launch milestones`, ext: "xlsx", thumbnailKind: "document", thumbnailTone: "information" },
	{ name: "consent-review", displayName: (name) => `${name} consent review`, ext: "pdf", thumbnailKind: "file", thumbnailTone: "warning" },
	{ name: "walkthrough", displayName: (name) => `${name} walkthrough`, ext: "mp4", thumbnailKind: "video", thumbnailTone: "information", sourceLabel: "Loom video", sourceProduct: "loom" },
] as const;

const COMMENT_TEMPLATES: ReadonlyArray<(workstreamName: string) => string> = [
	(name) => `${name} needs to stay demo-led; avoid turning this into a generic AI assistant section.`,
	(name) => `I added ${name} notes and marked missing proof points for VoiceMate.`,
	(name) => `Developer and enterprise examples for ${name} should share one continuous voice, vision, and action story.`,
	(name) => `${name} needs one more consent-language pass before public launch copy.`,
	(name) => `The ${name} outline is usable, but the CTA should be more specific.`,
] as const;

function getStableSeed(value: string): number {
	return [...value].reduce((seed, char) => seed + char.charCodeAt(0), 0);
}

function getCycledItem<T>(items: readonly T[], index: number): T {
	return items[index % items.length] ?? items[0]!;
}

function getKebabCase(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/gu, "-").replace(/^-|-$/gu, "");
}

function getDemoDate(seed: number, index: number): string {
	const day = 13 + ((seed + index) % 14);
	const hour = 9 + ((seed + index * 2) % 8);
	const minute = (seed + index * 13) % 60;
	return `${day} May 2026, ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")} AM`;
}

function getPriorityFromCard(card: KanbanBoardCardData | undefined): WorkItemData["priority"] {
	switch (card?.priority) {
		case "major":
			return "High";
		case "medium":
			return "Medium";
		case "minor":
			return "Low";
		default:
			return "Medium";
	}
}

function createVariableChildItems(code: string, workstreamName: string): WorkItemChildItem[] {
	const seed = getStableSeed(code);
	const count = 2 + (seed % 4);
	return Array.from({ length: count }, (_, index) => {
		const template = getCycledItem(CHILD_ITEM_TEMPLATES, seed + index);
		const assignee = getCycledItem(OMNI_WORK_ITEM_PEOPLE, seed + index + 1);
		return {
			type: "Sub-task",
			key: `${code}-${String(index + 1).padStart(2, "0")}`,
			summary: template.summary(workstreamName),
			priority: template.priority,
			assignee: assignee.name,
			assigneeAvatarUrl: assignee.avatarUrl,
			status: getCycledItem(CHILD_ITEM_STATUSES, seed + index),
		};
	});
}

function createVariableAttachments(code: string, workstreamName: string): WorkItemAttachment[] {
	const seed = getStableSeed(code);
	const count = 1 + ((seed + 1) % 4);
	const slug = getKebabCase(workstreamName);
	return Array.from({ length: count }, (_, index) => {
		const variant = getCycledItem(ATTACHMENT_VARIANTS, seed + index);
		return {
			name: `${slug}-${variant.name}`,
			displayName: variant.displayName(workstreamName),
			ext: variant.ext,
			date: getDemoDate(seed, index),
			thumbnailKind: variant.thumbnailKind,
			thumbnailTone: variant.thumbnailTone,
			sourceLabel: variant.sourceLabel,
			sourceProduct: variant.sourceProduct,
		};
	});
}

function createVariableComments(code: string, workstreamName: string): WorkItemComment[] {
	const seed = getStableSeed(code);
	const count = 1 + ((seed + 2) % 3);
	return Array.from({ length: count }, (_, index) => {
		const author = getCycledItem(OMNI_WORK_ITEM_PEOPLE, seed + index + 2);
		return {
			id: `${code.toLowerCase()}-comment-${index + 1}`,
			author,
			timestamp: `${(index + 1) * 12} minutes ago`,
			content: getCycledItem(COMMENT_TEMPLATES, seed + index)(workstreamName),
		};
	});
}

function createVariableWorkItemFields(
	code: string,
	workstreamName: string,
	boardCard: KanbanBoardCardData | undefined,
): Pick<WorkItemData, "assignee" | "attachments" | "childItems" | "comments" | "priority" | "reporter" | "status"> {
	const seed = getStableSeed(code);
	return {
		assignee: getCycledItem(OMNI_WORK_ITEM_PEOPLE, seed),
		reporter: getCycledItem(OMNI_WORK_ITEM_PEOPLE, seed + 3),
		priority: getPriorityFromCard(boardCard),
		status: findBoardColumnTitleByCardCode(code),
		childItems: createVariableChildItems(code, workstreamName),
		attachments: createVariableAttachments(code, workstreamName),
		comments: createVariableComments(code, workstreamName),
	};
}

function formatList(label: string, items: readonly string[] | undefined): string[] {
	if (!items || items.length === 0) return [];
	return [label, ...items.map((item) => `- ${item}`)];
}

function formatTeam(team: readonly WorkItemRfpTeamMember[] | undefined): string[] {
	if (!Array.isArray(team) || team.length === 0) return [];
	return [
		"Launch team needs:",
		...team.map((member) => `- ${member.role}: ${member.owner} - ${member.need}`),
	];
}

function formatNameWithRole(name: string, role: string | undefined): string {
	return role ? `${name} (${role})` : name;
}

export function getAgentsWorkItemForCard(params: {
	code: string;
	title: string;
	tags?: readonly KanbanBoardCardTag[];
}): WorkItemData {
	const boardCard = findBoardCardByCode(params.code);
	const labelFields = createWorkItemLabelFields(params.tags ?? boardCard?.tags);
	const workstreamName = RFP_CLIENT_NAMES_BY_CODE[params.code as keyof typeof RFP_CLIENT_NAMES_BY_CODE];
	const baseWorkItem = WORK_ITEMS_BY_CODE[params.code] ?? {
		code: params.code,
		title: params.title,
		account: workstreamName,
		description: WORK_ITEM_DESCRIPTIONS_BY_CODE[params.code],
		...(workstreamName ? createVariableWorkItemFields(params.code, workstreamName, boardCard) : {}),
	};
	return {
		...baseWorkItem,
		...labelFields,
	};
}

export function formatAgentsBoardContext(): string {
	const visibleColumns = BOARD_COLUMNS.map((column) => {
		const sampleCards = column.cards.slice(0, 2).map((card) => `${card.code}: ${card.title}`).join("; ");
		return `- ${column.title}: ${column.count} work items${sampleCards ? ` (visible: ${sampleCards})` : ""}`;
	});
	return [
		"[Agents2 Board Context]",
		"Source: /agents2 Omni Live launch board.",
		`Project: ${AGENTS_BOARD_CONTEXT_LABEL}`,
		"Workflow: public landing page launch.",
		"Visible columns:",
		...visibleColumns,
		"[End Agents2 Board Context]",
	].join("\n");
}

function formatLightweightActiveJiraWorkItemContext(workItem: WorkItemData): string {
	const childItems = workItem.childItems?.map(
		(item) => `- ${item.key}: ${item.summary} (${item.status}, ${item.priority}, owner: ${item.assignee ?? "unassigned"})`,
	);
	const attachments = workItem.attachments?.map((file) => `- ${file.name}.${file.ext} (${file.date})`);
	const recentActivity = workItem.comments?.flatMap((comment) => [
		`- ${comment.timestamp}: ${formatNameWithRole(comment.author.name, comment.author.role)} - ${comment.content}`,
		...(comment.replies ?? []).map((reply) => `  - ${reply.timestamp}: ${formatNameWithRole(reply.author.name, reply.author.role)} - ${reply.content}`),
	]);

	return [
		"[Active Jira Work Item Context]",
		"Source: /agents2 Omni Live work item.",
		`Key: ${workItem.code}`,
		`Title: ${workItem.title}`,
		workItem.status ? `Status: ${workItem.status}` : null,
		workItem.priority ? `Priority: ${workItem.priority}` : null,
		workItem.assignee?.name ? `Assignee: ${formatNameWithRole(workItem.assignee.name, workItem.assignee.role)}` : null,
		workItem.reporter?.name ? `Reporter: ${formatNameWithRole(workItem.reporter.name, workItem.reporter.role)}` : null,
		workItem.labels?.length ? `Labels: ${workItem.labels.join(", ")}` : null,
		workItem.description ? `Description: ${workItem.description}` : null,
		childItems?.length ? "Child work items:" : null,
		...(childItems ?? []),
		attachments?.length ? "Attachments:" : null,
		...(attachments ?? []),
		recentActivity?.length ? "Recent activity:" : null,
		...(recentActivity ?? []),
		"[End Active Jira Work Item Context]",
	].filter((line): line is string => typeof line === "string" && line.length > 0).join("\n");
}

export function formatActiveJiraWorkItemContext(
	workItem: WorkItemData | null | undefined,
): string | undefined {
	if (!workItem) return undefined;
	if (workItem.code !== RFP_101_WORK_ITEM_CODE || !workItem.rfpContext) {
		return formatLightweightActiveJiraWorkItemContext(workItem);
	}

	const rfp = workItem.rfpContext;
	const childItems = workItem.childItems?.map(
		(item) => `- ${item.key}: ${item.summary} (${item.status}, ${item.priority}, owner: ${item.assignee ?? "unassigned"})`,
	);
	const attachments = workItem.attachments?.map((file) => `- ${file.name}.${file.ext} (${file.date})`);
	const recentActivity = workItem.comments?.flatMap((comment) => [
		`- ${comment.timestamp}: ${formatNameWithRole(comment.author.name, comment.author.role)} - ${comment.content}`,
		...(comment.replies ?? []).map((reply) => `  - ${reply.timestamp}: ${formatNameWithRole(reply.author.name, reply.author.role)} - ${reply.content}`),
	]);

	return [
		"[Active Jira Work Item Context]",
		"Source: /agents2 Omni Live work item modal.",
		`Key: ${workItem.code}`,
		`Title: ${workItem.title}`,
		workItem.description ? `Description: ${workItem.description}` : null,
		`Status: ${workItem.status ?? "Unknown"}`,
		`Priority: ${workItem.priority ?? "Unknown"}`,
		workItem.startDate ? `Start date: ${workItem.startDate}` : null,
		workItem.dueDate ? `Due date: ${workItem.dueDate}` : null,
		workItem.parent ? `Parent: ${workItem.parent.code}${workItem.parent.title ? ` - ${workItem.parent.title}` : ""}` : null,
		`Product: ${rfp.customerName}`,
		`Launch surface: ${rfp.opportunityName}`,
		`Audience: ${rfp.seatCount}`,
		workItem.dealSize ? `Launch milestones: ${workItem.dealSize}` : null,
		`Current alternative: ${rfp.competitorProduct}`,
		`Content goal: ${rfp.salesGoal}`,
		`Launch stage: ${rfp.procurementStage}`,
		`Destination: ${rfp.submissionPortal}`,
		`Target date: ${rfp.responseDueDate}`,
		`Assignee: ${workItem.assignee?.name ? formatNameWithRole(workItem.assignee.name, workItem.assignee.role) : "Unassigned"}`,
		`Reporter: ${workItem.reporter?.name ? formatNameWithRole(workItem.reporter.name, workItem.reporter.role) : "Unknown"}`,
		workItem.labels?.length ? `Labels: ${workItem.labels.join(", ")}` : null,
		...formatList("Audience priorities:", rfp.buyerPriorities),
		...formatList("Page success criteria:", rfp.evaluationCriteria),
		...formatList("Positioning themes:", rfp.winThemes),
		...formatList("Known risks:", rfp.risks),
		...formatList("Next actions:", rfp.nextActions),
		...formatTeam(rfp.responseTeam),
		childItems?.length ? "Child work items:" : null,
		...(childItems ?? []),
		attachments?.length ? "Attachments:" : null,
		...(attachments ?? []),
		recentActivity?.length ? "Recent activity:" : null,
		...(recentActivity ?? []),
		"[End Active Jira Work Item Context]",
	].filter((line): line is string => typeof line === "string" && line.length > 0).join("\n");
}

export function resolveAgentsChatScreenContext(
	workItem: WorkItemData | null | undefined,
): AgentsChatScreenContext {
	const activeContextDescription = formatActiveJiraWorkItemContext(workItem);
	if (workItem && activeContextDescription) {
		return {
			chatContextBar: {
				label: `${workItem.code}: ${workItem.title}`,
				iconName: "work-item",
				signature: `agents2-work-item:${workItem.code}`,
			},
			contextDescription: activeContextDescription,
			greeting: ACTIVE_WORK_ITEM_GREETING,
		};
	}

	return {
		chatContextBar: {
			label: AGENTS_BOARD_CONTEXT_LABEL,
			iconName: "board",
			signature: AGENTS_BOARD_CONTEXT_SIGNATURE,
		},
		contextDescription: formatAgentsBoardContext(),
	};
}
