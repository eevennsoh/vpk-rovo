const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT_DIR = path.resolve(__dirname, "..");
const SOURCE_DIRS = ["app", "components"];
const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);

const DISALLOWED_PATTERNS = [
	{
		name: "raw ADS color arbitrary utilities",
		pattern: /\b(?:bg|text|border)-\[var\(--ds-[^)]+\)\]/g,
		guidance: "Use mapped semantic classes such as bg-bg-neutral, text-text-subtle, or border-border-bold.",
	},
	{
		name: "raw ADS shadow arbitrary utilities",
		pattern: /\bshadow-\[var\(--ds-shadow-(?:overlay|raised|overflow)\)\]/g,
		guidance: "Use mapped shadow classes such as shadow-md, shadow-lg, or shadow-xl.",
	},
	{
		name: "arbitrary motion token utilities",
		pattern: /\b(?:duration-\[var\(--duration-(?:instant|fast|normal|medium|slow|slower|slowest)\)\]|ease-\[var\(--ease-(?:linear|in|out|in-out|cubic)\)\])/g,
		guidance: "Use mapped motion classes such as duration-normal, duration-medium, ease-out, or ease-in-out.",
	},
];

function listSourceFiles(dir) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(dir, entry.name);

		if (entry.isDirectory()) {
			files.push(...listSourceFiles(entryPath));
			continue;
		}

		if (entry.isFile() && SOURCE_EXTENSIONS.has(path.extname(entry.name))) {
			files.push(entryPath);
		}
	}

	return files;
}

function getLineNumber(source, index) {
	return source.slice(0, index).split("\n").length;
}

function findViolations() {
	const files = SOURCE_DIRS.flatMap((dir) => listSourceFiles(path.join(ROOT_DIR, dir)));
	const violations = [];

	for (const file of files) {
		const source = fs.readFileSync(file, "utf8");
		const relativePath = path.relative(ROOT_DIR, file);

		for (const { name, pattern, guidance } of DISALLOWED_PATTERNS) {
			for (const match of source.matchAll(pattern)) {
				violations.push({
					path: relativePath,
					line: getLineNumber(source, match.index),
					match: match[0],
					name,
					guidance,
				});
			}
		}
	}

	return violations;
}

test("VPK UI source uses mapped design token utilities for common token classes", () => {
	const violations = findViolations();

	assert.deepEqual(
		violations,
		[],
		violations
			.map(({ path: filePath, line, match, name, guidance }) => {
				return `${filePath}:${line} ${name}: ${match}\n${guidance}`;
			})
			.join("\n\n"),
	);
});
