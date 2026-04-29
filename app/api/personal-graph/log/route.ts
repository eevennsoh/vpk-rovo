import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET() {
	return proxyToBackend({
		method: "GET",
		path: "/api/personal-graph/log",
	});
}
