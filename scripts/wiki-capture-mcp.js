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

function requireNonEmptyString(value, message) {
	if (typeof value !== "string" || !value.trim()) {
		throw new Error(message)
	}

	return value.trim()
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

function humanizeReason(reason) {
	if (typeof reason !== "string" || !reason.trim()) {
		return "unknown reason"
	}

	return reason.trim().replace(/[-_]+/gu, " ")
}

function formatCaptureResult(result, fallbackUrl) {
	const sourceUrl =
		typeof result?.sourceUrl === "string" && result.sourceUrl.trim()
			? result.sourceUrl.trim()
			: fallbackUrl
	const title =
		typeof result?.title === "string" && result.title.trim()
			? result.title.trim()
			: sourceUrl
	const wikiPath =
		typeof result?.wikiPath === "string" && result.wikiPath.trim()
			? result.wikiPath.trim()
			: null

	switch (result?.status) {
		case "created":
			return [
				`Saved ${title} to ${wikiPath || "the wiki raw captures"}.`,
				`Source URL: ${sourceUrl}`,
			].join("\n")
		case "existing":
			return [
				`That page is already saved at ${wikiPath || "an existing raw capture"}.`,
				`Source URL: ${sourceUrl}`,
			].join("\n")
		case "skipped":
			return `Skipped capture for ${sourceUrl}: ${humanizeReason(result?.reason)}.`
		default:
			return `Received an unexpected wiki capture response for ${sourceUrl}.`
	}
}

async function captureUrl(url) {
	const resolvedUrl = requireNonEmptyString(url, "A non-empty url is required.")
	return requestJson("POST", "/api/wiki/captures", {
		url: resolvedUrl,
	})
}

async function saveSynthesis({ content, sources, tags, title }) {
	return requestJson("POST", "/api/wiki/synthesis", {
		content: requireNonEmptyString(content, "A non-empty content value is required."),
		sources: Array.isArray(sources) ? sources : [],
		tags: Array.isArray(tags) ? tags : [],
		title: requireNonEmptyString(title, "A non-empty title is required."),
	})
}

function buildRovoThreadBrowserWorkspacePath(threadId) {
	const resolvedThreadId = requireNonEmptyString(threadId, "A non-empty thread_id is required.")
	return `/api/rovo/threads/${encodeURIComponent(resolvedThreadId)}/browser-workspace`
}

async function getActiveThreadUrl(threadId) {
	const workspaceState = await requestJson(
		"GET",
		buildRovoThreadBrowserWorkspacePath(threadId),
	)
	const url =
		typeof workspaceState?.url === "string" && workspaceState.url.trim()
			? workspaceState.url.trim()
			: null
	if (!url) {
		throw new Error("The active browser workspace does not have a current URL.")
	}

	return url
}

const server = new McpServer({
	name: "wiki-capture",
	version: "1.0.0",
})

const threadIdSchema = z.string().min(1).describe("Rovo thread ID")

server.registerTool(
	"wiki_capture_url",
	{
		description: "Save a public webpage as a markdown raw capture in the wiki.",
		inputSchema: {
			url: z.string().min(1).describe("Public webpage URL to save"),
		},
	},
	async ({ url }) => {
		const result = await captureUrl(url)
		return textResult(formatCaptureResult(result, url))
	},
)

server.registerTool(
	"wiki_capture_active_page",
	{
		description: "Save the active page from the thread-bound browser workspace as a markdown raw capture in the wiki.",
		inputSchema: {
			thread_id: threadIdSchema,
		},
	},
	async ({ thread_id }) => {
		const url = await getActiveThreadUrl(thread_id)
		const result = await captureUrl(url)
		return textResult(formatCaptureResult(result, url))
	},
)

server.registerTool(
	"wiki_save_synthesis",
	{
		description: "Save a reusable answer or synthesis as a canonical wiki/synthesis page.",
		inputSchema: {
			title: z.string().min(1).describe("Canonical title for the synthesis page"),
			content: z.string().min(1).describe("Markdown body to save"),
			tags: z.array(z.string()).optional().describe("Optional tags for the synthesis page"),
			sources: z.array(z.string()).optional().describe("Optional canonical wiki or raw source paths"),
		},
	},
	async ({ title, content, tags, sources }) => {
		const result = await saveSynthesis({ content, sources, tags, title })
		return textResult(
			[
				`Saved synthesis page "${result.title}" to ${result.path}.`,
				`Slug: ${result.slug}`,
			].join("\n"),
		)
	},
)

async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
}

if (require.main === module) {
	main().catch((error) => {
		console.error("[wiki-capture-mcp] Server error:", error)
		process.exit(1)
	})
}

module.exports = {
	buildRovoThreadBrowserWorkspacePath,
	getActiveThreadUrl,
}
