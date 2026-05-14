import { NextRequest, NextResponse } from "next/server";
import {
	BackendConnectionError,
	fetchBackend,
	getBackendUrlCandidates,
} from "@/app/api/_utils/backend-url";
import { buildErrorMessage } from "@/app/api/_utils/proxy";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

/**
 * API proxy route that forwards AI SDK chat requests to the backend Express server.
 *
 * This route is used only during local development. In production, the frontend
 * is served by Express and calls /api/chat-sdk on the same origin.
 *
 * Returns plain-text errors (not JSON) as expected by the AI SDK transport.
 */
function isAgentsReferer(request: NextRequest): boolean {
	const referer = request.headers.get("referer");
	if (!referer) {
		return false;
	}

	try {
		const pathname = new URL(referer).pathname;
		return pathname === "/agents" || pathname.startsWith("/agents/");
	} catch {
		return false;
	}
}

function resolveForwardedBody(
	request: NextRequest,
	body: unknown
): unknown {
	if (
		!isAgentsReferer(request) ||
		!body ||
		typeof body !== "object" ||
		Array.isArray(body) ||
		"backendPreference" in body
	) {
		return body;
	}

	return {
		...body,
		backendPreference: "ai-gateway",
	};
}

export async function POST(request: NextRequest) {
	try {
		const { body, errorResponse } = await readJsonBody(request);
		if (errorResponse) {
			return new NextResponse(buildErrorMessage(await errorResponse.text()), {
				status: errorResponse.status,
				headers: {
					"Content-Type": "text/plain; charset=utf-8",
				},
			});
		}
		const forwardedBody = resolveForwardedBody(request, body);

		const { response } = await fetchBackend("/api/chat-sdk", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(forwardedBody),
		});

		if (!response.ok) {
			const retryAfter = response.headers.get("retry-after");
			const errorText = await response.text();

			const headers = new Headers({
				"Content-Type": "text/plain; charset=utf-8",
			});
			if (retryAfter) {
				headers.set("Retry-After", retryAfter);
			}

			return new NextResponse(buildErrorMessage(errorText), {
				status: response.status,
				headers,
			});
		}

		if (response.headers.get("content-type")?.includes("text/event-stream")) {
			return new NextResponse(response.body, {
				status: response.status,
				headers: {
					"Content-Type": "text/event-stream",
					"Cache-Control": "no-cache",
					Connection: "keep-alive",
				},
			});
		}

		const data = await response.json();
		return NextResponse.json(data);
	} catch (error) {
		if (error instanceof BackendConnectionError) {
			return NextResponse.json(
				{
					error: "Cannot connect to backend server",
					details: error.cause instanceof Error ? error.cause.message : String(error.cause),
					backendUrls: error.backendUrls,
				},
				{ status: 503 }
			);
		}

		console.error("Chat SDK proxy error:", error);
		return NextResponse.json(
			{
				error: "Internal server error",
				details: error instanceof Error ? error.message : String(error),
				backendUrls: getBackendUrlCandidates(),
			},
			{ status: 500 }
		);
	}
}
