import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET(request: NextRequest) {
	const q = request.nextUrl.searchParams.get("q") ?? "";
	const limit = request.nextUrl.searchParams.get("limit");
	const queryEntries: [string, string][] = [];
	if (q) {
		queryEntries.push(["q", q]);
	}
	if (limit) {
		queryEntries.push(["limit", limit]);
	}
	const params = new URLSearchParams(queryEntries);
	const query = params.toString() ? `?${params.toString()}` : "";
	return proxyToBackend({
		method: "GET",
		path: `/api/wiki/search${query}`,
	});
}
