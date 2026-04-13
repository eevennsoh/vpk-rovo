"use strict";

const {
	getPositiveInteger,
} = require("./shared-utils");

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

function createWikiRouteHandlers({
	deleteWikiMemoryBlockImpl,
	deleteWikiMemoryProposalImpl,
	ensureFreshWikiQmdIndexImpl,
	getQmdSyncSummaryImpl,
	getWikiMemoriesImpl,
	getWikiStatusImpl,
	logger = console,
	normalizeNaiveWikiSearchResultsImpl,
	queryWikiImpl,
	searchWikiWithQmdImpl,
	syncWikiMemoryImpl,
} = {}) {
	if (typeof getWikiStatusImpl !== "function") {
		throw new Error("createWikiRouteHandlers requires getWikiStatusImpl");
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
			return res.json({
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
		handleWikiMemories,
		handleWikiMemoryBlockDelete,
		handleWikiMemoryProposalDelete,
		handleWikiSearch,
		handleWikiStatus,
		handleWikiSync,
	};
}

module.exports = {
	createWikiRouteHandlers,
	getFirstQueryValue,
};
