import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { AGENT_SESSION_RAIL_FOCUS_GUTTER_PX, AGENT_SESSION_RAIL_ITEM_GAP_PX, AGENT_SESSION_RAIL_ITEM_HEIGHT_PX, AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS, toAgentSessionRailHitSlopStyle, toAgentSessionRailViewportMaxHeight } from "./agent-session-column-rail-viewport.ts";

const TEN_ITEM_HEIGHT = AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS * AGENT_SESSION_RAIL_ITEM_HEIGHT_PX
	+ (AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS - 1) * AGENT_SESSION_RAIL_ITEM_GAP_PX
	+ AGENT_SESSION_RAIL_FOCUS_GUTTER_PX;

test("the gutter rail caps its viewport at ten notches", () => {
	assert.equal(
		toAgentSessionRailViewportMaxHeight(3, AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS),
		3 * AGENT_SESSION_RAIL_ITEM_HEIGHT_PX
			+ 2 * AGENT_SESSION_RAIL_ITEM_GAP_PX
			+ AGENT_SESSION_RAIL_FOCUS_GUTTER_PX,
	);
	assert.equal(
		toAgentSessionRailViewportMaxHeight(10, AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS),
		TEN_ITEM_HEIGHT,
	);
	assert.equal(
		toAgentSessionRailViewportMaxHeight(16, AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS),
		TEN_ITEM_HEIGHT,
	);
	assert.equal(
		toAgentSessionRailViewportMaxHeight(0, AGENT_SESSION_RAIL_MAX_VISIBLE_ITEMS),
		0,
	);
});

test("the embedded column rail does not cap the viewport to ten notches", () => {
	assert.equal(toAgentSessionRailViewportMaxHeight(16, undefined), undefined);
	assert.equal(toAgentSessionRailViewportMaxHeight(0, undefined), undefined);
});

test("collapsed rail hit slop keeps the 32px column and grows a 24px target to 56px", () => {
	assert.deepEqual(toAgentSessionRailHitSlopStyle(16), {
		marginInline: -16,
		width: "calc(100% + 32px)",
	});
});
