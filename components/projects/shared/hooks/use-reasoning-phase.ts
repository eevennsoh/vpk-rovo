"use client";

import { useEffect, useRef, useState } from "react";

export type ReasoningPhase = "preload" | "thinking" | "completed" | "idle";

const THINKING_GRADIENT_COLORS = ["#1868db", "#bf63f3", "#fca700"] as const;
const MS_IN_S = 1000;
const DEFAULT_AUTO_IDLE_DELAY_MS = 3000;
const DEFAULT_MIN_PRELOAD_MS = 0;

interface UseReasoningPhaseOptions {
	isStreaming: boolean;
	hasMessageText: boolean;
	responseKey: string;
	autoIdle?: boolean;
	autoIdleDelayMs?: number;
	minPreloadMs?: number;
	persistedStartTime?: string;
	persistedEndTime?: string;
}

interface UseReasoningPhaseResult {
	phase: ReasoningPhase;
	duration: number | undefined;
}

function getTimestampMs(value: string | undefined): number | null {
	if (typeof value !== "string") {
		return null;
	}

	const timestamp = Date.parse(value);
	return Number.isFinite(timestamp) ? timestamp : null;
}

export function getPersistedReasoningDuration(
	startTime: string | undefined,
	endTime: string | undefined
): number | undefined {
	const startMs = getTimestampMs(startTime);
	const endMs = getTimestampMs(endTime);
	if (startMs === null || endMs === null || endMs < startMs) {
		return undefined;
	}

	return Math.ceil((endMs - startMs) / MS_IN_S);
}

/**
 * Tracks the reasoning lifecycle through four phases:
 * preload → thinking → completed → idle.
 *
 * Uses refs for transition tracking and deferred state updates to satisfy
 * the react-hooks/set-state-in-effect lint rule (no synchronous setState
 * inside effect bodies).
 */
