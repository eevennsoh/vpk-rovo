"use client";

/**
 * `Location.reload` is read-only in the current browser runtime, so the old
 * dev-only monkey-patch strategy throws before streaming can continue.
 *
 * Next.js App Router already soft-refreshes route add/remove HMR updates
 * internally, so keep this hook as a no-op until Next exposes a supported way
 * to intercept hard reloads from userland code.
 */
export function useHmrReloadSuppression(isStreaming: boolean): void {
	void isStreaming;
}
