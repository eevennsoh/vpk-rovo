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

export const RFP_101_WORK_ITEM_CODE = "RFP-101";
export const AGENTS_BOARD_CONTEXT_LABEL = "Enterprise RFP Response";
const AGENTS_BOARD_CONTEXT_SIGNATURE = "agents-board:enterprise-rfp-response";

function findBoardCardByCode(code: string): KanbanBoardCardData | undefined {
	for (const column of BOARD_COLUMNS) {
		const card = column.cards.find((boardCard) => boardCard.code === code);
		if (card) {
			return card;
		}
	}

	return undefined;
}

function findBoardColumnTitleByCardCode(code: string): string | undefined {
	for (const column of BOARD_COLUMNS) {
		if (column.cards.some((boardCard) => boardCard.code === code)) {
			return column.title;
		}
	}

	return undefined;
}

function createWorkItemLabelFields(
	tags: readonly KanbanBoardCardTag[] | undefined,
): Pick<WorkItemData, "labels" | "labelTags"> {
	if (!tags || tags.length === 0) {
		return {};
	}

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
					label: "Should we respond to this RFP?",
					prompt: "Should we respond to this RFP?",
					icon: FileIcon,
				}
			: suggestion
	)),
};

export const RFP_101_WORK_ITEM = {
	code: RFP_101_WORK_ITEM_CODE,
	title: `${RFP_CLIENT_NAMES_BY_CODE[RFP_101_WORK_ITEM_CODE]}: Prepare for bid recommendation for ESM RFP`,
	description:
		"Acmecorp is evaluating Atlassian as a replacement for its current service-management and work-management stack. Acmecorp has regional tool fragmentation, a mature but messy CMDB, a mix of service desk and business-team workflows, and a procurement packet that spans ITSM, asset management, knowledge, reporting, AI, compliance, implementation services, and executive-ready pricing. Qualify the Acmecorp RFP by separating mandatory requirements from differentiators, mapping each requirement area to Atlassian strengths, and identifying the responses that need product, legal, security, deal desk, or partner validation.",
	assignee: {
		name: "Maya Chen",
		avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
		role: "Proposal manager",
	},
	reporter: {
		name: "Jordan Lee",
		avatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
		role: "Account executive",
	},
	priority: "High",
	status: "RFP Intake",
	startDate: "May 12, 2026",
	dueDate: "Jun 8, 2026",
	parent: {
		code: "RFP-100",
		title: "Enterprise RFP Response",
	},
	...createWorkItemLabelFields(findBoardCardByCode(RFP_101_WORK_ITEM_CODE)?.tags),
	childItems: [
		{
			type: "Sub-task",
			key: "RFP-105",
			summary: "Build requirement matrix for ITSM, CMDB, HAM, SAM, AI, GRC, and portal needs",
			priority: "high",
			assignee: "Maya Chen",
			assigneeAvatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
			status: "inprogress",
		},
		{
			type: "Sub-task",
			key: "RFP-106",
			summary: "Confirm JSM, Assets, Rovo, Guard, and platform demo owners",
			priority: "medium",
			assignee: "Priya Shah",
			assigneeAvatarUrl: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
			status: "todo",
		},
		{
			type: "Sub-task",
			key: "RFP-107",
			summary: "Draft win themes against incumbent cost, complexity, and adaptability pain points",
			priority: "high",
			assignee: "Jordan Lee",
			assigneeAvatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			status: "done",
		},
		{
			type: "Sub-task",
			key: "RFP-108",
			summary: "Collect legal, data residency, audit, and vulnerability-management exhibits",
			priority: "medium",
			assignee: "Elena Ruiz",
			assigneeAvatarUrl: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			status: "todo",
		},
	],
	attachments: [
		{
			name: "rfp-intake-notes",
			displayName: "RFP intake notes",
			ext: "page",
			date: "12 May 2026, 09:12 AM",
			thumbnailKind: "document",
			previewSrc: "/generated/rfp-confluence-intake-notes.png",
			previewAlt: "Flat preview of RFP intake notes",
			sourceLabel: "Confluence page",
			sourceProduct: "confluence",
		},
		{
			name: "rfp-requirement-compliance-matrix",
			displayName: "Compliance matrix",
			ext: "xlsx",
			date: "12 May 2026, 09:24 AM",
			thumbnailKind: "document",
			previewSrc: "/generated/rfp-compliance-matrix.png",
			previewAlt: "Flat preview of a spreadsheet compliance matrix",
		},
		{
			name: "response-brief",
			displayName: "Response brief",
			ext: "docx",
			date: "14 May 2026, 03:42 PM",
			thumbnailKind: "document",
			previewSrc: "/generated/rfp-response-brief.png",
			previewAlt: "Flat preview of a response brief document",
		},
		{
			name: "enterprise-rfp-requirements",
			displayName: "Enterprise RFP packet",
			ext: "pdf",
			date: "15 May 2026, 11:05 AM",
			thumbnailKind: "file",
			previewSrc: "/generated/rfp-pdf-packet.png",
			previewAlt: "Flat preview of an enterprise RFP PDF packet",
		},
		{
			name: "proposal-audio-briefing",
			displayName: "proposal-audio-briefing.mp3",
			ext: "mp3",
			date: "18 May 2026, 10:30 AM",
			thumbnailKind: "audio",
		},
		{
			name: "supplier-portal-upload",
			displayName: "Supplier portal upload",
			ext: "png",
			date: "21 May 2026, 01:16 PM",
			thumbnailKind: "image",
			previewSrc: "/generated/rfp-portal-screenshot.png",
			previewAlt: "Flat preview of a supplier portal upload screenshot",
		},
		{
			name: "proposal-walkthrough",
			displayName: "Proposal walkthrough",
			ext: "mp4",
			date: "2 Jun 2026, 04:10 PM",
			thumbnailKind: "video",
			previewSrc: "/generated/rfp-loom-walkthrough.png",
			previewAlt: "Flat preview of a walkthrough video recording",
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
				role: "Proposal manager",
			},
			timestamp: "15 minutes ago",
			content:
				"I added the RFP timeline, supplier-question deadline, response deadline, and executive demo agenda. The first pass flags ITSM, CMDB, HAM/SAM, knowledge, reporting, portal, AI, data residency, customer service, GRC, and pricing as mandatory sections.",
			replies: [
				{
					id: "comment-1-reply-1",
					author: {
						name: "Priya Shah",
						avatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
						role: "Sales engineer",
					},
					timestamp: "10 minutes ago",
					content:
						"Sales engineering can own JSM workflows, Assets/CMDB, integrations, CI/CD change enablement, incident operations, and the Rovo demo. We should explicitly call out where HAM/SAM or SecOps needs partner coverage or roadmap positioning.",
				},
			],
		},
		{
			id: "comment-2",
			author: {
				name: "Jordan Lee",
				avatarUrl: "/avatar-user/brian-lin/color/asow-teamwork-blue.png",
				role: "Account executive",
			},
			timestamp: "4 minutes ago",
			content:
				"Customer pain points are incumbent cost, platform rigidity, regional tool fragmentation, CMDB quality at scale, and AI readiness. Lead with Atlassian System of Work, JSM request and incident operations, Teamwork Graph, Rovo, Assets, knowledge, reporting, and transparent TCO.",
		},
	],
	approvers: [
		{
			name: "Elena Ruiz",
			avatarUrl: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
			role: "Security and legal approver",
		},
		{
			name: "Darius Pavri",
			avatarUrl: "/avatar-user/darius-pavri/color/asow-strategy-orange.png",
			role: "Deal desk approver",
		},
	],
	effortEstimate: "21 pts",
	account: "Acmecorp",
	dealSize: "multi-thousand users; budget qualification pending",
	rfpContext: {
		customerName: "Acmecorp",
		opportunityName: "Acmecorp enterprise service-management platform evaluation",
		seatCount: "multi-thousand users",
		competitorProduct: "incumbent service-management, CMDB, asset, HR, GRC, and custom workflow tooling",
		salesGoal:
			"Help the sales team decide whether Atlassian should respond to the Acmecorp RFP by qualifying fit, budget, stakeholder access, competitive advantage, and review risk before drafting a customer-facing package.",
		procurementStage: "Inbound RFP qualification and bid/no-bid recommendation",
		responseDueDate: "Jun 8, 2026",
		submissionPortal: "Acmecorp supplier RFP portal",
		buyerPriorities: [
			"Acmecorp wants to consolidate fragmented regional tools into a clearer enterprise service-management operating model.",
			"Acmecorp needs coverage for incident, problem, change, request, CMDB, asset, knowledge, reporting, portal, customer service, and HR service workflows.",
			"Acmecorp wants to improve CMDB maturity for millions of configuration items while focusing operations on active assets.",
			"Acmecorp needs credible AI capabilities, integrations, data residency, legal compliance, GRC, risk, and vulnerability management.",
		],
		evaluationCriteria: [
			"Functional fit for ITSM, service desk, request management, change enablement, incident operations, and infrastructure operations.",
			"Depth of Assets and CMDB story across hardware asset management, software asset management, discovery, and data quality.",
			"Atlassian System of Work narrative across Teamwork Graph, Rovo, Platform, knowledge, metrics, reporting, and portal experiences.",
			"Commercial model for a multi-thousand-user deployment, pricing transparency, implementation services, and long-term total cost of ownership.",
			"Security, legal, data residency, audit logs, Guard, GRC, risk, vulnerability, and enterprise support readiness.",
		],
		winThemes: [
			"Atlassian can connect Acmecorp IT, software, support, and business teams through one system of work instead of another rigid ITSM silo.",
			"Jira Service Management can demonstrate Acmecorp end-user request intake, fulfiller workflows, developer change enablement, and incident operations in one demo arc.",
			"Rovo and Teamwork Graph can show Acmecorp how AI answers questions, summarizes knowledge, and connects work across Jira, Confluence, assets, and service operations.",
			"Transparent pricing, phased migration, and marketplace/partner extensibility address Acmecorp's incumbent cost and adaptability concerns.",
		],
		risks: [
			"Hardware and software asset management depth may require roadmap, partner, or future-state positioning.",
			"Out-of-the-box security operations workflows need careful framing against Guard, audit, detection, vulnerability, and integration capabilities.",
			"CMDB scale and data-quality assumptions need credible discovery, import, governance, and lifecycle examples.",
			"The executive demo window is short, so the response team must prioritize the highest-value narrative and park detailed follow-ups.",
		],
		nextActions: [
			"Finish the Acmecorp requirement compliance matrix and mark every mandatory response owner.",
			"Confirm whether Acmecorp budget, stakeholder access, and campaign fit justify a full response.",
			"Validate Acmecorp Assets, CMDB, HAM/SAM, GRC, risk, vulnerability, and data residency responses with product and legal owners.",
			"Prepare a concise Acmecorp bid/no-bid recommendation with clear strengths, known gaps, and follow-up questions.",
		],
		responseTeam: [
			{
				role: "Account executive",
				owner: "Jordan Lee",
				need: "Customer strategy, incumbent displacement narrative, executive sponsor alignment, and final pitch.",
			},
			{
				role: "Proposal manager",
				owner: "Maya Chen",
				need: "Compliance matrix, response calendar, supplier questions, portal checklist, and submission readiness.",
			},
			{
				role: "Sales engineer",
				owner: "Priya Shah",
				need: "JSM workflows, Assets/CMDB, integrations, CI/CD, incident operations, AI demo, and technical appendix.",
			},
			{
				role: "Security and legal",
				owner: "Elena Ruiz",
				need: "Data residency, DPA, legal terms, audit logs, Guard, compliance exhibits, and vulnerability answers.",
			},
			{
				role: "Deal desk",
				owner: "Darius Pavri",
				need: "Pricing workbook, license assumptions, TCO positioning, discount guardrails, and approval path.",
			},
		],
	},
} satisfies WorkItemData;

