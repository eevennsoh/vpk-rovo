const assert = require("node:assert/strict");
const test = require("node:test");

async function loadSession() {
	return import("./agent-list-session.ts");
}

function sessionItem(sessionDetails, overrides = {}) {
	return {
		agent: { avatarSrc: "", kind: "agent", name: "Claude" },
		id: "lw-scope-thread",
		sessionDetails,
		state: "complete",
		title: "Scope the migration",
		...overrides,
	};
}

test("resume command leaves shell-safe values unquoted", async () => {
	const { toAgentListResumeCommand } = await loadSession();

	assert.equal(
		toAgentListResumeCommand(sessionItem({ resumeSessionId: "abc-123", worktreePath: "/Users/venn/Labs/project" })),
		"cd /Users/venn/Labs/project && claude --resume abc-123",
	);
	assert.equal(
		toAgentListResumeCommand(sessionItem(undefined)),
		"claude --resume lw-scope-thread",
	);
});

test("resume command quotes worktree paths containing spaces", async () => {
	const { toAgentListResumeCommand } = await loadSession();

	assert.equal(
		toAgentListResumeCommand(sessionItem({ resumeSessionId: "abc-123", worktreePath: "/Users/venn/My Project/vpk" })),
		"cd '/Users/venn/My Project/vpk' && claude --resume abc-123",
	);
});

test("resume command neutralises shell metacharacters instead of executing them", async () => {
	const { toAgentListResumeCommand } = await loadSession();

	const command = toAgentListResumeCommand(
		sessionItem({ resumeSessionId: "id; rm -rf /", worktreePath: "/tmp/$(whoami)" }),
	);

	assert.equal(command, "cd '/tmp/$(whoami)' && claude --resume 'id; rm -rf /'");
	// The dangerous fragments survive only inside single quotes, never bare.
	assert.doesNotMatch(command, /--resume id; rm/u);
	assert.doesNotMatch(command, /cd \/tmp\/\$\(whoami\)/u);
});

test("resume command escapes embedded single quotes", async () => {
	const { quoteShellArgument } = await loadSession();

	assert.equal(quoteShellArgument("it's here"), String.raw`'it'\''s here'`);
});

test("session flyout preserves row-owned lifecycle while completing optional context", async () => {
	const { toAgentSessionFlyoutItem } = await loadSession();
	const item = sessionItem(
		{
			agentName: "Stale name",
			branch: "rovo/vita-142-vision-deck",
			host: "local",
			issueKey: "VITA-142",
			issueSummary: "Prepare vision deck",
			pullRequestNumber: 42,
			status: "stopped",
		},
		{
			agent: { avatarSrc: "/agents/vita.svg", kind: "agent", name: "Vita" },
			completedAtMs: 1_000,
			completedSecondsAgo: 30,
			elapsedSeconds: 90,
			host: "cloud",
			prStatus: "created",
			startedAtMs: 910,
		},
	);

	assert.deepEqual(toAgentSessionFlyoutItem(item), {
		agentAvatarSrc: "/agents/vita.svg",
		agentName: "Vita",
		branch: "rovo/vita-142-vision-deck",
		completedAtMs: 1_000,
		completedSecondsAgo: 30,
		host: "cloud",
		id: "lw-scope-thread",
		initialElapsedSeconds: 90,
		issueKey: "VITA-142",
		issueSummary: "Prepare vision deck",
		pullRequestNumber: 42,
		startedAtMs: 910,
		status: "pr-open",
		title: "Scope the migration",
	});
});

test("session flyout derives lifecycle, issue, and host fallbacks from a row", async () => {
	const { deriveIssueKeyFromBranch, toAgentSessionFlyoutItem } = await loadSession();

	assert.equal(deriveIssueKeyFromBranch("rovo/vita-142-vision-deck"), "VITA-142");
	assert.equal(deriveIssueKeyFromBranch("feature/vision-deck"), "feature/vision-deck");
	assert.equal(deriveIssueKeyFromBranch(undefined), "");
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem(undefined, {
			branch: "rovo/vita-142-vision-deck",
		})).issueKey,
		"VITA-142",
	);

	assert.equal(toAgentSessionFlyoutItem(sessionItem(undefined)).host, "cloud");
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem({ host: "local" })).host,
		"local",
	);
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem(undefined, { state: "needs-input" })).status,
		"awaiting-input",
	);
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem(undefined, { state: "attention" })).status,
		"awaiting-input",
	);
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem(undefined, { state: "running" })).status,
		"running",
	);
	assert.equal(
		toAgentSessionFlyoutItem(sessionItem(undefined, { prStatus: "merged" })).status,
		"merged",
	);
});

test("session flyout keeps the invoking person separate from the work-item assignee", async () => {
	const { toAgentSessionFlyoutItem } = await loadSession();

	const session = toAgentSessionFlyoutItem(sessionItem({
		assignee: {
			name: "Work item owner",
			src: "/avatar-user/priya-hansra/color/asow-service-yellow.png",
		},
	}, {
		invokedBy: {
			avatarSrc: "/avatar-user/andrew-park/color/asow-dev-lime.png",
			name: "person A",
		},
	}));

	assert.deepEqual(session.invokedBy, {
		name: "person A",
		src: "/avatar-user/andrew-park/color/asow-dev-lime.png",
	});
	assert.deepEqual(session.assignee, {
		name: "Work item owner",
		src: "/avatar-user/priya-hansra/color/asow-service-yellow.png",
	});
});

test("session flyout carries the row's hexagonal agent mark and work-item status", async () => {
	const { toAgentSessionFlyoutItem } = await loadSession();

	const claude = toAgentSessionFlyoutItem(sessionItem(
		{ issueKey: "PAY-101", issueStatus: "Done" },
		{ agent: { brandName: "claude", id: "claude", kind: "agent", name: "Claude" } },
	));
	assert.equal(claude.agentName, "Claude");
	assert.equal(claude.brandName, "claude");
	assert.equal(claude.vpkLogo, undefined);
	assert.equal(claude.issueStatus, "Done");

	const cursor = toAgentSessionFlyoutItem(sessionItem(
		{ issueKey: "PAY-121", issueStatus: "In review" },
		{ agent: { brandName: "cursor", id: "cursor", kind: "agent", name: "Cursor" } },
	));
	assert.equal(cursor.brandName, "cursor");
	assert.equal(cursor.issueStatus, "In review");

	const rovo = toAgentSessionFlyoutItem(sessionItem(
		undefined,
		{ agent: { id: "rovo-dev", kind: "agent", name: "Rovo", vpkLogo: "rovo" } },
	));
	assert.equal(rovo.vpkLogo, "rovo");
	assert.equal(rovo.brandName, undefined);
});
