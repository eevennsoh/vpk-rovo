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

const {
	ensureBrowserRuntimeEnvDefaults,
} = require("./lib/browser-runtime-config");

const browserRuntimeDefaults = ensureBrowserRuntimeEnvDefaults();
if (browserRuntimeDefaults.changed) {
	console.log(
		`[STARTUP] Defaulted ROVO_BROWSER_MODE=${browserRuntimeDefaults.browserMode} (${browserRuntimeDefaults.reason})`
	);
}

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const crypto = require("node:crypto");
const fs = require("fs");
const path = require("path");
const WebSocket = require("ws");
const {
	createUIMessageStream,
	createUIMessageStreamResponse,
	pipeUIMessageStreamToResponse,
} = require("ai");
const { createRovoAppThreadManager } = require("./lib/rovo-app-threads");
const { createRovoAppVoteManager } = require("./lib/rovo-app-votes");
const { createRovoAppDocumentManager } = require("./lib/rovo-app-documents");
const { createRovoAppUploadManager } = require("./lib/rovo-app-uploads");
const {
	createRovoAppGeneratedFilesManager,
} = require("./lib/rovo-app-generated-files");
const {
	createHermesJobsProvider,
} = require("./lib/hermes-jobs-provider");
const {
	archiveHermesSkill,
	createHermesSkillFromBundle,
	getHermesSkill,
	getHermesSkillBundle,
	listHermesSkills,
	toggleHermesSkill,
	updateHermesSkillFromBundle,
} = require("./lib/hermes-skills");
const { getHermesRuntimeStatus } = require("./lib/hermes-status");
const { createHermesJobLinkManager } = require("./lib/hermes-job-links");
const { buildRovoAppHermesContextDescription } = require("./lib/hermes-rovo-context");
const { buildWikiQueryContextDescription } = require("./lib/wiki-query-context");
const {
	getLatestAssistantTextFromMessages,
	runHermesMemoryCompanionReview,
} = require("./lib/hermes-memory-companion");
const {
	deleteWikiMemoryProposal,
	getCanonicalWikiMemoryDocuments,
	pruneCanonicalWikiMemoryBlock,
	syncWikiBackedMemory,
} = require("./lib/wiki-memory-provider");
const {
	buildWikiMemoryBrief,
	buildWikiMemoryDeck,
	buildWikiMemoryExplorer,
	buildWikiMemoryExplorerCsv,
} = require("./lib/wiki-memory-explorer");
const {
	runHermesSkillCompanionReview,
} = require("./lib/hermes-skill-companion");
const { executeRovoTask, runRovoBackgroundTask } = require("./lib/rovo-task-executor");
const { syncHermesJobResultsToRovoThreads } = require("./lib/hermes-rovo-job-sync");
const { buildRuntimeStatusSnapshot } = require("./lib/runtime-status");
const { redactSecrets, detectSecrets } = require("./lib/hermes-secret-redaction");
const { classifyCommand, extractCommandFromArgs } = require("./lib/hermes-command-approval");
const { compressConversation } = require("./lib/hermes-context-compression");
const { searchThreads } = require("./lib/hermes-session-search");
const { createCheckpointManager } = require("./lib/hermes-checkpoints");
const { createSkillsHubClient } = require("./lib/hermes-skills-hub");
const { createHermesSkillDraftManager } = require("./lib/hermes-skill-drafts");
const {
	rankHermesSkillCandidates,
	selectHermesSkillIdsFromRankedCandidates,
	shouldDisambiguateRankedCandidates,
} = require("./lib/hermes-skill-auto-selection");
const { registerHermesSkillDraftRoutes } = require("./lib/hermes-skill-draft-routes");
const { resolveAmbiguousAutoSelectedSkillIds } = require("./lib/hermes-skill-disambiguation");
const { createAbortControllerFromRequest } = require("./lib/http-request-abort");
const {
	appendRuntimeSocketToken: appendRuntimeSocketTokenWithOptions,
	createRuntimeSocketToken: createRuntimeSocketTokenWithOptions,
	isAllowedRuntimeSocketOrigin: isRuntimeSocketOriginAllowed,
	isRuntimeSocketTokenValid: isRuntimeSocketTokenValidWithOptions,
} = require("./lib/runtime-socket-security");
const {
	buildImageProxyRequestHeaders,
	deriveAtlassianImageCandidatesFromUrl,
	extractAtlassianImageCandidatesFromHtml,
	parseImageProxyTarget,
} = require("./lib/image-proxy");
const {
	createCapturedResponse,
	createInProcessRequest,
} = require("./lib/in-process-http");
const { createRovoAppRunManager } = require("./lib/rovo-app-runs");
const {
	collectUiMessagesFromResponseStream,
	createUiMessageChunkSseStream,
} = require("./lib/rovo-app-ui-stream");
const {
	buildRovoAppArtifactIntentPrompt,
	normalizeArtifactKind,
	parseRovoAppArtifactIntent,
	resolveFastRovoAppArtifactIntent,
} = require("./lib/rovo-app-artifact-intent");
const {
	applyAtlassianLogoToHtmlArtifact,
	deriveRovoAppVersionChangeLabel,
	isExplicitNewRovoAppArtifactRequest,
	isSameRovoAppArtifactVersionRequest,
} = require("./lib/rovo-app-artifact-updates");
const {
	captureUrl,
	ensureWikiJobs,
	getWikiStatus,
	lintWiki,
	queryWiki,
	saveSynthesisPage,
} = require("./lib/wiki-clipper");
const {
	ensureFreshWikiQmdIndex,
	getQmdSyncSummary,
	normalizeNaiveWikiSearchResults,
	searchWikiWithQmd,
	syncWikiQmdIndex,
} = require("./lib/qmd");
const {
	createWikiRouteHandlers,
} = require("./lib/wiki-route-handlers");
const personalGraphRoutes = require("./lib/personal-graph-routes");
const {
	inferRovoAppArtifactKindFromContent,
} = require("./lib/rovo-app-artifact-kind");
const {
	WORK_ITEM_REPORT_REQUEST_START,
	buildWorkItemReportRequestContext,
	hasActiveWorkItemContext,
	isWorkItemReportIntent,
	mergeHermesSkillIds,
	resolveWorkItemReportRequest,
} = require("../lib/work-item-report-intent");
const {
	resolveRovoAppActiveArtifact,
} = require("./lib/rovo-app-artifact-routing");
const {
	deriveRovoAppArtifactTitle,
	sanitizeRovoAppArtifactTitle,
} = require("./lib/rovo-app-artifact-titles");
const {
	generateAndPersistRovoAppArtifact,
} = require("./lib/rovo-app-artifact-runner");
const {
	generateWorkItemVpkHtmlReport,
} = require("./lib/work-item-vpk-html-report-generator");
const { genuiChatHandler } = require("./lib/genui-chat-handler");
const {
	streamViaRovo,
	replayViaRovo,
	generateTextViaRovo,
	isChatInProgressError,
	initPool,
	WAIT_FOR_TURN_TIMEOUT_MS,
} = require("./lib/rovo-gateway");
const { classifyRovoHealthCheck } = require("./lib/rovo-health");
const {
	ensureRovoSession,
	getCurrentRovoSession,
} = require("./lib/rovo-session");
const { createAIGatewayProvider } = require("./lib/ai-gateway-provider");
const {
	buildLlmRoutingStatus,
	describeChatBackend,
} = require("./lib/llm-routing-status");
const { isLocalModelRequest, streamLocalModel } = require("./lib/local-model-provider");
const { getGenuiSystemPrompt } = require("./lib/genui-system-prompt");
const { analyzeGeneratedText, pickBestSpec, extractDirectSpec } = require("./lib/genui-spec-utils");
const { buildFallbackGenuiSpecFromText } = require("./lib/genui-fallback-spec");
const { shouldAttemptPostToolGenui } = require("./lib/genui-post-tool-eligibility");
const {
	shouldSuppressHermesKnowledgeDirectSpecCard,
} = require("./lib/hermes-direct-spec-suppression");
const { buildDirectSpecWidgetParts } = require("./lib/direct-spec-widget-parts");
const {
	inferGeneratedMediaContentType,
	resolveGeneratedMediaAbsolutePath,
} = require("./lib/generated-media");
const { withCanonicalPreviewBody } = require("./lib/widget-preview-payload");
const { resolveAutomaticGenuiOutcome } = require("./lib/automatic-genui-outcome");
const { assessToolFirstGenuiQuality } = require("./lib/tool-first-genui-quality");
const { dispatchBespokeGenuiHandler } = require("./lib/bespoke-genui-handler-dispatch");
const {
	buildExcalidrawArtifactSystemPrompt,
	buildExcalidrawWidgetPayload,
	buildExcalidrawWidgetSystemPrompt,
	deriveExcalidrawTitle,
	isExcalidrawDiagramRequest,
	normalizeExcalidrawArtifactOutput,
} = require("./lib/excalidraw-artifact");
const { looksLikeInabilityResponse, looksLikeWriteBlockedResponse } = require("./lib/inability-response-detector");
const { assessPromptComplexityForPlanMode } = require("./lib/plan-mode-complexity-heuristic");
const {
	getPlanSession,
	updatePlanSession,
	recordPlanWidgetEmission,
	clearPlanSession,
	shouldRestorePlanModeOnResume,
	isPlanExecutionPhase,
} = require("./lib/plan-session");
const {
	getPlanFeedbackToolGuard,
} = require("./lib/plan-feedback-tool-guard");
const {
	resolveRoutingDecision,
} = require("./lib/resolve-routing-decision");
const {
	buildRouteDecision,
	createRouteDecisionPart,
} = require("./lib/route-decision");
const {
	AGENT_RESULT_STREAM_PREFIX,
	buildCreationModeContextPrefix,
	buildMissingStudioAgentResultFailureParts,
	extractStudioAgentResultFromText,
	findJsonObjectEndIndex: findStudioAgentJsonObjectEndIndex,
	normalizeStudioAgentResult,
	shouldSurfaceMissingStudioAgentResultFailure,
} = require("./lib/studio-agent-result");
const {
	RFP_DEMO_REPORT_PREVIEW_SUMMARY,
	RFP_DEMO_REPORT_TITLE,
	RFP_DEMO_QUESTION_TOOL_CALL_ID,
	buildAgentsRfpDemoAnswerTrace,
	buildAgentsRfpDemoAgentCreationConfirmationText,
	buildAgentsRfpDemoAgentCreationTrace,
	buildAgentsRfpDemoAgentResultPayload,
	buildAgentsRfpDemoQualificationIntro,
	buildAgentsRfpDemoQualificationTrace,
	buildAgentsRfpDemoQuestionCardPayload,
	buildAgentsRfpDemoReportConfirmationText,
	extractAgentsRfpDemoSelectedKnowledge,
	getAgentsRfpDemoPreloadDelayMs,
	getAgentsRfpDemoToolCallDelayMs,
	resolveAgentsRfpDemoChatTurn,
} = require("./lib/agents-rfp-demo-chat");
const {
	AGENTS_RFP_DEMO_JOB_NAME,
	AGENTS_RFP_DEMO_JOB_PROMPT,
	AGENTS_RFP_DEMO_SURFACE,
	RFP_DRAFTING_AGENT_NAME,
	RFP_DRAFTING_EVENT_TRIGGER,
	RFP_DRAFTING_EVENT_TRIGGER_LABEL,
	advanceRfpDraftingAgentProcessing,
	createAgentsRfpDemoStateManager,
	getDemoCreatedThreadIds,
	moveTicketToColumn,
	runRfpDraftingAgent,
} = require("./lib/agents-rfp-demo-state");
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
	resolveGoogleImageGatewayConfig,
	toImageWidgetErrorMessage,
	isUnsupportedModalitiesError,
} = require("./lib/image-generation-routing");
const {
	healthCheck: rovoHealthCheck,
	cancelChat: rovoCancelChat,
	resumeToolCalls: rovoResumeToolCalls,
} = require("./lib/rovo-client");
const { setAgentMode, getAgentMode } = require("./lib/rovo-agent-mode");
const {
	splitDirectMediaTextForStreaming,
	stripDirectMediaFences,
} = require("./lib/direct-media-fence");
const {
	buildExpiredDeferredClarificationResponse,
	buildClarificationResumeDecision,
	buildClarificationResumeDenyMessage,
	synthesiseDeferredToolResponseFromClarification,
	shouldRejectExpiredDeferredClarification,
} = require("./lib/deferred-clarification");
const {
	cancelActiveDeferredToolCallRecord,
	cancelPausedDeferredToolCallRecord,
} = require("./lib/deferred-tool-cancel");
const {
	handleReplayDeferredToolRequest,
} = require("./lib/replay-deferred-tool");
const {
	getRovoAppRunFailurePayload,
} = require("./lib/rovo-app-run-failure");
const {
	buildInteractiveStuckPortFailureMessage,
	shouldRetryInteractiveStuckPortRecovery,
} = require("./lib/interactive-chat-port-recovery");
const {
	shouldReplaceActiveRunForRequest,
} = require("./lib/rovo-app-run-continuation");
const { createRovoPool } = require("./lib/rovo-pool");
const { createOrchestratorLog } = require("./lib/orchestrator-log");
const {
	generateSuggestedQuestionsViaAIGateway,
} = require("./lib/suggested-questions");
const {
	derivePlanExecutionArtifactTitle,
	generatePlanMetadata,
	getLatestPlanWidgetMetadata,
} = require("./lib/plan-metadata");
const {
	generateDescriptionSummary,
} = require("./lib/genui-description-summary");
const {
	createListeningPidReader,
	restartRovoPort,
	DEFAULT_RECOVERY_TIMEOUT_MS: DEFAULT_ROVO_PORT_RECOVERY_TIMEOUT_MS,
} = require("./lib/rovo-port-recovery");
const {
	resolveRovoPorts,
} = require("./lib/rovo-port-discovery");
const {
	getRovoBasePort,
} = require("../scripts/lib/worktree-ports");
const {
	getEnvVars,
	detectEndpointType,
	resolveGatewayUrl,
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
	extractAppRoutesFromObservations,
	areAllPlanTasksCompleted,
} = require("./lib/app-route-resolver");
const { resolveChatSdkThreadId } = require("./lib/chat-sdk-thread-id");
const { chromiumPreviewManager } = require("./lib/chromium-preview");
const {
	browserWorkspaceManager,
	isBrowserWorkspaceNotFoundError,
} = require("./lib/browser-workspace-manager");
const {
	isBrowserToolCall,
	createThreadBrowserBridge,
} = require("./lib/rovo-app-browser-tools");
const {
	deleteRovoAppThreadBrowserWorkspace,
	ensureRovoAppThreadBrowserWorkspace,
	getRovoAppThreadBrowserWorkspace,
} = require("./lib/rovo-app-browser-workspace");
const { getMirrorBrowser, destroyMirrorBrowser } = require("./lib/rovo-app-browser-mirror");
const {
	classifyPromptIntent,
	inferPromptIntent,
} = require("./lib/prompt-intent");
const {
	looksLikeClarificationResponse,
	extractQuestionCardDefinitionFromAssistantText,
	MAX_LABEL_LENGTH: CLARIFICATION_MAX_LABEL_LENGTH,
} = require("./lib/question-card-extractor");
const {
	extractQuestionCardJsonFromAssistantText,
} = require("./lib/question-card-json-extractor");
const {
	sanitizeQuestionCardPayload,
	buildQuestionCardPayloadFromRequestUserInput,
	findRequestUserInputQuestionContainer,
} = require("./lib/question-card-payload");
const {
	extractAIGatewayDeferredToolFromAssistantText,
	buildQuestionCardPayloadFromAIGatewayDeferredTool,
	buildPlanWidgetPayloadFromAIGatewayDeferredTool,
	buildQuestionMetaFromQuestionCardPayload,
} = require("./lib/ai-gateway-deferred-tools");
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
	parseMaybeJson,
} = require("./lib/shared-utils");
const {
	STAGE_TRACE_ID_HEADER,
	STAGE_TRACE_START_HEADER,
	createStageTrace,
} = require("./lib/stage-trace");

console.log("[STARTUP] Dependencies loaded");

const syncWikiMemoryCollection = async ({ collectionName, wikiDir }) => {
	if (!collectionName) {
		return;
	}

	await syncWikiQmdIndex({
		collectionNames: [collectionName],
		logger: console,
		wikiDir,
	});
};

const wikiRouteHandlers = createWikiRouteHandlers({
	buildWikiMemoryBriefImpl: buildWikiMemoryBrief,
	buildWikiMemoryDeckImpl: buildWikiMemoryDeck,
	buildWikiMemoryExplorerCsvImpl: buildWikiMemoryExplorerCsv,
	buildWikiMemoryExplorerImpl: buildWikiMemoryExplorer,
	captureUrlImpl: captureUrl,
	deleteWikiMemoryBlockImpl: async ({ blockId, logger, revision, scope }) => {
		return pruneCanonicalWikiMemoryBlock({
			blockId,
			logger,
			qmdSyncImpl: syncWikiMemoryCollection,
			revision,
			scope,
		});
	},
	deleteWikiMemoryProposalImpl: async ({ logger, proposalId }) => {
		return deleteWikiMemoryProposal({
			logger,
			proposalId,
			qmdSyncImpl: syncWikiMemoryCollection,
		});
	},
	ensureFreshWikiQmdIndexImpl: ensureFreshWikiQmdIndex,
	getQmdSyncSummaryImpl: getQmdSyncSummary,
	getWikiMemoriesImpl: getCanonicalWikiMemoryDocuments,
	getWikiStatusImpl: getWikiStatus,
	lintWikiImpl: lintWiki,
	logger: console,
	normalizeNaiveWikiSearchResultsImpl: normalizeNaiveWikiSearchResults,
	queryWikiImpl: queryWiki,
	saveSynthesisPageImpl: saveSynthesisPage,
	searchWikiWithQmdImpl: searchWikiWithQmd,
	syncWikiMemoryImpl: async ({ force, logger }) => {
		return syncWikiBackedMemory({
			forceContextRegeneration: force === true,
			logger,
		});
	},
});

// ─── Rovo Serve Detection ─────────────────────────────────────────────────
// When `pnpm run rovo` is used, `dev-rovo.js` writes the serve port to
// `.dev-rovo-port`. The backend reads this file to decide whether to route
// chat traffic through the local Rovo agent loop instead of AI Gateway.

const ROVO_PORT_FILE = path.join(__dirname, "..", ".dev-rovo-port");
const ROVO_PORTS_FILE = path.join(__dirname, "..", ".dev-rovo-ports");
const ROVO_PORT_SEARCH_MAX_TRIES = Number.parseInt(process.env.PORT_SEARCH_MAX ?? "20", 10);

/** Cached availability state — refreshed on each request via the port file. */
let _rovoAvailable = false;
let _rovoChecked = false;
let _rovoLastRefresh = 0;
/** @type {import("./lib/rovo-pool") | null} */
let _rovoPool = null;

/**
 * Poll a Rovo port until it's ready for new requests.
 * Uses a non-destructive healthcheck probe (no state mutation, no cancellation).
 * Resolves when ready; rejects if the port doesn't become ready within the
 * probe window (READY_PROBE_INTERVAL_MS × READY_PROBE_MAX_ATTEMPTS).
 *
 * @param {number} port
 * @returns {Promise<void>}
 */