const WORK_ITEMS_BY_CODE: Record<string, WorkItemData> = {
	[RFP_101_WORK_ITEM_CODE]: RFP_101_WORK_ITEM,
};

const WORK_ITEM_DESCRIPTIONS_BY_CODE: Record<string, string> = {
	"RFP-102": "Review the Northstar Bank supplier packet, procurement portal exports, and any requested file list to identify every response artifact the team must produce if the opportunity qualifies. Split Northstar Bank requirements into functional answers, legal or security exhibits, pricing files, implementation plans, customer-reference requests, and demo follow-ups. Flag ambiguous language early so the account team can submit clarification questions before the deadline instead of discovering gaps during final review.",
	"RFP-103": "Create a DACI-style ownership map for the Meridian Health RFP qualification and possible response. Assign drivers, approvers, contributors, and informed stakeholders across account leadership, proposal management, sales engineering, product specialists, legal, security, deal desk, support, and partner teams. The goal is to make every Meridian Health decision area visibly owned, reduce duplicate drafting, and ensure the bid/no-bid recommendation has an escalation path for blocked answers or risky commitments.",
	"RFP-104": "Inventory HelioWorks Energy's requirement areas and translate them into response tracks that can be staffed and reviewed. Cover ITSM, incident, problem, change, request, Assets and CMDB, hardware and software asset management, knowledge, reporting, portal management, AI, integrations, customer service, HR services, data residency, legal compliance, GRC, risk, vulnerability management, implementation services, and pricing. Mark which HelioWorks Energy topics are core Atlassian strengths, which need partner positioning, and which need careful expectation setting.",
	"RFP-105": "Run the BluePeak Telecom bid/no-bid risk assessment before the team invests heavily in drafting. Check mandatory requirements, certification asks, residency constraints, asset-management depth, security operations expectations, migration timelines, pricing guardrails, reference requirements, and executive-demo readiness. Summarize the BluePeak Telecom risks as concrete mitigation actions so leadership can decide whether to proceed, qualify the response, or request additional customer clarification.",
	"RFP-106": "Build a Redwood Retail Group response calendar that includes supplier questions, internal draft checkpoints, qualification reviews, legal and security approvals, pricing sign-off, final executive review, submission packaging, and post-submission follow-ups. Include buffer for missing evidence and late-stage scope changes. The timeline should be practical enough for the response team to work from and clear enough for leadership to understand where slippage will create Redwood Retail Group deal risk.",
	"RFP-107": "Collect the Summit Grove Insurance context needed to make the bid recommendation specific without overfitting to a single buyer. Capture the current tools, known pain points, business outcomes, executive priorities, implementation constraints, success metrics, user populations, regional differences, support model, and likely competitor strengths. Convert that Summit Grove Insurance context into qualification evidence and reusable win themes that can shape the decision brief if the pursuit proceeds.",
	"RFP-141": "Draft the executive narrative for why Atlassian is the right platform for Orion Motors' enterprise work transformation if the RFP clears qualification. Connect Jira Service Management, Jira, Confluence, Assets, Rovo, Teamwork Graph, Guard, analytics, automation, and marketplace extensibility into one coherent system-of-work story. The draft should explain how Atlassian could reduce Orion Motors tool sprawl, improve service delivery, give leaders visibility, and create a phased path from today's environment to a more connected operating model.",
	"RFP-142": "Prepare the NimbusCare functional response for service desk, request management, portals, knowledge, and reporting once the opportunity is qualified. Show how NimbusCare could design intake channels, route work to the right teams, manage SLAs, publish knowledge from Confluence, report on operational performance, and connect service work to software delivery. Include demo moments, configuration assumptions, known limitations, and reusable answer snippets the proposal team can paste into the formal response matrix.",
	"RFP-143": "Build the Copperline Logistics commercial and implementation response for the proposal. Cover licensing assumptions, phased rollout options, implementation services, migration support, training, success planning, total cost of ownership, renewal considerations, and any discount or approval dependencies. The work should give deal desk enough Copperline Logistics-specific detail to approve the numbers and give the customer a credible view of how Atlassian can be adopted without a disruptive big-bang migration.",
	"RFP-161": "Review the VertexRail Assets, CMDB, hardware asset, and software asset management positioning before the response goes to final review. Validate where Atlassian can answer directly, where data import or discovery assumptions matter, and where a partner or roadmap explanation is the most honest answer. The review should produce precise VertexRail language that is confident, accurate, and demoable without overstating native capabilities.",
	"RFP-162": "Review Greenfield BioSystems data residency, DPA, legal terms, procurement conditions, privacy requirements, and contract language for the response. Identify clauses that need legal approval, standard positions that can be reused, and Greenfield BioSystems-specific asks that may require exceptions. The output should give the proposal manager clear approved wording and a list of open legal risks that must be resolved before submission.",
	"RFP-163": "Review HarborPoint Finance security, Guard, audit logging, compliance, GRC, risk, and vulnerability-management answers. Confirm the current evidence package, approved product language, and any integration-based positioning for requirements outside native JSM workflows. The goal is to make the HarborPoint Finance response strong enough for a security evaluator while avoiding commitments that product, legal, or support teams cannot stand behind.",
	"RFP-164": "Prepare the Silverline Manufacturing executive review package for the final pitch. Summarize the customer problem, Atlassian win themes, major differentiators, known gaps, pricing posture, implementation approach, and demo storyline. The review should help leadership decide whether the Silverline Manufacturing response is compelling, whether the deal strategy is realistic, and which messages need to be emphasized in the final customer conversation.",
	"RFP-181": "Package and submit the TidalWorks Utilities clarification responses that unblock the proposal team. Make sure every customer question has an owner-approved answer, every answer is consistent with the main qualification strategy, and any new TidalWorks Utilities requirement discovered through Q&A is routed back into the board. Capture the submission timestamp and any follow-up commitments so the team can prove what was sent and when.",
	"RFP-182": "Archive the Novacore University final response package, exhibits, pricing files, demo deck, approved legal language, security artifacts, and reusable answer snippets. Tag the materials by requirement area so future RFP teams can find them quickly. Include a short retro summary that explains what worked, what created late risk, which answers should be promoted into the answer library, and which product gaps need follow-up.",
};

