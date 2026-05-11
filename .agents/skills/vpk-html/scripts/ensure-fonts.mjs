#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, "..");
const REPO_ROOT = path.resolve(SKILL_ROOT, "../../..");
const FONT_DIR = path.join(SKILL_ROOT, "assets", "fonts");

const FONT_SPECS = [
	{
		family: "VT323",
		file: "VT323-Regular.woff2",
		fallback: "public/fonts/DepartureMono/DepartureMono-Regular.woff2",
		source: "Vendored from local VPK font assets for offline embedding in v1 examples.",
		license: "Local repository font asset; replace with upstream VT323 WOFF2 before external distribution.",
	},
	{
		family: "Source Serif 4",
		file: "SourceSerif4-Regular.woff2",
		fallback: "public/fonts/affigere/Affigere-Regular.woff2",
		source: "Vendored from local VPK font assets for offline embedding in v1 examples.",
		license: "Local repository font asset; replace with upstream Source Serif 4 WOFF2 before external distribution.",
	},
	{
		family: "JetBrains Mono",
		file: "JetBrainsMono-Regular.woff2",
		fallback: "public/fonts/DepartureMono/DepartureMono-Regular.woff2",
		source: "Vendored from local VPK font assets for offline embedding in v1 examples.",
		license: "Local repository font asset; replace with upstream JetBrains Mono WOFF2 before external distribution.",
	},
];

function ensureFont(spec) {
	const target = path.join(FONT_DIR, spec.file);
	const fallback = path.join(REPO_ROOT, spec.fallback);

	if (!fs.existsSync(target)) {
		if (!fs.existsSync(fallback)) {
			throw new Error(`Missing ${spec.file} and fallback ${spec.fallback}`);
		}
		fs.copyFileSync(fallback, target);
	}

	const stats = fs.statSync(target);
	if (stats.size === 0) {
		throw new Error(`Font file is empty: ${spec.file}`);
	}

	return {
		family: spec.family,
		file: spec.file,
		bytes: stats.size,
		source: spec.source,
		license: spec.license,
	};
}

function writeManifest(entries) {
	const lines = [
		"# Font Manifest",
		"",
		"These WOFF2 files are embedded as data URIs by the vpk-html renderer so generated HTML works offline.",
		"",
		"| Family | File | Bytes | Source | License note |",
		"| --- | --- | ---: | --- | --- |",
		...entries.map(entry => `| ${entry.family} | ${entry.file} | ${entry.bytes} | ${entry.source} | ${entry.license} |`),
		"",
	];
	fs.writeFileSync(path.join(FONT_DIR, "MANIFEST.md"), lines.join("\n"), "utf8");
}

async function main() {
	try {
		fs.mkdirSync(FONT_DIR, { recursive: true });
		const entries = FONT_SPECS.map(ensureFont);
		writeManifest(entries);
		for (const entry of entries) {
			console.log(`${entry.file} ${entry.bytes} bytes`);
		}
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}

if (process.argv[1] === __filename) {
	await main();
}
