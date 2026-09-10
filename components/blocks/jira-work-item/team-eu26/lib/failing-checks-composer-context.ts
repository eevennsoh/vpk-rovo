/**
 * Short demo-scale prompt context for failing CI checks staged in the activity
 * composer. Keep this concise — storytelling, not a real PR-fix template.
 */
export function serializeFailingChecksContext(
	checks: readonly Readonly<{ name: string; details: string }>[],
): string {
	if (checks.length === 0) {
		return "";
	}

	const lines = checks.map((check) => `- ${check.name}: ${check.details}`);
	return ["Failing PR checks:", ...lines].join("\n");
}

/** Fallback when the chip is staged but the draft was cleared. */
export const FAILING_CHECKS_COMPOSER_PROMPT = "Fix the failing CI check(s) on this PR.";

export interface PullRequestFixComposerPromptInput {
	repository: string;
	number: number;
	url: string;
	headBranch: string | null;
	baseBranch: string | null;
	checks: readonly Readonly<{ name: string; details: string }>[];
}

/**
 * Terse demo agent prompt for Fix / Fix all. Mirrors the production PR-fix
 * section structure (`## Pull request fix:` / `## My request:`) with compressed
 * instructions and interpolated PR + check context.
 */
export function buildPullRequestFixComposerPrompt(
	input: Readonly<PullRequestFixComposerPromptInput>,
): string {
	const repository = input.repository.trim() || "owner/repo";
	const number = Number.isFinite(input.number) && input.number > 0
		? input.number
		: 0;
	const head = input.headBranch?.trim() || "head";
	const base = input.baseBranch?.trim() || "base";
	const url = input.url.trim()
		|| (number > 0 ? `https://github.com/${repository}/pull/${number}` : "https://github.com");
	const checks = input.checks;
	const singleCheck = checks.length === 1 ? checks[0] : null;

	const pullRequestBody = [
		number > 0
			? `Review ${repository} PR ${number} (${head} -> ${base}) and make the smallest safe fix for the attached failing CI.`
			: `Review ${repository} (${head} -> ${base}) and make the smallest safe fix for the attached failing CI.`,
		"Use `gh` as the source of truth for runs, annotations, and logs. Do not guess without logs. No unrelated refactors.",
		"After fixing, run the narrowest verification, commit and push, then summarize root cause, fix, and result.",
	].join(" ");

	const myRequestLead = singleCheck
		? `Use gh to inspect and fix failing check "${singleCheck.name}". Once fixed, commit and push.`
		: "Use gh to inspect the failing CI and make the smallest safe fix for all attached failing checks. Once everything is fixed, commit and push.";

	const myRequestBody = [
		myRequestLead,
		`Pull request URL: ${url}`,
		"Before editing, verify the repository and checked-out branch match this pull request; if no repository exists, clone it inside this chat's writable workspace; never switch or modify an unrelated checkout.",
	].join(" ");

	// Continuous paragraphs per section; blank line between sections so the
	// composer wraps naturally at its width (no mid-sentence hard breaks).
	return [
		"## Pull request fix:",
		pullRequestBody,
		"",
		"## My request:",
		myRequestBody,
	].join("\n");
}
