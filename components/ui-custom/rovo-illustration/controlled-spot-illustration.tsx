"use client";

import { useEffect, useRef, useState, useCallback } from "react";

import { useTheme } from "@/components/utils/theme-wrapper";
import SpotIllustration, {
  ILLUS_ELEMENTS,
  ILLUS_MOTION,
  ILLUS_ROTATE_GROUP,
  ILLUS_ENTER_DURATION,
  ILLUS_HOLD_DURATION,
  ILLUS_EXIT_DURATION,
  CHAT_ENTER_DURATION,
  easeOutCubic,
  processIllustrationSvg,
  getSpotIllustrationUrl,
  applyOverlapClipPath,
} from "./spot-illustration";
import { computeFrame } from "./frame";
import { getEmbeddedSpotIllustrationSvg } from "./assets.generated";

const ENTER_END = ILLUS_ENTER_DURATION;
const HOLD_END = ILLUS_ENTER_DURATION + ILLUS_HOLD_DURATION;

export type ControlledSpotIllustrationPhase = "enter" | "idle" | "exit" | "done";
type Frame = ReturnType<typeof computeFrame>;

function computeIdleFrame(idleT: number, totalT: number, illusId: string, pr: number): Frame {
  const base = computeFrame(ENTER_END + 0.001, illusId, pr);
  const motion = ILLUS_MOTION[illusId];
  const rotConfig = ILLUS_ROTATE_GROUP[illusId];
  const out: Frame = { ...base };
  out.mosaicRotation = (totalT * 3) % 360;
  if (motion?.idleMosaicRoam) {
    const { ax, ay, period } = motion.idleMosaicRoam;
    const ramp = easeOutCubic(Math.min(1, idleT / 0.8));
    out.mosaicTX = ax * Math.sin(idleT * 2 * Math.PI / period) * ramp;
    out.mosaicTY = ay * Math.sin(idleT * 2 * Math.PI / period * 0.7 + 0.5) * ramp;
    if (motion?.overlapTrack === 'mosaic') {
      out.overlapTX = out.mosaicTX;
      out.overlapTY = out.mosaicTY;
    }
  }
  if (rotConfig) {
    out.telescopeAngle = rotConfig.degrees * Math.sin(idleT * 2 * Math.PI / rotConfig.period);
  }
  return out;
}

export interface ControlledSpotIllustrationProps {
  illusId: string;
  size?: number;
  baseUrl?: string;
  wantExit?: boolean;
  onExitComplete?: () => void;
  onPhaseChange?: (phase: ControlledSpotIllustrationPhase) => void;
}

export default function ControlledSpotIllustration(props: ControlledSpotIllustrationProps) {
  // "chat" can never go down the generic illus code path: chat.svg is a
  // static drawing of the full chat scene with no grey/mosaic/overlap layer
  // convention, so loading it into the generic SVG wrapper produces the
  // "chat weird frame" (raw scene + wrong-scale gestures + wrong elements).
  // Dispatch chat to the dedicated layered renderer instead. See
  // SpotIllustration.tsx (resolveCycleConfig) for the parallel guard on the
  // gallery's cycling code path.
  // PARITY NOTE: This file mirrors lib/shared-ui/src/components/ControlledSpotIllustration.tsx
  // — keep the chat dispatch and ChatControlledIllustration in sync.
  if (props.illusId === "chat") {
    return <ChatControlledIllustration {...props} />;
  }
  return <GenericControlledSpotIllustration {...props} />;
}

