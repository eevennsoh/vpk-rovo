const test = require("node:test")
const assert = require("node:assert/strict")

const {
	AI_GATEWAY_ASSISTED_FEATURE_USE_CASES,
	buildLlmRoutingStatus,
	describeChatBackend,
} = require("./llm-routing-status")

test("llm routing status reports RovoDev as the active Chat SDK backend", () => {
	const routingStatus = buildLlmRoutingStatus({
		rovoDevAvailable: true,
		aiGatewayConfigured: true,
	})

	assert.equal(routingStatus.chatSdk.backend, "rovodev")
	assert.equal(routingStatus.chatSdk.requiresRovoDev, true)
	assert.deepEqual(routingStatus.aiGatewayAssistedFeatures.useCases, [
		...AI_GATEWAY_ASSISTED_FEATURE_USE_CASES,
	])
	assert.equal(describeChatBackend(routingStatus), "RovoDev Serve (agent loop)")
})

test("llm routing status distinguishes Chat SDK routing from AI Gateway-assisted features", () => {
	const routingStatus = buildLlmRoutingStatus({
		rovoDevAvailable: false,
		aiGatewayConfigured: true,
	})

	assert.equal(routingStatus.chatSdk.backend, "rovodev-required")
	assert.equal(routingStatus.chatSdk.requiresRovoDev, true)
	assert.equal(routingStatus.aiGatewayAssistedFeatures.configured, true)
	assert.equal(describeChatBackend(routingStatus), "RovoDev required")
})
