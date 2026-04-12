import { NextResponse } from "next/server";

export async function GET() {
	return NextResponse.json({
		error: "Hermes file-backed memory has been removed. Use /api/wiki/status for compiled memory state.",
	}, {
		status: 410,
	});
}
