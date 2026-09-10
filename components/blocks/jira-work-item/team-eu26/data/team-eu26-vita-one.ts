import type { WorkItemData } from "@/app/contexts/context-work-item-modal";
import { createAgentPlannerState } from "@/components/blocks/jira-work-item/data/planner-state";
import {
	hydratePreset,
	type AgentSessionComment,
	type JiraWorkItemPreset,
	type JiraWorkItemState,
	type StaticTimelineEvent,
} from "@/components/blocks/jira-work-item/data/session-state";
import { TEAM_EU26_EMPTY_ACTIVITY_EVENTS } from "@/components/blocks/jira-work-item/team-eu26/data/empty-work-item";
import { SESSION_EPOCH_MS } from "@/components/blocks/jira-work-item/data/session-fixtures";
import { TEAM_EU26_DESCRIPTION } from "@/components/blocks/jira-work-item/team-eu26/data/high-confidence-work-item";

const DAY_MS = 24 * 60 * 60 * 1_000;

export const TEAM_EU26_PEOPLE = {
	automatic: {
		name: "Automatic",
		role: "Automatic assignment",
	},
	annie: {
		name: "Annie Cook",
		avatarUrl: "/avatar-user/victoria-styles/color/asow-dev-lime.png",
	},
	elena: {
		name: "Elena Rodriguez",
		avatarUrl: "/avatar-user/veronica-rodriguez/color/asow-service-yellow.png",
	},
	marcus: {
		name: "Marcus Kim",
		avatarUrl: "/avatar-user/simon-maclaughlin/color/asow-dev-lime.png",
	},
	sarah: {
		name: "Sarah Lim",
		avatarUrl: "/avatar-user/ting-chen/color/asow-teamwork-blue.png",
	},
} as const;

export const TEAM_EU26_VITA_ONE_WORK_ITEM: WorkItemData = {
	assignee: TEAM_EU26_PEOPLE.annie,
	code: "VITA-1",
	description: TEAM_EU26_DESCRIPTION,
	dueDate: "2026-05-25",
	priority: "High",
	reporter: TEAM_EU26_PEOPLE.elena,
	status: "In progress",
	title: "Redesign onboarding flow for new users",
};

const TEAM_EU26_ACTIVITY_EVENTS: readonly StaticTimelineEvent[] = [
	{
		actor: {
			avatarSrc: TEAM_EU26_PEOPLE.elena.avatarUrl,
			id: "team-eu26-elena-rodriguez",
			kind: "person",
			name: TEAM_EU26_PEOPLE.elena.name,
		},
		createdAtMs: SESSION_EPOCH_MS - DAY_MS * 3.8,
		icon: "assigned",
		id: "team-eu26-assignee-changed",
		kind: "event",
		segments: [
			{ type: "text", text: "Assignee changed to " },
			{
				avatarSrc: TEAM_EU26_PEOPLE.sarah.avatarUrl,
				text: TEAM_EU26_PEOPLE.sarah.name,
				type: "user-mention",
			},
			{ type: "text", text: " by " },
			{
				avatarSrc: TEAM_EU26_PEOPLE.elena.avatarUrl,
				text: TEAM_EU26_PEOPLE.elena.name,
				type: "user-mention",
			},
			{ type: "text", text: " 4 days ago" },
		],
		showActor: false,
		showTimestamp: false,
	},
	{
		actor: {
			avatarSrc: TEAM_EU26_PEOPLE.sarah.avatarUrl,
			id: "team-eu26-sarah-lim",
			kind: "person",
			name: TEAM_EU26_PEOPLE.sarah.name,
		},
		createdAtMs: SESSION_EPOCH_MS - DAY_MS * 3.9,
		icon: "status",
		id: "team-eu26-due-date-changed",
		kind: "event",
		segments: [
			{ type: "text", text: "Due date changed to May 25, 2026 by " },
			{
				avatarSrc: TEAM_EU26_PEOPLE.sarah.avatarUrl,
				text: TEAM_EU26_PEOPLE.sarah.name,
				type: "user-mention",
			},
			{ type: "text", text: " 5 days ago" },
		],
		showActor: false,
		showTimestamp: false,
	},
];

