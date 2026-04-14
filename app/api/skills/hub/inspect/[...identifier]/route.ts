import { proxyToBackend } from "@/app/api/_utils/proxy";

interface HubInspectRouteContext {
	params: Promise<{
		identifier: string[];
	}>;
}

export async function GET(_request: Request, { params }: HubInspectRouteContext) {
	const { identifier } = await params;
	const encodedIdentifier = identifier.map((segment) => encodeURIComponent(segment)).join("/");

	return proxyToBackend({
		method: "GET",
		path: `/api/skills/hub/inspect/${encodedIdentifier}`,
	});
}
