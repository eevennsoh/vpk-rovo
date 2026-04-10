import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET(request: NextRequest) {
	const q = request.nextUrl.searchParams.get("q") ?? "";
	return proxyToBackend({
		method: "GET",
		path: `/api/skills/hub/search?q=${encodeURIComponent(q)}`,
	});
}
