"use strict";

const crypto = require("node:crypto");
const path = require("node:path");

const { createAIGatewayProvider } = require("./ai-gateway-provider");
const qmd = require("./personal-graph-qmd");
const summarize = require("./personal-graph-summarize");
const vault = require("./personal-graph-vault");

const pendingConfirmations = new Map();

function slugify(value) {
	return String(value ?? "source")
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/gu, "")
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "")
		.slice(0, 80) || "source";
}

function parseJsonObject(text) {
	try {
		return JSON.parse(text);
	} catch {
		const match = String(text).match(/\{[\s\S]*\}/u);
		if (match) {
			return JSON.parse(match[0]);
		}
		throw new Error("Librarian response was not valid JSON.");
	}
}

function getSourceTitle(raw) {
	const parsed = vault.parseFrontmatter(raw.content);
	if (typeof parsed.frontmatter.title === "string" && parsed.frontmatter.title.trim()) {
		return parsed.frontmatter.title.trim();
	}
	return path.basename(raw.relativePath, path.extname(raw.relativePath));
}

function buildFallbackActionPlan({ raw, related, summary }) {
	const title = getSourceTitle(raw);
	const slug = `sources/${slugify(title)}`;
	const relatedLinks = related
		.slice(0, 5)
		.map((result) => `- [[${result.slug}]] — ${result.title}`)
		.join("\n");
	const content = [
		"---",
		`title: ${JSON.stringify(title)}`,
		"type: source",
		"sources:",
		`  - ${raw.relativePath}`,
		"---",
		"",
		`# ${title}`,
		"",
		summary.summary,
		"",
		"## Takeaways",
		...summary.takeaways.map((takeaway) => `- ${takeaway}`),
		"",
		relatedLinks ? "## Related" : "",
		relatedLinks,
		"",
	].filter((line) => line !== null).join("\n");
	return {
		log: {
			date: new Date().toISOString(),
			pagesWritten: [`wiki/${slug}.md`],
			source: raw.relativePath,
			type: "ingest",
		},
		pages: [{ content, slug }],
	};
}

async function buildActionPlan({ raw, related, summary, aiGatewayProvider } = {}) {
	const gateway = aiGatewayProvider ?? createAIGatewayProvider({ logger: console });
	const fallback = buildFallbackActionPlan({ raw, related, summary });
	try {
		const text = await gateway.generateText({
			maxOutputTokens: 2200,
			prompt: [
				"Create a JSON action plan for updating an Obsidian-compatible personal wiki.",
				"Return only JSON: {\"pages\":[{\"slug\":\"sources/name\",\"content\":\"---\\ntitle: ...\\n---\\n...\"}],\"log\":{\"type\":\"ingest\",\"source\":\"raw/file.md\",\"pagesWritten\":[\"wiki/sources/name.md\"]}}.",
				"Every page content must start with YAML frontmatter. Use wikilinks to related pages where useful.",
				`Raw source path: ${raw.relativePath}`,
				`Summary: ${summary.summary}`,
				`Takeaways: ${JSON.stringify(summary.takeaways)}`,
				`Related pages: ${JSON.stringify(related)}`,
				`Raw content:\n${raw.content.slice(0, 12000)}`,
			].join("\n\n"),
			system: "You are a careful second-brain librarian. You return valid JSON only and never write files yourself.",
			temperature: 0.2,
		});
		const parsed = parseJsonObject(text);
		return {
			log: parsed.log && typeof parsed.log === "object" ? parsed.log : fallback.log,
			pages: Array.isArray(parsed.pages) && parsed.pages.length > 0 ? parsed.pages : fallback.pages,
		};
	} catch {
		return fallback;
	}
}

async function executeActionPlan(plan, raw) {
	const pagesWritten = [];
	for (const page of plan.pages ?? []) {
		if (typeof page?.slug !== "string" || typeof page?.content !== "string") {
			continue;
		}
		const written = vault.writePage(page.slug, page.content);
		pagesWritten.push(written.relativePath);
	}
	const alreadyLogged = vault.parseLogEntries().some((entry) => entry.source === raw.relativePath);
	if (alreadyLogged) {
		return {
			logEntry: {
				pagesWritten,
				source: raw.relativePath,
				type: "ingest",
			},
			pagesWritten,
			skippedLog: true,
		};
	}
	const logEntry = {
		...(plan.log && typeof plan.log === "object" ? plan.log : {}),
		date: plan.log?.date ?? new Date().toISOString(),
		pagesWritten: pagesWritten.length > 0 ? pagesWritten : plan.log?.pagesWritten ?? [],
		source: plan.log?.source ?? raw.relativePath,
		status: "completed",
		type: "ingest",
	};
	await vault.appendLog(logEntry);
	return { logEntry, pagesWritten };
}

async function* run({ confirmation = false, qmdImpl = qmd, sourcePath, summarizeImpl = summarize.summarizeRaw, aiGatewayProvider } = {}) {
	yield { stage: "reading", sourcePath, type: "stage" };
	const raw = vault.readRaw(sourcePath);
	yield { sourcePath: raw.relativePath, stage: "summarizing", type: "stage" };
	const summary = await summarizeImpl({ content: raw.content, kind: path.extname(raw.relativePath).slice(1) || "markdown" });
	yield { stage: "summarizing", summary: summary.summary, takeaways: summary.takeaways, type: "summary" };
	yield { stage: "linking", type: "stage" };
	const related = await qmdImpl.relatedPages(summary.summary, { limit: 8 });
	yield { related, stage: "linking", type: "related" };

	if (!confirmation) {
		const token = crypto.randomUUID();
		pendingConfirmations.set(token, { raw, related, summary });
		yield { stage: "awaiting-confirmation", token, type: "confirmation" };
		return;
	}

	yield { stage: "writing", type: "stage" };
	const plan = await buildActionPlan({ aiGatewayProvider, raw, related, summary });
	const result = await executeActionPlan(plan, raw);
	yield { ...result, stage: "done", type: "done" };
}

async function* confirm(token, { aiGatewayProvider } = {}) {
	const pending = pendingConfirmations.get(token);
	if (!pending) {
		const error = new Error("Confirmation token is not pending.");
		error.code = "CONFIRMATION_NOT_FOUND";
		throw error;
	}
	pendingConfirmations.delete(token);
	yield { stage: "writing", type: "stage" };
	const plan = await buildActionPlan({ aiGatewayProvider, ...pending });
	const result = await executeActionPlan(plan, pending.raw);
	yield { ...result, stage: "done", type: "done" };
}

module.exports = {
	buildActionPlan,
	buildFallbackActionPlan,
	confirm,
	executeActionPlan,
	run,
};
