import { proxyToBackend } from "@/app/api/_utils/proxy";

interface FutureChatRunStreamRouteProps {
	params: Promise<{ threadId: string }>;
}

export async function GET(
	request: Request,
	{ params }: Readonly<FutureChatRunStreamRouteProps>,
) {
	const { threadId } = await params;
	return proxyToBackend({
		method: "GET",
		path: `/api/future-chat/runs/${encodeURIComponent(threadId)}/stream`,
		expectEventStream: true,
		signal: request.signal,
	});
}
