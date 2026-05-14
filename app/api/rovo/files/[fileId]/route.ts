import { type NextRequest } from "next/server";
import { proxyToBackend } from "@/app/api/_utils/proxy";

interface RouteProps {
	params: Promise<{ fileId: string }>;
}

export async function GET(_: NextRequest, { params }: RouteProps) {
	const { fileId } = await params;
	return proxyToBackend({
		method: "GET",
		path: `/api/rovo/files/${encodeURIComponent(fileId)}`,
	});
}
