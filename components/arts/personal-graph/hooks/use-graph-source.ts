"use client";

import { useCallback, useEffect, useState } from "react";
import {
	fetchActiveSource,
	refreshTwg,
	setActiveSource as setActiveSourceApi,
	type GraphSourceState,
} from "../lib/personal-graph-api";

interface UseGraphSourceState {
	error: Error | null;
	generatedAt: string | null;
	isLoading: boolean;
	isSwitching: boolean;
	refresh: () => Promise<void>;
	refreshTwg: (options?: { since?: string }) => Promise<void>;
	setSource: (source: "vault" | "twg") => Promise<GraphSourceState | null>;
	source: "vault" | "twg";
}

export function useGraphSource(): UseGraphSourceState {
	const [state, setState] = useState<GraphSourceState>({ source: "vault", generatedAt: null });
	const [error, setError] = useState<Error | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSwitching, setIsSwitching] = useState(false);

	const refresh = useCallback(async () => {
		const controller = new AbortController();
		setIsLoading(true);
		try {
			const next = await fetchActiveSource({ signal: controller.signal });
			setState(next);
			setError(null);
		} catch (nextError) {
			if (nextError instanceof Error && nextError.name === "AbortError") return;
			setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
		} finally {
			setIsLoading(false);
		}
	}, []);

	const setSource = useCallback(async (source: "vault" | "twg") => {
		setIsSwitching(true);
		try {
			const next = await setActiveSourceApi(source);
			setState(next);
			setError(null);
			return next;
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
			return null;
		} finally {
			setIsSwitching(false);
		}
	}, []);

	const refreshTwgExplorer = useCallback(async (options: { since?: string } = {}) => {
		try {
			const explorer = await refreshTwg({ since: options.since });
			setState((current) => ({ ...current, generatedAt: explorer.generatedAt }));
			setError(null);
		} catch (nextError) {
			setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
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
		return () => window.removeEventListener("focus", handleFocus);
	}, [refresh]);

	return {
		error,
		generatedAt: state.generatedAt,
		isLoading,
		isSwitching,
		refresh,
		refreshTwg: refreshTwgExplorer,
		setSource,
		source: state.source,
	};
}