const RFP_WORK_ITEM_PEOPLE: readonly WorkItemPerson[] = [
	{
		name: "Maya Chen",
		avatarUrl: "/avatar-user/andrea-wilson/color/asow-service-yellow.png",
		role: "Proposal manager",
	},
	{
		name: "Jordan Lee",
		avatarUrl: "/avatar-user/andrew-park/color/asow-dev-lime.png",
		role: "Account executive",
	},
	{
		name: "Priya Shah",
		avatarUrl: "/avatar-user/annie-clare/color/asow-strategy-orange.png",
		role: "Sales engineer",
	},
	{
		name: "Elena Ruiz",
		avatarUrl: "/avatar-user/aoife-burke/color/asow-service-yellow.png",
		role: "Security and legal",
	},
	{
		name: "Darius Pavri",
		avatarUrl: "/avatar-user/darius-pavri/color/asow-strategy-orange.png",
		role: "Deal desk",
	},
	{
		name: "Florence Garcia",
		avatarUrl: "/avatar-user/florence-garcia/color/asow-strategy-orange.png",
		role: "Response specialist",
	},
	{
		name: "David Hsieh",
		avatarUrl: "/avatar-user/david-hsieh/color/asow-service-yellow.png",
		role: "Solution architect",
	},
] as const;

