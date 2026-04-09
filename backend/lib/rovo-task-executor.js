"use strict";

const { createAIGatewayProvider } = require("./ai-gateway-provider");
const { buildRovoAppHermesContextDescription } = require("./hermes-rovo-context");
const {
	WAIT_FOR_TURN_TIMEOUT_MS,
	generateTextViaRovoDev,
	isChatInProgressError,
} = require("./rovodev-gateway");
const { getNonEmptyString, parseMaybeJson } = require("./shared-utils");

const aiGatewayProvider = createAIGatewayProvider({ logger: console });

function buildCombinedSystemPrompt({ system, hermesContextDescription }) {
	return [system, hermesContextDescription]
		.map((value) => getNonEmptyString(value))
		.filter(Boolean)
		.join("\n\n") || undefined;
}

async function buildHermesContextDescription(selectedSkillIds) {
	try {
		return await buildRovoAppHermesContextDescription({ selectedSkillIds });
	} catch {
		return null;
	}
}

async function executeRovoTask({
	prompt,
	selectedSkillIds = [],
	signal,
	system,
	timeoutMs = WAIT_FOR_TURN_TIMEOUT_MS,
} = {}) {
	const normalizedPrompt = getNonEmptyString(prompt);
	if (!normalizedPrompt) {
		const error = new Error("Rovo task execution requires a prompt.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	const hermesContextDescription = await buildHermesContextDescription(selectedSkillIds);
	const text = await generateTextViaRovoDev({
		conflictPolicy: "wait-for-turn",
		prompt: normalizedPrompt,
		signal,
		system: buildCombinedSystemPrompt({
			system,
			hermesContextDescription,
		}),
		timeoutMs,
	});

	return {
		backend: "rovodev",
		hermesContextDescription,
		text: getNonEmptyString(text) ?? "",
	};
}

async function executeStructuredFallbackTask({
	prompt,
	signal,
	system,
	timeoutMs,
} = {}) {
	const text = await aiGatewayProvider.generateText({
		maxOutputTokens: 1000,
		prompt,
		signal,
		system,
		temperature: 0.1,
		timeoutMs,
	});

	return {
		backend: "ai-gateway",
		text: getNonEmptyString(text) ?? "",
	};
}

function parseStructuredJsonResponse(text) {
	const normalizedText = getNonEmptyString(text);
	if (!normalizedText) {
		return null;
	}

	const directPayload = parseMaybeJson(normalizedText);
	if (directPayload) {
		return directPayload;
	}

	const fencedMatch = normalizedText.match(/```(?:json)?\s*([\s\S]*?)```/iu);
	if (!fencedMatch?.[1]) {
		return null;
	}

	return parseMaybeJson(fencedMatch[1].trim());
}

async function runRovoDevBackgroundTask({
	conflictPolicy = "wait-for-turn",
	fallbackGenerateTextImpl,
	generateTextImpl = generateTextViaRovoDev,
	parseStructuredResult,
	prompt,
	selectedSkillIds = [],
	signal,
	system,
	timeoutMs = WAIT_FOR_TURN_TIMEOUT_MS,
} = {}) {
	const normalizedPrompt = getNonEmptyString(prompt);
	if (!normalizedPrompt) {
		const error = new Error("Rovo background task execution requires a prompt.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	const hermesContextDescription = await buildHermesContextDescription(selectedSkillIds);
	const executionInput = {
		conflictPolicy,
		prompt: normalizedPrompt,
		signal,
		system: buildCombinedSystemPrompt({
			system,
			hermesContextDescription,
		}),
		timeoutMs,
	};

	try {
		const responseText = await generateTextImpl(executionInput);
		const structuredResult =
			typeof parseStructuredResult === "function"
				? parseStructuredResult(responseText)
				: null;
		return {
			backend: "rovodev",
			didRun: true,
			responseText: getNonEmptyString(responseText) ?? "",
			structuredResult,
		};
	} catch (error) {
		const normalizedError = normalizeExecutorError(error);
		if (typeof fallbackGenerateTextImpl !== "function" && typeof parseStructuredResult !== "function") {
			throw normalizedError;
		}

		const fallbackRunner = typeof fallbackGenerateTextImpl === "function"
			? fallbackGenerateTextImpl
			: async (fallbackInput) => {
				const fallbackResult = await executeStructuredFallbackTask(fallbackInput);
				return fallbackResult.text;
			};
		const fallbackText = await fallbackRunner(executionInput);
		const structuredResult =
			typeof parseStructuredResult === "function"
				? parseStructuredResult(fallbackText)
				: null;
		if (typeof parseStructuredResult === "function" && !structuredResult) {
			const structuredFallbackError = new Error(
				"Structured fallback output was invalid and could not be applied safely.",
			);
			structuredFallbackError.code = "ROVO_TASK_STRUCTURED_FALLBACK_INVALID";
			throw structuredFallbackError;
		}
		return {
			backend: "ai-gateway",
			didRun: true,
			fallbackReason: normalizedError.message,
			responseText: getNonEmptyString(fallbackText) ?? "",
			structuredResult,
		};
	}
}

function normalizeExecutorError(error) {
	if (isChatInProgressError(error)) {
		error.code = "ROVO_TASK_BUSY";
		return error;
	}

	return error;
}

module.exports = {
	executeRovoTask,
	executeStructuredFallbackTask,
	normalizeExecutorError,
	parseStructuredJsonResponse,
	runRovoDevBackgroundTask,
};
