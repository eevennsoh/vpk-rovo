"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { execFile } = require("node:child_process");

const { getVaultRoot, writeRaw } = require("./personal-graph-vault");

function runAgentBrowser(args) {
	return new Promise((resolve, reject) => {
		const bin = path.resolve(__dirname, "..", "..", "node_modules", ".bin", "agent-browser");
		execFile(bin, args, { maxBuffer: 20 * 1024 * 1024 }, (error, stdout, stderr) => {
			if (error) {
				reject(new Error(`agent-browser ${args[0]} failed: ${stderr || error.message}`));
				return;
			}
			resolve(stdout.trim());
		});
	});
}

class CliAgentBrowser {
	open(url) {
		return runAgentBrowser(["open", url]);
	}
	snapshot() {
		return runAgentBrowser(["snapshot"]);
	}
	getTitle() {
		return runAgentBrowser(["get", "title"]);
	}
	screenshot(filePath) {
		return runAgentBrowser(["screenshot", filePath]);
	}
	close() {
		return runAgentBrowser(["close"]);
	}
}

function sanitizeSlug(value) {
	return String(value ?? "source")
		.toLowerCase()
		.normalize("NFKD")
		.replace(/[\u0300-\u036f]/gu, "")
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "")
		.slice(0, 80) || "source";
}

function formatDatePrefix(date = new Date()) {
	return new Intl.DateTimeFormat("en-CA", {
		day: "2-digit",
		month: "2-digit",
		timeZone: "Australia/Sydney",
		year: "numeric",
	}).format(date);
}

function assertPublicHttpUrl(url) {
	let parsed;
	try {
		parsed = new URL(url);
	} catch {
		const error = new Error("A valid URL is required.");
		error.code = "INVALID_URL";
		throw error;
	}
	if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
		const error = new Error("Only http and https URLs can be captured.");
		error.code = "INVALID_URL";
		throw error;
	}
	return parsed.toString();
}

async function captureUrl(url, { BrowserClass = CliAgentBrowser, date = new Date() } = {}) {
	const resolvedUrl = assertPublicHttpUrl(url);
	const browser = new BrowserClass();
	let title = "";
	let snapshot = "";
	let assetPath = null;
	try {
		await browser.open(resolvedUrl);
		title = (await browser.getTitle()) || new URL(resolvedUrl).hostname;
		snapshot = (await browser.snapshot()) || "";
		const slug = `${formatDatePrefix(date)}-${sanitizeSlug(title)}`;
		const vaultRoot = getVaultRoot();
		const relativeAssetPath = `raw/assets/${slug}.png`;
		assetPath = path.join(vaultRoot, relativeAssetPath);
		fs.mkdirSync(path.dirname(assetPath), { recursive: true });
		await browser.screenshot(assetPath);
		const rawBody = [
			"---",
			`title: ${JSON.stringify(title)}`,
			`url: ${resolvedUrl}`,
			`captured: ${date.toISOString()}`,
			`asset: ${relativeAssetPath}`,
			"---",
			"",
			snapshot,
			"",
		].join("\n");
		const raw = writeRaw(`${slug}.md`, rawBody);
		return {
			assetPath: relativeAssetPath,
			frontmatter: { asset: relativeAssetPath, captured: date.toISOString(), title, url: resolvedUrl },
			rawPath: raw.relativePath,
			slug,
		};
	} finally {
		if (typeof browser.close === "function") {
			await browser.close().catch(() => {});
		}
	}
}

module.exports = {
	CliAgentBrowser,
	captureUrl,
	sanitizeSlug,
};