const CHILD_ITEM_STATUSES = ["todo", "inprogress", "done"] as const satisfies readonly WorkItemChildItem["status"][];

const CHILD_ITEM_TEMPLATES: ReadonlyArray<{
	priority: WorkItemChildItem["priority"];
	summary: (clientName: string) => string;
}> = [
	{
		priority: "high",
		summary: (clientName) => `Confirm ${clientName} mandatory response sections`,
	},
	{
		priority: "medium",
		summary: (clientName) => `Map ${clientName} stakeholder reviewers and decision owners`,
	},
	{
		priority: "high",
		summary: (clientName) => `Validate ${clientName} budget and procurement assumptions`,
	},
	{
		priority: "medium",
		summary: (clientName) => `Draft ${clientName} clarification questions for ambiguous requirements`,
	},
	{
		priority: "low",
		summary: (clientName) => `Collect reusable ${clientName} evidence and reference snippets`,
	},
	{
		priority: "medium",
		summary: (clientName) => `Review ${clientName} legal, security, and data-residency language`,
	},
	{
		priority: "high",
		summary: (clientName) => `Prepare ${clientName} executive review notes`,
	},
	{
		priority: "low",
		summary: (clientName) => `Archive ${clientName} response learnings for future RFPs`,
	},
] as const;

