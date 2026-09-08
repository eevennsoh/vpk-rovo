const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const INDEX_SOURCE = readFileSync(join(__dirname, "index.tsx"), "utf8");
const TYPES_SOURCE = readFileSync(join(__dirname, "agent-session-column-types.ts"), "utf8");
const RAIL_SOURCE = readFileSync(join(__dirname, "agent-session-column-rail.tsx"), "utf8");
const IN_FLOW_COLUMN_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental/components/in-flow-agent-session-column.tsx"),
	"utf8",
);
const IN_FLOW_GEOMETRY_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental/lib/in-flow-agent-session-column-geometry.ts"),
	"utf8",
);
const EXPERIMENTAL_BOARD_SOURCE = [
	readFileSync(join(__dirname, "../jira-kanban/experimental/experimental-jira-kanban.tsx"), "utf8"),
	readFileSync(join(__dirname, "../jira-kanban/experimental/components/created-card-arrival-motion.tsx"), "utf8"),
	readFileSync(join(__dirname, "../jira-kanban/experimental/lib/card-motion.ts"), "utf8"),
].join("\n");
const EXPERIMENTAL_PAGE_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental/page.tsx"),
	"utf8",
);
const EXPERIMENTAL_HEADER_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental/experimental-board-header.tsx"),
	"utf8",
);
const JIRA_PROJECT_SOURCE = readFileSync(
	join(__dirname, "../../projects/jira-golden-journeys-v4/page.tsx"),
	"utf8",
);
const BOARD_SOURCE = readFileSync(
	join(__dirname, "../jira-kanban/experimental-v2/experimental-v2-jira-kanban.tsx"),
	"utf8",
);

test("the v2 board pins the column outside its horizontal scrollport", () => {
	assert.match(BOARD_SOURCE, /agentSessionColumn\?: AgentSessionColumnProps;/u);
	const columnIndex = BOARD_SOURCE.indexOf("<InFlowAgentSessionColumn");
	const sectionIndex = BOARD_SOURCE.indexOf("<section");
	assert.ok(columnIndex > 0, "expected the board to render the pinned column");
	assert.ok(columnIndex < sectionIndex, "expected the pinned column before the scrollport");
	assert.doesNotMatch(BOARD_SOURCE, /agentSessionColumn \? "ps-2" : "ps-6"/u);
	assert.match(BOARD_SOURCE, /"flex min-h-full w-max min-w-full items-stretch ps-6"/u);
	assert.match(BOARD_SOURCE, /columnFrame=\{chrome\.headerFrame\}/u);
});

test("the in-flow host pins the compact preview before expanding the full column", () => {
	assert.match(IN_FLOW_COLUMN_SOURCE, /const \[isHovered, setIsHovered\] = useState\(false\)/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /const isCollapsedControlled = collapsed !== undefined/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /const isPersistentExpanded = isCollapsedControlled/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /\? !collapsed/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /: expansion === "expanded"/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /collapsed=\{!isPersistentExpanded\}/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /isEmbedded: isHovered \|\| isPinnedPreview \|\| isPersistentExpanded/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /const previousCollapsedRef = useRef\(collapsed\)/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /if \(collapsed\) \{\s*setExpansion\("gutter"\)/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /collapsedPresentation=\{isEmbedded \? "column" : "gutter"\}/u);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/from "\.\.\/lib\/in-flow-agent-session-column-geometry"/u,
	);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/width: isEmbedded \? resolveInFlowAgentSessionColumnGapPx\(columnFrame\) : 0/u,
	);
	assert.match(IN_FLOW_GEOMETRY_SOURCE, /IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX = 24/u);
	assert.match(
		IN_FLOW_GEOMETRY_SOURCE,
		/IN_FLOW_AGENT_SESSION_COLUMN_SURFACE_LEADING_BORDER_PX = 2/u,
	);
	assert.match(IN_FLOW_COLUMN_SOURCE, /width: isEmbedded \? columnWidthPx : 0/u);
	const pointerEnterSource = IN_FLOW_COLUMN_SOURCE.match(
		/const handlePointerEnter = \([\s\S]*?\n\t\};/u,
	)?.[0] ?? "";
	assert.doesNotMatch(pointerEnterSource, /onCollapsedChange/u);
});

