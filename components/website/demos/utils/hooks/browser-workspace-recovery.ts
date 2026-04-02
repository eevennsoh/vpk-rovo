export function isMissingBrowserWorkspaceError(error: unknown): boolean {
	if (!error || typeof error !== "object") {
		return false
	}

	const record = error as {
		status?: unknown
		message?: unknown
	}
	const status = record.status
	if (status === 404) {
		return true
	}

	const message = record.message
	return (
		typeof message === "string" &&
		message.startsWith("Browser workspace not found:")
	)
}

export async function recoverMissingBrowserWorkspace<T>({
	error,
	currentWorkspaceId,
	recreateWorkspace,
}: {
	error: unknown
	currentWorkspaceId: string | null
	recreateWorkspace: (options: {
		previousWorkspaceId: string
	}) => Promise<T | null>
}): Promise<T | null> {
	if (!currentWorkspaceId || !isMissingBrowserWorkspaceError(error)) {
		return null
	}

	return recreateWorkspace({
		previousWorkspaceId: currentWorkspaceId,
	})
}
