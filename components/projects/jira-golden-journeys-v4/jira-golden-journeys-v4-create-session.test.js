const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(relativePath) {
	return readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

const PAGE_SOURCE = readProjectFile("components/projects/jira-golden-journeys-v4/page.tsx");
const EXPERIMENTAL_PAGE_SOURCE = [
	readProjectFile("components/blocks/jira-kanban/experimental/page.tsx"),
	readProjectFile("components/blocks/jira-kanban/experimental/experimental-page-types.ts"),
].join("\n");
const EXPERIMENTAL_BOARD_SOURCE = [
	readProjectFile("components/blocks/jira-kanban/experimental/experimental-jira-kanban.tsx"),
	readProjectFile("components/blocks/jira-kanban/experimental/components/board-column-card-list.tsx"),
].join("\n");
const ARRIVAL_HOOK_SOURCE = readProjectFile(
	"components/blocks/jira-kanban/experimental/hooks/use-created-card-arrival.ts",
);
const ARRIVAL_MOTION_SOURCE = [
	readProjectFile("components/blocks/jira-kanban/experimental/lib/card-motion.ts"),
	readProjectFile("components/blocks/jira-kanban/experimental/components/created-card-arrival-motion.tsx"),
].join("\n");

test("board session creation is route-owned and reveals the created cards once", () => {
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/onBoardAgentSessionCreate\?: \(\s*session: AgentSessionItem,\s*columnTitle: string,[\s\S]*?insertAtIndex\?: number,\s*\) => string \| undefined;/u,
	);
	assert.match(
		PAGE_SOURCE,
		/const handleBoardAgentSessionCreate = useCallback\([\s\S]*consumeDetachedAgentSession\(session\)[\s\S]*createBoardFromAgentSession\(\{\s*activity,\s*columnTitle,\s*insertAtIndex,\s*session,\s*\}\)/u,
	);
	assert.match(PAGE_SOURCE, /onBoardAgentSessionCreate=\{handleBoardAgentSessionCreate\}/u);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/useBoardCreatedCardArrival\(\{\s*captureSession: agentSessionHandlers\.onCreateWorkItem,\s*onCreate: onBoardAgentSessionCreate,\s*\}\)/u,
	);
	assert.match(
		ARRIVAL_HOOK_SOURCE,
		/createdCardArrivalIdRef\.current \+= 1;[\s\S]*setCreatedCardArrival\(\(current\) => \([\s\S]*cardCodes: \[\.\.\.current\.cardCodes, cardCode\][\s\S]*cardCodes: \[cardCode\]/u,
	);
	assert.match(
		EXPERIMENTAL_PAGE_SOURCE,
		/<ExperimentalJiraKanban[\s\S]*createdCardArrival=\{createdCardArrival \?\? undefined\}[\s\S]*onCreatedCardArrivalComplete=\{handleCreatedCardArrivalComplete\}/u,
	);
	assert.match(
		ARRIVAL_HOOK_SOURCE,
		/setCreatedCardArrival\(\(current\) => current\?\.id === arrivalId \? null : current\)/u,
	);
});

test("the created-card arrival scrolls its column to the last card's bottom and uses reduced-motion-safe Motion", () => {
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/useCreatedCardArrivalScroll\(\{[\s\S]*arrival: createdCardArrival,[\s\S]*cardCount: count,[\s\S]*onCardListRef: ref,[\s\S]*title: columnTitle,/u,
	);
	assert.match(
		ARRIVAL_HOOK_SOURCE,
		/useLayoutEffect\(\(\) => \{[\s\S]*arrivedCards\.length < arrival\.cardCodes\.length[\s\S]*subscribeCreatedCardBottomReveal\(cardList, arrivedCards\)/u,
	);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/<CreatedCardArrivalMotion[\s\S]*arrival=\{createdCardArrival\?\.columnTitle === column\.title[\s\S]*cardCode=\{card\.code\}/u,
	);
	assert.match(ARRIVAL_MOTION_SOURCE, /isGapArriving[\s\S]*\{ opacity: 1, y: 0 \}/u);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/initial=\{isGapArriving && !shouldReduceMotion \? \{ opacity: 0, y: 8 \} : false\}/u,
	);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/const JIRA_KANBAN_CARD_ARRIVE_REDUCED: Transition = \{ duration: 0 \};[\s\S]*shouldReduceMotion[\s\S]*JIRA_KANBAN_CARD_ARRIVE_REDUCED[\s\S]*JIRA_KANBAN_CARD_ARRIVE/u,
	);
});

test("create-well drops reuse the jira-create entrance instead of a slide and grey-first backdrop", () => {
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/import \{ JiraCreateEntrance \} from "@\/components\/blocks\/jira-create\/components\/jira-create-entrance"/u,
	);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/import \{ getJiraCreateArrivalDelayS \} from "@\/components\/blocks\/jira-create\/lib\/jira-create-motion"/u,
	);
	assert.match(ARRIVAL_MOTION_SOURCE, /return arriving && arrival\?\.appended === true/u);
	assert.match(ARRIVAL_MOTION_SOURCE, /<JiraCreateEntrance[\s\S]*enterDelayS=\{createDelayS\}/u);
	assert.match(ARRIVAL_MOTION_SOURCE, /data-jira-create-well-arrival=\{isCreateWellArrival \|\| undefined\}/u);
	assert.doesNotMatch(
		ARRIVAL_MOTION_SOURCE,
		/isCreateWellArrival && "\[&_\[data-slot=jira-issue-agent-backdrop\]\]:bg-bg-accent-blue-subtlest"/u,
	);
});

test("gap arrivals still hold a blue agent backdrop before returning to grey", () => {
	assert.match(
		ARRIVAL_HOOK_SOURCE,
		/const JIRA_KANBAN_CREATED_CARD_BACKDROP_HOLD_MS = 600; \/\/ duration-slowest/u,
	);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/\[&_\[data-slot=jira-issue-agent-backdrop\]\]:transition-colors[\s\S]*\[&_\[data-slot=jira-issue-agent-backdrop\]\]:duration-normal[\s\S]*\[&_\[data-slot=jira-issue-agent-backdrop\]\]:ease-out-practical/u,
	);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/isGapArriving && "\[&_\[data-slot=jira-issue-agent-backdrop\]\]:bg-bg-accent-blue-subtlest"/u,
	);
	assert.match(
		ARRIVAL_MOTION_SOURCE,
		/motion-reduce:\[&_\[data-slot=jira-issue-agent-backdrop\]\]:transition-none[\s\S]*data-created-card-backdrop=\{isGapArriving \|\| undefined\}/u,
	);
	assert.match(ARRIVAL_HOOK_SOURCE, /if \(holdMs <= 0\) \{\s*onComplete\?\.\(arrivalId\);\s*return;/u);
	assert.match(
		EXPERIMENTAL_BOARD_SOURCE,
		/useCreatedCardArrivalCompletion\(\s*onCreatedCardArrivalComplete,\s*createdCardArrival\?\.appended \? 0 : undefined,/u,
	);
	assert.match(ARRIVAL_HOOK_SOURCE, /window\.clearTimeout\(holdTimeoutRef\.current\)/u);
});
