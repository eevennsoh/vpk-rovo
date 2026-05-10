import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const queryEntries: [string, string][] = [];

	const portIndex = searchParams.get("portIndex");
	const limit = searchParams.get("limit");
	if (portIndex !== null) queryEntries.push(["portIndex", portIndex]);
	if (limit !== null) queryEntries.push(["limit", limit]);

	const params = new URLSearchParams(queryEntries);
	const queryString = params.toString();
	return proxyToBackend({
		method: "GET",
		path: `/api/orchestrator/log${queryString ? `?${queryString}` : ""}`,
	});
}

export async function DELETE() {
	return proxyToBackend({
		method: "DELETE",
		path: "/api/orchestrator/log",
	});
}
