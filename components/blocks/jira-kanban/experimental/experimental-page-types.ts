import type { ReactNode, Ref, RefObject } from "react";

import type { AgentSessionItem } from "@/components/blocks/agent-session";
import type {
	JiraListAgentSessionDropIntent,
	JiraListInsertion,
} from "@/components/blocks/jira-list";
import type {
	JiraIssueAgentActivityLayout,
	JiraIssueGenerativeActionPresentation,
} from "@/components/blocks/jira-issue";
import type {
	JiraKanbanAgentData,
	JiraKanbanAssigneeData,
	JiraKanbanCardData,
	JiraKanbanColumnData,
	JiraKanbanProps,
} from "../index";
import type { ExperimentalJiraKanbanProps } from "./experimental-jira-kanban";
import type { BoardCardInsertion } from "./lib/board-agent-session-drag";
import type { ExperimentalJiraKanbanView } from "./experimental-board-header";
import type { ExperimentalJiraKanbanMode } from "./pulse/components/pulse-mode-controls";
import type { PulseAgentSession, PulseLooseWork, PulseWorkItem } from "./pulse/types";

export interface ExperimentalJiraKanbanListRenderContext {
	agentSessionDropIntent?: JiraListAgentSessionDropIntent;
	/**
	 * True when Untracked is the in-flow column (Panel off). The list drops
	 * its leading inset so it sits on the same rhythm as board statuses.
	 */
	onTrailingContentUnderlapChange: (hasUnderlap: boolean) => void;
	scrollEndInset: number;
	trailingOverlayRef: RefObject<HTMLElement | null>;
}

export interface ExperimentalJiraKanbanPageHandle {
	/**
	 * Open Insights, mark the timeline viewed, and land on `snapshotId`.
	 * Omit the id to open at the top of the article, as the toggle does.
	 */
	openTimeline: (snapshotId?: string | null) => void;
}

