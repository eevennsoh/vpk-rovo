"use client";

/**
 * VPK-facing alias for border-beam 1.3.0.
 * Original: https://libraries.dev/border-beam
 * Source: https://github.com/Jakubantalik/border-beam
 *
 * Upstream renders the beam; VPK only patches two upstream defects from the
 * outside, so this stays an alias rather than a fork. Both were re-verified
 * against 1.3.0 — delete the corresponding wrapper once either is fixed
 * upstream.
 *
 * 1. Fade events are not scoped to the beam. Upstream matches
 *    `animationName.includes("fade-in"/"fade-out")` on a bubbling
 *    `animationend` with no target check, so ANY descendant with a
 *    matching animation name fires `onActivate` / `onDeactivate` and flips
 *    the beam's internal state. VPK ships `@keyframes stagger-fade-in`, so
 *    this is reachable here. Fixed with a capture-phase listener that stops
 *    descendant events before upstream's bubble handler sees them.
 *
 * 2. Reduced motion hides the beam entirely. `--beam-opacity-<id>` is
 *    registered with `initial-value: 0` and only ever raised to 1 inside
 *    `@keyframes beam-fade-in-<id>`; upstream's reduced-motion block then
 *    sets `animation: none !important`, so the keyframe never runs and the
 *    beam is invisible. The property is registered `inherits: true`, so we
 *    set it directly on the beam element instead.
 */

import { useCallback, useEffect, useRef, type Ref } from "react";
import UpstreamBorderBeam, { type BorderBeamProps } from "border-beam";
import { shouldSuppressAnimationEnd } from "./fade-guard";

export interface VpkBorderBeamProps extends BorderBeamProps {
	ref?: Ref<HTMLDivElement>;
}

/** Resolve the element carrying `data-beam`, which owns the id-suffixed vars. */
function findBeam(host: HTMLElement | null): HTMLElement | null {
	if (!host) return null;
	if (host.hasAttribute("data-beam")) return host;
	return host.querySelector<HTMLElement>("[data-beam]");
}

export function BorderBeam({ ref, active, ...props }: VpkBorderBeamProps) {
	const hostRef = useRef<HTMLDivElement | null>(null);
	// Upstream defaults `active` to true; the wrapper must resolve that the
	// same way or an omitted prop reads as inactive below.
	const isActive = active ?? true;

	const setRefs = useCallback(
		(node: HTMLDivElement | null) => {
			hostRef.current = node;
			if (typeof ref === "function") ref(node);
			else if (ref) ref.current = node;
		},
		[ref],
	);

	// Upstream bug 1 — keep descendant fade animations out of the beam's handler.
	useEffect(() => {
		const host = hostRef.current;
		const beam = findBeam(host);
		if (!host || !beam) return;
		const onAnimationEnd = (event: AnimationEvent) => {
			if (shouldSuppressAnimationEnd(event.animationName, event.target === beam))
				event.stopPropagation();
		};
		host.addEventListener("animationend", onAnimationEnd, true);
		return () => host.removeEventListener("animationend", onAnimationEnd, true);
	}, []);

	// Upstream bug 2 — keep the beam visible when motion is reduced.
	useEffect(() => {
		if (typeof matchMedia === "undefined") return;
		const query = matchMedia("(prefers-reduced-motion: reduce)");

		const sync = () => {
			const beam = findBeam(hostRef.current);
			const id = beam?.getAttribute("data-beam");
			if (!beam || !id) return;
			const property = `--beam-opacity-${id}`;
			// `inherits: true`, so setting it on the beam reaches the
			// pseudo-elements and the bloom layer that read it.
			if (query.matches) beam.style.setProperty(property, isActive ? "1" : "0");
			else beam.style.removeProperty(property);
		};

		sync();
		query.addEventListener("change", sync);
		return () => query.removeEventListener("change", sync);
	}, [isActive]);

	return <UpstreamBorderBeam ref={setRefs} active={active} {...props} />;
}

export type {
	BorderBeamColorVariant,
	BorderBeamProps,
	BorderBeamSize,
	BorderBeamTheme,
} from "border-beam";

// VPK-local demo data and GUI control metadata.
export {
	BORDER_BEAM_COLOR_VARIANT_OPTIONS,
	BORDER_BEAM_CONTROL_RANGES,
	BORDER_BEAM_DEFAULTS,
	BORDER_BEAM_FAMILY_OPTIONS,
	BORDER_BEAM_PULSE_SIZE_OPTIONS,
	BORDER_BEAM_ROTATE_SIZE_OPTIONS,
	BORDER_BEAM_SIZE_DEFAULTS,
	BORDER_BEAM_SIZE_OPTIONS,
	BORDER_BEAM_THEME_OPTIONS,
	getBorderBeamDefaultsForSize,
	getBorderBeamSizeOptions,
	type BorderBeamDemoConfig,
	type BorderBeamFamily,
} from "./data";

export { shouldSuppressAnimationEnd } from "./fade-guard";

export default BorderBeam;
