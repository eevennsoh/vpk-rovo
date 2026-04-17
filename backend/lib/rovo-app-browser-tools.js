const {
	ensureRovoAppThreadBrowserWorkspace,
	getRovoAppThreadBrowserWorkspace,
	getRovoAppThreadBrowserWorkspaceScreenshot,
} = require("./rovo-app-browser-workspace")
const {
	browserWorkspaceManager,
	isBrowserWorkspaceNotFoundError,
} = require("./browser-workspace-manager")
const {
	getConfiguredLiveCanaryCdpPort,
	isLiveCanaryBrowserMode,
} = require("./browser-runtime-config")
const {
	canConnectToCdpPort,
} = require("./browser-workspace-runtime")

const CHROME_DEVTOOLS_BROWSER_TOOL_NAMES = new Set([
	"click",
	"click_at",
	"close_page",
	"fill",
	"hover",
	"list_pages",
	"navigate_page",
	"new_page",
	"press_key",
	"select_page",
	"take_screenshot",
	"take_snapshot",
	"type_text",
	"wait_for",
])

const SCREENSHOT_TOOL_NAMES = new Set([
	"browser_take_screenshot",
	"take_screenshot",
])

const liveCanaryThreadWorkspaceIds = new Map()

function requireThreadId(threadId) {
	if (typeof threadId !== "string" || !threadId.trim()) {
		throw new Error("A non-empty threadId is required.")
	}

	return threadId.trim()
}

async function readLiveCanaryThreadWorkspace(threadId, {
	browserWorkspaceManagerImpl = browserWorkspaceManager,
} = {}) {
	const resolvedThreadId = requireThreadId(threadId)
	const workspaceId = liveCanaryThreadWorkspaceIds.get(resolvedThreadId)
	if (!workspaceId) {
		return null
	}

	try {
		const state = await browserWorkspaceManagerImpl.getWorkspaceState(workspaceId)
		return {
			state,
			streamConfig: browserWorkspaceManagerImpl.getWorkspaceStream(workspaceId),
			workspaceId,
		}
	} catch (error) {
		if (!isBrowserWorkspaceNotFoundError(error)) {
			throw error
		}

		liveCanaryThreadWorkspaceIds.delete(resolvedThreadId)
		return null
	}
}

async function ensureLiveCanaryThreadWorkspace(threadId, defaultUrl, {
	browserWorkspaceManagerImpl = browserWorkspaceManager,
} = {}) {
	const resolvedThreadId = requireThreadId(threadId)
	const existingWorkspace = await readLiveCanaryThreadWorkspace(resolvedThreadId, {
		browserWorkspaceManagerImpl,
	})
	if (existingWorkspace) {
		return existingWorkspace
	}

	// In live-canary mode the actual browser action should drive navigation.
	// Passing defaultUrl here would mutate the shared live session before the
	// corresponding Chrome DevTools tool executes.
	const state = await browserWorkspaceManagerImpl.createWorkspace()
	liveCanaryThreadWorkspaceIds.set(resolvedThreadId, state.workspaceId)

	return {
		state,
		streamConfig: browserWorkspaceManagerImpl.getWorkspaceStream(
			state.workspaceId,
		),
		workspaceId: state.workspaceId,
	}
}

async function getLiveCanaryThreadWorkspaceScreenshot(threadId, {
	browserWorkspaceManagerImpl = browserWorkspaceManager,
} = {}) {
	const resolvedThreadId = requireThreadId(threadId)
	const existingWorkspace = await readLiveCanaryThreadWorkspace(resolvedThreadId, {
		browserWorkspaceManagerImpl,
	})
	if (!existingWorkspace) {
		throw new Error(
			`No live browser preview workspace is bound for thread ${resolvedThreadId}.`,
		)
	}

	const screenshot = await browserWorkspaceManagerImpl.getWorkspaceScreenshot(
		existingWorkspace.workspaceId,
	)
	return {
		buffer: screenshot.buffer,
		contentType: screenshot.contentType,
		state: screenshot.state,
		workspaceId: existingWorkspace.workspaceId,
	}
}

async function deleteLiveCanaryThreadWorkspace(threadId, {
	browserWorkspaceManagerImpl = browserWorkspaceManager,
} = {}) {
	const resolvedThreadId = requireThreadId(threadId)
	const workspaceId = liveCanaryThreadWorkspaceIds.get(resolvedThreadId) ?? null
	liveCanaryThreadWorkspaceIds.delete(resolvedThreadId)
	if (!workspaceId) {
		return {
			closed: false,
			threadId: resolvedThreadId,
			workspaceId: null,
		}
	}

	const result = await browserWorkspaceManagerImpl.deleteWorkspace(workspaceId)
	return {
		...result,
		threadId: resolvedThreadId,
	}
}

