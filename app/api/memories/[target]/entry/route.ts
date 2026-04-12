import { NextResponse, type NextRequest } from "next/server";

interface MemoryEntryRouteContext {
	params: Promise<{
		target: string;
	}>;
}

function buildRemovedMemoryEntryResponse(target: string) {
	return NextResponse.json({
		error: `Direct Hermes memory editing for target "${target}" has been removed. Write durable memory through the llm-wiki flow.`,
	}, {
		status: 410,
	});
}

export async function POST(_request: NextRequest, { params }: MemoryEntryRouteContext) {
	const { target } = await params;
	return buildRemovedMemoryEntryResponse(target);
}

export async function DELETE(_request: NextRequest, { params }: MemoryEntryRouteContext) {
	const { target } = await params;
	return buildRemovedMemoryEntryResponse(target);
}
