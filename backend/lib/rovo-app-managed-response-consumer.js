"use strict";

const {
	getLatestAssistantTextFromMessages: defaultGetLatestAssistantTextFromMessages,
	runHermesMemoryCompanionReview: defaultRunHermesMemoryCompanionReview,
} = require("./hermes-memory-companion");
const {
	runHermesSkillCompanionReview: defaultRunHermesSkillCompanionReview,
} = require("./hermes-skill-companion");
const {
	buildNextHermesThreadContext,
} = require("./hermes-thread-context");
const {
	collectUiMessagesFromResponseStream: defaultCollectUiMessagesFromResponseStream,
	createUiMessageChunkSseStream: defaultCreateUiMessageChunkSseStream,
} = require("./rovo-app-ui-stream");
const {
	syncWikiBackedMemory: defaultSyncWikiBackedMemory,
} = require("./wiki-memory-provider");
const {
	syncWikiQmdIndex: defaultSyncWikiQmdIndex,
} = require("./qmd");
const {
	parseRouteDecisionFromSseChunk,
} = require("./route-decision");
const { getPositiveInteger } = require("./shared-utils");

const DEFAULT_MESSAGE_PERSIST_DEBOUNCE_MS = 450;

function requireFunction(name, value) {
	if (typeof value !== "function") {
		throw new Error(`createRovoAppManagedResponseConsumer requires ${name}`);
	}
	return value;
}

function createRovoAppManagedResponseConsumer({
	areHermesCompanionsEnabled,
	collectUiMessagesFromResponseStream = defaultCollectUiMessagesFromResponseStream,
	createUiMessageChunkSseStream = defaultCreateUiMessageChunkSseStream,
	finalizeRovoAppRun,
	getLatestAssistantTextFromMessages = defaultGetLatestAssistantTextFromMessages,
	hermesSkillDraftManager,
	logger = console,
	mapUiMessagesToConversation,
	messagePersistDebounceMs = DEFAULT_MESSAGE_PERSIST_DEBOUNCE_MS,
	persistRovoAppRunMessagesSnapshot,
	persistRovoAppRunState,
	rovoAppRunManager,
	rovoAppThreadManager,
	runHermesMemoryCompanionReview = defaultRunHermesMemoryCompanionReview,
	runHermesSkillCompanionReview = defaultRunHermesSkillCompanionReview,
	syncRovoAppThreadSession,
	syncWikiBackedMemory = defaultSyncWikiBackedMemory,
	syncWikiQmdIndex = defaultSyncWikiQmdIndex,
} = {}) {
	requireFunction("areHermesCompanionsEnabled", areHermesCompanionsEnabled);
	requireFunction("collectUiMessagesFromResponseStream", collectUiMessagesFromResponseStream);
	requireFunction("createUiMessageChunkSseStream", createUiMessageChunkSseStream);
	requireFunction("finalizeRovoAppRun", finalizeRovoAppRun);
	requireFunction("getLatestAssistantTextFromMessages", getLatestAssistantTextFromMessages);
	requireFunction("hermesSkillDraftManager.listPendingDraftIdsForThread", hermesSkillDraftManager?.listPendingDraftIdsForThread);
	requireFunction("hermesSkillDraftManager.upsertDraft", hermesSkillDraftManager?.upsertDraft);
	requireFunction("logger.info", logger?.info);
	requireFunction("logger.warn", logger?.warn);
	requireFunction("mapUiMessagesToConversation", mapUiMessagesToConversation);
	requireFunction("persistRovoAppRunMessagesSnapshot", persistRovoAppRunMessagesSnapshot);
	requireFunction("persistRovoAppRunState", persistRovoAppRunState);
	requireFunction("rovoAppRunManager.appendChunk", rovoAppRunManager?.appendChunk);
	requireFunction("rovoAppThreadManager.getThread", rovoAppThreadManager?.getThread);
	requireFunction("rovoAppThreadManager.updateThread", rovoAppThreadManager?.updateThread);
	requireFunction("runHermesMemoryCompanionReview", runHermesMemoryCompanionReview);
	requireFunction("runHermesSkillCompanionReview", runHermesSkillCompanionReview);
	requireFunction("syncRovoAppThreadSession", syncRovoAppThreadSession);
	requireFunction("syncWikiBackedMemory", syncWikiBackedMemory);
	requireFunction("syncWikiQmdIndex", syncWikiQmdIndex);

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

		const resolvedPort = getPositiveInteger(response.headers.get("x-vpk-port"))
			?? getPositiveInteger(response.headers.get("x-vpk-rovo-port"));
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
					logger.warn("[FUTURE-CHAT] Failed to persist in-flight thread messages:", {
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
			}, messagePersistDebounceMs);
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
			logger.warn("[FUTURE-CHAT] Failed to synchronize thread session:", {
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

		if (areHermesCompanionsEnabled() && (latestUserMessage || latestAssistantMessage)) {
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
						logger,
						qmdSyncImpl: async ({ collectionName, wikiDir }) => {
							if (!collectionName) {
								return;
							}

							await syncWikiQmdIndex({
								collectionNames: [collectionName],
								logger,
								wikiDir,
							});
						},
					}).catch((syncError) => {
						logger.warn("[HERMES] Wiki-backed memory sync failed:", {
							threadId,
							error: syncError instanceof Error ? syncError.message : String(syncError),
						});
					});

					logger.info("[HERMES] Memory companion reviewed completed Rovo turn", {
						threadId,
						responseText: reviewResult.responseText ?? null,
					});
				} catch (error) {
					logger.warn("[HERMES] Memory companion review failed:", {
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

					logger.info("[HERMES] Skill companion reviewed completed Rovo turn", {
						threadId,
						draftCount: reviewResult.structuredSkillActions.length,
						responseText: reviewResult.responseText ?? null,
					});
				} catch (error) {
					logger.warn("[HERMES] Skill companion review failed:", {
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

	return {
		consumeRovoAppManagedResponse,
	};
}

module.exports = {
	DEFAULT_MESSAGE_PERSIST_DEBOUNCE_MS,
	createRovoAppManagedResponseConsumer,
};
