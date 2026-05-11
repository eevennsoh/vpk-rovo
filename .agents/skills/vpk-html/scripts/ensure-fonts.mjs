#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, "..");
const FONT_DIR = path.join(SKILL_ROOT, "assets", "fonts");

// Geist trio by Vercel (SIL OFL). Distributed via the official npm package.
// Files are committed to assets/fonts/; this script re-fetches them only if
// the local file is missing or empty.
const FONT_SPECS = [
	{
		family: "Geist",
		file: "Geist-Regular.woff2",
		url: "https://unpkg.com/geist@latest/dist/fonts/geist-sans/Geist-Regular.woff2",
		source: "Vercel Geist (SIL OFL) via the official npm package.",
		license: "SIL Open Font License 1.1.",
	},
	{
		family: "Geist Mono",
		file: "GeistMono-Regular.woff2",
		url: "https://unpkg.com/geist@latest/dist/fonts/geist-mono/GeistMono-Regular.woff2",
		source: "Vercel Geist Mono (SIL OFL) via the official npm package.",
		license: "SIL Open Font License 1.1.",
	},
	{
		family: "Geist Pixel",
		file: "GeistPixel-Square.woff2",
		url: "https://unpkg.com/geist@latest/dist/fonts/geist-pixel/GeistPixel-Square.woff2",
		source: "Vercel Geist Pixel · Square variant (SIL OFL) via the official npm package.",
		license: "SIL Open Font License 1.1.",
	},
];

async function fetchUrl(url, target) {
	const response = await fetch(url, { redirect: "follow" });
	if (!response.ok) {
		throw new Error(`Fetch failed for ${url}: HTTP ${response.status}`);
	}
	const buffer = Buffer.from(await response.arrayBuffer());
	fs.writeFileSync(target, buffer);
}

async function ensureFont(spec) {
	const target = path.join(FONT_DIR, spec.file);

	if (!fs.existsSync(target) || fs.statSync(target).size === 0) {
		console.log(`fetching ${spec.file} from ${spec.url}`);
		await fetchUrl(spec.url, target);
	}

	const stats = fs.statSync(target);
	if (stats.size === 0) throw new Error(`Font file is empty: ${spec.file}`);

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
		const entries = [];
		for (const spec of FONT_SPECS) entries.push(await ensureFont(spec));
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
