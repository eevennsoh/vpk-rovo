import type { WaveformConfig } from "../smooth-gradient-waveform";

export type SharedWaveformMotionParams = Pick<
	WaveformConfig,
	| "aiColor1"
	| "aiColor2"
	| "aiColor3"
	| "aiColor4"
	| "idleBaseAmplitude"
	| "idleBaseNoiseAmount"
	| "idleCenterSignalMul"
	| "idleCenterY"
	| "idleColor1"
	| "idleColor2"
	| "idleColor3"
	| "idleColor4"
	| "idleLiftAmount"
	| "idleNoiseGlowAmount"
	| "idleNoiseGlowFreqX"
	| "idleNoiseGlowFreqY"
	| "idleNoiseGlowSpeed"
	| "idleThicknessSignalMul"
	| "idleWarpAmount"
	| "idleWarpFreq"
	| "idleWarpSpeed"
	| "motionSpeedAi"
	| "motionSpeedIdle"
	| "motionSpeedUser"
	| "noiseGlowAmount"
	| "noiseGlowFreqX"
	| "noiseGlowFreqY"
	| "noiseGlowSpeed"
	| "signalDecay"
	| "signalFallMul"
	| "signalRiseMul"
	| "signalSmoothRate"
	| "thicknessActive"
	| "thicknessIdle"
	| "thicknessSignalMul"
	| "timeSpeedActive"
	| "timeSpeedIdle"
	| "userColor1"
	| "userColor2"
	| "userColor3"
	| "userColor4"
	| "warpAmount"
	| "warpFreq"
	| "warpSpeed"
>;

export function buildSharedWaveformMotionParams(
	input: SharedWaveformMotionParams,
): SharedWaveformMotionParams {
	return { ...input };
}

export function buildOrganicWaveformConfig(input: {
	activeFadeRate: number;
	colorLerpRate: number;
	disappearFadeRate: number;
	edgeFadeLeft: number;
	edgeFadeRight: number;
	sharedMotionParams: SharedWaveformMotionParams;
	stateModeLerpRate: number;
	thicknessActive: number;
	thicknessSignalMul: number;
	waveformHeightScale: number;
	waveformWidthPercent: number;
}): WaveformConfig {
	return {
		...input.sharedMotionParams,
		colorLerpRate: input.colorLerpRate,
		stateModeLerpRate: input.stateModeLerpRate,
		activeFadeRate: input.activeFadeRate,
		disappearFadeRate: input.disappearFadeRate,
		waveformWidthPercent: input.waveformWidthPercent,
		waveformHeightScale: input.waveformHeightScale,
		edgeFadeLeft: input.edgeFadeLeft,
		edgeFadeRight: input.edgeFadeRight,
		thicknessActive: input.thicknessActive,
		thicknessSignalMul: input.thicknessSignalMul,
	};
}
