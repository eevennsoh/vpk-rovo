const test = require("node:test");
const assert = require("node:assert/strict");

const {
	normalizeSmartGenerationProvider,
	buildSmartGenerationGatewayOptions,
} = require("./smart-generation-gateway-options");

test("normalizeSmartGenerationProvider returns non-empty string values", () => {
	assert.equal(normalizeSmartGenerationProvider("openai"), "openai");
	assert.equal(normalizeSmartGenerationProvider("  anthropic  "), "anthropic");
	assert.equal(normalizeSmartGenerationProvider(""), undefined);
	assert.equal(normalizeSmartGenerationProvider("   "), undefined);
	assert.equal(normalizeSmartGenerationProvider(null), undefined);
});

test("buildSmartGenerationGatewayOptions forwards provider and signal", () => {
	const controller = new AbortController();
	const options = buildSmartGenerationGatewayOptions({
		provider: "google",
		signal: controller.signal,
	});

	assert.equal(options.provider, "google");
	assert.equal(options.signal, controller.signal);
});

test("buildSmartGenerationGatewayOptions omits invalid values", () => {
	const options = buildSmartGenerationGatewayOptions({
		provider: "   ",
	});

	assert.deepEqual(options, {});
});
