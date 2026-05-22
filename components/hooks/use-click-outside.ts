"use client";

import { useEffect, useRef, RefObject } from "react";

/**
 * Hook that detects clicks outside of specified elements.
 *
 * Stores the refs array in a ref so the underlying `pointerdown` listener
 * is attached once per `enabled`/`callback` change instead of every render
 * (callers typically pass an inline `[ref1, ref2]` array, whose identity
 * changes each render).
 *
 * @param refs - Array of refs to elements that should not trigger the callback
 * @param callback - Function to call when click outside is detected
 * @param enabled - Whether the hook is active (default: true)
 */
export function useClickOutside(
	refs: RefObject<HTMLElement | null>[],
	callback: () => void,
	enabled: boolean = true
): void {
	const refsRef = useRef(refs);
	const callbackRef = useRef(callback);

	useEffect(() => {
		refsRef.current = refs;
		callbackRef.current = callback;
	});

	useEffect(() => {
		if (!enabled) return;

		const handlePointerDown = (event: PointerEvent) => {
			const target = event.target as Node;
			const currentRefs = refsRef.current;
			const isOutside = currentRefs.every(
				(ref) => ref.current && !ref.current.contains(target)
			);
			if (isOutside) {
				callbackRef.current();
			}
		};

		document.addEventListener("pointerdown", handlePointerDown, { passive: true });
		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
		};
	}, [enabled]);
}

