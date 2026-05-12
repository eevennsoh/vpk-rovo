/**
 * lint-design-heuristics.ts — rough heuristic linter aligned with DESIGN.md.
 *
 * Usage:
 *   npx tsx lint-design-heuristics.ts <file> [<file> ...] [options]
 *
 * Default: **core rules only** — token-ish drift (hex, spacing, shadows, title case).
 * Assumes you may *not* have ADS React components in scope.
 *
 * With **`--validate-code`** (alias: `--ads`, `--with-ads`): also runs checks suited to
 * real app source — raw `<button>`, `<input>`, etc. and non-ADS styling imports
 * (migration hints toward Atlaskit/ADS where applicable).
 *
 * Core flags:
 *   - Raw hex / rgb / hsl color literals
 *   - Raw px/rem/em in spacing properties (unless token-looking)
 *   - Hardcoded box-shadow values
 *   - Title Case in JSX text content (heuristic)
 *   - Thick border-left/right accent stripes; gradient + text clip (DESIGN.md → Design rigor, deterministic anti-patterns)
 *
 * Validate-code-only rules (--validate-code / --ads):
 *   - Raw HTML interactive elements (<button>, <input>, <select>, <h1>-<h6>, <p>)
 *   - Non-ADS styling library imports (styled-components, @emotion/*, tailwindcss)
 *
 * For CI on Atlaskit codebases, prefer the ADS ESLint plugins (see atlassian-design-system skill).
 *
 * Output: default text table, exit non-zero if any **error**-severity hit (core only by default).
 *   --format=json: JSON { file, violations: [...] }
 *
 * Zero dependencies — runnable via `npx tsx <path>/lint-design-heuristics.ts <file>`.
 */
import { readFileSync, statSync } from 'node:fs';
import { relative } from 'node:path';

type Severity = 'error' | 'suggestion';

interface Violation {
	rule: string;
	line: number;
	snippet: string;
	severity: Severity;
	fix: string;
}

interface Result {
	file: string;
	violations: Violation[];
}

interface Rule {
	id: string;
	severity: Severity;
	fix: string;
	/** When true, rule runs only with --validate-code (--ads) */
	codeValidationOnly?: boolean;
	test: (line: string, fullText: string) => string | null;
	skipComments?: boolean;
	skipIfTokenCall?: boolean;
}

const isCommentLine = (line: string): boolean => {
	const trimmed = line.trim();
	return (
		trimmed.startsWith('//') ||
		trimmed.startsWith('#') ||
		trimmed.startsWith('* ') ||
		trimmed.startsWith('*/') ||
		trimmed.startsWith('/*')
	);
};

