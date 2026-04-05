const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");

const {
	applyRovoAppArtifactTitleRename,
	deriveRovoAppVersionChangeLabel,
} = require("./rovo-app-artifact-updates");
const {
	fallbackRovoAppArtifactIntent,
} = require("./rovo-app-artifact-intent");
const {
	createRovoAppDocumentManager,
} = require("./rovo-app-documents");
const {
	resolveRovoAppActiveArtifact,
} = require("./rovo-app-artifact-routing");
const {
	createRovoAppThreadManager,
} = require("./rovo-app-threads");

async function createTempBaseDir() {
	return fs.mkdtemp(path.join(os.tmpdir(), "rovo-app-artifact-routing-"));
}

test("resolveRovoAppActiveArtifact falls back to the persisted thread artifact", async () => {
	const baseDir = await createTempBaseDir();
	const rovoAppDocumentManager = createRovoAppDocumentManager({ baseDir });
	const rovoAppThreadManager = createRovoAppThreadManager({ baseDir, logger: console });

	const document = await rovoAppDocumentManager.createDocument({
		threadId: "thread-1",
		title: "Apple",
		kind: "text",
		content: "# Apple\n\nOriginal content",
	});
	await rovoAppThreadManager.createThread({
		id: "thread-1",
		title: "Create me a page about Apple",
		activeDocumentId: document.id,
	});

	const result = await resolveRovoAppActiveArtifact({
		rovoAppDocumentManager,
		rovoAppThreadManager,
		threadId: "thread-1",
	});

	assert.equal(result.activeArtifact?.id, document.id);
	assert.equal(result.activeArtifact?.title, "Apple");
	assert.match(result.activeArtifact?.content ?? "", /Original content/);
});

test("resolveRovoAppActiveArtifact keeps the freshest request draft content", async () => {
	const baseDir = await createTempBaseDir();
	const rovoAppDocumentManager = createRovoAppDocumentManager({ baseDir });
	const rovoAppThreadManager = createRovoAppThreadManager({ baseDir, logger: console });

	const document = await rovoAppDocumentManager.createDocument({
		threadId: "thread-1",
		title: "Apple",
		kind: "text",
		content: "# Apple\n\nPersisted content",
	});
	await rovoAppThreadManager.createThread({
		id: "thread-1",
		title: "Create me a page about Apple",
		activeDocumentId: document.id,
	});

	const result = await resolveRovoAppActiveArtifact({
		activeDocumentId: document.id,
		artifactContext: {
			id: document.id,
			title: "Apple",
			kind: "text",
			content: "# Apple\n\nUnsaved draft content",
		},
		rovoAppDocumentManager,
		rovoAppThreadManager,
		threadId: "thread-1",
	});

	assert.equal(result.activeArtifact?.id, document.id);
	assert.match(result.activeArtifact?.content ?? "", /Unsaved draft content/);
});

test("rename-style follow-ups append versions instead of creating a new artifact", async () => {
	const baseDir = await createTempBaseDir();
	const rovoAppDocumentManager = createRovoAppDocumentManager({ baseDir });
	const rovoAppThreadManager = createRovoAppThreadManager({ baseDir, logger: console });

	const thread = await rovoAppThreadManager.createThread({
		id: "thread-1",
		title: "Create me a page about Apple",
	});
	const createdDocument = await rovoAppDocumentManager.createDocument({
		threadId: thread.id,
		title: "Apple",
		kind: "text",
		content: "Apple is one of the world's most influential technology companies.",
	});
	await rovoAppThreadManager.updateThread(thread.id, {
		activeDocumentId: createdDocument.id,
	});

	const titleAdditionState = await resolveRovoAppActiveArtifact({
		rovoAppDocumentManager,
		rovoAppThreadManager,
		threadId: thread.id,
	});
	const titleAdditionIntent = fallbackRovoAppArtifactIntent({
		activeArtifact: titleAdditionState.activeArtifact,
		latestUserMessage: "Can you add the title about this page?",
	});

	assert.equal(titleAdditionIntent.action, "updateDocument");

	const secondVersion = await rovoAppDocumentManager.appendDocumentVersion(
		createdDocument.id,
		{
			changeLabel: deriveRovoAppVersionChangeLabel({
				artifactAction: "updateDocument",
				latestUserMessage: "Can you add the title about this page?",
				nextTitle: "Apple",
				previousTitle: createdDocument.title,
			}),
			title: "Apple",
			content: "# Apple\n\nApple is one of the world's most influential technology companies.",
		},
	);
	assert.ok(secondVersion);
	await rovoAppThreadManager.updateThread(thread.id, {
		activeDocumentId: createdDocument.id,
	});

	const renameState = await resolveRovoAppActiveArtifact({
		rovoAppDocumentManager,
		rovoAppThreadManager,
		threadId: thread.id,
	});
	const renameIntent = fallbackRovoAppArtifactIntent({
		activeArtifact: renameState.activeArtifact,
		latestUserMessage: "Change the title to Apple Future",
	});

	assert.equal(renameIntent.action, "updateDocument");
	assert.equal(renameIntent.title, "Apple Future");

	const renamedContent = applyRovoAppArtifactTitleRename({
		content: secondVersion.versions.at(-1)?.content ?? "",
		nextTitle: renameIntent.title,
		previousTitle: secondVersion.title,
	});
	const renamedDocument = await rovoAppDocumentManager.appendDocumentVersion(
		createdDocument.id,
		{
			changeLabel: deriveRovoAppVersionChangeLabel({
				artifactAction: "updateDocument",
				latestUserMessage: "Change the title to Apple Future",
				nextTitle: renameIntent.title,
				previousTitle: secondVersion.title,
			}),
			title: renameIntent.title,
			content: renamedContent,
		},
	);
	assert.ok(renamedDocument);
	await rovoAppThreadManager.updateThread(thread.id, {
		activeDocumentId: createdDocument.id,
	});

	const listedDocuments = await rovoAppDocumentManager.listDocuments({
		threadId: thread.id,
	});
	const updatedThread = await rovoAppThreadManager.getThread(thread.id);

	assert.equal(listedDocuments.length, 1);
	assert.equal(listedDocuments[0].id, createdDocument.id);
	assert.equal(listedDocuments[0].versions.length, 3);
	assert.equal(listedDocuments[0].title, "Apple Future");
	assert.equal(listedDocuments[0].versions[2].title, "Apple Future");
	assert.match(listedDocuments[0].versions[2].content, /^# Apple Future/m);
	assert.equal(updatedThread?.activeDocumentId, createdDocument.id);
});
