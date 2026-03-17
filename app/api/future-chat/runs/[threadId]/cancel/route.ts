import { proxyToBackend } from "@/app/api/_utils/proxy";

interface FutureChatRunCancelRouteProps {
	params: Promise<{ threadId: string }>;
}

export async function POST(
	_request: Request,
	{ params }: Readonly<FutureChatRunCancelRouteProps>,
) {
	const { threadId } = await params;
	return proxyToBackend({
		method: "POST",
		path: `/api/future-chat/runs/${encodeURIComponent(threadId)}/cancel`,
	});
}
