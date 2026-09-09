/**
 * Source contracts for View → Agent → Untracked board proximity.
 *
 * The menu lifts Untracked onto the experimental page; Pulse sessions sit
 * under matching Jira cards with the same flyout attach path as the column,
 * exit through AnimatePresence, a column click spotlights the related issue,
 * and a column hover lights that issue's session rows without spotlighting.
 */

const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const EXPERIMENTAL_DIR = __dirname;
const PAGE_SOURCE = [
	readFileSync(join(EXPERIMENTAL_DIR, "page.tsx"), "utf8"),
	readFileSync(join(EXPERIMENTAL_DIR, "experimental-page-types.ts"), "utf8"),
	readFileSync(join(EXPERIMENTAL_DIR, "hooks", "use-page-content-model.ts"), "utf8"),
].join("\n");
const BOARD_SOURCE = [
	readFileSync(join(EXPERIMENTAL_DIR, "experimental-jira-kanban.tsx"), "utf8"),
	readFileSync(join(EXPERIMENTAL_DIR, "components", "created-card-arrival-motion.tsx"), "utf8"),
	readFileSync(join(EXPERIMENTAL_DIR, "components", "board-column-card-list.tsx"), "utf8"),
].join("\n");
const IN_FLOW_SOURCE = readFileSync(
	join(EXPERIMENTAL_DIR, "components", "in-flow-agent-session-column.tsx"),
	"utf8",
);
const CARD_SOURCE = readFileSync(join(EXPERIMENTAL_DIR, "experimental-jira-kanban-card.tsx"), "utf8");
const JIRA_ISSUE_SOURCE = readFileSync(
	join(EXPERIMENTAL_DIR, "..", "..", "jira-issue", "index.tsx"),
	"utf8",
);
const DRAG_HOOK_SOURCE = readFileSync(join(EXPERIMENTAL_DIR, "use-board-agent-session-drag.ts"), "utf8");
const HELPER_SOURCE = readFileSync(join(EXPERIMENTAL_DIR, "lib", "board-untracked-sessions.ts"), "utf8");
const SESSION_INDEX_SOURCE = readFileSync(
	join(EXPERIMENTAL_DIR, "..", "..", "agent-session", "index.tsx"),
	"utf8",
);
const MEDIUM_CARD_SOURCE = readFileSync(
	join(EXPERIMENTAL_DIR, "..", "..", "agent-session", "agent-session-medium-card.tsx"),
	"utf8",
);
const LARGE_CARD_SOURCE = readFileSync(
	join(EXPERIMENTAL_DIR, "..", "..", "agent-session", "agent-session-card.tsx"),
	"utf8",
);

