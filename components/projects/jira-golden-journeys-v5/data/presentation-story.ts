export type JiraGoldenJourneysV5PresentationChapter =
	| "track"
	| "learn"
	| "build"
	| "terminal";

export const JIRA_GOLDEN_JOURNEYS_V5_PRESENTATION_CHAPTERS = [
	{ label: "Track", value: "track" },
	{ label: "Learn", value: "learn" },
	{ label: "Build", value: "build" },
	{ label: "Terminal", value: "terminal" },
] as const satisfies readonly {
	label: string;
	value: JiraGoldenJourneysV5PresentationChapter;
}[];

export {
	createJiraGoldenJourneysV5PayBoardColumns,
	toJiraGoldenJourneysV5AgentActivityFromSession,
	toJiraGoldenJourneysV5DetachedAgentSession,
	JIRA_GOLDEN_JOURNEYS_V5_PAY_BOARD_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V5_PAY_COMPOSER_AGENTS,
	JIRA_GOLDEN_JOURNEYS_V5_PAY_HEADER_ASSIGNEES,
	JIRA_GOLDEN_JOURNEYS_V5_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID,
	JIRA_GOLDEN_JOURNEYS_V5_PAY_STATUS_PHASES,
} from "./presentation-board";
export {
	getJiraGoldenJourneysV5PullRequestPreview,
	JIRA_GOLDEN_JOURNEYS_V5_PULL_REQUEST_PREVIEWS,
} from "./presentation-pull-requests";

export {
	createJiraGoldenJourneysV5Pay101BuildState,
	JIRA_GOLDEN_JOURNEYS_V5_PAY_101_COMMIT_SHA,
	JIRA_GOLDEN_JOURNEYS_V5_PAY_101_PULL_REQUEST_NUMBER,
	JIRA_GOLDEN_JOURNEYS_V5_PAY_101_SESSION_ID,
	JIRA_GOLDEN_JOURNEYS_V5_PAY_101_UNCAPTURED_SESSION_ID,
	JIRA_GOLDEN_JOURNEYS_V5_PAY_101_WORK_ITEM,
} from "./presentation-build";
