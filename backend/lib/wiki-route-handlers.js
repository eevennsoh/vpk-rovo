"use strict";

const path = require("node:path");

const { WIKI_DIR } = require("./wiki-clipper");
const {
	getPositiveInteger,
} = require("./shared-utils");
const {
	resolveLlmWikiPaths,
} = require("./qmd");

function getFirstQueryValue(value) {
	if (Array.isArray(value)) {
		for (const entry of value) {
			const resolved = getFirstQueryValue(entry);
			if (resolved) {
				return resolved;
			}
		}
		return null;
	}

	return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

function toRelativeWikiPath(filePath, wikiDir) {
	if (typeof filePath !== "string" || !filePath.trim()) {
		return null;
	}

	const relativePath = path.relative(wikiDir, filePath);
	if (!relativePath || relativePath.startsWith("..")) {
		return filePath;
	}

	return relativePath.split(path.sep).join("/");
}

function createWikiRouteHandlers({
	buildWikiMemoryBriefImpl,
	buildWikiMemoryDeckImpl,
	buildWikiMemoryExplorerImpl,
	buildWikiMemoryExplorerCsvImpl,
	captureUrlImpl,
	deleteWikiMemoryBlockImpl,
	deleteWikiMemoryProposalImpl,
	ensureFreshWikiQmdIndexImpl,
	getQmdSyncSummaryImpl,
	getWikiMemoriesImpl,
	getWikiStatusImpl,
	lintWikiImpl,
	logger = console,
	normalizeNaiveWikiSearchResultsImpl,
	queryWikiImpl,
	saveSynthesisPageImpl,
	searchWikiWithQmdImpl,
	syncWikiMemoryImpl,
	wikiDir = WIKI_DIR,
} = {}) {
	if (typeof captureUrlImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires captureUrlImpl");
	}

	if (typeof buildWikiMemoryExplorerImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires buildWikiMemoryExplorerImpl");
	}

	if (typeof buildWikiMemoryExplorerCsvImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires buildWikiMemoryExplorerCsvImpl");
	}

	if (typeof buildWikiMemoryBriefImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires buildWikiMemoryBriefImpl");
	}

	if (typeof buildWikiMemoryDeckImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires buildWikiMemoryDeckImpl");
	}

	if (typeof getWikiStatusImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires getWikiStatusImpl");
	}

	if (typeof lintWikiImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires lintWikiImpl");
	}

	if (typeof getWikiMemoriesImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires getWikiMemoriesImpl");
	}

	if (typeof deleteWikiMemoryBlockImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires deleteWikiMemoryBlockImpl");
	}

	if (typeof deleteWikiMemoryProposalImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires deleteWikiMemoryProposalImpl");
	}

	if (typeof getQmdSyncSummaryImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires getQmdSyncSummaryImpl");
	}

	if (typeof ensureFreshWikiQmdIndexImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires ensureFreshWikiQmdIndexImpl");
	}

	if (typeof searchWikiWithQmdImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires searchWikiWithQmdImpl");
	}

	if (typeof queryWikiImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires queryWikiImpl");
	}

	if (typeof normalizeNaiveWikiSearchResultsImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires normalizeNaiveWikiSearchResultsImpl");
	}

	if (typeof syncWikiMemoryImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires syncWikiMemoryImpl");
	}

	if (typeof saveSynthesisPageImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires saveSynthesisPageImpl");
	}

	const llmWikiPaths = resolveLlmWikiPaths({ wikiDir });

	async function handleWikiStatus(_req, res) {
		try {
			const [wiki, qmd] = await Promise.all([
				getWikiStatusImpl(),
				getQmdSyncSummaryImpl(),
			]);
			return res.json({
				wiki: {
					...wiki,
					qmd,
				},
			});
		} catch (error) {
			return res.status(500).json({
				error: "Failed to load wiki status",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async function handleWikiCapture(req, res) {
		const url = typeof req.body?.url === "string" ? req.body.url.trim() : "";
		if (!url) {
			return res.status(400).json({
				error: "A URL is required.",
			});
		}

		try {
			const captureResult = await captureUrlImpl({ url, wikiDir });
			if (captureResult?.skipped) {
				return res.status(200).json({
					canonicalUrl: null,
					reason: captureResult.reason ?? "unknown",
					sourceUrl: url,
					status: "skipped",
					title: null,
					wikiPath: null,
				});
			}

			const metadata = captureResult?.metadata ?? {};
			const captureStatus =
				captureResult?.captureStatus === "existing"
					? "existing"
					: "created";

			return res.status(captureStatus === "created" ? 201 : 200).json({
				canonicalUrl:
					typeof metadata.canonical_url === "string" && metadata.canonical_url.trim().length > 0
						? metadata.canonical_url.trim()
						: typeof metadata.source_url === "string" && metadata.source_url.trim().length > 0
							? metadata.source_url.trim()
							: url,
				reason: null,
				sourceUrl:
					typeof metadata.source_url === "string" && metadata.source_url.trim().length > 0
						? metadata.source_url.trim()
						: url,
				status: captureStatus,
				title:
					typeof metadata.title === "string" && metadata.title.trim().length > 0
						? metadata.title.trim()
						: null,
				wikiPath: toRelativeWikiPath(captureResult?.filePath, llmWikiPaths.rootDir),
			});
		} catch (error) {
			if (error?.code === "INVALID_INPUT") {
				return res.status(400).json({
					error: error.message,
				});
			}
			if (error?.code === "FETCH_FAILED") {
				return res.status(502).json({
					error: "Failed to fetch the requested URL.",
					details: error.message,
				});
			}

			return res.status(500).json({
				error: "Failed to capture wiki source",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async function handleWikiSearch(req, res) {
		try {
			const query = getFirstQueryValue(req.query?.q) ?? getFirstQueryValue(req.query?.query);
			if (!query) {
				return res.status(400).json({
					error: "A wiki search query is required.",
				});
			}

			const limit = Math.min(
				getPositiveInteger(getFirstQueryValue(req.query?.limit), 10) ?? 10,
				50,
			);

			try {
				await ensureFreshWikiQmdIndexImpl({ logger });
				const results = await searchWikiWithQmdImpl(query, { limit });
				return res.json({
					backend: "qmd",
					results,
				});
			} catch (error) {
				logger.warn?.(
					"[WIKI-SEARCH] qmd search failed, falling back to naive search:",
					error instanceof Error ? error.message : error,
				);
				const fallback = await queryWikiImpl(query, { limit });
				return res.json({
					backend: "naive",
					results: normalizeNaiveWikiSearchResultsImpl(fallback.results),
				});
			}
		} catch (error) {
			return res.status(500).json({
				error: "Failed to search wiki",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async function handleWikiSynthesisSave(req, res) {
		const title = getFirstQueryValue(req.body?.title);
		const content = getFirstQueryValue(req.body?.content);
		const tags = Array.isArray(req.body?.tags)
			? req.body.tags.filter((value) => typeof value === "string" && value.trim().length > 0)
			: undefined;
		const sources = Array.isArray(req.body?.sources)
			? req.body.sources.filter((value) => typeof value === "string" && value.trim().length > 0)
			: undefined;

		try {
			const result = await saveSynthesisPageImpl({
				content,
				sources,
				tags,
				title,
				wikiDir,
			});
			return res.status(201).json({
				path: toRelativeWikiPath(result.path, llmWikiPaths.rootDir),
				slug: result.slug,
				title: result.title,
			});
		} catch (error) {
			if (error?.code === "INVALID_INPUT") {
				return res.status(400).json({
					error: error.message,
				});
			}

			return res.status(500).json({
				error: "Failed to save synthesis page",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async function handleWikiMemories(_req, res) {
		try {
			return res.json({
				memories: await getWikiMemoriesImpl(),
			});
		} catch (error) {
			return res.status(500).json({
				error: "Failed to load wiki memories",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	function resolveExplorerFilters(input) {
		const includeLinkedKnowledgeRaw = input?.includeLinkedKnowledge;
		return {
			includeLinkedKnowledge:
				includeLinkedKnowledgeRaw === false
					? false
					: getFirstQueryValue(includeLinkedKnowledgeRaw) !== "false",
			kind: getFirstQueryValue(input?.kind),
			scope: getFirstQueryValue(input?.scope),
			status: getFirstQueryValue(input?.status),
			tag: getFirstQueryValue(input?.tag),
			threadId: getFirstQueryValue(input?.threadId),
		};
	}

	async function handleWikiMemoryExplorer(req, res) {
		try {
			return res.json({
				explorer: await buildWikiMemoryExplorerImpl({
					filters: resolveExplorerFilters(req.query),
					wikiDir,
				}),
			});
		} catch (error) {
			return res.status(500).json({
				error: "Failed to build wiki memory explorer",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async function handleWikiMemoryExplorerExport(req, res) {
		const format = getFirstQueryValue(req.query?.format) === "csv" ? "csv" : "json";

		try {
			const explorer = await buildWikiMemoryExplorerImpl({
				filters: resolveExplorerFilters(req.query),
				wikiDir,
			});

			if (format === "csv") {
				res.setHeader("Content-Type", "text/csv; charset=utf-8");
				res.setHeader("Content-Disposition", 'attachment; filename="memory-explorer.csv"');
				return res.send(buildWikiMemoryExplorerCsvImpl(explorer));
			}

			res.setHeader("Content-Type", "application/json; charset=utf-8");
			res.setHeader("Content-Disposition", 'attachment; filename="memory-explorer.json"');
			return res.send(JSON.stringify(explorer, null, "\t"));
		} catch (error) {
			return res.status(500).json({
				error: "Failed to export wiki memory explorer",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async function handleWikiMemoryBrief(req, res) {
		try {
			const explorer = await buildWikiMemoryExplorerImpl({
				filters: resolveExplorerFilters(req.body?.filters),
				wikiDir,
			});
			return res.json({
				brief: {
					content: buildWikiMemoryBriefImpl({
						audience: getFirstQueryValue(req.body?.audience),
						explorer,
						selectedNodeIds: Array.isArray(req.body?.selectedNodeIds)
							? req.body.selectedNodeIds
							: [],
						title: getFirstQueryValue(req.body?.title) ?? "Memory Brief",
					}),
					format: "brief",
					generatedAt: new Date().toISOString(),
					selectedNodeIds: Array.isArray(req.body?.selectedNodeIds)
						? req.body.selectedNodeIds.filter((value) => typeof value === "string")
						: [],
					title: getFirstQueryValue(req.body?.title) ?? "Memory Brief",
				},
			});
		} catch (error) {
			return res.status(500).json({
				error: "Failed to generate wiki memory brief",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async function handleWikiMemoryDeck(req, res) {
		try {
			const explorer = await buildWikiMemoryExplorerImpl({
				filters: resolveExplorerFilters(req.body?.filters),
				wikiDir,
			});
			return res.json({
				deck: {
					content: buildWikiMemoryDeckImpl({
						explorer,
						selectedNodeIds: Array.isArray(req.body?.selectedNodeIds)
							? req.body.selectedNodeIds
							: [],
						title: getFirstQueryValue(req.body?.title) ?? "Memory Explorer Deck",
					}),
					format: "deck",
					generatedAt: new Date().toISOString(),
					selectedNodeIds: Array.isArray(req.body?.selectedNodeIds)
						? req.body.selectedNodeIds.filter((value) => typeof value === "string")
						: [],
					title: getFirstQueryValue(req.body?.title) ?? "Memory Explorer Deck",
				},
			});
		} catch (error) {
			return res.status(500).json({
				error: "Failed to generate wiki memory deck",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async function handleWikiMemoryBlockDelete(req, res) {
		const revision = typeof req.body?.revision === "string" && req.body.revision.trim().length > 0
			? req.body.revision.trim()
			: null;
		if (!revision) {
			return res.status(400).json({
				error: "A canonical memory revision is required.",
			});
		}

		try {
			const result = await deleteWikiMemoryBlockImpl({
				blockId: req.params?.blockId,
				logger,
				revision,
				scope: req.params?.scope,
			});
			return res.json({
				memories: result.memories,
				removedBlock: result.removedBlock,
				wiki: await getWikiStatusImpl(),
			});
		} catch (error) {
			if (error?.code === "INVALID_INPUT") {
				return res.status(400).json({
					error: error.message,
				});
			}
			if (error?.code === "NOT_FOUND") {
				return res.status(404).json({
					error: error.message,
				});
			}
			if (error?.code === "REVISION_CONFLICT") {
				return res.status(409).json({
					error: error.message,
				});
			}

			return res.status(500).json({
				error: "Failed to delete wiki memory block",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async function handleWikiMemoryProposalDelete(req, res) {
		try {
			const result = await deleteWikiMemoryProposalImpl({
				logger,
				proposalId: req.params?.proposalId,
			});
			return res.json({
				memories: result.memories,
				proposal: result.proposal,
				wiki: await getWikiStatusImpl(),
			});
		} catch (error) {
			if (error?.code === "INVALID_INPUT") {
				return res.status(400).json({
					error: error.message,
				});
			}
			if (error?.code === "NOT_FOUND") {
				return res.status(404).json({
					error: error.message,
				});
			}

			return res.status(500).json({
				error: "Failed to delete wiki memory proposal",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	async function handleWikiSync(req, res) {
		try {
			const force = req.body?.force !== false;
			const collections = Array.isArray(req.body?.collections)
				? req.body.collections.filter((value) => typeof value === "string" && value.trim().length > 0)
				: undefined;
			const memorySync = await syncWikiMemoryImpl({
				force,
				logger,
			});
			const collectionNames =
				Array.isArray(collections) && collections.length > 0
					? collections
					: Array.isArray(memorySync?.updatedCollections) && memorySync.updatedCollections.length > 0
						? memorySync.updatedCollections
						: undefined;
			const sync = await ensureFreshWikiQmdIndexImpl({
				collectionNames,
				force: force || memorySync?.processed > 0,
				logger,
			});
			const lint = await lintWikiImpl({ wikiDir });
			return res.json({
				lint,
				memory: memorySync,
				qmd: sync.summary ?? await getQmdSyncSummaryImpl(),
				sync,
			});
		} catch (error) {
			return res.status(500).json({
				error: "Failed to sync wiki index",
				details: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return {
		handleWikiCapture,
		handleWikiMemoryBrief,
		handleWikiMemoryDeck,
		handleWikiMemoryExplorer,
		handleWikiMemoryExplorerExport,
		handleWikiMemories,
		handleWikiMemoryBlockDelete,
		handleWikiMemoryProposalDelete,
		handleWikiSearch,
		handleWikiSynthesisSave,
		handleWikiStatus,
		handleWikiSync,
	};
}

module.exports = {
	createWikiRouteHandlers,
	getFirstQueryValue,
};
