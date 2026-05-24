import { proxyToBackend } from "@/app/api/_utils/proxy";

export function GET() {
	return proxyToBackend({
		method: "GET",
		path: "/api/realtime/audio-conversation-token",
	});
}