const hasTokenCall = (line: string): boolean => /\btoken\s*\(/.test(line);

/** Always on: DESIGN.md token discipline without assuming Atlaskit components. */
const coreRules: Rule[] = [
	{
		id: 'no-raw-hex-color',
		severity: 'error',
		fix: 'Use DESIGN.md token names, var(--ds-*), or hex anchors from **Colors** — avoid raw literals.',
		test: (line) => {
			const match = line.match(/#[0-9a-fA-F]{3,8}\b/);
			if (!match) return null;
			if (/https?:\/\/[^\s]*#[0-9a-fA-F]/.test(line)) return null;
			const hex = match[0].slice(1);
			if (![3, 4, 6, 8].includes(hex.length)) return null;
			return match[0];
		},
	},
	{
		id: 'no-raw-rgb',
		severity: 'error',
		fix: 'Use DESIGN.md token names, var(--ds-*), or hex anchors from **Colors** — avoid raw literals.',
		test: (line) => {
			const match = line.match(/\brgba?\s*\([^)]*\)/);
			return match ? match[0] : null;
		},
	},
	{
		id: 'no-raw-hsl',
		severity: 'error',
		fix: 'Use DESIGN.md token names, var(--ds-*), or hex anchors from **Colors** — avoid raw literals.',
		test: (line) => {
			const match = line.match(/\bhsla?\s*\([^)]*\)/);
			return match ? match[0] : null;
		},
	},
	{
		id: 'no-raw-spacing-value',
		severity: 'error',
		fix: 'Use space.* token steps / var(--ds-space-*) or rem matching **Layout** (full scale) — see DESIGN.md **Layout**.',
		skipIfTokenCall: true,
		test: (line) => {
			const re =
				/\b(padding|padding-(?:top|right|bottom|left)|margin|margin-(?:top|right|bottom|left)|gap|row-gap|column-gap)\s*:\s*['"`]?\s*-?\d+(?:\.\d+)?(?:px|rem|em)\b/;
			const match = line.match(re);
			return match ? match[0] : null;
		},
	},
	{
		id: 'no-raw-positioning-value',
		severity: 'suggestion',
		fix: 'If this is component spacing, align to space.* steps (**Layout**). Raw px for absolute positioning may be fine.',
		skipIfTokenCall: true,
		test: (line) => {
			const re = /\b(top|left|right|bottom|inset)\s*:\s*['"`]?\s*-?\d+(?:\.\d+)?(?:px|rem|em)\b/;
			const match = line.match(re);
			return match ? match[0] : null;
		},
	},
	{
		id: 'no-hardcoded-shadow',
		severity: 'error',
		fix: 'Use elevation.shadow.* tokens or vars per DESIGN.md **Elevation & Depth** — avoid bespoke box-shadow.',
		skipIfTokenCall: true,
		test: (line) => {
			const match = line.match(/\bbox-shadow\s*:\s*[^;]+/);
			if (!match) return null;
			if (/\b(none|inherit|unset|initial)\b/.test(match[0])) return null;
			return match[0].slice(0, 60);
		},
	},
	{
		id: 'no-title-case-in-jsx',
		severity: 'suggestion',
		fix: 'Use sentence case in product UI — see DESIGN.md **Typography** → Case.',
		test: (line) => {
			const jsxMatch = line.match(/>([^<{}]*\b(?:[A-Z][a-z]+\s+){2,}[A-Z][a-z]+[^<{}]*)</);
			if (!jsxMatch) return null;
			const content = jsxMatch[1].trim();
			const properNouns = [
				'Atlassian',
				'Jira',
				'Confluence',
				'Trello',
				'Bitbucket',
				'Loom',
				'Compass',
				'Rovo',
				'Atlas',
				'Design System',
				'New York Times',
			];
			const withoutProperNouns = content
				.split(/\s+/)
				.filter((w) => !properNouns.some((pn) => pn.split(' ').includes(w)))
				.join(' ');
			if (!/(?:\b[A-Z][a-z]+\s+){2,}[A-Z][a-z]+/.test(withoutProperNouns)) return null;
			return content.length > 60 ? `${content.slice(0, 60)}…` : content;
		},
	},
	{
		id: 'no-thick-side-border-stripe',
		severity: 'error',
		fix: 'Use semantic surfaces, color.border.*, SectionMessage/Flag per DESIGN.md **Design rigor** (anti-patterns) — not border-left/right > 1px as sole emphasis.',
		skipIfTokenCall: true,
		test: (line) => {
			const m = line.match(/\b(?:border-left|border-right)\s*:\s*([^;]+)/i);
			if (!m) return null;
			for (const g of m[1].matchAll(/\b(\d+)\s*px/g)) {
				const n = Number.parseInt(g[1], 10);
				if (n > 1) return m[0].length > 70 ? `${m[0].slice(0, 70)}…` : m[0];
			}
			return null;
		},
	},
	{
		id: 'no-gradient-text-clip',
		severity: 'error',
		fix: 'Solid color.text / role tokens and typography hierarchy — DESIGN.md **Design rigor** (no gradient fill on text).',
		test: (line) => {
			if (!/(?:-webkit-)?background-clip\s*:\s*text/i.test(line)) return null;
			if (/\b(?:linear|radial|conic)-gradient\s*\(/i.test(line))
				return 'background-clip:text with gradient on same line';
			return null;
		},
	},
];

/** Optional: only with --validate-code — real source files in Atlaskit-oriented repos. */
const codeValidationRules: Rule[] = [
	{
		id: 'no-raw-html-button',
		severity: 'suggestion',
		codeValidationOnly: true,
		fix: 'With ADS available: use Button from the design system. See DESIGN.md **Components** → Button and atlassian-design-system skill.',
		test: (line) => {
			const match = line.match(/<button\b/);
			return match ? match[0] : null;
		},
	},
	{
		id: 'no-raw-html-input',
		severity: 'suggestion',
		codeValidationOnly: true,
		fix: 'With ADS available: use TextField / Checkbox / Radio packages. Otherwise mimic tokens per DESIGN.md **Components** (TextField / Select).',
		test: (line) => {
			const match = line.match(/<input\b/);
			return match ? match[0] : null;
		},
	},
	{
		id: 'no-raw-html-select',
		severity: 'suggestion',
		codeValidationOnly: true,
		fix: 'With ADS available: use Select. Otherwise style native select with tokens — DESIGN.md **Components** → Select.',
		test: (line) => {
			const match = line.match(/<select\b/);
			return match ? match[0] : null;
		},
	},
	{
		id: 'no-raw-html-heading',
		severity: 'suggestion',
		codeValidationOnly: true,
		fix: 'With ADS available: use Heading. Otherwise use semantic <h*> with font.heading.* — DESIGN.md **Typography** → Heading scale.',
		test: (line) => {
			const match = line.match(/<h[1-6]\b/);
			return match ? match[0] : null;
		},
	},
	{
		id: 'no-raw-html-paragraph',
		severity: 'suggestion',
		codeValidationOnly: true,
		fix: 'With ADS available: use Text primitive. Otherwise <p> with font.body — DESIGN.md **Typography** → Body scale.',
		test: (line) => {
			const match = line.match(/<p\b(?!\w)/);
			return match ? match[0] : null;
		},
	},
	{
		id: 'no-non-ads-styling',
		severity: 'error',
		codeValidationOnly: true,
		fix: 'In Atlaskit apps: prefer Compiled + ADS primitives (atlassian-design-system skill). DESIGN.md **Layout** → Primitives.',
		test: (line) => {
			const patterns = [
				/from\s+['"]styled-components['"]/,
				/from\s+['"]@emotion\/[^'"]+['"]/,
				/from\s+['"]tailwindcss['"]/,
				/@tailwind\b/,
			];
			for (const re of patterns) {
				const match = line.match(re);
				if (match) return match[0];
			}
			return null;
		},
	},
];

function rulesForMode(includeValidateCode: boolean): Rule[] {
	return includeValidateCode ? [...coreRules, ...codeValidationRules] : coreRules;
}

function scanFile(filePath: string, includeValidateCode: boolean): Result {
	const rules = rulesForMode(includeValidateCode);
	const text = readFileSync(filePath, 'utf8');
	const lines = text.split('\n');
	const violations: Violation[] = [];

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];
		const lineNumber = i + 1;
		if (!line.trim()) continue;

		for (const rule of rules) {
			const skipComments = rule.skipComments !== false;
			if (skipComments && isCommentLine(line)) continue;

			const hit = rule.test(line, text);
			if (hit) {
				if (rule.skipIfTokenCall && hasTokenCall(hit)) continue;

				violations.push({
					rule: rule.id,
					line: lineNumber,
					snippet: hit,
					severity: rule.severity,
					fix: rule.fix,
				});
			}
		}
	}

	return { file: filePath, violations };
}

function formatText(results: Result[]): string {
	const lines: string[] = [];
	let totalErrors = 0;
	let totalSuggestions = 0;

	for (const result of results) {
		if (!result.violations.length) {
			lines.push(`${relative(process.cwd(), result.file)}: clean`);
			continue;
		}
		lines.push(`${relative(process.cwd(), result.file)}:`);
		for (const v of result.violations) {
			const prefix = v.severity === 'error' ? 'ERROR' : 'HINT ';
			lines.push(`  ${prefix} L${v.line} [${v.rule}] ${v.snippet}`);
			lines.push(`         ${v.fix}`);
			if (v.severity === 'error') totalErrors++;
			else totalSuggestions++;
		}
	}

	lines.push('');
	lines.push(`Summary: ${totalErrors} error(s), ${totalSuggestions} suggestion(s).`);
	return lines.join('\n');
}

function printHelp(includeValidateCode: boolean): void {
	const active = rulesForMode(includeValidateCode);
	console.log(
		[
			'lint-design-heuristics — DESIGN.md drift checks.',
			'',
			'Usage:',
			'  npx tsx lint-design-heuristics.ts <file> [<file> ...] [options]',
			'',
			'Options:',
			'  --validate-code    Stricter checks for real app source (raw HTML, non-ADS imports). Aliases: --ads, --with-ads.',
			'  --format=text|json',
			'  --include-markdown, --md   scan .md files (skipped by default)',
			'',
			'Default: core rules only (colors, spacing, shadows, title case).',
			'With --validate-code: append rules for validating typical app source.',
			'',
			'Active rules:',
			...active.map(
				(r) =>
					`  ${r.severity === 'error' ? 'ERROR' : 'HINT '} ${r.id}${r.codeValidationOnly ? ' [validate-code]' : ''}`,
			),
		].join('\n'),
	);
}

function main(): void {
	const argv = process.argv.slice(2);
	let format: 'text' | 'json' = 'text';
	let includeMarkdown = false;
	const includeValidateCode =
		argv.includes('--validate-code') || argv.includes('--ads') || argv.includes('--with-ads');
	const paths = argv.filter(
		(arg) =>
			arg !== '--format=json' &&
			arg !== '--format=text' &&
			arg !== '--include-markdown' &&
			arg !== '--md' &&
			arg !== '--validate-code' &&
			arg !== '--ads' &&
			arg !== '--with-ads' &&
			arg !== '--help' &&
			arg !== '-h',
	);

	for (const arg of argv) {
		if (arg === '--format=json') format = 'json';
		else if (arg === '--format=text') format = 'text';
		else if (arg === '--include-markdown' || arg === '--md') includeMarkdown = true;
		else if (arg === '--help' || arg === '-h') {
			printHelp(includeValidateCode);
			process.exit(0);
		}
	}

	if (!paths.length) {
		console.error('Usage: npx tsx lint-design-heuristics.ts <file> [<file> ...] [--validate-code]');
		process.exit(2);
	}

	const results: Result[] = [];
	for (const path of paths) {
		try {
			const stat = statSync(path);
			if (!stat.isFile()) {
				console.error(`Skipping (not a file): ${path}`);
				continue;
			}
			if (!includeMarkdown && /\.(md|mdx)$/i.test(path)) {
				console.error(`Skipping markdown (use --include-markdown to scan): ${path}`);
				continue;
			}
			results.push(scanFile(path, includeValidateCode));
		} catch (err) {
			console.error(`Error reading ${path}: ${(err as Error).message}`);
			process.exit(2);
		}
	}

	if (format === 'json') {
		console.log(JSON.stringify(results, null, 2));
	} else {
		console.log(formatText(results));
	}

	const anyErrors = results.some((r) => r.violations.some((v) => v.severity === 'error'));
	process.exit(anyErrors ? 1 : 0);
}

main();
