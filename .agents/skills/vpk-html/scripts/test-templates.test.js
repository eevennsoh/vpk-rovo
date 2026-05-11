const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const SKILL_ROOT = path.resolve(__dirname, "..");
const RENDER_CLI = path.join(SKILL_ROOT, "scripts", "render.mjs");
const CHECK_CLI = path.join(SKILL_ROOT, "scripts", "check-html.mjs");

async function loadModules() {
	const [schema, catalog, examples, renderer, checker] = await Promise.all([
		import("../schemas/render-payload.schema.mjs"),
		import("../templates/catalog.mjs"),
		import("./example-payloads.mjs"),
		import("./render.mjs"),
		import("./check-html.mjs"),
	]);

	return {
		...schema,
		...catalog,
		...examples,
		...renderer,
		...checker,
	};
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

test("template catalog covers every schema template exactly once", async () => {
	const { TEMPLATE_IDS, TEMPLATE_DEFINITIONS } = await loadModules();
	const ids = TEMPLATE_DEFINITIONS.map(definition => definition.id);

	assert.deepEqual([...ids].sort(), [...TEMPLATE_IDS].sort());
	assert.equal(new Set(ids).size, TEMPLATE_IDS.length);
});

test("every template has an example input fixture and output file", async () => {
	const { TEMPLATE_DEFINITIONS } = await loadModules();

	for (const definition of TEMPLATE_DEFINITIONS) {
		const inputPath = path.join(SKILL_ROOT, "examples", "input", `${definition.id}.json`);
		const outputPath = path.join(SKILL_ROOT, "examples", "output", `${definition.id}.html`);

		assert.ok(fs.existsSync(inputPath), `${definition.id} input fixture should exist`);
		assert.ok(fs.existsSync(outputPath), `${definition.id} output example should exist`);
	}
});

test("every template fixture validates, renders, and passes static HTML checks", async () => {
	const { TEMPLATE_DEFINITIONS, validateRenderPayload, renderPayloadToString, validateHtmlString } =
		await loadModules();

	for (const definition of TEMPLATE_DEFINITIONS) {
		const inputPath = path.join(SKILL_ROOT, "examples", "input", `${definition.id}.json`);
		const payload = validateRenderPayload(readJson(inputPath));
		const html = renderPayloadToString(payload);
		const validation = validateHtmlString(html, definition.id);

		assert.equal(payload.template, definition.id);
		assert.equal(validation.ok, true, `${definition.id}: ${validation.failures.join("; ")}`);
		assert.match(html, /data-vpk-theme-toggle/);
		assert.doesNotMatch(html, /{{[^}]+}}/);
	}
});

test("schema rejects missing required fields and remote assets", async () => {
	const { renderPayloadSchema } = await loadModules();

	assert.throws(
		() => renderPayloadSchema.parse({ template: "one-pager" }),
		/error|invalid|required/i,
	);
	assert.throws(
		() =>
			renderPayloadSchema.parse({
				template: "one-pager",
				title: "Bad asset",
				assets: [
					{
						path: "https://example.test/image.png",
						alt: "Remote image",
					},
				],
			}),
		/Remote assets are not allowed/i,
	);
});

test("schema only allows local card links", async () => {
	const { renderPayloadSchema } = await loadModules();
	const basePayload = {
		template: "one-pager",
		title: "Local links",
		sections: [
			{
				type: "section",
				cards: [
					{
						title: "Safe output",
						href: "output/one-pager.html",
					},
					{
						title: "Safe anchor",
						href: "#section-summary",
					},
				],
			},
		],
	};

	assert.equal(renderPayloadSchema.parse(basePayload).sections[0].cards.length, 2);

	for (const href of ["javascript:alert(1)", "data:text/html,boom", "//example.test/doc.html"]) {
		assert.throws(
			() =>
				renderPayloadSchema.parse({
					...basePayload,
					sections: [
						{
							type: "section",
							cards: [
								{
									title: "Unsafe link",
									href,
								},
							],
						},
					],
				}),
			/Only local card links are allowed/i,
		);
	}
});

