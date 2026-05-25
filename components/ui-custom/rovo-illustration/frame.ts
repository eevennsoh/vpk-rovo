import {
	ILLUS_ELEMENTS,
	ILLUS_HAND_DRAWN,
	ILLUS_MOTION,
	ILLUS_ROTATE_GROUP,
	ILLUS_ENTER_DURATION,
	ILLUS_HOLD_DURATION,
	ILLUS_EXIT_DURATION,
	ILLUS_ENTER_Y_OFFSET,
	ILLUS_EXIT_Y_OFFSET,
	easeOutCubic,
	easeInCubic,
	easeOutQuart,
	easeInQuart,
	lerp,
} from "./spot-illustration";

export const TOTAL_DURATION = ILLUS_ENTER_DURATION + ILLUS_HOLD_DURATION + ILLUS_EXIT_DURATION;
const ENTER_END = ILLUS_ENTER_DURATION;
const HOLD_END = ILLUS_ENTER_DURATION + ILLUS_HOLD_DURATION;

interface FrameState {
  opacity: number;
  tx: number;
  ty: number;
  scale: number;
  containerRotation: number;
  gestureOpacity: number;
  greyOpacity: number;
  greyTX: number;
  greyTY: number;
  mosaicLayerOpacity: number;
  mosaicTX: number;
  mosaicTY: number;
  mosaicScale: number;
  overlapOpacity: number;
  overlapScale: number;
  overlapTX: number;
  overlapTY: number;
  greyClipTX: number;
  greyClipTY: number;
  greyClipScale: number;
  telescopeAngle: number;
  mosaicRotation: number;
  gestureGroupOpacities: number[] | null;
}

