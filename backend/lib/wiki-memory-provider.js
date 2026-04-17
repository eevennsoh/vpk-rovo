"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");

const { createAIGatewayProvider } = require("./ai-gateway-provider");
const { DEFAULT_WIKI_DIR, resolveLlmWikiPaths } = require("./qmd");
const { getNonEmptyString } = require("./shared-utils");

const aiGatewayProvider = createAIGatewayProvider({ logger: console });

const WIKI_MEMORY_SCOPE_DEFINITIONS = Object.freeze({
	profile: {
		canonicalPath: ["profiles", "self.md"],
		collection: "wiki-profiles",
		label: "Profile Memory",
		outputPath: ["output", "profile-context.md"],
		pageTitle: "Self",
		tags: ["profile", "memory"],
		type: "profile",
	},
	work: {
		canonicalPath: ["work", "context.md"],
		collection: "wiki-work",
		label: "Work Context",
		outputPath: ["output", "work-context.md"],
		pageTitle: "Work Context",
		tags: ["work", "memory"],
		type: "work",
	},
});

const PROPOSAL_STATUS_SET = new Set(["queued", "ingested"]);
const PROPOSAL_ACTION_SET = new Set(["add", "replace"]);
const DURABLE_MEMORY_HEADING = "## Durable Memory";
const RECENT_CHANGES_HEADING = "## Recent Changes";
const MEMORY_STATUS_KEY = "memory_status";
const KNOWLEDGE_STATUS_KEY = "knowledge_status";
const RAW_SOURCE_DIRS = Object.freeze([
	["raw"],
	["raw", "assets"],
]);

function normalizeText(value) {
	return typeof value === "string"
		? value.replace(/\r\n?/gu, "\n").trim()
		: "";
}

function getTodayDate() {
	return new Date().toISOString().slice(0, 10);
}

function serializeFrontmatter(metadata) {
	const lines = ["---"];
	for (const [key, value] of Object.entries(metadata)) {
		if (value === undefined || value === null) {
			continue;
		}

		if (Array.isArray(value)) {
			lines.push(`${key}: [${value.map((item) => JSON.stringify(String(item))).join(", ")}]`);
			continue;
		}

		if (typeof value === "boolean" || typeof value === "number") {
			lines.push(`${key}: ${String(value)}`);
			continue;
		}

		lines.push(`${key}: ${JSON.stringify(String(value))}`);
	}
	lines.push("---");
	return `${lines.join("\n")}\n`;
}

