const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const {
	IN_FLOW_GUTTER_MASK_WIDTH_PX,
	IN_FLOW_GUTTER_SCROLLPORT_SELECTOR,
	IN_FLOW_GUTTER_UNDERLAP_MIN_PX,
	IN_FLOW_GUTTER_UNDERLAP_SELECTOR,
	hasInFlowGutterUnderlap,
	rectsOverlapInFlowGutter,
	findInFlowGutterScrollport,
} = require("./in-flow-gutter-scroll-mask.ts");

const HOOK_SOURCE = readFileSync(
	join(__dirname, "use-in-flow-gutter-scroll-mask.ts"),
	"utf8",
);
const MASK_SOURCE = readFileSync(
	join(__dirname, "in-flow-gutter-scroll-mask.ts"),
	"utf8",
);
const COLUMN_SOURCE = readFileSync(
	join(__dirname, "in-flow-agent-session-column.tsx"),
	"utf8",
);

const GUTTER = { left: 320, right: 344, top: 200, bottom: 760 };

function scrollportFor(rects) {
	return {
		querySelectorAll() {
			return rects.map((rect) => ({
				getBoundingClientRect() {
					return rect;
				},
			}));
		},
	};
}

test("the gutter fill is 24px and ignores hairline chrome kisses", () => {
	assert.equal(IN_FLOW_GUTTER_MASK_WIDTH_PX, 24);
	assert.equal(IN_FLOW_GUTTER_UNDERLAP_MIN_PX, 8);
	assert.equal(GUTTER.right - GUTTER.left, 24);
});

test("the gutter fill stays off at rest and when nothing sits under the rail", () => {
	assert.equal(hasInFlowGutterUnderlap(null, scrollportFor([])), false);
	assert.equal(hasInFlowGutterUnderlap(GUTTER, null), false);
	assert.equal(hasInFlowGutterUnderlap(GUTTER, scrollportFor([])), false);
	assert.equal(
		hasInFlowGutterUnderlap(GUTTER, scrollportFor([
			{ left: 344, right: 612, top: 280, bottom: 400 },
		])),
		false,
	);
	assert.equal(
		hasInFlowGutterUnderlap(GUTTER, scrollportFor([
			{ left: 342, right: 610, top: 280, bottom: 400 },
		])),
		false,
	);
	assert.equal(
		rectsOverlapInFlowGutter(GUTTER, { left: 342, right: 610, top: 280, bottom: 400 }),
		false,
	);
});

test("the gutter fill turns on when cards or columns actually sit under the 24px strip", () => {
	assert.equal(
		hasInFlowGutterUnderlap(GUTTER, scrollportFor([
			{ left: 326, right: 594, top: 280, bottom: 436 },
		])),
		true,
	);
	assert.equal(
		hasInFlowGutterUnderlap(GUTTER, scrollportFor([
			{ left: 200, right: 400, top: 220, bottom: 500 },
		])),
		true,
	);
	assert.equal(
		hasInFlowGutterUnderlap(GUTTER, scrollportFor([
			{ left: 360, right: 628, top: 280, bottom: 400 },
		])),
		false,
	);
});

test("the gutter scan stops after the first overlapping painted row", () => {
	let geometryReads = 0;
	const firstOverlap = { left: 326, right: 594, top: 280, bottom: 436 };
	const outside = { left: 360, right: 628, top: 280, bottom: 436 };
	const elements = [firstOverlap, ...Array.from({ length: 19 }, () => outside)].map((rect) => ({
		getBoundingClientRect() {
			geometryReads += 1;
			return rect;
		},
	}));
	const scrollport = {
		querySelectorAll() {
			return elements;
		},
	};

	assert.equal(hasInFlowGutterUnderlap(GUTTER, scrollport), true);
	assert.equal(geometryReads, 1);
});

test("the gutter fill watches painted Board/List UI inside the existing scrollports", () => {
	assert.match(IN_FLOW_GUTTER_SCROLLPORT_SELECTOR, /data-jira-kanban-scrollport/u);
	assert.match(IN_FLOW_GUTTER_SCROLLPORT_SELECTOR, /jira-list-table-scroll/u);
	assert.match(IN_FLOW_GUTTER_UNDERLAP_SELECTOR, /article/u);
	assert.match(IN_FLOW_GUTTER_UNDERLAP_SELECTOR, /data-collapsed/u);
	assert.match(IN_FLOW_GUTTER_UNDERLAP_SELECTOR, /tbody tr/u);
	assert.doesNotMatch(IN_FLOW_GUTTER_UNDERLAP_SELECTOR, /data-jira-kanban-column/u);
	assert.match(HOOK_SOURCE, /findInFlowGutterScrollport\(host\)/u);
	assert.match(HOOK_SOURCE, /readInFlowGutterMaskRect\(host\)/u);
	assert.match(HOOK_SOURCE, /hasInFlowGutterUnderlap\([\s\S]*readInFlowGutterMaskRect\(host\),[\s\S]*scrollport,[\s\S]*\)/u);
	assert.match(HOOK_SOURCE, /scrollport\.addEventListener\("transitionend", syncMask\)/u);
	assert.match(HOOK_SOURCE, /scrollport\.removeEventListener\("transitionend", syncMask\)/u);
	assert.match(HOOK_SOURCE, /subtree: true/u);
	assert.doesNotMatch(HOOK_SOURCE, /applyInFlowGutterScrollportFade/u);
	assert.doesNotMatch(HOOK_SOURCE, /window\.addEventListener\("scroll"/u);
	assert.doesNotMatch(HOOK_SOURCE, /scrollLeft/u);
	assert.doesNotMatch(MASK_SOURCE, /applyInFlowGutterScrollportFade/u);
	assert.doesNotMatch(MASK_SOURCE, /maskImage/u);
	assert.match(MASK_SOURCE, /scope\.querySelector<HTMLElement>\(IN_FLOW_GUTTER_SCROLLPORT_SELECTOR\)/u);
	assert.equal(findInFlowGutterScrollport(null), null);
});

test("an active gutter paints only a solid 24px surface fill", () => {
	assert.match(
		COLUMN_SOURCE,
		/className="pointer-events-none absolute inset-y-0 start-0 z-40 bg-surface"[\s\S]*?data-agent-session-column-gutter-fill=""/u,
	);
	assert.match(
		COLUMN_SOURCE,
		/style=\{\{ width: IN_FLOW_AGENT_SESSION_COLUMN_INSET_PX \}\}/u,
	);
	assert.doesNotMatch(COLUMN_SOURCE, /ScrollMaskEdgeOverlay/u);
	assert.doesNotMatch(COLUMN_SOURCE, /data-agent-session-column-gutter-mask=/u);
	assert.doesNotMatch(COLUMN_SOURCE, /@\/components\/visual\/scroll-mask/u);
	assert.doesNotMatch(COLUMN_SOURCE, /bg-white/u);
	assert.doesNotMatch(COLUMN_SOURCE, /fadeSize/u);
	assert.doesNotMatch(COLUMN_SOURCE, /linear-gradient/u);
	assert.doesNotMatch(COLUMN_SOURCE, /mask-image/u);
	assert.equal(
		COLUMN_SOURCE.match(/data-agent-session-column-gutter-fill=""/gu)?.length,
		1,
	);
});
