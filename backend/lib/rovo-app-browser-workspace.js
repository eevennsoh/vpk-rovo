const {
	browserWorkspaceManager,
	isBrowserWorkspaceNotFoundError,
} = require("./browser-workspace-manager")

function requireNonEmptyString(value, message) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(message)
	}

	return value.trim()
}

const threadWorkspaceIds = new Map()
const threadOperationTails = new Map()

function enqueueThreadOperation(threadId, operation) {
	const currentTail = threadOperationTails.get(threadId) ?? Promise.resolve()
	const nextOperation = currentTail.then(operation, operation)
	const settledTail = nextOperation.catch(() => {})
	threadOperationTails.set(threadId, settledTail)

	return nextOperation.finally(() => {
		if (threadOperationTails.get(threadId) === settledTail) {
			threadOperationTails.delete(threadId)
		}
	})
}

async function readBoundWorkspaceState(threadId) {
	const workspaceId = threadWorkspaceIds.get(threadId)
	if (!workspaceId) {
		return null
	}

	try {
		const state = await browserWorkspaceManager.getWorkspaceState(workspaceId)
		return {
			state,
			workspaceId,
		}
	} catch (error) {
		if (!isBrowserWorkspaceNotFoundError(error)) {
			throw error
		}

		threadWorkspaceIds.delete(threadId)
		return null
	}
}

async function ensureRovoAppThreadBrowserWorkspace({
	defaultUrl,
	threadId,
} = {}) {
	const resolvedThreadId = requireNonEmptyString(
		threadId,
		"A non-empty threadId is required.",
	)

	return enqueueThreadOperation(resolvedThreadId, async () => {
		const existing = await readBoundWorkspaceState(resolvedThreadId)
		if (existing) {
			return {
				created: false,
				state: existing.state,
				workspaceId: existing.workspaceId,
			}
		}

		const state = await browserWorkspaceManager.createWorkspace({
			defaultUrl,
		})
		threadWorkspaceIds.set(resolvedThreadId, state.workspaceId)
		return {
			created: true,
			state,
			workspaceId: state.workspaceId,
		}
	})
}

async function getRovoAppThreadBrowserWorkspace({
	threadId,
} = {}) {
	const resolvedThreadId = requireNonEmptyString(
		threadId,
		"A non-empty threadId is required.",
	)

	return enqueueThreadOperation(resolvedThreadId, async () => {
		return readBoundWorkspaceState(resolvedThreadId)
	})
}

async function deleteRovoAppThreadBrowserWorkspace(threadId) {
	const resolvedThreadId = requireNonEmptyString(
		threadId,
		"A non-empty threadId is required.",
	)

	return enqueueThreadOperation(resolvedThreadId, async () => {
		const workspaceId = threadWorkspaceIds.get(resolvedThreadId)
		threadWorkspaceIds.delete(resolvedThreadId)
		if (!workspaceId) {
			return {
				closed: false,
				threadId: resolvedThreadId,
				workspaceId: null,
			}
		}

		try {
			const result = await browserWorkspaceManager.deleteWorkspace(workspaceId)
			return {
				...result,
				threadId: resolvedThreadId,
			}
		} catch (error) {
			if (!isBrowserWorkspaceNotFoundError(error)) {
				throw error
			}

			return {
				closed: false,
				threadId: resolvedThreadId,
				workspaceId,
			}
		}
	})
}

function getRovoAppThreadBrowserWorkspaceId(threadId) {
	const resolvedThreadId = requireNonEmptyString(
		threadId,
		"A non-empty threadId is required.",
	)
	return threadWorkspaceIds.get(resolvedThreadId) ?? null
}

module.exports = {
	deleteRovoAppThreadBrowserWorkspace,
	ensureRovoAppThreadBrowserWorkspace,
	getRovoAppThreadBrowserWorkspace,
	getRovoAppThreadBrowserWorkspaceId,
}
