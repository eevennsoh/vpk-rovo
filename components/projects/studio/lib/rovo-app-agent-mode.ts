export type RovoAppAgentMode = "ask" | "default" | "plan";

export interface RovoAppAgentModeSyncResult {
	applied: boolean;
}

export function buildRovoAppCancelUrl(threadId?: string | null): string {
	return threadId
		? `/api/chat-cancel?threadId=${encodeURIComponent(threadId)}`
		: "/api/chat-cancel";
}

export function buildRovoAppAgentModeRequest(input: {
	mode: RovoAppAgentMode;
}): {
	mode: RovoAppAgentMode;
} {
	return {
		mode: input.mode,
	};
}

export function parseRovoAppAgentMode(
	value: unknown,
): RovoAppAgentMode | null {
	if (
		value === "ask"
		|| value === "default"
		|| value === "plan"
	) {
		return value;
	}

	return null;
}

function isRecoverableAgentModeSyncFailure(
	status: number,
	message: string,
): boolean {
	if (status === 503 || status === 404) {
		return true;
	}

	return /Set agent mode failed \(status 404\)|Rovo Serve is required but not available/i.test(
		message,
	);
}

async function readAgentModeErrorMessage(response: Response): Promise<string> {
	try {
		const payload = (await response.json()) as {
			details?: unknown;
			error?: unknown;
			message?: unknown;
		};
		if (typeof payload.error === "string" && payload.error.trim()) {
			return payload.error.trim();
		}
		if (typeof payload.details === "string" && payload.details.trim()) {
			return payload.details.trim();
		}
		if (typeof payload.message === "string" && payload.message.trim()) {
			return payload.message.trim();
		}
	} catch {
		const text = await response.text().catch(() => "");
		if (text.trim()) {
			return text.trim();
		}
	}

	return `Failed to sync agent mode before dispatch (status ${response.status})`;
}

export async function syncRovoAppAgentModeForDispatch(
	fetchImpl: typeof fetch,
	mode: RovoAppAgentMode,
): Promise<RovoAppAgentModeSyncResult> {
	const response = await fetchImpl("/api/agent-mode", {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify(buildRovoAppAgentModeRequest({ mode })),
	});

	if (response.ok) {
		return { applied: true };
	}

	const message = await readAgentModeErrorMessage(response);
	if (isRecoverableAgentModeSyncFailure(response.status, message)) {
		return { applied: false };
	}

	throw new Error(message);
}

export async function fetchRovoAppAgentMode(
	fetchImpl: typeof fetch,
): Promise<RovoAppAgentMode | null> {
	const response = await fetchImpl("/api/agent-mode", {
		method: "GET",
	});
	if (!response.ok) {
		throw new Error(`Agent mode request failed with status ${response.status}`);
	}

	const payload = (await response.json()) as {
		mode?: unknown;
	};
	return parseRovoAppAgentMode(payload.mode);
}
