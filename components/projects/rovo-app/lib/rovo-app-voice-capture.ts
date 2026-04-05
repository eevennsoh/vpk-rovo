import { collapseWhitespace } from "@/lib/utils";

export interface RovoAppVoiceCaptureAvailabilityInput {
	hasFocus: boolean;
	visibilityState: DocumentVisibilityState;
}

export interface RovoAppVoiceCaptureEventInput {
	captureEpoch: number;
	eventEpoch: number | null;
	isCaptureAvailable: boolean;
}

export interface RovoAppVoiceTranscriptionCompletionInput {
	activeInputCaptureEpoch: number | null;
	captureEpoch?: number;
	isCaptureAvailable?: boolean;
	lastAudioAppendCaptureEpoch?: number | null;
	pausedInputCaptureEpoch: number | null;
}

export interface RovoAppVoiceTurnStartInput {
	activeTurnId: number | null;
	completedTurnId: number | null;
	pendingTranscript: string;
}

export interface RovoAppCompletedVoiceTurnInput {
	activeTurnId: number | null;
	completedTurnId: number | null;
	completedTranscript: string | null;
	transcript: string;
}

export function isRovoAppVoiceCaptureAvailable({
	hasFocus,
	visibilityState,
}: Readonly<RovoAppVoiceCaptureAvailabilityInput>): boolean {
	return hasFocus && visibilityState === "visible";
}

export function shouldProcessRovoAppVoiceCaptureEvent({
	captureEpoch,
	eventEpoch,
	isCaptureAvailable,
}: Readonly<RovoAppVoiceCaptureEventInput>): boolean {
	return isCaptureAvailable && eventEpoch !== null && eventEpoch === captureEpoch;
}

export function resolveRovoAppPausedVoiceCaptureEpoch({
	activeInputCaptureEpoch,
	pausedInputCaptureEpoch,
}: Readonly<RovoAppVoiceTranscriptionCompletionInput>): number | null {
	return activeInputCaptureEpoch ?? pausedInputCaptureEpoch;
}

export function shouldProcessRovoAppVoiceTranscriptionCompletion({
	activeInputCaptureEpoch,
	captureEpoch,
	lastAudioAppendCaptureEpoch,
	pausedInputCaptureEpoch,
}: Readonly<RovoAppVoiceTranscriptionCompletionInput>): boolean {
	return (
		activeInputCaptureEpoch !== null ||
		pausedInputCaptureEpoch !== null ||
		(
			typeof captureEpoch === "number" &&
			lastAudioAppendCaptureEpoch === captureEpoch
		)
	);
}

export function shouldProcessRovoAppVoiceTranscriptionDelta({
	activeInputCaptureEpoch,
	captureEpoch,
	isCaptureAvailable,
	lastAudioAppendCaptureEpoch,
}: Readonly<RovoAppVoiceTranscriptionCompletionInput>): boolean {
	if (!isCaptureAvailable || typeof captureEpoch !== "number") {
		return false;
	}

	return (
		activeInputCaptureEpoch === captureEpoch ||
		lastAudioAppendCaptureEpoch === captureEpoch
	);
}

export function normalizeRovoAppVoiceTranscript(transcript: string): string {
	return collapseWhitespace(transcript);
}

export function shouldStartNewRovoAppVoiceTurn({
	activeTurnId,
	completedTurnId,
	pendingTranscript,
}: Readonly<RovoAppVoiceTurnStartInput>): boolean {
	return (
		activeTurnId === null ||
		(
			completedTurnId !== null &&
			completedTurnId === activeTurnId &&
			pendingTranscript.trim().length === 0
		)
	);
}

export function hasCompletedRovoAppVoiceTurn({
	activeTurnId,
	completedTurnId,
	completedTranscript,
	transcript,
}: Readonly<RovoAppCompletedVoiceTurnInput>): boolean {
	if (
		activeTurnId === null ||
		completedTurnId === null ||
		activeTurnId !== completedTurnId ||
		typeof completedTranscript !== "string"
	) {
		return false;
	}

	return (
		normalizeRovoAppVoiceTranscript(completedTranscript) ===
		normalizeRovoAppVoiceTranscript(transcript)
	);
}
