"use client";

import { createContext, use, useCallback, useMemo, useState, type ReactNode } from "react";

export type CreationMode = "skill" | "agent" | null;

interface CreationModeState {
	mode: CreationMode;
}

interface CreationModeActions {
	setSkillCreationMode: () => void;
	setAgentCreationMode: () => void;
	clearCreationMode: () => void;
}

const StateContext = createContext<CreationModeState>({ mode: null });
const ActionsContext = createContext<CreationModeActions>({
	setSkillCreationMode: () => {},
	setAgentCreationMode: () => {},
	clearCreationMode: () => {},
});

export function CreationModeProvider({ children }: { children: ReactNode }) {
	const [mode, setMode] = useState<CreationMode>(null);

	const setSkillCreationMode = useCallback(() => setMode("skill"), []);
	const setAgentCreationMode = useCallback(() => setMode("agent"), []);
	const clearCreationMode = useCallback(() => setMode(null), []);

	const state = useMemo<CreationModeState>(() => ({ mode }), [mode]);
	const actions = useMemo<CreationModeActions>(
		() => ({ setSkillCreationMode, setAgentCreationMode, clearCreationMode }),
		[setSkillCreationMode, setAgentCreationMode, clearCreationMode],
	);

	return (
		<StateContext value={state}>
			<ActionsContext value={actions}>{children}</ActionsContext>
		</StateContext>
	);
}

export function useCreationModeState(): CreationModeState {
	return use(StateContext);
}

export function useCreationModeActions(): CreationModeActions {
	return use(ActionsContext);
}
