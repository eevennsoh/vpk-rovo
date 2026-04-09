const crypto = require("node:crypto");
const fs = require("node:fs/promises");

const {
	getHermesMemoryLimit,
	getHermesMemoryPath,
} = require("./hermes-config");

const ENTRY_DELIMITER = "\n§\n";
const TARGET_SET = new Set(["memory", "user"]);

function normalizeMemoryText(rawText) {
	return typeof rawText === "string"
		? rawText.replace(/\r\n?/gu, "\n")
		: "";
}

function createMemoryEntryId(content, order) {
	return crypto
		.createHash("sha1")
		.update(`${order}:${content}`)
		.digest("hex")
		.slice(0, 12);
}

function parseHermesMemoryEntries(rawText) {
	const normalizedText = normalizeMemoryText(rawText).trim();
	if (!normalizedText) {
		return [];
	}

	return normalizedText
		.split(ENTRY_DELIMITER)
		.map((entry) => entry.trim())
		.filter(Boolean)
		.map((content, order) => ({
			charCount: content.length,
			content,
			id: createMemoryEntryId(content, order),
			order,
		}));
}

function serializeHermesMemoryEntries(entries) {
	const serializedEntries = entries
		.map((entry) => typeof entry === "string" ? entry.trim() : entry?.content?.trim() ?? "")
		.filter(Boolean);
	if (serializedEntries.length === 0) {
		return "";
	}

	return `${serializedEntries.join(ENTRY_DELIMITER)}\n`;
}

async function readMemoryText(target) {
	const filePath = getHermesMemoryPath(target);
	try {
		const [text, stats] = await Promise.all([
			fs.readFile(filePath, "utf8"),
			fs.stat(filePath),
		]);
		return {
			text,
			updatedAt: stats.mtime.toISOString(),
		};
	} catch (error) {
		if (error && error.code === "ENOENT") {
			return null;
		}

		throw error;
	}
}

function toMemoryRecord(target, rawMemory) {
	const rawText = rawMemory?.text ?? "";
	const resolvedEntries = parseHermesMemoryEntries(rawText);
	return {
		charCount: normalizeMemoryText(rawText ?? "").trim().length,
		entries: resolvedEntries,
		exists: rawMemory !== null,
		label: target === "user" ? "User memory" : "Core memory",
		limit: getHermesMemoryLimit(target),
		path: getHermesMemoryPath(target),
		target,
		updatedAt: rawMemory?.updatedAt ?? null,
	};
}

async function getHermesMemory(target) {
	const rawText = await readMemoryText(target);
	return toMemoryRecord(target, rawText);
}

async function listHermesMemories() {
	const [memory, user] = await Promise.all([
		getHermesMemory("memory"),
		getHermesMemory("user"),
	]);
	return [memory, user];
}

function normalizeHermesMemoryTarget(rawTarget) {
	return typeof rawTarget === "string" && TARGET_SET.has(rawTarget)
		? rawTarget
		: null;
}

async function writeHermesMemory(target, nextEntries) {
	const serializedEntries = serializeHermesMemoryEntries(nextEntries);
	const filePath = getHermesMemoryPath(target);
	await fs.mkdir(require("node:path").dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, serializedEntries, "utf8");
	return getHermesMemory(target);
}

function normalizeReplaceInput(input) {
	if (typeof input?.content === "string") {
		return parseHermesMemoryEntries(input.content).map((entry) => entry.content);
	}

	if (Array.isArray(input?.entries)) {
		return input.entries
			.map((entry) => typeof entry === "string" ? entry : entry?.content)
			.filter((entry) => typeof entry === "string" && entry.trim().length > 0);
	}

	return [];
}

async function replaceHermesMemory(target, input) {
	return writeHermesMemory(target, normalizeReplaceInput(input));
}

async function addHermesMemoryEntry(target, input) {
	const content = typeof input?.content === "string" ? input.content.trim() : "";
	if (!content) {
		const error = new Error("Memory entry content is required.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	const currentRecord = await getHermesMemory(target);
	const nextEntries = [...currentRecord.entries.map((entry) => entry.content), content];
	return writeHermesMemory(target, nextEntries);
}

async function removeHermesMemoryEntry(target, entryId) {
	const currentRecord = await getHermesMemory(target);
	const nextEntries = currentRecord.entries.filter((entry) => entry.id !== entryId);
	if (nextEntries.length === currentRecord.entries.length) {
		const error = new Error(`Memory entry ${entryId} was not found.`);
		error.code = "ENOENT";
		throw error;
	}

	return writeHermesMemory(target, nextEntries.map((entry) => entry.content));
}

function getHermesMemoryUsageSummary(record) {
	return {
		charCount: record.charCount,
		exists: record.exists,
		label: record.label,
		limit: record.limit,
		path: record.path,
		target: record.target,
		usagePercent:
			typeof record.limit === "number" && record.limit > 0
				? Math.min(100, Math.round((record.charCount / record.limit) * 100))
				: null,
	};
}

function buildMemoryRecordResponse(record) {
	return {
		...getHermesMemoryUsageSummary(record),
		content: serializeHermesMemoryEntries(record.entries).trim(),
		entries: record.entries,
	};
}

async function readHermesMemoryRecord(target) {
	return buildMemoryRecordResponse(await getHermesMemory(target));
}

async function listHermesMemoryRecords() {
	const records = await listHermesMemories();
	return records.map(buildMemoryRecordResponse);
}

async function mutateHermesMemoryRecord(target, mutation) {
	const action = mutation?.action;
	if (action === "set") {
		return buildMemoryRecordResponse(await replaceHermesMemory(target, mutation));
	}

	if (action === "remove") {
		if (typeof mutation?.index === "number") {
			const currentRecord = await getHermesMemory(target);
			const entry = currentRecord.entries[mutation.index];
			if (!entry) {
				const error = new Error(`Memory entry index ${mutation.index} was not found.`);
				error.code = "ENOENT";
				throw error;
			}
			return buildMemoryRecordResponse(await removeHermesMemoryEntry(target, entry.id));
		}

		if (typeof mutation?.entry === "string" && mutation.entry.trim()) {
			const currentRecord = await getHermesMemory(target);
			const matchedEntry = currentRecord.entries.find((entry) =>
				entry.id === mutation.entry || entry.content === mutation.entry,
			);
			if (!matchedEntry) {
				const error = new Error(`Memory entry ${mutation.entry} was not found.`);
				error.code = "ENOENT";
				throw error;
			}
			return buildMemoryRecordResponse(await removeHermesMemoryEntry(target, matchedEntry.id));
		}

		const error = new Error("A memory entry id, content match, or index is required.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	if (
		action === "append"
		|| action === "add"
		|| action === undefined
		|| action === null
	) {
		const content =
			typeof mutation?.content === "string" && mutation.content.trim()
				? mutation.content
				: typeof mutation?.entry === "string" && mutation.entry.trim()
					? mutation.entry
					: "";
		return buildMemoryRecordResponse(await addHermesMemoryEntry(target, { content }));
	}

	const error = new Error(`Unsupported memory mutation action: ${action}`);
	error.code = "INVALID_INPUT";
	throw error;
}

module.exports = {
	addHermesMemoryEntry,
	getHermesMemory,
	getHermesMemoryUsageSummary,
	listHermesMemories,
	listHermesMemoryRecords,
	mutateHermesMemoryRecord,
	normalizeHermesMemoryTarget,
	parseHermesMemoryEntries,
	readHermesMemoryRecord,
	removeHermesMemoryEntry,
	replaceHermesMemory,
	serializeHermesMemoryEntries,
};
