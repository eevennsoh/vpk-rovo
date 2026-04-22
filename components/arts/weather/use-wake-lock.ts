"use client";

import * as React from "react";

export const WAKE_LOCK_STORAGE_KEY = "vpk:weather:wake-lock";

interface MinimalWakeLockSentinel {
	released: boolean;
	release: () => Promise<void>;
	addEventListener: (
		type: "release",
		listener: () => void,
	) => void;
	removeEventListener: (
		type: "release",
		listener: () => void,
	) => void;
}

interface MinimalWakeLockApi {
	request: (type: "screen") => Promise<MinimalWakeLockSentinel>;
}

interface NavigatorWithWakeLock {
	wakeLock?: MinimalWakeLockApi;
}

export interface UseWakeLockResult {
	/** True when the browser exposes the Screen Wake Lock API. */
	isSupported: boolean;
	/** True while a sentinel is currently held. */
	isActive: boolean;
	/** True when the user has requested the lock be on (pref persisted). */
	isEnabled: boolean;
	/** Last error encountered when requesting/releasing the lock. */
	error: string | null;
	enable: () => Promise<void>;
	disable: () => Promise<void>;
	toggle: () => Promise<void>;
}

/**
 * Detect Screen Wake Lock API support without throwing on SSR.
 */
export function detectWakeLockSupport(): boolean {
	if (typeof navigator === "undefined") return false;
	const nav = navigator as NavigatorWithWakeLock;
	return Boolean(nav.wakeLock && typeof nav.wakeLock.request === "function");
}

function readStoredPreference(storageKey: string): boolean {
	if (typeof window === "undefined") return false;
	try {
		return window.localStorage.getItem(storageKey) === "1";
	} catch {
		return false;
	}
}

function writeStoredPreference(storageKey: string, value: boolean): void {
	if (typeof window === "undefined") return;
	try {
		if (value) {
			window.localStorage.setItem(storageKey, "1");
		} else {
			window.localStorage.removeItem(storageKey);
		}
	} catch {
		// Ignore quota / privacy mode errors — the toggle still works
		// for the current session.
	}
}

export interface UseWakeLockOptions {
	/** localStorage key used for the persisted preference. */
	storageKey?: string;
}

/**
 * React hook for the browser Screen Wake Lock API.
 *
 * The user-facing preference (on/off) is persisted in localStorage so that
 * once a user enables "keep awake" we re-acquire the wake lock automatically
 * when the tab becomes visible again — browsers release the lock whenever
 * the document is hidden.
 *
 * Defaults to OFF on first visit.
 */
export function useWakeLock(
	options: UseWakeLockOptions = {},
): UseWakeLockResult {
	const storageKey = options.storageKey ?? WAKE_LOCK_STORAGE_KEY;

	// Avoid hydration mismatch: start as `false` on the server and read
	// the stored preference once mounted on the client.
	const [isSupported, setIsSupported] = React.useState(false);
	const [isEnabled, setIsEnabled] = React.useState(false);
	const [isActive, setIsActive] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	const sentinelRef = React.useRef<MinimalWakeLockSentinel | null>(null);
	const isEnabledRef = React.useRef(false);

	React.useEffect(() => {
		isEnabledRef.current = isEnabled;
	}, [isEnabled]);

	const releaseInternal = React.useCallback(async () => {
		const sentinel = sentinelRef.current;
		sentinelRef.current = null;
		setIsActive(false);
		if (!sentinel || sentinel.released) return;
		try {
			await sentinel.release();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to release wake lock");
		}
	}, []);

	const acquireInternal = React.useCallback(async () => {
		if (typeof document !== "undefined" && document.visibilityState !== "visible") {
			// Browsers reject wake-lock requests in hidden tabs. We'll
			// retry from the visibilitychange listener once visible.
			return;
		}
		const nav = (typeof navigator !== "undefined"
			? (navigator as NavigatorWithWakeLock)
			: null);
		if (!nav?.wakeLock) return;
		if (sentinelRef.current && !sentinelRef.current.released) {
			setIsActive(true);
			return;
		}
		try {
			const sentinel = await nav.wakeLock.request("screen");
			sentinelRef.current = sentinel;
			setIsActive(true);
			setError(null);
			const handleRelease = () => {
				if (sentinelRef.current === sentinel) {
					sentinelRef.current = null;
					setIsActive(false);
				}
			};
			sentinel.addEventListener("release", handleRelease);
		} catch (err) {
			sentinelRef.current = null;
			setIsActive(false);
			setError(err instanceof Error ? err.message : "Failed to acquire wake lock");
		}
	}, []);

	// Mount: detect support and rehydrate preference. If the user
	// previously enabled the lock, attempt to re-acquire immediately.
	React.useEffect(() => {
		const supported = detectWakeLockSupport();
		setIsSupported(supported);
		if (!supported) return;
		const stored = readStoredPreference(storageKey);
		setIsEnabled(stored);
		isEnabledRef.current = stored;
		if (stored) {
			void acquireInternal();
		}
	}, [acquireInternal, storageKey]);

	// Re-acquire on visibility change while the user wants the lock on.
	React.useEffect(() => {
		if (!isSupported) return;
		if (typeof document === "undefined") return;
		const handler = () => {
			if (document.visibilityState === "visible" && isEnabledRef.current) {
				void acquireInternal();
			}
		};
		document.addEventListener("visibilitychange", handler);
		return () => {
			document.removeEventListener("visibilitychange", handler);
		};
	}, [acquireInternal, isSupported]);

	// Release sentinel on unmount.
	React.useEffect(() => {
		return () => {
			void releaseInternal();
		};
	}, [releaseInternal]);

	const enable = React.useCallback(async () => {
		if (!detectWakeLockSupport()) {
			setError("Wake lock is not supported in this browser");
			return;
		}
		setIsEnabled(true);
		isEnabledRef.current = true;
		writeStoredPreference(storageKey, true);
		await acquireInternal();
	}, [acquireInternal, storageKey]);

	const disable = React.useCallback(async () => {
		setIsEnabled(false);
		isEnabledRef.current = false;
		writeStoredPreference(storageKey, false);
		await releaseInternal();
	}, [releaseInternal, storageKey]);

	const toggle = React.useCallback(async () => {
		if (isEnabledRef.current) {
			await disable();
		} else {
			await enable();
		}
	}, [disable, enable]);

	return {
		isSupported,
		isActive,
		isEnabled,
		error,
		enable,
		disable,
		toggle,
	};
}
