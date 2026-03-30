const path = require("node:path");

function getFutureChatRootDir(baseDir) {
	return path.join(baseDir, "future-chat");
}

function getFutureChatThreadsRootDir(baseDir) {
	return path.join(getFutureChatRootDir(baseDir), "threads");
}

function getFutureChatIndicesRootDir(baseDir) {
	return path.join(getFutureChatRootDir(baseDir), "indices");
}

function getFutureChatLegacyDocumentsDir(baseDir) {
	return path.join(getFutureChatRootDir(baseDir), "documents");
}

function getFutureChatLegacyVotesDir(baseDir) {
	return path.join(getFutureChatRootDir(baseDir), "votes");
}

function getFutureChatLegacyUploadsRootDir(baseDir) {
	return path.join(getFutureChatRootDir(baseDir), "uploads");
}

function normalizeThreadId(threadId) {
	return typeof threadId === "string" && threadId.trim() ? threadId.trim() : null;
}

function normalizeRepoRelativePath(requestedPath) {
	if (typeof requestedPath !== "string") {
		return null;
	}

	const normalizedSlashes = requestedPath.trim().replace(/\\/g, "/");
	if (!normalizedSlashes || normalizedSlashes.startsWith("/")) {
		return null;
	}

	const withoutLeadingDots = normalizedSlashes.replace(/^(?:\.\/*)+/u, "");
	if (!withoutLeadingDots) {
		return null;
	}

	const normalizedPath = path.posix.normalize(withoutLeadingDots);
	if (
		normalizedPath === "." ||
		normalizedPath === ".." ||
		normalizedPath.startsWith("../") ||
		normalizedPath.includes("/../")
	) {
		return null;
	}

	return normalizedPath;
}

function buildFutureChatThreadPaths(baseDir, threadId) {
	const normalizedThreadId = normalizeThreadId(threadId);
	if (!normalizedThreadId) {
		throw new Error("A non-empty Future Chat threadId is required.");
	}

	const threadsRootDir = getFutureChatThreadsRootDir(baseDir);
	const threadDir = path.join(threadsRootDir, normalizedThreadId);
	const workspaceDir = path.join(threadDir, "workspace");
	const workspaceSourceDir = path.join(workspaceDir, "source");

	return {
		threadDir,
		threadFilePath: path.join(threadDir, "thread.json"),
		generatedFilesPath: path.join(threadDir, "generated-files.json"),
		votesFilePath: path.join(threadDir, "votes.json"),
		documentsDir: path.join(threadDir, "documents"),
		uploadsDir: path.join(threadDir, "uploads"),
		workspaceDir,
		workspaceSourceDir,
	};
}

function buildFutureChatWorkspacePath(baseDir, threadId, requestedPath) {
	const workspaceRelativePath = buildFutureChatWorkspaceRelativePath(requestedPath);
	if (!workspaceRelativePath) {
		return null;
	}

	const { threadDir } = buildFutureChatThreadPaths(baseDir, threadId);
	return path.join(threadDir, workspaceRelativePath);
}

function buildFutureChatWorkspaceRelativePath(requestedPath) {
	const normalizedPath = normalizeRepoRelativePath(requestedPath);
	if (!normalizedPath) {
		return null;
	}

	return path.posix.join("workspace", "source", `${normalizedPath}.snapshot`);
}

module.exports = {
	buildFutureChatThreadPaths,
	buildFutureChatWorkspacePath,
	buildFutureChatWorkspaceRelativePath,
	getFutureChatRootDir,
	getFutureChatThreadsRootDir,
	getFutureChatIndicesRootDir,
	getFutureChatLegacyDocumentsDir,
	getFutureChatLegacyVotesDir,
	getFutureChatLegacyUploadsRootDir,
	normalizeThreadId,
	normalizeRepoRelativePath,
};
