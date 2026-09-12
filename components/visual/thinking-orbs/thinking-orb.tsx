"use client";

// VPK's Thinking Orb: upstream `thinking-orbs`, plus two VPK-only
// pointer effects. Nothing upstream is forked or re-implemented.
//
// - `gravity` off (the default) delegates straight to upstream's
//   `<ThinkingOrb>`, so its lifecycle — shared clock, offscreen and
//   hidden-tab pausing, reduced-motion static frame, theme resolution —
//   is upstream's and stays upstream's.
// - `gravity` on drives our own loop over the public
//   `thinking-orbs/engine` surface: upstream's `MODE_FRAMES` produces the
//   geometry, we warp it, upstream's `paintFrame` draws it.
// - `cursorGravity` is orthogonal to both: it only needs the orb's
//   position on screen, so it works either way.

import { useEffect, useRef } from "react";
import { ThinkingOrb as UpstreamThinkingOrb } from "thinking-orbs";
import { MODE_FRAMES, paintFrame, resolvePreset } from "thinking-orbs/engine";
import {
	registerGravityWell,
	setCursorGravityTuning,
	type CursorGravityTuning,
} from "./cursor-gravity";
import { warpFrame, type OrbWarp } from "./orb-gravity";
import { useReducedMotion, useResolvedDark } from "./theme";
import type { OrbGravity, ThinkingOrbProps } from "./types";

/** Gravity defaults. `radius` and `pull` are multipliers on the orb size. */
const GRAVITY_RADIUS_RATIO = 2.5;
const GRAVITY_PULL_RATIO = 0.12;
const GRAVITY_SWELL = 0.35;

// Time constants for the engagement ramp, in seconds.
// In: duration-normal (150ms) — the pull answers the pointer as an
// interaction, so it stays at the interaction ceiling.
// Out: duration-medium (200ms) — release reads as the dots settling back
// onto their orbit rather than as a surface dismissing.
const GRAVITY_EASE_IN_SEC = 0.15;
const GRAVITY_EASE_OUT_SEC = 0.2;

/** Below this the field is imperceptible — drop it and skip the warp. */
const GRAVITY_EPSILON = 0.002;

interface ResolvedGravity {
	radius: number;
	pull: number;
	swell: number;
}

function resolveGravity(
	gravity: boolean | OrbGravity | undefined,
	size: number,
): ResolvedGravity | null {
	if (!gravity) return null;
	const o: OrbGravity = gravity === true ? {} : gravity;
	return {
		radius: o.radius ?? size * GRAVITY_RADIUS_RATIO,
		pull: o.pull ?? size * GRAVITY_PULL_RATIO,
		swell: o.swell ?? GRAVITY_SWELL,
	};
}

/**
 * Register this orb as a well for the shared deforming-pointer replica.
 * Takes any host element and resolves the orb canvas inside it, so both
 * render paths can use it — upstream's `<ThinkingOrb>` does not accept a
 * ref, so the delegated path hands us a `display: contents` wrapper.
 */
function useCursorGravityWell(
	ref: React.RefObject<HTMLElement | null>,
	cursorGravity: boolean | Partial<CursorGravityTuning> | undefined,
	reduced: boolean,
): void {
	const on = Boolean(cursorGravity);
	// Serialized so an inline tuning literal cannot re-register every render.
	const json =
		cursorGravity && typeof cursorGravity === "object"
			? JSON.stringify(cursorGravity)
			: "";

	useEffect(() => {
		const host = ref.current;
		if (!host || !on || reduced) return;
		const el =
			host instanceof HTMLCanvasElement ? host : host.querySelector("canvas");
		if (!el) return;
		const opts = json
			? (JSON.parse(json) as Partial<CursorGravityTuning>)
			: null;
		setCursorGravityTuning(opts);
		return registerGravityWell(el, opts?.reach);
	}, [ref, on, json, reduced]);
}

/**
 * The gravity render path: our loop, upstream's geometry and painter.
 * Mirrors upstream's lifecycle (one static frame under reduced motion,
 * pause offscreen and on hidden tabs) so behaviour matches the delegated
 * path apart from the warp itself.
 */