interface AttachmentVariant {
	ext: WorkItemAttachment["ext"];
	name: string;
	displayName: (clientName: string) => string;
	thumbnailKind: WorkItemAttachment["thumbnailKind"];
	thumbnailTone: WorkItemAttachment["thumbnailTone"];
	sourceLabel?: WorkItemAttachment["sourceLabel"];
	sourceProduct?: WorkItemAttachment["sourceProduct"];
}

const ATTACHMENT_VARIANTS: readonly AttachmentVariant[] = [
	{
		name: "supplier-questionnaire",
		displayName: (clientName) => `${clientName} supplier questionnaire`,
		ext: "pdf",
		thumbnailKind: "file",
		thumbnailTone: "information",
	},
	{
		name: "portal-export",
		displayName: (clientName) => `${clientName} portal export`,
		ext: "xlsx",
		thumbnailKind: "document",
		thumbnailTone: "success",
	},
	{
		name: "stakeholder-notes",
		displayName: (clientName) => `${clientName} stakeholder notes`,
		ext: "page",
		thumbnailKind: "document",
		thumbnailTone: "discovery",
		sourceLabel: "Confluence page",
		sourceProduct: "confluence",
	},
	{
		name: "security-addendum",
		displayName: (clientName) => `${clientName} security addendum`,
		ext: "docx",
		thumbnailKind: "document",
		thumbnailTone: "warning",
	},
	{
		name: "pricing-workbook",
		displayName: (clientName) => `${clientName} pricing workbook`,
		ext: "xlsx",
		thumbnailKind: "document",
		thumbnailTone: "neutral",
	},
	{
		name: "demo-planning-clip",
		displayName: (clientName) => `${clientName} demo planning clip`,
		ext: "mp4",
		thumbnailKind: "video",
		thumbnailTone: "information",
		sourceLabel: "Loom video",
		sourceProduct: "loom",
	},
	{
		name: "risk-register",
		displayName: (clientName) => `${clientName} risk register`,
		ext: "csv",
		thumbnailKind: "document",
		thumbnailTone: "warning",
	},
] as const;