function parseFrontmatter(content) {
	if (typeof content !== "string") {
		return { body: "", frontmatter: {} };
	}

	const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/u);
	if (!match) {
		return { body: content, frontmatter: {} };
	}

	const frontmatter = {};
	for (const line of match[1].split("\n")) {
		const colonIndex = line.indexOf(":");
		if (colonIndex < 0) {
			continue;
		}
		const key = line.slice(0, colonIndex).trim();
		let rawValue = line.slice(colonIndex + 1).trim();
		if (!key) {
			continue;
		}

		if (
			(rawValue.startsWith("\"") && rawValue.endsWith("\""))
			|| (rawValue.startsWith("'") && rawValue.endsWith("'"))
		) {
			rawValue = rawValue.slice(1, -1);
		}

		if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
			const inner = rawValue.slice(1, -1).trim();
			frontmatter[key] = inner.length === 0
				? []
				: inner.split(",").map((item) => item.trim().replace(/^['"]|['"]$/gu, ""));
			continue;
		}

		frontmatter[key] = rawValue;
	}

	return {
		body: match[2],
		frontmatter,
	};
}

function stripMarkdownCodeFence(content) {
	const normalizedContent = normalizeText(content);
	const fencedMatch = normalizedContent.match(/^```(?:markdown|md)?\s*([\s\S]*?)```$/u);
	return fencedMatch?.[1] ? fencedMatch[1].trim() : normalizedContent;
}

function trimBlankLines(lines) {
	if (!Array.isArray(lines) || lines.length === 0) {
		return [];
	}

	let start = 0;
	let end = lines.length;
	while (start < end && lines[start].trim() === "") {
		start += 1;
	}
	while (end > start && lines[end - 1].trim() === "") {
		end -= 1;
	}
	return lines.slice(start, end);
}

function stripLeadingDuplicatedFrontmatterFence(content) {
	if (typeof content !== "string" || content.length === 0) {
		return "";
	}

	const normalizedContent = content
		.replace(/\r\n?/gu, "\n")
		.trimStart();

	return normalizedContent
		.replace(/^```(?:yaml|yml)?\s*---\n[\s\S]*?\n---\s*```\n*/u, "")
		.trimStart();
}

function getSectionBounds(lines, heading) {
	const targetHeading = heading.trim();
	const start = lines.findIndex((line) => line.trim() === targetHeading);
	if (start < 0) {
		return null;
	}

	let end = lines.length;
	for (let index = start + 1; index < lines.length; index += 1) {
		if (/^##\s+/u.test(lines[index].trim())) {
			end = index;
			break;
		}
	}

	return { end, start };
}

function ensureTopLevelHeading(lines, fallbackTitle) {
	const trimmedLines = trimBlankLines(lines);
	if (trimmedLines.some((line) => /^#\s+/u.test(line.trim()))) {
		return trimmedLines;
	}

	return [`# ${fallbackTitle}`, ...trimmedLines];
}

function normalizeMemoryBlockContent(content) {
	return normalizeText(content).replace(/\n{3,}/gu, "\n\n");
}

function summarizeMemoryBlockContent(content) {
	const normalized = normalizeMemoryBlockContent(content);
	return normalized.length > 140
		? `${normalized.slice(0, 137).trimEnd()}...`
		: normalized;
}

function buildMemoryBlockId(scope, index, content) {
	return `${scope}-${crypto.createHash("sha1").update(`${index}:${normalizeMemoryBlockContent(content)}`).digest("hex").slice(0, 12)}`;
}

function buildDocumentRevision(content) {
	return crypto.createHash("sha1").update(typeof content === "string" ? content : "").digest("hex");
}

function splitDurableMemoryBlocks(content) {
	const normalizedContent = normalizeMemoryBlockContent(content);
	if (!normalizedContent || normalizedContent === "_No entries yet._") {
		return [];
	}

	// Canonical memory pages currently use blank-line-separated durable memory blocks.
	return normalizedContent
		.split(/\n{2,}/u)
		.map((block) => normalizeMemoryBlockContent(block))
		.filter(Boolean);
}

function parseCanonicalMemoryDocument(document, definition) {
	const sanitizedBody = stripLeadingDuplicatedFrontmatterFence(document.body);
	const lines = sanitizedBody.length > 0 ? sanitizedBody.split("\n") : [];
	const durableBounds = getSectionBounds(lines, DURABLE_MEMORY_HEADING);
	const recentBounds = getSectionBounds(lines, RECENT_CHANGES_HEADING);
	const prefixLines = durableBounds
		? trimBlankLines(lines.slice(0, durableBounds.start))
		: ensureTopLevelHeading(lines, definition.pageTitle);
	const durableContent = durableBounds
		? trimBlankLines(lines.slice(durableBounds.start + 1, durableBounds.end)).join("\n")
		: "";
	const recentLines = recentBounds
		? trimBlankLines(lines.slice(recentBounds.start + 1, recentBounds.end))
		: [];
	const suffixLines = recentBounds
		? trimBlankLines(lines.slice(recentBounds.end))
		: [];
	const titleLine = prefixLines.find((line) => /^#\s+/u.test(line.trim()));
	const title = titleLine
		? titleLine.trim().replace(/^#\s+/u, "")
		: definition.pageTitle;
	const blocks = splitDurableMemoryBlocks(durableContent).map((content, index) => ({
		charCount: content.length,
		content,
		id: buildMemoryBlockId(definition.scope, index, content),
		lineCount: content.split("\n").length,
		preview: summarizeMemoryBlockContent(content),
	}));

	return {
		blocks,
		prefixLines: ensureTopLevelHeading(prefixLines, title),
		recentLines,
		sanitizedBody,
		suffixLines,
		title,
	};
}

function buildCanonicalMemoryFrontmatter(definition, currentDocument) {
	const currentFrontmatter = currentDocument?.frontmatter ?? {};
	return serializeFrontmatter({
		created: getNonEmptyString(currentFrontmatter.created) ?? getTodayDate(),
		kind: "wiki-memory",
		sources: Array.isArray(currentFrontmatter.sources) ? currentFrontmatter.sources.map((value) => String(value)) : [],
		tags: definition.tags,
		title: getNonEmptyString(currentFrontmatter.title) ?? definition.pageTitle,
		type: definition.type,
		updated: getTodayDate(),
	}).trimEnd();
}

function buildCanonicalMemoryDocumentContent({
	blocks,
	currentDocument,
	definition,
	parsedDocument,
	recentChange,
}) {
	const nextBlocks = Array.isArray(blocks) ? blocks : [];
	const nextRecentLines = [
		getNonEmptyString(recentChange),
		...parsedDocument.recentLines,
	].filter(Boolean);
	const durableMemoryLines = nextBlocks.length > 0
		? nextBlocks.map((block) => block.content).join("\n\n").split("\n")
		: ["_No entries yet._"];
	const bodyLines = [
		...ensureTopLevelHeading(parsedDocument.prefixLines, parsedDocument.title || definition.pageTitle),
		"",
		DURABLE_MEMORY_HEADING,
		"",
		...durableMemoryLines,
		"",
		RECENT_CHANGES_HEADING,
		"",
		...nextRecentLines,
	];

	if (parsedDocument.suffixLines.length > 0) {
		bodyLines.push("", ...parsedDocument.suffixLines);
	}

	return [
		buildCanonicalMemoryFrontmatter(definition, currentDocument),
		"",
		bodyLines.join("\n"),
	].join("\n");
}

function getWikiMemoryPaths({ wikiDir = DEFAULT_WIKI_DIR } = {}) {
	const paths = resolveLlmWikiPaths({ wikiDir });
	return {
		indexPath: path.join(paths.wikiDir, "index.md"),
		logPath: path.join(paths.wikiDir, "log.md"),
		outputDir: paths.outputDir,
		rawDir: paths.rawDir,
		rootDir: paths.rootDir,
		schemaPath: path.join(paths.wikiDir, "SCHEMA.md"),
		wikiDir: paths.wikiDir,
	};
}

function normalizeWikiMemoryScope(scope) {
	if (typeof scope !== "string" || scope.trim().length === 0) {
		return null;
	}

	const normalizedScope = scope.trim();
	return Object.hasOwn(WIKI_MEMORY_SCOPE_DEFINITIONS, normalizedScope)
		? normalizedScope
		: null;
}

function resolveScopeDefinition(scope, { wikiDir = DEFAULT_WIKI_DIR } = {}) {
	const normalizedScope = normalizeWikiMemoryScope(scope);
	const definition = normalizedScope ? WIKI_MEMORY_SCOPE_DEFINITIONS[normalizedScope] : null;
	if (!definition) {
		return null;
	}
	const paths = resolveLlmWikiPaths({ wikiDir });

	return {
		...definition,
		canonicalAbsolutePath: path.join(paths.wikiDir, ...definition.canonicalPath),
		outputAbsolutePath: path.join(paths.rootDir, ...definition.outputPath),
		scope: normalizedScope,
	};
}

function listScopeDefinitions({ wikiDir = DEFAULT_WIKI_DIR } = {}) {
	return Object.keys(WIKI_MEMORY_SCOPE_DEFINITIONS)
		.map((scope) => resolveScopeDefinition(scope, { wikiDir }))
		.filter(Boolean);
}

function buildCanonicalSeedContent(definition) {
	const created = getTodayDate();
	return [
		serializeFrontmatter({
			created,
			kind: "wiki-memory",
			sources: [],
			tags: definition.tags,
			title: definition.pageTitle,
			type: definition.type,
			updated: created,
		}).trimEnd(),
		"",
		`# ${definition.pageTitle}`,
		"",
		"## Durable Memory",
		"",
		"_No entries yet._",
		"",
	].join("\n");
}

function buildDefaultSchemaContent() {
	return [
		"# Wiki Schema",
		"",
		"## Domain",
		"Durable wiki-backed Hermes memory and linked knowledge.",
		"",
		"## Conventions",
		"- Canonical pages under `profiles/`, `work/`, `sources/`, `entities/`, `concepts/`, and `synthesis/` are the source of truth.",
		"- Raw captures and turn-derived memory proposals live under `raw/` and are immutable after ingest.",
		"- Compiled prompt context artifacts live under `output/` and are generated, never edited by hand.",
		"- Use qmd over canonical wiki pages for retrieval.",
		"",
	].join("\n");
}

async function appendToWikiLog(action, subject, details = [], { wikiDir = DEFAULT_WIKI_DIR } = {}) {
	const { logPath } = getWikiMemoryPaths({ wikiDir });
	await fs.mkdir(path.dirname(logPath), { recursive: true });
	try {
		await fs.access(logPath);
	} catch {
		await fs.writeFile(logPath, "# Wiki Log\n\n", "utf8");
	}

	const lines = [`\n## [${getTodayDate()}] ${action} | ${subject}`];
	for (const detail of details) {
		lines.push(`- ${detail}`);
	}
	lines.push("");
	await fs.appendFile(logPath, `${lines.join("\n")}`, "utf8");
}

async function ensureWikiMemoryScaffold({ wikiDir = DEFAULT_WIKI_DIR } = {}) {
	const paths = getWikiMemoryPaths({ wikiDir });
	const canonicalDirs = [
		"profiles",
		"work",
		"sources",
		"entities",
		"concepts",
		"comparisons",
		"queries",
		"synthesis",
	];
	await Promise.all([
		fs.mkdir(paths.outputDir, { recursive: true }),
		...canonicalDirs.map((dirName) => fs.mkdir(path.join(wikiDir, dirName), { recursive: true })),
		...RAW_SOURCE_DIRS.map((segments) => fs.mkdir(path.join(wikiDir, ...segments), { recursive: true })),
	]);

	try {
		await fs.access(paths.schemaPath);
	} catch {
		await fs.writeFile(paths.schemaPath, `${buildDefaultSchemaContent()}\n`, "utf8");
	}

	try {
		await fs.access(paths.indexPath);
	} catch {
		await fs.writeFile(
			paths.indexPath,
			[
				"# Wiki Index",
				"",
				"## Profiles",
				"- [[self]] — User profile and personal preferences",
				"",
				"## Work",
				"- [[memory]] — Work memory and durable workflow notes",
				"",
				"## Sources",
				"",
				"## Entities",
				"",
				"## Concepts",
				"",
				"## Comparisons",
				"",
				"## Queries",
				"",
				"## Synthesis",
				"",
			].join("\n"),
			"utf8",
		);
	}

	try {
		await fs.access(paths.logPath);
	} catch {
		await fs.writeFile(paths.logPath, "# Wiki Log\n\n", "utf8");
	}

	for (const definition of listScopeDefinitions({ wikiDir })) {
		try {
			await fs.access(definition.canonicalAbsolutePath);
		} catch {
			await fs.mkdir(path.dirname(definition.canonicalAbsolutePath), { recursive: true });
			await fs.writeFile(
				definition.canonicalAbsolutePath,
				`${buildCanonicalSeedContent(definition)}\n`,
				"utf8",
			);
		}
	}

	return paths;
}

function mapMemoryTargetToScope(target) {
	return target === "user" ? "profile" : "work";
}

async function walkMarkdownFiles(dirPath) {
	let entries;
	try {
		entries = await fs.readdir(dirPath, { withFileTypes: true });
	} catch (error) {
		if (error?.code === "ENOENT") {
			return [];
		}
		throw error;
	}

	const files = [];
	for (const entry of entries) {
		const fullPath = path.join(dirPath, entry.name);
		if (entry.isDirectory()) {
			files.push(...(await walkMarkdownFiles(fullPath)));
			continue;
		}

		if (entry.isFile() && entry.name.endsWith(".md")) {
			files.push(fullPath);
		}
	}

	return files;
}

function buildProposalId() {
	return crypto.randomBytes(6).toString("hex");
}

async function readMarkdownDocument(filePath) {
	try {
		const [content, stats] = await Promise.all([
			fs.readFile(filePath, "utf8"),
			fs.stat(filePath),
		]);
		const parsed = parseFrontmatter(content);
		return {
			body: parsed.body,
			content,
			exists: true,
			frontmatter: parsed.frontmatter,
			path: filePath,
			updatedAt: stats.mtime.toISOString(),
		};
	} catch (error) {
		if (error?.code === "ENOENT") {
			return {
				body: "",
				content: "",
				exists: false,
				frontmatter: {},
				path: filePath,
				updatedAt: null,
			};
		}
		throw error;
	}
}

async function writeMarkdownDocument(filePath, content) {
	await fs.mkdir(path.dirname(filePath), { recursive: true });
	await fs.writeFile(filePath, `${normalizeText(content)}\n`, "utf8");
	return readMarkdownDocument(filePath);
}

function normalizeProposalRecord(filePath, document) {
	const memoryStatus =
		typeof document.frontmatter[MEMORY_STATUS_KEY] === "string" && document.frontmatter[MEMORY_STATUS_KEY].trim().length > 0
			? document.frontmatter[MEMORY_STATUS_KEY].trim()
			: typeof document.frontmatter.status === "string" && document.frontmatter.status.trim().length > 0
				? document.frontmatter.status.trim()
				: null;
	if (
		typeof document.frontmatter.target !== "string"
		&& typeof document.frontmatter.scope !== "string"
		&& typeof document.frontmatter.action !== "string"
		&& memoryStatus === null
	) {
		return null;
	}

	const action = PROPOSAL_ACTION_SET.has(document.frontmatter.action)
		? document.frontmatter.action
		: "add";
	const scope = normalizeWikiMemoryScope(document.frontmatter.scope) ?? "work";
	const status = PROPOSAL_STATUS_SET.has(memoryStatus)
		? memoryStatus
		: "queued";
	const body = normalizeText(document.body);
	return {
		action,
		content: body,
		createdAt: getNonEmptyString(document.frontmatter.created_at) ?? document.updatedAt,
		id: getNonEmptyString(document.frontmatter.id) ?? path.basename(filePath, ".md"),
		ingestedAt: getNonEmptyString(document.frontmatter.ingested_at),
		origin: getNonEmptyString(document.frontmatter.capture_origin),
		path: filePath,
		reason: getNonEmptyString(document.frontmatter.capture_reason),
		scope,
		sourceMessageId: getNonEmptyString(document.frontmatter.source_message_id),
		sourceThreadId: getNonEmptyString(document.frontmatter.source_thread_id),
		status,
		summary: getNonEmptyString(document.frontmatter.summary) ?? body.slice(0, 140),
		tags: Array.isArray(document.frontmatter.tags)
			? document.frontmatter.tags
			: [],
		target: getNonEmptyString(document.frontmatter.target) ?? "memory",
	};
}

async function listWikiMemoryProposals({
	limit,
	statuses,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const { rawDir } = getWikiMemoryPaths({ wikiDir });
	const files = await walkMarkdownFiles(rawDir);
	const requestedStatuses = Array.isArray(statuses) && statuses.length > 0
		? new Set(statuses)
		: null;
	const proposals = [];

	for (const filePath of files) {
		const document = await readMarkdownDocument(filePath);
		if (!document.exists) {
			continue;
		}
		const proposal = normalizeProposalRecord(filePath, document);
		if (!proposal) {
			continue;
		}
		if (requestedStatuses && !requestedStatuses.has(proposal.status)) {
			continue;
		}
		proposals.push(proposal);
	}

	proposals.sort((left, right) => {
		return (right.createdAt || "").localeCompare(left.createdAt || "");
	});
	return typeof limit === "number" ? proposals.slice(0, limit) : proposals;
}

async function enqueueWikiMemoryProposal({
	action = "add",
	content,
	origin,
	reason,
	sourceMessageId,
	sourceThreadId,
	summary,
	target,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const normalizedContent = normalizeText(content);
	if (!normalizedContent) {
		const error = new Error("Wiki memory proposal content is required.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	await ensureWikiMemoryScaffold({ wikiDir });

	const now = new Date();
	const yyyy = String(now.getUTCFullYear());
	const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
	const id = buildProposalId();
	const scope = mapMemoryTargetToScope(target);
	const { rawDir } = getWikiMemoryPaths({ wikiDir });
	const proposalDir = path.join(rawDir, yyyy, mm);
	const proposalPath = path.join(proposalDir, `${now.toISOString().replace(/[:.]/gu, "-")}-${id}.md`);
	const fileContent = [
		serializeFrontmatter({
			action,
			capture_origin: getNonEmptyString(origin) ?? undefined,
			capture_reason: getNonEmptyString(reason) ?? undefined,
			created_at: now.toISOString(),
			id,
			[KNOWLEDGE_STATUS_KEY]: "queued",
			[MEMORY_STATUS_KEY]: "queued",
			scope,
			source_message_id: getNonEmptyString(sourceMessageId) ?? undefined,
			source_thread_id: getNonEmptyString(sourceThreadId) ?? undefined,
			summary: getNonEmptyString(summary) ?? normalizedContent.slice(0, 140),
			target: target === "user" ? "user" : "memory",
			title: `Memory proposal ${id}`,
		}).trimEnd(),
		"",
		normalizedContent,
		"",
	].join("\n");
	await writeMarkdownDocument(proposalPath, fileContent);

	return {
		action,
		content: normalizedContent,
		createdAt: now.toISOString(),
		id,
		ingestedAt: null,
		origin: getNonEmptyString(origin),
		path: proposalPath,
		reason: getNonEmptyString(reason),
		scope,
		status: "queued",
		summary: getNonEmptyString(summary) ?? normalizedContent.slice(0, 140),
		target: target === "user" ? "user" : "memory",
		tags: [],
	};
}

function updateProposalStatusContent(content, status, changedAt) {
	const memoryStatusPattern = new RegExp(`^(${MEMORY_STATUS_KEY}:\\s*).+$`, "mu");
	let nextContent = memoryStatusPattern.test(content)
		? content.replace(memoryStatusPattern, `$1${status}`)
		: content.replace(
			/^(status:\s*).+$/mu,
			`${"$1"}${status}`,
		);

	if (status === "ingested" && getNonEmptyString(changedAt)) {
		const ingestedAtPattern = /^(ingested_at:\s*).+$/mu;
		if (ingestedAtPattern.test(nextContent)) {
			nextContent = nextContent.replace(ingestedAtPattern, `$1${changedAt}`);
		} else {
			nextContent = nextContent.replace(
				/^---\n/u,
				`---\ningested_at: "${changedAt}"\n`,
			);
		}
	}

	return nextContent;
}

function buildCanonicalRewritePrompt(definition, currentPage, proposals) {
	const proposalBlock = proposals.map((proposal) => {
		return [
			`- id: ${proposal.id}`,
			`  action: ${proposal.action}`,
			`  created_at: ${proposal.createdAt ?? "unknown"}`,
			`  summary: ${proposal.summary ?? ""}`,
			"  content: |",
			...normalizeText(proposal.content)
				.split("\n")
				.map((line) => `    ${line}`),
		].join("\n");
	}).join("\n");

	return [
		`Rewrite the canonical wiki memory page for ${definition.label}.`,
		"",
		"Return only markdown with YAML frontmatter.",
		"Keep the page concise, deduplicated, and durable.",
		"Use these sections in this order:",
		"- `# Title`",
		"- `## Durable Memory`",
		"- `## Recent Changes`",
		"Prefer newer corrections over stale facts when they conflict.",
		"Do not preserve superseded statements if the new proposals clearly replace them.",
		"",
		"## Current canonical page",
		currentPage.exists ? currentPage.content : buildCanonicalSeedContent(definition),
		"",
		"## Queued proposals",
		proposalBlock || "- None",
	].join("\n");
}

function buildCompiledContextPrompt(definition, canonicalDocument) {
	return [
		`Compile the canonical ${definition.label.toLowerCase()} wiki page into compact prompt context.`,
		"",
		"Return only markdown. Do not include YAML frontmatter.",
		"Use short bullets and brief headings.",
		"Keep only durable facts that will help future conversations.",
		"Remove narration, examples, and filler.",
		"",
		"## Canonical page",
		canonicalDocument.exists ? canonicalDocument.content : buildCanonicalSeedContent(definition),
	].join("\n");
}

function normalizeCanonicalRewriteOutput(output, definition, currentPage) {
	const stripped = stripMarkdownCodeFence(output);
	if (!stripped) {
		return currentPage.exists ? currentPage.content : buildCanonicalSeedContent(definition);
	}

	if (stripped.startsWith("---\n")) {
		return stripped;
	}

	const currentDocument = currentPage.exists ? parseFrontmatter(currentPage.content) : { frontmatter: {} };
	const created = getNonEmptyString(currentDocument.frontmatter.created) ?? getTodayDate();
	return [
		serializeFrontmatter({
			created,
			kind: "wiki-memory",
			sources: [],
			tags: definition.tags,
			title: definition.pageTitle,
			type: definition.type,
			updated: getTodayDate(),
		}).trimEnd(),
		"",
		stripped,
	].join("\n");
}

function normalizeCompiledContextOutput(output, definition) {
	const stripped = stripMarkdownCodeFence(output);
	if (stripped) {
		return stripped;
	}

	return [
		`# ${definition.label}`,
		"",
		"- No compiled context available yet.",
	].join("\n");
}

async function regenerateWikiMemoryContext({
	generateTextImpl,
	logger = console,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	await ensureWikiMemoryScaffold({ wikiDir });

	const textGenerator = generateTextImpl || (async (input) => {
		return aiGatewayProvider.generateText({
			maxOutputTokens: 800,
			prompt: input.prompt,
			system: input.system,
			temperature: 0.1,
		});
	});

	const compiledContexts = {};
	for (const definition of listScopeDefinitions({ wikiDir })) {
		const canonicalDocument = await readMarkdownDocument(definition.canonicalAbsolutePath);
		const output = await textGenerator({
			prompt: buildCompiledContextPrompt(definition, canonicalDocument),
			system: `You compile ${definition.label.toLowerCase()} into concise prompt context.`,
		});
		const content = normalizeCompiledContextOutput(output, definition);
		const document = await writeMarkdownDocument(definition.outputAbsolutePath, content);
		compiledContexts[definition.scope] = {
			charCount: document.content.length,
			exists: document.exists,
			path: document.path,
			preview: normalizeText(document.content).slice(0, 220),
			updatedAt: document.updatedAt,
		};
	}

	logger.info?.("[wiki-memory] Regenerated compiled context artifacts", {
		wikiDir,
	});

	return compiledContexts;
}

function createWikiMemoryTextGenerator(generateTextImpl) {
	return generateTextImpl || (async (input) => {
		return aiGatewayProvider.generateText({
			maxOutputTokens: 1500,
			prompt: input.prompt,
			system: input.system,
			temperature: 0.1,
		});
	});
}

async function rewriteCanonicalMemoryFromCurrentSources({
	generateTextImpl,
	logger = console,
	qmdSyncImpl,
	scope,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const definition = resolveScopeDefinition(scope, { wikiDir });
	if (!definition) {
		const error = new Error(`Unknown wiki memory scope: ${scope}`);
		error.code = "NOT_FOUND";
		throw error;
	}

	const currentPage = await readMarkdownDocument(definition.canonicalAbsolutePath);
	const allScopeProposals = (await listWikiMemoryProposals({ wikiDir }))
		.filter((proposal) => proposal.scope === scope);

	if (allScopeProposals.length === 0) {
		await writeMarkdownDocument(definition.canonicalAbsolutePath, buildCanonicalSeedContent(definition));
	} else {
		const textGenerator = createWikiMemoryTextGenerator(generateTextImpl);
		const rewrittenPage = await textGenerator({
			prompt: buildCanonicalRewritePrompt(
				definition,
				{
					...currentPage,
					body: "",
					content: "",
					exists: false,
				},
				allScopeProposals,
			),
			system: `You maintain the canonical ${definition.label.toLowerCase()} page in an LLM wiki.`,
		});
		const nextContent = normalizeCanonicalRewriteOutput(
			rewrittenPage,
			definition,
			currentPage,
		);
		await writeMarkdownDocument(definition.canonicalAbsolutePath, nextContent);
	}

	let processed = 0;
	for (const proposal of allScopeProposals) {
		if (proposal.status !== "queued") {
			continue;
		}
		const currentProposal = await readMarkdownDocument(proposal.path);
		if (!currentProposal.exists) {
			continue;
		}
		await writeMarkdownDocument(
			proposal.path,
			updateProposalStatusContent(currentProposal.content, "ingested", new Date().toISOString()),
		);
		processed += 1;
	}

	if (typeof qmdSyncImpl === "function") {
		await qmdSyncImpl({
			collectionName: definition.collection,
			scope,
			wikiDir,
		});
	}

	logger.info?.("[wiki-memory] Rebuilt canonical memory from current sources", {
		processed,
		scope,
		wikiDir,
	});

	return {
		processed,
		updatedCollections: [definition.collection],
		updatedScopes: [scope],
	};
}

async function rebuildWikiMemoryFromCurrentSources({
	generateTextImpl,
	logger = console,
	qmdSyncImpl,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	await ensureWikiMemoryScaffold({ wikiDir });

	const errors = [];
	let processed = 0;
	const updatedCollections = [];
	const updatedScopes = [];

	for (const definition of listScopeDefinitions({ wikiDir })) {
		try {
			const result = await rewriteCanonicalMemoryFromCurrentSources({
				generateTextImpl,
				logger,
				qmdSyncImpl,
				scope: definition.scope,
				wikiDir,
			});
			processed += result.processed;
			updatedCollections.push(...result.updatedCollections);
			updatedScopes.push(...result.updatedScopes);
		} catch (error) {
			errors.push(`${definition.scope}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	await regenerateWikiMemoryContext({
		generateTextImpl,
		logger,
		wikiDir,
	});

	return {
		errors,
		processed,
		updatedCollections: Array.from(new Set(updatedCollections)),
		updatedScopes: Array.from(new Set(updatedScopes)),
	};
}

async function ingestQueuedWikiMemoryProposals({
	generateTextImpl,
	logger = console,
	qmdSyncImpl,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	await ensureWikiMemoryScaffold({ wikiDir });

	const proposals = await listWikiMemoryProposals({
		statuses: ["queued"],
		wikiDir,
	});
	if (proposals.length === 0) {
		return {
			errors: [],
			processed: 0,
			updatedScopes: [],
		};
	}

	const textGenerator = createWikiMemoryTextGenerator(generateTextImpl);

	const groupedProposals = proposals.reduce((accumulator, proposal) => {
		const bucket = accumulator.get(proposal.scope) ?? [];
		bucket.push(proposal);
		accumulator.set(proposal.scope, bucket);
		return accumulator;
	}, new Map());

	const errors = [];
	const updatedCollections = [];
	const updatedScopes = [];
	let processed = 0;

	for (const [scope, scopeProposals] of groupedProposals.entries()) {
		const definition = resolveScopeDefinition(scope, { wikiDir });
		if (!definition) {
			continue;
		}

		try {
			const currentPage = await readMarkdownDocument(definition.canonicalAbsolutePath);
			const rewrittenPage = await textGenerator({
				prompt: buildCanonicalRewritePrompt(definition, currentPage, scopeProposals),
				system: `You maintain the canonical ${definition.label.toLowerCase()} page in an LLM wiki.`,
			});
			const nextContent = normalizeCanonicalRewriteOutput(
				rewrittenPage,
				definition,
				currentPage,
			);
			await writeMarkdownDocument(definition.canonicalAbsolutePath, nextContent);

			for (const proposal of scopeProposals) {
				const currentProposal = await readMarkdownDocument(proposal.path);
				if (!currentProposal.exists) {
					continue;
				}
				await writeMarkdownDocument(
					proposal.path,
					updateProposalStatusContent(currentProposal.content, "ingested"),
				);
			}

			await appendToWikiLog(
				"memory-ingest",
				definition.pageTitle,
				scopeProposals.map((proposal) => `Merged proposal ${proposal.id} (${proposal.action})`),
				{ wikiDir },
			);

			if (typeof qmdSyncImpl === "function") {
				await qmdSyncImpl({
					collectionName: definition.collection,
					scope,
					wikiDir,
				});
			}

			processed += scopeProposals.length;
			updatedCollections.push(definition.collection);
			updatedScopes.push(scope);
		} catch (error) {
			errors.push(`${scope}: ${error instanceof Error ? error.message : String(error)}`);
		}
	}

	if (processed > 0) {
		await regenerateWikiMemoryContext({
			generateTextImpl,
			logger,
			wikiDir,
		});
	}

	return {
		errors,
		processed,
		updatedCollections: Array.from(new Set(updatedCollections)),
		updatedScopes,
	};
}

async function readCompiledContextDocuments({ wikiDir = DEFAULT_WIKI_DIR } = {}) {
	const documents = {};
	for (const definition of listScopeDefinitions({ wikiDir })) {
		const document = await readMarkdownDocument(definition.outputAbsolutePath);
		documents[definition.scope] = {
			charCount: document.content.length,
			content: normalizeText(document.content),
			exists: document.exists,
			label: definition.label,
			path: document.path,
			preview: normalizeText(document.content).slice(0, 220),
			updatedAt: document.updatedAt,
		};
	}
	return documents;
}

async function getCanonicalWikiMemoryDocuments({
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	await ensureWikiMemoryScaffold({ wikiDir });

	const compiledContexts = await readCompiledContextDocuments({ wikiDir });
	const documents = {};

	for (const definition of listScopeDefinitions({ wikiDir })) {
		const document = await readMarkdownDocument(definition.canonicalAbsolutePath);
		const parsedDocument = parseCanonicalMemoryDocument(document, definition);
		documents[definition.scope] = {
			blocks: parsedDocument.blocks,
			canonicalPath: definition.canonicalAbsolutePath,
			compiledContext: compiledContexts[definition.scope]
				? {
					charCount: compiledContexts[definition.scope].charCount,
					exists: compiledContexts[definition.scope].exists,
					path: compiledContexts[definition.scope].path,
					preview: compiledContexts[definition.scope].preview,
					updatedAt: compiledContexts[definition.scope].updatedAt,
				}
				: {
					charCount: 0,
					exists: false,
					path: "",
					preview: "",
					updatedAt: null,
				},
			exists: document.exists,
			revision: buildDocumentRevision(document.content),
			scope: definition.scope,
			title: parsedDocument.title,
			updatedAt: document.updatedAt,
		};
	}

	return documents;
}

async function buildWikiMemoryContextDescription({
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const compiledContexts = await readCompiledContextDocuments({ wikiDir });
	const sections = [
		compiledContexts.profile?.content
			? `Profile Context:\n${compiledContexts.profile.content}`
			: null,
		compiledContexts.work?.content
			? `Work Context:\n${compiledContexts.work.content}`
			: null,
	].filter(Boolean);

	if (sections.length === 0) {
		for (const definition of listScopeDefinitions({ wikiDir })) {
			const canonicalDocument = await readMarkdownDocument(definition.canonicalAbsolutePath);
			const content = normalizeText(canonicalDocument.body || canonicalDocument.content);
			if (!content) {
				continue;
			}

			sections.push(`${definition.label}:\n${content}`);
		}
	}

	if (sections.length === 0) {
		return null;
	}

	return [
		"[Hermes Memory]",
		"Treat this as wiki-backed durable memory compiled from canonical pages.",
		sections.join("\n\n"),
		"[End Hermes Memory]",
	].join("\n");
}

async function getWikiMemoryStatus({
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const [allProposals, compiledContexts] = await Promise.all([
		listWikiMemoryProposals({ wikiDir }),
		readCompiledContextDocuments({ wikiDir }),
	]);
	const proposalCounts = allProposals.reduce((accumulator, proposal) => {
		accumulator.total += 1;
		if (proposal.status === "queued") {
			accumulator.queued += 1;
		}
		if (proposal.status === "ingested") {
			accumulator.ingested += 1;
		}
		return accumulator;
	}, {
		ingested: 0,
		queued: 0,
		total: 0,
	});

	return {
		compiledContexts,
		proposalCounts,
		recentProposals: allProposals,
	};
}

async function syncWikiBackedMemory({
	forceContextRegeneration = false,
	generateTextImpl,
	logger = console,
	qmdSyncImpl,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const ingestResult = await ingestQueuedWikiMemoryProposals({
		generateTextImpl,
		logger,
		qmdSyncImpl,
		wikiDir,
	});

	if (forceContextRegeneration) {
		const rebuildResult = await rebuildWikiMemoryFromCurrentSources({
			generateTextImpl,
			logger,
			qmdSyncImpl,
			wikiDir,
		});
		return {
			errors: [...(ingestResult.errors ?? []), ...(rebuildResult.errors ?? [])],
			processed: rebuildResult.processed,
			updatedCollections: Array.from(new Set([
				...(ingestResult.updatedCollections ?? []),
				...(rebuildResult.updatedCollections ?? []),
			])),
			updatedScopes: Array.from(new Set([
				...(ingestResult.updatedScopes ?? []),
				...(rebuildResult.updatedScopes ?? []),
			])),
		};
	}

	return ingestResult;
}

async function deleteWikiMemoryProposal({
	generateTextImpl,
	logger = console,
	proposalId,
	qmdSyncImpl,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	const normalizedProposalId = getNonEmptyString(proposalId);
	if (normalizedProposalId === null) {
		const error = new Error("A wiki memory proposal id is required.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	await ensureWikiMemoryScaffold({ wikiDir });

	const proposals = await listWikiMemoryProposals({ wikiDir });
	const proposal = proposals.find((candidate) => candidate.id === normalizedProposalId);
	if (!proposal) {
		const error = new Error("Wiki memory proposal not found.");
		error.code = "NOT_FOUND";
		throw error;
	}

	await fs.unlink(proposal.path);

	const definition = resolveScopeDefinition(proposal.scope, { wikiDir });
	if (definition) {
		await appendToWikiLog(
			"memory-source-delete",
			definition.pageTitle,
			[
				`Removed raw memory proposal ${proposal.id}.`,
				`Status: ${proposal.status}.`,
				`Summary: ${proposal.summary}`,
			],
			{ wikiDir },
		);
	}

	await rewriteCanonicalMemoryFromCurrentSources({
		generateTextImpl,
		logger,
		qmdSyncImpl,
		scope: proposal.scope,
		wikiDir,
	});
	await regenerateWikiMemoryContext({
		generateTextImpl,
		logger,
		wikiDir,
	});

	logger.info?.("[wiki-memory] Deleted memory proposal source", {
		proposalId: proposal.id,
		scope: proposal.scope,
		status: proposal.status,
		wikiDir,
	});

	return {
		memories: await getCanonicalWikiMemoryDocuments({ wikiDir }),
		proposal,
	};
}

async function pruneCanonicalWikiMemoryBlock({
	blockId,
	generateTextImpl,
	logger = console,
	qmdSyncImpl,
	revision,
	scope,
	wikiDir = DEFAULT_WIKI_DIR,
} = {}) {
	if (getNonEmptyString(blockId) === null) {
		const error = new Error("A canonical memory block id is required.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	const normalizedRevision = getNonEmptyString(revision);
	if (normalizedRevision === null) {
		const error = new Error("A canonical memory revision is required.");
		error.code = "INVALID_INPUT";
		throw error;
	}

	const definition = resolveScopeDefinition(scope, { wikiDir });
	if (!definition) {
		const error = new Error(`Unknown wiki memory scope: ${scope}`);
		error.code = "NOT_FOUND";
		throw error;
	}

	await ensureWikiMemoryScaffold({ wikiDir });

	const currentDocument = await readMarkdownDocument(definition.canonicalAbsolutePath);
	const currentRevision = buildDocumentRevision(currentDocument.content);
	if (currentRevision !== normalizedRevision) {
		const error = new Error("Canonical memory changed since this page was loaded.");
		error.code = "REVISION_CONFLICT";
		throw error;
	}

	const parsedDocument = parseCanonicalMemoryDocument(currentDocument, definition);
	const removedBlock = parsedDocument.blocks.find((block) => block.id === blockId);
	if (!removedBlock) {
		const error = new Error("Canonical memory block not found.");
		error.code = "NOT_FOUND";
		throw error;
	}

	const nextBlocks = parsedDocument.blocks.filter((block) => block.id !== blockId);
	const nextContent = buildCanonicalMemoryDocumentContent({
		blocks: nextBlocks,
		currentDocument,
		definition,
		parsedDocument,
		recentChange: `- Removed durable memory block: ${summarizeMemoryBlockContent(removedBlock.content)} (${getTodayDate()})`,
	});
	await writeMarkdownDocument(definition.canonicalAbsolutePath, nextContent);

	await appendToWikiLog(
		"memory-prune",
		definition.pageTitle,
		[
			`Removed canonical memory block ${removedBlock.id}.`,
			`Scope: ${scope}.`,
			`Summary: ${summarizeMemoryBlockContent(removedBlock.content)}`,
		],
		{ wikiDir },
	);

	if (typeof qmdSyncImpl === "function") {
		await qmdSyncImpl({
			collectionName: definition.collection,
			scope,
			wikiDir,
		});
	}

	await regenerateWikiMemoryContext({
		generateTextImpl,
		logger,
		wikiDir,
	});

	logger.info?.("[wiki-memory] Pruned canonical memory block", {
		blockId: removedBlock.id,
		scope,
		wikiDir,
	});

	return {
		memories: await getCanonicalWikiMemoryDocuments({ wikiDir }),
		removedBlock,
		updatedCollections: [definition.collection],
		updatedScopes: [scope],
	};
}

module.exports = {
	DEFAULT_WIKI_DIR,
	buildWikiMemoryContextDescription,
	deleteWikiMemoryProposal,
	enqueueWikiMemoryProposal,
	ensureWikiMemoryScaffold,
	getCanonicalWikiMemoryDocuments,
	getWikiMemoryPaths,
	getWikiMemoryStatus,
	ingestQueuedWikiMemoryProposals,
	listWikiMemoryProposals,
	mapMemoryTargetToScope,
	pruneCanonicalWikiMemoryBlock,
	readCompiledContextDocuments,
	rebuildWikiMemoryFromCurrentSources,
	regenerateWikiMemoryContext,
	resolveScopeDefinition,
	syncWikiBackedMemory,
};
