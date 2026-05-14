import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { withRovoAppBackendUnavailableFallback } from "@/app/api/rovo/_utils/backend-unavailable";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function GET(request: NextRequest) {
	const limit = request.nextUrl.searchParams.get("limit");
	const query = limit ? `?limit=${encodeURIComponent(limit)}` : "";
	const response = await proxyToBackend({
		method: "GET",
		path: `/api/rovo/threads${query}`,
	});
	return withRovoAppBackendUnavailableFallback(response, {
		threads: [],
	});
}

export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "POST",
		path: "/api/rovo/threads",
		body,
	});
}

export async function DELETE(request: NextRequest) {
	const all = request.nextUrl.searchParams.get("all");
	const query = all ? `?all=${encodeURIComponent(all)}` : "";
	return proxyToBackend({
		method: "DELETE",
		path: `/api/rovo/threads${query}`,
	});
}
