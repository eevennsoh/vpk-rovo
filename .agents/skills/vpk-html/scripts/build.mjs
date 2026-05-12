#!/usr/bin/env node
/*
 * vpk-html build/validate — Node port of kami's build.py, scoped to the
 * HTML-only output we ship. PDF-only checks (density, orphans, rhythm) are
 * intentionally omitted; vpk-html has no PDF pipeline.
 *
 * Usage:
 *   node scripts/build.mjs                          # run all checks on all templates
 *   node scripts/build.mjs --check-placeholders <file>
 *   node scripts/build.mjs --sync                  # check CSS token drift
 *   node scripts/build.mjs --check-templates       # CSS / token / font sanity across templates
 *   node scripts/build.mjs --verify <file>         # Playwright render + load check
 *   node scripts/build.mjs --write-styles          # regenerate styles.css from tokens.json
 */

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectColorTokenIssues, collectSelfReferentialCustomPropertyIssues } from "./check-html.mjs";
import { checkStyleConsumers, checkStyleSource, collectFaviconIssues, writeStylesCssFromTokens } from "./shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, "..");
const TEMPLATES_DIR = path.join(SKILL_ROOT, "assets", "templates");

const PLACEHOLDER_PATTERN = /\{\{[^}]+\}\}/g;

// vpk identity check — required tokens that should appear in templates.
const REQUIRED_FONT_FACES = ["Geist", "Geist Mono", "Geist Pixel"];
const legacyElectricBlueprint = new RegExp(`#${"3553ff"}`, "i");
const legacyAccentBlue = new RegExp(`#${"1B3FE5"}`, "i");
const FORBIDDEN_KAMI_LEAKAGE = [
	{ pattern: /#1B365D/i, label: "kami brand color #1B365D (should use vpk semantic brand aliases)" },
	{ pattern: legacyElectricBlueprint, label: "legacy nonsemantic blueprint literal (should use --blueprint)" },
	{ pattern: legacyAccentBlue, label: "legacy vpk accent-blue literal (should use --blueprint)" },
	{ pattern: /#f5f4ed/i, label: "kami parchment #f5f4ed (should use --paper)" },
	{ pattern: /TsangerJinKai02/, label: "kami CJK font TsangerJinKai02" },
	{ pattern: /font-family:\s*Charter\b/, label: "kami Charter serif (should be Geist)" },
	{ pattern: /cdn\.jsdelivr\.net|cdnjs|fonts\.googleapis|fonts\.gstatic/i, label: "remote font/asset URL (violates offline rule)" },
	{ pattern: /<meta\s+name="generator"\s+content="Kami"/i, label: "kami generator tag (should be vpk-html)" },
];

function parseArgs(argv) {
	const args = { mode: "default", file: null };
	for (let i = 0; i < argv.length; i++) {
		const arg = argv[i];
		if (arg === "--check-placeholders") { args.mode = "placeholders"; args.file = argv[++i]; }
		else if (arg === "--sync" || arg === "--check-theme") { args.mode = "sync"; }
		else if (arg === "--write-styles" || arg === "--write-theme") { args.mode = "write-styles"; }
		else if (arg === "--check-templates") { args.mode = "templates"; }
		else if (arg === "--verify") { args.mode = "verify"; args.file = argv[++i]; }
		else if (arg === "--help" || arg === "-h") { args.mode = "help"; }
		else throw new Error(`Unknown argument: ${arg}`);
	}
	return args;
}

function listTemplates() {
	if (!fs.existsSync(TEMPLATES_DIR)) return [];
	return fs.readdirSync(TEMPLATES_DIR)
		.filter(name => name.endsWith(".html"))
		.map(name => path.join(TEMPLATES_DIR, name));
}

/* ============ --check-placeholders ============ */

function checkPlaceholders(filePath) {
	if (!filePath) throw new Error("--check-placeholders requires a file path");
	const abs = path.resolve(filePath);
	if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);

	const content = fs.readFileSync(abs, "utf8");
	const matches = [...content.matchAll(PLACEHOLDER_PATTERN)];
	if (matches.length === 0) {
		console.log(`✓ ${path.relative(process.cwd(), abs)} — no unfilled placeholders`);
		return { ok: true, count: 0 };
	}

	console.log(`✗ ${path.relative(process.cwd(), abs)} — ${matches.length} unfilled placeholder${matches.length === 1 ? "" : "s"}:`);
	const samples = matches.slice(0, 10);
	for (const m of samples) {
		const lineNumber = content.slice(0, m.index).split("\n").length;
		const preview = m[0].length > 80 ? `${m[0].slice(0, 77)}…` : m[0];
		console.log(`  line ${lineNumber}: ${preview}`);
	}
	if (matches.length > samples.length) {
		console.log(`  …and ${matches.length - samples.length} more`);
	}
	return { ok: false, count: matches.length };
}

/* ============ --check-templates ============ */

function syncCheck() {
	const issues = [
		...checkStyleSource(),
		...checkStyleConsumers(),
	];
	if (issues.length === 0) {
		console.log("OK: styles.css in sync with references/tokens.json and generated HTML");
		return { ok: true, failures: 0 };
	}

	console.log("✗ shared CSS drift");
	for (const issue of issues) console.log(`  ${issue}`);
	return { ok: false, failures: issues.length };
}

function checkTemplate(filePath) {
	const content = fs.readFileSync(filePath, "utf8");
	const failures = [];

	for (const family of REQUIRED_FONT_FACES) {
		if (!content.includes(`font-family: "${family}"`)) {
			failures.push(`missing @font-face declaration for "${family}"`);
		}
	}

	for (const { pattern, label } of FORBIDDEN_KAMI_LEAKAGE) {
		if (pattern.test(content)) failures.push(`kami leakage: ${label}`);
	}

	failures.push(...collectColorTokenIssues(content, filePath));
	failures.push(...collectSelfReferentialCustomPropertyIssues(content));

	if (!/<meta\s+name="generator"\s+content="vpk-html"/i.test(content)) {
		failures.push("missing or wrong <meta name=\"generator\"> (should be \"vpk-html\")");
	}

	failures.push(...collectFaviconIssues(content));

	return failures;
}

function checkTemplates() {
	const syncResult = syncCheck();
	const files = listTemplates();
	if (files.length === 0) {
		console.log(`No templates found in ${path.relative(process.cwd(), TEMPLATES_DIR)}`);
		return { ok: syncResult.ok, total: 0, failures: syncResult.failures };
	}
	let failures = 0;
	for (const file of files) {
		const issues = checkTemplate(file);
		const rel = path.relative(process.cwd(), file);
		if (issues.length === 0) {
			console.log(`✓ ${rel}`);
		} else {
			failures += 1;
			console.log(`✗ ${rel}`);
			for (const issue of issues) console.log(`  ${issue}`);
		}
	}
	console.log(`${files.length - failures}/${files.length} templates clean`);
	return { ok: syncResult.ok && failures === 0, total: files.length, failures: failures + syncResult.failures };
}

/* ============ --verify ============ */

async function verify(filePath) {
	if (!filePath) throw new Error("--verify requires a file path");
	const abs = path.resolve(filePath);
	if (!fs.existsSync(abs)) throw new Error(`File not found: ${abs}`);

	const { chromium } = await import("@playwright/test");
	const browser = await chromium.launch();
	const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: "light" });
	const page = await ctx.newPage();
	const consoleErrors = [];
	page.on("pageerror", error => consoleErrors.push(`pageerror: ${error.message}`));
	page.on("console", message => {
		if (message.type() === "error") consoleErrors.push(`console.error: ${message.text()}`);
	});
	const failedRequests = [];
	page.on("requestfailed", request => failedRequests.push(`${request.url()} (${request.failure()?.errorText})`));

	try {
		await page.goto(pathToFileURL(abs).href, { waitUntil: "domcontentloaded", timeout: 15_000 });
		try { await page.waitForLoadState("networkidle", { timeout: 4_000 }); } catch { /* fine */ }
		await page.waitForTimeout(400);
		const fontsReady = await page.evaluate(async () => {
			try { await document.fonts.ready; } catch { /* noop */ }
			const required = ["Geist", "Geist Mono", "Geist Pixel"];
			const results = [];
			for (const family of required) {
				try {
					// Force-load even if no element on the page currently uses this font.
					await document.fonts.load(`16px "${family}"`);
					results.push({ family, loaded: document.fonts.check(`16px "${family}"`) });
				} catch (error) {
					results.push({ family, loaded: false, error: String(error) });
				}
			}
			return results;
		});

		const issues = [];
		for (const { family, loaded, error } of fontsReady) {
			if (!loaded) issues.push(`font "${family}" did not load${error ? ` (${error})` : ""}`);
		}
		issues.push(...consoleErrors);
		issues.push(...failedRequests.map(req => `failed request: ${req}`));

		const rel = path.relative(process.cwd(), abs);
		if (issues.length === 0) {
			console.log(`✓ ${rel} — renders clean, fonts loaded, no console errors`);
		} else {
			console.log(`✗ ${rel}`);
			for (const issue of issues) console.log(`  ${issue}`);
		}
		return { ok: issues.length === 0, issues };
	} finally {
		await ctx.close();
		await browser.close();
	}
}

