import type { RovoAppRunStatus } from "@/lib/rovo-app-types";

export function shouldShowRovoAppSidebarRunIndicator(
	runStatus?: RovoAppRunStatus | null,
): boolean {
	return runStatus === "queued" || runStatus === "streaming" || runStatus === "background";
}
