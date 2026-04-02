"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	activateBrowserWorkspaceTab,
	closeBrowserWorkspaceTab,
	createBrowserWorkspace,
	createBrowserWorkspaceTab,
	deleteBrowserWorkspace,
	getBrowserWorkspaceSnapshot,
	getBrowserWorkspaceState,
	type BrowserWorkspaceMutationAction,
	type BrowserWorkspaceSnapshotPayload,
	type BrowserWorkspaceState,
	mutateBrowserWorkspace,
} from "@/lib/browser-workspace-client";
import { recoverMissingBrowserWorkspace } from "./browser-workspace-recovery";

const WORKSPACE_POLL_INTERVAL_MS = 10_000;

function toErrorMessage(error: unknown, fallbackMessage: string) {
	return error instanceof Error && error.message ? error.message : fallbackMessage
}

export interface UseBrowserWorkspaceResult {
	workspaceId: string | null;
	workspaceState: BrowserWorkspaceState | null;
	workspaceError: string | null;
	isWorkspaceInitializing: boolean;
	isWorkspaceMutating: boolean;
	refreshWorkspace: () => Promise<BrowserWorkspaceState | null>;
	resetWorkspace: () => Promise<BrowserWorkspaceState | null>;
	runWorkspaceAction: (
		action: BrowserWorkspaceMutationAction,
		body?: Record<string, unknown>,
		options?: { suppressMutating?: boolean },
	) => Promise<BrowserWorkspaceState | null>;
	createWorkspaceTab: (url?: string) => Promise<BrowserWorkspaceState | null>;
	activateWorkspaceTab: (tabIndex: number) => Promise<BrowserWorkspaceState | null>;
	closeWorkspaceTab: (tabIndex: number) => Promise<BrowserWorkspaceState | null>;
	fetchWorkspaceSnapshot: (
		interactive?: boolean,
	) => Promise<BrowserWorkspaceSnapshotPayload | null>;
}

