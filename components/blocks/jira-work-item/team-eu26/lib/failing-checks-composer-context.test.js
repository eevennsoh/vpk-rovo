import assert from "node:assert/strict";
import test from "node:test";

import {
	FAILING_CHECKS_COMPOSER_PROMPT,
	buildPullRequestFixComposerPrompt,
	serializeFailingChecksContext,
} from "./failing-checks-composer-context.ts";

test("serializeFailingChecksContext stays demo-scale and empty-safe", () => {
	assert.equal(serializeFailingChecksContext([]), "");
	assert.equal(
		serializeFailingChecksContext([
			{ name: "Lint and typecheck", details: "deliveryAddress may be null" },
		]),
		[
			"Failing PR checks:",
			"- Lint and typecheck: deliveryAddress may be null",
		].join("\n"),
	);
	assert.match(FAILING_CHECKS_COMPOSER_PROMPT, /Fix the failing CI check/u);
});

test("buildPullRequestFixComposerPrompt keeps production sections and is terse", () => {
	const single = buildPullRequestFixComposerPrompt({
		repository: "eevensoh/vpk-rovo",
		number: 1847,
		url: "https://github.com/eevensoh/vpk-rovo/pull/1847",
		headBranch: "feature/shop-4821-guest-checkout",
		baseBranch: "main",
		checks: [
			{ name: "Unit tests", details: "3 failed in guest-order-service" },
		],
	});

	assert.equal(
		single,
		[
			"## Pull request fix:",
			"Review eevensoh/vpk-rovo PR 1847 (feature/shop-4821-guest-checkout -> main) and make the smallest safe fix for the attached failing CI. Use `gh` as the source of truth for runs, annotations, and logs. Do not guess without logs. No unrelated refactors. After fixing, run the narrowest verification, commit and push, then summarize root cause, fix, and result.",
			"",
			"## My request:",
			'Use gh to inspect and fix failing check "Unit tests". Once fixed, commit and push. Pull request URL: https://github.com/eevensoh/vpk-rovo/pull/1847 Before editing, verify the repository and checked-out branch match this pull request; if no repository exists, clone it inside this chat\'s writable workspace; never switch or modify an unrelated checkout.',
		].join("\n"),
	);

	const all = buildPullRequestFixComposerPrompt({
		repository: "eevensoh/vpk-rovo",
		number: 1847,
		url: "https://github.com/eevensoh/vpk-rovo/pull/1847",
		headBranch: "feature/shop-4821-guest-checkout",
		baseBranch: "main",
		checks: [
			{ name: "Unit tests", details: "3 failed" },
			{ name: "Lint and typecheck", details: "2 errors" },
		],
	});
	assert.match(all, /all attached failing checks/u);
	assert.doesNotMatch(all, /failing check "Unit tests"/u);
	assert.match(all, /\n\n## My request:\n/u);
});
