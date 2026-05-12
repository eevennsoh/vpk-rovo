#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { collectFaviconIssues } from "./shared.mjs";

const __filename = fileURLToPath(import.meta.url);

function collectMatches(regex, source) {
	const matches = [];
	let match;
	while ((match = regex.exec(source)) !== null) {
		matches.push(match[0]);
	}
	return matches;
}

export function collectColorTokenIssues(source, label = "document") {
	if (/[/\\]assets[/\\]html-effectiveness[/\\]/.test(label)) return [];
	if (/data-vpk-raw-colors-allowed=["']true["']/.test(source)) return [];

	const stripped = source
		.replace(/url\(["']?data:font\/(?:woff2|otf|ttf);base64,[^)]+?\)/g, "url(data:font/...,...)")
		.replace(/url\(["']?data:image\/[^)]+?\)/g, "url(data:image/...)")
		.replace(/\[[^\]]*(?:fill|stroke)=["']#[0-9A-Fa-f]{3,8}["'][^\]]*\]/g, "[svg-color-selector]")
		.replace(/\b(?:href|id|for|aria-controls|aria-labelledby)=["']#[^"']+["']/gi, "fragment-ref")
		.replace(/\b(?:PR|Pull Request)\s+#[0-9A-Fa-f]{3,8}\b/g, "issue-ref")
		.replace(/&#[0-9A-Fa-f]+;/g, "numeric-entity");

	const issues = [];
	const colorPattern = /#[0-9A-Fa-f]{3,8}\b|\b(?:rgb|rgba|hsl|hsla)\([^)]*\)/gi;
	const lines = stripped.split("\n");
	for (let index = 0; index < lines.length; index++) {
		const line = lines[index];
		const matches = [...line.matchAll(colorPattern)]
			.map(match => match[0])
			.filter(match => !(line.includes("<") && /^#[0-9]{3,8}$/.test(match)));
		if (matches.length === 0) continue;

		const isSemanticFallback = /--[\w-]+\s*:\s*var\(--ds-[\w-]+,\s*#[0-9A-Fa-f]{3,8}\)/.test(line);
		const isShadowFallback = /--shadow\s*:\s*var\(--ds-shadow-[\w-]+,\s*[^;]*(?:rgba\([^)]*\)|#[0-9A-Fa-f]{3,8})/.test(line);
		const isAllowedGeneratedNoise = /sourceMappingURL=/.test(line);

		if (!isSemanticFallback && !isShadowFallback && !isAllowedGeneratedNoise) {
			issues.push(`line ${index + 1}: ${[...new Set(matches)].join(", ")}`);
			if (issues.length >= 12) break;
		}
	}

	if (issues.length > 0) {
		return [`contains raw color literals outside the vpk semantic alias layer (${issues.join("; ")})`];
	}
	return [];
}

export function collectSelfReferentialCustomPropertyIssues(source) {
	const issues = [];
	const lines = source.split("\n");
	for (let index = 0; index < lines.length; index++) {
		const match = lines[index].match(/^\s*(--[\w-]+)\s*:\s*var\(\1\);\s*$/);
		if (!match) continue;
		issues.push(`line ${index + 1}: ${match[1]}`);
		if (issues.length >= 12) break;
	}

	if (issues.length > 0) {
		return [`contains self-referential custom properties that invalidate theme tokens (${issues.join("; ")})`];
	}
	return [];
}

function hasAttribute(tag, attribute) {
	return new RegExp(`\\s${attribute}(?:\\s*=|\\s|>)`, "i").test(tag);
}

export function validateHtmlString(html, label = "document") {
	const failures = [];

	if (/{{[^}]+}}/.test(html) && !/data-vpk-literal-double-braces="true"/.test(html)) {
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

	if (!/@font-face[\s\S]+data:font\/(?:woff2|otf|ttf);base64,/.test(html)) {
		failures.push("does not embed local fonts as data URIs");
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

	failures.push(...collectColorTokenIssues(html, label));
	failures.push(...collectSelfReferentialCustomPropertyIssues(html));
	failures.push(...collectFaviconIssues(html));

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

export function auditColorTokensFile(filePath) {
	const html = fs.readFileSync(filePath, "utf8");
	return {
		ok: collectColorTokenIssues(html, filePath).length === 0,
		label: filePath,
		failures: collectColorTokenIssues(html, filePath),
	};
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