function withoutComments(source) {
	return source.replace(/\/\*[\s\S]*?\*\//gu, "").replace(/\/\/[^\n]*/gu, "");
}

test("the experimental page groups Pulse sessions onto the board when Untracked is on", () => {
	assert.match(PAGE_SOURCE, /import \{\s*collectBoardIssueKeys,\s*groupBoardUntrackedSessions,\s*selectBoardUntrackedSessions,\s*\} from "\.\/lib\/board-untracked-sessions"/u);
	assert.match(PAGE_SOURCE, /defaultShowUntracked\?: boolean;/u);
	assert.match(PAGE_SOURCE, /defaultShowUntracked = true,/u);
	assert.match(PAGE_SOURCE, /const \[showUntracked, setShowUntracked\] = useState\(defaultShowUntracked\)/u);
	assert.match(
		PAGE_SOURCE,
		/if \(defaultShowUntracked !== appliedShowUntrackedDefault\) \{\s*setAppliedShowUntrackedDefault\(defaultShowUntracked\);\s*setShowUntracked\(defaultShowUntracked\);\s*\}/u,
	);
	assert.match(
		PAGE_SOURCE,
		/displayedShowUntracked\s*\?\s*groupBoardUntrackedSessions\(\{\s*archivedItemIds: archivedLooseWorkIds,\s*boardIssueKeys,\s*capturedItemIds: capturedLooseWorkIds,\s*detachedByCard: detachedAgentSessionsByCard,\s*sessions: agentSessionItems,\s*\}\)\s*:\s*EMPTY_PROXIMITY_SESSIONS/u,
	);
	assert.match(PAGE_SOURCE, /detachedAgentSessionsByCard=\{proximityAgentSessionsByCard\}/u);
	assert.match(HELPER_SOURCE, /session\.sessionDetails\?\.issueKey/u);
	assert.match(HELPER_SOURCE, /capturedItemIds\.has\(session\.id\)/u);
});

test("the Untracked column follows card session link and unlink state", () => {
	assert.match(
		PAGE_SOURCE,
		/const untrackedAgentSessionItems = useMemo\([\s\S]*selectBoardUntrackedSessions\(\{[\s\S]*archivedItemIds: archivedLooseWorkIds,[\s\S]*capturedItemIds: capturedLooseWorkIds,[\s\S]*detachedByCard: detachedAgentSessionsByCard,[\s\S]*sessions: agentSessionItems,/u,
	);
	assert.match(PAGE_SOURCE, /items: untrackedAgentSessionItems/u);
	assert.match(
		PAGE_SOURCE,
		/const handleCardAgentSessionLink:[\s\S]*setCapturedLooseWorkIds\([\s\S]*new Set\(current\)\.add\(session\.id\)/u,
	);
	assert.match(
		PAGE_SOURCE,
		/const handleCardAgentSessionUnlink:[\s\S]*setCapturedLooseWorkIds\([\s\S]*next\.delete\(session\.id\)/u,
	);
	assert.match(PAGE_SOURCE, /onCardAgentSessionLink\?\.\(session, card, columnTitle\)/u);
	assert.match(PAGE_SOURCE, /onCardAgentSessionUnlink\?\.\(session, card, columnTitle\)/u);
});

test("the experimental page can prepend newly synced agent sessions with arrival marks", () => {
	assert.match(PAGE_SOURCE, /additionalAgentSessions\?: readonly PulseAgentSession\[\];/u);
	assert.match(PAGE_SOURCE, /newAgentSessionIds\?: ReadonlySet<string>;/u);
	assert.match(
		PAGE_SOURCE,
		/onAgentSessionsReviewed\?: \(sessionIds\?: readonly string\[\]\) => void;/u,
	);
	assert.match(PAGE_SOURCE, /function useAgentSessionLooseWork\(/u);
	assert.match(PAGE_SOURCE, /function useAgentSessionReview\(/u);
	assert.match(PAGE_SOURCE, /function isExperimentalJiraListContent\(/u);
	assert.doesNotMatch(PAGE_SOURCE, /additionalAgentSessions = EMPTY_ADDITIONAL_AGENT_SESSIONS/u);
	assert.match(
		PAGE_SOURCE,
		/const agentSessionLooseWork = useAgentSessionLooseWork\(additionalAgentSessions, pulseTimeline\.looseWork\)/u,
	);
	assert.match(
		PAGE_SOURCE,
		/filterPulseLooseWorkByMember\(agentSessionLooseWork, agentSessionMemberId\)/u,
	);
	assert.match(PAGE_SOURCE, /looseWork: agentSessionLooseWork/u);
	assert.match(PAGE_SOURCE, /newItemIds: newAgentSessionIds/u);
	assert.match(PAGE_SOURCE, /onItemHover: handleUntrackedItemHover/u);
	assert.match(PAGE_SOURCE, /collapsed: displayedAgentSessionColumnCollapsed,/u);
	assert.match(PAGE_SOURCE, /onCollapsedChange: handleAgentSessionColumnCollapsedChange/u);
	assert.doesNotMatch(PAGE_SOURCE, /defaultCollapsed: agentSessionColumnCollapsed/u);
});

test("proximity AgentSession forwards the Pulse flyout attach handlers", () => {
	assert.match(CARD_SOURCE, /capturedItemIds=\{capturedItemIds\}/u);
	assert.match(CARD_SOURCE, /onCreateWorkItem=\{onCreateWorkItem\}/u);
	assert.match(CARD_SOURCE, /onLinkWorkItem=\{onSessionLink \|\| onLinkWorkItem/u);
	assert.match(CARD_SOURCE, /onSubtasks=\{onSubtasks\}/u);
	assert.match(CARD_SOURCE, /variant="medium-detached"/u);
	assert.match(PAGE_SOURCE, /proximityAgentSession=\{\{/u);
	assert.match(PAGE_SOURCE, /actionableSessionIds: proximityActionableSessionIds/u);
	assert.match(BOARD_SOURCE, /bindBoardProximitySessionActions\(/u);
	assert.match(BOARD_SOURCE, /capturedItemIds=\{proximityActions\.capturedItemIds\}/u);
	assert.match(BOARD_SOURCE, /onCreateWorkItem=\{proximityActions\.onCreateWorkItem\}/u);
	assert.match(BOARD_SOURCE, /onLinkWorkItem=\{proximityActions\.onLinkWorkItem\}/u);
	assert.match(BOARD_SOURCE, /onSubtasks=\{proximityActions\.onSubtasks\}/u);
	assert.doesNotMatch(BOARD_SOURCE, /onCreateWorkItem=\{agentSessionColumn\?\.onCreateWorkItem\}/u);
});

test("one board transaction coordinates every session source and suppresses previews during either drag", () => {
	assert.match(BOARD_SOURCE, /useBoardAgentSessionDrag/u);
	assert.match(DRAG_HOOK_SOURCE, /createBoardAgentSessionDragTransaction/u);
	assert.match(DRAG_HOOK_SOURCE, /resolveBoardAgentSessionDropAction/u);
	assert.match(BOARD_SOURCE, /JiraSessionFlyoutSuspensionProvider/u);
	assert.match(BOARD_SOURCE, /const sessionFlyoutsSuspended = boardSessionDrag\.transaction !== null \|\| draggedCardCode !== null;/u);
	assert.match(BOARD_SOURCE, /sessionFlyoutsSuspended=\{sessionFlyoutsSuspended\}/u);
	assert.match(IN_FLOW_SOURCE, /suspended=\{sessionFlyoutsSuspended \|\| reposition\.dragging \|\| !isEmbedded\}/u);
	assert.doesNotMatch(IN_FLOW_SOURCE, /isHovered && !isPersistentExpanded/u);
	assert.match(BOARD_SOURCE, /sessionDrag: boardSessionDrag\.enablement\.transferable[\s\S]*\? boardSessionDrag\.untrackedBinding[\s\S]*: agentSessionColumn\.sessionDrag/u);
	assert.match(PAGE_SOURCE, /boardAgentSessionDrag=\{boardSessionDrag\}/u);
	assert.match(PAGE_SOURCE, /sessionDrag: boardSessionDrag\.untrackedBinding/u);
	assert.match(
		PAGE_SOURCE,
		/import \{ JiraSessionFlyoutSuspensionProvider \} from "@\/components\/blocks\/product-sidebar\/variants\/jira-session-flyout"/u,
	);
	assert.match(
		PAGE_SOURCE,
		/<JiraSessionFlyoutSuspensionProvider\s+suspended=\{boardSessionDrag\.transaction !== null\}\s*>/u,
	);
	assert.match(
		PAGE_SOURCE,
		/sessionDragging=\{boardSessionDrag\.transaction !== null\}/u,
	);
	assert.match(BOARD_SOURCE, /untrackedSessions: props\.agentSessionColumn\?\.items \?\? props\.untrackedSessions/u);
	assert.match(BOARD_SOURCE, /data-board-agent-session-drop-zone="issue"/u);
	assert.match(IN_FLOW_SOURCE, /data-board-agent-session-drop-zone="untracked"/u);
	assert.match(PAGE_SOURCE, /ref=\{boardSessionDrag\.boardRootRef\}/u);
	assert.match(BOARD_SOURCE, /captureBoardSessionDragRoot=\{false\}/u);
	assert.match(
		PAGE_SOURCE,
		/untrackedDropArmed=\{boardSessionDrag\.transaction\?\.target\?\.kind === "untracked"\}/u,
	);
	assert.match(CARD_SOURCE, /agentSessionDragControl=\{agentSessionDragControl\}/u);
	assert.match(CARD_SOURCE, /sessionDrag=\{canLinkAgentSession[\s\S]*\? detachedSessionDrag \?\? localSessionDrag[\s\S]*: undefined\}/u);
	assert.match(BOARD_SOURCE, /data-board-agent-session-target/u);
});

test("board-wide drag stays opt-in for zero and partial callback consumers", () => {
	assert.match(DRAG_HOOK_SOURCE, /const enablement = resolveDragEnablement\(ports\);/u);
	assert.doesNotMatch(
		DRAG_HOOK_SOURCE,
		/agentActivityLayout === "split"/u,
		"merged Team EU chins must be able to drag onto Untracked and issues",
	);
	assert.match(DRAG_HOOK_SOURCE, /\n\s*enablement,\s*\n/u);
	assert.match(DRAG_HOOK_SOURCE, /const control: JiraIssueAgentSessionDragControl \| undefined = enablement\.attached/u);
	assert.match(DRAG_HOOK_SOURCE, /detachedBinding: enablement\.transferable[\s\S]*\? createBinding\(\{ kind: "detached"/u);
	assert.match(DRAG_HOOK_SOURCE, /untrackedBinding: enablement\.transferable \? createBinding\(\{ kind: "untracked" \}\) : undefined/u);
	assert.match(CARD_SOURCE, /detachedSessionDrag \?\? localSessionDrag/u);
});

test("release re-hit-tests the current pointer against current board geometry", () => {
	assert.match(
		DRAG_HOOK_SOURCE,
		/const finalTransaction = state\.pointer[\s\S]*\? updateBoardAgentSessionDragTransaction\([\s\S]*current,[\s\S]*state\.pointer,[\s\S]*collectDropZones\(boardRootRef\.current\),?[\s\S]*\)[\s\S]*: current;/u,
	);
	assert.match(DRAG_HOOK_SOURCE, /commitDrop\(finalTransaction\)/u);
});

test("list-row hit testing reads shared scrollport geometry once per drag evaluation", () => {
	assert.match(
		DRAG_HOOK_SOURCE,
		/const listScrollportClipCache = new Map<HTMLElement, ListScrollportClip>\(\);/u,
	);
	assert.match(
		DRAG_HOOK_SOURCE,
		/clipBoundsToScrollport\(node, rect, listScrollportClipCache\)/u,
	);
	assert.match(
		DRAG_HOOK_SOURCE,
		/let scrollportClip = clipCache\.get\(scrollport\);[\s\S]*if \(scrollportClip === undefined\) \{[\s\S]*clipCache\.set\(scrollport, scrollportClip\);/u,
	);
});

test("card-link drops commit the transfer before decorative flights start", () => {
	const source = withoutComments(DRAG_HOOK_SOURCE);
	assert.match(
		source,
		/commitDrop\(finalTransaction\);\s*if \(release && finalTransaction\.proximity && !shouldReduceMotion\)/u,
	);
	assert.doesNotMatch(source, /pendingAttachRef\.current = \{ flash, transaction:/u);
	assert.doesNotMatch(source, /commitDrop\(pending\.transaction\)/u);
});

test("unchecking Untracked exits board-adjacent sessions through the issue presence recipe", () => {
	assert.match(CARD_SOURCE, /import \{ AnimatePresence, motion, useReducedMotion \} from "motion\/react"/u);
	assert.match(
		CARD_SOURCE,
		/import \{\s*getJiraIssuePresenceMotion,\s*JIRA_ISSUE_MOTION_STYLE,\s*\} from "@\/components\/blocks\/jira-issue\/lib"/u,
	);
	assert.match(CARD_SOURCE, /const proximityMotion = getJiraIssuePresenceMotion\(shouldReduceMotion\)/u);
	assert.match(CARD_SOURCE, /sessionTransferAfter=\{detachedAgentSessions\.length > 0/u);
	assert.match(
		withoutComments(CARD_SOURCE),
		/<AnimatePresence>\s*<motion\.div[\s\S]*exit=\{proximityMotion\.exit\}/u,
	);
	assert.doesNotMatch(BOARD_SOURCE, /data-agent-session-column[\s\S]*showUntracked/u);
});

test("column session hover previews its suggested Jira issue at the grey hover rung without scrolling or spotlighting", () => {
	const boardWithoutComments = withoutComments(BOARD_SOURCE);
	const hoverHandlerStart = boardWithoutComments.indexOf("const handleColumnSessionHover");
	const hoverHandlerBody = boardWithoutComments.slice(
		hoverHandlerStart,
		boardWithoutComments.indexOf("};", hoverHandlerStart),
	);

	assert.notStrictEqual(hoverHandlerStart, -1);
	assert.match(BOARD_SOURCE, /onItemHover: handleColumnSessionHover,/u);
	assert.match(hoverHandlerBody, /setHoveredColumnSessionId\(item\?\.id \?\? null\)/u);
	assert.match(hoverHandlerBody, /agentSessionColumn\?\.onItemHover\?\.\(item\)/u);
	assert.match(BOARD_SOURCE, /const hoveredIssueKey = hoveredColumnSessionId === null/u);
	assert.match(PAGE_SOURCE, /const untrackedHoveredWorkItemKey = untrackedHoveredSession/u);
	assert.match(PAGE_SOURCE, /proximityHighlightedWorkItemKey=\{untrackedHoveredWorkItemKey\}/u);
	assert.match(BOARD_SOURCE, /proximityHighlightedWorkItemKey\?: string \| null;/u);
	assert.match(BOARD_SOURCE, /const hostHoveredIssueKey = proximityHighlightedWorkItemKey === undefined/u);
	assert.match(CARD_SOURCE, /agentSessionTargetPreview=\{\{ highlighted: agentSessionTargetHighlighted \}\}/u);
	assert.match(JIRA_ISSUE_SOURCE, /agentSessionTargetHighlighted \? "bg-bg-neutral-hovered" : "bg-bg-neutral"/u);
	// Hover previews the relationship with color only. Only a click owns focus,
	// scroll, and the `opacity-40` veil, so the hover handler stays out of all three.
	assert.doesNotMatch(hoverHandlerBody, /setFocusedIssueKey/u);
	assert.doesNotMatch(hoverHandlerBody, /scrollBoardIssueIntoView/u);
	assert.match(BOARD_SOURCE, /highlightedSessionId=\{highlightedSessionId\}/u);
	assert.match(CARD_SOURCE, /highlightedItemId=\{highlightedSessionId\}/u);
});

test("a hovered column session lights its board twin at the row hover rung", () => {
	// The column and the board render the same session ids, so the twin is found
	// by id rather than by re-deriving the work-item relationship.
	assert.match(SESSION_INDEX_SOURCE, /isHighlighted=\{item\.id === highlightedItemId\}/u);
	// Same rung the row reaches on its own hover, so a remote pointer reads the
	// way a local one would. Notably not the blue the click spotlight owns.
	assert.match(MEDIUM_CARD_SOURCE, /isHighlighted\s*\?\s*"bg-surface-hovered"/u);
	assert.doesNotMatch(MEDIUM_CARD_SOURCE, /bg-bg-accent-blue-subtlest/u);
	assert.match(
		MEDIUM_CARD_SOURCE,
		/:\s*"bg-surface hover:bg-surface-hovered"/u,
	);
	// List-item hover recipe: 50ms, practical easing, background-color only.
	assert.match(
		MEDIUM_CARD_SOURCE,
		/transition-\[background-color,border-color\] duration-xxshort ease-out-practical motion-reduce:transition-none/u,
	);
});

test("a hovered detached board session lights its column twin", () => {
	// Hover is transient relationship preview in either direction. The board
	// owns the shared id and feeds it to the column, while the medium row
	// reports pointer entry/exit through the same session callback as the
	// column's large row.
	assert.match(BOARD_SOURCE, /highlightedItemId: highlightedSessionId,/u);
	assert.match(CARD_SOURCE, /onItemHover=\{onItemHover\}/u);
	assert.match(MEDIUM_CARD_SOURCE, /onPointerEnter=\{\(\) => \{\s*[\s\S]*?onItemHover\?\.\(item\);\s*\}\}/u);
	assert.match(MEDIUM_CARD_SOURCE, /onPointerLeave=\{\(\) => \{\s*[\s\S]*?onItemHover\?\.\(null\);\s*\}\}/u);
	assert.match(SESSION_INDEX_SOURCE, /isHighlighted=\{item\.id === highlightedItemId\}/u);
	assert.match(LARGE_CARD_SOURCE, /!showSelectedFill && isHighlighted && "bg-surface-hovered"/u);
});

test("column card click scrolls the related issue and applies the blue-subtlest spotlight", () => {
	assert.match(BOARD_SOURCE, /onView: handleSessionView,/u);
	assert.match(BOARD_SOURCE, /onSelectedItemIdChange: handleSessionSelectionChange,/u);
	assert.match(
		withoutComments(BOARD_SOURCE),
		/const handleSessionSelectionChange = \(itemId: string \| null\) => \{\s*if \(itemId === null\) \{\s*setFocusedIssueKey\(null\);/u,
	);
	assert.match(BOARD_SOURCE, /data-issue-key=\{cardCode\}/u);
	assert.match(
		BOARD_SOURCE,
		/spotlightIssueKey === card\.code && "bg-bg-accent-blue-subtlest \[&_\[data-slot=jira-issue-agent-backdrop\]\]:bg-bg-accent-blue-subtlest"/u,
	);
	assert.match(
		BOARD_SOURCE,
		/agentSessionTargetHighlighted=\{hoveredIssueKey === card\.code && spotlightIssueKey !== card\.code\}/u,
	);
	assert.match(
		BOARD_SOURCE,
		/spotlightIssueKey !== null && spotlightIssueKey !== card\.code && "opacity-40"/u,
	);
	assert.match(
		BOARD_SOURCE,
		/const spotlightIssueKey = resolveVisibleFocusedIssueKey\(focusedIssueKey, boardColumns\)/u,
	);
	assert.match(
		BOARD_SOURCE,
		/transition-\[background-color,opacity\] duration-normal ease-out-practical/u,
	);
	assert.match(BOARD_SOURCE, /motion-reduce:transition-none/u);
	assert.match(
		BOARD_SOURCE,
		/scrollBoardIssueIntoView\(boardScrollportRef\.current, nextKey\)/u,
	);
	assert.match(BOARD_SOURCE, /agentSessionColumn\?\.onView\?\.\(item\)/u);
	assert.match(BOARD_SOURCE, /agentSessionColumn\?\.onSelectedItemIdChange\?\.\(itemId\)/u);
	assert.match(SESSION_INDEX_SOURCE, /if \(nextId !== null\) \{\s*\n\s*onView\?\.\(item\);\s*\n\s*\}/u);
	assert.match(HELPER_SOURCE, /boardScrollport\.scrollBy\(\{\s*behavior: "instant",\s*left:/u);
	assert.match(HELPER_SOURCE, /columnScrollport\.scrollBy\(\{\s*behavior: "instant",\s*top:/u);
	assert.doesNotMatch(HELPER_SOURCE, /scrollIntoView/u);
	assert.doesNotMatch(HELPER_SOURCE, /"smooth"/u);
});

test("Untracked stays frozen beside the independently scrolling Jira status pane", () => {
	const statusScrollportStart = BOARD_SOURCE.indexOf("<section");
	const statusScrollportEnd = BOARD_SOURCE.indexOf("</section>", statusScrollportStart);
	const statusScrollportSource = BOARD_SOURCE.slice(statusScrollportStart, statusScrollportEnd);

	assert.match(BOARD_SOURCE, /const boardScrollportRef = useRef<HTMLElement \| null>\(null\)/u);
	assert.match(
		BOARD_SOURCE,
		/<InFlowAgentSessionColumn[\s\S]*\) : null\}\s*<JiraSessionFlyoutSuspensionProvider suspended>\s*<section[\s\S]*ref=\{boardScrollportRef\}[\s\S]*data-jira-kanban-scrollport=""[\s\S]*overflowX: "auto"/u,
	);
	assert.doesNotMatch(statusScrollportSource, /<(?:InFlow)?AgentSessionColumn/u);
	assert.match(BOARD_SOURCE, /data-jira-kanban-card-list=""/u);
});

test("column presentation pins Untracked beside the list as well as the board", () => {
	assert.match(
		PAGE_SOURCE,
		/const showInFlowAgentSessionColumn = agentSessionPresentation === "column"\s*&& agentSessionColumnConfig !== undefined;/u,
	);
	assert.match(
		PAGE_SOURCE,
		/\{showInFlowAgentSessionColumn && agentSessionColumnConfig \? \(\s*<InFlowAgentSessionColumn/u,
	);
	assert.doesNotMatch(PAGE_SOURCE, /inFlowAgentSessionColumn/u);
	assert.match(PAGE_SOURCE, /columnFrame=\{columnChromeStyles\.headerFrame\}/u);
	assert.match(
		PAGE_SOURCE,
		/<InFlowAgentSessionColumn[\s\S]*\{isListContent \? \(/u,
		"one Untracked column instance must wrap both Board and List so hide/archive state survives the switch",
	);
	assert.doesNotMatch(
		PAGE_SOURCE,
		/agentSessionColumn=\{agentSessionPresentation === "panel"/u,
		"the page-owned column must not also mount inside ExperimentalJiraKanban",
	);
});