test("touch can intentionally expand the otherwise pointer-inert gutter", () => {
	assert.match(IN_FLOW_COLUMN_SOURCE, /const handleGutterPointerDown = \(event: PointerEvent<HTMLDivElement>\)/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /if \(event\.pointerType !== "touch"\)/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /event\.preventDefault\(\)/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /handleCollapsedChange\(false\)/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /onPointerDown=\{handleGutterPointerDown\}/u);
});

test("gutter rest keeps the overlay and rail visually transparent", () => {
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/className="absolute inset-y-0 start-0 z-30"/u,
	);
	assert.doesNotMatch(
		IN_FLOW_COLUMN_SOURCE,
		/className="absolute inset-y-0 start-0 z-30 bg-surface"/u,
	);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/isEmbedded[\s\S]{0,100}?\? "pointer-events-auto bg-surface"[\s\S]{0,140}?: "pointer-events-none bg-transparent \[&_\[data-agent-session-notch\]\]:pointer-events-auto"/u,
	);
	assert.doesNotMatch(
		IN_FLOW_COLUMN_SOURCE,
		/"group\/in-flow-agent-session-column[^"]*bg-surface"/u,
	);
});

test("underlap paints a solid 24px surface gutter fill with no fade", () => {
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /ScrollMaskEdgeOverlay/u);
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /@\/components\/visual\/scroll-mask/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /useInFlowGutterScrollMask\(hostRef\)/u);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/className="pointer-events-none absolute inset-y-0 start-0 z-40 bg-surface"[\s\S]*?data-agent-session-column-gutter-fill=""[\s\S]*?width: IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX/u,
	);
	assert.match(IN_FLOW_COLUMN_SOURCE, /ref=\{hostRef\}/u);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/className="relative z-30 flex min-h-0 shrink-0 self-stretch"/u,
	);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/data-agent-session-column-hit-area=""[\s\S]*?showGutterScrollMask \? \(/u,
	);
	assert.match(IN_FLOW_GEOMETRY_SOURCE, /export const IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX = 24/u);
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /data-agent-session-column-gutter-mask=/u);
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /bg-white/u);
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /fadeSize/u);
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /linear-gradient/u);
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /mask-image/u);
	assert.equal(
		IN_FLOW_COLUMN_SOURCE.match(/data-agent-session-column-gutter-fill=""/gu)?.length,
		1,
	);
	assert.doesNotMatch(
		IN_FLOW_COLUMN_SOURCE,
		/className="absolute inset-y-0 start-0 z-30 bg-surface"/u,
	);
});

test("the entire visible gutter is a hover target without covering To do", () => {
	assert.match(IN_FLOW_COLUMN_SOURCE, /data-agent-session-column-hit-area=""/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /absolute inset-y-0 start-0 z-30/u);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/width: IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX\s*\+ IN_FLOW_AGENT_SESSION_COLUMN_SURFACE_LEADING_BORDER_PX/u,
	);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/onPointerDown=\{isEmbedded \? undefined : handleGutterPointerDown\}\s*onPointerEnter=\{handlePointerEnter\}\s*onPointerLeave=\{handlePointerLeave\}/u,
	);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/isEmbedded[\s\S]{0,100}?\? "pointer-events-auto bg-surface"[\s\S]{0,140}?: "pointer-events-none bg-transparent \[&_\[data-agent-session-notch\]\]:pointer-events-auto"/u,
	);
	assert.doesNotMatch(
		IN_FLOW_COLUMN_SOURCE,
		/className="absolute inset-y-0 start-0 z-30 bg-surface"/u,
	);
	assert.match(RAIL_SOURCE, /className="group\/notch flex h-6 w-full shrink-0 items-center"/u);
	assert.match(
		RAIL_SOURCE,
		/className="flex h-6 shrink-0 items-center justify-center[\s\S]{0,120}?data-agent-session-notch=""/u,
	);
});

