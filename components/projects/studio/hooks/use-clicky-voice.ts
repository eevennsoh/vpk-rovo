"use client";

import { useCallback, useEffect, useRef } from "react";
import type { ClickyState } from "./use-clicky";
import { captureViewport } from "@/components/projects/studio/lib/clicky-screen-capture";
import type { StudioScreenAssistantSnapshot } from "@/components/projects/studio/lib/studio-screen-assistant";

// ---------------------------------------------------------------------------
// Clicky system prompt — adapted for the web context.
// ---------------------------------------------------------------------------

const CLICKY_SYSTEM_INSTRUCTIONS = `You are Clicky, a Studio screen assistant that lives on the user's screen. You can see the Studio browser surface through screenshots and talk to the user in real time.

## Your personality
- Helpful, concise, and friendly
- Keep responses SHORT — 1-3 sentences max since you're speaking out loud
- You're a companion cursor, not a long-form assistant

## What you can do
- See the user's screen via screenshots sent with each message
- Point at specific elements on screen
- Answer questions about what's visible on screen
- Help navigate UI, explain elements, identify issues
- Help fill the visible Studio agent builder form by returning a safe draft patch

## Response format
Return exactly one JSON object, without markdown fences, with these fields:
- text: the short spoken response, 1-3 sentences
- point: optional { "x": number, "y": number, "label": string } in screenshot pixels
- target: optional { "id": string, "fieldId": string, "label": string } when one of the provided visible targets matches
- agentDraftPatch: optional object for session-local agent builder updates

The screenshot images are labeled with their pixel dimensions. Use those dimensions as the coordinate space.
Origin (0,0) is the top-left corner. x increases rightward, y increases downward.

Only point when it adds value — not every response needs pointing.
If pointing wouldn't help, omit point.
Use target.id or target.fieldId when the provided target hints identify the UI more reliably than pixels.

Examples:
- { "text": "The Publish button is in the top-right of the agent panel.", "target": { "id": "studio-agent-config-publish", "label": "Publish" } }
- { "text": "I filled in the instructions with a focused support-agent brief.", "target": { "fieldId": "instructions", "label": "Instructions" }, "agentDraftPatch": { "instructions": "Help support teams triage requests, summarize context, and recommend next steps." } }
- { "text": "That control starts the live voice assistant." }

## Rules
- Be concise — you're speaking out loud, not writing an essay
- Reference what you SEE on screen, not what you assume
- If you can't see something clearly, say so
- Don't hallucinate UI elements that aren't in the screenshot
- When pointing, be precise — aim for the center of the element you're referencing
- For form fill, return at most one agentDraftPatch per user turn
- Never publish or activate an agent. Only suggest or patch the session-local draft.
- Allowed agentDraftPatch fields: name, description, summary, instructions, contextDescription, trigger, guardrail, tools, conversationStarters, byline, avatarFallback, action. Never return agentId.`;

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
		screenAssistant?: StudioScreenAssistantSnapshot & {
			turnId: string;
		};
	}) => void;
	/** Whether the Realtime WebSocket is connected. */
	isRealtimeConnected: boolean;
	/** Connect to the Realtime voice session. */
	connectRealtime: () => void;
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
	/** Captures Studio DOM/app context to send alongside the screenshot. */
	getScreenAssistantSnapshot?: () => StudioScreenAssistantSnapshot;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Bridges the Clicky state machine with the Realtime voice system.
 *
 * - On activation: connects to Realtime, injects Clicky's system prompt
 * - On speech end (processing state): captures screenshot, sends as image
 * - On deactivation: stops visual capture/pointing without tearing down voice
 */
export function useClickyVoice({
	clickyState,
	isClickyActive,
	sendImageInput,
	isRealtimeConnected,
	connectRealtime,
	injectContext,
	onScreenshotCaptured,
	getScreenAssistantSnapshot,
}: UseClickyVoiceOptions) {
	const wasActiveRef = useRef(false);
	const hasInjectedPromptRef = useRef(false);
	const connectedForClickyRef = useRef(false);
	const turnCounterRef = useRef(0);

	// Connect Realtime when Clicky activates. Cursor deactivation must not stop
	// a voice session the user started separately.
	useEffect(() => {
		if (isClickyActive && !wasActiveRef.current) {
			wasActiveRef.current = true;
			hasInjectedPromptRef.current = false;
			if (!isRealtimeConnected) {
				connectedForClickyRef.current = true;
				connectRealtime();
			} else {
				connectedForClickyRef.current = false;
			}
		} else if (!isClickyActive && wasActiveRef.current) {
			wasActiveRef.current = false;
			hasInjectedPromptRef.current = false;
			connectedForClickyRef.current = false;
		}
	}, [isClickyActive, isRealtimeConnected, connectRealtime]);

	// Inject Clicky system prompt once connected
	useEffect(() => {
		if (isClickyActive && isRealtimeConnected && connectedForClickyRef.current && !hasInjectedPromptRef.current) {
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
		const turnId = `screen-assistant-${Date.now()}-${turnCounterRef.current++}`;
		const screenAssistant = getScreenAssistantSnapshot?.();

		sendImageInput({
			image: result.base64,
			text: [
				`Screenshot of the current Studio page (image dimensions: ${result.width}x${result.height} pixels).`,
				"Use screenshot pixels for point.x and point.y.",
				screenAssistant
					? `Studio screen assistant context JSON: ${JSON.stringify(screenAssistant)}`
					: "",
			].filter(Boolean).join("\n\n"),
			detail: "auto",
			clicky: true,
			systemPrompt: CLICKY_SYSTEM_INSTRUCTIONS,
			...(screenAssistant ? { screenAssistant: { ...screenAssistant, turnId } } : {}),
		});
	}, [sendImageInput, onScreenshotCaptured, getScreenAssistantSnapshot]);

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
