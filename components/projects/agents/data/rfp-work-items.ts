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
	title: "Qualify global ITSM platform replacement RFP",
	description:
		"A global automotive enterprise is evaluating Atlassian as a replacement for its current ServiceNow-based IT support platform. The customer runs multiple regional ServiceNow instances, supports roughly 7,000 licensed agents, and manages a very large CMDB where only a fraction of configuration items are active assets. Qualify the RFP, map each requirement area to Atlassian strengths, identify gaps that need partner or roadmap positioning, and prepare the response team for an onsite executive demo.",
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
	labels: ["enterprise-rfp", "automotive", "servicenow-replacement", "jsm", "7k-agents"],
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
			summary: "Draft win themes against ServiceNow cost, complexity, and adaptability pain points",
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
			name: "automotive-itsm-rfp-requirements",
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
				"I added the RFP timeline, supplier-question deadline, response deadline, and onsite demo agenda. The first pass flags ITSM, CMDB, HAM/SAM, knowledge, reporting, portal, AI, data residency, customer service, GRC, and pricing as mandatory sections.",
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
				"Customer pain points are ServiceNow cost, platform rigidity, three regional instances, CMDB quality at scale, and AI readiness. Lead with Atlassian System of Work, JSM request and incident operations, Teamwork Graph, Rovo, Assets, knowledge, reporting, and transparent TCO.",
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
	account: "Global Automotive Enterprise",
	dealSize: "7,000 agents",
	rfpContext: {
		customerName: "Global Automotive Enterprise",
		opportunityName: "Global ITSM platform replacement and JSM evaluation",
		seatCount: "7,000 agents",
		competitorProduct: "ServiceNow ITSM, ITOM, CMDB, Asset Management, HR, Service Delivery, GRC, and custom workflows",
		salesGoal:
			"Help the sales team complete a persuasive RFP response and onsite demo that positions Atlassian as the lower-friction, AI-ready system of work for global IT operations.",
		procurementStage: "Shortlisted supplier RFP response and onsite demo preparation",
		responseDueDate: "Sep 8, 2025",
		submissionPortal: "Supplier RFP response package",
		buyerPriorities: [
			"Replace multiple ServiceNow instances with a consolidated global IT service management approach.",
			"Cover incident, problem, change, request, CMDB, asset, knowledge, reporting, portal, customer service, and HR service workflows.",
			"Improve CMDB maturity for millions of configuration items while focusing operations on active assets.",
			"Show credible AI capabilities, integrations, data residency, legal compliance, GRC, risk, and vulnerability management.",
		],
		evaluationCriteria: [
			"Functional fit for ITSM, service desk, request management, change enablement, incident operations, and infrastructure operations.",
			"Depth of Assets and CMDB story across hardware asset management, software asset management, discovery, and data quality.",
			"Atlassian System of Work narrative across Teamwork Graph, Rovo, Platform, knowledge, metrics, reporting, and portal experiences.",
			"Commercial model for roughly 7,000 agents, pricing transparency, implementation services, and long-term total cost of ownership.",
			"Security, legal, data residency, audit logs, Guard, GRC, risk, vulnerability, and enterprise support readiness.",
		],
		winThemes: [
			"Atlassian connects IT, software, support, and business teams through one system of work instead of another rigid ITSM silo.",
			"Jira Service Management can demonstrate end-user request intake, fulfiller workflows, developer change enablement, and incident operations in one demo arc.",
			"Rovo and Teamwork Graph show how AI can answer questions, summarize knowledge, and connect work across Jira, Confluence, assets, and service operations.",
			"Transparent pricing, phased migration, and marketplace/partner extensibility address ServiceNow cost and adaptability concerns.",
		],
		risks: [
			"Hardware and software asset management depth may require roadmap, partner, or future-state positioning.",
			"Out-of-the-box security operations workflows need careful framing against Guard, audit, detection, vulnerability, and integration capabilities.",
			"CMDB scale and data-quality assumptions need credible discovery, import, governance, and lifecycle examples.",
			"The onsite agenda is only three hours, so the response team must prioritize the highest-value demo path and park detailed follow-ups.",
		],
		nextActions: [
			"Finish the requirement compliance matrix and mark every mandatory response owner.",
			"Draft executive summary, Atlassian System of Work story, JSM demo script, pricing/TCO narrative, and final pitch.",
			"Validate Assets, CMDB, HAM/SAM, GRC, risk, vulnerability, and data residency responses with product and legal owners.",
			"Prepare a concise onsite demo agenda with clear strengths, known gaps, and follow-up answers for supplier Q&A.",
		],
		responseTeam: [
			{
				role: "Account executive",
				owner: "Jordan Lee",
				need: "Customer strategy, ServiceNow displacement narrative, executive sponsor alignment, and final pitch.",
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
