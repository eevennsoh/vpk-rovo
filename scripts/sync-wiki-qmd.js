"use strict";

const {
	QMD_COLLECTION_NAMES,
	syncWikiQmdIndex,
} = require("../backend/lib/qmd");

async function main() {
	const requestedCollections = process.argv.slice(2);
	const collectionNames = requestedCollections.length > 0
		? requestedCollections
		: undefined;
	const result = await syncWikiQmdIndex({
		collectionNames,
		logger: console,
	});

	console.log(JSON.stringify({
		collections: result.collections,
		dbPath: result.dbPath,
		embeddedDocs: result.embedResult?.embedded ?? 0,
		needsEmbedding: result.status?.needsEmbedding ?? 0,
		totalDocuments: result.status?.totalDocuments ?? 0,
		updated: result.updateResult,
		validCollections: QMD_COLLECTION_NAMES,
	}, null, "\t"));
}

main().catch((error) => {
	console.error(
		"[qmd-sync] Failed to sync wiki index:",
		error instanceof Error ? error.message : error,
	);
	process.exitCode = 1;
});
