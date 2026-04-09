import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

interface JobsActionRouteContext {
	params: Promise<{
		id: string;
	}>;
}

export async function POST(request: NextRequest, { params }: JobsActionRouteContext) {
	const { id } = await params;
	const rawBody = await request.text();
	return proxyToBackend({
		method: "POST",
		path: `/api/jobs/${encodeURIComponent(id)}/resume`,
		rawBody: rawBody.trim().length > 0 ? rawBody : undefined,
	});
}
