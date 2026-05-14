import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET(request: NextRequest) {
	const requestedPath = request.nextUrl.searchParams.get("path");
	const query = requestedPath
		? `?path=${encodeURIComponent(requestedPath)}`
		: "";

	return proxyToBackend({
		method: "GET",
		path: `/api/rovo/generated-media${query}`,
	});
}
