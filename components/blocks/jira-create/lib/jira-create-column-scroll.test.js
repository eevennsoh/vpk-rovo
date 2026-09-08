const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

const {
	getCreatedCardRevealScrollTop,
	shouldReleaseCreatedCardFollow,
} = require("./jira-create-column-scroll.ts");

const HELPER_SOURCE = readFileSync(
	path.join(process.cwd(), "components/blocks/jira-create/lib/jira-create-column-scroll.ts"),
	"utf8",
);

const ARRIVAL_HOOK_SOURCE = readFileSync(
	path.join(
		process.cwd(),
		"components/blocks/jira-kanban/experimental/hooks/use-created-card-arrival.ts",
	),
	"utf8",
);
const CREATE_BOARD_SOURCE = readFileSync(
	path.join(process.cwd(), "components/blocks/jira-create/components/jira-create-board.tsx"),
	"utf8",
);
const CREATE_DEMO_SOURCE = readFileSync(
	path.join(process.cwd(), "components/blocks/jira-create/hooks/use-jira-create-demo.ts"),
	"utf8",
);

function reveal(partial) {
	return getCreatedCardRevealScrollTop({
		containerClientHeight: 400,
		containerScrollHeight: 1000,
		containerScrollTop: 0,
		targetHeight: 160,
		targetOffsetTop: 840,
		...partial,
	});
}

test("appended creates align the column to the last card's bottom, not its top", () => {
	// 840 + 160 = 1000. Viewport is 400, so the chin sits 600px under the fold
	// if we only showed the title at the top of the arriving group.
	assert.equal(reveal(), 600);
	assert.equal(
		reveal({ targetHeight: 240, targetOffsetTop: 760 }),
		600,
	);
});

test("a card taller than the column still pins to its bottom so the chin is visible", () => {
	assert.equal(
		reveal({
			containerClientHeight: 200,
			containerScrollHeight: 800,
			containerScrollTop: 0,
			targetHeight: 360,
			targetOffsetTop: 440,
		}),
		600,
	);
});

test("a fully visible arriving card does not yank an unrelated scroll position", () => {
	assert.equal(
		reveal({
			containerScrollTop: 500,
			targetHeight: 120,
			targetOffsetTop: 560,
		}),
		500,
	);
});

test("reveal scroll stays inside the column and never asks another container to move", () => {
	assert.equal(
		reveal({
			containerClientHeight: 400,
			containerScrollHeight: 500,
			containerScrollTop: 0,
			targetHeight: 160,
			targetOffsetTop: 340,
		}),
		100,
	);
	assert.equal(
		reveal({
			containerClientHeight: 400,
			containerScrollHeight: 360,
			containerScrollTop: 0,
			targetHeight: 80,
			targetOffsetTop: 280,
		}),
		0,
	);
});

test("column follow is instant so reduced motion still lands on the full card", () => {
	assert.match(HELPER_SOURCE, /behavior: "auto"/u);
	assert.doesNotMatch(HELPER_SOURCE, /behavior: "smooth"/u);
});

test("following releases only when the user scrolls up away from the create", () => {
	assert.equal(shouldReleaseCreatedCardFollow(600, 600), false);
	assert.equal(shouldReleaseCreatedCardFollow(600, 599), false);
	assert.equal(shouldReleaseCreatedCardFollow(600, 590), true);
	assert.equal(shouldReleaseCreatedCardFollow(600, 610), false);
});

test("create-well arrivals follow the last arriving card; gap drops do not subscribe", () => {
	assert.match(ARRIVAL_HOOK_SOURCE, /subscribeCreatedCardBottomReveal/u);
	assert.match(ARRIVAL_HOOK_SOURCE, /\|\| !arrival\.appended/u);
	assert.match(
		ARRIVAL_HOOK_SOURCE,
		/data-created-card-arrival-id="\$\{arrival\.id\}"/u,
	);
	assert.doesNotMatch(
		ARRIVAL_HOOK_SOURCE,
		/cardList\.scrollTo\(\{ behavior: "auto", top: cardList\.scrollHeight \}\)/u,
	);
});

test("the jira-create demo only follows Bottom inserts in its own column overflow", () => {
	assert.match(CREATE_DEMO_SOURCE, /position === "bottom"/u);
	assert.match(CREATE_DEMO_SOURCE, /revealItemIds/u);
	assert.match(CREATE_BOARD_SOURCE, /subscribeCreatedCardBottomReveal/u);
	assert.match(CREATE_BOARD_SOURCE, /overflow-y-auto/u);
	assert.match(
		readFileSync(
			path.join(process.cwd(), "components/blocks/jira-create/components/jira-create-entrance.tsx"),
			"utf8",
		),
		/shrink-0/u,
	);
	assert.match(CREATE_BOARD_SOURCE, /data-jira-create-column-list=""/u);
	assert.match(CREATE_BOARD_SOURCE, /itemId=\{item\.id\}/u);
	assert.match(CREATE_BOARD_SOURCE, /data-jira-create-item-id=\{item\.id\}/u);
});
