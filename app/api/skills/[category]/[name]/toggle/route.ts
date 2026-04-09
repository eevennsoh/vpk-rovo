import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

interface SkillToggleRouteContext {
	params: Promise<{
		category: string;
		name: string;
	}>;
}

export async function POST(request: NextRequest, { params }: SkillToggleRouteContext) {
	const { category, name } = await params;
	const enabled = request.nextUrl.searchParams.get("enabled");
	const query = enabled ? `?enabled=${encodeURIComponent(enabled)}` : "";
	const rawBody = await request.text();

	return proxyToBackend({
		method: "POST",
		path: `/api/skills/${encodeURIComponent(category)}/${encodeURIComponent(name)}/toggle${query}`,
		rawBody: rawBody.trim().length > 0 ? rawBody : undefined,
	});
}