const COMMENT_TEMPLATES: ReadonlyArray<(clientName: string) => string> = [
	(clientName) => `${clientName} procurement language needs one more pass before we commit response capacity.`,
	(clientName) => `I added the latest ${clientName} stakeholder notes and marked unresolved items for follow-up.`,
	(clientName) => `Sales engineering should confirm where the ${clientName} demo needs product or partner support.`,
	(clientName) => `Deal desk needs a cleaner ${clientName} pricing assumption before final review.`,
	(clientName) => `Legal and security language for ${clientName} should stay review-required until evidence is attached.`,
	(clientName) => `The ${clientName} response looks usable, but the owner matrix still needs one accountable driver.`,
] as const;

function getStableSeed(value: string): number {
	return [...value].reduce((seed, char) => seed + char.charCodeAt(0), 0);
}

function getCycledItem<T>(items: readonly T[], index: number): T {
	return items[index % items.length] ?? items[0]!;
}

function getKebabCase(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-|-$/gu, "");
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

function createVariableChildItems(code: string, clientName: string): WorkItemChildItem[] {
	const seed = getStableSeed(code);
	const count = 2 + (seed % 4);

	return Array.from({ length: count }, (_, index) => {
		const template = getCycledItem(CHILD_ITEM_TEMPLATES, seed + index);
		const assignee = getCycledItem(RFP_WORK_ITEM_PEOPLE, seed + index + 1);
		return {
			type: "Sub-task",
			key: `${code}-${String(index + 1).padStart(2, "0")}`,
			summary: template.summary(clientName),
			priority: template.priority,
			assignee: assignee.name,
			assigneeAvatarUrl: assignee.avatarUrl,
			status: getCycledItem(CHILD_ITEM_STATUSES, seed + index),
		};
	});
}

