#!/usr/bin/env node

const fs = require("node:fs")
const path = require("node:path")
const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js")
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js")
const z = require("zod/v4")

const DEFAULT_BACKEND_URL = "http://localhost:8080"
const DEFAULT_REPO_ROOT = path.resolve(__dirname, "..")

function getRepoRoot() {
	if (typeof process.env.REPO_ROOT === "string" && process.env.REPO_ROOT.trim()) {
		return process.env.REPO_ROOT.trim()
	}

	return DEFAULT_REPO_ROOT
}

function getBackendPortFilePath() {
	return path.join(getRepoRoot(), ".dev-backend-port")
}

function getBackendBaseUrl() {
	if (typeof process.env.BACKEND_URL === "string" && process.env.BACKEND_URL.trim()) {
		return process.env.BACKEND_URL.trim().replace(/\/+$/u, "")
	}

	if (typeof process.env.BACKEND_PORT === "string" && process.env.BACKEND_PORT.trim()) {
		return `http://127.0.0.1:${process.env.BACKEND_PORT.trim()}`
	}

	try {
		const rawPort = fs.readFileSync(getBackendPortFilePath(), "utf8").trim()
		if (rawPort) {
			return `http://127.0.0.1:${rawPort}`
		}
	} catch {
		// Fall back to the default backend URL.
	}

	return DEFAULT_BACKEND_URL
}

function buildBackendUrl(routePath) {
	return `${getBackendBaseUrl()}${routePath}`
}

async function parseErrorResponse(response) {
	const rawText = await response.text()
	if (!rawText.trim()) {
		return `${response.status} ${response.statusText}`.trim()
	}

	try {
		const parsed = JSON.parse(rawText)
		if (parsed && typeof parsed === "object") {
			if (typeof parsed.error === "string" && parsed.error.trim()) {
				return parsed.error.trim()
			}
			if (typeof parsed.details === "string" && parsed.details.trim()) {
				return parsed.details.trim()
			}
		}
	} catch {
		// Fall through to the raw body text.
	}

	return rawText.trim()
}

async function requestJson(method, routePath, body) {
	const init =
		body === undefined
			? { method }
			: {
					method,
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(body),
				}
	const response = await fetch(buildBackendUrl(routePath), init)
	if (!response.ok) {
		throw new Error(await parseErrorResponse(response))
	}

	return response.json()
}

async function requestBinary(routePath) {
	const response = await fetch(buildBackendUrl(routePath), {
		method: "GET",
	})
	if (!response.ok) {
		throw new Error(await parseErrorResponse(response))
	}

	return Buffer.from(await response.arrayBuffer())
}

function requireThreadId(threadId) {
	if (typeof threadId !== "string" || !threadId.trim()) {
		throw new Error("A non-empty thread_id is required.")
	}

	return threadId.trim()
}

async function ensureThreadWorkspace(threadId, defaultUrl) {
	const resolvedThreadId = requireThreadId(threadId)
	const body =
		typeof defaultUrl === "string" && defaultUrl.trim()
			? { defaultUrl: defaultUrl.trim() }
			: {}
	return requestJson(
		"POST",
		`/api/rovo-app/threads/${encodeURIComponent(resolvedThreadId)}/browser-workspace`,
		body,
	)
}

async function getThreadWorkspaceState(threadId, defaultUrl) {
	const state = await ensureThreadWorkspace(threadId, defaultUrl)
	return requestJson(
		"GET",
		`/api/browser-workspaces/${encodeURIComponent(state.workspaceId)}`,
	)
}

async function mutateWorkspace(threadId, action, body, { defaultUrl } = {}) {
	const state = await ensureThreadWorkspace(threadId, defaultUrl)
	return requestJson(
		"POST",
		`/api/browser-workspaces/${encodeURIComponent(state.workspaceId)}/${action}`,
		body,
	)
}

async function readWorkspaceSnapshot(threadId, interactive) {
	const state = await ensureThreadWorkspace(threadId)
	const query = interactive ? "?interactive=true" : ""
	return requestJson(
		"GET",
		`/api/browser-workspaces/${encodeURIComponent(state.workspaceId)}/snapshot${query}`,
	)
}

