import { type NextRequest, type NextResponse } from "next/server";

import { proxyToBackend } from "@/app/api/_utils/proxy";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function proxyOptionalMemoryExplorerPost(
	request: NextRequest,
	path: string,
): Promise<NextResponse> {
	const { body, errorResponse } = await readJsonBody<Record<string, unknown>>(request, {
		defaultBody: {},
		required: false,
	});
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		body: body ?? {},
		method: "POST",
		path,
	});
}
