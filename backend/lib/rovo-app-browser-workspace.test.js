const test = require("node:test")
const assert = require("node:assert/strict")

const {
	getRovoAppThreadBrowserSessionName,
	getRovoAppThreadBrowserWorkspaceId,
	urlsLooselyMatch,
} = require("./rovo-app-browser-workspace")

test("thread browser workspace derives a stable agent-browser session name", () => {
	const firstSessionName = getRovoAppThreadBrowserSessionName("thread-browser-test")
	const secondSessionName = getRovoAppThreadBrowserSessionName("thread-browser-test")
	const alternateSessionName = getRovoAppThreadBrowserSessionName("thread browser test")

	assert.equal(firstSessionName, secondSessionName)
	assert.match(firstSessionName, /^rt-thread-browser-t-[0-9a-f]{12}$/)
	assert.notEqual(firstSessionName, alternateSessionName)
})

test("thread browser workspace exposes a deterministic workspace id for the session-backed preview", () => {
	assert.equal(
		getRovoAppThreadBrowserWorkspaceId("thread-browser-test"),
		`agent-browser-session:${getRovoAppThreadBrowserSessionName("thread-browser-test")}`,
	)
})

test("thread browser workspace url matching ignores hashes and trailing slashes", () => {
	assert.equal(
		urlsLooselyMatch(
			"https://www.theverge.com/2026/04/18/story#comments",
			"https://theverge.com/2026/04/18/story/",
		),
		true,
	)
	assert.equal(
		urlsLooselyMatch(
			"https://example.com/docs",
			"https://example.com/blog",
		),
		false,
	)
})
