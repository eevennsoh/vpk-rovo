import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET(request: Request) {
	const url = new URL(request.url);
	const query = url.searchParams.toString();
	return proxyToBackend({
		method: "GET",
		path: `/api/wiki/memory-explorer${query ? `?${query}` : ""}`,
	});
}
