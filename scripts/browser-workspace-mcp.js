#!/usr/bin/env node

const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js")
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js")
const z = require("zod/v4")
const {
	ensureRovoAppThreadBrowserWorkspace,
	getRovoAppThreadBrowserWorkspaceScreenshot,
	getRovoAppThreadBrowserWorkspaceSnapshot,
	performRovoAppThreadBrowserWorkspaceAction,
	urlsLooselyMatch,
} = require("../backend/lib/rovo-app-browser-workspace")

async function ensureThreadWorkspace(threadId, defaultUrl) {
	return ensureRovoAppThreadBrowserWorkspace({
		defaultUrl,
		threadId,
	})
}

async function getThreadWorkspaceState(threadId, defaultUrl) {
	const workspace = await ensureThreadWorkspace(threadId, defaultUrl)
	return workspace.state
}

async function mutateWorkspace(threadId, action, body, { defaultUrl } = {}) {
	await ensureThreadWorkspace(threadId, defaultUrl)
	return performRovoAppThreadBrowserWorkspaceAction({
		action,
		body,
		threadId,
	})
}

async function readWorkspaceSnapshot(threadId, interactive) {
	return getRovoAppThreadBrowserWorkspaceSnapshot({
		interactive,
		threadId,
	})
}

async function captureWorkspaceScreenshot(threadId) {
	return getRovoAppThreadBrowserWorkspaceScreenshot({
		threadId,
	})
}

function formatWorkspaceState(state, prefix) {
	const lines = []
	if (prefix) {
		lines.push(prefix)
	}
	if (typeof state?.title === "string" && state.title.trim()) {
		lines.push(`Title: ${state.title.trim()}`)
	}
	if (typeof state?.url === "string" && state.url.trim()) {
		lines.push(`URL: ${state.url.trim()}`)
	}
	if (Array.isArray(state?.tabs)) {
		lines.push(`Tabs: ${state.tabs.length}`)
	}
	return lines.join("\n")
}

function stateLooksLoadedForTarget(state, targetUrl) {
	if (!state || typeof state !== "object") {
		return false
	}

	return urlsLooselyMatch(state.url, targetUrl)
}

function textResult(text) {
	return {
		content: [
			{
				type: "text",
				text,
			},
		],
	}
}

const server = new McpServer({
	name: "browser-workspace",
	version: "1.0.0",
})

const threadIdSchema = z.string().min(1).describe("Rovo thread ID")
const refSchema = z.string().min(1).describe("Accessibility ref such as @e1")
const tabIndexSchema = z.number().int().min(0)

function formatWorkspaceStateResult(state, prefix) {
	return textResult(formatWorkspaceState(state, prefix))
}

function registerMutationTool({
	name,
	description,
	inputSchema,
	action,
	getBody = function getBody() {
		return {}
	},
	getPrefix,
}) {
	server.registerTool(
		name,
		{
			description,
			inputSchema,
		},
		async function handleMutationTool(args) {
			const state = await mutateWorkspace(
				args.thread_id,
				action,
				getBody(args),
				{},
			)
			return formatWorkspaceStateResult(state, getPrefix(args))
		},
	)
}

async function navigateThreadWorkspace(threadId, url) {
	const initialState = await getThreadWorkspaceState(threadId, url)
	if (stateLooksLoadedForTarget(initialState, url)) {
		return formatWorkspaceStateResult(initialState, `Navigated to ${url}.`)
	}

	try {
		const state = await mutateWorkspace(
			threadId,
			"navigate",
			{ url },
			{ defaultUrl: url },
		)
		return formatWorkspaceStateResult(state, `Navigated to ${url}.`)
	} catch (error) {
		const state = await getThreadWorkspaceState(threadId).catch(() => null)
		if (stateLooksLoadedForTarget(state, url)) {
			return formatWorkspaceStateResult(
				state,
				`Navigation reported a timeout, but the page appears loaded for ${url}.`,
			)
		}

		throw error
	}
}

