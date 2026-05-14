const assert = require("node:assert/strict")
const test = require("node:test")

const {
	buildRovoThreadBrowserWorkspacePath,
	getActiveThreadUrl,
} = require("./wiki-capture-mcp")

test("wiki capture active-page reads the current Rovo thread browser workspace route", async (t) => {
	const originalBackendUrl = process.env.BACKEND_URL
	const originalFetch = globalThis.fetch
	const requests = []

	process.env.BACKEND_URL = "http://backend.local"
	globalThis.fetch = async (url, init = {}) => {
		requests.push({
			method: init.method,
			url: String(url),
		})

		return new Response(
			JSON.stringify({ url: "https://example.com/current-page" }),
			{ headers: { "Content-Type": "application/json" }, status: 200 },
		)
	}

	t.after(() => {
		globalThis.fetch = originalFetch
		if (originalBackendUrl === undefined) {
			delete process.env.BACKEND_URL
			return
		}

		process.env.BACKEND_URL = originalBackendUrl
	})

	const url = await getActiveThreadUrl("thread/7")

	assert.equal(url, "https://example.com/current-page")
	assert.deepEqual(requests, [
		{
			method: "GET",
			url: "http://backend.local/api/rovo/threads/thread%2F7/browser-workspace",
		},
	])
})

test("wiki capture active-page rejects missing thread IDs before calling the backend", () => {
	assert.throws(
		() => buildRovoThreadBrowserWorkspacePath(" "),
		/A non-empty thread_id is required\./,
	)
})
