import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET(request: NextRequest) {
	const url = new URL(request.url);
	const query = url.searchParams.toString();
	return proxyToBackend({
		method: "GET",
		path: `/api/personal-graph/search${query ? `?${query}` : ""}`,
	});
}
