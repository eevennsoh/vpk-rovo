import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function POST() {
	return proxyToBackend({
		body: {},
		method: "POST",
		path: "/api/personal-graph/vault/select",
	});
}
