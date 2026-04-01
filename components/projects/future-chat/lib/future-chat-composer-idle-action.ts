export type FutureChatComposerIdleAction =
	| "background-stop"
	| "none"
	| "submit"
	| "voice-start";

export function resolveFutureChatComposerIdleAction(input: {
	canSubmit: boolean;
	isComposerBusy: boolean;
	realtimeVoiceActive: boolean;
	showBackgroundStop: boolean;
	submitDisabled: boolean;
	canStartRealtimeVoice: boolean;
}): FutureChatComposerIdleAction {
	if (input.realtimeVoiceActive || input.isComposerBusy) {
		return "none";
	}

	if (input.canSubmit) {
		return "submit";
	}

	if (input.showBackgroundStop) {
		return "background-stop";
	}

	if (input.submitDisabled) {
		return "none";
	}

	if (input.canStartRealtimeVoice) {
		return "voice-start";
	}

	return "none";
}
