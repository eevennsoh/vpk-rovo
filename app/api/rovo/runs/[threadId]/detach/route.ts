import { proxyToBackend } from "@/app/api/_utils/proxy";

interface RovoAppRunDetachRouteProps {
	params: Promise<{ threadId: string }>;
}

export async function POST(
	_request: Request,
	{ params }: Readonly<RovoAppRunDetachRouteProps>,
) {
	const { threadId } = await params;
	return proxyToBackend({
		method: "POST",
		path: `/api/rovo/runs/${encodeURIComponent(threadId)}/detach`,
	});
}