export function useReasoningPhase({
	isStreaming,
	hasMessageText,
	responseKey,
	autoIdle = false,
	autoIdleDelayMs = DEFAULT_AUTO_IDLE_DELAY_MS,
	minPreloadMs = DEFAULT_MIN_PRELOAD_MS,
	persistedStartTime,
	persistedEndTime,
}: Readonly<UseReasoningPhaseOptions>): UseReasoningPhaseResult {
	const persistedStartTimeMs = getTimestampMs(persistedStartTime);
	const persistedDuration = getPersistedReasoningDuration(
		persistedStartTime,
		persistedEndTime
	);
	const startTimeRef = useRef<number | null>(
		isStreaming ? persistedStartTimeMs : null
	);
	const completedDurationRef = useRef<number | undefined>(
		isStreaming ? undefined : persistedDuration
	);
	const isCompletedRef = useRef(
		!isStreaming && persistedDuration !== undefined
	);
	const prevStreamingRef = useRef(false);
	const prevResponseKeyRef = useRef(responseKey);
	const preloadLockedUntilRef = useRef<number>(0);

	// Single state to trigger re-renders after ref mutations
	const [, setTick] = useState(0);
	const bumpTick = () => setTick((t) => t + 1);

	// Track transitions and schedule re-renders
	useEffect(() => {
		const isNewResponse = prevResponseKeyRef.current !== responseKey;
		prevResponseKeyRef.current = responseKey;

		if (isNewResponse) {
			startTimeRef.current = isStreaming
				? (persistedStartTimeMs ?? Date.now())
				: null;
			completedDurationRef.current = isStreaming ? undefined : persistedDuration;
			isCompletedRef.current = !isStreaming && persistedDuration !== undefined;
			preloadLockedUntilRef.current = isStreaming && minPreloadMs > 0
				? Date.now() + minPreloadMs
				: 0;
			prevStreamingRef.current = isStreaming;
			const id = setTimeout(bumpTick, 0);
			return () => clearTimeout(id);
		}

		const wasStreaming = prevStreamingRef.current;
		prevStreamingRef.current = isStreaming;

		if (isStreaming && !wasStreaming) {
			startTimeRef.current = persistedStartTimeMs ?? Date.now();
			completedDurationRef.current = undefined;
			isCompletedRef.current = false;
			preloadLockedUntilRef.current = minPreloadMs > 0
				? Date.now() + minPreloadMs
				: 0;
			const id = setTimeout(bumpTick, 0);
			return () => clearTimeout(id);
		}

		if (!isStreaming && wasStreaming) {
			const start = startTimeRef.current;
			if (start !== null) {
				completedDurationRef.current = Math.ceil(
					(Date.now() - start) / MS_IN_S
				);
				startTimeRef.current = null;
			}
			isCompletedRef.current = true;
			const id = setTimeout(bumpTick, 0);
			return () => clearTimeout(id);
		}

		if (
			!isStreaming &&
			persistedDuration !== undefined &&
			(
				completedDurationRef.current !== persistedDuration ||
				!isCompletedRef.current
			)
		) {
			completedDurationRef.current = persistedDuration;
			isCompletedRef.current = true;
			startTimeRef.current = null;
			const id = setTimeout(bumpTick, 0);
			return () => clearTimeout(id);
		}

		return undefined;
	}, [
		isStreaming,
		minPreloadMs,
		persistedDuration,
		persistedStartTimeMs,
		responseKey,
	]);

	// Auto-idle: dismiss completed display after a delay
	useEffect(() => {
		if (!isCompletedRef.current || !autoIdle) return;

		const timer = setTimeout(() => {
			isCompletedRef.current = false;
			bumpTick();
		}, autoIdleDelayMs);

		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps -- re-run when phase changes via tick
	}, [isCompletedRef.current, autoIdle, autoIdleDelayMs]);

	// Minimum preload: schedule re-render when the lock expires
	useEffect(() => {
		if (minPreloadMs <= 0) return;

		const remaining = preloadLockedUntilRef.current - Date.now();
		if (remaining <= 0) return;

		const timer = setTimeout(bumpTick, remaining);
		return () => clearTimeout(timer);
	}, [isStreaming, hasMessageText, minPreloadMs]);

	const isPreloadLocked = Date.now() < preloadLockedUntilRef.current;
	let phase: ReasoningPhase;
	if (isPreloadLocked) {
		phase = "preload";
	} else if (isStreaming) {
		phase = hasMessageText ? "thinking" : "preload";
	} else if (isCompletedRef.current) {
		phase = "completed";
	} else {
		phase = "idle";
	}

	return { phase, duration: completedDurationRef.current };
}

export interface ReasoningPhaseProps {
	isStreaming: boolean;
	streamingWave: boolean;
	streamingWaveGradientColor: readonly string[] | undefined;
	animatedDots: boolean;
	duration: number | undefined;
	defaultOpen: boolean | undefined;
	triggerStreaming: boolean | undefined;
}

export function getReasoningPropsForPhase(
	phase: ReasoningPhase,
	duration: number | undefined,
	hasDetails: boolean
): ReasoningPhaseProps {
	switch (phase) {
		case "preload":
			return {
				isStreaming: true,
				streamingWave: true,
				streamingWaveGradientColor: THINKING_GRADIENT_COLORS,
				animatedDots: false,
				duration: undefined,
				defaultOpen: hasDetails ? true : undefined,
				triggerStreaming: undefined,
			};
		case "thinking":
			// Thinking variant contract: calm trigger icon + animated dots.
			// Keep shimmer disabled here (preload-only).
			return {
				isStreaming: true,
				streamingWave: false,
				streamingWaveGradientColor: undefined,
				animatedDots: true,
				duration: undefined,
				defaultOpen: hasDetails ? true : undefined,
				triggerStreaming: true,
			};
		case "completed":
			return {
				isStreaming: false,
				streamingWave: false,
				streamingWaveGradientColor: undefined,
				animatedDots: false,
				duration,
				defaultOpen: false,
				triggerStreaming: undefined,
			};
		case "idle":
			return {
				isStreaming: false,
				streamingWave: false,
				streamingWaveGradientColor: undefined,
				animatedDots: false,
				duration: undefined,
				defaultOpen: undefined,
				triggerStreaming: undefined,
			};
	}
}
