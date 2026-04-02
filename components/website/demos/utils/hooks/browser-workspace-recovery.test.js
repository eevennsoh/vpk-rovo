const test = require("node:test")
const assert = require("node:assert/strict")

const {
	isMissingBrowserWorkspaceError,
	recoverMissingBrowserWorkspace,
} = require("./browser-workspace-recovery.ts")

test("recognizes missing browser workspace errors by 404 status", () => {
	assert.equal(
		isMissingBrowserWorkspaceError({
			status: 404,
			message: "Browser workspace not found: workspace-stale",
		}),
		true,
	)
})

test("ignores non-workspace browser errors", () => {
	assert.equal(
		isMissingBrowserWorkspaceError({
			status: 500,
			message: "Failed to create browser workspace",
		}),
		false,
	)
})

test("recreates the workspace after the backend drops the active workspace id", async () => {
	const recreateCalls = []
	const recreatedState = {
		workspaceId: "workspace-new",
	}

	const result = await recoverMissingBrowserWorkspace({
		error: {
			status: 404,
			message: "Browser workspace not found: workspace-old",
		},
		currentWorkspaceId: "workspace-old",
		recreateWorkspace: async (options) => {
			recreateCalls.push(options)
			return recreatedState
		},
	})

	assert.deepEqual(recreateCalls, [
		{
			previousWorkspaceId: "workspace-old",
		},
	])
	assert.equal(result, recreatedState)
})