function createVariableAttachments(code: string, clientName: string): WorkItemAttachment[] {
	const seed = getStableSeed(code);
	const count = 1 + ((seed + 1) % 4);
	const clientSlug = getKebabCase(clientName);

	return Array.from({ length: count }, (_, index) => {
		const variant = getCycledItem(ATTACHMENT_VARIANTS, seed + index);
		return {
			name: `${clientSlug}-${variant.name}`,
			displayName: variant.displayName(clientName),
			ext: variant.ext,
			date: getDemoDate(seed, index),
			thumbnailKind: variant.thumbnailKind,
			thumbnailTone: variant.thumbnailTone,
			sourceLabel: variant.sourceLabel,
			sourceProduct: variant.sourceProduct,
		};
	});
}

function createVariableComments(code: string, clientName: string): WorkItemComment[] {
	const seed = getStableSeed(code);
	const count = 1 + ((seed + 2) % 3);

	return Array.from({ length: count }, (_, index) => {
		const author = getCycledItem(RFP_WORK_ITEM_PEOPLE, seed + index + 2);
		const content = getCycledItem(COMMENT_TEMPLATES, seed + index)(clientName);
		return {
			id: `${code.toLowerCase()}-comment-${index + 1}`,
			author,
			timestamp: `${(index + 1) * 12} minutes ago`,
			content,
		};
	});
}

function createVariableWorkItemFields(
	code: string,
	clientName: string,
	boardCard: KanbanBoardCardData | undefined,
): Pick<WorkItemData, "assignee" | "attachments" | "childItems" | "comments" | "priority" | "reporter" | "status"> {
	const seed = getStableSeed(code);

	return {
		assignee: getCycledItem(RFP_WORK_ITEM_PEOPLE, seed),
		reporter: getCycledItem(RFP_WORK_ITEM_PEOPLE, seed + 3),
		priority: getPriorityFromCard(boardCard),
		status: findBoardColumnTitleByCardCode(code),
		childItems: createVariableChildItems(code, clientName),
		attachments: createVariableAttachments(code, clientName),
		comments: createVariableComments(code, clientName),
	};
}

function formatList(label: string, items: readonly string[] | undefined): string[] {
	if (!items || items.length === 0) return [];
	return [label, ...items.map((item) => `- ${item}`)];
}

