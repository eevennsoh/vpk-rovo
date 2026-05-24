const AI_GATEWAY_ASSISTED_FEATURE_USE_CASES = [
	"image",
	"sound",
	"suggestions",
]

function buildLlmRoutingStatus({
	rovoAvailable,
	aiGatewayConfigured,
} = {}) {
	const canDelegateRichTurnsToRovo = rovoAvailable === true

	return {
		rovoAvailable: canDelegateRichTurnsToRovo,
		aiGatewayConfigured: aiGatewayConfigured === true,
		chatSdk: {
			backend: "ai-gateway",
			requiresRovo: false,
			aiGatewayConfigured: aiGatewayConfigured === true,
		},
		richToolTurns: {
			backend: canDelegateRichTurnsToRovo ? "rovo" : "ai-gateway",
			requiresRovo: false,
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