test("the gutter hides the count", () => {
	assert.match(TYPES_SOURCE, /collapsedPresentation\?: "column" \| "gutter";/u);
	assert.match(INDEX_SOURCE, /const isGutterCollapsed = collapsed && collapsedPresentation === "gutter"/u);
	assert.doesNotMatch(INDEX_SOURCE, /isGutterCollapsed \? "justify-center" : null/u);
	assert.match(INDEX_SOURCE, /const hideGutterCount = isGutterCollapsed/u);
	assert.match(INDEX_SOURCE, /hideGutterCount \? "opacity-0" : "opacity-100"/u);
	assert.match(INDEX_SOURCE, /style=\{resolveCollapsedHeaderStyle\(layout\)\}/u);
	assert.match(INDEX_SOURCE, /header: collapsed \? collapsedHeader : expandedHeader/u);
	assert.doesNotMatch(INDEX_SOURCE, /const gutterHeader = \(/u);
	assert.match(INDEX_SOURCE, /isGutterCollapsed \? "bg-transparent" : null/u);
});

test("flyouts stay suspended in the gutter and open once the compact rail is embedded", () => {
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /isEmbeddingTransition/u);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/JiraSessionFlyoutSuspensionProvider[\s\S]{0,120}?suspended=\{sessionFlyoutsSuspended \|\| !isEmbedded\}/u,
	);
	assert.doesNotMatch(
		IN_FLOW_COLUMN_SOURCE,
		/isHovered && !isPersistentExpanded/u,
	);
	assert.match(IN_FLOW_COLUMN_SOURCE, /collapsedPresentation=\{isEmbedded \? "column" : "gutter"\}/u);
});

test("gutter rest caps the rail; hover preview and column presentation show every notch", () => {
	assert.match(
		INDEX_SOURCE,
		/maxVisibleItems=\{isGutterCollapsed && collapsedRailHitSlopPx === 0\s*\? AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS\s*: undefined\}/u,
	);
});

test("the tucked gutter hides the session total; hover preview shows collapsed header chrome", () => {
	assert.match(
		INDEX_SOURCE,
		/const hideGutterCount = isGutterCollapsed/u,
	);
	assert.match(
		INDEX_SOURCE,
		/className=\{isGutterCollapsed \? HEADER_CONTROL_IN_GUTTER : HEADER_CONTROL_ON_REVEAL\}/u,
	);
	assert.match(INDEX_SOURCE, /const HEADER_CONTROL_IN_GUTTER = cn\(\s*HEADER_CONTROL_ON_REVEAL,\s*"hover:opacity-0",\s*\)/u);
	assert.match(INDEX_SOURCE, /<TextMorphing\s+config=\{HEAD_COUNT_MORPH\}/u);
	assert.match(INDEX_SOURCE, /text=\{String\(sessionCount\)\}/u);
	assert.doesNotMatch(INDEX_SOURCE, /`\+\$\{newCount\}`/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /collapsedPresentation=\{isEmbedded \? "column" : "gutter"\}/u);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/collapsedRailHitSlopPx=\{isEmbedded && !isPersistentExpanded\s*\? IN_FLOW_AGENT_SESSION_COLUMN_RAIL_HIT_SLOP_PX\s*: 0\}/u,
	);
	assert.match(INDEX_SOURCE, /data-agent-session-column-count=""/u);
	assert.match(
		INDEX_SOURCE,
		/toAgentSessionRailHitSlopStyle\(collapsedRailHitSlopPx\)/u,
	);
	assert.match(
		RAIL_SOURCE,
		/toAgentSessionRailHitSlopStyle\(hitSlopPx\)/u,
	);
});

