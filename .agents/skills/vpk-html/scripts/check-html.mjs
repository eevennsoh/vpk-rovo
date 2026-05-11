#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);

function collectMatches(regex, source) {
	const matches = [];
	let match;
	while ((match = regex.exec(source)) !== null) {
		matches.push(match[0]);
	}
	return matches;
}

function hasAttribute(tag, attribute) {
	return new RegExp(`\\s${attribute}(?:\\s*=|\\s|>)`, "i").test(tag);
}

export function validateHtmlString(html, label = "document") {
	const failures = [];

	if (/{{[^}]+}}/.test(html)) {
		failures.push("contains unresolved {{...}} placeholder tokens");
	}

	const remotePatterns = [
		/<script\b[^>]*\bsrc=["']https?:\/\//gi,
		/<link\b[^>]*\bhref=["']https?:\/\//gi,
		/<(?:img|source|iframe|audio|video|object|embed)\b[^>]*(?:src|data|poster)=["']https?:\/\//gi,
		/url\(\s*["']?https?:\/\//gi,
		/@import\s+(?:url\()?["']?https?:\/\//gi,
	];
	for (const pattern of remotePatterns) {
		const matches = collectMatches(pattern, html);
		if (matches.length > 0) {
			failures.push(`contains remote runtime asset reference: ${matches[0]}`);
		}
	}

	if (!/@font-face[\s\S]+data:font\/woff2;base64,/.test(html)) {
		failures.push("does not embed WOFF2 fonts as data URIs");
	}

	if (/<link\b[^>]*rel=["'][^"']*stylesheet/i.test(html)) {
		failures.push("contains an external stylesheet link instead of inline CSS");
	}

	if (/<script\b[^>]*\bsrc=/i.test(html)) {
		failures.push("contains a non-inline script");
	}

	if (!/<style>[\s\S]*<\/style>/i.test(html)) {
		failures.push("does not contain inline CSS");
	}

	if (!/\[data-theme="dark"\]/.test(html) || !/color-scheme:\s*light dark/.test(html)) {
		failures.push("does not contain the dark-mode token block");
	}

	if (/data-vpk-toggle-allowed="true"/.test(html) && !/data-vpk-theme-toggle/.test(html)) {
		failures.push("allows theme toggle but does not render the toggle control");
	}

	const metadataComments = collectMatches(/<!--[\s\S]*?-->/g, html);
	for (const comment of metadataComments) {
		if (/\/Users\/|[A-Za-z]:\\/.test(comment)) {
			failures.push("metadata comment contains an absolute source path");
			break;
		}
	}

	if (/data-vpk-algebrica="true"/.test(html)) {
		if (!/Algebrica/.test(html) || !/CC BY-NC 4\.0/.test(html)) {
			failures.push("uses Algebrica material but lacks visible Algebrica attribution");
		}
	}

	const imageTags = collectMatches(/<img\b[^>]*>/gi, html);
	for (const tag of imageTags) {
		if (!hasAttribute(tag, "alt")) {
			failures.push(`image tag lacks alt text: ${tag}`);
			break;
		}
	}

	const svgTags = collectMatches(/<svg\b[^>]*>/gi, html);
	for (const tag of svgTags) {
		if (!hasAttribute(tag, "aria-label") && !hasAttribute(tag, "aria-hidden") && !hasAttribute(tag, "aria-labelledby")) {
			failures.push(`svg lacks accessible name or decorative marker: ${tag}`);
			break;
		}
	}

	const controlTags = collectMatches(/<(?:button|textarea|input)\b[^>]*>/gi, html);
	for (const tag of controlTags) {
		if (/<input\b/i.test(tag) && /type=["']hidden["']/i.test(tag)) continue;
		if (/<button\b/i.test(tag)) {
			const tagEnd = html.indexOf("</button>", html.indexOf(tag));
			const text = tagEnd >= 0 ? html.slice(html.indexOf(tag) + tag.length, tagEnd).trim() : "";
			if (!text && !hasAttribute(tag, "aria-label") && !hasAttribute(tag, "aria-labelledby")) {
				failures.push(`button lacks accessible name: ${tag}`);
				break;
			}
		}
	}

	if (!/<main\b/i.test(html)) {
		failures.push("does not contain a main landmark");
	}

	return {
		ok: failures.length === 0,
		label,
		failures,
	};
}

export function validateHtmlFile(filePath) {
	const html = fs.readFileSync(filePath, "utf8");
	return validateHtmlString(html, filePath);
}

async function main() {
	const files = process.argv.slice(2);
	if (files.length === 0) {
		console.error("Usage: check-html.mjs <file.html> [more.html]");
		process.exitCode = 1;
		return;
	}

	const results = files.map(file => validateHtmlFile(path.resolve(process.cwd(), file)));
	for (const result of results) {
		if (result.ok) {
			console.log(`ok ${result.label}`);
		} else {
			console.error(`not ok ${result.label}`);
			for (const failure of result.failures) {
				console.error(`- ${failure}`);
			}
		}
	}

	if (results.some(result => !result.ok)) {
		process.exitCode = 1;
	}
}

if (process.argv[1] === __filename) {
	await main();
}
