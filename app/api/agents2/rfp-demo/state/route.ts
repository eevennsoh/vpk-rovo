import { proxyToBackend } from "@/app/api/_utils/proxy";
import { type NextRequest } from "next/server";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function GET() {
	return proxyToBackend({
		method: "GET",
		path: "/api/agents2/rfp-demo/state",
	});
}

export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody<Record<string, unknown>>(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "POST",
		path: "/api/agents2/rfp-demo/state",
		body,
	});
}
