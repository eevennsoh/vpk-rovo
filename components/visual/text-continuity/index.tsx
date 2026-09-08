"use client";

/**
 * Text Continuity — fluid value transitions built on Lochie Axon's torph
 * (https://torph.lochie.me, MIT). When the value changes, surviving characters
 * slide to their new position while inserts and removals fade and scale.
 *
 * Numeric words match by *place value* rather than by index, so `1,204 -> 1,318`
 * rolls the hundreds and tens and leaves the thousands alone; the symbols around
 * them travel with the places they belong to. Pass `cursorIndex` to switch a
 * field somebody is typing in from place matching to caret matching.
 *
 * torph owns its host element's subtree imperatively — it measures and tweens
 * individual glyph boxes. Never render React children into it; pass the value as
 * a string and let torph do the reconciliation.
 *
 * `TextContinuityProvider` supplies shared defaults (the demo panel drives it);
 * per-callsite props always win, so an example with its own feel keeps it.
 */

import { createContext, use, useMemo } from "react";
import { TextMorph } from "torph/react";

import {
	DEFAULT_CONFIG,
	resolveEase,
	type SpringEase,
	type TextContinuityConfig,
} from "./data";

const ConfigContext = createContext<TextContinuityConfig>(DEFAULT_CONFIG);

export function TextContinuityProvider({
	config,
	children,
}: Readonly<{ config: TextContinuityConfig; children: React.ReactNode }>) {
	return <ConfigContext value={config}>{children}</ConfigContext>;
}

/** The shared config in force at this point in the tree. */
export function useTextContinuityConfig(): TextContinuityConfig {
	return use(ConfigContext);
}

export type TextContinuityProps = Readonly<{
	/** The value to render. Changing it triggers the morph. */
	children: string;
	/** Override the shared duration, in ms. Ignored under a spring ease. */
	duration?: number;
	/** Override the shared easing with a bezier string or spring parameters. */
	ease?: string | SpringEase;
	/** Caret position — switches a single-number value to caret matching. */
	cursorIndex?: number;
	/** Locale for segmentation and numeric formatting. */
	locale?: Intl.LocalesArgument;
	className?: string;
	style?: React.CSSProperties;
	/** Element to render. Defaults to torph's `span`. */
	as?: React.ElementType;
}>;

/**
 * torph already honours `prefers-reduced-motion` itself via
 * `respectReducedMotion`, so there is no guard here. Callers that *cycle* a
 * value on a timer still need their own — see `useCycle`.
 */
export default function TextContinuity({
	children,
	duration,
	ease,
	cursorIndex,
	locale,
	className,
	style,
	as,
}: TextContinuityProps) {
	const config = useTextContinuityConfig();

	// torph re-attaches whenever its serialized config changes, so keep the
	// object identity-stable or every render restarts the morph.
	const resolved = useMemo(
		() => ({
			duration: duration ?? config.duration,
			ease: ease ?? resolveEase(config),
			scale: config.scale,
			numbers: config.numbers,
			debug: config.debug,
			disabled: config.disabled,
		}),
		[duration, ease, config],
	);

	return (
		<TextMorph
			{...resolved}
			cursorIndex={cursorIndex}
			locale={locale}
			className={className}
			style={style}
			as={as}
		>
			{children}
		</TextMorph>
	);
}
