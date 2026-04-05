const AI_GATEWAY_ASSISTED_FEATURE_USE_CASES = [
	"image",
	"sound",
	"suggestions",
]

function buildLlmRoutingStatus({
	rovoDevAvailable,
	aiGatewayConfigured,
} = {}) {
	return {
		rovoDevAvailable: rovoDevAvailable === true,
		aiGatewayConfigured: aiGatewayConfigured === true,
		chatSdk: {
			backend: rovoDevAvailable ? "rovodev" : "rovodev-required",
			requiresRovoDev: true,
		},
		aiGatewayAssistedFeatures: {
			configured: aiGatewayConfigured === true,
			useCases: [...AI_GATEWAY_ASSISTED_FEATURE_USE_CASES],
		},
	}
}

function describeChatBackend(llmRoutingStatus) {
	if (llmRoutingStatus?.chatSdk?.backend === "rovodev") {
		return "RovoDev Serve (agent loop)"
	}

	return "RovoDev required"
}

module.exports = {
	AI_GATEWAY_ASSISTED_FEATURE_USE_CASES,
	buildLlmRoutingStatus,
	describeChatBackend,
}
