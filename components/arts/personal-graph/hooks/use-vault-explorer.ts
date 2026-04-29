"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchExplorer } from "../lib/personal-graph-api";
import type { VaultExplorer } from "../lib/personal-graph-types";

interface VaultExplorerState {
	error: Error | null;
	explorer: VaultExplorer | null;
	isLoading: boolean;
	refresh: () => Promise<void>;
}

export function useVaultExplorer(): VaultExplorerState {
	const [explorer, setExplorer] = useState<VaultExplorer | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	const refresh = useCallback(async () => {
		const controller = new AbortController();
		setIsLoading(true);
		try {
			const nextExplorer = await fetchExplorer({ signal: controller.signal });
			setExplorer(nextExplorer);
			setError(null);
		} catch (nextError) {
			if (nextError instanceof Error && nextError.name === "AbortError") {
				return;
			}
			setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
		} finally {
			setIsLoading(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	useEffect(() => {
		function handleFocus() {
			void refresh();
		}

		window.addEventListener("focus", handleFocus);
		return () => {
			window.removeEventListener("focus", handleFocus);
		};
	}, [refresh]);

	return {
		error,
		explorer,
		isLoading,
		refresh,
	};
}
