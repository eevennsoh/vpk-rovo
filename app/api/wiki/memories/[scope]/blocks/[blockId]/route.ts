import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

interface WikiMemoryBlockRouteContext {
	params: Promise<{
		blockId: string;
		scope: string;
	}>;
}

export async function DELETE(request: NextRequest, { params }: WikiMemoryBlockRouteContext) {
	const { blockId, scope } = await params;
	const { body, errorResponse } = await readJsonBody(request);
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "DELETE",
		path: `/api/wiki/memories/${encodeURIComponent(scope)}/blocks/${encodeURIComponent(blockId)}`,
		body: body ?? {},
	});
}
