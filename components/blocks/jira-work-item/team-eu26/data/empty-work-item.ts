import { SESSION_EPOCH_MS } from "@/components/blocks/jira-work-item/data/session-fixtures";
import type { StaticTimelineEvent } from "@/components/blocks/jira-work-item/data/session-state";

const HOUR_MS = 60 * 60 * 1_000;

export const TEAM_EU26_EMPTY_ACTOR = {
	name: "Dev Rana",
	avatarUrl: "/avatar-user/simon-maclaughlin/color/asow-dev-lime.png",
} as const;

/** wiv-v2 empty activity: avatar + "Dev Rana created this work item · 6 hours ago". */
export const TEAM_EU26_EMPTY_ACTIVITY_EVENTS: readonly StaticTimelineEvent[] = [
	{
		actor: {
			avatarSrc: TEAM_EU26_EMPTY_ACTOR.avatarUrl,
			id: "team-eu26-dev-rana",
			kind: "person",
			name: TEAM_EU26_EMPTY_ACTOR.name,
		},
		createdAtMs: SESSION_EPOCH_MS - HOUR_MS * 6,
		id: "team-eu26-created-work-item",
		kind: "event",
		segments: [
			{ type: "text", text: "created this work item" },
			{ type: "text", text: " · 6 hours ago" },
		],
		showActor: true,
		showTimestamp: false,
	},
];