export function computeFrame(time: number, illusId: string, pr: number): FrameState {
  const t = Math.max(0, Math.min(time, TOTAL_DURATION));
  const hasElements = !!ILLUS_ELEMENTS[illusId];
  const motion = ILLUS_MOTION[illusId];
  const rotConfig = ILLUS_ROTATE_GROUP[illusId];

  let opacity = 1, tx = 0, ty = 0, scale = 1, containerRotation = 0, gestureOpacity = 1;
  let gestureGroupOpacities: number[] | null = null;
  let greyOpacity = 1, greyTX = 0, greyTY = 0;
  let mosaicLayerOpacity = 1, mosaicTX = 0, mosaicTY = 0;
  let mosaicScale = 1;
  let overlapOpacity = 1, overlapScale = 1, overlapTX = 0, overlapTY = 0;
  let greyClipTX = 0, greyClipTY = 0;
  const greyClipScale = 1;
  let telescopeAngle = 0;
  const mosaicRotation = (t * 3) % 360;

  const greyEnterFrom = motion?.greyEnterFrom || { x: -2.5, y: 3 };
  const mosaicEnterFrom = motion?.mosaicEnterFrom || { x: 2.5, y: 3 };
  const greyExitTo = motion?.greyExitTo || { x: 2, y: -2 };
  const mosaicExitTo = motion?.mosaicExitTo || { x: -2, y: -2 };

  const eTX = motion?.enterTX ?? 0;
  const eTY = motion?.enterTY ?? ILLUS_ENTER_Y_OFFSET;
  const eScale = motion?.enterScale ?? 0.85;
  const eRot = motion?.enterRotation ?? 0;
  const xTX = motion?.exitTX ?? 0;
  const xTY = motion?.exitTY ?? ILLUS_EXIT_Y_OFFSET;
  const xScale = motion?.exitScale ?? 0.85;
  const xRot = motion?.exitRotation ?? 0;

  if (t < ENTER_END) {
    const p = t / ILLUS_ENTER_DURATION;
    const sp = easeOutQuart(p);
    const fp = easeOutCubic(p);
    tx = lerp(eTX * pr, 0, sp);
    ty = lerp(eTY * pr, 0, sp);
    scale = lerp(eScale, 1, sp);
    containerRotation = lerp(eRot, 0, sp);
    const gestureDelay = 0.3;
    const gestureRaw = Math.max(0, (p - gestureDelay) / (1 - gestureDelay));
    gestureOpacity = easeOutCubic(gestureRaw);
    const stagger = motion?.gestureStagger ?? 0;
    if (stagger > 0) {
      const groups = ILLUS_HAND_DRAWN[illusId];
      if (groups && groups.length > 1) {
        gestureGroupOpacities = groups.map((_, gi) => {
          const groupDelay = gestureDelay + gi * stagger;
          const groupRaw = Math.max(0, (p - groupDelay) / Math.max(0.01, 1 - groupDelay));
          return easeOutCubic(groupRaw);
        });
      }
    }

    if (hasElements) {
      opacity = 1;
      const greyFade = Math.min(1, easeOutCubic(p) * 2.5);
      const greySp = easeOutQuart(p);
      greyOpacity = greyFade;
      greyTX = lerp(greyEnterFrom.x, 0, greySp);
      greyTY = lerp(greyEnterFrom.y, 0, greySp);
      const mosaicRaw = Math.max(0, (p - 0.1) / 0.9);
      const mosaicFade = Math.min(1, easeOutCubic(mosaicRaw) * 2.5);
      const mosaicSp = easeOutQuart(mosaicRaw);
      mosaicLayerOpacity = mosaicFade;
      mosaicTX = lerp(mosaicEnterFrom.x, 0, mosaicSp);
      mosaicTY = lerp(mosaicEnterFrom.y, 0, mosaicSp);
      if (motion?.mosaicEnterScale != null) {
        mosaicScale = lerp(motion.mosaicEnterScale, 1, mosaicSp);
      }
      if (motion?.overlapTrack === 'mosaic') {
        overlapOpacity = greyOpacity * mosaicLayerOpacity;
        overlapTX = mosaicTX;
        overlapTY = mosaicTY;
        overlapScale = mosaicScale;
      } else if (motion?.overlapTrack === 'grey') {
        overlapOpacity = greyOpacity;
        overlapTX = greyTX;
        overlapTY = greyTY;
      } else {
        overlapOpacity = greyOpacity;
      }
      greyClipTX = greyTX;
      greyClipTY = greyTY;
    } else {
      opacity = Math.min(1, fp * 2.5);
    }
  } else if (t < HOLD_END) {
    const holdT = t - ENTER_END;
    if (hasElements) {
      if (motion?.idleMosaicRoam) {
        const { ax, ay, period } = motion.idleMosaicRoam;
        const ramp = easeOutCubic(Math.min(1, holdT / 0.8));
        mosaicTX = ax * Math.sin(holdT * 2 * Math.PI / period) * ramp;
        mosaicTY = ay * Math.sin(holdT * 2 * Math.PI / period * 0.7 + 0.5) * ramp;
      }
      if (motion?.overlapTrack === 'mosaic') {
        overlapTX = mosaicTX;
        overlapTY = mosaicTY;
      } else if (motion?.overlapTrack === 'grey') {
        overlapTX = greyTX;
        overlapTY = greyTY;
      }
      greyClipTX = greyTX;
      greyClipTY = greyTY;
    }
    if (rotConfig) {
      telescopeAngle = rotConfig.degrees * Math.sin(holdT * 2 * Math.PI / rotConfig.period);
    }
  } else {
    const exitT = t - HOLD_END;
    const p = Math.min(1, exitT / ILLUS_EXIT_DURATION);
    const ep = easeInQuart(p);
    const fp = easeInCubic(p);
    tx = lerp(0, xTX * pr, ep);
    ty = lerp(0, xTY * pr, ep);
    scale = lerp(1, xScale, ep);
    containerRotation = lerp(0, xRot, ep);

    if (hasElements) {
      opacity = 1;
      const mosaicFade = Math.max(0, 1 - easeInCubic(p) * 2.5);
      const mosaicEp = easeInQuart(p);
      mosaicLayerOpacity = mosaicFade;
      mosaicTX = lerp(0, mosaicExitTo.x, mosaicEp);
      mosaicTY = lerp(0, mosaicExitTo.y, mosaicEp);
      if (motion?.mosaicExitScale != null) {
        mosaicScale = lerp(1, motion.mosaicExitScale, mosaicEp);
      }
      if (motion?.idleMosaicRoam) {
        const holdEnd = ILLUS_HOLD_DURATION;
        const { ax, ay, period } = motion.idleMosaicRoam;
        const ramp = easeOutCubic(Math.min(1, holdEnd / 0.8));
        const lastRoamX = ax * Math.sin(holdEnd * 2 * Math.PI / period) * ramp;
        const lastRoamY = ay * Math.sin(holdEnd * 2 * Math.PI / period * 0.7 + 0.5) * ramp;
        const fadeOut = 1 - easeInCubic(p);
        mosaicTX += lastRoamX * fadeOut;
        mosaicTY += lastRoamY * fadeOut;
      }
      const greyRaw = Math.max(0, (p - 0.12) / 0.88);
      const greyFade = Math.max(0, 1 - easeInCubic(greyRaw) * 2.5);
      const greyEp = easeInQuart(greyRaw);
      greyOpacity = greyFade;
      greyTX = lerp(0, greyExitTo.x, greyEp);
      greyTY = lerp(0, greyExitTo.y, greyEp);
      if (motion?.overlapTrack === 'mosaic') {
        overlapOpacity = greyOpacity * mosaicLayerOpacity;
        overlapTX = mosaicTX;
        overlapTY = mosaicTY;
        overlapScale = mosaicScale;
      } else if (motion?.overlapTrack === 'grey') {
        overlapOpacity = greyOpacity;
        overlapTX = greyTX;
        overlapTY = greyTY;
      } else {
        overlapOpacity = greyOpacity;
      }
      greyClipTX = greyTX;
      greyClipTY = greyTY;
      gestureOpacity = Math.max(mosaicFade, greyFade);
      const stagger = motion?.gestureStagger ?? 0;
      if (stagger > 0) {
        const groups = ILLUS_HAND_DRAWN[illusId];
        if (groups && groups.length > 1) {
          gestureGroupOpacities = groups.map((_, gi) => {
            const groupDelay = (groups.length - 1 - gi) * stagger;
            const groupRaw = Math.max(0, (p - groupDelay) / Math.max(0.01, 1 - groupDelay));
            return Math.max(0, 1 - easeInCubic(groupRaw) * 2.5);
          });
        }
      }
    } else {
      opacity = Math.max(0, 1 - fp * 2.5);
      gestureOpacity = 1;
    }
    if (rotConfig) {
      telescopeAngle = rotConfig.degrees * Math.sin((ILLUS_HOLD_DURATION + exitT) * 2 * Math.PI / rotConfig.period);
    }
  }

  return { opacity, tx, ty, scale, containerRotation, gestureOpacity, greyOpacity, greyTX, greyTY, mosaicLayerOpacity, mosaicTX, mosaicTY, mosaicScale, overlapOpacity, overlapScale, overlapTX, overlapTY, greyClipTX, greyClipTY, greyClipScale, telescopeAngle, mosaicRotation, gestureGroupOpacities };
}
