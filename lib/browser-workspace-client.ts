import { API_ENDPOINTS } from "@/lib/api-config";

export interface BrowserWorkspaceTab {
	index: number;
	title: string;
	url: string;
	active: boolean;
}

export interface BrowserWorkspaceState {
	workspaceId: string;
	ready: boolean;
	activeTabIndex: number;
	tabs: BrowserWorkspaceTab[];
	title: string;
	url: string;
	viewportWidth: number;
	viewportHeight: number;
	canGoBack: boolean;
	canGoForward: boolean;
	updatedAt: number;
}

export interface BrowserWorkspaceSnapshotPayload {
	workspaceId: string;
	activeTabIndex: number;
	title: string;
	url: string;
	snapshot: string;
	refs?: Record<string, { role?: string; name?: string }>;
	state: BrowserWorkspaceState;
}

export interface BrowserWorkspaceTabsPayload {
	workspaceId: string;
	activeTabIndex: number;
	tabs: BrowserWorkspaceTab[];
	updatedAt: number;
}

export interface BrowserWorkspaceListPayload {
	workspaces: BrowserWorkspaceState[];
}

export interface BrowserWorkspaceDeletePayload {
	workspaceId: string;
	closed: boolean;
}

export interface BrowserWorkspaceStreamConfig {
	enabled: boolean;
	workspaceId: string;
	session: string;
	port: number;
	wsUrl: string;
}

export interface BrowserWorkspacePreviewSessionPayload {
	sessionId: string;
	answerSdp: string;
}

export interface BrowserWorkspacePreviewSessionDeletePayload {
	sessionId: string;
	closed: boolean;
}

export type BrowserWorkspaceMutationAction =
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
	| "type";

export class BrowserWorkspaceRequestError extends Error {
	status: number

	constructor(message: string, status: number) {
		super(message)
		this.name = "BrowserWorkspaceRequestError"
		this.status = status
	}
}

async function readJsonResponse<T>(response: Response): Promise<T> {
	if (!response.ok) {
		const rawText = await response.text();
		let message = "Browser workspace request failed.";

		if (rawText.trim()) {
			try {
				const parsed = JSON.parse(rawText) as {
					error?: unknown;
					message?: unknown;
					details?: unknown;
				};
				if (typeof parsed.error === "string" && parsed.error.trim()) {
					message = parsed.error.trim();
				} else if (
					typeof parsed.message === "string" &&
					parsed.message.trim()
				) {
					message = parsed.message.trim();
				} else if (
					typeof parsed.details === "string" &&
					parsed.details.trim()
				) {
					message = parsed.details.trim();
				} else {
					message = rawText.trim();
				}
			} catch {
				message = rawText.trim();
			}
		}

		throw new BrowserWorkspaceRequestError(message, response.status)
	}

	return (await response.json()) as T;
}

async function requestBrowserWorkspaceJson<T>(
	input: string,
	init?: RequestInit,
): Promise<T> {
	const response = await fetch(input, {
		cache: "no-store",
		...init,
	})

	return readJsonResponse<T>(response)
}

export async function listBrowserWorkspaces() {
	return requestBrowserWorkspaceJson<BrowserWorkspaceListPayload>(
		API_ENDPOINTS.BROWSER_WORKSPACES,
	)
}

export async function createBrowserWorkspace(defaultUrl?: string) {
	return requestBrowserWorkspaceJson<BrowserWorkspaceState>(
		API_ENDPOINTS.BROWSER_WORKSPACES,
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(
				defaultUrl && defaultUrl.trim()
					? { defaultUrl: defaultUrl.trim() }
					: {},
			),
		},
	)
}

export async function getBrowserWorkspaceState(workspaceId: string) {
	return requestBrowserWorkspaceJson<BrowserWorkspaceState>(
		API_ENDPOINTS.browserWorkspace(workspaceId),
	)
}

export async function deleteBrowserWorkspace(workspaceId: string) {
	return requestBrowserWorkspaceJson<BrowserWorkspaceDeletePayload>(
		API_ENDPOINTS.browserWorkspace(workspaceId),
		{
			method: "DELETE",
		},
	)
}

export async function mutateBrowserWorkspace(
	workspaceId: string,
	action: BrowserWorkspaceMutationAction,
	body?: Record<string, unknown>,
) {
	return requestBrowserWorkspaceJson<BrowserWorkspaceState>(
		API_ENDPOINTS.browserWorkspaceAction(workspaceId, action),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(body ?? {}),
		},
	)
}

export async function listBrowserWorkspaceTabs(workspaceId: string) {
	return requestBrowserWorkspaceJson<BrowserWorkspaceTabsPayload>(
		API_ENDPOINTS.browserWorkspaceTabs(workspaceId),
	)
}

export async function createBrowserWorkspaceTab(workspaceId: string, url?: string) {
	return requestBrowserWorkspaceJson<BrowserWorkspaceState>(
		API_ENDPOINTS.browserWorkspaceTabs(workspaceId),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(
				url && url.trim()
					? { url: url.trim() }
					: {},
			),
		},
	)
}

export async function activateBrowserWorkspaceTab(
	workspaceId: string,
	tabIndex: number,
) {
	return requestBrowserWorkspaceJson<BrowserWorkspaceState>(
		API_ENDPOINTS.browserWorkspaceActivateTab(workspaceId, tabIndex),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({}),
		},
	)
}

export async function closeBrowserWorkspaceTab(
	workspaceId: string,
	tabIndex: number,
) {
	return requestBrowserWorkspaceJson<BrowserWorkspaceState>(
		API_ENDPOINTS.browserWorkspaceTab(workspaceId, tabIndex),
		{
			method: "DELETE",
		},
	)
}

export async function getBrowserWorkspaceSnapshot(
	workspaceId: string,
	interactive = false,
) {
	return requestBrowserWorkspaceJson<BrowserWorkspaceSnapshotPayload>(
		API_ENDPOINTS.browserWorkspaceSnapshot(workspaceId, interactive),
	)
}

export async function getBrowserWorkspaceStream(workspaceId: string) {
	return requestBrowserWorkspaceJson<BrowserWorkspaceStreamConfig>(
		API_ENDPOINTS.browserWorkspaceStream(workspaceId),
	)
}

export async function createBrowserWorkspacePreviewSession(
	workspaceId: string,
	offerSdp: string,
) {
	return requestBrowserWorkspaceJson<BrowserWorkspacePreviewSessionPayload>(
		API_ENDPOINTS.browserWorkspacePreviewSession(workspaceId),
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ offerSdp }),
		},
	)
}

export async function deleteBrowserWorkspacePreviewSession(
	workspaceId: string,
	sessionId: string,
) {
	return requestBrowserWorkspaceJson<BrowserWorkspacePreviewSessionDeletePayload>(
		API_ENDPOINTS.browserWorkspacePreviewSessionById(workspaceId, sessionId),
		{
			method: "DELETE",
		},
	)
}
