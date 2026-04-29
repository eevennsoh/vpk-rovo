"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchVaultSettings, selectVaultFolder } from "../lib/personal-graph-api";
import type { VaultSettings } from "../lib/personal-graph-types";

interface VaultSettingsState {
	error: Error | null;
	isLoading: boolean;
	isSelecting: boolean;
	refresh: () => Promise<void>;
	selectFolder: () => Promise<VaultSettings | null>;
	settings: VaultSettings | null;
}

export function useVaultSettings(): VaultSettingsState {
	const [settings, setSettings] = useState<VaultSettings | null>(null);
	const [error, setError] = useState<Error | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isSelecting, setIsSelecting] = useState(false);

	const refresh = useCallback(async () => {
		const controller = new AbortController();
		setIsLoading(true);
		try {
			const nextSettings = await fetchVaultSettings({ signal: controller.signal });
			setSettings(nextSettings);
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

	const selectFolder = useCallback(async () => {
		setIsSelecting(true);
		try {
			const nextSettings = await selectVaultFolder();
			setSettings(nextSettings);
			setError(null);
			return nextSettings;
		} catch (nextError) {
			if (nextError instanceof Error && /cancelled|canceled/iu.test(nextError.message)) {
				return null;
			}
			setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
			return null;
		} finally {
			setIsSelecting(false);
		}
	}, []);

	useEffect(() => {
		void refresh();
	}, [refresh]);

	return {
		error,
		isLoading,
		isSelecting,
		refresh,
		selectFolder,
		settings,
	};
}
