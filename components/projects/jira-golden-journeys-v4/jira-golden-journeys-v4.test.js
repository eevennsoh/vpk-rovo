const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const PAGE_SOURCE = readProjectFile("components/projects/jira-golden-journeys-v4/page.tsx");
const LIST_HOOK_SOURCE = readProjectFile(
	"components/projects/jira-golden-journeys-v4/hooks/use-jira-golden-journeys-v4-list.ts",
);
const JIRA_HEADER_SOURCE = readProjectFile("components/projects/jira/components/jira-header.tsx");
const JIRA_TABS_SOURCE = readProjectFile("components/projects/jira/data/tabs.ts");
const USE_JIRA_TABS_SOURCE = readProjectFile("components/projects/jira/hooks/use-jira-tabs.ts");
const EXPERIMENTAL_HEADER_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/experimental-board-header.tsx",
);
const EXPERIMENTAL_PAGE_SOURCE = [
	readProjectFile("components/blocks/jira-kanban/experimental/page.tsx"),
	readProjectFile("components/blocks/jira-kanban/experimental/experimental-page-types.ts"),
].join("\n");
const EXPERIMENTAL_BOARD_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/experimental-jira-kanban.tsx",
);
const EXPERIMENTAL_CARD_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/experimental-jira-kanban-card.tsx",
);
const CREATE_WORK_ITEM_DROP_ZONE_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/components/create-work-item-drop-zone.tsx",
);
const CREATE_WORK_ITEM_EXCLUSIVE_PROXIMITY_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/lib/create-work-item-exclusive-proximity.ts",
);
const CREATE_WORK_ITEM_EXCLUSIVE_PROXIMITY_CONTEXT_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/components/create-work-item-exclusive-proximity-context.tsx",
);
const PANEL_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/components/agent-session-panel.tsx",
);
const PANEL_RESIZE_HOOK_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/hooks/use-agent-session-panel-resize.ts",
);
const INDICATORS_SOURCE = readProjectFile(
	"components/projects/jira-golden-journeys-v4/data/agent-activity-indicators.tsx",
);
const COMPLETED_RUNS_SOURCE = readProjectFile(
	"components/blocks/jira-issue/completed-agent-runs.tsx",
);
const AGENT_ACTIVITY_SOURCE = readProjectFile(
	"components/blocks/jira-issue/agent-activity.tsx",
);
const TRANSFER_SOURCE = readProjectFile(
	"components/blocks/jira-issue/agent-session-transfer.tsx",
);
const FAB_GEOMETRY_SOURCE = readProjectFile(
	"components/projects/shared/components/floating-rovo-button/geometry.ts",
);

test("the route renders the Payments board directly inside Jira app chrome", () => {
	assert.match(PAGE_SOURCE, /import AppLayout from "@\/components\/projects\/page"/u);
	assert.match(PAGE_SOURCE, /<AppLayout[\s\S]*defaultSidebarOpen=\{false\}[\s\S]*product="jira"/u);
	assert.match(PAGE_SOURCE, /<ExperimentalJiraKanbanPage/u);
	assert.match(PAGE_SOURCE, /createJiraGoldenJourneysV4PayBoardColumns/u);
	assert.match(PAGE_SOURCE, /JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS/u);
	assert.match(PAGE_SOURCE, /JIRA_GOLDEN_JOURNEYS_V4_PAY_HEADER_ASSIGNEES/u);
	assert.match(PAGE_SOURCE, /overflow-hidden bg-surface \[&>div\]:min-h-0/u);
});

test("the route no longer renders gallery or presentation phases", () => {
	assert.doesNotMatch(PAGE_SOURCE, /Gallery|GalleryItem/u);
	assert.doesNotMatch(PAGE_SOURCE, /StoryControls|PresentationChapter/u);
	assert.doesNotMatch(PAGE_SOURCE, /TrackLearnStage|BuildStage|TerminalStory/u);
	assert.doesNotMatch(PAGE_SOURCE, /onCardClick=|onInsightsWorkItemClick=/u);
});

