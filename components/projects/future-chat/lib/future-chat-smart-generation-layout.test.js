const assert = require("node:assert/strict");
const test = require("node:test");

const {
	getFutureChatSmartGenerationLayoutContext,
	getFutureChatSmartWidthClass,
} = require("./future-chat-smart-generation-layout.ts");

test("getFutureChatSmartWidthClass uses the shared smart-generation breakpoints", () => {
	assert.equal(getFutureChatSmartWidthClass(520), "compact");
	assert.equal(getFutureChatSmartWidthClass(521), "regular");
	assert.equal(getFutureChatSmartWidthClass(900), "regular");
	assert.equal(getFutureChatSmartWidthClass(901), "wide");
});

test("getFutureChatSmartGenerationLayoutContext prefers shell width for width class", () => {
	assert.deepEqual(
		getFutureChatSmartGenerationLayoutContext({
			shellWidth: 480,
			viewportWidth: 1440,
		}),
		{
			containerWidthPx: 480,
			viewportWidthPx: 1440,
			widthClass: "compact",
		},
	);
});

test("getFutureChatSmartGenerationLayoutContext falls back to viewport width", () => {
	assert.deepEqual(
		getFutureChatSmartGenerationLayoutContext({
			shellWidth: null,
			viewportWidth: 840,
		}),
		{
			containerWidthPx: undefined,
			viewportWidthPx: 840,
			widthClass: "regular",
		},
	);
});

test("getFutureChatSmartGenerationLayoutContext omits invalid dimensions", () => {
	assert.deepEqual(
		getFutureChatSmartGenerationLayoutContext({
			shellWidth: 0,
			viewportWidth: NaN,
		}),
		{
			containerWidthPx: undefined,
			viewportWidthPx: undefined,
			widthClass: undefined,
		},
	);
});
