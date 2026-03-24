import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function POST(request: Request) {
	const body = await request.json();
	return proxyToBackend({
		method: "POST",
		path: "/api/future-chat/cancel-deferred-tool",
		body,
	});
}
