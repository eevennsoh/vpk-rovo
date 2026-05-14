import { NextResponse } from "next/server";

const ROVO_APP_BACKEND_UNAVAILABLE_MESSAGE =
	"Cannot connect to backend server";

export async function withRovoAppBackendUnavailableFallback(
	response: NextResponse,
	fallbackBody: Record<string, unknown>,
): Promise<NextResponse> {
	if (response.status !== 503) {
		return response;
	}

	const payload = (await response.clone().json().catch(() => null)) as
		| { error?: unknown }
		| null;
	if (payload?.error !== ROVO_APP_BACKEND_UNAVAILABLE_MESSAGE) {
		return response;
	}

	return NextResponse.json(
		{
			...fallbackBody,
			backendUnavailable: true,
			error: ROVO_APP_BACKEND_UNAVAILABLE_MESSAGE,
		},
		{ status: 200 },
	);
}