test("the board disables Insights while keeping card agent chat in the Jira shell", () => {
	assert.match(PAGE_SOURCE, /insightsEnabled=\{false\}/u);
	assert.doesNotMatch(PAGE_SOURCE, /PULSE_|InsightsNudge|boardRef|timelineLastViewedAt/u);
	assert.match(PAGE_SOURCE, /onCardAgentActivityViewChat=\{handleViewChat\}/u);
	assert.match(PAGE_SOURCE, /onCardAgentDoneRunView=\{handleViewCompletedRun\}/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/onCardAgentDoneRunView\?: JiraKanbanProps\["onCardAgentDoneRunView"\];/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<ExperimentalJiraKanban[\s\S]*onCardAgentDoneRunView=\{onCardAgentDoneRunView\}/u,
	);
	assert.match(PAGE_SOURCE, /openAgentChat\(\{[\s\S]*agentId: activity\.id,[\s\S]*issueKey: card\.code/u);
	assert.match(PAGE_SOURCE, /const handleViewCompletedRun = useCallback\([\s\S]*agentId: run\.agentName\.toLowerCase\(\)\.replace\(\/\\s\+\/g, "-"\),[\s\S]*issueKey: run\.issueKey/u);
	assert.match(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*externalThinkingMessageId=\{externalThinkingMessageId\}/u);
	assert.doesNotMatch(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*insights=/u);
});

test("the route imports the Pulse session guard used by its resume callback", () => {
	assert.match(
		PAGE_SOURCE,
		/import \{ isPulseAgentSession, type PulseLooseWork \} from "@\/components\/blocks\/jira-kanban\/experimental\/pulse\/types";/u,
	);
	assert.match(PAGE_SOURCE, /if \(!isPulseAgentSession\(item\)\) return;/u);
});

test("chin-row layout follows the design variation", () => {
	// Team EU groups every active agent into one merged chin. 2000 years later
	// keeps a row per agent. The route owns the choice; the shared board stays
	// variation-agnostic, matching Panel and untracked proximity.
	assert.match(
		PAGE_SOURCE,
		/const agentActivityLayout = designVariation === "team-eu" \? "merged" : "split";/u,
	);
	assert.match(PAGE_SOURCE, /<ExperimentalJiraKanbanPage[\s\S]*agentActivityLayout=\{agentActivityLayout\}/u);
	assert.doesNotMatch(
		PAGE_SOURCE,
		/agentActivityLayout="split"/u,
		"Team EU must not hardcode split; that stacked every agent as its own chin row",
	);
	assert.doesNotMatch(
		EXPERIMENTAL_PAGE_SOURCE,
		/useDesignVariation|design-variation/u,
		"the shared block must take an agentActivityLayout prop, not read the global variation store",
	);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /agentActivityLayout\?: JiraIssueAgentActivityLayout;/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<ExperimentalJiraKanban[\s\S]*agentActivityLayout=\{agentActivityLayout\}/u,
	);
	// Grouped chins must not steal hover for a single-session flyout. Dropping
	// sessionFlyout on multi-agent rows is what lets AgentAssignment open.
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const isSingleAgentRow = rowGroup\.activities\.length === 1;/u,
	);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const rowSessionFlyout = isSingleAgentRow \? sessionFlyout : undefined;/u,
	);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const rowSessionDrag = isSingleAgentRow \? sessionDrag : undefined;/u,
	);
	assert.match(AGENT_ACTIVITY_SOURCE, /sessionDrag=\{rowSessionDrag\}/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /const assignedRowHandle = isSingleAgent \|\| sessionFlyout \? rowHandle : \(/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /openMode="hover"/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /rowSessionFlyout \? \(\s*<JiraSessionFlyoutTrigger/u);
});

test("chin-row agent activity indicators follow the design variation", () => {
	// Team EU is the baseline, so working rows keep the block's own spinner.
	// Awaiting-input departs from it: a question circle reads as "blocked on
	// you", which the pixel loader's solo dot did not. The filled glyph lives in
	// icon-lab (>= 7.8.0), not @atlaskit/icon, and carries the information color.
	assert.match(
		INDICATORS_SOURCE,
		/import QuestionCircleFilledIcon from "@atlaskit\/icon-lab\/core\/question-circle-filled";/u,
	);
	assert.doesNotThrow(
		() => require.resolve("@atlaskit/icon-lab/core/question-circle-filled"),
		"icon-lab must export question-circle-filled (7.8.0+); a stale 7.5.0 install breaks the Team EU chin",
	);
	assert.match(INDICATORS_SOURCE, /import \{ Spinner \} from "@\/components\/ui\/spinner";/u);
	assert.match(
		INDICATORS_SOURCE,
		/renderTeamEuAgentActivityIndicator[\s\S]*state === "awaiting-input" \? \(\s*<QuestionCircleFilledIcon color=\{token\("color\.icon\.information"\)\} label="" size="small" \/>\s*\) : \(\s*<Spinner label="" size="xs" variant="experimental" \/>\s*\)/u,
	);
	// A finished run gets the filled success status in the ADS success green,
	// pairing with the filled error status a failed run already shows. The
	// block's own fallback dot only said the row had ended.
	assert.match(INDICATORS_SOURCE, /import StatusSuccessIcon from "@atlaskit\/icon\/core\/status-success";/u);
	assert.match(
		INDICATORS_SOURCE,
		/renderTeamEuAgentActivityIndicator[\s\S]*if \(state === "finished"\) \{\s*return <StatusSuccessIcon color=\{token\("color\.icon\.success"\)\} label="" size="small" \/>;\s*\}/u,
	);
	// Only the exploration keeps the pixel aesthetic — and only for the live
	// states. A finished run has nothing left to animate, so it restates the
	// block's own neutral dot rather than borrowing a loader glyph.
	assert.match(INDICATORS_SOURCE, /import \{ PixelLoader \} from "@\/components\/ui-custom\/pixel-loader";/u);
	assert.match(
		INDICATORS_SOURCE,
		/render2000YearsLaterAgentActivityIndicator[\s\S]*pattern=\{state === "awaiting-input" \? "solo" : "diagonal-top-left"\}[\s\S]*shape="dot"/u,
	);
	assert.match(
		INDICATORS_SOURCE,
		/render2000YearsLaterAgentActivityIndicator[\s\S]*if \(state === "finished"\) \{\s*return <StrokeWeightExtraLargeIcon color="currentColor" label="" size="small" \/>;\s*\}/u,
	);
	assert.match(
		INDICATORS_SOURCE,
		/Record<DesignVariationId, JiraIssueAgentActivityIndicatorRenderer>\s*> = \{\s*"team-eu": renderTeamEuAgentActivityIndicator,\s*"2000-years-later": render2000YearsLaterAgentActivityIndicator,\s*\};/u,
	);
	assert.match(
		INDICATORS_SOURCE,
		/export function getJiraGoldenJourneysV4AgentActivityIndicator\(\s*variation: DesignVariationId,\s*\): JiraIssueAgentActivityIndicatorRenderer/u,
	);
	// The route reads the variation; the shared block still takes a plain prop.
	assert.doesNotMatch(PAGE_SOURCE, /PixelLoader/u);
	assert.match(PAGE_SOURCE, /import \{ useDesignVariation \} from "@\/components\/hooks\/use-design-variation";/u);
	assert.match(
		PAGE_SOURCE,
		/import \{ getJiraGoldenJourneysV4AgentActivityIndicator \} from "\.\/data\/agent-activity-indicators";/u,
	);
	assert.match(PAGE_SOURCE, /const \{ designVariation \} = useDesignVariation\(\);/u);
	assert.match(
		PAGE_SOURCE,
		/const renderAgentActivityIndicator = getJiraGoldenJourneysV4AgentActivityIndicator\(designVariation\);/u,
	);
	assert.match(PAGE_SOURCE, /<ExperimentalJiraKanbanPage[\s\S]*renderAgentActivityIndicator=\{renderAgentActivityIndicator\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /renderAgentActivityIndicator\?: ExperimentalJiraKanbanProps\["renderAgentActivityIndicator"\];/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /<ExperimentalJiraKanban[\s\S]*renderAgentActivityIndicator=\{renderAgentActivityIndicator\}/u);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /<ExperimentalJiraKanbanCard[\s\S]*renderAgentActivityIndicator=\{renderAgentActivityIndicator\}/u);
	assert.match(EXPERIMENTAL_CARD_SOURCE, /<JiraIssue[\s\S]*renderAgentActivityIndicator=\{renderAgentActivityIndicator\}/u);
	// Team EU's Done-column chin is the merged "N Finished" row, not a split
	// per-run row. That path must call the same finished renderer in the
	// trailing status slot so PAY-101's check sits on the far right, matching
	// working/awaiting-input.
	assert.match(
		COMPLETED_RUNS_SOURCE,
		/const finishedIndicator = !hasFailedRun && renderAgentActivityIndicator\s*\n\s*\? renderAgentActivityIndicator\("finished"\)\s*\n\s*: null;/u,
	);
	assert.match(
		COMPLETED_RUNS_SOURCE,
		/hasFailedRun \? \([\s\S]*<StatusErrorIcon[\s\S]*: finishedIndicator \? \(\s*<span[\s\S]*\{finishedIndicator\}/u,
	);
});

test("Team EU keeps only attached agent sessions on status columns", () => {
	// Team EU is "what ships today": Pulse proximity rows leave the status
	// columns so only chin rows attached to a work item remain. Untracked work
	// still lives in its dedicated column/panel. 2000 years later keeps the
	// proximity rows. The route owns the default; the shared block stays
	// variation-agnostic, matching Panel.
	assert.match(PAGE_SOURCE, /const showUntrackedProximity = designVariation !== "team-eu";/u);
	assert.match(PAGE_SOURCE, /<ExperimentalJiraKanbanPage[\s\S]*defaultShowUntracked=\{showUntrackedProximity\}/u);
	assert.doesNotMatch(
		EXPERIMENTAL_PAGE_SOURCE,
		/useDesignVariation|design-variation/u,
		"the shared block must take a defaultShowUntracked prop, not read the global variation store",
	);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /defaultShowUntracked\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /defaultShowUntracked = true,/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /const \[showUntracked, setShowUntracked\] = useState\(defaultShowUntracked\)/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/if \(defaultShowUntracked !== appliedShowUntrackedDefault\) \{\s*setAppliedShowUntrackedDefault\(defaultShowUntracked\);\s*setShowUntracked\(defaultShowUntracked\);\s*\}/u,
	);
});

test("both design variations reveal compact magnetic create targets that expand and arm during an agent-session drag", () => {
	assert.match(
		PAGE_SOURCE,
		/const createWorkItemDropZoneLabel = "Create new work item";/u,
	);
	assert.doesNotMatch(PAGE_SOURCE, /createWorkItemDropZoneLabel = designVariation/u);
	assert.match(
		PAGE_SOURCE,
		/<ExperimentalJiraKanbanPage[\s\S]*createWorkItemDropZoneLabel=\{createWorkItemDropZoneLabel\}/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/createWorkItemDropZoneLabel\?: ExperimentalJiraKanbanProps\["createWorkItemDropZoneLabel"\];/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<ExperimentalJiraKanban[\s\S]*createWorkItemDropZoneLabel=\{createWorkItemDropZoneLabel\}/u,
	);
	assert.doesNotMatch(
		EXPERIMENTAL_BOARD_SOURCE,
		/useDesignVariation|design-variation/u,
		"the shared board must receive variation-owned copy through a prop",
	);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/sessionDragTransaction=\{boardSessionDrag\.transaction\}/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/sessionDragTransaction && dropZoneLabel \? \(/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/const expanded = proximity !== "outside";/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/expanded \? "h-16 text-sm leading-5" : "h-6 text-xs leading-4"/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/armed \? "border-border-selected bg-bg-selected text-text-selected" : "border-border bg-surface text-text-subtlest"/u,
	);
	assert.doesNotMatch(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/bg-\[var\(--ds-|transparent|bg-transparent/u,
		"create wells must use an opaque semantic surface fill, not a raw token or transparent hole",
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/transition-\[height,background-color\] duration-normal ease-out-practical motion-reduce:transition-none/u,
	);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/<BoardColumnCreateAction[\s\S]*dropZoneLabel=\{createWorkItemDropZoneLabel\}[\s\S]*sessionDragTransaction=\{sessionDragTransaction\}[\s\S]*title=\{title\}/u,
	);
	assert.match(
		CREATE_WORK_ITEM_EXCLUSIVE_PROXIMITY_SOURCE,
		/export const CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX = 120;/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/import \{ useMagneticProximity \} from "@\/components\/ui-custom\/hooks\/use-magnetic-proximity";/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/import \{ useExclusiveCreateWellProximity \} from "\.\/create-work-item-exclusive-proximity-context";/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/const magnet = useMagneticProximity\(targetRef, \{\s*hoverArea: CREATE_WORK_ITEM_PROXIMITY_HOVER_AREA_PX,\s*\}\);/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/useMotionValueEvent\(magnet\.proximity, "change", setRawProximity\);/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/const isExclusiveWinner = useExclusiveCreateWellProximity\(title, targetRef\);/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/const proximity = isExclusiveWinner \? rawProximity : "outside";/u,
	);
	assert.match(
		CREATE_WORK_ITEM_EXCLUSIVE_PROXIMITY_SOURCE,
		/export function resolveExclusiveProximityWinner\(/u,
	);
	assert.match(
		CREATE_WORK_ITEM_EXCLUSIVE_PROXIMITY_CONTEXT_SOURCE,
		/resolveExclusiveProximityWinner\(/u,
	);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/<ExclusiveCreateWellProximityProvider>[\s\S]*\{boardColumns\.map\(/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/const armed = Boolean\([\s\S]*sessionDragTransaction\?\.target\?\.kind === "create"[\s\S]*sessionDragTransaction\.target\.columnTitle === title,/u,
	);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/<motion\.div[\s\S]*x: isExclusiveWinner \? magnet\.x : 0,[\s\S]*ref=\{targetRef\}[\s\S]*<motion\.span[\s\S]*x: isExclusiveWinner \? magnet\.labelX : 0,/u,
	);
	assert.match(CREATE_WORK_ITEM_DROP_ZONE_SOURCE, /data-board-agent-session-drop-zone="create"/u);
	assert.match(
		CREATE_WORK_ITEM_DROP_ZONE_SOURCE,
		/data-board-agent-session-column-title=\{title\}/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/useBoardAgentSessionDrag\(\{[\s\S]*onCreate: agentSessionHandlers\.onCreateWorkItem,/u,
	);
});

test("the board enables board-wide Jira issue agent-session transfer", () => {
	assert.match(PAGE_SOURCE, /import \{ linkJiraKanbanAgentSession, moveJiraKanbanAgentSession, unlinkJiraKanbanAgentSession \} from "@\/components\/blocks\/jira-kanban\/state"/u);
	assert.match(PAGE_SOURCE, /setBoardColumns\(\(columns\) => unlinkJiraKanbanAgentSession\(columns, card\.code, session\.id\)\)/u);
	assert.match(PAGE_SOURCE, /setBoardColumns\(\(columns\) => linkJiraKanbanAgentSession\(columns, card\.code, activity\)\)/u);
	assert.match(
		PAGE_SOURCE,
		/setBoardColumns\(\(columns\) => moveJiraKanbanAgentSession\(\s*columns,\s*sourceCard\.code,\s*targetCard\.code,\s*session\.id,?\s*\)\)/u,
	);
	assert.match(PAGE_SOURCE, /onCardAgentSessionLink=\{handleAgentSessionLink\}/u);
	assert.match(PAGE_SOURCE, /onCardAgentSessionMove=\{handleAgentSessionMove\}/u);
	assert.match(PAGE_SOURCE, /onCardAgentSessionUnlink=\{handleAgentSessionUnlink\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /onCardAgentSessionMove\?: ExperimentalJiraKanbanProps\["onCardAgentSessionMove"\];/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/const handleCardAgentSessionMove: ExperimentalJiraKanbanProps\["onCardAgentSessionMove"\][\s\S]*onCardAgentSessionMove\?\.\(\s*session,\s*sourceCard,\s*targetCard,\s*sourceColumnTitle,\s*targetColumnTitle,?\s*\);/u,
	);
	const moveHandlerStart = EXPERIMENTAL_PAGE_SOURCE.indexOf("const handleCardAgentSessionMove:");
	const unlinkHandlerStart = EXPERIMENTAL_PAGE_SOURCE.indexOf("const handleCardAgentSessionUnlink:");
	assert.ok(moveHandlerStart > 0 && unlinkHandlerStart > moveHandlerStart);
	assert.doesNotMatch(
		EXPERIMENTAL_PAGE_SOURCE.slice(moveHandlerStart, unlinkHandlerStart),
		/setCapturedLooseWorkIds/u,
		"moving an already-linked session must not change its captured status",
	);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /onCardAgentSessionUnlink\?: ExperimentalJiraKanbanProps\["onCardAgentSessionUnlink"\];/u);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/const canTransferAgentSession = canUnlinkAgentSession \|\| canLinkAgentSession \|\| isBoardDropTarget;/u,
	);
	assert.match(EXPERIMENTAL_CARD_SOURCE, /sessionTransferAfter=\{\(localSessionDrag\) =>/u);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/sessionDrag=\{canLinkAgentSession[\s\S]*\? detachedSessionDrag \?\? localSessionDrag[\s\S]*: undefined\}/u,
	);
});

test("Team EU returns unlinked sessions to Untracked without parking them on status columns", () => {
	// Both variations pass the same transfer handlers so Untracked sessions
	// can attach to issues and chins can drag. Team EU hides the dashed
	// unlink well, and still turns proximity off: unlinked copies go into
	// detachedByCard, which the Untracked list reads.
	assert.doesNotMatch(PAGE_SOURCE, /allowAgentSessionUnlink/u);
	assert.match(PAGE_SOURCE, /onCardAgentSessionUnlink=\{handleAgentSessionUnlink\}/u);
	assert.match(PAGE_SOURCE, /showAgentSessionUnlinkWell=\{designVariation !== "team-eu"\}/u);
	assert.match(PAGE_SOURCE, /const showUntrackedProximity = designVariation !== "team-eu";/u);
	assert.match(PAGE_SOURCE, /const handleAgentSessionUnlink = useCallback/u);
	assert.doesNotMatch(
		EXPERIMENTAL_PAGE_SOURCE,
		/useDesignVariation|design-variation/u,
		"the shared block must take unlink as an optional handler, not read the global variation store",
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/showAgentSessionUnlinkWell\?: ExperimentalJiraKanbanProps\["showAgentSessionUnlinkWell"\];/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/showAgentSessionUnlinkWell=\{showAgentSessionUnlinkWell\}/u,
	);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/const canUnlinkAgentSession = Boolean\(onSessionUnlink && firstActiveAgentSession\);/u,
	);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/onUnlink: canUnlinkAgentSession[\s\S]*\? \(session\) => \{[\s\S]*onSessionUnlink\?\.\(resolvedSession, card, columnTitle\);[\s\S]*showUnlinkWell,/u,
	);
	assert.match(EXPERIMENTAL_CARD_SOURCE, /showUnlinkWell = true,/u);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const showUnlinkControl = Boolean\(sessionDrag\?\.onUnlink\) && !isDraggedOut;/u,
	);
	assert.match(
		TRANSFER_SOURCE,
		/const showUnlinkWell = !isLinking\s*&& Boolean\(config\.onUnlink\)\s*&& config\.showUnlinkWell !== false;/u,
	);
	assert.match(TRANSFER_SOURCE, /config\.unlinkLabel \?\? "Drag here to unlink"/u);
});

test("unlinked agent sessions remain detached beneath their source Jira card", () => {
	assert.match(PAGE_SOURCE, /const \[detachedAgentSessionsByCard, setDetachedAgentSessionsByCard\] = useState/u);
	assert.match(PAGE_SOURCE, /toJiraGoldenJourneysV4DetachedAgentSession\(activity, card\)/u);
	assert.match(PAGE_SOURCE, /setDetachedAgentSessionsByCard\(\(current\) =>/u);
	assert.match(PAGE_SOURCE, /detachedAgentSessionsByCard=\{detachedAgentSessionsByCard\}/u);
	assert.match(
		PAGE_SOURCE,
		/const activity = detachedActivitiesByIdRef\.current\[session\.id\]\s*\?\? toJiraIssueDemoAttachedActivity\(session\);/u,
		"re-attaching a complete detached fixture must normalize it to an active chin row",
	);
	assert.match(EXPERIMENTAL_CARD_SOURCE, /<AgentSession[\s\S]*variant="medium-detached"/u);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/<AgentSession[\s\S]*style=\{\{ marginTop: token\("space\.025"\) \}\}/u,
	);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/className="has-\[\[data-session-dragging\]\]:relative has-\[\[data-session-dragging\]\]:z-30"/u,
		"the detached-session Motion stacking context must rise above the Jira issue shell while dragging",
	);
	assert.match(
		EXPERIMENTAL_CARD_SOURCE,
		/resolveRelatedJiraIssueAgentActivityMode\(\s*\n\s*card\.agentActivityMode,\s*\n\s*detachedAgentSessions\.length > 0,/u,
	);
});

test("attaching a session removes every detached copy before linking it", () => {
	assert.match(
		PAGE_SOURCE,
		/Object\.entries\(current\)[\s\S]*sessions\.filter\(\(candidate\) => candidate\.id !== session\.id\)/u,
	);
	assert.match(
		PAGE_SOURCE,
		/if \(nextSessions\.length > 0\) \{[\s\S]*next\[cardCode\] = nextSessions;[\s\S]*\}/u,
	);
});

test("Jira session flyouts are suspended for both session and whole-card drags", () => {
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/import \{ JiraSessionFlyoutSuspensionProvider \} from "@\/components\/blocks\/product-sidebar\/variants\/jira-session-flyout";/u,
	);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/const sessionFlyoutsSuspended = boardSessionDrag\.transaction !== null \|\| draggedCardCode !== null;/u,
	);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /sessionFlyoutsSuspended=\{sessionFlyoutsSuspended\}/u);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/<JiraSessionFlyoutSuspensionProvider suspended>\s*<section[\s\S]*<ExperimentalJiraKanbanCard/u,
	);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /<\/JiraSessionFlyoutSuspensionProvider>/u);
});

