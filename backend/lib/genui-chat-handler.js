const {
	generateTextViaRovo,
	streamViaRovo,
	WAIT_FOR_TURN_TIMEOUT_MS,
} = require("./rovo-gateway");
const { getGenuiSystemPrompt } = require("./genui-system-prompt");
const {
	getMissingChildReferences,
	analyzeGeneratedText,
	pickBestSpec,
} = require("./genui-spec-utils");

const GENUI_META_PREFIX = "[genui-meta]";
const WEB_LOOKUP_TIMEOUT_MS = 4500;
const DEFAULT_ROVO_UNAVAILABLE_MESSAGE =
	"Rovo Serve is required but not available. Please start Rovo Serve with 'pnpm run rovo' before using UI Generation.";

const STRICT_RETRY_INSTRUCTION = `
## Retry Enforcement

- Output exactly one short sentence of explanation.
- Then output exactly one \`\`\`spec block.
- Inside the \`\`\`spec block, emit only valid RFC 6902 JSON patch objects (one per line).
- Ensure the first patch sets "/root" and that the referenced key exists in "/elements".
- Ensure at least one element exists in "/elements".
`;

const LIVE_DATA_REQUEST_PATTERN =
	/\b(latest|current|today|live|real[-\s]?time|up[-\s]?to[-\s]?date|search the internet|web search|look it up|online|directions|traffic|travel time)\b/i;
const CHART_REQUEST_PATTERN =
	/\b(chart|charts|graph|graphs|plot|plots|trend|trends|time[-\s]?series|line chart|bar chart|pie chart|area chart|radar chart)\b/i;
const CHART_COMPONENT_TYPES = new Set([
	"BarChart",
	"LineChart",
	"PieChart",
	"AreaChart",
	"RadarChart",
]);


function stripMetaPrefix(text) {
	if (typeof text !== "string" || !text.startsWith(GENUI_META_PREFIX)) {
		return typeof text === "string" ? text : "";
	}

	const lines = text.split("\n");
	if (lines.length <= 1) {
		return "";
	}

	return lines.slice(1).join("\n");
}

function normalizeMessages(rawMessages) {
	if (!Array.isArray(rawMessages)) {
		return [];
	}

	return rawMessages
		.map((msg) => {
			const role = msg?.role === "assistant" ? "assistant" : "user";
			const content =
				typeof msg?.content === "string"
					? stripMetaPrefix(msg.content)
					: "";

			return { role, content };
		})
		.filter((msg) => msg.content.trim().length > 0);
}

function getLastUserPrompt(messages) {
	for (let i = messages.length - 1; i >= 0; i -= 1) {
		const message = messages[i];
		if (message.role === "user" && message.content.trim().length > 0) {
			return message.content;
		}
	}

	return "";
}

function shouldUseWebLookup({ allowWebLookup, prompt }) {
	if (allowWebLookup) {
		return true;
	}

	return LIVE_DATA_REQUEST_PATTERN.test(prompt);
}

function shouldRequireChartComponent(prompt) {
	return CHART_REQUEST_PATTERN.test(prompt);
}

function hasChartComponent(spec) {
	if (!spec?.elements || typeof spec.elements !== "object") {
		return false;
	}

	for (const element of Object.values(spec.elements)) {
		if (
			element &&
			typeof element === "object" &&
			typeof element.type === "string" &&
			CHART_COMPONENT_TYPES.has(element.type)
		) {
			return true;
		}
	}

	return false;
}

function getRequirementMisses(spec, requirements) {
	if (!spec || !requirements || typeof requirements !== "object") {
		return [];
	}

	const misses = [];
	if (requirements.requireChartComponent && !hasChartComponent(spec)) {
		misses.push("missing_chart_component");
	}

	return misses;
}

function pickBestSpecForRequirementCheck(analysis) {
	return pickBestSpec(analysis);
}

