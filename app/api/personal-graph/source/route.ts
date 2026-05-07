import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET() {
	return proxyToBackend({
		method: "GET",
		path: "/api/personal-graph/source",
	});
}

export async function POST(request: Request) {
	const rawBody = await request.text();
	return proxyToBackend({
		method: "POST",
		path: "/api/personal-graph/source",
		rawBody,
	});
}
