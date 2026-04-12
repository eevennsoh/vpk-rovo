import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function POST(
	_request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const { id } = await params;
	return proxyToBackend({
		method: "POST",
		path: `/api/checkpoints/${encodeURIComponent(id)}/rollback`,
	});
}
