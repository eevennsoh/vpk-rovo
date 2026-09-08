const assert = require("node:assert/strict");
const { test } = require("node:test");

const {
	appendRowFlash,
	JIRA_LIST_ROW_FLASH_HOLD_MS,
	NO_JIRA_LIST_ROW_FLASH,
} = require("./jira-list-row-flash.ts");

test("appendRowFlash replaces the flashing rows rather than accumulating them", () => {
	const first = appendRowFlash(NO_JIRA_LIST_ROW_FLASH, ["PAY-119", "PAY-120"]);
	const second = appendRowFlash(first, ["PAY-121"]);

	assert.deepEqual(first.issueKeys, ["PAY-119", "PAY-120"]);
	// A later drop must not relight the rows an earlier drop already
	// acknowledged, so each publish carries only its own batch.
	assert.deepEqual(second.issueKeys, ["PAY-121"]);
	assert.equal(second.token, first.token + 1);
});

test("appendRowFlash leaves the token alone when a drop acknowledged nothing", () => {
	const unchanged = appendRowFlash(NO_JIRA_LIST_ROW_FLASH, []);

	// The consumer restarts its animation on every token change, so an empty
	// batch must not look like a new drop.
	assert.equal(unchanged, NO_JIRA_LIST_ROW_FLASH);
	assert.equal(unchanged.token, NO_JIRA_LIST_ROW_FLASH.token);
});

test("the flash is held past the animation it drives", () => {
	const globals = require("node:fs").readFileSync(
		require("node:path").join(process.cwd(), "app/globals.css"),
		"utf8",
	);
	const durationSlowestMs = Number(
		/--duration-slowest:\s*(\d+)ms/u.exec(
			require("node:fs").readFileSync(
				require("node:path").join(process.cwd(), "app/tailwind-theme.css"),
				"utf8",
			),
		)?.[1],
	);

	assert.match(globals, /animation: jira-list-row-flash var\(--duration-slowest\)/u);
	assert.equal(Number.isFinite(durationSlowestMs), true);
	// Dropping the class mid-animation would cut the acknowledgement short.
	assert.ok(JIRA_LIST_ROW_FLASH_HOLD_MS > durationSlowestMs);
});
