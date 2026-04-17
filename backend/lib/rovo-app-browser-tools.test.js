const test = require("node:test")
const assert = require("node:assert/strict")

const {
	createDefaultWorkspaceBindings,
	createThreadBrowserBridge,
	deleteLiveCanaryThreadWorkspace,
} = require("./rovo-app-browser-tools")

function createWorkspaceBindings() {
	return {
		async ensureThreadWorkspace(threadId) {
			assert.equal(threadId, "thread-browser-bridge")
			return {
				state: {
					title: "about:blank",
					url: "about:blank",
				},
				streamConfig: {
					enabled: true,
					wsUrl: "/api/browser-workspaces/workspace-1/live",
				},
				workspaceId: "workspace-1",
			}
		},
		async getThreadWorkspace(threadId) {
			assert.equal(threadId, "thread-browser-bridge")
			return {
				state: {
					title: "Example Domain",
					url: "https://example.com",
				},
				streamConfig: {
					enabled: true,
					wsUrl: "/api/browser-workspaces/workspace-1/live",
				},
				workspaceId: "workspace-1",
			}
		},
		async getThreadWorkspaceScreenshot(threadId) {
			assert.equal(threadId, "thread-browser-bridge")
			return {
				buffer: Buffer.from("screenshot-bytes"),
				contentType: "image/png",
				state: {
					url: "https://example.com",
				},
				workspaceId: "workspace-1",
			}
		},
	}
}

function createScreenshotStore() {
	return {
		async persistScreenshot({ buffer, contentType, threadId, workspaceId }) {
			assert.equal(threadId, "thread-browser-bridge")
			assert.equal(workspaceId, "workspace-1")
			assert.equal(contentType, "image/png")
			assert.equal(Buffer.isBuffer(buffer), true)
			return {
				contentType,
				height: 1538,
				imageUrl: "/api/rovo-app/files/upload-browser-shot",
				width: 2400,
			}
		},
	}
}

test("browser bridge emits thread-bound workspace state immediately on navigate start and result", async () => {
	const writes = []
	const bridge = createThreadBrowserBridge({
		screenshotStore: createScreenshotStore(),
		threadId: "thread-browser-bridge",
		writer: {
			write(entry) {
				writes.push(entry)
			},
		},
		workspaceBindings: createWorkspaceBindings(),
	})

	await bridge.handleToolCallStart({
		toolCallId: "tool-call-1",
		toolInput: {
			thread_id: "thread-browser-bridge",
			url: "https://example.com",
		},
		toolName: "browser_navigate",
	})
	await bridge.handleToolCallResult({
		toolCallId: "tool-call-1",
		toolName: "browser_navigate",
	})

	assert.deepEqual(writes, [
		{
			type: "data-browser-state",
			data: {
				status: "navigating",
				streamConfig: {
					enabled: true,
					wsUrl: "/api/browser-workspaces/workspace-1/live",
				},
				title: "about:blank",
				url: "https://example.com",
				workspaceId: "workspace-1",
			},
		},
		{
			type: "data-browser-state",
			data: {
				status: "ready",
				streamConfig: {
					enabled: true,
					wsUrl: "/api/browser-workspaces/workspace-1/live",
				},
				title: "Example Domain",
				url: "https://example.com",
				workspaceId: "workspace-1",
			},
		},
	])
})

test("browser bridge emits a screenshot only for explicit screenshot tool results", async () => {
	const writes = []
	const bridge = createThreadBrowserBridge({
		screenshotStore: createScreenshotStore(),
		threadId: "thread-browser-bridge",
		writer: {
			write(entry) {
				writes.push(entry)
			},
		},
		workspaceBindings: createWorkspaceBindings(),
	})

	await bridge.handleToolCallStart({
		toolCallId: "tool-call-2",
		toolInput: {
			thread_id: "thread-browser-bridge",
		},
		toolName: "browser_take_screenshot",
	})
	await bridge.handleToolCallResult({
		toolCallId: "tool-call-2",
		toolName: "browser_take_screenshot",
	})

	assert.deepEqual(writes[0], {
		type: "data-browser-state",
		data: {
			status: "navigating",
			streamConfig: {
				enabled: true,
				wsUrl: "/api/browser-workspaces/workspace-1/live",
			},
			title: "about:blank",
			url: "about:blank",
			workspaceId: "workspace-1",
		},
	})
	assert.deepEqual(writes[1], {
		type: "data-browser-state",
		data: {
			status: "ready",
			streamConfig: {
				enabled: true,
				wsUrl: "/api/browser-workspaces/workspace-1/live",
			},
			title: "Example Domain",
			url: "https://example.com",
			workspaceId: "workspace-1",
		},
	})
	assert.deepEqual(writes[2], {
		type: "data-browser-screenshot",
		data: {
			contentType: "image/png",
			height: 1538,
			imageUrl: "/api/rovo-app/files/upload-browser-shot",
			timestamp: writes[2].data.timestamp,
			url: "https://example.com",
			width: 2400,
			workspaceId: "workspace-1",
		},
	})
	assert.match(writes[2].data.timestamp, /^\d{4}-\d{2}-\d{2}T/)
})

