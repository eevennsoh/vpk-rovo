const AI_GATEWAY_ASSISTED_FEATURE_USE_CASES = [
	"image",
	"sound",
	"suggestions",
]

function buildLlmRoutingStatus({
	rovoDevAvailable,
	aiGatewayConfigured,
} = {}) {
	const canDelegateRichTurnsToRovoDev = rovoDevAvailable === true

	return {
		rovoDevAvailable: canDelegateRichTurnsToRovoDev,
		aiGatewayConfigured: aiGatewayConfigured === true,
		chatSdk: {
			backend: "ai-gateway",
			requiresRovoDev: false,
			aiGatewayConfigured: aiGatewayConfigured === true,
		},
		richToolTurns: {
			backend: canDelegateRichTurnsToRovoDev ? "rovodev" : "ai-gateway",
			requiresRovoDev: false,
		},
		aiGatewayAssistedFeatures: {
			configured: aiGatewayConfigured === true,
			useCases: [...AI_GATEWAY_ASSISTED_FEATURE_USE_CASES],
		},
	}
}

function describeChatBackend(llmRoutingStatus) {
	if (llmRoutingStatus?.chatSdk?.backend === "ai-gateway") {
		return llmRoutingStatus.chatSdk.aiGatewayConfigured
			? "AI Gateway"
			: "AI Gateway (not configured)"
	}

	return "Unknown"
}

module.exports = {
	AI_GATEWAY_ASSISTED_FEATURE_USE_CASES,
	buildLlmRoutingStatus,
	describeChatBackend,
}
