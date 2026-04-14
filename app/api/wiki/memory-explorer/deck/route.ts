import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function POST(request: Request) {
	const body = await request.json().catch(() => ({}));
	return proxyToBackend({
		body,
		method: "POST",
		path: "/api/wiki/memory-explorer/deck",
	});
}
