#!/usr/bin/env node

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { FONT_FILES } from "./shared.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, "..");
const FONT_DIR = path.join(SKILL_ROOT, "assets", "fonts");

const SOURCE_NOTES = {
	"Charlie Display": "Atlassian Charlie Display asset committed to the repo.",
	"Charlie Text": "Atlassian Charlie Text asset committed to the repo.",
	"Atlassian Mono": "Atlassian Mono asset committed to the repo.",
	"Atlassian Mono Numeric": "Atlassian Mono regular face reused with unicode-range U+0030-0039.",
};

function hashFile(filePath) {
	return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

function validateFont(spec) {
	const target = path.join(FONT_DIR, spec.file);
	if (!fs.existsSync(target)) throw new Error(`Missing font file: ${spec.file}`);

	const stats = fs.statSync(target);
	if (!stats.isFile()) throw new Error(`Font path is not a file: ${spec.file}`);
	if (stats.size === 0) throw new Error(`Font file is empty: ${spec.file}`);

	return {
		family: spec.family,
		file: spec.file,
		bytes: stats.size,
		sha256: hashFile(target),
		weight: spec.weight,
		style: spec.style,
		format: spec.format,
		mime: spec.mime,
		unicodeRange: spec.unicodeRange ?? "",
		source: SOURCE_NOTES[spec.family] ?? "Local committed font asset.",
	};
}

function writeManifest(entries) {
	const lines = [
		"# Font Manifest",
		"",
		"These local font files are embedded as data URIs by vpk-html so generated HTML works offline.",
		"",
		"| Family | File | Weight | Style | Format | MIME | Unicode range | Bytes | SHA-256 | Source |",
		"| --- | --- | ---: | --- | --- | --- | --- | ---: | --- | --- |",
		...entries.map(entry => `| ${entry.family} | ${entry.file} | ${entry.weight} | ${entry.style} | ${entry.format} | ${entry.mime} | ${entry.unicodeRange || "all"} | ${entry.bytes} | ${entry.sha256} | ${entry.source} |`),
		"",
	];
	fs.writeFileSync(path.join(FONT_DIR, "MANIFEST.md"), lines.join("\n"), "utf8");
}

function main() {
	try {
		fs.mkdirSync(FONT_DIR, { recursive: true });
		const entries = FONT_FILES.map(validateFont);
		writeManifest(entries);
		for (const entry of entries) {
			console.log(`${entry.file} ${entry.bytes} bytes ${entry.sha256}`);
		}
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}

if (process.argv[1] === __filename) {
	main();
}
