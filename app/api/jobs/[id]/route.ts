import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

interface JobsRouteContext {
	params: Promise<{
		id: string;
	}>;
}

export async function GET(_request: NextRequest, { params }: JobsRouteContext) {
	const { id } = await params;
	return proxyToBackend({
		method: "GET",
		path: `/api/jobs/${encodeURIComponent(id)}`,
	});
}

export async function PATCH(request: NextRequest, { params }: JobsRouteContext) {
	const { id } = await params;
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "PATCH",
		path: `/api/jobs/${encodeURIComponent(id)}`,
		body,
	});
}

export async function DELETE(_request: NextRequest, { params }: JobsRouteContext) {
	const { id } = await params;
	return proxyToBackend({
		method: "DELETE",
		path: `/api/jobs/${encodeURIComponent(id)}`,
	});
}
