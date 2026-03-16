const test = require("node:test");
const assert = require("node:assert/strict");

const {
	buildOrganicWaveformConfig,
	buildSharedWaveformMotionParams,
} = require("./waveform-config.ts");

test("buildOrganicWaveformConfig carries shared motion params through to the organic waveform", () => {
	const sharedMotionParams = buildSharedWaveformMotionParams({
		aiColor1: [1, 2, 3, 0.4],
		aiColor2: [5, 6, 7, 0.5],
		aiColor3: [9, 10, 11, 0.6],
		aiColor4: [13, 14, 15, 0.7],
		idleBaseAmplitude: 0.1,
		idleBaseNoiseAmount: 0.2,
		idleCenterSignalMul: 0.3,
		idleCenterY: 0.4,
		idleColor1: [16, 17, 18, 0.8],
		idleColor2: [19, 20, 21, 0.9],
		idleColor3: [22, 23, 24, 1],
		idleColor4: [25, 26, 27, 0.8],
		idleLiftAmount: 0.5,
		idleNoiseGlowAmount: 0.6,
		idleNoiseGlowFreqX: 0.7,
		idleNoiseGlowFreqY: 0.8,
		idleNoiseGlowSpeed: 0.9,
		idleThicknessSignalMul: 1,
		idleWarpAmount: 1.1,
		idleWarpFreq: 1.2,
		idleWarpSpeed: 1.3,
		motionSpeedAi: 1.4,
		motionSpeedIdle: 1.5,
		motionSpeedUser: 1.6,
		noiseGlowAmount: 1.7,
		noiseGlowFreqX: 1.8,
		noiseGlowFreqY: 1.9,
		noiseGlowSpeed: 2,
		signalDecay: 2.1,
		signalFallMul: 2.2,
		signalRiseMul: 2.3,
		signalSmoothRate: 2.4,
		thicknessActive: 2.5,
		thicknessIdle: 2.6,
		thicknessSignalMul: 2.7,
		timeSpeedActive: 2.8,
		timeSpeedIdle: 2.9,
		userColor1: [28, 29, 30, 0.7],
		userColor2: [31, 32, 33, 0.6],
		userColor3: [34, 35, 36, 0.5],
		userColor4: [37, 38, 39, 0.4],
		warpAmount: 3,
		warpFreq: 3.1,
		warpSpeed: 3.2,
	});

	const config = buildOrganicWaveformConfig({
		activeFadeRate: 4.1,
		colorLerpRate: 4.2,
		disappearFadeRate: 4.3,
		edgeFadeLeft: 4.4,
		edgeFadeRight: 4.5,
		sharedMotionParams,
		stateModeLerpRate: 4.6,
		thicknessActive: 4.7,
		thicknessSignalMul: 4.8,
		waveformHeightScale: 4.9,
		waveformWidthPercent: 5,
	});

	assert.equal(config.timeSpeedIdle, 2.9);
	assert.equal(config.motionSpeedAi, 1.4);
	assert.deepEqual(config.aiColor4, [13, 14, 15, 0.7]);
	assert.equal(config.waveformWidthPercent, 5);
	assert.equal(config.thicknessSignalMul, 4.8);
});