async function waitForPortReady(port) {
	// Always wait the minimum cooldown first — Rovo Serve needs a brief
	// moment after the SSE stream closes before it can accept new requests.
	await new Promise((resolve) => setTimeout(resolve, POST_STREAM_COOLDOWN_MS));

	for (let attempt = 0; attempt < READY_PROBE_MAX_ATTEMPTS; attempt++) {
		try {
			const health = await rovoHealthCheck(port);
			const classifiedHealth = classifyRovoHealthCheck(health);
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
 * Check whether a Rovo Serve instance is reachable.
 * Reads the port files written by `dev-rovo.js` and pings health endpoints.
 * Creates/updates the pool with all healthy ports.
 */
async function refreshRovoAvailability() {
	try {
		const { ports, source } = await resolveRovoPorts({
			portFile: ROVO_PORT_FILE,
			portsFile: ROVO_PORTS_FILE,
			envPort: process.env.ROVO_PORT,
			basePort: getRovoBasePort(),
			maxTries: ROVO_PORT_SEARCH_MAX_TRIES,
			healthCheck: rovoHealthCheck,
			classifyHealthCheck: classifyRovoHealthCheck,
			persistDiscoveredPorts: true,
		});
		if (ports.length === 0) {
			if (_rovoPool) {
				_rovoPool.shutdown();
				_rovoPool = null;
				initPool(null);
			}
			_rovoAvailable = false;
			_rovoChecked = true;
			return false;
		}

		if (source === "discovered") {
			console.warn(
				`[ROVO] Rediscovered healthy Rovo port files from live serve instance(s): ${ports.join(", ")}`
			);
		}

		// Health-check each port
		const healthyPorts = [];
		for (const port of ports) {
			try {
				const health = await rovoHealthCheck(port);
				const classifiedHealth = classifyRovoHealthCheck(health);
				if (classifiedHealth.ready) {
					healthyPorts.push(port);
					continue;
				}

				if (classifiedHealth.terminal) {
					console.warn("[ROVO] Port health requires attention", {
						port,
						status: classifiedHealth.status,
						reason: classifiedHealth.reason,
						message: classifiedHealth.message,
					});
					continue;
				}

				debugLog("ROVO", `Port ${port} health check returned ${classifiedHealth.status || "unknown"}`, {
					status: classifiedHealth.status,
					reason: classifiedHealth.reason,
				});
			} catch (healthCheckErr) {
				debugLog("ROVO", `Port ${port} health check failed`, {
					error: healthCheckErr.message,
				});
			}
		}

		if (healthyPorts.length === 0) {
			if (_rovoPool) {
				_rovoPool.shutdown();
				_rovoPool = null;
				initPool(null);
			}
			_rovoAvailable = false;
			_rovoChecked = true;
			return false;
		}

		// Set the env var for backward compat (first healthy port)
		process.env.ROVO_PORT = String(healthyPorts[0]);

		if (_rovoPool) {
			// In-place update: preserves busy handles instead of destroying them
			_rovoPool.updatePorts(healthyPorts);
		} else {
			_rovoPool = createRovoPool(healthyPorts, {
				waitForReady: waitForPortReady,
				onPortAvailable: () => {
					void startNextQueuedRovoAppRun();
				},
			});
			initPool(_rovoPool);
		}

		if (healthyPorts.length === 1) {
			console.log(`[ROVO] Serve available on port ${healthyPorts[0]}`);
		} else {
			console.log(`[ROVO] Pool initialized: ${healthyPorts.length} ports (${healthyPorts.join(", ")})`);
		}

		_rovoAvailable = true;
		_rovoChecked = true;
		return true;
	} catch (err) {
		_rovoAvailable = false;
		_rovoChecked = true;
		debugLog("ROVO", "Not available", { error: err.message });
		return false;
	}
}

/**
 * Returns true if Rovo Serve is available. Uses cached result if already checked,
 * otherwise performs a fresh check. The port file is re-read on each call to detect
 * if Rovo was started or stopped since last check.
 * 
 * Periodically refreshes the pool to pick up newly available ports.
 */
async function isRovoAvailable() {
	const fs = require("fs");
	const portsFileExists = fs.existsSync(ROVO_PORTS_FILE);
	const portFileExists = fs.existsSync(ROVO_PORT_FILE);

	if (!portsFileExists && !portFileExists) {
		if (_rovoAvailable) {
			console.warn("[ROVO] Port files removed — attempting Rovo rediscovery");
		}
		_rovoChecked = false;
	}

	// If the port file appeared or we haven't checked yet, do a fresh health check
	if (!_rovoChecked || !_rovoAvailable) {
		return refreshRovoAvailability();
	}

	// Periodically refresh pool to pick up newly healthy ports (every 60 seconds)
	const now = Date.now();
	if (!_rovoLastRefresh) {
		_rovoLastRefresh = now;
	}
	if (now - _rovoLastRefresh > 60000) {
		_rovoLastRefresh = now;
		return refreshRovoAvailability();
	}

	return _rovoAvailable;
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
const TOOL_FIRST_GATE_SKIP_SOURCES = new Set([
	"clarification-submit",
]);
const INTERACTIVE_CHAT_STUCK_PORT_RECOVERY_RETRY_ATTEMPTS = 1;
const INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS = 2;
const INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS =
	DEFAULT_ROVO_PORT_RECOVERY_TIMEOUT_MS;
const POST_STREAM_COOLDOWN_MS = 500;
const READY_PROBE_INTERVAL_MS = 100;
const READY_PROBE_MAX_ATTEMPTS = 20; // 100ms × 20 = 2s max

/**
 * Tracks active requests by threadId for cancel routing.
 * Maps threadId → { port, abortController }.
 * @type {Map<string, { port: number; abortController: AbortController }>}
 */
const activeRequests = new Map();
const getListeningPidsForPort = createListeningPidReader();

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

function createRovoUnavailableError() {
	const error = new Error(
		"Rovo Serve is required but not available. " +
		"Please start Rovo Serve with 'pnpm run rovo' before using this feature."
	);
	error.code = "ROVO_UNAVAILABLE";
	error.backendSelected = "rovo";
	error.failureStage = "unavailable";
	return error;
}

function isRovoConnectionFailure(error) {
	const message = error instanceof Error ? error.message : String(error ?? "");
	return /Rovo connection failed|ECONNREFUSED|EHOSTUNREACH|Request timed out/i.test(message);
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
 * @param {{ backendPreference?: "rovo" | "ai-gateway" }} [opts]
 * @returns {Promise<{ backend: "rovo" | "ai-gateway" | null; rovoAvailable: boolean }>}
 */
async function resolvePreferredBackend({ backendPreference = "rovo" } = {}) {
	if (backendPreference === "ai-gateway") {
		return {
			backend: "ai-gateway",
			rovoAvailable: false,
		};
	}

	const rovoAvailable = await isRovoAvailable();

	if (rovoAvailable) {
		return {
			backend: "rovo",
			rovoAvailable,
		};
	}

	return {
		backend: null,
		rovoAvailable,
	};
}

async function isRovoBackendAvailableForDelegation() {
	try {
		return await isRovoAvailable();
	} catch {
		return false;
	}
}

function shouldDelegateRovoAppTurnToRovo({
	isPlanModeActive = false,
	requestBody,
	routingDecision,
}) {
	if (requestBody?.backendPreference === "rovo") {
		return true;
	}

	if (
		routingDecision?.intent === "artifact_create" ||
		routingDecision?.intent === "artifact_update"
	) {
		return true;
	}

	if (isPlanModeActive) {
		return true;
	}

	return Boolean(
		requestBody?.activeArtifact?.id ||
		requestBody?.artifactContext?.id ||
		requestBody?.streamingArtifact?.id ||
		requestBody?.delegatedMessageId ||
		requestBody?.deferredToolResponse ||
		requestBody?.approval ||
		requestBody?.executionMode ||
		requestBody?.executionTask
	);
}

async function resolveRovoAppTurnBackendPreference({
	isPlanModeActive = false,
	requestBody,
	routingDecision,
}) {
	if (!shouldDelegateRovoAppTurnToRovo({ isPlanModeActive, requestBody, routingDecision })) {
		return "ai-gateway";
	}

	return (await isRovoBackendAvailableForDelegation())
		? "rovo"
		: "ai-gateway";
}

function sendGatewayErrorResponse(res, error, fallbackErrorMessage) {
	if (error && error.code === "ROVO_UNAVAILABLE") {
		return res.status(503).json({
			error: "Rovo Serve is required but not available",
			details: error.message,
			backendSelected: "rovo",
			failureStage: "unavailable",
		});
	}

	if (
		error &&
		(error.code === "ROVO_CHAT_IN_PROGRESS_TIMEOUT" ||
			isChatInProgressError(error))
	) {
		return res.status(409).json({
			error: "Rovo chat turn is still in progress",
			details:
				"Another request is still finishing for this chat session. Please wait a moment and try again.",
			code: "ROVO_CHAT_IN_PROGRESS",
			backendSelected: "rovo",
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

function parseOptionalBoolean(value) {
	if (value === true || value === "true" || value === 1 || value === "1") {
		return true;
	}
	if (value === false || value === "false" || value === 0 || value === "0") {
		return false;
	}
	return null;
}

function parseOptionalInteger(value) {
	if (typeof value === "number" && Number.isInteger(value)) {
		return value;
	}
	if (typeof value === "string" && value.trim()) {
		const parsed = Number.parseInt(value, 10);
		return Number.isInteger(parsed) ? parsed : null;
	}
	return null;
}

function getFirstQueryValue(value) {
	return Array.isArray(value) ? value[0] : value;
}

function sendHermesUnavailableResponse(res, error, fallbackErrorMessage = "Hermes request failed") {
	const statusCode =
		error && typeof error === "object" && error !== null && typeof error.statusCode === "number"
			? error.statusCode
			: error?.code === "ENOENT"
				? 404
				: error?.code === "INVALID_INPUT"
					? 400
					: error?.code === "HERMES_UNREACHABLE"
						? 503
						: 500;

	return res.status(statusCode).json({
		error: statusCode === 503 ? fallbackErrorMessage : error instanceof Error ? error.message : fallbackErrorMessage,
		details: error instanceof Error ? error.details ?? error.message : String(error),
	});
}

function extractHermesJobLinkMetadata(rawInput) {
	if (!rawInput || typeof rawInput !== "object") {
		return null;
	}

	const linkedThreadId =
		typeof rawInput.linkedThreadId === "string" && rawInput.linkedThreadId.trim()
			? rawInput.linkedThreadId.trim()
			: null;
	return {
		artifactTarget:
			typeof rawInput.artifactTarget === "string" && rawInput.artifactTarget.trim()
				? rawInput.artifactTarget.trim()
				: null,
		lastPostedRunMarker:
			typeof rawInput.lastPostedRunMarker === "string" && rawInput.lastPostedRunMarker.trim()
				? rawInput.lastPostedRunMarker.trim()
				: null,
		linkedThreadId,
		postResultToThread: rawInput.postResultToThread === true,
		runHistory: Array.isArray(rawInput.runHistory)
			? rawInput.runHistory
			: [],
		surface:
			typeof rawInput.surface === "string" && rawInput.surface.trim()
				? rawInput.surface.trim()
				: null,
		threadStrategy:
			rawInput.threadStrategy === "fixed" || rawInput.threadStrategy === "new-per-run"
				? rawInput.threadStrategy
				: linkedThreadId
					? "fixed"
					: "new-per-run",
		trigger:
			rawInput.trigger && typeof rawInput.trigger === "object"
				? rawInput.trigger
				: null,
		triggerLabel:
			typeof rawInput.triggerLabel === "string" && rawInput.triggerLabel.trim()
				? rawInput.triggerLabel.trim()
				: null,
	};
}

function buildHermesJobLinkMetadata(rawInput, overrides = {}) {
	return extractHermesJobLinkMetadata({
		...(rawInput && typeof rawInput === "object" ? rawInput : {}),
		...(overrides && typeof overrides === "object" ? overrides : {}),
	});
}

async function persistHermesJobLink(jobId, rawInput, overrides = {}, { mergeExisting = false } = {}) {
	const baseMetadata = mergeExisting
		? (await hermesJobLinkManager.getLink(jobId)) ?? {}
		: {};
	const linkMetadata = buildHermesJobLinkMetadata({
		...baseMetadata,
		...(rawInput && typeof rawInput === "object" ? rawInput : {}),
	}, overrides);
	await hermesJobLinkManager.setLink(jobId, linkMetadata);
	return linkMetadata;
}

function toHermesJobInput(rawInput) {
	if (!rawInput || typeof rawInput !== "object") {
		return {};
	}

	const nextInput = {};
	const fields = ["name", "schedule", "prompt", "deliver", "skills", "repeat"];
	for (const field of fields) {
		if (field in rawInput) {
			nextInput[field] = rawInput[field];
		}
	}
	if (!("prompt" in nextInput) && "target" in rawInput) {
		nextInput.prompt = rawInput.target;
	}

	return nextInput;
}

async function listMergedHermesJobs(searchParams) {
	const jobs = await hermesJobsProvider.listHermesJobs(searchParams);
	return hermesJobLinkManager.mergeJobsWithLinks(jobs);
}

async function getMergedHermesJob(jobId) {
	const [job, link] = await Promise.all([
		hermesJobsProvider.getHermesJob(jobId),
		hermesJobLinkManager.getLink(jobId),
	]);
	return {
		...job,
		...(link ?? {}),
	};
}

async function syncHermesJobsForRovoThreads(threadId = null) {
	try {
		const jobs = await listMergedHermesJobs();
		await syncHermesJobResultsToRovoThreads({
			jobs,
			onJobPosted: async (job, metadata) => {
				await persistHermesJobLink(job.id, job, metadata, { mergeExisting: true });
			},
			rovoAppThreadManager,
			threadId,
		});
	} catch (error) {
		console.warn("[HERMES-JOBS] Failed to sync Hermes job results into Rovo threads:", error instanceof Error ? error.message : String(error));
	}
}

function isAgentsRfpDemoJobMetadata(jobOrLink) {
	return (
		jobOrLink?.surface === AGENTS_RFP_DEMO_SURFACE &&
		jobOrLink?.trigger?.type === RFP_DRAFTING_EVENT_TRIGGER.type &&
		jobOrLink?.trigger?.board === RFP_DRAFTING_EVENT_TRIGGER.board &&
		jobOrLink?.trigger?.column === RFP_DRAFTING_EVENT_TRIGGER.column
	);
}

function buildAgentsRfpDemoJobLinkMetadata(overrides = {}) {
	return {
		postResultToThread: false,
		runHistory: [],
		surface: AGENTS_RFP_DEMO_SURFACE,
		threadStrategy: "new-per-run",
		trigger: RFP_DRAFTING_EVENT_TRIGGER,
		triggerLabel: RFP_DRAFTING_EVENT_TRIGGER_LABEL,
		...(overrides && typeof overrides === "object" ? overrides : {}),
	};
}

async function ensureAgentsRfpDemoHermesJob() {
	const currentState = await agentsRfpDemoStateManager.readState();
	const stateJobId = getNonEmptyString(currentState.agent?.jobId);
	if (stateJobId) {
		try {
			const job = await getMergedHermesJob(stateJobId);
			if (isAgentsRfpDemoJobMetadata(job)) {
				return job;
			}
		} catch (error) {
			if (error?.code !== "ENOENT") {
				throw error;
			}
		}
	}

	const jobs = await listMergedHermesJobs();
	const existingJob = jobs.find(isAgentsRfpDemoJobMetadata);
	if (existingJob) {
		await persistHermesJobLink(
			existingJob.id,
			buildAgentsRfpDemoJobLinkMetadata({
				runHistory: existingJob.runHistory,
			}),
			{},
			{ mergeExisting: true },
		);
		return getMergedHermesJob(existingJob.id);
	}

	const job = await hermesJobsProvider.createHermesJob({
		deliver: "local",
		name: AGENTS_RFP_DEMO_JOB_NAME,
		prompt: AGENTS_RFP_DEMO_JOB_PROMPT,
		schedule: "manual",
		skills: ["vpk-html"],
	});
	const linkMetadata = await persistHermesJobLink(
		job.id,
		buildAgentsRfpDemoJobLinkMetadata(),
	);
	return {
		...job,
		...(linkMetadata ?? {}),
	};
}

async function upsertAgentsRfpDemoThread(threadRecord) {
	const existingThread = await rovoAppThreadManager.getThread(threadRecord.id);
	if (existingThread) {
		return rovoAppThreadManager.updateThread(threadRecord.id, {
			activeDocumentId: threadRecord.activeDocumentId ?? null,
			messages: threadRecord.messages,
			modelId: threadRecord.modelId ?? null,
			provider: threadRecord.provider ?? null,
			realtimeMessages: threadRecord.realtimeMessages ?? [],
			title: threadRecord.title,
			updatedAt: threadRecord.updatedAt,
			visibility: threadRecord.visibility ?? "private",
		});
	}

	return rovoAppThreadManager.createThread(threadRecord);
}

async function persistAgentsRfpDemoRunResult({ jobId, result }) {
	await Promise.all(result.threadRecords.map(upsertAgentsRfpDemoThread));
	const currentLink = await hermesJobLinkManager.getLink(jobId);
	await persistHermesJobLink(
		jobId,
		buildAgentsRfpDemoJobLinkMetadata({
			...(currentLink ?? {}),
			runHistory: [
				result.runSummary,
				...((currentLink?.runHistory ?? []).filter((run) => run?.id !== result.runSummary.id)),
			].slice(0, 10),
		}),
		{},
		{ mergeExisting: true },
	);
	await agentsRfpDemoStateManager.writeState(result.state);
}

async function advanceAgentsRfpDemoProcessing() {
	const currentState = await agentsRfpDemoStateManager.readState();
	const result = await advanceRfpDraftingAgentProcessing(currentState, {
		createHtmlReport: async ({ contextDescription, fields }) => {
			const report = await generateWorkItemVpkHtmlReport({
				contextDescription,
				generateText: async () => JSON.stringify(fields),
				runSkillValidation: false,
				runVisualVerify: false,
			});
			return { html: report.html, skill: report.skill };
		},
	});
	if (!result.changed) {
		return currentState;
	}

	await Promise.all(result.threadRecords.map(upsertAgentsRfpDemoThread));
	const nextState = await agentsRfpDemoStateManager.writeState(result.state);
	const jobId = getNonEmptyString(nextState.agent?.jobId);
	if (jobId) {
		const currentLink = await hermesJobLinkManager.getLink(jobId);
		await persistHermesJobLink(
			jobId,
			buildAgentsRfpDemoJobLinkMetadata({
				...(currentLink ?? {}),
				runHistory: nextState.agent?.jobRunSummaries ?? currentLink?.runHistory ?? [],
			}),
			{},
			{ mergeExisting: true },
		);
	}
	return nextState;
}

async function executeAgentsRfpDemoHermesJob({ context, job, source }) {
	const link = await hermesJobLinkManager.getLink(job.id);
	if (!isAgentsRfpDemoJobMetadata(link)) {
		return null;
	}

	const currentState = await agentsRfpDemoStateManager.readState();
	const ticketCodes = Array.isArray(context?.ticketCodes)
		? context.ticketCodes.filter((ticketCode) => typeof ticketCode === "string" && ticketCode.trim())
		: undefined;
	const result = runRfpDraftingAgent(currentState, {
		jobId: job.id,
		runId: getNonEmptyString(context?.runId) ?? undefined,
		source: getNonEmptyString(source) ?? "manual",
		ticketCodes,
	});
	await persistAgentsRfpDemoRunResult({ jobId: job.id, result });

	return {
		ok: true,
		text: `${RFP_DRAFTING_AGENT_NAME} ${result.runSummary.summary}`,
	};
}

async function runAgentsRfpDemoJob({ source = "manual", ticketCodes } = {}) {
	const job = await ensureAgentsRfpDemoHermesJob();
	await hermesJobsProvider.runHermesJob(job.id, source, {
		ticketCodes: Array.isArray(ticketCodes) ? ticketCodes : undefined,
	});
	const [state, mergedJob] = await Promise.all([
		agentsRfpDemoStateManager.readState(),
		getMergedHermesJob(job.id),
	]);
	return { job: mergedJob, state };
}

async function deleteAgentsRfpDemoThread(threadId) {
	const thread = await rovoAppThreadManager.getThread(threadId);
	const uploadIds = collectRovoAppUploadIdsFromMessages(thread?.messages);
	if (thread) {
		await rovoAppGeneratedFilesManager.backfillFromThread(thread);
		await rovoAppGeneratedFilesManager.deleteLegacyRootFiles(threadId);
		await deleteRovoAppThreadBrowserWorkspace(threadId).catch(() => ({}));
		await destroyMirrorBrowser(`mirror-${threadId}`);
	}
	await Promise.all(
		uploadIds.map((uploadId) =>
			rovoAppUploadManager.deleteUpload(uploadId).catch(() => {})
		),
	);
	await rovoAppVoteManager.deleteVotesForThread(threadId);
	await rovoAppDocumentManager.deleteDocumentsByThread(threadId);
	await rovoAppThreadManager.deleteThread(threadId);
}

async function deleteAgentsRfpDemoHermesJobs(state) {
	const jobIds = new Set();
	const stateJobId = getNonEmptyString(state.agent?.jobId);
	if (stateJobId) {
		jobIds.add(stateJobId);
	}

	const jobs = await listMergedHermesJobs().catch(() => []);
	for (const job of jobs) {
		if (isAgentsRfpDemoJobMetadata(job)) {
			jobIds.add(job.id);
		}
	}

	for (const jobId of jobIds) {
		await hermesJobsProvider.deleteHermesJob(jobId).catch((error) => {
			if (error?.code !== "ENOENT") {
				throw error;
			}
		});
		await hermesJobLinkManager.removeLink(jobId);
	}
}

// Baseline security headers (CSP, nosniff, HSTS, Referrer-Policy, etc.).
// CSP directives are tuned for Next.js static export served by this Express
// process plus AI Gateway connectivity for the chat surfaces.
app.use(
	helmet({
		contentSecurityPolicy: {
			directives: {
				defaultSrc: ["'self'"],
				scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
				connectSrc: [
					"'self'",
					"https://ai-gateway.us-east-1.staging.atl-paas.net",
					"wss:",
					"ws:",
				],
				imgSrc: ["'self'", "data:", "blob:", "https:"],
				mediaSrc: ["'self'", "data:", "blob:", "https:"],
				styleSrc: [
					"'self'",
					"'unsafe-inline'",
					"https://fonts.googleapis.com",
				],
				fontSrc: [
					"'self'",
					"data:",
					"https://fonts.gstatic.com",
					"https://*.atlassian.com",
				],
				workerSrc: ["'self'", "blob:"],
				frameSrc: ["'self'", "https:"],
				objectSrc: ["'none'"],
				baseUri: ["'self'"],
			},
		},
		// Static-export HTML embeds inline JSON/scripts via Next.js; let app handle COEP.
		crossOriginEmbedderPolicy: false,
		// Allow same-origin and document-controlled resource loading for embedded media.
		crossOriginResourcePolicy: { policy: "cross-origin" },
	})
);

// CORS allowlist. Override via ALLOWED_ORIGINS (comma-separated). The default
// covers the standard local dev ports for the Next.js frontend (3000) and
// Express backend (8080) plus Rovo Serve (8000).
const ALLOWED_ORIGINS = (
	process.env.ALLOWED_ORIGINS ??
	"http://localhost:3000,http://localhost:8000,http://localhost:8080"
)
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

const RUNTIME_ADMIN_TOKEN = getNonEmptyString(process.env.VPK_RUNTIME_ADMIN_TOKEN);
const RUNTIME_ADMIN_REQUIRED =
	process.env.NODE_ENV === "production" ||
	process.env.VPK_REQUIRE_RUNTIME_ADMIN === "true";
const RUNTIME_SOCKET_TOKEN_TTL_MS = 60_000;

if (RUNTIME_ADMIN_REQUIRED && !RUNTIME_ADMIN_TOKEN) {
	console.error(
		"[STARTUP] VPK_RUNTIME_ADMIN_TOKEN is required when runtime admin protection is enabled."
	);
	process.exit(1);
}

function getRuntimeAdminTokenFromRequest(req) {
	const headerToken = getNonEmptyString(req.get?.("x-vpk-runtime-admin-token"));
	if (headerToken) {
		return headerToken;
	}

	const authorization = getNonEmptyString(req.get?.("authorization"));
	const bearerMatch = authorization.match(/^Bearer\s+(.+)$/i);
	if (bearerMatch) {
		return bearerMatch[1].trim();
	}

	return getNonEmptyString(req.query?.runtimeToken ?? req.query?.token);
}

function isRuntimeAdminTokenValid(token) {
	if (!RUNTIME_ADMIN_TOKEN || !token) {
		return false;
	}

	const tokenBuffer = Buffer.from(token);
	const expectedBuffer = Buffer.from(RUNTIME_ADMIN_TOKEN);
	if (tokenBuffer.length !== expectedBuffer.length) {
		return false;
	}

	return Boolean(
		crypto.timingSafeEqual(tokenBuffer, expectedBuffer)
	);
}

function requireRuntimeAdmin(req, res, next) {
	if (!RUNTIME_ADMIN_TOKEN && !RUNTIME_ADMIN_REQUIRED) {
		return next();
	}

	if (isRuntimeAdminTokenValid(getRuntimeAdminTokenFromRequest(req))) {
		return next();
	}

	return res.status(RUNTIME_ADMIN_TOKEN ? 403 : 503).json({
		error: "Runtime admin authorization required",
	});
}

function createRuntimeSocketToken(scope) {
	return createRuntimeSocketTokenWithOptions(scope, {
		runtimeAdminToken: RUNTIME_ADMIN_TOKEN,
		ttlMs: RUNTIME_SOCKET_TOKEN_TTL_MS,
	});
}

function isRuntimeSocketTokenValid(token, expectedScope) {
	return isRuntimeSocketTokenValidWithOptions(token, expectedScope, {
		runtimeAdminToken: RUNTIME_ADMIN_TOKEN,
	});
}

function appendRuntimeSocketToken(wsUrl, scope, paramName) {
	return appendRuntimeSocketTokenWithOptions(wsUrl, scope, paramName, {
		runtimeAdminToken: RUNTIME_ADMIN_TOKEN,
		ttlMs: RUNTIME_SOCKET_TOKEN_TTL_MS,
	});
}

function isAllowedOrigin(origin) {
	return Boolean(!origin || ALLOWED_ORIGINS.includes(origin));
}

function isAllowedRuntimeSocketOrigin(origin, request) {
	return isRuntimeSocketOriginAllowed(origin, request.headers.host, ALLOWED_ORIGINS);
}

function requireRuntimeSocketTokenRequester(req, res, next) {
	if (isAllowedRuntimeSocketOrigin(req.get?.("origin"), req)) {
		return next();
	}

	return res.status(403).json({
		error: "Runtime socket token origin is not allowed",
	});
}

app.use(
	cors({
		origin: (origin, cb) => {
			// Same-origin requests (no Origin header) and explicit allowlist matches pass.
			if (isAllowedOrigin(origin)) {
				return cb(null, true);
			}
			return cb(new Error(`CORS: origin ${origin} not allowed`));
		},
		credentials: true,
	})
);

function createInMemoryRateLimiter({ max, windowMs }) {
	const buckets = new Map();
	return (req, res, next) => {
		const now = Date.now();
		const key = req.ip || req.socket?.remoteAddress || "unknown";
		const bucket = buckets.get(key);
		if (!bucket || bucket.resetAt <= now) {
			buckets.set(key, { count: 1, resetAt: now + windowMs });
			return next();
		}

		bucket.count += 1;
		if (bucket.count > max) {
			res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
			return res.status(429).json({ error: "Too many requests" });
		}

		return next();
	};
}

const aiCostRateLimit = createInMemoryRateLimiter({
	max: 60,
	windowMs: 60_000,
});

app.use(
	[
		"/api/chat-sdk",
		"/api/rovo/suggestions",
		"/api/sound-generation",
		"/api/speech-transcription",
		"/api/rovo/files/upload",
		"/api/skills/hub/install",
		"/api/skills/hub/install-by-id",
	],
	aiCostRateLimit
);
app.use(["/api/chat-sdk", "/api/rovo/suggestions"], express.json({ limit: "8mb" }));
app.use(["/api/sound-generation", "/api/speech-transcription"], express.json({ limit: "12mb" }));
app.use("/api/rovo/files/upload", express.json({ limit: "12mb" }));
app.use("/api/skills/hub/install", express.json({ limit: "5mb" }));

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
let buildAIGatewaySystemPrompt;
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
	buildAIGatewaySystemPrompt =
		typeof config.buildAIGatewaySystemPrompt === "function"
			? config.buildAIGatewaySystemPrompt
			: ({ runtimeContext } = {}) => runtimeContext || "";
	console.log("[STARTUP] rovo config loaded successfully");
} catch (error) {
	console.warn("[STARTUP] rovo config failed to load:", error.message);
	console.warn("[STARTUP] Using fallback functions - config did not load!");
	buildUserMessage = (message) => message;
	buildQuestionCardSkipNotification = () => "[Question Card Dismissed]\nThe user skipped the clarification questions.\n[End Question Card Dismissed]";
	buildAIGatewaySystemPrompt = ({ runtimeContext } = {}) => runtimeContext || "";
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
	backendPreference = "rovo",
}) {
	const backendSelection = await resolvePreferredBackend({ backendPreference });
	if (backendSelection.backend === "rovo") {
		debugLog("GENERATE", "Routing through Rovo Serve");
		return await generateTextViaRovo({
			system,
			prompt,
			conflictPolicy: "wait-for-turn",
			timeoutMs: WAIT_FOR_TURN_TIMEOUT_MS,
			signal,
		});
	}

	if (backendSelection.backend !== "ai-gateway") {
		throw createRovoUnavailableError();
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

function buildRovoTextGenerationMessage({ system, prompt }) {
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
	backendPreference = "rovo",
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

	if (backendSelection.backend === "rovo") {
		debugLog("STREAM_GENERATE", "Routing through Rovo Serve");
		await streamViaRovo({
			message: buildRovoTextGenerationMessage({ system, prompt }),
			onTextDelta: handleTextDelta,
			conflictPolicy: "wait-for-turn",
			timeoutMs: WAIT_FOR_TURN_TIMEOUT_MS,
			signal,
		});
		return bufferedText.trim();
	}

	if (backendSelection.backend !== "ai-gateway") {
		throw createRovoUnavailableError();
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

function compressUiConversationHistory(conversationHistory, options) {
	const normalizedConversation = Array.isArray(conversationHistory)
		? conversationHistory
			.flatMap((message) => {
				if (!message || typeof message !== "object") {
					return [];
				}

				const type = message.type === "user" ? "user" : "assistant";
				const content = getNonEmptyString(message.content);
				return content ? [{ type, content }] : [];
			})
		: [];
	const compressionResult = compressConversation(
		normalizedConversation.map((message) => ({
			role: message.type === "user" ? "user" : "assistant",
			content: message.content,
		})),
		options,
	);

	return {
		compressed: compressionResult.compressed,
		conversationHistory: compressionResult.messages
			.flatMap((message) => {
				const content = getNonEmptyString(message?.content);
				if (!content) {
					return [];
				}

				return [{
					type: message.role === "user" ? "user" : "assistant",
					content,
				}];
			}),
		length: compressionResult.length,
		originalLength: normalizedConversation.length,
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

function createHiddenRovoAppUserMessage(messageId, text) {
	const resolvedText = getNonEmptyString(text);
	if (!resolvedText) {
		return null;
	}

	return {
		id:
			typeof messageId === "string" && messageId.trim().length > 0
				? messageId.trim()
				: `rovo-app-hidden-user-${Date.now()}`,
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

function findRovoAppMessageById(messages, messageId) {
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

function resolveRovoAppDelegatedPrompt({
	delegatedMessageId,
	requestMessages,
	thread,
}) {
	const resolvedDelegatedMessageId = getNonEmptyString(delegatedMessageId);
	if (!resolvedDelegatedMessageId) {
		return null;
	}

	const candidateMessage =
		findRovoAppMessageById(requestMessages, resolvedDelegatedMessageId) ||
		findRovoAppMessageById(thread?.realtimeMessages, resolvedDelegatedMessageId) ||
		findRovoAppMessageById(thread?.messages, resolvedDelegatedMessageId);
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

function normalizeHermesContextIds(value) {
	return Array.isArray(value)
		? Array.from(
			new Set(
				value.filter((item) => typeof item === "string" && item.trim().length > 0),
			),
		)
		: [];
}

function buildNextHermesThreadContext({
	currentHermesContext,
	autoSelectedSkillIds,
	pendingDraftIds,
	recentMemoryProposalIds,
	selectedSkillIds,
}) {
	const nextContext = {
		selectedSkillIds: normalizeHermesContextIds(
			selectedSkillIds ?? currentHermesContext?.selectedSkillIds,
		),
		autoSelectedSkillIds: normalizeHermesContextIds(
			autoSelectedSkillIds ?? currentHermesContext?.autoSelectedSkillIds,
		),
		pendingDraftIds: normalizeHermesContextIds(
		pendingDraftIds ?? currentHermesContext?.pendingDraftIds,
		),
	};

	const resolvedRecentMemoryProposalIds = normalizeHermesContextIds(
		recentMemoryProposalIds ?? currentHermesContext?.recentMemoryProposalIds,
	);
	if (resolvedRecentMemoryProposalIds.length > 0) {
		nextContext.recentMemoryProposalIds = resolvedRecentMemoryProposalIds;
	}

	return nextContext;
}

async function syncThreadPendingSkillDraftIds(threadId) {
	if (!threadId) {
		return null;
	}

	const currentThread = await rovoAppThreadManager.getThread(threadId);
	if (!currentThread) {
		return null;
	}

	return rovoAppThreadManager.updateThread(threadId, {
		hermesContext: buildNextHermesThreadContext({
			currentHermesContext: currentThread.hermesContext,
			pendingDraftIds: await hermesSkillDraftManager.listPendingDraftIdsForThread(threadId),
		}),
	});
}

const rovoAppThreadManager = createRovoAppThreadManager({
	baseDir: path.join(__dirname, "data"),
	logger: console,
});
const checkpointManager = createCheckpointManager({
	baseDir: path.join(__dirname, "data"),
	maxCheckpoints: 10,
});
const skillsHubClient = createSkillsHubClient({
	skillsDir: require("./lib/hermes-config").getHermesSkillsDir(),
});
const hermesSkillDraftManager = createHermesSkillDraftManager({
	baseDir: path.join(__dirname, "data"),
});
const rovoAppVoteManager = createRovoAppVoteManager({
	baseDir: path.join(__dirname, "data"),
});
const rovoAppDocumentManager = createRovoAppDocumentManager({
	baseDir: path.join(__dirname, "data"),
});
const rovoAppUploadManager = createRovoAppUploadManager({
	baseDir: path.join(__dirname, "data"),
});
const rovoAppGeneratedFilesManager = createRovoAppGeneratedFilesManager({
	baseDir: path.join(__dirname, "data"),
	projectRoot: path.join(__dirname, ".."),
	logger: console,
});
const hermesJobLinkManager = createHermesJobLinkManager({
	baseDir: path.join(__dirname, "data"),
});
const agentsRfpDemoStateManager = createAgentsRfpDemoStateManager({
	baseDir: path.join(__dirname, "data"),
});
const hermesJobsProvider = createHermesJobsProvider({
	baseDir: path.join(__dirname, "data"),
	executeTask: async ({
		context,
		job,
		prompt,
		selectedSkillIds,
		source,
	}) => {
		const rfpJobResult = await executeAgentsRfpDemoHermesJob({
			context,
			job,
			source,
		});
		if (rfpJobResult) {
			return rfpJobResult;
		}

		return executeRovoTask({
			prompt,
			selectedSkillIds,
			system: [
				"[Hermes Job Runner]",
				"You are executing a scheduled Hermes job through the shared Rovo executor.",
				job?.name ? `Job name: ${job.name}` : null,
				"Complete the requested work using the same tool-capable runtime used by interactive Rovo chat.",
				"[End Hermes Job Runner]",
			]
				.filter(Boolean)
				.join("\n"),
		});
	},
	logger: console,
	onJobSettled: async (job) => {
		const mergedJob = await getMergedHermesJob(job.id);
		await syncHermesJobResultsToRovoThreads({
			jobs: [mergedJob],
			onJobPosted: async (syncedJob, metadata) => {
				await persistHermesJobLink(syncedJob.id, syncedJob, metadata, {
					mergeExisting: true,
				});
			},
			rovoAppThreadManager,
		});
	},
});
const rovoAppRunManager = createRovoAppRunManager({
	logger: console,
});

function buildRovoAppFileUrl(uploadId) {
	return `/api/rovo/files/${encodeURIComponent(uploadId)}`;
}

function createRovoAppThreadId() {
	return `rovo-app-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function extractRovoAppUploadIdFromUrl(rawUrl) {
	if (typeof rawUrl !== "string" || rawUrl.length === 0) {
		return null;
	}

	const match = rawUrl.match(/\/api\/rovo\/files\/([^/?#]+)/u);
	if (!match?.[1]) {
		return null;
	}

	try {
		return decodeURIComponent(match[1]);
	} catch {
		return match[1];
	}
}

function getPngImageDimensions(buffer) {
	if (!Buffer.isBuffer(buffer) || buffer.length < 24) {
		return null;
	}

	if (buffer.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") {
		return null;
	}

	return {
		height: buffer.readUInt32BE(20),
		width: buffer.readUInt32BE(16),
	};
}

function getJpegImageDimensions(buffer) {
	if (!Buffer.isBuffer(buffer) || buffer.length < 4) {
		return null;
	}

	if (buffer[0] !== 0xff || buffer[1] !== 0xd8) {
		return null;
	}

	let offset = 2;
	while (offset + 8 < buffer.length) {
		if (buffer[offset] !== 0xff) {
			offset += 1;
			continue;
		}

		const marker = buffer[offset + 1];
		offset += 2;

		if (marker === 0xd8 || marker === 0xd9) {
			continue;
		}

		if (offset + 2 > buffer.length) {
			break;
		}

		const segmentLength = buffer.readUInt16BE(offset);
		if (segmentLength < 2 || offset + segmentLength > buffer.length) {
			break;
		}

		const isStartOfFrame =
			(marker >= 0xc0 && marker <= 0xc3) ||
			(marker >= 0xc5 && marker <= 0xc7) ||
			(marker >= 0xc9 && marker <= 0xcb) ||
			(marker >= 0xcd && marker <= 0xcf);
		if (isStartOfFrame && segmentLength >= 7) {
			return {
				height: buffer.readUInt16BE(offset + 3),
				width: buffer.readUInt16BE(offset + 5),
			};
		}

		offset += segmentLength;
	}

	return null;
}

function getRovoAppBrowserImageMetadata(buffer) {
	const pngDimensions = getPngImageDimensions(buffer);
	if (pngDimensions) {
		return {
			contentType: "image/png",
			extension: "png",
			...pngDimensions,
		};
	}

	const jpegDimensions = getJpegImageDimensions(buffer);
	if (jpegDimensions) {
		return {
			contentType: "image/jpeg",
			extension: "jpg",
			...jpegDimensions,
		};
	}

	return {
		contentType: "image/png",
		extension: "png",
		height: undefined,
		width: undefined,
	};
}

function normalizeRovoAppBrowserScreenshotContentType(rawContentType, fallbackContentType) {
	if (typeof rawContentType !== "string" || rawContentType.trim().length === 0) {
		return fallbackContentType;
	}

	const normalized = rawContentType.trim().toLowerCase();
	if (normalized === "image/jpg") {
		return "image/jpeg";
	}
	if (normalized === "image/jpeg" || normalized === "image/png") {
		return normalized;
	}

	return fallbackContentType;
}

async function persistRovoAppBrowserScreenshotBuffer({
	buffer,
	contentType,
	threadId,
}) {
	const metadata = getRovoAppBrowserImageMetadata(buffer);
	const resolvedContentType = normalizeRovoAppBrowserScreenshotContentType(
		contentType,
		metadata.contentType,
	);
	const extension = resolvedContentType === "image/jpeg" ? "jpg" : metadata.extension;
	const upload = await rovoAppUploadManager.createUploadFromBuffer({
		threadId,
		filename: `browser-screenshot-${Date.now()}.${extension}`,
		mediaType: resolvedContentType,
		buffer,
	});

	return {
		contentType: resolvedContentType,
		height: metadata.height,
		imageUrl: buildRovoAppFileUrl(upload.id),
		width: metadata.width,
	};
}

function collectRovoAppUploadIdsFromMessages(messages) {
	if (!Array.isArray(messages)) {
		return [];
	}

	const uploadIds = new Set();
	for (const message of messages) {
		if (!message || typeof message !== "object" || !Array.isArray(message.parts)) {
			continue;
		}

		for (const part of message.parts) {
			if (!part || typeof part !== "object") {
				continue;
			}

			const uploadId = part.type === "file"
				? extractRovoAppUploadIdFromUrl(part.url)
				: part.type === "data-browser-screenshot"
					? extractRovoAppUploadIdFromUrl(part.data?.imageUrl)
					: null;
			if (uploadId) {
				uploadIds.add(uploadId);
			}
		}
	}

	return [...uploadIds];
}

async function persistRovoAppMessageFiles(threadId, messages) {
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
			if (!part || typeof part !== "object") {
				nextParts.push(part);
				continue;
			}

			if (part.type === "data-browser-screenshot") {
				const screenshotData =
					part.data && typeof part.data === "object" ? part.data : null;
				const imageData =
					typeof screenshotData?.imageData === "string" && screenshotData.imageData.trim()
						? screenshotData.imageData.trim()
						: null;
				if (!imageData) {
					nextParts.push(part);
					continue;
				}

				const buffer = Buffer.from(imageData, "base64");
				const persistedScreenshot = await persistRovoAppBrowserScreenshotBuffer({
					threadId,
					buffer,
					contentType: screenshotData?.contentType,
				});
				const screenshotOutput = {
					...screenshotData,
					...persistedScreenshot,
					timestamp:
						typeof screenshotData.timestamp === "string" &&
						screenshotData.timestamp.trim()
							? screenshotData.timestamp
							: new Date().toISOString(),
				};
				delete screenshotOutput.imageData;
				nextParts.push({
					...part,
					data: screenshotOutput,
				});
				continue;
			}

			if (part.type !== "file") {
				nextParts.push(part);
				continue;
			}

			if (typeof part.url === "string" && part.url.startsWith("data:")) {
				const upload = await rovoAppUploadManager.createUploadFromDataUrl({
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
					url: buildRovoAppFileUrl(upload.id),
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

function hasPersistedRovoAppBrowserScreenshotImageData(messages) {
	if (!Array.isArray(messages)) {
		return false;
	}

	for (const message of messages) {
		if (!message || typeof message !== "object" || !Array.isArray(message.parts)) {
			continue;
		}

		for (const part of message.parts) {
			if (
				part?.type === "data-browser-screenshot" &&
				typeof part.data?.imageData === "string" &&
				part.data.imageData.trim().length > 0
			) {
				return true;
			}
		}
	}

	return false;
}

async function maybeMigratePersistedRovoAppThreadBrowserScreenshots(thread) {
	if (!thread?.id || !hasPersistedRovoAppBrowserScreenshotImageData(thread.messages)) {
		return thread;
	}

	const persistedMessages = await persistRovoAppMessageFiles(thread.id, thread.messages);
	return (
		await rovoAppThreadManager.updateThread(thread.id, {
			messages: persistedMessages,
			updatedAt: thread.updatedAt,
		})
	) ?? {
		...thread,
		messages: persistedMessages,
	};
}

function buildRovoAppThreadSummary(thread) {
	if (!thread || typeof thread !== "object") {
		return thread;
	}

	const summary = { ...thread };
	delete summary.messages;
	delete summary.realtimeMessages;
	return summary;
}

async function synchronizeRovoAppThreadGeneratedFiles(thread) {
	if (!thread?.id) {
		return thread;
	}

	await rovoAppGeneratedFilesManager.backfillFromThread(thread);
	await rovoAppGeneratedFilesManager.captureRootFilesToWorkspace(thread.id);
	return thread;
}

function buildRovoAppArtifactContext(rawArtifactContext) {
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

function buildRovoAppArtifactSystemPrompt({
	mode,
	title,
	kind,
}) {
	const normalizedKind = getNonEmptyString(kind) || "text";
	if (normalizedKind === "excalidraw") {
		return buildExcalidrawArtifactSystemPrompt({
			mode,
			title,
		});
	}

	const header = mode === "update"
		? `You are updating an existing ${normalizedKind} artifact titled "${title}".`
		: `You are generating a new ${normalizedKind} artifact titled "${title}".`;

	const contentRule = normalizedKind === "code"
		? "Return only the completed code artifact. Do not explain the code before or after it."
		: normalizedKind === "html"
			? [
					"Return only a complete, self-contained HTML document. Do not wrap it in markdown fences or add commentary.",
					"Follow the loaded /vpk-html skill contract: offline single-file HTML, inline CSS, no remote dependencies, no unfilled placeholders, and no invented facts.",
					"Use an Atlassian editorial report style suitable for a Jira Work Item status/readout report. Include a compact information-gaps section when facts are missing.",
				].join(" ")
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
		normalizedKind === "html"
			? "If essential details are missing from the Work Item context, mark them as information gaps instead of making assumptions."
			: "If essential details are missing, make the most reasonable default assumptions and continue instead of asking follow-up questions.",
		"Be concise when the request is narrow, and fully detailed when the request explicitly asks for a complete draft.",
	]
		.filter((value) => typeof value === "string" && value.length > 0)
		.join("\n");
}

async function generateRovoAppArtifactText({
	mode,
	title,
	kind,
	latestUserMessage,
	conversationHistory,
	contextDescription,
	provider,
	backendPreference = "rovo",
	signal,
	onTextDelta,
}) {
	const system = buildRovoAppArtifactSystemPrompt({
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
	const maxOutputTokens =
		kind === "code"
			? 3200
			: kind === "html"
				? 6000
				: kind === "sheet"
					? 2200
					: kind === "excalidraw"
					? 3200
					: 1800;
	if (kind === "excalidraw") {
		const rawText = await generateTextViaGateway({
			system,
			prompt,
			messages: normalizedMessages,
			maxOutputTokens,
			temperature: 0.2,
			provider,
			signal,
			backendPreference: "ai-gateway",
		});
		const normalizedExcalidraw = normalizeExcalidrawArtifactOutput(rawText);
		if (!normalizedExcalidraw) {
			throw new Error("Excalidraw artifact generation returned invalid scene JSON.");
		}
		if (typeof onTextDelta === "function") {
			onTextDelta(normalizedExcalidraw);
		}
		return normalizedExcalidraw;
	}

	const streamArtifactText = () =>
		streamTextViaGateway({
			system,
			prompt,
			messages: normalizedMessages,
			maxOutputTokens,
			temperature: 0.35,
			provider,
			backendPreference,
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

		if (backendPreference === "ai-gateway") {
			console.warn("[FUTURE-CHAT] AI Gateway artifact generation hit pending deferred tool request; retrying once.");
			return streamArtifactText();
		}

		console.warn("[FUTURE-CHAT] Artifact generation hit pending deferred tool request; clearing Rovo chat state and retrying once.");
		try {
			await rovoCancelChat();
		} catch (cancelError) {
			console.warn(
				"[FUTURE-CHAT] Failed to cancel stale Rovo chat state before retry:",
				cancelError instanceof Error ? cancelError.message : cancelError,
			);
		}

		return streamArtifactText();
	}
}

function deriveRovoAppArtifactDeltaType(kind) {
	return normalizeArtifactKind(kind) === "code" ? "data-codeDelta" : "data-textDelta";
}

function shouldUseWorkItemVpkHtmlReportGenerator({
	artifactKind,
	contextDescription,
	latestUserMessage,
}) {
	return (
		artifactKind === "html" &&
		typeof contextDescription === "string" &&
		hasActiveWorkItemContext(contextDescription) &&
		(
			contextDescription.includes(WORK_ITEM_REPORT_REQUEST_START) ||
			isWorkItemReportIntent(latestUserMessage)
		)
	);
}

async function generateRovoAppArtifactTitleFromContent({
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

		return sanitizeRovoAppArtifactTitle(text);
	} catch (error) {
		console.warn(
			"[FUTURE-CHAT] Failed to generate artifact title from content, falling back:",
			error instanceof Error ? error.message : error,
		);
		return null;
	}
}

function resolveRovoAppArtifactKind({
	action,
	activeArtifact,
	decisionKind,
}) {
	if (action === "updateDocument") {
		return normalizeArtifactKind(decisionKind || activeArtifact?.kind);
	}

	return normalizeArtifactKind(decisionKind);
}

async function resolveRovoAppArtifactDecision({
	activeArtifact,
	artifactSteering,
	conversationHistory,
	latestUserMessage,
	provider,
	signal,
	streamingArtifact,
}) {
	const fastDecision = resolveFastRovoAppArtifactIntent({
		activeArtifact,
		artifactSteering,
		latestUserMessage,
		streamingArtifact,
	});
	if (fastDecision) {
		return fastDecision;
	}

	const prompt = buildRovoAppArtifactIntentPrompt({
		activeArtifact,
		artifactSteering,
		conversationHistory,
		latestUserMessage,
		streamingArtifact,
	});
	const sameArtifactVersionRequest = isSameRovoAppArtifactVersionRequest({
		activeArtifact,
		latestUserMessage,
	});
	const explicitlyRequestsNewArtifact = isExplicitNewRovoAppArtifactRequest({
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
	const parsedDecision = parseRovoAppArtifactIntent(rawDecision, {
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

function streamRovoAppArtifactToolResponse({
	artifactAction,
	artifactDocument,
	artifactBackendPreference,
	cancelStreaming,
	changeLabel,
	contextDescription,
	conversationHistory,
	deterministicArtifactContent,
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

			const deltaType = deriveRovoAppArtifactDeltaType(artifactDocument.kind);
			const {
				contentToPersist,
				persistedArtifactDocument,
				titleChanged,
				kindChanged,
			} = await generateAndPersistRovoAppArtifact({
				artifactAction,
				artifactDocument,
				changeLabel,
				fallbackTitle: artifactDocument.title,
				latestUserMessage,
				generateArtifactText: async ({ onTextDelta }) => {
					if (typeof deterministicArtifactContent === "string") {
						writer.write({
							type: deltaType,
							data: deterministicArtifactContent,
							transient: true,
						});
						if (typeof onTextDelta === "function") {
							onTextDelta(deterministicArtifactContent);
						}
						return deterministicArtifactContent;
					}

					const shouldUseWorkItemVpkHtmlSkill = shouldUseWorkItemVpkHtmlReportGenerator({
						artifactKind: artifactDocument.kind,
						contextDescription,
						latestUserMessage,
					});
					if (shouldUseWorkItemVpkHtmlSkill) {
						const report = await generateWorkItemVpkHtmlReport({
							contextDescription,
							generateText: (options) =>
								generateTextViaGateway({
									...options,
									backendPreference: "ai-gateway",
									provider: options?.provider || provider,
									signal: options?.signal || signal,
								}),
							provider,
							signal,
						});
						writer.write({
							type: deltaType,
							data: report.html,
							transient: true,
						});
						if (typeof onTextDelta === "function") {
							onTextDelta(report.html);
						}
						return report.html;
					}

					return generateRovoAppArtifactText({
						mode: artifactAction === "updateDocument" ? "update" : "create",
						title: artifactDocument.title,
						kind: artifactDocument.kind,
						latestUserMessage,
						conversationHistory,
						contextDescription,
						provider,
						backendPreference: artifactBackendPreference,
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
					});
				},
				inferArtifactKindFromContent: inferRovoAppArtifactKindFromContent,
				rovoAppDocumentManager,
				onCreateFailure: async () => {
					const cleanupTasks = [
						rovoAppDocumentManager.deleteDocument(artifactDocument.id),
					];
					if (artifactThreadId) {
						cleanupTasks.push(
							rovoAppThreadManager.updateThread(artifactThreadId, {
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
					generateRovoAppArtifactTitleFromContent({
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
						threadId: persistedArtifactDocument.threadId,
						title: persistedArtifactDocument.title,
						kind: persistedArtifactDocument.kind,
						action:
						artifactAction === "updateDocument"
							? "update"
							: "create",
				},
			});

			const textId = `rovo-app-artifact-summary-${Date.now()}`;
			const summaryText =
				persistedArtifactDocument.kind === "html" && artifactAction !== "updateDocument"
					? `Created report: ${persistedArtifactDocument.title}.`
					: artifactAction === "updateDocument"
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
			error instanceof Error ? error.message : "Failed to stream Rovo artifact",
	});

	return createUIMessageStreamResponse({ stream });
}

async function pipeWebResponseToExpressResponse(webResponse, res) {
	res.status(webResponse.status);
	webResponse.headers.forEach((value, key) => {
		if (key.toLowerCase() !== "content-length") {
			res.setHeader(key, value);
		}
	});

	if (!webResponse.body) {
		res.end();
		return;
	}

	const reader = webResponse.body.getReader();
	try {
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			if (value) {
				res.write(Buffer.from(value));
			}
		}
	} finally {
		reader.releaseLock();
		res.end();
	}
}

async function handleRovoAppArtifactToolRequest({
	activeArtifact,
	activeDocument,
	artifactSteering,
	artifactBackendPreference,
	contextDescription,
	requestOrigin,
	requestBody,
	signal,
	streamingArtifact,
	threadId,
}) {
	const { message: latestUserMessage, conversationHistory: rawConversationHistory } =
		mapUiMessagesToConversation(requestBody.messages);
	if (!latestUserMessage) {
		return false;
	}

	// ── Context compression: summarize older turns when history is large ──
	const compressionResult = compressConversation(rawConversationHistory, {
		thresholdChars: 80_000,
		tailCount: 8,
	});
	const conversationHistory = compressionResult.messages;
	if (compressionResult.compressed) {
		console.info(
			`[HERMES] Compressed conversation history: ${rawConversationHistory.length} → ${conversationHistory.length} messages`,
		);
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
				: await resolveRovoAppArtifactDecision({
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

	let resolvedContextDescription = contextDescription;
	let deterministicArtifactContent = null;

	const artifactTitle = deriveRovoAppArtifactTitle({
		action: decision.action,
		activeArtifact,
		conversationHistory,
		decisionTitle: decision.title,
		latestUserMessage,
	});
	const artifactKind = resolveRovoAppArtifactKind({
		action: decision.action,
		activeArtifact,
		decisionKind: decision.kind,
	});

	let artifactDocument;
	let existingDocument = null;
	const previousActiveDocumentId =
		getNonEmptyString(activeDocument?.id) || getNonEmptyString(activeArtifact?.id);
	let changeLabel = deriveRovoAppVersionChangeLabel({
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
				: await rovoAppDocumentManager.getDocument(activeArtifact.id);
		if (!existingDocument) {
			return false;
		}

		const existingContent = getNonEmptyString(existingDocument.versions?.at(-1)?.content);
		deterministicArtifactContent = applyAtlassianLogoToHtmlArtifact({
			content: existingContent,
			latestUserMessage,
		});
		if (!deterministicArtifactContent) {
			const artifactContextBlock = buildRovoAppArtifactContext(activeArtifact);
			resolvedContextDescription = artifactContextBlock
				? contextDescription
					? `${artifactContextBlock}\n\n${contextDescription}`
					: artifactContextBlock
				: contextDescription;
		}

		artifactDocument = {
			id: existingDocument.id,
			title: artifactTitle || existingDocument.title,
			kind: artifactKind || existingDocument.kind,
		};
		changeLabel = deriveRovoAppVersionChangeLabel({
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

		const documentShell = await rovoAppDocumentManager.createDocumentShell({
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
		void rovoAppThreadManager.updateThread(artifactThreadId, {
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
				await rovoAppDocumentManager.appendDocumentVersion(streamingArtifact.id, {
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

	const response = streamRovoAppArtifactToolResponse({
		artifactAction: decision.action,
		artifactDocument,
		artifactBackendPreference,
		cancelStreaming: decision.cancelStreaming,
		changeLabel,
		contextDescription: resolvedContextDescription,
		conversationHistory,
		deterministicArtifactContent,
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

let isProcessingRovoAppRunQueue = false;

async function finalizeRovoAppRun(threadId, run, messages) {
	if (threadId && Array.isArray(messages)) {
		const updatedThread = await rovoAppThreadManager.updateThread(threadId, {
			activeRun: null,
			messages,
		});
		await synchronizeRovoAppThreadGeneratedFiles(updatedThread);
	} else {
		await clearRovoAppRunState(threadId);
	}
	if (threadId) {
		activeRequests.delete(threadId);
	}
	rovoAppRunManager.clearRun(threadId);
	void startNextQueuedRovoAppRun();
}

async function syncRovoAppThreadSession(threadId, rovoPort, { thread: providedThread } = {}) {
	if (!threadId || !Number.isInteger(rovoPort) || rovoPort <= 0) {
		return providedThread ?? null;
	}

	const currentThread = providedThread ?? await rovoAppThreadManager.getThread(threadId);
	if (!currentThread) {
		return null;
	}

	const customTitle =
		getNonEmptyString(currentThread.title) ||
		"Rovo";

	const existingSessionId = getNonEmptyString(currentThread.sessionId);
	const sessionRecord = await ensureRovoSession(rovoPort, {
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

	return rovoAppThreadManager.updateThread(threadId, {
		sessionId: nextSessionId,
		sessionMode: nextSessionMode,
	});
}

async function syncRovoAppThreadSessionFromCurrentPort(
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

	const currentThread = providedThread ?? await rovoAppThreadManager.getThread(threadId);
	if (!currentThread) {
		return null;
	}

	let sessionRecord = null;
	try {
		sessionRecord = await getCurrentRovoSession(rovoPort, { timeoutMs: 5_000 });
	} catch (error) {
		console.warn("[FUTURE-CHAT] Failed to read current Rovo session; falling back to ensure session:", {
			threadId,
			port: rovoPort,
			error: error instanceof Error ? error.message : String(error),
		});
		return syncRovoAppThreadSession(threadId, rovoPort, {
			thread: currentThread,
		});
	}
	const nextSessionId = getNonEmptyString(sessionRecord?.sessionId);
	if (!nextSessionId) {
		console.warn("[FUTURE-CHAT] Current Rovo session response did not include a session id; falling back to ensure session:", {
			threadId,
			port: rovoPort,
		});
		return syncRovoAppThreadSession(threadId, rovoPort, {
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

	return rovoAppThreadManager.updateThread(threadId, {
		sessionId: nextSessionId,
		sessionMode: nextSessionMode,
	});
}

async function failRovoAppRun(threadId, error) {
	const failurePayload = getRovoAppRunFailurePayload(error);
	const message = failurePayload.message;
	const isAbortLike =
		typeof error === "object"
		&& error !== null
		&& (
			("name" in error && error.name === "AbortError")
			|| /abort/i.test(message)
		);
	const run = rovoAppRunManager.getRun(threadId);
	if (run) {
		rovoAppRunManager.setRunError(threadId, message);
		if (!isAbortLike) {
			for (const chunk of createRovoAppFailureSseChunks(error)) {
				rovoAppRunManager.appendChunk(threadId, chunk);
			}
		}
	}
	await clearRovoAppRunState(threadId);
	if (threadId) {
		activeRequests.delete(threadId);
	}
	rovoAppRunManager.clearRun(threadId);
	void startNextQueuedRovoAppRun();
}

const ROVO_APP_MESSAGE_PERSIST_DEBOUNCE_MS = 450;

async function consumeRovoAppManagedResponse({
	initialMessages,
	prependChunk,
	response,
	run,
	stageTrace,
	threadId,
}) {
	const contentType = response.headers.get("content-type") || "";
	if (!contentType.includes("text/event-stream") || !response.body) {
		throw new Error("Rovo expected an event stream response.");
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
		await persistRovoAppRunState(threadId, run);
	}

	const [broadcastStream, parseStream] = response.body.tee();
	const routeDecisionToSuppress = parseRouteDecisionFromSseChunk(prependChunk);
	if (prependChunk) {
		rovoAppRunManager.appendChunk(threadId, prependChunk);
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
		persistInFlight = persistRovoAppRunMessagesSnapshot(
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
		}, ROVO_APP_MESSAGE_PERSIST_DEBOUNCE_MS);
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
			rovoAppRunManager.appendChunk(threadId, value);
		}
	} finally {
		filteredSseReader.releaseLock();
	}

	const messages = await parsePromise;
	latestMessagesSnapshot = Array.isArray(messages) ? [...messages] : [];
	await flushPersistedMessages();
	try {
		const synchronizedThread = await syncRovoAppThreadSession(threadId, run.rovoPort, {
			thread: threadId ? await rovoAppThreadManager.getThread(threadId) : null,
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

	const {
		conversationHistory: memoryCompanionHistory,
		message: latestUserMessage,
	} = mapUiMessagesToConversation(messages);
	const latestAssistantMessage = getLatestAssistantTextFromMessages(messages);

	if (latestUserMessage || latestAssistantMessage) {
		const runHermesMemoryReview = async () => {
				try {
					const reviewResult = await runHermesMemoryCompanionReview({
						conversationHistory: memoryCompanionHistory,
						latestAssistantMessage,
						latestUserMessage,
						sourceThreadId: threadId,
					});
					if (!reviewResult.didReview) {
						return;
					}

					if (threadId && Array.isArray(reviewResult.structuredMemoryActions) && reviewResult.structuredMemoryActions.length > 0) {
						const currentThread = await rovoAppThreadManager.getThread(threadId);
						if (currentThread) {
							await rovoAppThreadManager.updateThread(threadId, {
								hermesContext: buildNextHermesThreadContext({
									currentHermesContext: currentThread.hermesContext,
									recentMemoryProposalIds: reviewResult.structuredMemoryActions
										.map((action) => action?.proposal?.id)
										.filter((proposalId) => typeof proposalId === "string" && proposalId.trim().length > 0),
								}),
							});
						}
					}

					void syncWikiBackedMemory({
						logger: console,
						qmdSyncImpl: async ({ collectionName, wikiDir }) => {
							if (!collectionName) {
								return;
							}

							await syncWikiQmdIndex({
								collectionNames: [collectionName],
								logger: console,
								wikiDir,
							});
						},
					}).catch((syncError) => {
						console.warn("[HERMES] Wiki-backed memory sync failed:", {
							threadId,
							error: syncError instanceof Error ? syncError.message : String(syncError),
						});
					});

					console.info("[HERMES] Memory companion reviewed completed Rovo turn", {
						threadId,
						responseText: reviewResult.responseText ?? null,
					});
			} catch (error) {
				console.warn("[HERMES] Memory companion review failed:", {
					threadId,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		};
		const runHermesSkillReview = async () => {
			try {
				const reviewResult = await runHermesSkillCompanionReview({
					conversationHistory: memoryCompanionHistory,
					latestAssistantMessage,
					latestUserMessage,
					sourceThreadId: threadId,
					upsertDraftImpl: hermesSkillDraftManager.upsertDraft,
				});
				if (!reviewResult.didReview || reviewResult.structuredSkillActions.length === 0) {
					return;
				}

				const currentThread = threadId
					? await rovoAppThreadManager.getThread(threadId)
					: null;
				if (threadId && currentThread) {
					const pendingDraftIds = await hermesSkillDraftManager.listPendingDraftIdsForThread(threadId);
					await rovoAppThreadManager.updateThread(threadId, {
						hermesContext: buildNextHermesThreadContext({
							currentHermesContext: currentThread.hermesContext,
							pendingDraftIds,
						}),
					});
				}

				console.info("[HERMES] Skill companion reviewed completed Rovo turn", {
					threadId,
					draftCount: reviewResult.structuredSkillActions.length,
					responseText: reviewResult.responseText ?? null,
				});
			} catch (error) {
				console.warn("[HERMES] Skill companion review failed:", {
					threadId,
					error: error instanceof Error ? error.message : String(error),
				});
			}
		};

		await runHermesMemoryReview();
		void runHermesSkillReview();
	}
	await finalizeRovoAppRun(threadId, run, messages);
}

async function executeRovoAppManagedRun(run) {
	const requestBody =
		run.requestBody && typeof run.requestBody === "object"
			? { ...run.requestBody }
			: {};
	const requestOriginHint = getNonEmptyString(requestBody.origin) || "text";
	const stageTrace = createStageTrace({
		scope: "rovo-app-run",
		logger: console,
		baseMeta: {
			path: "/api/rovo/chat",
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
	const threadForSession = threadId ? await rovoAppThreadManager.getThread(threadId) : null;
	const requestHermesContext =
		requestBody.hermesContext && typeof requestBody.hermesContext === "object"
			? requestBody.hermesContext
			: null;
	if (threadForSession?.sessionId) {
		requestBody.sessionId = threadForSession.sessionId;
		requestBody.sessionMode = threadForSession.sessionMode ?? "persistent";
	}
	const delegatedThread =
		threadId && delegatedMessageId
			? threadForSession
			: null;
	const delegatedPrompt = delegatedMessageId
		? resolveRovoAppDelegatedPrompt({
			delegatedMessageId,
			requestMessages,
			thread: delegatedThread,
		})
		: null;
	if (delegatedMessageId && !delegatedPrompt) {
		throw new Error("delegatedMessageId did not resolve to a persisted user message");
	}
	if (delegatedPrompt && !requestMessages.some((message) => message?.id === delegatedPrompt.messageId)) {
		const hiddenUserMessage = createHiddenRovoAppUserMessage(
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
		const resolved = await resolveRovoAppActiveArtifact({
			activeDocumentId: requestBody.activeDocumentId,
			artifactContext: requestBody.artifactContext,
			rovoAppDocumentManager,
			rovoAppThreadManager,
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
	const { message: latestUserMessage, conversationHistory: rawConversationHistory } =
		mapUiMessagesToConversation(requestMessages);
	const compressedConversation = compressUiConversationHistory(rawConversationHistory, {
		thresholdChars: 80_000,
		tailCount: 8,
	});
	const conversationHistory = compressedConversation.conversationHistory;
	if (compressedConversation.compressed) {
		console.info(
			`[HERMES] Compressed managed conversation history: ${compressedConversation.originalLength} → ${compressedConversation.length} messages`,
		);
	}
	const baseContextDescription = getNonEmptyString(requestBody.contextDescription);
	let workItemReportRequest = resolveWorkItemReportRequest({
		contextDescription: baseContextDescription,
		promptText: latestUserMessage,
	});
	const selectedHermesSkillIds = Array.isArray(requestHermesContext?.selectedSkillIds)
		? requestHermesContext.selectedSkillIds
		: Array.isArray(threadForSession?.hermesContext?.selectedSkillIds)
			? threadForSession.hermesContext.selectedSkillIds
			: [];
	let autoSelectedHermesSkillIds = [];
	try {
		const installedHermesSkills = await listHermesSkills();
		workItemReportRequest = resolveWorkItemReportRequest({
			contextDescription: baseContextDescription,
			promptText: latestUserMessage,
			skills: installedHermesSkills,
		});
		const rankedCandidates = rankHermesSkillCandidates({
			promptText: latestUserMessage,
			selectedSkillIds: selectedHermesSkillIds,
			skills: installedHermesSkills,
		});
		autoSelectedHermesSkillIds = selectHermesSkillIdsFromRankedCandidates(rankedCandidates);
		if (!workItemReportRequest.isIntent && shouldDisambiguateRankedCandidates(rankedCandidates)) {
			try {
				autoSelectedHermesSkillIds = await resolveAmbiguousAutoSelectedSkillIds({
					promptText: latestUserMessage,
					rankedCandidates: rankedCandidates.slice(0, 5),
					runBackgroundTaskImpl: runRovoBackgroundTask,
				});
			} catch (error) {
				console.warn("[HERMES] Failed to disambiguate auto-selected Hermes skills:", error instanceof Error ? error.message : String(error));
			}
		}
		if (workItemReportRequest.shouldLoadSkill) {
			autoSelectedHermesSkillIds = mergeHermesSkillIds(
				autoSelectedHermesSkillIds,
				workItemReportRequest.skillId,
			);
		}
	} catch (error) {
		console.warn("[HERMES] Failed to auto-select Hermes skills:", error instanceof Error ? error.message : String(error));
		if (workItemReportRequest.shouldLoadSkill) {
			autoSelectedHermesSkillIds = mergeHermesSkillIds(
				autoSelectedHermesSkillIds,
				workItemReportRequest.skillId,
			);
		}
	}
	const delegationContextDescription = conversationSummary
		? `[Voice delegation summary]\n${conversationSummary}`
		: null;
	let hermesContextDescription = null;
	try {
		hermesContextDescription = await buildRovoAppHermesContextDescription({
			autoSelectedSkillIds: autoSelectedHermesSkillIds,
			selectedSkillIds: selectedHermesSkillIds,
		});
	} catch (error) {
		console.warn("[HERMES] Failed to build Hermes context for Rovo chat:", error instanceof Error ? error.message : String(error));
	}
	let wikiQueryContextDescription = null;
	try {
		wikiQueryContextDescription = await buildWikiQueryContextDescription(latestUserMessage);
	} catch (error) {
		console.warn("[WIKI] Failed to build per-turn wiki query context:", error instanceof Error ? error.message : String(error));
	}
	if (threadId && threadForSession) {
		void rovoAppThreadManager.updateThread(threadId, {
			hermesContext: buildNextHermesThreadContext({
				currentHermesContext: threadForSession.hermesContext,
				autoSelectedSkillIds: autoSelectedHermesSkillIds,
				selectedSkillIds: selectedHermesSkillIds,
			}),
		}).catch((error) => {
			console.warn("[HERMES] Failed to persist resolved Hermes thread context:", error instanceof Error ? error.message : String(error));
		});
	}
	if (workItemReportRequest.shouldCreateArtifact) {
		requestBody.futureArtifactMode = "create";
		requestBody.futureArtifactTitle = workItemReportRequest.title;
		requestBody.futureArtifactKind = "html";
	}

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
	const workItemReportContextDescription =
		workItemReportRequest.contextBlock ||
		(baseContextDescription?.includes(WORK_ITEM_REPORT_REQUEST_START)
			? null
			: buildWorkItemReportRequestContext({
					contextDescription: baseContextDescription,
					promptText: latestUserMessage,
					skillId: workItemReportRequest.skillId,
				}));
	const effectiveBaseContextDescription = [
		delegationContextDescription,
		hermesContextDescription,
		wikiQueryContextDescription,
		baseContextDescription,
		workItemReportContextDescription,
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
	delete requestBody.hermesContext;

	const requestIsPlanMode = requestBody.isPlanMode === true;
	delete requestBody.isPlanMode;

	const requestArtifactCreationRetry = requestBody.artifactCreationRetry === true;
	delete requestBody.artifactCreationRetry;

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

	if (workItemReportRequest.isIntent && !workItemReportRequest.hasContext) {
		routingDecision = {
			intent: "chat",
			presentation: "text",
			confidence: 1,
			reason: "work_item_report_missing_context",
			origin: requestOrigin,
		};
		stageTrace.mark("route_decision_resolved", {
			stageMs: 0,
			intent: "chat",
			confidence: 1,
			reason: "work_item_report_missing_context",
		});
	} else if (workItemReportRequest.shouldCreateArtifact) {
		routingDecision = {
			intent: "artifact_create",
			presentation: "artifact_preview",
			confidence: 1,
			reason: "work_item_report_intent",
			origin: requestOrigin,
		};
		stageTrace.mark("route_decision_resolved", {
			stageMs: 0,
			intent: "artifact_create",
			confidence: 1,
			reason: "work_item_report_intent",
		});
	} else if (requestIsPlanMode || autoPlanTriggered) {
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
		const artifactBackendPreference =
			workItemReportRequest.artifactBackendPreference ||
			(await resolveRovoAppTurnBackendPreference({
				isPlanModeActive: requestIsPlanMode || autoPlanTriggered,
				requestBody,
				routingDecision,
			}));
		await persistRovoAppRunBackend(threadId, artifactBackendPreference);

		const handled = await handleRovoAppArtifactToolRequest({
			activeArtifact,
			activeDocument,
			artifactSteering,
			artifactBackendPreference,
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
			await consumeRovoAppManagedResponse({
				initialMessages: requestMessages,
				response: handled.response,
				run,
				stageTrace,
				threadId,
			});
			return;
		}
	}

	const artifactContextBlock = buildRovoAppArtifactContext(activeArtifact);

	const browserContextBlock = [
		"[BROWSER TOOLS]",
		"You have access to a thread-bound browser workspace runtime.",
		`For every browser tool call in this conversation, pass \`thread_id: \"${threadId}\"\`.`,
		"When you need to browse a web page, take a screenshot, or interact with a website, use these browser_* tools:",
		"- browser_navigate — navigate to a URL",
		"- browser_take_screenshot — capture a screenshot of the current page",
		"- browser_snapshot — get an accessibility tree snapshot of the page",
		"- browser_click — click an element by accessibility ref",
		"- browser_hover — hover an element by accessibility ref",
		"- browser_fill — replace the text in an element by accessibility ref",
		"- browser_type — type text into an element by accessibility ref",
		"- browser_select — select one or more values by accessibility ref",
		"- browser_press_key — press a keyboard key",
		"- browser_scroll — scroll the page",
		"- browser_navigate_back — go back in history",
		"- browser_navigate_forward — go forward in history",
		"- browser_reload — reload the current page",
		"- browser_tab_list — list browser tabs",
		"- browser_tab_new — open a new tab",
		"- browser_tab_select — switch to a tab by index",
		"- browser_tab_close — close a tab by index",
		"- browser_wait — wait a short time before continuing",
		"",
		"IMPORTANT: Do NOT use Playwright MCP, get_skill, browsing_get_web, get_url, or other built-in browsing tools for web browsing here.",
		"Always use browser_snapshot after navigation or significant DOM changes to refresh refs before interacting again.",
		"[END BROWSER TOOLS]",
	].join("\n");
	const wikiCaptureContextBlock = [
		"[WIKI TOOLS]",
		"You can save durable webpage sources and reusable synthesis pages into the llm-wiki.",
		"For normal answering, you also receive a wiki query context block before each turn whenever relevant canonical pages match the user request.",
		"Use these wiki tools when the user wants a webpage saved, clipped, remembered, added to the wiki, or when a reusable answer should be saved back into the wiki:",
		"- wiki_capture_url — save a specific public URL into llm-wiki/raw",
		"- wiki_capture_active_page — save the current page from the thread-bound browser workspace",
		"- wiki_save_synthesis — save a reusable answer as a canonical llm-wiki/wiki/synthesis page",
		`For wiki_capture_active_page calls, pass \`thread_id: \"${threadId}\"\`.`,
		"Prefer wiki_capture_active_page for requests like 'save this page' after browsing in-thread.",
		"Prefer wiki_capture_url when the user pasted or mentioned a direct URL.",
		"When your answer seems broadly reusable, offer to save it to the wiki. If the user confirms, call wiki_save_synthesis with a clear title and markdown body.",
		"Do not capture search-result pages, localhost/private URLs, login walls, or obviously thin pages.",
		"After a successful wiki tool call, briefly confirm what was saved, where it went, or why it was skipped.",
		"[END WIKI TOOLS]",
	].join("\n");

	const contextBlocks = [
		artifactContextBlock,
		browserContextBlock,
		wikiCaptureContextBlock,
		effectiveBaseContextDescription,
	].filter(Boolean);
	if (contextBlocks.length > 0) {
		requestBody.contextDescription = contextBlocks.join("\n\n");
	}
	if (routingDecision.intent === "genui") {
		requestBody.genuiHint = true;
	}
	requestBody.backendPreference = await resolveRovoAppTurnBackendPreference({
		isPlanModeActive: requestIsPlanMode || autoPlanTriggered,
		requestBody,
		routingDecision,
	});
	await persistRovoAppRunBackend(threadId, requestBody.backendPreference);
	requestBody.resolvedPlanModeActive = requestIsPlanMode || autoPlanTriggered;
	requestBody.chatSdkSource = "rovo";
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
		throw new Error(errorText || "Failed to stream Rovo response");
	}

	await consumeRovoAppManagedResponse({
		initialMessages: requestMessages,
		prependChunk: formatRouteDecisionSSE(routingDecision),
		response,
		run,
		stageTrace,
		threadId,
	});
	stageTrace.mark("run_complete");
}

async function startManagedRovoAppRun(run) {
	const markedRun = rovoAppRunManager.markRunStarted(run.threadId, {
		backend: run.backend === "rovo" ? "rovo" : "ai-gateway",
		portIndex: null,
		rovoPort: null,
		status: rovoAppRunManager.hasSubscribers(run.threadId) ? "streaming" : "background",
	});
	if (!markedRun) {
		return;
	}

	await persistRovoAppRunState(run.threadId, markedRun);
	void executeRovoAppManagedRun(markedRun).catch(async (error) => {
		const wasAborted = markedRun.abortController.signal.aborted;
		if (!wasAborted) {
			console.error("[FUTURE-CHAT] Managed run failed:", error);
		}
		await failRovoAppRun(markedRun.threadId, error);
	});
}

async function startNextQueuedRovoAppRun() {
	if (isProcessingRovoAppRunQueue) {
		return;
	}

	isProcessingRovoAppRunQueue = true;
	try {
		const queuedThreadIds = rovoAppRunManager.listQueuedThreadIds();
		for (const threadId of queuedThreadIds) {
			const run = rovoAppRunManager.getRun(threadId);
			if (!run) {
				rovoAppRunManager.removeQueuedRun(threadId);
				continue;
			}

			const assignment = resolveRovoAppPortAvailability();
			if (!assignment) {
				continue;
			}

			await startManagedRovoAppRun(run);
			break;
		}
	} finally {
		isProcessingRovoAppRunQueue = false;
	}
}

function waitForAgentsRfpDemoTraceDelay(delayMs) {
	return new Promise((resolve) => {
		setTimeout(resolve, delayMs);
	});
}

function createAgentsRfpDemoThinkingEventPart(step, phase) {
	const timestamp = new Date().toISOString();
	const part = {
		type: "data-thinking-event",
		id: `${step.toolCallId}-${phase}`,
		data: {
			eventId: `${step.toolCallId}-${phase}`,
			phase,
			toolName: step.toolName,
			label: step.label,
			toolCallId: step.toolCallId,
			timestamp,
		},
	};

	if (phase === "start" && step.input !== undefined) {
		part.data.input = step.input;
	}
	if (phase === "result") {
		part.data.output = step.output ?? step.outputPreview ?? "Completed.";
		if (step.outputPreview) {
			part.data.outputPreview = step.outputPreview;
		}
	}

	return part;
}

async function writeAgentsRfpDemoTrace(writer, steps) {
	for (const step of steps) {
		const toolCallDelayMs =
			typeof step.delayMs === "number" && Number.isFinite(step.delayMs) && step.delayMs > 0
				? step.delayMs
				: getAgentsRfpDemoToolCallDelayMs();
		const hasResult = step.output !== undefined || step.outputPreview;
		const resultDelayMs = hasResult
			? Math.round(toolCallDelayMs * 0.7)
			: toolCallDelayMs;
		const resultHoldDelayMs = hasResult
			? Math.max(0, toolCallDelayMs - resultDelayMs)
			: 0;

		writer.write({
			type: "data-thinking-status",
			id: `${step.toolCallId}-status`,
			data: {
				label: step.label,
				content: step.content,
				activity: "data",
				source: "backend",
				timestamp: new Date().toISOString(),
			},
		});
		writer.write(createAgentsRfpDemoThinkingEventPart(step, "start"));
		await waitForAgentsRfpDemoTraceDelay(resultDelayMs);
		if (hasResult) {
			writer.write(createAgentsRfpDemoThinkingEventPart(step, "result"));
			if (resultHoldDelayMs > 0) {
				await waitForAgentsRfpDemoTraceDelay(resultHoldDelayMs);
			}
		}
	}
}

function writeAgentsRfpDemoText(writer, id, text) {
	writer.write({ type: "text-start", id });
	writer.write({
		type: "text-delta",
		id,
		delta: text,
	});
	writer.write({ type: "text-end", id });
}

async function createAgentsRfpDemoReportArtifact(requestBody) {
	const threadId = getNonEmptyString(requestBody?.id);
	if (!threadId) {
		throw new Error("Cannot create the RFP report artifact without an active Rovo thread.");
	}

	const report = await generateWorkItemVpkHtmlReport({
		contextDescription: requestBody.contextDescription,
		generateText: (options) =>
			generateTextViaGateway({
				...options,
				backendPreference: "ai-gateway",
				provider: options?.provider || getNonEmptyString(requestBody.provider),
			}),
		provider: getNonEmptyString(requestBody.provider),
		runSkillValidation: true,
		runVisualVerify: false,
	});
	const artifactDocument = await rovoAppDocumentManager.createDocument({
		threadId,
		title: RFP_DEMO_REPORT_TITLE,
		kind: "html",
		content: report.html,
		previewSummary: RFP_DEMO_REPORT_PREVIEW_SUMMARY,
		changeLabel: "Generated with vpk-html",
		sourceMessageId: null,
	});
	const currentThread = await rovoAppThreadManager.getThread(threadId);
	await rovoAppThreadManager.updateThread(threadId, {
		activeDocumentId: artifactDocument.id,
		hermesContext: buildNextHermesThreadContext({
			currentHermesContext: currentThread?.hermesContext,
			selectedSkillIds: mergeHermesSkillIds(
				currentThread?.hermesContext?.selectedSkillIds,
				"vpk-html",
			),
		}),
	});

	return artifactDocument;
}

function buildAgentsRfpDemoReportPreviewFields(variant) {
	if (variant === "refined" || variant === "branded") {
		return {
			includeAtlassianLogo: variant === "branded",
			recommendationText: "Provisional recommendation: respond to the Acmecorp RFP only if budget, stakeholder access, and review owners are confirmed before the team commits to a full response package.",
			driverText: "Driver: Maya Chen, proposal manager.",
			approverText: "Approver: Darius Pavri for deal desk and Elena Ruiz for security/legal posture.",
			contributorsText: "Contributors: Jordan Lee, Priya Shah, product specialists, and partner coverage owners.",
			informedText: "Informed: executive sponsor, support leadership, and partner teams after the bid/no-bid decision is recorded.",
			relationshipText: "Relationship is workable but not complete: the account team has working-level Acmecorp context, while executive sponsor access and champion strength still need confirmation.",
			budgetText: "Budget is not fully qualified; treat the multi-thousand-user scale as a pursuit signal, not proof that Acmecorp has approved spend.",
			campaignFitText: "Acmecorp is a strong fit for the enterprise service-management campaign because the RFP centers on ITSM, CMDB maturity, knowledge, reporting, governed AI, and cross-team service delivery.",
			competitiveAdvantages: [
				"Atlassian can connect service, software, knowledge, and business teams through one system of work.",
				"Jira Service Management plus Assets supports the Acmecorp ITSM, portal, incident, change, and CMDB story.",
				"Rovo and Teamwork Graph give the response a credible AI and knowledge-reuse differentiator.",
			],
			decisionRisks: [
				"Budget qualification and discount guardrails are not confirmed.",
				"Legal, data residency, audit, vulnerability, and pricing answers need owner approval.",
				"HAM/SAM and partner coverage need careful positioning before customer-facing commitments.",
			],
			openGaps: [
				"Executive sponsor and champion strength are not recorded in the Work Item context.",
				"Approved legal wording for data residency, audit, and vulnerability responses is not recorded.",
				"Deal desk pricing approval timing and discount guardrails are not recorded.",
			],
		};
	}

	return {
		recommendationText: "Initial recommendation: qualify Acmecorp before responding; the platform fit is strong, but budget, stakeholder relationship, and review ownership need confirmation.",
		driverText: "Driver: Maya Chen, proposal manager.",
		approverText: "Approver: Darius Pavri for deal desk and Elena Ruiz for security/legal posture.",
		contributorsText: "Contributors: Jordan Lee for account strategy, Priya Shah for sales engineering, and product specialists for risky sections.",
		informedText: "Informed: executive stakeholders, support leadership, and partner teams once the bid/no-bid recommendation is recorded.",
		relationshipText: "The Work Item shows active account and proposal ownership for Acmecorp, but it does not prove executive sponsor access or champion strength.",
		budgetText: "Acmecorp scale is recorded as multi-thousand users; budget qualification is still pending and should remain a decision gate.",
		campaignFitText: "Acmecorp fits the enterprise service-management campaign through tool consolidation, ITSM workflows, CMDB maturity, knowledge, reporting, AI readiness, and governed compliance requirements.",
		competitiveAdvantages: [
			"Atlassian System of Work maps well to Acmecorp's fragmented service and work-management environment.",
			"Jira Service Management, Assets, Confluence, Guard, and automation cover the core operating model.",
			"Rovo and Teamwork Graph add a differentiated AI and knowledge-reuse story.",
		],
		decisionRisks: [
			"Budget qualification is not confirmed.",
			"Legal, data residency, audit, vulnerability, HAM/SAM, and pricing responses need owner review.",
			"CMDB scale and asset-management assumptions need credible evidence before final response drafting.",
		],
		openGaps: [
			"Bid/no-bid decision date and final approval owner are not specified.",
			"Stakeholder relationship strength is not confirmed.",
			"Required data residency region is not recorded in the Work Item context.",
		],
	};
}

async function generateAgentsRfpDemoReportPreview(requestBody) {
	const contextDescription = getNonEmptyString(requestBody?.contextDescription);
	if (!contextDescription) {
		throw new Error("contextDescription is required");
	}

	const variant = getNonEmptyString(requestBody?.variant) === "refined"
		? "refined"
		: getNonEmptyString(requestBody?.variant) === "branded"
		? "branded"
		: "initial";
	const report = await generateWorkItemVpkHtmlReport({
		contextDescription,
		generateText: async () => JSON.stringify(buildAgentsRfpDemoReportPreviewFields(variant)),
		runSkillValidation: false,
		runVisualVerify: false,
	});

	return {
		html: report.html,
		skill: report.skill,
		variant,
	};
}

function writeAgentsRfpDemoArtifactResult(writer, artifactDocument) {
	writer.write({
		type: "data-artifact-result",
		data: {
			documentId: artifactDocument.id,
			threadId: artifactDocument.threadId,
			title: artifactDocument.title,
			kind: artifactDocument.kind,
			action: "create",
		},
	});
}

function writeAgentsRfpDemoAgentResult(writer, options = {}) {
	writer.write({
		type: "data-agent-result",
		data: buildAgentsRfpDemoAgentResultPayload(options),
	});
}

function writeAgentsRfpDemoTurnComplete(writer, intent = "chat") {
	writer.write(createRouteDecisionPart({
		intent,
		origin: "text",
		reason: "agents_rfp_demo",
	}));
	writer.write({
		type: "data-turn-complete",
		data: { timestamp: new Date().toISOString() },
	});
}

function streamAgentsRfpDemoChatTurn(res, turn, requestBody) {
	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			if (turn === "agent-creation") {
				const currentState = await agentsRfpDemoStateManager.readState();
				const selectedKnowledge = getNonEmptyString(currentState.chat?.selectedRfpKnowledge);
				await writeAgentsRfpDemoTrace(writer, buildAgentsRfpDemoAgentCreationTrace({ selectedKnowledge }));
				writeAgentsRfpDemoAgentResult(writer, { selectedKnowledge });
				writeAgentsRfpDemoText(
					writer,
					`agents-rfp-demo-agent-created-${Date.now()}`,
					buildAgentsRfpDemoAgentCreationConfirmationText(),
				);
				writeAgentsRfpDemoTurnComplete(writer);
				return;
			}

			if (turn === "qualification-answer") {
				const selectedKnowledge = extractAgentsRfpDemoSelectedKnowledge(requestBody);
				if (selectedKnowledge) {
					const currentState = await agentsRfpDemoStateManager.readState();
					await agentsRfpDemoStateManager.writeState({
						...currentState,
						chat: {
							...currentState.chat,
							selectedRfpKnowledge: selectedKnowledge,
						},
					});
				}
				await writeAgentsRfpDemoTrace(writer, buildAgentsRfpDemoAnswerTrace());
				const artifactDocument = await createAgentsRfpDemoReportArtifact(requestBody);
				writeAgentsRfpDemoArtifactResult(writer, artifactDocument);
				writeAgentsRfpDemoText(
					writer,
					`agents-rfp-demo-report-${Date.now()}`,
					buildAgentsRfpDemoReportConfirmationText({
						documentId: artifactDocument.id,
						title: artifactDocument.title,
					}),
				);
				writeAgentsRfpDemoTurnComplete(writer, "artifact_create");
				return;
			}

			const preloadDelayMs = getAgentsRfpDemoPreloadDelayMs(turn);
			if (preloadDelayMs > 0) {
				await waitForAgentsRfpDemoTraceDelay(preloadDelayMs);
			}

			const questionCardPayload = buildAgentsRfpDemoQuestionCardPayload();
			_requestUserInputQuestionMetaStore.set(
				questionCardPayload.sessionId,
				buildQuestionMetaFromQuestionCardPayload(questionCardPayload),
			);
			await writeAgentsRfpDemoTrace(writer, buildAgentsRfpDemoQualificationTrace());
			writeAgentsRfpDemoText(
				writer,
				`agents-rfp-demo-qualification-${Date.now()}`,
				buildAgentsRfpDemoQualificationIntro(),
			);
			writer.write({
				type: "data-widget-data",
				id: RFP_DEMO_QUESTION_TOOL_CALL_ID,
				data: {
					type: "question-card",
					payload: {
						...questionCardPayload,
						toolCallId: RFP_DEMO_QUESTION_TOOL_CALL_ID,
						deferredToolCallId: RFP_DEMO_QUESTION_TOOL_CALL_ID,
						tool_call_id: RFP_DEMO_QUESTION_TOOL_CALL_ID,
					},
				},
			});
			writeAgentsRfpDemoTurnComplete(writer);
		},
		onError: (error) => {
			if (error instanceof Error) {
				return error.message;
			}
			return "Failed to stream RFP demo response";
		},
	});

	pipeUIMessageStreamToResponse({
		response: res,
		stream,
	});
}

async function proxyRovoAppChatRequest(req, res) {
	const requestBody =
		req.body && typeof req.body === "object" ? { ...req.body } : {};
	const threadId = getNonEmptyString(requestBody.id);
	if (!threadId) {
		return res.status(400).json({ error: "threadId is required" });
	}

	let existingRun = rovoAppRunManager.getRun(threadId);
	if (shouldReplaceActiveRunForRequest({ existingRun, requestBody })) {
		if (typeof existingRun?.rovoPort === "number" && existingRun.rovoPort > 0) {
			await rovoCancelChat(existingRun.rovoPort, { timeoutMs: 3_000 }).catch(() => {});
		}
		rovoAppRunManager.cancelRun(threadId);
		await clearRovoAppRunState(threadId);
		existingRun = null;
	}

	const agentsRfpDemoTurn = !existingRun
		? resolveAgentsRfpDemoChatTurn(requestBody)
		: null;
	if (agentsRfpDemoTurn) {
		streamAgentsRfpDemoChatTurn(res, agentsRfpDemoTurn, requestBody);
		return;
	}

	const run =
		existingRun ||
		rovoAppRunManager.createRun({
			backend: "ai-gateway",
			threadId,
			requestBody,
			requestedPortIndex: null,
		});

	const subscriberId = rovoAppRunManager.attachSubscriber(threadId, res, {
		onDetached: (detachedRun) => {
			if (!detachedRun) {
				return;
			}
			void persistRovoAppRunState(threadId, detachedRun);
		},
	});
	if (!subscriberId) {
		return res.status(404).json({ error: "No active Rovo run for threadId" });
	}

	if (!existingRun) {
		console.info("[TIMING][rovo-app] start-managed-run", {
			threadId,
		});
		await startManagedRovoAppRun(run);
	}

	await persistRovoAppRunState(threadId, rovoAppRunManager.getRun(threadId));
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

function buildRovoAppActiveRunPayload(run, thread) {
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
		backend: run.backend === "rovo" ? "rovo" : "ai-gateway",
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

async function persistRovoAppRunState(threadId, run) {
	if (!threadId) {
		return null;
	}

	const thread = await rovoAppThreadManager.getThread(threadId);
	if (!thread) {
		return null;
	}

	return rovoAppThreadManager.updateThread(threadId, {
		activeRun: buildRovoAppActiveRunPayload(run, thread),
	});
}

async function persistRovoAppRunBackend(threadId, backend) {
	const run = rovoAppRunManager.setRunBackend(threadId, backend);
	if (!run) {
		return null;
	}

	return persistRovoAppRunState(threadId, run);
}

async function clearRovoAppRunState(threadId) {
	if (!threadId) {
		return null;
	}

	return rovoAppThreadManager.updateThread(threadId, {
		activeRun: null,
	});
}

async function persistRovoAppRunMessagesSnapshot(threadId, messages) {
	if (!threadId || !Array.isArray(messages)) {
		return null;
	}

	const thread = await rovoAppThreadManager.getThread(threadId);
	if (!thread) {
		return null;
	}

	return rovoAppThreadManager.updateThread(threadId, {
		messages,
	});
}

function resolveRovoAppPortAvailability() {
	const poolStatus = _rovoPool?.getStatus?.();
	if (!_rovoPool) {
		return null;
	}

	const poolPorts = Array.isArray(poolStatus?.ports) ? poolStatus.ports : [];
	if (poolPorts.length === 0) {
		return null;
	}
	const hasAvailable = poolPorts.some((p) => p?.status === "available");
	return hasAvailable ? { available: true } : null;
}

async function reconcileOrphanedRovoAppThread(thread) {
	if (!thread?.id || !thread.activeRun) {
		return thread;
	}

	if (rovoAppRunManager.hasRun(thread.id)) {
		return thread;
	}

	return clearRovoAppRunState(thread.id);
}

function createSseDataChunk(payload) {
	return `data: ${JSON.stringify(payload)}\n\n`;
}

function createRovoAppFailureSseChunks(errorOrMessage) {
	const failurePayload = getRovoAppRunFailurePayload(
		errorOrMessage,
		typeof errorOrMessage === "string" ? errorOrMessage : undefined,
	);
	const text = failurePayload.message;
	const textId = `rovo-app-error-${Date.now()}`;
	return [
		createSseDataChunk({ type: "text-start", id: textId }),
		createSseDataChunk({ type: "text-delta", id: textId, delta: text }),
		createSseDataChunk({ type: "text-end", id: textId }),
		createSseDataChunk({
			type: "data-widget-error",
			id: `rovo-app-error-widget-${Date.now()}`,
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

function getUtf8ByteLength(value) {
	return typeof value === "string" && value.length > 0
		? Buffer.byteLength(value, "utf8")
		: 0;
}

const orchestratorLog = createOrchestratorLog({
	baseDir: path.join(__dirname, "data"),
	logger: console,
});

// Rovo-only mode - no local clarification/approval logic

const IMAGE_PROXY_TIMEOUT_MS = 15_000;

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

function createClarificationSessionId() {
	return `clarification-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createAIGatewayDeferredToolCallId(toolName) {
	const normalizedToolName =
		getNonEmptyString(toolName)?.toLowerCase().replace(/[^a-z0-9_]+/g, "_") ||
		"tool";
	return `ai-gateway-${normalizedToolName}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function isAIGatewayDeferredToolCallId(toolCallId) {
	return getNonEmptyString(toolCallId)?.startsWith("ai-gateway-") === true;
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
		status:
			value.status === "dismissed"
				? "dismissed"
				: value.status === "answered"
					? "answered"
					: undefined,
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
const _pausedRovoToolCallStore = new Map();
const PAUSED_ROVO_TOOL_CALL_TTL_MS = 15 * 60_000;


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
		expiresAt: now + PAUSED_ROVO_TOOL_CALL_TTL_MS,
		expiryTimer: null,
	};

	record.expiryTimer = setTimeout(() => {
		clearActiveDeferredToolCall(normalizedToolCallId);
	}, PAUSED_ROVO_TOOL_CALL_TTL_MS);
	if (typeof record.expiryTimer?.unref === "function") {
		record.expiryTimer.unref();
	}

	_activeDeferredToolCallStore.set(normalizedToolCallId, record);
	return record;
}

function detachPausedRovoToolCall(toolCallId) {
	const normalizedToolCallId = getNonEmptyString(toolCallId);
	if (!normalizedToolCallId) {
		return null;
	}

	const record = _pausedRovoToolCallStore.get(normalizedToolCallId) || null;
	if (!record) {
		return null;
	}

	_pausedRovoToolCallStore.delete(normalizedToolCallId);
	if (record.expiryTimer) {
		clearTimeout(record.expiryTimer);
		record.expiryTimer = null;
	}

	return record;
}

function releasePausedRovoToolCallHandle(record, {
	unhealthy = false,
	unhealthyReason = "paused tool cleanup failed",
} = {}) {
	const releaseHandle = () => {
		try {
			record.handle?.release?.();
		} catch (error) {
			console.warn("[ROVO-PAUSE] Failed to release reserved port handle:", error);
		}
	};
	const releaseHandleAsUnhealthy = () => {
		try {
			if (typeof record.handle?.releaseAsUnhealthy === "function") {
				record.handle.releaseAsUnhealthy(unhealthyReason);
				return;
			}
			record.handle?.release?.();
		} catch (error) {
			console.warn("[ROVO-PAUSE] Failed to release unhealthy reserved port handle:", error);
		}
	};

	if (unhealthy) {
		releaseHandleAsUnhealthy();
		return;
	}

	releaseHandle();
}

function clearPausedRovoToolCall(toolCallId, { cancel = false } = {}) {
	const normalizedToolCallId = getNonEmptyString(toolCallId);
	const record = detachPausedRovoToolCall(normalizedToolCallId);
	if (!record) {
		return null;
	}

	if (cancel) {
		void cancelPausedDeferredToolCallRecord(record, {
			cancelChat: rovoCancelChat,
			waitForReady: waitForPortReady,
			onReleaseError: (error) => {
				console.warn("[ROVO-PAUSE] Failed to release reserved port handle:", error);
			},
		}).catch((error) => {
			console.warn("[ROVO-PAUSE] Failed to cancel paused tool call:", {
				toolCallId: normalizedToolCallId,
				port: record.port,
				error: error instanceof Error ? error.message : String(error),
			});
		});
	} else {
		releasePausedRovoToolCallHandle(record);
	}

	return record;
}

function registerPausedRovoToolCall({
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

	clearPausedRovoToolCall(normalizedToolCallId, { cancel: true });

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
		expiresAt: now + PAUSED_ROVO_TOOL_CALL_TTL_MS,
		expiryTimer: null,
	};

	record.expiryTimer = setTimeout(() => {
		console.info("[ROVO-PAUSE] Expiring paused tool call reservation", {
			toolCallId: normalizedToolCallId,
			port,
			kind: record.kind,
		});
		clearPausedRovoToolCall(normalizedToolCallId, { cancel: true });
	}, PAUSED_ROVO_TOOL_CALL_TTL_MS);
	if (typeof record.expiryTimer?.unref === "function") {
		record.expiryTimer.unref();
	}

	_pausedRovoToolCallStore.set(normalizedToolCallId, record);
	return record;
}

function takePausedRovoToolCall(toolCallId) {
	return detachPausedRovoToolCall(toolCallId);
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

	if (approvalSubmission.decision === "continue-planning") {
		lines.push(
			"The user rejected this plan and wants revisions.",
			"Stay in plan mode. Revise the plan based on any feedback provided above.",
			"Call exit_plan_mode again with the updated plan.",
			"Do not start implementation or call update_todo."
		);
	} else {
		lines.push(
			"This approval applies to the existing generated plan. Continue from it.",
			"Stay in the current Rovo Serve execution loop.",
			"Maintain a single evolving update_todo list for implementation progress.",
			"Do not ask clarification questions again unless the user explicitly requests a new plan.",
			"Do not restate the plan as a fresh request or generate a new preview unless the user explicitly asks for one."
		);
	}

	return lines.join("\n");
}

function serializeSyntheticToolResult(value) {
	if (typeof value === "string") {
		return value;
	}

	if (value === undefined) {
		return "";
	}

	try {
		return JSON.stringify(value);
	} catch {
		return String(value);
	}
}

function buildAIGatewayDeferredToolResultBlock({
	toolName,
	toolCallId,
	result,
}) {
	const normalizedToolName = getNonEmptyString(toolName) || "deferred_tool";
	const serializedResult = serializeSyntheticToolResult(result);
	return [
		`[${normalizedToolName} Result]`,
		`The user responded to your ${normalizedToolName} deferred tool request.`,
		toolCallId ? `tool_call_id: ${toolCallId}` : null,
		serializedResult ? `result: ${serializedResult}` : null,
		`[End ${normalizedToolName} Result]`,
	]
		.filter(Boolean)
		.join("\n");
}

function buildAIGatewayPlanApprovalResult(approvalSubmission, rawApproval) {
	if (!approvalSubmission) {
		return null;
	}

	const result = {
		decision: approvalSubmission.decision,
		customInstruction: approvalSubmission.customInstruction,
		toolCallId:
			getNonEmptyString(rawApproval?.toolCallId) ||
			getNonEmptyString(rawApproval?.deferredToolCallId) ||
			approvalSubmission.toolCallId ||
			approvalSubmission.deferredToolCallId ||
			undefined,
	};

	if (approvalSubmission.decision === "continue-planning") {
		result.instructions = [
			"The user rejected this plan and wants revisions.",
			"Stay in plan mode and call exit_plan_mode again with the updated plan.",
			"Do not start implementation.",
		];
	} else {
		result.instructions = [
			"The user approved this plan.",
			"Continue from the approved plan without asking clarification questions again unless the user explicitly requests a new plan.",
		];
	}

	if (approvalSubmission.planTitle) {
		result.planTitle = approvalSubmission.planTitle;
	}
	if (approvalSubmission.planTasks.length > 0) {
		result.planTasks = approvalSubmission.planTasks;
	}

	return result;
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

function buildApprovalResumeDecision(approvalSubmission) {
	if (!approvalSubmission) {
		return null;
	}

	if (approvalSubmission.decision === "auto-accept") {
		return null;
	}

	return buildApprovalSummary(approvalSubmission);
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

app.post("/api/rovo/suggestions", async (req, res) => {
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

		console.error("[SUGGESTIONS] Rovo suggestions request failed:", error);
		return res.status(200).json({ questions: [] });
	} finally {
		cleanup();
	}
});

async function generatePlanMetadataViaGateway({
	title,
	description,
	markdown,
	tasks,
}) {
	return generatePlanMetadata({
		title,
		description,
		markdown,
		tasks,
		generateText: (options) =>
			generateTextViaGateway({
				...options,
				backendPreference: "ai-gateway",
			}),
	});
}

function buildArtifactPreviewSummary(title) {
	const normalizedTitle = getNonEmptyString(title) ?? "App";
	return normalizedTitle === "App"
		? "Generated app preview ready to open"
		: `${normalizedTitle} preview ready to open`;
}

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
		const { title, description, markdown, tasks } = req.body || {};

		if (!title || typeof title !== "string" || !title.trim()) {
			return res.status(400).json({ error: "A title is required" });
		}

		const {
			title: enrichedTitle,
			shortDescription: enrichedShortDescription,
		} = await generatePlanMetadataViaGateway({
			title,
			description,
			markdown,
			tasks,
		});

		if (!enrichedTitle) {
			return res.status(500).json({ error: "Empty title generated" });
		}

		return res.json({ title: enrichedTitle, shortDescription: enrichedShortDescription });
	} catch (error) {
		console.error("Plan title API error:", error);
		return sendGatewayErrorResponse(res, error, "Failed to generate plan title");
	}
});

app.post("/api/genui-description-summary", async (req, res) => {
	try {
		const { title, description } = req.body || {};

		if (!description || typeof description !== "string" || !description.trim()) {
			return res.status(400).json({ error: "A description is required" });
		}

		const result = await generateDescriptionSummary({
			title,
			description,
			generateText: (options) =>
				generateTextViaGateway({
					...options,
					backendPreference: "ai-gateway",
				}),
		});

		return res.json(result);
	} catch (error) {
		console.warn("[GENUI-DESCRIPTION] AI Gateway unavailable:", error?.message || error);
		return res.json({ shortDescription: null });
	}
});

async function handleChatSdkRequest(req, res) {
	let stageTrace = null;
	let cleanupChatSdkAbortTracking = null;
	try {
		const {
			messages,
			backendPreference: rawBackendPreference,
			contextDescription: rawContextDescription,
			clientTimeZone: rawClientTimeZone,
			userName: rawUserName,
			provider,
			model: rawModel,
			clarification: rawClarification,
			approval: rawApproval,
			deferredToolResponse: rawDeferredToolResponse,
			creationMode,
			smartGeneration: rawSmartGeneration,
			hermesContext: rawHermesContext,
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
		const backendPreference =
			rawBackendPreference === "ai-gateway" || rawBackendPreference === "rovo"
				? rawBackendPreference
				: "ai-gateway";
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
		const rovoSessionId = sessionId && sessionMode !== "ephemeral"
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
			backendPreference,
			provider: getNonEmptyString(provider) || null,
			model: getNonEmptyString(rawModel) || null,
			hasClarification: Boolean(rawClarification),
			hasApproval: Boolean(rawApproval),
			hasDeferredToolResponse: Boolean(rawDeferredToolResponse),
			resolvedPlanModeActive,
		});
		const hasQueuedPrompts = Boolean(rawHasQueuedPrompts);

		// If creationMode is set, prepend creation guidance to contextDescription.
		let contextDescription = rawContextDescription;
		if (creationMode === "skill" || creationMode === "agent") {
			const prefix = buildCreationModeContextPrefix(creationMode);
			if (prefix) {
				contextDescription = contextDescription ? `${prefix}\n\n${contextDescription}` : prefix;
			}
		}

		const latestVisibleUserMessage = getLatestVisibleUserMessage(messages);
		const latestUserMessageSource = getLatestUserMessageSource(messages);
		const isPostClarificationTurn =
			latestUserMessageSource === "clarification-submit";
		const clarificationSubmission = normalizeClarificationSubmission(rawClarification);
		const approvalSubmission = normalizeApprovalSubmission(rawApproval);
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
			_pausedRovoToolCallStore.has(clarificationToolCallId);
		let hasPausedApprovalToolCall =
			Boolean(approvalToolCallId) &&
			_pausedRovoToolCallStore.has(approvalToolCallId);

		if (approvalSubmission) {
			console.info("[DEBUG-PLAN-APPROVAL] Approval store lookup", {
				approvalToolCallId,
				hasPausedApprovalToolCall,
				storeSize: _pausedRovoToolCallStore.size,
				storeKeys: [..._pausedRovoToolCallStore.keys()],
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
			if (approvalSubmission && approvalSubmission.decision !== "continue-planning" && planSession.phase !== "execution") {
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
		const currentPlanSession = threadId ? getPlanSession(threadId) : null;
		const isPlanFeedbackDeferredResumeTurn = Boolean(
			rawDeferredToolResponse &&
			resolvedPlanModeActive &&
			deferredToolResponseToolCallId &&
			currentPlanSession?.isActive &&
			currentPlanSession.phase === "plan" &&
			currentPlanSession.deferredToolCallId === deferredToolResponseToolCallId
		);
		const {
			message: latestUserMessage,
			conversationHistory,
		} = mapUiMessagesToConversation(messages);

		if (!latestUserMessage) {
			return res.status(400).json({ error: "A user message is required" });
		}

		let workItemReportRequest = resolveWorkItemReportRequest({
			contextDescription,
			promptText: latestUserMessage,
		});
		if (workItemReportRequest.isIntent) {
			try {
				const installedHermesSkills = await listHermesSkills();
				workItemReportRequest = resolveWorkItemReportRequest({
					contextDescription,
					promptText: latestUserMessage,
					skills: installedHermesSkills,
				});
			} catch (error) {
				console.warn(
					"[CHAT-SDK] Failed to resolve installed Hermes skills for Work Item report:",
					error instanceof Error ? error.message : String(error),
				);
			}
		}

		if (workItemReportRequest.isIntent && !workItemReportRequest.hasContext) {
			const stream = createUIMessageStream({
				execute: async ({ writer }) => {
					const textId = `work-item-report-missing-context-${Date.now()}`;
					writer.write({ type: "text-start", id: textId });
					writer.write({
						type: "text-delta",
						id: textId,
						delta:
							"I can create the HTML report once a Jira Work Item is open or included in the chat context. Open the Work Item, then ask me to generate the report again.",
					});
					writer.write({ type: "text-end", id: textId });
					writer.write(createRouteDecisionPart({
						intent: "chat",
						origin: requestOrigin,
						reason: "work_item_report_missing_context",
					}));
					writer.write({
						type: "data-turn-complete",
						data: { timestamp: new Date().toISOString() },
					});
				},
				onError: (error) =>
					error instanceof Error
						? error.message
						: "Failed to resolve Work Item report context",
			});
			pipeUIMessageStreamToResponse({ response: res, stream });
			return;
		}

		if (workItemReportRequest.shouldCreateArtifact) {
			const reportThreadId = threadId || createRovoAppThreadId();
			const requestHermesContext =
				rawHermesContext && typeof rawHermesContext === "object"
					? rawHermesContext
					: null;
			const selectedReportSkillIds = workItemReportRequest.shouldLoadSkill
				? mergeHermesSkillIds(
						requestHermesContext?.selectedSkillIds,
						workItemReportRequest.skillId,
					)
				: requestHermesContext?.selectedSkillIds;
			const workItemReportContextDescription =
				workItemReportRequest.contextBlock ||
				(contextDescription?.includes(WORK_ITEM_REPORT_REQUEST_START)
					? null
					: buildWorkItemReportRequestContext({
							contextDescription,
							promptText: latestUserMessage,
							skillId: workItemReportRequest.skillId,
						}));
			let reportHermesContextDescription = null;
			try {
				reportHermesContextDescription = await buildRovoAppHermesContextDescription({
					selectedSkillIds: selectedReportSkillIds,
				});
			} catch (error) {
				console.warn(
					"[CHAT-SDK] Failed to build Hermes context for Work Item report:",
					error instanceof Error ? error.message : String(error),
				);
			}
			const reportContextDescription = [
				reportHermesContextDescription,
				contextDescription,
				workItemReportContextDescription,
			]
				.filter(Boolean)
				.join("\n\n");
			const { abortController, cleanup } = createAbortControllerFromRequest(req, res, {
				onAbort: () => {
					console.log("[CHAT-SDK] Client disconnected, aborting Work Item report artifact stream");
				},
			});
			try {
				const handled = await handleRovoAppArtifactToolRequest({
					activeArtifact: null,
					activeDocument: null,
					artifactSteering: null,
					artifactBackendPreference: workItemReportRequest.artifactBackendPreference || "ai-gateway",
					contextDescription: reportContextDescription || null,
					requestOrigin,
					requestBody: {
						...(req.body || {}),
						id: reportThreadId,
						messages,
						provider,
						futureArtifactMode: "create",
						futureArtifactTitle: workItemReportRequest.title,
						futureArtifactKind: "html",
					},
					signal: abortController.signal,
					streamingArtifact: null,
					threadId: reportThreadId,
				});

				if (handled?.handled && handled.response) {
					stageTrace.mark("chat_sdk_report_artifact_route_handled", {
						threadId: reportThreadId,
						skillId: workItemReportRequest.skillId,
					});
					await pipeWebResponseToExpressResponse(handled.response, res);
					return;
				}
			} finally {
				cleanup();
			}
		}

		// AI Gateway-minted clarification toolCallIds have no paused-tool-call
		// counterpart by design (the gateway path doesn't pause-and-resume;
		// answers are injected as context for the next turn). Skip the
		// Rovo-shaped expired gate for these so legitimate submissions
		// aren't rejected as "expired".
		const isAIGatewayClarificationToolCallId =
			isAIGatewayDeferredToolCallId(clarificationToolCallId);
		const shouldRejectExpiredClarification =
			!isAIGatewayClarificationToolCallId &&
			shouldRejectExpiredDeferredClarification({
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
				await rovoCancelChat(activeRequestPort, { timeoutMs: 3_000 }).catch(() => {});
				activeRequests.delete(threadId);
			}

			streamExpiredClarificationResponse(res, clarificationToolCallId);
			return;
		}

		// ── Local model shortcut (bypasses Rovo and all smart routing) ──
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

						await streamViaRovo({
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
								payload: withCanonicalPreviewBody(SMART_WIDGET_TYPE_GENUI, {
									spec: translationSpec,
									summary: summaryText,
									source: "translation-tool",
								}),
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
								payload: withCanonicalPreviewBody(SMART_WIDGET_TYPE_AUDIO, {
									audioUrl: buildAudioDataUrl(
										synthesisResult.audioBytes,
										synthesisResult.contentType
									),
									mimeType: synthesisResult.contentType,
									transcript: stripConversationalFiller(clarifiedAudioSelection.voiceInput),
									source: "audio-context-clarification",
									inputSource: clarifiedAudioSelection.source || undefined,
								}),
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
												payload: withCanonicalPreviewBody(SMART_WIDGET_TYPE_IMAGE, {
													images: [...generatedImages],
													prompt: latestUserMessage,
													source: "image-context-clarification",
													inputSource: clarifiedImageContext.source || undefined,
												}),
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

		// Inject the user's clarification answers as a structured
		// [ask_user_questions Result] block into the system context so the
		// model can ground its follow-up. Fires for both Rovo (when no
		// paused tool call exists for the V3 resume path to handle it) and
		// AI Gateway (which has no paused-tool-call concept and always
		// needs the injection). The `submitClarification` client flow
		// always sends BOTH `clarification` and `deferredToolResponse`, so
		// we no longer gate on the absence of `rawDeferredToolResponse`.
		if (clarificationSubmission && !hasPausedClarificationToolCall) {
			const adaptedAnswers = adaptClarificationAnswersForToolContract(
				clarificationSubmission.sessionId,
				clarificationSubmission.answers
			);
			const usesAIGatewaySyntheticResult =
				backendPreference === "ai-gateway" ||
				isAIGatewayDeferredToolCallId(clarificationToolCallId);
			const answerBlock = usesAIGatewaySyntheticResult
				? buildAIGatewayDeferredToolResultBlock({
					toolName: "ask_user_questions",
					toolCallId: clarificationToolCallId,
					result:
						clarificationSubmission.status === "dismissed"
							? buildClarificationResumeDenyMessage(
								clarificationSubmission,
								adaptClarificationAnswersForToolContract,
							)
							: adaptedAnswers,
				})
				: `[ask_user_questions Result]\nThe user answered your ask_user_questions tool call. Here are their answers:\n${JSON.stringify(adaptedAnswers)}\n[End ask_user_questions Result]`;
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
			const isAIGatewayExitPlanToolResponse =
				isAIGatewayDeferredToolCallId(toolCallId) &&
				toolCallId.includes("exit_plan_mode");
			if (
				toolCallId &&
				result &&
				typeof result === "object" &&
				!isAIGatewayExitPlanToolResponse
			) {
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
			} else if (
				toolCallId &&
				isAIGatewayDeferredToolCallId(toolCallId) &&
				result !== undefined
			) {
				const resultBlock = buildAIGatewayDeferredToolResultBlock({
					toolName: "exit_plan_mode",
					toolCallId,
					result,
				});
				enrichedContextDescription = enrichedContextDescription
					? `${enrichedContextDescription}\n\n${resultBlock}`
					: resultBlock;
			}
		}

		if (approvalSubmission && !hasPausedApprovalToolCall) {
			const approvalToolCallIdForContext =
				getNonEmptyString(rawApproval?.toolCallId) ||
				getNonEmptyString(rawApproval?.deferredToolCallId) ||
				approvalSubmission.toolCallId ||
				approvalSubmission.deferredToolCallId ||
				null;
			const approvalContext = {
				decision: approvalSubmission.decision,
				customInstruction: approvalSubmission.customInstruction,
				toolCallId: approvalToolCallIdForContext || undefined,
			};
			const serialized = JSON.stringify(approvalContext);
			const approvalBlock =
				approvalToolCallIdForContext &&
				isAIGatewayDeferredToolCallId(approvalToolCallIdForContext)
					? buildAIGatewayDeferredToolResultBlock({
						toolName: "exit_plan_mode",
						toolCallId: approvalToolCallIdForContext,
						result: buildAIGatewayPlanApprovalResult(
							approvalSubmission,
							rawApproval,
						),
					})
					: `Plan approval: ${serialized}`;
			enrichedContextDescription = enrichedContextDescription
				? `${enrichedContextDescription}\n\n${approvalBlock}`
				: approvalBlock;
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

				const compressedPromptHistory = compressUiConversationHistory(conversationHistory, {
					thresholdChars: 80_000,
					tailCount: 8,
				});
				if (compressedPromptHistory.compressed) {
					console.info(
						`[HERMES] Compressed prompt conversation history: ${compressedPromptHistory.originalLength} → ${compressedPromptHistory.length} messages`,
					);
				}

				const promptBuildStartedAtMs = Date.now();
				const userMessageText = buildUserMessage(
					latestUserMessage,
					compressedPromptHistory.conversationHistory,
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
					conversationHistoryCount: compressedPromptHistory.conversationHistory.length,
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
					// Image/audio detection is handled by Rovo via genui-media skill
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
								data: {
									type,
									payload: withCanonicalPreviewBody(type, payload),
								},
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
							const shouldGenerateExcalidrawDiagram = isExcalidrawDiagramRequest(latestUserMessage);
							emitThinkingStatus(
								shouldGenerateExcalidrawDiagram ? "Generating diagram" : "Generating results",
							);
							emitWidgetLoading(genuiWidgetId, SMART_WIDGET_TYPE_GENUI, true);
							try {
								throwIfSmartRouteAborted();
								if (shouldGenerateExcalidrawDiagram) {
									const excalidrawTitle = deriveExcalidrawTitle(latestUserMessage);
									const rawSceneText = await generateTextViaGateway({
										system: buildExcalidrawWidgetSystemPrompt({ title: excalidrawTitle }),
										prompt: [
											"User request:",
											latestUserMessage,
											conversationHistory.length > 0
												? `\nConversation context:\n${conversationHistory
													.map((message) => `${message.type === "assistant" ? "Assistant" : "User"}: ${message.content}`)
													.join("\n")}`
												: null,
										].filter(Boolean).join("\n"),
										maxOutputTokens: 3200,
										temperature: 0.2,
										provider: resolvedProvider,
										signal: smartRouteAbortController.signal,
										});
									throwIfSmartRouteAborted();
									const normalizedScene = normalizeExcalidrawArtifactOutput(rawSceneText);
									if (!normalizedScene) {
										emitTextDelta(GENUI_FALLBACK_ERROR_TEXT);
									} else {
										emitWidgetData(
											genuiWidgetId,
											SMART_WIDGET_TYPE_GENUI,
											buildExcalidrawWidgetPayload({
												prompt: latestUserMessage,
												normalizedSceneJson: normalizedScene,
											}),
										);
										generatedNarrative = latestUserMessage;
									}
								} else {
										const genuiResult = await generateSmartGenuiResult({
											roleMessages,
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
		// generation intents BEFORE sending to Rovo. This avoids the
		// Rovo round-trip for clear-cut image/audio requests.
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
				// BE-002: Route image queries to AI Gateway (bypass Rovo)
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
												payload: withCanonicalPreviewBody(SMART_WIDGET_TYPE_IMAGE, {
													images: [...generatedImages],
													prompt: latestUserMessage,
													source: "media-bypass-image",
													inputSource: mediaBypassImageSource || undefined,
												}),
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

				// BE-003: Route audio queries to AI Gateway (bypass Rovo)
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
									payload: withCanonicalPreviewBody(SMART_WIDGET_TYPE_AUDIO, {
										audioUrl: buildAudioDataUrl(
											synthesisResult.audioBytes,
											synthesisResult.contentType
										),
										mimeType: synthesisResult.contentType,
										transcript: stripConversationalFiller(mediaBypassVoiceInput),
										source: "media-bypass-audio",
										inputSource: mediaBypassVoiceInputSource || undefined,
									}),
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

		if (backendPreference === "ai-gateway") {
			const { abortController, cleanup } = createAbortControllerFromRequest(req, res, {
				onAbort: () => {
					console.log("[CHAT-SDK] Client disconnected, aborting AI Gateway stream");
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
			const gatewayMessages = compressedPromptHistory.conversationHistory.map(
				(message) => ({
					role: message.type === "assistant" ? "assistant" : "user",
					content: message.content,
				}),
			);
			const gatewaySystem = buildAIGatewaySystemPrompt({
				runtimeContext: getNonEmptyString(effectiveContextWithPortBinding),
				userName: getNonEmptyString(rawUserName),
				clientTimeZone,
			});

			stageTrace.mark("preprocessing_complete", {
				stageMs: Date.now() - chatSdkEntryStartedAtMs,
				backend: "ai-gateway",
				promptProfile,
				smartGenerationActive,
				isStrictToolFirstTurn,
			});

			const stream = createUIMessageStream({
				execute: async ({ writer }) => {
					const textId = `ai-gateway-text-${Date.now()}`;
					let bufferedText = "";

					// Show the thinking trace immediately so the user gets
					// feedback during the buffering window (the entire gateway
					// streaming duration — no token-by-token UX on this path).
					// Uses the same data-thinking-status protocol the Rovo
					// branch uses, so the existing thinking-trace renderer
					// picks it up unchanged.
					writer.write({
						type: "data-thinking-status",
						data: {
							label: "Working",
							activity: "data",
							source: "backend",
						},
					});

					// Buffer all deltas server-side instead of streaming them.
					// `context-rovo-chat.tsx` (used by /agents' sidebar-chat) does
					// not honor `data-clear` for assistant text, so we can't
					// stream the raw JSON fence and then wipe it. Buffering lets
					// us inspect the full response, strip the fence, and emit
					// only the cleaned prose. Trade-off: no streaming UX during
					// an AI Gateway turn; acceptable for the typical short
					// clarification response. If/when context-rovo-chat learns
					// to honor data-clear, we can revert to streamed deltas.
					await streamTextViaGateway({
						system: gatewaySystem || undefined,
						prompt: latestUserMessage,
						messages: gatewayMessages,
						maxOutputTokens: 2000,
						temperature: 0.4,
						provider,
						signal: abortController.signal,
						backendPreference: "ai-gateway",
						onTextDelta: (delta) => {
							if (typeof delta === "string" && delta.length > 0) {
								bufferedText += delta;
							}
						},
					});

					// Post-process: prefer the model-agnostic deferred-tool
					// envelope, then keep the legacy question-card/prose
					// extractors as a compatibility fallback.
					let questionCardPayload = null;
					let planWidgetPayload = null;
					let deferredToolCallId = null;
					let visibleText = bufferedText;
					const deferredToolResult =
						extractAIGatewayDeferredToolFromAssistantText(bufferedText);
					if (deferredToolResult) {
						const toolCall = deferredToolResult.toolCall;
						deferredToolCallId = createAIGatewayDeferredToolCallId(
							toolCall.toolName,
						);
						visibleText = deferredToolResult.cleanedText;

						if (toolCall.toolName === "ask_user_questions") {
							questionCardPayload =
								buildQuestionCardPayloadFromAIGatewayDeferredTool(
									toolCall.input,
									{
										sessionId: `request-user-input-${deferredToolCallId}`,
										round: 1,
										maxRounds: 1,
										title: "Answer these questions to continue",
										description:
											"Pick the options that best match what you want.",
										widgetType: CLARIFICATION_WIDGET_TYPE,
										maxPresetOptions: CLARIFICATION_MAX_PRESET_OPTIONS,
										customOptionPlaceholder:
											CLARIFICATION_CUSTOM_OPTION_PLACEHOLDER,
										maxLabelLength: CLARIFICATION_MAX_LABEL_LENGTH,
										createSessionId: createClarificationSessionId,
									},
								);
							if (questionCardPayload?.sessionId) {
								_requestUserInputQuestionMetaStore.set(
									questionCardPayload.sessionId,
									buildQuestionMetaFromQuestionCardPayload(
										questionCardPayload,
									),
								);
							}
						} else if (toolCall.toolName === "exit_plan_mode") {
							planWidgetPayload =
								buildPlanWidgetPayloadFromAIGatewayDeferredTool(
									toolCall.input,
									{ toolCallId: deferredToolCallId },
								);
							if (planWidgetPayload && threadId) {
								recordPlanWidgetEmission(threadId, {
									deferredToolCallId,
									planCardId: deferredToolCallId,
								});
							}
						}

						if (!questionCardPayload && !planWidgetPayload) {
							console.warn("[AI-GATEWAY-DEFERRED] Ignored invalid deferred tool envelope", {
								toolName: toolCall.toolName,
							});
							visibleText =
								visibleText ||
								"I couldn't render the requested interaction. Please try again.";
						}
					}

					if (!deferredToolResult) {
						const jsonResult =
							extractQuestionCardJsonFromAssistantText(bufferedText);
						if (jsonResult) {
							questionCardPayload = jsonResult.payload;
							visibleText = jsonResult.cleanedText;
						} else {
							const cardDefinition =
								extractQuestionCardDefinitionFromAssistantText(bufferedText);
							if (
								cardDefinition &&
								Array.isArray(cardDefinition.questions) &&
								cardDefinition.questions.length > 0
							) {
								questionCardPayload = cardDefinition;
							}
						}
					}

					const agentResultExtraction =
						creationMode === "agent" && !questionCardPayload && !planWidgetPayload
							? extractStudioAgentResultFromText(bufferedText)
							: null;
					if (agentResultExtraction) {
						visibleText = agentResultExtraction.cleanedText;
					}

					if (visibleText && visibleText.length > 0) {
						writer.write({ type: "text-start", id: textId });
						writer.write({
							type: "text-delta",
							id: textId,
							delta: visibleText,
						});
						writer.write({ type: "text-end", id: textId });
					}

					if (questionCardPayload) {
						const toolCallId =
							deferredToolCallId ||
							createAIGatewayDeferredToolCallId("ask_user_questions");
						const sessionId =
							questionCardPayload.sessionId ||
							`request-user-input-${toolCallId}`;
						_requestUserInputQuestionMetaStore.set(
							sessionId,
							buildQuestionMetaFromQuestionCardPayload(
								questionCardPayload,
							),
						);
						writer.write({
							type: "data-widget-data",
							id: toolCallId,
							data: {
								type: "question-card",
								payload: {
									...questionCardPayload,
									sessionId,
									round: 1,
									toolCallId,
									deferredToolCallId: toolCallId,
									tool_call_id: toolCallId,
								},
							},
						});
						writer.write(createRouteDecisionPart({
							intent: "chat",
							origin: requestOrigin,
							reason: "intent_clarification",
						}));
					}

					if (agentResultExtraction?.payload) {
						writer.write({
							type: "data-agent-result",
							id: `studio-agent-result-${Date.now()}`,
							data: agentResultExtraction.payload,
						});
					} else if (
						shouldSurfaceMissingStudioAgentResultFailure({
							creationMode,
							hasAgentResult: false,
							hasDeferredToolRequest: Boolean(questionCardPayload),
							hasPlanWidget: Boolean(planWidgetPayload),
							hasQuestionCard: Boolean(questionCardPayload),
						})
					) {
						for (const part of buildMissingStudioAgentResultFailureParts()) {
							writer.write(part);
						}
					}

					if (planWidgetPayload) {
						const widgetId =
							deferredToolCallId ||
							createAIGatewayDeferredToolCallId("exit_plan_mode");
						writer.write({
							type: "data-widget-data",
							id: widgetId,
							data: {
								type: "plan",
								payload: planWidgetPayload,
							},
						});
					}

					writer.write({
						type: "data-turn-complete",
						data: { timestamp: new Date().toISOString() },
					});
				},
				onError: (error) => {
					if (error instanceof Error) {
						return error.message;
					}
					return "Failed to stream AI Gateway response";
				},
			});

			pipeUIMessageStreamToResponse({
				response: res,
				stream,
			});
			return;
		}

		const backendSelection = await resolvePreferredBackend();

		if (backendSelection.backend !== "rovo") {
			return sendGatewayErrorResponse(
				res,
				createRovoUnavailableError(),
				"Failed to stream chat response"
			);
		}

		const { abortController, cleanup } = createAbortControllerFromRequest(req, res, {
			onAbort: () => {
				console.log("[CHAT-SDK] Client disconnected, aborting Rovo stream");
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
				const agentResultPrefix = AGENT_RESULT_STREAM_PREFIX;
				const partialMarkerBufferLength =
						Math.max(
							widgetLoadingPrefix.length,
							widgetDataPrefix.length,
							thinkingStatusPrefix.length,
							agentExecutionPrefix.length,
							creationMode === "agent" ? agentResultPrefix.length : 0
						) - 1;
					let hasMarkedFirstUiEvent = false;
					let hasMarkedFirstWrittenTextDelta = false;
					let hasMarkedTurnComplete = false;
					let hasEmittedAgentResult = false;
					let hasMarkedFirstRovoTextDelta = false;
					const writeStreamPart = writer.write.bind(writer);
					writer.write = (part) => {
						const eventType = getNonEmptyString(part?.type) || "unknown";
						if (eventType === "data-agent-result") {
							hasEmittedAgentResult = true;
						}
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
				let rawAgentCreationAssistantText = "";
				let shouldEmitMissingStudioAgentResultFailure = false;
				let widgetType = null;
				let resolvedRovoPort = null;
				let hasEmittedQuestionCard = false;
				let hasEmittedPlanWidget = false;
				let hasEmittedGenuiWidget = false;
					let hasSeenPlanWidgetSignal = false;
					let hasEmittedPlanLoadingState = false;
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
					// ── Output Routing: Two-step GenUI state ──
					// Track whether non-question-card tool calls were observed during
					// the Rovo stream. When true, post-stream processing triggers
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

					const rawOutputCandidate = value.output;
					const outputPreviewCandidate =
						value.outputPreview !== undefined ? value.outputPreview : rawOutputCandidate;
					const outputPreview =
						outputPreviewCandidate !== undefined
							? toPreview(outputPreviewCandidate)
							: null;
					const outputBytes =
						typeof value.outputBytes === "number" && Number.isFinite(value.outputBytes)
							? value.outputBytes
							: outputPreview?.bytes;
					const outputTruncated = Boolean(value.outputTruncated);

					if (phase === "result" && rawOutputCandidate !== undefined) {
						payload.output = rawOutputCandidate;
					}
					if (phase === "result" && outputPreview?.text) {
						payload.outputPreview = outputPreview.text;
						if (outputTruncated) {
							payload.outputTruncated = true;
						}
						if (typeof outputBytes === "number" && Number.isFinite(outputBytes)) {
							payload.outputBytes = outputBytes;
						}
						if (Boolean(value.suppressedRawOutput)) {
							payload.suppressedRawOutput = true;
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

						if (rawOutputCandidate !== undefined) {
							payload.output = rawOutputCandidate;
						}
						if (outputPreview?.text) {
							payload.outputPreview = outputPreview.text;
						}
						if (outputTruncated) {
							payload.outputTruncated = true;
						}
						if (Boolean(value.suppressedRawOutput)) {
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
										payload: withCanonicalPreviewBody(
											SMART_WIDGET_TYPE_GENUI,
											withRouteWidgetContentType({
												spec: directGenuiResult.spec,
												summary: summaryText
													? summaryText.length > 280
													? `${summaryText.slice(0, 279)}...`
													: summaryText
													: "Generated interactive view",
												source,
											}),
										),
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
							const normalizedToolInput =
								typeof toolInput === "string"
									? parseMaybeJson(toolInput) ?? toolInput
									: toolInput;
							const planMarkdown =
								normalizedToolInput && typeof normalizedToolInput === "object"
									? getNonEmptyString(normalizedToolInput.plan)
									: getNonEmptyString(normalizedToolInput);
							if (!planMarkdown) {
								console.warn("[EXIT-PLAN-MODE] Plan markdown missing from tool input", {
									toolCallId,
									source,
									toolInputPreview:
										typeof toolInput === "string"
											? toolInput.slice(0, 200)
											: JSON.stringify(toolInput).slice(0, 200),
								});
								return false;
							}

							const planPayload = {
								title:
									normalizedToolInput &&
									typeof normalizedToolInput === "object"
										? getNonEmptyString(normalizedToolInput.title) ||
											getNonEmptyString(normalizedToolInput.name) ||
											getNonEmptyString(normalizedToolInput.planTitle) ||
											"Plan"
										: "Plan",
								description:
									normalizedToolInput &&
									typeof normalizedToolInput === "object"
										? getNonEmptyString(normalizedToolInput.description) ||
											getNonEmptyString(normalizedToolInput.summary) ||
											getNonEmptyString(normalizedToolInput.subtitle) ||
											undefined
										: undefined,
								shortDescription:
									normalizedToolInput &&
									typeof normalizedToolInput === "object"
										? getNonEmptyString(normalizedToolInput.shortDescription) ||
											getNonEmptyString(normalizedToolInput.short_description) ||
											undefined
										: undefined,
								markdown: planMarkdown,
								tasks:
									normalizedToolInput &&
									typeof normalizedToolInput === "object" &&
									Array.isArray(normalizedToolInput.tasks)
										? normalizedToolInput.tasks
										: normalizedToolInput &&
											typeof normalizedToolInput === "object" &&
											Array.isArray(normalizedToolInput.steps)
												? normalizedToolInput.steps
												: [],
								agents:
									normalizedToolInput &&
									typeof normalizedToolInput === "object" &&
									Array.isArray(normalizedToolInput.agents)
										? normalizedToolInput.agents
										: [],
								deferredToolCallId: toolCallId,
							};

							planPayload.deferredToolCallId = toolCallId;
							hasExplicitPlanPayload = true;
							if (threadId) {
								recordPlanWidgetEmission(threadId, {
									deferredToolCallId: toolCallId,
									planCardId: widgetId,
								});
							}
							emitPlanWidgetData(planPayload);
							if (hasEmittedPlanLoadingState) {
								emitPlanWidgetLoading(false);
							}
							console.info("[EXIT-PLAN-MODE] Plan widget emitted from tool input", {
								toolCallId,
								source,
								taskCount: Array.isArray(planPayload.tasks) ? planPayload.tasks.length : 0,
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
						const meta = buildQuestionMetaFromQuestionCardPayload(payload);
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
					const agentResultIndex =
						creationMode === "agent" ? value.indexOf(agentResultPrefix) : -1;
					let minIndex = -1;
					for (const idx of [loadingIndex, dataIndex, thinkingIndex, agentExecIndex, agentResultIndex]) {
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
									hasEmittedPlanWidget = true;
									hasSeenPlanWidgetSignal = true;
									hasExplicitPlanPayload = true;
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
										payload: withCanonicalPreviewBody(
											resolvedWidgetType,
											parsedWidget,
										),
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

						if (creationMode === "agent" && textBuffer.startsWith(agentResultPrefix)) {
							let jsonStartIndex = agentResultPrefix.length;
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

							const jsonEndIndex = findStudioAgentJsonObjectEndIndex(
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
								const normalizedAgentResult = normalizeStudioAgentResult(
									JSON.parse(jsonPayload)
								);
								if (normalizedAgentResult) {
									writer.write({
										type: "data-agent-result",
										id: `studio-agent-result-${Date.now()}`,
										data: normalizedAgentResult,
									});
								}
							} catch (error) {
								console.error("Failed to parse agent-result payload:", error);
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
										label: label || "Working",
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
							stageTrace.mark("first_rovo_text_delta", {
								chars: delta.length,
							});
						}

						emitLazyThinkingStatus();
						if (creationMode === "agent") {
							rawAgentCreationAssistantText += delta;
						}
						textBuffer += delta;
						processTextBuffer(false);
					};

					// Rovo Serve: route through the local agent loop
					console.log("[CHAT-SDK] Routing through Rovo Serve");
					stageTrace.mark("rovo_stream_start", {
						conflictPolicy: "wait-for-turn",
					});
					// Emit data-thinking-status lazily — only when the LLM
					// actually starts producing output (text or tool events).
					// Until then the frontend shows the preload indicator to
					// distinguish "waiting for LLM" from "LLM is actively working."
					let hasEmittedThinkingStatus = false;
					const emitLazyThinkingStatus = () => {
						if (hasEmittedThinkingStatus) return;
						hasEmittedThinkingStatus = true;
						const isAgentCreationTurn = creationMode === "agent";
						writer.write({
							type: "data-thinking-status",
							data: {
								label: isAgentCreationTurn ? "Designing agent" : "Working",
								content: isAgentCreationTurn
									? "Reviewing the brief, checking missing profile details, and shaping the Studio agent."
									: undefined,
								activity: isAgentCreationTurn ? "data" : "results",
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
					let hasBlockedPlanFeedbackExecutionTool = false;

					const browserBridge = createThreadBrowserBridge({
						screenshotStore: {
							async persistScreenshot({
								buffer,
								contentType,
								threadId: screenshotThreadId,
							}) {
								return persistRovoAppBrowserScreenshotBuffer({
									buffer,
									contentType,
									threadId: screenshotThreadId,
								});
							},
						},
						writer,
						threadId,
					});
					// Track toolCallIds for MCP-wrapped browser tools
					// (detected in onToolCallInputResolved, consumed in onToolCallResult)
					const mcpBrowserToolCallIds = new Map();

					while (shouldContinueToolFirstRetry) {
						recordToolFirstAttempt(toolFirstExecutionState, {
							isRetry: currentToolFirstAttempt > 1,
						});

						const pausedToolCallRecord =
							pausedContinuationToolCallId && currentToolFirstAttempt === 1
								? takePausedRovoToolCall(pausedContinuationToolCallId)
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
						let streamTimedOut = false;
						try {
							const maybeGuardPlanFeedbackTool = ({
								toolCallId,
								toolName,
							}) => {
								const toolGuard = getPlanFeedbackToolGuard({
									isPlanFeedbackDeferredResumeTurn,
									isExitPlanModeTool,
									isRequestUserInputTool,
									resumedToolCallId: deferredToolResponseToolCallId,
									toolCallId,
									toolName,
								});
								if (toolGuard.ignore) {
									return { ignore: true, block: false };
								}

								if (toolGuard.block && !hasBlockedPlanFeedbackExecutionTool) {
									hasBlockedPlanFeedbackExecutionTool = true;
									console.warn("[PLAN-FEEDBACK] Blocking non-interactive tool during plan feedback turn", {
										threadId,
										toolCallId,
										toolName,
									});
									if (
										typeof resolvedRovoPort === "number" &&
										resolvedRovoPort > 0
									) {
										void rovoCancelChat(resolvedRovoPort, {
											timeoutMs: 3_000,
										}).catch(() => {});
									}
									if (!abortController.signal.aborted) {
										abortController.abort();
									}
								}

								return toolGuard;
							};

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

									// Browser tool calls are handled by the browser bridge
									if (isBrowserToolCall(toolCall.toolName)) {
										void browserBridge.handleToolCallStart(toolCall);
										return;
									}

									if (
										toolCall.toolName === "mcp_invoke_tool" &&
										toolCall.toolInput?.tool_name &&
										isBrowserToolCall(toolCall.toolInput.tool_name)
									) {
										const realToolName = toolCall.toolInput.tool_name;
										mcpBrowserToolCallIds.set(toolCall.toolCallId, realToolName);
										void browserBridge.handleToolCallStart({
											toolName: realToolName,
											toolCallId: toolCall.toolCallId,
											toolInput: toolCall.toolInput.tool_input || null,
										});
										return;
									}

									const toolGuard = maybeGuardPlanFeedbackTool({
										toolCallId: toolCall.toolCallId,
										toolName: toolCall.toolName,
									});
									if (toolGuard.ignore || toolGuard.block) {
										return;
									}

									// Handle deferred tool requests (e.g., ask_user_questions from Rovo)
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
									// ── Safety: flag dangerous commands ──
									if (toolCall?.toolInput) {
										const cmd = extractCommandFromArgs(toolCall.toolInput);
										if (cmd) {
											const classification = classifyCommand(cmd);
											if (classification) {
												console.warn(
													`[SAFETY] Dangerous command detected in ${toolCall.toolName}: ${classification.label} (${classification.match})`,
												);
											}
										}
									}

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

									// Detect MCP-wrapped browser tools (mcp_invoke_tool with tool_name: "browser_*")
									if (
										toolCall?.toolName === "mcp_invoke_tool" &&
										toolCall?.toolInput?.tool_name &&
										isBrowserToolCall(toolCall.toolInput.tool_name)
									) {
										const realToolName = toolCall.toolInput.tool_name;
										if (mcpBrowserToolCallIds.get(toolCall.toolCallId) === realToolName) {
											return;
										}
										mcpBrowserToolCallIds.set(toolCall.toolCallId, realToolName);
										void browserBridge.handleToolCallStart({
											toolName: realToolName,
											toolCallId: toolCall.toolCallId,
											toolInput: toolCall.toolInput.tool_input || null,
										});
									}
								},
									onToolCallResult: (toolCallResult) => {
										// Browser tool results — check both direct and MCP-wrapped
										if (isBrowserToolCall(toolCallResult?.toolName)) {
											void browserBridge.handleToolCallResult(toolCallResult);
											return;
										}
										// MCP-wrapped browser tools: toolName is "mcp_invoke_tool"
										// but we tracked the real tool name in onToolCallInputResolved
										const mcpRealToolName = mcpBrowserToolCallIds.get(toolCallResult?.toolCallId);
										if (mcpRealToolName) {
											mcpBrowserToolCallIds.delete(toolCallResult.toolCallId);
											void browserBridge.handleToolCallResult({
												...toolCallResult,
												toolName: mcpRealToolName,
											});
											return;
										}

										// ── Safety: redact secrets from tool output ──
										if (toolCallResult?.toolOutputRaw) {
											const detected = detectSecrets(toolCallResult.toolOutputRaw);
											if (detected.length > 0) {
												toolCallResult.toolOutputRaw = redactSecrets(toolCallResult.toolOutputRaw);
												if (toolCallResult.toolOutputPreview) {
													toolCallResult.toolOutputPreview = redactSecrets(toolCallResult.toolOutputPreview);
												}
												console.info(
													`[SAFETY] Redacted ${detected.length} secret(s) in ${toolCallResult.toolName} output: ${detected.map((d) => d.label).join(", ")}`,
												);
											}
										}

										const toolGuard = maybeGuardPlanFeedbackTool({
											toolCallId: toolCallResult?.toolCallId,
											toolName: toolCallResult?.toolName,
										});
										if (toolGuard.ignore || toolGuard.block) {
											return;
										}

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
										typeof resolvedRovoPort === "number" &&
										resolvedRovoPort > 0
									) {
										registerActiveDeferredToolCall({
											toolCallId: toolCall.toolCallId,
											port: resolvedRovoPort,
											threadId,
											kind: isExitPlanModeTool(toolCall.toolName)
												? "plan-approval"
												: "clarification",
										});
									}
									if (threadId && typeof resolvedRovoPort === "number" && resolvedRovoPort > 0) {
										try {
											await syncRovoAppThreadSessionFromCurrentPort(
												threadId,
												resolvedRovoPort,
												{ sessionMode },
											);
										} catch (error) {
											console.warn("[FUTURE-CHAT] Failed to sync thread session on deferred tool request:", {
												threadId,
												port: resolvedRovoPort,
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
										return autoResumePausedParts(pausedParts, control);
									}

									const replayDeferredToolResult =
										await handleReplayDeferredToolRequest({
											rawEvent,
											control,
											threadId,
											sessionId: rovoSessionId,
											sessionMode,
											isRequestUserInputTool,
											isExitPlanModeTool,
											syncThreadSessionFromPort:
												syncRovoAppThreadSessionFromCurrentPort,
											emitRequestUserInputQuestionCard,
											emitExitPlanWidget: maybeEmitExitPlanWidget,
											registerPausedToolCall: registerPausedRovoToolCall,
										});
									if (replayDeferredToolResult.handled) {
										if (replayDeferredToolResult.hasObservedDeferredToolRequest) {
											hasObservedDeferredToolRequest = true;
										}
										if (replayDeferredToolResult.pausedToolCallHandled) {
											pausedToolCallHandled = true;
										}
										return {
											disconnect: replayDeferredToolResult.disconnect === true,
										};
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
								enableDeferredTools: true,
								idleTimeoutMs: WAIT_FOR_TURN_TIMEOUT_MS,
								includeSubagentEvents: true,
								pauseOnCallToolsStart: true,
								signal: abortController.signal,
								conflictPolicy: "wait-for-turn",
								onPortAcquired: (acquiredPort) => {
									if (typeof acquiredPort === "number" && acquiredPort > 0) {
										resolvedRovoPort = acquiredPort;
										if (threadId) {
											activeRequests.set(threadId, { port: acquiredPort, abortController });
											void syncRovoAppThreadSessionFromCurrentPort(
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

							if (pausedToolCallRecord) {
								const resumeDecisions =
									hasPausedClarificationToolCall && clarificationSubmission
										? [
											buildClarificationResumeDecision({
												clarificationSubmission,
												clarificationToolCallId: pausedToolCallRecord.toolCallId,
												setChatAccepted: false,
												buildDenyMessageFn: (submission) =>
													buildClarificationResumeDenyMessage(
														submission,
														adaptClarificationAnswersForToolContract,
													),
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
									await rovoResumeToolCalls(pausedToolCallRecord.port, {
										decisions: resumeDecisions,
									});
									console.info("[DEBUG-PLAN-APPROVAL] Resume tool calls sent successfully", {
										port: pausedToolCallRecord.port,
										toolCallId: pausedToolCallRecord.toolCallId,
										kind: pausedToolCallRecord.kind,
										resumeDecisionCount: resumeDecisions.length,
									});

									await Promise.race([
										replayViaRovo({
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
													return autoResumePausedParts(pausedParts, control);
												}

												const replayDeferredToolResult =
													await handleReplayDeferredToolRequest({
														rawEvent,
														control,
														threadId,
														sessionId: rovoSessionId,
														sessionMode,
														isRequestUserInputTool,
														isExitPlanModeTool,
														syncThreadSessionFromPort:
															syncRovoAppThreadSessionFromCurrentPort,
														emitRequestUserInputQuestionCard,
														emitExitPlanWidget: maybeEmitExitPlanWidget,
														registerPausedToolCall: registerPausedRovoToolCall,
													});
												if (replayDeferredToolResult.handled) {
													if (
														replayDeferredToolResult.hasObservedDeferredToolRequest
													) {
														hasObservedDeferredToolRequest = true;
													}
													if (replayDeferredToolResult.pausedToolCallHandled) {
														pausedToolCallHandled = true;
													}
													return {
														disconnect:
															replayDeferredToolResult.disconnect === true,
													};
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
											await rovoCancelChat(pausedToolCallRecord.port, {
												timeoutMs: 3_000,
											}).catch(() => {});
										}
										pausedToolCallRecord.handle?.release?.();
									}
								}
							} else {
								await streamViaRovo({
									message: activeAttemptMessage,
									sessionId: rovoSessionId || undefined,
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
												await rovoResumeToolCalls(port, {
													decisions: [{
														tool_call_id: approvalToolCallId,
														deny_message: "Plan approval superseded — starting fresh build turn.",
													}],
												});
											} catch {
												// Resume may fail if the tool call ID doesn't match — that's OK
											}
											await rovoCancelChat(port, { timeoutMs: 5_000 });
										},
									} : {}),
								});
							}
						} catch (rovoStreamError) {
							if (rovoStreamError?.code === "ROVO_PORT_STUCK") {
								// Port is stuck — try a single in-place restart and rerun
								// the exact request once before surfacing a user-facing
								// failure. This keeps rapid retry/new-thread flows from
								// dying before ask_user_questions can run.
								const recoveryPort =
									rovoStreamError.port ||
									resolvedRovoPort;
								let recoveryResult = null;

								if (typeof recoveryPort === "number" && recoveryPort > 0) {
									try {
										recoveryResult = await restartRovoPort({
											port: recoveryPort,
											cancelChat: rovoCancelChat,
											healthCheck: rovoHealthCheck,
											getListeningPidsForPort,
											refreshAvailability: refreshRovoAvailability,
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
											content: `Rovo port ${recoveryPort} restarted successfully.`,
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
							} else if (rovoStreamError?.code === "ROVO_CHAT_IN_PROGRESS_TIMEOUT") {
								streamTimedOut = true;
								const resolvedRecoveryPort =
									typeof resolvedRovoPort === "number" && resolvedRovoPort > 0
										? resolvedRovoPort
										: null;
								const canForceRecoverPort =
									typeof resolvedRecoveryPort === "number" &&
									forcePortRecoveryAttemptCount <
										INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS;

								if (canForceRecoverPort) {
									forcePortRecoveryAttemptCount += 1;

									const recoveryResult = await restartRovoPort({
										port: resolvedRecoveryPort,
										cancelChat: rovoCancelChat,
										healthCheck: rovoHealthCheck,
										getListeningPidsForPort,
										refreshAvailability: refreshRovoAvailability,
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
												content: `Rovo port ${resolvedRecoveryPort} restarted successfully.`,
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
													: `Failed to recover Rovo port ${resolvedRecoveryPort}.`,
											activity: "results",
											source: "backend",
										},
									});
								}

								writer.write({
									type: "data-thinking-status",
									data: {
										label: "Rovo turn wait timed out",
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
									rovoStreamError instanceof Error
										? rovoStreamError.message
										: String(rovoStreamError ?? "");
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

								throw rovoStreamError;
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

				if (
					shouldSurfaceMissingStudioAgentResultFailure({
						creationMode,
						hasAgentResult: hasEmittedAgentResult,
						hasDeferredToolRequest: hasObservedDeferredToolRequest,
						hasPlanWidget: hasEmittedPlanWidget,
						hasQuestionCard: hasEmittedQuestionCard,
					})
				) {
					const agentResultExtraction = extractStudioAgentResultFromText(
						rawAgentCreationAssistantText ||
							unsuppressedAssistantText ||
							assistantText
					);
					if (agentResultExtraction?.payload) {
						writer.write({
							type: "data-agent-result",
							id: `studio-agent-result-${Date.now()}`,
							data: agentResultExtraction.payload,
						});
					} else {
						shouldEmitMissingStudioAgentResultFailure = true;
					}
				}

				// ── Phase 2: Direct Rovo spec detection ──
				// When enabled, check if Rovo already emitted a valid
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
					const rawDirectSpecText =
						hasSuppressedLargeAssistantJson ? unsuppressedAssistantText : assistantText;
					const directSpecResult = extractDirectSpec(
						rawDirectSpecText
					);
					if (directSpecResult?.spec) {
						const shouldSuppressHermesKnowledgeCard =
							shouldSuppressHermesKnowledgeDirectSpecCard({
								assistantText: rawDirectSpecText,
								genuiHint,
								latestUserMessage,
								narrative: directSpecResult.narrative,
							});

						if (shouldSuppressHermesKnowledgeCard) {
							console.info(
								"[DIRECT-SPEC] Suppressed GenUI widget promotion for Hermes knowledge recall",
								{
									elementCount: Object.keys(directSpecResult.spec.elements || {}).length,
									narrativeLength: (directSpecResult.narrative || "").length,
								}
							);
						} else {
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
							console.info("[DIRECT-SPEC] Emitted GenUI widget from Rovo spec fence", {
								elementCount: Object.keys(directSpecResult.spec.elements || {}).length,
								narrativeLength: (directSpecResult.narrative || "").length,
							});
						}
					}

					// ── Phase 3: Direct Rovo media fence detection ──
					// When enabled, check if Rovo emitted ```image or
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
													payload: withCanonicalPreviewBody(SMART_WIDGET_TYPE_IMAGE, {
														images: [...generatedImages],
														prompt: imagePayload.prompt || latestUserMessage,
														source: "direct-rovo-image",
													}),
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
							console.info("[DIRECT-IMAGE] Processed image fence from Rovo", {
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
										payload: withCanonicalPreviewBody(SMART_WIDGET_TYPE_AUDIO, {
											audioUrl: buildAudioDataUrl(
												synthesisResult.audioBytes,
												synthesisResult.contentType
											),
											mimeType: synthesisResult.contentType,
											transcript: audioPayload.text,
											source: "direct-rovo-audio",
										}),
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
							console.info("[DIRECT-AUDIO] Processed audio fence from Rovo", {
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
										payload: withCanonicalPreviewBody(
											SMART_WIDGET_TYPE_GENUI,
											withRouteWidgetContentType({
												spec: bespokeResult.spec,
												summary: bespokeResult.summary,
												source: bespokeResult.source,
											}),
										),
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
											payload: withCanonicalPreviewBody(
												SMART_WIDGET_TYPE_GENUI,
												withRouteWidgetContentType({
												spec: outcome.spec,
												summary: outcome.summary,
												source: outcome.source,
											}),
											),
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
					const planExecutionActive = isPlanExecutionPhase(threadId);
					if (!isStrictToolFirstTurn) {
						const hasAuthoritativeBrowserOutput =
							typeof browserBridge.hasAuthoritativeOutput === "function" &&
							browserBridge.hasAuthoritativeOutput();
						const hasToolObservationData =
							hasToolObservationEntries() && !hasAuthoritativeBrowserOutput;
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
					const shouldAttemptGenui = shouldAttemptPostToolGenui({
						assistantText: trimmedAssistantText,
						hasAuthoritativeBrowserOutput,
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
						shouldAttemptGenui
					) {
						// Single-pass GenUI: Rovo emits ```spec blocks directly.
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

						console.info("[OUTPUT-ROUTING] Single-pass GenUI: no spec fence from Rovo, trying generic GenUI", {
							hasActionableTools: hasObservedActionableToolCall,
							taskLikeRequest: isTaskLikeRequest,
							rovoTextLength: trimmedAssistantText.length,
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
											payload: withCanonicalPreviewBody(
												SMART_WIDGET_TYPE_GENUI,
												withRouteWidgetContentType({
												spec: bespokeResult.spec,
												summary: bespokeResult.summary,
												source: bespokeResult.source,
											}),
											),
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
												payload: withCanonicalPreviewBody(
													SMART_WIDGET_TYPE_GENUI,
													withRouteWidgetContentType({
													spec: outcome.spec,
													summary: renderedSummary,
													source: outcome.source,
												}),
												),
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
													payload: withCanonicalPreviewBody(
														SMART_WIDGET_TYPE_GENUI,
														withRouteWidgetContentType({
														spec: recoverySpec,
														summary: recoverySpec.title,
														source: "work-summary-zero-tool-recovery",
													}),
													),
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
											rovoFallback: false,
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
									resolvedPort: typeof resolvedRovoPort === "number"
										? resolvedRovoPort
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

					if (shouldEmitMissingStudioAgentResultFailure) {
						for (const part of buildMissingStudioAgentResultFailureParts()) {
							writer.write(part);
						}
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

				let syncedThread = null;
				if (threadId && typeof resolvedRovoPort === "number" && resolvedRovoPort > 0) {
					try {
						syncedThread = await syncRovoAppThreadSessionFromCurrentPort(
							threadId,
							resolvedRovoPort,
							{ sessionMode },
						);
					} catch (error) {
						console.warn("[FUTURE-CHAT] Failed to sync thread session at turn completion:", {
							threadId,
							port: resolvedRovoPort,
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
									const currentThread =
										syncedThread ?? await rovoAppThreadManager.getThread(threadId);
									const latestPlanWidget =
										currentThread
											? getLatestPlanWidgetMetadata(currentThread.messages)
											: null;
									const artifactTitle = derivePlanExecutionArtifactTitle({
										appRoute,
										planTitle: latestPlanWidget?.title,
									});
									let artifactPreviewSummary =
										latestPlanWidget?.shortDescription ?? "";

									if (!artifactPreviewSummary) {
										try {
											const enrichedPlanMetadata =
												await generatePlanMetadataViaGateway({
													title: latestPlanWidget?.title ?? artifactTitle,
													description: latestPlanWidget?.description ?? undefined,
													tasks: latestPlanWidget?.tasks ?? [],
												});
											artifactPreviewSummary =
												enrichedPlanMetadata.shortDescription || "";
										} catch (metadataError) {
											console.warn("[PLAN-EXECUTION] Failed to generate artifact preview summary:", metadataError);
										}
									}

									if (!artifactPreviewSummary) {
										artifactPreviewSummary = buildArtifactPreviewSummary(artifactTitle);
									}

									const artifactDocument = await rovoAppDocumentManager.createDocument({
										threadId,
										title: artifactTitle,
										kind: "react",
										content: appRoute,
										previewSummary: artifactPreviewSummary,
										changeLabel: "Plan execution complete",
										sourceMessageId: null,
									});
									await rovoAppThreadManager.updateThread(threadId, {
										activeDocumentId: artifactDocument.id,
									});

									writer.write({
										type: "data-artifact-result",
											data: {
												documentId: artifactDocument.id,
												threadId: artifactDocument.threadId,
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

app.post("/api/agents/rfp-demo/vpk-html-report", async (req, res) => {
	try {
		const report = await generateAgentsRfpDemoReportPreview(req.body || {});
		return res.status(200).json(report);
	} catch (error) {
		console.error("[AGENTS-RFP-DEMO] Failed to generate vpk-html report preview:", error);
		return res.status(400).json({
			error: error instanceof Error ? error.message : "Failed to generate vpk-html report preview",
		});
	}
});

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
			await rovoCancelChat(resolvedPort);
		} else {
			await rovoCancelChat();
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

app.post("/api/rovo/cancel-deferred-tool", async (req, res) => {
	try {
		const toolCallId = getNonEmptyString(req.body?.toolCallId);
		if (!toolCallId) {
			return res.status(400).json({ error: "toolCallId is required" });
		}

		// AI Gateway clarification cards have no backend state to clean —
		// the gateway request that emitted the card has already completed
		// and we hold no pending tool-call record. Silently 200-ack so the
		// client's `cancelDeferredToolCall` succeeds and the card unmounts.
		if (toolCallId.startsWith("ai-gateway-clarification-")) {
			return res.status(200).json({
				cancelled: true,
				kind: "ai-gateway-clarification",
				toolCallId,
			});
		}

		const activeDeferredToolCall = clearActiveDeferredToolCall(toolCallId);
		if (activeDeferredToolCall) {
			await cancelActiveDeferredToolCallRecord(activeDeferredToolCall, {
				cancelChat: rovoCancelChat,
				waitForReady: waitForPortReady,
			});
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

		const pausedToolCall = detachPausedRovoToolCall(toolCallId);
		if (pausedToolCall) {
			await cancelPausedDeferredToolCallRecord(pausedToolCall, {
				cancelChat: rovoCancelChat,
				waitForReady: waitForPortReady,
				onReleaseError: (error) => {
					console.warn("[ROVO-PAUSE] Failed to release reserved port handle:", error);
				},
			});
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
// Allows the frontend to get/set the agent mode on a specific Rovo
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

		const rovoAvailable = await isRovoAvailable();
		if (!rovoAvailable) {
			const unavailableError = createRovoUnavailableError();
			return res.status(503).json({
				error: "Rovo Serve is required but not available",
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
		const rovoAvailable = await isRovoAvailable();
		if (!rovoAvailable) {
			return res.status(200).json({
				mode: "default",
				message: "Rovo Serve is not available; default agent mode assumed",
			});
		}

		try {
			const result = await getAgentMode();
			return res.status(200).json(result);
		} catch (agentModeError) {
			const msg = agentModeError instanceof Error ? agentModeError.message : String(agentModeError);
			if (msg.includes("status 404")) {
				// Rovo Serve version doesn't support agent mode — return default
				console.info("[AGENT-MODE] Agent mode not supported by this Rovo version, returning default");
				return res.status(200).json({ mode: "default", message: "Agent mode not supported by this Rovo version" });
			}
			if (isRovoConnectionFailure(agentModeError)) {
				console.info("[AGENT-MODE] Rovo unavailable while reading agent mode, returning default");
				return res.status(200).json({
					mode: "default",
					message: "Rovo Serve is not available; default agent mode assumed",
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
// notification here. The backend forwards a system message to Rovo
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

		// Stream the skip notification to Rovo and return Rovo's response
		const stream = createUIMessageStream({
			execute: async ({ writer }) => {
				const textId = `skip-question-response-${Date.now()}`;
				let textStarted = false;

				try {
					await streamViaRovo({
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
						"[OUTPUT-ROUTING] Skip notification Rovo error:",
						error instanceof Error ? error.message : error
					);
					// If Rovo fails, provide a fallback response
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
		isRovoAvailable,
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
	const { targetUrl, source, error } = parseImageProxyTarget(rawSrc);
	if (error) {
		return res.status(400).json({ error });
	}

	const abortController = new AbortController();
	const timeoutHandle = setTimeout(() => {
		abortController.abort();
	}, IMAGE_PROXY_TIMEOUT_MS);

	try {
		const candidateQueue = [
			targetUrl,
			...(source === "atlassian"
				? deriveAtlassianImageCandidatesFromUrl(targetUrl)
				: []),
		];
		const attemptedUrls = new Set();
		let lastStatus = null;

		while (candidateQueue.length > 0 && attemptedUrls.size < 8) {
			const currentUrl = candidateQueue.shift();
			if (!currentUrl) {
				continue;
			}

			const currentUrlString = currentUrl.toString();
			if (attemptedUrls.has(currentUrlString)) {
				continue;
			}
			attemptedUrls.add(currentUrlString);

			const upstreamResponse = await fetch(currentUrlString, {
				method: "GET",
				headers: buildImageProxyRequestHeaders(currentUrl),
				redirect: "follow",
				signal: abortController.signal,
			});

			if (!upstreamResponse.ok) {
				lastStatus = upstreamResponse.status;
				continue;
			}

			const contentType =
				getNonEmptyString(upstreamResponse.headers.get("content-type")) ||
				"application/octet-stream";

			if (contentType.toLowerCase().startsWith("image/")) {
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
			}

			if (source === "atlassian") {
				const htmlText = await upstreamResponse.text();
				for (const derivedUrl of extractAtlassianImageCandidatesFromHtml(
					htmlText,
					currentUrl
				)) {
					candidateQueue.push(derivedUrl);
				}
			}
		}

		return res.status(502).json({
			error:
				lastStatus !== null
					? `Image fetch failed (${lastStatus})`
					: "Upstream response is not an image",
		});
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
		isBrowserWorkspaceNotFoundError(error) ||
		(typeof message === "string" &&
			message.startsWith("Browser workspace not found:"))
			? 404
			: 500;

	return response.status(statusCode).json({
		error: message,
	});
}

function logBrowserWorkspaceError(label, error) {
	if (isBrowserWorkspaceNotFoundError(error)) {
		const message =
			error instanceof Error && error.message
				? error.message
				: "Browser workspace not found.";
		console.warn(`${label}: ${message}`);
		return;
	}

	console.error(`${label}:`, error);
}

app.use("/api/browser-workspaces", requireRuntimeAdmin);

app.get("/api/browser-workspaces", async (_req, res) => {
	try {
		return res.json({
			workspaces: browserWorkspaceManager.listWorkspaces(),
		});
	} catch (error) {
		logBrowserWorkspaceError("[BROWSER-WORKSPACE] List error", error);
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
		logBrowserWorkspaceError("[BROWSER-WORKSPACE] Create error", error);
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
		logBrowserWorkspaceError("[BROWSER-WORKSPACE] State error", error);
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
		logBrowserWorkspaceError("[BROWSER-WORKSPACE] Delete error", error);
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
		logBrowserWorkspaceError("[BROWSER-WORKSPACE] Tab list error", error);
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
		logBrowserWorkspaceError("[BROWSER-WORKSPACE] Tab create error", error);
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
			logBrowserWorkspaceError("[BROWSER-WORKSPACE] Tab activate error", error);
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
		logBrowserWorkspaceError("[BROWSER-WORKSPACE] Tab close error", error);
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
		logBrowserWorkspaceError(
			"[BROWSER-WORKSPACE] Preview session create error",
			error,
		);
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
			logBrowserWorkspaceError(
				"[BROWSER-WORKSPACE] Preview session delete error",
				error,
			);
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
				const socketScope = `browser-preview:${workspaceId}`;

				// Check mirror browsers first (Rovo browser feature)
				const mirrorBrowser = getMirrorBrowser(workspaceId);
				if (mirrorBrowser) {
					const streamConfig = mirrorBrowser.getStreamConfig(port);
					return res.json({
						...streamConfig,
						wsUrl: appendRuntimeSocketToken(
							streamConfig.wsUrl,
							socketScope,
							"previewToken",
						),
					});
				}

				const streamConfig = browserWorkspaceManager.getWorkspaceStream(workspaceId);
				return res.json({
					...streamConfig,
					wsUrl: appendRuntimeSocketToken(
						`ws://127.0.0.1:${port}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/live`,
						socketScope,
						"previewToken",
					),
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
		logBrowserWorkspaceError("[BROWSER-WORKSPACE] Read action error", error);
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
		logBrowserWorkspaceError("[BROWSER-WORKSPACE] Mutation action error", error);
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

app.post("/api/rovo/chat", async (req, res) => {
	try {
		await proxyRovoAppChatRequest(req, res);
	} catch (error) {
		console.error("[FUTURE-CHAT] Chat proxy failed:", error);
		return sendGatewayErrorResponse(
			res,
			error,
			"Failed to stream Rovo response"
		);
	}
});

app.get("/api/rovo/messages", async (req, res) => {
	try {
		const rawThreadId = Array.isArray(req.query.threadId) ? req.query.threadId[0] : req.query.threadId;
		const threadId = getNonEmptyString(rawThreadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const messages = await rovoAppThreadManager.getRealtimeMessages(threadId);
		return res.status(200).json({
			messages: Array.isArray(messages) ? messages : [],
		});
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to load realtime messages:", error);
		return res.status(500).json({ error: "Failed to load Rovo realtime messages" });
	}
});

app.post("/api/rovo/messages", async (req, res) => {
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
			thread = await rovoAppThreadManager.upsertRealtimeMessage(threadId, message);
		} else if (Array.isArray(messages)) {
			thread = await rovoAppThreadManager.replaceRealtimeMessages(threadId, messages);
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
		return res.status(500).json({ error: "Failed to persist Rovo realtime messages" });
	}
});

app.get("/api/rovo/threads", async (req, res) => {
	try {
		await syncHermesJobsForRovoThreads();
		const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
		const limit = rawLimit ? Number(rawLimit) : undefined;
		const threads = (
			await Promise.all(
				(await rovoAppThreadManager.listThreads({ limit })).map((thread) =>
					reconcileOrphanedRovoAppThread(thread),
				),
			)
		)
			.filter(Boolean)
			.map((thread) => buildRovoAppThreadSummary(thread));
		return res.status(200).json({ threads });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to list threads:", error);
		return res.status(500).json({ error: "Failed to list Rovo threads" });
	}
});

app.get("/api/sessions/search", async (req, res) => {
	try {
		const query = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
		if (!query || typeof query !== "string" || !query.trim()) {
			return res.status(200).json({ results: [] });
		}

		const rawLimit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
		const limit = rawLimit ? Number(rawLimit) : undefined;
		const threads = await rovoAppThreadManager.listThreads({ limit: 100 });
		const results = searchThreads(threads, query.trim(), { limit });
		return res.status(200).json({ results });
	} catch (error) {
		console.error("[SESSION-SEARCH] Failed to search sessions:", error);
		return res.status(500).json({
			error: "Failed to search sessions",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

// ── Checkpoint endpoints ──

app.get("/api/checkpoints", async (_req, res) => {
	try {
		const checkpoints = await checkpointManager.list();
		return res.status(200).json({ checkpoints });
	} catch (error) {
		console.error("[CHECKPOINTS] Failed to list checkpoints:", error);
		return res.status(500).json({
			error: "Failed to list checkpoints",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/checkpoints", requireRuntimeAdmin, async (req, res) => {
	try {
		const name = typeof req.body?.name === "string" && req.body.name.trim()
			? req.body.name.trim()
			: `checkpoint-${Date.now()}`;
		const description = typeof req.body?.description === "string"
			? req.body.description.trim()
			: null;
		const checkpoint = await checkpointManager.create({ name, description });
		return res.status(201).json({ checkpoint });
	} catch (error) {
		console.error("[CHECKPOINTS] Failed to create checkpoint:", error);
		return res.status(500).json({
			error: "Failed to create checkpoint",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/checkpoints/:id/rollback", requireRuntimeAdmin, async (req, res) => {
	try {
		const checkpoint = await checkpointManager.rollback(req.params.id);
		return res.status(200).json({ checkpoint });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const statusCode = /not found/iu.test(message) ? 404 : 500;
		return res.status(statusCode).json({
			error: "Failed to rollback checkpoint",
			details: message,
		});
	}
});

app.delete("/api/checkpoints/:id", requireRuntimeAdmin, async (req, res) => {
	try {
		const deleted = await checkpointManager.delete(req.params.id);
		if (!deleted) {
			return res.status(404).json({ error: "Checkpoint not found" });
		}
		return res.status(200).json({ checkpoint: deleted });
	} catch (error) {
		return res.status(500).json({
			error: "Failed to delete checkpoint",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/rovo/threads", async (req, res) => {
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
			hermesContext,
			sessionId,
			sessionMode,
			createdAt,
			updatedAt,
		} = req.body || {};
		const threadId = getNonEmptyString(rawThreadId) || createRovoAppThreadId();
		const persistedMessages = await persistRovoAppMessageFiles(threadId, messages);
		const thread = await rovoAppThreadManager.createThread({
			id: threadId,
			title,
			messages: persistedMessages,
			realtimeMessages,
			visibility,
			modelId,
				provider,
				activeDocumentId,
				hermesContext,
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

app.delete("/api/rovo/threads", async (req, res) => {
	try {
		const rawAll = Array.isArray(req.query.all) ? req.query.all[0] : req.query.all;
		if (rawAll !== "true" && rawAll !== "1") {
			return res.status(400).json({ error: "Use ?all=true to delete all threads." });
		}

		const threads = await rovoAppThreadManager.listThreads({ limit: Number.MAX_SAFE_INTEGER });
		await Promise.all(
			threads.map(async (thread) => {
				await rovoAppGeneratedFilesManager.deleteLegacyRootFiles(thread.id);
			}),
		);

		await rovoAppThreadManager.deleteAllThreads();
		await rovoAppVoteManager.deleteAllVotes();
		await rovoAppDocumentManager.deleteAllDocuments();
		await rovoAppUploadManager.deleteAllUploads();

		return res.status(200).json({ deleted: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to delete all threads:", error);
		return res.status(500).json({ error: "Failed to delete all Rovo threads" });
	}
});

app.get("/api/rovo/threads/:threadId", async (req, res) => {
	try {
		await syncHermesJobsForRovoThreads(req.params.threadId);
		const thread = await maybeMigratePersistedRovoAppThreadBrowserScreenshots(
			await reconcileOrphanedRovoAppThread(
				await rovoAppThreadManager.getThread(req.params.threadId),
			),
		);
		if (!thread) {
			return res.status(404).json({ error: "Thread not found" });
		}

		return res.status(200).json({ thread });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to load thread:", error);
		return res.status(500).json({ error: "Failed to load Rovo thread" });
	}
});

app.put("/api/rovo/threads/:threadId", async (req, res) => {
	try {
		const {
			title,
			messages,
			realtimeMessages,
			visibility,
			modelId,
			provider,
			activeDocumentId,
			hermesContext,
			sessionId,
			sessionMode,
			updatedAt,
		} = req.body || {};
		const persistedMessages =
			messages !== undefined
				? await persistRovoAppMessageFiles(req.params.threadId, messages)
				: undefined;
		const thread = await rovoAppThreadManager.updateThread(req.params.threadId, {
			title,
			messages: persistedMessages,
			realtimeMessages,
			visibility,
			modelId,
				provider,
				activeDocumentId,
				hermesContext,
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
		return res.status(500).json({ error: "Failed to update Rovo thread" });
	}
});

app.post("/api/rovo/detach", async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.body?.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}
		const run = rovoAppRunManager.getRun(threadId);
		if (!run) {
			return res.status(404).json({ error: "No active stream for threadId" });
		}
		rovoAppRunManager.setRunStatus(
			threadId,
			run.status === "queued" ? "queued" : "background",
		);
		await persistRovoAppRunState(threadId, rovoAppRunManager.getRun(threadId));
		return res.status(200).json({ detached: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to detach stream:", error);
		return res.status(500).json({ error: "Failed to detach stream" });
	}
});

app.get("/api/rovo/background-streams", async (req, res) => {
	try {
		const streams = rovoAppRunManager.listRuns();
		return res.status(200).json({ streams });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to list background streams:", error);
		return res.status(500).json({ error: "Failed to list background streams" });
	}
});

app.get("/api/rovo/runs/:threadId/stream", async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.params.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const subscriberId = rovoAppRunManager.attachSubscriber(threadId, res, {
			onDetached: (run) => {
				if (!run) {
					return;
				}
				void persistRovoAppRunState(threadId, run);
			},
		});
		if (!subscriberId) {
			return res.status(404).json({ error: "No active run for threadId" });
		}

		await persistRovoAppRunState(threadId, rovoAppRunManager.getRun(threadId));
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to attach run stream:", error);
		return res.status(500).json({ error: "Failed to attach Rovo run stream" });
	}
});

app.post("/api/rovo/runs/:threadId/detach", async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.params.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const run = rovoAppRunManager.getRun(threadId);
		if (!run) {
			return res.status(404).json({ error: "No active run for threadId" });
		}

		rovoAppRunManager.setRunStatus(
			threadId,
			run.status === "queued" ? "queued" : "background",
		);
		await persistRovoAppRunState(threadId, rovoAppRunManager.getRun(threadId));
		return res.status(200).json({ detached: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to detach run:", error);
		return res.status(500).json({ error: "Failed to detach Rovo run" });
	}
});

app.post("/api/rovo/runs/:threadId/cancel", async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.params.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const run = rovoAppRunManager.getRun(threadId);
		if (!run) {
			return res.status(404).json({ error: "No active run for threadId" });
		}

		if (typeof run.rovoPort === "number" && run.rovoPort > 0) {
			await rovoCancelChat(run.rovoPort).catch(() => {});
		}

		rovoAppRunManager.cancelRun(threadId);
		await clearRovoAppRunState(threadId);
		void startNextQueuedRovoAppRun();
		return res.status(200).json({ cancelled: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to cancel run:", error);
		return res.status(500).json({ error: "Failed to cancel Rovo run" });
	}
});

app.get("/api/rovo/threads/:threadId/browser-workspace", async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.params.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const workspace = await getRovoAppThreadBrowserWorkspace({ threadId });
		if (!workspace) {
			return res.status(404).json({ error: "Browser workspace not found" });
		}

		return res.status(200).json(workspace.state);
	} catch (error) {
		console.error("[ROVO-BROWSER] Failed to read thread browser workspace:", error);
		return res.status(500).json({ error: "Failed to read thread browser workspace" });
	}
});

app.post("/api/rovo/threads/:threadId/browser-workspace", requireRuntimeAdmin, async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.params.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const defaultUrl = getNonEmptyString(req.body?.defaultUrl);
		const workspace = await ensureRovoAppThreadBrowserWorkspace({
			defaultUrl: defaultUrl || undefined,
			threadId,
		});

		return res.status(workspace.created ? 201 : 200).json(workspace.state);
	} catch (error) {
		console.error("[ROVO-BROWSER] Failed to ensure thread browser workspace:", error);
		return res.status(500).json({
			error: "Failed to ensure thread browser workspace",
			...(error instanceof Error && error.message
				? {
					details: error.message,
				}
				: {}),
		});
	}
});

app.delete("/api/rovo/threads/:threadId/browser-workspace", requireRuntimeAdmin, async (req, res) => {
	try {
		const threadId = getNonEmptyString(req.params.threadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const sessionResult = await deleteRovoAppThreadBrowserWorkspace(threadId);
		return res.status(200).json(sessionResult);
	} catch (error) {
		console.error("[ROVO-BROWSER] Failed to delete thread browser workspace:", error);
		return res.status(500).json({ error: "Failed to delete thread browser workspace" });
	}
});

app.delete("/api/rovo/threads/:threadId", async (req, res) => {
	try {
		const threadId = req.params.threadId;
		const activeRun = rovoAppRunManager.getRun(threadId);
		if (activeRun) {
			if (typeof activeRun.rovoPort === "number" && activeRun.rovoPort > 0) {
				await rovoCancelChat(activeRun.rovoPort).catch(() => {});
			}
			rovoAppRunManager.cancelRun(threadId);
		}
		const thread = await rovoAppThreadManager.getThread(threadId);
		const uploadIds = collectRovoAppUploadIdsFromMessages(thread?.messages);
		if (thread) {
			await rovoAppGeneratedFilesManager.backfillFromThread(thread);
			await rovoAppGeneratedFilesManager.deleteLegacyRootFiles(threadId);
			await deleteRovoAppThreadBrowserWorkspace(threadId).catch(() => ({}));
			await destroyMirrorBrowser(`mirror-${threadId}`);
		}
		await Promise.all(
			uploadIds.map((uploadId) =>
				rovoAppUploadManager.deleteUpload(uploadId).catch(() => {})
			)
		);
		await rovoAppVoteManager.deleteVotesForThread(threadId);
		await rovoAppDocumentManager.deleteDocumentsByThread(threadId);
		await rovoAppThreadManager.deleteThread(threadId);
		return res.status(200).json({ deleted: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to delete thread:", error);
		return res.status(500).json({ error: "Failed to delete Rovo thread" });
	}
});

app.get("/api/rovo/votes", async (req, res) => {
	try {
		const rawThreadId = Array.isArray(req.query.threadId) ? req.query.threadId[0] : req.query.threadId;
		const threadId = getNonEmptyString(rawThreadId);
		if (!threadId) {
			return res.status(400).json({ error: "threadId is required" });
		}

		const votes = await rovoAppVoteManager.listVotes(threadId);
		return res.status(200).json({ votes });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to list votes:", error);
		return res.status(500).json({ error: "Failed to list Rovo votes" });
	}
});

app.patch("/api/rovo/votes", async (req, res) => {
	try {
		const { threadId: rawThreadId, messageId: rawMessageId, value } = req.body || {};
		const threadId = getNonEmptyString(rawThreadId);
		const messageId = getNonEmptyString(rawMessageId);
		if (!threadId || !messageId) {
			return res.status(400).json({ error: "threadId and messageId are required" });
		}

		const vote = await rovoAppVoteManager.setVote({
			threadId,
			messageId,
			value: value === "up" || value === "down" ? value : null,
		});
		return res.status(200).json({ vote });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to update vote:", error);
		return res.status(500).json({ error: "Failed to update Rovo vote" });
	}
});

app.get("/api/rovo/documents", async (req, res) => {
	try {
		const rawThreadId = Array.isArray(req.query.threadId) ? req.query.threadId[0] : req.query.threadId;
		const rawDocumentId = Array.isArray(req.query.documentId) ? req.query.documentId[0] : req.query.documentId;
		const threadId = getNonEmptyString(rawThreadId);
		const documentId = getNonEmptyString(rawDocumentId);

		if (documentId) {
			const document = await rovoAppDocumentManager.getDocument(documentId);
			if (!document) {
				return res.status(404).json({ error: "Document not found" });
			}
			return res.status(200).json({ document });
		}

		const documents = await rovoAppDocumentManager.listDocuments({ threadId: threadId || undefined });
		return res.status(200).json({ documents });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to list documents:", error);
		return res.status(500).json({ error: "Failed to load Rovo documents" });
	}
});

app.post("/api/rovo/documents", async (req, res) => {
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
				const document = await rovoAppDocumentManager.appendDocumentVersion(documentId, {
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

			const document = await rovoAppDocumentManager.patchDocumentMetadata(documentId, {
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

		const document = await rovoAppDocumentManager.createDocument({
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
		return res.status(500).json({ error: "Failed to save Rovo document" });
	}
});

app.delete("/api/rovo/documents", async (req, res) => {
	try {
		const rawDocumentId = Array.isArray(req.query.documentId) ? req.query.documentId[0] : req.query.documentId;
		const documentId = getNonEmptyString(rawDocumentId);
		if (!documentId) {
			return res.status(400).json({ error: "documentId is required" });
		}

		await rovoAppDocumentManager.deleteDocument(documentId);
		return res.status(200).json({ deleted: true });
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to delete document:", error);
		return res.status(500).json({ error: "Failed to delete Rovo document" });
	}
});

app.post("/api/rovo/files/upload", async (req, res) => {
	try {
		const { name, mediaType, dataUrl, threadId } = req.body || {};
		if (typeof dataUrl !== "string" || !dataUrl.trim()) {
			return res.status(400).json({ error: "dataUrl is required" });
		}

		const upload = await rovoAppUploadManager.createUploadFromDataUrl({
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
				url: buildRovoAppFileUrl(upload.id),
			},
		});
	} catch (error) {
		console.error("[FUTURE-CHAT] Failed to upload file:", error);
		const message = error instanceof Error ? error.message : "Failed to upload file";
		return res.status(400).json({ error: message });
	}
});

app.get("/api/rovo/files/:fileId", async (req, res) => {
	try {
		const upload = await rovoAppUploadManager.getUpload(req.params.fileId);
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
		return res.status(500).json({ error: "Failed to serve Rovo file" });
	}
});

app.get("/api/rovo/generated-media", async (req, res) => {
	try {
		const requestedPath = Array.isArray(req.query.path)
			? req.query.path[0]
			: req.query.path;
		const absolutePath = resolveGeneratedMediaAbsolutePath(
			path.join(__dirname, ".."),
			requestedPath,
		);
		if (!absolutePath) {
			return res.status(400).json({ error: "Invalid generated media path" });
		}

		const contentType = inferGeneratedMediaContentType(requestedPath);
		if (!contentType) {
			return res.status(400).json({ error: "Unsupported generated media type" });
		}

		await require("node:fs/promises").access(absolutePath);
		res.setHeader("Content-Type", contentType);
		res.setHeader(
			"Content-Disposition",
			`inline; filename="${path.basename(absolutePath)}"`,
		);
		return res.sendFile(absolutePath);
	} catch (error) {
		if (error?.code === "ENOENT") {
			return res.status(404).json({ error: "Generated media file not found" });
		}

		console.error("[FUTURE-CHAT] Failed to serve generated media:", error);
		return res.status(500).json({ error: "Failed to serve generated media" });
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

app.delete("/api/orchestrator/log", requireRuntimeAdmin, (_req, res) => {
	try {
		orchestratorLog.clear();
		return res.json({ ok: true, message: "Orchestrator log cleared" });
	} catch (error) {
		console.error("[ORCHESTRATOR] Failed to clear log:", error);
		return res.status(500).json({ error: "Failed to clear orchestrator log" });
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

// ─── Hermes Status / Skills / Jobs ──────────────────────────────────────────

app.get("/api/status/rovo", async (_req, res) => {
	try {
		const available = await isRovoAvailable();
		const port = parseOptionalInteger(process.env.ROVO_PORT);
		return res.json(
			buildRuntimeStatusSnapshot({
				rovo: {
					available,
					message: available
						? "Rovo Serve is ready for interactive chat."
						: "Rovo Serve is unavailable.",
					status: available ? "ready" : "unavailable",
					url: typeof port === "number" ? `http://localhost:${port}` : null,
				},
			}).surfaces.rovo,
		);
	} catch (error) {
		return res.status(500).json({
			error: "Failed to check Rovo status",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/api/status/hermes", async (_req, res) => {
	try {
		const status = await getHermesRuntimeStatus({
			jobsProvider: hermesJobsProvider,
		});
		return res.json(
			buildRuntimeStatusSnapshot({
				hermes: {
					available: status.available,
					details: status,
					message: status.message ?? null,
					status: status.status ?? (status.available ? "ready" : "unavailable"),
					url: status.baseUrl ?? null,
				},
			}).surfaces.hermes,
		);
	} catch (error) {
		return res.status(500).json({
			error: "Failed to check Hermes status",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/api/status", async (_req, res) => {
	try {
		const [rovoAvailable, hermesStatus] = await Promise.all([
			isRovoAvailable(),
			getHermesRuntimeStatus({
				jobsProvider: hermesJobsProvider,
			}),
		]);
		const port = parseOptionalInteger(process.env.ROVO_PORT);
		return res.json(
			buildRuntimeStatusSnapshot({
				hermes: {
					available: hermesStatus.available,
					details: hermesStatus,
					message: hermesStatus.message ?? null,
					status: hermesStatus.status ?? (hermesStatus.available ? "ready" : "unavailable"),
					url: hermesStatus.baseUrl ?? null,
				},
				rovo: {
					available: rovoAvailable,
					message: rovoAvailable
						? "Rovo Serve is ready for interactive chat."
						: "Rovo Serve is unavailable.",
					status: rovoAvailable ? "ready" : "unavailable",
					url: typeof port === "number" ? `http://localhost:${port}` : null,
				},
			}),
		);
	} catch (error) {
		return res.status(500).json({
			error: "Failed to resolve runtime status",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/api/agents/rfp-demo/state", async (_req, res) => {
	try {
		const state = await advanceAgentsRfpDemoProcessing();
		return res.json({ state });
	} catch (error) {
		return res.status(500).json({
			error: "Failed to load Agents RFP demo state",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/agents/rfp-demo/state", async (req, res) => {
	try {
		if (!req.body?.state || typeof req.body.state !== "object") {
			return res.status(400).json({ error: "state is required." });
		}

		const state = await agentsRfpDemoStateManager.writeState(req.body.state);
		return res.json({ state });
	} catch (error) {
		return res.status(500).json({
			error: "Failed to save Agents RFP demo state",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/agents/rfp-demo/reset", async (_req, res) => {
	try {
		const currentState = await agentsRfpDemoStateManager.readState();
		const threadIds = getDemoCreatedThreadIds(currentState);
		await deleteAgentsRfpDemoHermesJobs(currentState);
		await Promise.all(threadIds.map((threadId) => deleteAgentsRfpDemoThread(threadId).catch(() => {})));
		const state = await agentsRfpDemoStateManager.resetState();
		return res.json({ state });
	} catch (error) {
		return res.status(500).json({
			error: "Failed to reset Agents RFP demo state",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/agents/rfp-demo/agent/apply", async (_req, res) => {
	try {
		const { job, state } = await runAgentsRfpDemoJob({
			source: "agent-apply",
		});
		return res.json({ job, state });
	} catch (error) {
		return res.status(error?.code === "INVALID_INPUT" ? 400 : 500).json({
			error: "Failed to apply RFP Drafting Agent",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/agents/rfp-demo/events/ticket-entered-column", async (req, res) => {
	try {
		const ticketCode = getNonEmptyString(req.body?.ticketCode ?? req.body?.key);
		const targetColumn = getNonEmptyString(req.body?.targetColumn ?? req.body?.column);
		if (!ticketCode || !targetColumn) {
			return res.status(400).json({ error: "ticketCode and targetColumn are required." });
		}

		const state = await agentsRfpDemoStateManager.updateState((currentState) => (
			moveTicketToColumn(currentState, ticketCode, targetColumn)
		));

		if (targetColumn !== RFP_DRAFTING_EVENT_TRIGGER.column || !state.agent?.trigger) {
			return res.json({
				state,
				job: state.agent?.jobId ? await getMergedHermesJob(state.agent.jobId).catch(() => null) : null,
			});
		}

		const { job, state: processedState } = await runAgentsRfpDemoJob({
			source: "jira-column-entered",
			ticketCodes: [ticketCode],
		});
		return res.json({ job, state: processedState });
	} catch (error) {
		return res.status(error?.code === "INVALID_INPUT" ? 400 : 500).json({
			error: "Failed to process Agents RFP demo ticket event",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/api/jobs", async (_req, res) => {
	try {
		await advanceAgentsRfpDemoProcessing();
		const jobs = await listMergedHermesJobs(_req.query);
		await syncHermesJobResultsToRovoThreads({
			jobs,
			onJobPosted: async (job, metadata) => {
				await persistHermesJobLink(job.id, job, metadata, { mergeExisting: true });
			},
			rovoAppThreadManager,
		});
		return res.json({ jobs });
	} catch (error) {
		return sendHermesUnavailableResponse(res, error, "Failed to list Hermes jobs");
	}
});

app.get("/api/wiki/status", wikiRouteHandlers.handleWikiStatus);
app.post("/api/wiki/captures", wikiRouteHandlers.handleWikiCapture);
app.get("/api/wiki/search", wikiRouteHandlers.handleWikiSearch);
app.post("/api/wiki/synthesis", wikiRouteHandlers.handleWikiSynthesisSave);
app.get("/api/wiki/memories", wikiRouteHandlers.handleWikiMemories);
app.get("/api/wiki/memory-explorer", wikiRouteHandlers.handleWikiMemoryExplorer);
app.get("/api/wiki/memory-explorer/export", wikiRouteHandlers.handleWikiMemoryExplorerExport);
app.post("/api/wiki/memory-explorer/brief", wikiRouteHandlers.handleWikiMemoryBrief);
app.post("/api/wiki/memory-explorer/deck", wikiRouteHandlers.handleWikiMemoryDeck);
app.delete("/api/wiki/memories/:scope/blocks/:blockId", wikiRouteHandlers.handleWikiMemoryBlockDelete);
app.delete("/api/wiki/memories/proposals/:proposalId", wikiRouteHandlers.handleWikiMemoryProposalDelete);
app.post("/api/wiki/sync", wikiRouteHandlers.handleWikiSync);
app.use("/api/personal-graph", personalGraphRoutes);

app.post("/api/jobs", requireRuntimeAdmin, async (req, res) => {
	try {
		const job = await hermesJobsProvider.createHermesJob(toHermesJobInput(req.body));
		const linkMetadata = await persistHermesJobLink(job.id, req.body);
		return res.status(201).json({
			job: {
				...job,
				...(linkMetadata ?? {}),
			},
		});
	} catch (error) {
		return sendHermesUnavailableResponse(res, error, "Failed to create Hermes job");
	}
});

app.get("/api/jobs/:id", async (req, res) => {
	try {
		await advanceAgentsRfpDemoProcessing();
		const job = await getMergedHermesJob(req.params.id);
		return res.json({ job });
	} catch (error) {
		return sendHermesUnavailableResponse(res, error, "Failed to load Hermes job");
	}
});

app.patch("/api/jobs/:id", requireRuntimeAdmin, async (req, res) => {
	try {
		const hermesJobInput = toHermesJobInput(req.body);
		const job = Object.keys(hermesJobInput).length > 0
			? await hermesJobsProvider.updateHermesJob(req.params.id, hermesJobInput)
			: await hermesJobsProvider.getHermesJob(req.params.id);
		const linkMetadata = await persistHermesJobLink(req.params.id, req.body, {}, { mergeExisting: true });
		return res.json({
			job: {
				...job,
				...(linkMetadata ?? {}),
			},
		});
	} catch (error) {
		return sendHermesUnavailableResponse(res, error, "Failed to update Hermes job");
	}
});

app.delete("/api/jobs/:id", requireRuntimeAdmin, async (req, res) => {
	try {
		await hermesJobsProvider.deleteHermesJob(req.params.id);
		await hermesJobLinkManager.removeLink(req.params.id);
		return res.status(204).end();
	} catch (error) {
		return sendHermesUnavailableResponse(res, error, "Failed to delete Hermes job");
	}
});

app.post("/api/jobs/:id/run", requireRuntimeAdmin, async (req, res) => {
	try {
		await hermesJobsProvider.performHermesJobAction(req.params.id, "run");
		const job = await getMergedHermesJob(req.params.id);
		return res.json({ job });
	} catch (error) {
		return sendHermesUnavailableResponse(res, error, "Failed to run Hermes job");
	}
});

app.post("/api/jobs/:id/pause", requireRuntimeAdmin, async (req, res) => {
	try {
		await hermesJobsProvider.performHermesJobAction(req.params.id, "pause");
		const job = await getMergedHermesJob(req.params.id);
		return res.json({ job });
	} catch (error) {
		return sendHermesUnavailableResponse(res, error, "Failed to pause Hermes job");
	}
});

app.post("/api/jobs/:id/resume", requireRuntimeAdmin, async (req, res) => {
	try {
		await hermesJobsProvider.performHermesJobAction(req.params.id, "resume");
		const job = await getMergedHermesJob(req.params.id);
		return res.json({ job });
	} catch (error) {
		return sendHermesUnavailableResponse(res, error, "Failed to resume Hermes job");
	}
});

app.get("/api/skills", async (_req, res) => {
	try {
		const skills = await listHermesSkills({ query: getFirstQueryValue(_req.query.q) ?? getFirstQueryValue(_req.query.query) });
		return res.json({ skills });
	} catch (error) {
		return res.status(500).json({
			error: "Failed to list Hermes skills",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.use("/api/skills/drafts", requireRuntimeAdmin);

registerHermesSkillDraftRoutes(app, {
	archiveSkillImpl: archiveHermesSkill,
	createSkillFromBundleImpl: createHermesSkillFromBundle,
	draftManager: hermesSkillDraftManager,
	syncThreadPendingSkillDraftIdsImpl: syncThreadPendingSkillDraftIds,
	updateSkillFromBundleImpl: updateHermesSkillFromBundle,
});

// ── Skills Hub endpoints ──

app.get("/api/skills/hub/search", async (req, res) => {
	try {
		const query = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
		const source = Array.isArray(req.query.source) ? req.query.source[0] : req.query.source;
		const limit = Array.isArray(req.query.limit) ? req.query.limit[0] : req.query.limit;
		const results = await skillsHubClient.search(query || "", {
			source: source || "all",
			limit: limit ? parseInt(limit, 10) : 10,
		});
		return res.status(200).json({ results });
	} catch (error) {
		return res.status(500).json({
			error: "Failed to search skills hub",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/api/skills/hub/browse", async (req, res) => {
	try {
		const page = req.query.page ? parseInt(Array.isArray(req.query.page) ? req.query.page[0] : req.query.page, 10) : 1;
		const pageSize = req.query.pageSize ? parseInt(Array.isArray(req.query.pageSize) ? req.query.pageSize[0] : req.query.pageSize, 10) : 20;
		const source = Array.isArray(req.query.source) ? req.query.source[0] : req.query.source;
		const result = await skillsHubClient.browse({ page, pageSize, source: source || "all" });
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			error: "Failed to browse skills hub",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

function getWildcardRouteValue(value) {
	if (Array.isArray(value)) {
		return getNonEmptyString(value.join("/"));
	}

	return getNonEmptyString(value);
}

app.get("/api/skills/hub/inspect/*identifier", async (req, res) => {
	try {
		const identifier = getWildcardRouteValue(req.params.identifier);
		if (!identifier) {
			return res.status(400).json({ error: "Identifier required" });
		}
		const result = await skillsHubClient.inspect(identifier);
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			error: "Failed to inspect skill",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/api/skills/hub/installed", async (_req, res) => {
	try {
		const installed = await skillsHubClient.listInstalled();
		return res.status(200).json({ skills: installed });
	} catch (error) {
		return res.status(500).json({
			error: "Failed to list installed hub skills",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/skills/hub/install", requireRuntimeAdmin, async (req, res) => {
	try {
		const bundle = req.body;
		if (!bundle || typeof bundle !== "object" || !bundle.name) {
			return res.status(400).json({ error: "Invalid skill bundle: name and files required" });
		}
		const result = await skillsHubClient.installFromBundle(bundle);
		return res.status(201).json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const statusCode = /traversal|absolute/iu.test(message) ? 400 : 500;
		return res.status(statusCode).json({
			error: "Failed to install skill",
			details: message,
		});
	}
});

app.post("/api/skills/hub/install-by-id", requireRuntimeAdmin, async (req, res) => {
	try {
		const { identifier, category, force } = req.body || {};
		if (!identifier || typeof identifier !== "string") {
			return res.status(400).json({ error: "Identifier required" });
		}
		const result = await skillsHubClient.installFromIdentifier(identifier, { category, force });
		return res.status(201).json(result);
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const statusCode = /already installed/iu.test(message) ? 409 : 500;
		return res.status(statusCode).json({
			error: "Failed to install skill",
			details: message,
		});
	}
});

app.delete("/api/skills/hub/uninstall/*name", requireRuntimeAdmin, async (req, res) => {
	try {
		const name = getWildcardRouteValue(req.params.name);
		if (!name) {
			return res.status(400).json({ error: "Skill name required" });
		}
		const result = await skillsHubClient.uninstall(name);
		if (!result.success) {
			return res.status(404).json({ error: result.message });
		}
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			error: "Failed to uninstall skill",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/api/skills/hub/check", async (req, res) => {
	try {
		const name = Array.isArray(req.query.name) ? req.query.name[0] : req.query.name;
		const results = await skillsHubClient.checkUpdates(name || undefined);
		return res.status(200).json({ results });
	} catch (error) {
		return res.status(500).json({
			error: "Failed to check for updates",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/api/skills/hub/taps", async (_req, res) => {
	try {
		const result = await skillsHubClient.manageTaps("list");
		return res.status(200).json({ taps: result.taps || [] });
	} catch (error) {
		return res.status(500).json({
			error: "Failed to list taps",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/skills/hub/taps", requireRuntimeAdmin, async (req, res) => {
	try {
		const { repo, path: repoPath } = req.body || {};
		if (!repo || typeof repo !== "string") {
			return res.status(400).json({ error: "Repo required" });
		}
		const result = await skillsHubClient.manageTaps("add", repo, repoPath);
		return res.status(result.success ? 201 : 200).json(result);
	} catch (error) {
		return res.status(500).json({
			error: "Failed to add tap",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.delete("/api/skills/hub/taps/*repo", requireRuntimeAdmin, async (req, res) => {
	try {
		const repo = getWildcardRouteValue(req.params.repo);
		if (!repo) {
			return res.status(400).json({ error: "Repo required" });
		}
		const result = await skillsHubClient.manageTaps("remove", repo);
		if (!result.success) {
			return res.status(404).json(result);
		}
		return res.status(200).json(result);
	} catch (error) {
		return res.status(500).json({
			error: "Failed to remove tap",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/api/skills/:category/:name", async (req, res) => {
	try {
		const skill = await getHermesSkill(req.params.category, req.params.name);
		return res.json({ skill });
	} catch (error) {
		if (error?.code === "ENOENT") {
			return res.status(404).json({
				error: "Hermes skill not found",
			});
		}
		return res.status(500).json({
			error: "Failed to load Hermes skill",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.get("/api/skills/:category/:name/bundle", async (req, res) => {
	try {
		const skill = await getHermesSkillBundle(req.params.category, req.params.name);
		return res.json({ skill });
	} catch (error) {
		if (error?.code === "ENOENT") {
			return res.status(404).json({
				error: "Hermes skill not found",
			});
		}
		return res.status(500).json({
			error: "Failed to load Hermes skill bundle",
			details: error instanceof Error ? error.message : String(error),
		});
	}
});

app.post("/api/skills/:category/:name/toggle", requireRuntimeAdmin, async (req, res) => {
	try {
		const enabled = parseOptionalBoolean(
			getFirstQueryValue(req.query.enabled) ?? req.body?.enabled,
		);
		const skill = await toggleHermesSkill(req.params.category, req.params.name, enabled);
		return res.json({ skill });
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);
		const statusCode = /not found/i.test(message) ? 404 : 400;
		return res.status(statusCode).json({
			error: "Failed to toggle Hermes skill",
			details: message,
		});
	}
});

app.get("/api/realtime/audio-conversation-token", requireRuntimeSocketTokenRequester, (_req, res) => {
	const token = createRuntimeSocketToken("realtime:audio-conversation");
	return res.json({
		token: token || null,
		expiresInMs: token ? RUNTIME_SOCKET_TOKEN_TTL_MS : 0,
	});
});

app.get("/healthcheck", (req, res) => {
	console.log("Healthcheck requested by Micros");
	res.status(200).json({ status: "ok" });
});

app.get("/api/health", async (req, res) => {
	console.log("Health check requested");
	debugLog("HEALTH", "Processing health check");

	const key = process.env.ASAP_PRIVATE_KEY;
	const rovoAvailable = await isRovoAvailable();
	const envVars = getEnvVars();
	const aiGatewayConfigured = hasGatewayUrlConfigured(envVars);
	const llmRouting = buildLlmRoutingStatus({
		rovoAvailable,
		aiGatewayConfigured,
	});

	debugLog("HEALTH", "Auth configuration", {
		hasAsapKey: !!key,
		rovoAvailable,
		chatSdkBackend: llmRouting.chatSdk.backend,
		chatSdkRequiresRovo: llmRouting.chatSdk.requiresRovo,
		aiGatewayConfigured,
	});

	const response = {
		status: "OK",
		message: "Backend server is working!",
		timestamp: new Date().toISOString(),
		authMethod: "ASAP",
		debugMode: DEBUG,
		rovoMode: rovoAvailable,
		llmRouting: {
			...llmRouting,
			aiGatewayConfig: getAIGatewayConfigReport(envVars),
		},
		envCheck: {
			ASAP_PRIVATE_KEY: key ? "SET" : "MISSING",
			ROVO_PORT: process.env.ROVO_PORT ? "SET" : "MISSING",
		},
	};

	res.status(200).json(response);
});

// Serve static files from Next.js export output
const publicPath = path.join(__dirname, "public");
console.log(`[STARTUP] Serving static files from: ${publicPath}`);

// Build a one-time `Link: rel=preload` header for the largest CSS and JS
// chunks emitted by the Next.js static export. This lets the browser kick off
// LCP-critical resource discovery from the very first byte of HTML instead of
// waiting for the HTML parser to reach the <link>/<script> tags.
const buildPreloadLinkHeader = () => {
	try {
		const staticRoot = path.join(publicPath, "_next", "static");
		if (!fs.existsSync(staticRoot)) {
			return "";
		}

		const findLargest = (dir, predicate) => {
			let best = null;
			const walk = (current) => {
				let entries;
				try {
					entries = fs.readdirSync(current, { withFileTypes: true });
				} catch {
					return;
				}
				for (const entry of entries) {
					const full = path.join(current, entry.name);
					if (entry.isDirectory()) {
						walk(full);
						continue;
					}
					if (!entry.isFile() || !predicate(entry.name)) {
						continue;
					}
					try {
						const { size } = fs.statSync(full);
						if (!best || size > best.size) {
							best = { full, size };
						}
					} catch {
						/* ignore stat failures */
					}
				}
			};
			walk(dir);
			return best?.full ?? null;
		};

		const toHref = (absolutePath) => {
			const rel = path.relative(publicPath, absolutePath).split(path.sep).join("/");
			return `/${rel}`;
		};

		const cssFile = findLargest(staticRoot, (name) => name.endsWith(".css"));
		const chunksDir = path.join(staticRoot, "chunks");
		const jsFile = fs.existsSync(chunksDir)
			? findLargest(chunksDir, (name) => name.endsWith(".js"))
			: findLargest(staticRoot, (name) => name.endsWith(".js"));

		const entries = [];
		if (cssFile) {
			entries.push(`<${toHref(cssFile)}>; rel=preload; as=style`);
		}
		if (jsFile) {
			entries.push(`<${toHref(jsFile)}>; rel=preload; as=script; crossorigin`);
		}

		return entries.join(", ");
	} catch (error) {
		console.warn("[STARTUP] Failed to build preload Link header:", error?.message);
		return "";
	}
};

const PRELOAD_LINK_HEADER = buildPreloadLinkHeader();
if (PRELOAD_LINK_HEADER) {
	console.log(`[STARTUP] Preload Link header: ${PRELOAD_LINK_HEADER}`);
}

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

	if (PRELOAD_LINK_HEADER) {
		res.setHeader("Link", PRELOAD_LINK_HEADER);
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

	// Check for Rovo Serve at startup
	const rovoReady = await refreshRovoAvailability();
	try {
		const wikiJobProvisioning = await ensureWikiJobs(hermesJobsProvider);
		console.log(
			`  WIKI_JOBS: ${wikiJobProvisioning.existing} existing, ${wikiJobProvisioning.created} created`
		);
	} catch (error) {
		console.error(
			"[STARTUP] Failed to ensure wiki jobs",
			error instanceof Error ? error.message : error,
		);
	}
	hermesJobsProvider.startJobTicker?.();
	const aiGatewayConfigured = hasGatewayUrlConfigured(getEnvVars());
	const llmRouting = buildLlmRoutingStatus({
		rovoAvailable: rovoReady,
		aiGatewayConfigured,
	});
	const chatBackendLabel = describeChatBackend(llmRouting);
	console.log(`\n🤖 Chat Backend: ${chatBackendLabel}`);
	if (rovoReady && _rovoPool) {
		const poolStatus = _rovoPool.getStatus();
		console.log(`  ROVO_POOL: ${poolStatus.total} ports (${poolStatus.ports.map((p) => p.port).join(", ")})`);
	} else if (rovoReady) {
		console.log(`  ROVO_PORT: ${process.env.ROVO_PORT}`);
	}
	console.log(
		`  INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS: ${INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_MAX_ATTEMPTS}`
	);
	console.log(
		`  INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS: ${INTERACTIVE_CHAT_FORCE_PORT_RECOVERY_TIMEOUT_MS}`
	);
	console.log(
		`  AI_GATEWAY_ASSISTED_FEATURES: ${
			llmRouting.aiGatewayAssistedFeatures.configured
				? "CONFIGURED"
				: "NOT CONFIGURED"
		} (${llmRouting.aiGatewayAssistedFeatures.useCases.join(", ")})`
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

function getRuntimeSocketTokenFromUpgrade(requestUrl, paramName) {
	return getNonEmptyString(
		requestUrl.searchParams.get(paramName) ??
			requestUrl.searchParams.get("socketToken"),
	);
}

function rejectUpgrade(socket, statusCode, message) {
	socket.write(
		`HTTP/1.1 ${statusCode} ${message}\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`
	);
	socket.destroy();
}

function verifyRuntimeSocketUpgrade(requestUrl, request, { scope, paramName }) {
	const origin = getNonEmptyString(request.headers.origin);
	if (!isAllowedRuntimeSocketOrigin(origin, request)) {
		return { ok: false, statusCode: 403, message: "Forbidden" };
	}

	if (!RUNTIME_ADMIN_TOKEN && !RUNTIME_ADMIN_REQUIRED) {
		return { ok: true };
	}

	const socketToken = getRuntimeSocketTokenFromUpgrade(requestUrl, paramName);
	if (isRuntimeSocketTokenValid(socketToken, scope)) {
		return { ok: true };
	}

	return {
		ok: false,
		statusCode: RUNTIME_ADMIN_TOKEN ? 403 : 503,
		message: RUNTIME_ADMIN_TOKEN ? "Forbidden" : "Service Unavailable",
	};
}

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
		const verification = verifyRuntimeSocketUpgrade(requestUrl, request, {
			scope: `browser-preview:${workspaceId}`,
			paramName: "previewToken",
		});
		if (!verification.ok) {
			rejectUpgrade(socket, verification.statusCode, verification.message);
			return;
		}
		browserPreviewWss.handleUpgrade(request, socket, head, (ws) => {
			browserPreviewWss.emit("connection", ws, request, workspaceId);
		});
		return;
	}

	if (requestUrl.pathname === "/api/realtime/audio-conversation") {
		const verification = verifyRuntimeSocketUpgrade(requestUrl, request, {
			scope: "realtime:audio-conversation",
			paramName: "realtimeToken",
		});
		if (!verification.ok) {
			rejectUpgrade(socket, verification.statusCode, verification.message);
			return;
		}
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
	// Check if this is a headless mirror browser (used by Rovo browser feature)
	const mirrorBrowser = getMirrorBrowser(workspaceId);
	if (mirrorBrowser) {
		mirrorBrowser.attachClient(ws);
		return;
	}

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

// Graceful shutdown — clean up Rovo pool
process.on("SIGINT", () => {
	hermesJobsProvider.stopJobTicker?.();
	if (_rovoPool) {
		_rovoPool.shutdown();
	}
	process.exit(0);
});
process.on("SIGTERM", () => {
	hermesJobsProvider.stopJobTicker?.();
	if (_rovoPool) {
		_rovoPool.shutdown();
	}
	process.exit(0);
});
