import type {
	WorkItemData,
	WorkItemRfpTeamMember,
} from "@/app/contexts/context-work-item-modal";
import type { ChatContextBarDescriptor } from "@/components/projects/sidebar-chat/lib/chat-context-bar";
import { BOARD_COLUMNS } from "./board-data";

export const RFP_101_WORK_ITEM_CODE = "RFP-101";
export const AGENTS_BOARD_CONTEXT_LABEL = "Enterprise RFP Response";
const AGENTS_BOARD_CONTEXT_SIGNATURE = "agents-board:enterprise-rfp-response";

export interface AgentsChatScreenContext {
	chatContextBar: ChatContextBarDescriptor;
	contextDescription: string;
}

export const RFP_101_WORK_ITEM = {
	code: RFP_101_WORK_ITEM_CODE,
	title: "Qualify enterprise service-management RFP",
	description:
		"A large enterprise customer is evaluating Atlassian as a replacement for its current service-management and work-management stack. The customer has regional tool fragmentation, a mature but messy CMDB, a mix of service desk and business-team workflows, and a procurement packet that spans ITSM, asset management, knowledge, reporting, AI, compliance, implementation services, and executive-ready pricing. Qualify the RFP by separating mandatory requirements from differentiators, mapping each requirement area to Atlassian strengths, and identifying the responses that need product, legal, security, deal desk, or partner validation. The output should give the account team a clear bid/no-bid recommendation, a first-pass response strategy, and a demo narrative that shows how Jira Service Management, Assets, Confluence, Rovo, Guard, and the Atlassian platform work together as an enterprise system of work.",
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
	startDate: "Aug 12, 2025",
	dueDate: "Sep 8, 2025",
	parent: {
		code: "RFP-100",
		title: "Enterprise RFP Response",
	},
	labels: ["enterprise-rfp", "service-management", "competitive-replacement", "jsm", "platform-demo"],
	childItems: [
		{
			type: "Sub-task",
			key: "RFP-105",
			summary: "Build requirement matrix for ITSM, CMDB, HAM, SAM, AI, GRC, and portal needs",
			priority: "high",
			assignee: "Maya Chen",
			status: "inprogress",
		},
		{
			type: "Sub-task",
			key: "RFP-106",
			summary: "Confirm JSM, Assets, Rovo, Guard, and platform demo owners",
			priority: "medium",
			assignee: "Priya Shah",
			status: "todo",
		},
		{
			type: "Sub-task",
			key: "RFP-107",
			summary: "Draft win themes against incumbent cost, complexity, and adaptability pain points",
			priority: "high",
			assignee: "Jordan Lee",
			status: "done",
		},
		{
			type: "Sub-task",
			key: "RFP-108",
			summary: "Collect legal, data residency, audit, and vulnerability-management exhibits",
			priority: "medium",
			assignee: "Elena Ruiz",
			status: "todo",
		},
	],
	attachments: [
		{
			name: "enterprise-rfp-requirements",
			ext: "pdf",
			date: "12 Aug 2025, 09:12 AM",
			thumbnailTone: "success",
		},
		{
			name: "rfp-requirement-compliance-matrix",
			ext: "xlsx",
			date: "12 Aug 2025, 09:18 AM",
			thumbnailTone: "warning",
		},
		{
			name: "jsm-assets-rovo-demo-plan",
			ext: "docx",
			date: "29 Aug 2025, 02:35 PM",
			thumbnailTone: "discovery",
		},
		{
			name: "pricing-tco-and-license-model",
			ext: "xlsx",
			date: "2 Sep 2025, 04:10 PM",
			thumbnailTone: "information",
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
	account: "Enterprise Evaluation Account",
	dealSize: "multi-thousand users",
	rfpContext: {
		customerName: "Enterprise Evaluation Account",
		opportunityName: "Enterprise service-management platform evaluation",
		seatCount: "multi-thousand users",
		competitorProduct: "incumbent service-management, CMDB, asset, HR, GRC, and custom workflow tooling",
		salesGoal:
			"Help the sales team complete a persuasive RFP response and executive demo that positions Atlassian as the lower-friction, AI-ready system of work for enterprise service delivery.",
		procurementStage: "Shortlisted supplier RFP response and executive demo preparation",
		responseDueDate: "Sep 8, 2025",
		submissionPortal: "Supplier RFP response package",
		buyerPriorities: [
			"Consolidate fragmented regional tools into a clearer enterprise service-management operating model.",
			"Cover incident, problem, change, request, CMDB, asset, knowledge, reporting, portal, customer service, and HR service workflows.",
			"Improve CMDB maturity for millions of configuration items while focusing operations on active assets.",
			"Show credible AI capabilities, integrations, data residency, legal compliance, GRC, risk, and vulnerability management.",
		],
		evaluationCriteria: [
			"Functional fit for ITSM, service desk, request management, change enablement, incident operations, and infrastructure operations.",
			"Depth of Assets and CMDB story across hardware asset management, software asset management, discovery, and data quality.",
			"Atlassian System of Work narrative across Teamwork Graph, Rovo, Platform, knowledge, metrics, reporting, and portal experiences.",
			"Commercial model for a multi-thousand-user deployment, pricing transparency, implementation services, and long-term total cost of ownership.",
			"Security, legal, data residency, audit logs, Guard, GRC, risk, vulnerability, and enterprise support readiness.",
		],
		winThemes: [
			"Atlassian connects IT, software, support, and business teams through one system of work instead of another rigid ITSM silo.",
			"Jira Service Management can demonstrate end-user request intake, fulfiller workflows, developer change enablement, and incident operations in one demo arc.",
			"Rovo and Teamwork Graph show how AI can answer questions, summarize knowledge, and connect work across Jira, Confluence, assets, and service operations.",
			"Transparent pricing, phased migration, and marketplace/partner extensibility address incumbent cost and adaptability concerns.",
		],
		risks: [
			"Hardware and software asset management depth may require roadmap, partner, or future-state positioning.",
			"Out-of-the-box security operations workflows need careful framing against Guard, audit, detection, vulnerability, and integration capabilities.",
			"CMDB scale and data-quality assumptions need credible discovery, import, governance, and lifecycle examples.",
			"The executive demo window is short, so the response team must prioritize the highest-value narrative and park detailed follow-ups.",
		],
		nextActions: [
			"Finish the requirement compliance matrix and mark every mandatory response owner.",
			"Draft executive summary, Atlassian System of Work story, JSM demo script, pricing/TCO narrative, and final pitch.",
			"Validate Assets, CMDB, HAM/SAM, GRC, risk, vulnerability, and data residency responses with product and legal owners.",
			"Prepare a concise executive demo agenda with clear strengths, known gaps, and follow-up answers for supplier Q&A.",
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
	"RFP-102": "Review the supplier packet, procurement portal exports, and any requested file list to identify every response artifact the team must produce. Split requirements into functional answers, legal or security exhibits, pricing files, implementation plans, customer-reference requests, and demo follow-ups. Flag ambiguous language early so the account team can submit clarification questions before the deadline instead of discovering gaps during final review.",
	"RFP-103": "Create a DACI-style ownership map for the RFP response. Assign drivers, approvers, contributors, and informed stakeholders across account leadership, proposal management, sales engineering, product specialists, legal, security, deal desk, support, and partner teams. The goal is to make every section visibly owned, reduce duplicate drafting, and ensure the final response has an escalation path for blocked answers or risky commitments.",
	"RFP-104": "Inventory the customer's requirement areas and translate them into response tracks that can be staffed and reviewed. Cover ITSM, incident, problem, change, request, Assets and CMDB, hardware and software asset management, knowledge, reporting, portal management, AI, integrations, customer service, HR services, data residency, legal compliance, GRC, risk, vulnerability management, implementation services, and pricing. Mark which topics are core Atlassian strengths, which need partner positioning, and which need careful expectation setting.",
	"RFP-105": "Run the bid/no-bid risk assessment before the team invests heavily in drafting. Check mandatory requirements, certification asks, residency constraints, asset-management depth, security operations expectations, migration timelines, pricing guardrails, reference requirements, and executive-demo readiness. Summarize the risks as concrete mitigation actions so leadership can decide whether to proceed, qualify the response, or request additional customer clarification.",
	"RFP-106": "Build a response calendar that includes supplier questions, internal draft checkpoints, demo-story reviews, legal and security approvals, pricing sign-off, final executive review, submission packaging, and post-submission follow-ups. Include buffer for missing evidence and late-stage scope changes. The timeline should be practical enough for the response team to work from and clear enough for leadership to understand where slippage will create deal risk.",
	"RFP-107": "Collect the customer context needed to make the response feel specific without overfitting to a single buyer. Capture the current tools, known pain points, business outcomes, executive priorities, implementation constraints, success metrics, user populations, regional differences, support model, and likely competitor strengths. Convert that context into reusable win themes that can shape the executive summary, demo narrative, and answer library.",
	"RFP-141": "Draft the executive narrative for why Atlassian is the right platform for the customer's enterprise work transformation. Connect Jira Service Management, Jira, Confluence, Assets, Rovo, Teamwork Graph, Guard, analytics, automation, and marketplace extensibility into one coherent system-of-work story. The draft should explain how Atlassian reduces tool sprawl, improves service delivery, gives leaders visibility, and creates a phased path from today's environment to a more connected operating model.",
	"RFP-142": "Prepare the functional response for service desk, request management, portals, knowledge, and reporting. Show how customers can design intake channels, route work to the right teams, manage SLAs, publish knowledge from Confluence, report on operational performance, and connect service work to software delivery. Include demo moments, configuration assumptions, known limitations, and reusable answer snippets the proposal team can paste into the formal response matrix.",
	"RFP-143": "Build the commercial and implementation response for the proposal. Cover licensing assumptions, phased rollout options, implementation services, migration support, training, success planning, total cost of ownership, renewal considerations, and any discount or approval dependencies. The work should give deal desk enough detail to approve the numbers and give the customer a credible view of how Atlassian can be adopted without a disruptive big-bang migration.",
	"RFP-161": "Review the Assets, CMDB, hardware asset, and software asset management positioning before the response goes to final review. Validate where Atlassian can answer directly, where data import or discovery assumptions matter, and where a partner or roadmap explanation is the most honest answer. The review should produce precise language that is confident, accurate, and demoable without overstating native capabilities.",
	"RFP-162": "Review data residency, DPA, legal terms, procurement conditions, privacy requirements, and contract language for the response. Identify clauses that need legal approval, standard positions that can be reused, and customer-specific asks that may require exceptions. The output should give the proposal manager clear approved wording and a list of open legal risks that must be resolved before submission.",
	"RFP-163": "Review security, Guard, audit logging, compliance, GRC, risk, and vulnerability-management answers. Confirm the current evidence package, approved product language, and any integration-based positioning for requirements outside native JSM workflows. The goal is to make the response strong enough for a security evaluator while avoiding commitments that product, legal, or support teams cannot stand behind.",
	"RFP-164": "Prepare the executive review package for the final pitch. Summarize the customer problem, Atlassian win themes, major differentiators, known gaps, pricing posture, implementation approach, and demo storyline. The review should help leadership decide whether the response is compelling, whether the deal strategy is realistic, and which messages need to be emphasized in the final customer conversation.",
	"RFP-181": "Package and submit the clarification responses that unblock the proposal team. Make sure every customer question has an owner-approved answer, every answer is consistent with the main response strategy, and any new requirement discovered through Q&A is routed back into the board. Capture the submission timestamp and any follow-up commitments so the team can prove what was sent and when.",
	"RFP-182": "Archive the final response package, exhibits, pricing files, demo deck, approved legal language, security artifacts, and reusable answer snippets. Tag the materials by requirement area so future RFP teams can find them quickly. Include a short retro summary that explains what worked, what created late risk, which answers should be promoted into the answer library, and which product gaps need follow-up.",
};

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

export function getAgentsWorkItemForCard(params: {
	code: string;
	title: string;
}): WorkItemData {
	return WORK_ITEMS_BY_CODE[params.code] ?? {
		code: params.code,
		title: params.title,
		description: WORK_ITEM_DESCRIPTIONS_BY_CODE[params.code],
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
	return [
		"[Active Jira Work Item Context]",
		"Source: /agents Jira work item.",
		`Key: ${workItem.code}`,
		`Title: ${workItem.title}`,
		workItem.status ? `Status: ${workItem.status}` : null,
		workItem.priority ? `Priority: ${workItem.priority}` : null,
		workItem.assignee?.name ? `Assignee: ${workItem.assignee.name}${workItem.assignee.role ? ` (${workItem.assignee.role})` : ""}` : null,
		workItem.reporter?.name ? `Reporter: ${workItem.reporter.name}${workItem.reporter.role ? ` (${workItem.reporter.role})` : ""}` : null,
		workItem.labels?.length ? `Labels: ${workItem.labels.join(", ")}` : null,
		workItem.description ? `Description: ${workItem.description}` : null,
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
		`- ${comment.timestamp}: ${comment.author.name}${comment.author.role ? ` (${comment.author.role})` : ""} - ${comment.content}`,
		...(comment.replies ?? []).map(
			(reply) => `  - ${reply.timestamp}: ${reply.author.name}${reply.author.role ? ` (${reply.author.role})` : ""} - ${reply.content}`,
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
		`Competitor product to displace: ${rfp.competitorProduct}`,
		`Sales goal: ${rfp.salesGoal}`,
		`Procurement stage: ${rfp.procurementStage}`,
		`Submission portal: ${rfp.submissionPortal}`,
		`Response due date: ${rfp.responseDueDate}`,
		`Assignee: ${workItem.assignee?.name ?? "Unassigned"}${workItem.assignee?.role ? ` (${workItem.assignee.role})` : ""}`,
		`Reporter: ${workItem.reporter?.name ?? "Unknown"}${workItem.reporter?.role ? ` (${workItem.reporter.role})` : ""}`,
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
