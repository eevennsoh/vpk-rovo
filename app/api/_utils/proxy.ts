import { NextResponse } from "next/server";
import {
	BackendConnectionError,
	fetchBackend,
	getBackendUrlCandidates,
} from "@/app/api/_utils/backend-url";

interface ProxyRequestOptions {
	method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
	path: string;
	body?: unknown;
	rawBody?: string;
	contentType?: string;
	expectEventStream?: boolean;
	signal?: AbortSignal;
}

export function buildErrorMessage(rawText: string): string {
	const trimmedText = rawText.trim();
	if (!trimmedText) {
		return "Backend request failed";
	}

	try {
		const parsed = JSON.parse(trimmedText) as {
			error?: unknown;
			message?: unknown;
			details?: unknown;
		};
		if (typeof parsed.error === "string" && parsed.error.trim()) {
			return parsed.error.trim();
		}
		if (typeof parsed.message === "string" && parsed.message.trim()) {
			return parsed.message.trim();
		}
		if (typeof parsed.details === "string" && parsed.details.trim()) {
			return parsed.details.trim();
		}
	} catch {
		// Ignore JSON parse errors for plain-text responses.
	}

	return trimmedText;
}

export async function proxyToBackend(
	options: Readonly<ProxyRequestOptions>
): Promise<NextResponse> {
	let response: Response;
	try {
		const resolvedContentType = options.contentType ?? "application/json";
		let resolvedBody: string | undefined;
		if (
			options.method === "POST" ||
			options.method === "PUT" ||
			options.method === "PATCH"
		) {
			if (options.rawBody !== undefined) {
				resolvedBody = options.rawBody;
			} else if (options.body !== undefined) {
				resolvedBody = JSON.stringify(options.body);
			}
		}

		response = (
			await fetchBackend(options.path, {
			method: options.method,
			headers: {
				"Content-Type": resolvedContentType,
			},
			body: resolvedBody,
			signal: options.signal,
			})
		).response;
	} catch (error) {
		if (error instanceof Error && error.name === "AbortError") {
			return new NextResponse(null, { status: 204 });
		}

		const backendUrls =
			error instanceof BackendConnectionError
				? error.backendUrls
				: getBackendUrlCandidates();

		return NextResponse.json(
			{
				error: "Cannot connect to backend server",
				details: error instanceof Error ? error.message : String(error),
				backendUrls,
				path: options.path,
			},
			{ status: 503 }
		);
	}

	if (!response.ok) {
		const errorText = await response.text();
		return NextResponse.json(
			{ error: buildErrorMessage(errorText) },
			{ status: response.status }
		);
	}

	const contentType = response.headers.get("content-type") || "";
	if (options.expectEventStream || contentType.includes("text/event-stream")) {
		const headers = new Headers();
		headers.set("Content-Type", "text/event-stream");
		headers.set("Cache-Control", response.headers.get("cache-control") || "no-cache, no-transform");
		headers.set("Connection", response.headers.get("connection") || "keep-alive");
		headers.set("X-Accel-Buffering", "no");
		const transferEncoding = response.headers.get("transfer-encoding");
		if (transferEncoding) {
			headers.set("Transfer-Encoding", transferEncoding);
		}
		return new NextResponse(response.body, {
			status: response.status,
			headers,
		});
	}

	if (contentType.includes("application/json")) {
		const data = (await response.json()) as unknown;
		return NextResponse.json(data, { status: response.status });
	}

	const headers = new Headers();
	if (contentType) {
		headers.set("Content-Type", contentType);
	}

	const contentDisposition = response.headers.get("content-disposition");
	if (contentDisposition) {
		headers.set("Content-Disposition", contentDisposition);
	}

	const contentLength = response.headers.get("content-length");
	if (contentLength) {
		headers.set("Content-Length", contentLength);
	}

	return new NextResponse(response.body, {
		status: response.status,
		headers,
	});
}
