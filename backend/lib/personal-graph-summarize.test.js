"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const {
	normalizeSummaryOutput,
	resolveSummarizeBinary,
	runSummarizeCli,
} = require("./personal-graph-summarize");
const {
	assertVaultBoundPath,
	buildSummaryContextMarkdown,
	buildSummaryPrompt,
	createSourceFingerprint,
	createSelectionSummarizeInput,
	getSelectedNodeContext,
} = require("./personal-graph-summary-context");

function execFileOk(assertCall, stdout = "# Summary\n\n- One\n- Two") {
	return (command, args, options, callback) => {
		assertCall(command, args, options);
		queueMicrotask(() => callback(null, stdout, ""));
	};
}

function execFileError(error) {
	return (_command, _args, _options, callback) => {
		queueMicrotask(() => callback(error, "", error.stderr ?? ""));
	};
}

test("resolveSummarizeBinary prefers the repo-local binary", () => {
	const repoRoot = path.join(os.tmpdir(), "personal-graph-summarize-bin");
	const expected = path.join(repoRoot, "node_modules", ".bin", process.platform === "win32" ? "summarize.cmd" : "summarize");
	assert.equal(
		resolveSummarizeBinary({
			fsImpl: {
				existsSync: (candidate) => candidate === expected,
				readFileSync: fs.readFileSync,
			},
			repoRoot,
		}),
		expected,
	);
});

test("runSummarizeCli passes length, model, timeout, and plain output flags", async (t) => {
	const originalModel = process.env.PERSONAL_GRAPH_SUMMARIZE_MODEL;
	process.env.PERSONAL_GRAPH_SUMMARIZE_MODEL = "openai/gpt-5-mini";
	t.after(() => {
		if (originalModel === undefined) delete process.env.PERSONAL_GRAPH_SUMMARIZE_MODEL;
		else process.env.PERSONAL_GRAPH_SUMMARIZE_MODEL = originalModel;
	});

	const result = await runSummarizeCli({
		execFileImpl: execFileOk((_command, args, options) => {
			assert.equal(args[0], "/tmp/input.md");
			assert.deepEqual(args.slice(1, 7), ["--length", "short", "--model", "openai/gpt-5-mini", "--timeout", "1234ms"]);
			assert.ok(args.includes("--plain"));
			assert.ok(args.includes("--no-color"));
			assert.equal(options.timeout, 1234);
		}),
		input: "/tmp/input.md",
		length: "short",
		timeoutMs: 1234,
	});

	assert.equal(result.summary, "# Summary\n\n- One\n- Two");
	assert.deepEqual(result.takeaways, ["One", "Two"]);
});

test("runSummarizeCli reports abort, timeout, and non-zero failures clearly", async () => {
	await assert.rejects(
		() => runSummarizeCli({
			execFileImpl: execFileError(Object.assign(new Error("aborted"), { code: "ABORT_ERR" })),
			input: "/tmp/input.md",
		}),
		(error) => error?.code === "SUMMARIZE_ABORTED",
	);
	await assert.rejects(
		() => runSummarizeCli({
			execFileImpl: execFileError(Object.assign(new Error("timed out"), { code: "ETIMEDOUT" })),
			input: "/tmp/input.md",
			timeoutMs: 5,
		}),
		(error) => error?.code === "SUMMARIZE_TIMEOUT",
	);
	await assert.rejects(
		() => runSummarizeCli({
			execFileImpl: execFileError(Object.assign(new Error("exit 1"), { stderr: "bad key" })),
			input: "/tmp/input.md",
		}),
		(error) => error?.code === "SUMMARIZE_FAILED" && /bad key/u.test(error.message),
	);
});

test("normalizeSummaryOutput rejects empty CLI output", () => {
	assert.throws(
		() => normalizeSummaryOutput(" \n "),
		(error) => error?.code === "MALFORMED_SUMMARY",
	);
});

test("vault-bound summary input rejects paths outside the configured vault", (t) => {
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-summarize-vault-"));
	process.env.PERSONAL_GRAPH_SELECTED_VAULT = vaultRoot;
	t.after(() => {
		if (originalSelectedVault === undefined) delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;
		else process.env.PERSONAL_GRAPH_SELECTED_VAULT = originalSelectedVault;
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});

	assert.equal(assertVaultBoundPath(path.join(vaultRoot, "raw", "source.md")), path.join(vaultRoot, "raw", "source.md"));
	assert.throws(
		() => assertVaultBoundPath(path.join(os.tmpdir(), "outside.md")),
		(error) => error?.code === "VAULT_PATH_OUTSIDE_ROOT",
	);
});

