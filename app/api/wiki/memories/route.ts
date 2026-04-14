import { NextRequest, NextResponse } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function GET() {
	return proxyToBackend({
		method: "GET",
		path: "/api/wiki/memories",
	});
}

export async function DELETE(request: NextRequest) {
	const proposalId = request.nextUrl.searchParams.get("proposalId");
	if (!proposalId) {
		return NextResponse.json(
			{ error: "A proposalId query parameter is required." },
			{ status: 400 },
		);
	}

	return proxyToBackend({
		method: "DELETE",
		path: `/api/wiki/memories/proposals/${encodeURIComponent(proposalId)}`,
	});
}