test("the gutter preview moves into the old in-flow inset with Motion", () => {
	assert.match(IN_FLOW_COLUMN_SOURCE, /import \{ motion, useReducedMotion, type Variants \} from "motion\/react";/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /<motion\.div/u);
	assert.match(IN_FLOW_GEOMETRY_SOURCE, /IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX = 24/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /IN_FLOW_AGENT_SESSION_COLUMN_GUTTER_OFFSET_PX = -5/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /animate=\{isEmbedded \? "embedded" : "gutter"\}/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /transform: `translateX\(\$\{IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX\}px\)`/u);
	assert.match(IN_FLOW_COLUMN_SOURCE, /willChange: shouldReduceMotion \? undefined : "transform"/u);
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /animate=\{\{ width:/u);
});

test("Board visible cards and List share the header's 24px leading alignment", () => {
	assert.match(EXPERIMENTAL_HEADER_SOURCE, /flex-wrap items-center gap-2 px-6/u);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/const columnRowPaddingInlineStart = chrome\.dropContentPadding\s*\?\s*`calc\(\$\{token\("space\.300"\)\} - 2px - \$\{chrome\.dropContentPadding\.paddingInline\}\)`\s*:\s*token\("space\.300"\)/u,
	);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/className="flex min-h-full w-max min-w-full items-stretch"\s*style=\{\{ paddingInlineStart: resolvedColumnRowPaddingInlineStart \}\}/u,
	);
	assert.doesNotMatch(
		EXPERIMENTAL_BOARD_SOURCE,
		/"flex min-h-full w-max min-w-full items-stretch ps-6"/u,
	);
	assert.match(
		JIRA_PROJECT_SOURCE,
		/"min-h-0 flex-1 overflow-hidden pb-4 ps-6 md:pb-5"/u,
	);
	assert.match(IN_FLOW_GEOMETRY_SOURCE, /IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX = 24/u);
});

test("a collapsed first status column clears the fixed Untracked gutter without moving it", () => {
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/import \{[\s\S]*resolveBoardColumnRowPaddingInlineStart,[\s\S]*\} from "\.\/lib\/board-column-collapse";/u,
	);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/const resolvedColumnRowPaddingInlineStart = resolveBoardColumnRowPaddingInlineStart\(columnRowPaddingInlineStart, boardColumns\[0\]\?\.title, Boolean\(chrome\.dropContentPadding\), collapsedColumns\);/u,
	);
	assert.match(IN_FLOW_COLUMN_SOURCE, /absolute inset-y-0 start-0 z-40/u);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/style=\{\{\s*width: IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX\s*\+ IN_FLOW_AGENT_SESSION_COLUMN_SURFACE_LEADING_BORDER_PX,/u,
	);
});

test("Board and List give the in-flow column identical geometry props", () => {
	const inFlowColumn = EXPERIMENTAL_PAGE_SOURCE.match(
		/<InFlowAgentSessionColumn[\s\S]*?\/>/u,
	)?.[0] ?? "";

	assert.match(
		inFlowColumn,
		/paddingTop=\{withKanbanDropContentGutter\(0, columnChromeStyles\)\.paddingTop\}/u,
	);
	assert.doesNotMatch(inFlowColumn, /isListContent/u);
});

