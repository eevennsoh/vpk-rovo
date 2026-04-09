import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

interface SkillRouteContext {
	params: Promise<{
		category: string;
		name: string;
	}>;
}

export async function GET(_request: NextRequest, { params }: SkillRouteContext) {
	const { category, name } = await params;
	return proxyToBackend({
		method: "GET",
		path: `/api/skills/${encodeURIComponent(category)}/${encodeURIComponent(name)}`,
	});
}
