import { proxyToBackend } from "@/app/api/_utils/proxy";

interface RovoAppRunCancelRouteProps {
	params: Promise<{ threadId: string }>;
}

export async function POST(
	_request: Request,
	{ params }: Readonly<RovoAppRunCancelRouteProps>,
) {
	const { threadId } = await params;
	return proxyToBackend({
		method: "POST",
		path: `/api/rovo-app/runs/${encodeURIComponent(threadId)}/cancel`,
	});
}