function getBaseBrowserToolName(toolName) {
	if (typeof toolName !== "string") {
		return null
	}

	if (toolName.startsWith("mcp__")) {
		return toolName.replace(/^mcp__.*?__/u, "")
	}

	return toolName
}

function isBrowserToolCall(toolName) {
	const baseName = getBaseBrowserToolName(toolName)
	if (!baseName) {
		return false
	}

	return (
		baseName.startsWith("browser_") ||
		CHROME_DEVTOOLS_BROWSER_TOOL_NAMES.has(baseName)
	)
}

function isScreenshotToolCall(toolName) {
	const baseName = getBaseBrowserToolName(toolName)
	return SCREENSHOT_TOOL_NAMES.has(baseName)
}

function createDefaultWorkspaceBindings({
	browserWorkspaceManagerImpl = browserWorkspaceManager,
	ensureThreadSessionWorkspaceImpl = ensureRovoAppThreadBrowserWorkspace,
	getThreadSessionWorkspaceImpl = getRovoAppThreadBrowserWorkspace,
	getThreadSessionWorkspaceScreenshotImpl = getRovoAppThreadBrowserWorkspaceScreenshot,
	isLiveCanaryBrowserModeImpl = isLiveCanaryBrowserMode,
} = {}) {
	if (isLiveCanaryBrowserModeImpl()) {
		return {
			async ensureThreadWorkspace(threadId, defaultUrl) {
				return ensureLiveCanaryThreadWorkspace(threadId, defaultUrl, {
					browserWorkspaceManagerImpl,
				})
			},
			async getThreadWorkspace(threadId) {
				return readLiveCanaryThreadWorkspace(threadId, {
					browserWorkspaceManagerImpl,
				})
			},
			async getThreadWorkspaceScreenshot(threadId) {
				return getLiveCanaryThreadWorkspaceScreenshot(threadId, {
					browserWorkspaceManagerImpl,
				})
			},
		}
	}

	return {
		async ensureThreadWorkspace(threadId, defaultUrl) {
			const result = await ensureThreadSessionWorkspaceImpl({
				threadId,
				...(typeof defaultUrl === "string" && defaultUrl.trim()
					? { defaultUrl: defaultUrl.trim() }
					: {}),
			})
			return {
				state: result.state,
				streamConfig: result.streamConfig,
				workspaceId: result.workspaceId,
			}
		},
		async getThreadWorkspace(threadId) {
			const result = await getThreadSessionWorkspaceImpl({ threadId })
			if (!result) {
				return null
			}

			return {
				state: result.state,
				streamConfig: result.streamConfig,
				workspaceId: result.workspaceId,
			}
		},
		async getThreadWorkspaceScreenshot(threadId) {
			return getThreadSessionWorkspaceScreenshotImpl({ threadId })
		},
	}
}

function resolveToolThreadId(toolInput, fallbackThreadId) {
	const threadId =
		typeof toolInput?.thread_id === "string" && toolInput.thread_id.trim()
			? toolInput.thread_id.trim()
			: typeof fallbackThreadId === "string" && fallbackThreadId.trim()
				? fallbackThreadId.trim()
				: null

	return threadId
}

function resolveRequestedUrl(baseName, toolInput) {
	if (
		(baseName === "browser_navigate" ||
			baseName === "navigate_page" ||
			baseName === "new_page") &&
		typeof toolInput?.url === "string" &&
		toolInput.url.trim()
	) {
		return toolInput.url.trim()
	}

	return undefined
}

