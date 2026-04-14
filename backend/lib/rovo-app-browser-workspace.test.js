const test = require("node:test")
const assert = require("node:assert/strict")

const {
	BrowserWorkspaceNotFoundError,
	browserWorkspaceManager,
} = require("./browser-workspace-manager")
const {
	deleteRovoAppThreadBrowserWorkspace,
	ensureRovoAppThreadBrowserWorkspace,
	getRovoAppThreadBrowserWorkspace,
} = require("./rovo-app-browser-workspace")

test("thread browser workspace binding is created once and reused", async (t) => {
	const createdStates = []
	const originalCreateWorkspace = browserWorkspaceManager.createWorkspace
	const originalDeleteWorkspace = browserWorkspaceManager.deleteWorkspace
	const originalGetWorkspaceState = browserWorkspaceManager.getWorkspaceState

	t.after(async () => {
		browserWorkspaceManager.createWorkspace = originalCreateWorkspace
		browserWorkspaceManager.deleteWorkspace = originalDeleteWorkspace
		browserWorkspaceManager.getWorkspaceState = originalGetWorkspaceState
		await deleteRovoAppThreadBrowserWorkspace("thread-browser-test").catch(() => {})
	})

	browserWorkspaceManager.createWorkspace = async () => {
		const state = {
			activeTabIndex: 0,
			canGoBack: false,
			canGoForward: false,
			ready: true,
			tabs: [],
			title: "",
			updatedAt: Date.now(),
			url: "about:blank",
			viewportHeight: 900,
			viewportWidth: 1280,
			workspaceId: `workspace-${createdStates.length + 1}`,
		}
		createdStates.push(state)
		return state
	}
	browserWorkspaceManager.getWorkspaceState = async (workspaceId) => {
		const state = createdStates.find((entry) => entry.workspaceId === workspaceId)
		if (!state) {
			throw new BrowserWorkspaceNotFoundError(workspaceId)
		}
		return state
	}
	browserWorkspaceManager.deleteWorkspace = async (workspaceId) => ({
		closed: true,
		workspaceId,
	})

	const first = await ensureRovoAppThreadBrowserWorkspace({
		threadId: "thread-browser-test",
	})
	const second = await ensureRovoAppThreadBrowserWorkspace({
		threadId: "thread-browser-test",
	})
	const fetched = await getRovoAppThreadBrowserWorkspace({
		threadId: "thread-browser-test",
	})

	assert.equal(createdStates.length, 1)
	assert.equal(first.created, true)
	assert.equal(second.created, false)
	assert.equal(first.workspaceId, second.workspaceId)
	assert.equal(fetched?.workspaceId, first.workspaceId)
})