const TEAM_EU26_COMMENTS: readonly AgentSessionComment[] = [
	{
		authorAvatarSrc: TEAM_EU26_PEOPLE.marcus.avatarUrl,
		authorName: TEAM_EU26_PEOPLE.marcus.name,
		content:
			"The paid media budget allocation looks off — we're currently over-indexing on social and under on search. Recommend rebalancing before launch.",
		createdAtMs: SESSION_EPOCH_MS - DAY_MS * 4,
		id: "team-eu26-marcus-budget",
		threadReplies: [
			{
				authorAvatarSrc: TEAM_EU26_PEOPLE.marcus.avatarUrl,
				authorName: TEAM_EU26_PEOPLE.marcus.name,
				content:
					"Following up with more detail, since this is a bigger shift than a one-line comment can really cover. I pulled the spend numbers from the last two campaigns to get a clearer picture of where the budget is actually going versus where we planned for it to go.",
				createdAtMs: SESSION_EPOCH_MS - DAY_MS * 5,
				id: "team-eu26-marcus-follow-up",
			},
			{
				authorAvatarSrc: TEAM_EU26_PEOPLE.marcus.avatarUrl,
				authorName: TEAM_EU26_PEOPLE.marcus.name,
				content: "All confirmed now — we're good to proceed with the 18th.",
				createdAtMs: SESSION_EPOCH_MS - DAY_MS * 5,
				id: "team-eu26-marcus-confirmed",
			},
		],
	},
	{
		authorAvatarSrc: TEAM_EU26_PEOPLE.annie.avatarUrl,
		authorName: TEAM_EU26_PEOPLE.annie.name,
		content:
			"Visuals are looking strong. Can we check if the colour palette aligns with the latest brand refresh guidelines?",
		createdAtMs: SESSION_EPOCH_MS - DAY_MS * 4.1,
		id: "team-eu26-annie-visuals",
		threadReplies: [
			{
				authorAvatarSrc: TEAM_EU26_PEOPLE.sarah.avatarUrl,
				authorName: TEAM_EU26_PEOPLE.sarah.name,
				content: "Good catch — I'll cross-reference with the brand team and update the assets.",
				createdAtMs: SESSION_EPOCH_MS - DAY_MS * 5,
				id: "team-eu26-sarah-brand-check",
			},
			{
				authorAvatarSrc: TEAM_EU26_PEOPLE.annie.avatarUrl,
				authorName: TEAM_EU26_PEOPLE.annie.name,
				content: "Perfect, thanks Sarah. Let me know once that's done.",
				createdAtMs: SESSION_EPOCH_MS - DAY_MS * 5,
				id: "team-eu26-annie-confirmation",
			},
		],
	},
];

export function createTeamEu26VitaOneState(
	preset: JiraWorkItemPreset,
	workItem: Readonly<WorkItemData>,
): JiraWorkItemState {
	const base = hydratePreset(preset, workItem);
	if (preset === "blank") {
		return base;
	}
	if (preset === "empty") {
		return {
			...base,
			contextResources: {
				...base.contextResources,
				attachments: [],
				description: "",
				linkedItems: [],
				nextSteps: [],
				subtasks: [],
				title: workItem.title,
				tldr: [],
			},
			metadata: {
				...base.metadata,
				assignee: TEAM_EU26_PEOPLE.automatic,
				atlassianProject: null,
				crew: [],
				dueDate: undefined,
				priority: "Medium",
				reporter: TEAM_EU26_PEOPLE.elena,
				status: "To do",
			},
			planner: createAgentPlannerState("filled", workItem),
			staticEvents: TEAM_EU26_EMPTY_ACTIVITY_EVENTS.map((event) => ({ ...event })),
		};
	}

	return {
		...base,
		comments: TEAM_EU26_COMMENTS.map((comment) => ({
			...comment,
			threadReplies: comment.threadReplies?.map((reply) => ({ ...reply })),
		})),
		contextResources: {
			...base.contextResources,
			attachments: [],
			description: TEAM_EU26_DESCRIPTION,
			linkedItems: [],
			nextSteps: [],
			subtasks: [],
			title: workItem.title,
			tldr: [],
		},
		metadata: {
			...base.metadata,
			assignee: preset === "filled" ? TEAM_EU26_PEOPLE.automatic : TEAM_EU26_PEOPLE.annie,
			atlassianProject: null,
			crew: [],
			dueDate: new Date("2026-05-25T00:00:00.000Z"),
			priority: "High",
			reporter: TEAM_EU26_PEOPLE.elena,
			status: "In progress",
		},
		staticEvents: TEAM_EU26_ACTIVITY_EVENTS.map((event) => ({ ...event })),
		...(preset === "filled" ? { sessions: [] } : {}),
	};
}
