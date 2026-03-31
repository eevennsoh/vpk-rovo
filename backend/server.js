// Initialize console early for startup debugging
console.log("[STARTUP] Server process starting...");
console.error("[STARTUP] Startup initiated", new Date().toISOString());

// Try to load .env.local if it exists, but don't fail if it doesn't
try {
	require("dotenv").config({ path: require("path").join(__dirname, "..", ".env.local") });
	console.log("[STARTUP] .env.local loaded");
} catch {
	console.log("[STARTUP] .env.local not found, using environment variables only");
}

const express = require("express");
const cors = require("cors");
const path = require("path");
const WebSocket = require("ws");
const {
	createUIMessageStream,
	createUIMessageStreamResponse,
	pipeUIMessageStreamToResponse,
} = require("ai");
const { createRunManager: createMakeRunManager } = require("./make/make-runs");
const { createFutureChatThreadManager } = require("./lib/future-chat-threads");
const { createFutureChatVoteManager } = require("./lib/future-chat-votes");
const { createFutureChatDocumentManager } = require("./lib/future-chat-documents");
const { createFutureChatUploadManager } = require("./lib/future-chat-uploads");
const {
	createFutureChatGeneratedFilesManager,
} = require("./lib/future-chat-generated-files");
const { createAbortControllerFromRequest } = require("./lib/http-request-abort");
const {
	createCapturedResponse,
	createInProcessRequest,
} = require("./lib/in-process-http");
const { createFutureChatRunManager } = require("./lib/future-chat-runs");
const {
	collectUiMessagesFromResponseStream,
	createUiMessageChunkSseStream,
} = require("./lib/future-chat-ui-stream");
const {
	waitForFutureChatRovoDevAvailability,
} = require("./lib/future-chat-availability");
const {
	buildFutureChatArtifactIntentPrompt,
	normalizeArtifactKind,
	parseFutureChatArtifactIntent,
	resolveFastFutureChatArtifactIntent,
} = require("./lib/future-chat-artifact-intent");
const {
	deriveFutureChatVersionChangeLabel,
	isExplicitNewFutureChatArtifactRequest,
	isSameFutureChatArtifactVersionRequest,
} = require("./lib/future-chat-artifact-updates");
const {
	inferFutureChatArtifactKindFromContent,
} = require("./lib/future-chat-artifact-kind");
const {
	resolveFutureChatActiveArtifact,
} = require("./lib/future-chat-artifact-routing");
const {
	deriveFutureChatArtifactTitle,
	sanitizeFutureChatArtifactTitle,
} = require("./lib/future-chat-artifact-titles");
const {
	generateAndPersistFutureChatArtifact,
} = require("./lib/future-chat-artifact-runner");
const makeFs = require("./make/make-filesystem");
const { createAppRegistry } = require("./make/make-app-registry");
const { createForgePublishManager } = require("./make/make-forge-publish");
const { genuiChatHandler } = require("./lib/genui-chat-handler");
const {
	streamViaRovoDev,
	replayViaRovoDev,
	generateTextViaRovoDev,
	isChatInProgressError,
	initPool,
	WAIT_FOR_TURN_TIMEOUT_MS,
} = require("./lib/rovodev-gateway");
const { classifyRovoDevHealthCheck } = require("./lib/rovodev-health");
const {
	ensureRovoDevSession,
	getCurrentRovoDevSession,
} = require("./lib/rovodev-session");
const { createAIGatewayProvider } = require("./lib/ai-gateway-provider");
const { isLocalModelRequest, streamLocalModel } = require("./lib/local-model-provider");
const { getGenuiSystemPrompt } = require("./lib/genui-system-prompt");
const { analyzeGeneratedText, pickBestSpec, extractDirectSpec } = require("./lib/genui-spec-utils");
const { buildFallbackGenuiSpecFromText } = require("./lib/genui-fallback-spec");
const { shouldAttemptPostToolGenui } = require("./lib/genui-post-tool-eligibility");
const { buildDirectSpecWidgetParts } = require("./lib/direct-spec-widget-parts");
const { resolveAutomaticGenuiOutcome } = require("./lib/automatic-genui-outcome");
const { assessToolFirstGenuiQuality } = require("./lib/tool-first-genui-quality");
const { dispatchBespokeGenuiHandler } = require("./lib/bespoke-genui-handler-dispatch");
const { looksLikeInabilityResponse, looksLikeWriteBlockedResponse } = require("./lib/inability-response-detector");
const { assessPromptComplexityForPlanMode } = require("./lib/plan-mode-complexity-heuristic");
const {
	getPlanSession,
	updatePlanSession,
	clearPlanSession,
	shouldRestorePlanModeOnResume,
	isPlanExecutionPhase,
} = require("./lib/plan-session");
const {
	resolveRoutingDecision,
} = require("./lib/resolve-routing-decision");
const {
	buildRouteDecision,
	createRouteDecisionPart,
} = require("./lib/route-decision");
const {
	buildSmartGenerationGatewayOptions,
} = require("./lib/smart-generation-gateway-options");
const {
	SMART_ROUTE_TARGET_SURFACES,
	isSmartRouteTargetSurface,
} = require("./lib/smart-generation-surface-gate");
const {
	resolveToolFirstPolicy,
	TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY,
	createToolFirstExecutionState,
	recordToolFirstAttempt,
	recordToolThinkingEvent,
	isToolNameRelevant,
	hasRelevantToolSuccess,
	hasRelevantToolObservation,
	isWorkSummaryTurn,
	getToolFirstRetryDelayMs,
	buildToolFirstRetryInstruction,
	buildToolContextForGenui,
	buildToolFirstTextFallback,
	shouldSuppressToolFirstIntentStatus,
	stripToolFirstFailureNarrative,
	buildZeroToolCallRecoverySpec,
	buildWorkSummaryExecutionLog,
} = require("./lib/tool-first-genui-policy");
const {
	resolveToolFirstWidgetContentType,
	resolveToolFirstWidgetSource,
} = require("./lib/tool-first-widget-content-type");
const { resolveToolFirstRoutingFlags } = require("./lib/tool-first-routing-flags");
const {
	buildClassifierPrompt: buildSmartClarificationClassifierPrompt,
	parseClassifierOutput: parseSmartClarificationClassifierOutput,
	isVagueVisualizationRequest,
	shouldGateSmartClarification,
} = require("./lib/smart-clarification-gate");
const {
	resolveGoogleImageGatewayConfig,
	toImageWidgetErrorMessage,
	isUnsupportedModalitiesError,
} = require("./lib/image-generation-routing");
const {
	healthCheck: rovoDevHealthCheck,
	cancelChat: rovoDevCancelChat,
	resumeToolCalls: rovoDevResumeToolCalls,
} = require("./lib/rovodev-client");
const { setAgentMode, getAgentMode } = require("./lib/rovodev-agent-mode");
const {
	splitDirectMediaTextForStreaming,
	stripDirectMediaFences,
} = require("./lib/direct-media-fence");
const {
	buildExpiredDeferredClarificationResponse,
	buildClarificationResumeDecision,
	synthesiseDeferredToolResponseFromClarification,
	shouldRejectExpiredDeferredClarification,
} = require("./lib/deferred-clarification");
const {
	getFutureChatRunFailurePayload,
} = require("./lib/future-chat-run-failure");
const {
	buildInteractiveStuckPortFailureMessage,
	shouldRetryInteractiveStuckPortRecovery,
} = require("./lib/interactive-chat-port-recovery");
const {
	hasStructuredContinuationBody,
	shouldReplaceActiveRunForRequest,
} = require("./lib/future-chat-run-continuation");
const { createRovoDevPool } = require("./lib/rovodev-pool");
const { createOrchestratorLog } = require("./lib/orchestrator-log");
const {
	generateSuggestedQuestionsViaAIGateway,
} = require("./lib/suggested-questions");
const {
	createListeningPidReader,
	restartRovoDevPort,
	DEFAULT_RECOVERY_TIMEOUT_MS: DEFAULT_ROVODEV_PORT_RECOVERY_TIMEOUT_MS,
} = require("./lib/rovodev-port-recovery");
const {
	getEnvVars,
	detectEndpointType,
	resolveGatewayUrl,
	streamBedrockGatewayManualSse,
	streamGoogleGatewayManualSse,
	getRealtimeConfig,
} = require("./lib/ai-gateway-helpers");
const { synthesizeSound } = require("./lib/sound-generation");
const { transcribeAudio } = require("./lib/speech-transcription");
const { generateStandupSummary } = require("./lib/standup-summary");
const { classifyTickets } = require("./lib/ticket-classifier");
const {
	handleGetClaimTest,
	handlePostClaimTest,
	handleDeleteClaimTest,
} = require("./lib/claim-test-handler");
const {
	resolveSmartAudioVoiceInput,
	stripConversationalFiller,
} = require("./lib/smart-audio-routing");
const { RealtimeSession } = require("./lib/openai-realtime");
const {
	isAudioContextClarificationSession,
	resolveAudioContextVoiceInputFromClarification,
} = require("./lib/audio-context-resolution");
const {
	isImageContextClarificationSession,
	resolveImageContextFromClarification,
} = require("./lib/image-context-resolution");
const {
	resolveSmartImagePrompt,
	buildEnrichedImagePrompt,
} = require("./lib/smart-image-routing");
const {
	resolveSpeechPayloadFromAudioRequest,
} = require("./lib/audio-input-extractor");
const {
	GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME,
	resolveTranslationRequestState,
	resolveTranslationRequestFromClarification,
	createTranslationClarificationSessionId,
	isTranslationClarificationSession,
	buildTranslationClarificationPayload,
	createTranslationToolExecutionPrompt,
	parseTranslationToolResult,
	parseTranslationModelOutput,
	buildTranslationTextSummary,
	buildTranslationGenuiSpec,
} = require("./lib/translation-card");
const {
	buildClarificationDirective,
} = require("./lib/clarification-directive");
const {
	extractPlanWidgetPayloadFromExitPlanToolInput,
	extractProgressivePlanWidgetPayloadFromText,
} = require("./lib/plan-widget-fallback");
const {
	extractUpdateTodoPlanPayloadFromObservations,
} = require("./lib/update-todo-plan-payload");
const {
	extractAppRoutesFromObservations,
	areAllPlanTasksCompleted,
} = require("./lib/app-route-resolver");
const { resolveChatSdkThreadId } = require("./lib/chat-sdk-thread-id");
const { chromiumPreviewManager } = require("./lib/chromium-preview");
const { browserWorkspaceManager } = require("./lib/browser-workspace-manager");
const {
	classifyPromptIntent,
	inferPromptIntent,
} = require("./lib/prompt-intent");
const {
	extractQuestionCardDefinitionFromAssistantText,
	resolveFallbackQuestionCardState,
	looksLikeClarificationResponse,
	MAX_LABEL_LENGTH: CLARIFICATION_MAX_LABEL_LENGTH,
} = require("./lib/question-card-extractor");
const {
	sanitizeQuestionCardPayload,
	buildQuestionCardPayloadFromRequestUserInput,
	findRequestUserInputQuestionContainer,
} = require("./lib/question-card-payload");
const {
	buildPausedToolApprovalPayload,
	buildToolApprovalResumeDecisions,
	getPartPermissionScenario,
	normalizeToolApprovalSubmission,
} = require("./lib/paused-tool-approval");
const {
	shouldGateToolFirstQuestionCard,
	buildToolFirstClarificationInstruction,
} = require("./lib/tool-first-question-gate");
const {
	toPreview,
	splitSpecFenceTextForStreaming,
} = require("./lib/tool-output-sanitizer");
const {
	getNonEmptyString,
	getPositiveInteger,
	extractTextFromUiParts,
	isPlainObject,
} = require("./lib/shared-utils");
const {
	STAGE_TRACE_ID_HEADER,
	STAGE_TRACE_START_HEADER,
	createStageTrace,
} = require("./lib/stage-trace");

console.log("[STARTUP] Dependencies loaded");

// ─── RovoDev Serve Detection ─────────────────────────────────────────────────
// When `pnpm run rovodev` is used, `dev-rovodev.js` writes the serve port to
// `.dev-rovodev-port`. The backend reads this file to decide whether to route
// chat traffic through the local RovoDev agent loop instead of AI Gateway.

const ROVODEV_PORT_FILE = path.join(__dirname, "..", ".dev-rovodev-port");
const ROVODEV_PORTS_FILE = path.join(__dirname, "..", ".dev-rovodev-ports");

/** Cached availability state — refreshed on each request via the port file. */
let _rovoDevAvailable = false;
let _rovoDevChecked = false;
let _rovoDevLastRefresh = 0;
/** @type {import("./lib/rovodev-pool") | null} */
let _rovoDevPool = null;

/**
 * Read ports from the multi-port file (.dev-rovodev-ports) or fall back
 * to the single-port file (.dev-rovodev-port).
 * @returns {number[]} Array of valid port numbers, or empty array.
 */
function readRovoDevPorts() {
	const fs = require("fs");

	// Try JSON array file first
	if (fs.existsSync(ROVODEV_PORTS_FILE)) {
		try {
			const parsed = JSON.parse(fs.readFileSync(ROVODEV_PORTS_FILE, "utf8").trim());
			if (Array.isArray(parsed) && parsed.length > 0) {
				const validPorts = parsed.filter((p) => typeof p === "number" && p > 0);
				if (validPorts.length > 0) {
					return validPorts;
				}
			}
		} catch {
			// Ignore parse errors
		}
	}

	// Fall back to single port file
	if (fs.existsSync(ROVODEV_PORT_FILE)) {
		try {
			const portStr = fs.readFileSync(ROVODEV_PORT_FILE, "utf8").trim();
			const port = parseInt(portStr, 10);
			if (!isNaN(port) && port > 0) {
				return [port];
			}
		} catch {
			// Ignore read errors
		}
	}

	return [];
}

/**
 * Poll a RovoDev port until it's ready for new requests.
 * Uses a non-destructive healthcheck probe (no state mutation, no cancellation).
 * Resolves when ready; rejects if the port doesn't become ready within the
 * probe window (READY_PROBE_INTERVAL_MS × READY_PROBE_MAX_ATTEMPTS).
 *
 * @param {number} port
 * @returns {Promise<void>}
 */
async function waitForPortReady(port) {
	// Always wait the minimum cooldown first — RovoDev Serve needs a brief
	// moment after the SSE stream closes before it can accept new requests.
	await new Promise((resolve) => setTimeout(resolve, POST_STREAM_COOLDOWN_MS));

	for (let attempt = 0; attempt < READY_PROBE_MAX_ATTEMPTS; attempt++) {
		try {
			const health = await rovoDevHealthCheck(port);
			const classifiedHealth = classifyRovoDevHealthCheck(health);
			if (classifiedHealth.ready) {
				return;
			}

			if (classifiedHealth.terminal) {
				const terminalError = new Error(
					`Port ${port} is not ready: ${classifiedHealth.message || classifiedHealth.status}`
				);
				terminalError.healthStatus = classifiedHealth.status;
				terminalError.healthReason = classifiedHealth.reason;
				terminalError.healthDetail = classifiedHealth.detail;
				throw terminalError;
			}
		} catch (error) {
			if (error?.healthReason) {
				throw error;
			}
			// Healthcheck failed — port is still clearing or unreachable
			await new Promise((resolve) => setTimeout(resolve, READY_PROBE_INTERVAL_MS));
		}
	}

	// Exhausted all probe attempts — port is not recovering
	throw new Error(`Port ${port} did not become ready after ${READY_PROBE_MAX_ATTEMPTS} probes`);
}

/**
 * Check whether a RovoDev Serve instance is reachable.
 * Reads the port files written by `dev-rovodev.js` and pings health endpoints.
 * Creates/updates the pool with all healthy ports.
 */
async function refreshRovoDevAvailability() {
	try {
		const ports = readRovoDevPorts();
		if (ports.length === 0) {
			if (_rovoDevPool) {
				_rovoDevPool.shutdown();
				_rovoDevPool = null;
				initPool(null);
			}
			_rovoDevAvailable = false;
			_rovoDevChecked = true;
			return false;
		}

		// Health-check each port
		const healthyPorts = [];
		for (const port of ports) {
			try {
				const health = await rovoDevHealthCheck(port);
				const classifiedHealth = classifyRovoDevHealthCheck(health);
				if (classifiedHealth.ready) {
					healthyPorts.push(port);
					continue;
				}

				if (classifiedHealth.terminal) {
					console.warn("[ROVODEV] Port health requires attention", {
						port,
						status: classifiedHealth.status,
						reason: classifiedHealth.reason,
						message: classifiedHealth.message,
					});
					continue;
				}

				debugLog("ROVODEV", `Port ${port} health check returned ${classifiedHealth.status || "unknown"}`, {
					status: classifiedHealth.status,
					reason: classifiedHealth.reason,
				});
			} catch (healthCheckErr) {
				debugLog("ROVODEV", `Port ${port} health check failed`, {
					error: healthCheckErr.message,
				});
			}
		}

		if (healthyPorts.length === 0) {
			if (_rovoDevPool) {
				_rovoDevPool.shutdown();
				_rovoDevPool = null;
				initPool(null);
			}
			_rovoDevAvailable = false;
			_rovoDevChecked = true;
			return false;
		}

		// Set the env var for backward compat (first healthy port)
		process.env.ROVODEV_PORT = String(healthyPorts[0]);

		if (_rovoDevPool) {
			// In-place update: preserves busy handles instead of destroying them
			_rovoDevPool.updatePorts(healthyPorts);
		} else {
			_rovoDevPool = createRovoDevPool(healthyPorts, {
				waitForReady: waitForPortReady,
				onStaleBusyPort: (port) => {
					console.warn(`[ROVODEV] Attempting cancel on stale busy port ${port}`);
					rovoDevCancelChat(port, { timeoutMs: 5_000 }).catch(() => {});
				},
				onPortAvailable: () => {
					void startNextQueuedFutureChatRun();
				},
			});
			initPool(_rovoDevPool);
		}

		if (healthyPorts.length === 1) {
			console.log(`[ROVODEV] Serve available on port ${healthyPorts[0]}`);
		} else {
			console.log(`[ROVODEV] Pool initialized: ${healthyPorts.length} ports (${healthyPorts.join(", ")})`);
		}

		_rovoDevAvailable = true;
		_rovoDevChecked = true;
		return true;
	} catch (err) {
		_rovoDevAvailable = false;
		_rovoDevChecked = true;
		debugLog("ROVODEV", "Not available", { error: err.message });
		return false;
	}
}

/**
 * Returns true if RovoDev Serve is available. Uses cached result if already checked,
 * otherwise performs a fresh check. The port file is re-read on each call to detect
 * if RovoDev was started or stopped since last check.
 * 
 * Periodically refreshes the pool to pick up newly available ports.
 */
async function isRovoDevAvailable() {
	const fs = require("fs");
	const portsFileExists = fs.existsSync(ROVODEV_PORTS_FILE);
	const portFileExists = fs.existsSync(ROVODEV_PORT_FILE);

	// If both port files disappeared, RovoDev was stopped
	if (!portsFileExists && !portFileExists) {
		if (_rovoDevAvailable) {
			console.error("[ROVODEV] Port files removed — RovoDev Serve is no longer available");
			if (_rovoDevPool) {
				_rovoDevPool.shutdown();
				_rovoDevPool = null;
				initPool(null);
			}
		}
		_rovoDevAvailable = false;
		_rovoDevChecked = true;
		return false;
	}

	// If the port file appeared or we haven't checked yet, do a fresh health check
	if (!_rovoDevChecked || !_rovoDevAvailable) {
		return refreshRovoDevAvailability();
	}

	// Periodically refresh pool to pick up newly healthy ports (every 60 seconds)
	const now = Date.now();
	if (!_rovoDevLastRefresh) {
		_rovoDevLastRefresh = now;
	}
	if (now - _rovoDevLastRefresh > 60000) {
		_rovoDevLastRefresh = now;
		return refreshRovoDevAvailability();
	}

	return _rovoDevAvailable;
}

const app = express();
const port = process.env.PORT || 8080;
console.log(`[STARTUP] Port configured: ${port}`);
const aiGatewayProvider = createAIGatewayProvider({ logger: console });

// Debug logging
const DEBUG = process.env.DEBUG === "true";
function debugLog(section, message, data) {
	if (DEBUG) {
		console.log(`[DEBUG][${section}] ${message}`, data ? JSON.stringify(data, null, 2) : "");
	}
}

const CLARIFICATION_WIDGET_TYPE = "question-card";
const CLARIFICATION_MAX_ROUNDS = 3;
const CLARIFICATION_MAX_PRESET_OPTIONS = 8;
const CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER = "Tell Rovo what to do...";
// Tool-only question-card routing: do not auto-convert plain assistant text
// into question cards unless explicitly re-enabled for legacy behavior.
const QUESTION_CARD_TEXT_EXTRACTION_FALLBACK_ENABLED = isTruthyFlag(
	process.env.ENABLE_LEGACY_TEXT_QUESTION_CARD_FALLBACK
);
const TOOL_FIRST_GATE_SKIP_SOURCES = new Set([
	"clarification-submit",
]);
const DEFAULT_CONFLUENCE_BASE_URL = "https://venn-test.atlassian.net/wiki";
const MAX_SLACK_SUMMARY_CHARS = 35000;
const INTERACTIVE_CHAT_FALLBACK_ENABLED = false;
const INTERACTIVE_CHAT_STUCK_PORT_RECOVERY_RETRY_ATTEMPTS = 1;
const INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS = 2;
const INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS =
	DEFAULT_ROVODEV_PORT_RECOVERY_TIMEOUT_MS;
const POST_STREAM_COOLDOWN_MS = 500;
const READY_PROBE_INTERVAL_MS = 100;
const READY_PROBE_MAX_ATTEMPTS = 20; // 100ms × 20 = 2s max

/**
 * Tracks active requests by threadId for cancel routing.
 * Maps threadId → { port, abortController }.
 * @type {Map<string, { port: number; abortController: AbortController }>}
 */
const activeRequests = new Map();
const AI_GATEWAY_ALLOWED_USE_CASES = ["image", "sound", "suggestions"];
const getListeningPidsForPort = createListeningPidReader();

function isTruthyFlag(value) {
	if (typeof value !== "string") {
		return false;
	}

	return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

function isAIGatewayFallbackEnabled() {
	return isTruthyFlag(process.env.AUTO_FALLBACK_TO_AI_GATEWAY);
}

function resolveGatewayUrlForProvider(envVars, preferredProvider, providedGatewayUrl) {
	if (typeof providedGatewayUrl === "string" && providedGatewayUrl.trim().length > 0) {
		return providedGatewayUrl.trim();
	}

	if (preferredProvider === "google") {
		return envVars.AI_GATEWAY_URL_GOOGLE || envVars.AI_GATEWAY_URL;
	}

	return envVars.AI_GATEWAY_URL || envVars.AI_GATEWAY_URL_GOOGLE;
}

function getAIGatewayConfigReport(envVars = getEnvVars()) {
	return {
		AI_GATEWAY_URL: envVars.AI_GATEWAY_URL ? "SET" : "MISSING",
		AI_GATEWAY_URL_GOOGLE: envVars.AI_GATEWAY_URL_GOOGLE ? "SET" : "MISSING",
		AI_GATEWAY_USE_CASE_ID: envVars.AI_GATEWAY_USE_CASE_ID ? "SET" : "MISSING",
		AI_GATEWAY_CLOUD_ID: envVars.AI_GATEWAY_CLOUD_ID ? "SET" : "MISSING",
		AI_GATEWAY_USER_ID: envVars.AI_GATEWAY_USER_ID ? "SET" : "MISSING",
		ASAP_ISSUER: process.env.ASAP_ISSUER ? "SET" : "MISSING",
		ASAP_KID: process.env.ASAP_KID ? "SET" : "MISSING",
		ASAP_PRIVATE_KEY: process.env.ASAP_PRIVATE_KEY ? "SET" : "MISSING",
	};
}

function hasGatewayUrlConfigured(envVars = getEnvVars()) {
	return Boolean(envVars.AI_GATEWAY_URL || envVars.AI_GATEWAY_URL_GOOGLE);
}

function classifyAIGatewayFailureStage(error) {
	const message = error instanceof Error ? error.message : String(error ?? "");

	if (
		/AI Gateway URL is not configured|Server configuration error|AI_GATEWAY_URL|AI_GATEWAY_USE_CASE_ID|AI_GATEWAY_CLOUD_ID|AI_GATEWAY_USER_ID/i.test(message)
	) {
		return "config";
	}

	if (/ASAP_|authentication|Authorization|status 401|status 403|auth/i.test(message)) {
		return "auth";
	}

	if (/stream|SSE|response body is empty|timeout|timed out/i.test(message)) {
		return "stream";
	}

	return "request";
}

function createRovoDevUnavailableError() {
	const error = new Error(
		"RovoDev Serve is required but not available. " +
		"Please start RovoDev Serve with 'pnpm run rovodev' before using this feature."
	);
	error.code = "ROVODEV_UNAVAILABLE";
	error.backendSelected = "rovodev";
	error.failureStage = "unavailable";
	return error;
}

function isRovoDevConnectionFailure(error) {
	const message = error instanceof Error ? error.message : String(error ?? "");
	return /RovoDev connection failed|ECONNREFUSED|EHOSTUNREACH|Request timed out/i.test(message);
}

function normalizeAIGatewayError(error) {
	const normalizedError = error instanceof Error ? error : new Error(String(error));
	normalizedError.backendSelected = "ai-gateway";
	normalizedError.failureStage = classifyAIGatewayFailureStage(normalizedError);
	return normalizedError;
}

/**
 * Resolve which backend to use.
 *
 * @param {{ backendPreference?: "rovodev" | "ai-gateway" }} [opts]
 * @returns {Promise<{ backend: "rovodev" | "ai-gateway" | null; rovoDevAvailable: boolean }>}
 */
async function resolvePreferredBackend({ backendPreference = "rovodev" } = {}) {
	if (backendPreference === "ai-gateway") {
		return {
			backend: "ai-gateway",
			rovoDevAvailable: false,
		};
	}

	const rovoDevAvailable = await isRovoDevAvailable();

	if (rovoDevAvailable) {
		return {
			backend: "rovodev",
			rovoDevAvailable,
		};
	}

	return {
		backend: null,
		rovoDevAvailable,
	};
}

function sendGatewayErrorResponse(res, error, fallbackErrorMessage) {
	if (error && error.code === "ROVODEV_UNAVAILABLE") {
		return res.status(503).json({
			error: "RovoDev Serve is required but not available",
			details: error.message,
			backendSelected: "rovodev",
			failureStage: "unavailable",
		});
	}

	if (
		error &&
		(error.code === "ROVODEV_CHAT_IN_PROGRESS_TIMEOUT" ||
			isChatInProgressError(error))
	) {
		return res.status(409).json({
			error: "RovoDev chat turn is still in progress",
			details:
				"Another request is still finishing for this chat session. Please wait a moment and try again.",
			code: "ROVODEV_CHAT_IN_PROGRESS",
			backendSelected: "rovodev",
			failureStage: "stream",
		});
	}

	if (error && error.backendSelected === "ai-gateway") {
		const stage = error.failureStage || classifyAIGatewayFailureStage(error);
		const statusCode = stage === "config" ? 500 : 502;
		return res.status(statusCode).json({
			error: fallbackErrorMessage || "AI Gateway request failed",
			details: error.message,
			backendSelected: "ai-gateway",
			failureStage: stage,
		});
	}

	return res.status(500).json({
		error: fallbackErrorMessage || "Internal server error",
		details: error instanceof Error ? error.message : String(error),
		backendSelected: "unknown",
		failureStage: "request",
	});
}

async function streamTextViaAIGateway({
	system,
	prompt,
	messages,
	maxOutputTokens = 2000,
	temperature = 1,
	provider,
	model,
	gatewayUrl,
	onTextDelta,
	onFile,
}) {
	const envVars = getEnvVars();
	const rawGatewayUrl = resolveGatewayUrlForProvider(
		envVars,
		typeof provider === "string" ? provider.trim() : null,
		gatewayUrl
	);

	if (!rawGatewayUrl) {
		throw new Error("AI Gateway URL is not configured.");
	}

	const resolvedGatewayUrl = resolveGatewayUrl(rawGatewayUrl) || rawGatewayUrl;
	const endpointType = detectEndpointType(resolvedGatewayUrl);

	if (endpointType === "bedrock") {
		return streamBedrockGatewayManualSse({
			gatewayUrl: resolvedGatewayUrl,
			envVars,
			system: typeof system === "string" ? system : undefined,
			prompt: typeof prompt === "string" ? prompt : undefined,
			maxOutputTokens,
			onTextDelta,
		});
	}

	const fallbackModel = endpointType === "openai" ? envVars.OPENAI_MODEL : envVars.GOOGLE_IMAGE_MODEL;
	return streamGoogleGatewayManualSse({
		gatewayUrl: resolvedGatewayUrl,
		envVars,
		model: typeof model === "string" && model.trim() ? model.trim() : fallbackModel,
		system: typeof system === "string" ? system : undefined,
		prompt: typeof prompt === "string" ? prompt : undefined,
		messages,
		maxOutputTokens,
		temperature,
		onTextDelta,
		onFile,
	});
}

app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.text({ limit: "50mb", type: "text/markdown" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use((error, _req, res, next) => {
	if (error?.type === "entity.too.large" || error?.status === 413) {
		return res.status(413).json({
			error: "Request payload is too large.",
			reason: "payload_too_large",
			details:
				"The request included more data than this endpoint can process, often from inline image/file data in chat history. You can continue chatting after starting a new thread or trimming history.",
		});
	}

	return next(error);
});

console.log("[STARTUP] Middleware configured");

let buildUserMessage;
let buildQuestionCardSkipNotification;
try {
	let config;
	try {
		config = require("./rovo/config");
		console.log("[STARTUP] config loaded from ./rovo (Docker path)");
	} catch {
		config = require("../rovo/config");
		console.log("[STARTUP] config loaded from ../rovo (local dev path)");
	}
	buildUserMessage = config.buildUserMessage;
	buildQuestionCardSkipNotification = config.buildQuestionCardSkipNotification;
	console.log("[STARTUP] rovo config loaded successfully");
} catch (error) {
	console.warn("[STARTUP] rovo config failed to load:", error.message);
	console.warn("[STARTUP] Using fallback functions - config did not load!");
	buildUserMessage = (message) => message;
	buildQuestionCardSkipNotification = () => "[Question Card Dismissed]\nThe user skipped the clarification questions.\n[End Question Card Dismissed]";
}

/**
 * Generates text using the best available backend.
 */
async function generateTextViaGateway({
	system,
	prompt,
	messages,
	maxOutputTokens = 2000,
	temperature = 0.4,
	provider,
	gatewayUrl,
	signal,
	backendPreference = "rovodev",
}) {
	const backendSelection = await resolvePreferredBackend({ backendPreference });
	if (backendSelection.backend === "rovodev") {
		debugLog("GENERATE", "Routing through RovoDev Serve");
		try {
			return await generateTextViaRovoDev({
				system,
				prompt,
				conflictPolicy: "wait-for-turn",
				timeoutMs: WAIT_FOR_TURN_TIMEOUT_MS,
				signal,
			});
		} catch (rovoDevError) {
			const is409Timeout =
				rovoDevError?.code === "ROVODEV_CHAT_IN_PROGRESS_TIMEOUT" ||
				isChatInProgressError(rovoDevError);
			const canFallback =
				is409Timeout &&
				backendPreference === "ai-gateway" &&
				hasGatewayUrlConfigured();
			if (!canFallback) {
				throw rovoDevError;
			}
			console.warn(
				"[generateTextViaGateway] RovoDev 409 timeout — falling back to AI Gateway"
			);
		}
	}

	if (backendSelection.backend !== "ai-gateway") {
		throw createRovoDevUnavailableError();
	}

	debugLog("GENERATE", "Routing through AI Gateway");
	try {
			return await aiGatewayProvider.generateText({
				system,
				prompt,
				messages,
				maxOutputTokens,
				temperature,
				provider,
				gatewayUrl,
				signal,
			});
	} catch (error) {
		throw normalizeAIGatewayError(error);
	}
}

function buildRovoDevTextGenerationMessage({ system, prompt }) {
	let fullMessage = "";
	if (system) {
		fullMessage += `[System Instructions]\n${system}\n[End System Instructions]\n\n`;
	}
	fullMessage += prompt;
	return fullMessage;
}

async function streamTextViaGateway({
	system,
	prompt,
	messages,
	maxOutputTokens = 2000,
	temperature = 0.4,
	provider,
	gatewayUrl,
	signal,
	backendPreference = "rovodev",
	onTextDelta,
}) {
	const backendSelection = await resolvePreferredBackend({ backendPreference });
	let bufferedText = "";
	const handleTextDelta = (delta) => {
		if (typeof delta !== "string" || delta.length === 0) {
			return;
		}

		bufferedText += delta;
		if (typeof onTextDelta === "function") {
			onTextDelta(delta);
		}
	};

	if (backendSelection.backend === "rovodev") {
		debugLog("STREAM_GENERATE", "Routing through RovoDev Serve");
		try {
			await streamViaRovoDev({
				message: buildRovoDevTextGenerationMessage({ system, prompt }),
				onTextDelta: handleTextDelta,
				conflictPolicy: "wait-for-turn",
				timeoutMs: WAIT_FOR_TURN_TIMEOUT_MS,
				signal,
			});
			return bufferedText.trim();
		} catch (rovoDevError) {
			const is409Timeout =
				rovoDevError?.code === "ROVODEV_CHAT_IN_PROGRESS_TIMEOUT" ||
				isChatInProgressError(rovoDevError);
			const canFallback =
				is409Timeout &&
				backendPreference === "ai-gateway" &&
				hasGatewayUrlConfigured();
			if (!canFallback) {
				throw rovoDevError;
			}
			console.warn(
				"[streamTextViaGateway] RovoDev 409 timeout — falling back to AI Gateway"
			);
		}
	}

	if (backendSelection.backend !== "ai-gateway") {
		throw createRovoDevUnavailableError();
	}

	debugLog("STREAM_GENERATE", "Routing through AI Gateway");
	try {
		return await aiGatewayProvider.streamText({
			system,
			prompt,
			messages,
			maxOutputTokens,
			temperature,
			provider,
			gatewayUrl,
			signal,
			onTextDelta: handleTextDelta,
		});
	} catch (error) {
		throw normalizeAIGatewayError(error);
	}
}

function mapUiMessagesToConversation(messages) {
	if (!Array.isArray(messages)) {
		return { message: "", conversationHistory: [] };
	}

	const conversation = messages
		.map((message) => {
			if (!message || (message.role !== "user" && message.role !== "assistant")) {
				return null;
			}

			const content = extractTextFromUiParts(message.parts);
			if (!content) {
				return null;
			}

			return {
				type: message.role,
				content,
			};
		})
		.filter(Boolean);

	let currentUserMessageIndex = -1;
	for (let index = conversation.length - 1; index >= 0; index--) {
		if (conversation[index].type === "user") {
			currentUserMessageIndex = index;
			break;
		}
	}

	if (currentUserMessageIndex === -1) {
		return { message: "", conversationHistory: conversation };
	}

	return {
		message: conversation[currentUserMessageIndex].content,
		conversationHistory: conversation.slice(0, currentUserMessageIndex),
	};
}

const GENUI_META_PREFIX = "[genui-meta]";
const SMART_WIDGET_TYPE_GENUI = "genui-preview";
const SMART_WIDGET_TYPE_AUDIO = "audio-preview";
const SMART_WIDGET_TYPE_IMAGE = "image-preview";
const SMART_VOICE_INPUT_MAX_CHARS = 4000;
const SMART_IMAGE_PROMPT_MAX_CHARS = 4000;
const SOUND_GENERATION_INPUT_MAX_CHARS = 4096;
const CLASSIFIER_JSON_ALLOWED_KEYS = new Set(["intent", "confidence", "reason"]);
const CLASSIFIER_JSON_BUFFER_MAX_CHARS = 320;
const GENUI_FALLBACK_ERROR_TEXT =
	"I couldn't generate an interactive card right now. Please try again later.";
const SMART_WIDTH_CLASS_VALUES = new Set(["compact", "regular", "wide"]);

function getSmartWidthClass(value) {
	const normalizedValue = getNonEmptyString(value);
	if (!normalizedValue) {
		return null;
	}

	const lowerValue = normalizedValue.toLowerCase();
	return SMART_WIDTH_CLASS_VALUES.has(lowerValue) ? lowerValue : null;
}

function inferSmartWidthClass({ containerWidthPx, viewportWidthPx, surface }) {
	const widthSource = containerWidthPx ?? viewportWidthPx;
	if (typeof widthSource === "number") {
		if (widthSource <= 520) {
			return "compact";
		}
		if (widthSource <= 900) {
			return "regular";
		}
		return "wide";
	}

	if (surface === "sidebar" || surface === "multiports") {
		return "compact";
	}
	if (surface === "fullscreen") {
		return "wide";
	}

	return null;
}

function normalizeSmartGenerationOptions(value) {
	if (!value || typeof value !== "object") {
		return {
			enabled: false,
			surface: null,
			containerWidthPx: null,
			viewportWidthPx: null,
			widthClass: null,
		};
	}

	const enabled = value.enabled === true;
	const surface = getNonEmptyString(value.surface);
	const containerWidthPx = getPositiveInteger(value.containerWidthPx);
	const viewportWidthPx = getPositiveInteger(value.viewportWidthPx);
	const explicitWidthClass = getSmartWidthClass(value.widthClass);
	const inferredWidthClass = inferSmartWidthClass({
		containerWidthPx,
		viewportWidthPx,
		surface,
	});

	return {
		enabled,
		surface,
		containerWidthPx: containerWidthPx ?? null,
		viewportWidthPx: viewportWidthPx ?? null,
		widthClass: explicitWidthClass ?? inferredWidthClass,
	};
}

function isSmartGenerationEnabled(value) {
	const normalized = normalizeSmartGenerationOptions(value);
	return (
		normalized.enabled &&
		typeof normalized.surface === "string" &&
		isSmartRouteTargetSurface(normalized.surface)
	);
}

function mapUiMessagesToRoleContent(messages) {
	if (!Array.isArray(messages)) {
		return [];
	}

	return messages
		.map((message) => {
			if (!message || (message.role !== "assistant" && message.role !== "user")) {
				return null;
			}

			const content = extractTextFromUiParts(message.parts);
			if (!content) {
				return null;
			}

			return {
				role: message.role === "assistant" ? "assistant" : "user",
				content,
			};
		})
		.filter(Boolean);
}

function parseGenuiMetaAndBody(rawText) {
	if (typeof rawText !== "string" || rawText.length === 0) {
		return { meta: null, body: "" };
	}

	const lines = rawText.split("\n");
	const firstLine = lines[0]?.trim() ?? "";
	if (!firstLine.startsWith(GENUI_META_PREFIX)) {
		return { meta: null, body: rawText };
	}

	const maybeJson = firstLine.slice(GENUI_META_PREFIX.length).trim();
	try {
		return {
			meta: JSON.parse(maybeJson),
			body: lines.slice(1).join("\n").trimStart(),
		};
	} catch {
		return { meta: null, body: rawText };
	}
}

function stripSpecBlocks(value) {
	if (typeof value !== "string" || value.length === 0) {
		return "";
	}

	return value
		.replace(/```spec[\s\S]*?```/gi, "")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

function buildAudioDataUrl(audioBytes, contentType) {
	const mimeType = getNonEmptyString(contentType) || "audio/mpeg";
	const base64 = Buffer.from(audioBytes).toString("base64");
	return `data:${mimeType};base64,${base64}`;
}

async function generateSmartGenuiResult({
	roleMessages,
	provider,
	gatewayUrl,
	layoutContext,
	signal,
}) {
	const systemPrompt = getGenuiSystemPrompt({
		strict: true,
		layoutContext,
	});
	const conversationPrompt = roleMessages
		.map((message) => `[${message.role === "assistant" ? "Assistant" : "User"}]\n${message.content}`)
		.join("\n\n");

	const rawText = await generateTextViaGateway({
		system: systemPrompt,
		prompt: conversationPrompt,
		maxOutputTokens: 3500,
		temperature: 0.3,
		signal,
		backendPreference: "ai-gateway",
		...buildSmartGenerationGatewayOptions({
			provider,
		}),
		gatewayUrl,
	});

	const { meta, body } = parseGenuiMetaAndBody(rawText);
	const analysis = analyzeGeneratedText(body);
	const bestSpec = pickBestSpec(analysis);
	const qualityAssessment = assessToolFirstGenuiQuality({
		analysis,
		spec: bestSpec,
		prompt: conversationPrompt,
	});
	return {
		rawText,
		meta,
		spec: bestSpec,
		narrative: stripSpecBlocks(body),
		quality: qualityAssessment.quality,
		analysisSummary: {
			synthesizedChildCount: qualityAssessment.synthesizedChildCount,
			missingChildKeyCount: qualityAssessment.missingChildKeyCount,
			usedSynthesizedSpec: qualityAssessment.usedSynthesizedSpec,
			hasRecoveredPlaceholderSection:
				qualityAssessment.hasRecoveredPlaceholderSection,
			reasons: qualityAssessment.reasons,
		},
	};
}

function getLatestVisibleUserMessage(messages) {
	if (!Array.isArray(messages)) {
		return null;
	}

	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (!message || message.role !== "user") {
			continue;
		}

		const visibility = getNonEmptyString(message?.metadata?.visibility);
		if (visibility === "hidden") {
			continue;
		}

		const text = extractTextFromUiParts(message.parts);
		if (!text) {
			continue;
		}

		return {
			text,
			source: getNonEmptyString(message?.metadata?.source) || null,
		};
	}

	return null;
}

function getLatestUserMessageSource(messages) {
	if (!Array.isArray(messages)) {
		return null;
	}

	for (let index = messages.length - 1; index >= 0; index -= 1) {
		const message = messages[index];
		if (!message || message.role !== "user") {
			continue;
		}

		const source = getNonEmptyString(message?.metadata?.source);
		if (source) {
			return source;
		}
	}

	return null;
}

function createHiddenFutureChatUserMessage(messageId, text) {
	const resolvedText = getNonEmptyString(text);
	if (!resolvedText) {
		return null;
	}

	return {
		id:
			typeof messageId === "string" && messageId.trim().length > 0
				? messageId.trim()
				: `future-chat-hidden-user-${Date.now()}`,
		role: "user",
		metadata: {
			source: "agent-directive",
			visibility: "hidden",
		},
		parts: [
			{
				type: "text",
				text: resolvedText,
				state: "done",
			},
		],
	};
}

function findFutureChatMessageById(messages, messageId) {
	if (!Array.isArray(messages) || typeof messageId !== "string" || !messageId.trim()) {
		return null;
	}

	return (
		messages.find((message) => {
			return (
				message &&
				typeof message === "object" &&
				typeof message.id === "string" &&
				message.id === messageId
			);
		}) ?? null
	);
}

function resolveFutureChatDelegatedPrompt({
	delegatedMessageId,
	requestMessages,
	thread,
}) {
	const resolvedDelegatedMessageId = getNonEmptyString(delegatedMessageId);
	if (!resolvedDelegatedMessageId) {
		return null;
	}

	const candidateMessage =
		findFutureChatMessageById(requestMessages, resolvedDelegatedMessageId) ||
		findFutureChatMessageById(thread?.realtimeMessages, resolvedDelegatedMessageId) ||
		findFutureChatMessageById(thread?.messages, resolvedDelegatedMessageId);
	if (!candidateMessage) {
		return null;
	}

	const text = extractTextFromUiParts(candidateMessage.parts);
	if (!text) {
		return null;
	}

	return {
		messageId: resolvedDelegatedMessageId,
		text,
	};
}

function buildPlanningQuestionCardSessionId(planRequestId) {
	const rawRequestId = getNonEmptyString(planRequestId);
	if (!rawRequestId) {
		return createClarificationSessionId();
	}

	const normalizedRequestId = rawRequestId
		.replace(/[^A-Za-z0-9_-]+/g, "-")
		.replace(/-+/g, "-")
		.replace(/^-|-$/g, "");
	if (!normalizedRequestId) {
		return createClarificationSessionId();
	}

	return `agent-team-${normalizedRequestId}`;
}

function buildSmartClarificationSessionId({ planRequestId, surface }) {
	const normalizedSurface = typeof surface === "string" ? surface.trim().toLowerCase() : "";
	const safeSurface = normalizedSurface ? normalizedSurface : "smart";

	const rawRequestId = getNonEmptyString(planRequestId);
	if (rawRequestId) {
		const normalizedRequestId = rawRequestId
			.replace(/[^A-Za-z0-9_-]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "");
		if (normalizedRequestId) {
			return `smart-${safeSurface}-${normalizedRequestId}`;
		}
	}

	return `smart-${safeSurface}-${createClarificationSessionId()}`;
}


const futureChatThreadManager = createFutureChatThreadManager({
	baseDir: path.join(__dirname, "data"),
	logger: console,
});
const futureChatVoteManager = createFutureChatVoteManager({
	baseDir: path.join(__dirname, "data"),
});
const futureChatDocumentManager = createFutureChatDocumentManager({
	baseDir: path.join(__dirname, "data"),
});
const futureChatUploadManager = createFutureChatUploadManager({
	baseDir: path.join(__dirname, "data"),
});
const futureChatGeneratedFilesManager = createFutureChatGeneratedFilesManager({
	baseDir: path.join(__dirname, "data"),
	projectRoot: path.join(__dirname, ".."),
	logger: console,
});
const futureChatRunManager = createFutureChatRunManager({
	logger: console,
});

const makeConfigManager = makeFs.createConfigManagerCompat();
const appRegistry = createAppRegistry({
	baseDir: path.join(__dirname, "data", "make"),
	logger: console,
});

const makeRunManager = createMakeRunManager({
	baseDir: path.join(__dirname, "data", "make"),
	buildSystemPrompt: null, // Not used in RovoDev-only mode
	configManager: makeConfigManager,
	appRegistry,
	logger: console,
	isRovoDevAvailable,
	isAIGatewayFallbackEnabled: () => false,
});

function buildFutureChatFileUrl(uploadId) {
	return `/api/future-chat/files/${encodeURIComponent(uploadId)}`;
}

function createFutureChatThreadId() {
	return `future-chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractFutureChatUploadIdFromUrl(rawUrl) {
	if (typeof rawUrl !== "string" || rawUrl.length === 0) {
		return null;
	}

	const match = rawUrl.match(/\/api\/future-chat\/files\/([^/?#]+)/u);
	if (!match?.[1]) {
		return null;
	}

	try {
		return decodeURIComponent(match[1]);
	} catch {
		return match[1];
	}
}

function collectFutureChatUploadIdsFromMessages(messages) {
	if (!Array.isArray(messages)) {
		return [];
	}

	const uploadIds = new Set();
	for (const message of messages) {
		if (!message || typeof message !== "object" || !Array.isArray(message.parts)) {
			continue;
		}

		for (const part of message.parts) {
			if (!part || part.type !== "file") {
				continue;
			}

			const uploadId = extractFutureChatUploadIdFromUrl(part.url);
			if (uploadId) {
				uploadIds.add(uploadId);
			}
		}
	}

	return [...uploadIds];
}

async function persistFutureChatMessageFiles(threadId, messages) {
	if (!Array.isArray(messages)) {
		return [];
	}

	const nextMessages = [];
	for (const message of messages) {
		if (!message || typeof message !== "object") {
			continue;
		}

		const messageParts = Array.isArray(message.parts) ? message.parts : [];
		const nextParts = [];
		for (const part of messageParts) {
			if (!part || typeof part !== "object" || part.type !== "file") {
				nextParts.push(part);
				continue;
			}

			if (typeof part.url === "string" && part.url.startsWith("data:")) {
				const upload = await futureChatUploadManager.createUploadFromDataUrl({
					threadId,
					filename:
						typeof part.filename === "string" && part.filename.trim()
							? part.filename
							: typeof part.name === "string" && part.name.trim()
								? part.name
								: "attachment.bin",
					mediaType:
						typeof part.mediaType === "string" && part.mediaType.trim()
							? part.mediaType
							: "application/octet-stream",
					dataUrl: part.url,
				});
				nextParts.push({
					...part,
					filename: upload.filename,
					url: buildFutureChatFileUrl(upload.id),
				});
				continue;
			}

			nextParts.push(part);
		}

		nextMessages.push({
			...message,
			parts: nextParts,
		});
	}

	return nextMessages;
}

async function synchronizeFutureChatThreadGeneratedFiles(thread) {
	if (!thread?.id) {
		return thread;
	}

	await futureChatGeneratedFilesManager.backfillFromThread(thread);
	await futureChatGeneratedFilesManager.captureRootFilesToWorkspace(thread.id);
	return thread;
}

function buildFutureChatArtifactContext(rawArtifactContext) {
	if (!rawArtifactContext || typeof rawArtifactContext !== "object") {
		return null;
	}

	const title = getNonEmptyString(rawArtifactContext.title);
	const kind = getNonEmptyString(rawArtifactContext.kind);
	const content = getNonEmptyString(rawArtifactContext.content);
	if (!content) {
		return null;
	}

	return [
		"[FUTURE CHAT ARTIFACT CONTEXT]",
		title ? `Active artifact title: ${title}` : null,
		kind ? `Active artifact kind: ${kind}` : null,
		"Treat the following artifact content as editable working context for the user's next request.",
		"",
		content,
		"[END FUTURE CHAT ARTIFACT CONTEXT]",
	]
		.filter((entry) => typeof entry === "string" && entry.length > 0)
		.join("\n");
}

function buildFutureChatArtifactSystemPrompt({
	mode,
	title,
	kind,
}) {
	const normalizedKind = getNonEmptyString(kind) || "text";
	const header = mode === "update"
		? `You are updating an existing ${normalizedKind} artifact titled "${title}".`
		: `You are generating a new ${normalizedKind} artifact titled "${title}".`;

	const contentRule = normalizedKind === "code"
		? "Return only the completed code artifact. Do not explain the code before or after it."
		: normalizedKind === "sheet"
			? "Return only the table or structured sheet content in markdown. Do not add commentary."
			: "Return only the finished artifact content. Do not add prefatory commentary, assistant framing, or analysis.";

	return [
		header,
		contentRule,
		mode === "update"
			? "Return the complete updated artifact, not a summary of the edits. Apply title changes directly to the artifact content when they affect the document heading."
			: null,
		mode === "update"
			? "When the user changes the artifact title, framing, or subject, regenerate the full artifact so the new version fully matches that request. Do not only rename the heading."
			: null,
		"If essential details are missing, make the most reasonable default assumptions and continue instead of asking follow-up questions.",
		"Be concise when the request is narrow, and fully detailed when the request explicitly asks for a complete draft.",
	]
		.filter((value) => typeof value === "string" && value.length > 0)
		.join("\n");
}

async function generateFutureChatArtifactText({
	mode,
	title,
	kind,
	latestUserMessage,
	conversationHistory,
	contextDescription,
	provider,
	signal,
	onTextDelta,
}) {
	const system = buildFutureChatArtifactSystemPrompt({
		mode,
		title,
		kind,
	});
	const prompt = [
		getNonEmptyString(contextDescription),
		latestUserMessage ? `User request:\n${latestUserMessage}` : null,
	].filter((value) => typeof value === "string" && value.length > 0).join("\n\n");
	const normalizedMessages = Array.isArray(conversationHistory)
		? conversationHistory.map((message) => ({
			role: message.type === "assistant" ? "assistant" : "user",
			content: message.content,
		}))
		: [];
	const maxOutputTokens = kind === "code" ? 3200 : kind === "sheet" ? 2200 : 1800;
	const streamArtifactText = () =>
		streamTextViaGateway({
			system,
			prompt,
			messages: normalizedMessages,
			maxOutputTokens,
			temperature: 0.35,
			provider,
			signal,
			onTextDelta,
		});

	try {
		return await streamArtifactText();
	} catch (error) {
		const errorMessage =
			error instanceof Error ? error.message : String(error);
		if (!/pending deferred tool request/i.test(errorMessage)) {
			throw error;
		}

		console.warn("[FUTURE-CHAT] Artifact generation hit pending deferred tool request; clearing RovoDev chat state and retrying once.");
		try {
			await rovoDevCancelChat();
		} catch (cancelError) {
			console.warn(
				"[FUTURE-CHAT] Failed to cancel stale RovoDev chat state before retry:",
				cancelError instanceof Error ? cancelError.message : cancelError,
			);
		}

		return streamArtifactText();
	}
}

function deriveFutureChatArtifactDeltaType(kind) {
	return normalizeArtifactKind(kind) === "code" ? "data-codeDelta" : "data-textDelta";
}

async function generateFutureChatArtifactTitleFromContent({
	content,
	provider,
	signal,
}) {
	const normalizedContent = getNonEmptyString(content);
	if (!normalizedContent) {
		return null;
	}

	const titlePrompt = [
		"Generate a concise artifact title that matches this content.",
		"Return ONLY the title text. No quotes, no punctuation at the end, no explanation.",
		"",
		normalizedContent.slice(0, 4000),
	].join("\n");

	try {
		const text = await aiGatewayProvider.generateText({
			system: "You generate concise artifact titles. Respond with only the title, 2-6 words.",
			prompt: titlePrompt,
			maxOutputTokens: 30,
			temperature: 0.2,
			provider,
			signal,
		});

		return sanitizeFutureChatArtifactTitle(text);
	} catch (error) {
		console.warn(
			"[FUTURE-CHAT] Failed to generate artifact title from content, falling back:",
			error instanceof Error ? error.message : error,
		);
		return null;
	}
}

function resolveFutureChatArtifactKind({
	action,
	activeArtifact,
	decisionKind,
}) {
	if (action === "updateDocument") {
		return normalizeArtifactKind(decisionKind || activeArtifact?.kind);
	}

	return normalizeArtifactKind(decisionKind);
}

async function resolveFutureChatArtifactDecision({
	activeArtifact,
	artifactSteering,
	conversationHistory,
	latestUserMessage,
	provider,
	signal,
	streamingArtifact,
}) {
	const fastDecision = resolveFastFutureChatArtifactIntent({
		activeArtifact,
		artifactSteering,
		latestUserMessage,
		streamingArtifact,
	});
	if (fastDecision) {
		return fastDecision;
	}

	const prompt = buildFutureChatArtifactIntentPrompt({
		activeArtifact,
		artifactSteering,
		conversationHistory,
		latestUserMessage,
		streamingArtifact,
	});
	const sameArtifactVersionRequest = isSameFutureChatArtifactVersionRequest({
		activeArtifact,
		latestUserMessage,
	});
	const explicitlyRequestsNewArtifact = isExplicitNewFutureChatArtifactRequest({
		latestUserMessage,
	});

	const rawDecision = await generateTextViaGateway({
		system: "You classify whether a request should stay in chat or become a document tool action. Return strict JSON only.",
		prompt,
		maxOutputTokens: 220,
		temperature: 0.1,
		provider,
		signal,
		backendPreference: "ai-gateway",
	});
	const parsedDecision = parseFutureChatArtifactIntent(rawDecision, {
		activeArtifact,
		streamingArtifact,
	});
	if (!parsedDecision) {
		throw new Error(
			`[FUTURE-CHAT] Artifact intent classification returned unparseable result: ${JSON.stringify(rawDecision)}`,
		);
	}

	if (sameArtifactVersionRequest && !explicitlyRequestsNewArtifact) {
		return {
			action: "updateDocument",
			title:
				getNonEmptyString(parsedDecision.title) || getNonEmptyString(activeArtifact?.title),
			kind: parsedDecision.kind || normalizeArtifactKind(activeArtifact?.kind),
			cancelStreaming: streamingArtifact?.id ? true : null,
		};
	}

	return parsedDecision;
}

function streamFutureChatArtifactToolResponse({
	artifactAction,
	artifactDocument,
	cancelStreaming,
	changeLabel,
	contextDescription,
	conversationHistory,
	latestUserMessage,
	requestOrigin,
	artifactThreadId,
	previousActiveDocumentId,
	provider,
	signal,
	suggestedQuestions,
}) {
	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			// Emit cancel-streaming signal before artifact data so the frontend
			// can abort the old stream before the new one starts
			if (cancelStreaming === true) {
				writer.write({
					type: "data-cancel-streaming",
					data: null,
					transient: true,
				});
			}

			writer.write({
				type: "data-thinking-status",
				data: {
					label: artifactAction === "updateDocument" ? "Updating artifact" : "Generating artifact",
					activity: "results",
					source: "backend",
				},
				transient: true,
			});

			writer.write({
				type: "data-kind",
				data: artifactDocument.kind,
				transient: true,
			});
			writer.write({
				type: "data-id",
				data: artifactDocument.id,
				transient: true,
			});
			writer.write({
				type: "data-title",
				data: artifactDocument.title,
				transient: true,
			});
			writer.write({
				type: "data-clear",
				data: null,
				transient: true,
			});

			const deltaType = deriveFutureChatArtifactDeltaType(artifactDocument.kind);
			const {
				contentToPersist,
				persistedArtifactDocument,
				titleChanged,
				kindChanged,
			} = await generateAndPersistFutureChatArtifact({
				artifactAction,
				artifactDocument,
				changeLabel,
				fallbackTitle: artifactDocument.title,
				latestUserMessage,
				generateArtifactText: ({ onTextDelta }) =>
					generateFutureChatArtifactText({
						mode: artifactAction === "updateDocument" ? "update" : "create",
						title: artifactDocument.title,
						kind: artifactDocument.kind,
						latestUserMessage,
						conversationHistory,
						contextDescription,
						provider,
						signal,
						onTextDelta: (delta) => {
							writer.write({
								type: deltaType,
								data: delta,
								transient: true,
							});
							if (typeof onTextDelta === "function") {
								onTextDelta(delta);
							}
						},
					}),
				inferArtifactKindFromContent: inferFutureChatArtifactKindFromContent,
				futureChatDocumentManager,
				onCreateFailure: async () => {
					const cleanupTasks = [
						futureChatDocumentManager.deleteDocument(artifactDocument.id),
					];
					if (artifactThreadId) {
						cleanupTasks.push(
							futureChatThreadManager.updateThread(artifactThreadId, {
								activeDocumentId: previousActiveDocumentId,
							}),
						);
					}

					const cleanupResults = await Promise.allSettled(cleanupTasks);
					for (const cleanupResult of cleanupResults) {
						if (cleanupResult.status === "rejected") {
							console.warn(
								"[FUTURE-CHAT] Failed to clean up after artifact create failure:",
								cleanupResult.reason instanceof Error
									? cleanupResult.reason.message
									: cleanupResult.reason,
							);
						}
					}
				},
				resolveGeneratedTitle: ({ content }) =>
					generateFutureChatArtifactTitleFromContent({
						content,
						provider,
						signal,
					}),
			});

			if (titleChanged) {
				writer.write({
					type: "data-title",
					data: persistedArtifactDocument.title,
					transient: true,
				});
			}
			if (kindChanged) {
				writer.write({
					type: "data-kind",
					data: persistedArtifactDocument.kind,
					transient: true,
				});
			}

			writer.write({
				type: "data-finish",
				data: null,
				transient: true,
			});
			writer.write({
				type: "data-artifact-result",
				data: {
					documentId: persistedArtifactDocument.id,
					title: persistedArtifactDocument.title,
					kind: persistedArtifactDocument.kind,
					action:
						artifactAction === "updateDocument"
							? "update"
							: "create",
				},
			});

			const textId = `future-chat-artifact-summary-${Date.now()}`;
			const summaryText =
				artifactAction === "updateDocument"
					? `Updated artifact "${persistedArtifactDocument.title}".`
					: `Created artifact "${persistedArtifactDocument.title}".`;
			writer.write({ type: "text-start", id: textId });
			writer.write({
				type: "text-delta",
				id: textId,
				delta: summaryText,
			});
			writer.write({ type: "text-end", id: textId });

			writer.write(createRouteDecisionPart({
				intent:
					artifactAction === "updateDocument"
						? "artifact_update"
						: "artifact_create",
				origin: requestOrigin,
				reason: "intent_task_toolable",
			}, { transient: true }));
			writer.write({
				type: "data-turn-complete",
				data: { timestamp: new Date().toISOString() },
			});

			let resolvedSuggestedQuestions = suggestedQuestions;
			if (!Array.isArray(resolvedSuggestedQuestions)) {
				resolvedSuggestedQuestions = await generateSuggestedQuestions({
					message: latestUserMessage,
					conversationHistory,
					assistantResponse: contentToPersist,
					signal,
				}).catch(() => []);
			}

			if (Array.isArray(resolvedSuggestedQuestions) && resolvedSuggestedQuestions.length > 0) {
				writer.write({
					type: "data-suggested-questions",
					data: {
						questions: resolvedSuggestedQuestions,
					},
				});
			}
		},
		onError: (error) =>
			error instanceof Error ? error.message : "Failed to stream Future Chat artifact",
	});

	return createUIMessageStreamResponse({ stream });
}

async function handleFutureChatArtifactToolRequest({
	activeArtifact,
	activeDocument,
	artifactSteering,
	contextDescription,
	requestOrigin,
	requestBody,
	signal,
	streamingArtifact,
	threadId,
}) {
	const { message: latestUserMessage, conversationHistory } =
		mapUiMessagesToConversation(requestBody.messages);
	if (!latestUserMessage) {
		return false;
	}

	const legacyArtifactMode = getNonEmptyString(requestBody.futureArtifactMode);
	const legacyArtifactTitle = getNonEmptyString(requestBody.futureArtifactTitle);
	const legacyArtifactKind = getNonEmptyString(requestBody.futureArtifactKind);
	const decision =
		legacyArtifactMode && legacyArtifactTitle
			? {
					action: legacyArtifactMode === "update" ? "updateDocument" : "createDocument",
					title: legacyArtifactTitle,
					kind: normalizeArtifactKind(legacyArtifactKind),
					cancelStreaming: null,
				}
				: await resolveFutureChatArtifactDecision({
					activeArtifact,
					artifactSteering,
					conversationHistory,
					latestUserMessage,
					provider: getNonEmptyString(requestBody.provider),
					signal,
					streamingArtifact,
				});

	if (decision.action === "chat") {
		return false;
	}

	const artifactContextBlock =
		decision.action === "updateDocument"
			? buildFutureChatArtifactContext(activeArtifact)
			: null;
	const resolvedContextDescription = artifactContextBlock
		? contextDescription
			? `${artifactContextBlock}\n\n${contextDescription}`
			: artifactContextBlock
		: contextDescription;

	const artifactTitle = deriveFutureChatArtifactTitle({
		action: decision.action,
		activeArtifact,
		conversationHistory,
		decisionTitle: decision.title,
		latestUserMessage,
	});
	const artifactKind = resolveFutureChatArtifactKind({
		action: decision.action,
		activeArtifact,
		decisionKind: decision.kind,
	});

	let artifactDocument;
	let existingDocument = null;
	const previousActiveDocumentId =
		getNonEmptyString(activeDocument?.id) || getNonEmptyString(activeArtifact?.id);
	let changeLabel = deriveFutureChatVersionChangeLabel({
		artifactAction: decision.action,
		artifactSteering,
		latestUserMessage,
		nextTitle: artifactTitle,
		previousTitle: getNonEmptyString(activeArtifact?.title),
	});
	if (decision.action === "updateDocument") {
		if (!activeArtifact?.id) {
			return false;
		}

		existingDocument =
			activeDocument?.id === activeArtifact.id
				? activeDocument
				: await futureChatDocumentManager.getDocument(activeArtifact.id);
		if (!existingDocument) {
			return false;
		}

		artifactDocument = {
			id: existingDocument.id,
			title: artifactTitle || existingDocument.title,
			kind: artifactKind || existingDocument.kind,
		};
		changeLabel = deriveFutureChatVersionChangeLabel({
			artifactAction: decision.action,
			artifactSteering,
			latestUserMessage,
			nextTitle: artifactDocument.title,
			previousTitle: existingDocument.title,
		});
	} else {
		if (!threadId) {
			return false;
		}

		const documentShell = await futureChatDocumentManager.createDocumentShell({
			threadId,
			title: artifactTitle,
			kind: artifactKind,
		});
		artifactDocument = {
			id: documentShell.id,
			title: documentShell.title,
			kind: documentShell.kind,
		};
	}

	const artifactThreadId =
		getNonEmptyString(threadId) || getNonEmptyString(existingDocument?.threadId);
	if (artifactThreadId) {
		void futureChatThreadManager.updateThread(artifactThreadId, {
			activeDocumentId: artifactDocument.id,
		}).catch((error) => {
			console.warn(
				"[FUTURE-CHAT] Failed to persist active artifact selection:",
				error instanceof Error ? error.message : error,
			);
		});
	}

	// When cancelStreaming is true, save partial v1 content before starting the new version
	if (decision.cancelStreaming === true && streamingArtifact?.id) {
		const partialContent = getNonEmptyString(streamingArtifact.content);
		if (partialContent) {
			try {
				await futureChatDocumentManager.appendDocumentVersion(streamingArtifact.id, {
					changeLabel: "Partial (replaced)",
					title: streamingArtifact.title,
					kind: streamingArtifact.kind,
					content: partialContent,
				});
			} catch (error) {
				console.warn(
					"[FUTURE-CHAT] Failed to save partial artifact version:",
					error instanceof Error ? error.message : error,
				);
			}
		}
	}

	const response = streamFutureChatArtifactToolResponse({
		artifactAction: decision.action,
		artifactDocument,
		cancelStreaming: decision.cancelStreaming,
		changeLabel,
		contextDescription: resolvedContextDescription,
		conversationHistory,
		latestUserMessage,
		requestOrigin,
		provider: getNonEmptyString(requestBody.provider),
		signal,
		artifactThreadId,
		previousActiveDocumentId,
	});
	return {
		handled: true,
		response,
	};
}

let isProcessingFutureChatRunQueue = false;

async function finalizeFutureChatRun(threadId, run, messages) {
	if (threadId && Array.isArray(messages)) {
		const updatedThread = await futureChatThreadManager.updateThread(threadId, {
			activeRun: null,
			messages,
		});
		await synchronizeFutureChatThreadGeneratedFiles(updatedThread);
	} else {
		await clearFutureChatRunState(threadId);
	}
	if (threadId) {
		activeRequests.delete(threadId);
	}
	futureChatRunManager.clearRun(threadId);
	void startNextQueuedFutureChatRun();
}

async function syncFutureChatThreadSession(threadId, rovoPort, { thread: providedThread } = {}) {
	if (!threadId || !Number.isInteger(rovoPort) || rovoPort <= 0) {
		return providedThread ?? null;
	}

	const currentThread = providedThread ?? await futureChatThreadManager.getThread(threadId);
	if (!currentThread) {
		return null;
	}

	const customTitle =
		getNonEmptyString(currentThread.title) ||
		"Future Chat";

	const existingSessionId = getNonEmptyString(currentThread.sessionId);
	const sessionRecord = await ensureRovoDevSession(rovoPort, {
		sessionId: existingSessionId,
		customTitle,
		timeoutMs: 5_000,
	});

	const nextSessionId = getNonEmptyString(sessionRecord?.sessionId);
	if (!nextSessionId) {
		return currentThread;
	}

	const nextSessionMode = currentThread.sessionMode === "ephemeral"
		? "ephemeral"
		: "persistent";

	if (
		currentThread.sessionId === nextSessionId &&
		currentThread.sessionMode === nextSessionMode
	) {
		return currentThread;
	}

	return futureChatThreadManager.updateThread(threadId, {
		sessionId: nextSessionId,
		sessionMode: nextSessionMode,
	});
}

async function syncFutureChatThreadSessionFromCurrentPort(
	threadId,
	rovoPort,
	{
		sessionMode = "persistent",
		thread: providedThread,
	} = {},
) {
	if (!threadId || !Number.isInteger(rovoPort) || rovoPort <= 0) {
		return providedThread ?? null;
	}

	const currentThread = providedThread ?? await futureChatThreadManager.getThread(threadId);
	if (!currentThread) {
		return null;
	}

	let sessionRecord = null;
	try {
		sessionRecord = await getCurrentRovoDevSession(rovoPort, { timeoutMs: 5_000 });
	} catch (error) {
		console.warn("[FUTURE-CHAT] Failed to read current RovoDev session; falling back to ensure session:", {
			threadId,
			port: rovoPort,
			error: error instanceof Error ? error.message : String(error),
		});
		return syncFutureChatThreadSession(threadId, rovoPort, {
			thread: currentThread,
		});
	}
	const nextSessionId = getNonEmptyString(sessionRecord?.sessionId);
	if (!nextSessionId) {
		console.warn("[FUTURE-CHAT] Current RovoDev session response did not include a session id; falling back to ensure session:", {
			threadId,
			port: rovoPort,
		});
		return syncFutureChatThreadSession(threadId, rovoPort, {
			thread: currentThread,
		});
	}

	const nextSessionMode = sessionMode === "ephemeral" ? "ephemeral" : "persistent";
	if (
		currentThread.sessionId === nextSessionId &&
		currentThread.sessionMode === nextSessionMode
	) {
		return currentThread;
	}

	return futureChatThreadManager.updateThread(threadId, {
		sessionId: nextSessionId,
		sessionMode: nextSessionMode,
	});
}

async function failFutureChatRun(threadId, error) {
	const failurePayload = getFutureChatRunFailurePayload(error);
	const message = failurePayload.message;
	const isAbortLike =
		typeof error === "object"
		&& error !== null
		&& (
			("name" in error && error.name === "AbortError")
			|| /abort/i.test(message)
		);
	const run = futureChatRunManager.getRun(threadId);
	if (run) {
		futureChatRunManager.setRunError(threadId, message);
		if (!isAbortLike) {
			for (const chunk of createFutureChatFailureSseChunks(error)) {
				futureChatRunManager.appendChunk(threadId, chunk);
			}
		}
	}
	await clearFutureChatRunState(threadId);
	if (threadId) {
		activeRequests.delete(threadId);
	}
	futureChatRunManager.clearRun(threadId);
	void startNextQueuedFutureChatRun();
}

const FUTURE_CHAT_MESSAGE_PERSIST_DEBOUNCE_MS = 450;

async function consumeFutureChatManagedResponse({
	initialMessages,
	prependChunk,
	response,
	run,
	stageTrace,
	threadId,
}) {
	const contentType = response.headers.get("content-type") || "";
	if (!contentType.includes("text/event-stream") || !response.body) {
		throw new Error("Future Chat expected an event stream response.");
	}

	const resolvedPort = getPositiveInteger(response.headers.get("x-vpk-rovo-port"));
	if (
		typeof resolvedPort === "number"
		&& Number.isInteger(resolvedPort)
		&& resolvedPort > 0
		&& run.rovoPort !== resolvedPort
	) {
		run.rovoPort = resolvedPort;
		run.updatedAt = new Date().toISOString();
		await persistFutureChatRunState(threadId, run);
	}

	const [broadcastStream, parseStream] = response.body.tee();
	const routeDecisionToSuppress = parseRouteDecisionFromSseChunk(prependChunk);
	if (prependChunk) {
		futureChatRunManager.appendChunk(threadId, prependChunk);
	}

	let latestMessagesSnapshot = Array.isArray(initialMessages) ? [...initialMessages] : [];
	let scheduledPersistTimeout = null;
	let persistInFlight = null;
	let hasPendingPersist = false;

	const clearScheduledPersist = () => {
		if (scheduledPersistTimeout !== null) {
			clearTimeout(scheduledPersistTimeout);
			scheduledPersistTimeout = null;
		}
	};

	const flushPersistedMessages = async () => {
		clearScheduledPersist();
		if (!threadId) {
			return;
		}
		if (persistInFlight) {
			hasPendingPersist = true;
			await persistInFlight;
			return;
		}

		const snapshotToPersist = latestMessagesSnapshot;
		persistInFlight = persistFutureChatRunMessagesSnapshot(
			threadId,
			snapshotToPersist,
		)
			.catch((error) => {
				console.warn("[FUTURE-CHAT] Failed to persist in-flight thread messages:", {
					threadId,
					error: error instanceof Error ? error.message : String(error),
				});
			})
			.finally(() => {
				persistInFlight = null;
			});
		await persistInFlight;

		if (hasPendingPersist && latestMessagesSnapshot !== snapshotToPersist) {
			hasPendingPersist = false;
			await flushPersistedMessages();
			return;
		}

		hasPendingPersist = false;
	};

	const schedulePersistedMessages = (messages) => {
		latestMessagesSnapshot = Array.isArray(messages) ? [...messages] : [];
		if (!threadId || scheduledPersistTimeout !== null) {
			return;
		}

		scheduledPersistTimeout = setTimeout(() => {
			void flushPersistedMessages();
		}, FUTURE_CHAT_MESSAGE_PERSIST_DEBOUNCE_MS);
	};

	const parsePromise = collectUiMessagesFromResponseStream({
		initialMessages,
		onMessagesUpdated: schedulePersistedMessages,
		routeDecisionToSuppress,
		stream: parseStream,
	});

	const filteredSseStream = createUiMessageChunkSseStream({
		routeDecisionToSuppress,
		stream: broadcastStream,
	});
	const filteredSseReader = filteredSseStream.getReader();
	let hasLoggedFirstChunk = false;
	try {
		while (true) {
			const { done, value } = await filteredSseReader.read();
			if (done) {
				break;
			}

			if (!hasLoggedFirstChunk) {
				hasLoggedFirstChunk = true;
				stageTrace.mark("future_chat_first_chunk", {
					bytes:
						typeof value === "string"
							? Buffer.byteLength(value)
							: typeof value?.length === "number" && Number.isFinite(value.length)
								? value.length
								: null,
				});
			}
			futureChatRunManager.appendChunk(threadId, value);
		}
	} finally {
		filteredSseReader.releaseLock();
	}

	const messages = await parsePromise;
	latestMessagesSnapshot = Array.isArray(messages) ? [...messages] : [];
	await flushPersistedMessages();
	try {
		const synchronizedThread = await syncFutureChatThreadSession(threadId, run.rovoPort, {
			thread: threadId ? await futureChatThreadManager.getThread(threadId) : null,
		});
		if (synchronizedThread?.sessionId) {
			run.sessionId = synchronizedThread.sessionId;
			run.sessionMode = synchronizedThread.sessionMode ?? "persistent";
		}
	} catch (error) {
		console.warn("[FUTURE-CHAT] Failed to synchronize thread session:", {
			threadId,
			port: run.rovoPort,
			error: error instanceof Error ? error.message : String(error),
		});
	}
	await finalizeFutureChatRun(threadId, run, messages);
}

async function executeFutureChatManagedRun(run) {
	const requestBody =
		run.requestBody && typeof run.requestBody === "object"
			? { ...run.requestBody }
			: {};
	const requestOriginHint = getNonEmptyString(requestBody.origin) || "text";
	const stageTrace = createStageTrace({
		scope: "future-chat-run",
		logger: console,
		baseMeta: {
			path: "/api/future-chat/chat",
			origin: requestOriginHint,
			threadId: run.threadId,
			runId: run.id,
		},
	});
	stageTrace.mark("entry", {
		messageCount: Array.isArray(requestBody.messages) ? requestBody.messages.length : 0,
		hasDelegatedMessageId: Boolean(getNonEmptyString(requestBody.delegatedMessageId)),
		hasActiveArtifact: Boolean(requestBody.activeArtifact?.id),
	});

	const threadId = getNonEmptyString(requestBody.id);
	const signal = run.abortController.signal;
	const delegatedMessageId = getNonEmptyString(requestBody.delegatedMessageId);
	const conversationSummary = getNonEmptyString(requestBody.conversationSummary);
	const requestMessages = Array.isArray(requestBody.messages)
		? [...requestBody.messages]
		: [];
	const threadForSession = threadId ? await futureChatThreadManager.getThread(threadId) : null;
	if (threadForSession?.sessionId) {
		requestBody.sessionId = threadForSession.sessionId;
		requestBody.sessionMode = threadForSession.sessionMode ?? "persistent";
	}
	const delegatedThread =
		threadId && delegatedMessageId
			? threadForSession
			: null;
	const delegatedPrompt = delegatedMessageId
		? resolveFutureChatDelegatedPrompt({
			delegatedMessageId,
			requestMessages,
			thread: delegatedThread,
		})
		: null;
	if (delegatedMessageId && !delegatedPrompt) {
		throw new Error("delegatedMessageId did not resolve to a persisted user message");
	}
	if (delegatedPrompt && !requestMessages.some((message) => message?.id === delegatedPrompt.messageId)) {
		const hiddenUserMessage = createHiddenFutureChatUserMessage(
			delegatedPrompt.messageId,
			delegatedPrompt.text,
		);
		if (hiddenUserMessage) {
			requestMessages.push(hiddenUserMessage);
		}
	}
	requestBody.messages = requestMessages;

	const requestOrigin = requestOriginHint;
	const requestVoiceMetadata =
		requestBody.voiceMetadata && typeof requestBody.voiceMetadata === "object"
			? requestBody.voiceMetadata
			: undefined;
	const requestActiveArtifact =
		requestBody.activeArtifact && typeof requestBody.activeArtifact === "object"
			? requestBody.activeArtifact
			: undefined;

	let activeArtifact;
	let activeDocument;
	if (requestActiveArtifact?.id) {
		activeArtifact = requestActiveArtifact;
		activeDocument = null;
	} else {
		const resolved = await resolveFutureChatActiveArtifact({
			activeDocumentId: requestBody.activeDocumentId,
			artifactContext: requestBody.artifactContext,
			futureChatDocumentManager,
			futureChatThreadManager,
			threadId,
		});
		activeArtifact = resolved.activeArtifact;
		activeDocument = resolved.activeDocument;
	}

	const artifactSteering =
		requestBody.artifactSteering &&
		typeof requestBody.artifactSteering === "object"
			? requestBody.artifactSteering
			: null;
	const baseContextDescription = getNonEmptyString(requestBody.contextDescription);
	const delegationContextDescription = conversationSummary
		? `[Voice delegation summary]\n${conversationSummary}`
		: null;
	const streamingArtifact =
		requestBody.streamingArtifact &&
		typeof requestBody.streamingArtifact === "object" &&
		getNonEmptyString(requestBody.streamingArtifact.id)
			? {
				id: requestBody.streamingArtifact.id,
				title: getNonEmptyString(requestBody.streamingArtifact.title) || "Untitled",
				kind: getNonEmptyString(requestBody.streamingArtifact.kind) || "text",
				content: getNonEmptyString(requestBody.streamingArtifact.content) || "",
			}
			: null;
	const resolvedProvider = getNonEmptyString(requestBody.provider);
	const effectiveBaseContextDescription = [
		delegationContextDescription,
		baseContextDescription,
	]
		.filter(Boolean)
		.join("\n\n");

	delete requestBody.activeDocumentId;
	delete requestBody.artifactContext;
	delete requestBody.artifactSteering;
	delete requestBody.delegatedMessageId;
	delete requestBody.conversationSummary;
	delete requestBody.streamingArtifact;
	delete requestBody.origin;
	delete requestBody.voiceMetadata;
	delete requestBody.activeArtifact;
	delete requestBody.executionMode;
	delete requestBody.executionTask;

	const requestIsPlanMode = requestBody.isPlanMode === true;
	delete requestBody.isPlanMode;

	const requestArtifactCreationRetry = requestBody.artifactCreationRetry === true;
	delete requestBody.artifactCreationRetry;

	const { message: latestUserMessage, conversationHistory } =
		mapUiMessagesToConversation(requestMessages);
	const recentHistory = conversationHistory.slice(-5).map((msg) => ({
		role: msg.type === "user" ? "user" : "assistant",
		content: msg.content,
	}));

	let routingDecision;
	const routeDecisionStartedAtMs = Date.now();
	let autoPlanTriggered = false;
	if (!requestIsPlanMode && latestUserMessage) {
		const complexity = assessPromptComplexityForPlanMode(latestUserMessage);
		if (complexity.shouldPlan) {
			autoPlanTriggered = true;
			console.info("[FUTURE-CHAT] Auto-plan heuristic triggered", {
				score: complexity.score,
				reasons: complexity.reasons,
			});
			stageTrace.mark("auto_plan_triggered", {
				score: complexity.score,
				reasons: complexity.reasons.join(","),
			});
			console.info("[FUTURE-CHAT] Auto-plan: enabling local deep-plan request");
		}
	}

	if (requestIsPlanMode || autoPlanTriggered) {
		routingDecision = {
			intent: "chat",
			presentation: "text",
			confidence: 1,
			reason: "plan_mode_active",
			origin: requestOrigin,
		};
		stageTrace.mark("route_decision_resolved", {
			stageMs: 0,
			intent: "chat",
			confidence: 1,
			reason: "plan_mode_active",
		});
	} else if (requestArtifactCreationRetry && !activeArtifact?.id) {
		// Previous artifact creation attempt failed — retry artifact_create
		routingDecision = {
			intent: "artifact_create",
			presentation: "artifact_preview",
			confidence: 1,
			reason: "artifact_creation_retry",
			origin: requestOrigin,
		};
		stageTrace.mark("route_decision_resolved", {
			stageMs: 0,
			intent: "artifact_create",
			confidence: 1,
			reason: "artifact_creation_retry",
		});
	} else {
		try {
			routingDecision = await resolveRoutingDecision(
				{
					prompt: latestUserMessage,
					origin: requestOrigin,
					activeArtifact: activeArtifact || undefined,
					voiceMetadata: requestVoiceMetadata,
					recentHistory,
					threadId,
					provider: resolvedProvider,
					signal,
				},
				{
					classify: ({ system, prompt, signal: classifySignal }) =>
						generateTextViaGateway({
							system,
							prompt,
							maxOutputTokens: 220,
							temperature: 0.1,
							provider: resolvedProvider,
							signal: classifySignal,
							backendPreference: "ai-gateway",
						}),
					timeoutMs: 1500,
				},
			);
		} catch {
			routingDecision = {
				intent: "chat",
				presentation: "text",
				confidence: 0,
				reason: "classifier_error",
				origin: requestOrigin,
			};
		}
		stageTrace.mark("route_decision_resolved", {
			stageMs: Date.now() - routeDecisionStartedAtMs,
			intent: routingDecision.intent,
			confidence: routingDecision.confidence,
			reason: routingDecision.reason,
		});
	}

	if (routingDecision.intent === "artifact_create" || routingDecision.intent === "artifact_update") {
		const handled = await handleFutureChatArtifactToolRequest({
			activeArtifact,
			activeDocument,
			artifactSteering,
			contextDescription: effectiveBaseContextDescription || null,
			requestOrigin,
			requestBody,
			signal,
			streamingArtifact,
			threadId,
		});
		if (handled?.handled && handled.response) {
			stageTrace.mark("artifact_route_handled", {
				intent: routingDecision.intent,
				threadId,
			});
			await consumeFutureChatManagedResponse({
				initialMessages: requestMessages,
				response: handled.response,
				run,
				stageTrace,
				threadId,
			});
			return;
		}
	}

	const artifactContextBlock = buildFutureChatArtifactContext(activeArtifact);
	if (artifactContextBlock) {
		requestBody.contextDescription = effectiveBaseContextDescription
			? `${artifactContextBlock}\n\n${effectiveBaseContextDescription}`
			: artifactContextBlock;
	} else if (effectiveBaseContextDescription) {
		requestBody.contextDescription = effectiveBaseContextDescription;
	}
	if (routingDecision.intent === "genui") {
		requestBody.genuiHint = true;
	}
	requestBody.resolvedPlanModeActive = requestIsPlanMode || autoPlanTriggered;
	requestBody.chatSdkSource = "future-chat";
	requestBody.threadId = threadId;

	const internalProxyStartedAtMs = Date.now();
	const response = await dispatchChatSdkRequestInProcess({
		body: requestBody,
		headers: stageTrace.getHeaders(),
		signal,
	});
	stageTrace.mark("chat_sdk_response_headers", {
		stageMs: Date.now() - internalProxyStartedAtMs,
		status: response.status,
		contentType: response.headers.get("content-type") || null,
	});

	if (!response.ok) {
		const errorText = await response.text();
		throw new Error(errorText || "Failed to stream Future Chat response");
	}

	await consumeFutureChatManagedResponse({
		initialMessages: requestMessages,
		prependChunk: formatRouteDecisionSSE(routingDecision),
		response,
		run,
		stageTrace,
		threadId,
	});
	stageTrace.mark("run_complete");
}

async function startManagedFutureChatRun(run) {
	const markedRun = futureChatRunManager.markRunStarted(run.threadId, {
		portIndex: null,
		rovoPort: null,
		status: futureChatRunManager.hasSubscribers(run.threadId) ? "streaming" : "background",
	});
	if (!markedRun) {
		return;
	}

	await persistFutureChatRunState(run.threadId, markedRun);
	void executeFutureChatManagedRun(markedRun).catch(async (error) => {
		const wasAborted = markedRun.abortController.signal.aborted;
		if (!wasAborted) {
			console.error("[FUTURE-CHAT] Managed run failed:", error);
		}
		await failFutureChatRun(markedRun.threadId, error);
	});
}

async function startNextQueuedFutureChatRun() {
	if (isProcessingFutureChatRunQueue) {
		return;
	}

	isProcessingFutureChatRunQueue = true;
	try {
		const queuedThreadIds = futureChatRunManager.listQueuedThreadIds();
		for (const threadId of queuedThreadIds) {
			const run = futureChatRunManager.getRun(threadId);
			if (!run) {
				futureChatRunManager.removeQueuedRun(threadId);
				continue;
			}

			const assignment = resolveFutureChatPortAvailability();
			if (!assignment) {
				continue;
			}

			await startManagedFutureChatRun(run);
			break;
		}
	} finally {
		isProcessingFutureChatRunQueue = false;
	}
}

async function proxyFutureChatChatRequest(req, res) {
	const requestBody =
		req.body && typeof req.body === "object" ? { ...req.body } : {};
	const threadId = getNonEmptyString(requestBody.id);
	if (!threadId) {
		return res.status(400).json({ error: "threadId is required" });
	}

	const isStructuredContinuation = hasStructuredContinuationBody(requestBody);
	const rovoDevReady = await waitForFutureChatRovoDevAvailability({
		getAvailability: refreshRovoDevAvailability,
		getPorts: readRovoDevPorts,
	});
	const poolStatus = _rovoDevPool?.getStatus?.();
	const poolPorts = Array.isArray(poolStatus?.ports) ? poolStatus.ports : [];
	if (!rovoDevReady || !_rovoDevPool || poolPorts.length === 0) {
		console.warn("[FUTURE-CHAT] RovoDev unavailable before starting managed run", {
			threadId,
			rovoDevReady,
			hasPool: Boolean(_rovoDevPool),
			totalPorts: poolPorts.length,
		});
		streamFutureChatUnavailableResponse(
			res,
			"RovoDev Serve is required but not available. Start or restart `pnpm run rovodev` and try again.",
			"Future Chat could not start because no healthy RovoDev ports were registered.",
		);
		return;
	}

	let existingRun = futureChatRunManager.getRun(threadId);
	if (shouldReplaceActiveRunForRequest({ existingRun, requestBody })) {
		if (typeof existingRun?.rovoPort === "number" && existingRun.rovoPort > 0) {
			await rovoDevCancelChat(existingRun.rovoPort, { timeoutMs: 3_000 }).catch(() => {});
		}
		futureChatRunManager.cancelRun(threadId);
		await clearFutureChatRunState(threadId);
		existingRun = null;
	}

	const run =
		existingRun ||
		futureChatRunManager.createRun({
			threadId,
			requestBody,
			requestedPortIndex: null,
		});

	const subscriberId = futureChatRunManager.attachSubscriber(threadId, res, {
		onDetached: (detachedRun) => {
			if (!detachedRun) {
				return;
			}
			void persistFutureChatRunState(threadId, detachedRun);
		},
	});
	if (!subscriberId) {
		return res.status(404).json({ error: "No active Future Chat run for threadId" });
	}

	if (!existingRun) {
		const availableCount = poolPorts.filter((p) => p?.status === "available").length;
		const busyCount = poolPorts.filter((p) => p?.status === "busy" || p?.status === "in-use").length;
		console.info("[TIMING][future-chat] pool-status", {
			threadId,
			totalPorts: poolPorts.length,
			available: availableCount,
			busy: busyCount,
		});

		const assignment = resolveFutureChatPortAvailability();
		if (isStructuredContinuation) {
			console.info("[TIMING][future-chat] structured continuation bypassing queue gate", {
				threadId,
			});
			await startManagedFutureChatRun(run);
		} else if (assignment) {
			console.info("[TIMING][future-chat] port-assignment", {
				threadId,
			});
			await startManagedFutureChatRun(run);
		} else {
			console.info("[TIMING][future-chat] port-assignment: null (run will be QUEUED)", {
				threadId,
			});
			futureChatRunManager.enqueueRun(threadId);
			await persistFutureChatRunState(threadId, futureChatRunManager.getRun(threadId));
		}
	}

	await persistFutureChatRunState(threadId, futureChatRunManager.getRun(threadId));
}

/**
 * Format a routing decision as an SSE event that can be prepended to the
 * stream before the proxied /api/chat-sdk response.
 * Matches the AI SDK UI message stream SSE format: `data: <json>\n\n`
 */
function formatRouteDecisionSSE(decision) {
	const part = {
		type: "data-route-decision",
		data: buildRouteDecision(decision),
	};
	return `data: ${JSON.stringify(part)}\n\n`;
}

function parseRouteDecisionFromSseChunk(chunk) {
	if (typeof chunk !== "string" || chunk.trim().length === 0) {
		return null;
	}

	const trimmedChunk = chunk.trim();
	if (!trimmedChunk.startsWith("data:")) {
		return null;
	}

	const payloadText = trimmedChunk.replace(/^data:\s*/, "");
	if (!payloadText || payloadText === "[DONE]") {
		return null;
	}

	try {
		const parsed = JSON.parse(payloadText);
		if (
			parsed &&
			typeof parsed === "object" &&
			parsed.type === "data-route-decision" &&
			parsed.data &&
			typeof parsed.data === "object" &&
			!Array.isArray(parsed.data)
		) {
			return parsed.data;
		}
	} catch {
		return null;
	}

	return null;
}

function resolveStageTraceFromRequest(req, scope, baseMeta) {
	return createStageTrace({
		scope,
		requestId: req.get(STAGE_TRACE_ID_HEADER),
		startedAtMs: req.get(STAGE_TRACE_START_HEADER),
		logger: console,
		baseMeta,
	});
}

async function dispatchChatSdkRequestInProcess({
	body,
	headers,
	protocol = "http",
	signal,
}) {
	const req = createInProcessRequest({
		body,
		headers,
		protocol,
		signal,
	});
	const res = createCapturedResponse();
	await handleChatSdkRequest(req, res);
	return res.toWebResponse();
}

function buildFutureChatActiveRunPayload(run, thread) {
	if (!run) {
		return null;
	}

	const sessionId = getNonEmptyString(thread?.sessionId);
	const sessionMode =
		thread?.sessionMode === "ephemeral"
			? "ephemeral"
			: sessionId
				? thread?.sessionMode ?? "persistent"
				: null;

	return {
		id: run.id,
		status: run.status,
		portIndex: null,
		rovoPort:
			typeof run.rovoPort === "number" && Number.isInteger(run.rovoPort) && run.rovoPort > 0
				? run.rovoPort
				: null,
		sessionId,
		sessionMode,
		startedAt: run.startedAt,
		updatedAt: run.updatedAt,
	};
}

async function persistFutureChatRunState(threadId, run) {
	if (!threadId) {
		return null;
	}

	const thread = await futureChatThreadManager.getThread(threadId);
	if (!thread) {
		return null;
	}

	return futureChatThreadManager.updateThread(threadId, {
		activeRun: buildFutureChatActiveRunPayload(run, thread),
	});
}

async function clearFutureChatRunState(threadId) {
	if (!threadId) {
		return null;
	}

	return futureChatThreadManager.updateThread(threadId, {
		activeRun: null,
	});
}

async function persistFutureChatRunMessagesSnapshot(threadId, messages) {
	if (!threadId || !Array.isArray(messages)) {
		return null;
	}

	const thread = await futureChatThreadManager.getThread(threadId);
	if (!thread) {
		return null;
	}

	return futureChatThreadManager.updateThread(threadId, {
		messages,
	});
}

function resolveFutureChatPortAvailability() {
	const poolStatus = _rovoDevPool?.getStatus?.();
	if (!_rovoDevPool) {
		return null;
	}

	const poolPorts = Array.isArray(poolStatus?.ports) ? poolStatus.ports : [];
	if (poolPorts.length === 0) {
		return null;
	}
	const hasAvailable = poolPorts.some((p) => p?.status === "available");
	return hasAvailable ? { available: true } : null;
}

async function reconcileOrphanedFutureChatThread(thread) {
	if (!thread?.id || !thread.activeRun) {
		return thread;
	}

	if (futureChatRunManager.hasRun(thread.id)) {
		return thread;
	}

	return clearFutureChatRunState(thread.id);
}

function createSseDataChunk(payload) {
	return `data: ${JSON.stringify(payload)}\n\n`;
}

function createFutureChatFailureSseChunks(errorOrMessage) {
	const failurePayload = getFutureChatRunFailurePayload(
		errorOrMessage,
		typeof errorOrMessage === "string" ? errorOrMessage : undefined,
	);
	const text = failurePayload.message;
	const textId = `future-chat-error-${Date.now()}`;
	return [
		createSseDataChunk({ type: "text-start", id: textId }),
		createSseDataChunk({ type: "text-delta", id: textId, delta: text }),
		createSseDataChunk({ type: "text-end", id: textId }),
		createSseDataChunk({
			type: "data-widget-error",
			id: `future-chat-error-widget-${Date.now()}`,
			data: {
				type: "question-card",
				code: failurePayload.code,
				message: text,
				details: failurePayload.details,
				canRetry: failurePayload.canRetry,
			},
		}),
		createSseDataChunk({
			type: "data-turn-complete",
			data: { timestamp: new Date().toISOString() },
		}),
	];
}

function streamExpiredClarificationResponse(res, toolCallId) {
	const payload = buildExpiredDeferredClarificationResponse(toolCallId);
	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			const textId = `expired-clarification-${Date.now()}`;
			writer.write({ type: "text-start", id: textId });
			writer.write({
				type: "text-delta",
				id: textId,
				delta: payload.text,
			});
			writer.write({ type: "text-end", id: textId });
			writer.write({
				type: "data-widget-error",
				id: `expired-clarification-widget-${Date.now()}`,
				data: {
					type: CLARIFICATION_WIDGET_TYPE,
					...payload.widgetError,
				},
			});
			writer.write({
				type: "data-turn-complete",
				data: { timestamp: new Date().toISOString() },
			});
		},
		onError: (error) =>
			error instanceof Error
				? error.message
				: "Failed to stream expired clarification response",
	});
	pipeUIMessageStreamToResponse({ response: res, stream });
}

function streamFutureChatUnavailableResponse(res, message, details) {
	const normalizedMessage =
		typeof message === "string" && message.trim().length > 0
			? message.trim()
			: "RovoDev Serve is required but not available.";
	const normalizedDetails =
		typeof details === "string" && details.trim().length > 0
			? details.trim()
			: undefined;

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			const textId = `future-chat-unavailable-${Date.now()}`;
			writer.write({ type: "text-start", id: textId });
			writer.write({
				type: "text-delta",
				id: textId,
				delta: normalizedMessage,
			});
			writer.write({ type: "text-end", id: textId });
			writer.write({
				type: "data-widget-error",
				id: `future-chat-unavailable-widget-${Date.now()}`,
				data: {
					type: "question-card",
					code: "rovodev_unavailable",
					message: normalizedMessage,
					details: normalizedDetails,
					canRetry: true,
				},
			});
			writer.write({
				type: "data-turn-complete",
				data: { timestamp: new Date().toISOString() },
			});
		},
		onError: (error) =>
			error instanceof Error
				? error.message
				: "Failed to stream RovoDev unavailable response",
	});
	pipeUIMessageStreamToResponse({ response: res, stream });
}

function getUtf8ByteLength(value) {
	return typeof value === "string" && value.length > 0
		? Buffer.byteLength(value, "utf8")
		: 0;
}

const forgePublishManager = createForgePublishManager({
	appRegistry,
	baseDir: path.join(__dirname, "data", "make"),
	logger: console,
});

const orchestratorLog = createOrchestratorLog({
	baseDir: path.join(__dirname, "data"),
	logger: console,
});

// RovoDev-only mode - no local clarification/approval logic

const IMAGE_PROXY_TIMEOUT_MS = 15_000;
const WEB_PROXY_TIMEOUT_MS = 30_000;
const FIGMA_MCP_ASSET_PATH_PREFIX = "/api/mcp/asset/";
const IMAGE_PROXY_ALLOWED_HOSTS = new Set(["figma.com", "www.figma.com"]);

function parseImageProxyTarget(value) {
	const normalizedValue = getNonEmptyString(value);
	if (!normalizedValue) {
		return {
			error: "Missing required query parameter: src",
		};
	}

	let parsedUrl;
	try {
		parsedUrl = new URL(normalizedValue);
	} catch {
		return {
			error: "Invalid src URL",
		};
	}

	const protocol = parsedUrl.protocol.toLowerCase();
	if (protocol !== "https:" && protocol !== "http:") {
		return {
			error: "Only http(s) image URLs are supported",
		};
	}

	const hostname = parsedUrl.hostname.toLowerCase();
	if (!IMAGE_PROXY_ALLOWED_HOSTS.has(hostname)) {
		return {
			error: "Image host is not allowed",
		};
	}

	if (!parsedUrl.pathname.startsWith(FIGMA_MCP_ASSET_PATH_PREFIX)) {
		return {
			error: "Only Figma MCP asset URLs are supported",
		};
	}

	return { targetUrl: parsedUrl };
}

const WEB_PROXY_PRIVATE_IP_PATTERNS = [
	/^localhost$/i,
	/^127\./,
	/^10\./,
	/^172\.(1[6-9]|2\d|3[01])\./,
	/^192\.168\./,
	/^169\.254\./,
	/\.local$/i,
	/^\[::1\]$/,
];

function parseWebProxyTarget(value) {
	const normalizedValue = getNonEmptyString(value);
	if (!normalizedValue) {
		return { error: "Missing required query parameter: url" };
	}

	let parsedUrl;
	try {
		parsedUrl = new URL(normalizedValue);
	} catch {
		return { error: "Invalid URL" };
	}

	const protocol = parsedUrl.protocol.toLowerCase();
	if (protocol !== "https:" && protocol !== "http:") {
		return { error: "Only http(s) URLs are supported" };
	}

	const hostname = parsedUrl.hostname.toLowerCase();
	if (WEB_PROXY_PRIVATE_IP_PATTERNS.some((pattern) => pattern.test(hostname))) {
		return { error: "Private/local URLs are not allowed" };
	}

	return { targetUrl: parsedUrl };
}

function injectBaseTag(html, baseHref) {
	const baseTag = `<base href="${baseHref}">`;
	const headMatch = html.match(/<head(\s[^>]*)?>|<head>/i);
	if (headMatch) {
		const insertPos = headMatch.index + headMatch[0].length;
		return html.slice(0, insertPos) + baseTag + html.slice(insertPos);
	}
	return baseTag + html;
}

function isRequiredGoogleTranslateToolCall({ toolName, toolInput } = {}) {
	const normalizedToolName = getNonEmptyString(toolName)?.toLowerCase();
	if (normalizedToolName === GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME) {
		return true;
	}

	const nestedToolName = getNonEmptyString(toolInput?.tool_name)?.toLowerCase();
	return nestedToolName === GOOGLE_TRANSLATE_REQUIRED_TOOL_NAME;
}

function hasRequiredGoogleTranslateProjectArg(toolInput) {
	if (!toolInput || typeof toolInput !== "object") {
		return false;
	}

	const projectCandidates = [
		toolInput.project,
		toolInput?.tool_input?.project,
		toolInput?.input?.project,
		toolInput?.arguments?.project,
		toolInput?.payload?.project,
	];
	return projectCandidates.some((candidate) => Boolean(getNonEmptyString(candidate)));
}

function normalizeClientTimeZone(value) {
	const timeZone = getNonEmptyString(value);
	if (!timeZone || timeZone.length > 100) {
		return null;
	}

	try {
		new Intl.DateTimeFormat("en-US", { timeZone }).format(new Date());
		return timeZone;
	} catch {
		return null;
	}
}

function buildGoogleCalendarDateContext(clientTimeZone) {
	const nowUtcIso = new Date().toISOString().replace(/\.\d{3}Z$/, "Z");
	const lines = [
		"[Google Calendar Date Context]",
		`Current UTC timestamp: ${nowUtcIso}`,
		clientTimeZone
			? `User timezone: ${clientTimeZone}`
			: "User timezone: unavailable (use best-effort locale inference).",
		"Interpret relative date phrases in the user's timezone when available, then convert `timeMin` and `timeMax` to strict UTC ISO 8601 (`YYYY-MM-DDTHH:mm:ssZ`).",
		"[End Google Calendar Date Context]",
	];

	return lines.join("\n");
}

const TOOL_OBSERVATION_RAW_MAX_DEPTH = 5;
const TOOL_OBSERVATION_RAW_MAX_ARRAY_ITEMS = 40;
const TOOL_OBSERVATION_RAW_MAX_OBJECT_KEYS = 60;
const TOOL_OBSERVATION_RAW_MAX_STRING_CHARS = 8000;

function truncateObservationString(value) {
	if (typeof value !== "string") {
		return value;
	}

	if (value.length <= TOOL_OBSERVATION_RAW_MAX_STRING_CHARS) {
		return value;
	}

	return `${value.slice(0, TOOL_OBSERVATION_RAW_MAX_STRING_CHARS - 1)}…`;
}

function toBoundedToolObservationRawOutput(value, depth = 0, seen = new WeakSet()) {
	if (value === null || value === undefined) {
		return value;
	}

	if (typeof value === "string") {
		return truncateObservationString(value);
	}

	if (typeof value === "number" || typeof value === "boolean") {
		return value;
	}

	if (typeof value !== "object") {
		return truncateObservationString(String(value));
	}

	if (seen.has(value)) {
		return "[Circular]";
	}

	if (depth >= TOOL_OBSERVATION_RAW_MAX_DEPTH) {
		if (Array.isArray(value)) {
			return `[Array(${value.length})]`;
		}
		return "[Object]";
	}

	seen.add(value);
	try {
		if (Array.isArray(value)) {
			const boundedArray = value
				.slice(0, TOOL_OBSERVATION_RAW_MAX_ARRAY_ITEMS)
				.map((entry) =>
					toBoundedToolObservationRawOutput(entry, depth + 1, seen)
				);
			if (value.length > TOOL_OBSERVATION_RAW_MAX_ARRAY_ITEMS) {
				boundedArray.push(
					`[+${value.length - TOOL_OBSERVATION_RAW_MAX_ARRAY_ITEMS} more items]`
				);
			}
			return boundedArray;
		}

		if (isPlainObject(value)) {
			const entries = Object.entries(value);
			const boundedObject = {};
			for (const [key, nestedValue] of entries.slice(0, TOOL_OBSERVATION_RAW_MAX_OBJECT_KEYS)) {
				boundedObject[key] = toBoundedToolObservationRawOutput(
					nestedValue,
					depth + 1,
					seen
				);
			}
			if (entries.length > TOOL_OBSERVATION_RAW_MAX_OBJECT_KEYS) {
				boundedObject.__truncated__ = `+${entries.length - TOOL_OBSERVATION_RAW_MAX_OBJECT_KEYS} more keys`;
			}
			return boundedObject;
		}

		return truncateObservationString(String(value));
	} finally {
		seen.delete(value);
	}
}

function safeJsonParse(rawValue) {
	if (typeof rawValue !== "string") {
		return null;
	}

	try {
		return JSON.parse(rawValue);
	} catch {
		return null;
	}
}

function extractClassifierJsonCandidate(rawText) {
	const text = getNonEmptyString(rawText);
	if (!text) {
		return null;
	}

	const fencedMatch = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
	if (fencedMatch && fencedMatch[1]) {
		return fencedMatch[1].trim();
	}

	if (text.startsWith("{") && text.endsWith("}")) {
		return text;
	}

	return null;
}

function parseClassifierIntentPayload(rawText) {
	const jsonCandidate = extractClassifierJsonCandidate(rawText);
	if (!jsonCandidate) {
		return null;
	}

	const parsed = safeJsonParse(jsonCandidate);
	if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
		return null;
	}

	const keys = Object.keys(parsed);
	if (!keys.includes("intent")) {
		return null;
	}
	if (!keys.every((key) => CLASSIFIER_JSON_ALLOWED_KEYS.has(key))) {
		return null;
	}

	const intent = getNonEmptyString(parsed.intent)?.toLowerCase();
	if (!intent || !["normal", "genui", "audio", "image", "both"].includes(intent)) {
		return null;
	}

	if (Object.prototype.hasOwnProperty.call(parsed, "confidence")) {
		if (typeof parsed.confidence !== "number" || !Number.isFinite(parsed.confidence)) {
			return null;
		}
		if (parsed.confidence < 0 || parsed.confidence > 1) {
			return null;
		}
	}

	if (Object.prototype.hasOwnProperty.call(parsed, "reason")) {
		if (getNonEmptyString(parsed.reason) === null) {
			return null;
		}
	}

	return {
		intent,
		confidence:
			typeof parsed.confidence === "number" && Number.isFinite(parsed.confidence)
				? parsed.confidence
				: null,
		reason: getNonEmptyString(parsed.reason),
	};
}

function isClassifierIntentLeakCandidate(value) {
	if (typeof value !== "string") {
		return false;
	}

	const trimmed = value.trimStart();
	return trimmed.startsWith("{") || trimmed.startsWith("```");
}

function createHttpError(status, message) {
	const error = new Error(message);
	error.status = status;
	return error;
}

function truncateText(value, maxChars) {
	if (typeof value !== "string" || value.length <= maxChars) {
		return value;
	}

	return `${value.slice(0, maxChars - 1)}…`;
}

function escapeHtml(value) {
	return String(value)
		.replaceAll("&", "&amp;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;")
		.replaceAll('"', "&quot;")
		.replaceAll("'", "&#39;");
}

function normalizeConfluenceBaseUrl(value) {
	const trimmed = getNonEmptyString(value);
	if (!trimmed) {
		return null;
	}

	const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
	try {
		const normalizedUrl = new URL(withProtocol);
		return normalizedUrl.toString().replace(/\/+$/, "");
	} catch {
		return null;
	}
}

function getRunShareTitle(run) {
	if (!run || typeof run !== "object") {
		return "Agents team run summary";
	}

	const plan = run.plan && typeof run.plan === "object" ? run.plan : null;
	return getNonEmptyString(plan?.title) || "Agents team run summary";
}

function resolveSummaryTimestamp(run, summary) {
	return (
		getNonEmptyString(summary?.createdAt) ||
		getNonEmptyString(run?.updatedAt) ||
		getNonEmptyString(run?.createdAt) ||
		new Date().toISOString()
	);
}

function buildConfluenceStorageBody(run, summary, summaryContent) {
	const runTitle = escapeHtml(getRunShareTitle(run));
	const runId = escapeHtml(getNonEmptyString(run?.runId) || "unknown");
	const createdAt = escapeHtml(resolveSummaryTimestamp(run, summary));
	const content = escapeHtml(summaryContent);

	return [
		`<h1>${runTitle}</h1>`,
		`<p><strong>Run ID:</strong> <code>${runId}</code></p>`,
		`<p><strong>Generated:</strong> ${createdAt}</p>`,
		"<hr />",
		`<pre>${content}</pre>`,
	].join("");
}

function buildSlackSummaryText(run, summary, summaryContent) {
	const runTitle = getRunShareTitle(run);
	const runId = getNonEmptyString(run?.runId) || "unknown";
	const createdAt = resolveSummaryTimestamp(run, summary);
	const trimmedSummary = truncateText(summaryContent, MAX_SLACK_SUMMARY_CHARS);

	return [
		`*${runTitle}*`,
		`Run ID: \`${runId}\``,
		`Generated: ${createdAt}`,
		"",
		trimmedSummary,
	].join("\n");
}

function parseExternalErrorMessage(payload, rawText) {
	if (payload && typeof payload === "object") {
		const errorPayload = payload;
		if (typeof errorPayload.error === "string" && errorPayload.error.trim()) {
			return errorPayload.error.trim();
		}
		if (typeof errorPayload.message === "string" && errorPayload.message.trim()) {
			return errorPayload.message.trim();
		}
		if (
			errorPayload.data &&
			typeof errorPayload.data === "object" &&
			typeof errorPayload.data.message === "string" &&
			errorPayload.data.message.trim()
		) {
			return errorPayload.data.message.trim();
		}
	}

	const trimmedText = getNonEmptyString(rawText);
	if (trimmedText) {
		return truncateText(trimmedText, 240);
	}

	return null;
}

function resolveConfluencePageUrl(baseUrl, payload) {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	const links = payload._links && typeof payload._links === "object" ? payload._links : null;
	const webUiPath =
		getNonEmptyString(links?.webui) ||
		getNonEmptyString(links?.tinyui) ||
		getNonEmptyString(payload.webui);
	if (webUiPath) {
		try {
			const linksBase = getNonEmptyString(links?.base) || baseUrl;
			return new URL(webUiPath, linksBase).toString();
		} catch {
			// Ignore invalid URL payloads and use fallback below.
		}
	}

	const pageId = getNonEmptyString(payload.id);
	if (!pageId) {
		return null;
	}

	return `${baseUrl}/pages/viewpage.action?pageId=${encodeURIComponent(pageId)}`;
}

async function createConfluenceSummaryPage({
	run,
	summary,
	summaryContent,
	confluence,
}) {
	const baseUrl =
		normalizeConfluenceBaseUrl(confluence?.baseUrl) ||
		normalizeConfluenceBaseUrl(process.env.CONFLUENCE_BASE_URL) ||
		DEFAULT_CONFLUENCE_BASE_URL;
	const spaceKey =
		getNonEmptyString(confluence?.spaceKey) ||
		getNonEmptyString(process.env.CONFLUENCE_DEFAULT_SPACE_KEY);
	const title =
		getNonEmptyString(confluence?.title) || `${getRunShareTitle(run)} summary`;
	const parentPageId =
		getNonEmptyString(confluence?.parentPageId) ||
		getNonEmptyString(process.env.CONFLUENCE_PARENT_PAGE_ID);
	const email = getNonEmptyString(process.env.CONFLUENCE_USER_EMAIL);
	const apiToken = getNonEmptyString(process.env.CONFLUENCE_API_TOKEN);

	if (!email || !apiToken) {
		throw createHttpError(
			500,
			"Confluence sharing is not configured. Set CONFLUENCE_USER_EMAIL and CONFLUENCE_API_TOKEN."
		);
	}
	if (!spaceKey) {
		throw createHttpError(
			400,
			"Confluence space key is required. Provide it in the request or set CONFLUENCE_DEFAULT_SPACE_KEY."
		);
	}

	const payload = {
		type: "page",
		title,
		space: { key: spaceKey },
		body: {
			storage: {
				value: buildConfluenceStorageBody(run, summary, summaryContent),
				representation: "storage",
			},
		},
	};
	if (parentPageId) {
		payload.ancestors = [{ id: parentPageId }];
	}

	const response = await fetch(`${baseUrl}/rest/api/content`, {
		method: "POST",
		headers: {
			Authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
			"Content-Type": "application/json",
			Accept: "application/json",
		},
		body: JSON.stringify(payload),
	});

	const rawText = await response.text();
	const responsePayload = safeJsonParse(rawText);
	if (!response.ok) {
		const details =
			parseExternalErrorMessage(responsePayload, rawText) || `status ${response.status}`;
		throw createHttpError(
			502,
			`Failed to create Confluence page: ${details}`
		);
	}

	return {
		externalUrl: resolveConfluencePageUrl(baseUrl, responsePayload),
	};
}

async function callSlackApi(endpoint, token, body) {
	const response = await fetch(`https://slack.com/api/${endpoint}`, {
		method: "POST",
		headers: {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json; charset=utf-8",
		},
		body: JSON.stringify(body),
	});

	const rawText = await response.text();
	const responsePayload = safeJsonParse(rawText);
	if (!response.ok) {
		const details =
			parseExternalErrorMessage(responsePayload, rawText) || `status ${response.status}`;
		throw createHttpError(502, `Slack API request failed: ${details}`);
	}

	if (!responsePayload || responsePayload.ok !== true) {
		const details =
			parseExternalErrorMessage(responsePayload, rawText) || "Unknown Slack API error.";
		throw createHttpError(502, `Slack API request failed: ${details}`);
	}

	return responsePayload;
}

async function sendSlackSummaryDm({ run, summary, summaryContent }) {
	const slackToken = getNonEmptyString(process.env.SLACK_BOT_TOKEN);
	const slackUserId = getNonEmptyString(process.env.SLACK_DM_USER_ID);

	if (!slackToken || !slackUserId) {
		throw createHttpError(
			500,
			"Slack sharing is not configured. Set SLACK_BOT_TOKEN and SLACK_DM_USER_ID."
		);
	}

	const openPayload = await callSlackApi("conversations.open", slackToken, {
		users: slackUserId,
	});
	const channelId = getNonEmptyString(openPayload.channel?.id);
	if (!channelId) {
		throw createHttpError(502, "Slack API did not return a direct-message channel.");
	}

	const messagePayload = await callSlackApi("chat.postMessage", slackToken, {
		channel: channelId,
		text: buildSlackSummaryText(run, summary, summaryContent),
		unfurl_links: false,
		unfurl_media: false,
	});

	return {
		messageTs: getNonEmptyString(messagePayload.ts) || undefined,
	};
}

function createClarificationSessionId() {
	return `clarification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isRequestUserInputTool(toolName) {
	const normalizedToolName = getNonEmptyString(toolName)?.toLowerCase();
	if (!normalizedToolName) {
		return false;
	}

	return (
		normalizedToolName === "request_user_input" ||
		normalizedToolName === "ask_user_questions" ||
		normalizedToolName === "ask_user_question" ||
		normalizedToolName.endsWith(".request_user_input") ||
		normalizedToolName.endsWith(".ask_user_questions") ||
		normalizedToolName.endsWith(".ask_user_question")
	);
}

function isExitPlanModeTool(toolName) {
	const normalizedToolName = getNonEmptyString(toolName)?.toLowerCase();
	if (!normalizedToolName) {
		return false;
	}

	return (
		normalizedToolName === "exit_plan_mode" ||
		normalizedToolName.endsWith(".exit_plan_mode")
	);
}

function isBashQuestionCardWorkaround(toolName, toolInput) {
	if (!toolName || toolName.toLowerCase() !== "bash") return false;
	const inputStr = typeof toolInput === "string"
		? toolInput
		: JSON.stringify(toolInput);
	if (!inputStr) return false;
	return findRequestUserInputQuestionContainer(inputStr) !== null;
}

function normalizeClarificationAnswerValue(value) {
	if (typeof value === "string") {
		const normalizedValue = value.trim();
		return normalizedValue.length > 0 ? normalizedValue : null;
	}

	if (!Array.isArray(value)) {
		return null;
	}

	const normalizedValues = value
		.map((item) => (typeof item === "string" ? item.trim() : ""))
		.filter((item) => item.length > 0);
	return normalizedValues.length > 0 ? normalizedValues : null;
}

function normalizeClarificationAnswers(value) {
	if (!value || typeof value !== "object") {
		return {};
	}

	return Object.entries(value).reduce((result, [questionId, answerValue]) => {
		const normalizedQuestionId = getNonEmptyString(questionId);
		const normalizedAnswerValue = normalizeClarificationAnswerValue(answerValue);
		if (!normalizedQuestionId || !normalizedAnswerValue) {
			return result;
		}

		result[normalizedQuestionId] = normalizedAnswerValue;
		return result;
	}, {});
}

function normalizeClarificationSubmission(value) {
	if (!value || typeof value !== "object") {
		return null;
	}

	const sessionId = getNonEmptyString(value.sessionId);
	const round = getPositiveInteger(value.round);
	if (!sessionId || !round) {
		return null;
	}

	return {
		sessionId,
		round,
		completed: Boolean(value.completed),
		answers: normalizeClarificationAnswers(value.answers),
		toolCallId:
			getNonEmptyString(value.toolCallId) ||
			getNonEmptyString(value.deferredToolCallId) ||
			undefined,
		deferredToolCallId:
			getNonEmptyString(value.deferredToolCallId) ||
			getNonEmptyString(value.toolCallId) ||
			undefined,
	};
}

const {
	adaptClarificationAnswers: _adaptClarificationAnswersCore,
} = require("./lib/ask-user-questions-adapter");

// Module-level store for request-user-input question metadata.
// Populated during streaming, consumed during answer serialization.
/** @type {Map<string, Array<{id: string, label: string}>>} */
const _requestUserInputQuestionMetaStore = new Map();
/** @type {Map<string, { toolCallId: string; port: number; threadId: string | null; kind: "clarification" | "plan-approval"; createdAt: number; expiresAt: number; expiryTimer: NodeJS.Timeout | null; }>} */
const _activeDeferredToolCallStore = new Map();
/** @type {Map<string, { toolCallId: string; port: number; handle: { port: number; release: () => void; releaseAsUnhealthy?: () => void }; threadId: string | null; sessionId: string | null; sessionMode: "persistent" | "ephemeral"; kind: "clarification" | "plan-approval"; createdAt: number; expiresAt: number; expiryTimer: NodeJS.Timeout | null; }>} */
const _pausedRovoDevToolCallStore = new Map();
/** @type {Map<string, { approvalId: string; port: number; handle: { port: number; release: () => void; releaseAsUnhealthy?: () => void }; threadId: string | null; sessionId: string | null; sessionMode: "persistent" | "ephemeral"; parts: Array<object>; autoApproveToolCallIds: string[]; payload: object; createdAt: number; expiresAt: number; expiryTimer: NodeJS.Timeout | null; }>} */
const _pausedRovoDevToolApprovalStore = new Map();
const PAUSED_ROVODEV_TOOL_CALL_TTL_MS = 15 * 60_000;

function createPausedToolApprovalId() {
	return `tool-approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function clearPausedRovoDevToolApprovalBatch(approvalId, { cancel = false } = {}) {
	const normalizedApprovalId = getNonEmptyString(approvalId);
	if (!normalizedApprovalId) {
		return null;
	}

	const record = _pausedRovoDevToolApprovalStore.get(normalizedApprovalId) || null;
	if (!record) {
		return null;
	}

	_pausedRovoDevToolApprovalStore.delete(normalizedApprovalId);
	if (record.expiryTimer) {
		clearTimeout(record.expiryTimer);
		record.expiryTimer = null;
	}

	const releaseHandle = () => {
		try {
			record.handle?.release?.();
		} catch (error) {
			console.warn("[ROVODEV-PAUSE] Failed to release reserved tool-approval handle:", error);
		}
	};
	const releaseHandleAsUnhealthy = () => {
		try {
			if (typeof record.handle?.releaseAsUnhealthy === "function") {
				record.handle.releaseAsUnhealthy("paused tool approval cleanup failed");
				return;
			}
			record.handle?.release?.();
		} catch (error) {
			console.warn("[ROVODEV-PAUSE] Failed to release unhealthy tool-approval handle:", error);
		}
	};

	if (cancel) {
		void (async () => {
			let shouldReleaseAsUnhealthy = false;
			try {
				await rovoDevCancelChat(record.port, { timeoutMs: 3_000 });
				await waitForPortReady(record.port);
			} catch (error) {
				shouldReleaseAsUnhealthy = true;
				console.warn("[ROVODEV-PAUSE] Failed to cancel paused tool approval batch:", {
					approvalId: normalizedApprovalId,
					port: record.port,
					error: error instanceof Error ? error.message : String(error),
				});
			} finally {
				if (shouldReleaseAsUnhealthy) {
					releaseHandleAsUnhealthy();
				} else {
					releaseHandle();
				}
			}
		})();
	} else {
		releaseHandle();
	}

	return record;
}

function registerPausedRovoDevToolApprovalBatch({
	approvalId,
	port,
	handle,
	threadId = null,
	sessionId = null,
	sessionMode = "persistent",
	parts,
	autoApproveToolCallIds = [],
	payload,
}) {
	const normalizedApprovalId = getNonEmptyString(approvalId);
	if (
		!normalizedApprovalId ||
		!Number.isInteger(port) ||
		port <= 0 ||
		!handle ||
		!Array.isArray(parts) ||
		!payload ||
		typeof payload !== "object"
	) {
		return null;
	}

	clearPausedRovoDevToolApprovalBatch(normalizedApprovalId, { cancel: true });

	const now = Date.now();
	const record = {
		approvalId: normalizedApprovalId,
		port,
		handle,
		threadId: getNonEmptyString(threadId),
		sessionId: getNonEmptyString(sessionId),
		sessionMode: sessionMode === "ephemeral" ? "ephemeral" : "persistent",
		parts,
		autoApproveToolCallIds: Array.isArray(autoApproveToolCallIds)
			? autoApproveToolCallIds
				.map((toolCallId) => getNonEmptyString(toolCallId))
				.filter(Boolean)
			: [],
		payload,
		createdAt: now,
		expiresAt: now + PAUSED_ROVODEV_TOOL_CALL_TTL_MS,
		expiryTimer: null,
	};

	record.expiryTimer = setTimeout(() => {
		console.info("[ROVODEV-PAUSE] Expiring paused tool approval batch", {
			approvalId: normalizedApprovalId,
			port,
		});
		clearPausedRovoDevToolApprovalBatch(normalizedApprovalId, { cancel: true });
	}, PAUSED_ROVODEV_TOOL_CALL_TTL_MS);
	if (typeof record.expiryTimer?.unref === "function") {
		record.expiryTimer.unref();
	}

	_pausedRovoDevToolApprovalStore.set(normalizedApprovalId, record);
	return record;
}

function takePausedRovoDevToolApprovalBatch(approvalId) {
	const normalizedApprovalId = getNonEmptyString(approvalId);
	if (!normalizedApprovalId) {
		return null;
	}

	const record = _pausedRovoDevToolApprovalStore.get(normalizedApprovalId) || null;
	if (!record) {
		return null;
	}

	_pausedRovoDevToolApprovalStore.delete(normalizedApprovalId);
	if (record.expiryTimer) {
		clearTimeout(record.expiryTimer);
		record.expiryTimer = null;
	}

	return record;
}

function clearActiveDeferredToolCall(toolCallId) {
	const normalizedToolCallId = getNonEmptyString(toolCallId);
	if (!normalizedToolCallId) {
		return null;
	}

	const record = _activeDeferredToolCallStore.get(normalizedToolCallId) || null;
	if (!record) {
		return null;
	}

	_activeDeferredToolCallStore.delete(normalizedToolCallId);
	if (record.expiryTimer) {
		clearTimeout(record.expiryTimer);
		record.expiryTimer = null;
	}

	return record;
}

function registerActiveDeferredToolCall({
	toolCallId,
	port,
	threadId = null,
	kind,
}) {
	const normalizedToolCallId = getNonEmptyString(toolCallId);
	if (!normalizedToolCallId || !Number.isInteger(port) || port <= 0) {
		return null;
	}

	clearActiveDeferredToolCall(normalizedToolCallId);

	const now = Date.now();
	const record = {
		toolCallId: normalizedToolCallId,
		port,
		threadId: getNonEmptyString(threadId),
		kind: kind === "plan-approval" ? "plan-approval" : "clarification",
		createdAt: now,
		expiresAt: now + PAUSED_ROVODEV_TOOL_CALL_TTL_MS,
		expiryTimer: null,
	};

	record.expiryTimer = setTimeout(() => {
		clearActiveDeferredToolCall(normalizedToolCallId);
	}, PAUSED_ROVODEV_TOOL_CALL_TTL_MS);
	if (typeof record.expiryTimer?.unref === "function") {
		record.expiryTimer.unref();
	}

	_activeDeferredToolCallStore.set(normalizedToolCallId, record);
	return record;
}

function clearPausedRovoDevToolCall(toolCallId, { cancel = false } = {}) {
	const normalizedToolCallId = getNonEmptyString(toolCallId);
	if (!normalizedToolCallId) {
		return null;
	}

	const record = _pausedRovoDevToolCallStore.get(normalizedToolCallId) || null;
	if (!record) {
		return null;
	}

	_pausedRovoDevToolCallStore.delete(normalizedToolCallId);
	if (record.expiryTimer) {
		clearTimeout(record.expiryTimer);
		record.expiryTimer = null;
	}

	const releaseHandle = () => {
		try {
			record.handle?.release?.();
		} catch (error) {
			console.warn("[ROVODEV-PAUSE] Failed to release reserved port handle:", error);
		}
	};
	const releaseHandleAsUnhealthy = () => {
		try {
			if (typeof record.handle?.releaseAsUnhealthy === "function") {
				record.handle.releaseAsUnhealthy("paused tool cleanup failed");
				return;
			}
			record.handle?.release?.();
		} catch (error) {
			console.warn("[ROVODEV-PAUSE] Failed to release unhealthy reserved port handle:", error);
		}
	};

	if (cancel) {
		void (async () => {
			let shouldReleaseAsUnhealthy = false;
			try {
				await rovoDevCancelChat(record.port, { timeoutMs: 3_000 });
				await waitForPortReady(record.port);
			} catch (error) {
				shouldReleaseAsUnhealthy = true;
				console.warn("[ROVODEV-PAUSE] Failed to cancel paused tool call:", {
					toolCallId: normalizedToolCallId,
					port: record.port,
					error: error instanceof Error ? error.message : String(error),
				});
			} finally {
				if (shouldReleaseAsUnhealthy) {
					releaseHandleAsUnhealthy();
				} else {
					releaseHandle();
				}
			}
		})();
	} else {
		releaseHandle();
	}

	return record;
}

function registerPausedRovoDevToolCall({
	toolCallId,
	port,
	handle,
	threadId = null,
	sessionId = null,
	sessionMode = "persistent",
	kind,
}) {
	const normalizedToolCallId = getNonEmptyString(toolCallId);
	if (!normalizedToolCallId || !Number.isInteger(port) || port <= 0 || !handle) {
		return null;
	}

	clearPausedRovoDevToolCall(normalizedToolCallId, { cancel: true });

	const now = Date.now();
	const record = {
		toolCallId: normalizedToolCallId,
		port,
		handle,
		threadId: getNonEmptyString(threadId),
		sessionId: getNonEmptyString(sessionId),
		sessionMode: sessionMode === "ephemeral" ? "ephemeral" : "persistent",
		kind: kind === "plan-approval" ? "plan-approval" : "clarification",
		createdAt: now,
		expiresAt: now + PAUSED_ROVODEV_TOOL_CALL_TTL_MS,
		expiryTimer: null,
	};

	record.expiryTimer = setTimeout(() => {
		console.info("[ROVODEV-PAUSE] Expiring paused tool call reservation", {
			toolCallId: normalizedToolCallId,
			port,
			kind: record.kind,
		});
		clearPausedRovoDevToolCall(normalizedToolCallId, { cancel: true });
	}, PAUSED_ROVODEV_TOOL_CALL_TTL_MS);
	if (typeof record.expiryTimer?.unref === "function") {
		record.expiryTimer.unref();
	}

	_pausedRovoDevToolCallStore.set(normalizedToolCallId, record);
	return record;
}

function takePausedRovoDevToolCall(toolCallId) {
	return clearPausedRovoDevToolCall(toolCallId, { cancel: false });
}

/**
 * Adapts clarification answers for the ask_user_questions tool contract.
 * Wraps the core adapter with the module-level metadata store lookup.
 */
function adaptClarificationAnswersForToolContract(sessionId, answers) {
	const questionMeta = _requestUserInputQuestionMetaStore.get(sessionId) || null;
	return _adaptClarificationAnswersCore(sessionId, answers, questionMeta);
}

function normalizePlanTasks(value) {
	if (!Array.isArray(value)) {
		return [];
	}

	return value
		.map((task) => {
			if (typeof task === "string") {
				const label = getNonEmptyString(task);
				return label ? { id: "", label, agent: undefined, blockedBy: [] } : null;
			}

			if (task && typeof task === "object") {
				const label = getNonEmptyString(task.label);
				if (!label) return null;

				return {
					id: getNonEmptyString(task.id) || "",
					label,
					agent: getNonEmptyString(task.agent) || undefined,
					blockedBy: Array.isArray(task.blockedBy)
						? task.blockedBy
								.map((item) => getNonEmptyString(item))
								.filter(Boolean)
						: [],
				};
			}

			return null;
		})
		.filter(Boolean)
		.slice(0, 20);
}

function hasCompleteMermaidDiagram(value) {
	if (typeof value !== "string" || value.length === 0) {
		return false;
	}

	return /```mermaid\b[\s\S]*?```/.test(value);
}

function hasMermaidDependencyEdges(value) {
	if (typeof value !== "string" || value.length === 0) {
		return false;
	}

	const mermaidBlocks = value.match(/```mermaid\b[\s\S]*?```/gi);
	if (!mermaidBlocks || mermaidBlocks.length === 0) {
		return false;
	}

	const edgePattern =
		/\b[A-Za-z0-9_-]+\s*(?:-->|==>|-.->)\s*(?:\|[^|\n]+\|\s*)?[A-Za-z0-9_-]+\b/;
	return mermaidBlocks.some((block) => edgePattern.test(block));
}

function hasValidMermaidDiagram(value) {
	return hasCompleteMermaidDiagram(value) && hasMermaidDependencyEdges(value);
}

function hasUnclosedMermaidFence(value) {
	if (typeof value !== "string" || value.length === 0) {
		return false;
	}

	const markerIndex = value.lastIndexOf("```mermaid");
	if (markerIndex === -1) {
		return false;
	}

	const closingFenceIndex = value.indexOf("```", markerIndex + "```mermaid".length);
	return closingFenceIndex === -1;
}

function parsePlanWidgetPayload(value) {
	if (!value || typeof value !== "object") {
		return null;
	}

	const record =
		value.payload && typeof value.payload === "object"
			? value.payload
			: value;
	const tasks = normalizePlanTasks(
		Array.isArray(record.tasks)
			? record.tasks
			: Array.isArray(record.steps)
				? record.steps
				: null
	);

	if (tasks.length === 0) {
		return null;
	}

	return {
		title:
			getNonEmptyString(record.title) ||
			getNonEmptyString(record.name) ||
			"Plan",
		tasks,
	};
}

function getPlanWidgetTaskCount(value) {
	const parsedPayload = parsePlanWidgetPayload(value);
	return parsedPayload ? parsedPayload.tasks.length : 0;
}

function planWidgetRequiresApproval(value) {
	const parsedPayload = parsePlanWidgetPayload(value);
	return Boolean(parsedPayload?.deferredToolCallId);
}

function mergePlanWidgetPayloadTasks(basePayload, taskPayload) {
	const parsedBasePayload = parsePlanWidgetPayload(basePayload);
	const parsedTaskPayload = parsePlanWidgetPayload(taskPayload);
	if (!parsedBasePayload || !parsedTaskPayload || parsedTaskPayload.tasks.length === 0) {
		return null;
	}

	return {
		title: parsedBasePayload.title,
		description:
			parsedBasePayload.description ||
			parsedTaskPayload.description ||
			undefined,
		emoji: parsedBasePayload.emoji,
		tasks: parsedTaskPayload.tasks.map((task) => ({
			id: task.id,
			label: task.label,
			blockedBy: Array.isArray(task.blockedBy) ? [...task.blockedBy] : [],
			agent: task.agent,
		})),
		agents: [...parsedTaskPayload.agents],
		deferredToolCallId: parsedBasePayload.deferredToolCallId,
	};
}

function isWorkspaceWriteToolName(toolName) {
	const normalizedToolName = getNonEmptyString(toolName)?.toLowerCase();
	return (
		normalizedToolName === "create_file" ||
		normalizedToolName === "find_and_replace_code" ||
		normalizedToolName === "move_file" ||
		normalizedToolName === "delete_file" ||
		normalizedToolName === "bash" ||
		normalizedToolName === "powershell"
	);
}

function isReadonlyToolBlockMessage(value) {
	const normalizedValue = getNonEmptyString(value);
	if (!normalizedValue) {
		return false;
	}

	return /blocked in readonly mode|operation is currently blocked/i.test(normalizedValue);
}

function getReadonlyBlockedWriteToolNames(toolObservationEntries) {
	if (!Array.isArray(toolObservationEntries) || toolObservationEntries.length === 0) {
		return [];
	}

	return [
		...new Set(
			toolObservationEntries
				.filter((entry) =>
					isWorkspaceWriteToolName(entry?.toolName) &&
					isReadonlyToolBlockMessage(entry?.text)
				)
				.map((entry) => getNonEmptyString(entry?.toolName))
				.filter(Boolean),
		),
	];
}

function looksLikeWriteBlockedTurn({ assistantText, toolObservationEntries } = {}) {
	if (getReadonlyBlockedWriteToolNames(toolObservationEntries).length > 0) {
		return true;
	}

	return looksLikeWriteBlockedResponse(assistantText);
}

function sanitizeMermaidNodeId(value) {
	const normalizedValue = (value || "").toLowerCase().replace(/[^a-z0-9_]/g, "_");
	if (!normalizedValue) {
		return "task";
	}

	return /^[a-z_]/.test(normalizedValue) ? normalizedValue : `task_${normalizedValue}`;
}

function createUniqueMermaidNodeId(baseId, usedNodeIds) {
	if (!usedNodeIds.has(baseId)) {
		usedNodeIds.add(baseId);
		return baseId;
	}

	let duplicateIndex = 2;
	let candidateId = `${baseId}_${duplicateIndex}`;
	while (usedNodeIds.has(candidateId)) {
		duplicateIndex += 1;
		candidateId = `${baseId}_${duplicateIndex}`;
	}

	usedNodeIds.add(candidateId);
	return candidateId;
}

function escapeMermaidLabel(label) {
	return label.replace(/#/g, "#35;").replace(/"/g, "#quot;");
}

function generateMermaidFromPlan(planPayload) {
	const parsedPlan = parsePlanWidgetPayload(planPayload);
	if (!parsedPlan) {
		return "";
	}

	const usedNodeIds = new Set();
	const taskIdToNodeId = new Map();
	const nodeEntries = parsedPlan.tasks.map((task, index) => {
		const taskId = getNonEmptyString(task.id) || `${index + 1}`;
		const fallbackNodeId = `task_${index + 1}`;
		const sanitizedNodeId = sanitizeMermaidNodeId(taskId) || fallbackNodeId;
		const nodeId = createUniqueMermaidNodeId(sanitizedNodeId, usedNodeIds);
		if (!taskIdToNodeId.has(taskId)) {
			taskIdToNodeId.set(taskId, nodeId);
		}

		return {
			nodeId,
			taskId,
			label: task.label,
			blockedBy: task.blockedBy,
		};
	});

	const edgeLines = [];
	const seenEdges = new Set();
	for (const node of nodeEntries) {
		for (const dependencyId of node.blockedBy) {
			const fromNodeId = taskIdToNodeId.get(dependencyId);
			if (!fromNodeId) {
				continue;
			}

			const edgeKey = `${fromNodeId}->${node.nodeId}`;
			if (seenEdges.has(edgeKey)) {
				continue;
			}

			seenEdges.add(edgeKey);
			edgeLines.push(`  ${fromNodeId} --> ${node.nodeId}`);
		}
	}

	// Ensure the diagram still represents dependencies when blockedBy metadata is absent.
	if (edgeLines.length === 0 && nodeEntries.length > 1) {
		for (let index = 1; index < nodeEntries.length; index += 1) {
			const fromNodeId = nodeEntries[index - 1].nodeId;
			const toNodeId = nodeEntries[index].nodeId;
			const edgeKey = `${fromNodeId}->${toNodeId}`;
			if (seenEdges.has(edgeKey)) {
				continue;
			}

			seenEdges.add(edgeKey);
			edgeLines.push(`  ${fromNodeId} --> ${toNodeId}`);
		}
	}

	const lines = [
		"```mermaid",
		"graph TD",
		...nodeEntries.map((node) => `  ${node.nodeId}["${escapeMermaidLabel(node.label)}"]`),
		...edgeLines,
		"```",
	];

	return lines.join("\n");
}

const APPROVAL_DECISIONS = new Set(["auto-accept", "continue-planning", "custom"]);

function normalizeApprovalDecision(value) {
	const normalizedDecision = getNonEmptyString(value);
	if (!normalizedDecision || !APPROVAL_DECISIONS.has(normalizedDecision)) {
		return null;
	}

	return normalizedDecision;
}

function normalizeApprovalSubmission(value) {
	if (!value || typeof value !== "object") {
		return null;
	}

	const decision =
		normalizeApprovalDecision(value.decision) ||
		normalizeApprovalDecision(value.choice) ||
		normalizeApprovalDecision(value.selection);
	if (!decision) {
		return null;
	}

	return {
		decision,
		customInstruction:
			getNonEmptyString(value.customInstruction) ||
			getNonEmptyString(value.note) ||
			undefined,
		planTitle:
			getNonEmptyString(value.planTitle) ||
			getNonEmptyString(value.title) ||
			undefined,
		planTasks: normalizePlanTasks(value.planTasks || value.tasks),
		toolCallId:
			getNonEmptyString(value.toolCallId) ||
			getNonEmptyString(value.deferredToolCallId) ||
			undefined,
		deferredToolCallId:
			getNonEmptyString(value.deferredToolCallId) ||
			getNonEmptyString(value.toolCallId) ||
			undefined,
	};
}

function getApprovalDecisionLabel(decision) {
	if (decision === "auto-accept") {
		return "Yes, let's start cooking";
	}

	if (decision === "continue-planning") {
		return "No, keep planning";
	}

	return "Custom instruction";
}

function buildApprovalSummary(approvalSubmission) {
	if (!approvalSubmission) {
		return "";
	}

	const lines = [
		`Decision: ${getApprovalDecisionLabel(approvalSubmission.decision)}`,
	];

	if (approvalSubmission.planTitle) {
		lines.push(`Plan title: ${approvalSubmission.planTitle}`);
	}

	if (approvalSubmission.customInstruction) {
		lines.push(`Additional instruction: ${approvalSubmission.customInstruction}`);
	}

	if (approvalSubmission.planTasks.length > 0) {
		lines.push("Plan tasks:");
		for (const task of approvalSubmission.planTasks) {
			const agentSuffix = task.agent ? ` [Agent: ${task.agent}]` : "";
			const blockedSuffix = task.blockedBy.length > 0 ? ` (blockedBy: ${task.blockedBy.join(", ")})` : "";
			lines.push(`  - id="${task.id}" ${task.label}${agentSuffix}${blockedSuffix}`);
		}
	}

	lines.push(
		"This approval applies to the existing generated plan. Continue from it.",
		"Stay in the current RovoDev Serve execution loop.",
		"Maintain a single evolving update_todo list for implementation progress.",
		"Do not ask clarification questions again unless the user explicitly requests a new plan.",
		"Do not restate the plan as a fresh request or generate a new preview unless the user explicitly asks for one."
	);

	return lines.join("\n");
}

function getToolCallIdFromClarificationSubmission(clarificationSubmission) {
	const explicitToolCallId =
		getNonEmptyString(clarificationSubmission?.toolCallId) ||
		getNonEmptyString(clarificationSubmission?.deferredToolCallId);
	if (explicitToolCallId) {
		return explicitToolCallId;
	}

	const sessionId = getNonEmptyString(clarificationSubmission?.sessionId);
	if (!sessionId) {
		return null;
	}

	const requestUserInputMatch = /^request-user-input-(.+)$/u.exec(sessionId);
	if (requestUserInputMatch?.[1]) {
		return requestUserInputMatch[1];
	}

	return null;
}

function getToolCallIdFromApprovalSubmission(approvalSubmission, rawApproval) {
	return (
		getNonEmptyString(approvalSubmission?.toolCallId) ||
		getNonEmptyString(approvalSubmission?.deferredToolCallId) ||
		getNonEmptyString(rawApproval?.toolCallId) ||
		getNonEmptyString(rawApproval?.deferredToolCallId) ||
		null
	);
}

function buildClarificationResumeDenyMessage(clarificationSubmission) {
	if (!clarificationSubmission) {
		return null;
	}

	const adaptedAnswers = adaptClarificationAnswersForToolContract(
		clarificationSubmission.sessionId,
		clarificationSubmission.answers,
	);
	const answerEntries = Object.entries(adaptedAnswers);
	if (answerEntries.length === 0) {
		return [
			"The user skipped the clarification step.",
			"Continue with the best context you already have.",
		].join("\n");
	}

	const answerLines = answerEntries.map(([question, answers]) => {
		const values = Array.isArray(answers) ? answers.filter(Boolean) : [];
		return `- ${question}: ${values.join(", ")}`;
	});

	return [
		"The user answered the clarification questions.",
		"Use these answers instead of calling the clarification tool again:",
		...answerLines,
	].join("\n");
}

function buildApprovalResumeDecision(approvalSubmission) {
	if (!approvalSubmission) {
		return null;
	}

	if (approvalSubmission.decision === "auto-accept") {
		return null;
	}

	return buildApprovalSummary(approvalSubmission);
}

function getLatestAssistantWidgetPayload(messages) {
	if (!Array.isArray(messages)) {
		return null;
	}

	for (let messageIndex = messages.length - 1; messageIndex >= 0; messageIndex--) {
		const message = messages[messageIndex];
		if (!message || message.role !== "assistant" || !Array.isArray(message.parts)) {
			continue;
		}

		for (let partIndex = message.parts.length - 1; partIndex >= 0; partIndex--) {
			const part = message.parts[partIndex];
			if (part?.type !== "data-widget-data" || !part.data) {
				continue;
			}

			const widgetType = getNonEmptyString(part.data.type);
			if (!widgetType) {
				continue;
			}

			return {
				type: widgetType,
				payload: part.data.payload,
			};
		}
	}

	return null;
}

function getActiveQuestionCardPayload(messages) {
	const latestWidgetPayload = getLatestAssistantWidgetPayload(messages);
	if (!latestWidgetPayload || latestWidgetPayload.type !== CLARIFICATION_WIDGET_TYPE) {
		return null;
	}

	return sanitizeQuestionCardPayload(latestWidgetPayload.payload, {
		widgetType: CLARIFICATION_WIDGET_TYPE,
		maxRounds: CLARIFICATION_MAX_ROUNDS,
		maxPresetOptions: CLARIFICATION_MAX_PRESET_OPTIONS,
		customOptionPlaceholder: CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER,
		maxLabelLength: CLARIFICATION_MAX_LABEL_LENGTH,
	});
}

function hasAnswerForQuestion(question, answers) {
	const answerValue = answers[question.id];
	if (question.kind === "multi-select") {
		return Array.isArray(answerValue) && answerValue.length > 0;
	}

	return typeof answerValue === "string" && answerValue.trim().length > 0;
}

function hasRequiredClarificationAnswers(questionCard, answers) {
	return questionCard.questions.every((question) => {
		if (!question.required) {
			return true;
		}

		return hasAnswerForQuestion(question, answers);
	});
}

function sanitizeAnswersForQuestionCard(questionCard, answers) {
	return questionCard.questions.reduce((result, question) => {
		const normalizedAnswerValue = normalizeClarificationAnswerValue(
			answers[question.id]
		);
		if (!normalizedAnswerValue) {
			return result;
		}

		result[question.id] = normalizedAnswerValue;
		return result;
	}, {});
}

function formatClarificationAnswerValue(value) {
	return Array.isArray(value) ? value.join(", ") : value;
}

function resolveAnswerOptionLabel(question, answer) {
	if (!question || typeof answer !== "string") {
		return answer;
	}

	const matchingOption = question.options.find((option) => option.id === answer);
	return matchingOption?.label || answer;
}

function formatClarificationAnswer(question, value) {
	if (Array.isArray(value)) {
		return value
			.map((answer) => resolveAnswerOptionLabel(question, answer))
			.join(", ");
	}

	return resolveAnswerOptionLabel(question, value);
}

function buildClarificationSummary(questionCard, answers) {
	if (!questionCard) {
		const answerLines = Object.entries(answers)
			.map(([questionId, answerValue]) => `- ${questionId}: ${formatClarificationAnswerValue(answerValue)}`);
		return answerLines.join("\n");
	}

	return questionCard.questions
		.map((question) => {
			const answerValue = answers[question.id];
			if (!answerValue) {
				return null;
			}

			return `- ${question.label}: ${formatClarificationAnswer(question, answerValue)}`;
		})
			.filter(Boolean)
			.join("\n");
}

// Keep utility helpers available for rapid feature toggles without tripping lint.
function markLintKeepalive() {}
markLintKeepalive(
	streamTextViaAIGateway,
	buildApprovalSummary,
	hasRequiredClarificationAnswers,
	sanitizeAnswersForQuestionCard,
	buildClarificationSummary
);

function parseJsonFromText(rawText) {
	try {
		return JSON.parse(rawText);
	} catch {
		const objectMatch = rawText.match(/\{[\s\S]*\}/);
		if (!objectMatch) {
			return null;
		}

		try {
			return JSON.parse(objectMatch[0]);
		} catch {
			return null;
		}
	}
}

function extractQuestionCardPayloadFromAssistantText(rawText, defaults = {}) {
	const extractedPayload = extractQuestionCardDefinitionFromAssistantText(
		rawText,
		defaults
	);
	if (!extractedPayload) {
		return null;
	}

	return sanitizeQuestionCardPayload(extractedPayload, {
		...defaults,
		widgetType: CLARIFICATION_WIDGET_TYPE,
		maxRounds: CLARIFICATION_MAX_ROUNDS,
		maxPresetOptions: CLARIFICATION_MAX_PRESET_OPTIONS,
		customOptionPlaceholder: CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER,
		maxLabelLength: CLARIFICATION_MAX_LABEL_LENGTH,
		createSessionId: createClarificationSessionId,
	});
}

function createClarificationQuestionPrompt({
	latestUserMessage,
	conversationHistory,
	previousQuestionCard,
	submission,
	round,
	maxRounds,
	intentHint,
}) {
	const conversationContext =
		Array.isArray(conversationHistory) && conversationHistory.length > 0
			? conversationHistory
					.map((message) => `${message.type === "user" ? "User" : "Assistant"}: ${message.content}`)
					.join("\n")
			: "No prior context.";
	const previousQuestions = previousQuestionCard
		? JSON.stringify(previousQuestionCard.questions)
		: "[]";
	const previousAnswers = submission
		? JSON.stringify(submission.answers)
		: "{}";

	const intentGuidance = intentHint === "visualization"
		? `
Visualization-specific guidance:
- Ask about chart type (bar, line, pie, area, radar, etc.)
- Ask about the data source or metrics to visualize (revenue, users, conversions, etc.)
- Ask about the grouping dimension (by region, by month, by product, etc.)
- Ask about the time range or period (last 30 days, 2024, Q1-Q4, etc.)
`
		: "";

	return `You generate structured clarification question cards for planning and problem-solving requests.
Return ONLY valid JSON and no markdown.

Target schema:
{
  "type": "question-card",
  "title": "string",
  "description": "string",
  "questions": [
    {
      "id": "string",
      "label": "string",
      "description": "string",
      "required": true,
      "kind": "single-select | multi-select",
      "placeholder": "string",
      "options": [
        { "id": "string", "label": "string", "description": "string", "recommended": true }
      ]
    }
  ]
}

Rules:
- Generate 2-4 questions total.
- Keep questions short and decision-focused.
- At least 2 questions must be required.
- Every question must be either "single-select" or "multi-select".
- Use "multi-select" only when picking multiple answers is genuinely useful; otherwise prefer "single-select".
- Every question must include 1-3 options.
- Each option MUST be a specific, concrete answer to its question — not a generic category or meta-label.
- Do not include a custom free-text option in the JSON options.
- The UI automatically appends a "Tell Rovo what to do..." free-text field after the generated options.
- Do not generate a plan or task list.
- This is round ${round} of ${maxRounds}.
- If previous answers are partial, ask only missing/high-impact follow-ups.

Option quality:
- BAD options (generic meta-labels): "Quick recommendation", "Balanced approach", "Detailed plan", "Basic", "Advanced"
- GOOD options (specific answers): For "Which site?" → "Marketing site", "Developer docs", "Customer portal". For "What framework?" → "React", "Vue", "Angular".
- Each option must directly answer the question it belongs to.
${intentGuidance}
Conversation context:
${conversationContext}

Latest user request:
${latestUserMessage}

Previous question set:
${previousQuestions}

Submitted answers:
${previousAnswers}`;
}

async function generateClarificationQuestionCard({
	latestUserMessage,
	conversationHistory,
	previousQuestionCard,
	submission,
	round,
	maxRounds,
	sessionId,
	intentHint,
	gatewayOptions,
}) {
	const promptText = createClarificationQuestionPrompt({
		latestUserMessage,
		conversationHistory,
		previousQuestionCard,
		submission,
		round,
		maxRounds,
		intentHint,
	});

	try {
		const text = await generateTextViaGateway({
			system: "You output strict JSON for clarification question cards.",
			prompt: promptText,
			maxOutputTokens: 700,
			temperature: 0.3,
			...gatewayOptions,
		});

		const parsedJson = parseJsonFromText(text);
		const sanitizedPayload = sanitizeQuestionCardPayload(parsedJson, {
			sessionId,
			round,
			maxRounds,
			widgetType: CLARIFICATION_WIDGET_TYPE,
			directive: buildClarificationDirective({
				latestUserMessage,
				intentHint,
			}),
			maxPresetOptions: CLARIFICATION_MAX_PRESET_OPTIONS,
			customOptionPlaceholder: CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER,
			maxLabelLength: CLARIFICATION_MAX_LABEL_LENGTH,
			createSessionId: createClarificationSessionId,
		});
		if (sanitizedPayload) {
			return sanitizedPayload;
		}
	} catch (error) {
		console.error("[CLARIFICATION] Gateway error:", error.message || error);
	}

	return null;
}

function streamQuestionCardWidget({ res, payload, introText }) {
	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			const widgetId = `widget-${Date.now()}`;

			if (introText) {
				const textId = `text-${Date.now()}`;
				writer.write({ type: "text-start", id: textId });
				writer.write({ type: "text-delta", id: textId, delta: introText });
				writer.write({ type: "text-end", id: textId });
			}

			writer.write({
				type: "data-widget-loading",
				id: widgetId,
				data: {
					type: CLARIFICATION_WIDGET_TYPE,
					loading: true,
				},
			});

			writer.write({
				type: "data-widget-data",
				id: widgetId,
				data: {
					type: CLARIFICATION_WIDGET_TYPE,
					payload,
				},
			});

			writer.write({
				type: "data-widget-loading",
				id: widgetId,
				data: {
					type: CLARIFICATION_WIDGET_TYPE,
					loading: false,
				},
			});

			writer.write({
				type: "data-turn-complete",
				data: { timestamp: new Date().toISOString() },
			});
		},
		onError: (error) =>
			error instanceof Error
				? error.message
				: "Failed to stream clarification question card",
	});

	pipeUIMessageStreamToResponse({
		response: res,
		stream,
	});
}

async function generateSuggestedQuestions({
	message,
	conversationHistory,
	assistantResponse,
	signal,
}) {
	if (!assistantResponse || !assistantResponse.trim()) {
		return [];
	}

	if (!hasGatewayUrlConfigured()) {
		console.info("[SUGGESTIONS] Skipping AI Gateway (not configured)");
		return [];
	}

	return generateSuggestedQuestionsViaAIGateway({
		message,
		conversationHistory,
		assistantResponse,
		signal,
		generateText: (options) => aiGatewayProvider.generateText(options),
		logger: console,
	});
}

app.post("/api/future-chat/suggestions", async (req, res) => {
	const { abortController, cleanup } = createAbortControllerFromRequest(req, res);

	try {
		const {
			message: rawMessage,
			conversationHistory: rawConversationHistory,
			assistantResponse: rawAssistantResponse,
		} = req.body || {};
		const message = getNonEmptyString(rawMessage);
		const assistantResponse = getNonEmptyString(rawAssistantResponse);
		const conversationHistory = Array.isArray(rawConversationHistory)
			? rawConversationHistory
					.flatMap((entry) => {
						if (!entry || typeof entry !== "object") {
							return [];
						}

						const type =
							entry.type === "user" || entry.type === "assistant"
								? entry.type
								: null;
						const content = getNonEmptyString(entry.content);
						return type && content
							? [
								{
									type,
									content,
								},
							]
							: [];
					})
			: [];

		if (!message || !assistantResponse) {
			return res.status(200).json({ questions: [] });
		}

		const questions = await generateSuggestedQuestions({
			message,
			conversationHistory,
			assistantResponse,
			signal: abortController.signal,
		});

		return res.status(200).json({
			questions: Array.isArray(questions) ? questions : [],
		});
	} catch (error) {
		const isAbortError =
			typeof error === "object" &&
			error !== null &&
			"name" in error &&
			error.name === "AbortError";
		if (isAbortError && (abortController.signal.aborted || req.aborted || res.destroyed)) {
			return;
		}

		console.error("[SUGGESTIONS] Future Chat suggestions request failed:", error);
		return res.status(200).json({ questions: [] });
	} finally {
		cleanup();
	}
});

app.post("/api/chat-title", async (req, res) => {
	try {
		const { message } = req.body || {};

		if (!message || typeof message !== "string" || !message.trim()) {
			return res.status(400).json({ error: "A message is required" });
		}

		const titlePrompt = `Generate a very short title (3-6 words) that summarizes this user message. Return ONLY the title text, nothing else. No quotes, no punctuation at the end, no explanation.

User message: ${message.trim()}`;

		const text = await generateTextViaGateway({
			system: "You generate concise chat titles. Respond with only the title, 3-6 words.",
			prompt: titlePrompt,
			maxOutputTokens: 30,
			temperature: 0.7,
			backendPreference: "ai-gateway",
		});

		let title = text.trim().replace(/^["']|["']$/g, "").replace(/\.+$/, "").trim();

		if (!title) {
			return res.status(500).json({ error: "Empty title generated" });
		}

		return res.json({ title });
	} catch (error) {
		console.warn("[CHAT-TITLE] AI Gateway unavailable, skipping title generation:", error?.message || error);
		return res.json({ title: null });
	}
});

app.post("/api/plan-title", async (req, res) => {
	try {
		const { title, description, tasks } = req.body || {};

		if (!title || typeof title !== "string" || !title.trim()) {
			return res.status(400).json({ error: "A title is required" });
		}

		const taskLabels = Array.isArray(tasks)
			? tasks.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim())
			: [];

		const taskContext = taskLabels.length > 0
			? `\nTasks (${taskLabels.length}): ${taskLabels.join("; ")}`
			: "";

		const descriptionContext = typeof description === "string" && description.trim()
			? `\nCurrent description: ${description.trim()}`
			: "";

		const enrichPrompt = `Name the app or product this plan will build, and describe it in plain language.

Current title: ${title.trim()}${descriptionContext}${taskContext}

Rules:
- Title: 2-5 words, name the final app/product/feature being built (e.g. "Time Tracking Dashboard", "Sprint Board", "Team Chat App"), no code/file references, no verbs like "Create" or "Build"
- Description: 1-2 sentences, explain what the finished product does for the user, no code references`;

		const text = await generateTextViaGateway({
			system: 'You name apps and products based on their technical plans. Given task details, identify what is being built and give it a clear product name. Respond with JSON only: {"title":"...","description":"..."}',
			prompt: enrichPrompt,
			maxOutputTokens: 150,
			temperature: 0.7,
			backendPreference: "ai-gateway",
		});

		const trimmed = text.trim();
		let enrichedTitle = title.trim();
		let enrichedDescription = (description || "").trim();

		try {
			const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				if (typeof parsed.title === "string" && parsed.title.trim()) {
					enrichedTitle = parsed.title.trim().replace(/^["']|["']$/g, "").replace(/\.+$/, "").trim();
				}
				if (typeof parsed.description === "string" && parsed.description.trim()) {
					enrichedDescription = parsed.description.trim().replace(/^["']|["']$/g, "").replace(/\.+$/, "").trim();
				}
			}
		} catch {
			// If JSON parsing fails, return the original values
		}

		if (!enrichedTitle) {
			return res.status(500).json({ error: "Empty title generated" });
		}

		return res.json({ title: enrichedTitle, description: enrichedDescription });
	} catch (error) {
		console.error("Plan title API error:", error);
		return sendGatewayErrorResponse(res, error, "Failed to generate plan title");
	}
});

async function handleChatSdkRequest(req, res) {
	let stageTrace = null;
	let cleanupChatSdkAbortTracking = null;
	try {
		const {
			messages,
			contextDescription: rawContextDescription,
			clientTimeZone: rawClientTimeZone,
			provider,
			model: rawModel,
			clarification: rawClarification,
			approval: rawApproval,
			toolApproval: rawToolApproval,
			deferredToolResponse: rawDeferredToolResponse,
			planRequestId,
			creationMode,
			smartGeneration: rawSmartGeneration,
			hasQueuedPrompts: rawHasQueuedPrompts,
			origin: rawOrigin,
			genuiHint: rawGenuiHint,
			resolvedPlanModeActive: rawResolvedPlanModeActive,
			chatSdkSource: rawChatSdkSource,
			threadId: rawThreadId,
			id: rawRequestId,
			sessionId: rawSessionId,
			sessionMode: rawSessionMode,
		} = req.body || {};
		const clientTimeZone = normalizeClientTimeZone(rawClientTimeZone);
		const genuiHint = rawGenuiHint === true;
		let resolvedPlanModeActive = rawResolvedPlanModeActive === true;
		const chatSdkSource = getNonEmptyString(rawChatSdkSource) || "direct";
		const threadId = resolveChatSdkThreadId({
			chatSdkSource,
			threadId: rawThreadId,
			id: rawRequestId,
		});
		const sessionId = typeof rawSessionId === "string" && rawSessionId.trim().length > 0
			? rawSessionId.trim()
			: null;
		const sessionMode = rawSessionMode === "ephemeral" ? "ephemeral" : "persistent";
		const rovoDevSessionId = sessionId && sessionMode !== "ephemeral"
			? sessionId
			: null;
		const requestOrigin =
			getNonEmptyString(rawOrigin)?.toLowerCase() === "voice" ? "voice" : "text";
			stageTrace = resolveStageTraceFromRequest(req, "chat-sdk", {
				path: "/api/chat-sdk",
				origin: requestOrigin,
				source: chatSdkSource,
			});
		res.setHeader(STAGE_TRACE_ID_HEADER, stageTrace.requestId);
		const chatSdkEntryStartedAtMs = Date.now();
		stageTrace.mark("entry", {
			messageCount: Array.isArray(messages) ? messages.length : 0,
			provider: getNonEmptyString(provider) || null,
			model: getNonEmptyString(rawModel) || null,
			hasClarification: Boolean(rawClarification),
			hasApproval: Boolean(rawApproval),
			hasToolApproval: Boolean(rawToolApproval),
			hasDeferredToolResponse: Boolean(rawDeferredToolResponse),
			resolvedPlanModeActive,
		});
		const hasQueuedPrompts = Boolean(rawHasQueuedPrompts);

		// If creationMode is set, prepend generic creation guidance to contextDescription.
		let contextDescription = rawContextDescription;
		if (creationMode === "skill" || creationMode === "agent") {
			const prefix = `[${creationMode.toUpperCase()} CREATION MODE]
You are in ${creationMode} creation mode. Help the user create a new ${creationMode} definition file.
This is a local ${creationMode} definition - not a Confluence page, Jira ticket, or any Atlassian product content.
Ask clarifying questions when required fields are missing.
Return a complete, production-ready definition that can be persisted directly.
Once ready, call POST /api/plan/${creationMode}s to persist it.
[END ${creationMode.toUpperCase()} CREATION MODE]`;
			contextDescription = contextDescription ? `${prefix}\n\n${contextDescription}` : prefix;
		}

		const latestVisibleUserMessage = getLatestVisibleUserMessage(messages);
		const latestUserMessageSource = getLatestUserMessageSource(messages);
		const isPostClarificationTurn =
			latestUserMessageSource === "clarification-submit";
		const clarificationSubmission = normalizeClarificationSubmission(rawClarification);
		const approvalSubmission = normalizeApprovalSubmission(rawApproval);
		const toolApprovalSubmission = normalizeToolApprovalSubmission(rawToolApproval);
		const deferredToolResponseToolCallId =
			rawDeferredToolResponse && typeof rawDeferredToolResponse === "object"
				? getNonEmptyString(rawDeferredToolResponse.tool_call_id)
				: null;
		if (deferredToolResponseToolCallId) {
			clearActiveDeferredToolCall(deferredToolResponseToolCallId);
		}
		const clarificationToolCallId =
			getToolCallIdFromClarificationSubmission(clarificationSubmission);
		const approvalToolCallId =
			getToolCallIdFromApprovalSubmission(approvalSubmission, rawApproval);
		const hasPausedClarificationToolCall =
			Boolean(clarificationToolCallId) &&
			_pausedRovoDevToolCallStore.has(clarificationToolCallId);
		let hasPausedApprovalToolCall =
			Boolean(approvalToolCallId) &&
			_pausedRovoDevToolCallStore.has(approvalToolCallId);
		const hasPausedToolApprovalBatch =
			Boolean(toolApprovalSubmission?.approvalId) &&
			_pausedRovoDevToolApprovalStore.has(toolApprovalSubmission.approvalId);

		if (approvalSubmission) {
			console.info("[DEBUG-PLAN-APPROVAL] Approval store lookup", {
				approvalToolCallId,
				hasPausedApprovalToolCall,
				storeSize: _pausedRovoDevToolCallStore.size,
				storeKeys: [..._pausedRovoDevToolCallStore.keys()],
				submissionDecision: approvalSubmission.decision,
				rawToolCallId: rawApproval?.toolCallId,
				rawDeferredToolCallId: rawApproval?.deferredToolCallId,
			});
		}

		// Plan approvals are handled via the deferred tool continuation path
		// (lines ~9222+). The paused tool call is resumed with the approval
		// result using /v3/resume_tool_calls + /v3/replay, which avoids the
		// 409 "chat already in progress" race condition that occurs when
		// trying to cancel and start a fresh turn via /v3/stream_chat.
		//
		// Previously this block cleared the paused approval (resume + cancel
		// + waitForPortReady) to start a fresh turn. But the cancel often
		// times out because the resumed agent starts processing immediately,
		// leaving the port stuck. The continuation path is the correct
		// mechanism — it continues the existing session naturally.

		// Restore plan mode on deferred tool resume turns where the frontend
		// didn't send isPlanMode (e.g., clarification answer, plan approval).
		if (!resolvedPlanModeActive && threadId && (hasPausedClarificationToolCall || hasPausedApprovalToolCall)) {
			const restore = shouldRestorePlanModeOnResume({
				pausedToolCallRecord: {
					toolCallId: hasPausedClarificationToolCall
						? clarificationToolCallId
						: approvalToolCallId,
				},
				resolvedPlanModeActive,
				threadId,
			});
			if (restore.shouldRestore) {
				resolvedPlanModeActive = true;
				console.info("[CHAT-SDK] Restored plan mode from plan session", {
					threadId,
					phase: restore.phase,
				});
			}
		}

		// Persist plan session state when entering plan mode.
		if (resolvedPlanModeActive && threadId) {
			const planSession = getPlanSession(threadId);
			if (!planSession.isActive) {
				updatePlanSession(threadId, { isActive: true, phase: "qa" });
			}
			// Transition to execution phase on plan approval.
			// This suppresses GenUI card routing so plan task outputs
			// route to the artifact panel instead.
			if (approvalSubmission && planSession.phase !== "execution") {
				updatePlanSession(threadId, { phase: "execution" });
				console.info("[PLAN-SESSION] Transitioned to execution phase on approval", {
					threadId,
					decision: approvalSubmission.decision,
					previousPhase: planSession.phase,
				});
			}
		} else if (approvalSubmission && threadId) {
			// Auto-accept sends isPlanMode: false, but we still need to
			// transition the plan session to execution phase so that
			// GenUI card routing is suppressed during plan task execution
			// and outputs route to the artifact panel instead.
			const planSession = getPlanSession(threadId);
			if (planSession.isActive) {
				updatePlanSession(threadId, { phase: "execution" });
				console.info("[PLAN-SESSION] Transitioned to execution phase on auto-accept approval", {
					threadId,
					decision: approvalSubmission.decision,
					previousPhase: planSession.phase,
				});
			} else {
				// Plan session was cleared or never started — create it in execution phase.
				updatePlanSession(threadId, { isActive: true, phase: "execution" });
				console.info("[PLAN-SESSION] Created execution-phase session for auto-accept approval", {
					threadId,
					decision: approvalSubmission.decision,
				});
			}
		} else if (!resolvedPlanModeActive && threadId && !hasPausedClarificationToolCall && !hasPausedApprovalToolCall) {
			// Keep the execution-phase session alive across Serve-driven
			// continuations such as paused tool approvals. Only clear it when
			// a new visible user prompt starts a fresh top-level request.
			const planSession = getPlanSession(threadId);
			// Transition to execution phase when the "Build" button sends a
			// deferredToolResponse for exit_plan_mode with isPlanMode: false.
			// This mirrors the approvalSubmission path below but for the
			// deferred tool response mechanism used by the frontend.
			if (
				deferredToolResponseToolCallId &&
				planSession.isActive &&
				planSession.phase !== "execution"
			) {
				updatePlanSession(threadId, { phase: "execution" });
				console.info("[PLAN-SESSION] Transitioned to execution phase on deferred tool acceptance", {
					threadId,
					deferredToolCallId: deferredToolResponseToolCallId,
					previousPhase: planSession.phase,
				});
			} else {
				const shouldKeepExecutionSession =
					planSession.isActive &&
					planSession.phase === "execution";
				if (!shouldKeepExecutionSession && latestVisibleUserMessage) {
					clearPlanSession(threadId);
				}
			}
		}
		const {
			message: latestUserMessage,
			conversationHistory,
		} = mapUiMessagesToConversation(messages);

		if (!latestUserMessage) {
			return res.status(400).json({ error: "A user message is required" });
		}

		const shouldRejectExpiredClarification = shouldRejectExpiredDeferredClarification({
			hasClarificationContinuation:
				isPostClarificationTurn &&
				Boolean(clarificationSubmission) &&
				!rawDeferredToolResponse,
			hasPausedClarificationToolCall,
			toolCallId: clarificationToolCallId,
		});
		if (shouldRejectExpiredClarification) {
			console.info("[CHAT-SDK] Rejected expired clarification continuation", {
				toolCallId: clarificationToolCallId,
				threadId,
				sessionId: clarificationSubmission?.sessionId ?? null,
			});

			const activeRequestPort =
				threadId && activeRequests.has(threadId)
					? activeRequests.get(threadId)?.port
					: null;
			if (typeof activeRequestPort === "number" && activeRequestPort > 0) {
				await rovoDevCancelChat(activeRequestPort, { timeoutMs: 3_000 }).catch(() => {});
				activeRequests.delete(threadId);
			}

			streamExpiredClarificationResponse(res, clarificationToolCallId);
			return;
		}

		// ── Local model shortcut (bypasses RovoDev and all smart routing) ──
		if (isLocalModelRequest(provider, rawModel)) {
			console.info("[CHAT-SDK] Routing through local MLX model", { provider, model: rawModel });
			const stream = createUIMessageStream({
				execute: async ({ writer }) => {
					try {
						await streamLocalModel({
							userMessage: latestUserMessage,
							conversationHistory,
							writer,
						});
					} catch (error) {
						console.error("[LOCAL-MODEL] Stream error:", error);
						const errorId = `local-error-${Date.now()}`;
						writer.write({ type: "text-start", id: errorId });
						writer.write({
							type: "text-delta",
							id: errorId,
							delta: `Local model error: ${error instanceof Error ? error.message : String(error)}\n\nMake sure mlx_lm.server is running:\n\`\`\`\nmlx_lm.server --model mlx-community/Qwen3-0.6B-MLX-8bit --port 8800\n\`\`\``,
						});
						writer.write({ type: "text-end", id: errorId });
						writer.write({
							type: "data-turn-complete",
							data: { timestamp: new Date().toISOString() },
						});
					}
				},
				onError: (error) =>
					error instanceof Error ? error.message : "Local model request failed",
			});
			pipeUIMessageStreamToResponse({ response: res, stream });
			return;
		}

		const latestVisiblePromptText =
			getNonEmptyString(latestVisibleUserMessage?.text) || latestUserMessage;
		const translationRequestState = clarificationSubmission
			? resolveTranslationRequestFromClarification({
				clarificationSubmission,
				latestVisibleUserMessage: latestVisiblePromptText,
			})
			: resolveTranslationRequestState(latestVisiblePromptText);
		const isTranslationClarificationTurn =
			clarificationSubmission &&
			isTranslationClarificationSession(clarificationSubmission.sessionId);
		const isTranslationSkipTurn =
			latestUserMessageSource === "clarification-submit" &&
			!clarificationSubmission;

		if (
			translationRequestState.isTranslationRequest ||
			isTranslationClarificationTurn
		) {
			stageTrace.mark("pre_route_branch_entered", {
				branch: "translation",
				needsClarification: translationRequestState.needsClarification,
			});
			if (translationRequestState.needsClarification && !isTranslationSkipTurn) {
				const translationQuestionCardPayload = sanitizeQuestionCardPayload(
					buildTranslationClarificationPayload({
						sourceText: translationRequestState.sourceText,
						targetLanguage: translationRequestState.targetLanguage,
						sessionId: clarificationSubmission?.sessionId,
						round: clarificationSubmission?.round || 1,
					}),
					{
						widgetType: CLARIFICATION_WIDGET_TYPE,
						maxRounds: CLARIFICATION_MAX_ROUNDS,
						maxPresetOptions: CLARIFICATION_MAX_PRESET_OPTIONS,
						customOptionPlaceholder: CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER,
						maxLabelLength: CLARIFICATION_MAX_LABEL_LENGTH,
						createSessionId: createTranslationClarificationSessionId,
					}
				);

					if (translationQuestionCardPayload) {
						streamQuestionCardWidget({
							res,
							payload: translationQuestionCardPayload,
							introText:
								"I need three details before translating: the text, target language, and GCP project ID.",
						});
						return;
					}
				}

			if (
				!translationRequestState.sourceText ||
				!translationRequestState.targetLanguage
			) {
				const stream = createUIMessageStream({
					execute: async ({ writer }) => {
						const textId = `translation-unresolved-${Date.now()}`;
						writer.write({ type: "text-start", id: textId });
						writer.write({
							type: "text-delta",
							id: textId,
							delta:
								"I still need the exact text, target language, and GCP project ID before I can translate.",
						});
						writer.write({ type: "text-end", id: textId });
						writer.write({
							type: "data-turn-complete",
							data: { timestamp: new Date().toISOString() },
						});
					},
					onError: (error) =>
						error instanceof Error
							? error.message
							: "Failed to resolve translation clarification",
				});
				pipeUIMessageStreamToResponse({ response: res, stream });
				return;
			}

			const translationProject = getNonEmptyString(translationRequestState.project);
			if (!translationProject) {
				const stream = createUIMessageStream({
					execute: async ({ writer }) => {
						const textId = `translation-project-missing-${Date.now()}`;
						writer.write({ type: "text-start", id: textId });
						writer.write({
							type: "text-delta",
							id: textId,
							delta:
								"Translation requires a valid GCP project ID before I can run the Google Translate tool.",
						});
						writer.write({ type: "text-end", id: textId });
						writer.write(createRouteDecisionPart({
							intent: "chat",
							origin: requestOrigin,
							reason: "intent_translation_missing_project",
						}));
						writer.write({
							type: "data-turn-complete",
							data: { timestamp: new Date().toISOString() },
						});
					},
					onError: (error) =>
						error instanceof Error
							? error.message
							: "Missing translation project configuration",
				});
				pipeUIMessageStreamToResponse({ response: res, stream });
				return;
			}

			const stream = createUIMessageStream({
				execute: async ({ writer }) => {
					const writeAssistantText = (text) => {
						const normalizedText = getNonEmptyString(text);
						if (!normalizedText) {
							return;
						}

						const textId = `translation-text-${Date.now()}`;
						writer.write({ type: "text-start", id: textId });
						writer.write({
							type: "text-delta",
							id: textId,
							delta: normalizedText,
						});
						writer.write({ type: "text-end", id: textId });
					};

					const runTranslationAttempt = async () => {
						const executionPrompt = createTranslationToolExecutionPrompt({
							sourceText: translationRequestState.sourceText,
							targetLanguage: translationRequestState.targetLanguage,
							project: translationProject,
						});
						if (!executionPrompt) {
							throw new Error("Missing translation input details.");
						}

						let assistantText = "";
						let sawRequiredToolCall = false;
						let sawRequiredToolProjectArg = false;
						let sawRequiredToolResult = false;
						let requiredToolResultRaw = null;
						let requiredToolResultPreview = null;
						let requiredToolErrorText = null;

						await streamViaRovoDev({
							message: executionPrompt,
							onTextDelta: (delta) => {
								if (typeof delta === "string" && delta.length > 0) {
									assistantText += delta;
								}
							},
							onToolCallStart: (toolCall) => {
								if (isRequiredGoogleTranslateToolCall(toolCall)) {
									sawRequiredToolCall = true;
									if (hasRequiredGoogleTranslateProjectArg(toolCall?.toolInput)) {
										sawRequiredToolProjectArg = true;
									}
								}
							},
							onToolCallInputResolved: (toolCall) => {
								if (!isRequiredGoogleTranslateToolCall(toolCall)) {
									return;
								}

								sawRequiredToolCall = true;
								if (hasRequiredGoogleTranslateProjectArg(toolCall?.toolInput)) {
									sawRequiredToolProjectArg = true;
								}
							},
							onToolCallResult: (toolCallResult) => {
								if (!isRequiredGoogleTranslateToolCall(toolCallResult)) {
									return;
								}

								sawRequiredToolCall = true;
								sawRequiredToolResult = true;
								requiredToolResultRaw =
									toolCallResult?.toolOutputRaw ?? null;
								requiredToolResultPreview =
									getNonEmptyString(toolCallResult?.toolOutputPreview) ||
									null;
							},
							onThinkingEvent: (thinkingEvent) => {
								if (!thinkingEvent || typeof thinkingEvent !== "object") {
									return;
								}

								const phase = getNonEmptyString(thinkingEvent.phase)?.toLowerCase();
								if (phase !== "error") {
									return;
								}

								if (
									!isRequiredGoogleTranslateToolCall({
										toolName: thinkingEvent.toolName,
									})
								) {
									return;
								}

								requiredToolErrorText =
									getNonEmptyString(thinkingEvent.errorText) ||
									getNonEmptyString(thinkingEvent.outputPreview) ||
									getNonEmptyString(thinkingEvent.output) ||
									requiredToolErrorText;
							},
							conflictPolicy: "wait-for-turn",
							timeoutMs: WAIT_FOR_TURN_TIMEOUT_MS,
						});

						return {
							assistantText: getNonEmptyString(assistantText) || "",
							sawRequiredToolCall,
							sawRequiredToolProjectArg,
							sawRequiredToolResult,
							requiredToolResultRaw,
							requiredToolResultPreview,
							requiredToolErrorText,
						};
					};

					writer.write({
						type: "data-thinking-status",
						data: {
							label: "Translating text",
							activity: "results",
							source: "backend",
						},
					});

					const translationAttempt = await runTranslationAttempt();

					let translationPayload = parseTranslationModelOutput(
						translationAttempt.assistantText,
						{
							sourceText: translationRequestState.sourceText,
							targetLanguage: translationRequestState.targetLanguage,
						}
					);
					if (
						!translationPayload &&
						translationAttempt.requiredToolResultRaw !== null &&
						translationAttempt.requiredToolResultRaw !== undefined
					) {
						translationPayload = parseTranslationToolResult(
							translationAttempt.requiredToolResultRaw,
							{
								sourceText: translationRequestState.sourceText,
								targetLanguage: translationRequestState.targetLanguage,
							}
						);
					}
					if (
						!translationPayload &&
						translationAttempt.requiredToolResultPreview
					) {
						translationPayload = parseTranslationToolResult(
							translationAttempt.requiredToolResultPreview,
							{
								sourceText: translationRequestState.sourceText,
								targetLanguage: translationRequestState.targetLanguage,
							}
						);
					}

						if (!translationPayload) {
							let failureText =
								"I couldn't complete the translation using the Google Translate tool.";
							const toolErrorPreview = toPreview(
								translationAttempt.requiredToolErrorText || ""
							).text;
							if (!translationAttempt.sawRequiredToolCall) {
								failureText =
									"I couldn't verify a Google Translate tool call for this request. Please try again.";
							} else if (!translationAttempt.sawRequiredToolProjectArg) {
								failureText =
									"The Google Translate tool call did not include required `project` input.";
							} else if (
								/\bproject\b/i.test(
									toolErrorPreview ||
										translationAttempt.assistantText ||
										""
								)
							) {
								failureText = `Google Translate tool reported a project-related error for \`${translationProject}\`.`;
							} else if (toolErrorPreview) {
								failureText = `Google Translate tool failed: ${toolErrorPreview}`;
							}

						writeAssistantText(failureText);
						writer.write(createRouteDecisionPart({
							intent: "chat",
							origin: requestOrigin,
							reason: "intent_translation_tool_failed",
						}));
						writer.write({
							type: "data-turn-complete",
							data: { timestamp: new Date().toISOString() },
						});
						return;
					}

					const summaryText = buildTranslationTextSummary(translationPayload);
					const translationSpec = buildTranslationGenuiSpec(translationPayload);
					if (translationSpec) {
						const widgetId = `widget-translation-${Date.now()}`;
						writer.write({
							type: "data-widget-loading",
							id: widgetId,
							data: { type: SMART_WIDGET_TYPE_GENUI, loading: true },
						});
						writer.write({
							type: "data-widget-data",
							id: widgetId,
							data: {
								type: SMART_WIDGET_TYPE_GENUI,
								payload: {
									spec: translationSpec,
									summary: summaryText,
									source: "translation-tool",
								},
							},
						});
						writer.write({
							type: "data-widget-loading",
							id: widgetId,
							data: { type: SMART_WIDGET_TYPE_GENUI, loading: false },
						});
					}

					writeAssistantText(summaryText);
					writer.write(createRouteDecisionPart({
						intent: translationSpec ? "genui" : "chat",
						origin: requestOrigin,
						reason: "intent_translation_tool_success",
					}));
					writer.write({
						type: "data-turn-complete",
						data: { timestamp: new Date().toISOString() },
					});
				},
				onError: (error) =>
					error instanceof Error
						? error.message
						: "Failed to complete translation request",
			});

			pipeUIMessageStreamToResponse({ response: res, stream });
			return;
		}

		if (
			clarificationSubmission &&
			isAudioContextClarificationSession(clarificationSubmission.sessionId)
		) {
			const latestVisiblePromptText =
				getNonEmptyString(latestVisibleUserMessage?.text) || latestUserMessage;
			const clarifiedAudioSelection = resolveAudioContextVoiceInputFromClarification({
				clarificationSubmission,
				messages,
				latestVisibleUserMessage: latestVisiblePromptText,
				maxChars: SMART_VOICE_INPUT_MAX_CHARS,
			});

			if (!clarifiedAudioSelection.voiceInput) {
				const unresolvedAudioSelection = resolveSmartAudioVoiceInput({
					intent: "audio",
					latestUserMessage: latestVisiblePromptText,
					latestVisibleUserMessage: latestVisiblePromptText,
					messages,
					generatedNarrative: null,
					maxChars: SMART_VOICE_INPUT_MAX_CHARS,
				});
				if (
					unresolvedAudioSelection.needsClarification &&
					unresolvedAudioSelection.clarificationPayload
				) {
					streamQuestionCardWidget({
						res,
						payload: unresolvedAudioSelection.clarificationPayload,
						introText: "I still need one quick choice before generating audio.",
					});
					return;
				}

				const stream = createUIMessageStream({
					execute: async ({ writer }) => {
						const textId = `audio-clarification-unresolved-${Date.now()}`;
						writer.write({ type: "text-start", id: textId });
						writer.write({
							type: "text-delta",
							id: textId,
							delta:
								"I couldn't determine which text to read aloud. Please paste the exact script.",
						});
						writer.write({ type: "text-end", id: textId });
						writer.write({
							type: "data-turn-complete",
							data: { timestamp: new Date().toISOString() },
						});
					},
					onError: (error) =>
						error instanceof Error
							? error.message
							: "Failed to resolve audio clarification answer",
				});

				pipeUIMessageStreamToResponse({ response: res, stream });
				return;
			}

			const stream = createUIMessageStream({
				execute: async ({ writer }) => {
					const audioWidgetId = `widget-audio-clarification-${Date.now()}`;
					const textId = `text-audio-clarification-${Date.now()}`;
					writer.write({
						type: "data-thinking-status",
						data: {
							label: "Generating audio",
							activity: "audio",
							source: "backend",
						},
					});
					writer.write({
						type: "data-widget-loading",
						id: audioWidgetId,
						data: { type: SMART_WIDGET_TYPE_AUDIO, loading: true },
					});

					try {
						const synthesisResult = await synthesizeSound({
							input: clarifiedAudioSelection.voiceInput,
							provider: "google",
							model: "tts-latest",
							responseFormat: "mp3",
						});

						writer.write({
							type: "data-widget-data",
							id: audioWidgetId,
							data: {
								type: SMART_WIDGET_TYPE_AUDIO,
								payload: {
									audioUrl: buildAudioDataUrl(
										synthesisResult.audioBytes,
										synthesisResult.contentType
									),
									mimeType: synthesisResult.contentType,
									transcript: stripConversationalFiller(clarifiedAudioSelection.voiceInput),
									source: "audio-context-clarification",
									inputSource: clarifiedAudioSelection.source || undefined,
								},
							},
						});
						writer.write({ type: "text-start", id: textId });
						writer.write({
							type: "text-delta",
							id: textId,
							delta: clarifiedAudioSelection.voiceInput,
						});
						writer.write({ type: "text-end", id: textId });
					} catch (audioError) {
						console.error("[AUDIO-CONTEXT] Audio synthesis failed:", audioError);
						writer.write({
							type: "data-widget-error",
							id: audioWidgetId,
							data: {
								type: SMART_WIDGET_TYPE_AUDIO,
								message: audioError instanceof Error
									? audioError.message
									: "Audio generation failed.",
								canRetry: true,
							},
						});
						writer.write({ type: "text-start", id: textId });
						writer.write({
							type: "text-delta",
							id: textId,
							delta: "I couldn't generate audio right now.",
						});
						writer.write({ type: "text-end", id: textId });
					} finally {
						writer.write({
							type: "data-widget-loading",
							id: audioWidgetId,
							data: { type: SMART_WIDGET_TYPE_AUDIO, loading: false },
						});
					}

					writer.write(createRouteDecisionPart({
						intent: "chat",
						origin: requestOrigin,
						reason: "intent_media_audio",
					}));

					writer.write({
						type: "data-turn-complete",
						data: { timestamp: new Date().toISOString() },
					});
				},
				onError: (error) => {
					if (error instanceof Error) {
						return error.message;
					}
					return "Failed to generate audio from clarification";
				},
			});

			pipeUIMessageStreamToResponse({ response: res, stream });
			return;
		}

		if (
			clarificationSubmission &&
			isImageContextClarificationSession(clarificationSubmission.sessionId)
		) {
			const latestVisiblePromptText =
				getNonEmptyString(latestVisibleUserMessage?.text) || latestUserMessage;
			const clarifiedImageContext = resolveImageContextFromClarification({
				clarificationSubmission,
				messages,
				latestVisibleUserMessage: latestVisiblePromptText,
				maxChars: SMART_IMAGE_PROMPT_MAX_CHARS,
			});

			if (!clarifiedImageContext.contextText) {
				const stream = createUIMessageStream({
					execute: async ({ writer }) => {
						const textId = `image-clarification-unresolved-${Date.now()}`;
						writer.write({ type: "text-start", id: textId });
						writer.write({
							type: "text-delta",
							id: textId,
							delta:
								"I couldn't determine which context to use for the image. Please describe what you'd like illustrated.",
						});
						writer.write({ type: "text-end", id: textId });
						writer.write({
							type: "data-turn-complete",
							data: { timestamp: new Date().toISOString() },
						});
					},
					onError: (error) =>
						error instanceof Error
							? error.message
							: "Failed to resolve image clarification answer",
				});

				pipeUIMessageStreamToResponse({ response: res, stream });
				return;
			}

			const { prompt: enrichedPrompt, systemInstruction: enrichedSystem } =
				buildEnrichedImagePrompt({
					userMessage: latestVisiblePromptText,
					contextText: clarifiedImageContext.contextText,
				});

			const imageGatewayConfig = resolveGoogleImageGatewayConfig({
				envVars: getEnvVars(),
				requestedModel: rawModel,
				resolveGatewayUrl,
				detectEndpointType,
			});

			if (!imageGatewayConfig.ok) {
				return res.status(imageGatewayConfig.statusCode || 500).json({
					error: imageGatewayConfig.error || "Image generation not configured",
					details: imageGatewayConfig.details,
				});
			}

			const stream = createUIMessageStream({
				execute: async ({ writer }) => {
					const imageWidgetId = `widget-image-clarification-${Date.now()}`;
					const generatedImages = [];

					writer.write({
						type: "data-thinking-status",
						data: {
							label: "Generating image",
							activity: "image",
							source: "backend",
						},
					});
					writer.write({
						type: "data-widget-loading",
						id: imageWidgetId,
						data: { type: SMART_WIDGET_TYPE_IMAGE, loading: true },
					});

					try {
						const streamGoogleImage = async (withModalities) => {
							await streamGoogleGatewayManualSse({
								gatewayUrl: imageGatewayConfig.gatewayUrl,
								envVars: imageGatewayConfig.envVars,
								model: imageGatewayConfig.model,
								system: enrichedSystem || undefined,
								prompt: enrichedPrompt || latestVisiblePromptText,
								maxOutputTokens: 1800,
								temperature: 1,
								responseModalities: withModalities ? ["image"] : undefined,
								onFile: ({ mediaType, base64 }) => {
									if (typeof base64 !== "string" || base64.length === 0) {
										return;
									}
									const resolvedMediaType =
										typeof mediaType === "string" && mediaType.trim()
											? mediaType
											: "image/png";
									if (!resolvedMediaType.startsWith("image/")) {
										return;
									}
									generatedImages.push({
										url: `data:${resolvedMediaType};base64,${base64}`,
										mimeType: resolvedMediaType,
									});
									writer.write({
										type: "data-widget-data",
										id: imageWidgetId,
										data: {
											type: SMART_WIDGET_TYPE_IMAGE,
											payload: {
												images: [...generatedImages],
												prompt: latestUserMessage,
												source: "image-context-clarification",
												inputSource: clarifiedImageContext.source || undefined,
											},
										},
									});
								},
							});
						};

						try {
							await streamGoogleImage(true);
						} catch (modalitiesError) {
							if (!isUnsupportedModalitiesError(modalitiesError)) {
								throw modalitiesError;
							}
							await streamGoogleImage(false);
						}

						if (generatedImages.length === 0) {
							writer.write({
								type: "data-widget-error",
								id: imageWidgetId,
								data: {
									type: SMART_WIDGET_TYPE_IMAGE,
									message: "I couldn't generate an image for this request.",
									canRetry: true,
								},
							});
						}
					} catch (imageError) {
						console.error("[IMAGE-CONTEXT] Image generation failed:", imageError);
						writer.write({
							type: "data-widget-error",
							id: imageWidgetId,
							data: {
								type: SMART_WIDGET_TYPE_IMAGE,
								message: imageError instanceof Error
									? imageError.message
									: "Image generation failed.",
								canRetry: true,
							},
						});
					} finally {
						writer.write({
							type: "data-widget-loading",
							id: imageWidgetId,
							data: { type: SMART_WIDGET_TYPE_IMAGE, loading: false },
						});
					}

					writer.write(createRouteDecisionPart({
						intent: "chat",
						origin: requestOrigin,
						reason: "intent_media_image_clarification",
					}));

					writer.write({
						type: "data-turn-complete",
						data: { timestamp: new Date().toISOString() },
					});
				},
				onError: (error) => {
					if (error instanceof Error) {
						return error.message;
					}
					return "Failed to generate image from clarification";
				},
			});

			pipeUIMessageStreamToResponse({ response: res, stream });
			return;
		}

		const toolFirstPolicy = resolveToolFirstPolicy({
			prompt: latestUserMessage,
		});
		const toolFirstRelevanceDomains =
			Array.isArray(toolFirstPolicy.relevanceDomains) &&
			toolFirstPolicy.relevanceDomains.length > 0
				? toolFirstPolicy.relevanceDomains
				: toolFirstPolicy.domains;
		if (toolFirstPolicy.matched) {
			console.info("[TOOL-FIRST] Matched tool-first domains", {
				domains: toolFirstPolicy.domains,
				relevanceDomains: toolFirstRelevanceDomains,
				domainLabels: toolFirstPolicy.domainLabels,
			});
		}
		const isWorkSummary = isWorkSummaryTurn(toolFirstPolicy);
		const workSummaryStartMs = isWorkSummary ? Date.now() : null;
		const promptIntent = classifyPromptIntent(latestUserMessage);
		const inferredPromptIntent = promptIntent.inferredIntent;
		const mediaPreClassification = promptIntent.mediaPreClassification;
		const { isStrictToolFirstTurn: baseStrictToolFirstTurn } = resolveToolFirstRoutingFlags({
			toolFirstMatched: toolFirstPolicy.matched,
			inferredPromptIntent,
			preClassifiedIntent: mediaPreClassification.intent,
		});
		const isStrictToolFirstTurn =
			baseStrictToolFirstTurn && !resolvedPlanModeActive;

		let toolFirstClarificationInstruction = null;
		if (isStrictToolFirstTurn && !clarificationSubmission) {
			const { shouldGate, unsatisfiedHints } = shouldGateToolFirstQuestionCard({
				prompt: latestUserMessage,
				toolFirstPolicy,
				latestUserMessageSource,
				gateSkipSources: TOOL_FIRST_GATE_SKIP_SOURCES,
			});
			if (shouldGate) {
				toolFirstClarificationInstruction =
					buildToolFirstClarificationInstruction({
						unsatisfiedHints,
						domainLabels: toolFirstPolicy.domainLabels,
					});
			}
		}

		let enrichedContextDescription = contextDescription;

		if (
			clarificationSubmission &&
			!hasPausedClarificationToolCall &&
			!rawDeferredToolResponse
		) {
			const serialized = JSON.stringify(
				adaptClarificationAnswersForToolContract(
					clarificationSubmission.sessionId,
					clarificationSubmission.answers
				)
			);
			const answerBlock = `[ask_user_questions Result]\nThe user answered your ask_user_questions tool call. Here are their answers:\n${serialized}\n[End ask_user_questions Result]`;
			enrichedContextDescription = enrichedContextDescription
				? `${enrichedContextDescription}\n\n${answerBlock}`
				: answerBlock;
		}

		if (
			rawDeferredToolResponse &&
			typeof rawDeferredToolResponse === "object" &&
			!clarificationSubmission
		) {
			const toolCallId = getNonEmptyString(rawDeferredToolResponse.tool_call_id);
			const result = rawDeferredToolResponse.result;
			if (toolCallId && result && typeof result === "object") {
				const deferredSessionId = `request-user-input-${toolCallId}`;
				const adaptedResult = adaptClarificationAnswersForToolContract(
					deferredSessionId,
					result
				);
				const serialized = JSON.stringify(adaptedResult);
				const answerBlock = `[ask_user_questions Result]\nThe user answered your ask_user_questions tool call. Here are their answers:\n${serialized}\n[End ask_user_questions Result]`;
				enrichedContextDescription = enrichedContextDescription
					? `${enrichedContextDescription}\n\n${answerBlock}`
					: answerBlock;

				console.info("[CHAT-SDK] Normalized legacy deferred tool response into clarification context", {
					toolCallId,
					resultKeys: Object.keys(adaptedResult),
				});
			}
		}

		if (approvalSubmission && !hasPausedApprovalToolCall) {
			const serialized = JSON.stringify({
				decision: approvalSubmission.decision,
				customInstruction: approvalSubmission.customInstruction,
				toolCallId:
					getNonEmptyString(rawApproval?.toolCallId) ||
					getNonEmptyString(rawApproval?.deferredToolCallId) ||
					undefined,
			});
			enrichedContextDescription = enrichedContextDescription
				? `${enrichedContextDescription}\n\nPlan approval: ${serialized}`
				: `Plan approval: ${serialized}`;
		}

		const pausedContinuationToolCallId = hasPausedClarificationToolCall
			? clarificationToolCallId
			: hasPausedApprovalToolCall
				? approvalToolCallId
				: null;

		const googleCalendarDateContext = isStrictToolFirstTurn
			&& Array.isArray(toolFirstPolicy.domains)
			&& toolFirstPolicy.domains.includes("google-calendar")
				? buildGoogleCalendarDateContext(clientTimeZone)
				: null;
		const toolFirstPromptInstruction = isStrictToolFirstTurn
			? [
				toolFirstPolicy.instruction,
				toolFirstClarificationInstruction,
				googleCalendarDateContext,
			]
				.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
				.join("\n\n")
			: null;
		const effectiveContextDescription = isStrictToolFirstTurn
			? enrichedContextDescription
				? [
					enrichedContextDescription,
					toolFirstPromptInstruction,
				]
					.filter((entry) => typeof entry === "string" && entry.trim().length > 0)
					.join("\n\n")
				: toolFirstPromptInstruction
			: enrichedContextDescription;
			const effectiveContextWithPortBinding = effectiveContextDescription;
			const smartGeneration = normalizeSmartGenerationOptions(rawSmartGeneration);
			const smartLayoutContext = {
				surface: smartGeneration.surface,
				containerWidthPx: smartGeneration.containerWidthPx,
				viewportWidthPx: smartGeneration.viewportWidthPx,
				widthClass: smartGeneration.widthClass,
			};
			const smartGenerationActive = isSmartGenerationEnabled(smartGeneration);
			const promptProfile =
				promptIntent.isConversational &&
				!isStrictToolFirstTurn &&
				!smartGenerationActive &&
				!clarificationSubmission &&
				!approvalSubmission
					? "plain-chat"
					: "default";

			const promptBuildStartedAtMs = Date.now();
			const userMessageText = buildUserMessage(
				latestUserMessage,
				conversationHistory,
				effectiveContextWithPortBinding,
				{
					profile: promptProfile,
				}
			);
			stageTrace.mark("prompt_built", {
				stageMs: Date.now() - promptBuildStartedAtMs,
				promptProfile,
				promptChars: userMessageText.length,
				promptBytes: getUtf8ByteLength(userMessageText),
				conversationHistoryCount: conversationHistory.length,
				contextChars: effectiveContextWithPortBinding?.length ?? 0,
			});
			const isTaskLikeRequest = promptIntent.isTaskLike;
			const prefersGenuiCardExperience =
				promptIntent.prefersGenuiCardExperience;
			const isCreateIntentRequestPrompt =
				promptIntent.isCreateIntentRequest;
			const forceSmartAudioRoute =
				!smartGenerationActive && inferredPromptIntent === "audio";
			const smartRoutingActive = smartGenerationActive || forceSmartAudioRoute;
			if (smartGeneration.enabled || smartGeneration.surface) {
				console.info("[SMART-GENERATION] Route gating", {
					enabled: smartGeneration.enabled,
					surface: smartGeneration.surface,
					active: smartGenerationActive,
					forcedAudioRoute: forceSmartAudioRoute,
					containerWidthPx: smartGeneration.containerWidthPx,
					viewportWidthPx: smartGeneration.viewportWidthPx,
					widthClass: smartGeneration.widthClass,
					allowedSurfaces: Array.from(SMART_ROUTE_TARGET_SURFACES),
				});
			}
			if (forceSmartAudioRoute) {
				console.info("[SMART-GENERATION] Forcing smart audio route for explicit audio request");
			}
				let smartIntentResult = null;
				if (smartRoutingActive && !isStrictToolFirstTurn) {
					// Honor Layer 1 routing decision for genui via genuiHint.
					// Image/audio detection is handled by RovoDev via genui-media skill
					// and backend fence interception — no pre-classification needed.
					if (genuiHint) {
						smartIntentResult = {
							intent: "genui",
							confidence: 1,
							reason: "layer1-genui-hint",
							rawOutput: null,
							error: null,
							timedOut: false,
						};
						console.info("[SMART-GENERATION] GenUI intent from Layer 1 routing hint");
					}
				}

				if (smartRoutingActive && !isStrictToolFirstTurn) {
					const vagueVisualization = isVagueVisualizationRequest(latestUserMessage);

					const smartClarificationClassifierPrompt =
						smartIntentResult && smartIntentResult.intent !== "normal"
							? buildSmartClarificationClassifierPrompt({
									latestUserMessage,
									conversationHistory,
									smartIntentHint: smartIntentResult.intent,
									layoutContext: smartLayoutContext,
								})
							: buildSmartClarificationClassifierPrompt({
									latestUserMessage,
									conversationHistory,
									smartIntentHint: "normal",
									layoutContext: smartLayoutContext,
								});

					let smartClarificationDecision = null;
					if (vagueVisualization && smartIntentResult && (smartIntentResult.intent === "genui" || smartIntentResult.intent === "both")) {
						// Heuristic fast-path: skip the LLM classifier entirely for vague
						// visualization requests to avoid port contention hangs.
						smartClarificationDecision = {
							needsClarification: true,
							confidence: 1,
							reason: "heuristic-vague-visualization",
						};
						console.info("[SMART-CLARIFICATION] Heuristic fast-path: vague visualization request");
					} else if (smartIntentResult?.timedOut) {
						console.info(
							"[SMART-CLARIFICATION] Skipping classifier after smart-intent timeout"
						);
					} else {
						try {
							const classifierText = await generateTextViaGateway({
								system: "You output strict JSON indicating if clarification is needed.",
								prompt: smartClarificationClassifierPrompt,
								maxOutputTokens: 120,
								temperature: 0,
								backendPreference: "ai-gateway",
								...buildSmartGenerationGatewayOptions({
									provider,
								}),
							});
							smartClarificationDecision = parseSmartClarificationClassifierOutput(
								classifierText
							);
						} catch (error) {
							console.warn(
								"[SMART-CLARIFICATION] Classifier failed; continuing without smart gate",
								error instanceof Error ? error.message : error
							);
						}
					}

					const shouldGateClarification = shouldGateSmartClarification({
						latestUserMessage,
						latestUserMessageSource,
						smartGenerationActive: smartRoutingActive,
						smartIntentResult,
						classifierResult: smartClarificationDecision,
					});

					if (shouldGateClarification) {
						const clarificationAbort = new AbortController();
						const clarificationTimeout = setTimeout(() => clarificationAbort.abort(), 15_000);
						try {
							const questionCardPayload = await generateClarificationQuestionCard({
								latestUserMessage: latestVisibleUserMessage?.text || latestUserMessage,
								conversationHistory,
								previousQuestionCard: null,
								submission: null,
								round: 1,
								maxRounds: CLARIFICATION_MAX_ROUNDS,
								sessionId: buildSmartClarificationSessionId({
									planRequestId,
									surface: smartGeneration.surface,
								}),
								intentHint: vagueVisualization ? "visualization" : undefined,
								gatewayOptions: {
									backendPreference: "ai-gateway",
									...buildSmartGenerationGatewayOptions({
										provider,
									}),
									signal: clarificationAbort.signal,
								},
							});

							if (questionCardPayload) {
								streamQuestionCardWidget({
									res,
									payload: questionCardPayload,
									introText:
										"A couple quick questions so I can generate the right output.",
								});
								return;
							}
						} finally {
							clearTimeout(clarificationTimeout);
						}
					}
				}

			if (
				smartRoutingActive &&
				!isStrictToolFirstTurn &&
				smartIntentResult &&
				smartIntentResult.intent !== "normal"
			) {
				console.info("[SMART-GENERATION] Executing smart route", {
					intent: smartIntentResult.intent,
					forcedAudioRoute: forceSmartAudioRoute,
					surface: smartGeneration.surface,
				});
				const roleMessages = mapUiMessagesToRoleContent(messages);
				const smartRouteAbortController = new AbortController();
				req.on("close", () => {
					if (!smartRouteAbortController.signal.aborted) {
						console.log("[SMART-GENERATION] Client disconnected, aborting smart route");
						smartRouteAbortController.abort();
					}
				});

				const isSmartRouteAbortError = (error) => {
					if (!error || typeof error !== "object") {
						return false;
					}
					return error.name === "AbortError" || error.code === "ABORT_ERR";
				};

				const throwIfSmartRouteAborted = () => {
					if (!smartRouteAbortController.signal.aborted) {
						return;
					}

					const abortError = new Error("Smart generation request aborted");
					abortError.name = "AbortError";
					abortError.code = "ABORT_ERR";
					throw abortError;
				};

				const stream = createUIMessageStream({
					execute: async ({ writer }) => {
						const textId = `text-${Date.now()}`;
						const imageWidgetId = `widget-image-${Date.now()}`;
						const genuiWidgetId = `widget-genui-${Date.now()}`;
						const audioWidgetId = `widget-audio-${Date.now()}`;
						let textStarted = false;
						let generatedNarrative = null;
						let emittedAudioClarificationCard = false;
						let emittedImageClarificationCard = false;
						const sanitizeThinkingLabel = (value) => {
							if (typeof value !== "string") {
								return "";
							}
							return value.replace(/(?:\s*(?:\.{3}|…))+$/u, "").trim();
						};

						const emitTextDelta = (delta) => {
							if (typeof delta !== "string" || delta.length === 0) {
								return;
							}

							if (!textStarted) {
								writer.write({ type: "text-start", id: textId });
								textStarted = true;
							}

							writer.write({ type: "text-delta", id: textId, delta });
						};

						const emitWidgetLoading = (id, type, loading) => {
							writer.write({
								type: "data-widget-loading",
								id,
								data: { type, loading },
							});
						};

						const emitWidgetData = (id, type, payload) => {
							writer.write({
								type: "data-widget-data",
								id,
								data: { type, payload },
							});
						};

						const emitWidgetError = (id, type, message) => {
							writer.write({
								type: "data-widget-error",
								id,
								data: {
									type,
									message,
									canRetry: true,
								},
							});
						};

						const emitThinkingStatus = (label, content) => {
							const normalizedLabel = sanitizeThinkingLabel(label);
							if (!normalizedLabel) {
								return;
							}

							const rawContent =
								typeof content === "string" ? content.trim() : "";
							writer.write({
								type: "data-thinking-status",
								data: {
									label: normalizedLabel,
									content: rawContent.length > 0 ? rawContent : undefined,
								},
							});
						};

						throwIfSmartRouteAborted();
						emitThinkingStatus(
							"Classifying request",
							`Detected intent: ${smartIntentResult.intent}`
						);
						emitThinkingStatus("Preparing generation");

						if (smartIntentResult.intent === "image") {
							const {
								imagePrompt: smartImagePrompt,
								systemInstruction: smartImageSystem,
								source: smartImageSource,
								resolutionType: smartImageResolutionType,
								needsClarification: needsImageClarification,
								clarificationPayload: imageClarificationPayload,
								confidence: smartImageConfidence,
								candidateCount: smartImageCandidateCount,
							} = resolveSmartImagePrompt({
								latestUserMessage,
								latestVisibleUserMessage: latestVisibleUserMessage?.text || latestUserMessage,
								messages,
								maxChars: SMART_IMAGE_PROMPT_MAX_CHARS,
							});

							console.info("[SMART-GENERATION] Selected image input source", {
								intent: smartIntentResult.intent,
								source: smartImageSource || null,
								resolutionType: smartImageResolutionType || null,
								confidence:
									typeof smartImageConfidence === "number"
										? smartImageConfidence
										: null,
								candidateCount:
									typeof smartImageCandidateCount === "number"
										? smartImageCandidateCount
										: null,
								hasSystemInstruction: Boolean(smartImageSystem),
							});

							if (needsImageClarification) {
								if (imageClarificationPayload) {
									const clarificationWidgetId = `widget-image-clarification-${Date.now()}`;
									emitThinkingStatus("Need clarification");
									emitWidgetLoading(
										clarificationWidgetId,
										CLARIFICATION_WIDGET_TYPE,
										true
									);
									emitWidgetData(
										clarificationWidgetId,
										CLARIFICATION_WIDGET_TYPE,
										imageClarificationPayload
									);
									emitWidgetLoading(
										clarificationWidgetId,
										CLARIFICATION_WIDGET_TYPE,
										false
									);
									writer.write(createRouteDecisionPart({
										intent: "chat",
										origin: requestOrigin,
										reason: "intent_clarification",
									}));
									emittedImageClarificationCard = true;
									emitTextDelta(
										"I need one quick detail before generating the image."
									);
								} else {
									emitTextDelta(
										"I need a bit more detail about what to illustrate."
									);
								}
							} else {
								emitThinkingStatus("Generating image");
							emitWidgetLoading(imageWidgetId, SMART_WIDGET_TYPE_IMAGE, true);
							const generatedImages = [];
							let attemptedImageGeneration = false;
							const imageGatewayConfig = resolveGoogleImageGatewayConfig({
								envVars: getEnvVars(),
								requestedModel: rawModel,
								resolveGatewayUrl,
								detectEndpointType,
							});
							try {
								throwIfSmartRouteAborted();
								if (!imageGatewayConfig.ok) {
									emitWidgetError(
										imageWidgetId,
										SMART_WIDGET_TYPE_IMAGE,
										toImageWidgetErrorMessage(imageGatewayConfig)
											|| "I couldn't generate an image because Google image routing is not configured."
									);
								} else {
									attemptedImageGeneration = true;
									const streamGoogleImage = async (withModalities) => {
										throwIfSmartRouteAborted();
										await streamGoogleGatewayManualSse({
											gatewayUrl: imageGatewayConfig.gatewayUrl,
											envVars: imageGatewayConfig.envVars,
											model: imageGatewayConfig.model,
											system: smartImageSystem || undefined,
											prompt: smartImagePrompt || userMessageText,
											maxOutputTokens: 1800,
											temperature: 1,
											responseModalities: withModalities ? ["image"] : undefined,
											signal: smartRouteAbortController.signal,
											onFile: ({ mediaType, base64 }) => {
												if (smartRouteAbortController.signal.aborted) {
													return;
												}
												if (typeof base64 !== "string" || base64.length === 0) {
													return;
												}
												const resolvedMediaType =
													typeof mediaType === "string" && mediaType.trim()
														? mediaType
														: "image/png";
												if (!resolvedMediaType.startsWith("image/")) {
													return;
												}

												generatedImages.push({
													url: `data:${resolvedMediaType};base64,${base64}`,
													mimeType: resolvedMediaType,
												});
												emitWidgetData(imageWidgetId, SMART_WIDGET_TYPE_IMAGE, {
													images: [...generatedImages],
													prompt: latestUserMessage,
													source: "chat-sdk-google-image",
													inputSource: smartImageSource || undefined,
												});
											},
										});
										throwIfSmartRouteAborted();
									};

									try {
										await streamGoogleImage(true);
									} catch (modalitiesError) {
										if (!isUnsupportedModalitiesError(modalitiesError)) {
											throw modalitiesError;
										}
										console.warn(
											"[SMART-GENERATION] Google endpoint rejected modalities payload; retrying image request without modalities."
										);
										await streamGoogleImage(false);
									}
								}

								if (
									attemptedImageGeneration &&
									generatedImages.length === 0 &&
									!smartRouteAbortController.signal.aborted
								) {
									emitWidgetError(
										imageWidgetId,
										SMART_WIDGET_TYPE_IMAGE,
										"I couldn't generate an image for this request. The model returned no image data."
									);
								}
							} catch (imageError) {
								if (isSmartRouteAbortError(imageError)) {
									return;
								}
								console.error("[SMART-GENERATION] Image generation failed:", imageError);
								const errorMessage =
									imageError instanceof Error &&
									typeof imageError.message === "string" &&
									imageError.message.trim().length > 0
										? imageError.message.trim()
										: "I couldn't generate an image right now. Check AI_GATEWAY_URL_GOOGLE and GOOGLE_IMAGE_MODEL, then retry.";
								emitWidgetError(
									imageWidgetId,
									SMART_WIDGET_TYPE_IMAGE,
									errorMessage
								);
							} finally {
								if (!smartRouteAbortController.signal.aborted) {
									emitWidgetLoading(imageWidgetId, SMART_WIDGET_TYPE_IMAGE, false);
								}
							}
							}
						}

						if (
							smartIntentResult.intent === "genui" ||
							smartIntentResult.intent === "both"
						) {
							emitThinkingStatus("Generating results");
							emitWidgetLoading(genuiWidgetId, SMART_WIDGET_TYPE_GENUI, true);
							try {
								throwIfSmartRouteAborted();
								const genuiResult = await generateSmartGenuiResult({
									roleMessages,
									provider,
									layoutContext: smartLayoutContext,
									signal: smartRouteAbortController.signal,
								});
								throwIfSmartRouteAborted();
								const summaryText = getNonEmptyString(genuiResult.narrative);
								if (summaryText) {
									generatedNarrative = summaryText;
								}

								const fallbackSpec = summaryText
									? buildFallbackGenuiSpecFromText({
											text: summaryText,
											prompt: latestUserMessage,
										})
									: null;
								const resolvedSpec = genuiResult.spec || fallbackSpec;

								if (resolvedSpec) {
									const hasGeneratedSpec = Boolean(genuiResult.spec);
									emitWidgetData(genuiWidgetId, SMART_WIDGET_TYPE_GENUI, {
										spec: resolvedSpec,
										summary:
											summaryText && summaryText.length > 280
												? `${summaryText.slice(0, 279)}...`
												: summaryText || "Generated interactive preview",
										source: hasGeneratedSpec
											? "genui-chat"
											: "genui-chat-fallback",
									});
								} else {
									emitTextDelta(GENUI_FALLBACK_ERROR_TEXT);
								}
							} catch (genuiError) {
								if (isSmartRouteAbortError(genuiError)) {
									return;
								}
								console.error("[SMART-GENERATION] UI generation failed:", genuiError);
								emitTextDelta(GENUI_FALLBACK_ERROR_TEXT);
							} finally {
								if (!smartRouteAbortController.signal.aborted) {
									emitWidgetLoading(genuiWidgetId, SMART_WIDGET_TYPE_GENUI, false);
								}
							}
						}

						if (
							smartIntentResult.intent === "audio" ||
							smartIntentResult.intent === "both"
						) {
							try {
								throwIfSmartRouteAborted();
								const {
									voiceInput,
									source: voiceInputSource,
									extractionMode: voiceInputExtractionMode,
									resolutionType: voiceInputResolutionType,
									needsClarification: needsAudioClarification,
									clarificationPayload: audioClarificationPayload,
									confidence: voiceInputConfidence,
									candidateCount: voiceInputCandidateCount,
								} =
									resolveSmartAudioVoiceInput({
										intent: smartIntentResult.intent,
										latestUserMessage,
										latestVisibleUserMessage: latestVisibleUserMessage?.text || latestUserMessage,
										messages,
										generatedNarrative,
										maxChars: SMART_VOICE_INPUT_MAX_CHARS,
									});
								console.info("[SMART-GENERATION] Selected audio input source", {
									intent: smartIntentResult.intent,
									source: voiceInputSource,
									extractionMode: voiceInputExtractionMode || null,
									resolutionType: voiceInputResolutionType || null,
									confidence:
										typeof voiceInputConfidence === "number"
											? voiceInputConfidence
											: null,
									candidateCount:
										typeof voiceInputCandidateCount === "number"
											? voiceInputCandidateCount
											: null,
									forcedAudioRoute: forceSmartAudioRoute,
									hasInput: Boolean(voiceInput),
									payloadLength: typeof voiceInput === "string" ? voiceInput.length : 0,
								});

								if (needsAudioClarification) {
									if (audioClarificationPayload) {
										const clarificationWidgetId = `widget-audio-clarification-${Date.now()}`;
										emitThinkingStatus("Need clarification");
										emitWidgetLoading(
											clarificationWidgetId,
											CLARIFICATION_WIDGET_TYPE,
											true
										);
										emitWidgetData(
											clarificationWidgetId,
											CLARIFICATION_WIDGET_TYPE,
											audioClarificationPayload
										);
										emitWidgetLoading(
											clarificationWidgetId,
											CLARIFICATION_WIDGET_TYPE,
											false
										);
										emittedAudioClarificationCard = true;
										writer.write(createRouteDecisionPart({
											intent: "chat",
											origin: requestOrigin,
											reason: "intent_clarification",
										}));
										if (smartIntentResult.intent === "audio") {
											emitTextDelta(
												"I need one quick detail before generating the audio clip."
											);
										}
									} else {
										emitTextDelta(
											"I need a bit more detail about which text to read aloud."
										);
									}
								} else {
									emitThinkingStatus("Generating audio");
									emitWidgetLoading(audioWidgetId, SMART_WIDGET_TYPE_AUDIO, true);
									if (!voiceInput) {
										throw new Error("No text available for audio synthesis");
									}

									const synthesisResult = await synthesizeSound({
										input: voiceInput,
										provider: "google",
										model: "tts-latest",
										responseFormat: "mp3",
										signal: smartRouteAbortController.signal,
									});
									throwIfSmartRouteAborted();

									emitWidgetData(audioWidgetId, SMART_WIDGET_TYPE_AUDIO, {
										audioUrl: buildAudioDataUrl(
											synthesisResult.audioBytes,
											synthesisResult.contentType
										),
										mimeType: synthesisResult.contentType,
										transcript: stripConversationalFiller(voiceInput),
										source: "sound-generation",
										inputSource: voiceInputSource || undefined,
									});

									if (smartIntentResult.intent === "audio") {
										emitTextDelta(voiceInput);
									}
								}
							} catch (audioError) {
								if (isSmartRouteAbortError(audioError)) {
									return;
								}
								console.error("[SMART-GENERATION] Audio generation failed:", audioError);
								emitWidgetError(
									audioWidgetId,
									SMART_WIDGET_TYPE_AUDIO,
									"I couldn't generate voice output right now."
								);
								emitTextDelta("I couldn't generate voice output right now.");
							} finally {
								if (
									!smartRouteAbortController.signal.aborted &&
									!emittedAudioClarificationCard
								) {
									emitWidgetLoading(audioWidgetId, SMART_WIDGET_TYPE_AUDIO, false);
								}
							}
						}

						throwIfSmartRouteAborted();
						emitThinkingStatus("Finalizing response");
						const shouldEmitDefaultNarrative =
							smartIntentResult.intent !== "image" &&
							smartIntentResult.intent !== "genui" &&
							smartIntentResult.intent !== "both" &&
							!emittedAudioClarificationCard &&
							!emittedImageClarificationCard;
						if (shouldEmitDefaultNarrative && !textStarted) {
							emitTextDelta("Completed smart generation request.");
						}

						if (textStarted) {
							writer.write({ type: "text-end", id: textId });
						}

						writer.write({
							type: "data-turn-complete",
							data: { timestamp: new Date().toISOString() },
						});
					},
					onError: (error) => {
						if (isSmartRouteAbortError(error)) {
							return "Smart generation request aborted";
						}
						if (error instanceof Error) {
							return error.message;
						}
						return "Failed to stream smart generation response";
					},
				});

				pipeUIMessageStreamToResponse({
					response: res,
					stream,
				});
				return;
			}

		// ── Output Routing: Media bypass pre-classification (BE-002, BE-003) ──
		// Use lightweight regex pre-classification to detect obvious media
		// generation intents BEFORE sending to RovoDev. This avoids the
		// RovoDev round-trip for clear-cut image/audio requests.
		if (
			mediaPreClassification.intent &&
			!isStrictToolFirstTurn
		) {
			console.info("[OUTPUT-ROUTING] Media bypass detected", {
				intent: mediaPreClassification.intent,
				confidence: mediaPreClassification.confidence,
				reason: mediaPreClassification.reason,
			});

			if (mediaPreClassification.intent === "image") {
				// BE-002: Route image queries to AI Gateway (bypass RovoDev)
				const {
					imagePrompt: mediaBypassImagePrompt,
					systemInstruction: mediaBypassImageSystem,
					source: mediaBypassImageSource,
					resolutionType: mediaBypassImageResolutionType,
					needsClarification: mediaBypassNeedsImageClarification,
					clarificationPayload: mediaBypassImageClarificationPayload,
					confidence: mediaBypassImageConfidence,
					candidateCount: mediaBypassImageCandidateCount,
				} = resolveSmartImagePrompt({
					latestUserMessage,
					latestVisibleUserMessage: latestVisibleUserMessage?.text || latestUserMessage,
					messages,
					maxChars: SMART_IMAGE_PROMPT_MAX_CHARS,
				});

				if (
					mediaBypassNeedsImageClarification &&
					mediaBypassImageClarificationPayload
				) {
					streamQuestionCardWidget({
						res,
						payload: mediaBypassImageClarificationPayload,
						introText: "I need one quick choice before generating the image.",
					});
					return;
				}

				const imageGatewayConfig = resolveGoogleImageGatewayConfig({
					envVars: getEnvVars(),
					requestedModel: rawModel,
					resolveGatewayUrl,
					detectEndpointType,
				});

				if (!imageGatewayConfig.ok) {
					return res.status(imageGatewayConfig.statusCode || 500).json({
						error: imageGatewayConfig.error || "Image generation not configured",
						details: imageGatewayConfig.details,
					});
				}

				console.info("[OUTPUT-ROUTING] Selected media bypass image input", {
					source: mediaBypassImageSource || null,
					resolutionType: mediaBypassImageResolutionType || null,
					confidence:
						typeof mediaBypassImageConfidence === "number"
							? mediaBypassImageConfidence
							: null,
					candidateCount:
						typeof mediaBypassImageCandidateCount === "number"
							? mediaBypassImageCandidateCount
							: null,
					hasSystemInstruction: Boolean(mediaBypassImageSystem),
				});

				const stream = createUIMessageStream({
					execute: async ({ writer }) => {
						const imageWidgetId = `widget-image-bypass-${Date.now()}`;
						const generatedImages = [];

						writer.write({
							type: "data-thinking-status",
							data: {
								label: "Generating image",
								activity: "image",
								source: "backend",
							},
						});
						writer.write({
							type: "data-widget-loading",
							id: imageWidgetId,
							data: { type: SMART_WIDGET_TYPE_IMAGE, loading: true },
						});

						try {
							const streamGoogleImage = async (withModalities) => {
								await streamGoogleGatewayManualSse({
									gatewayUrl: imageGatewayConfig.gatewayUrl,
									envVars: imageGatewayConfig.envVars,
									model: imageGatewayConfig.model,
									system: mediaBypassImageSystem || undefined,
									prompt: mediaBypassImagePrompt || userMessageText,
									maxOutputTokens: 1800,
									temperature: 1,
									responseModalities: withModalities ? ["image"] : undefined,
									onFile: ({ mediaType, base64 }) => {
										if (typeof base64 !== "string" || base64.length === 0) {
											return;
										}
										const resolvedMediaType =
											typeof mediaType === "string" && mediaType.trim()
												? mediaType
												: "image/png";
										if (!resolvedMediaType.startsWith("image/")) {
											return;
										}
										generatedImages.push({
											url: `data:${resolvedMediaType};base64,${base64}`,
											mimeType: resolvedMediaType,
										});
										writer.write({
											type: "data-widget-data",
											id: imageWidgetId,
											data: {
												type: SMART_WIDGET_TYPE_IMAGE,
												payload: {
													images: [...generatedImages],
													prompt: latestUserMessage,
													source: "media-bypass-image",
													inputSource: mediaBypassImageSource || undefined,
												},
											},
										});
									},
								});
							};

							try {
								await streamGoogleImage(true);
							} catch (modalitiesError) {
								if (!isUnsupportedModalitiesError(modalitiesError)) {
									throw modalitiesError;
								}
								await streamGoogleImage(false);
							}

							if (generatedImages.length === 0) {
								writer.write({
									type: "data-widget-error",
									id: imageWidgetId,
									data: {
										type: SMART_WIDGET_TYPE_IMAGE,
										message: "I couldn't generate an image for this request.",
										canRetry: true,
									},
								});
							}
						} catch (imageError) {
							console.error("[OUTPUT-ROUTING] Media bypass image generation failed:", imageError);
							writer.write({
								type: "data-widget-error",
								id: imageWidgetId,
								data: {
									type: SMART_WIDGET_TYPE_IMAGE,
									message: imageError instanceof Error
										? imageError.message
										: "Image generation failed.",
									canRetry: true,
								},
							});
						} finally {
							writer.write({
								type: "data-widget-loading",
								id: imageWidgetId,
								data: { type: SMART_WIDGET_TYPE_IMAGE, loading: false },
							});
						}

						// Emit route-decision for observability
						writer.write(createRouteDecisionPart({
							intent: "chat",
							origin: requestOrigin,
							reason: "intent_media_image",
						}));

						writer.write({
							type: "data-turn-complete",
							data: { timestamp: new Date().toISOString() },
						});
					},
					onError: (error) => {
						if (error instanceof Error) {
							return error.message;
						}
						return "Failed to generate image";
					},
				});

				pipeUIMessageStreamToResponse({ response: res, stream });
				return;
			}

			if (mediaPreClassification.intent === "audio") {
				const {
					voiceInput: mediaBypassVoiceInput,
					source: mediaBypassVoiceInputSource,
					extractionMode: mediaBypassExtractionMode,
					resolutionType: mediaBypassResolutionType,
					needsClarification: mediaBypassNeedsClarification,
					clarificationPayload: mediaBypassClarificationPayload,
					confidence: mediaBypassConfidence,
					candidateCount: mediaBypassCandidateCount,
				} = resolveSmartAudioVoiceInput({
					intent: "audio",
					latestUserMessage,
					latestVisibleUserMessage: latestVisibleUserMessage?.text || latestUserMessage,
					messages,
					generatedNarrative: null,
					maxChars: SMART_VOICE_INPUT_MAX_CHARS,
				});

				if (
					mediaBypassNeedsClarification &&
					mediaBypassClarificationPayload
				) {
					streamQuestionCardWidget({
						res,
						payload: mediaBypassClarificationPayload,
						introText: "I need one quick choice before generating the audio clip.",
					});
					return;
				}

				// BE-003: Route audio queries to AI Gateway (bypass RovoDev)
				const stream = createUIMessageStream({
					execute: async ({ writer }) => {
						const audioWidgetId = `widget-audio-bypass-${Date.now()}`;
						const textId = `text-bypass-${Date.now()}`;

						writer.write({
							type: "data-thinking-status",
							data: {
								label: "Generating audio",
								activity: "audio",
								source: "backend",
							},
						});
						writer.write({
							type: "data-widget-loading",
							id: audioWidgetId,
							data: { type: SMART_WIDGET_TYPE_AUDIO, loading: true },
						});

						try {
							console.info("[OUTPUT-ROUTING] Selected media bypass audio input", {
								source: mediaBypassVoiceInputSource || null,
								extractionMode: mediaBypassExtractionMode || null,
								resolutionType: mediaBypassResolutionType || null,
								confidence:
									typeof mediaBypassConfidence === "number"
										? mediaBypassConfidence
										: null,
								candidateCount:
									typeof mediaBypassCandidateCount === "number"
										? mediaBypassCandidateCount
										: null,
								hasInput: Boolean(mediaBypassVoiceInput),
								payloadLength:
									typeof mediaBypassVoiceInput === "string"
										? mediaBypassVoiceInput.length
										: 0,
							});

							if (!mediaBypassVoiceInput) {
								throw new Error("No text available for audio synthesis");
							}

							const synthesisResult = await synthesizeSound({
								input: mediaBypassVoiceInput,
								provider: "google",
								model: "tts-latest",
								responseFormat: "mp3",
							});

							writer.write({
								type: "data-widget-data",
								id: audioWidgetId,
								data: {
									type: SMART_WIDGET_TYPE_AUDIO,
									payload: {
										audioUrl: buildAudioDataUrl(
											synthesisResult.audioBytes,
											synthesisResult.contentType
										),
										mimeType: synthesisResult.contentType,
										transcript: stripConversationalFiller(mediaBypassVoiceInput),
										source: "media-bypass-audio",
										inputSource: mediaBypassVoiceInputSource || undefined,
									},
								},
							});

							writer.write({ type: "text-start", id: textId });
							writer.write({
								type: "text-delta",
								id: textId,
								delta: mediaBypassVoiceInput,
							});
							writer.write({ type: "text-end", id: textId });
						} catch (audioError) {
							console.error("[OUTPUT-ROUTING] Media bypass audio generation failed:", audioError);
							writer.write({
								type: "data-widget-error",
								id: audioWidgetId,
								data: {
									type: SMART_WIDGET_TYPE_AUDIO,
									message: audioError instanceof Error
										? audioError.message
										: "Audio generation failed.",
									canRetry: true,
								},
							});

							writer.write({ type: "text-start", id: textId });
							writer.write({
								type: "text-delta",
								id: textId,
								delta: "I couldn't generate audio right now.",
							});
							writer.write({ type: "text-end", id: textId });
						} finally {
							writer.write({
								type: "data-widget-loading",
								id: audioWidgetId,
								data: { type: SMART_WIDGET_TYPE_AUDIO, loading: false },
							});
						}

						// Emit route-decision for observability
						writer.write(createRouteDecisionPart({
							intent: "chat",
							origin: requestOrigin,
							reason: "intent_media_audio",
						}));

						writer.write({
							type: "data-turn-complete",
							data: { timestamp: new Date().toISOString() },
						});
					},
					onError: (error) => {
						if (error instanceof Error) {
							return error.message;
						}
						return "Failed to generate audio";
					},
				});

				pipeUIMessageStreamToResponse({ response: res, stream });
				return;
			}
		}

		const directGoogleIntent = inferPromptIntent(latestUserMessage);
		if (
			provider === "google" &&
			!isStrictToolFirstTurn &&
			directGoogleIntent === "image"
		) {
			const googleImageConfig = resolveGoogleImageGatewayConfig({
				envVars: getEnvVars(),
				requestedModel: rawModel,
				resolveGatewayUrl,
				detectEndpointType,
			});
			if (!googleImageConfig.ok) {
				return res.status(googleImageConfig.statusCode).json({
					error: googleImageConfig.error,
					details: googleImageConfig.details,
				});
			}

			const stream = createUIMessageStream({
				execute: async ({ writer }) => {
					const textId = `text-${Date.now()}`;
					let textStarted = false;
					const prefersImageModalities =
						directGoogleIntent === "image";

					const emitTextDelta = (delta) => {
						if (typeof delta !== "string" || delta.length === 0) {
							return;
						}

						if (!textStarted) {
							writer.write({ type: "text-start", id: textId });
							textStarted = true;
						}

						writer.write({ type: "text-delta", id: textId, delta });
					};

					const streamGoogleTextOrImage = async (withModalities) => {
						await streamGoogleGatewayManualSse({
							gatewayUrl: googleImageConfig.gatewayUrl,
							envVars: googleImageConfig.envVars,
							model: googleImageConfig.model,
							prompt: userMessageText,
							maxOutputTokens: 2000,
							temperature: 1,
							responseModalities:
								withModalities && prefersImageModalities ? ["image"] : undefined,
							onTextDelta: emitTextDelta,
							onFile: ({ mediaType, base64 }) => {
								if (typeof base64 !== "string" || base64.length === 0) {
									return;
								}

								const resolvedMediaType =
									typeof mediaType === "string" && mediaType.trim()
										? mediaType
										: "image/png";
								writer.write({
									type: "file",
									mediaType: resolvedMediaType,
									url: `data:${resolvedMediaType};base64,${base64}`,
								});
							},
						});
					};

					try {
						await streamGoogleTextOrImage(true);
					} catch (modalitiesError) {
						if (
							!prefersImageModalities
							|| !isUnsupportedModalitiesError(modalitiesError)
						) {
							throw modalitiesError;
						}
						console.warn(
							"[CHAT-SDK] Google endpoint rejected modalities payload; retrying without modalities."
						);
						await streamGoogleTextOrImage(false);
					}

					if (textStarted) {
						writer.write({ type: "text-end", id: textId });
					}
				},
				onError: (error) => {
					if (error instanceof Error) {
						return error.message;
					}
					return "Failed to stream Google AI response";
				},
			});

			pipeUIMessageStreamToResponse({
				response: res,
				stream,
			});
			return;
		}

		const backendSelection = await resolvePreferredBackend();

		if (backendSelection.backend !== "rovodev") {
			return sendGatewayErrorResponse(
				res,
				createRovoDevUnavailableError(),
				"Failed to stream chat response"
			);
		}

		const { abortController, cleanup } = createAbortControllerFromRequest(req, res, {
			onAbort: () => {
				console.log("[CHAT-SDK] Client disconnected, aborting RovoDev stream");
			},
		});
		let didCleanupAbortTracking = false;
		const cleanupAbortTracking = () => {
			if (didCleanupAbortTracking) {
				return;
			}

			didCleanupAbortTracking = true;
			if (typeof res.off === "function") {
				res.off("finish", cleanupAbortTracking);
				res.off("close", cleanupAbortTracking);
			} else if (typeof res.removeListener === "function") {
				res.removeListener("finish", cleanupAbortTracking);
				res.removeListener("close", cleanupAbortTracking);
			}
			cleanup();
		};
		cleanupChatSdkAbortTracking = cleanupAbortTracking;
		res.once("finish", cleanupAbortTracking);
		res.once("close", cleanupAbortTracking);
		const shouldForceCardFirstGenui =
			smartGenerationActive &&
			prefersGenuiCardExperience &&
			!isStrictToolFirstTurn;
		stageTrace.mark("preprocessing_complete", {
			stageMs: Date.now() - chatSdkEntryStartedAtMs,
			backend: backendSelection.backend,
			promptProfile,
			smartGenerationActive,
			isStrictToolFirstTurn,
		});

			const stream = createUIMessageStream({
				execute: async ({ writer }) => {
					const widgetLoadingPrefix = "WIDGET_LOADING:";
					const widgetDataPrefix = "WIDGET_DATA:";
					const thinkingStatusPrefix = "THINKING_STATUS:";
				const agentExecutionPrefix = "AGENT_EXECUTION:";
				const partialMarkerBufferLength =
						Math.max(
							widgetLoadingPrefix.length,
							widgetDataPrefix.length,
							thinkingStatusPrefix.length,
							agentExecutionPrefix.length
						) - 1;
					let hasMarkedFirstUiEvent = false;
					let hasMarkedFirstWrittenTextDelta = false;
					let hasMarkedTurnComplete = false;
					let hasMarkedFirstRovoTextDelta = false;
					const writeStreamPart = writer.write.bind(writer);
					writer.write = (part) => {
						const eventType = getNonEmptyString(part?.type) || "unknown";
						if (!hasMarkedFirstUiEvent) {
							hasMarkedFirstUiEvent = true;
							stageTrace.mark("first_chat_sdk_sse_event", {
								eventType,
							});
						}
						if (
							!hasMarkedFirstWrittenTextDelta &&
							eventType === "text-delta" &&
							typeof part?.delta === "string" &&
							part.delta.length > 0
						) {
							hasMarkedFirstWrittenTextDelta = true;
							stageTrace.mark("first_text_delta_written", {
								chars: part.delta.length,
								source: "chat-sdk-writer",
							});
						}
						if (!hasMarkedTurnComplete && eventType === "data-turn-complete") {
							hasMarkedTurnComplete = true;
							stageTrace.mark("turn_complete_written");
						}
						return writeStreamPart(part);
					};
					let textBuffer = "";
				const textId = `text-${Date.now()}`;
				const widgetId = `widget-${Date.now()}`;
				let textStarted = false;
				let assistantText = "";
				let unsuppressedAssistantText = "";
				let widgetType = null;
				let latestPlanPayload = null;
				let resolvedRovoDevPort = null;
				let hasEmittedQuestionCard = false;
				let hasEmittedPlanWidget = false;
				let hasEmittedGenuiWidget = false;
					let hasPendingToolApprovalPrompt = false;
					let hasSeenPlanWidgetSignal = false;
					let hasEmittedPlanLoadingState = false;
					let latestProgressivePlanFingerprint = null;
					let hasExplicitPlanPayload = false;
					/** @type {Map<string, {widgetId: string; richnessScore: number}>} */
					const emittedQuestionCardToolCalls = new Map();
					/** @type {Map<string, Array<{id: string, label: string}>>} */
					const requestUserInputQuestionMeta = new Map();
					let pendingQuestionCardLoadingWidgetId = null;
					let hasSuppressedLargeAssistantJson = false;
						let hasObservedToolExecution = false;
						/** @type {Set<string>} */
						const bashQuestionCardWorkaroundCallIds = new Set();
						let hasObservedDeferredToolRequest = false;
						let hasToolApprovalReadonlyFailure = false;
						let toolApprovalReadonlyFailureMessage = null;
					// ── Output Routing: Two-step GenUI state ──
					// Track whether non-question-card tool calls were observed during
					// the RovoDev stream. When true, post-stream processing triggers
					// the two-step GenUI flow (BE-001).
					let hasObservedActionableToolCall = false;
					let hasObservedRelevantActionableToolCall = false;
						const toolFirstExecutionState = createToolFirstExecutionState(
							toolFirstPolicy
						);
						const toolFirstFullOutputs = [];
						const toolObservationEntries = [];
						const toolFirstSoftRetryEnabled =
							isStrictToolFirstTurn &&
							toolFirstPolicy?.enforcement?.mode ===
							TOOL_FIRST_ENFORCEMENT_MODE_SOFT_RETRY;
					const shouldDeferToolFirstText = toolFirstSoftRetryEnabled;
					let deferredToolFirstText = "";
					const suppressStreamingTextForCardFirstGenui =
						shouldForceCardFirstGenui;

					let bufferedAssistantText = "";
					const removeToolFirstFailureNarrative = () => {
						if (!isStrictToolFirstTurn) {
							return;
						}

						const sanitizedAssistant = stripToolFirstFailureNarrative(assistantText);
						if (sanitizedAssistant.replaced) {
							assistantText = sanitizedAssistant.text;
						}

						if (deferredToolFirstText.length > 0) {
							const sanitizedDeferred =
								stripToolFirstFailureNarrative(deferredToolFirstText);
							if (sanitizedDeferred.replaced) {
								deferredToolFirstText = sanitizedDeferred.text;
							}
						}
					};

					const flushDeferredToolFirstText = () => {
						if (!shouldDeferToolFirstText || deferredToolFirstText.length === 0) {
							return;
						}

						if (!textStarted) {
							writer.write({ type: "text-start", id: textId });
							textStarted = true;
						}

						writer.write({
							type: "text-delta",
							id: textId,
							delta: deferredToolFirstText,
						});
						deferredToolFirstText = "";
					};

					const emitTextDeltaRaw = (delta) => {
						if (!delta) {
							return;
						}

						if (shouldDeferToolFirstText) {
							deferredToolFirstText += delta;
							return;
						}
						if (suppressStreamingTextForCardFirstGenui) {
							return;
						}

						if (!textStarted) {
							writer.write({ type: "text-start", id: textId });
							textStarted = true;
						}

						writer.write({ type: "text-delta", id: textId, delta });
					};

				const flushBufferedAssistantText = ({ force = false } = {}) => {
					if (!bufferedAssistantText) {
						return;
					}

					const {
						pendingText: pendingSpecText,
						visibleText: textWithoutVisibleSpecFences,
					} = splitSpecFenceTextForStreaming(bufferedAssistantText);
					const {
						pendingText: pendingDirectMediaText,
						visibleText: visibleAssistantText,
					} = splitDirectMediaTextForStreaming(textWithoutVisibleSpecFences);
					const pendingAssistantText = `${pendingDirectMediaText}${pendingSpecText}`;
					if (!visibleAssistantText) {
						bufferedAssistantText = force ? "" : pendingAssistantText;
						return;
					}

					if (!force && isClassifierIntentLeakCandidate(visibleAssistantText)) {
						if (visibleAssistantText.length <= CLASSIFIER_JSON_BUFFER_MAX_CHARS) {
							return;
						}

						const parsedClassifierPayload = parseClassifierIntentPayload(
							visibleAssistantText
						);
						if (parsedClassifierPayload) {
							return;
						}
					}

					const chunk = visibleAssistantText;
					bufferedAssistantText = force ? "" : pendingAssistantText;
					emitTextDeltaRaw(chunk);
				};

				const finalizeBufferedAssistantText = () => {
					if (!bufferedAssistantText) {
						return null;
					}

					const parsedClassifierPayload = parseClassifierIntentPayload(
						bufferedAssistantText
					);
					if (parsedClassifierPayload) {
						bufferedAssistantText = "";
						return parsedClassifierPayload;
					}

					flushBufferedAssistantText({ force: true });
					return null;
				};

				const emitTextDelta = (delta) => {
					if (!delta) {
						return;
					}

					// Always accumulate the raw (unsuppressed) assistant text
					// so GenUI generation can access the full tool output data
					// even when the user-facing text has been suppressed.
					unsuppressedAssistantText += delta;

					if (hasSuppressedLargeAssistantJson) {
						return;
					}

					const nextAssistantText = assistantText + delta;

					assistantText = nextAssistantText;
					bufferedAssistantText += delta;

					if (!isClassifierIntentLeakCandidate(bufferedAssistantText)) {
						flushBufferedAssistantText({ force: true });
						return;
					}

					if (bufferedAssistantText.length <= CLASSIFIER_JSON_BUFFER_MAX_CHARS) {
						return;
					}

					const parsedClassifierPayload = parseClassifierIntentPayload(
						bufferedAssistantText
					);
					if (!parsedClassifierPayload) {
						flushBufferedAssistantText({ force: true });
					}
				};

					const emitForcedTextDelta = (delta) => {
						if (typeof delta !== "string" || delta.length === 0) {
							return;
						}

						assistantText += delta;
						unsuppressedAssistantText += delta;
						bufferedAssistantText += delta;
						flushBufferedAssistantText({ force: true });
					};

					const emitBufferedAssistantTextForTextRoute = () => {
						if (
							!suppressStreamingTextForCardFirstGenui ||
							textStarted ||
							assistantText.trim().length === 0
						) {
							return;
						}

						writer.write({ type: "text-start", id: textId });
						textStarted = true;
						writer.write({ type: "text-delta", id: textId, delta: assistantText });
					};

					const resetAssistantTextForRetryAttempt = () => {
						textBuffer = "";
						assistantText = "";
						unsuppressedAssistantText = "";
						bufferedAssistantText = "";
						hasSuppressedLargeAssistantJson = false;
						if (shouldDeferToolFirstText) {
							deferredToolFirstText = "";
						}
					};

					const waitForRetryDelay = async (delayMs) =>
						new Promise((resolve) => {
							if (
								typeof delayMs !== "number" ||
								delayMs <= 0 ||
								abortController.signal.aborted
							) {
								resolve();
								return;
							}
							let settled = false;
							const onAbort = () => {
								clearTimeout(timer);
								finish();
							};
							const finish = () => {
								if (settled) {
									return;
								}
								settled = true;
								abortController.signal.removeEventListener("abort", onAbort);
								resolve();
							};
							const timer = setTimeout(finish, delayMs);
							abortController.signal.addEventListener("abort", onAbort, {
								once: true,
							});
						});

					const sanitizeThinkingLabel = (value) => {
						if (typeof value !== "string") {
							return "";
						}

						return value.replace(/(?:\s*(?:\.{3}|…))+$/u, "").trim();
					};

					const sanitizeThinkingActivity = (value) => {
						if (
							value === "image" ||
							value === "audio" ||
							value === "ui" ||
							value === "data" ||
							value === "results"
						) {
							return value;
						}

						return undefined;
					};

					const sanitizeThinkingSource = (value) => {
						if (value === "backend" || value === "fallback") {
							return value;
						}

						return undefined;
					};

				const normalizeThinkingPhase = (value) => {
					if (value === "start" || value === "result" || value === "error") {
						return value;
					}
					return null;
				};

						const sanitizeThinkingEvent = (value) => {
							if (!value || typeof value !== "object") {
								return null;
							}

					const phase = normalizeThinkingPhase(value.phase);
					if (!phase) {
						return null;
					}
					hasObservedToolExecution = true;

					let toolName = getNonEmptyString(value.toolName) ?? "Tool";
					const eventId =
						getNonEmptyString(value.eventId) ??
						`thinking-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
					const timestamp =
						getNonEmptyString(value.timestamp) ?? new Date().toISOString();
					const toolCallId = getNonEmptyString(value.toolCallId) ?? undefined;

					// Rewrite bash → ask_user_questions for workaround calls
					if (
						toolCallId &&
						bashQuestionCardWorkaroundCallIds.has(toolCallId) &&
						toolName.toLowerCase() === "bash"
					) {
						toolName = "ask_user_questions";
					}

					const payload = {
						eventId,
						phase,
						toolName,
						timestamp,
					};

					if (toolCallId) {
						payload.toolCallId = toolCallId;
					}
					const subagentName = getNonEmptyString(value.subagentName) ?? undefined;
					const subagentToolCallId =
						getNonEmptyString(value.subagentToolCallId) ?? undefined;
					if (subagentName) {
						payload.subagentName = subagentName;
					}
					if (subagentToolCallId) {
						payload.subagentToolCallId = subagentToolCallId;
					}

					if (phase === "start" && value.input !== undefined) {
						const inputPreview = toPreview(value.input);
						if (inputPreview.text) {
							payload.input = inputPreview.text;
						}
					}

					const outputCandidate =
						value.outputPreview !== undefined ? value.outputPreview : value.output;
					const outputPreview =
						outputCandidate !== undefined ? toPreview(outputCandidate) : null;
					const outputBytes =
						typeof value.outputBytes === "number" && Number.isFinite(value.outputBytes)
							? value.outputBytes
							: outputPreview?.bytes;
					const outputTruncated =
						Boolean(value.outputTruncated) || Boolean(outputPreview?.truncated);

					if (phase === "result" && outputPreview?.text) {
						payload.output = outputPreview.text;
						payload.outputPreview = outputPreview.text;
						if (outputTruncated) {
							payload.outputTruncated = true;
							payload.suppressedRawOutput = true;
						}
						if (typeof outputBytes === "number" && Number.isFinite(outputBytes)) {
							payload.outputBytes = outputBytes;
						}
					}

					if (phase === "error") {
						const errorCandidate =
							getNonEmptyString(value.errorText) ?? outputPreview?.text ?? null;
						if (errorCandidate) {
							const errorPreview = toPreview(errorCandidate);
							if (errorPreview.text) {
								payload.errorText = errorPreview.text;
							}
						}

						if (outputPreview?.text) {
							payload.output = outputPreview.text;
							payload.outputPreview = outputPreview.text;
						}
						if (outputTruncated || Boolean(value.suppressedRawOutput)) {
							payload.outputTruncated = true;
							payload.suppressedRawOutput = true;
						}
						if (typeof outputBytes === "number" && Number.isFinite(outputBytes)) {
							payload.outputBytes = outputBytes;
						}
					}

							return payload;
						};

						const recordToolObservation = ({
							phase,
							toolName,
							text,
							toolCallId,
							source,
							rawOutput,
							outputTruncated,
							outputBytes,
						}) => {
							const normalizedPhase =
								phase === "result" || phase === "error" ? phase : null;
							if (!normalizedPhase) {
								return;
							}

							const normalizedText = getNonEmptyString(text);
							if (!normalizedText) {
								return;
							}

							toolObservationEntries.push({
								phase: normalizedPhase,
								toolName: getNonEmptyString(toolName) || "Tool",
								text: normalizedText,
								toolCallId: getNonEmptyString(toolCallId) || null,
								source: getNonEmptyString(source) || null,
								rawOutput: toBoundedToolObservationRawOutput(rawOutput),
								outputTruncated: outputTruncated === true,
								outputBytes:
									typeof outputBytes === "number" && Number.isFinite(outputBytes)
										? outputBytes
										: null,
							});
							if (toolObservationEntries.length > 200) {
								toolObservationEntries.shift();
							}
						};

						const hasToolObservationEntries = () => toolObservationEntries.length > 0;

						const emitAutomaticGenuiFailure = ({
							widgetId,
							message = "I couldn't produce a renderable interactive summary from tool output.",
						} = {}) => {
							emitWidgetError({
								id: widgetId,
								type: SMART_WIDGET_TYPE_GENUI,
								message,
								canRetry: true,
							});
							writer.write(createRouteDecisionPart({
								intent: "chat",
								origin: requestOrigin,
								reason: "fallback_ui_failed",
							}));

							return {
								emittedWidget: false,
								message,
							};
						};

						/**
						 * Build enriched assistant content for two-step GenUI when
						 * the user-facing assistantText was suppressed. Uses the
						 * unsuppressed text (capped) plus tool observation summaries
						 * so the GenUI LLM has real data to work with.
						 */
						const buildGenuiAssistantContentWithToolContext = ({
							fullText,
							observations,
							maxTextChars = 3000,
							maxObservationItems = 6,
						} = {}) => {
							const lines = [];

							const trimmedText = typeof fullText === "string" && fullText.length > 0
								? fullText.length > maxTextChars
									? `${fullText.slice(0, maxTextChars)}…`
									: fullText
								: null;
							if (trimmedText) {
								lines.push(trimmedText);
							}

							if (Array.isArray(observations) && observations.length > 0) {
								const recent = observations.slice(-maxObservationItems);
								lines.push("\nTool execution results:");
								for (const entry of recent) {
									const name = entry.toolName || "Tool";
									const preview = entry.text || entry.rawOutput || "Result returned.";
									const previewText = typeof preview === "string" && preview.length > 500
										? `${preview.slice(0, 500)}…`
										: preview;
									lines.push(`- ${name}: ${previewText}`);
								}
							}

							return lines.length > 0 ? lines.join("\n") : null;
						};

						const tryEmitCreateIntentDirectGenuiWidget = async ({
							widgetId,
							roleMessages,
							source = "create-intent-direct-genui",
						} = {}) => {
							if (!isCreateIntentRequestPrompt || abortController.signal.aborted) {
								return false;
							}

							const normalizedRoleMessages = Array.isArray(roleMessages)
								? roleMessages
								: mapUiMessagesToRoleContent(messages);
							if (normalizedRoleMessages.length === 0) {
								return false;
							}

							try {
								const directGenuiResult = await generateSmartGenuiResult({
									roleMessages: normalizedRoleMessages,
									provider,
									layoutContext: smartLayoutContext,
									signal: abortController.signal,
								});
								if (!directGenuiResult?.spec) {
									return false;
								}

								const summaryText = getNonEmptyString(directGenuiResult.narrative);
								writer.write({
									type: "data-widget-data",
									id: widgetId,
									data: {
										type: SMART_WIDGET_TYPE_GENUI,
										payload: withRouteWidgetContentType({
											spec: directGenuiResult.spec,
											summary: summaryText
												? summaryText.length > 280
													? `${summaryText.slice(0, 279)}...`
													: summaryText
												: "Generated interactive view",
											source,
										}),
									},
								});
								hasEmittedGenuiWidget = true;
								return true;
							} catch (directGenuiError) {
								console.warn(
									"[OUTPUT-ROUTING] Create-intent direct GenUI generation failed:",
									directGenuiError
								);
								return false;
							}
						};

						const emitPlanWidgetLoading = (loading) => {
							writer.write({
								type: "data-widget-loading",
								id: widgetId,
								data: {
									type: "plan",
									loading,
								},
							});
							hasSeenPlanWidgetSignal = true;
							hasEmittedPlanLoadingState = loading;
						};

						const emitPlanWidgetData = (payload) => {
							writer.write({
								type: "data-widget-data",
								id: widgetId,
								data: {
									type: "plan",
									payload,
								},
							});
							hasEmittedPlanWidget = true;
							hasSeenPlanWidgetSignal = true;
						};
						const maybeEmitExitPlanWidget = ({
							toolCallId,
							toolInput,
							source,
						}) => {
							const planPayload = extractPlanWidgetPayloadFromExitPlanToolInput(
								toolInput,
								{ minTasks: 1 },
							);
							if (!planPayload) {
								console.warn("[EXIT-PLAN-MODE] Plan widget extraction returned null from tool input", {
									toolCallId,
									source,
									toolInputPreview:
										typeof toolInput === "string"
											? toolInput.slice(0, 200)
											: JSON.stringify(toolInput).slice(0, 200),
								});
								return false;
							}

							if (hasToolApprovalReadonlyFailure) {
								console.info("[EXIT-PLAN-MODE] Suppressed plan widget after readonly write-tool failure", {
									toolCallId,
									source,
								});
								return false;
							}

							planPayload.deferredToolCallId = toolCallId;
							latestPlanPayload = planPayload;
							hasExplicitPlanPayload = true;
							latestProgressivePlanFingerprint = null;
							emitPlanWidgetData(planPayload);
							if (hasEmittedPlanLoadingState) {
								emitPlanWidgetLoading(false);
							}
							console.info("[EXIT-PLAN-MODE] Plan widget emitted from tool input", {
								toolCallId,
								source,
								taskCount: planPayload.tasks?.length ?? 0,
								hasMarkdown: Boolean(planPayload.markdown),
								markdownLength: planPayload.markdown?.length ?? 0,
								markdownPreview: (planPayload.markdown || "").slice(0, 300),
								title: planPayload.title,
								description: (planPayload.description || "").slice(0, 100),
								rawToolInputType: typeof toolInput,
								rawToolInputPreview:
									typeof toolInput === "string"
										? toolInput.slice(0, 300)
										: JSON.stringify(toolInput).slice(0, 300),
							});
							return true;
						};

						const emitToolApprovalData = (payload) => {
							if (!payload || typeof payload !== "object") {
								return;
							}

							hasPendingToolApprovalPrompt = true;
							writer.write({
								type: "data-tool-approval",
								id: `tool-approval-${payload.approvalId}`,
								data: payload,
							});
						};

						const autoResumePausedParts = async (pausedParts, control) => {
							const decisions = pausedParts
								.map((part) => {
									const toolCallId = getNonEmptyString(part?.tool_call_id);
									return toolCallId
										? { tool_call_id: toolCallId, deny_message: null }
										: null;
								})
								.filter(Boolean);
							if (decisions.length > 0) {
								await control.resume({ decisions });
							}
							return { disconnect: false };
						};

						const handlePausedToolApprovalBatch = async ({
							rawEvent,
							control,
						}) => {
							const pausedParts = Array.isArray(rawEvent?.parts)
								? rawEvent.parts
								: [];
							if (pausedParts.length === 0) {
								return { disconnect: false };
							}

							const permissions =
								rawEvent?.permissions &&
								typeof rawEvent.permissions === "object" &&
								!Array.isArray(rawEvent.permissions)
									? rawEvent.permissions
									: null;
							const approvalParts = pausedParts.filter((part) =>
								Boolean(getPartPermissionScenario(part, permissions)),
							);
							if (approvalParts.length === 0) {
								return autoResumePausedParts(pausedParts, control);
							}
							const autoApproveToolCallIds = pausedParts
								.map((part) => {
									const toolCallId = getNonEmptyString(part?.tool_call_id);
									if (!toolCallId) {
										return null;
									}

									return getPartPermissionScenario(part, permissions)
										? null
										: toolCallId;
								})
								.filter(Boolean);

							const reservedHandle = control.reservePort?.();
							if (!reservedHandle) {
								return autoResumePausedParts(pausedParts, control);
							}

							let pausedSessionId = rovoDevSessionId;
							let pausedSessionMode = sessionMode;
							if (threadId) {
								try {
									const synchronizedThread =
										await syncFutureChatThreadSessionFromCurrentPort(
											threadId,
											control.port,
											{ sessionMode },
										);
									pausedSessionId =
										getNonEmptyString(synchronizedThread?.sessionId)
										|| pausedSessionId;
									pausedSessionMode =
										synchronizedThread?.sessionMode === "ephemeral"
											? "ephemeral"
											: pausedSessionMode;
								} catch (error) {
									console.warn("[FUTURE-CHAT] Failed to sync thread session on paused tool approval:", {
										threadId,
										port: control.port,
										error: error instanceof Error ? error.message : String(error),
									});
								}
							}

							const approvalId = createPausedToolApprovalId();
							const payload = buildPausedToolApprovalPayload({
								approvalId,
								threadId,
								parts: approvalParts,
								permissions,
							});
							if (!payload) {
								return autoResumePausedParts(pausedParts, control);
							}
							hasPendingToolApprovalPrompt = true;

							const record = registerPausedRovoDevToolApprovalBatch({
								approvalId,
								port: control.port,
								handle: reservedHandle,
								threadId,
								sessionId: pausedSessionId,
								sessionMode: pausedSessionMode,
								parts: pausedParts,
								autoApproveToolCallIds,
								payload,
							});
							if (!record) {
								return autoResumePausedParts(pausedParts, control);
							}

							console.info("[ROVODEV-PAUSE] Captured paused tool approval batch", {
								approvalId,
								threadId,
								port: control.port,
								toolCount: payload.items.length,
								toolNames: payload.items.map((item) => item.toolName),
							});
							emitToolApprovalData(payload);
							return { disconnect: true };
						};

						const emitWidgetError = ({
							type,
							message,
							canRetry = true,
							id = widgetId,
						}) => {
							if (typeof type !== "string" || !type.trim()) {
								return;
							}
							if (typeof message !== "string" || !message.trim()) {
								return;
							}

							writer.write({
								type: "data-widget-error",
								id,
								data: {
									type,
									message: message.trim(),
									canRetry: Boolean(canRetry),
								},
							});
						};

						const maybeEmitProgressivePlanUpdate = () => {
							if (
								hasExplicitPlanPayload ||
								!hasSeenPlanWidgetSignal ||
								latestPlanPayload !== null
							) {
								return;
							}

					const progressivePlanPayload = extractProgressivePlanWidgetPayloadFromText(
						assistantText,
						{
							minTasks: 1,
							requireActionItemsHeading: true,
						}
					);
					if (!progressivePlanPayload) {
						return;
					}

					let nextFingerprint = null;
					try {
						nextFingerprint = JSON.stringify(progressivePlanPayload);
					} catch {
						nextFingerprint = null;
					}

					if (
						nextFingerprint &&
						nextFingerprint === latestProgressivePlanFingerprint
					) {
						return;
					}

					latestProgressivePlanFingerprint = nextFingerprint;
					latestPlanPayload = progressivePlanPayload;
					hasEmittedPlanWidget = true;
					hasSeenPlanWidgetSignal = true;
					widgetType = "plan";

					if (!hasEmittedPlanLoadingState) {
						emitPlanWidgetLoading(true);
					}

					emitPlanWidgetData(progressivePlanPayload);
				};

				const getQuestionCardRichnessScore = (payload) => {
					if (!payload || typeof payload !== "object") {
						return 0;
					}

					const questions = Array.isArray(payload.questions)
						? payload.questions
						: [];
					if (questions.length === 0) {
						return 0;
					}

					const optionCount = questions.reduce((count, question) => {
						if (!question || typeof question !== "object") {
							return count;
						}
						const options = Array.isArray(question.options)
							? question.options
							: [];
						return count + options.length;
					}, 0);

					return questions.length * 100 + optionCount;
				};

				const emitRequestUserInputQuestionCard = ({
					toolName,
					toolCallId,
					questionInput,
					source = "request_user_input_tool_input",
				}) => {
					if (!isRequestUserInputTool(toolName)) {
						return false;
					}

					const normalizedToolCallId = getNonEmptyString(toolCallId);
					let dedupeKey = normalizedToolCallId
						? `request-user-input:${normalizedToolCallId}`
						: null;
					if (!dedupeKey) {
						try {
							const serializedInput = JSON.stringify(questionInput);
							if (serializedInput && serializedInput !== "null") {
								dedupeKey = `request-user-input:${serializedInput}`;
							}
						} catch {
							dedupeKey = null;
						}
					}

					const payload = buildQuestionCardPayloadFromRequestUserInput(
						questionInput,
						{
							sessionId: normalizedToolCallId
								? `request-user-input-${normalizedToolCallId}`
								: createClarificationSessionId(),
							round: 1,
							maxRounds: 1,
							title: "Answer these questions to continue",
							description:
								"Pick the options that best match what you want.",
							widgetType: CLARIFICATION_WIDGET_TYPE,
							maxPresetOptions: CLARIFICATION_MAX_PRESET_OPTIONS,
							customOptionPlaceholder: CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER,
							maxLabelLength: CLARIFICATION_MAX_LABEL_LENGTH,
							createSessionId: createClarificationSessionId,
						}
					);

					if (!payload) {
						return false;
					}

					// Store question ID → label mapping for answer format adaptation
					if (payload.sessionId && Array.isArray(payload.questions)) {
						const meta = payload.questions
							.filter((q) => q && typeof q.id === "string" && typeof q.label === "string")
							.map((q) => ({ id: q.id, label: q.label }));
						requestUserInputQuestionMeta.set(payload.sessionId, meta);
						_requestUserInputQuestionMetaStore.set(payload.sessionId, meta);
					}

					const resolvedDedupeKey =
						dedupeKey ||
						`request-user-input:${payload.sessionId}:${payload.round}`;
					const richnessScore = getQuestionCardRichnessScore(payload);
					const existingQuestionCardState =
						emittedQuestionCardToolCalls.get(resolvedDedupeKey) || null;
					if (
						existingQuestionCardState &&
						existingQuestionCardState.richnessScore >= richnessScore
					) {
						return false;
					}

					const questionCardWidgetId =
						existingQuestionCardState?.widgetId ||
						(normalizedToolCallId
							? `request-user-input-${normalizedToolCallId}`
							: `request-user-input-${Date.now()}`);
					hasEmittedQuestionCard = true;
					pendingQuestionCardLoadingWidgetId = questionCardWidgetId;

					if (!existingQuestionCardState) {
						writer.write({
							type: "data-widget-loading",
							id: questionCardWidgetId,
							data: {
								type: CLARIFICATION_WIDGET_TYPE,
								loading: true,
							},
						});
					}

					writer.write({
						type: "data-widget-data",
						id: questionCardWidgetId,
						data: {
							type: CLARIFICATION_WIDGET_TYPE,
							payload: {
								...payload,
								tool_call_id: normalizedToolCallId || undefined,
							},
						},
					});

					// BE-005 / BE-009: Emit route-decision for question card experience
					writer.write(createRouteDecisionPart({
						intent: "chat",
						origin: requestOrigin,
						reason: "intent_clarification",
					}));

					emittedQuestionCardToolCalls.set(resolvedDedupeKey, {
						widgetId: questionCardWidgetId,
						richnessScore,
					});

					console.info("[OUTPUT-ROUTING] Question card emitted via tool", {
						reason: "intent_clarification",
						experience: "question_card",
						sessionId: payload.sessionId,
						questionCount: Array.isArray(payload.questions) ? payload.questions.length : 0,
						richnessScore,
						upgraded: Boolean(existingQuestionCardState),
						source,
					});
					return true;
				};

				const emitRequestUserInputQuestionCardFromResult = (toolCallResult) => {
					if (!toolCallResult || typeof toolCallResult !== "object") {
						return;
					}

					if (!isRequestUserInputTool(toolCallResult.toolName)) {
						return;
					}

					const outputCandidates = [
						toolCallResult.toolOutputRaw,
						toolCallResult.toolOutputPreview,
					].filter((candidate) => candidate !== undefined && candidate !== null);

					for (const candidate of outputCandidates) {
						const emitted = emitRequestUserInputQuestionCard({
							toolName: toolCallResult.toolName,
							toolCallId: toolCallResult.toolCallId,
							questionInput: candidate,
							source: "request_user_input_tool_result",
						});
						if (emitted) {
							return;
						}
					}
				};

				const findNextMarkerIndex = (value) => {
					const loadingIndex = value.indexOf(widgetLoadingPrefix);
					const dataIndex = value.indexOf(widgetDataPrefix);
					const thinkingIndex = value.indexOf(thinkingStatusPrefix);
					const agentExecIndex = value.indexOf(agentExecutionPrefix);
					let minIndex = -1;
					for (const idx of [loadingIndex, dataIndex, thinkingIndex, agentExecIndex]) {
						if (idx !== -1 && (minIndex === -1 || idx < minIndex)) {
							minIndex = idx;
						}
					}
					return minIndex;
				};

				const findJsonObjectEndIndex = (value, startIndex) => {
					let depth = 0;
					let inString = false;
					let isEscaped = false;

					for (let index = startIndex; index < value.length; index++) {
						const character = value[index];

						if (inString) {
							if (isEscaped) {
								isEscaped = false;
							} else if (character === "\\") {
								isEscaped = true;
							} else if (character === "\"") {
								inString = false;
							}
							continue;
						}

						if (character === "\"") {
							inString = true;
						} else if (character === "{") {
							depth += 1;
						} else if (character === "}") {
							depth -= 1;
							if (depth === 0) {
								return index;
							}
						}
					}

					return -1;
				};

				const processTextBuffer = (isFinalChunk) => {
					while (textBuffer.length > 0) {
						const markerIndex = findNextMarkerIndex(textBuffer);

						if (markerIndex === -1) {
							if (isFinalChunk) {
								emitTextDelta(textBuffer);
								textBuffer = "";
								continue;
							}

							if (textBuffer.length > partialMarkerBufferLength) {
								const flushableLength =
									textBuffer.length - partialMarkerBufferLength;
								emitTextDelta(textBuffer.slice(0, flushableLength));
								textBuffer = textBuffer.slice(flushableLength);
							}
							return;
						}

						if (markerIndex > 0) {
							emitTextDelta(textBuffer.slice(0, markerIndex));
							textBuffer = textBuffer.slice(markerIndex);
							continue;
						}

						if (textBuffer.startsWith(widgetLoadingPrefix)) {
							const loadingMatch = textBuffer.match(
								/^WIDGET_LOADING:([A-Za-z0-9_-]+)/
							);
							if (!loadingMatch) {
								if (textBuffer.length > widgetLoadingPrefix.length) {
									emitTextDelta(widgetLoadingPrefix);
									textBuffer = textBuffer.slice(widgetLoadingPrefix.length);
									continue;
								}
								if (isFinalChunk) {
									emitTextDelta(textBuffer);
									textBuffer = "";
								}
								return;
							}

							widgetType = loadingMatch[1];
							if (widgetType === "plan") {
								hasSeenPlanWidgetSignal = true;
								hasEmittedPlanLoadingState = true;
							}
							writer.write({
								type: "data-widget-loading",
								id: widgetId,
								data: {
									type: widgetType,
									loading: true,
								},
							});

							textBuffer = textBuffer
								.slice(loadingMatch[0].length)
								.replace(/^[\r\n\t ]+/, "");
							continue;
						}

						if (textBuffer.startsWith(widgetDataPrefix)) {
							let jsonStartIndex = widgetDataPrefix.length;
							while (
								jsonStartIndex < textBuffer.length &&
								/\s/.test(textBuffer[jsonStartIndex])
							) {
								jsonStartIndex += 1;
							}

							if (jsonStartIndex >= textBuffer.length) {
								if (isFinalChunk) {
									emitTextDelta(textBuffer);
									textBuffer = "";
								}
								return;
							}

							if (textBuffer[jsonStartIndex] !== "{") {
								const invalidPrefix = textBuffer.slice(0, jsonStartIndex);
								emitTextDelta(invalidPrefix);
								textBuffer = textBuffer.slice(jsonStartIndex);
								continue;
							}

							const jsonEndIndex = findJsonObjectEndIndex(
								textBuffer,
								jsonStartIndex
							);
							if (jsonEndIndex === -1) {
								if (isFinalChunk) {
									emitTextDelta(textBuffer);
									textBuffer = "";
								}
								return;
							}

							const jsonPayload = textBuffer.slice(
								jsonStartIndex,
								jsonEndIndex + 1
							);
							textBuffer = textBuffer
								.slice(jsonEndIndex + 1)
								.replace(/^[\r\n\t ]+/, "");

							try {
								const parsedWidget = JSON.parse(jsonPayload);
								const resolvedWidgetType =
									parsedWidget?.type ?? widgetType ?? "widget";
								widgetType = resolvedWidgetType;
								if (resolvedWidgetType === CLARIFICATION_WIDGET_TYPE) {
									hasEmittedQuestionCard = true;
									pendingQuestionCardLoadingWidgetId = widgetId;
								}
								if (resolvedWidgetType === SMART_WIDGET_TYPE_GENUI) {
									if (hasEmittedPlanWidget) {
										// Plan widget already emitted — don't let a
										// genui widget override it in the data parts.
										continue;
									}
									hasEmittedGenuiWidget = true;
								}
								if (resolvedWidgetType === "plan") {
									latestPlanPayload = parsedWidget;
									hasEmittedPlanWidget = true;
									hasSeenPlanWidgetSignal = true;
									hasExplicitPlanPayload = true;
									latestProgressivePlanFingerprint = null;
									console.info("[PLAN-WIDGET-GENUI] Plan widget emitted from GenUI JSON path", {
										hasMarkdown: Boolean(parsedWidget?.markdown),
										markdownLength: (parsedWidget?.markdown || "").length,
										markdownPreview: (parsedWidget?.markdown || "").slice(0, 300),
										title: parsedWidget?.title,
										taskCount: Array.isArray(parsedWidget?.tasks) ? parsedWidget.tasks.length : 0,
										payloadPreview: JSON.stringify(parsedWidget).slice(0, 500),
									});
								}

								writer.write({
									type: "data-widget-data",
									id: widgetId,
									data: {
										type: resolvedWidgetType,
										payload: parsedWidget,
									},
								});

								if (resolvedWidgetType === CLARIFICATION_WIDGET_TYPE) {
									continue;
								}

								writer.write({
									type: "data-widget-loading",
									id: widgetId,
									data: {
										type: resolvedWidgetType,
										loading: false,
									},
								});
								if (resolvedWidgetType === "plan") {
									hasEmittedPlanLoadingState = false;
								}
							} catch (error) {
								console.error("Failed to parse widget payload:", error);
								emitTextDelta(`${widgetDataPrefix}${jsonPayload}`);
							}

							continue;
						}

						if (textBuffer.startsWith(thinkingStatusPrefix)) {
							let jsonStartIndex = thinkingStatusPrefix.length;
							while (
								jsonStartIndex < textBuffer.length &&
								/\s/.test(textBuffer[jsonStartIndex])
							) {
								jsonStartIndex += 1;
							}

							if (jsonStartIndex >= textBuffer.length) {
								if (isFinalChunk) {
									emitTextDelta(textBuffer);
									textBuffer = "";
								}
								return;
							}

							if (textBuffer[jsonStartIndex] !== "{") {
								const invalidPrefix = textBuffer.slice(0, jsonStartIndex);
								emitTextDelta(invalidPrefix);
								textBuffer = textBuffer.slice(jsonStartIndex);
								continue;
							}

							const jsonEndIndex = findJsonObjectEndIndex(
								textBuffer,
								jsonStartIndex
							);
							if (jsonEndIndex === -1) {
								if (isFinalChunk) {
									emitTextDelta(textBuffer);
									textBuffer = "";
								}
								return;
							}

							const jsonPayload = textBuffer.slice(
								jsonStartIndex,
								jsonEndIndex + 1
							);
							textBuffer = textBuffer
								.slice(jsonEndIndex + 1)
								.replace(/^[\r\n\t ]+/, "");

							try {
								const parsedStatus = JSON.parse(jsonPayload);
								const label = sanitizeThinkingLabel(parsedStatus.label);
								const content =
									typeof parsedStatus.content === "string"
										? parsedStatus.content.trim()
										: "";
								const activity = sanitizeThinkingActivity(parsedStatus.activity);
								const source = sanitizeThinkingSource(parsedStatus.source);
								writer.write({
									type: "data-thinking-status",
									data: {
										label: label || "Thinking",
										content: content.length > 0 ? content : undefined,
										activity,
										source,
									},
								});
							} catch (error) {
								console.error("Failed to parse thinking-status payload:", error);
								emitTextDelta(`${thinkingStatusPrefix}${jsonPayload}`);
							}

							continue;
						}

						if (textBuffer.startsWith(agentExecutionPrefix)) {
							let jsonStartIndex = agentExecutionPrefix.length;
							while (
								jsonStartIndex < textBuffer.length &&
								/\s/.test(textBuffer[jsonStartIndex])
							) {
								jsonStartIndex += 1;
							}

							if (jsonStartIndex >= textBuffer.length) {
								if (isFinalChunk) {
									emitTextDelta(textBuffer);
									textBuffer = "";
								}
								return;
							}

							if (textBuffer[jsonStartIndex] !== "{") {
								const invalidPrefix = textBuffer.slice(0, jsonStartIndex);
								emitTextDelta(invalidPrefix);
								textBuffer = textBuffer.slice(jsonStartIndex);
								continue;
							}

							const jsonEndIndex = findJsonObjectEndIndex(
								textBuffer,
								jsonStartIndex
							);
							if (jsonEndIndex === -1) {
								if (isFinalChunk) {
									emitTextDelta(textBuffer);
									textBuffer = "";
								}
								return;
							}

							const jsonPayload = textBuffer.slice(
								jsonStartIndex,
								jsonEndIndex + 1
							);
							textBuffer = textBuffer
								.slice(jsonEndIndex + 1)
								.replace(/^[\r\n\t ]+/, "");

							try {
								const parsedExecution = JSON.parse(jsonPayload);
								const taskId =
									getNonEmptyString(parsedExecution.taskId) || "unknown";
								writer.write({
									type: "data-agent-execution",
									id: `agent-execution-${taskId}`,
									data: {
										agentId: parsedExecution.agentId || "unknown",
										agentName: parsedExecution.agentName || "Agent",
										taskId,
										taskLabel: parsedExecution.taskLabel || "Task",
										status: parsedExecution.status || "working",
										content: parsedExecution.content,
									},
								});
							} catch (error) {
								console.error("Failed to parse agent-execution payload:", error);
								emitTextDelta(`${agentExecutionPrefix}${jsonPayload}`);
							}

							continue;
						}

						if (isFinalChunk) {
							emitTextDelta(textBuffer);
							textBuffer = "";
						}
						return;
					}
				};

					const handleStreamTextDelta = (delta) => {
						if (typeof delta !== "string" || delta.length === 0) {
							return;
						}
						if (!hasMarkedFirstRovoTextDelta) {
							hasMarkedFirstRovoTextDelta = true;
							stageTrace.mark("first_rovodev_text_delta", {
								chars: delta.length,
							});
						}

						emitLazyThinkingStatus();
						textBuffer += delta;
					processTextBuffer(false);
					maybeEmitProgressivePlanUpdate();
				};

					// RovoDev Serve: route through the local agent loop
					console.log("[CHAT-SDK] Routing through RovoDev Serve");
					stageTrace.mark("rovodev_stream_start", {
						conflictPolicy: "wait-for-turn",
					});
					// Emit data-thinking-status lazily — only when the LLM
					// actually starts producing output (text or tool events).
					// Until then the frontend shows the preload indicator
					// ("Rovo is cooking") to distinguish "waiting for LLM"
					// from "LLM is actively working."
					let hasEmittedThinkingStatus = false;
					const emitLazyThinkingStatus = () => {
						if (hasEmittedThinkingStatus) return;
						hasEmittedThinkingStatus = true;
						writer.write({
							type: "data-thinking-status",
							data: {
								label: "Thinking",
								activity: "results",
								source: "backend",
							},
						});
					};
					const toolFirstRetryLimit =
						toolFirstSoftRetryEnabled
							? Math.max(toolFirstPolicy?.enforcement?.maxRelevantRetries ?? 0, 0)
							: 0;
					const totalToolFirstAttempts = toolFirstRetryLimit + 1;
					let currentToolFirstAttempt = 1;

					let activeAttemptMessage =
						rawDeferredToolResponse && typeof rawDeferredToolResponse === "object"
							? {
								message: rawDeferredToolResponse,
								enableDeepPlan: false,
							}
							: {
								message: userMessageText,
								enableDeepPlan: false,
							};
					let hasRetriedAsDeferredToolResponse = false;
					let pausedToolCallHandled = false;
					let shouldContinueToolFirstRetry = true;
					let forcePortRecoveryAttemptCount = 0;
					let stuckPortRecoveryRetryCount = 0;

					while (shouldContinueToolFirstRetry) {
						recordToolFirstAttempt(toolFirstExecutionState, {
							isRetry: currentToolFirstAttempt > 1,
						});

						const pausedToolCallRecord =
							pausedContinuationToolCallId && currentToolFirstAttempt === 1
								? takePausedRovoDevToolCall(pausedContinuationToolCallId)
								: null;
						const pausedToolApprovalBatchRecord =
							toolApprovalSubmission?.approvalId && currentToolFirstAttempt === 1
								? takePausedRovoDevToolApprovalBatch(toolApprovalSubmission.approvalId)
								: null;
						if (pausedContinuationToolCallId) {
							console.info("[DEBUG-PLAN-APPROVAL] Paused tool call record", {
								pausedContinuationToolCallId,
								recordFound: Boolean(pausedToolCallRecord),
								recordKind: pausedToolCallRecord?.kind,
								recordPort: pausedToolCallRecord?.port,
								recordCreatedAt: pausedToolCallRecord?.createdAt,
								recordExpiresAt: pausedToolCallRecord?.expiresAt,
								ageMs: pausedToolCallRecord?.createdAt ? Date.now() - pausedToolCallRecord.createdAt : null,
							});
						}
						if (toolApprovalSubmission?.approvalId) {
							console.info("[DEBUG-TOOL-APPROVAL] Paused tool approval batch lookup", {
								approvalId: toolApprovalSubmission.approvalId,
								recordFound: Boolean(pausedToolApprovalBatchRecord),
								recordPort: pausedToolApprovalBatchRecord?.port,
								recordCreatedAt: pausedToolApprovalBatchRecord?.createdAt,
								recordExpiresAt: pausedToolApprovalBatchRecord?.expiresAt,
								ageMs: pausedToolApprovalBatchRecord?.createdAt
									? Date.now() - pausedToolApprovalBatchRecord.createdAt
									: null,
							});
						}
						let streamTimedOut = false;
						try {
							const streamCommonOptions = {
								onTextDelta: handleStreamTextDelta,
								// ── Output Routing: Track all tool calls (BE-001) ──
								// Question-card tools are emitted from resolved tool input
								// and upgraded from tool-result payloads when richer option
								// data arrives. Other tools mark actionable usage for the
								// two-step GenUI flow.
								onToolCallStart: (toolCall) => {
									if (!toolCall || typeof toolCall !== "object") {
										return;
									}

									// Handle deferred tool requests (e.g., ask_user_questions from RovoDev)
									if (toolCall.isDeferredToolRequest === true) {
										hasObservedDeferredToolRequest = true;
										if (isRequestUserInputTool(toolCall.toolName) && toolCall.toolInput) {
											emitRequestUserInputQuestionCard({
												toolName: "ask_user_questions",
												toolCallId: toolCall.toolCallId,
												questionInput: toolCall.toolInput,
												source: "deferred_tool_request",
											});
										}

										// Handle exit_plan_mode deferred tool — extract
										// the markdown plan and emit a plan widget so the
										// user can approve/reject before execution.
										if (isExitPlanModeTool(toolCall.toolName) && toolCall.toolInput) {
											maybeEmitExitPlanWidget({
												toolCallId: toolCall.toolCallId,
												toolInput: toolCall.toolInput,
												source: "deferred_tool_request",
											});
										}
										return;
									}

									if (isRequestUserInputTool(toolCall.toolName)) {
										// Serve-native deferred tools should render from
										// the actual deferred-tool request event, not from
										// tool-call start/input-resolved hooks. Emitting the
										// card early duplicates clarification state and
										// corrupts the resumed tool history.
										return;
									}

									// Detect bash workaround for ask_user_questions
									if (isBashQuestionCardWorkaround(toolCall.toolName, toolCall.toolInput)) {
										if (toolCall.toolCallId) {
											bashQuestionCardWorkaroundCallIds.add(toolCall.toolCallId);
										}
										if (toolCall.toolInput) {
											emitRequestUserInputQuestionCard({
												toolName: "ask_user_questions",
												toolCallId: toolCall.toolCallId,
												questionInput: toolCall.toolInput,
												source: "bash_workaround_tool_input",
											});
										}
										return;
									}

									if (
										isToolNameRelevant({
											toolName: toolCall.toolName,
											domains: toolFirstRelevanceDomains,
										})
									) {
										hasObservedRelevantActionableToolCall = true;
									}
									hasObservedActionableToolCall = true;
								},
								onToolCallInputResolved: (toolCall) => {
									if (!isRequestUserInputTool(toolCall?.toolName)) {
										emitRequestUserInputQuestionCard({
											toolName: toolCall?.toolName,
											toolCallId: toolCall?.toolCallId,
											questionInput: toolCall?.toolInput,
											source: "request_user_input_tool_input",
										});
									}

									// Detect bash workaround for ask_user_questions
									if (isBashQuestionCardWorkaround(toolCall?.toolName, toolCall?.toolInput)) {
										if (toolCall?.toolCallId) {
											bashQuestionCardWorkaroundCallIds.add(toolCall.toolCallId);
										}
										emitRequestUserInputQuestionCard({
											toolName: "ask_user_questions",
											toolCallId: toolCall?.toolCallId,
											questionInput: toolCall?.toolInput,
											source: "bash_workaround_tool_input",
										});
									}
								},
									onToolCallResult: (toolCallResult) => {
										emitRequestUserInputQuestionCardFromResult(toolCallResult);

										// Detect bash workaround in tool result output
										if (
											!isRequestUserInputTool(toolCallResult?.toolName) &&
											isBashQuestionCardWorkaround(
												toolCallResult?.toolName,
												toolCallResult?.toolOutputRaw ?? toolCallResult?.toolOutputPreview
											)
										) {
											emitRequestUserInputQuestionCard({
												toolName: "ask_user_questions",
												toolCallId: toolCallResult?.toolCallId,
												questionInput: toolCallResult?.toolOutputRaw ?? toolCallResult?.toolOutputPreview,
												source: "bash_workaround_tool_result",
											});
										}

										// Capture full output for tool-first GenUI generation
										const toolOutput =
											toolCallResult?.output ??
											toolCallResult?.toolOutputRaw ??
											toolCallResult?.toolOutputPreview;
										const toolOutputPreview =
											toolOutput !== undefined && toolOutput !== null
												? toPreview(toolOutput)
												: null;
										if (
											!isRequestUserInputTool(toolCallResult?.toolName) &&
											toolOutputPreview?.text
										) {
											recordToolObservation({
												phase: "result",
												toolName: toolCallResult.toolName,
												text: toolOutputPreview.text,
												toolCallId: toolCallResult?.toolCallId,
												source: "tool_call_result",
												rawOutput: toolOutput,
												outputTruncated: toolOutputPreview.truncated,
												outputBytes: toolOutputPreview.bytes,
											});
										}

										if (
											toolApprovalSubmission &&
											isWorkspaceWriteToolName(toolCallResult?.toolName) &&
											isReadonlyToolBlockMessage(toolOutputPreview?.text)
										) {
											hasToolApprovalReadonlyFailure = true;
											toolApprovalReadonlyFailureMessage =
												"Write tools remained blocked after explicit approval. Check the RovoDev filesystem tool permission flow.";
										}

									if (toolFirstPolicy.matched && toolCallResult?.toolName) {
											const isRelevant = isToolNameRelevant({
												toolName: toolCallResult.toolName,
												domains: toolFirstRelevanceDomains,
											});
											if (isRelevant && toolOutput !== undefined && toolOutput !== null) {
												toolFirstFullOutputs.push({
													toolName: toolCallResult.toolName,
												output: typeof toolOutput === "string"
													? toolOutput.slice(0, 4000)
													: JSON.stringify(toolOutput).slice(0, 4000),
											});
										}
									}
								},
								onDeferredToolRequest: async (toolCall) => {
									if (!toolCall || typeof toolCall !== "object") {
										return;
									}

									hasObservedDeferredToolRequest = true;
									if (
										toolCall.toolCallId &&
										typeof resolvedRovoDevPort === "number" &&
										resolvedRovoDevPort > 0
									) {
										registerActiveDeferredToolCall({
											toolCallId: toolCall.toolCallId,
											port: resolvedRovoDevPort,
											threadId,
											kind: isExitPlanModeTool(toolCall.toolName)
												? "plan-approval"
												: "clarification",
										});
									}
									if (threadId && typeof resolvedRovoDevPort === "number" && resolvedRovoDevPort > 0) {
										try {
											await syncFutureChatThreadSessionFromCurrentPort(
												threadId,
												resolvedRovoDevPort,
												{ sessionMode },
											);
										} catch (error) {
											console.warn("[FUTURE-CHAT] Failed to sync thread session on deferred tool request:", {
												threadId,
												port: resolvedRovoDevPort,
												error: error instanceof Error ? error.message : String(error),
											});
										}
									}

									if (isRequestUserInputTool(toolCall.toolName) && toolCall.toolInput) {
										emitRequestUserInputQuestionCard({
											toolName: "ask_user_questions",
											toolCallId: toolCall.toolCallId,
											questionInput: toolCall.toolInput,
											source: "deferred_tool_request",
										});
									}

									if (isExitPlanModeTool(toolCall.toolName) && toolCall.toolInput) {
										maybeEmitExitPlanWidget({
											toolCallId: toolCall.toolCallId,
											toolInput: toolCall.toolInput,
											source: "deferred_tool_request",
										});
									}
								},
								enableDeferredTools: true,
								idleTimeoutMs: WAIT_FOR_TURN_TIMEOUT_MS,
								includeSubagentEvents: true,
								signal: abortController.signal,
								conflictPolicy: "wait-for-turn",
								onPortAcquired: (acquiredPort) => {
									if (typeof acquiredPort === "number" && acquiredPort > 0) {
										resolvedRovoDevPort = acquiredPort;
										if (threadId) {
											activeRequests.set(threadId, { port: acquiredPort, abortController });
											void syncFutureChatThreadSessionFromCurrentPort(
												threadId,
												acquiredPort,
												{ sessionMode },
											).catch((error) => {
												console.warn("[FUTURE-CHAT] Failed to sync thread session on port acquisition:", {
													threadId,
													port: acquiredPort,
													error: error instanceof Error ? error.message : String(error),
												});
											});
										}
										stageTrace.mark("stream_port_acquired", {
											port: acquiredPort,
										});
									}
								},
								onTimingStage: (stage, details) => {
									stageTrace.mark(stage, details);
								},
								onThinkingStatus: (statusUpdate) => {
									if (!statusUpdate || typeof statusUpdate !== "object") {
										return;
									}

									hasEmittedThinkingStatus = true;
									const label = sanitizeThinkingLabel(statusUpdate.label);
									if (!label) {
										return;
									}

									const rawContent =
										typeof statusUpdate.content === "string"
											? statusUpdate.content.trim()
											: "";
									if (
										isStrictToolFirstTurn &&
										shouldSuppressToolFirstIntentStatus({
											execution: toolFirstExecutionState,
											label,
											content: rawContent,
										})
									) {
										return;
									}
									const activity = sanitizeThinkingActivity(statusUpdate.activity);
									const source = sanitizeThinkingSource(statusUpdate.source);

									writer.write({
										type: "data-thinking-status",
										data: {
											label,
											content: rawContent.length > 0 ? rawContent : undefined,
											activity,
											source,
										},
									});
								},
									onThinkingEvent: (thinkingEvent) => {
										const sanitizedEvent = sanitizeThinkingEvent(thinkingEvent);
										if (!sanitizedEvent) {
											return;
										}
										recordToolThinkingEvent(
											toolFirstExecutionState,
											sanitizedEvent
										);
										if (sanitizedEvent.phase === "result") {
											recordToolObservation({
												phase: "result",
												toolName: sanitizedEvent.toolName,
												text:
													sanitizedEvent.outputPreview || sanitizedEvent.output,
												toolCallId: sanitizedEvent.toolCallId,
												source: "thinking_event",
												outputTruncated: sanitizedEvent.outputTruncated,
												outputBytes: sanitizedEvent.outputBytes,
											});
										} else if (sanitizedEvent.phase === "error") {
											recordToolObservation({
												phase: "error",
												toolName: sanitizedEvent.toolName,
												text:
													sanitizedEvent.errorText ||
													sanitizedEvent.outputPreview ||
													sanitizedEvent.output,
												toolCallId: sanitizedEvent.toolCallId,
												source: "thinking_event",
												outputTruncated: sanitizedEvent.outputTruncated,
												outputBytes: sanitizedEvent.outputBytes,
											});
										}

										writer.write({
											type: "data-thinking-event",
											id: sanitizedEvent.eventId,
										data: sanitizedEvent,
									});

										if (sanitizedEvent.subagentName) {
											const executionStatus =
												sanitizedEvent.phase === "error"
													? "failed"
													: sanitizedEvent.phase === "result"
														? "completed"
														: "working";
											const executionContent =
												sanitizedEvent.phase === "start"
													? sanitizedEvent.input
													: sanitizedEvent.errorText ||
														sanitizedEvent.outputPreview ||
														sanitizedEvent.output ||
														"";
											const taskId =
												getNonEmptyString(sanitizedEvent.subagentToolCallId) ||
												getNonEmptyString(sanitizedEvent.toolCallId) ||
												sanitizedEvent.eventId;
											writer.write({
												type: "data-agent-execution",
												id: `agent-execution-${taskId}`,
												data: {
													agentId: sanitizedEvent.subagentName,
													agentName: sanitizedEvent.subagentName,
													taskId,
													taskLabel: sanitizedEvent.toolName,
													status: executionStatus,
													content:
														typeof executionContent === "string" && executionContent.trim()
															? executionContent.trim()
															: undefined,
												},
											});
										}
								},
							};

							if (
								toolApprovalSubmission &&
								currentToolFirstAttempt === 1 &&
								!pausedToolApprovalBatchRecord &&
								!hasPausedToolApprovalBatch
							) {
								handleStreamTextDelta(
									"\n\n⚠️ The pending tool approval expired before it could be resumed. Please retry the step."
								);
								shouldContinueToolFirstRetry = false;
								continue;
							}

							if (pausedToolCallRecord) {
								const resumeDecisions =
									hasPausedClarificationToolCall && clarificationSubmission
										? [
											buildClarificationResumeDecision({
												clarificationSubmission,
												clarificationToolCallId: pausedToolCallRecord.toolCallId,
												setChatAccepted: false,
												buildDenyMessageFn: buildClarificationResumeDenyMessage,
											}),
										].filter(Boolean)
										: hasPausedApprovalToolCall && approvalSubmission
											? [
												{
													tool_call_id: pausedToolCallRecord.toolCallId,
													deny_message: buildApprovalResumeDecision(
														approvalSubmission
													),
												},
											]
											: [];

								if (resumeDecisions.length === 0) {
									throw new Error(
										`Paused tool continuation ${pausedToolCallRecord.toolCallId} is missing a resume decision.`,
									);
								}

								let replayCompleted = false;
								try {
									console.info("[CHAT-SDK] Resuming paused tool continuation", {
										threadId,
										runId: stageTrace.requestId,
										toolCallId: pausedToolCallRecord.toolCallId,
										kind: pausedToolCallRecord.kind,
										port: pausedToolCallRecord.port,
									});
									await rovoDevResumeToolCalls(pausedToolCallRecord.port, {
										decisions: resumeDecisions,
									});
									console.info("[DEBUG-PLAN-APPROVAL] Resume tool calls sent successfully", {
										port: pausedToolCallRecord.port,
										toolCallId: pausedToolCallRecord.toolCallId,
										kind: pausedToolCallRecord.kind,
										resumeDecisionCount: resumeDecisions.length,
									});

									await Promise.race([
										replayViaRovoDev({
											port: pausedToolCallRecord.port,
											portHandle: pausedToolCallRecord.handle,
											onTextDelta: streamCommonOptions.onTextDelta,
											onThinkingStatus: streamCommonOptions.onThinkingStatus,
											onThinkingEvent: streamCommonOptions.onThinkingEvent,
											onToolCallStart: streamCommonOptions.onToolCallStart,
											onToolCallInputResolved: streamCommonOptions.onToolCallInputResolved,
											onToolCallResult: streamCommonOptions.onToolCallResult,
											onWarning: streamCommonOptions.onWarning,
											onDeferredToolRequest: streamCommonOptions.onDeferredToolRequest,
											signal: streamCommonOptions.signal,
											onTimingStage: streamCommonOptions.onTimingStage,
											skipReplayUntilToolCallId: pausedToolCallRecord.toolCallId,
											onPausedToolCalls: async ({ rawEvent, control }) => {
												const pausedParts = Array.isArray(rawEvent?.parts)
													? rawEvent.parts
													: [];
												const interactivePart = pausedParts.find((part) => {
													const toolName = getNonEmptyString(part?.tool_name);
													return (
														isRequestUserInputTool(toolName) ||
														isExitPlanModeTool(toolName)
													);
												});

												if (!interactivePart) {
													const pausedApprovalResult =
														await handlePausedToolApprovalBatch({
															rawEvent,
															control,
														});
													if (pausedApprovalResult?.disconnect) {
														pausedToolCallHandled = true;
													}
													return pausedApprovalResult;
												}

												if (isRequestUserInputTool(interactivePart.tool_name)) {
													const decisions = pausedParts
														.map((part) => {
															const toolCallId = getNonEmptyString(part?.tool_call_id);
															return toolCallId
																? { tool_call_id: toolCallId, deny_message: null }
																: null;
														})
														.filter(Boolean);
													if (decisions.length > 0) {
														await control.resume({ decisions });
													}
													return { disconnect: false };
												}

												if (isExitPlanModeTool(interactivePart.tool_name)) {
													const decisions = pausedParts
														.map((part) => {
															const toolCallId = getNonEmptyString(part?.tool_call_id);
															return toolCallId
																? { tool_call_id: toolCallId, deny_message: null }
																: null;
														})
														.filter(Boolean);
													if (decisions.length > 0) {
														await control.resume({ decisions });
													}
													return { disconnect: false };
												}

												let pausedSessionId = rovoDevSessionId;
												let pausedSessionMode = sessionMode;
												if (threadId) {
													try {
														const synchronizedThread =
															await syncFutureChatThreadSessionFromCurrentPort(
																threadId,
																control.port,
																{ sessionMode },
															);
														pausedSessionId =
															getNonEmptyString(synchronizedThread?.sessionId)
															|| pausedSessionId;
														pausedSessionMode =
															synchronizedThread?.sessionMode === "ephemeral"
																? "ephemeral"
																: pausedSessionMode;
													} catch (error) {
														console.warn("[FUTURE-CHAT] Failed to sync thread session on deferred replay pause:", {
															threadId,
															port: control.port,
															error: error instanceof Error ? error.message : String(error),
														});
													}
												}
												registerPausedRovoDevToolCall({
													toolCallId: interactivePart.tool_call_id,
													port: control.port,
													handle: pausedToolCallRecord.handle,
													threadId,
													sessionId: pausedSessionId,
													sessionMode: pausedSessionMode,
													kind: isExitPlanModeTool(interactivePart.tool_name)
														? "plan-approval"
														: "clarification",
												});
												hasObservedDeferredToolRequest = true;
												pausedToolCallHandled = true;
												return { disconnect: true };
											},
										}),
									]);
									console.info("[CHAT-SDK] Paused tool continuation replay completed", {
										threadId,
										runId: stageTrace.requestId,
										toolCallId: pausedToolCallRecord.toolCallId,
										kind: pausedToolCallRecord.kind,
										port: pausedToolCallRecord.port,
									});
									replayCompleted = true;
								} finally {
									if (!pausedToolCallHandled) {
										if (!replayCompleted) {
											await rovoDevCancelChat(pausedToolCallRecord.port, {
												timeoutMs: 3_000,
											}).catch(() => {});
										}
										pausedToolCallRecord.handle?.release?.();
									}
								}
							} else if (pausedToolApprovalBatchRecord) {
								const resumeDecisions = buildToolApprovalResumeDecisions(
									toolApprovalSubmission,
									pausedToolApprovalBatchRecord.parts,
									{
										autoApproveToolCallIds:
											pausedToolApprovalBatchRecord.autoApproveToolCallIds,
									},
								);
								const resumedToolCallId = getNonEmptyString(
									pausedToolApprovalBatchRecord.parts[0]?.tool_call_id,
								);
								let replayCompleted = false;
								let pausedToolApprovalHandled = false;
								try {
									console.info("[CHAT-SDK] Resuming paused tool approval batch", {
										threadId,
										runId: stageTrace.requestId,
										approvalId: pausedToolApprovalBatchRecord.approvalId,
										port: pausedToolApprovalBatchRecord.port,
										decisionCount: resumeDecisions.length,
									});
									await rovoDevResumeToolCalls(pausedToolApprovalBatchRecord.port, {
										decisions: resumeDecisions,
									});

									await Promise.race([
										replayViaRovoDev({
											port: pausedToolApprovalBatchRecord.port,
											portHandle: pausedToolApprovalBatchRecord.handle,
											onTextDelta: streamCommonOptions.onTextDelta,
											onThinkingStatus: streamCommonOptions.onThinkingStatus,
											onThinkingEvent: streamCommonOptions.onThinkingEvent,
											onToolCallStart: streamCommonOptions.onToolCallStart,
											onToolCallInputResolved: streamCommonOptions.onToolCallInputResolved,
											onToolCallResult: streamCommonOptions.onToolCallResult,
											onWarning: streamCommonOptions.onWarning,
											onDeferredToolRequest: streamCommonOptions.onDeferredToolRequest,
											signal: streamCommonOptions.signal,
											onTimingStage: streamCommonOptions.onTimingStage,
											skipReplayUntilToolCallId: resumedToolCallId,
											onPausedToolCalls: async ({ rawEvent, control }) => {
												const pausedParts = Array.isArray(rawEvent?.parts)
													? rawEvent.parts
													: [];
												const interactivePart = pausedParts.find((part) => {
													const toolName = getNonEmptyString(part?.tool_name);
													return (
														isRequestUserInputTool(toolName) ||
														isExitPlanModeTool(toolName)
													);
												});

												if (!interactivePart) {
													const pausedApprovalResult =
														await handlePausedToolApprovalBatch({
															rawEvent,
															control,
														});
													if (pausedApprovalResult?.disconnect) {
														pausedToolApprovalHandled = true;
													}
													return pausedApprovalResult;
												}

												const decisions = pausedParts
													.map((part) => {
														const toolCallId = getNonEmptyString(part?.tool_call_id);
														return toolCallId
															? { tool_call_id: toolCallId, deny_message: null }
															: null;
													})
													.filter(Boolean);
												if (decisions.length > 0) {
													await control.resume({ decisions });
												}
												return { disconnect: false };
											},
										}),
									]);
									replayCompleted = true;
								} finally {
									if (!pausedToolApprovalHandled) {
										if (!replayCompleted) {
											await rovoDevCancelChat(pausedToolApprovalBatchRecord.port, {
												timeoutMs: 3_000,
											}).catch(() => {});
										}
										pausedToolApprovalBatchRecord.handle?.release?.();
									}
								}
							} else {
								await streamViaRovoDev({
									message: activeAttemptMessage,
									sessionId: rovoDevSessionId || undefined,
									...streamCommonOptions,
									// Plan approval fresh turns may hit a port with a
									// still-paused chat from the plan generation step.
									// Use cancel-and-retry with a custom cancel function
									// that resumes the paused tool call first (cancel alone
									// cannot unblock a deferred/paused tool call).
									...(approvalSubmission && approvalToolCallId ? {
										conflictPolicy: "cancel-and-retry",
										cancelConflictTurn: async (port) => {
											try {
												await rovoDevResumeToolCalls(port, {
													decisions: [{
														tool_call_id: approvalToolCallId,
														deny_message: "Plan approval superseded — starting fresh build turn.",
													}],
												});
											} catch {
												// Resume may fail if the tool call ID doesn't match — that's OK
											}
											await rovoDevCancelChat(port, { timeoutMs: 5_000 });
										},
									} : {}),
								});
							}
						} catch (rovoDevStreamError) {
							if (rovoDevStreamError?.code === "ROVODEV_PORT_STUCK") {
								// Port is stuck — try a single in-place restart and rerun
								// the exact request once before surfacing a user-facing
								// failure. This keeps rapid retry/new-thread flows from
								// dying before ask_user_questions can run.
								const recoveryPort =
									rovoDevStreamError.port ||
									resolvedRovoDevPort;
								let recoveryResult = null;

								if (typeof recoveryPort === "number" && recoveryPort > 0) {
									try {
										recoveryResult = await restartRovoDevPort({
											port: recoveryPort,
											cancelChat: rovoDevCancelChat,
											healthCheck: rovoDevHealthCheck,
											getListeningPidsForPort,
											refreshAvailability: refreshRovoDevAvailability,
											timeoutMs: INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS,
										});
										console.info("[CHAT-SDK] Port stuck recovery result", {
											port: recoveryPort,
											recovered: recoveryResult.recovered === true,
											killedPids: recoveryResult.killedPids,
											activePids: recoveryResult.activePids,
											error: recoveryResult.error,
										});
									} catch (recoveryErr) {
										console.error(
											"[CHAT-SDK] Port restart failed:",
											recoveryErr?.message || recoveryErr
										);
										recoveryResult = {
											recovered: false,
											error:
												recoveryErr instanceof Error
													? recoveryErr.message
													: String(recoveryErr ?? "Port restart failed"),
										};
									}
								}

								const recovered = recoveryResult?.recovered === true;
								const shouldRetryRecoveredPort =
									shouldRetryInteractiveStuckPortRecovery({
										aborted: abortController.signal.aborted,
										attemptCount: stuckPortRecoveryRetryCount,
										maxAttempts:
											INTERACTIVE_CHAT_STUCK_PORT_RECOVERY_RETRY_ATTEMPTS,
										recovered,
									});
								if (shouldRetryRecoveredPort) {
									stuckPortRecoveryRetryCount += 1;
									writer.write({
										type: "data-thinking-status",
										data: {
											label: "Recovered stuck port, retrying",
											content: `RovoDev port ${recoveryPort} restarted successfully.`,
											activity: "results",
											source: "backend",
										},
									});
									resetAssistantTextForRetryAttempt();
									continue;
								}

								const recoveryError =
									typeof recoveryResult?.error === "string" &&
									recoveryResult.error.trim().length > 0
										? recoveryResult.error.trim()
										: null;
								if (recoveryError) {
									writer.write({
										type: "data-thinking-status",
										data: {
											label: "Port recovery failed",
											content: recoveryError,
											activity: "results",
											source: "backend",
										},
									});
								}

								emitForcedTextDelta(
									`\n\n⚠️ ${buildInteractiveStuckPortFailureMessage({
										recoveryError,
										retriedRecovery: recovered,
									})}`
								);
								shouldContinueToolFirstRetry = false;
							} else if (rovoDevStreamError?.code === "ROVODEV_CHAT_IN_PROGRESS_TIMEOUT") {
								streamTimedOut = true;
								const resolvedRecoveryPort =
									typeof resolvedRovoDevPort === "number" && resolvedRovoDevPort > 0
										? resolvedRovoDevPort
										: null;
								const canForceRecoverPort =
									typeof resolvedRecoveryPort === "number" &&
									forcePortRecoveryAttemptCount <
										INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS;

								if (canForceRecoverPort) {
									forcePortRecoveryAttemptCount += 1;

									const recoveryResult = await restartRovoDevPort({
										port: resolvedRecoveryPort,
										cancelChat: rovoDevCancelChat,
										healthCheck: rovoDevHealthCheck,
										getListeningPidsForPort,
										refreshAvailability: refreshRovoDevAvailability,
										timeoutMs: INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS,
									});
									console.info("[CHAT-SDK] Forced per-port recovery result", {
										port: resolvedRecoveryPort,
										recovered: recoveryResult.recovered === true,
										killedPids: recoveryResult.killedPids,
										activePids: recoveryResult.activePids,
										error: recoveryResult.error,
									});

									if (recoveryResult.recovered) {
										writer.write({
											type: "data-thinking-status",
											data: {
												label: "Recovered stuck port, retrying",
												content: `RovoDev port ${resolvedRecoveryPort} restarted successfully.`,
												activity: "results",
												source: "backend",
											},
										});
										continue;
									}

									writer.write({
										type: "data-thinking-status",
										data: {
											label: "Port recovery failed",
											content:
												typeof recoveryResult.error === "string" &&
												recoveryResult.error.trim().length > 0
													? recoveryResult.error.trim()
													: `Failed to recover RovoDev port ${resolvedRecoveryPort}.`,
											activity: "results",
											source: "backend",
										},
									});
								}

								writer.write({
									type: "data-thinking-status",
									data: {
										label: "RovoDev turn wait timed out",
										content:
											"Automatic recovery timed out while waiting for the previous turn to clear.",
										activity: "results",
										source: "backend",
									},
								});
								handleStreamTextDelta(
									"\n\n⚠️ Automatic recovery timed out while waiting for the previous turn. Please retry or reset the chat."
								);
							} else {
								const errorMessage =
									rovoDevStreamError instanceof Error
										? rovoDevStreamError.message
										: String(rovoDevStreamError ?? "");
								const shouldRetryAsDeferredToolResponse =
									!hasRetriedAsDeferredToolResponse &&
									clarificationSubmission &&
									!hasPausedClarificationToolCall &&
									/pending deferred tool request/i.test(errorMessage);

								if (shouldRetryAsDeferredToolResponse) {
									const deferredToolResponse =
										synthesiseDeferredToolResponseFromClarification(
											clarificationSubmission,
											clarificationToolCallId,
											adaptClarificationAnswersForToolContract,
										);
									if (deferredToolResponse) {
										hasRetriedAsDeferredToolResponse = true;
										activeAttemptMessage = {
											message: deferredToolResponse,
											enableDeepPlan: false,
										};
										console.warn(
											"[CHAT-SDK] Clarification continuation hit pending deferred tool request; retrying with DeferredToolResponse",
											{
												threadId,
												toolCallId: clarificationToolCallId,
												sessionId: clarificationSubmission.sessionId ?? null,
											},
										);
										continue;
									}
								}

								throw rovoDevStreamError;
							}
						}

						if (streamTimedOut) {
							shouldContinueToolFirstRetry = false;
							continue;
						}

						const hasToolFirstSuccess = hasRelevantToolSuccess(
							toolFirstExecutionState
						);
							const canRetryToolFirst =
								toolFirstSoftRetryEnabled &&
								!abortController.signal.aborted &&
								!hasToolFirstSuccess &&
								!hasEmittedQuestionCard &&
								!hasObservedDeferredToolRequest &&
								currentToolFirstAttempt < totalToolFirstAttempts;
						if (!canRetryToolFirst) {
							shouldContinueToolFirstRetry = false;
							continue;
						}

						const retryNumber = currentToolFirstAttempt;
						const nextAttempt = currentToolFirstAttempt + 1;
						const retriesRemaining = Math.max(
							totalToolFirstAttempts - nextAttempt,
							0
						);
						const retryDelayMs = getToolFirstRetryDelayMs({
							policy: toolFirstPolicy,
							retryIndex: retryNumber - 1,
						});

						console.info("[TOOL-FIRST] Retrying tool-grounded response", {
							domains: toolFirstPolicy.domains,
							relevanceDomains: toolFirstRelevanceDomains,
							attempt: nextAttempt,
							maxAttempts: totalToolFirstAttempts,
							retryDelayMs,
							relevantToolStarts: toolFirstExecutionState.relevantToolStarts,
							relevantToolResults: toolFirstExecutionState.relevantToolResults,
							relevantToolErrors: toolFirstExecutionState.relevantToolErrors,
						});
						writer.write({
							type: "data-thinking-status",
							data: {
								label: `Retrying integration tools (${nextAttempt}/${totalToolFirstAttempts})`,
								activity: "results",
								source: "backend",
							},
						});
						resetAssistantTextForRetryAttempt();

						if (retryDelayMs > 0) {
							await waitForRetryDelay(retryDelayMs);
						}
						if (abortController.signal.aborted) {
							shouldContinueToolFirstRetry = false;
							continue;
						}

						activeAttemptMessage = {
							message: `${userMessageText}\n\n${buildToolFirstRetryInstruction(
								{
									policy: toolFirstPolicy,
									attemptNumber: nextAttempt,
									remainingRetries: retriesRemaining,
									execution: toolFirstExecutionState,
								}
							)}`,
							enableDeepPlan: false,
						};
						currentToolFirstAttempt = nextAttempt;
					}


				processTextBuffer(true);
				maybeEmitProgressivePlanUpdate();

				const leakedClassifierPayload = finalizeBufferedAssistantText();
				if (leakedClassifierPayload) {
					console.warn("[CHAT-SDK] Suppressed classifier-style JSON response", {
						intent: leakedClassifierPayload.intent,
						confidence: leakedClassifierPayload.confidence,
						reason: leakedClassifierPayload.reason,
					});
					let repairedResponseText = null;

					try {
						const retryText = await generateTextViaGateway({
							system:
								"You are a helpful assistant. Respond directly to the user request in normal prose. Never output router JSON metadata such as {\"intent\":...}.",
							prompt: userMessageText,
							maxOutputTokens: 1200,
							temperature: 0.6,
							...buildSmartGenerationGatewayOptions({
								provider,
							}),
						});
						const normalizedRetryText = getNonEmptyString(retryText);
						if (
							normalizedRetryText &&
							!parseClassifierIntentPayload(normalizedRetryText)
						) {
							repairedResponseText = normalizedRetryText;
						}
					} catch (retryError) {
						console.error(
							"[CHAT-SDK] Failed to recover from classifier-style JSON leak:",
							retryError
						);
					}

					if (!repairedResponseText) {
						repairedResponseText =
							"I had an internal routing issue while generating that response. Please try again and I will answer directly.";
					}

					assistantText = repairedResponseText;
					emitTextDeltaRaw(repairedResponseText);
				}

				// Skip post-stream work if the client disconnected
				if (abortController.signal.aborted) {
					if (textStarted) {
						writer.write({ type: "text-end", id: textId });
					}
					return;
				}

				// ── Phase 2: Direct RovoDev spec detection ──
				// When enabled, check if RovoDev already emitted a valid
				// ```spec fence in its text output. If found, emit it as a
				// GenUI widget directly — skipping the second-pass GenUI
				// LLM call entirely.
				// Suppressed during plan execution — outputs route to the
				// artifact panel instead.
				if (
					!hasEmittedGenuiWidget &&
					!hasEmittedQuestionCard &&
					!hasEmittedPlanWidget &&
					!isPlanExecutionPhase(threadId)
				) {
					const directSpecResult = extractDirectSpec(
						hasSuppressedLargeAssistantJson ? unsuppressedAssistantText : assistantText
					);
					if (directSpecResult?.spec) {
						const directSpecWidgetId = `widget-direct-spec-${Date.now()}`;
						for (const part of buildDirectSpecWidgetParts({
							latestUserMessage,
							narrative: directSpecResult.narrative,
							requestOrigin,
							spec: directSpecResult.spec,
							widgetId: directSpecWidgetId,
							widgetType: SMART_WIDGET_TYPE_GENUI,
						})) {
							writer.write(part);
						}
						hasEmittedGenuiWidget = true;
						console.info("[DIRECT-SPEC] Emitted GenUI widget from RovoDev spec fence", {
							elementCount: Object.keys(directSpecResult.spec.elements || {}).length,
							narrativeLength: (directSpecResult.narrative || "").length,
						});
					}

					// ── Phase 3: Direct RovoDev media fence detection ──
					// When enabled, check if RovoDev emitted ```image or
					// ```audio fences. If found, emit them as artifact
					// widgets so the backend can route to the appropriate
					// generation service (AI Gateway / TTS).
					const imageFenceMatch = assistantText.match(/```image\s*\n([\s\S]*?)```/i);
					const audioFenceMatch = assistantText.match(/```audio\s*\n([\s\S]*?)```/i);

					if (imageFenceMatch) {
						try {
							const imagePayload = JSON.parse(imageFenceMatch[1].trim());
							const imageWidgetId = `widget-direct-image-${Date.now()}`;
							writer.write({
								type: "data-widget-loading",
								id: imageWidgetId,
								data: { type: SMART_WIDGET_TYPE_IMAGE, loading: true },
							});
							writer.write({
								type: "data-thinking-status",
								data: {
									label: "Generating image",
									activity: "image",
									source: "backend",
								},
							});

							try {
								const imageGatewayConfig = resolveGoogleImageGatewayConfig({
									envVars: getEnvVars(),
									requestedModel: rawModel,
									resolveGatewayUrl,
									detectEndpointType,
								});
								if (imageGatewayConfig.ok) {
									const generatedImages = [];
									await streamGoogleGatewayManualSse({
										gatewayUrl: imageGatewayConfig.gatewayUrl,
										envVars: imageGatewayConfig.envVars,
										model: imageGatewayConfig.model,
										prompt: imagePayload.prompt || latestUserMessage,
										maxOutputTokens: 1800,
										temperature: 1,
										responseModalities: ["image"],
										signal: abortController.signal,
										onFile: ({ mediaType, base64 }) => {
											if (typeof base64 !== "string" || base64.length === 0) return;
											const resolvedMediaType = typeof mediaType === "string" && mediaType.trim()
												? mediaType : "image/png";
											generatedImages.push({
												url: `data:${resolvedMediaType};base64,${base64}`,
												mimeType: resolvedMediaType,
											});
											writer.write({
												type: "data-widget-data",
												id: imageWidgetId,
												data: {
													type: SMART_WIDGET_TYPE_IMAGE,
													payload: {
														images: [...generatedImages],
														prompt: imagePayload.prompt || latestUserMessage,
														source: "direct-rovodev-image",
													},
												},
											});
										},
									});
								}
							} catch (imageError) {
								console.error("[DIRECT-IMAGE] Image generation failed:", imageError?.message || imageError);
								writer.write({
									type: "data-widget-error",
									id: imageWidgetId,
									data: {
										type: SMART_WIDGET_TYPE_IMAGE,
										message: "Image generation failed.",
										canRetry: true,
									},
								});
							}
							writer.write({
								type: "data-widget-loading",
								id: imageWidgetId,
								data: { type: SMART_WIDGET_TYPE_IMAGE, loading: false },
							});
							console.info("[DIRECT-IMAGE] Processed image fence from RovoDev", {
								prompt: (imagePayload.prompt || "").slice(0, 80),
							});
						} catch (parseError) {
							console.warn("[DIRECT-IMAGE] Failed to parse image fence JSON:", parseError?.message);
						}
					}

					if (audioFenceMatch) {
						try {
							const audioPayload = JSON.parse(audioFenceMatch[1].trim());
							const audioWidgetId = `widget-direct-audio-${Date.now()}`;
							writer.write({
								type: "data-widget-loading",
								id: audioWidgetId,
								data: { type: SMART_WIDGET_TYPE_AUDIO, loading: true },
							});
							writer.write({
								type: "data-thinking-status",
								data: {
									label: "Generating audio",
									activity: "audio",
									source: "backend",
								},
							});

							try {
								const synthesisResult = await synthesizeSound({
									input: audioPayload.text,
									provider: "google",
									model: "tts-latest",
									responseFormat: "mp3",
								});
								writer.write({
									type: "data-widget-data",
									id: audioWidgetId,
									data: {
										type: SMART_WIDGET_TYPE_AUDIO,
										payload: {
											audioUrl: buildAudioDataUrl(
												synthesisResult.audioBytes,
												synthesisResult.contentType
											),
											mimeType: synthesisResult.contentType,
											transcript: audioPayload.text,
											source: "direct-rovodev-audio",
										},
									},
								});
							} catch (audioError) {
								console.error("[DIRECT-AUDIO] Audio generation failed:", audioError?.message || audioError);
								writer.write({
									type: "data-widget-error",
									id: audioWidgetId,
									data: {
										type: SMART_WIDGET_TYPE_AUDIO,
										message: "Audio generation failed.",
										canRetry: true,
									},
								});
							}
							writer.write({
								type: "data-widget-loading",
								id: audioWidgetId,
								data: { type: SMART_WIDGET_TYPE_AUDIO, loading: false },
							});
							console.info("[DIRECT-AUDIO] Processed audio fence from RovoDev", {
								textLength: (audioPayload.text || "").length,
							});
						} catch (parseError) {
							console.warn("[DIRECT-AUDIO] Failed to parse audio fence JSON:", parseError?.message);
						}
					}

					if (imageFenceMatch || audioFenceMatch) {
						assistantText = stripDirectMediaFences(assistantText);
					}
				}

				if (
					QUESTION_CARD_TEXT_EXTRACTION_FALLBACK_ENABLED &&
					!hasEmittedQuestionCard &&
					!hasEmittedPlanWidget
				) {
					const previousQuestionCard = getActiveQuestionCardPayload(messages);
					const fallbackQuestionCardState = resolveFallbackQuestionCardState({
						isPostClarificationTurn,
						clarificationSubmission,
						previousQuestionCard,
						fallbackSessionId: buildPlanningQuestionCardSessionId(planRequestId),
						maxRounds: CLARIFICATION_MAX_ROUNDS,
					});
					if (fallbackQuestionCardState.canEmit) {
						const fallbackQuestionCardPayload =
							extractQuestionCardPayloadFromAssistantText(assistantText, {
								sessionId: fallbackQuestionCardState.sessionId,
								round: fallbackQuestionCardState.round,
								maxRounds: fallbackQuestionCardState.maxRounds,
								title: "Help me clarify what you need",
								description:
									"Answer these questions so I can build a better plan.",
							});
						if (fallbackQuestionCardPayload) {
							const fallbackWidgetId = `question-card-fallback-${Date.now()}`;
							hasEmittedQuestionCard = true;
							writer.write({
								type: "data-widget-loading",
								id: fallbackWidgetId,
								data: {
									type: CLARIFICATION_WIDGET_TYPE,
									loading: true,
								},
							});
							writer.write({
								type: "data-widget-data",
								id: fallbackWidgetId,
								data: {
									type: CLARIFICATION_WIDGET_TYPE,
									payload: fallbackQuestionCardPayload,
								},
							});
							writer.write({
								type: "data-widget-loading",
								id: fallbackWidgetId,
								data: {
									type: CLARIFICATION_WIDGET_TYPE,
									loading: false,
								},
							});

							// BE-005 / BE-009: Emit route-decision for fallback question card
							writer.write(createRouteDecisionPart({
								intent: "chat",
								origin: requestOrigin,
								reason: "intent_clarification",
							}));

							console.info("[OUTPUT-ROUTING] Question card emitted via fallback extraction", {
								reason: "intent_clarification",
								experience: "question_card",
								sessionId: fallbackQuestionCardPayload.sessionId,
								round: fallbackQuestionCardPayload.round,
								questionCount: Array.isArray(fallbackQuestionCardPayload.questions)
									? fallbackQuestionCardPayload.questions.length
									: 0,
								source: "text_extraction_fallback",
							});
						}
					}
				}

					if (!hasExplicitPlanPayload) {
						const updateTodoPlanPayload =
							extractUpdateTodoPlanPayloadFromObservations(toolObservationEntries);

						if (updateTodoPlanPayload) {
							if (planWidgetRequiresApproval(latestPlanPayload)) {
								const mergedPlanPayload = mergePlanWidgetPayloadTasks(
									latestPlanPayload,
									updateTodoPlanPayload
								);
								const existingPlanTaskCount = getPlanWidgetTaskCount(latestPlanPayload);
								const mergedPlanTaskCount = getPlanWidgetTaskCount(mergedPlanPayload);
								const shouldUpgradePlanPayload =
									mergedPlanPayload &&
									mergedPlanTaskCount > 0 &&
									(
										!hasEmittedPlanWidget ||
										mergedPlanTaskCount >= existingPlanTaskCount
									);

								if (shouldUpgradePlanPayload) {
									latestPlanPayload = mergedPlanPayload;
									hasEmittedPlanWidget = true;
									emitPlanWidgetData(mergedPlanPayload);
								}
							}
						}
					}

					if (hasToolApprovalReadonlyFailure) {
						emitWidgetError({
							type: "tool-approval",
							message:
								toolApprovalReadonlyFailureMessage ||
								"Write tools remained blocked after approval. Check the RovoDev filesystem tool permissions.",
							canRetry: true,
						});
					}

					const shouldEmitPlanWidgetError =
						hasSeenPlanWidgetSignal &&
						!hasEmittedPlanWidget;
				if (shouldEmitPlanWidgetError) {
					if (hasEmittedPlanLoadingState) {
						emitPlanWidgetLoading(false);
					}

					emitWidgetError({
						type: "plan",
						message:
							"I couldn't finish building the plan card. Retry and I'll regenerate it.",
						canRetry: true,
					});
				}

				if (
					hasEmittedPlanWidget &&
					!hasExplicitPlanPayload &&
					hasEmittedPlanLoadingState
				) {
					emitPlanWidgetLoading(false);
				}

				// Generate mermaid fallback if plan widget was emitted but no dependency map.
				if (latestPlanPayload !== null && !hasValidMermaidDiagram(assistantText)) {
					const fallbackMermaid = generateMermaidFromPlan(latestPlanPayload);
					if (fallbackMermaid) {
						if (hasUnclosedMermaidFence(assistantText)) {
							emitTextDelta("\n```");
						}

						const prefix = assistantText.trim().length > 0 ? "\n\n" : "";
						emitTextDelta(`${prefix}${fallbackMermaid}`);
					}
				}

				// ── Output Routing: Two-step GenUI flow (BE-001, BE-007) ──
				// Trigger GenUI only for task-like prompts. Conversational and
				// capability chat should always stay in text streaming mode.
					const trimmedAssistantText = assistantText.trim();
					const getRouteToolsDetected = () => {
						if (!isStrictToolFirstTurn) {
							return hasObservedActionableToolCall || hasToolObservationEntries();
						}

						return (
							hasObservedRelevantActionableToolCall ||
							hasRelevantToolObservation(toolFirstExecutionState)
						);
					};
					const resolveRouteWidgetContentType = () =>
						resolveToolFirstWidgetContentType({
							primaryDomains: toolFirstPolicy.domains,
							relevanceDomains: toolFirstPolicy.relevanceDomains,
							lastRelevantToolName: toolFirstExecutionState.lastRelevantToolName,
							prompt: latestUserMessage,
						});
					const resolveRouteWidgetSource = () =>
						resolveToolFirstWidgetSource({
							primaryDomains: toolFirstPolicy.domains,
							relevanceDomains: toolFirstPolicy.relevanceDomains,
							lastRelevantToolName: toolFirstExecutionState.lastRelevantToolName,
							prompt: latestUserMessage,
						});
					const withRouteWidgetContentType = (payload) => {
						const widgetContentType = resolveRouteWidgetContentType();
						const widgetSource = resolveRouteWidgetSource();
						if (!widgetContentType && !widgetSource) {
							return payload;
						}

						const nextPayload = { ...payload };
						if (widgetContentType) {
							nextPayload.widgetContentType = widgetContentType;
						}

						if (widgetSource) {
							const currentSource = isPlainObject(payload?.source)
								? payload.source
								: null;
							const currentName = getNonEmptyString(currentSource?.name);
							const currentLogoSrc = getNonEmptyString(currentSource?.logoSrc);

							nextPayload.source = {
								name: currentName || widgetSource.name,
								...(currentLogoSrc || widgetSource.logoSrc
									? { logoSrc: currentLogoSrc || widgetSource.logoSrc }
									: {}),
							};
						}

						return {
							...nextPayload,
						};
					};
					const emitAutomaticPostToolGenuiWidget = async ({
						widgetId,
					}) => {
						try {
							// FAST PATH: try bespoke handlers before the LLM call
							const bespokeResult = dispatchBespokeGenuiHandler({
								observations: toolObservationEntries,
								prompt: latestVisibleUserMessage?.text,
							});
							if (bespokeResult) {
								console.info("[OUTPUT-ROUTING] Bespoke GenUI handler matched", {
									source: bespokeResult.source,
									observationCount: bespokeResult.observationCount,
								});
								writer.write({
									type: "data-widget-data",
									id: widgetId,
									data: {
										type: SMART_WIDGET_TYPE_GENUI,
										payload: withRouteWidgetContentType({
											spec: bespokeResult.spec,
											summary: bespokeResult.summary,
											source: bespokeResult.source,
										}),
									},
								});
								hasEmittedGenuiWidget = true;
								writer.write(createRouteDecisionPart({
									intent: "genui",
									origin: requestOrigin,
									reason: "intent_task_toolable",
								}));
								return {
									emittedWidget: true,
									failureCode: null,
								};
							}

							// SLOW PATH: LLM call to generate spec from catalog
							const roleMessages = mapUiMessagesToRoleContent(messages);
							const genuiAssistantContent = hasSuppressedLargeAssistantJson
								? buildGenuiAssistantContentWithToolContext({
									fullText: unsuppressedAssistantText,
									observations: toolObservationEntries,
									maxObservationItems: 6,
								})
								: assistantText;
							const genuiResult = await generateSmartGenuiResult({
								roleMessages: [...roleMessages, { role: "assistant", content: genuiAssistantContent || assistantText }],
								provider,
								layoutContext: smartLayoutContext,
								signal: abortController.signal,
							});
							const summaryText = getNonEmptyString(genuiResult?.narrative);
							const conciseSummary = summaryText
								? summaryText.length > 280
									? `${summaryText.slice(0, 279)}...`
									: summaryText
								: "Generated interactive view";
							const outcome = resolveAutomaticGenuiOutcome({
								genuiResult,
								successSource: "two-step-genui-llm-default",
								successSummary: conciseSummary,
							});

							if (outcome.kind === "widget") {
								writer.write({
									type: "data-widget-data",
									id: widgetId,
									data: {
										type: SMART_WIDGET_TYPE_GENUI,
										payload: withRouteWidgetContentType({
											spec: outcome.spec,
											summary: outcome.summary,
											source: outcome.source,
										}),
									},
								});
								hasEmittedGenuiWidget = true;
								writer.write(createRouteDecisionPart({
									intent: "genui",
									origin: requestOrigin,
									reason: "intent_task_toolable",
								}));
								return {
									emittedWidget: true,
									failureCode: null,
								};
							}

							return {
								...emitAutomaticGenuiFailure({
									widgetId,
									message: outcome.message,
								}),
								failureCode: outcome.code,
							};
						} catch (llmDefaultError) {
							console.warn(
								"[OUTPUT-ROUTING] Two-step LLM default GenUI generation failed:",
								llmDefaultError
							);
							return {
								...emitAutomaticGenuiFailure({
									widgetId,
									message:
										"I couldn't render the interactive summary from tool output. Retry and I'll try again.",
								}),
								failureCode: "generic_genui_exception",
							};
						}
					};
					if (!isStrictToolFirstTurn) {
						const hasToolObservationData = hasToolObservationEntries();
						const looksLikeClarification = looksLikeClarificationResponse(trimmedAssistantText);
						const looksLikeInability = looksLikeInabilityResponse(trimmedAssistantText);
						const readonlyBlockedWriteToolNames =
							getReadonlyBlockedWriteToolNames(toolObservationEntries);
						const looksLikeWriteBlockedFailure = looksLikeWriteBlockedTurn({
							assistantText: trimmedAssistantText,
							toolObservationEntries,
						});
						if (looksLikeClarification && !hasEmittedQuestionCard) {
							console.info("[OUTPUT-ROUTING] Clarification-like response detected, skipping GenUI", {
								textLength: trimmedAssistantText.length,
							});
					}
						if (looksLikeInability) {
							console.info("[OUTPUT-ROUTING] Inability response detected, skipping GenUI", {
								textLength: trimmedAssistantText.length,
							});
						}
						if (looksLikeWriteBlockedFailure) {
							console.info("[OUTPUT-ROUTING] Write-blocked turn detected, skipping GenUI", {
								threadId,
								toolNames: readonlyBlockedWriteToolNames,
								textLength: trimmedAssistantText.length,
							});
						}
				const planExecutionActive = isPlanExecutionPhase(threadId);
					const shouldAttemptGenui = shouldAttemptPostToolGenui({
						assistantText: trimmedAssistantText,
						hasEmittedQuestionCard,
						hasEmittedPlanWidget,
						hasEmittedGenuiWidget,
						looksLikeClarification,
						looksLikeInability: looksLikeInability || looksLikeWriteBlockedFailure,
						resolvedPlanModeActive,
						planSessionActive: planExecutionActive,
						isAborted: abortController.signal.aborted,
						isTaskLikeRequest,
						shouldForceCardFirstGenui,
						hasObservedActionableToolCall,
						hasToolObservationData,
					});

					if (
						!resolvedPlanModeActive &&
						!planExecutionActive &&
						!hasPendingToolApprovalPrompt &&
						shouldAttemptGenui
					) {
						// Single-pass GenUI: RovoDev emits ```spec blocks directly.
						// Phase 2 (direct spec detection above) already caught any
						// spec fence in the response. If we reach here, no spec was
						// emitted — try the generic catalog-based GenUI path.
						const genuiFallbackWidgetId = `widget-genui-fallback-${Date.now()}`;
						writer.write({
							type: "data-widget-loading",
							id: genuiFallbackWidgetId,
							data: {
								type: SMART_WIDGET_TYPE_GENUI,
								loading: true,
							},
						});

						console.info("[OUTPUT-ROUTING] Single-pass GenUI: no spec fence from RovoDev, trying generic GenUI", {
							hasActionableTools: hasObservedActionableToolCall,
							taskLikeRequest: isTaskLikeRequest,
							rovodevTextLength: trimmedAssistantText.length,
							toolObservationCount: toolObservationEntries.length,
							forceCardFirst: shouldForceCardFirstGenui,
						});

						const roleMessages = mapUiMessagesToRoleContent(messages);
						const emittedCreateIntentWidget =
							await tryEmitCreateIntentDirectGenuiWidget({
								widgetId: genuiFallbackWidgetId,
								roleMessages,
								source: "single-pass-genui-fallback",
							});
						if (emittedCreateIntentWidget) {
							writer.write(createRouteDecisionPart({
								intent: "genui",
								origin: requestOrigin,
								reason: "intent_task_toolable",
							}));
						} else {
							await emitAutomaticPostToolGenuiWidget({
								widgetId: genuiFallbackWidgetId,
							});
						}

						writer.write({
							type: "data-widget-loading",
							id: genuiFallbackWidgetId,
							data: {
								type: SMART_WIDGET_TYPE_GENUI,
								loading: false,
							},
						});
						} else if (
							!resolvedPlanModeActive &&
							!planExecutionActive &&
							!hasPendingToolApprovalPrompt &&
							!hasEmittedQuestionCard &&
							!hasEmittedGenuiWidget
						) {
							if (looksLikeWriteBlockedFailure) {
								emitBufferedAssistantTextForTextRoute();
								writer.write(createRouteDecisionPart({
									intent: "chat",
									origin: requestOrigin,
									reason: "tool_blocked_text_only",
								}));
							} else {
								const shouldEmitCardFirstFallback =
									shouldForceCardFirstGenui &&
									trimmedAssistantText.length > 0 &&
									!looksLikeClarification &&
									!looksLikeInability;
								const shouldEmitObservationFallback = hasToolObservationData;
								if (shouldEmitCardFirstFallback || shouldEmitObservationFallback) {
									const twoStepGenuiWidgetId = `widget-two-step-genui-${Date.now()}`;
									writer.write({
										type: "data-widget-loading",
										id: twoStepGenuiWidgetId,
										data: {
											type: SMART_WIDGET_TYPE_GENUI,
											loading: true,
										},
									});
									await emitAutomaticPostToolGenuiWidget({
										widgetId: twoStepGenuiWidgetId,
									});
									writer.write({
										type: "data-widget-loading",
										id: twoStepGenuiWidgetId,
										data: {
											type: SMART_WIDGET_TYPE_GENUI,
											loading: false,
										},
									});
								} else {
									// Short conversational reply or empty -> plain text route
									emitBufferedAssistantTextForTextRoute();
									writer.write(createRouteDecisionPart({
										intent: "chat",
										origin: requestOrigin,
										reason: "intent_text_default",
									}));
								}
							}
						}
					}
					// Question card route-decision is emitted at the point of
					// emission (emitRequestUserInputQuestionCard or fallback
					// extraction), so no additional emission is needed here.

					const strictRelevantToolObservationEntries = isStrictToolFirstTurn
						? toolObservationEntries.filter((entry) =>
							isToolNameRelevant({
								toolName: entry?.toolName,
								domains: toolFirstRelevanceDomains,
							})
						)
						: toolObservationEntries;

					if (
						isStrictToolFirstTurn &&
						!planExecutionActive &&
						!hasEmittedQuestionCard &&
						!hasEmittedPlanWidget
					) {
							let toolFirstRouteReason = "tool_first_no_relevant_result";
							let toolFirstRouteExperience = "text";
							let toolFirstFallbackCause = null;
							if (hasRelevantToolSuccess(toolFirstExecutionState)) {
							removeToolFirstFailureNarrative();
							const toolFirstSummaryPrefix =
								assistantText.trim().length > 0 ? "\n\n" : "";
							const toolFirstGenuiWidgetId = `widget-tool-first-genui-${Date.now()}`;
							writer.write({
								type: "data-widget-loading",
								id: toolFirstGenuiWidgetId,
								data: {
									type: SMART_WIDGET_TYPE_GENUI,
									loading: true,
								},
							});

							try {
								// FAST PATH: try bespoke handlers before the LLM call
								const bespokeResult = dispatchBespokeGenuiHandler({
									observations: strictRelevantToolObservationEntries,
									prompt: latestVisibleUserMessage?.text,
								});
								if (bespokeResult) {
									console.info("[TOOL-FIRST] Bespoke GenUI handler matched", {
										source: bespokeResult.source,
										observationCount: bespokeResult.observationCount,
									});
									writer.write({
										type: "data-widget-data",
										id: toolFirstGenuiWidgetId,
										data: {
											type: SMART_WIDGET_TYPE_GENUI,
											payload: withRouteWidgetContentType({
												spec: bespokeResult.spec,
												summary: bespokeResult.summary,
												source: bespokeResult.source,
											}),
										},
									});
									hasEmittedGenuiWidget = true;
									toolFirstRouteReason = "intent_task_toolable";
									toolFirstRouteExperience = "generative_ui";
									emitForcedTextDelta(
										`${toolFirstSummaryPrefix}${bespokeResult.summary}`
									);
								} else {
								// SLOW PATH: LLM call to generate spec from catalog
								const roleMessages = mapUiMessagesToRoleContent(messages);
								const toolContextForGenui = buildToolContextForGenui({
									policy: toolFirstPolicy,
									execution: toolFirstExecutionState,
									assistantText,
									toolOutputs: toolFirstFullOutputs,
								});
								const roleMessagesForGenui = Array.isArray(roleMessages)
									? [...roleMessages]
									: [];
								if (toolContextForGenui) {
									roleMessagesForGenui.push({
										role: "assistant",
										content: toolContextForGenui,
									});
								}

								const genuiResult = await generateSmartGenuiResult({
									roleMessages: roleMessagesForGenui,
									provider,
									layoutContext: smartLayoutContext,
									signal: abortController.signal,
								});

								const narrativeSummary = getNonEmptyString(
									genuiResult.narrative
								);
								const conciseSummary = narrativeSummary
									? narrativeSummary.length > 320
										? `${narrativeSummary.slice(0, 319)}…`
										: narrativeSummary
									: null;
								const renderedSummary =
									conciseSummary ||
									"Generated a visual summary from tool context below.";
								const outcome = resolveAutomaticGenuiOutcome({
									genuiResult,
									successSource: "tool-first-genui",
									successSummary: renderedSummary,
								});

								console.info("[TOOL-FIRST] Generic GenUI result", {
									observationCount: strictRelevantToolObservationEntries.length,
									outcomeKind: outcome.kind,
									outcomeCode: outcome.kind === "failure" ? outcome.code : null,
									reasons: genuiResult.analysisSummary?.reasons ?? [],
								});

								if (outcome.kind === "widget") {
									const renderedSummary =
										outcome.summary ||
										"Generated a visual summary from tool context below.";
									writer.write({
										type: "data-widget-data",
										id: toolFirstGenuiWidgetId,
										data: {
											type: SMART_WIDGET_TYPE_GENUI,
											payload: withRouteWidgetContentType({
												spec: outcome.spec,
												summary: renderedSummary,
												source: outcome.source,
											}),
										},
									});
									hasEmittedGenuiWidget = true;
									toolFirstRouteReason = "intent_task_toolable";
									toolFirstRouteExperience = "generative_ui";

									emitForcedTextDelta(
										`${toolFirstSummaryPrefix}${renderedSummary}`
									);
									} else {
										toolFirstRouteReason = "tool_first_visual_fallback";
										toolFirstFallbackCause = outcome.code;
										emitAutomaticGenuiFailure({
											widgetId: toolFirstGenuiWidgetId,
											message: outcome.message,
										});
										emitForcedTextDelta(
											`${toolFirstSummaryPrefix}${outcome.message}`
										);
									}
								} // end of bespoke else → LLM path
								} catch (toolFirstGenuiError) {
									console.error(
										"[TOOL-FIRST] Post-tool GenUI generation failed:",
										toolFirstGenuiError
									);
									toolFirstRouteReason = "tool_first_visual_fallback";
									toolFirstFallbackCause =
										toolFirstGenuiError instanceof Error
											? toolFirstGenuiError.message
											: "tool-first-genui-error";
									const failure = emitAutomaticGenuiFailure({
										widgetId: toolFirstGenuiWidgetId,
										message:
											"I couldn't render the interactive summary from tool output. Retry and I'll try again.",
									});
									emitForcedTextDelta(
										`${toolFirstSummaryPrefix}${failure.message}`
									);
								} finally {
								writer.write({
									type: "data-widget-loading",
									id: toolFirstGenuiWidgetId,
									data: {
										type: SMART_WIDGET_TYPE_GENUI,
										loading: false,
									},
								});
							}
							} else if (looksLikeInabilityResponse(assistantText.trim())) {
								console.info("[TOOL-FIRST] Inability response detected, skipping GenUI fallback card", {
									textLength: assistantText.trim().length,
								});
								toolFirstRouteReason = "tool_first_inability_detected";
								toolFirstRouteExperience = "text";
							} else {
								let emittedCreateIntentWidget = false;
								if (isCreateIntentRequestPrompt) {
									const toolFirstCreateWidgetId = `widget-tool-first-genui-${Date.now()}`;
									writer.write({
										type: "data-widget-loading",
										id: toolFirstCreateWidgetId,
										data: {
											type: SMART_WIDGET_TYPE_GENUI,
											loading: true,
										},
									});
									const roleMessages = mapUiMessagesToRoleContent(messages);
									emittedCreateIntentWidget =
										await tryEmitCreateIntentDirectGenuiWidget({
											widgetId: toolFirstCreateWidgetId,
											roleMessages,
											source:
												"create-intent-direct-genui-without-relevant-tool-success",
										});
									writer.write({
										type: "data-widget-loading",
										id: toolFirstCreateWidgetId,
										data: {
											type: SMART_WIDGET_TYPE_GENUI,
											loading: false,
										},
									});
								}

								if (emittedCreateIntentWidget) {
									toolFirstRouteReason = "intent_task_toolable";
									toolFirstRouteExperience = "generative_ui";
									toolFirstFallbackCause =
										"create_intent_direct_genui_without_relevant_tool_success";
								} else {
									removeToolFirstFailureNarrative();
									if (isWorkSummary) {
										const recoverySpec = buildZeroToolCallRecoverySpec(
											toolFirstExecutionState,
											{ policy: toolFirstPolicy }
										);
										if (recoverySpec) {
											const recoveryWidgetId = `widget-work-summary-recovery-${Date.now()}`;
											writer.write({
												type: "data-widget-loading",
												id: recoveryWidgetId,
												data: {
													type: SMART_WIDGET_TYPE_GENUI,
													loading: true,
												},
											});
											writer.write({
												type: "data-widget-data",
												id: recoveryWidgetId,
												data: {
													type: SMART_WIDGET_TYPE_GENUI,
													payload: withRouteWidgetContentType({
														spec: recoverySpec,
														summary: recoverySpec.title,
														source: "work-summary-zero-tool-recovery",
													}),
												},
											});
											writer.write({
												type: "data-widget-loading",
												id: recoveryWidgetId,
												data: {
													type: SMART_WIDGET_TYPE_GENUI,
													loading: false,
												},
											});
											hasEmittedGenuiWidget = true;
											toolFirstRouteReason = "intent_task_toolable";
											toolFirstRouteExperience = "generative_ui";
											toolFirstFallbackCause = "work_summary_zero_tool_call_recovery";
											console.info("[work-summary] Emitted zero-tool-call recovery spec", {
												cause: recoverySpec.cause,
												optionCount: recoverySpec.recoveryOptions.length,
											});
										}
									}
									if (!hasEmittedGenuiWidget) {
										const warningText = buildToolFirstTextFallback({
											policy: toolFirstPolicy,
											execution: toolFirstExecutionState,
											rovoDevFallback: false,
										});
										const toolFirstWarningPrefix =
											assistantText.trim().length > 0 ? "\n\n" : "";
										emitForcedTextDelta(`${toolFirstWarningPrefix}${warningText}`);
										toolFirstFallbackCause = "no_relevant_tool_success";
									}
								}
							}

						const resolvedToolFirstFallbackCause = (() => {
							const fallbackCause =
								typeof toolFirstFallbackCause === "string" &&
								toolFirstFallbackCause.trim().length > 0
									? toolFirstFallbackCause
									: null;
							const teamworkGraphTimeWindowActive =
								toolFirstPolicy?.teamworkGraphTimeWindow?.enabled === true;
							if (!teamworkGraphTimeWindowActive) {
								return fallbackCause;
							}

							if (toolFirstRouteExperience !== "generative_ui") {
								return fallbackCause;
							}

							if (hasRelevantToolSuccess(toolFirstExecutionState)) {
								return fallbackCause;
							}

							if (toolFirstExecutionState.lastRelevantErrorCategory === "validation") {
								return "twg_datetime_validation_to_jira_cql_fallback";
							}

							if (fallbackCause && fallbackCause.startsWith("tool_observation")) {
								return "twg_to_jira_cql_tool_observation_fallback";
							}

							return fallbackCause || "twg_to_jira_cql_fallback";
						})();

						writer.write(createRouteDecisionPart({
							intent:
								toolFirstRouteExperience === "generative_ui"
									? "genui"
									: "chat",
							origin: requestOrigin,
							reason: toolFirstRouteReason,
						}));

						console.info("[TOOL-FIRST] Execution summary", {
							domains: toolFirstPolicy.domains,
							relevanceDomains: toolFirstRelevanceDomains,
							domainLabels: toolFirstPolicy.domainLabels,
							attempts: toolFirstExecutionState.attempts,
							retriesUsed: toolFirstExecutionState.retriesUsed,
							relevantToolStarts: toolFirstExecutionState.relevantToolStarts,
							relevantToolResults: toolFirstExecutionState.relevantToolResults,
							relevantToolErrors: toolFirstExecutionState.relevantToolErrors,
							hadRelevantToolStart: toolFirstExecutionState.hadRelevantToolStart,
							lastRelevantToolName: toolFirstExecutionState.lastRelevantToolName,
							lastRelevantErrorCategory:
								toolFirstExecutionState.lastRelevantErrorCategory,
							fallbackUsed: !hasRelevantToolSuccess(toolFirstExecutionState),
							fallbackCause: resolvedToolFirstFallbackCause,
						});

						if (isWorkSummary) {
							const workSummaryDurationMs = workSummaryStartMs != null
								? Date.now() - workSummaryStartMs
								: null;
							const workSummaryLog = buildWorkSummaryExecutionLog(
								toolFirstExecutionState,
								{
									policy: toolFirstPolicy,
									resolvedPort: typeof resolvedRovoDevPort === "number"
										? resolvedRovoDevPort
										: null,
									durationMs: workSummaryDurationMs,
								}
							);
							if (workSummaryLog) {
								console.info("[work-summary] Execution log", workSummaryLog);
							}
						}
					}

					flushDeferredToolFirstText();

					if (textStarted) {
						writer.write({ type: "text-end", id: textId });
					}

				if (pendingQuestionCardLoadingWidgetId) {
					writer.write({
						type: "data-widget-loading",
						id: pendingQuestionCardLoadingWidgetId,
						data: {
							type: CLARIFICATION_WIDGET_TYPE,
							loading: false,
						},
					});
					pendingQuestionCardLoadingWidgetId = null;
				}

				if (threadId && typeof resolvedRovoDevPort === "number" && resolvedRovoDevPort > 0) {
					try {
						await syncFutureChatThreadSessionFromCurrentPort(
							threadId,
							resolvedRovoDevPort,
							{ sessionMode },
						);
					} catch (error) {
						console.warn("[FUTURE-CHAT] Failed to sync thread session at turn completion:", {
							threadId,
							port: resolvedRovoDevPort,
							error: error instanceof Error ? error.message : String(error),
						});
					}
				}

				// Clean up activeRequests tracking
				if (threadId) {
					activeRequests.delete(threadId);
				}

				// ── Output Routing: Routing telemetry summary (BE-009) ──
				// Emit a structured summary log for every completed turn so
				// routing accuracy and fallback rate can be calculated.
				const toolsDetectedForTelemetry = isStrictToolFirstTurn
					? getRouteToolsDetected()
					: hasObservedActionableToolCall || hasObservedToolExecution;
				const routingTelemetry = {
					timestamp: new Date().toISOString(),
					experience: hasEmittedQuestionCard
						? "question_card"
						: hasEmittedGenuiWidget
							? "generative_ui"
							: "text",
					toolsDetected: toolsDetectedForTelemetry,
					questionCardEmitted: hasEmittedQuestionCard,
					planWidgetEmitted: hasEmittedPlanWidget,
					genuiWidgetEmitted: hasEmittedGenuiWidget,
					toolFirstMatched: isStrictToolFirstTurn,
					isPostClarification: isPostClarificationTurn,
					assistantTextLength: assistantText.length,
				};
				console.info("[OUTPUT-ROUTING] Turn routing summary", routingTelemetry);

					// ── Plan Execution: post-execution artifact generation ──
					// When the plan execution phase completes (all update_todo
					// tasks done), generate an inline artifact card for the
					// built app and auto-open the artifact panel.
					const planExecutionActiveAtFinish = isPlanExecutionPhase(threadId);
					if (planExecutionActiveAtFinish && threadId) {
						const allTasksDone = areAllPlanTasksCompleted(toolObservationEntries);
						if (allTasksDone) {
							const appRoutes = extractAppRoutesFromObservations(toolObservationEntries);
							const appRoute = appRoutes.length > 0 ? appRoutes[0] : null;
							console.info("[PLAN-EXECUTION] All tasks completed, generating artifact", {
								threadId,
								appRoute,
								routeCandidates: appRoutes,
							});

							if (appRoute) {
								try {
									const artifactTitle =
										appRoute === "/"
											? "App"
											: appRoute
												.split("/")
												.filter(Boolean)
												.map((s) => s.charAt(0).toUpperCase() + s.slice(1))
												.join(" ");

									const artifactDocument = await futureChatDocumentManager.createDocument({
										threadId,
										title: artifactTitle,
										kind: "react",
										content: appRoute,
										changeLabel: "Plan execution complete",
										sourceMessageId: null,
									});
									await futureChatThreadManager.updateThread(threadId, {
										activeDocumentId: artifactDocument.id,
									});

									writer.write({
										type: "data-artifact-result",
										data: {
											documentId: artifactDocument.id,
											title: artifactDocument.title,
											kind: "react",
											action: "create",
										},
									});

									const summaryTextId = `plan-exec-artifact-${Date.now()}`;
									writer.write({ type: "text-start", id: summaryTextId });
									writer.write({
										type: "text-delta",
										id: summaryTextId,
										delta: `Your app is ready — open **${artifactTitle}** to see it live.`,
									});
									writer.write({ type: "text-end", id: summaryTextId });

									writer.write(createRouteDecisionPart({
										intent: "artifact_create",
										origin: requestOrigin,
										reason: "plan_execution_complete",
									}));

									console.info("[PLAN-EXECUTION] Artifact created", {
										documentId: artifactDocument.id,
										route: appRoute,
										title: artifactTitle,
									});
								} catch (artifactError) {
									console.warn("[PLAN-EXECUTION] Failed to create artifact document:", artifactError);
								}
							}

							clearPlanSession(threadId);
							console.info("[PLAN-EXECUTION] Plan session cleared after execution complete", { threadId });
						}
					}

					// Signal that the main response is complete so the frontend
					// can show the response immediately. Suggested questions
					// are fetched on a separate best-effort request after the
					// stream closes, so they never hold open the main SSE.
					writer.write({
						type: "data-turn-complete",
						data: { timestamp: new Date().toISOString() },
					});
					stageTrace.mark("post_turn_work_complete", {
						suggestionsDeferred: true,
						hasQueuedPrompts,
					});
				},
				onError: (error) => {
					if (error instanceof Error) {
						return error.message;
				}
				return "Failed to stream AI response";
			},
		});

			pipeUIMessageStreamToResponse({
				response: res,
				stream,
			});
		} catch (error) {
			cleanupChatSdkAbortTracking?.();
			stageTrace.mark("chat_sdk_error", {
				error: error instanceof Error ? error.message : String(error),
			});
			console.error("Chat SDK API error:", error);
			return sendGatewayErrorResponse(res, error, "Failed to process chat request");
		}
}

app.post("/api/chat-sdk", handleChatSdkRequest);

app.post("/api/chat-cancel", async (req, res) => {
	try {
		const threadId = typeof req.query?.threadId === "string" && req.query.threadId.trim().length > 0
			? req.query.threadId.trim()
			: null;

		const activeRequest = threadId ? activeRequests.get(threadId) : null;
		const resolvedPort = activeRequest?.port ?? null;

		console.log(
			threadId
				? `[CHAT-CANCEL] Cancel requested for thread ${threadId}${typeof resolvedPort === "number" ? ` (port ${resolvedPort})` : ""}`
				: "[CHAT-CANCEL] Cancel requested (no threadId)"
		);

		// Abort the active request's signal if tracked
		if (activeRequest?.abortController) {
			try {
				activeRequest.abortController.abort();
			} catch {}
		}

		if (typeof resolvedPort === "number") {
			await rovoDevCancelChat(resolvedPort);
		} else {
			await rovoDevCancelChat();
		}

		if (threadId) {
			activeRequests.delete(threadId);
		}

		return res.status(200).json({
			cancelled: true,
			...(threadId ? { threadId } : {}),
			...(typeof resolvedPort === "number" ? { port: resolvedPort } : {}),
		});
	} catch (error) {
		console.error("[CHAT-CANCEL] Cancel error:", error.message || error);
		return res.status(200).json({ cancelled: false, error: error.message });
	}
});

app.post("/api/future-chat/cancel-deferred-tool", async (req, res) => {
	try {
		const toolCallId = getNonEmptyString(req.body?.toolCallId);
		if (!toolCallId) {
			return res.status(400).json({ error: "toolCallId is required" });
		}

		const activeDeferredToolCall = clearActiveDeferredToolCall(toolCallId);
		if (activeDeferredToolCall) {
			await rovoDevCancelChat(activeDeferredToolCall.port, { timeoutMs: 3_000 });
			if (activeDeferredToolCall.threadId) {
				activeRequests.delete(activeDeferredToolCall.threadId);
				if (activeDeferredToolCall.kind === "plan-approval") {
					clearPlanSession(activeDeferredToolCall.threadId);
				}
			}

			return res.status(200).json({
				cancelled: true,
				kind: activeDeferredToolCall.kind,
				port: activeDeferredToolCall.port,
				threadId: activeDeferredToolCall.threadId,
				toolCallId,
			});
		}

		const pausedToolCall = clearPausedRovoDevToolCall(toolCallId, { cancel: true });
		if (pausedToolCall) {
			if (pausedToolCall.threadId && pausedToolCall.kind === "plan-approval") {
				clearPlanSession(pausedToolCall.threadId);
			}

			return res.status(200).json({
				cancelled: true,
				kind: pausedToolCall.kind,
				port: pausedToolCall.port,
				threadId: pausedToolCall.threadId,
				toolCallId,
			});
		}

		return res.status(404).json({ error: "Deferred tool call not found" });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to cancel deferred tool call:", error);
		return res.status(500).json({
			error: error instanceof Error ? error.message : "Failed to cancel deferred tool call",
		});
	}
});

// ── Agent Mode Toggle ──
// Allows the frontend to get/set the agent mode on a specific RovoDev
// session (default, ask).
app.post("/api/agent-mode", async (req, res) => {
	try {
		const { mode } = req.body || {};
		if (!mode || typeof mode !== "string") {
			return res.status(400).json({ error: "mode is required (default, ask, or plan)" });
		}
		const validModes = ["default", "ask", "plan"];
		if (!validModes.includes(mode)) {
			return res.status(400).json({ error: `Invalid mode: ${mode}. Must be one of: ${validModes.join(", ")}` });
		}

		const rovoDevAvailable = await isRovoDevAvailable();
		if (!rovoDevAvailable) {
			const unavailableError = createRovoDevUnavailableError();
			return res.status(503).json({
				error: "RovoDev Serve is required but not available",
				details: unavailableError.message,
			});
		}

		const result = await setAgentMode(undefined, mode);
		console.info("[AGENT-MODE] Mode set", { mode });
		return res.status(200).json(result);
	} catch (error) {
		console.error("[AGENT-MODE] Error:", error.message || error);
		return res.status(500).json({ error: error.message || "Failed to set agent mode" });
	}
});

app.get("/api/agent-mode", async (req, res) => {
	try {
		const rovoDevAvailable = await isRovoDevAvailable();
		if (!rovoDevAvailable) {
			return res.status(200).json({
				mode: "default",
				message: "RovoDev Serve is not available; default agent mode assumed",
			});
		}

		try {
			const result = await getAgentMode();
			return res.status(200).json(result);
		} catch (agentModeError) {
			const msg = agentModeError instanceof Error ? agentModeError.message : String(agentModeError);
			if (msg.includes("status 404")) {
				// RovoDev Serve version doesn't support agent mode — return default
				console.info("[AGENT-MODE] Agent mode not supported by this RovoDev version, returning default");
				return res.status(200).json({ mode: "default", message: "Agent mode not supported by this RovoDev version" });
			}
			if (isRovoDevConnectionFailure(agentModeError)) {
				console.info("[AGENT-MODE] RovoDev unavailable while reading agent mode, returning default");
				return res.status(200).json({
					mode: "default",
					message: "RovoDev Serve is not available; default agent mode assumed",
				});
			}
			throw agentModeError;
		}
	} catch (error) {
		console.error("[AGENT-MODE] Error:", error.message || error);
		return res.status(500).json({ error: error.message || "Failed to get agent mode" });
	}
});

// ── Output Routing: Question Card skip notification (BE-008) ──
// When the user dismisses/skips a Question Card, the frontend sends a
// notification here. The backend forwards a system message to RovoDev
// so it can decide how to respond (e.g., explain what info is needed
// or proceed with default assumptions).
app.post("/api/chat-sdk/skip-question", async (req, res) => {
	try {
		const {
			sessionId,
			questionTitle,
			messages: rawMessages,
			contextDescription,
		} = req.body || {};

		const skipMessage = buildQuestionCardSkipNotification(
			typeof questionTitle === "string" ? questionTitle.trim() : undefined
		);

		// Build conversation history from messages for context
		const conversationHistory = Array.isArray(rawMessages)
			? rawMessages
					.filter(
						(msg) =>
							msg &&
							typeof msg === "object" &&
							(msg.role === "user" || msg.role === "assistant") &&
							typeof msg.content === "string" &&
							msg.content.trim().length > 0
					)
					.map((msg) => ({
						type: msg.role,
						content: msg.content.trim(),
					}))
					.slice(-10)
			: [];

		const userMessageText = buildUserMessage(
			skipMessage,
			conversationHistory,
			contextDescription || undefined
		);

		console.info("[OUTPUT-ROUTING] Question card skip notification", {
			reason: "intent_clarification_skip",
			experience: "text",
			sessionId: typeof sessionId === "string" ? sessionId : undefined,
			questionTitle: typeof questionTitle === "string" ? questionTitle : undefined,
		});

		// Stream the skip notification to RovoDev and return RovoDev's response
		const stream = createUIMessageStream({
			execute: async ({ writer }) => {
				const textId = `skip-question-response-${Date.now()}`;
				let textStarted = false;

				try {
					await streamViaRovoDev({
						message: userMessageText,
						sessionId: typeof sessionId === "string" ? sessionId : undefined,
						onTextDelta: (delta) => {
							if (!delta) return;
							if (!textStarted) {
								writer.write({ type: "text-start", id: textId });
								textStarted = true;
							}
							writer.write({
								type: "text-delta",
								id: textId,
								delta,
							});
						},
						onThinkingStatus: () => {},
						onThinkingEvent: () => {},
						onToolCallStart: () => {},
						conflictPolicy: "wait-for-turn",
					});
				} catch (error) {
					console.error(
						"[OUTPUT-ROUTING] Skip notification RovoDev error:",
						error instanceof Error ? error.message : error
					);
					// If RovoDev fails, provide a fallback response
					if (!textStarted) {
						writer.write({ type: "text-start", id: textId });
						textStarted = true;
					}
					writer.write({
						type: "text-delta",
						id: textId,
						delta: "I understand you'd like to skip the questions. Let me know how you'd like to proceed, or feel free to rephrase your request.",
					});
				}

				if (textStarted) {
					writer.write({ type: "text-end", id: textId });
				}

				// Emit route-decision for skip
				writer.write(createRouteDecisionPart({
					intent: "chat",
					origin: requestOrigin,
					reason: "intent_clarification_skip",
				}));

				writer.write({
					type: "data-turn-complete",
					data: { timestamp: new Date().toISOString() },
				});
			},
			onError: (error) => {
				if (error instanceof Error) {
					return error.message;
				}
				return "Failed to process question skip notification";
			},
		});

		pipeUIMessageStreamToResponse({
			response: res,
			stream,
		});
	} catch (error) {
		console.error("[OUTPUT-ROUTING] Skip question error:", error);
		return res.status(500).json({
			error: "Failed to process question skip notification",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/genui-chat", (req, res) =>
	genuiChatHandler(req, res, {
		isRovoDevAvailable,
		isAIGatewayFallbackEnabled: () => false,
		aiGatewayProvider,
	})
);

// ── GenUI Export (PDF/PNG/SVG/Email/Code) ─────────────────────────
const { exportSpec, EXPORT_FORMATS } = require("./lib/genui-export");

app.post("/api/genui-export", async (req, res) => {
	try {
		const { spec, format, title, state, componentName } = req.body ?? {};

		if (!spec || typeof spec !== "object" || !spec.root || !spec.elements) {
			return res.status(400).json({ error: "Missing or invalid spec (requires root + elements)" });
		}
		if (!format || !EXPORT_FORMATS.includes(format)) {
			return res.status(400).json({ error: `Invalid format. Supported: ${EXPORT_FORMATS.join(", ")}` });
		}

		const result = await exportSpec(spec, format, { title, state, componentName });

		res.set("Content-Type", result.contentType);
		res.set("Content-Disposition", `attachment; filename="${result.filename}"`);
		res.send(result.data);
	} catch (error) {
		console.error("[genui-export] Export failed:", error);
		res.status(500).json({
			error: "Export failed",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/sound-generation", async (req, res) => {
	try {
		const requestBody =
			req.body && typeof req.body === "object" ? { ...req.body } : {};
		const { payload: normalizedInput, mode: extractionMode } =
			resolveSpeechPayloadFromAudioRequest(requestBody.input, {
				maxChars: SOUND_GENERATION_INPUT_MAX_CHARS,
			});
		if (normalizedInput) {
			requestBody.input = normalizedInput;
		}

		console.info("[SOUND-GENERATION] Resolved speech payload", {
			extractionMode: extractionMode || null,
			hasInput: typeof requestBody.input === "string",
			payloadLength:
				typeof requestBody.input === "string" ? requestBody.input.length : 0,
		});

		const synthesisResult = await synthesizeSound(requestBody);
		const filename = `speech-${Date.now()}.${synthesisResult.extension}`;

		res.setHeader("Content-Type", synthesisResult.contentType);
		res.setHeader("Content-Length", String(synthesisResult.audioBytes.length));
		res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
		return res.status(200).send(synthesisResult.audioBytes);
	} catch (error) {
		console.error("Sound generation API error:", error);
		const statusCode =
			typeof error?.statusCode === "number" ? error.statusCode : 500;
		return res.status(statusCode).json({
			error:
				statusCode >= 500
					? "Internal server error"
					: error instanceof Error
						? error.message
						: "Request failed",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/speech-transcription", async (req, res) => {
	const { abortController, cleanup } = createAbortControllerFromRequest(req, res, {
		onAbort: () => {
			console.log("[SPEECH-TRANSCRIPTION] Client disconnected, aborting transcription");
		},
	});

	try {
		const { audio, language, mimeType, model, provider } = req.body || {};
		if (!audio || typeof audio !== "string") {
			return res.status(400).json({ error: "Base64 audio data is required" });
		}

		console.info("[SPEECH-TRANSCRIPTION] Transcribing audio", {
			language: language || null,
			mimeType: mimeType || "audio/webm",
			audioLength: audio.length,
			model: model || null,
			provider: provider || `(preset: ${process.env.STT_PRESET || "none"})`,
		});

		const text = await transcribeAudio({
			audio,
			language,
			mimeType,
			model,
			provider,
			signal: abortController.signal,
		});
		return res.status(200).json({ text });
	} catch (error) {
		const isAbortError =
			typeof error === "object" &&
			error !== null &&
			"name" in error &&
			error.name === "AbortError";
		if (isAbortError && (abortController.signal.aborted || req.aborted || res.destroyed)) {
			return;
		}

		console.error("Speech transcription API error:", error);
		const statusCode =
			typeof error?.statusCode === "number" ? error.statusCode : 500;
		return res.status(statusCode).json({
			error:
				statusCode >= 500
					? "Internal server error"
					: error instanceof Error
						? error.message
						: "Request failed",
		});
	} finally {
		cleanup();
	}
});

app.get("/api/image-proxy", async (req, res) => {
	const rawSrc = Array.isArray(req.query.src) ? req.query.src[0] : req.query.src;
	const { targetUrl, error } = parseImageProxyTarget(rawSrc);
	if (error) {
		return res.status(400).json({ error });
	}

	const abortController = new AbortController();
	const timeoutHandle = setTimeout(() => {
		abortController.abort();
	}, IMAGE_PROXY_TIMEOUT_MS);

	try {
		const upstreamResponse = await fetch(targetUrl.toString(), {
			method: "GET",
			headers: {
				Accept: "image/*",
				"User-Agent": "VPK-ImageProxy/1.0",
			},
			redirect: "follow",
			signal: abortController.signal,
		});

		if (!upstreamResponse.ok) {
			return res.status(502).json({
				error: `Image fetch failed (${upstreamResponse.status})`,
			});
		}

		const contentType =
			getNonEmptyString(upstreamResponse.headers.get("content-type")) ||
			"application/octet-stream";

		if (!contentType.toLowerCase().startsWith("image/")) {
			return res.status(502).json({
				error: "Upstream response is not an image",
			});
		}

		const payload = Buffer.from(await upstreamResponse.arrayBuffer());
		const upstreamCacheControl = getNonEmptyString(
			upstreamResponse.headers.get("cache-control")
		);

		res.setHeader("Content-Type", contentType);
		res.setHeader("Content-Length", String(payload.length));
		res.setHeader(
			"Cache-Control",
			upstreamCacheControl || "public, max-age=300, stale-while-revalidate=300"
		);

		return res.status(200).send(payload);
	} catch (error) {
		const isAbortError =
			typeof error === "object" &&
			error !== null &&
			"name" in error &&
			error.name === "AbortError";

		return res.status(isAbortError ? 504 : 502).json({
			error: isAbortError ? "Image fetch timed out" : "Image proxy failed",
		});
	} finally {
		clearTimeout(timeoutHandle);
	}
});

app.get("/api/web-proxy", async (req, res) => {
	const rawUrl = Array.isArray(req.query.url) ? req.query.url[0] : req.query.url;
	const { targetUrl, error } = parseWebProxyTarget(rawUrl);
	if (error) {
		return res.status(400).json({ error });
	}

	const abortController = new AbortController();
	const timeoutHandle = setTimeout(() => {
		abortController.abort();
	}, WEB_PROXY_TIMEOUT_MS);

	try {
		const upstreamResponse = await fetch(targetUrl.toString(), {
			method: "GET",
			headers: {
				Accept: "text/html,*/*",
				"User-Agent": "VPK-WebProxy/1.0",
			},
			redirect: "follow",
			signal: abortController.signal,
		});

		if (!upstreamResponse.ok) {
			return res.status(502).json({
				error: `Web fetch failed (${upstreamResponse.status})`,
			});
		}

		const contentType =
			getNonEmptyString(upstreamResponse.headers.get("content-type")) ||
			"text/html";

		const upstreamCacheControl = getNonEmptyString(
			upstreamResponse.headers.get("cache-control")
		);

		res.setHeader("Content-Type", contentType);
		if (upstreamCacheControl) {
			res.setHeader("Cache-Control", upstreamCacheControl);
		}

		if (contentType.toLowerCase().includes("text/html")) {
			const html = await upstreamResponse.text();
			const baseHref = `${targetUrl.protocol}//${targetUrl.host}/`;
			const modifiedHtml = injectBaseTag(html, baseHref);
			res.setHeader("Content-Length", String(Buffer.byteLength(modifiedHtml)));
			return res.status(200).send(modifiedHtml);
		}

		const payload = Buffer.from(await upstreamResponse.arrayBuffer());
		res.setHeader("Content-Length", String(payload.length));
		return res.status(200).send(payload);
	} catch (error) {
		console.error("[WEB-PROXY] Fetch error:", error);
		const isAbortError =
			typeof error === "object" &&
			error !== null &&
			"name" in error &&
			error.name === "AbortError";

		return res.status(isAbortError ? 504 : 502).json({
			error: isAbortError ? "Web fetch timed out" : "Web proxy failed",
		});
	} finally {
		clearTimeout(timeoutHandle);
	}
});

function resolveBrowserWorkspaceId(request) {
	return getNonEmptyString(request.params?.workspaceId);
}

function resolveBrowserWorkspaceTabIndex(request) {
	const parsedIndex = Number.parseInt(String(request.params?.tabIndex ?? ""), 10);
	return Number.isInteger(parsedIndex) && parsedIndex >= 0 ? parsedIndex : null;
}

function sendBrowserWorkspaceError(response, error, fallbackMessage) {
	const message =
		error instanceof Error && error.message
			? error.message
			: fallbackMessage;
	const statusCode =
		typeof message === "string" &&
		message.startsWith("Browser workspace not found:")
			? 404
			: 500;

	return response.status(statusCode).json({
		error: message,
	});
}

app.get("/api/browser-workspaces", async (_req, res) => {
	try {
		return res.json({
			workspaces: browserWorkspaceManager.listWorkspaces(),
		});
	} catch (error) {
		console.error("[BROWSER-WORKSPACE] List error:", error);
		return sendBrowserWorkspaceError(
			res,
			error,
			"Failed to list browser workspaces",
		);
	}
});

app.post("/api/browser-workspaces", async (req, res) => {
	try {
		const defaultUrl = getNonEmptyString(req.body?.defaultUrl);
		const state = await browserWorkspaceManager.createWorkspace({
			defaultUrl: defaultUrl || undefined,
		});
		return res.status(201).json(state);
	} catch (error) {
		console.error("[BROWSER-WORKSPACE] Create error:", error);
		return sendBrowserWorkspaceError(
			res,
			error,
			"Failed to create browser workspace",
		);
	}
});

app.get("/api/browser-workspaces/:workspaceId", async (req, res) => {
	try {
		const workspaceId = resolveBrowserWorkspaceId(req);
		if (!workspaceId) {
			return res.status(400).json({
				error: "A non-empty workspaceId route param is required.",
			});
		}

		const state = await browserWorkspaceManager.getWorkspaceState(workspaceId);
		return res.json(state);
	} catch (error) {
		console.error("[BROWSER-WORKSPACE] State error:", error);
		return sendBrowserWorkspaceError(
			res,
			error,
			"Failed to read browser workspace state",
		);
	}
});

app.delete("/api/browser-workspaces/:workspaceId", async (req, res) => {
	try {
		const workspaceId = resolveBrowserWorkspaceId(req);
		if (!workspaceId) {
			return res.status(400).json({
				error: "A non-empty workspaceId route param is required.",
			});
		}

		const result = await browserWorkspaceManager.deleteWorkspace(workspaceId);
		return res.json(result);
	} catch (error) {
		console.error("[BROWSER-WORKSPACE] Delete error:", error);
		return sendBrowserWorkspaceError(
			res,
			error,
			"Failed to delete browser workspace",
		);
	}
});

app.get("/api/browser-workspaces/:workspaceId/tabs", async (req, res) => {
	try {
		const workspaceId = resolveBrowserWorkspaceId(req);
		if (!workspaceId) {
			return res.status(400).json({
				error: "A non-empty workspaceId route param is required.",
			});
		}

		const tabs = await browserWorkspaceManager.getWorkspaceTabs(workspaceId);
		return res.json(tabs);
	} catch (error) {
		console.error("[BROWSER-WORKSPACE] Tab list error:", error);
		return sendBrowserWorkspaceError(
			res,
			error,
			"Failed to list browser workspace tabs",
		);
	}
});

app.post("/api/browser-workspaces/:workspaceId/tabs", async (req, res) => {
	try {
		const workspaceId = resolveBrowserWorkspaceId(req);
		if (!workspaceId) {
			return res.status(400).json({
				error: "A non-empty workspaceId route param is required.",
			});
		}

		const url = getNonEmptyString(req.body?.url);
		const state = await browserWorkspaceManager.createWorkspaceTab(
			workspaceId,
			url || undefined,
		);
		return res.json(state);
	} catch (error) {
		console.error("[BROWSER-WORKSPACE] Tab create error:", error);
		return sendBrowserWorkspaceError(
			res,
			error,
			"Failed to create browser workspace tab",
		);
	}
});

app.post(
	"/api/browser-workspaces/:workspaceId/tabs/:tabIndex/activate",
	async (req, res) => {
		try {
			const workspaceId = resolveBrowserWorkspaceId(req);
			if (!workspaceId) {
				return res.status(400).json({
					error: "A non-empty workspaceId route param is required.",
				});
			}

			const tabIndex = resolveBrowserWorkspaceTabIndex(req);
			if (tabIndex === null) {
				return res.status(400).json({
					error: "A non-negative tabIndex route param is required.",
				});
			}

			const state = await browserWorkspaceManager.activateWorkspaceTab(
				workspaceId,
				tabIndex,
			);
			return res.json(state);
		} catch (error) {
			console.error("[BROWSER-WORKSPACE] Tab activate error:", error);
			return sendBrowserWorkspaceError(
				res,
				error,
				"Failed to activate browser workspace tab",
			);
		}
	},
);

app.delete("/api/browser-workspaces/:workspaceId/tabs/:tabIndex", async (req, res) => {
	try {
		const workspaceId = resolveBrowserWorkspaceId(req);
		if (!workspaceId) {
			return res.status(400).json({
				error: "A non-empty workspaceId route param is required.",
			});
		}

		const tabIndex = resolveBrowserWorkspaceTabIndex(req);
		if (tabIndex === null) {
			return res.status(400).json({
				error: "A non-negative tabIndex route param is required.",
			});
		}

		const state = await browserWorkspaceManager.closeWorkspaceTab(
			workspaceId,
			tabIndex,
		);
		return res.json(state);
	} catch (error) {
		console.error("[BROWSER-WORKSPACE] Tab close error:", error);
		return sendBrowserWorkspaceError(
			res,
			error,
			"Failed to close browser workspace tab",
		);
	}
});

app.post("/api/browser-workspaces/:workspaceId/preview-session", async (req, res) => {
	try {
		const workspaceId = resolveBrowserWorkspaceId(req);
		if (!workspaceId) {
			return res.status(400).json({
				error: "A non-empty workspaceId route param is required.",
			});
		}

		const offerSdp =
			typeof req.body?.offerSdp === "string" && req.body.offerSdp.trim()
				? req.body.offerSdp
				: null;
		if (!offerSdp) {
			return res.status(400).json({
				error: "A non-empty offerSdp field is required.",
			});
		}

		const session = await browserWorkspaceManager.createWorkspacePreviewSession(
			workspaceId,
			offerSdp,
		);
		return res.status(201).json(session);
	} catch (error) {
		console.error("[BROWSER-WORKSPACE] Preview session create error:", error);
		return sendBrowserWorkspaceError(
			res,
			error,
			"Failed to create browser preview session",
		);
	}
});

app.delete(
	"/api/browser-workspaces/:workspaceId/preview-session/:sessionId",
	async (req, res) => {
		try {
			const workspaceId = resolveBrowserWorkspaceId(req);
			if (!workspaceId) {
				return res.status(400).json({
					error: "A non-empty workspaceId route param is required.",
				});
			}

			const sessionId = getNonEmptyString(req.params?.sessionId);
			if (!sessionId) {
				return res.status(400).json({
					error: "A non-empty sessionId route param is required.",
				});
			}

			const result = await browserWorkspaceManager.deleteWorkspacePreviewSession(
				workspaceId,
				sessionId,
			);
			return res.json(result);
		} catch (error) {
			console.error("[BROWSER-WORKSPACE] Preview session delete error:", error);
			return sendBrowserWorkspaceError(
				res,
				error,
				"Failed to delete browser preview session",
			);
		}
	},
);

app.get("/api/browser-workspaces/:workspaceId/:action", async (req, res) => {
	try {
		const workspaceId = resolveBrowserWorkspaceId(req);
		if (!workspaceId) {
			return res.status(400).json({
				error: "A non-empty workspaceId route param is required.",
			});
		}

		const action = getNonEmptyString(req.params?.action);
		if (!action) {
			return res.status(400).json({
				error: "A non-empty action route param is required.",
			});
		}

		if (action === "snapshot") {
			const interactive = req.query.interactive === "true";
			const snapshot = await browserWorkspaceManager.getWorkspaceSnapshot(
				workspaceId,
				{ interactive },
			);
			return res.json(snapshot);
		}

			if (action === "stream") {
				const streamConfig = browserWorkspaceManager.getWorkspaceStream(workspaceId);
				return res.json({
					...streamConfig,
					wsUrl: `ws://127.0.0.1:${port}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/live`,
				});
			}

		if (action === "screenshot") {
			const width = Array.isArray(req.query.width)
				? req.query.width[0]
				: req.query.width;
			const height = Array.isArray(req.query.height)
				? req.query.height[0]
				: req.query.height;

			if (width || height) {
				await browserWorkspaceManager.resizeWorkspace(
					workspaceId,
					width,
					height,
				);
			}

			const screenshot =
				await browserWorkspaceManager.getWorkspaceScreenshot(workspaceId);
			res.setHeader("Content-Type", screenshot.contentType);
			res.setHeader("Cache-Control", "no-store");
			return res.send(screenshot.buffer);
		}

		return res.status(404).json({
			error: "Unsupported browser workspace action.",
		});
	} catch (error) {
		console.error("[BROWSER-WORKSPACE] Read action error:", error);
		return sendBrowserWorkspaceError(
			res,
			error,
			"Failed to handle browser workspace action",
		);
	}
});

app.post("/api/browser-workspaces/:workspaceId/:action", async (req, res) => {
	try {
		const workspaceId = resolveBrowserWorkspaceId(req);
		if (!workspaceId) {
			return res.status(400).json({
				error: "A non-empty workspaceId route param is required.",
			});
		}

		const action = getNonEmptyString(req.params?.action);
		if (!action) {
			return res.status(400).json({
				error: "A non-empty action route param is required.",
			});
		}

		switch (action) {
			case "navigate": {
				const url = getNonEmptyString(req.body?.url);
				if (!url) {
					return res.status(400).json({
						error: "A non-empty url field is required.",
					});
				}

				const state = await browserWorkspaceManager.navigateWorkspace(
					workspaceId,
					url,
				);
				return res.json(state);
			}
			case "back":
				return res.json(await browserWorkspaceManager.goBack(workspaceId));
			case "forward":
				return res.json(await browserWorkspaceManager.goForward(workspaceId));
			case "reload":
				return res.json(
					await browserWorkspaceManager.reloadWorkspace(workspaceId),
				);
				case "viewport":
					return res.json(
						await browserWorkspaceManager.resizeWorkspace(
							workspaceId,
							req.body?.width,
							req.body?.height,
							req.body?.deviceScaleFactor,
						),
					);
			case "click":
				return res.json(
					await browserWorkspaceManager.clickWorkspace(
						workspaceId,
						req.body?.x,
						req.body?.y,
					),
				);
			case "click-ref": {
				const ref = getNonEmptyString(req.body?.ref);
				if (!ref) {
					return res.status(400).json({
						error: "A non-empty ref field is required.",
					});
				}

				return res.json(
					await browserWorkspaceManager.clickWorkspaceRef(workspaceId, ref),
				);
			}
			case "hover-ref": {
				const ref = getNonEmptyString(req.body?.ref);
				if (!ref) {
					return res.status(400).json({
						error: "A non-empty ref field is required.",
					});
				}

				return res.json(
					await browserWorkspaceManager.hoverWorkspaceRef(workspaceId, ref),
				);
			}
			case "fill-ref": {
				const ref = getNonEmptyString(req.body?.ref);
				if (!ref) {
					return res.status(400).json({
						error: "A non-empty ref field is required.",
					});
				}

				if (typeof req.body?.text !== "string") {
					return res.status(400).json({
						error: "A text string is required.",
					});
				}

				return res.json(
					await browserWorkspaceManager.fillWorkspaceRef(
						workspaceId,
						ref,
						req.body.text,
					),
				);
			}
			case "type-ref": {
				const ref = getNonEmptyString(req.body?.ref);
				if (!ref) {
					return res.status(400).json({
						error: "A non-empty ref field is required.",
					});
				}

				if (typeof req.body?.text !== "string") {
					return res.status(400).json({
						error: "A text string is required.",
					});
				}

				return res.json(
					await browserWorkspaceManager.typeWorkspaceRef(
						workspaceId,
						ref,
						req.body.text,
					),
				);
			}
			case "select-ref": {
				const ref = getNonEmptyString(req.body?.ref);
				if (!ref) {
					return res.status(400).json({
						error: "A non-empty ref field is required.",
					});
				}

				const values = Array.isArray(req.body?.values)
					? req.body.values.filter((value) => typeof value === "string")
					: [];
				if (values.length === 0) {
					return res.status(400).json({
						error: "A non-empty values array is required.",
					});
				}

				return res.json(
					await browserWorkspaceManager.selectWorkspaceRef(
						workspaceId,
						ref,
						values,
					),
				);
			}
			case "scroll": {
				const direction = getNonEmptyString(req.body?.direction);
				if (!direction) {
					return res.status(400).json({
						error: "A non-empty direction field is required.",
					});
				}

				return res.json(
					await browserWorkspaceManager.scrollWorkspace(
						workspaceId,
						direction,
						req.body?.pixels,
					),
				);
			}
			case "wheel":
				return res.json(
					await browserWorkspaceManager.wheelWorkspace(
						workspaceId,
						req.body?.deltaX,
						req.body?.deltaY,
					),
				);
			case "press": {
				const key = getNonEmptyString(req.body?.key);
				if (!key) {
					return res.status(400).json({
						error: "A non-empty key field is required.",
					});
				}

				return res.json(
					await browserWorkspaceManager.pressWorkspaceKey(workspaceId, key),
				);
			}
			case "type": {
				const text = getNonEmptyString(req.body?.text);
				if (!text) {
					return res.status(400).json({
						error: "A non-empty text field is required.",
					});
				}

				return res.json(
					await browserWorkspaceManager.typeWorkspaceText(workspaceId, text),
				);
			}
			default:
				return res.status(404).json({
					error: "Unsupported browser workspace action.",
				});
		}
	} catch (error) {
		console.error("[BROWSER-WORKSPACE] Mutation action error:", error);
		return sendBrowserWorkspaceError(
			res,
			error,
			"Failed to mutate browser workspace state",
		);
	}
});

app.get("/api/chromium-preview", async (_req, res) => {
	try {
		const state = await chromiumPreviewManager.getState();
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] State error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to read Chromium preview state",
		});
	}
});

app.get("/api/chromium-preview/stream", async (_req, res) => {
	try {
		return res.json({
			enabled: true,
			...chromiumPreviewManager.getStreamConfig(),
		});
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Stream config error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to read Chromium preview stream config",
		});
	}
});

app.post("/api/chromium-preview", async (req, res) => {
	try {
		const url = getNonEmptyString(req.body?.url);
		if (!url) {
			return res.status(400).json({
				error: "A non-empty url field is required.",
			});
		}

		const state = await chromiumPreviewManager.navigate(url);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Navigate error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to navigate Chromium preview",
		});
	}
});

app.post("/api/chromium-preview/viewport", async (req, res) => {
	try {
		const width = req.body?.width;
		const height = req.body?.height;
		const state = await chromiumPreviewManager.setViewport(width, height);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Viewport error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to resize Chromium preview",
		});
	}
});

app.post("/api/chromium-preview/back", async (_req, res) => {
	try {
		const state = await chromiumPreviewManager.goBack();
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Back error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to go back in Chromium preview",
		});
	}
});

app.post("/api/chromium-preview/forward", async (_req, res) => {
	try {
		const state = await chromiumPreviewManager.goForward();
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Forward error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to go forward in Chromium preview",
		});
	}
});

app.post("/api/chromium-preview/reload", async (_req, res) => {
	try {
		const state = await chromiumPreviewManager.reload();
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Reload error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to reload Chromium preview",
		});
	}
});

app.post("/api/chromium-preview/click", async (req, res) => {
	try {
		const state = await chromiumPreviewManager.click(req.body?.x, req.body?.y);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Click error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to click inside Chromium preview",
		});
	}
});

app.post("/api/chromium-preview/click-ref", async (req, res) => {
	try {
		const ref = getNonEmptyString(req.body?.ref);
		if (!ref) {
			return res.status(400).json({
				error: "A non-empty ref field is required.",
			});
		}

		const state = await chromiumPreviewManager.clickRef(ref);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Click ref error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to click Chromium preview ref",
		});
	}
});

app.post("/api/chromium-preview/hover-ref", async (req, res) => {
	try {
		const ref = getNonEmptyString(req.body?.ref);
		if (!ref) {
			return res.status(400).json({
				error: "A non-empty ref field is required.",
			});
		}

		const state = await chromiumPreviewManager.hoverRef(ref);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Hover ref error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to hover Chromium preview ref",
		});
	}
});

app.post("/api/chromium-preview/fill-ref", async (req, res) => {
	try {
		const ref = getNonEmptyString(req.body?.ref);
		if (!ref) {
			return res.status(400).json({
				error: "A non-empty ref field is required.",
			});
		}

		if (typeof req.body?.text !== "string") {
			return res.status(400).json({
				error: "A text string is required.",
			});
		}

		const state = await chromiumPreviewManager.fillRef(ref, req.body.text);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Fill ref error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to fill Chromium preview ref",
		});
	}
});

app.post("/api/chromium-preview/type-ref", async (req, res) => {
	try {
		const ref = getNonEmptyString(req.body?.ref);
		if (!ref) {
			return res.status(400).json({
				error: "A non-empty ref field is required.",
			});
		}

		if (typeof req.body?.text !== "string") {
			return res.status(400).json({
				error: "A text string is required.",
			});
		}

		const state = await chromiumPreviewManager.typeRef(ref, req.body.text);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Type ref error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to type into Chromium preview ref",
		});
	}
});

app.post("/api/chromium-preview/select-ref", async (req, res) => {
	try {
		const ref = getNonEmptyString(req.body?.ref);
		if (!ref) {
			return res.status(400).json({
				error: "A non-empty ref field is required.",
			});
		}

		const values = Array.isArray(req.body?.values)
			? req.body.values.filter((value) => typeof value === "string")
			: [];
		if (values.length === 0) {
			return res.status(400).json({
				error: "A non-empty values array is required.",
			});
		}

		const state = await chromiumPreviewManager.selectRef(ref, values);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Select ref error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to select Chromium preview ref value",
		});
	}
});

app.post("/api/chromium-preview/scroll", async (req, res) => {
	try {
		const direction = getNonEmptyString(req.body?.direction);
		if (!direction) {
			return res.status(400).json({
				error: "A non-empty direction field is required.",
			});
		}

		const state = await chromiumPreviewManager.scroll(
			direction,
			req.body?.pixels
		);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Scroll error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to scroll Chromium preview",
		});
	}
});

app.post("/api/chromium-preview/wheel", async (req, res) => {
	try {
		const state = await chromiumPreviewManager.wheel(
			req.body?.deltaX,
			req.body?.deltaY
		);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Wheel error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to scroll Chromium preview",
		});
	}
});

app.post("/api/chromium-preview/press", async (req, res) => {
	try {
		const key = getNonEmptyString(req.body?.key);
		if (!key) {
			return res.status(400).json({
				error: "A non-empty key field is required.",
			});
		}

		const state = await chromiumPreviewManager.press(key);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Press error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to send a key to Chromium preview",
		});
	}
});

app.post("/api/chromium-preview/type", async (req, res) => {
	try {
		const text = getNonEmptyString(req.body?.text);
		if (!text) {
			return res.status(400).json({
				error: "A non-empty text field is required.",
			});
		}

		const state = await chromiumPreviewManager.insertText(text);
		return res.json(state);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Type error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to type into Chromium preview",
		});
	}
});

app.get("/api/chromium-preview/snapshot", async (req, res) => {
	try {
		const interactive = req.query.interactive === "true";
		const result = await chromiumPreviewManager.snapshot({ interactive });
		return res.json(result);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Snapshot error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to capture Chromium preview snapshot",
		});
	}
});

app.get("/api/chromium-preview/screenshot", async (req, res) => {
	try {
		const width = Array.isArray(req.query.width)
			? req.query.width[0]
			: req.query.width;
		const height = Array.isArray(req.query.height)
			? req.query.height[0]
			: req.query.height;

		if (width || height) {
			await chromiumPreviewManager.setViewport(width, height);
		}

		const screenshot = await chromiumPreviewManager.screenshot();
		res.setHeader("Content-Type", screenshot.contentType);
		res.setHeader("Cache-Control", "no-store");
		return res.send(screenshot.buffer);
	} catch (error) {
		console.error("[CHROMIUM-PREVIEW] Screenshot error:", error);
		return res.status(500).json({
			error:
				error instanceof Error
					? error.message
					: "Failed to capture Chromium preview screenshot",
		});
	}
});

app.post("/api/future-chat/chat", async (req, res) => {
	try {
		await proxyFutureChatChatRequest(req, res);
	} catch (error) {
		console.error("[FUTURE-CHAT] Chat proxy failed:", error);
		return sendGatewayErrorResponse(
			res,
			error,
			"Failed to stream Future Chat response"
		);
	}
});

app.get("/api/future-chat/messages", async (req, res) => {
	try {
		const rawThreadId = Array.isArray(req.query.threadId) ? req.query.threadId[0] : req.query.threadId;
		const threadId = getNonEmptyString(rawThreadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const messages = await futureChatThreadManager.getRealtimeMessages(threadId);
		return res.status(200).json({
			messages: Array.isArray(messages) ? messages : [],
		});
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to load realtime messages:", error);
		return res.status(500).json({ error: "Failed to load Future Chat realtime messages" });
	}
});

app.post("/api/future-chat/messages", async (req, res) => {
	try {
		const {
			threadId: rawThreadId,
			message,
			messages,
		} = req.body || {};
		const threadId = getNonEmptyString(rawThreadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		let thread = null;
		if (message && typeof message === "object") {
			thread = await futureChatThreadManager.upsertRealtimeMessage(threadId, message);
		} else if (Array.isArray(messages)) {
			thread = await futureChatThreadManager.replaceRealtimeMessages(threadId, messages);
		} else {
			return res.status(400).json({
				error: "Provide either `message` or `messages` to persist realtime messages.",
			});
		}

		if (!thread) {
			return res.status(404).json({ error: "Thread not found" });
		}

		return res.status(200).json({
			messages: Array.isArray(thread.realtimeMessages) ? thread.realtimeMessages : [],
		});
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to persist realtime messages:", error);
		return res.status(500).json({ error: "Failed to persist Future Chat realtime messages" });
	}
});

app.get("/api/future-chat/threads", async (req, res) => {
	try {
		const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
		const limit = rawLimit ? Number(rawLimit) : undefined;
		const threads = (
			await Promise.all(
				(await futureChatThreadManager.listThreads({ limit })).map((thread) =>
					reconcileOrphanedFutureChatThread(thread),
				),
			)
		).filter(Boolean);
		return res.status(200).json({ threads });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to list threads:", error);
		return res.status(500).json({ error: "Failed to list Future Chat threads" });
	}
});

app.post("/api/future-chat/threads", async (req, res) => {
	try {
		const {
			id: rawThreadId,
			title,
			messages,
			realtimeMessages,
			visibility,
			modelId,
			provider,
			activeDocumentId,
			sessionId,
			sessionMode,
			createdAt,
			updatedAt,
		} = req.body || {};
		const threadId = getNonEmptyString(rawThreadId) || createFutureChatThreadId();
		const persistedMessages = await persistFutureChatMessageFiles(threadId, messages);
		const thread = await futureChatThreadManager.createThread({
			id: threadId,
			title,
			messages: persistedMessages,
			realtimeMessages,
			visibility,
			modelId,
			provider,
			activeDocumentId,
			sessionId,
			sessionMode,
			createdAt,
			updatedAt,
		});
		return res.status(201).json({ thread });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to create thread:", error);
		const message = error instanceof Error ? error.message : "Failed to create thread";
		return res.status(400).json({ error: message });
	}
});

app.delete("/api/future-chat/threads", async (req, res) => {
	try {
		const rawAll = Array.isArray(req.query.all) ? req.query.all[0] : req.query.all;
		if (rawAll !== "true" && rawAll !== "1") {
			return res.status(400).json({ error: "Use ?all=true to delete all threads." });
		}

		const threads = await futureChatThreadManager.listThreads({ limit: Number.MAX_SAFE_INTEGER });
		await Promise.all(
			threads.map(async (thread) => {
				await futureChatGeneratedFilesManager.deleteLegacyRootFiles(thread.id);
			}),
		);

		await futureChatThreadManager.deleteAllThreads();
		await futureChatVoteManager.deleteAllVotes();
		await futureChatDocumentManager.deleteAllDocuments();
		await futureChatUploadManager.deleteAllUploads();

		return res.status(200).json({ deleted: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to delete all threads:", error);
		return res.status(500).json({ error: "Failed to delete all Future Chat threads" });
	}
});

app.get("/api/future-chat/threads/:threadId", async (req, res) => {
	try {
		const thread = await reconcileOrphanedFutureChatThread(
			await futureChatThreadManager.getThread(req.params.threadId),
		);
		if (!thread) {
			return res.status(404).json({ error: "Thread not found" });
		}

		return res.status(200).json({ thread });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to load thread:", error);
		return res.status(500).json({ error: "Failed to load Future Chat thread" });
	}
});

app.put("/api/future-chat/threads/:threadId", async (req, res) => {
	try {
		const {
			title,
			messages,
			realtimeMessages,
			visibility,
			modelId,
			provider,
			activeDocumentId,
			sessionId,
			sessionMode,
			updatedAt,
		} = req.body || {};
		const persistedMessages =
			messages !== undefined
				? await persistFutureChatMessageFiles(req.params.threadId, messages)
				: undefined;
		const thread = await futureChatThreadManager.updateThread(req.params.threadId, {
			title,
			messages: persistedMessages,
			realtimeMessages,
			visibility,
			modelId,
			provider,
			activeDocumentId,
			sessionId,
			sessionMode,
			updatedAt,
		});
		if (!thread) {
			return res.status(404).json({ error: "Thread not found" });
		}

		return res.status(200).json({ thread });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to update thread:", error);
		return res.status(500).json({ error: "Failed to update Future Chat thread" });
	}
});

app.post("/api/future-chat/detach", async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.body?.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}
		const run = futureChatRunManager.getRun(threadId);
		if (!run) {
			return res.status(404).json({ error: "No active stream for threadId" });
		}
		futureChatRunManager.setRunStatus(
			threadId,
			run.status === "queued" ? "queued" : "background",
		);
		await persistFutureChatRunState(threadId, futureChatRunManager.getRun(threadId));
		return res.status(200).json({ detached: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to detach stream:", error);
		return res.status(500).json({ error: "Failed to detach stream" });
	}
});

app.get("/api/future-chat/background-streams", async (req, res) => {
	try {
		const streams = futureChatRunManager.listRuns();
		return res.status(200).json({ streams });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to list background streams:", error);
		return res.status(500).json({ error: "Failed to list background streams" });
	}
});

app.get("/api/future-chat/runs/:threadId/stream", async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.params.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const subscriberId = futureChatRunManager.attachSubscriber(threadId, res, {
			onDetached: (run) => {
				if (!run) {
					return;
				}
				void persistFutureChatRunState(threadId, run);
			},
		});
		if (!subscriberId) {
			return res.status(404).json({ error: "No active run for threadId" });
		}

		await persistFutureChatRunState(threadId, futureChatRunManager.getRun(threadId));
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to attach run stream:", error);
		return res.status(500).json({ error: "Failed to attach Future Chat run stream" });
	}
});

app.post("/api/future-chat/runs/:threadId/detach", async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.params.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const run = futureChatRunManager.getRun(threadId);
		if (!run) {
			return res.status(404).json({ error: "No active run for threadId" });
		}

		futureChatRunManager.setRunStatus(
			threadId,
			run.status === "queued" ? "queued" : "background",
		);
		await persistFutureChatRunState(threadId, futureChatRunManager.getRun(threadId));
		return res.status(200).json({ detached: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to detach run:", error);
		return res.status(500).json({ error: "Failed to detach Future Chat run" });
	}
});

app.post("/api/future-chat/runs/:threadId/cancel", async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.params.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const run = futureChatRunManager.getRun(threadId);
		if (!run) {
			return res.status(404).json({ error: "No active run for threadId" });
		}

		if (typeof run.rovoPort === "number" && run.rovoPort > 0) {
			await rovoDevCancelChat(run.rovoPort).catch(() => {});
		}

		futureChatRunManager.cancelRun(threadId);
		await clearFutureChatRunState(threadId);
		void startNextQueuedFutureChatRun();
		return res.status(200).json({ cancelled: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to cancel run:", error);
		return res.status(500).json({ error: "Failed to cancel Future Chat run" });
	}
});

app.delete("/api/future-chat/threads/:threadId", async (req, res) => {
	try {
		const threadId = req.params.threadId;
		const activeRun = futureChatRunManager.getRun(threadId);
		if (activeRun) {
			if (typeof activeRun.rovoPort === "number" && activeRun.rovoPort > 0) {
				await rovoDevCancelChat(activeRun.rovoPort).catch(() => {});
			}
			futureChatRunManager.cancelRun(threadId);
		}
		const thread = await futureChatThreadManager.getThread(threadId);
		const uploadIds = collectFutureChatUploadIdsFromMessages(thread?.messages);
		if (thread) {
			await futureChatGeneratedFilesManager.backfillFromThread(thread);
			await futureChatGeneratedFilesManager.deleteLegacyRootFiles(threadId);
		}
		await Promise.all(
			uploadIds.map((uploadId) =>
				futureChatUploadManager.deleteUpload(uploadId).catch(() => {})
			)
		);
		await futureChatVoteManager.deleteVotesForThread(threadId);
		await futureChatDocumentManager.deleteDocumentsByThread(threadId);
		await futureChatThreadManager.deleteThread(threadId);
		return res.status(200).json({ deleted: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to delete thread:", error);
		return res.status(500).json({ error: "Failed to delete Future Chat thread" });
	}
});

app.get("/api/future-chat/votes", async (req, res) => {
	try {
		const rawThreadId = Array.isArray(req.query.threadId) ? req.query.threadId[0] : req.query.threadId;
		const threadId = getNonEmptyString(rawThreadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const votes = await futureChatVoteManager.listVotes(threadId);
		return res.status(200).json({ votes });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to list votes:", error);
		return res.status(500).json({ error: "Failed to list Future Chat votes" });
	}
});

app.patch("/api/future-chat/votes", async (req, res) => {
	try {
		const { threadId: rawThreadId, messageId: rawMessageId, value } = req.body || {};
		const threadId = getNonEmptyString(rawThreadId);
		const messageId = getNonEmptyString(rawMessageId);
		if (!threadId || !messageId) {
			return res.status(400).json({ error: "threadId and messageId are required" });
		}

		const vote = await futureChatVoteManager.setVote({
			threadId,
			messageId,
			value: value === "up" || value === "down" ? value : null,
		});
		return res.status(200).json({ vote });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to update vote:", error);
		return res.status(500).json({ error: "Failed to update Future Chat vote" });
	}
});

app.get("/api/future-chat/documents", async (req, res) => {
	try {
		const rawThreadId = Array.isArray(req.query.threadId) ? req.query.threadId[0] : req.query.threadId;
		const rawDocumentId = Array.isArray(req.query.documentId) ? req.query.documentId[0] : req.query.documentId;
		const threadId = getNonEmptyString(rawThreadId);
		const documentId = getNonEmptyString(rawDocumentId);

		if (documentId) {
			const document = await futureChatDocumentManager.getDocument(documentId);
			if (!document) {
				return res.status(404).json({ error: "Document not found" });
			}
			return res.status(200).json({ document });
		}

		const documents = await futureChatDocumentManager.listDocuments({ threadId: threadId || undefined });
		return res.status(200).json({ documents });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to list documents:", error);
		return res.status(500).json({ error: "Failed to load Future Chat documents" });
	}
});

app.post("/api/future-chat/documents", async (req, res) => {
	try {
		const {
			changeLabel,
			documentId,
			threadId,
			title,
			kind,
			content,
			sourceMessageId,
		} = req.body || {};
		if (typeof documentId === "string" && documentId.trim()) {
			if (typeof content === "string") {
				const document = await futureChatDocumentManager.appendDocumentVersion(documentId, {
					changeLabel,
					title,
					kind,
					content,
				});
				if (!document) {
					return res.status(404).json({ error: "Document not found" });
				}
				return res.status(200).json({ document });
			}

			const document = await futureChatDocumentManager.patchDocumentMetadata(documentId, {
				sourceMessageId,
			});
			if (!document) {
				return res.status(404).json({ error: "Document not found" });
			}
			return res.status(200).json({ document });
		}

		if (typeof threadId !== "string" || !threadId.trim()) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const document = await futureChatDocumentManager.createDocument({
			changeLabel,
			threadId,
			title,
			kind,
			content,
			sourceMessageId,
		});
		return res.status(201).json({ document });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to save document:", error);
		return res.status(500).json({ error: "Failed to save Future Chat document" });
	}
});

app.delete("/api/future-chat/documents", async (req, res) => {
	try {
		const rawDocumentId = Array.isArray(req.query.documentId) ? req.query.documentId[0] : req.query.documentId;
		const documentId = getNonEmptyString(rawDocumentId);
		if (!documentId) {
			return res.status(400).json({ error: "documentId is required" });
		}

		await futureChatDocumentManager.deleteDocument(documentId);
		return res.status(200).json({ deleted: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to delete document:", error);
		return res.status(500).json({ error: "Failed to delete Future Chat document" });
	}
});

app.post("/api/future-chat/files/upload", async (req, res) => {
	try {
		const { name, mediaType, dataUrl, threadId } = req.body || {};
		if (typeof dataUrl !== "string" || !dataUrl.trim()) {
			return res.status(400).json({ error: "dataUrl is required" });
		}

		const upload = await futureChatUploadManager.createUploadFromDataUrl({
			threadId: getNonEmptyString(threadId) || undefined,
			filename: typeof name === "string" && name.trim() ? name : "attachment.bin",
			mediaType: typeof mediaType === "string" && mediaType.trim() ? mediaType : undefined,
			dataUrl,
		});
		return res.status(201).json({
			file: {
				id: upload.id,
				filename: upload.filename,
				mediaType: upload.mediaType,
				sizeBytes: upload.sizeBytes,
				url: buildFutureChatFileUrl(upload.id),
			},
		});
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to upload file:", error);
		const message = error instanceof Error ? error.message : "Failed to upload file";
		return res.status(400).json({ error: message });
	}
});

app.get("/api/future-chat/files/:fileId", async (req, res) => {
	try {
		const upload = await futureChatUploadManager.getUpload(req.params.fileId);
		if (!upload) {
			return res.status(404).json({ error: "File not found" });
		}

		res.setHeader("Content-Type", upload.mediaType || "application/octet-stream");
		res.setHeader("Content-Length", String(upload.sizeBytes || upload.buffer.length));
		res.setHeader(
			"Content-Disposition",
			`inline; filename="${upload.filename || "attachment.bin"}"`
		);
		return res.status(200).send(upload.buffer);
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to serve file:", error);
		return res.status(500).json({ error: "Failed to serve Future Chat file" });
	}
});

// ─── Orchestrator Log Endpoints ──────────────────────────────────────────────

app.get("/api/orchestrator/log", (req, res) => {
	try {
		const limit = req.query.limit !== undefined
			? parseInt(req.query.limit, 10)
			: undefined;

		const filter = {};
		if (typeof limit === "number" && !isNaN(limit) && limit > 0) {
			filter.limit = limit;
		}

		const entries = orchestratorLog.getEntries(
			Object.keys(filter).length > 0 ? filter : undefined
		);
		const stats = orchestratorLog.getStats();

		return res.json({ entries, stats });
	} catch (error) {
		console.error("[ORCHESTRATOR] Failed to get log:", error);
		return res.status(500).json({ error: "Failed to retrieve orchestrator log" });
	}
});

app.get("/api/orchestrator/timeline", (req, res) => {
	try {
		const limit = req.query.limit !== undefined
			? parseInt(req.query.limit, 10)
			: undefined;

		const filter = {};
		if (typeof limit === "number" && !isNaN(limit) && limit > 0) {
			filter.limit = limit;
		}

		const timeline = orchestratorLog.toTimeline(
			Object.keys(filter).length > 0 ? filter : undefined
		);
		const stats = orchestratorLog.getStats();

		return res.json({ timeline, stats });
	} catch (error) {
		console.error("[ORCHESTRATOR] Failed to get timeline:", error);
		return res.status(500).json({ error: "Failed to retrieve orchestrator timeline" });
	}
});

app.delete("/api/orchestrator/log", (_req, res) => {
	try {
		orchestratorLog.clear();
		return res.json({ ok: true, message: "Orchestrator log cleared" });
	} catch (error) {
		console.error("[ORCHESTRATOR] Failed to clear log:", error);
		return res.status(500).json({ error: "Failed to clear orchestrator log" });
	}
});


// ─── Make Endpoints ──────────────────────────────────────────────────

app.post("/api/make/runs", async (req, res) => {
	try {
		const {
			plan,
			userPrompt,
			conversation,
			customInstruction,
			agentCount,
			sourceSurface,
		} = req.body || {};

		const run = await makeRunManager.createRun({
			plan,
			userPrompt,
			conversation,
			customInstruction,
			agentCount,
			sourceSurface,
		});
		return res.status(201).json({ run });
	} catch (error) {
		console.error("[MAKE-RUN] Failed to create run:", error);
		const message = error instanceof Error ? error.message : "Failed to create run";
		return res.status(400).json({ error: message });
	}
});

app.get("/api/make/runs", async (req, res) => {
	try {
		const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
		const runs = await makeRunManager.listRuns({ limit: rawLimit });
		return res.status(200).json({ runs });
	} catch (error) {
		console.error("[MAKE-RUN] Failed to list runs:", error);
		const message = error instanceof Error ? error.message : "Failed to list runs";
		return res.status(500).json({ error: message });
	}
});

app.get("/api/make/runs/:runId", async (req, res) => {
	try {
		const runId = req.params.runId;
		const run = await makeRunManager.getRun(runId);
		if (!run) {
			return res.status(404).json({ error: "Run not found" });
		}

		return res.status(200).json({ run });
	} catch (error) {
		console.error("[MAKE-RUN] Failed to get run:", error);
		return res.status(500).json({ error: "Failed to load run" });
	}
});

app.delete("/api/make/runs/:runId", async (req, res) => {
	try {
		const runId = req.params.runId;
		await makeRunManager.deleteRun(runId);
		return res.status(200).json({ deleted: true });
	} catch (error) {
		console.error("[MAKE-RUN] Failed to delete run:", error);
		return res.status(500).json({ error: "Failed to delete run" });
	}
});

app.post("/api/make/runs/:runId/tasks", async (req, res) => {
	try {
		const runId = req.params.runId;
		const {
			planDelta,
			prompt,
			contextPrompt,
			conversation,
			customInstruction,
			retryTaskIds,
		} = req.body || {};
		const result = await makeRunManager.appendTasks(runId, {
			planDelta,
			prompt,
			contextPrompt,
			conversation,
			customInstruction,
			retryTaskIds,
		});

		if (result?.error) {
			return res.status(400).json({ error: result.error });
		}

		return res.status(200).json(result);
	} catch (error) {
		console.error("[MAKE-RUN] Failed to append run tasks:", error);
		const message = error instanceof Error ? error.message : "Failed to append tasks";
		return res.status(400).json({ error: message });
	}
});

app.get("/api/make/runs/:runId/stream", async (req, res) => {
	try {
		const runId = req.params.runId;
		await makeRunManager.streamRunEvents(req, res, runId);
	} catch (error) {
		console.error("[MAKE-RUN] Failed to stream run events:", error);
		if (!res.headersSent) {
			res.status(500).json({ error: "Failed to stream run events" });
		}
	}
});

app.post("/api/make/runs/:runId/directives", async (req, res) => {
	try {
		const runId = req.params.runId;
		const { agentName, message } = req.body || {};
		const result = await makeRunManager.addDirective(runId, {
			agentName,
			message,
		});

		if (result.error) {
			return res.status(400).json({ error: result.error });
		}

		return res.status(200).json(result);
	} catch (error) {
		console.error("[MAKE-RUN] Failed to add directive:", error);
		return res.status(500).json({ error: "Failed to add directive" });
	}
});

app.post("/api/make/runs/:runId/share", async (req, res) => {
	try {
		const runId = req.params.runId;
		const requestBody = req.body && typeof req.body === "object" ? req.body : {};
		const target = getNonEmptyString(requestBody.target)?.toLowerCase();
		if (target !== "confluence" && target !== "slack") {
			return res.status(400).json({
				error: "Invalid share target. Use 'confluence' or 'slack'.",
			});
		}

		const runSummary = await makeRunManager.getRunSummary(runId);
		if (!runSummary || !runSummary.run) {
			return res.status(404).json({ error: "Run not found" });
		}

		const summaryContent = getNonEmptyString(runSummary.summary?.content);
		if (!summaryContent) {
			return res.status(409).json({
				error: "Final synthesis is not ready yet. Try again after summary generation completes.",
			});
		}

		if (target === "confluence") {
			const confluenceInput =
				requestBody.confluence && typeof requestBody.confluence === "object"
					? requestBody.confluence
					: {};
			const result = await createConfluenceSummaryPage({
				run: runSummary.run,
				summary: runSummary.summary,
				summaryContent,
				confluence: confluenceInput,
			});
			return res.status(200).json({
				ok: true,
				target: "confluence",
				externalUrl: result.externalUrl,
			});
		}

		const slackResult = await sendSlackSummaryDm({
			run: runSummary.run,
			summary: runSummary.summary,
			summaryContent,
		});
		return res.status(200).json({
			ok: true,
			target: "slack",
			messageTs: slackResult.messageTs,
		});
	} catch (error) {
		console.error("[MAKE-RUN] Failed to share run summary:", error);
		const status = typeof error?.status === "number" ? error.status : 500;
		const message =
			error instanceof Error && error.message.trim()
				? error.message.trim()
				: "Failed to share run summary";
		return res.status(status).json({ error: message });
	}
});

app.get("/api/make/runs/:runId/summary", async (req, res) => {
	try {
		const runId = req.params.runId;
		const summary = await makeRunManager.getRunSummary(runId);
		if (!summary) {
			return res.status(404).json({ error: "Run not found" });
		}

		return res.status(200).json(summary);
	} catch (error) {
		console.error("[MAKE-RUN] Failed to load run summary:", error);
		return res.status(500).json({ error: "Failed to load run summary" });
	}
});


// --- Forge Publish ---

app.get("/api/make/forge/sites", async (_req, res) => {
	try {
		const sites = await forgePublishManager.discoverSites();
		return res.status(200).json({ sites });
	} catch (error) {
		console.error("[FORGE-PUBLISH] Failed to discover sites:", error);
		return res.status(500).json({ error: "Failed to discover Atlassian sites" });
	}
});

app.get("/api/make/forge/dev-spaces", async (_req, res) => {
	try {
		const devSpaces = await forgePublishManager.discoverDevSpaces();
		return res.status(200).json({ devSpaces });
	} catch (error) {
		console.error("[FORGE-PUBLISH] Failed to discover dev spaces:", error);
		return res.status(500).json({ error: "Failed to discover developer spaces" });
	}
});

app.get("/api/make/runs/:runId/publish", async (req, res) => {
	try {
		const { runId } = req.params;
		const status = await forgePublishManager.getPublishStatus(runId);
		return res.status(200).json(status);
	} catch (error) {
		console.error("[FORGE-PUBLISH] Failed to get publish status:", error);
		return res.status(500).json({ error: "Failed to get publish status" });
	}
});

app.post("/api/make/runs/:runId/publish", async (req, res) => {
	try {
		const { runId } = req.params;
		const { appName, siteUrl, product } = req.body ?? {};

		if (!appName || !siteUrl) {
			return res.status(400).json({ error: "appName and siteUrl are required" });
		}

		// Resolve the app slug for this run
		const existingApp = await appRegistry.getAppByRunId(runId);
		if (!existingApp) {
			return res.status(404).json({ error: "No generated app found for this run. Build the app first." });
		}

		const appSlug = existingApp.slug;

		// Start the publish process (runs async, but we await it)
		const progressSteps = [];
		const result = await forgePublishManager.publish(
			{
				runId,
				appSlug,
				appName,
				siteUrl,
				product: product || "jira",
			},
			(progress) => {
				progressSteps.push(progress);
			},
		);

		return res.status(result.success ? 200 : 500).json({
			...result,
			steps: progressSteps,
		});
	} catch (error) {
		console.error("[FORGE-PUBLISH] Publish failed:", error);
		return res.status(500).json({ error: "Publish failed" });
	}
});

// --- Tools list ---

app.get("/api/make/tools", (req, res) => {
	// Returns available MCP tools. Stub for now — will be populated from MCP server discovery.
	return res.status(200).json({ tools: [] });
});

// --- Skills CRUD (filesystem-backed) ---

app.get("/api/make/skills", (req, res) => {
	try {
		const skills = makeFs.listSkills();
		return res.status(200).json({ skills });
	} catch (error) {
		console.error("[MAKE-FS] Failed to list skills:", error);
		return res.status(500).json({ error: "Failed to list skills" });
	}
});

app.post("/api/make/skills", (req, res) => {
	try {
		const contentType = req.headers["content-type"] || "";

		// Handle markdown import (raw SKILL.md content)
		if (contentType.includes("text/markdown")) {
			let rawContent = "";
			if (typeof req.body === "string") {
				rawContent = req.body;
			} else if (Buffer.isBuffer(req.body)) {
				rawContent = req.body.toString("utf8");
			} else {
				return res.status(400).json({ error: "Expected markdown content" });
			}

			const { frontmatter, body } = makeFs.parseFrontmatter(rawContent);
			const name = frontmatter.name;
			const description = typeof frontmatter.description === "string" ? frontmatter.description : "";

			if (!name || typeof name !== "string") {
				return res.status(400).json({ error: "SKILL.md must have a 'name' field in frontmatter" });
			}

			const nameError = makeFs.validateSkillName(name);
			if (nameError) {
				return res.status(400).json({ error: nameError });
			}

			if (makeFs.skillExists(name)) {
				return res.status(409).json({ error: `A skill named "${name}" already exists` });
			}

			const extraFields = {};
			if (frontmatter.license) extraFields.license = frontmatter.license;
			if (frontmatter.compatibility) extraFields.compatibility = frontmatter.compatibility;
			if (frontmatter["allowed-tools"]) extraFields["allowed-tools"] = frontmatter["allowed-tools"];

			const skill = makeFs.writeSkill(name, description, body.trim(), extraFields);
			return res.status(201).json({ skill });
		}

		const { name, description, content } = req.body || {};

		// Validate name
		const nameError = makeFs.validateSkillName(name);
		if (nameError) {
			return res.status(400).json({ error: nameError });
		}
		if (!makeFs.validatePathComponent(name)) {
			return res.status(400).json({ error: "Invalid skill name" });
		}

		// Validate description
		const descError = makeFs.validateSkillDescription(description);
		if (descError) {
			return res.status(400).json({ error: descError });
		}

		// Check for conflicts
		if (makeFs.skillExists(name)) {
			return res.status(409).json({ error: `A skill named "${name}" already exists` });
		}

		// Validate content length
		const resolvedContent = typeof content === "string" ? content.trim() : "";
		if (resolvedContent.length > makeFs.SKILL_CONTENT_MAX) {
			return res.status(400).json({ error: `Content exceeds maximum length of ${makeFs.SKILL_CONTENT_MAX} characters` });
		}

		const skill = makeFs.writeSkill(name, description, resolvedContent);
		return res.status(201).json({ skill });
	} catch (error) {
		console.error("[MAKE-FS] Failed to create skill:", error);
		const message = error instanceof Error ? error.message : "Failed to create skill";
		return res.status(500).json({ error: message });
	}
});

app.put("/api/make/skills/:name", (req, res) => {
	try {
		const name = req.params.name;
		if (!makeFs.validatePathComponent(name)) {
			return res.status(400).json({ error: "Invalid skill name" });
		}

		// Read existing skill
		const existing = makeFs.getSkillByName(name);
		if (!existing) {
			return res.status(404).json({ error: `Skill not found: ${name}` });
		}

		// Merge updates
		const data = req.body || {};
		const updatedDescription = data.description !== undefined ? data.description : existing.description;
		const updatedContent = data.content !== undefined ? (typeof data.content === "string" ? data.content.trim() : "") : existing.content;

		// Validate if description changed
		if (data.description !== undefined) {
			const descError = makeFs.validateSkillDescription(updatedDescription);
			if (descError) {
				return res.status(400).json({ error: descError });
			}
		}

		// Validate content length
		if (updatedContent.length > makeFs.SKILL_CONTENT_MAX) {
			return res.status(400).json({ error: `Content exceeds maximum length of ${makeFs.SKILL_CONTENT_MAX} characters` });
		}

		// Preserve extra fields from existing skill
		const extraFields = {};
		if (existing.license) extraFields.license = existing.license;
		if (existing.compatibility) extraFields.compatibility = existing.compatibility;
		if (existing.allowedTools) extraFields["allowed-tools"] = existing.allowedTools;

		const skill = makeFs.writeSkill(name, updatedDescription, updatedContent, extraFields);
		return res.status(200).json({ skill });
	} catch (error) {
		console.error("[MAKE-FS] Failed to update skill:", error);
		const message = error instanceof Error ? error.message : "Failed to update skill";
		return res.status(500).json({ error: message });
	}
});

app.delete("/api/make/skills/:name", (req, res) => {
	try {
		const name = req.params.name;
		if (!makeFs.validatePathComponent(name)) {
			return res.status(400).json({ error: "Invalid skill name" });
		}
		makeFs.deleteSkill(name);
		return res.status(200).json({ success: true });
	} catch (error) {
		console.error("[MAKE-FS] Failed to delete skill:", error);
		const message = error instanceof Error ? error.message : "Failed to delete skill";
		return res.status(error.message?.includes("not found") ? 404 : 500).json({ error: message });
	}
});

app.get("/api/make/skills/:name/raw", (req, res) => {
	try {
		const name = req.params.name;
		if (!makeFs.validatePathComponent(name)) {
			return res.status(400).json({ error: "Invalid skill name" });
		}
		const raw = makeFs.readSkillRaw(name);
		if (!raw) {
			return res.status(404).json({ error: `Skill not found: ${name}` });
		}
		res.setHeader("Content-Type", "text/markdown; charset=utf-8");
		return res.status(200).send(raw);
	} catch (error) {
		console.error("[MAKE-FS] Failed to read skill raw:", error);
		return res.status(500).json({ error: "Failed to read skill" });
	}
});

// --- Agents/Subagents CRUD (filesystem-backed) ---

app.get("/api/make/agents", (req, res) => {
	try {
		const agents = makeFs.listAgents();
		return res.status(200).json({ agents });
	} catch (error) {
		console.error("[MAKE-FS] Failed to list agents:", error);
		return res.status(500).json({ error: "Failed to list agents" });
	}
});

app.post("/api/make/agents", (req, res) => {
	try {
		const contentType = req.headers["content-type"] || "";

		// Handle markdown import (raw agent .md content)
		if (contentType.includes("text/markdown")) {
			let rawContent = "";
			if (typeof req.body === "string") {
				rawContent = req.body;
			} else if (Buffer.isBuffer(req.body)) {
				rawContent = req.body.toString("utf8");
			} else {
				return res.status(400).json({ error: "Expected markdown content" });
			}

			const { frontmatter, body } = makeFs.parseFrontmatter(rawContent);
			const name = frontmatter.name;

			if (!name || typeof name !== "string") {
				return res.status(400).json({ error: "Agent .md must have a 'name' field in frontmatter" });
			}

			const nameError = makeFs.validateAgentName(name);
			if (nameError) {
				return res.status(400).json({ error: nameError });
			}

			if (makeFs.agentExists(name)) {
				return res.status(409).json({ error: `An agent named "${name}" already exists` });
			}

			// Parse tools and skills from frontmatter
			let tools = [];
			if (frontmatter.tools) {
				if (Array.isArray(frontmatter.tools)) {
					tools = frontmatter.tools.map((t) => String(t).trim()).filter(Boolean);
				} else if (typeof frontmatter.tools === "string") {
					tools = frontmatter.tools.split(",").map((t) => t.trim()).filter(Boolean);
				}
			}

			let skills = [];
			if (frontmatter.skills) {
				if (Array.isArray(frontmatter.skills)) {
					skills = frontmatter.skills.map((s) => String(s).trim()).filter(Boolean);
				} else if (typeof frontmatter.skills === "string") {
					skills = frontmatter.skills.split(",").map((s) => s.trim()).filter(Boolean);
				}
			}

			let disallowedTools = [];
			if (frontmatter.disallowedTools) {
				if (Array.isArray(frontmatter.disallowedTools)) {
					disallowedTools = frontmatter.disallowedTools.map((t) => String(t).trim()).filter(Boolean);
				} else if (typeof frontmatter.disallowedTools === "string") {
					disallowedTools = frontmatter.disallowedTools.split(",").map((t) => t.trim()).filter(Boolean);
				}
			}

			const agent = makeFs.writeAgent(name, {
				description: typeof frontmatter.description === "string" ? frontmatter.description.trim() : "",
				systemPrompt: body.trim(),
				model: typeof frontmatter.model === "string" && frontmatter.model.trim() ? frontmatter.model.trim() : "inherit",
				tools,
				disallowedTools,
				skills,
				maxTurns: frontmatter.maxTurns ? parseInt(String(frontmatter.maxTurns), 10) : undefined,
				permissionMode: typeof frontmatter.permissionMode === "string" && frontmatter.permissionMode.trim() ? frontmatter.permissionMode.trim() : undefined,
			});
			return res.status(201).json({ agent });
		}

		const { name, description, systemPrompt, model, tools, skills, disallowedTools, maxTurns, permissionMode } = req.body || {};

		// Validate name
		const nameError = makeFs.validateAgentName(name);
		if (nameError) {
			return res.status(400).json({ error: nameError });
		}
		if (!makeFs.validatePathComponent(name)) {
			return res.status(400).json({ error: "Invalid agent name" });
		}

		// Validate description
		if (!description || typeof description !== "string" || !description.trim()) {
			return res.status(400).json({ error: "Description is required" });
		}

		// Check for conflicts
		if (makeFs.agentExists(name)) {
			return res.status(409).json({ error: `An agent named "${name}" already exists` });
		}

		const agent = makeFs.writeAgent(name, {
			description: description.trim(),
			systemPrompt: typeof systemPrompt === "string" ? systemPrompt.trim() : "",
			model: typeof model === "string" && model.trim() ? model.trim() : "inherit",
			tools: Array.isArray(tools) ? tools.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim()) : [],
			disallowedTools: Array.isArray(disallowedTools) ? disallowedTools.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim()) : [],
			skills: Array.isArray(skills) ? skills.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim()) : [],
			maxTurns: typeof maxTurns === "number" && Number.isInteger(maxTurns) && maxTurns > 0 ? maxTurns : undefined,
			permissionMode: typeof permissionMode === "string" && permissionMode.trim() ? permissionMode.trim() : undefined,
		});
		return res.status(201).json({ agent });
	} catch (error) {
		console.error("[MAKE-FS] Failed to create agent:", error);
		const message = error instanceof Error ? error.message : "Failed to create agent";
		return res.status(500).json({ error: message });
	}
});

app.put("/api/make/agents/:name", (req, res) => {
	try {
		const name = req.params.name;
		if (!makeFs.validatePathComponent(name)) {
			return res.status(400).json({ error: "Invalid agent name" });
		}

		// Read existing agent
		const existing = makeFs.getAgentByName(name);
		if (!existing) {
			return res.status(404).json({ error: `Agent not found: ${name}` });
		}

		// Merge updates
		const data = req.body || {};
		const updated = {
			description: data.description !== undefined ? (typeof data.description === "string" ? data.description.trim() : existing.description) : existing.description,
			systemPrompt: data.systemPrompt !== undefined ? (typeof data.systemPrompt === "string" ? data.systemPrompt.trim() : "") : existing.systemPrompt,
			model: data.model !== undefined ? (typeof data.model === "string" && data.model.trim() ? data.model.trim() : existing.model) : existing.model,
			tools: data.tools !== undefined ? (Array.isArray(data.tools) ? data.tools.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim()) : existing.tools) : existing.tools,
			disallowedTools: data.disallowedTools !== undefined ? (Array.isArray(data.disallowedTools) ? data.disallowedTools.filter((t) => typeof t === "string" && t.trim()).map((t) => t.trim()) : existing.disallowedTools) : existing.disallowedTools,
			skills: data.skills !== undefined ? (Array.isArray(data.skills) ? data.skills.filter((s) => typeof s === "string" && s.trim()).map((s) => s.trim()) : existing.skills) : existing.skills,
			maxTurns: data.maxTurns !== undefined ? (typeof data.maxTurns === "number" && Number.isInteger(data.maxTurns) && data.maxTurns > 0 ? data.maxTurns : undefined) : existing.maxTurns,
			permissionMode: data.permissionMode !== undefined ? (typeof data.permissionMode === "string" && data.permissionMode.trim() ? data.permissionMode.trim() : undefined) : existing.permissionMode,
		};

		// Validate description if changed
		if (data.description !== undefined && (!updated.description || !updated.description.trim())) {
			return res.status(400).json({ error: "Description is required" });
		}

		const agent = makeFs.writeAgent(name, updated);
		return res.status(200).json({ agent });
	} catch (error) {
		console.error("[MAKE-FS] Failed to update agent:", error);
		const message = error instanceof Error ? error.message : "Failed to update agent";
		return res.status(500).json({ error: message });
	}
});

app.delete("/api/make/agents/:name", (req, res) => {
	try {
		const name = req.params.name;
		if (!makeFs.validatePathComponent(name)) {
			return res.status(400).json({ error: "Invalid agent name" });
		}
		makeFs.deleteAgent(name);
		return res.status(200).json({ success: true });
	} catch (error) {
		console.error("[MAKE-FS] Failed to delete agent:", error);
		const message = error instanceof Error ? error.message : "Failed to delete agent";
		return res.status(error.message?.includes("not found") ? 404 : 500).json({ error: message });
	}
});

app.get("/api/make/agents/:name/raw", (req, res) => {
	try {
		const name = req.params.name;
		if (!makeFs.validatePathComponent(name)) {
			return res.status(400).json({ error: "Invalid agent name" });
		}
		const raw = makeFs.readAgentRaw(name);
		if (!raw) {
			return res.status(404).json({ error: `Agent not found: ${name}` });
		}
		res.setHeader("Content-Type", "text/markdown; charset=utf-8");
		return res.status(200).send(raw);
	} catch (error) {
		console.error("[MAKE-FS] Failed to read agent raw:", error);
		return res.status(500).json({ error: "Failed to read agent" });
	}
});

// --- Config summary (for make context injection) ---

// ─── Generated Apps Registry ────────────────────────────────────────────────

app.get("/api/apps", async (_req, res) => {
	try {
		const apps = await appRegistry.listApps();
		return res.status(200).json({ apps });
	} catch (error) {
		console.error("[APP-REGISTRY] Failed to list apps:", error);
		return res.status(500).json({ error: "Failed to list apps" });
	}
});

app.get("/api/apps/:slug", async (req, res) => {
	try {
		const slug = req.params.slug;
		const app = await appRegistry.getApp(slug);
		if (!app) {
			return res.status(404).json({ error: "App not found" });
		}
		return res.status(200).json({ app });
	} catch (error) {
		console.error("[APP-REGISTRY] Failed to get app:", error);
		return res.status(500).json({ error: "Failed to get app" });
	}
});

app.delete("/api/apps/:slug", async (req, res) => {
	try {
		const slug = req.params.slug;
		const app = await appRegistry.getApp(slug);
		if (!app) {
			return res.status(404).json({ error: "App not found" });
		}

		// Delete the generated app files
		const appDir = `components/generated-apps/${slug}`;
		const fsPromises = require("node:fs/promises");
		const appDirPath = path.resolve(__dirname, "..", appDir);
		try {
			await fsPromises.rm(appDirPath, { recursive: true, force: true });
			console.log(`[APP-REGISTRY] Deleted app directory: ${appDir}`);
		} catch (dirError) {
			if (dirError.code !== "ENOENT") {
				console.warn(`[APP-REGISTRY] Failed to delete app directory: ${dirError.message}`);
			}
		}

		// Remove from registry
		await appRegistry.unregisterApp(slug);
		return res.status(200).json({ deleted: true });
	} catch (error) {
		console.error("[APP-REGISTRY] Failed to delete app:", error);
		return res.status(500).json({ error: "Failed to delete app" });
	}
});

// ─────────────────────────────────────────────────────────────────────────────

app.get("/api/make/config-summary", (req, res) => {
	try {
		const summary = makeFs.getConfigSummary();
		return res.status(200).json({ summary });
	} catch (error) {
		console.error("[MAKE-FS] Failed to get config summary:", error);
		return res.status(500).json({ error: "Failed to get config summary" });
	}
});

// ─── Ticket Classifier ──────────────────────────────────────────────────────

app.post("/api/ticket-classify", async (req, res) => {
	try {
		const { siteUrl, project, excludeStatuses, limit } = req.body || {};
		const result = await classifyTickets({
			siteUrl,
			project,
			excludeStatuses,
			limit,
		});
		return res.json(result);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		return res.status(statusCode).json({
			error: "Failed to classify tickets",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

// ─── Claim Test ──────────────────────────────────────────────────────────────

app.get("/api/claim-test", async (req, res) => {
	try {
		const result = await handleGetClaimTest(req.query);
		res.status(result.status).json(result.body);
	} catch (error) {
		console.error("Claim test GET error:", error);
		res.status(500).json({
			error: "Claim test GET failed",
			details: error.message,
		});
	}
});

app.post("/api/claim-test", async (req, res) => {
	try {
		const result = await handlePostClaimTest(req.body);
		res.status(result.status).json(result.body);
	} catch (error) {
		console.error("Claim test POST error:", error);
		res.status(500).json({
			error: "Claim test POST failed",
			details: error.message,
		});
	}
});

app.delete("/api/claim-test", async (req, res) => {
	try {
		const result = await handleDeleteClaimTest(req.query);
		res.status(result.status).json(result.body);
	} catch (error) {
		console.error("Claim test DELETE error:", error);
		res.status(500).json({
			error: "Claim test DELETE failed",
			details: error.message,
		});
	}
});

// ─── Standup Summary ─────────────────────────────────────────────────────────

app.post("/api/standup", async (req, res) => {
	try {
		const { siteUrl, hoursAgo, projects, limit } = req.body || {};
		const summary = await generateStandupSummary({
			siteUrl,
			hoursAgo,
			projects,
			limit,
		});
		return res.json(summary);
	} catch (error) {
		const statusCode = error.statusCode || 500;
		return res.status(statusCode).json({
			error: "Failed to generate standup summary",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/healthcheck", (req, res) => {
	console.log("Healthcheck requested by Micros");
	res.status(200).json({ status: "ok" });
});

app.get("/api/health", async (req, res) => {
	console.log("Health check requested");
	debugLog("HEALTH", "Processing health check");

	const key = process.env.ASAP_PRIVATE_KEY;
	const rovoDevAvailable = await isRovoDevAvailable();
	const envVars = getEnvVars();
	const fallbackEnabled = isAIGatewayFallbackEnabled();
	const aiGatewayConfigured = hasGatewayUrlConfigured(envVars);
	const fallbackActive = !rovoDevAvailable && fallbackEnabled;

	debugLog("HEALTH", "Auth configuration", {
		hasAsapKey: !!key,
		rovoDevAvailable,
		fallbackEnabled,
		aiGatewayConfigured,
	});

	const response = {
		status: "OK",
		message: "Backend server is working!",
		timestamp: new Date().toISOString(),
		authMethod: "ASAP",
		debugMode: DEBUG,
		rovoDevMode: rovoDevAvailable,
		llmRouting: {
			rovodevAvailable: rovoDevAvailable,
			fallbackEnabled,
			fallbackActive,
			aiGatewayConfigured,
			aiGatewayConfig: getAIGatewayConfigReport(envVars),
		},
		envCheck: {
			ASAP_PRIVATE_KEY: key ? "SET" : "MISSING",
			ROVODEV_PORT: process.env.ROVODEV_PORT ? "SET" : "MISSING",
		},
	};

	res.status(200).json(response);
});

// Serve static files from Next.js export output
const publicPath = path.join(__dirname, "public");
console.log(`[STARTUP] Serving static files from: ${publicPath}`);

// Serve all static files (CSS, JS, images, etc.)
app.use(express.static(publicPath));

// For all other routes, try to serve the corresponding HTML file or fallback to index.html.
// Express 5 requires a named wildcard instead of the legacy "*" path.
app.get("/{*splat}", (req, res) => {
	console.log(`[STATIC] Request for route: ${req.path}`);

	// Never serve HTML for unmatched API routes. Return JSON 404 instead so
	// frontend callers don't attempt to parse HTML as JSON.
	if (req.path.startsWith("/api/")) {
		return res.status(404).json({
			error: `API route not found: ${req.path}`,
		});
	}

	// Try to serve index.html for SPA routing
	const indexPath = path.join(publicPath, "index.html");
	res.sendFile(indexPath, (err) => {
		if (err) {
			console.log(`[STATIC] index.html not found at ${indexPath}`);
			// If index.html doesn't exist, return a minimal HTML page
			res.status(200).send(`<!DOCTYPE html>
<html>
<head>
<title>VPK</title>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body>
<div id="root">
<h1>VPK Service</h1>
<p>Service is running and ready to serve content.</p>
<p><a href="/healthcheck">Health Check</a></p>
<p><a href="/api/health">API Health Check</a></p>
</div>
</body>
</html>`);
		}
	});
});

console.log("[STARTUP] All routes registered, starting HTTP server...");

const server = app.listen(port, "0.0.0.0", async () => {
	console.log(`[STARTUP] ✓ Server listening on 0.0.0.0:${port}`);
	console.log(`\n${"=".repeat(60)}`);
	console.log(`Server ready for connections`);
	console.log("Environment check:");
	console.log(`  PORT: ${port}`);
	console.log(`  AI_GATEWAY_URL: ${process.env.AI_GATEWAY_URL ? "SET" : "MISSING"}`);
	console.log(`  Debug Mode: ${DEBUG}`);

	console.log("\n🔐 Using ASAP Authentication");
	console.log(`  ASAP_ISSUER: ${process.env.ASAP_ISSUER ? "SET" : "MISSING"}`);
	console.log(`  ASAP_KID: ${process.env.ASAP_KID ? "SET" : "MISSING"}`);
	console.log(`  ASAP_PRIVATE_KEY: ${process.env.ASAP_PRIVATE_KEY ? "SET" : "MISSING"}`);

	// Check for RovoDev Serve at startup
	const rovoDevReady = await refreshRovoDevAvailability();
	const fallbackEnabled = isAIGatewayFallbackEnabled();
	const aiGatewayConfigured = hasGatewayUrlConfigured(getEnvVars());
	let chatBackendLabel = "RovoDev required (interactive fallback disabled)";
	if (rovoDevReady) {
		chatBackendLabel = "RovoDev Serve (agent loop)";
	} else if (
		INTERACTIVE_CHAT_FALLBACK_ENABLED &&
		fallbackEnabled &&
		aiGatewayConfigured
	) {
		chatBackendLabel = "AI Gateway fallback";
	} else if (INTERACTIVE_CHAT_FALLBACK_ENABLED && fallbackEnabled) {
		chatBackendLabel = "AI Gateway fallback (misconfigured)";
	}
	console.log(`\n🤖 Chat Backend: ${chatBackendLabel}`);
	if (rovoDevReady && _rovoDevPool) {
		const poolStatus = _rovoDevPool.getStatus();
		console.log(`  ROVODEV_POOL: ${poolStatus.total} ports (${poolStatus.ports.map((p) => p.port).join(", ")})`);
	} else if (rovoDevReady) {
		console.log(`  ROVODEV_PORT: ${process.env.ROVODEV_PORT}`);
	}
	console.log(`  AUTO_FALLBACK_TO_AI_GATEWAY: ${fallbackEnabled ? "ENABLED" : "DISABLED"}`);
	console.log(
		`  INTERACTIVE_CHAT_FALLBACK: ${
			INTERACTIVE_CHAT_FALLBACK_ENABLED ? "ENABLED" : "DISABLED"
		}`
	);
	console.log(
		`  INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS: ${INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS}`
	);
	console.log(
		`  INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS: ${INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS}`
	);
	console.log(
		`  AI_GATEWAY_ALLOWED_USE_CASES: ${AI_GATEWAY_ALLOWED_USE_CASES.join(", ")}`
	);

	const realtimeConfig = getRealtimeConfig();
	const realtimeDirectKey = Boolean(realtimeConfig.apiKey);
	const realtimeViaGateway = !realtimeDirectKey && Boolean(process.env.ASAP_PRIVATE_KEY);
	const realtimeConfigured = realtimeDirectKey || realtimeViaGateway;
	console.log(`\n🎙️ OpenAI Realtime: ${realtimeConfigured ? "CONFIGURED" : "NOT CONFIGURED"}${realtimeViaGateway ? " (via AI Gateway)" : ""}`);
	if (realtimeConfigured) {
		console.log(`  OPENAI_REALTIME_MODEL: ${realtimeConfig.model}`);
		console.log(`  OPENAI_REALTIME_WS_URL: ${realtimeConfig.wsUrl}`);
		console.log(`  OPENAI_REALTIME_VOICE: ${realtimeConfig.voice}`);
	}

	console.log(`${"=".repeat(60)}\n`);

	if (DEBUG) {
		console.log("[DEBUG MODE ENABLED]");
		console.log("  All debug logs will be printed");
		console.log("  To disable: DEBUG=false\n");
	}
});

// Handle any startup errors
server.on("error", (err) => {
	console.error("Server error:", err);
	process.exit(1);
});

// ─── WebSocket upgrade handler for OpenAI Realtime relay ─────────────────────

const realtimeWss = new WebSocket.Server({ noServer: true });
const browserPreviewWss = new WebSocket.Server({ noServer: true });

server.on("upgrade", (request, socket, head) => {
	const requestUrl = new URL(
		request.url || "/",
		`http://${request.headers.host || "127.0.0.1"}`,
	);
	const browserPreviewMatch = requestUrl.pathname.match(
		/^\/api\/browser-workspaces\/(?<workspaceId>[^/]+)\/live$/u,
	);
	if (browserPreviewMatch?.groups?.workspaceId) {
		const workspaceId = decodeURIComponent(browserPreviewMatch.groups.workspaceId);
		browserPreviewWss.handleUpgrade(request, socket, head, (ws) => {
			browserPreviewWss.emit("connection", ws, request, workspaceId);
		});
		return;
	}

	if (requestUrl.pathname === "/api/realtime/audio-conversation") {
		realtimeWss.handleUpgrade(request, socket, head, (ws) => {
			realtimeWss.emit("connection", ws, request);
		});
		return;
	}

	socket.destroy();
});

realtimeWss.on("connection", (ws) => {
	console.log("[REALTIME] Client connected to /api/realtime/audio-conversation");

	const session = new RealtimeSession(ws, {
		onLog: (section, message) => {
			if (DEBUG) {
				console.log(`[DEBUG][${section}] ${message}`);
			} else {
				console.log(`[${section}] ${message}`);
			}
		},
	});

	session.connect();

	ws.on("message", (data) => {
		session.handleClientMessage(data.toString());
	});

	ws.on("close", () => {
		console.log("[REALTIME] Client disconnected");
		session.close();
	});

	ws.on("error", (err) => {
		console.error("[REALTIME] Client WS error:", err.message);
		session.close();
	});
});

browserPreviewWss.on("connection", (ws, _request, workspaceId) => {
	void browserWorkspaceManager.attachWorkspacePreviewClient(workspaceId, ws).catch(
		(error) => {
			const message =
				error instanceof Error
					? error.message
					: "Failed to attach browser preview client.";
			ws.send(
				JSON.stringify({
					type: "preview-error",
					message,
				}),
			);
			ws.close();
		},
	);

	ws.on("message", (data) => {
		try {
			const payload = JSON.parse(String(data));
			void browserWorkspaceManager.handleWorkspacePreviewControlMessage(
				workspaceId,
				payload,
			);
		} catch (error) {
			ws.send(
				JSON.stringify({
					type: "preview-error",
					message:
						error instanceof Error
							? error.message
							: "Invalid browser preview message.",
				}),
			);
		}
	});

	ws.on("close", () => {
		void browserWorkspaceManager
			.detachWorkspacePreviewClient(workspaceId, ws)
			.catch(() => {});
	});

	ws.on("error", () => {
		void browserWorkspaceManager
			.detachWorkspacePreviewClient(workspaceId, ws)
			.catch(() => {});
	});
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
	console.error("Uncaught exception:", err);
	process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled rejection at:", promise, "reason:", reason);
	process.exit(1);
});

// Graceful shutdown — clean up RovoDev pool
process.on("SIGINT", () => {
	if (_rovoDevPool) {
		_rovoDevPool.shutdown();
	}
	process.exit(0);
});
process.on("SIGTERM", () => {
	if (_rovoDevPool) {
		_rovoDevPool.shutdown();
	}
	process.exit(0);
});