function createThreadBrowserBridge({
	screenshotStore = null,
	threadId,
	writer,
	workspaceBindings = createDefaultWorkspaceBindings(),
}) {
	const toolCallContexts = new Map()
	let hasEmittedBrowserScreenshot = false
	let hasEmittedBrowserState = false

	function emitBrowserState({
		state,
		status,
		streamConfig,
		workspaceId,
		url,
		title,
	}) {
		hasEmittedBrowserState = true
		writer.write({
			type: "data-browser-state",
			data: {
				...(typeof state?.provider === "string" && state.provider
					? {
						provider: state.provider,
					}
					: {}),
				status,
				streamConfig,
				title: title ?? state?.title ?? "",
				url: url ?? state?.url ?? "",
				workspaceId,
			},
		})
	}

	async function emitWorkspaceScreenshot(resolvedThreadId) {
		try {
			const screenshot =
				await workspaceBindings.getThreadWorkspaceScreenshot(resolvedThreadId)
			const persistedScreenshot =
				screenshotStore?.persistScreenshot &&
				Buffer.isBuffer(screenshot?.buffer)
					? await screenshotStore.persistScreenshot({
						buffer: screenshot.buffer,
						contentType: screenshot.contentType,
						state: screenshot.state,
						threadId: resolvedThreadId,
						workspaceId: screenshot.workspaceId,
					})
					: null
			hasEmittedBrowserScreenshot = true
			writer.write({
				type: "data-browser-screenshot",
				data: {
					contentType:
						persistedScreenshot?.contentType ?? screenshot.contentType ?? "image/png",
					height: persistedScreenshot?.height,
					timestamp: persistedScreenshot?.timestamp ?? new Date().toISOString(),
					url: screenshot.state?.url ?? "",
					width: persistedScreenshot?.width,
					workspaceId: screenshot.workspaceId,
					...(persistedScreenshot?.imageUrl
						? {
							imageUrl: persistedScreenshot.imageUrl,
						}
						: persistedScreenshot?.imageData
							? {
								imageData: persistedScreenshot.imageData,
							}
							: Buffer.isBuffer(screenshot?.buffer)
								? {
									imageData: screenshot.buffer.toString("base64"),
								}
								: {}),
					...(persistedScreenshot?.thumbnailUrl
						? {
							thumbnailUrl: persistedScreenshot.thumbnailUrl,
						}
						: {}),
				},
			})
		} catch (error) {
			console.warn(
				"[BROWSER-BRIDGE] Screenshot fetch error:",
				error?.message || error,
			)
		}
	}

	async function handleToolCallStart(toolCall) {
		if (!isBrowserToolCall(toolCall?.toolName)) {
			return false
		}

		const baseName = getBaseBrowserToolName(toolCall.toolName)
		const resolvedThreadId = resolveToolThreadId(toolCall.toolInput, threadId)
		if (!resolvedThreadId) {
			return false
		}

		try {
			const requestedUrl = resolveRequestedUrl(baseName, toolCall.toolInput)
			const existingWorkspace = await workspaceBindings.getThreadWorkspace(
				resolvedThreadId,
			)
			if (
				!existingWorkspace &&
				isLiveCanaryBrowserMode() &&
				!(await canConnectToCdpPort(
					getConfiguredLiveCanaryCdpPort(),
				).catch(() => false))
			) {
				emitBrowserState({
					state: {
						provider: "chrome-devtools",
					},
					status: "launching-canary",
					url: requestedUrl ?? "about:blank",
					workspaceId: undefined,
				})
			}
			const workspace = await workspaceBindings.ensureThreadWorkspace(
				resolvedThreadId,
				requestedUrl,
			)
			if (toolCall.toolCallId) {
				toolCallContexts.set(toolCall.toolCallId, {
					toolName: baseName,
					threadId: resolvedThreadId,
					workspaceId: workspace.workspaceId,
				})
			}

			emitBrowserState({
				state: workspace.state,
				status:
					workspace.state?.canaryWasLaunched === true &&
					!requestedUrl &&
					workspace.state?.url === "about:blank"
						? "awaiting-auth"
						: "navigating",
				streamConfig: workspace.streamConfig,
				title: workspace.state?.title ?? "",
				url: requestedUrl ?? workspace.state?.url ?? "",
				workspaceId: workspace.workspaceId,
			})
		} catch (error) {
			console.warn(
				"[BROWSER-BRIDGE] Workspace start error:",
				error?.message || error,
			)
		}

		return true
	}

	async function handleToolCallResult(toolCallResult) {
		if (!isBrowserToolCall(toolCallResult?.toolName)) {
			return false
		}

		const baseName = getBaseBrowserToolName(toolCallResult.toolName)
		const context = toolCallResult.toolCallId
			? toolCallContexts.get(toolCallResult.toolCallId) ?? null
			: null
		if (toolCallResult.toolCallId) {
			toolCallContexts.delete(toolCallResult.toolCallId)
		}

		const resolvedThreadId = context?.threadId ?? threadId
		if (!resolvedThreadId) {
			return false
		}

		try {
			const workspace = await workspaceBindings.getThreadWorkspace(
				resolvedThreadId,
			)
			if (workspace) {
				emitBrowserState({
					state: workspace.state,
					status: "ready",
					streamConfig: workspace.streamConfig,
					workspaceId: workspace.workspaceId,
				})
			}

			if (
				!toolCallResult?.errorText &&
				isScreenshotToolCall(baseName)
			) {
				await emitWorkspaceScreenshot(resolvedThreadId)
			}
		} catch (error) {
			console.warn(
				"[BROWSER-BRIDGE] Workspace result error:",
				error?.message || error,
			)
		}

		return true
	}

	async function cleanup() {
		toolCallContexts.clear()
	}

	return {
		cleanup,
		handleToolCallResult,
		handleToolCallStart,
		hasAuthoritativeOutput() {
			return hasEmittedBrowserState || hasEmittedBrowserScreenshot
		},
		hasScreenshotOutput() {
			return hasEmittedBrowserScreenshot
		},
	}
}

module.exports = {
	createDefaultWorkspaceBindings,
	createThreadBrowserBridge,
	deleteLiveCanaryThreadWorkspace,
	getBaseBrowserToolName,
	isBrowserToolCall,
	isScreenshotToolCall,
}
