import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { withFutureChatBackendUnavailableFallback } from "@/app/api/future-chat/_utils/backend-unavailable";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function GET(request: NextRequest) {
	const threadId = request.nextUrl.searchParams.get("threadId");
	const query = threadId ? `?threadId=${encodeURIComponent(threadId)}` : "";
	const response = await proxyToBackend({
		method: "GET",
		path: `/api/future-chat/messages${query}`,
	});
	return withFutureChatBackendUnavailableFallback(response, {
		messages: [],
	});
}

export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "POST",
		path: "/api/future-chat/messages",
		body,
	});
}
