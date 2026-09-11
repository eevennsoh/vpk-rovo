const assert = require("node:assert/strict");
const test = require("node:test");

const {
	isHeadingIntoPopup,
} = require("../../utils/cone-safezone/geometry.ts");

const RIGHT_POPUP = { bottom: 160, left: 200, right: 320, top: 40 };

test("rail hover intent preserves a flyout while the pointer travels diagonally toward its right-side popup", () => {
	assert.equal(
		isHeadingIntoPopup({ x: 100, y: 100 }, { x: 150, y: 120 }, RIGHT_POPUP),
		true,
	);
});

test("rail hover intent rejects travel outside the popup cone so crossed rows can take over", () => {
	assert.equal(
		isHeadingIntoPopup({ x: 100, y: 100 }, { x: 150, y: 150 }, RIGHT_POPUP),
		false,
	);
});

test("rail hover intent supports a collision-resolved popup on the left of its trigger", () => {
	assert.equal(
		isHeadingIntoPopup(
			{ x: 300, y: 100 },
			{ x: 250, y: 100 },
			{ bottom: 150, left: 80, right: 200, top: 50 },
		),
		true,
	);
});

test("shared hover cone supports previews above and below a Smart Link", () => {
	assert.equal(isHeadingIntoPopup({ x: 100, y: 100 }, { x: 120, y: 150 }, {
		left: 40, right: 160, top: 200, bottom: 320,
	}, "bottom"), true);
	assert.equal(isHeadingIntoPopup({ x: 100, y: 300 }, { x: 120, y: 250 }, {
		left: 40, right: 160, top: 80, bottom: 200,
	}, "top"), true);
});

test("shared hover cone rejects reversal, travel beyond the popup edge, and zero distance", () => {
	for (const point of [{ x: 90, y: 100 }, { x: 210, y: 100 }]) {
		assert.equal(isHeadingIntoPopup({ x: 100, y: 100 }, point, RIGHT_POPUP), false);
	}
	assert.equal(isHeadingIntoPopup({ x: 200, y: 100 }, { x: 200, y: 100 }, RIGHT_POPUP, "right"), false);
});
