export type TeamEu26AttachmentKind = "confluence" | "file" | "google-drive" | "image" | "loom" | "video";

export interface TeamEu26Attachment {
	addedBy: string;
	dateAdded: string;
	id: string;
	kind: TeamEu26AttachmentKind;
	name: string;
}

export interface TeamEu26TableWorkItem {
	assignee: string;
	key: string;
	priority: "High" | "Low" | "Medium";
	status: "In progress" | "To do";
	summary: string;
}

export interface TeamEu26LinkedWorkItem extends TeamEu26TableWorkItem {
	relationship: "Blocked by" | "Blocks" | "Clones" | "Relates to";
}

export const TEAM_EU26_DESCRIPTION =
	"The current onboarding experience has a high drop-off rate at the account setup step. This story covers a full redesign of the onboarding flow to improve activation rates for new users. The new flow should be step-based, guide users to their first meaningful action within the product, and support both self-serve and sales-assisted journeys. Key deliverables include updated copy, a progress indicator component, step validation logic, and integration with the existing auth system.";

export const TEAM_EU26_ATTACHMENTS: readonly TeamEu26Attachment[] = [
	{ addedBy: "John Vaughan", dateAdded: "1 Mar 2026", id: "marketing-strategy", kind: "confluence", name: "Q1 Marketing Strategy & Goals" },
	{ addedBy: "Sarah Smith", dateAdded: "2 Mar 2026", id: "campaign-draft", kind: "file", name: "Social Media Campaign Draft.pdf" },
	{ addedBy: "Marcus Kim", dateAdded: "2 Mar 2026", id: "brand-guidelines", kind: "google-drive", name: "Brand Asset Guidelines 2026" },
	{ addedBy: "Elena Rodriguez", dateAdded: "4 Mar 2026", id: "feature-walkthrough", kind: "loom", name: "Feature Walkthrough - New UI" },
	{ addedBy: "David Chen", dateAdded: "4 Mar 2026", id: "hero-image", kind: "image", name: "Hero Image - Summer Launch.png" },
	{ addedBy: "Sia Vale", dateAdded: "5 Mar 2026", id: "research-notes", kind: "confluence", name: "Onboarding research notes" },
	{ addedBy: "Amara Okafor", dateAdded: "5 Mar 2026", id: "prototype-demo", kind: "video", name: "Prototype demo.mp4" },
	{ addedBy: "Zoe Loft", dateAdded: "6 Mar 2026", id: "auth-flow", kind: "file", name: "Authentication flow.pdf" },
];

export const TEAM_EU26_SUBITEMS: readonly TeamEu26TableWorkItem[] = [
	{ assignee: "Sia Vale", key: "VITA-4", priority: "Medium", status: "In progress", summary: "Write copy for welcome screen" },
	{ assignee: "Amara Okafor", key: "VITA-5", priority: "High", status: "To do", summary: "Design progress indicator component" },
	{ assignee: "Automatic", key: "VITA-6", priority: "Low", status: "To do", summary: "Implement step validation logic" },
];

export const TEAM_EU26_LINKED_ITEMS: readonly TeamEu26LinkedWorkItem[] = [
	{ assignee: "Zoe Loft", key: "VITA-9", priority: "Low", relationship: "Blocks", status: "To do", summary: "Customer interview video editing" },
	{ assignee: "Marcus Kim", key: "VITA-10", priority: "Medium", relationship: "Relates to", status: "In progress", summary: "Instrument activation analytics" },
	{ assignee: "Sarah Lim", key: "VITA-13", priority: "High", relationship: "Blocked by", status: "To do", summary: "Update sign-up service contract" },
	{ assignee: "Elena Rodriguez", key: "VITA-14", priority: "Low", relationship: "Relates to", status: "To do", summary: "Refresh onboarding research" },
	{ assignee: "David Chen", key: "VITA-15", priority: "Medium", relationship: "Clones", status: "To do", summary: "Sales-assisted journey prototype" },
];
