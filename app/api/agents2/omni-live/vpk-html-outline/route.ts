import { type NextRequest } from "next/server";
import { readJsonBody } from "@/app/api/_utils/read-json-body";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "POST",
		path: "/api/agents2/omni-live/vpk-html-outline",
		body,
	});
}
