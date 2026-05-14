/**
 * Sends a cancellation request for a deferred tool call to the backend.
 * The backend endpoint is expected at `/api/rovo/cancel-deferred-tool`.
 */
export async function cancelDeferredToolCall(
	toolCallId: string,
): Promise<boolean> {
	try {
		const response = await fetch("/api/rovo/cancel-deferred-tool", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ toolCallId }),
		});
		return response.ok;
	} catch (error) {
		console.warn(
			"[cancel-deferred-tool] Failed to cancel deferred tool call:",
			error,
		);
		return false;
	}
}