function stripSpecBlocks(rawText) {
	if (typeof rawText !== "string") {
		return "";
	}

	return rawText.replace(/```spec[\s\S]*?```/gi, "");
}

function normalizeNarrative(rawText) {
	const noSpec = stripSpecBlocks(rawText)
		.replace(/\n{3,}/g, "\n\n")
		.trim();

	if (!noSpec) {
		return "";
	}

	const MAX_LENGTH = 1200;
	if (noSpec.length <= MAX_LENGTH) {
		return noSpec;
	}

	return `${noSpec.slice(0, MAX_LENGTH).trimEnd()}...`;
}

function buildSpecFence(spec) {
	const lines = [
		"```spec",
		JSON.stringify({ op: "replace", path: "/root", value: spec.root }),
		JSON.stringify({ op: "replace", path: "/elements", value: spec.elements }),
	];

	if (Object.prototype.hasOwnProperty.call(spec, "state")) {
		lines.push(
			JSON.stringify({
				op: "replace",
				path: "/state",
				value: spec.state,
			}),
		);
	}

	lines.push("```");
	return lines.join("\n");
}

function buildMetaLine(meta) {
	return `${GENUI_META_PREFIX} ${JSON.stringify(meta)}`;
}

function withMeta(outputText, meta) {
	const body = typeof outputText === "string" ? outputText.trim() : "";
	if (!body) {
		return buildMetaLine(meta);
	}

	return `${buildMetaLine(meta)}\n${body}`;
}

function summarizeIssues(issues) {
	if (!Array.isArray(issues)) {
		return [];
	}

	return issues
		.filter((issue) => issue && typeof issue === "object")
		.slice(0, 5)
		.map((issue) =>
			typeof issue.code === "string" && issue.code.trim().length > 0
				? issue.code
				: "unknown",
		);
}

function formatValidationIssuesForRetry(analysis) {
	const lines = [];

	const missingRefs = getMissingChildReferences(analysis.spec);
	for (const ref of missingRefs.slice(0, 5)) {
		lines.push(`- Missing child element '${ref.childKey}' referenced in children array of '${ref.parentKey}'`);
	}

	const issues = analysis.validation?.issues;
	if (Array.isArray(issues)) {
		for (const issue of issues.slice(0, 5)) {
			if (!issue || typeof issue !== "object") continue;
			const msg = typeof issue.message === "string" ? issue.message : "";
			const code = typeof issue.code === "string" ? issue.code : "unknown";
			if (msg) {
				lines.push(`- ${msg} (${code})`);
			} else {
				lines.push(`- Validation error: ${code}`);
			}
		}
	}

	if (analysis.patchCount === 0) {
		lines.push("- No spec patches were detected in the output. You must include a ```spec block.");
	}

	return lines.length > 0 ? lines.join("\n") : null;
}

function logAttempt(label, analysis, requirements) {
	const requirementMisses = getRequirementMisses(
		pickBestSpecForRequirementCheck(analysis),
		requirements,
	);

	console.info("[GENUI-CHAT] Attempt diagnostics", {
		label,
		patchCount: analysis.patchCount,
		patchApplyErrors: analysis.patchApplyErrors,
		renderable: analysis.renderable,
		fixedRenderable: analysis.fixedRenderable,
		synthesizedRenderable: analysis.synthesizedRenderable,
		synthesizedChildCount: analysis.synthesizedChildCount,
		validationIssues: summarizeIssues(analysis.validation?.issues),
		fixedValidationIssues: summarizeIssues(analysis.fixedValidation?.issues),
		synthesizedValidationIssues: summarizeIssues(analysis.synthesizedValidation?.issues),
		requirementMisses,
		fixCount: analysis.fixes.length,
	});
}

function getFailureType(analysis) {
	if (analysis.patchCount === 0) {
		return "no-spec";
	}

	return "malformed-spec";
}