function GravityOrb({
	state = "working",
	size = 64,
	theme = "auto",
	speed = 1,
	paused = false,
	gravity,
	cursorGravity,
	style,
	ariaLabel,
	rest,
}: {
	state: NonNullable<ThinkingOrbProps["state"]>;
	size: NonNullable<ThinkingOrbProps["size"]>;
	theme: NonNullable<ThinkingOrbProps["theme"]>;
	speed: number;
	paused: boolean;
	gravity: boolean | OrbGravity;
	cursorGravity: ThinkingOrbProps["cursorGravity"];
	style: React.CSSProperties | undefined;
	ariaLabel: string;
	rest: Record<string, unknown>;
}) {
	const ref = useRef<HTMLCanvasElement | null>(null);
	const dark = useResolvedDark(theme, ref);
	const reduced = useReducedMotion();
	useCursorGravityWell(ref, cursorGravity, reduced);

	const grav = resolveGravity(gravity, size);
	const gravRadius = grav?.radius ?? 0;
	const gravPull = grav?.pull ?? 0;
	const gravSwell = grav?.swell ?? 0;

	useEffect(() => {
		const canvas = ref.current;
		if (!canvas) return;
		const dpr = Math.min(
			2,
			(typeof devicePixelRatio !== "undefined" && devicePixelRatio) || 1,
		);
		canvas.width = Math.round(size * dpr);
		canvas.height = Math.round(size * dpr);
		const ctx = canvas.getContext("2d");
		if (!ctx) return;

		const { mode, speed: baseSpeed, opts } = resolvePreset(state, size);
		const geometry = MODE_FRAMES[mode];
		const effSpeed = baseSpeed * speed;

		// Gravity answers to the same gates the animation does.
		const gravityOn = !reduced && !paused;

		let pointer: { cx: number; cy: number } | null = null;
		let lastLocal: { x: number; y: number } | null = null;
		let amount = 0;
		let lastMs = performance.now();

		const computeWarp = (): OrbWarp | null => {
			if (!gravityOn) return null;
			const now = performance.now();
			// clamp so a backgrounded tab cannot resume with one huge step
			const dt = Math.min(0.05, Math.max(0, (now - lastMs) / 1000));
			lastMs = now;

			let target = 0;
			if (pointer) {
				const rect = canvas.getBoundingClientRect();
				const x = pointer.cx - rect.left;
				const y = pointer.cy - rect.top;
				if (Math.hypot(x - size / 2, y - size / 2) <= gravRadius) {
					target = 1;
					lastLocal = { x, y };
				}
			}

			const tau = target > amount ? GRAVITY_EASE_IN_SEC : GRAVITY_EASE_OUT_SEC;
			amount += (target - amount) * (1 - Math.exp(-dt / tau));
			if (amount < GRAVITY_EPSILON) {
				amount = 0;
				return null;
			}
			if (!lastLocal) return null;

			return {
				x: lastLocal.x,
				y: lastLocal.y,
				amount,
				radius: gravRadius,
				pull: gravPull,
				swell: gravSwell,
			};
		};

		const frame = (tSec: number) => {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, size, size);
			paintFrame(
				ctx,
				warpFrame(geometry(size, tSec, opts), computeWarp()),
				dark,
			);
		};

		// reduced motion → one static, deterministic frame
		if (reduced) {
			frame(0.6);
			return;
		}

		const onPointerMove = (e: PointerEvent) => {
			pointer = { cx: e.clientX, cy: e.clientY };
		};
		const onPointerOut = (e: PointerEvent) => {
			if (!e.relatedTarget) pointer = null;
		};
		window.addEventListener("pointermove", onPointerMove, { passive: true });
		document.addEventListener("pointerout", onPointerOut, { passive: true });

		let raf = 0;
		let running = false;
		const loop = () => {
			frame((performance.now() / 1000) * effSpeed);
			if (running) raf = requestAnimationFrame(loop);
		};
		const start = () => {
			if (running || paused) return;
			running = true;
			raf = requestAnimationFrame(loop);
		};
		const stop = () => {
			running = false;
			cancelAnimationFrame(raf);
		};

		// draw at least one frame even when paused/offscreen
		frame((performance.now() / 1000) * effSpeed);

		let visible = true;
		const io =
			typeof IntersectionObserver !== "undefined"
				? new IntersectionObserver(([entry]) => {
						visible = entry.isIntersecting;
						if (visible && document.visibilityState !== "hidden") start();
						else stop();
					})
				: null;
		io?.observe(canvas);
		const onVis = () => {
			if (document.visibilityState === "hidden") stop();
			else if (visible) start();
		};
		document.addEventListener("visibilitychange", onVis);
		if (!io) start();

		return () => {
			stop();
			io?.disconnect();
			document.removeEventListener("visibilitychange", onVis);
			window.removeEventListener("pointermove", onPointerMove);
			document.removeEventListener("pointerout", onPointerOut);
		};
	}, [
		state,
		size,
		dark,
		speed,
		paused,
		reduced,
		gravRadius,
		gravPull,
		gravSwell,
	]);

	return (
		<canvas
			ref={ref}
			role="img"
			aria-label={ariaLabel}
			style={{ width: size, height: size, display: "block", ...style }}
			{...rest}
		/>
	);
}

const LABELS: Record<string, string> = {
	working: "Working…",
	searching: "Searching…",
	solving: "Solving…",
	listening: "Listening…",
	connecting: "Connecting…",
	weaving: "Weaving…",
	composing: "Composing…",
	breathing: "Thinking…",
	shaping: "Shaping…",
};

export function ThinkingOrb({
	gravity = false,
	cursorGravity = false,
	...props
}: ThinkingOrbProps) {
	const delegatedRef = useRef<HTMLSpanElement | null>(null);
	const reduced = useReducedMotion();
	// The delegated path still needs a well for the pointer replica; the
	// gravity path registers its own inside GravityOrb.
	useCursorGravityWell(delegatedRef, gravity ? false : cursorGravity, reduced);

	if (gravity) {
		const {
			state = "working",
			size = 64,
			theme = "auto",
			speed = 1,
			paused = false,
			style,
			"aria-label": ariaLabel,
			...rest
		} = props;
		return (
			<GravityOrb
				state={state}
				size={size}
				theme={theme}
				speed={speed}
				paused={paused}
				gravity={gravity}
				cursorGravity={cursorGravity}
				style={style}
				ariaLabel={ariaLabel ?? LABELS[state]}
				rest={rest as Record<string, unknown>}
			/>
		);
	}

	// `display: contents` adds no box, so upstream's canvas keeps its own
	// layout while still giving us a handle to find it.
	return (
		<span ref={delegatedRef} style={{ display: "contents" }}>
			<UpstreamThinkingOrb {...props} />
		</span>
	);
}