function formatTeam(team: readonly WorkItemRfpTeamMember[] | undefined): string[] {
	if (!Array.isArray(team) || team.length === 0) return [];
	return [
		"Response team needs:",
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
	const clientName = RFP_CLIENT_NAMES_BY_CODE[params.code as keyof typeof RFP_CLIENT_NAMES_BY_CODE];
	const baseWorkItem = WORK_ITEMS_BY_CODE[params.code] ?? {
		code: params.code,
		title: params.title,
		account: clientName,
		description: WORK_ITEM_DESCRIPTIONS_BY_CODE[params.code],
		...(clientName ? createVariableWorkItemFields(params.code, clientName, boardCard) : {}),
	};

	return {
		...baseWorkItem,
		...labelFields,
	};
}

export function formatAgentsBoardContext(): string {
	const visibleColumns = BOARD_COLUMNS.map((column) => {
		const sampleCards = column.cards
			.slice(0, 2)
			.map((card) => `${card.code}: ${card.title}`)
			.join("; ");
		return `- ${column.title}: ${column.count} work items${sampleCards ? ` (visible: ${sampleCards})` : ""}`;
	});

	return [
		"[Agents Board Context]",
		"Source: /agents Jira board.",
		`Project: ${AGENTS_BOARD_CONTEXT_LABEL}`,
		"Workflow: RFP response board.",
		"Visible columns:",
		...visibleColumns,
		"[End Agents Board Context]",
	].join("\n");
}

function formatLightweightActiveJiraWorkItemContext(workItem: WorkItemData): string {
	const childItems = workItem.childItems?.map(
		(item) => `- ${item.key}: ${item.summary} (${item.status}, ${item.priority}, owner: ${item.assignee ?? "unassigned"})`,
	);
	const attachments = workItem.attachments?.map(
		(file) => `- ${file.name}.${file.ext} (${file.date})`,
	);
	const recentActivity = workItem.comments?.flatMap((comment) => [
		`- ${comment.timestamp}: ${formatNameWithRole(comment.author.name, comment.author.role)} - ${comment.content}`,
		...(comment.replies ?? []).map(
			(reply) => `  - ${reply.timestamp}: ${formatNameWithRole(reply.author.name, reply.author.role)} - ${reply.content}`,
		),
	]);

	return [
		"[Active Jira Work Item Context]",
		"Source: /agents Jira work item.",
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
	]
		.filter((line): line is string => typeof line === "string" && line.length > 0)
		.join("\n");
}

export function formatActiveJiraWorkItemContext(
	workItem: WorkItemData | null | undefined,
): string | undefined {
	if (!workItem) {
		return undefined;
	}

	if (workItem.code !== RFP_101_WORK_ITEM_CODE || !workItem.rfpContext) {
		return formatLightweightActiveJiraWorkItemContext(workItem);
	}

	const rfp = workItem.rfpContext;
	const childItems = workItem.childItems?.map(
		(item) => `- ${item.key}: ${item.summary} (${item.status}, ${item.priority}, owner: ${item.assignee ?? "unassigned"})`,
	);
	const attachments = workItem.attachments?.map(
		(file) => `- ${file.name}.${file.ext} (${file.date})`,
	);
	const recentActivity = workItem.comments?.flatMap((comment) => [
		`- ${comment.timestamp}: ${formatNameWithRole(comment.author.name, comment.author.role)} - ${comment.content}`,
		...(comment.replies ?? []).map(
			(reply) => `  - ${reply.timestamp}: ${formatNameWithRole(reply.author.name, reply.author.role)} - ${reply.content}`,
		),
	]);

	return [
		"[Active Jira Work Item Context]",
		"Source: /agents Jira work item modal.",
		`Key: ${workItem.code}`,
		`Title: ${workItem.title}`,
		workItem.description ? `Description: ${workItem.description}` : null,
		`Status: ${workItem.status ?? "Unknown"}`,
		`Priority: ${workItem.priority ?? "Unknown"}`,
		workItem.startDate ? `Start date: ${workItem.startDate}` : null,
		workItem.dueDate ? `Due date: ${workItem.dueDate}` : null,
		workItem.parent ? `Parent: ${workItem.parent.code}${workItem.parent.title ? ` - ${workItem.parent.title}` : ""}` : null,
		`Customer: ${rfp.customerName}`,
		`Opportunity: ${rfp.opportunityName}`,
		`Seat count: ${rfp.seatCount}`,
		workItem.dealSize ? `Deal size: ${workItem.dealSize}` : null,
		`Competitor product to displace: ${rfp.competitorProduct}`,
		`Sales goal: ${rfp.salesGoal}`,
		`Procurement stage: ${rfp.procurementStage}`,
		`Submission portal: ${rfp.submissionPortal}`,
		`Response due date: ${rfp.responseDueDate}`,
		`Assignee: ${workItem.assignee?.name ? formatNameWithRole(workItem.assignee.name, workItem.assignee.role) : "Unassigned"}`,
		`Reporter: ${workItem.reporter?.name ? formatNameWithRole(workItem.reporter.name, workItem.reporter.role) : "Unknown"}`,
		workItem.labels?.length ? `Labels: ${workItem.labels.join(", ")}` : null,
		...formatList("Buyer priorities:", rfp.buyerPriorities),
		...formatList("Evaluation criteria:", rfp.evaluationCriteria),
		...formatList("Win themes:", rfp.winThemes),
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
	]
		.filter((line): line is string => typeof line === "string" && line.length > 0)
		.join("\n");
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
				signature: `agents-work-item:${workItem.code}`,
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