/* ============ main ============ */

function help() {
	console.log(`vpk-html build & verify

Usage:
  node scripts/build.mjs                          # check all templates
  node scripts/build.mjs --check-placeholders <file>
  node scripts/build.mjs --sync                    # check CSS token drift
  node scripts/build.mjs --check-templates
  node scripts/build.mjs --verify <file>
  node scripts/build.mjs --write-styles
  node scripts/build.mjs --help`);
}

async function main() {
	let args;
	try { args = parseArgs(process.argv.slice(2)); }
	catch (error) { console.error(error.message); process.exitCode = 1; return; }

	if (args.mode === "help") return help();
	if (args.mode === "placeholders") {
		const result = checkPlaceholders(args.file);
		if (!result.ok) process.exitCode = 1;
		return;
	}
	if (args.mode === "sync") {
		const result = syncCheck();
		if (!result.ok) process.exitCode = 1;
		return;
	}
	if (args.mode === "write-styles") {
		writeStylesCssFromTokens();
		console.log("✓ regenerated styles.css from references/tokens.json");
		return;
	}
	if (args.mode === "templates") {
		const result = checkTemplates();
		if (!result.ok) process.exitCode = 1;
		return;
	}
	if (args.mode === "verify") {
		const result = await verify(args.file);
		if (!result.ok) process.exitCode = 1;
		return;
	}

	// Default mode: run --check-templates plus a --verify on every template.
	const templatesResult = checkTemplates();
	let verifyFailures = 0;
	for (const file of listTemplates()) {
		const result = await verify(file);
		if (!result.ok) verifyFailures += 1;
	}
	if (!templatesResult.ok || verifyFailures > 0) process.exitCode = 1;
}

main().catch(error => { console.error(error); process.exitCode = 1; });
