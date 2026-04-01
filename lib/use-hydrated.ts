import { useSyncExternalStore } from "react";

function subscribe() {
	return () => {};
}

export function useHasHydrated(): boolean {
	return useSyncExternalStore(subscribe, () => true, () => false);
}
