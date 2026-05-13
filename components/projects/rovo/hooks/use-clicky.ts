"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ClickyState =
	| "off"
	| "idle"
	| "listening"
	| "processing"
	| "speaking"
	| "pointing";

export interface ClickyPointTarget {
	x: number;
	y: number;
	label: string;
}

export interface ClickyExchange {
	role: "user" | "assistant";
	content: string;
}

export interface ClickyScreenshotDimensions {
	width: number;
	height: number;
}

export interface UseClickyOptions {
	/** Called when Clicky wants to send a message (screenshot + transcript) to the LLM. */
	onSendMessage?: (payload: {
		transcript: string;
		screenshotBase64: string;
		screenshotWidth: number;
		screenshotHeight: number;
		history: ReadonlyArray<ClickyExchange>;
	}) => void;
	/** Called when Clicky state changes. */
	onStateChange?: (state: ClickyState) => void;
}

export interface UseClickyResult {
	state: ClickyState;
	isActive: boolean;
	activate: () => void;
	deactivate: () => void;
	toggle: () => void;
	/** Transition to listening state (user started speaking). */
	startListening: () => void;
	/** Transition to processing state (user stopped speaking). */
	startProcessing: () => void;
	/** Transition to speaking state (LLM response received, no pointing). */
	startSpeaking: (responseText: string) => void;
	/** Transition to pointing state (LLM response with coordinates). */
	startPointing: (target: ClickyPointTarget, responseText: string) => void;
	/** Return to idle after speaking or pointing completes. */
	returnToIdle: () => void;
	/** Current point target (only set during "pointing" state). */
	pointTarget: ClickyPointTarget | null;
	/** Current response text being spoken or shown in bubble. */
	responseText: string | null;
	/** Conversation history (last N exchanges). */
	history: ReadonlyArray<ClickyExchange>;
	/** Add an exchange to history. */
	addExchange: (exchange: ClickyExchange) => void;
	/** Clear history. */
	clearHistory: () => void;
	/** Screenshot dimensions from the last capture (for coordinate scaling). */
	screenshotDimensions: ClickyScreenshotDimensions | null;
	/** Store screenshot dimensions after capture. */
	setScreenshotDimensions: (dims: ClickyScreenshotDimensions) => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_HISTORY_LENGTH = 10;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useClicky({
	onStateChange,
}: UseClickyOptions = {}): UseClickyResult {
	const [state, setState] = useState<ClickyState>("off");
	const [pointTarget, setPointTarget] = useState<ClickyPointTarget | null>(null);
	const [responseText, setResponseText] = useState<string | null>(null);
	const [history, setHistory] = useState<ClickyExchange[]>([]);
	const [screenshotDimensions, setScreenshotDimensionsState] = useState<ClickyScreenshotDimensions | null>(null);

	const stateRef = useRef(state);
	useEffect(() => {
		stateRef.current = state;
	}, [state]);

	const onStateChangeRef = useRef(onStateChange);
	useEffect(() => {
		onStateChangeRef.current = onStateChange;
	}, [onStateChange]);

	// Transition helper — validates transition and updates state
	const transition = useCallback((nextState: ClickyState) => {
		setState((prev) => {
			// "off" can only transition to "idle" (via activate)
			// "any" can transition to "off" (via deactivate)
			if (prev === "off" && nextState !== "idle" && nextState !== "off") {
				return prev;
			}
			return nextState;
		});
	}, []);

	// Notify on state changes
	useEffect(() => {
		onStateChangeRef.current?.(state);
	}, [state]);

	const activate = useCallback(() => {
		if (stateRef.current === "off") {
			transition("idle");
		}
	}, [transition]);

	const deactivate = useCallback(() => {
		setPointTarget(null);
		setResponseText(null);
		setHistory([]);
		setScreenshotDimensionsState(null);
		transition("off");
	}, [transition]);

	const toggle = useCallback(() => {
		if (stateRef.current === "off") {
			activate();
		} else {
			deactivate();
		}
	}, [activate, deactivate]);

	const startListening = useCallback(() => {
		if (stateRef.current === "idle" || stateRef.current === "speaking") {
			transition("listening");
		}
	}, [transition]);

	const startProcessing = useCallback(() => {
		if (stateRef.current === "listening" || stateRef.current === "idle") {
			transition("processing");
		}
	}, [transition]);

	const startSpeaking = useCallback((text: string) => {
		if (stateRef.current === "processing") {
			setResponseText(text);
			transition("speaking");
		}
	}, [transition]);

	const startPointing = useCallback((target: ClickyPointTarget, text: string) => {
		if (stateRef.current === "processing") {
			setPointTarget(target);
			setResponseText(text);
			transition("pointing");
		}
	}, [transition]);

	const returnToIdle = useCallback(() => {
		if (stateRef.current === "speaking" || stateRef.current === "pointing") {
			setPointTarget(null);
			setResponseText(null);
			transition("idle");
		}
	}, [transition]);

	const addExchange = useCallback((exchange: ClickyExchange) => {
		setHistory((prev) => {
			const next = [...prev, exchange];
			if (next.length > MAX_HISTORY_LENGTH) {
				return next.slice(next.length - MAX_HISTORY_LENGTH);
			}
			return next;
		});
	}, []);

	const clearHistory = useCallback(() => {
		setHistory([]);
	}, []);

	const setScreenshotDimensions = useCallback((dims: ClickyScreenshotDimensions) => {
		setScreenshotDimensionsState(dims);
	}, []);

	// Clean up on unmount
	useEffect(() => {
		return () => {
			setPointTarget(null);
			setResponseText(null);
		};
	}, []);

	return {
		state,
		isActive: state !== "off",
		activate,
		deactivate,
		toggle,
		startListening,
		startProcessing,
		startSpeaking,
		startPointing,
		returnToIdle,
		pointTarget,
		responseText,
		history,
		addExchange,
		clearHistory,
		screenshotDimensions,
		setScreenshotDimensions,
	};
}
