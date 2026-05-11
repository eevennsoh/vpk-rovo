import type {
	CaptureResult,
	LibrarianStreamEvent,
	LogEntry,
	PageBody,
	PersonalGraphSummarizeEvent,
	PersonalGraphSummaryLength,
	QmdResult,
	RawSourceWriteResult,
	TwgNodeExpandResult,
	UnprocessedRawSources,
	VaultExplorer,
	VaultSettings,
} from "./personal-graph-types";

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
	const response = await fetch(path, {
		...init,
		headers: {
			Accept: "application/json",
			...init?.headers,
		},
	});

	if (!response.ok) {
		let message = "Personal Graph request failed";
		try {
			const errorBody = (await response.json()) as { error?: unknown; details?: unknown };
			message =
				typeof errorBody.error === "string"
					? errorBody.error
					: typeof errorBody.details === "string"
						? errorBody.details
						: message;
		} catch {
			message = await response.text();
		}
		throw new Error(message);
	}

	return (await response.json()) as T;
}

export function fetchExplorer(options: { signal?: AbortSignal } = {}) {
	return fetchJson<VaultExplorer>("/api/personal-graph/explorer", {
		signal: options.signal,
	});
}

export function fetchVaultSettings(options: { signal?: AbortSignal } = {}) {
	return fetchJson<VaultSettings>("/api/personal-graph/vault", {
		signal: options.signal,
	});
}

