import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { withRovoAppBackendUnavailableFallback } from "@/app/api/rovo-app/_utils/backend-unavailable";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	const response = await proxyToBackend({
		method: "POST",
		path: "/api/rovo-app/suggestions",
		body,
		signal: request.signal,
	});

	return withRovoAppBackendUnavailableFallback(response, {
		questions: [],
	});
}
