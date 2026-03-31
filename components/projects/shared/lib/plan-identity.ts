interface PlanTaskLike {
	label: string;
}

const DEFAULT_FALLBACK_TITLE = "Untitled task run";
const DEFAULT_EMOJI = "📋";
const TITLE_MAX_WORDS = 6;
const FALLBACK_EMOJI_POOL = ["📋", "🧭", "🛠️", "⚙️", "🧠", "🧩", "📌", "🗂️"];

/** Collapse runs of whitespace to a single space and trim. */
function collapseWhitespace(value: string): string {
	return value.replace(/\s+/gu, " ").trim();
}

const GENERIC_PLAN_TITLE_SET = new Set([
	"plan",
	"execution plan",
	"project plan",
	"work plan",
	"task plan",
	"planning draft",
	"plan draft",
	"untitled task run",
]);

const TITLE_EMOJI_RULES: Array<{ pattern: RegExp; emoji: string }> = [
	{ pattern: /\b(bug|fix|hotfix|incident|error|regression)\b/i, emoji: "🐛" },
	{ pattern: /\b(deploy|release|launch|ship|rollout)\b/i, emoji: "🚀" },
	{ pattern: /\b(design|ui|ux|mockup|visual)\b/i, emoji: "🎨" },
	{ pattern: /\b(research|discovery|investigate|analy[sz]e)\b/i, emoji: "🔍" },
	{ pattern: /\b(docs?|document|write|content|copy)\b/i, emoji: "📝" },
	{ pattern: /\b(data|metric|analytics?|dashboard|report)\b/i, emoji: "📊" },
	{ pattern: /\b(test|qa|validate|verification|a11y|accessibility)\b/i, emoji: "✅" },
];


/** Words that produce broken-looking titles when they appear at the end after truncation. */
const DANGLING_TAIL_WORDS = new Set([
	"a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
	"of", "with", "by", "from", "into", "via", "using", "as", "its", "their",
]);

function truncateWords(value: string, maxWords: number = TITLE_MAX_WORDS): string {
	const words = collapseWhitespace(value).split(" ").filter(Boolean);
	if (words.length === 0) {
		return "";
	}
	const sliced = words.slice(0, maxWords);
	// Drop trailing dangling prepositions/conjunctions/articles
	while (sliced.length > 1 && DANGLING_TAIL_WORDS.has(sliced[sliced.length - 1].toLowerCase())) {
		sliced.pop();
	}
	return sliced.join(" ");
}

