/**
 * Copy-ready git handoff strings for a work item's Development section.
 *
 * Jira suggests a branch named `<KEY>-<slug of summary>` and wraps it in
 * checkout/commit commands. The slug rules (punctuation collapsing, casing,
 * length cap) are the only real logic here, so they live in this module and
 * stay assertable without rendering the metadata rail.
 */

/** Longest slug appended after the key, so branch names stay shell-friendly. */
const MAX_SLUG_LENGTH = 60;

export interface DevelopmentCommands {
	/** `git checkout -b <branchName>` */
	branchCommand: string;
	/** Suggested branch, e.g. `PD-61-slingshot-maneuver`. */
	branchName: string;
	/** `git commit -m "<KEY> <summary>"` */
	commitCommand: string;
	/** Trimmed work item key, e.g. `PD-61`. */
	workItemKey: string;
}

/**
 * Lowercase, hyphen-separated slug of a summary. Accents are decomposed and
 * their combining marks deleted first — folding them in the same pass as other
 * punctuation would split the base letters apart (`résumé` → `re-sume`).
 */
export function toBranchSlug(summary: string): string {
	return summary
		.normalize("NFKD")
		.replace(/\p{Mark}+/gu, "")
		.replace(/[^\p{Letter}\p{Number}]+/gu, "-")
		.toLowerCase()
		.slice(0, MAX_SLUG_LENGTH)
		.replace(/^-+|-+$/g, "");
}

/**
 * Wrap arbitrary text as a single POSIX shell word. Single quotes suppress every
 * expansion — `$(…)`, backticks, `$VAR`, `\` and `"` are all literal inside them
 * — so an embedded `'` is the only character needing work: close the quote, emit
 * an escaped `'`, reopen. Without this a summary like `Fix $(whoami) crash`
 * would execute when the advertised copy-ready command is pasted into a shell.
 */
function toShellSingleQuoted(value: string): string {
	return `'${value.replaceAll("'", String.raw`'\''`)}'`;
}

/** Derive the three copyable Development-section values for a work item. */
export function toDevelopmentCommands(workItemKey: string, summary: string): DevelopmentCommands {
	const key = workItemKey.trim();
	const trimmedSummary = summary.trim();
	const slug = toBranchSlug(trimmedSummary);
	const branchName = slug ? `${key}-${slug}` : key;

	return {
		branchCommand: `git checkout -b ${branchName}`,
		branchName,
		// The commit subject keeps the human summary verbatim; only the branch
		// name is slugged.
		commitCommand: `git commit -m ${toShellSingleQuoted(`${key} ${trimmedSummary}`)}`,
		workItemKey: key,
	};
}
