"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RovoAppThread } from "@/lib/rovo-app-types";
import {
	deleteRovoAppThread,
	listRovoAppThreads,
} from "@/components/projects/studio/lib/api";

function serializeRovoAppThreads(threads: ReadonlyArray<RovoAppThread>): string {
	return JSON.stringify(threads);
}

export interface UseRovoAppThreadListResult {
	deleteThread: (threadId: string) => Promise<void>;
	refreshThreads: () => Promise<void>;
	threads: RovoAppThread[];
	threadsLoaded: boolean;
}

export function useRovoAppThreadList(): UseRovoAppThreadListResult {
	const [threads, setThreads] = useState<RovoAppThread[]>([]);
	const [threadsLoaded, setThreadsLoaded] = useState(false);
	const mountedRef = useRef(true);
	const lastSerializedRef = useRef<string>("");

	const refreshThreads = useCallback(async () => {
		try {
			const result = await listRovoAppThreads();
			if (mountedRef.current) {
				const nextSerialized = serializeRovoAppThreads(result);
				if (nextSerialized !== lastSerializedRef.current) {
					lastSerializedRef.current = nextSerialized;
					setThreads(result);
				}
				setThreadsLoaded(true);
			}
		} catch {
			if (mountedRef.current) {
				setThreadsLoaded(true);
			}
		}
	}, []);

	useEffect(() => {
		mountedRef.current = true;
		const initialRefreshId = window.setTimeout(() => {
			void refreshThreads();
		}, 0);

		const handleFocus = () => {
			void refreshThreads();
		};
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void refreshThreads();
			}
		};

		window.addEventListener("focus", handleFocus);
		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			mountedRef.current = false;
			window.clearTimeout(initialRefreshId);
			window.removeEventListener("focus", handleFocus);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [refreshThreads]);

	const deleteThread = useCallback(async (threadId: string) => {
		setThreads((prev) => {
			const nextThreads = prev.filter((t) => t.id !== threadId);
			lastSerializedRef.current = serializeRovoAppThreads(nextThreads);
			return nextThreads;
		});
		try {
			await deleteRovoAppThread(threadId);
		} catch {
			// Optimistic removal — don't restore on failure
		}
	}, []);

	return { deleteThread, refreshThreads, threads, threadsLoaded };
}
