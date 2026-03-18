function normalizeSmartGenerationProvider(value) {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeSmartGenerationPortIndex(value) {
	if (typeof value === "number" && Number.isInteger(value) && value >= 0) {
		return value;
	}

	return undefined;
}

function buildSmartGenerationGatewayOptions({
	provider,
	portIndex,
	signal,
} = {}) {
	const normalizedProvider = normalizeSmartGenerationProvider(provider);
	const normalizedPortIndex = normalizeSmartGenerationPortIndex(portIndex);
	const options = {};

	if (normalizedProvider !== undefined) {
		options.provider = normalizedProvider;
	}

	if (normalizedPortIndex !== undefined) {
		options.portIndex = normalizedPortIndex;
	}

	if (signal) {
		options.signal = signal;
	}

	return options;
}

module.exports = {
	normalizeSmartGenerationProvider,
	normalizeSmartGenerationPortIndex,
	buildSmartGenerationGatewayOptions,
};
