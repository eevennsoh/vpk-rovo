import { proxyToBackend } from "@/app/api/_utils/proxy";
import { NextRequest } from "next/server";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

/**
 * Dev proxy for genui-export requests to the backend Express server.
 * Forwards { spec, format, title?, state? } and returns the rendered output
 * with appropriate Content-Type and Content-Disposition headers.
 */
export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) return errorResponse;

	return proxyToBackend({
		method: "POST",
		path: "/api/genui-export",
		body,
	});
}
