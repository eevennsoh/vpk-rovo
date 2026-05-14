import { NextResponse } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

export async function POST(request: Request) {
	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return NextResponse.json(
			{ error: "Invalid JSON request body" },
			{ status: 400 },
		);
	}

	return proxyToBackend({
		method: "POST",
		path: "/api/rovo/cancel-deferred-tool",
		body,
	});
}