test("browser bridge treats chrome-devtools MCP browser actions as preview-driving browser events", async () => {
	const writes = []
	const bridge = createThreadBrowserBridge({
		threadId: "thread-browser-bridge",
		writer: {
			write(entry) {
				writes.push(entry)
			},
		},
		workspaceBindings: {
			async ensureThreadWorkspace(threadId, defaultUrl) {
				assert.equal(threadId, "thread-browser-bridge")
				assert.equal(defaultUrl, "https://example.com/docs")
				return {
					state: {
						provider: "chrome-devtools",
						title: "Loading",
						url: "https://example.com/docs",
					},
					streamConfig: {
						enabled: true,
						wsUrl: "/api/browser-workspaces/workspace-canary/live",
					},
					workspaceId: "workspace-canary",
				}
			},
			async getThreadWorkspace(threadId) {
				assert.equal(threadId, "thread-browser-bridge")
				return {
					state: {
						provider: "chrome-devtools",
						title: "Docs",
						url: "https://example.com/docs",
					},
					streamConfig: {
						enabled: true,
						wsUrl: "/api/browser-workspaces/workspace-canary/live",
					},
					workspaceId: "workspace-canary",
				}
			},
			async getThreadWorkspaceScreenshot() {
				throw new Error("Screenshot should not be fetched for navigate_page")
			},
		},
	})

	await bridge.handleToolCallStart({
		toolCallId: "tool-call-cdp-1",
		toolInput: {
			url: "https://example.com/docs",
		},
		toolName: "navigate_page",
	})
	await bridge.handleToolCallResult({
		toolCallId: "tool-call-cdp-1",
		toolName: "navigate_page",
	})

	assert.deepEqual(writes, [
		{
			type: "data-browser-state",
			data: {
				provider: "chrome-devtools",
				status: "navigating",
				streamConfig: {
					enabled: true,
					wsUrl: "/api/browser-workspaces/workspace-canary/live",
				},
				title: "Loading",
				url: "https://example.com/docs",
				workspaceId: "workspace-canary",
			},
		},
		{
			type: "data-browser-state",
			data: {
				provider: "chrome-devtools",
				status: "ready",
				streamConfig: {
					enabled: true,
					wsUrl: "/api/browser-workspaces/workspace-canary/live",
				},
				title: "Docs",
				url: "https://example.com/docs",
				workspaceId: "workspace-canary",
			},
		},
	])
})

test("default workspace bindings route live-canary previews through browserWorkspaceManager", async () => {
	const calls = []
	const browserWorkspaceManagerImpl = {
		async createWorkspace(options = {}) {
			calls.push(["createWorkspace", options.defaultUrl ?? null])
			return {
				provider: "chrome-devtools",
				title: "Loading",
				url: "about:blank",
				workspaceId: "workspace-canary",
			}
		},
		getWorkspaceStream(workspaceId) {
			calls.push(["getWorkspaceStream", workspaceId])
			return {
				enabled: true,
				wsUrl: `/api/browser-workspaces/${workspaceId}/live`,
			}
		},
		async getWorkspaceState(workspaceId) {
			calls.push(["getWorkspaceState", workspaceId])
			return {
				provider: "chrome-devtools",
				title: "Docs",
				url: "https://example.com/docs",
				workspaceId,
			}
		},
		async deleteWorkspace(workspaceId) {
			calls.push(["deleteWorkspace", workspaceId])
			return {
				closed: true,
				workspaceId,
			}
		},
	}
	const bindings = createDefaultWorkspaceBindings({
		browserWorkspaceManagerImpl,
		ensureThreadSessionWorkspaceImpl: async () => {
			throw new Error("session workspace path should not be used in live-canary mode")
		},
		getThreadSessionWorkspaceImpl: async () => {
			throw new Error("session workspace path should not be used in live-canary mode")
		},
		getThreadSessionWorkspaceScreenshotImpl: async () => {
			throw new Error("session workspace path should not be used in live-canary mode")
		},
		isLiveCanaryBrowserModeImpl() {
			return true
		},
	})

	try {
		const ensured = await bindings.ensureThreadWorkspace(
			"thread-live-canary-preview",
			"https://example.com/docs",
		)
		const fetched = await bindings.getThreadWorkspace(
			"thread-live-canary-preview",
		)

		assert.deepEqual(ensured, {
			state: {
				provider: "chrome-devtools",
				title: "Loading",
				url: "about:blank",
				workspaceId: "workspace-canary",
			},
			streamConfig: {
				enabled: true,
				wsUrl: "/api/browser-workspaces/workspace-canary/live",
			},
			workspaceId: "workspace-canary",
		})
		assert.deepEqual(fetched, {
			state: {
				provider: "chrome-devtools",
				title: "Docs",
				url: "https://example.com/docs",
				workspaceId: "workspace-canary",
			},
			streamConfig: {
				enabled: true,
				wsUrl: "/api/browser-workspaces/workspace-canary/live",
			},
			workspaceId: "workspace-canary",
		})
		assert.deepEqual(calls, [
			["createWorkspace", null],
			["getWorkspaceStream", "workspace-canary"],
			["getWorkspaceState", "workspace-canary"],
			["getWorkspaceStream", "workspace-canary"],
		])
	} finally {
		await deleteLiveCanaryThreadWorkspace("thread-live-canary-preview", {
			browserWorkspaceManagerImpl,
		})
	}
})