function formatWorkspaceTabs(state) {
	const tabs = Array.isArray(state?.tabs) ? state.tabs : []
	const lines = tabs.map((tab) => {
		const marker = tab.active ? "*" : "-"
		return `${marker} [${tab.index}] ${tab.title || "Untitled"} — ${tab.url}`
	})
	return lines.join("\n") || "No tabs are open."
}

async function waitForWorkspace(threadId, milliseconds) {
	await ensureThreadWorkspace(threadId)
	await new Promise((resolve) => {
		setTimeout(resolve, milliseconds)
	})
	const workspace = await ensureThreadWorkspace(threadId)
	return formatWorkspaceStateResult(workspace.state, `Waited ${milliseconds}ms.`)
}

server.registerTool(
	"browser_navigate",
	{
		description: "Navigate the thread-bound browser workspace to a URL.",
		inputSchema: {
			thread_id: threadIdSchema,
			url: z.string().min(1).describe("Destination URL"),
		},
	},
	async function handleNavigate({ thread_id, url }) {
		return navigateThreadWorkspace(thread_id, url)
	},
)

server.registerTool(
	"browser_snapshot",
	{
		description: "Capture an accessibility snapshot of the current browser page.",
		inputSchema: {
			thread_id: threadIdSchema,
			interactive: z.boolean().optional().default(true),
		},
	},
	async function handleSnapshot({ thread_id, interactive }) {
		const snapshot = await readWorkspaceSnapshot(thread_id, interactive !== false)
		return textResult(snapshot.snapshot || "Empty page")
	},
)

server.registerTool(
	"browser_take_screenshot",
	{
		description: "Capture a screenshot of the current browser page.",
		inputSchema: {
			thread_id: threadIdSchema,
		},
	},
	async function handleScreenshot({ thread_id }) {
		const { state } = await captureWorkspaceScreenshot(thread_id)
		return formatWorkspaceStateResult(
			state,
			"Captured a screenshot of the current page from the active browser workspace.",
		)
	},
)

registerMutationTool({
	name: "browser_click",
	description: "Click an element in the browser workspace by accessibility ref.",
	inputSchema: {
		thread_id: threadIdSchema,
		ref: refSchema,
	},
	action: "click-ref",
	getBody: function getBody({ ref }) {
		return { ref }
	},
	getPrefix: function getPrefix({ ref }) {
		return `Clicked ${ref}.`
	},
})

registerMutationTool({
	name: "browser_hover",
	description: "Hover an element in the browser workspace by accessibility ref.",
	inputSchema: {
		thread_id: threadIdSchema,
		ref: refSchema,
	},
	action: "hover-ref",
	getBody: function getBody({ ref }) {
		return { ref }
	},
	getPrefix: function getPrefix({ ref }) {
		return `Hovered ${ref}.`
	},
})

registerMutationTool({
	name: "browser_fill",
	description: "Fill an input in the browser workspace by accessibility ref.",
	inputSchema: {
		thread_id: threadIdSchema,
		ref: refSchema,
		text: z.string().describe("Replacement text"),
	},
	action: "fill-ref",
	getBody: function getBody({ ref, text }) {
		return { ref, text }
	},
	getPrefix: function getPrefix({ ref }) {
		return `Filled ${ref}.`
	},
})

registerMutationTool({
	name: "browser_type",
	description: "Type text into an element in the browser workspace by accessibility ref.",
	inputSchema: {
		thread_id: threadIdSchema,
		ref: refSchema,
		text: z.string().describe("Text to type"),
	},
	action: "type-ref",
	getBody: function getBody({ ref, text }) {
		return { ref, text }
	},
	getPrefix: function getPrefix({ ref }) {
		return `Typed into ${ref}.`
	},
})

registerMutationTool({
	name: "browser_select",
	description: "Select one or more values in the browser workspace by accessibility ref.",
	inputSchema: {
		thread_id: threadIdSchema,
		ref: refSchema,
		values: z.array(z.string().min(1)).min(1).describe("Values to select"),
	},
	action: "select-ref",
	getBody: function getBody({ ref, values }) {
		return {
			ref,
			values,
		}
	},
	getPrefix: function getPrefix({ ref }) {
		return `Updated ${ref} selection.`
	},
})

