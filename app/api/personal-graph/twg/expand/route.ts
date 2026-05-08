import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function POST(request: Request) {
	const rawBody = await request.text();
	return proxyToBackend({
		method: "POST",
		path: "/api/personal-graph/twg/expand",
		rawBody: rawBody || "{}",
	});
}
