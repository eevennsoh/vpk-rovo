import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { withFutureChatBackendUnavailableFallback } from "@/app/api/future-chat/_utils/backend-unavailable";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	const response = await proxyToBackend({
		method: "POST",
		path: "/api/future-chat/suggestions",
		body,
		signal: request.signal,
	});

	return withFutureChatBackendUnavailableFallback(response, {
		questions: [],
	});
}
