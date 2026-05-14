import type {
	WorkItemData,
	WorkItemRfpTeamMember,
} from "@/app/contexts/context-work-item-modal";
import type { ChatContextBarDescriptor } from "@/components/projects/sidebar-chat/lib/chat-context-bar";
import { BOARD_COLUMNS } from "./board-data";

export const RFP_101_WORK_ITEM_CODE = "RFP-101";
export const AGENTS_BOARD_CONTEXT_LABEL = "VitaFleet Q4 RFP Response";
const AGENTS_BOARD_CONTEXT_SIGNATURE = "agents-board:vitafleet-q4-rfp-response";

export interface AgentsChatScreenContext {
	chatContextBar: ChatContextBarDescriptor;
	contextDescription: string;
}

export const RFP_101_WORK_ITEM = {
	code: RFP_101_WORK_ITEM_CODE,
	title: "Qualify inbound Acme Mobility RFP",
	description:
		"Acme Mobility is evaluating a switch from a legacy competitor work-management platform to Jira for 10,000 users across sales, operations, engineering, support, and implementation teams. Qualify the opportunity, map the RFP requirements to Jira strengths, identify blockers before bid/no-bid, and prepare the sales team to fill the response package with persuasive, evidence-backed answers.",
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
	startDate: "Oct 7, 2026",
	dueDate: "Oct 28, 2026",
	parent: {
		code: "RFP-100",
		title: "Acme Mobility Enterprise RFP",
	},
	labels: ["enterprise-rfp", "q4-sales", "migration", "10k-seats"],
	childItems: [
		{
			type: "Sub-task",
			key: "RFP-105",
			summary: "Build compliance matrix from Acme portal questionnaire",
			priority: "high",
			assignee: "Maya Chen",
			status: "inprogress",
		},
		{
			type: "Sub-task",
			key: "RFP-106",
			summary: "Confirm sales engineer owner for migration and integrations appendix",
			priority: "medium",
			assignee: "Priya Shah",
			status: "todo",
		},
		{
			type: "Sub-task",
			key: "RFP-107",
			summary: "Draft win themes against incumbent competitor weaknesses",
			priority: "high",
			assignee: "Jordan Lee",
			status: "done",
		},
		{
			type: "Sub-task",
			key: "RFP-108",
			summary: "Collect security, compliance, and data residency exhibits",
			priority: "medium",
			assignee: "Elena Ruiz",
			status: "todo",
		},
	],
	attachments: [
		{
			name: "Acme-Mobility-enterprise-RFP",
			ext: "pdf",
			date: "7 Oct 2026, 09:12 AM",
			thumbnailTone: "success",
		},
		{
			name: "response-compliance-matrix",
			ext: "xlsx",
			date: "7 Oct 2026, 09:18 AM",
			thumbnailTone: "warning",
		},
		{
			name: "migration-pricing-scenarios",
			ext: "xlsx",
			date: "7 Oct 2026, 09:24 AM",
			thumbnailTone: "discovery",
		},
		{
			name: "customer-proof-library",
			ext: "docx",
			date: "7 Oct 2026, 09:31 AM",
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
				"I added the portal checklist and marked the security questionnaire, migration plan, and enterprise support model as required exhibits for the first draft.",
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
						"Sales engineering can own migration architecture, SSO/SCIM, data import, integrations, and performance at 10,000 seats. Please route pricing assumptions to deal desk before we send the first draft.",
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
				"Customer pain points are slow admin workflows, weak cross-team visibility, and poor executive reporting in the incumbent tool. Lead with Jira scale, marketplace extensibility, analytics, and enterprise-grade governance.",
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
	account: "Acme Mobility",
	dealSize: "10,000 seats",
	rfpContext: {
		customerName: "Acme Mobility",
		opportunityName: "Acme Mobility Jira enterprise migration",
		seatCount: "10,000 seats",
		competitorProduct: "LegacyWorks Enterprise",
		salesGoal:
			"Help the sales team complete a high-quality RFP response that convinces Acme Mobility to switch from the incumbent competitor to Jira.",
		procurementStage: "Inbound RFP qualification and response intake",
		responseDueDate: "Oct 28, 2026",
		submissionPortal: "Acme Procurement Portal",
		buyerPriorities: [
			"Prove Jira can scale across 10,000 users with controlled administration and reliable performance.",
			"Show a credible migration path from the incumbent competitor without disrupting active delivery teams.",
			"Give executives portfolio visibility while preserving team-level flexibility.",
			"Demonstrate security, data residency, SSO/SCIM, auditability, and enterprise support readiness.",
		],
		evaluationCriteria: [
			"Functional fit for work tracking, planning, reporting, automation, and cross-functional collaboration.",
			"Migration approach, timeline, onboarding plan, and change-management support.",
			"Integration coverage for identity, BI, incident management, CI/CD, documentation, and customer support tools.",
			"Commercial model for 10,000 seats, discount guardrails, implementation services, and renewal terms.",
			"Past performance evidence, customer references, uptime posture, security attestations, and support SLAs.",
		],
		winThemes: [
			"Jira gives Acme one shared work graph across teams without forcing every team into one rigid process.",
			"Atlassian can pair enterprise governance with marketplace breadth and deep ecosystem integrations.",
			"Migration can be phased by department with executive reporting available from the first wave.",
			"Security, admin controls, automation, and analytics reduce the operational friction Acme sees in the incumbent tool.",
		],
		risks: [
			"Portal deadline is tight and missing exhibits could disqualify the response.",
			"Competitor displacement requires credible migration proof and reference customers.",
			"Pricing needs deal desk approval before any seat-volume commitment is shared.",
			"Security questionnaire may require current SOC 2, data residency, and audit logging evidence.",
		],
		nextActions: [
			"Finish the compliance matrix and identify mandatory no-response gaps.",
			"Assign section owners across sales, sales engineering, security, legal, deal desk, and customer references.",
			"Draft executive summary, win themes, migration timeline, and implementation plan.",
			"Validate final portal checklist before bid/no-bid approval.",
		],
		responseTeam: [
			{
				role: "Account executive",
				owner: "Jordan Lee",
				need: "Customer strategy, competitor displacement narrative, executive sponsor alignment.",
			},
			{
				role: "Proposal manager",
				owner: "Maya Chen",
				need: "Compliance matrix, response calendar, portal checklist, final submission readiness.",
			},
			{
				role: "Sales engineer",
				owner: "Priya Shah",
				need: "Migration architecture, integrations, scale, technical appendix, implementation plan.",
			},
			{
				role: "Security and legal",
				owner: "Elena Ruiz",
				need: "Security questionnaire, DPA, compliance exhibits, data residency and audit answers.",
			},
			{
				role: "Deal desk",
				owner: "Darius Pavri",
				need: "Pricing workbook, discount guardrails, approval path, commercial assumptions.",
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

	return [
		"[Active Jira Work Item Context]",
		"Source: /agents Jira work item modal.",
		`Key: ${workItem.code}`,
		`Title: ${workItem.title}`,
		`Status: ${workItem.status ?? "Unknown"}`,
		`Priority: ${workItem.priority ?? "Unknown"}`,
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
