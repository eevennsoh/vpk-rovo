import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

interface SkillDraftApproveRouteContext {
	params: Promise<{
		id: string;
	}>;
}

export async function POST(_request: NextRequest, { params }: SkillDraftApproveRouteContext) {
	const { id } = await params;
	return proxyToBackend({
		method: "POST",
		path: `/api/skills/drafts/${encodeURIComponent(id)}/approve`,
		body: {},
	});
}
