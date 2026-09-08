"use client";

import { useEffect, useState, type RefObject } from "react";

import {
	collectInFlowGutterUnderlapRects,
	findInFlowGutterScrollport,
	isInFlowGutterScrollMaskActive,
	readInFlowGutterMaskRect,
} from "./in-flow-gutter-scroll-mask";

/**
 * Watches the adjacent Board or List scrollport and reports when painted UI
 * actually sits under the leading 24px Untracked gutter.
 */
export function useInFlowGutterScrollMask(
	hostRef: RefObject<HTMLElement | null>,
): boolean {
	const [maskActive, setMaskActive] = useState(false);

	useEffect(() => {
		const host = hostRef.current;
		if (!host) {
			return undefined;
		}

		let scrollport: HTMLElement | null = null;

		const syncMask = () => {
			setMaskActive(isInFlowGutterScrollMaskActive(
				readInFlowGutterMaskRect(host),
				collectInFlowGutterUnderlapRects(scrollport),
			));
		};

		const resizeObserver = new ResizeObserver(syncMask);
		resizeObserver.observe(host);

		const unbindScrollport = () => {
			if (!scrollport) {
				return;
			}
			scrollport.removeEventListener("scroll", syncMask);
			scrollport.removeEventListener("transitionend", syncMask);
			resizeObserver.unobserve(scrollport);
			scrollport = null;
		};

		const bindScrollport = () => {
			const nextScrollport = findInFlowGutterScrollport(host);
			if (nextScrollport === scrollport) {
				syncMask();
				return;
			}

			unbindScrollport();
			scrollport = nextScrollport;
			if (scrollport) {
				scrollport.addEventListener("scroll", syncMask, { passive: true });
				// Status columns animate max-width after childList; remeasure when that ends.
				scrollport.addEventListener("transitionend", syncMask);
				resizeObserver.observe(scrollport);
			}
			syncMask();
		};

		bindScrollport();
		const observer = new MutationObserver(bindScrollport);
		observer.observe(host.parentElement ?? host, { childList: true, subtree: true });
		window.addEventListener("resize", syncMask);

		return () => {
			observer.disconnect();
			resizeObserver.disconnect();
			window.removeEventListener("resize", syncMask);
			unbindScrollport();
		};
	}, [hostRef]);

	return maskActive;
}
