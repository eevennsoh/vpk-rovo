export interface FutureChatVoiceCaptureAvailabilityInput {
	hasFocus: boolean;
	visibilityState: DocumentVisibilityState;
}

export interface FutureChatVoiceCaptureEventInput {
	captureEpoch: number;
	eventEpoch: number | null;
	isCaptureAvailable: boolean;
}

export interface FutureChatVoiceTranscriptionCompletionInput {
	activeInputCaptureEpoch: number | null;
	captureEpoch?: number;
	isCaptureAvailable?: boolean;
	lastAudioAppendCaptureEpoch?: number | null;
	pausedInputCaptureEpoch: number | null;
}

export interface FutureChatVoiceTurnStartInput {
	activeTurnId: number | null;
	completedTurnId: number | null;
	pendingTranscript: string;
}

export interface FutureChatCompletedVoiceTurnInput {
	activeTurnId: number | null;
	completedTurnId: number | null;
	completedTranscript: string | null;
	transcript: string;
}

export function isFutureChatVoiceCaptureAvailable({
	hasFocus,
	visibilityState,
}: Readonly<FutureChatVoiceCaptureAvailabilityInput>): boolean {
	return hasFocus && visibilityState === "visible";
}

export function shouldProcessFutureChatVoiceCaptureEvent({
	captureEpoch,
	eventEpoch,
	isCaptureAvailable,
}: Readonly<FutureChatVoiceCaptureEventInput>): boolean {
	return isCaptureAvailable && eventEpoch !== null && eventEpoch === captureEpoch;
}

export function resolveFutureChatPausedVoiceCaptureEpoch({
	activeInputCaptureEpoch,
	pausedInputCaptureEpoch,
}: Readonly<FutureChatVoiceTranscriptionCompletionInput>): number | null {
	return activeInputCaptureEpoch ?? pausedInputCaptureEpoch;
}

export function shouldProcessFutureChatVoiceTranscriptionCompletion({
	activeInputCaptureEpoch,
	captureEpoch,
	lastAudioAppendCaptureEpoch,
	pausedInputCaptureEpoch,
}: Readonly<FutureChatVoiceTranscriptionCompletionInput>): boolean {
	return (
		activeInputCaptureEpoch !== null ||
		pausedInputCaptureEpoch !== null ||
		(
			typeof captureEpoch === "number" &&
			lastAudioAppendCaptureEpoch === captureEpoch
		)
	);
}

export function shouldProcessFutureChatVoiceTranscriptionDelta({
	activeInputCaptureEpoch,
	captureEpoch,
	isCaptureAvailable,
	lastAudioAppendCaptureEpoch,
}: Readonly<FutureChatVoiceTranscriptionCompletionInput>): boolean {
	if (!isCaptureAvailable || typeof captureEpoch !== "number") {
		return false;
	}

	return (
		activeInputCaptureEpoch === captureEpoch ||
		lastAudioAppendCaptureEpoch === captureEpoch
	);
}

export function normalizeFutureChatVoiceTranscript(transcript: string): string {
	return transcript.trim().replaceAll(/\s+/gu, " ");
}

export function shouldStartNewFutureChatVoiceTurn({
	activeTurnId,
	completedTurnId,
	pendingTranscript,
}: Readonly<FutureChatVoiceTurnStartInput>): boolean {
	return (
		activeTurnId === null ||
		(
			completedTurnId !== null &&
			completedTurnId === activeTurnId &&
			pendingTranscript.trim().length === 0
		)
	);
}

export function hasCompletedFutureChatVoiceTurn({
	activeTurnId,
	completedTurnId,
	completedTranscript,
	transcript,
}: Readonly<FutureChatCompletedVoiceTurnInput>): boolean {
	if (
		activeTurnId === null ||
		completedTurnId === null ||
		activeTurnId !== completedTurnId ||
		typeof completedTranscript !== "string"
	) {
		return false;
	}

	return (
		normalizeFutureChatVoiceTranscript(completedTranscript) ===
		normalizeFutureChatVoiceTranscript(transcript)
	);
}
