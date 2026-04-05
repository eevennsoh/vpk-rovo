import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { withRovoAppBackendUnavailableFallback } from "@/app/api/rovo-app/_utils/backend-unavailable";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

interface RouteProps {
	params: Promise<{ threadId: string }>;
}

export async function GET(_: NextRequest, { params }: RouteProps) {
	const { threadId } = await params;
	const response = await proxyToBackend({
		method: "GET",
		path: `/api/rovo-app/threads/${encodeURIComponent(threadId)}`,
	});
	return withRovoAppBackendUnavailableFallback(response, {
		thread: null,
	});
}

export async function PUT(request: NextRequest, { params }: RouteProps) {
	const { threadId } = await params;
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "PUT",
		path: `/api/rovo-app/threads/${encodeURIComponent(threadId)}`,
		body,
	});
}

export async function DELETE(_: NextRequest, { params }: RouteProps) {
	const { threadId } = await params;
	return proxyToBackend({
		method: "DELETE",
		path: `/api/rovo-app/threads/${encodeURIComponent(threadId)}`,
	});
}
