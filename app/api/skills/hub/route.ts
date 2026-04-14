import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";
import { readJsonBody } from "@/app/api/_utils/read-json-body";

export async function GET(request: NextRequest) {
	const identifier = request.nextUrl.searchParams.get("identifier");
	const installed = request.nextUrl.searchParams.get("installed");
	const query = request.nextUrl.searchParams.get("q");

	if (identifier) {
		const encodedIdentifier = identifier
			.split("/")
			.map((segment) => encodeURIComponent(segment))
			.join("/");
		return proxyToBackend({
			method: "GET",
			path: `/api/skills/hub/inspect/${encodedIdentifier}`,
		});
	}

	if (installed === "true") {
		return proxyToBackend({
			method: "GET",
			path: "/api/skills/hub/installed",
		});
	}

	return proxyToBackend({
		method: "GET",
		path: query
			? `/api/skills/hub/search${request.nextUrl.search}`
			: `/api/skills/hub/browse${request.nextUrl.search}`,
	});
}

export async function POST(request: NextRequest) {
	const { body, errorResponse } = await readJsonBody<Record<string, unknown>>(request);
	if (errorResponse) return errorResponse;

	const hasIdentifier = typeof body?.identifier === "string" && body.identifier.trim().length > 0;

	return proxyToBackend({
		method: "POST",
		path: hasIdentifier
			? "/api/skills/hub/install-by-id"
			: "/api/skills/hub/install",
		body,
	});
}