function stripMarkdownDecorators(value: string): string {
	return value
		.replace(/\*\*([^*\n]+)\*\*/g, "$1")
		.replace(/__([^_\n]+)__/g, "$1")
		.replace(/`([^`\n]+)`/g, "$1")
		.replace(/^[*_`\s]+/, "")
		.replace(/[\s*_`]+$/, "")
		.trim();
}

function stripTaskPrefix(value: string): string {
	return value
		.replace(/^\s*(?:[-*+•◦▪]\s*)?(?:\[(?: |x|X)\]\s*|(?:☐|☑|✅)\s*)?/, "")
		.replace(/^\s*(?:\d+|[A-Za-z])[\.\)]\s+/, "")
		.trim();
}

function normalizePlanTitleCandidate(value: string): string {
	return collapseWhitespace(
		stripMarkdownDecorators(
			value
				.replace(/^#{1,6}\s*/, "")
				.replace(/:$/, "")
		)
	);
}

/**
 * Strip file paths (e.g. "lib/types.ts", "src/components/Button.tsx") and
 * code-like tokens (e.g. "useState", "handleClick") that make poor display titles.
 */
function stripCodeArtifacts(value: string): string {
	return (
		value
			// Remove file paths like "in lib/foo-bar.ts" or standalone "src/components/X.tsx"
			.replace(/\b(?:in\s+)?(?:[\w@.-]+\/)+[\w.-]+\b/g, "")
			// Remove standalone filenames with code extensions (e.g. "layout.tsx", "server.js")
			.replace(/\b[\w.-]+\.(?:tsx?|jsx?|mjs|cjs|css|html|json|ya?ml|md|sh|py|rs|go)\b/g, "")
			// Remove words that look like code identifiers (camelCase, snake_case with 2+ segments)
			.replace(/\b[a-z]+(?:[A-Z][a-z]+){2,}\b/g, "")
			// Remove punctuation shells left behind after stripping code artifacts
			.replace(/\s*\(\s*(?:,\s*)*\)\s*/g, " ")
			// Remove leftover "in" preposition when its object was stripped
			.replace(/\bin\s*$/i, "")
			.trim()
	);
}

function isUsableTitle(value: string): boolean {
	const words = collapseWhitespace(value).split(" ").filter(Boolean);
	// Need at least 2 meaningful words for a title
	return words.length >= 2;
}

export function extractTaskHeadingFromLabel(label: string): string {
	const normalized = normalizePlanTitleCandidate(stripTaskPrefix(label));
	if (!normalized) {
		return "";
	}

	const emDashIndex = normalized.indexOf("—");
	const raw =
		emDashIndex === -1
			? normalized
			: normalizePlanTitleCandidate(normalized.slice(0, emDashIndex)) ||
				normalized;

	// Strip code artifacts for a cleaner display title
	const cleaned = collapseWhitespace(stripCodeArtifacts(raw));
	return isUsableTitle(cleaned) ? cleaned : raw;
}

export function isGenericPlanTitle(title: string): boolean {
	const normalized = normalizePlanTitleCandidate(title).toLowerCase();
	if (!normalized) {
		return true;
	}

	if (GENERIC_PLAN_TITLE_SET.has(normalized)) {
		return true;
	}

	return /^(?:the\s+)?(?:execution|project|work|task|implementation)\s+plan$/.test(
		normalized
	);
}

export function derivePlanTitleFromTasks(
	tasks: ReadonlyArray<PlanTaskLike>,
	options?: Readonly<{ fallbackTitle?: string; maxWords?: number }>
): string {
	const fallbackTitle = options?.fallbackTitle ?? DEFAULT_FALLBACK_TITLE;
	const maxWords = options?.maxWords ?? TITLE_MAX_WORDS;

	for (const task of tasks) {
		const heading = extractTaskHeadingFromLabel(task.label);
		if (!heading || isGenericPlanTitle(heading)) {
			continue;
		}

		const truncatedHeading = truncateWords(heading, maxWords);
		if (truncatedHeading) {
			return truncatedHeading;
		}
	}

	return fallbackTitle;
}

export function resolvePlanDisplayTitle(
	rawTitle: string | undefined,
	tasks: ReadonlyArray<PlanTaskLike>,
	options?: Readonly<{ fallbackTitle?: string; maxWords?: number }>
): string {
	const fallbackTitle = options?.fallbackTitle ?? DEFAULT_FALLBACK_TITLE;
	const maxWords = options?.maxWords ?? TITLE_MAX_WORDS;
	const normalizedTitle = rawTitle ? normalizePlanTitleCandidate(rawTitle) : "";
	if (normalizedTitle && !isGenericPlanTitle(normalizedTitle)) {
		// Clean code artifacts and truncate even raw titles
		const cleaned = collapseWhitespace(stripCodeArtifacts(normalizedTitle));
		const candidate = isUsableTitle(cleaned) ? cleaned : normalizedTitle;
		return truncateWords(candidate, maxWords);
	}

	return derivePlanTitleFromTasks(tasks, {
		fallbackTitle,
		maxWords,
	});
}

export function derivePlanEmojiFromTitle(title: string): string {
	const normalizedTitle = normalizePlanTitleCandidate(title);
	if (!normalizedTitle) {
		return DEFAULT_EMOJI;
	}

	for (const rule of TITLE_EMOJI_RULES) {
		if (rule.pattern.test(normalizedTitle)) {
			return rule.emoji;
		}
	}

	let hash = 0;
	for (let index = 0; index < normalizedTitle.length; index += 1) {
		hash = (hash * 31 + normalizedTitle.charCodeAt(index)) >>> 0;
	}

	return FALLBACK_EMOJI_POOL[hash % FALLBACK_EMOJI_POOL.length] ?? DEFAULT_EMOJI;
}

/**
 * Clean up a raw plan description for display in the card header.
 * Strips markdown rules, code fences, and truncates with ellipsis.
 */
export function sanitizePlanDescription(
	raw: string | undefined,
	taskCount: number
): string {
	const prefix = `${taskCount} task${taskCount === 1 ? "" : "s"}`;

	if (!raw) {
		return prefix;
	}

	const cleaned = raw
		// Strip markdown horizontal rules (---, ***, ___)
		.replace(/^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm, "")
		// Strip code fences
		.replace(/```[\s\S]*?```/g, "")
		// Strip inline code
		.replace(/`([^`\n]+)`/g, "$1")
		// Strip markdown headings
		.replace(/^#{1,6}\s*/gm, "")
		// Strip bold/italic
		.replace(/\*\*([^*\n]+)\*\*/g, "$1")
		.replace(/__([^_\n]+)__/g, "$1")
		// Collapse whitespace
		.replace(/\s+/g, " ")
		.trim();

	if (!cleaned) {
		return prefix;
	}

	return `${prefix} • ${cleaned}`;
}
