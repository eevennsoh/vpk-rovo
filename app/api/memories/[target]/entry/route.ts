import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

interface MemoryEntryRouteContext {
	params: Promise<{
		target: string;
	}>;
}

export async function POST(request: NextRequest, { params }: MemoryEntryRouteContext) {
	const { target } = await params;
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "POST",
		path: `/api/memories/${encodeURIComponent(target)}/entry`,
		body,
	});
}

export async function DELETE(request: NextRequest, { params }: MemoryEntryRouteContext) {
	const { target } = await params;
	const index = request.nextUrl.searchParams.get("index");
	const entry = request.nextUrl.searchParams.get("entry");
	const entryId = request.nextUrl.searchParams.get("entryId");
	const query = new URLSearchParams();
	if (index) {
		query.set("index", index);
	}
	if (entry) {
		query.set("entry", entry);
	}
	if (entryId) {
		query.set("entryId", entryId);
	}

	return proxyToBackend({
		method: "DELETE",
		path: `/api/memories/${encodeURIComponent(target)}/entry${query.toString() ? `?${query.toString()}` : ""}`,
	});
}
