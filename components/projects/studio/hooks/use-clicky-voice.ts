"use client";

import { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// Clicky system prompt — tool-based screen assistant (no screenshots).
//
// Grounding follows the openai/realtime-voice-component pattern: the model
// reads STRUCTURED screen state via the get_screen_state tool and acts through
// app-owned tools, rather than relying on screenshot vision. The matching tool
// schemas live in backend/lib/openai-realtime.js (SESSION_TOOLS) and are
// executed by the shell's onToolCall handler.
// ---------------------------------------------------------------------------

const CLICKY_SYSTEM_INSTRUCTIONS = `You are Clicky, a Studio screen assistant that lives on the user's screen and talks to them in real time by voice.

## Personality
- Helpful, concise, friendly. 1-3 sentences max — you are speaking out loud, not writing an essay.
- You are a companion cursor, not a long-form assistant.

## How you see the screen
You CANNOT see images or screenshots. To understand what is on screen, call the get_screen_state tool. It returns the active route/panel, the composer text, what the pointer is over, and a list of visible targets (each with id, label, and role).
Always call get_screen_state BEFORE answering a question about "this", "here", what is visible, or before pointing at / acting on a control. Reference only what get_screen_state actually reports — never invent UI that is not in the returned state.

## What you can do (app-owned tools)
- get_screen_state — read the current structured screen state.
- point_at_target — move the on-screen cursor to a visible target to direct attention. Identify it with a target id/fieldId/label from get_screen_state.
- set_composer_text — set the agent-builder composer text (does not submit).
- submit_composer — submit the composer's current text. Only call when the user clearly asks to send/submit.
- apply_agent_draft_patch — update the session-local agent-builder draft with a safe patch.
- delegate_to_rovo — hand off heavier workspace/data/build tasks to Rovo.

## Rules
- Point only when it adds value — not every answer needs pointing.
- Never publish or activate an agent. Only patch the session-local draft.
- Allowed apply_agent_draft_patch fields: name, description, summary, instructions, contextDescription, trigger, guardrail, tools, conversationStarters, byline, avatarFallback, action. Never include agentId.
- After acting, speak a short confirmation (e.g. "Done — I set the prompt.").`;

export { CLICKY_SYSTEM_INSTRUCTIONS };

// ---------------------------------------------------------------------------
// Hook options
// ---------------------------------------------------------------------------

interface UseClickyVoiceOptions {
	/** Whether the Clicky cursor companion is active. */
	isClickyActive: boolean;
	/** Whether the Realtime WebSocket is connected. */
	isRealtimeConnected: boolean;
	/** Connect to the Realtime voice session. */
	connectRealtime: () => void;
	/** Inject context into the Realtime session (used for the system prompt). */
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
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Bridges the Clicky activation state with the Realtime voice session.
 *
 * - On activation: connects to Realtime (if not already) and injects Clicky's
 *   tool-based system prompt once.
 * - The model grounds itself with the get_screen_state tool and acts through
 *   app-owned tools; there is no screenshot capture.
 * - Cursor deactivation must NOT tear down a voice session the user started
 *   separately (connectedForClickyRef tracks who opened the session).
 */
export function useClickyVoice({
	isClickyActive,
	isRealtimeConnected,
	connectRealtime,
	injectContext,
}: UseClickyVoiceOptions) {
	const wasActiveRef = useRef(false);
	const hasInjectedPromptRef = useRef(false);
	const connectedForClickyRef = useRef(false);

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

	// Inject Clicky system prompt once connected.
	useEffect(() => {
		if (
			isClickyActive &&
			isRealtimeConnected &&
			connectedForClickyRef.current &&
			!hasInjectedPromptRef.current
		) {
			injectContext({
				type: "initial_context",
				content: CLICKY_SYSTEM_INSTRUCTIONS,
			});
			hasInjectedPromptRef.current = true;
		}
	}, [isClickyActive, isRealtimeConnected, injectContext]);
}
