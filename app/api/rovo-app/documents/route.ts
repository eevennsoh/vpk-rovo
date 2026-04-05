import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { withRovoAppBackendUnavailableFallback } from "@/app/api/rovo-app/_utils/backend-unavailable";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function GET(request: NextRequest) {
	const threadId = request.nextUrl.searchParams.get("threadId");
	const documentId = request.nextUrl.searchParams.get("documentId");
	const params = new URLSearchParams();
	if (threadId) {
		params.set("threadId", threadId);
	}
	if (documentId) {
		params.set("documentId", documentId);
	}
	const query = params.toString();
	const response = await proxyToBackend({
		method: "GET",
		path: `/api/rovo-app/documents${query ? `?${query}` : ""}`,
	});
	return withRovoAppBackendUnavailableFallback(response, documentId ? {
		document: null,
	} : {
		documents: [],
	});
}

export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "POST",
		path: "/api/rovo-app/documents",
		body,
	});
}

export async function DELETE(request: NextRequest) {
	const documentId = request.nextUrl.searchParams.get("documentId");
	const query = documentId ? `?documentId=${encodeURIComponent(documentId)}` : "";
	return proxyToBackend({
		method: "DELETE",
		path: `/api/rovo-app/documents${query}`,
	});
}
