import { proxyToBackend } from "@/app/api/_utils/proxy";
import { withRovoAppBackendUnavailableFallback } from "@/app/api/rovo/_utils/backend-unavailable";
import {
	createDefaultAgentsRfpDemoState,
	isValidAgentsRfpDemoState,
	normalizeAgentsRfpDemoProfileMetadata,
} from "@/components/projects/agents/lib/rfp-demo-state";
import { type NextRequest } from "next/server";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function GET() {
	const response = await proxyToBackend({
		method: "GET",
		path: "/api/agents/rfp-demo/state",
	});
	return withRovoAppBackendUnavailableFallback(response, {
		state: createDefaultAgentsRfpDemoState(),
	});
}

export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody<Record<string, unknown>>(request);
	if (errorResponse) {
		return errorResponse;
	}

	const requestBody = body ?? {};
	const response = await proxyToBackend({
		method: "POST",
		path: "/api/agents/rfp-demo/state",
		body: requestBody,
	});
	const fallbackState = isValidAgentsRfpDemoState(requestBody.state)
		? normalizeAgentsRfpDemoProfileMetadata(requestBody.state)
		: createDefaultAgentsRfpDemoState();
	return withRovoAppBackendUnavailableFallback(response, {
		state: fallbackState,
	});
}
