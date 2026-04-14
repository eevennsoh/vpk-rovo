import { token } from "@/lib/tokens";
import GoalIcon from "@atlaskit/icon/core/goal";
import PagesIcon from "@atlaskit/icon/core/pages";
import TableIcon from "@atlaskit/icon/core/table";
import WhiteboardIcon from "@atlaskit/icon/core/whiteboard";

/**
 * Search result data structure
 */
export interface SearchResult {
	id: number;
	title: string;
	type: string;
	icon: typeof PagesIcon;
	iconColor: string;
	metadata: string[];
	excerpt: string;
}

/**
 * Mock search results for "OKRs 2026 planning process"
 */
export const MOCK_RESULTS: SearchResult[] = [
	{
		id: 1,
		title: "2026 OKR planning",
		type: "confluence",
		icon: PagesIcon,
		iconColor: token("color.icon.information"),
		metadata: ["Confluence", "Page", "CTO Strategic Initiatives", "Updated 7 months ago"],
		excerpt: "...The purpose of this section is to capture our work related to crafting KRs and OKRs for our L2 and L3 objectives for 2026...",
	},
	{
		id: 2,
		title: "OKRs Framework for 2026 Planning Process",
		type: "confluence",
		icon: PagesIcon,
		iconColor: token("color.icon.success"),
		metadata: ["Confluence", "Page", "Product Strategy", "Updated 5 months ago"],
		excerpt: "...This document outlines the OKRs framework we will use throughout 2026. The planning process begins in Q4 2025 and continues quarterly...",
	},
	{
		id: 3,
		title: "2026 Annual Planning: OKR Alignment Workshop",
		type: "confluence",
		icon: WhiteboardIcon,
		iconColor: token("color.icon.discovery"),
		metadata: ["Confluence", "Whiteboard", "Leadership Team", "Updated 6 months ago"],
		excerpt: "...Workshop outcomes for aligning departmental OKRs with company objectives for 2026. Key results include defining measurable outcomes for the planning process...",
	},
	{
		id: 4,
		title: "Engineering OKRs - 2026 Planning Cycle",
		type: "confluence",
		icon: GoalIcon,
		iconColor: token("color.icon.warning"),
		metadata: ["Confluence", "Page", "Engineering", "Updated 4 months ago"],
		excerpt: "...Engineering team OKRs for 2026, including technical debt reduction, platform modernization, and developer experience improvements tied to the planning process...",
	},
	{
		id: 5,
		title: "Q1 2026 OKR Planning Session Notes",
		type: "confluence",
		icon: PagesIcon,
		iconColor: token("color.icon.danger"),
		metadata: ["Confluence", "Page", "Product Management", "Updated 3 months ago"],
		excerpt: "...Notes from the Q1 2026 planning session covering OKR definitions, success metrics, and alignment with annual goals. The process involved cross-functional collaboration...",
	},
	{
		id: 6,
		title: "OKR Template - 2026 Planning",
		type: "confluence",
		icon: TableIcon,
		iconColor: token("color.icon.information"),
		metadata: ["Confluence", "Template", "Operations", "Updated 8 months ago"],
		excerpt: "...Standardized template for creating OKRs during the 2026 planning process. Includes sections for objectives, key results, initiatives, and success criteria...",
	},
	{
		id: 7,
		title: "Sales & Marketing OKRs: 2026 Annual Plan",
		type: "confluence",
		icon: GoalIcon,
		iconColor: token("color.icon.success"),
		metadata: ["Confluence", "Page", "Sales & Marketing", "Updated 5 months ago"],
		excerpt: "...2026 OKRs focused on revenue growth, market expansion, and customer acquisition. The planning process incorporates feedback from 2025 retrospectives...",
	},
	{
		id: 8,
		title: "HR & People Ops: 2026 OKR Planning",
		type: "confluence",
		icon: PagesIcon,
		iconColor: token("color.icon.discovery"),
		metadata: ["Confluence", "Page", "Human Resources", "Updated 6 months ago"],
		excerpt: "...People operations OKRs for 2026 including talent acquisition, employee engagement, and organizational development goals aligned with the company planning process...",
	},
	{
		id: 9,
		title: "Finance OKRs - 2026 Budget Planning",
		type: "confluence",
		icon: TableIcon,
		iconColor: token("color.icon.warning"),
		metadata: ["Confluence", "Page", "Finance", "Updated 7 months ago"],
		excerpt: "...Financial objectives and key results for 2026 including cost optimization, revenue targets, and investment priorities. The planning process aligns with board expectations...",
	},
	{
		id: 10,
		title: "Customer Success: 2026 OKR Strategic Planning",
		type: "confluence",
		icon: GoalIcon,
		iconColor: token("color.icon.danger"),
		metadata: ["Confluence", "Page", "Customer Success", "Updated 4 months ago"],
		excerpt: "...OKRs focused on customer retention, satisfaction scores, and expansion revenue for 2026. The planning process includes quarterly business reviews and success metrics...",
	},
];