test("the first collapsed gutter mount plays a reduced-motion-safe staggered scale wave", () => {
	assert.match(
		RAIL_SOURCE,
		/AGENT_SESSION_GUTTER_INTRO_VARIANTS[\s\S]*rest: \{ opacity: 1, transform: "scale\(1\)" \}[\s\S]*opacity: \[0, 1\],[\s\S]*transform: \["scale\(3\)", "scale\(1\)"\]/u,
	);
	assert.match(RAIL_SOURCE, /AGENT_SESSION_GUTTER_INTRO_LEAD_DELAY_SECONDS = 0\.6/u);
	assert.match(RAIL_SOURCE, /board's longest surrounding motion window \(duration-slowest\)/u);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/JIRA_KANBAN_CARD_MOVE: Transition = \{ duration: 0\.6, ease: \[0\.4, 0, 0, 1\] \}/u,
	);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/initial=\{isGapArriving && !shouldReduceMotion \? \{ opacity: 0, y: 8 \} : false\}/u,
	);
	assert.match(RAIL_SOURCE, /AGENT_SESSION_GUTTER_INTRO_VISUAL_DURATION_SECONDS = 0\.3/u);
	assert.match(RAIL_SOURCE, /AGENT_SESSION_GUTTER_INTRO_STAGGER_SECONDS = 0\.04/u);
	assert.match(RAIL_SOURCE, /overlap each 300ms visual settle by 260ms/u);
	assert.match(
		RAIL_SOURCE,
		/delay: AGENT_SESSION_GUTTER_INTRO_LEAD_DELAY_SECONDS\s*\+ index \* AGENT_SESSION_GUTTER_INTRO_STAGGER_SECONDS/u,
	);
	assert.match(
		RAIL_SOURCE,
		/bounce: 0,[\s\S]*type: "spring",[\s\S]*visualDuration: AGENT_SESSION_GUTTER_INTRO_VISUAL_DURATION_SECONDS/u,
	);
	assert.match(RAIL_SOURCE, /"size-1 rounded-full/u);
	assert.match(
		RAIL_SOURCE,
		/toAgentSessionUserNotchDiameter\(value\) \/ AGENT_SESSION_USER_NOTCH_DIAMETER\.rest/u,
	);
	assert.match(RAIL_SOURCE, /const shouldPlayIntro = play && shouldReduceMotion === false/u);
	assert.match(
		RAIL_SOURCE,
		/if \(shouldReduceMotion === null\) \{\s*animationState = undefined;\s*\} else if \(shouldPlayIntro\) \{\s*animationState = "wave";\s*\} else \{\s*animationState = "rest";\s*\}/u,
	);
	assert.match(
		RAIL_SOURCE,
		/animate=\{animationState\}[\s\S]*opacity-0 motion-reduce:opacity-100[\s\S]*custom=\{index\}[\s\S]*initial=\{false\}/u,
	);
	assert.match(RAIL_SOURCE, /willChange: shouldPlayIntro \? "opacity, transform" : undefined/u);
	assert.match(
		RAIL_SOURCE,
		/<AgentSessionGutterIntro[\s\S]{0,200}?<motion\.span[\s\S]{0,200}?aria-hidden="true"/u,
	);
	assert.match(
		RAIL_SOURCE,
		/notchShape === "line"[\s\S]{0,300}?<AgentSessionNotchMark[\s\S]{0,300}?: \(\s*<AgentSessionUserNotch/u,
	);
	assert.match(
		RAIL_SOURCE,
		/onIntroComplete=\{index === items\.length - 1\s*\?\s*onIntroComplete\s*:\s*undefined\}/u,
	);
	assert.match(
		INDEX_SOURCE,
		/playIntro=\{isGutterCollapsed \? playGutterIntro : false\}/u,
	);
});

test("the in-flow host arms the gutter intro once without keying it to Board or List", () => {
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/const \[playGutterIntro, setPlayGutterIntro\] = useState\(true\)/u,
	);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/useEffect\(\(\) => \{\s*if \(shouldReduceMotion\) \{\s*setPlayGutterIntro\(false\);\s*\}\s*\}, \[shouldReduceMotion\]\)/u,
	);
	assert.match(
		IN_FLOW_COLUMN_SOURCE,
		/onGutterIntroComplete=\{\(\) => setPlayGutterIntro\(false\)\}/u,
	);
	assert.match(IN_FLOW_COLUMN_SOURCE, /playGutterIntro=\{playGutterIntro\}/u);
	assert.doesNotMatch(IN_FLOW_COLUMN_SOURCE, /activeView/u);
});
