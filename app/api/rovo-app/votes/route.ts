import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { withRovoAppBackendUnavailableFallback } from "@/app/api/rovo-app/_utils/backend-unavailable";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function GET(request: NextRequest) {
	const threadId = request.nextUrl.searchParams.get("threadId");
	const query = threadId ? `?threadId=${encodeURIComponent(threadId)}` : "";
	const response = await proxyToBackend({
		method: "GET",
		path: `/api/rovo-app/votes${query}`,
	});
	return withRovoAppBackendUnavailableFallback(response, {
		votes: [],
	});
}

export async function PATCH(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "PATCH",
		path: "/api/rovo-app/votes",
		body,
	});
}
