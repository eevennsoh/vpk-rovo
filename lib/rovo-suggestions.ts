/**
 * Rovo Chat Suggestions
 *
 * Static catalog of skill/prompt suggestions for the Rovo chat sidebar.
 */

import type { ComponentType } from "react";

// Icon imports - these will be used by consuming components
import TimelineIcon from "@atlaskit/icon/core/timeline";
import EditIcon from "@atlaskit/icon/core/edit";
import TranslateIcon from "@atlaskit/icon/core/translate";

export interface RovoSuggestion {
	id: string;
	label: string;
	/** Prompt text sent to the AI — defaults to `label` if omitted */
	prompt?: string;
	/** Local icon component for skills - uses any to accommodate icon props */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: ComponentType<any>;
	/** Image path for prompts with rich illustrations */
	imageSrc?: string;
	/** Hidden context attached when this suggestion is submitted */
	contextDescription?: string;
	/** Indicates if this is a "skill" (icon) or "prompt" (rich illustration) */
	type: "skill" | "prompt";
}

const rovodevSiteUrl =
	process.env.NEXT_PUBLIC_ROVODEV_SITE_URL || "https://hello.atlassian.net";

const LAST_7_DAYS_SITE_SCOPE_CONTEXT = [
	"[Work Summary Scope]",
	"For this request, gather the user's last-7-days work activity across both Atlassian sites.",
	'- Jira site_url: "https://product-fabric.atlassian.net"',
	`- Confluence site_url: "${rovodevSiteUrl}"`,
	"Choose the tools needed to fetch Jira and Confluence activity for these sites. Do not assume a fixed tool path.",
	"If one site has no results or errors, continue with the other site and clearly report coverage and gaps.",
	"Merge and deduplicate activity before responding.",
	"[End Work Summary Scope]",
].join("\n");

/**
 * The actual prompt sent to the AI when the "Last 7 days of work" suggestion is clicked.
 * Includes "from Jira and Confluence" so RovoDev naturally selects the right tools.
 * The user-visible label remains short ("Last 7 days of work").
 */
const LAST_7_DAYS_PROMPT =
	"Search for all work I have done in the last 7 days from Jira and Confluence";

const GOOGLE_CALENDAR_LIST_EVENTS_PROMPT =
	"List Google Calendar events for today";

const GOOGLE_CALENDAR_LIST_EVENTS_CONTEXT = [
	"[Tool Requirement]",
	"For this request, use the Google Calendar MCP tool to list events.",
	"Always include required parameters: `calendarId`, `timeMin`, and `timeMax`.",
	"If the user does not specify a calendar, use `calendarId: \"primary\"`.",
	"`timeMin` and `timeMax` must be strict UTC ISO 8601 timestamps.",
	"[End Tool Requirement]",
].join("\n");

/**
 * Default suggestions shown in the chat greeting
 * Showcases RovoDev's tool coverage across Atlassian and external apps
 */
export const defaultSuggestions: RovoSuggestion[] = [
	{
		id: "work-last-7-days",
		label: "Last 7 days of work",
		prompt: LAST_7_DAYS_PROMPT,
		icon: TimelineIcon,
		contextDescription: LAST_7_DAYS_SITE_SCOPE_CONTEXT,
		type: "skill",
	},
	{
		id: "draft-confluence-page",
		label: "Draft Confluence page",
		icon: EditIcon,
		type: "skill",
	},
	{
		id: "translate-text",
		label: "Translate this text",
		icon: TranslateIcon,
		type: "skill",
	},
	{
		id: "figma-design-context",
		label: "Get Figma design context",
		imageSrc: "/3p/figma/16.svg",
		type: "prompt",
	},
	{
		id: "send-slack-message",
		label: "Send Slack message",
		imageSrc: "/3p/slack/16-borderless.svg",
		type: "prompt",
	},
	{
		id: "list-google-calendar-events",
		label: "List Google Calendar events",
		prompt: GOOGLE_CALENDAR_LIST_EVENTS_PROMPT,
		contextDescription: GOOGLE_CALENDAR_LIST_EVENTS_CONTEXT,
		imageSrc: "/3p/google-calendar/16-borderless.svg",
		type: "prompt",
	},
];