async function captureWorkspaceScreenshot(threadId) {
	const state = await getThreadWorkspaceState(threadId)
	const buffer = await requestBinary(
		`/api/browser-workspaces/${encodeURIComponent(state.workspaceId)}/screenshot`,
	)
	return {
		buffer,
		state,
	}
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

function normalizeUrlCandidate(value) {
	if (typeof value !== "string" || !value.trim()) {
		return ""
	}

	try {
		const parsedUrl = new URL(value)
		parsedUrl.hash = ""
		return parsedUrl.toString()
	} catch {
		return value.trim()
	}
}

function normalizeComparableHostname(value) {
	return typeof value === "string"
		? value.trim().toLowerCase().replace(/^www\./u, "")
		: ""
}

function normalizeComparablePathname(value) {
	if (typeof value !== "string") {
		return ""
	}

	const trimmed = value.trim().replace(/\/+$/u, "")
	return trimmed === "/" ? "" : trimmed
}

function urlsLooselyMatch(currentUrl, targetUrl) {
	const normalizedTargetUrl = normalizeUrlCandidate(targetUrl)
	const normalizedCurrentUrl = normalizeUrlCandidate(currentUrl)
	if (!normalizedTargetUrl || !normalizedCurrentUrl) {
		return false
	}

	try {
		const current = new URL(normalizedCurrentUrl)
		const target = new URL(normalizedTargetUrl)
		if (
			normalizeComparableHostname(current.hostname) !==
			normalizeComparableHostname(target.hostname)
		) {
			return false
		}

		const targetPathname = normalizeComparablePathname(target.pathname)
		if (!targetPathname) {
			return true
		}

		const currentPathname = normalizeComparablePathname(current.pathname)
		return (
			currentPathname === targetPathname ||
			currentPathname.startsWith(`${targetPathname}/`)
		)
	} catch {
		return normalizedCurrentUrl.replace(/\/+$/u, "") === normalizedTargetUrl.replace(/\/+$/u, "")
	}
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

server.registerTool(
	"browser_navigate",
	{
		description: "Navigate the thread-bound browser workspace to a URL.",
		inputSchema: {
			thread_id: threadIdSchema,
			url: z.string().min(1).describe("Destination URL"),
		},
	},
	async ({ thread_id, url }) => {
		const initialState = await getThreadWorkspaceState(thread_id, url)
		if (stateLooksLoadedForTarget(initialState, url)) {
			return textResult(formatWorkspaceState(initialState, `Navigated to ${url}.`))
		}

		try {
			const state = await mutateWorkspace(
				thread_id,
				"navigate",
				{ url },
				{ defaultUrl: url },
			)
			return textResult(formatWorkspaceState(state, `Navigated to ${url}.`))
		} catch (error) {
			const state = await getThreadWorkspaceState(thread_id).catch(() => null)
			if (stateLooksLoadedForTarget(state, url)) {
				return textResult(
					formatWorkspaceState(
						state,
						`Navigation reported a timeout, but the page appears loaded for ${url}.`,
					),
				)
			}

			throw error
		}
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
	async ({ thread_id, interactive }) => {
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
	async ({ thread_id }) => {
		const { state } = await captureWorkspaceScreenshot(thread_id)
		return textResult(
			formatWorkspaceState(
				state,
				"Captured a screenshot of the current page from the active browser workspace.",
			),
		)
	},
)

server.registerTool(
	"browser_click",
	{
		description: "Click an element in the browser workspace by accessibility ref.",
		inputSchema: {
			thread_id: threadIdSchema,
			ref: z.string().min(1).describe("Accessibility ref such as @e1"),
		},
	},
	async ({ thread_id, ref }) => {
		const state = await mutateWorkspace(thread_id, "click-ref", { ref })
		return textResult(formatWorkspaceState(state, `Clicked ${ref}.`))
	},
)

server.registerTool(
	"browser_hover",
	{
		description: "Hover an element in the browser workspace by accessibility ref.",
		inputSchema: {
			thread_id: threadIdSchema,
			ref: z.string().min(1).describe("Accessibility ref such as @e1"),
		},
	},
	async ({ thread_id, ref }) => {
		const state = await mutateWorkspace(thread_id, "hover-ref", { ref })
		return textResult(formatWorkspaceState(state, `Hovered ${ref}.`))
	},
)

server.registerTool(
	"browser_fill",
	{
		description: "Fill an input in the browser workspace by accessibility ref.",
		inputSchema: {
			thread_id: threadIdSchema,
			ref: z.string().min(1).describe("Accessibility ref such as @e1"),
			text: z.string().describe("Replacement text"),
		},
	},
	async ({ thread_id, ref, text }) => {
		const state = await mutateWorkspace(thread_id, "fill-ref", { ref, text })
		return textResult(formatWorkspaceState(state, `Filled ${ref}.`))
	},
)

server.registerTool(
	"browser_type",
	{
		description: "Type text into an element in the browser workspace by accessibility ref.",
		inputSchema: {
			thread_id: threadIdSchema,
			ref: z.string().min(1).describe("Accessibility ref such as @e1"),
			text: z.string().describe("Text to type"),
		},
	},
	async ({ thread_id, ref, text }) => {
		const state = await mutateWorkspace(thread_id, "type-ref", { ref, text })
		return textResult(formatWorkspaceState(state, `Typed into ${ref}.`))
	},
)

server.registerTool(
	"browser_select",
	{
		description: "Select one or more values in the browser workspace by accessibility ref.",
		inputSchema: {
			thread_id: threadIdSchema,
			ref: z.string().min(1).describe("Accessibility ref such as @e1"),
			values: z.array(z.string().min(1)).min(1).describe("Values to select"),
		},
	},
	async ({ thread_id, ref, values }) => {
		const state = await mutateWorkspace(thread_id, "select-ref", {
			ref,
			values,
		})
		return textResult(formatWorkspaceState(state, `Updated ${ref} selection.`))
	},
)

server.registerTool(
	"browser_press_key",
	{
		description: "Press a keyboard key in the browser workspace.",
		inputSchema: {
			thread_id: threadIdSchema,
			key: z.string().min(1).describe("Key name, such as Enter or ArrowDown"),
		},
	},
	async ({ thread_id, key }) => {
		const state = await mutateWorkspace(thread_id, "press", { key })
		return textResult(formatWorkspaceState(state, `Pressed ${key}.`))
	},
)

server.registerTool(
	"browser_scroll",
	{
		description: "Scroll the browser workspace in a direction by a number of pixels.",
		inputSchema: {
			thread_id: threadIdSchema,
			direction: z.enum(["up", "down", "left", "right"]),
			pixels: z.number().int().positive().optional(),
		},
	},
	async ({ thread_id, direction, pixels }) => {
		const state = await mutateWorkspace(thread_id, "scroll", {
			direction,
			pixels,
		})
		return textResult(formatWorkspaceState(state, `Scrolled ${direction}.`))
	},
)

server.registerTool(
	"browser_navigate_back",
	{
		description: "Navigate back in browser history.",
		inputSchema: {
			thread_id: threadIdSchema,
		},
	},
	async ({ thread_id }) => {
		const state = await mutateWorkspace(thread_id, "back", {})
		return textResult(formatWorkspaceState(state, "Navigated back."))
	},
)

server.registerTool(
	"browser_navigate_forward",
	{
		description: "Navigate forward in browser history.",
		inputSchema: {
			thread_id: threadIdSchema,
		},
	},
	async ({ thread_id }) => {
		const state = await mutateWorkspace(thread_id, "forward", {})
		return textResult(formatWorkspaceState(state, "Navigated forward."))
	},
)

server.registerTool(
	"browser_reload",
	{
		description: "Reload the current browser page.",
		inputSchema: {
			thread_id: threadIdSchema,
		},
	},
	async ({ thread_id }) => {
		const state = await mutateWorkspace(thread_id, "reload", {})
		return textResult(formatWorkspaceState(state, "Reloaded the current page."))
	},
)

server.registerTool(
	"browser_tab_list",
	{
		description: "List the open browser tabs for the thread-bound workspace.",
		inputSchema: {
			thread_id: threadIdSchema,
		},
	},
	async ({ thread_id }) => {
		const state = await ensureThreadWorkspace(thread_id)
		const lines = state.tabs.map((tab) => {
			const marker = tab.active ? "*" : "-"
			return `${marker} [${tab.index}] ${tab.title || "Untitled"} — ${tab.url}`
		})
		return textResult(lines.join("\n") || "No tabs are open.")
	},
)

server.registerTool(
	"browser_tab_new",
	{
		description: "Open a new tab in the browser workspace.",
		inputSchema: {
			thread_id: threadIdSchema,
			url: z.string().optional().describe("Optional URL for the new tab"),
		},
	},
	async ({ thread_id, url }) => {
		const state = await ensureThreadWorkspace(thread_id)
		const nextState = await requestJson(
			"POST",
			`/api/browser-workspaces/${encodeURIComponent(state.workspaceId)}/tabs`,
			url ? { url } : {},
		)
		return textResult(formatWorkspaceState(nextState, "Opened a new tab."))
	},
)

server.registerTool(
	"browser_tab_select",
	{
		description: "Switch to a browser tab by index.",
		inputSchema: {
			thread_id: threadIdSchema,
			tab_index: z.number().int().min(0).describe("Tab index to activate"),
		},
	},
	async ({ thread_id, tab_index }) => {
		const state = await ensureThreadWorkspace(thread_id)
		const nextState = await requestJson(
			"POST",
			`/api/browser-workspaces/${encodeURIComponent(state.workspaceId)}/tabs/${encodeURIComponent(String(tab_index))}/activate`,
			{},
		)
		return textResult(formatWorkspaceState(nextState, `Switched to tab ${tab_index}.`))
	},
)

server.registerTool(
	"browser_tab_close",
	{
		description: "Close a browser tab by index.",
		inputSchema: {
			thread_id: threadIdSchema,
			tab_index: z.number().int().min(0).describe("Tab index to close"),
		},
	},
	async ({ thread_id, tab_index }) => {
		const state = await ensureThreadWorkspace(thread_id)
		const nextState = await requestJson(
			"DELETE",
			`/api/browser-workspaces/${encodeURIComponent(state.workspaceId)}/tabs/${encodeURIComponent(String(tab_index))}`,
		)
		return textResult(formatWorkspaceState(nextState, `Closed tab ${tab_index}.`))
	},
)

server.registerTool(
	"browser_wait",
	{
		description: "Wait for a short amount of time before continuing.",
		inputSchema: {
			thread_id: threadIdSchema,
			milliseconds: z.number().int().min(1).max(10000).describe("Time to wait in milliseconds"),
		},
	},
	async ({ thread_id, milliseconds }) => {
		await ensureThreadWorkspace(thread_id)
		await new Promise((resolve) => {
			setTimeout(resolve, milliseconds)
		})
		const state = await ensureThreadWorkspace(thread_id)
		return textResult(formatWorkspaceState(state, `Waited ${milliseconds}ms.`))
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
