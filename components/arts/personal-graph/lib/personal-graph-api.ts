import type {
	CaptureResult,
	LibrarianStreamEvent,
	LogEntry,
	PageBody,
	QmdResult,
	RawSourceWriteResult,
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

export async function* streamLibrarian(
	body: { confirmToken?: string; sourcePath?: string },
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
