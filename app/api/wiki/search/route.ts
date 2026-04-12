import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET(request: NextRequest) {
	const q = request.nextUrl.searchParams.get("q") ?? "";
	const limit = request.nextUrl.searchParams.get("limit");
	const params = new URLSearchParams();
	if (q) {
		params.set("q", q);
	}
	if (limit) {
		params.set("limit", limit);
	}
	const query = params.toString() ? `?${params.toString()}` : "";
	return proxyToBackend({
		method: "GET",
		path: `/api/wiki/search${query}`,
	});
}
