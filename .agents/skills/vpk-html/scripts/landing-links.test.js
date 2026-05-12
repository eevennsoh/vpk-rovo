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