function buildFixedOutput(rawText, fixedSpec) {
	const narrative = normalizeNarrative(rawText);
	const lines = [];

	if (narrative) {
		lines.push(narrative);
	}

	lines.push("Applied automatic spec repair for rendering reliability.");
	lines.push(buildSpecFence(fixedSpec));

	return lines.join("\n\n");
}

function buildSynthesizedOutput(rawText, synthesizedSpec, synthesizedChildCount) {
	const narrative = normalizeNarrative(rawText);
	const lines = [];

	if (narrative) {
		lines.push(narrative);
	}

	lines.push(
		`Recovered ${synthesizedChildCount} missing section${
			synthesizedChildCount === 1 ? "" : "s"
		} by generating placeholders.`,
	);
	lines.push(buildSpecFence(synthesizedSpec));

	return lines.join("\n\n");
}

function buildFailureOutput(rawText, failureType, requirementMisses = []) {
	const narrative = normalizeNarrative(rawText);
	const hasMissingChart = requirementMisses.includes("missing_chart_component");
	const guidance = hasMissingChart
		? "The generated spec did not include a required chart component. Try naming a specific chart type like LineChart, BarChart, or AreaChart."
		: failureType === "no-spec"
			? "I could not detect a renderable spec. Try asking for a concrete UI layout with sections and sample data."
			: "I detected spec patches, but the final structure was invalid. Try a simpler prompt with explicit sections and component types.";

	if (!narrative) {
		return guidance;
	}

	return `${narrative}\n\n${guidance}`;
}

function createRovoUnavailableError() {
	const error = new Error(DEFAULT_ROVO_UNAVAILABLE_MESSAGE);
	error.code = "ROVO_UNAVAILABLE";
	error.backendSelected = "rovo";
	error.failureStage = "unavailable";
	return error;
}

/**
 * Generate assistant text via Rovo Serve.
 *
 * Combines the system prompt and conversation messages into a single
 * message string that Rovo Serve can process, matching the pattern
 * used by `generateTextViaRovo` in rovo-gateway.js.
 */
async function generateAssistantText({
	systemPrompt,
	messages,
	onTextDelta,
	rovoAvailable,
}) {
	const conversationLines = messages.map(
		(msg) => `[${msg.role === "assistant" ? "Assistant" : "User"}]\n${msg.content}`
	);
	const prompt = conversationLines.join("\n\n");
	const combinedMessage = `[System Instructions]\n${systemPrompt}\n[End System Instructions]\n\n${prompt}`;

	if (rovoAvailable) {
		if (typeof onTextDelta === "function") {
			const chunks = [];
			await streamViaRovo({
				message: combinedMessage,
				conflictPolicy: "wait-for-turn",
				onTextDelta: (delta) => {
					chunks.push(delta);
					onTextDelta(delta);
				},
			});
			return chunks.join("");
		}

		return generateTextViaRovo({
			system: systemPrompt,
			prompt,
			conflictPolicy: "wait-for-turn",
			timeoutMs: WAIT_FOR_TURN_TIMEOUT_MS,
		});
	}

	// GenUI is a primary user-facing route. Do not silently fail over.
	throw createRovoUnavailableError();
}

function extractRelatedTopicTexts(topics, output = []) {
	if (!Array.isArray(topics)) {
		return output;
	}

	for (const topic of topics) {
		if (!topic || typeof topic !== "object") {
			continue;
		}

		if (typeof topic.Text === "string" && topic.Text.trim().length > 0) {
			output.push(topic.Text.trim());
		}

		if (Array.isArray(topic.Topics)) {
			extractRelatedTopicTexts(topic.Topics, output);
		}
	}

	return output;
}

