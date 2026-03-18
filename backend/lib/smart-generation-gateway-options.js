function normalizeSmartGenerationProvider(value) {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function buildSmartGenerationGatewayOptions({
	provider,
	signal,
} = {}) {
	const normalizedProvider = normalizeSmartGenerationProvider(provider);
	const options = {};

	if (normalizedProvider !== undefined) {
		options.provider = normalizedProvider;
	}

	if (signal) {
		options.signal = signal;
	}

	return options;
}

module.exports = {
	normalizeSmartGenerationProvider,
	buildSmartGenerationGatewayOptions,
};
