/**
 * API Configuration for Frontend
 *
 * This file determines which backend the frontend should connect to:
 *
 * LOCAL DEVELOPMENT (npm run dev):
 * - Frontend runs on http://localhost:3000 (Next.js dev server)
 * - Backend runs on http://localhost:8080 (Express server)
 * - API calls go to /api/* which are Next.js API routes
 * - These routes proxy the request to http://localhost:8080
 * - This avoids CORS issues since browser only talks to localhost:3000
 *
 * PRODUCTION DEPLOYMENT:
 * - Both frontend and backend served from same Express server on port 8080
 * - Frontend is static HTML/CSS/JS files
 * - API calls go to /api/* which are handled directly by Express
 * - No Next.js API routes exist in production build
 * - No CORS issues since everything is same domain
 *
 * The key insight: In BOTH cases, the frontend uses relative paths (/api/*)
 * The difference is WHO handles those paths:
 * - Local dev: Next.js API routes proxy to Express backend
 * - Production: Express backend handles them directly
 */

// For the frontend, ALWAYS use relative paths
// This works in both local development and production
const API_BASE_URL = '';

export const API_ENDPOINTS = {
	CHAT_SDK: `${API_BASE_URL}/api/chat-sdk`,
	CHAT_TITLE: `${API_BASE_URL}/api/chat-title`,
	PLAN_TITLE: `${API_BASE_URL}/api/plan-title`,
	CHAT_CANCEL: `${API_BASE_URL}/api/chat-cancel`,
	HEALTH: `${API_BASE_URL}/api/health`,
	CHAT_THREADS: `${API_BASE_URL}/api/chat/threads`,
	FUTURE_CHAT_CHAT: `${API_BASE_URL}/api/future-chat/chat`,
	FUTURE_CHAT_MESSAGES: `${API_BASE_URL}/api/future-chat/messages`,
	FUTURE_CHAT_THREADS: `${API_BASE_URL}/api/future-chat/threads`,
	FUTURE_CHAT_VOTES: `${API_BASE_URL}/api/future-chat/votes`,
	FUTURE_CHAT_DOCUMENTS: `${API_BASE_URL}/api/future-chat/documents`,
	FUTURE_CHAT_FILE_UPLOAD: `${API_BASE_URL}/api/future-chat/files/upload`,
	AGENT_MODE: `${API_BASE_URL}/api/agent-mode`,
	chatThreads: (limit?: number) =>
		`${API_BASE_URL}/api/chat/threads${
			typeof limit === "number" ? `?limit=${encodeURIComponent(String(limit))}` : ""
		}`,
	chatThread: (threadId: string) =>
		`${API_BASE_URL}/api/chat/threads/${encodeURIComponent(threadId)}`,
	futureChatThreads: (limit?: number) =>
		`${API_BASE_URL}/api/future-chat/threads${
			typeof limit === "number" ? `?limit=${encodeURIComponent(String(limit))}` : ""
		}`,
	futureChatMessages: (threadId: string) =>
		`${API_BASE_URL}/api/future-chat/messages?threadId=${encodeURIComponent(threadId)}`,
	futureChatThread: (threadId: string) =>
		`${API_BASE_URL}/api/future-chat/threads/${encodeURIComponent(threadId)}`,
	futureChatFile: (fileId: string) =>
		`${API_BASE_URL}/api/future-chat/files/${encodeURIComponent(fileId)}`,
	MAKE_RUNS: `${API_BASE_URL}/api/make/runs`,
	MAKE_SKILLS: `${API_BASE_URL}/api/make/skills`,
	MAKE_AGENTS: `${API_BASE_URL}/api/make/agents`,
	MAKE_TOOLS: `${API_BASE_URL}/api/make/tools`,
	MAKE_CONFIG_SUMMARY: `${API_BASE_URL}/api/make/config-summary`,
	makeRuns: (limit?: number) =>
		`${API_BASE_URL}/api/make/runs${
			typeof limit === "number" ? `?limit=${encodeURIComponent(String(limit))}` : ""
		}`,
	makeRun: (runId: string) =>
		`${API_BASE_URL}/api/make/runs/${encodeURIComponent(runId)}`,
	makeRunStream: (runId: string) =>
		`${API_BASE_URL}/api/make/runs/${encodeURIComponent(runId)}/stream`,
	makeRunDirectives: (runId: string) =>
		`${API_BASE_URL}/api/make/runs/${encodeURIComponent(runId)}/directives`,
	makeRunSummary: (runId: string) =>
		`${API_BASE_URL}/api/make/runs/${encodeURIComponent(runId)}/summary`,
	makeRunTasks: (runId: string) =>
		`${API_BASE_URL}/api/make/runs/${encodeURIComponent(runId)}/tasks`,
	makeRunShare: (runId: string) =>
		`${API_BASE_URL}/api/make/runs/${encodeURIComponent(runId)}/share`,
	makeSkill: (name: string) =>
		`${API_BASE_URL}/api/make/skills/${encodeURIComponent(name)}`,
	makeAgent: (name: string) =>
		`${API_BASE_URL}/api/make/agents/${encodeURIComponent(name)}`,
	makeSkillRaw: (name: string) =>
		`${API_BASE_URL}/api/make/skills/${encodeURIComponent(name)}/raw`,
	makeAgentRaw: (name: string) =>
		`${API_BASE_URL}/api/make/agents/${encodeURIComponent(name)}/raw`,
	makeRunPublish: (runId: string) =>
		`${API_BASE_URL}/api/make/runs/${encodeURIComponent(runId)}/publish`,
	MAKE_FORGE_SITES: `${API_BASE_URL}/api/make/forge/sites`,
	MAKE_FORGE_DEV_SPACES: `${API_BASE_URL}/api/make/forge/dev-spaces`,
	SPEECH_TRANSCRIPTION: `${API_BASE_URL}/api/speech-transcription`,
	APPS: `${API_BASE_URL}/api/apps`,
	app: (slug: string) =>
		`${API_BASE_URL}/api/apps/${encodeURIComponent(slug)}`,
	WEB_PROXY: `${API_BASE_URL}/api/web-proxy`,
	CHROMIUM_PREVIEW: `${API_BASE_URL}/api/chromium-preview`,
	CHROMIUM_PREVIEW_STREAM: `${API_BASE_URL}/api/chromium-preview/stream`,
	BROWSER_WORKSPACES: `${API_BASE_URL}/api/browser-workspaces`,
	webProxy: (url: string) =>
		`${API_BASE_URL}/api/web-proxy?url=${encodeURIComponent(url)}`,
	browserWorkspace: (workspaceId: string) =>
		`${API_BASE_URL}/api/browser-workspaces/${encodeURIComponent(workspaceId)}`,
	browserWorkspaceAction: (
		workspaceId: string,
		action:
			| "navigate"
			| "back"
			| "forward"
			| "reload"
			| "viewport"
			| "click"
			| "click-ref"
			| "hover-ref"
			| "fill-ref"
			| "type-ref"
			| "select-ref"
			| "scroll"
			| "wheel"
			| "press"
			| "type"
			| "snapshot"
			| "screenshot"
			| "stream"
	) =>
		`${API_BASE_URL}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/${action}`,
	browserWorkspaceTabs: (workspaceId: string) =>
		`${API_BASE_URL}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/tabs`,
	browserWorkspaceTab: (workspaceId: string, tabIndex: number) =>
		`${API_BASE_URL}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/tabs/${encodeURIComponent(String(tabIndex))}`,
	browserWorkspaceActivateTab: (workspaceId: string, tabIndex: number) =>
		`${API_BASE_URL}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/tabs/${encodeURIComponent(String(tabIndex))}/activate`,
	browserWorkspaceSnapshot: (workspaceId: string, interactive?: boolean) => {
		const params = interactive ? "?interactive=true" : "";
		return `${API_BASE_URL}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/snapshot${params}`;
	},
	browserWorkspaceScreenshot: (
		workspaceId: string,
		width?: number,
		height?: number,
		cacheBuster?: number,
	) => {
		const params = new URLSearchParams();
		if (typeof width === "number" && width > 0) {
			params.set("width", String(width));
		}
		if (typeof height === "number" && height > 0) {
			params.set("height", String(height));
		}
		if (typeof cacheBuster === "number") {
			params.set("v", String(cacheBuster));
		}
		const query = params.toString();
		return `${API_BASE_URL}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/screenshot${
			query ? `?${query}` : ""
		}`;
	},
	browserWorkspaceStream: (workspaceId: string) =>
		`${API_BASE_URL}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/stream`,
	browserWorkspacePreviewSession: (workspaceId: string) =>
		`${API_BASE_URL}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/preview-session`,
	browserWorkspacePreviewSessionById: (
		workspaceId: string,
		sessionId: string,
	) =>
		`${API_BASE_URL}/api/browser-workspaces/${encodeURIComponent(workspaceId)}/preview-session/${encodeURIComponent(sessionId)}`,
	chromiumPreviewAction: (
		action:
			| "back"
			| "forward"
			| "reload"
			| "viewport"
			| "click"
			| "click-ref"
			| "hover-ref"
			| "fill-ref"
			| "type-ref"
			| "select-ref"
			| "scroll"
			| "wheel"
			| "press"
			| "type"
	) => `${API_BASE_URL}/api/chromium-preview/${action}`,
	chromiumPreviewSnapshot: (interactive?: boolean) => {
		const params = interactive ? "?interactive=true" : "";
		return `${API_BASE_URL}/api/chromium-preview/snapshot${params}`;
	},
	chromiumPreviewScreenshot: (
		width?: number,
		height?: number,
		cacheBuster?: number
	) => {
		const params = new URLSearchParams();
		if (typeof width === "number" && width > 0) {
			params.set("width", String(width));
		}
		if (typeof height === "number" && height > 0) {
			params.set("height", String(height));
		}
		if (typeof cacheBuster === "number") {
			params.set("v", String(cacheBuster));
		}
		const query = params.toString();
		return `${API_BASE_URL}/api/chromium-preview/screenshot${
			query ? `?${query}` : ""
		}`;
	},
};
