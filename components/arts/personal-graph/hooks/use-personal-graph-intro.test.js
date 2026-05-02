const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getPersonalGraphIntroPhaseAt,
	PERSONAL_GRAPH_INTRO_TIMELINE,
} = require("./intro-phase.ts");

test("Personal Graph intro phase helper mirrors the visible reveal timeline", () => {
	assert.deepEqual(
		PERSONAL_GRAPH_INTRO_TIMELINE.map(({ phase, at }) => [phase, at]),
		[
			["title", 0],
			["subtext", 500],
			["controls", 900],
			["settle", 1700],
			["search", 2000],
			["graph", 2400],
			["done", 3700],
		],
	);

	assert.equal(getPersonalGraphIntroPhaseAt(0), "title");
	assert.equal(getPersonalGraphIntroPhaseAt(499), "title");
	assert.equal(getPersonalGraphIntroPhaseAt(500), "subtext");
	assert.equal(getPersonalGraphIntroPhaseAt(899), "subtext");
	assert.equal(getPersonalGraphIntroPhaseAt(900), "controls");
	assert.equal(getPersonalGraphIntroPhaseAt(1699), "controls");
	assert.equal(getPersonalGraphIntroPhaseAt(1700), "settle");
	assert.equal(getPersonalGraphIntroPhaseAt(1999), "settle");
	assert.equal(getPersonalGraphIntroPhaseAt(2000), "search");
	assert.equal(getPersonalGraphIntroPhaseAt(2399), "search");
	assert.equal(getPersonalGraphIntroPhaseAt(2400), "graph");
	assert.equal(getPersonalGraphIntroPhaseAt(3699), "graph");
	assert.equal(getPersonalGraphIntroPhaseAt(3700), "done");
});

test("Personal Graph intro reduced-motion users skip directly to the stable state", () => {
	assert.equal(getPersonalGraphIntroPhaseAt(0, true), "done");
	assert.equal(getPersonalGraphIntroPhaseAt(500, true), "done");
	assert.equal(getPersonalGraphIntroPhaseAt(3700, true), "done");
});