async function fetchWebLookupContext(prompt) {
	const query = prompt.trim();
	if (!query) {
		return null;
	}

	const controller = new AbortController();
	const timeout = setTimeout(() => controller.abort(), WEB_LOOKUP_TIMEOUT_MS);

	try {
		const endpoint = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&no_redirect=1&skip_disambig=1`;
		const response = await fetch(endpoint, {
			signal: controller.signal,
			headers: {
				Accept: "application/json",
				"User-Agent": "VPK-GenUI/1.0",
			},
		});

		if (!response.ok) {
			return null;
		}

		const payload = await response.json();
		const snippets = [];

		if (
			typeof payload.AbstractText === "string" &&
			payload.AbstractText.trim().length > 0
		) {
			snippets.push(payload.AbstractText.trim());
		}

		snippets.push(...extractRelatedTopicTexts(payload.RelatedTopics).slice(0, 3));

		const deduped = [...new Set(snippets.map((snippet) => snippet.trim()))].filter(
			(snippet) => snippet.length > 0,
		);
		if (deduped.length === 0) {
			return null;
		}

		const sourceUrl =
			typeof payload.AbstractURL === "string" && payload.AbstractURL.trim().length > 0
				? payload.AbstractURL.trim()
				: "https://duckduckgo.com/";

		return `Source: ${sourceUrl}\n${deduped
			.map((snippet, index) => `${index + 1}. ${snippet}`)
			.join("\n")}`;
	} catch (error) {
		console.warn("[GENUI-CHAT] Web lookup failed:", error);
		return null;
	} finally {
		clearTimeout(timeout);
	}
}

function buildSuccessOutput({
	analysis,
	rawText,
	attempt,
	wasRetried,
	usedWebLookup,
	requirements,
	allowSynthesis = false,
}) {
	const baseRequirementMisses = getRequirementMisses(analysis.spec, requirements);
	if (analysis.renderable && baseRequirementMisses.length === 0) {
		return withMeta(rawText, {
			status: "ok",
			failureType: null,
			wasAutoFixed: false,
			wasRetried,
			usedWebLookup,
			repairMode: "none",
			synthesizedChildCount: 0,
			requirementMisses: [],
			attempt,
		});
	}

	const fixedRequirementMisses = getRequirementMisses(
		analysis.fixedSpec,
		requirements,
	);
	if (
		analysis.fixedRenderable &&
		analysis.fixedSpec &&
		fixedRequirementMisses.length === 0
	) {
		return withMeta(buildFixedOutput(rawText, analysis.fixedSpec), {
			status: "ok",
			failureType: null,
			wasAutoFixed: true,
			wasRetried,
			usedWebLookup,
			repairMode: "none",
			synthesizedChildCount: 0,
			missingChildKeys: [],
			requirementMisses: [],
			attempt,
		});
	}

	const synthesizedRequirementMisses = getRequirementMisses(
		analysis.synthesizedSpec,
		requirements,
	);
	if (
		allowSynthesis &&
		analysis.synthesizedRenderable &&
		analysis.synthesizedSpec &&
		synthesizedRequirementMisses.length === 0
	) {
		return withMeta(
			buildSynthesizedOutput(
				rawText,
				analysis.synthesizedSpec,
				analysis.synthesizedChildCount,
			),
			{
				status: "ok",
				failureType: null,
				wasAutoFixed: true,
				wasRetried,
				usedWebLookup,
				repairMode: "synthesize-missing-children",
				synthesizedChildCount: analysis.synthesizedChildCount,
				missingChildKeys: analysis.missingChildKeys,
				requirementMisses: [],
				attempt,
			},
		);
	}

	return null;
}

/**
 * Handler for POST /api/genui-chat.
 *
 * Accepts `{ messages: [{ role, content }], strictSpec?, allowWebLookup?, layoutContext? }`
 * and returns mixed text + json-render patch output.
 */
async function genuiChatHandler(req, res, options = {}) {
	try {
		const {
			messages: rawMessages,
			strictSpec,
			allowWebLookup,
			layoutContext = null,
			streamResponse = true,
	} = req.body || {};
	const rovoAvailable =
		typeof options.isRovoAvailable === "function"
			? await options.isRovoAvailable()
			: true;
	const normalizedMessages = normalizeMessages(rawMessages);

		if (normalizedMessages.length === 0) {
			return res.status(400).json({ error: "messages array is required" });
		}

		const userPrompt = getLastUserPrompt(normalizedMessages);
		const enableWebLookup = shouldUseWebLookup({
			allowWebLookup: allowWebLookup === true,
			prompt: userPrompt,
		});
		const requirements = {
			requireChartComponent: shouldRequireChartComponent(userPrompt),
		};

		const useStrictSpec = strictSpec !== false;
		const basePrompt = getGenuiSystemPrompt({
			strict: useStrictSpec,
			layoutContext,
		});
		let hasPreparedStreamResponse = false;
		const ensureStreamResponseStarted = () => {
			if (hasPreparedStreamResponse) {
				return;
			}

			res.setHeader("Content-Type", "text/plain; charset=utf-8");
			res.setHeader("Cache-Control", "no-cache");
			res.setHeader("Connection", "keep-alive");
			if (typeof res.flushHeaders === "function") {
				res.flushHeaders();
			}
			hasPreparedStreamResponse = true;
		};

		const baseText = await generateAssistantText({
			systemPrompt: basePrompt,
			messages: normalizedMessages,
			rovoAvailable,
			onTextDelta:
				streamResponse === true
					? (delta) => {
							if (typeof delta === "string" && delta.length > 0) {
								ensureStreamResponseStarted();
								res.write(delta);
							}
						}
					: undefined,
		});
		const baseAnalysis = analyzeGeneratedText(baseText);
		logAttempt("base", baseAnalysis, requirements);

		// Low-latency path: stream base output immediately, then append only
		// recovery/failure guidance if needed.
		if (streamResponse === true) {
			const requirementMisses = getRequirementMisses(
				pickBestSpecForRequirementCheck(baseAnalysis),
				requirements,
			);

			if (baseAnalysis.renderable && requirementMisses.length === 0) {
				res.end();
				return;
			}

			const fixedRequirementMisses = getRequirementMisses(
				baseAnalysis.fixedSpec,
				requirements,
			);
			if (
				baseAnalysis.fixedRenderable &&
				baseAnalysis.fixedSpec &&
				fixedRequirementMisses.length === 0
			) {
				ensureStreamResponseStarted();
				res.write(
					`\n\nApplied automatic spec repair for rendering reliability.\n\n${buildSpecFence(baseAnalysis.fixedSpec)}`
				);
				res.end();
				return;
			}

			const synthesizedRequirementMisses = getRequirementMisses(
				baseAnalysis.synthesizedSpec,
				requirements,
			);
			if (
				baseAnalysis.synthesizedRenderable &&
				baseAnalysis.synthesizedSpec &&
				synthesizedRequirementMisses.length === 0
			) {
				ensureStreamResponseStarted();
				res.write(
					`\n\nRecovered ${baseAnalysis.synthesizedChildCount} missing section${
						baseAnalysis.synthesizedChildCount === 1 ? "" : "s"
					} by generating placeholders.\n\n${buildSpecFence(baseAnalysis.synthesizedSpec)}`
				);
				res.end();
				return;
			}

			const failureType = getFailureType(baseAnalysis);
			const guidance = buildFailureOutput("", failureType, requirementMisses);
			ensureStreamResponseStarted();
			res.write(`\n\n${guidance}`);
			res.end();
			return;
		}

		let finalOutput = buildSuccessOutput({
			analysis: baseAnalysis,
			rawText: baseText,
			attempt: "base",
			wasRetried: false,
			usedWebLookup: false,
			requirements,
			allowSynthesis: false,
		});
		let lastAnalysis = baseAnalysis;
		let lastRawText = baseText;
		let usedWebLookup = false;
		let attemptLabel = "base";

		if (!finalOutput) {
			const issuesSummary = formatValidationIssuesForRetry(baseAnalysis);
			const retryDiagnostics = issuesSummary
				? `\n\nYour previous attempt had these spec issues:\n${issuesSummary}\nFix these specific issues.`
				: "";
			const strictRetryPrompt = `${getGenuiSystemPrompt({
				strict: true,
				layoutContext,
			})}\n\n${STRICT_RETRY_INSTRUCTION}${retryDiagnostics}`;
			const retryText = await generateAssistantText({
				systemPrompt: strictRetryPrompt,
				messages: normalizedMessages,
				rovoAvailable,
			});
			const retryAnalysis = analyzeGeneratedText(retryText);
			logAttempt("strict-retry", retryAnalysis, requirements);

			lastAnalysis = retryAnalysis;
			lastRawText = retryText;
			attemptLabel = "strict-retry";
			finalOutput = buildSuccessOutput({
				analysis: retryAnalysis,
				rawText: retryText,
				attempt: "strict-retry",
				wasRetried: true,
				usedWebLookup: false,
				requirements,
				allowSynthesis: false,
			});
		}

		if (!finalOutput && enableWebLookup) {
			const webContext = await fetchWebLookupContext(userPrompt);
			if (webContext) {
				const webRetryPrompt = `${getGenuiSystemPrompt({
					strict: true,
					webContext,
					layoutContext,
				})}\n\n${STRICT_RETRY_INSTRUCTION}`;
				const webRetryText = await generateAssistantText({
					systemPrompt: webRetryPrompt,
					messages: normalizedMessages,
					rovoAvailable,
				});
				const webRetryAnalysis = analyzeGeneratedText(webRetryText);
				logAttempt("web-retry", webRetryAnalysis, requirements);

				lastAnalysis = webRetryAnalysis;
				lastRawText = webRetryText;
				attemptLabel = "web-retry";
				usedWebLookup = true;
				finalOutput = buildSuccessOutput({
					analysis: webRetryAnalysis,
					rawText: webRetryText,
					attempt: "web-retry",
					wasRetried: true,
					usedWebLookup: true,
					requirements,
					allowSynthesis: false,
				});
			}
		}

		if (!finalOutput) {
			finalOutput = buildSuccessOutput({
				analysis: lastAnalysis,
				rawText: lastRawText,
				attempt: attemptLabel,
				wasRetried: attemptLabel !== "base",
				usedWebLookup,
				requirements,
				allowSynthesis: true,
			});
		}

		if (!finalOutput) {
			const requirementMisses = getRequirementMisses(
				pickBestSpecForRequirementCheck(lastAnalysis),
				requirements,
			);
			const failureType = getFailureType(lastAnalysis);
			finalOutput = withMeta(
				buildFailureOutput(lastRawText, failureType, requirementMisses),
				{
					status: "failed",
					failureType,
					wasAutoFixed: false,
					wasRetried: attemptLabel !== "base",
					usedWebLookup,
					repairMode: "none",
					synthesizedChildCount: 0,
					missingChildKeys: [],
					requirementMisses,
					validationIssues: summarizeIssues(lastAnalysis.validation?.issues),
					attempt: attemptLabel,
				},
			);
		}

		res.write(finalOutput);
		res.end();
	} catch (error) {
		console.error("[GENUI-CHAT] Error:", error);
		if (!res.headersSent) {
			const message = error instanceof Error ? error.message : String(error);
			const backendSelected = error?.backendSelected;
			if (error?.code === "ROVO_UNAVAILABLE" || backendSelected === "rovo") {
				return res.status(503).json({
					error: "Rovo Serve is required but not available",
					details: message,
					backendSelected: "rovo",
					failureStage: "unavailable",
				});
			}

			return res.status(500).json({
				error: "Internal server error",
				details: message,
			});
		}
		res.end();
	}
}

module.exports = {
	genuiChatHandler,
};