export interface ExperimentalJiraKanbanPageProps {
	activeView?: ExperimentalJiraKanbanView;
	activeCardCode?: string;
	/** Extra local sessions discovered after the static Pulse fixture loaded. */
	additionalAgentSessions?: readonly PulseAgentSession[];
	agentActivityLayout?: JiraIssueAgentActivityLayout;
	cardGenerativeActionPresentation?: JiraIssueGenerativeActionPresentation;
	createWorkItemDropZoneLabel?: ExperimentalJiraKanbanProps["createWorkItemDropZoneLabel"];
	detachedAgentSessionsByCard?: ExperimentalJiraKanbanProps["detachedAgentSessionsByCard"];
	agentSessionAssigneeIdAliases?: Readonly<Record<string, string>>;
	/**
	 * Where untracked work lives on this board.
	 *
	 * `"column"` keeps it in flow, as a 280px column left of the status
	 * scrollport and of the work items list. `"panel"` lifts the same column
	 * into a floating side surface pinned to the trailing edge of the content
	 * region, which the board *and* the list scroll beneath. Either
	 * presentation survives a view switch.
	 *
	 * The choice is a prop rather than a read of the global variant store: this
	 * block stays generic and unit-testable, and the route that owns the store
	 * decides. Only one presentation ever mounts, so the two can never drift.
	 */
	agentSessionPresentation?: "column" | "panel";
	agents?: readonly JiraKanbanAgentData[];
	ariaLabel?: string;
	boardColumns?: readonly JiraKanbanColumnData[];
	columnChrome?: JiraKanbanProps["columnChrome"];
	compactHeader?: boolean;
	defaultAgentSessionColumnCollapsed?: boolean;
	/**
	 * Whether Untracked sessions also sit next to related Jira cards.
	 *
	 * The View menu can still hide them after mount. The route owns the
	 * starting value so it can land on "attached sessions only" without this
	 * block reading a global store. Switching the default resets the menu
	 * back to that starting point.
	 */
	defaultShowUntracked?: boolean;
	headerAssignees?: readonly JiraKanbanAssigneeData[];
	insightsEnabled?: boolean;
	insightsDefaultAssigneeIds?: readonly string[];
	isInsightsWorkItemInteractive?: (workItem: PulseWorkItem) => boolean;
	isLooseWorkResumable?: (item: PulseLooseWork) => boolean;
	mode?: ExperimentalJiraKanbanMode;
	/** Newly discovered session ids that keep the shared arrival mark visible. */
	newAgentSessionIds?: ReadonlySet<string>;
	onAgentSessionsReviewed?: (sessionIds?: readonly string[]) => void;
	onBoardColumnsChange?: (columns: readonly JiraKanbanColumnData[]) => void;
	onBoardAgentSessionCreate?: (
		session: AgentSessionItem,
		columnTitle: string,
		/**
		 * Slot within the column. Omitted by the create well, which appends;
		 * supplied when the session is dropped in the gap between two cards.
		 */
		insertAtIndex?: number,
	) => string | undefined;
	onCardClick?: (card: JiraKanbanCardData, columnTitle: string) => void;
	onCardAgentActivityViewChat?: JiraKanbanProps["onCardAgentActivityViewChat"];
	onCardAgentDoneRunView?: JiraKanbanProps["onCardAgentDoneRunView"];
	onCardGenerativeActionSubmit?: JiraKanbanProps["onCardGenerativeActionSubmit"];
	onCardAgentSessionLink?: ExperimentalJiraKanbanProps["onCardAgentSessionLink"];
	onCardAgentSessionMove?: ExperimentalJiraKanbanProps["onCardAgentSessionMove"];
	onCardAgentSessionUnlink?: ExperimentalJiraKanbanProps["onCardAgentSessionUnlink"];
	/**
	 * Mint work items at a specific slot in a board column, with the dropped
	 * sessions already linked to them — the board twin of
	 * `onListAgentSessionCreate`. Omit it and the board draws no insertion line,
	 * because the gap affordance would have no capability behind it.
	 *
	 * The whole cohort arrives in one call, in drag order, so the host resolves
	 * the gap once instead of re-resolving it per session and reversing them.
	 */
	onListAgentSessionCreate?: (
		session: AgentSessionItem,
		insertion: JiraListInsertion,
	) => void;
	showAgentSessionUnlinkWell?: ExperimentalJiraKanbanProps["showAgentSessionUnlinkWell"];
	onInsightsWorkItemClick?: (workItem: PulseWorkItem) => void;
	onModeChange?: (mode: ExperimentalJiraKanbanMode) => void;
	onResumeLooseWork?: (item: PulseLooseWork) => void;
	onViewChange?: (view: ExperimentalJiraKanbanView) => void;
	renderListContent?: (
		columns: readonly JiraKanbanColumnData[],
		context: ExperimentalJiraKanbanListRenderContext,
	) => ReactNode;
	renderAgentActivityIndicator?: ExperimentalJiraKanbanProps["renderAgentActivityIndicator"];
	showBoardContent?: boolean;
	showAgentSessionColumn?: boolean;
	/**
	 * Controlled unread watermark, so an owner rendering its own insights
	 * affordance counts the same unread snapshots the toggle's badge does.
	 * Omit to let this page own it; `null` is a real value meaning "nothing
	 * viewed yet", so it cannot be spelled the same way as "uncontrolled".
	 */
	onTimelineLastViewedAtChange?: (lastViewedAt: string) => void;
	ref?: Ref<ExperimentalJiraKanbanPageHandle>;
	timelineLastViewedAt?: string | null;
	viewTabs?: ReactNode;
	/**
	 * Where the overflow ("…") control sits in the board header. The route
	 * owns the choice so it can park it on the far right without this block
	 * reading a global store.
	 */
	moreControlsPlacement?: "inline" | "end";
	/**
	 * Whether the overflow ("…") control mounts. Simple views omits it.
	 */
	showMoreControls?: boolean;
	/**
	 * Simple views reveals Column size, Hide done, and Show fields in View.
	 * Off (default mode) hides those items and locks their defaults.
	 */
	simpleViews?: boolean;
	/**
	 * Outline Customize control before More when both sit at the end.
	 * Display-only unless a later owner supplies a real configure capability.
	 */
	showCustomizeControl?: boolean;
}
