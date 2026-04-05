const fs = require("node:fs/promises");
const path = require("node:path");
const { execFile } = require("node:child_process");

const {
	buildRovoAppThreadPaths,
	buildRovoAppWorkspacePath,
	buildRovoAppWorkspaceRelativePath,
	normalizeRepoRelativePath,
} = require("./rovo-app-storage-paths");
const { getNonEmptyString, isPlainObject } = require("./shared-utils");

const WRITE_TOOL_NAMES = new Set([
	"create_file",
	"write_to_file",
	"find_and_replace_code",
	"move_file",
	"delete_file",
]);

const PATH_KEYS = [
	"path",
	"file_path",
	"old_path",
	"new_path",
	"source_path",
	"destination_path",
	"target_path",
];

const FILE_PATH_PATTERN =
	/(?:app|components|lib|hooks|types|public|styles)\/[^\s"'`]+?\.(?:tsx|ts|jsx|js|css|md|json|svg|png|jpg|jpeg|webp|txt|yaml|yml)/gu;

function safeJsonParse(rawValue) {
	try {
		return JSON.parse(rawValue);
	} catch {
		return null;
	}
}

function normalizeGeneratedFileEntry(rawEntry) {
	if (!rawEntry || typeof rawEntry !== "object") {
		return null;
	}

	const requestedPath = normalizeRepoRelativePath(rawEntry.requestedPath);
	if (!requestedPath) {
		return null;
	}

	const workspacePath =
		buildRovoAppWorkspaceRelativePath(requestedPath)
		|| getNonEmptyString(rawEntry.workspacePath);
	return {
		requestedPath,
		workspacePath,
		ownershipSource:
			getNonEmptyString(rawEntry.ownershipSource) || "tool_result",
		toolName: getNonEmptyString(rawEntry.toolName),
		toolCallId: getNonEmptyString(rawEntry.toolCallId),
		firstObservedAt:
			getNonEmptyString(rawEntry.firstObservedAt) || new Date().toISOString(),
		lastObservedAt:
			getNonEmptyString(rawEntry.lastObservedAt)
			|| getNonEmptyString(rawEntry.firstObservedAt)
			|| new Date().toISOString(),
	};
}

function collectPathsFromText(text, foundPaths) {
	if (typeof text !== "string" || !text.trim()) {
		return;
	}

	const matches = text.match(FILE_PATH_PATTERN) || [];
	for (const match of matches) {
		const normalizedPath = normalizeRepoRelativePath(match);
		if (normalizedPath) {
			foundPaths.add(normalizedPath);
		}
	}
}

function collectPathsFromUnknown(value, foundPaths, depth = 0) {
	if (value === null || value === undefined || depth > 3) {
		return;
	}

	if (typeof value === "string") {
		collectPathsFromText(value, foundPaths);
		return;
	}

	if (Array.isArray(value)) {
		for (const entry of value.slice(0, 20)) {
			collectPathsFromUnknown(entry, foundPaths, depth + 1);
		}
		return;
	}

	if (!isPlainObject(value)) {
		return;
	}

	for (const key of PATH_KEYS) {
		const normalizedPath = normalizeRepoRelativePath(value[key]);
		if (normalizedPath) {
			foundPaths.add(normalizedPath);
		}
	}

	for (const nestedValue of Object.values(value).slice(0, 20)) {
		collectPathsFromUnknown(nestedValue, foundPaths, depth + 1);
	}
}

function extractGeneratedFilesFromObservation(observation) {
	if (!observation || typeof observation !== "object") {
		return [];
	}

	const toolName = getNonEmptyString(observation.toolName);
	if (!toolName || !WRITE_TOOL_NAMES.has(toolName)) {
		return [];
	}

	const phase = getNonEmptyString(observation.phase);
	if (phase !== "result") {
		return [];
	}

	const foundPaths = new Set();
	collectPathsFromUnknown(observation.rawOutput, foundPaths);
	collectPathsFromUnknown(observation.output, foundPaths);
	collectPathsFromUnknown(observation.outputPreview, foundPaths);
	collectPathsFromText(observation.text, foundPaths);

	const observedAt = getNonEmptyString(observation.timestamp) || new Date().toISOString();
	return [...foundPaths].map((requestedPath) =>
		normalizeGeneratedFileEntry({
			requestedPath,
			workspacePath: buildRovoAppWorkspaceRelativePath(requestedPath),
			ownershipSource: observation.rawOutput && typeof observation.rawOutput === "object"
				? "tool_raw_output"
				: "tool_result",
			toolName,
			toolCallId: observation.toolCallId,
			firstObservedAt: observedAt,
			lastObservedAt: observedAt,
		})
	).filter(Boolean);
}

function extractGeneratedFilesFromThread(thread) {
	if (!thread || typeof thread !== "object" || !Array.isArray(thread.messages)) {
		return [];
	}

	const entries = [];
	for (const message of thread.messages) {
		if (!message || typeof message !== "object" || !Array.isArray(message.parts)) {
			continue;
		}

		for (const part of message.parts) {
			if (!part || part.type !== "data-thinking-event" || !isPlainObject(part.data)) {
				continue;
			}

			entries.push(...extractGeneratedFilesFromObservation(part.data));
		}
	}

	return entries;
}

function createRovoAppGeneratedFilesManager({
	baseDir,
	projectRoot,
	logger = console,
} = {}) {
	const resolvedProjectRoot = path.resolve(projectRoot);

	const readManifest = async (threadId) => {
		const { generatedFilesPath } = buildRovoAppThreadPaths(baseDir, threadId);

		try {
			const raw = await fs.readFile(generatedFilesPath, "utf8");
			const parsed = safeJsonParse(raw);
			if (!Array.isArray(parsed)) {
				return [];
			}

			return parsed.map(normalizeGeneratedFileEntry).filter(Boolean);
		} catch (error) {
			if (error && error.code === "ENOENT") {
				return [];
			}

			throw error;
		}
	};

	const writeManifest = async (threadId, entries) => {
		const { generatedFilesPath } = buildRovoAppThreadPaths(baseDir, threadId);
		await fs.mkdir(path.dirname(generatedFilesPath), { recursive: true });
		await fs.writeFile(
			generatedFilesPath,
			`${JSON.stringify(entries, null, 2)}\n`,
			"utf8",
		);
	};

	const upsertGeneratedFiles = async (threadId, entries) => {
		const normalizedEntries = Array.isArray(entries)
			? entries.map(normalizeGeneratedFileEntry).filter(Boolean)
			: [];
		if (normalizedEntries.length === 0) {
			return readManifest(threadId);
		}

		const existingEntries = await readManifest(threadId);
		const entriesByPath = new Map(
			existingEntries.map((entry) => [entry.requestedPath, entry]),
		);

		for (const nextEntry of normalizedEntries) {
			const existingEntry = entriesByPath.get(nextEntry.requestedPath);
			if (!existingEntry) {
				entriesByPath.set(nextEntry.requestedPath, nextEntry);
				continue;
			}

			entriesByPath.set(nextEntry.requestedPath, {
				...existingEntry,
				ownershipSource: existingEntry.ownershipSource || nextEntry.ownershipSource,
				toolName: existingEntry.toolName || nextEntry.toolName,
				toolCallId: existingEntry.toolCallId || nextEntry.toolCallId,
				workspacePath: existingEntry.workspacePath || nextEntry.workspacePath,
				firstObservedAt: existingEntry.firstObservedAt || nextEntry.firstObservedAt,
				lastObservedAt: nextEntry.lastObservedAt || existingEntry.lastObservedAt,
			});
		}

		const mergedEntries = [...entriesByPath.values()].sort((left, right) =>
			left.requestedPath.localeCompare(right.requestedPath),
		);
		await writeManifest(threadId, mergedEntries);
		return mergedEntries;
	};

	const backfillFromThread = async (thread) => {
		const threadId = getNonEmptyString(thread?.id);
		if (!threadId) {
			return [];
		}

		return upsertGeneratedFiles(threadId, extractGeneratedFilesFromThread(thread));
	};

	const seedGeneratedFiles = async (
		threadId,
		requestedPaths,
		ownershipSource = "legacy_user_confirmed",
	) => {
		const seededEntries = Array.isArray(requestedPaths)
			? requestedPaths.map((requestedPath) =>
				normalizeGeneratedFileEntry({
					requestedPath,
					workspacePath: buildRovoAppWorkspaceRelativePath(requestedPath),
					ownershipSource,
				})
			).filter(Boolean)
			: [];

		return upsertGeneratedFiles(threadId, seededEntries);
	};

	const isGitTracked = async (requestedPath) =>
		new Promise((resolve, reject) => {
			execFile(
				"git",
				["ls-files", "--error-unmatch", "--", requestedPath],
				{ cwd: resolvedProjectRoot, maxBuffer: 1024 * 1024 },
				(error) => {
					if (!error) {
						resolve(true);
						return;
					}

					if (error.code === 1) {
						resolve(false);
						return;
					}

					if (error.code === 128) {
						resolve(false);
						return;
					}

					reject(error);
				},
			);
		});

	const removeEmptyParentDirectories = async (startingDir) => {
		let currentDir = startingDir;

		while (
			currentDir.startsWith(`${resolvedProjectRoot}${path.sep}`)
			&& currentDir !== resolvedProjectRoot
		) {
			try {
				const entries = await fs.readdir(currentDir);
				if (entries.length > 0) {
					return;
				}
				await fs.rmdir(currentDir);
				currentDir = path.dirname(currentDir);
			} catch {
				return;
			}
		}
	};

	const moveRootFileToWorkspace = async (threadId, requestedPath) => {
		const normalizedPath = normalizeRepoRelativePath(requestedPath);
		if (!normalizedPath) {
			return false;
		}

		const sourcePath = path.join(resolvedProjectRoot, normalizedPath);
		const destinationPath = buildRovoAppWorkspacePath(baseDir, threadId, normalizedPath);
		if (!destinationPath) {
			return false;
		}

		try {
			const sourceStat = await fs.stat(sourcePath);
			if (!sourceStat.isFile()) {
				return false;
			}
		} catch (error) {
			if (error && error.code === "ENOENT") {
				return false;
			}

			throw error;
		}

		if (await isGitTracked(normalizedPath)) {
			logger.info?.(`[FUTURE-CHAT] Skipping tracked generated file migration: ${normalizedPath}`);
			return false;
		}

		await fs.mkdir(path.dirname(destinationPath), { recursive: true });
		await fs.rm(destinationPath, { force: true });

		try {
			await fs.rename(sourcePath, destinationPath);
		} catch (error) {
			if (error && error.code !== "EXDEV") {
				throw error;
			}

			await fs.copyFile(sourcePath, destinationPath);
			await fs.rm(sourcePath, { force: true });
		}

		await removeEmptyParentDirectories(path.dirname(sourcePath));
		return true;
	};

	const copyRootFileToWorkspace = async (threadId, requestedPath) => {
		const normalizedPath = normalizeRepoRelativePath(requestedPath);
		if (!normalizedPath) {
			return false;
		}

		const sourcePath = path.join(resolvedProjectRoot, normalizedPath);
		const destinationPath = buildRovoAppWorkspacePath(baseDir, threadId, normalizedPath);
		if (!destinationPath) {
			return false;
		}

		try {
			const sourceStat = await fs.stat(sourcePath);
			if (!sourceStat.isFile()) {
				return false;
			}
		} catch (error) {
			if (error && error.code === "ENOENT") {
				return false;
			}

			throw error;
		}

		await fs.mkdir(path.dirname(destinationPath), { recursive: true });
		await fs.copyFile(sourcePath, destinationPath);
		return true;
	};

	const syncThreadWorkspace = async (threadId) => {
		const manifestEntries = await readManifest(threadId);
		let movedCount = 0;
		for (const entry of manifestEntries) {
			if (await moveRootFileToWorkspace(threadId, entry.requestedPath)) {
				movedCount += 1;
			}
		}

		return { movedCount, entries: manifestEntries };
	};

	const captureRootFilesToWorkspace = async (threadId) => {
		const manifestEntries = await readManifest(threadId);
		let copiedCount = 0;
		for (const entry of manifestEntries) {
			if (await copyRootFileToWorkspace(threadId, entry.requestedPath)) {
				copiedCount += 1;
			}
		}

		return { copiedCount, entries: manifestEntries };
	};

	const deleteLegacyRootFiles = async (threadId) => {
		const manifestEntries = await readManifest(threadId);
		let deletedCount = 0;
		for (const entry of manifestEntries) {
			const normalizedPath = normalizeRepoRelativePath(entry.requestedPath);
			if (!normalizedPath) {
				continue;
			}

			if (await isGitTracked(normalizedPath)) {
				continue;
			}

			const absolutePath = path.join(resolvedProjectRoot, normalizedPath);
			try {
				await fs.rm(absolutePath, { force: true });
				await removeEmptyParentDirectories(path.dirname(absolutePath));
				deletedCount += 1;
			} catch {
				// Best effort cleanup.
			}
		}

		return deletedCount;
	};

	return {
		readManifest,
		upsertGeneratedFiles,
		backfillFromThread,
		seedGeneratedFiles,
		captureRootFilesToWorkspace,
		syncThreadWorkspace,
		deleteLegacyRootFiles,
	};
}

module.exports = {
	WRITE_TOOL_NAMES,
	createRovoAppGeneratedFilesManager,
	extractGeneratedFilesFromObservation,
	extractGeneratedFilesFromThread,
};
