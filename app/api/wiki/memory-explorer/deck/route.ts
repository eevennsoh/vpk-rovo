import { type NextRequest } from "next/server";
import { proxyOptionalMemoryExplorerPost } from "@/app/api/wiki/memory-explorer/_utils";

export async function POST(request: NextRequest) {
	return proxyOptionalMemoryExplorerPost(request, "/api/wiki/memory-explorer/deck");
}
