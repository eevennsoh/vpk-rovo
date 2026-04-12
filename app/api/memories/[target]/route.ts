import { NextResponse, type NextRequest } from "next/server";

interface MemoryRouteContext {
	params: Promise<{
		target: string;
	}>;
}

function buildRemovedMemoryResponse(target: string) {
	return NextResponse.json({
		error: `Hermes file-backed memory target "${target}" has been removed. Use the wiki-backed memory status instead.`,
	}, {
		status: 410,
	});
}

export async function GET(_request: NextRequest, { params }: MemoryRouteContext) {
	const { target } = await params;
	return buildRemovedMemoryResponse(target);
}

export async function PUT(_request: NextRequest, { params }: MemoryRouteContext) {
	const { target } = await params;
	return buildRemovedMemoryResponse(target);
}
