"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const {
	matchWorktree,
	sessionNameForWorktree,
	sessionTokenForWorktree,
	handlesForWorktree,
	findCurrentWorktree,
} = require("./worktree-kill");

// Mirrors the object shape from getAllWorktreePortInfo(): `worktreeName` is the
// display name from getWorktreeDisplayName() and is the session key — it can
// diverge from the raw `identifier`.
const MAIN = {
	path: "/Users/dev/Labs/example-repo",
	isMain: true,
	branch: "main",
	identifier: "main",
	worktreeName: "main",
};
const CLAUDE_WT = {
	path: "/Users/dev/Labs/example-repo/.claude/worktrees/html-selector-ai-agent-21bee3",
	isMain: false,
	branch: "claude/html-selector-ai-agent-21bee3",
	identifier: "claude/html-selector-ai-agent-21bee3",
	worktreeName: "claude/html-selector-ai-agent-21bee3",
};
// Detached worktree whose dir basename ("example-repo") collides with the repo name,
// so getWorktreeDisplayName walks up to the parent hash dir ("0ebd"). Here the
// session key (worktreeName) differs from identifier ("example-repo") — the exact
// case that produced a wrong session name before this was fixed.
const DETACHED_WT = {
	path: "/Users/dev/.codex/worktrees/0ebd/example-repo",
	isMain: false,
	branch: null,
	identifier: "example-repo",
	worktreeName: "0ebd",
};
const WORKTREES = [MAIN, CLAUDE_WT, DETACHED_WT];

test("session name mirrors dev-tmux-plain.sh derivation", () => {
	assert.equal(sessionTokenForWorktree(MAIN), "main");
	assert.equal(sessionNameForWorktree(MAIN), "vpk-dev-main");
	assert.equal(
		sessionNameForWorktree(CLAUDE_WT),
		"vpk-dev-claude-html-selector-ai-agent-21bee3",
	);
});

test("detached worktree session uses display name, not identifier", () => {
	// Regression guard: must use the parent hash, never the shared repo basename.
	assert.equal(sessionNameForWorktree(DETACHED_WT), "vpk-dev-0ebd");
	assert.notEqual(sessionNameForWorktree(DETACHED_WT), "vpk-dev-example-repo");
});

test("matches by identifier, branch, and 'main'", () => {
	assert.equal(matchWorktree("0ebd", WORKTREES).worktree, DETACHED_WT);
	assert.equal(matchWorktree("main", WORKTREES).worktree, MAIN);
	assert.equal(
		matchWorktree("claude/html-selector-ai-agent-21bee3", WORKTREES).worktree,
		CLAUDE_WT,
	);
});

test("matches by full session name", () => {
	assert.equal(matchWorktree("vpk-dev-0ebd", WORKTREES).worktree, DETACHED_WT);
});

test("matching is case-insensitive", () => {
	assert.equal(matchWorktree("0EBD", WORKTREES).worktree, DETACHED_WT);
});

test("unique substring resolves without exact match", () => {
	// "html-selector" is a substring only of the claude worktree's handles.
	assert.equal(matchWorktree("html-selector", WORKTREES).worktree, CLAUDE_WT);
});

test("exact match wins over substring", () => {
	assert.equal(matchWorktree("main", WORKTREES).worktree, MAIN);
});

test("shared repository handle is reported ambiguous, not guessed", () => {
	// MAIN's dir basename and DETACHED's identifier are both "example-repo".
	const result = matchWorktree("example-repo", WORKTREES);
	assert.equal(result.ok, false);
	assert.equal(result.reason, "ambiguous");
	assert.deepEqual(new Set(result.candidates), new Set([MAIN, DETACHED_WT]));
});

test("no match reports not-found", () => {
	const result = matchWorktree("does-not-exist", WORKTREES);
	assert.equal(result.ok, false);
	assert.equal(result.reason, "not-found");
});

test("empty query reports empty", () => {
	assert.equal(matchWorktree("", WORKTREES).reason, "empty");
	assert.equal(matchWorktree("   ", WORKTREES).reason, "empty");
	assert.equal(matchWorktree(undefined, WORKTREES).reason, "empty");
});

test("handles include the strings a user is likely to type", () => {
	const handles = handlesForWorktree(DETACHED_WT);
	assert.ok(handles.has("0ebd")); // display name / session token
	assert.ok(handles.has("vpk-dev-0ebd")); // full session name
	assert.ok(handles.has("example-repo")); // basename + identifier
	assert.ok([...handles].some((h) => h.includes("0ebd"))); // path carries the hash
});

test("findCurrentWorktree resolves the enclosing worktree from a cwd", () => {
	// A dir inside main (but not inside the nested claude worktree) -> MAIN.
	assert.equal(findCurrentWorktree("/Users/dev/Labs/example-repo/components", WORKTREES), MAIN);
	// The worktree path itself.
	assert.equal(findCurrentWorktree(MAIN.path, WORKTREES), MAIN);
});

test("findCurrentWorktree picks the deepest match for nested worktrees", () => {
	// CLAUDE_WT lives under MAIN's path; a cwd inside it must resolve to the
	// more specific (deeper) worktree, not the enclosing main checkout.
	assert.equal(findCurrentWorktree(`${CLAUDE_WT.path}/app`, WORKTREES), CLAUDE_WT);
	assert.equal(findCurrentWorktree(CLAUDE_WT.path, WORKTREES), CLAUDE_WT);
});

test("findCurrentWorktree returns null when cwd is outside every worktree", () => {
	assert.equal(findCurrentWorktree("/tmp/somewhere-else", WORKTREES), null);
	// A sibling path that merely shares a string prefix is NOT inside.
	assert.equal(findCurrentWorktree("/Users/dev/Labs/example-repo-other", WORKTREES), null);
});

test("findCurrentWorktree handles empty/invalid input gracefully", () => {
	assert.equal(findCurrentWorktree("", WORKTREES), null);
	assert.equal(findCurrentWorktree(undefined, WORKTREES), null);
	assert.equal(findCurrentWorktree("/Users/dev/Labs/example-repo", null), null);
});