test("the board puts agent and skill assignment in each card's More actions menu", () => {
	assert.match(PAGE_SOURCE, /<ExperimentalJiraKanbanPage[\s\S]*cardGenerativeActionPresentation="more-actions"/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /cardGenerativeActionPresentation\?: JiraIssueGenerativeActionPresentation;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /<ExperimentalJiraKanban[\s\S]*cardGenerativeActionPresentation=\{cardGenerativeActionPresentation\}/u);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /cardGenerativeActionPresentation = "sparkle",/u);
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /<ExperimentalJiraKanbanCard[\s\S]*generativeActionPresentation=\{cardGenerativeActionPresentation\}/u);
	assert.match(EXPERIMENTAL_CARD_SOURCE, /<JiraIssue[\s\S]*generativeActionPresentation=\{generativeActionPresentation\}/u);
});

test("the Jira tab bar splits or collapses work items per design variation", () => {
	assert.match(JIRA_HEADER_SOURCE, /export function JiraViewTabs/u);
	assert.match(JIRA_HEADER_SOURCE, /className=\{isFirst \? "ml-4 flex-none" : "flex-none"\}/u);
	assert.match(JIRA_HEADER_SOURCE, /<IconComponent[\s\S]*label=""/u);
	assert.match(JIRA_HEADER_SOURCE, /const tabs = useJiraTabs\(supportedWorkItemViews\)/u);
	assert.match(JIRA_HEADER_SOURCE, /const activeTab = resolveJiraTab\(tabs, selectedTabLabel, workItemView\)/u);
	assert.match(JIRA_HEADER_SOURCE, /<JiraViewTabs\s+selectedTabLabel=\{selectedTabLabel\}/u);
	// Team EU without Simple views restores Board and List as sibling
	// destinations; Simple views (default on) and 2000 years later keep the
	// single Work items tab and let the board header switch views.
	assert.match(JIRA_TABS_SOURCE, /import WorkItemIcon from "@atlaskit\/icon\/core\/work-item"/u);
	assert.match(JIRA_TABS_SOURCE, /"team-eu": \[[\s\S]*\{ label: "Board", icon: BoardIcon, hasContent: true, view: "board" \}[\s\S]*\{ label: "List", icon: TableIcon, hasContent: true, view: "list" \}/u);
	assert.match(JIRA_TABS_SOURCE, /"2000-years-later": \[[\s\S]*\{ label: "Work items", icon: WorkItemIcon, hasContent: true \}/u);
	assert.match(JIRA_TABS_SOURCE, /export function getJiraTabs\(/u);
	assert.match(JIRA_TABS_SOURCE, /simpleViews = false/u);
	assert.match(
		JIRA_TABS_SOURCE,
		/if \(simpleViews\) \{\s*return JIRA_TABS_BY_DESIGN_VARIATION\["2000-years-later"\];/u,
	);
	assert.match(USE_JIRA_TABS_SOURCE, /designVariants\["simple-views"\]/u);
	assert.match(
		USE_JIRA_TABS_SOURCE,
		/getJiraTabs\(designVariation, designVariants\["simple-views"\]\)/u,
	);
	assert.doesNotMatch(
		JIRA_TABS_SOURCE,
		/"2000-years-later": \[[\s\S]*label: "(?:Board|List)"/u,
	);
	assert.match(PAGE_SOURCE, /import \{ JiraViewTabs \} from "@\/components\/projects\/jira\/components\/jira-header"/u);
	assert.match(
		PAGE_SOURCE,
		/viewTabs=\{\(\s*<JiraViewTabs\s+selectedTabLabel=\{selectedTabLabel\}\s+onTabChange=\{handleTabChange\}\s+workItemView=\{workItemView\}\s*\/>\s*\)\}/u,
	);
	assert.match(PAGE_SOURCE, /const showBoardContent = activeTab\?\.hasContent === true;/u);
	assert.match(PAGE_SOURCE, /showBoardContent=\{showBoardContent\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showBoardContent\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showBoardControls=\{showBoardContent\}/u);
});

test("the Work items header switches between Board and List views with their icons", () => {
	assert.match(PAGE_SOURCE, /const \[workItemView, setWorkItemView\] = useState<JiraWorkItemView>\(DEFAULT_JIRA_WORK_ITEM_VIEW\)/u);
	assert.match(PAGE_SOURCE, /const activeView = activeTab\?\.view \?\? workItemView;/u);
	assert.match(PAGE_SOURCE, /activeView=\{activeView\}/u);
	assert.match(PAGE_SOURCE, /const tabOwnsView = activeTab\?\.view !== undefined;/u);
	assert.match(PAGE_SOURCE, /onViewChange=\{tabOwnsView \? undefined : setWorkItemView\}/u);
	assert.match(
		PAGE_SOURCE,
		/renderListContent=\{\(\s*columns,\s*\{\s*agentSessionDropIntent,\s*inFlowAgentSessionColumn,\s*onTrailingContentUnderlapChange,\s*scrollEndInset,\s*trailingOverlayRef,\s*\},\s*\) =>/u,
	);
	assert.match(PAGE_SOURCE, /useJiraGoldenJourneysV4List/u);
	assert.match(PAGE_SOURCE, /<JiraList\s+\{\.\.\.listProps\}/u);
	assert.match(PAGE_SOURCE, /agentSessionDropIntent=\{agentSessionDropIntent\}/u);
	assert.match(
		PAGE_SOURCE,
		/onTrailingContentUnderlapChange=\{onTrailingContentUnderlapChange\}/u,
	);
	assert.match(PAGE_SOURCE, /const JIRA_LIST_PANEL_END_GAP_PX = 24;/u);
	assert.match(
		PAGE_SOURCE,
		/const listScrollEndInset = scrollEndInset > 0\s*\?\s*scrollEndInset \+ JIRA_LIST_PANEL_END_GAP_PX\s*:\s*0;/u,
	);
	assert.match(PAGE_SOURCE, /scrollEndInset=\{listScrollEndInset\}/u);
	assert.match(PAGE_SOURCE, /trailingOverlayRef=\{trailingOverlayRef\}/u);
	assert.match(PAGE_SOURCE, /onListAgentSessionCreate=\{handleListAgentSessionCreate\}/u);
	assert.match(PAGE_SOURCE, /createFromAgentSession/u);
	assert.match(PAGE_SOURCE, /consumeDetachedAgentSession/u);
	assert.match(LIST_HOOK_SOURCE, /createFromAgentSession/u);
	assert.match(LIST_HOOK_SOURCE, /createListWorkItemFromSession/u);
	const createFromSessionStart = LIST_HOOK_SOURCE.indexOf("const createFromAgentSession = useCallback");
	const createFromSessionEnd = LIST_HOOK_SOURCE.indexOf("}, [setBoardColumns]);", createFromSessionStart);
	assert.ok(createFromSessionStart > 0 && createFromSessionEnd > createFromSessionStart);
	assert.match(LIST_HOOK_SOURCE, /boardColumnsRef\.current = result\.columns/u);
	assert.match(LIST_HOOK_SOURCE, /listOrderRef\.current = result\.listOrder/u);
	assert.doesNotMatch(
		LIST_HOOK_SOURCE.slice(createFromSessionStart, createFromSessionEnd),
		/setDraftWorkItem|draftWorkItem/u,
	);
	assert.match(
		PAGE_SOURCE,
		/"min-h-0 flex-1 overflow-hidden pb-4 md:pb-5"[\s\S]*inFlowAgentSessionColumn \? "ps-2" : "ps-4 md:ps-5"[\s\S]*scrollEndInset > 0 \? "pe-0" : "pe-4 md:pe-5"[\s\S]*<JiraList\s+\{\.\.\.listProps\}/u,
	);
	assert.doesNotMatch(
		PAGE_SOURCE,
		/overflow-auto p-4 md:p-5"[\s\S]*<JiraList\s+\{\.\.\.listProps\}/u,
	);
	// Drag handles only portal when onMoveRow is set. A display-only JiraList
	// (rows + counts, no capability callbacks) is what hid rearrange on hover.
	assert.match(LIST_HOOK_SOURCE, /onMoveRow: handleMoveRow/u);
	assert.match(LIST_HOOK_SOURCE, /onSelectRow: handleSelectRow/u);
	assert.match(LIST_HOOK_SOURCE, /onCreate: handleCreateWorkItem/u);
	assert.match(LIST_HOOK_SOURCE, /onStatusChange: handleStatusChange/u);
	assert.match(LIST_HOOK_SOURCE, /onAssignedAgentIdsChange: handleAssignedAgentIdsChange/u);
	assert.match(LIST_HOOK_SOURCE, /issueType: draftWorkItem.issueType/u);
	assert.match(LIST_HOOK_SOURCE, /dueDate: draftWorkItem.dueDate/u);
	assert.match(LIST_HOOK_SOURCE, /currentOrder.length === 0 \? allKeys : currentOrder/u);
	assert.match(LIST_HOOK_SOURCE, /agentCatalog: JIRA_GOLDEN_JOURNEYS_V4_PAY_BOARD_AGENTS/u);
	assert.match(LIST_HOOK_SOURCE, /statusOptions: JIRA_GOLDEN_JOURNEYS_V4_LIST_STATUS_OPTIONS/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /activeView\?: ExperimentalJiraKanbanView;/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/renderListContent\?: \(\s*columns: readonly JiraKanbanColumnData\[\],\s*context: ExperimentalJiraKanbanListRenderContext,\s*\) => ReactNode;/u,
	);
	assert.match(PAGE_SOURCE, /inFlowAgentSessionColumn \? "ps-2" : "ps-4 md:ps-5"/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /inFlowAgentSessionColumn: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /inFlowAgentSessionColumn: showInFlowAgentSessionColumn,/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /agentSessionDropIntent: boardSessionDrag\.listDropIntent/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /onCreate: agentSessionHandlers.onCreateWorkItem/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /onListCreate: onListAgentSessionCreate \? handleListAgentSessionCreate : undefined/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /activeView === "list" && renderListContent/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /<BoardFilterPopover[\s\S]*surfaceLabel=\{activeView\}/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /import \{ Tabs, TabsList, TabsTrigger \} from "@\/components\/ui\/tabs"/u);
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /ToggleGroup/u);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/<TabsList aria-label="Work items view">[\s\S]*<TabsTrigger value="board">[\s\S]*<BoardIcon[\s\S]*Board[\s\S]*<TabsTrigger value="list">[\s\S]*<TableIcon[\s\S]*List/u,
	);
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /<TabsList[^>]*className=|<TabsTrigger[^>]*className=/u);
	assert.match(PAGE_SOURCE, /moreControlsPlacement=\{designVariation === "team-eu" \? "end" : "inline"\}/u);
	assert.match(PAGE_SOURCE, /showMoreControls=\{!designVariants\["simple-views"\]\}/u);
	assert.match(PAGE_SOURCE, /simpleViews=\{designVariants\["simple-views"\]\}/u);
	assert.match(
		PAGE_SOURCE,
		/showCustomizeControl=\{designVariation === "team-eu" && !designVariants\["simple-views"\]\}/u,
	);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /moreControlsPlacement\?: "inline" \| "end";/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showMoreControls\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /simpleViews\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showCustomizeControl\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /moreControlsPlacement=\{moreControlsPlacement\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showMoreControls=\{showMoreControls\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /simpleViews=\{simpleViews\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showCustomizeControl=\{showCustomizeControl\}/u);
	assert.doesNotMatch(
		EXPERIMENTAL_PAGE_SOURCE,
		/useDesignVariation|design-variation/u,
		"the shared block must take moreControlsPlacement, not read the global variation store",
	);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/moreControlsPlacement === "inline" \? moreControls : null/u,
	);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/moreControlsPlacement === "end" \? moreControls : null/u,
	);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /aria-label="Customize"/u);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/showCustomizeControl \? \(\s*<Button aria-disabled aria-label="Customize" size="icon" variant="outline">/u,
	);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /className="text-xs text-text-subtlest">Spaces</u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /<Heading as="h1" className="min-w-0 truncate" size="medium">\{title\}<\/Heading>/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /aria-label="Share"/u);
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /aria-label="Expand"/u);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/className=\{cn\("flex items-center gap-2", compact \? undefined : "ml-auto"\)\}/u,
	);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/showMoreControls \? \(\s*<Button aria-disabled aria-label=\{`More \$\{surfaceLabel\} controls`\}/u,
	);
	const inlineMoreIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf(
		'{moreControlsPlacement === "inline" ? moreControls : null}',
	);
	const viewSwitcherIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf('aria-label="Work items view"');
	const endMoreIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf(
		'{moreControlsPlacement === "end" ? moreControls : null}',
	);
	const customizeIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf("{customizeControl}");
	assert.ok(inlineMoreIndex > 0 && inlineMoreIndex < viewSwitcherIndex);
	assert.ok(viewSwitcherIndex > 0 && viewSwitcherIndex < customizeIndex);
	assert.ok(customizeIndex > 0 && customizeIndex < endMoreIndex);
	const endSlotIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf("{endSlot ? endSlot : null}");
	assert.ok(endSlotIndex > 0 && viewSwitcherIndex < endSlotIndex && endSlotIndex < customizeIndex);
	const filterControlIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf("{filterControl}");
	const viewMenuIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf("<BoardViewMenu");
	const modeToggleIndex = EXPERIMENTAL_HEADER_SOURCE.indexOf("{modeToggle}");
	assert.ok(filterControlIndex > 0 && filterControlIndex < viewMenuIndex);
	assert.ok(viewMenuIndex > 0 && viewMenuIndex < modeToggleIndex);
	assert.ok(modeToggleIndex > 0 && modeToggleIndex < inlineMoreIndex);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/\{filterControl\}\s*<BoardViewMenu[\s\S]*?\{modeToggle\}[\s\S]*?moreControlsPlacement === "inline"/u,
	);
	assert.doesNotMatch(
		EXPERIMENTAL_HEADER_SOURCE,
		/<div className="flex items-center gap-1">\s*<BoardViewMenu/u,
	);
});