export function useBrowserWorkspace(
	defaultUrl = "about:blank",
): UseBrowserWorkspaceResult {
	const mountedRef = useRef(false)
	const activeWorkspaceIdRef = useRef<string | null>(null)
	const creationTokenRef = useRef(0)

	const [workspaceId, setWorkspaceId] = useState<string | null>(null)
	const [workspaceState, setWorkspaceState] =
		useState<BrowserWorkspaceState | null>(null)
	const [workspaceError, setWorkspaceError] = useState<string | null>(null)
	const [isWorkspaceInitializing, setIsWorkspaceInitializing] = useState(true)
	const [isWorkspaceMutating, setIsWorkspaceMutating] = useState(false)

	const applyWorkspaceState = useCallback((nextState: BrowserWorkspaceState) => {
		if (!mountedRef.current) {
			return
		}

		activeWorkspaceIdRef.current = nextState.workspaceId
		setWorkspaceId(nextState.workspaceId)
		setWorkspaceState(nextState)
		setWorkspaceError(null)
		setIsWorkspaceInitializing(false)
	}, [])

	const destroyWorkspace = useCallback(async (workspaceIdToDelete: string | null) => {
		if (!workspaceIdToDelete) {
			return
		}

		try {
			await deleteBrowserWorkspace(workspaceIdToDelete)
		} catch {
			// Ignore cleanup failures for ephemeral workspaces.
		}
	}, [])

	const createAndBindWorkspace = useCallback(
		async (options?: { previousWorkspaceId?: string | null }) => {
			const previousWorkspaceId = options?.previousWorkspaceId ?? null
			const token = creationTokenRef.current + 1
			creationTokenRef.current = token

			if (mountedRef.current) {
				setIsWorkspaceInitializing(true)
				setWorkspaceError(null)
			}

			try {
				const nextState = await createBrowserWorkspace(defaultUrl)
				if (!mountedRef.current || token !== creationTokenRef.current) {
					await destroyWorkspace(nextState.workspaceId)
					return null
				}

				applyWorkspaceState(nextState)
				if (
					previousWorkspaceId &&
					previousWorkspaceId !== nextState.workspaceId
				) {
					void destroyWorkspace(previousWorkspaceId)
				}

				return nextState
			} catch (error) {
				if (mountedRef.current && token === creationTokenRef.current) {
					setWorkspaceError(
						toErrorMessage(error, "Failed to create browser workspace."),
					)
					setIsWorkspaceInitializing(false)
				}

				return null
			}
		},
		[applyWorkspaceState, defaultUrl, destroyWorkspace],
	)

	const refreshWorkspace = useCallback(async () => {
		const currentWorkspaceId = activeWorkspaceIdRef.current
		if (!currentWorkspaceId) {
			return null
		}

		try {
			const nextState = await getBrowserWorkspaceState(currentWorkspaceId)
			if (
				mountedRef.current &&
				activeWorkspaceIdRef.current === currentWorkspaceId
			) {
				applyWorkspaceState(nextState)
			}
			return nextState
		} catch (error) {
			const recoveredState = await recoverMissingBrowserWorkspace({
				error,
				currentWorkspaceId,
				recreateWorkspace: createAndBindWorkspace,
			})
			if (recoveredState) {
				return recoveredState
			}

			if (
				mountedRef.current &&
				activeWorkspaceIdRef.current === currentWorkspaceId
			) {
				setWorkspaceError(
					toErrorMessage(error, "Failed to refresh browser workspace."),
				)
			}
			return null
		}
	}, [applyWorkspaceState, createAndBindWorkspace])

	const runGuardedMutation = useCallback(
		async <T extends BrowserWorkspaceState>(
			apiFn: (workspaceId: string) => Promise<T>,
			errorFallback: string,
			options?: { suppressMutating?: boolean },
		): Promise<T | null> => {
			const currentWorkspaceId = activeWorkspaceIdRef.current
			if (!currentWorkspaceId) {
				return null
			}

			const shouldTrackMutation = options?.suppressMutating !== true
			let recoveredMissingWorkspace = false
			if (shouldTrackMutation) {
				setIsWorkspaceMutating(true)
			}
			try {
				const nextState = await apiFn(currentWorkspaceId)
				if (
					mountedRef.current &&
					activeWorkspaceIdRef.current === currentWorkspaceId
				) {
					applyWorkspaceState(nextState)
				}
				return nextState
			} catch (error) {
				const recoveredState = await recoverMissingBrowserWorkspace({
					error,
					currentWorkspaceId,
					recreateWorkspace: createAndBindWorkspace,
				})
				if (recoveredState) {
					recoveredMissingWorkspace = true
					return recoveredState as T
				}

				if (
					mountedRef.current &&
					activeWorkspaceIdRef.current === currentWorkspaceId
				) {
					setWorkspaceError(toErrorMessage(error, errorFallback))
				}
				return null
			} finally {
				if (
					shouldTrackMutation &&
					mountedRef.current &&
					(
						activeWorkspaceIdRef.current === currentWorkspaceId ||
						recoveredMissingWorkspace
					)
				) {
					setIsWorkspaceMutating(false)
				}
			}
		},
		[applyWorkspaceState, createAndBindWorkspace],
	)

	const runWorkspaceAction = useCallback(
		(
			action: BrowserWorkspaceMutationAction,
			body?: Record<string, unknown>,
			options?: { suppressMutating?: boolean },
		) =>
			runGuardedMutation(
				(id) => mutateBrowserWorkspace(id, action, body),
				"Failed to update browser workspace.",
				options,
			),
		[runGuardedMutation],
	)

	const createWorkspaceTabAction = useCallback(
		(url?: string) =>
			runGuardedMutation(
				(id) => createBrowserWorkspaceTab(id, url),
				"Failed to create a browser tab.",
			),
		[runGuardedMutation],
	)

	const activateWorkspaceTabAction = useCallback(
		(tabIndex: number) =>
			runGuardedMutation(
				(id) => activateBrowserWorkspaceTab(id, tabIndex),
				"Failed to activate the browser tab.",
			),
		[runGuardedMutation],
	)

	const closeWorkspaceTabAction = useCallback(
		(tabIndex: number) =>
			runGuardedMutation(
				(id) => closeBrowserWorkspaceTab(id, tabIndex),
				"Failed to close the browser tab.",
			),
		[runGuardedMutation],
	)

	const fetchWorkspaceSnapshot = useCallback(
		async (interactive = true) => {
			const currentWorkspaceId = activeWorkspaceIdRef.current
			if (!currentWorkspaceId) {
				return null
			}

			try {
				const snapshot = await getBrowserWorkspaceSnapshot(
					currentWorkspaceId,
					interactive,
				)
				if (
					mountedRef.current &&
					activeWorkspaceIdRef.current === currentWorkspaceId
				) {
					applyWorkspaceState(snapshot.state)
				}
				return snapshot
			} catch (error) {
				const recoveredState = await recoverMissingBrowserWorkspace({
					error,
					currentWorkspaceId,
					recreateWorkspace: createAndBindWorkspace,
				})
				if (recoveredState) {
					return null
				}

				if (
					mountedRef.current &&
					activeWorkspaceIdRef.current === currentWorkspaceId
				) {
					setWorkspaceError(
						toErrorMessage(error, "Failed to capture a browser snapshot."),
					)
				}
				return null
			}
		},
		[applyWorkspaceState, createAndBindWorkspace],
	)

	const resetWorkspace = useCallback(async () => {
		return createAndBindWorkspace({
			previousWorkspaceId: activeWorkspaceIdRef.current,
		})
	}, [createAndBindWorkspace])

	useEffect(() => {
		mountedRef.current = true
		void createAndBindWorkspace()

		return () => {
			mountedRef.current = false
			creationTokenRef.current += 1
			const workspaceIdToDelete = activeWorkspaceIdRef.current
			activeWorkspaceIdRef.current = null
			void destroyWorkspace(workspaceIdToDelete)
		}
	}, [createAndBindWorkspace, destroyWorkspace])

	useEffect(() => {
		if (!workspaceId) {
			return
		}

		const refreshIfVisible = () => {
			if (document.visibilityState !== "visible") {
				return
			}

			void refreshWorkspace()
		}

		const intervalId = window.setInterval(() => {
			refreshIfVisible()
		}, WORKSPACE_POLL_INTERVAL_MS)
		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				void refreshWorkspace()
			}
		}
		document.addEventListener("visibilitychange", handleVisibilityChange)

		return () => {
			window.clearInterval(intervalId)
			document.removeEventListener("visibilitychange", handleVisibilityChange)
		}
	}, [refreshWorkspace, workspaceId])

	return useMemo(
		() => ({
			workspaceId,
			workspaceState,
			workspaceError,
			isWorkspaceInitializing,
			isWorkspaceMutating,
			refreshWorkspace,
			resetWorkspace,
			runWorkspaceAction,
			createWorkspaceTab: createWorkspaceTabAction,
			activateWorkspaceTab: activateWorkspaceTabAction,
			closeWorkspaceTab: closeWorkspaceTabAction,
			fetchWorkspaceSnapshot,
		}),
		[
			activateWorkspaceTabAction,
			closeWorkspaceTabAction,
			createWorkspaceTabAction,
			fetchWorkspaceSnapshot,
			isWorkspaceInitializing,
			isWorkspaceMutating,
			refreshWorkspace,
			resetWorkspace,
			runWorkspaceAction,
			workspaceError,
			workspaceId,
			workspaceState,
		],
	)
}