export function selectVaultFolder() {
	return fetchJson<VaultSettings>("/api/personal-graph/vault/select", {
		body: JSON.stringify({}),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
}

export function resetVaultFolder() {
	return fetchJson<VaultSettings>("/api/personal-graph/vault/reset", {
		body: JSON.stringify({}),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
}

export function fetchPage(slug: string, options: { signal?: AbortSignal } = {}) {
	return fetchJson<PageBody>(
		`/api/personal-graph/page/${slug.split("/").map(encodeURIComponent).join("/")}`,
		{ signal: options.signal },
	);
}

export function updatePage(slug: string, content: string) {
	return fetchJson<PageBody>(
		`/api/personal-graph/page/${slug.split("/").map(encodeURIComponent).join("/")}`,
		{
			body: JSON.stringify({ content }),
			headers: { "Content-Type": "application/json" },
			method: "PUT",
		},
	);
}

export function writeRawSource(slug: string, content: string) {
	return fetchJson<RawSourceWriteResult>("/api/personal-graph/raw", {
		body: JSON.stringify({ content, slug }),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
}

export function captureUrl(url: string) {
	return fetchJson<CaptureResult>("/api/personal-graph/capture", {
		body: JSON.stringify({ url }),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
}

export function fetchUnprocessedCount(options: { signal?: AbortSignal } = {}) {
	return fetchJson<UnprocessedRawSources>("/api/personal-graph/unprocessed-count", {
		signal: options.signal,
	});
}

export async function searchVault(query: string, options: { signal?: AbortSignal } = {}) {
	const data = await fetchJson<{ results: QmdResult[] }>(
		`/api/personal-graph/search?q=${encodeURIComponent(query)}`,
		{ signal: options.signal },
	);
	return data.results;
}

export async function fetchLog(options: { signal?: AbortSignal } = {}) {
	const data = await fetchJson<{ entries: LogEntry[] }>("/api/personal-graph/log", {
		signal: options.signal,
	});
	return data.entries;
}

export interface GraphSourceState {
	source: "vault" | "twg";
	generatedAt: string | null;
}

export type TwgChatFrame =
	| { type: "thinking"; step: number }
	| { type: "tool"; name: string; args: { slice: string; params: Record<string, unknown> } }
	| { type: "tool_result"; count: number; summary: string; error?: string }
	| { type: "text_delta"; delta: string }
	| { type: "graph"; explorer: VaultExplorer }
	| { type: "error"; error: string }
	| { type: "done" };

export interface TwgChatMessage {
	role: "user" | "assistant";
	content: string;
}

export function fetchActiveSource(options: { signal?: AbortSignal } = {}) {
	return fetchJson<GraphSourceState>("/api/personal-graph/source", { signal: options.signal });
}

export function setActiveSource(source: "vault" | "twg") {
	return fetchJson<GraphSourceState>("/api/personal-graph/source", {
		body: JSON.stringify({ source }),
		headers: { "Content-Type": "application/json" },
		method: "POST",
	});
}

export function refreshTwg(options: { signal?: AbortSignal; since?: string } = {}) {
	return fetchJson<VaultExplorer>("/api/personal-graph/twg/refresh", {
		body: JSON.stringify({ since: options.since }),
		headers: { "Content-Type": "application/json" },
		method: "POST",
		signal: options.signal,
	});
}

export function expandTwgNode(nodeId: string, options: { signal?: AbortSignal } = {}) {
	return fetchJson<TwgNodeExpandResult>("/api/personal-graph/twg/expand", {
		body: JSON.stringify({ nodeId }),
		headers: { "Content-Type": "application/json" },
		method: "POST",
		signal: options.signal,
	});
}

export async function* streamTwgChat(
	body: { messages: TwgChatMessage[] },
	options: { signal?: AbortSignal } = {},
): AsyncGenerator<TwgChatFrame> {
	const response = await fetch("/api/personal-graph/twg/chat", {
		body: JSON.stringify(body),
		headers: { "Content-Type": "application/json" },
		method: "POST",
		signal: options.signal,
	});
	if (!response.ok || !response.body) {
		throw new Error(await response.text());
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const lines = buffer.split("\n");
		buffer = lines.pop() ?? "";
		for (const line of lines) {
			const trimmed = line.trim();
			if (!trimmed) continue;
			try {
				yield JSON.parse(trimmed) as TwgChatFrame;
			} catch {}
		}
	}
	if (buffer.trim()) {
		try {
			yield JSON.parse(buffer.trim()) as TwgChatFrame;
		} catch {}
	}
}

interface SummaryOverride {
	summary: string;
	takeaways: string[];
}

export async function* streamLibrarian(
	body: { confirmToken?: string; sourcePath?: string; summaryOverride?: SummaryOverride },
): AsyncGenerator<LibrarianStreamEvent> {
	const query = body.confirmToken ? `?confirm=${encodeURIComponent(body.confirmToken)}` : "";
	const response = await fetch(`/api/personal-graph/ingest${query}`, {
		body: JSON.stringify(body),
		headers: { Accept: "text/event-stream", "Content-Type": "application/json" },
		method: "POST",
	});
	if (!response.ok || !response.body) {
		throw new Error(await response.text());
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const chunks = buffer.split("\n\n");
		buffer = chunks.pop() ?? "";
		for (const chunk of chunks) {
			const line = chunk.split("\n").find((entry) => entry.startsWith("data:"));
			if (line) {
				yield JSON.parse(line.slice(5).trim()) as LibrarianStreamEvent;
			}
		}
	}
}

export async function* streamPersonalGraphSummarize(
	body: {
		action: "summary" | "deck";
		bypassCache?: boolean;
		clientId?: string;
		length: PersonalGraphSummaryLength;
		nodeId: string;
		summary?: string;
		takeaways?: string[];
		workWindow?: string | null;
	},
	options: { signal?: AbortSignal } = {},
): AsyncGenerator<PersonalGraphSummarizeEvent> {
	const response = await fetch("/api/personal-graph/summarize", {
		body: JSON.stringify(body),
		headers: { Accept: "text/event-stream", "Content-Type": "application/json" },
		method: "POST",
		signal: options.signal,
	});
	if (!response.ok || !response.body) {
		throw new Error(await response.text());
	}
	const reader = response.body.getReader();
	const decoder = new TextDecoder();
	let buffer = "";
	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		buffer += decoder.decode(value, { stream: true });
		const chunks = buffer.split("\n\n");
		buffer = chunks.pop() ?? "";
		for (const chunk of chunks) {
			const line = chunk.split("\n").find((entry) => entry.startsWith("data:"));
			if (line) {
				yield JSON.parse(line.slice(5).trim()) as PersonalGraphSummarizeEvent;
			}
		}
	}
}
