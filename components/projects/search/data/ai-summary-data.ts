/**
 * Mock source data for AI summary panel
 */

export interface SourceCard {
	id: string;
	title: string;
	author: string;
	authorAvatar?: string;
	updatedDate?: string;
	excerpt: string;
	type: string;
}

export const MOCK_SOURCES: SourceCard[] = [
	{
		id: "1",
		title: "2026 OKR planning",
		author: "Dani McKenzie",
		authorAvatar: "/avatar-human/andrea-wilson.png",
		excerpt: "The purpose of this section is to capture our work related to crafting KRs and OKRs for our L2 and L3 objectives for 2026",
		type: "Confluence",
	},
	{
		id: "2",
		title: "FY 2026 OKRs",
		author: "Oksana Levchuk",
		authorAvatar: "/avatar-human/andrew-park.png",
		updatedDate: "Updated on ...",
		excerpt: "This page provides an overview of the FY 2026 OKRs. You can access it here",
		type: "Confluence",
	},
	{
		id: "3",
		title: "Goals - H1 2026",
		author: "Sarah Chen",
		authorAvatar: "/avatar-human/annie-clare.png",
		excerpt: "This page lists relevant OKRs for the first half of 2026, including L1, L2, and L3 objectives",
		type: "Confluence",
	},
	{
		id: "4",
		title: "Q1 2026 Planning Review",
		author: "James Wilson",
		authorAvatar: "/avatar-human/aoife-burke.png",
		updatedDate: "Updated 2 weeks ago",
		excerpt: "Comprehensive review of Q1 planning sessions with key takeaways and action items for 2026 OKR implementation",
		type: "Confluence",
	},
];

export const SUMMARY_ITEMS = [
	{
		title: "2026 OKR Planning",
		description: "This page captures the work related to crafting KRs and OKRs for L2 and L3 objectives for 2026.",
		tagNumber: "1",
	},
	{
		title: "FY 2026 OKRs",
		description: "This page provides an overview of the FY 2026 OKRs.",
		tagNumber: "2",
	},
	{
		title: "Goals - H1 2026",
		description: "This page lists relevant OKRs for the first half of 2026, including L1, L2, and L3 objectives.",
		tagNumber: "3",
	},
] as const;

export const SUGGESTED_QUESTIONS = [
	"Open chat",
	"What are the L2 objectives?",
	"How are KRs defined for 2026?",
] as const;
