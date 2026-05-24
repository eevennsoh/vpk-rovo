const test = require("node:test")
const assert = require("node:assert/strict")

const {
	AI_GATEWAY_ASSISTED_FEATURE_USE_CASES,
	buildLlmRoutingStatus,
	describeChatBackend,
} = require("./llm-routing-status")

test("llm routing status reports AI Gateway as the default Chat SDK backend", () => {
	const routingStatus = buildLlmRoutingStatus({
		rovoAvailable: true,
		aiGatewayConfigured: true,
	})

	assert.equal(routingStatus.chatSdk.backend, "ai-gateway")
	assert.equal(routingStatus.chatSdk.requiresRovo, false)
	assert.equal(routingStatus.chatSdk.aiGatewayConfigured, true)
	assert.equal(routingStatus.richToolTurns.backend, "rovo")
	assert.equal(routingStatus.richToolTurns.requiresRovo, false)
	assert.deepEqual(routingStatus.aiGatewayAssistedFeatures.useCases, [
		...AI_GATEWAY_ASSISTED_FEATURE_USE_CASES,
	])
	assert.equal(describeChatBackend(routingStatus), "AI Gateway")
})

test("llm routing status keeps rich turns on AI Gateway when Rovo is absent", () => {
	const routingStatus = buildLlmRoutingStatus({
		rovoAvailable: false,
		aiGatewayConfigured: true,
	})

	assert.equal(routingStatus.chatSdk.backend, "ai-gateway")
	assert.equal(routingStatus.chatSdk.requiresRovo, false)
	assert.equal(routingStatus.richToolTurns.backend, "ai-gateway")
	assert.equal(routingStatus.richToolTurns.requiresRovo, false)
	assert.equal(routingStatus.aiGatewayAssistedFeatures.configured, true)
	assert.equal(describeChatBackend(routingStatus), "AI Gateway")
})

test("llm routing status surfaces missing AI Gateway configuration", () => {
	const routingStatus = buildLlmRoutingStatus({
		rovoAvailable: false,
		aiGatewayConfigured: false,
	})

	assert.equal(routingStatus.chatSdk.backend, "ai-gateway")
	assert.equal(routingStatus.chatSdk.aiGatewayConfigured, false)
	assert.equal(describeChatBackend(routingStatus), "AI Gateway (not configured)")
})
