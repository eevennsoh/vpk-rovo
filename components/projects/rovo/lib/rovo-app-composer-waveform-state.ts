export function resolveRovoAppComposerWaveformState({
	hasMicStream,
	isIntroActive,
	realtimeVoiceActive,
}: {
	hasMicStream: boolean;
	isIntroActive: boolean;
	realtimeVoiceActive: boolean;
}) {
	if (!realtimeVoiceActive) {
		return {
			active: false,
			processing: false,
		};
	}

	return {
		active: hasMicStream && !isIntroActive,
		processing: !hasMicStream || isIntroActive,
	};
}
