import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

interface JobsActionRouteContext {
	params: Promise<{
		id: string;
	}>;
}

export async function POST(request: NextRequest, { params }: JobsActionRouteContext) {
	const { id } = await params;
	const { body, errorResponse } = await readJsonBody<Record<string, unknown>>(request, {
		defaultBody: {},
		required: false,
	});
	if (errorResponse) {
		return errorResponse;
	}

	return proxyToBackend({
		method: "POST",
		path: `/api/jobs/${encodeURIComponent(id)}/run`,
		body: body ?? {},
	});
}
