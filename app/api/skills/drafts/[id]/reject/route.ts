import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

interface SkillDraftRejectRouteContext {
	params: Promise<{
		id: string;
	}>;
}

export async function POST(_request: NextRequest, { params }: SkillDraftRejectRouteContext) {
	const { id } = await params;
	return proxyToBackend({
		method: "POST",
		path: `/api/skills/drafts/${encodeURIComponent(id)}/reject`,
		body: {},
	});
}
