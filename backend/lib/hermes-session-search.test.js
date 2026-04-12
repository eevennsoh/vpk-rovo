const assert = require("node:assert/strict");
const test = require("node:test");

const { searchThreads, extractSearchableText } = require("./hermes-session-search");

function makeThread(id, title, messages) {
	return {
		id,
		title,
		messages: messages.map((content, i) => ({
			id: `msg-${i}`,
			role: i % 2 === 0 ? "user" : "assistant",
			parts: [{ type: "text", text: content }],
		})),
		updatedAt: new Date(Date.now() - id.charCodeAt(0) * 1000).toISOString(),
	};
}

const THREADS = [
	makeThread("t1", "Auth refactor", [
		"Help me refactor the authentication module",
		"I'll start by reading backend/auth.js to understand the current JWT flow.",
	]),
	makeThread("t2", "Database migration", [
		"We need to migrate from PostgreSQL to MongoDB",
		"I'll create a migration plan for the schema changes.",
	]),
	makeThread("t3", "CSS bug fix", [
		"The sidebar is broken on mobile",
		"The issue is a missing media query in sidebar.css at line 42.",
	]),
	makeThread("t4", "API endpoints", [
		"Add a new REST endpoint for user authentication",
		"I'll create POST /api/auth/login with JWT token generation.",
	]),
];

test("searchThreads returns matching threads", () => {
	const results = searchThreads(THREADS, "authentication");
	assert.ok(results.length >= 1);
	assert.ok(results.some((r) => r.threadId === "t1" || r.threadId === "t4"));
});

test("searchThreads returns snippet with match context", () => {
	const results = searchThreads(THREADS, "PostgreSQL");
	assert.ok(results.length >= 1);
	const dbResult = results.find((r) => r.threadId === "t2");
	assert.ok(dbResult);
	assert.ok(dbResult.snippet.includes("PostgreSQL"));
});

test("searchThreads returns empty for no matches", () => {
	const results = searchThreads(THREADS, "kubernetes");
	assert.equal(results.length, 0);
});

test("searchThreads is case-insensitive", () => {
	const results = searchThreads(THREADS, "jwt");
	assert.ok(results.length >= 1);
});

test("searchThreads respects limit", () => {
	const results = searchThreads(THREADS, "the", { limit: 2 });
	assert.ok(results.length <= 2);
});

test("searchThreads searches title", () => {
	const results = searchThreads(THREADS, "CSS bug");
	assert.ok(results.length >= 1);
	assert.ok(results.some((r) => r.threadId === "t3"));
});

test("searchThreads returns results sorted by match count then recency", () => {
	const results = searchThreads(THREADS, "authentication");
	if (results.length >= 2) {
		// Higher match count should be first
		assert.ok(results[0].matchCount >= results[1].matchCount);
	}
});

test("searchThreads handles empty query", () => {
	const results = searchThreads(THREADS, "");
	assert.equal(results.length, 0);
});

test("searchThreads handles empty thread list", () => {
	const results = searchThreads([], "test");
	assert.equal(results.length, 0);
});

test("extractSearchableText handles text parts", () => {
	const messages = [
		{ role: "user", parts: [{ type: "text", text: "Hello world" }] },
	];
	const text = extractSearchableText(messages);
	assert.ok(text.includes("Hello world"));
});

test("extractSearchableText handles content field", () => {
	const messages = [
		{ role: "user", content: "Hello content" },
	];
	const text = extractSearchableText(messages);
	assert.ok(text.includes("Hello content"));
});

test("extractSearchableText handles mixed formats", () => {
	const messages = [
		{ role: "user", parts: [{ type: "text", text: "Part text" }] },
		{ role: "assistant", content: "Content text" },
	];
	const text = extractSearchableText(messages);
	assert.ok(text.includes("Part text"));
	assert.ok(text.includes("Content text"));
});

test("searchThreads result includes thread metadata", () => {
	const results = searchThreads(THREADS, "sidebar");
	assert.ok(results.length >= 1);
	const result = results[0];
	assert.ok(typeof result.threadId === "string");
	assert.ok(typeof result.title === "string");
	assert.ok(typeof result.snippet === "string");
	assert.ok(typeof result.matchCount === "number");
	assert.ok(typeof result.lastMessageAt === "string");
});
