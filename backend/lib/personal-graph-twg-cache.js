"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_CACHE_PATH = path.join(__dirname, "..", "..", ".tmp", "personal-graph", "twg-cache.json");
const CACHE_PATH_ENV_KEY = "PERSONAL_GRAPH_TWG_CACHE_PATH";

function resolveCachePath(override) {
	if (typeof override === "string" && override.trim()) {
		return path.resolve(override);
	}
	const fromEnv = process.env[CACHE_PATH_ENV_KEY];
	if (typeof fromEnv === "string" && fromEnv.trim()) {
		return path.resolve(fromEnv);
	}
	return DEFAULT_CACHE_PATH;
}

function readCache({ cachePath } = {}) {
	const resolvedPath = resolveCachePath(cachePath);
	let raw;
	try {
		raw = fs.readFileSync(resolvedPath, "utf8");
	} catch (error) {
		if (error?.code === "ENOENT") return null;
		throw error;
	}
	try {
		const parsed = JSON.parse(raw);
		if (!parsed || typeof parsed !== "object") {
			fs.rmSync(resolvedPath, { force: true });
			return null;
		}
		return parsed;
	} catch {
		// Corrupted file: clean it so the next read is a fresh miss, not a recurring throw.
		fs.rmSync(resolvedPath, { force: true });
		return null;
	}
}

function writeCache(explorer, { cachePath } = {}) {
	const resolvedPath = resolveCachePath(cachePath);
	fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
	const tempPath = `${resolvedPath}.tmp`;
	fs.writeFileSync(tempPath, JSON.stringify(explorer), "utf8");
	fs.renameSync(tempPath, resolvedPath);
	return resolvedPath;
}

function clearCache({ cachePath } = {}) {
	const resolvedPath = resolveCachePath(cachePath);
	fs.rmSync(resolvedPath, { force: true });
}

module.exports = {
	CACHE_PATH_ENV_KEY,
	DEFAULT_CACHE_PATH,
	clearCache,
	readCache,
	resolveCachePath,
	writeCache,
};
