import type { RovoAppHermesContext } from "@/lib/rovo-app-types";

export function buildComposerHermesContext(
	selectedSkillIds: ReadonlyArray<string>,
): RovoAppHermesContext | undefined {
	const normalizedSkillIds = Array.from(
		new Set(
			selectedSkillIds
				.map((skillId) => skillId.trim())
				.filter((skillId) => skillId.length > 0),
		),
	);

	if (normalizedSkillIds.length === 0) {
		return undefined;
	}

	return {
		selectedSkillIds: normalizedSkillIds,
	};
}

export function shouldResetComposerHermesSkillSelection(options: {
	previousThreadId: string | null;
	nextThreadId: string | null;
}): boolean {
	return (
		options.previousThreadId !== null
		&& options.previousThreadId !== options.nextThreadId
	);
}
