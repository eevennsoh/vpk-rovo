import { proxyToBackend } from "@/app/api/_utils/proxy";

interface RovoAppRunStreamRouteProps {
	params: Promise<{ threadId: string }>;
}

export async function GET(
	request: Request,
	{ params }: Readonly<RovoAppRunStreamRouteProps>,
) {
	const { threadId } = await params;
	return proxyToBackend({
		method: "GET",
		path: `/api/rovo/runs/${encodeURIComponent(threadId)}/stream`,
		expectEventStream: true,
		signal: request.signal,
	});
}