function GenericControlledSpotIllustration({
  illusId,
  size = 320,
  baseUrl = "/",
  wantExit = false,
  onExitComplete,
  onPhaseChange,
}: ControlledSpotIllustrationProps) {
  const { actualTheme: theme } = useTheme();
  const pr = size / 300;
  const hasElements = !!ILLUS_ELEMENTS[illusId];
  const rotConfig = ILLUS_ROTATE_GROUP[illusId];

  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mosaicRotateEls = useRef<SVGGElement[]>([]);
  const gestureEls = useRef<Element[]>([]);
  const gestureGroups = useRef<Element[][]>([]);
  const greyLayersRef = useRef<SVGGElement[]>([]);
  const mosaicLayersRef = useRef<SVGGElement[]>([]);
  const overlapLayersRef = useRef<SVGGElement[]>([]);
  const greyClipRef = useRef<SVGGElement[]>([]);
  const rotateEls = useRef<SVGGElement[]>([]);

  const [svgHtml, setSvgHtml] = useState<string | null>(null);

  const phaseRef = useRef<ControlledSpotIllustrationPhase>("enter");
  const elapsedRef = useRef<number>(0);
  const idleStartRef = useRef<number>(0);
  const exitStartRef = useRef<number>(0);
  const wantExitRef = useRef(wantExit);
  const onExitCompleteRef = useRef(onExitComplete);
  const onPhaseChangeRef = useRef(onPhaseChange);

  useEffect(() => { wantExitRef.current = wantExit; }, [wantExit]);
  useEffect(() => { onExitCompleteRef.current = onExitComplete; }, [onExitComplete]);
  useEffect(() => { onPhaseChangeRef.current = onPhaseChange; }, [onPhaseChange]);

  useEffect(() => {
    let mounted = true;
    const embedded = getEmbeddedSpotIllustrationSvg(illusId, theme);
    if (embedded) {
      setSvgHtml(processIllustrationSvg(embedded, illusId));
      return () => { mounted = false; };
    }
    const url = getSpotIllustrationUrl(illusId, theme, baseUrl);
    fetch(url)
      .then(r => r.text())
      .then(text => {
        if (mounted) setSvgHtml(processIllustrationSvg(text, illusId));
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, [illusId, theme, baseUrl]);

  useEffect(() => {
    if (!wrapperRef.current || !svgHtml) return;
    const wrapper = wrapperRef.current;
    wrapper.innerHTML = svgHtml;
    const svgEl = wrapper.querySelector('svg');
    if (svgEl) applyOverlapClipPath(svgEl as SVGSVGElement);
    mosaicRotateEls.current = Array.from(wrapper.querySelectorAll('[data-mosaic-rotate]')) as SVGGElement[];
    gestureEls.current = Array.from(wrapper.querySelectorAll('.illus-gesture'));
    const gMap = new Map<number, Element[]>();
    gestureEls.current.forEach(el => {
      const gi = parseInt(el.getAttribute('data-gesture-group') || '0', 10);
      if (!gMap.has(gi)) gMap.set(gi, []);
      gMap.get(gi)!.push(el);
    });
    const maxG = gMap.size > 0 ? Math.max(...gMap.keys()) : -1;
    gestureGroups.current = [];
    for (let g = 0; g <= maxG; g++) gestureGroups.current.push(gMap.get(g) || []);
    greyLayersRef.current = Array.from(wrapper.querySelectorAll('[data-illus-layer="grey"]')) as SVGGElement[];
    mosaicLayersRef.current = Array.from(wrapper.querySelectorAll('[data-illus-layer="mosaic"]')) as SVGGElement[];
    overlapLayersRef.current = Array.from(wrapper.querySelectorAll('[data-illus-layer="overlap"]')) as SVGGElement[];
    greyClipRef.current = Array.from(wrapper.querySelectorAll('[data-illus-grey-clip]')) as SVGGElement[];
    rotateEls.current = Array.from(wrapper.querySelectorAll('[data-illus-rotate]')) as SVGGElement[];
  }, [svgHtml]);

  useEffect(() => {
    phaseRef.current = "enter";
    elapsedRef.current = 0;
    idleStartRef.current = 0;
    exitStartRef.current = 0;
    onPhaseChangeRef.current?.("enter");
  }, [illusId]);

  const applyFrame = useCallback((frame: Frame) => {
    if (!containerRef.current) return;
    containerRef.current.style.transform = `translate(${frame.tx}px, ${frame.ty}px) scale(${frame.scale})${frame.containerRotation !== 0 ? ` rotate(${frame.containerRotation}deg)` : ''}`;
    const containerOpacity = hasElements ? 1 : frame.opacity;
    containerRef.current.style.opacity = String(containerOpacity);

    mosaicRotateEls.current.forEach(el => {
      el.style.transform = `rotate(${frame.mosaicRotation}deg)`;
    });
    if (frame.gestureGroupOpacities && gestureGroups.current.length > 1) {
      gestureGroups.current.forEach((groupEls, gi) => {
        const op = gi < frame.gestureGroupOpacities!.length ? frame.gestureGroupOpacities![gi] : frame.gestureOpacity;
        groupEls.forEach(el => { (el as SVGElement).style.opacity = String(op); });
      });
    } else {
      gestureEls.current.forEach(el => {
        (el as SVGElement).style.opacity = String(frame.gestureOpacity);
      });
    }

    if (hasElements) {
      greyLayersRef.current.forEach(el => {
        el.style.opacity = String(frame.greyOpacity);
        el.setAttribute('transform', `translate(${frame.greyTX}, ${frame.greyTY})`);
      });
      mosaicLayersRef.current.forEach(el => {
        el.style.opacity = String(frame.mosaicLayerOpacity);
        el.style.transform = `translate(${frame.mosaicTX}px, ${frame.mosaicTY}px)${frame.mosaicScale !== 1 ? ` scale(${frame.mosaicScale})` : ''}`;
      });
      overlapLayersRef.current.forEach(el => {
        el.style.opacity = String(frame.overlapOpacity);
        if (frame.overlapTX !== 0 || frame.overlapTY !== 0 || frame.overlapScale !== 1) {
          el.style.transform = `translate(${frame.overlapTX}px, ${frame.overlapTY}px)${frame.overlapScale !== 1 ? ` scale(${frame.overlapScale})` : ''}`;
        } else {
          el.style.transform = '';
        }
      });
      greyClipRef.current.forEach(el => {
        if (frame.greyClipTX !== 0 || frame.greyClipTY !== 0 || frame.greyClipScale !== 1) {
          el.setAttribute('transform', `translate(${frame.greyClipTX}, ${frame.greyClipTY})${frame.greyClipScale !== 1 ? ` scale(${frame.greyClipScale})` : ''}`);
        } else {
          el.removeAttribute('transform');
        }
      });
    }

    if (rotConfig && rotateEls.current.length > 0) {
      rotateEls.current.forEach(el => {
        el.setAttribute('transform', `rotate(${frame.telescopeAngle}, ${rotConfig.anchorX}, ${rotConfig.anchorY})`);
      });
    }
  }, [hasElements, rotConfig]);

  useEffect(() => {
    let raf = 0;
    let lastTs: number | null = null;

    const tick = (ts: number) => {
      if (lastTs == null) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      elapsedRef.current += dt;
      const elapsed = elapsedRef.current;

      let frame: Frame;
      if (phaseRef.current === "enter") {
        if (elapsed >= ENTER_END) {
          phaseRef.current = "idle";
          idleStartRef.current = elapsed;
          onPhaseChangeRef.current?.("idle");
        }
      }
      if (phaseRef.current === "idle") {
        if (wantExitRef.current) {
          phaseRef.current = "exit";
          exitStartRef.current = elapsed;
          onPhaseChangeRef.current?.("exit");
        }
      }
      if (phaseRef.current === "exit") {
        const exitT = elapsed - exitStartRef.current;
        if (exitT >= ILLUS_EXIT_DURATION) {
          phaseRef.current = "done";
          onPhaseChangeRef.current?.("done");
          onExitCompleteRef.current?.();
        }
      }

      if (phaseRef.current === "enter") {
        frame = computeFrame(elapsed, illusId, pr);
      } else if (phaseRef.current === "idle") {
        const idleT = elapsed - idleStartRef.current;
        frame = computeIdleFrame(idleT, elapsed, illusId, pr);
      } else if (phaseRef.current === "exit") {
        const exitT = elapsed - exitStartRef.current;
        frame = computeFrame(HOLD_END + exitT, illusId, pr);
      } else {
        frame = computeFrame(HOLD_END + ILLUS_EXIT_DURATION, illusId, pr);
      }
      applyFrame(frame);

      if (phaseRef.current !== "done") {
        raf = requestAnimationFrame(tick);
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [illusId, pr, applyFrame]);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div
        ref={containerRef}
        style={{ width: "55%", height: "55%", transformOrigin: "center center", opacity: 0 }}
      >
        <div ref={wrapperRef} style={{ width: "100%", height: "100%", position: "relative" }} />
      </div>
    </div>
  );
}

/**
 * Plays the chat illustration in a controlled enter/idle/exit lifecycle by
 * wrapping the dedicated layered chat renderer (SpotIllustration with
 * chatOnly + illusIds=["chat"] loops chat continuously). Approximates the
 * phase transitions with timers so the host (e.g. Rovo Prompt Studio) gets
 * the same onPhaseChange / onExitComplete contract it gets for non-chat ids.
 *
 * Why a wrapper instead of the generic path: chat.svg has no
 * grey/mosaic/overlap layer convention, so the generic SVG-loading effect
 * in GenericControlledSpotIllustration would produce the "chat weird frame".
 *
 * PARITY NOTE: Mirror of ChatControlledIllustration in
 * lib/shared-ui/src/components/ControlledSpotIllustration.tsx.
 */
function ChatControlledIllustration({
  size = 320,
  baseUrl = "/",
  wantExit = false,
  onExitComplete,
  onPhaseChange,
}: ControlledSpotIllustrationProps) {
  const phaseRef = useRef<ControlledSpotIllustrationPhase>("enter");
  const wantExitRef = useRef(wantExit);
  const onExitCompleteRef = useRef(onExitComplete);
  const onPhaseChangeRef = useRef(onPhaseChange);

  useEffect(() => { wantExitRef.current = wantExit; }, [wantExit]);
  useEffect(() => { onExitCompleteRef.current = onExitComplete; }, [onExitComplete]);
  useEffect(() => { onPhaseChangeRef.current = onPhaseChange; }, [onPhaseChange]);

  // Phase reporting only — the actual visual lifecycle is driven by
  // SpotIllustration's controlledChatLifecycle mode (see below). Here we
  // just emit enter → idle → exit at the same beats so the host's
  // onPhaseChange contract stays aligned with the generic illus path.
  // Critically, idle is held indefinitely until wantExit; we never auto-
  // transition to exit on a timer — that would make the chat scene loop
  // its full enter/idle/exit cycle even when the user hasn't typed a
  // word that maps to a different illustration.
  useEffect(() => {
    onPhaseChangeRef.current?.("enter");
    let raf = 0;
    let mountTs: number | null = null;

    const tick = (ts: number) => {
      if (mountTs === null) mountTs = ts;
      const elapsed = (ts - mountTs) / 1000;

      if (phaseRef.current === "enter" && elapsed >= CHAT_ENTER_DURATION) {
        phaseRef.current = "idle";
        onPhaseChangeRef.current?.("idle");
      }
      // Wait for enter to finish before transitioning to exit so the
      // entrance always plays in full first (matches the generic path).
      if (phaseRef.current === "idle" && wantExitRef.current) {
        phaseRef.current = "exit";
        onPhaseChangeRef.current?.("exit");
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleChatExitComplete = useCallback(() => {
    if (phaseRef.current === "done") return;
    phaseRef.current = "done";
    onPhaseChangeRef.current?.("done");
    onExitCompleteRef.current?.();
  }, []);

  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <SpotIllustration
        chatOnly
        loop={false}
        controlledChatLifecycle
        wantChatExit={wantExit}
        onChatExitComplete={handleChatExitComplete}
        illusIds={["chat"]}
        size={size}
        baseUrl={baseUrl}
      />
    </div>
  );
}
