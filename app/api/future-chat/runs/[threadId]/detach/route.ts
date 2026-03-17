import { proxyToBackend } from "@/app/api/_utils/proxy";

interface FutureChatRunDetachRouteProps {
	params: Promise<{ threadId: string }>;
}

export async function POST(
	_request: Request,
	{ params }: Readonly<FutureChatRunDetachRouteProps>,
) {
	const { threadId } = await params;
	return proxyToBackend({
		method: "POST",
		path: `/api/future-chat/runs/${encodeURIComponent(threadId)}/detach`,
	});
}
