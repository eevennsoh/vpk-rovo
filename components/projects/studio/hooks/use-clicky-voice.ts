"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ClickyState } from "./use-clicky";
import { captureViewport } from "@/components/projects/studio/lib/clicky-screen-capture";

// ---------------------------------------------------------------------------
// Clicky system prompt — adapted for the web context.
// ---------------------------------------------------------------------------

const CLICKY_SYSTEM_INSTRUCTIONS = `You are Clicky, an AI cursor companion that lives on the user's screen. You can see what the user sees through screenshots and talk to them in real-time.

## Your personality
- Helpful, concise, and friendly
- Keep responses SHORT — 1-3 sentences max since you're speaking out loud
- You're a companion cursor, not a long-form assistant

## What you can do
- See the user's screen via screenshots sent with each message
- Point at specific elements on screen using the POINT tag
- Answer questions about what's visible on screen
- Help navigate UI, explain elements, identify issues

## Pointing at elements
When you want to point at something on screen, append a coordinate tag at the very end of your response, AFTER your spoken text.

The screenshot images are labeled with their pixel dimensions. Use those dimensions as the coordinate space.
Origin (0,0) is the top-left corner. x increases rightward, y increases downward.

FORMAT: [POINT:x,y:label] where x,y are integer pixel coordinates in the screenshot's coordinate space, and label is a short 1-3 word description.

Only point when it adds value — not every response needs pointing.
If pointing wouldn't help, just respond normally without a POINT tag.

Examples:
- "see that submit button right there? click it to save your changes. [POINT:450,320:Submit button]"
- "the error message is right here. [POINT:200,150:Error toast]"
- "html stands for hypertext markup language."

## Rules
- Be concise — you're speaking out loud, not writing an essay
- Reference what you SEE on screen, not what you assume
- If you can't see something clearly, say so
- Don't hallucinate UI elements that aren't in the screenshot
- When pointing, be precise — aim for the center of the element you're referencing`;

export { CLICKY_SYSTEM_INSTRUCTIONS };

// ---------------------------------------------------------------------------
// Hook options
// ---------------------------------------------------------------------------

interface UseClickyVoiceOptions {
	clickyState: ClickyState;
	isClickyActive: boolean;
	/** Send image input to the Realtime session. */
	sendImageInput: (payload: {
		image: string;
		text?: string;
		detail?: "low" | "high" | "auto";
		clicky?: boolean;
		systemPrompt?: string;
	}) => void;
	/** Whether the Realtime WebSocket is connected. */
	isRealtimeConnected: boolean;
	/** Connect to the Realtime voice session. */
	connectRealtime: () => void;
	/** Disconnect from the Realtime voice session. */
	disconnectRealtime: () => void;
	/** Inject context into the Realtime session (used for system prompt swap). */
	injectContext: (data: {
		type:
			| "initial_context"
			| "thread_context"
			| "artifact_complete"
			| "thread_message"
			| "artifact_annotations"
			| "artifact_context"
			| "delegation_error";
		content: string;
	}) => void;
	/** Called after a screenshot is captured, with the screenshot dimensions. */
	onScreenshotCaptured?: (dims: { width: number; height: number }) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Bridges the Clicky state machine with the Realtime voice system.
 *
 * - On activation: connects to Realtime, injects Clicky's system prompt
 * - On speech end (processing state): captures screenshot, sends as image
 * - On deactivation: disconnects Realtime
 */
export function useClickyVoice({
	clickyState,
	isClickyActive,
	sendImageInput,
	isRealtimeConnected,
	connectRealtime,
	disconnectRealtime,
	injectContext,
	onScreenshotCaptured,
}: UseClickyVoiceOptions) {
	const wasActiveRef = useRef(false);
	const hasInjectedPromptRef = useRef(false);

	// Connect/disconnect Realtime when Clicky activates/deactivates
	useEffect(() => {
		if (isClickyActive && !wasActiveRef.current) {
			wasActiveRef.current = true;
			hasInjectedPromptRef.current = false;
			connectRealtime();
		} else if (!isClickyActive && wasActiveRef.current) {
			wasActiveRef.current = false;
			hasInjectedPromptRef.current = false;
			disconnectRealtime();
		}
	}, [isClickyActive, connectRealtime, disconnectRealtime]);

	// Inject Clicky system prompt once connected
	useEffect(() => {
		if (isClickyActive && isRealtimeConnected && !hasInjectedPromptRef.current) {
			injectContext({
				type: "initial_context",
				content: CLICKY_SYSTEM_INSTRUCTIONS,
			});
			hasInjectedPromptRef.current = true;
		}
	}, [isClickyActive, isRealtimeConnected, injectContext]);

	// Capture and send screenshot when entering "processing" state
	const captureAndSend = useCallback(async () => {
		const result = await captureViewport();
		if (!result) return;

		onScreenshotCaptured?.({ width: result.width, height: result.height });

		sendImageInput({
			image: result.base64,
			text: `Screenshot of the current page (image dimensions: ${result.width}x${result.height} pixels). Use these dimensions as the coordinate space for any POINT tags.`,
			detail: "auto",
			clicky: true,
			systemPrompt: CLICKY_SYSTEM_INSTRUCTIONS,
		});
	}, [sendImageInput, onScreenshotCaptured]);

	useEffect(() => {
		if (clickyState === "processing" && isRealtimeConnected) {
			void captureAndSend();
		}
	}, [clickyState, isRealtimeConnected, captureAndSend]);

	// Cleanup on unmount
	useEffect(() => {
		return () => {
			if (wasActiveRef.current) {
				wasActiveRef.current = false;
			}
		};
	}, []);
}
