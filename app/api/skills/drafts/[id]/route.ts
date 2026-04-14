import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

interface SkillDraftRouteContext {
	params: Promise<{
		id: string;
	}>;
}

export async function GET(_request: NextRequest, { params }: SkillDraftRouteContext) {
	const { id } = await params;
	return proxyToBackend({
		method: "GET",
		path: `/api/skills/drafts/${encodeURIComponent(id)}`,
	});
}

export async function DELETE(_request: NextRequest, { params }: SkillDraftRouteContext) {
	const { id } = await params;
	return proxyToBackend({
		method: "DELETE",
		path: `/api/skills/drafts/${encodeURIComponent(id)}`,
	});
}
