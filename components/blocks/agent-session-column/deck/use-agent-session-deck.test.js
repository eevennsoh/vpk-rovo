const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const hookPath = path.join(
	process.cwd(),
	"components/blocks/agent-session-column/deck/use-agent-session-deck.ts",
);

test("the deck hook does not store scroll in React state", () => {
	const source = fs.readFileSync(hookPath, "utf8");

	assert.match(source, /measureAgentSessionDeck/u);
	assert.match(source, /writeMeasuredAgentSessionDeck/u);
	assert.match(
		source,
		/const onScroll = \(\) => \{\s*paint\(\);/u,
		"scroll must paint from cached rows in the same turn, not remeasure on rAF",
	);
	assert.doesNotMatch(
		source,
		/const onScroll = \(\) => \{\s*remeasure/u,
		"scroll must not remeasure layout",
	);
	assert.doesNotMatch(
		source,
		/setScroll|setCollapse|useState\(.*scroll/u,
		"scroll and collapse must stay off the React render path",
	);
	assert.match(
		source,
		/useState<HTMLElement \| null>\(null\)/u,
		"the only state is the committed scrollport, so observers can subscribe",
	);
	assert.match(
		source,
		/onComplete: \(\) => \{[\s\S]*?willChange\.set\("auto"\);[\s\S]*?remeasure\(\);/u,
		"entrance completion must remeasure; expand width may still have been settling",
	);
	assert.match(
		source,
		/if \(port === null\)[\s\S]*subscribeToAgentSessionDeckScrollActivity\(port\)[\s\S]*if \(!active\) \{\s*clearAgentSessionDeck\(port\);\s*return unsubscribeScrollActivity;/u,
		"flat columns must still publish scroll activity for the auto-hiding scrollbar",
	);
	assert.equal(
		(source.match(/clearAgentSessionDeck\(port\)/gu) ?? []).length,
		2,
		"disabling or cleaning up the deck must remove every inline deck style",
	);
	assert.match(
		source,
		/resizeObserver\?\.observe\(port\);[\s\S]*closest\("\[data-agent-session-column\]"\)/u,
		"must remeasure while the column width transition runs, not only when the port box changes",
	);
});