test("renderer refuses overwrite unless --overwrite is supplied", async () => {
	const { buildExamplePayload, getTemplateDefinition } = await loadModules();
	const tempDir = fs.mkdtempSync(path.join(SKILL_ROOT, ".tmp-overwrite-"));
	const inputPath = path.join(tempDir, "payload.json");
	const outputPath = path.join(tempDir, "document.html");

	try {
		fs.writeFileSync(
			inputPath,
			JSON.stringify(buildExamplePayload(getTemplateDefinition("one-pager")), null, "\t"),
			"utf8",
		);

		execFileSync(process.execPath, [RENDER_CLI, "--input", inputPath, "--out", outputPath], {
			cwd: path.resolve(SKILL_ROOT, "../../.."),
			stdio: "pipe",
		});

		assert.throws(
			() =>
				execFileSync(process.execPath, [RENDER_CLI, "--input", inputPath, "--out", outputPath], {
					cwd: path.resolve(SKILL_ROOT, "../../.."),
					stdio: "pipe",
				}),
			/Command failed/i,
		);

		execFileSync(
			process.execPath,
			[RENDER_CLI, "--input", inputPath, "--out", outputPath, "--overwrite"],
			{
				cwd: path.resolve(SKILL_ROOT, "../../.."),
				stdio: "pipe",
			},
		);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("renderer rejects output paths outside the repository", async () => {
	const { buildExamplePayload, getTemplateDefinition } = await loadModules();
	const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "vpk-html-outside-"));
	const inputPath = path.join(tempDir, "payload.json");
	const outputPath = path.join(tempDir, "escape.html");

	try {
		fs.writeFileSync(
			inputPath,
			JSON.stringify(buildExamplePayload(getTemplateDefinition("one-pager")), null, "\t"),
			"utf8",
		);

		assert.throws(
			() =>
				execFileSync(process.execPath, [RENDER_CLI, "--input", inputPath, "--out", outputPath], {
					cwd: path.resolve(SKILL_ROOT, "../../.."),
					stdio: "pipe",
				}),
			error => {
				assert.match(
					error.stderr.toString(),
					/Output path must stay inside the repository/i,
				);
				return true;
			},
		);
		assert.equal(fs.existsSync(outputPath), false);
	} finally {
		fs.rmSync(tempDir, { recursive: true, force: true });
	}
});

test("example outputs have dark mode, no placeholders, and pass check-html", async () => {
	const { TEMPLATE_DEFINITIONS } = await loadModules();

	for (const definition of TEMPLATE_DEFINITIONS) {
		const outputPath = path.join(SKILL_ROOT, "examples", "output", `${definition.id}.html`);
		const html = fs.readFileSync(outputPath, "utf8");

		assert.match(html, /\[data-theme="dark"\]/, `${definition.id} should include dark tokens`);
		assert.doesNotMatch(html, /{{[^}]+}}/, `${definition.id} should not include placeholders`);
		assert.doesNotMatch(html, /Offline output|Manual routing|intentionally small/, `${definition.id} should not use smoke-test demo copy`);
		execFileSync(process.execPath, [CHECK_CLI, outputPath], {
			cwd: path.resolve(SKILL_ROOT, "../../.."),
			stdio: "pipe",
		});
	}
});

test("example gallery links every template card to a generated output", async () => {
	const { TEMPLATE_DEFINITIONS } = await loadModules();
	const galleryPath = path.join(SKILL_ROOT, "examples", "gallery.html");
	const html = fs.readFileSync(galleryPath, "utf8");

	for (const definition of TEMPLATE_DEFINITIONS) {
		assert.match(
			html,
			new RegExp(`href="output/${definition.id}\\.html"`),
			`${definition.id} should be linked from the gallery`,
		);
	}

	const linkCount = (html.match(/class="vpk-card vpk-card-link"/g) || []).length;
	assert.equal(linkCount, TEMPLATE_DEFINITIONS.length);
	assert.match(html, /data-initial-mode="light"/);
});

test("representative examples contain real visual demonstrations", () => {
	const readOutput = id => fs.readFileSync(path.join(SKILL_ROOT, "examples", "output", `${id}.html`), "utf8");

	assert.match(readOutput("svg-illustrations"), /vpk-figure-sheet/);
	assert.match(readOutput("flowchart-diagram"), /Artifact production flow/);
	assert.match(readOutput("design-system"), /Token swatches/);
	assert.match(readOutput("math-interactive"), /slope = rise \/ run/);
	assert.match(readOutput("editor-prompt-tuner"), /Editable prompt payload/);
});

test("Algebrica examples render visible attribution", () => {
	const outputPath = path.join(SKILL_ROOT, "examples", "output", "math-knowledge.html");
	const html = fs.readFileSync(outputPath, "utf8");

	assert.match(html, /Algebrica by Antonio Lupetti/);
	assert.match(html, /CC BY-NC 4\.0/);
});