test("the board keeps matching 24px gaps above and below the filter controls", () => {
	// The control row's opening tag is multi-line (it carries `controlsInsetEnd`
	// as a style), so match the className string rather than the whole tag —
	// `mt-6` after the tabs must match the header's `pb-6` below the row.
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/\{viewTabs \? <div className="mt-2">\{viewTabs\}<\/div> : null\}[\s\S]*className="mt-6 flex flex-wrap items-center gap-2 px-6"/u,
	);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/className=\{cn\("shrink-0 pt-3", showBoardControls \? "pb-6" : "pb-0"\)\}/u,
	);
	assert.match(
		EXPERIMENTAL_HEADER_SOURCE,
		/paddingInlineEnd: `calc\(\$\{controlsInsetEnd\}px \+ \$\{token\("space\.300"\)\}\)`/u,
	);
});

test("the route pins the shared Agent Session column beside Jira statuses", () => {
	assert.match(PAGE_SOURCE, /showAgentSessionColumn/u);
	assert.match(PAGE_SOURCE, /defaultAgentSessionColumnCollapsed/u);
	assert.match(PAGE_SOURCE, /agentSessionAssigneeIdAliases=\{JIRA_GOLDEN_JOURNEYS_V4_PAY_SESSION_MEMBER_ID_BY_ASSIGNEE_ID\}/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /showAgentSessionColumn\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /defaultAgentSessionColumnCollapsed\?: boolean;/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /function useAgentSessionReview[\s\S]*useState\(defaultCollapsed\)/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /collapsed: displayedAgentSessionColumnCollapsed,/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /onCollapsedChange: handleAgentSessionColumnCollapsedChange,/u);
	assert.doesNotMatch(EXPERIMENTAL_PAGE_SOURCE, /defaultCollapsed: agentSessionColumnCollapsed/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /capturedItemIds: capturedLooseWorkIds,/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /toPulseSessionHandlers/u);

	const columnIndex = EXPERIMENTAL_BOARD_SOURCE.indexOf("<InFlowAgentSessionColumn");
	const scrollportIndex = EXPERIMENTAL_BOARD_SOURCE.indexOf("<section");
	assert.ok(columnIndex > 0, "expected the board to render the Agent Session column");
	assert.ok(columnIndex < scrollportIndex, "expected untracked work to stay pinned before the status scrollport");
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /agentSessionColumn \|\| inFlowAgentSessionColumn \? "ps-2" : "ps-6"/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<ExperimentalJiraKanban[\s\S]*inFlowAgentSessionColumn=\{showInFlowAgentSessionColumn\}/u,
	);
});