test("captured URL raw nodes forward the original frontmatter URL to summarize", (t) => {
	const originalSelectedVault = process.env.PERSONAL_GRAPH_SELECTED_VAULT;
	const vaultRoot = fs.mkdtempSync(path.join(os.tmpdir(), "personal-graph-summarize-url-"));
	fs.mkdirSync(path.join(vaultRoot, "raw"), { recursive: true });
	fs.writeFileSync(
		path.join(vaultRoot, "raw", "capture.md"),
		"---\ntitle: Capture\nurl: https://example.com/article\n---\n\nCaptured body.",
		"utf8",
	);
	process.env.PERSONAL_GRAPH_SELECTED_VAULT = vaultRoot;
	t.after(() => {
		if (originalSelectedVault === undefined) delete process.env.PERSONAL_GRAPH_SELECTED_VAULT;
		else process.env.PERSONAL_GRAPH_SELECTED_VAULT = originalSelectedVault;
		fs.rmSync(vaultRoot, { force: true, recursive: true });
	});

	const prepared = createSelectionSummarizeInput({
		edges: [],
		generatedAt: "2026-05-07T00:00:00.000Z",
		nodes: [{
			bodyPreview: "",
			connectionCount: 0,
			dangling: false,
			externalUrl: null,
			frontmatter: {},
			id: "raw:capture",
			kind: "raw",
			label: "capture.md",
			missing: false,
			path: path.join(vaultRoot, "raw", "capture.md"),
			provider: "vault",
			relativePath: "raw/capture.md",
			size: 10,
			slug: "capture",
			title: "capture.md",
			updatedAt: null,
		}],
		stats: { danglingCount: 0, edgeCount: 0, nodeCount: 1, rawCount: 1, wikiCount: 0 },
	}, "raw:capture");

	assert.equal(prepared.input, "https://example.com/article");
	assert.equal(prepared.inputKind, "url");
});

test("summary prompt uses editorial article contract without raw graph metadata", () => {
	const explorer = {
		edges: [{
			id: "edge-1",
			kind: "related",
			label: "supports",
			metadata: {},
			relationKinds: ["related"],
			source: "node:selected",
			target: "node:neighbor",
		}],
		generatedAt: "2026-05-10T00:00:00.000Z",
		nodes: [
			{
				bodyPreview: "Selected body preview.",
				connectionCount: 1,
				dangling: false,
				externalUrl: "https://example.com/selected",
				frontmatter: { provider: "vault", secret: "raw" },
				id: "node:selected",
				kind: "source",
				label: "Selected",
				missing: false,
				path: null,
				provider: "vault",
				relativePath: "wiki/selected.md",
				size: 1,
				slug: "selected",
				title: "Selected",
				updatedAt: "2026-05-10T00:00:00.000Z",
			},
			{
				bodyPreview: "Neighbor body preview.",
				connectionCount: 1,
				dangling: false,
				externalUrl: null,
				frontmatter: { kind: "raw" },
				id: "node:neighbor",
				kind: "concept",
				label: "Neighbor",
				missing: false,
				path: null,
				provider: "vault",
				relativePath: "wiki/neighbor.md",
				size: 1,
				slug: "neighbor",
				title: "Neighbor",
				updatedAt: "2026-05-10T01:00:00.000Z",
			},
		],
		stats: { danglingCount: 0, edgeCount: 1, nodeCount: 2, rawCount: 0, wikiCount: 2 },
	};
	const selection = getSelectedNodeContext(explorer, "node:selected");
	const contextMarkdown = buildSummaryContextMarkdown(selection);
	const prompt = buildSummaryPrompt(selection);

	assert.match(prompt, /## What this is/u);
	assert.match(prompt, /## Why it matters/u);
	assert.match(prompt, /## Connected work/u);
	assert.match(prompt, /## Source evidence/u);
	assert.match(prompt, /Do not print raw IDs, ARIs, provider, kind, relativePath, frontmatter keys/u);
	assert.doesNotMatch(contextMarkdown, /\b(?:id|kind|provider|relativePath|relative path|frontmatter)\s*:/iu);
	assert.doesNotMatch(contextMarkdown, /node:selected/u);
	assert.doesNotMatch(contextMarkdown, /wiki\/selected\.md/u);
	assert.match(contextMarkdown, /supports: Selected -> Neighbor/u);
});

test("source fingerprint changes by length-independent source context", () => {
	const baseNode = {
		bodyPreview: "Selected body",
		connectionCount: 0,
		dangling: false,
		externalUrl: null,
		frontmatter: {},
		id: "selected",
		kind: "source",
		label: "Selected",
		missing: false,
		path: null,
		provider: "twg",
		relativePath: "selected",
		size: 1,
		slug: "selected",
		title: "Selected",
		updatedAt: null,
	};
	const explorer = {
		edges: [],
		generatedAt: "2026-05-10T00:00:00.000Z",
		nodes: [baseNode],
		stats: { danglingCount: 0, edgeCount: 0, nodeCount: 1, rawCount: 0, wikiCount: 1 },
	};
	const selection = getSelectedNodeContext(explorer, "selected");
	const first = createSourceFingerprint({ explorer, selection, source: "twg", workWindow: "7d" });
	const second = createSourceFingerprint({ explorer, selection, source: "twg", workWindow: "14d" });

	assert.notEqual(first, second);
	assert.equal(first.length, 24);
});
