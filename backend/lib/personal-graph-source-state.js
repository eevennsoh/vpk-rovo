"use strict";

const fs = require("node:fs");
const path = require("node:path");

const DEFAULT_SOURCE_PATH = path.join(__dirname, "..", "..", ".tmp", "personal-graph", "source.json");
const SOURCE_PATH_ENV_KEY = "PERSONAL_GRAPH_SOURCE_PATH";
const VALID_SOURCES = ["vault", "twg"];

function resolveSourcePath(override) {
	if (typeof override === "string" && override.trim()) {
		return path.resolve(override);
	}
	const fromEnv = process.env[SOURCE_PATH_ENV_KEY];
	if (typeof fromEnv === "string" && fromEnv.trim()) {
		return path.resolve(fromEnv);
	}
	return DEFAULT_SOURCE_PATH;
}

function getActiveSource({ sourcePath } = {}) {
	const resolvedPath = resolveSourcePath(sourcePath);
	let raw;
	try {
		raw = fs.readFileSync(resolvedPath, "utf8");
	} catch (error) {
		if (error?.code === "ENOENT") return "vault";
		throw error;
	}
	try {
		const parsed = JSON.parse(raw);
		const candidate = parsed?.source;
		if (VALID_SOURCES.includes(candidate)) return candidate;
		return "vault";
	} catch {
		return "vault";
	}
}

function setActiveSource(source, { sourcePath } = {}) {
	if (!VALID_SOURCES.includes(source)) {
		throw new Error(`Invalid graph source: ${source}. Expected one of: ${VALID_SOURCES.join(", ")}`);
	}
	const resolvedPath = resolveSourcePath(sourcePath);
	fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
	const tempPath = `${resolvedPath}.tmp`;
	fs.writeFileSync(tempPath, JSON.stringify({ source }), "utf8");
	fs.renameSync(tempPath, resolvedPath);
	return source;
}

module.exports = {
	DEFAULT_SOURCE_PATH,
	SOURCE_PATH_ENV_KEY,
	VALID_SOURCES,
	getActiveSource,
	resolveSourcePath,
	setActiveSource,
};