registerMutationTool({
	name: "browser_press_key",
	description: "Press a keyboard key in the browser workspace.",
	inputSchema: {
		thread_id: threadIdSchema,
		key: z.string().min(1).describe("Key name, such as Enter or ArrowDown"),
	},
	action: "press",
	getBody: function getBody({ key }) {
		return { key }
	},
	getPrefix: function getPrefix({ key }) {
		return `Pressed ${key}.`
	},
})

registerMutationTool({
	name: "browser_scroll",
	description: "Scroll the browser workspace in a direction by a number of pixels.",
	inputSchema: {
		thread_id: threadIdSchema,
		direction: z.enum(["up", "down", "left", "right"]),
		pixels: z.number().int().positive().optional(),
	},
	action: "scroll",
	getBody: function getBody({ direction, pixels }) {
		return {
			direction,
			pixels,
		}
	},
	getPrefix: function getPrefix({ direction }) {
		return `Scrolled ${direction}.`
	},
})

registerMutationTool({
	name: "browser_navigate_back",
	description: "Navigate back in browser history.",
	inputSchema: {
		thread_id: threadIdSchema,
	},
	action: "back",
	getPrefix: function getPrefix() {
		return "Navigated back."
	},
})

registerMutationTool({
	name: "browser_navigate_forward",
	description: "Navigate forward in browser history.",
	inputSchema: {
		thread_id: threadIdSchema,
	},
	action: "forward",
	getPrefix: function getPrefix() {
		return "Navigated forward."
	},
})

registerMutationTool({
	name: "browser_reload",
	description: "Reload the current browser page.",
	inputSchema: {
		thread_id: threadIdSchema,
	},
	action: "reload",
	getPrefix: function getPrefix() {
		return "Reloaded the current page."
	},
})

server.registerTool(
	"browser_tab_list",
	{
		description: "List the open browser tabs for the thread-bound workspace.",
		inputSchema: {
			thread_id: threadIdSchema,
		},
	},
	async function handleTabList({ thread_id }) {
		const workspace = await ensureThreadWorkspace(thread_id)
		return textResult(formatWorkspaceTabs(workspace.state))
	},
)

registerMutationTool({
	name: "browser_tab_new",
	description: "Open a new tab in the browser workspace.",
	inputSchema: {
		thread_id: threadIdSchema,
		url: z.string().optional().describe("Optional URL for the new tab"),
	},
	action: "tab-new",
	getBody: function getBody({ url }) {
		return { url }
	},
	getPrefix: function getPrefix() {
		return "Opened a new tab."
	},
})

registerMutationTool({
	name: "browser_tab_select",
	description: "Switch to a browser tab by index.",
	inputSchema: {
		thread_id: threadIdSchema,
		tab_index: tabIndexSchema.describe("Tab index to activate"),
	},
	action: "tab-select",
	getBody: function getBody({ tab_index }) {
		return {
			tabIndex: tab_index,
		}
	},
	getPrefix: function getPrefix({ tab_index }) {
		return `Switched to tab ${tab_index}.`
	},
})

registerMutationTool({
	name: "browser_tab_close",
	description: "Close a browser tab by index.",
	inputSchema: {
		thread_id: threadIdSchema,
		tab_index: tabIndexSchema.describe("Tab index to close"),
	},
	action: "tab-close",
	getBody: function getBody({ tab_index }) {
		return {
			tabIndex: tab_index,
		}
	},
	getPrefix: function getPrefix({ tab_index }) {
		return `Closed tab ${tab_index}.`
	},
})

server.registerTool(
	"browser_wait",
	{
		description: "Wait for a short amount of time before continuing.",
		inputSchema: {
			thread_id: threadIdSchema,
			milliseconds: z.number().int().min(1).max(10000).describe("Time to wait in milliseconds"),
		},
	},
	async function handleWait({ thread_id, milliseconds }) {
		return waitForWorkspace(thread_id, milliseconds)
	},
)

async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
}

main().catch((error) => {
	console.error("[browser-workspace-mcp] Server error:", error)
	process.exit(1)
})
