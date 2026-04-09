import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

interface MemoryRouteContext {
	params: Promise<{
		target: string;
	}>;
}

export async function GET(_request: NextRequest, { params }: MemoryRouteContext) {
	const { target } = await params;
	return proxyToBackend({
		method: "GET",
		path: `/api/memories/${encodeURIComponent(target)}`,
	});
}

export async function PUT(request: NextRequest, { params }: MemoryRouteContext) {
	const { target } = await params;
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "PUT",
		path: `/api/memories/${encodeURIComponent(target)}`,
		body,
	});
}
