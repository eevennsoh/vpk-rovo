#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

let modules;

async function loadModules() {
	if (!modules) {
		const [checkHtml, shared] = await Promise.all([
			import("./check-html.mjs"),
			import("./shared.mjs"),
		]);
		modules = {
			validateHtmlFile: checkHtml.validateHtmlFile,
			ROOT: shared.ROOT,
		};
	}
	return modules;
}

function readLandingRows(indexPath) {
	const html = fs.readFileSync(indexPath, "utf8");
	const rows = [];
	const rowPattern = /<a\s+class="demo-row"\s+href="([^"]+)"/g;
	let match;
	while ((match = rowPattern.exec(html)) !== null) {
		rows.push(match[1]);
	}
	return rows;
}

function readCssBlock(html, selector) {
	const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
	const match = new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`).exec(html);
	assert.ok(match, `missing CSS block: ${selector}`);
	return match[1];
}

test("landing rows link only to demo files", async () => {
	const { ROOT } = await loadModules();
	const rows = readLandingRows(path.join(ROOT, "index.html"));
	assert.ok(rows.length > 0, "expected at least one landing demo row");

	for (const href of rows) {
		assert.ok(
			href.startsWith("assets/demos/"),
			`landing row must point to assets/demos/: ${href}`,
		);
		assert.ok(
			!href.startsWith("assets/templates/") && !href.startsWith("assets/diagrams/"),
			`landing row must not point at raw sources: ${href}`,
		);
	}
});

test("landing removes decorative section separators", async () => {
	const { ROOT } = await loadModules();
	const landing = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

	for (const selector of [".hero", ".hero-intro", ".demo-contents", ".demo-category", ".demo-category:last-child"]) {
		assert.doesNotMatch(readCssBlock(landing, selector), /border-(?:top|bottom)\s*:/);
	}
});

test("landing has no footer", async () => {
	const { ROOT } = await loadModules();
	const landing = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

	assert.doesNotMatch(landing, /<footer\b/i);
	assert.doesNotMatch(landing, /\bfooter\s*\{/);
	assert.doesNotMatch(landing, /local-only demo catalog/);
});

test("design-md heuristic lint commands point at repo-owned files", async () => {
	const { ROOT } = await loadModules();
	const skill = fs.readFileSync(path.join(ROOT, "design-md", "SKILL.md"), "utf8");
	const scriptPath = ".agents/skills/vpk-html/design-md/scripts/lint-design-heuristics.ts";

	assert.ok(
		fs.existsSync(path.join(ROOT, "design-md", "scripts", "lint-design-heuristics.ts")),
		"missing design-md heuristic lint script",
	);
	assert.match(skill, new RegExp(`npx tsx ${scriptPath.replaceAll(".", "\\.")} <file>`));
	assert.match(
		skill,
		new RegExp(`${scriptPath.replaceAll(".", "\\.")} \\.agents/skills/vpk-html/design-md/DESIGN\\.dark\\.md`),
	);
	assert.doesNotMatch(skill, /skills\/design-system\/design-md\/skill/);
});

test("landing backdrop uses dotted grid strokes without interior dots", async () => {
	const { ROOT } = await loadModules();
	const styles = fs.readFileSync(path.join(ROOT, "styles.css"), "utf8");
	const landing = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

	for (const source of [styles, landing]) {
		assert.match(source, /--grid-dot-gap:\s*12px;/);
		assert.match(
			source,
			/--grid-background:\s*radial-gradient\(circle at 1px 1px, var\(--grid-dot\) 1\.25px, transparent 1\.5px\), radial-gradient\(circle at 1px 1px, var\(--grid-dot\) 1\.25px, transparent 1\.5px\);/,
		);
		assert.match(
			source,
			/--grid-background-size:\s*var\(--grid-major-size\) var\(--grid-dot-gap\), var\(--grid-dot-gap\) var\(--grid-major-size\);/,
		);
		assert.doesNotMatch(
			source,
			/radial-gradient\(circle at 1px 1px, var\(--grid-dot\) 1px, transparent 1\.25px\)/,
		);
		assert.doesNotMatch(source, /linear-gradient\(to (right|bottom), var\(--grid-line\) 1px, transparent 1px\)/);
	}
});

test("landing demo targets exist and validate", async () => {
	const { ROOT, validateHtmlFile } = await loadModules();
	for (const href of readLandingRows(path.join(ROOT, "index.html"))) {
		const target = path.join(ROOT, href);
		assert.ok(fs.existsSync(target), `missing landing target: ${href}`);

		const html = fs.readFileSync(target, "utf8");
		if (/{{[^}]+}}/.test(html)) {
			assert.match(
				html,
				/data-vpk-literal-double-braces="true"/,
				`literal double braces require explicit opt-in: ${href}`,
			);
		}

		const result = validateHtmlFile(target);
		assert.equal(
			result.ok,
			true,
			`${href} failed check-html:\n${result.failures.join("\n")}`,
		);
	}
});