test("the Panel design variant floats untracked work over the board and the list", () => {
	// The route is the only place the global variant store meets the board, and
	// it must reach the block as a presentation choice — the block itself stays
	// variant-agnostic.
	assert.match(PAGE_SOURCE, /import \{ useDesignVariants \} from "@\/components\/hooks\/use-design-variants";/u);
	assert.match(PAGE_SOURCE, /const \{ designVariants \} = useDesignVariants\(\);/u);
	assert.match(
		PAGE_SOURCE,
		/<ExperimentalJiraKanbanPage[\s\S]*agentSessionPresentation=\{designVariants\.panel \? "panel" : "column"\}/u,
	);
	assert.match(
		PAGE_SOURCE,
		/<ExperimentalJiraKanbanPage[\s\S]*columnChrome=\{designVariants\.simpleKanban \? "simple" : "default"\}/u,
	);
	assert.doesNotMatch(
		EXPERIMENTAL_PAGE_SOURCE,
		/useDesignVariants|design-variants/u,
		"the shared block must take a presentation prop, not read the global variant store",
	);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /agentSessionPresentation\?: "column" \| "panel";/u);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /agentSessionPresentation = "column",/u);

	// One config, two mutually exclusive hosts: panel mode must hand the column
	// to the overlay, never render both.
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/const agentSessionColumnConfig: AgentSessionColumnProps \| undefined = showAgentSessionColumn \?/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/\{showInFlowAgentSessionColumn && agentSessionColumnConfig \? \(\s*<InFlowAgentSessionColumn/u,
		"panel mode must not mount the in-flow column; column mode keeps one instance above Board and List",
	);
	assert.doesNotMatch(
		EXPERIMENTAL_PAGE_SOURCE,
		/agentSessionColumn=\{agentSessionPresentation === "panel"/u,
		"the page-owned column must not also mount inside ExperimentalJiraKanban",
	);
	// Insights swaps the whole content region for an article, and a tab with no
	// content renders nothing — neither has a board to float over.
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/const showAgentSessionPanel = agentSessionPresentation === "panel"\s*&& agentSessionColumnConfig !== undefined\s*&& showBoardContent\s*&& !showPulseContent;/u,
	);

	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/const showInFlowAgentSessionColumn = agentSessionPresentation === "column"\s*&& agentSessionColumnConfig !== undefined;/u,
	);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /<InFlowAgentSessionColumn/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<InFlowAgentSessionColumn[\s\S]*\{isListContent \? \(/u,
	);

	// The rail is persistent: it is its own entry point, so there is deliberately
	// no board-header show/hide control and no closed state. A close action would
	// strand the surface — nothing outside the rail could bring it back.
	assert.doesNotMatch(EXPERIMENTAL_PAGE_SOURCE, /agentSessionPanelOpen/u);
	assert.doesNotMatch(EXPERIMENTAL_PAGE_SOURCE, /onToggleAgentSessionPanel/u);
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /agentSessionPanelOpen/u);
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /onToggleAgentSessionPanel/u);
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /Untracked work panel/u);
	assert.doesNotMatch(PANEL_SOURCE, /PanelActionClose|onClose/u);
	// Collapse stays on the column-owned header so the rail is not a trap.
	assert.match(PANEL_SOURCE, /headerSurface="panel"/u);
	assert.doesNotMatch(PANEL_SOURCE, /handleCollapse/u);

	// Board and list share one positioning context, which is what lets a single
	// overlay serve both views; Insights stays outside it.
	const contentRegionIndex = EXPERIMENTAL_PAGE_SOURCE.indexOf(
		'className="relative flex min-h-0 min-w-0 flex-1 flex-col',
	);
	const listBranchIndex = EXPERIMENTAL_PAGE_SOURCE.indexOf("{isListContent ? (");
	const panelIndex = EXPERIMENTAL_PAGE_SOURCE.indexOf("<AgentSessionPanel");
	assert.ok(contentRegionIndex > 0, "expected a relative content region to anchor the floating panel");
	assert.ok(contentRegionIndex < listBranchIndex, "the board and list branches must live inside that region");
	assert.ok(
		listBranchIndex > 0 && listBranchIndex < panelIndex,
		"the panel must render after the content so it wins the z-40 stacking tie with the list column controls",
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/import \{\s*AGENT_SESSION_PANEL_WIDTH_PX,\s*AgentSessionPanel,\s*\} from "\.\/components\/agent-session-panel";/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<AgentSessionPanel\s+agentSessionColumn=\{\{\s*\.\.\.agentSessionColumnConfig,\s*draggingIds: boardSessionDrag\.draggingIds,\s*sessionDrag: boardSessionDrag\.untrackedBinding,\s*\}\}/u,
		"the panel is controlled: its collapse state is the same state the in-flow column uses",
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<JiraSessionFlyoutSuspensionProvider\s+suspended=\{boardSessionDrag\.transaction !== null\}\s*>/u,
		"panel session flyouts suspend during the same board drag transaction as the in-flow column",
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/sessionDragging=\{boardSessionDrag\.transaction !== null\}/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/untrackedDropArmed=\{boardSessionDrag\.transaction\?\.target\?\.kind === "untracked"\}/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/showLeadingScrollFade=\{isListContent && listContentUnderlapsPanel\}/u,
		"the List view only asks for a fade while real content still underlaps the panel",
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/onTrailingContentUnderlapChange: setListContentUnderlapsPanel,\s*scrollEndInset: boardScrollEndInset,\s*trailingOverlayRef: agentSessionPanelRef,/u,
	);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /ref=\{agentSessionPanelRef\}/u);
	assert.match(PANEL_SOURCE, /showLeadingScrollFade\?: boolean;/u);
	assert.match(
		PANEL_SOURCE,
		/\{showLeadingScrollFade && collapsed \? \(/u,
		"the expanded panel border remains the sole separator",
	);
	assert.match(
		PANEL_SOURCE,
		/<ScrollMaskEdgeOverlay\s+className="right-full"\s+edge="right"\s+fadeSize="3rem"\s*\/>/u,
	);
	assert.match(PANEL_SOURCE, /sessionDragging \? "pointer-events-none" : null/u);
	assert.match(PANEL_SOURCE, /data-board-agent-session-drop-zone="untracked"/u);
	assert.match(
		PANEL_SOURCE,
		/untrackedDropArmed \? "bg-bg-accent-blue-subtlest" : "bg-surface"/u,
	);
	assert.match(PANEL_SOURCE, /<AgentSessionColumn\s+\{\.\.\.agentSessionColumn\}/u);
	// The panel is pinned to the RIGHT edge. That is what lets the list scroll
	// under it like the board does: the list's leading checkbox and summary
	// cells are `sticky left-0`, so a right-pinned panel never covers them and
	// no width needs reserving. Guard both halves — the right pin, and the
	// absence of the inset that a left pin would have required.
	assert.match(PANEL_SOURCE, /"absolute bottom-0 right-0 z-40 rounded-none"/u);
	assert.match(PANEL_SOURCE, /<SidebarResizeHandle/u);
	assert.match(PANEL_SOURCE, /side="left"/u);
	assert.doesNotMatch(PANEL_SOURCE, /border-l border-border/u);
	assert.match(PANEL_SOURCE, /className=\{collapsed \? "pt-1" : "pt-0"\}/u);
	assert.doesNotMatch(PANEL_SOURCE, /AGENT_SESSION_PANEL_CONTENT_INSET/u);
	// Panel list only: 4px side inset and 4px row gap (`space.050`). Do not
	// widen either axis to `gap-2 p-2` (`space.100` / 8px).
	assert.match(PANEL_SOURCE, /listClassName=\{cn\("gap-1 p-1", agentSessionColumn.listClassName\)\}/u);
	assert.doesNotMatch(PANEL_SOURCE, /listClassName=\{cn\("gap-2 p-2"/u);
	assert.match(PANEL_SOURCE, /headerSurface="panel"/u);
	assert.doesNotMatch(PANEL_SOURCE, /chrome="none"/u);
	assert.doesNotMatch(PANEL_SOURCE, /\binset-y-0 left-0\b/u);
	// The rail STOPS at the tab strip: a real `top` offset, never `inset-y-0`
	// plus `paddingTop`. Spanning the board root and padding the content would
	// leave an invisible slab over the tabs that swallows pointer events and
	// reads as a full-height overlay to anything measuring the DOM. Full
	// height from that line to `bottom: 0` wins over lining the header up
	// with the search/filter row — an `mt-6` pin left a hole under the tabs.
	assert.doesNotMatch(PANEL_SOURCE, /\binset-y-0\b/u);
	assert.doesNotMatch(PANEL_SOURCE, /paddingTop:/u);
	assert.match(PANEL_SOURCE, /\btop: topInset,/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/topInset=\{BOARD_HEADER_TAB_STRIP_BOTTOM_PX\}/u,
	);
	assert.match(PANEL_SOURCE, /export \{ AGENT_SESSION_PANEL_WIDTH_PX \}/u);
	assert.match(PANEL_RESIZE_HOOK_SOURCE, /export const AGENT_SESSION_PANEL_WIDTH_PX = 360;/u);
	assert.match(PANEL_RESIZE_HOOK_SOURCE, /direction: "rtl"/u);
	assert.match(
		PANEL_SOURCE,
		/onExpandedWidthChange\?: \(widthPx: number\) => void/u,
	);
	// The column owns the panel header. This host must not restack title,
	// count, or overflow under the column's own Selected N / browse chrome.
	assert.doesNotMatch(PANEL_SOURCE, /<PanelHeader>/u);
	assert.doesNotMatch(PANEL_SOURCE, /<PanelTitle>/u);
	assert.doesNotMatch(PANEL_SOURCE, /untrackedCount/u);
	assert.doesNotMatch(PANEL_SOURCE, /AGENT_SESSION_PANEL_HEADER_CLASS|pt-6 pb-0/u);
	assert.doesNotMatch(EXPERIMENTAL_PAGE_SOURCE, /rounded-lg bg-surface/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/displayedAgentSessionColumnCollapsed\s*\?\s*AGENT_SESSION_COLUMN_COLLAPSED_WIDTH_PX\s*:\s*agentSessionPanelWidthPx/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/onExpandedWidthChange=\{setAgentSessionPanelWidthPx\}/u,
	);
	// The rail stops at the tabs via a real `top`, so the header needs no
	// opaque z-50 band to paint over its head.
	assert.doesNotMatch(EXPERIMENTAL_HEADER_SOURCE, /relative z-50 bg-surface/u);
	assert.doesNotMatch(EXPERIMENTAL_PAGE_SOURCE, /listAgentSessionPanelInset/u);
	assert.doesNotMatch(EXPERIMENTAL_PAGE_SOURCE, /paddingInline(?:Start|End)/u);
});

test("the board's AI entry point is the floating Rovo button, not the Omnibar", () => {
	// AppLayout hides its own launcher so JgpRovoOverlay owns the single FAB.
	assert.match(PAGE_SOURCE, /<AppLayout[\s\S]*hideFloatingRovo[\s\S]*product="jira"/u);
	assert.match(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*externalThinkingMessageId=\{externalThinkingMessageId\}/u);
	assert.doesNotMatch(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*launcher=/u);
	assert.doesNotMatch(PAGE_SOURCE, /<JgpRovoOverlay[\s\S]*chat="hidden"/u);
	assert.doesNotMatch(PAGE_SOURCE, /Omnibar|SCRUBBER_DEMO_ENTRIES|handleOmnibar/u);
	assert.doesNotMatch(PAGE_SOURCE, /useRovoChat|isSidebarChatOpen/u);
	// The overlay does not pass `placement`; the button's default `right` must
	// read `--untracked-panel-width` or a hardcoded 24px parks it on the rail.
	assert.match(
		FAB_GEOMETRY_SOURCE,
		/export const FLOATING_ROVO_BUTTON_END_INSET_VAR = "--untracked-panel-width";/u,
	);
	assert.match(
		FAB_GEOMETRY_SOURCE,
		/const DEFAULT_BUTTON_RIGHT = `calc\(\$\{FLOATING_ROVO_BUTTON_EDGE_GAP\}px \+ var\(\$\{FLOATING_ROVO_BUTTON_END_INSET_VAR\}, 0px\)\)`;/u,
	);
	assert.doesNotMatch(FAB_GEOMETRY_SOURCE, /const DEFAULT_BUTTON_RIGHT = "24px";/u);
});

test("the untracked panel publishes its occupied width for the floating Rovo button", () => {
	// FAB inset is not the scroll inset. Collapsed stays 0 (original corner);
	// only the expanded 360px panel pushes the launcher. Publishing
	// `boardScrollEndInset` would leave a 32px or 360px hole on first paint.
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /const UNTRACKED_PANEL_WIDTH_CSS_VAR = "--untracked-panel-width";/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/const untrackedPanelFabInsetPx = showAgentSessionPanel && !displayedAgentSessionColumnCollapsed\s*\?\s*agentSessionPanelWidthPx\s*:\s*0;/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/root\.style\.setProperty\(UNTRACKED_PANEL_WIDTH_CSS_VAR, `\$\{untrackedPanelFabInsetPx\}px`\)/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/\[UNTRACKED_PANEL_WIDTH_CSS_VAR\]: `\$\{untrackedPanelFabInsetPx\}px`/u,
	);
	assert.doesNotMatch(
		EXPERIMENTAL_PAGE_SOURCE,
		/setProperty\(UNTRACKED_PANEL_WIDTH_CSS_VAR, `\$\{boardScrollEndInset\}px`\)/u,
	);
});

test("the Simple kanban design variant reaches the board as column chrome", () => {
	assert.match(
		PAGE_SOURCE,
		/columnChrome=\{designVariants\.simpleKanban \? "simple" : "default"\}/u,
	);
	assert.doesNotMatch(
		EXPERIMENTAL_PAGE_SOURCE,
		/useDesignVariants|design-variants/u,
		"the shared page must take columnChrome, not read the global variant store",
	);
	assert.doesNotMatch(
		EXPERIMENTAL_BOARD_SOURCE,
		/useDesignVariants|design-variants/u,
		"the shared board must take columnChrome, not read the global variant store",
	);
	assert.match(EXPERIMENTAL_PAGE_SOURCE, /columnChrome\?: JiraKanbanProps\["columnChrome"\];/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<ExperimentalJiraKanban[\s\S]*columnChrome=\{columnChrome\}/u,
	);
	// Simple kanban only swaps card chrome (stroke hairline vs raised elevation).
	// Experimental internals stay compact in both column recipes.
	assert.match(EXPERIMENTAL_BOARD_SOURCE, /chrome=\{chrome\.cardChrome\}/u);
	assert.match(EXPERIMENTAL_CARD_SOURCE, /<JiraIssue[\s\S]*chrome=\{chrome\}[\s\S]*compact/u);
});
