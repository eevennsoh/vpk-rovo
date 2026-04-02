export type DealStage = "Lead" | "Qualified" | "Proposal" | "Negotiation" | "Won" | "Lost";
export type DealStatus = "active" | "won" | "lost";

export interface CrmOwner {
	id: string;
	name: string;
	avatar: string;
	initials: string;
}

export interface CrmDeal {
	id: string;
	name: string;
	company: string;
	stage: DealStage;
	value: number;
	owner: CrmOwner;
	closeDate: string;
	status: DealStatus;
	probability: number;
}

export interface CrmActivity {
	id: string;
	type: "note" | "email" | "call" | "meeting" | "stage_change";
	dealName: string;
	company: string;
	description: string;
	timestamp: string;
	owner: CrmOwner;
}

export const CRM_OWNERS: CrmOwner[] = [
	{ id: "o1", name: "Aria Chen", avatar: "", initials: "AC" },
	{ id: "o2", name: "Marcus Reyes", avatar: "", initials: "MR" },
	{ id: "o3", name: "Priya Nair", avatar: "", initials: "PN" },
	{ id: "o4", name: "Sam O'Brien", avatar: "", initials: "SO" },
	{ id: "o5", name: "Tessa Müller", avatar: "", initials: "TM" },
];

export const CRM_DEALS: CrmDeal[] = [
	{
		id: "d1",
		name: "Enterprise Platform Upgrade",
		company: "Acme Corp",
		stage: "Negotiation",
		value: 120000,
		owner: CRM_OWNERS[0],
		closeDate: "2026-04-30",
		status: "active",
		probability: 75,
	},
	{
		id: "d2",
		name: "Cloud Migration Package",
		company: "Bright Systems",
		stage: "Proposal",
		value: 85000,
		owner: CRM_OWNERS[1],
		closeDate: "2026-05-15",
		status: "active",
		probability: 50,
	},
	{
		id: "d3",
		name: "Analytics Suite Renewal",
		company: "DataFlow Inc",
		stage: "Won",
		value: 46000,
		owner: CRM_OWNERS[2],
		closeDate: "2026-03-20",
		status: "won",
		probability: 100,
	},
	{
		id: "d4",
		name: "Security Compliance Bundle",
		company: "SecureNet Ltd",
		stage: "Qualified",
		value: 38000,
		owner: CRM_OWNERS[0],
		closeDate: "2026-06-01",
		status: "active",
		probability: 35,
	},
	{
		id: "d5",
		name: "Dev Tools Subscription",
		company: "Toolcraft Co",
		stage: "Lead",
		value: 22000,
		owner: CRM_OWNERS[3],
		closeDate: "2026-06-30",
		status: "active",
		probability: 15,
	},
	{
		id: "d6",
		name: "API Integration Project",
		company: "Connect Hub",
		stage: "Won",
		value: 67500,
		owner: CRM_OWNERS[4],
		closeDate: "2026-03-10",
		status: "won",
		probability: 100,
	},
	{
		id: "d7",
		name: "Mobile Platform License",
		company: "AppWorks GmbH",
		stage: "Lost",
		value: 54000,
		owner: CRM_OWNERS[1],
		closeDate: "2026-03-28",
		status: "lost",
		probability: 0,
	},
	{
		id: "d8",
		name: "Data Warehouse Rollout",
		company: "Meridian Group",
		stage: "Proposal",
		value: 93000,
		owner: CRM_OWNERS[2],
		closeDate: "2026-05-22",
		status: "active",
		probability: 55,
	},
	{
		id: "d9",
		name: "AI Ops Pilot",
		company: "Luminary Tech",
		stage: "Negotiation",
		value: 175000,
		owner: CRM_OWNERS[0],
		closeDate: "2026-04-18",
		status: "active",
		probability: 80,
	},
	{
		id: "d10",
		name: "Support & Maintenance Retainer",
		company: "GlobeServe",
		stage: "Qualified",
		value: 29000,
		owner: CRM_OWNERS[3],
		closeDate: "2026-05-05",
		status: "active",
		probability: 40,
	},
];

export const CRM_ACTIVITIES: CrmActivity[] = [
	{
		id: "a1",
		type: "stage_change",
		dealName: "Enterprise Platform Upgrade",
		company: "Acme Corp",
		description: "Moved from Proposal → Negotiation",
		timestamp: "2026-04-02T09:15:00Z",
		owner: CRM_OWNERS[0],
	},
	{
		id: "a2",
		type: "call",
		dealName: "AI Ops Pilot",
		company: "Luminary Tech",
		description: "Discovery call — aligned on scope and timeline",
		timestamp: "2026-04-02T08:00:00Z",
		owner: CRM_OWNERS[0],
	},
	{
		id: "a3",
		type: "email",
		dealName: "Cloud Migration Package",
		company: "Bright Systems",
		description: "Sent revised proposal with updated pricing",
		timestamp: "2026-04-01T16:30:00Z",
		owner: CRM_OWNERS[1],
	},
	{
		id: "a4",
		type: "meeting",
		dealName: "Data Warehouse Rollout",
		company: "Meridian Group",
		description: "Technical review with their engineering team",
		timestamp: "2026-04-01T14:00:00Z",
		owner: CRM_OWNERS[2],
	},
	{
		id: "a5",
		type: "note",
		dealName: "Security Compliance Bundle",
		company: "SecureNet Ltd",
		description: "Champion requested a legal review before signing",
		timestamp: "2026-03-31T11:45:00Z",
		owner: CRM_OWNERS[0],
	},
	{
		id: "a6",
		type: "stage_change",
		dealName: "Analytics Suite Renewal",
		company: "DataFlow Inc",
		description: "Deal closed — marked as Won 🎉",
		timestamp: "2026-03-20T10:00:00Z",
		owner: CRM_OWNERS[2],
	},
];

export type DealStageFilter = DealStage | "all";

export function getCrmStats() {
	const activeDeals = CRM_DEALS.filter((d) => d.status === "active");
	const wonDeals = CRM_DEALS.filter((d) => d.status === "won");
	const closedDeals = CRM_DEALS.filter((d) => d.status === "won" || d.status === "lost");

	const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
	const winRate = closedDeals.length > 0 ? Math.round((wonDeals.length / closedDeals.length) * 100) : 0;
	const avgDealSize = wonDeals.length > 0 ? Math.round(totalRevenue / wonDeals.length) : 0;

	return {
		totalDeals: CRM_DEALS.length,
		activeDeals: activeDeals.length,
		totalRevenue,
		winRate,
		avgDealSize,
	};
}

export function getPipelineByStage(): { stage: DealStage; count: number; value: number }[] {
	const stages: DealStage[] = ["Lead", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
	return stages.map((stage) => {
		const deals = CRM_DEALS.filter((d) => d.stage === stage);
		return {
			stage,
			count: deals.length,
			value: deals.reduce((sum, d) => sum + d.value, 0),
		};
	});
}

export function formatCurrency(value: number): string {
	if (value >= 1_000_000) {
		return `$${(value / 1_000_000).toFixed(1)}M`;
	}
	if (value >= 1_000) {
		return `$${(value / 1_000).toFixed(0)}k`;
	}
	return `$${value}`;
}
