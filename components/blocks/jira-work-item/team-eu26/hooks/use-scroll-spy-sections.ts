"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

import {
	CHAPTER_SCROLL_GAP_PX,
	CHAPTER_SCROLL_LOCK_MS,
	buildChapterJumpTarget,
	getChapterContentTop,
	resolveActiveChapterId,
	resolveStickyHeaderBottom,
} from "@/components/blocks/jira-work-item/team-eu26/lib/pull-request-guide-active-chapter";

export const SCROLL_SPY_STICKY_HEADER_SELECTOR =
	"[data-jira-work-item-pull-request-detail-header]";

interface UseScrollSpySectionsOptions {
	/**
	 * Ordered ids of the tracked sections, top to bottom. Must match document
	 * order — `resolveActiveChapterId` reads non-monotonic tops as "layout not
	 * settled" and holds the first id rather than guessing.
	 */
	sectionIds: readonly string[];
	/**
	 * The resolved scrolling element, not a ref. Element identity is the effect
	 * dependency, so a container that mounts late (the nav renders above the
	 * scrollport) or swaps across the 860px breakpoint re-attaches listeners
	 * instead of silently never attaching.
	 */
	scrollContainer: HTMLElement | null;
	stickyHeaderSelector?: string;
}

interface ScrollSpySections {
	activeId: string | null;
	registerSection: (sectionId: string, node: HTMLElement | null) => void;
	selectSection: (sectionId: string) => void;
}

/**
 * Active-section tracking for a stacked scroll flow, plus click-to-anchor.
 *
 * Shared by the work-item section nav and the guided-review chapter navigator.
 * Two instances can observe the same scrollport safely: each resolves against
 * its own element set and owns its own click lock, so a programmatic jump in
 * one never suppresses the other.
 *
 * Deliberately not IntersectionObserver — see the rationale in
 * `lib/pull-request-guide-active-chapter.ts`.
 */
export function useScrollSpySections({
	sectionIds,
	scrollContainer,
	stickyHeaderSelector = SCROLL_SPY_STICKY_HEADER_SELECTOR,
}: UseScrollSpySectionsOptions): ScrollSpySections {
	const shouldReduceMotion = Boolean(useReducedMotion());
	const [activeId, setActiveId] = useState<string | null>(sectionIds[0] ?? null);
	const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
	const lockedIdRef = useRef<string | null>(null);
	const unlockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const settleFrameRef = useRef<number | null>(null);
	const pendingScrollEndRef = useRef<{
		container: HTMLElement;
		handler: () => void;
	} | null>(null);
	// No ref mirror: render must stay pure, so this closes over `sectionIds`
	// directly and re-creates when the set changes. Both callers memoize their
	// id array, so identity is stable between real changes.
	const resolveActiveId = useCallback((container: HTMLElement) => {
		const activationOffset =
			resolveStickyHeaderBottom(container, stickyHeaderSelector) -
			container.getBoundingClientRect().top +
			CHAPTER_SCROLL_GAP_PX;
		return resolveActiveChapterId({
			activationOffset,
			chapterIds: sectionIds,
			getChapterTop: (sectionId) => {
				const element = sectionRefs.current[sectionId];
				if (!element) return null;
				return getChapterContentTop(container, element);
			},
			maxScrollTop: Math.max(0, container.scrollHeight - container.clientHeight),
			scrollTop: container.scrollTop,
		});
	}, [sectionIds, stickyHeaderSelector]);

	const clearPendingUnlock = useCallback(() => {
		if (settleFrameRef.current != null) {
			window.cancelAnimationFrame(settleFrameRef.current);
			settleFrameRef.current = null;
		}
		if (unlockTimeoutRef.current != null) {
			clearTimeout(unlockTimeoutRef.current);
			unlockTimeoutRef.current = null;
		}
		const pendingScrollEnd = pendingScrollEndRef.current;
		if (pendingScrollEnd) {
			pendingScrollEnd.container.removeEventListener("scrollend", pendingScrollEnd.handler);
			pendingScrollEndRef.current = null;
		}
	}, []);

	useEffect(() => {
		if (!scrollContainer) return;

		const syncActiveFromScroll = () => {
			if (lockedIdRef.current != null) return;
			const nextActiveId = resolveActiveId(scrollContainer);
			if (!nextActiveId) return;
			setActiveId((current) => (current === nextActiveId ? current : nextActiveId));
		};

		syncActiveFromScroll();
		// Sections can mount before their boxes have distinct tops; retry after layout.
		const readyFrame = window.requestAnimationFrame(syncActiveFromScroll);
		scrollContainer.addEventListener("scroll", syncActiveFromScroll, { passive: true });
		window.addEventListener("resize", syncActiveFromScroll);

		return () => {
			window.cancelAnimationFrame(readyFrame);
			scrollContainer.removeEventListener("scroll", syncActiveFromScroll);
			window.removeEventListener("resize", syncActiveFromScroll);
		};
	}, [resolveActiveId, scrollContainer]);

	// Drop refs for sections that no longer exist (Guide/Files after a PR closes).
	useEffect(() => {
		const liveIds = new Set(sectionIds);
		for (const sectionId of Object.keys(sectionRefs.current)) {
			if (!liveIds.has(sectionId)) {
				delete sectionRefs.current[sectionId];
			}
		}
	}, [sectionIds]);

	useEffect(() => clearPendingUnlock, [clearPendingUnlock]);

	const registerSection = useCallback((sectionId: string, node: HTMLElement | null) => {
		sectionRefs.current[sectionId] = node;
	}, []);

	const selectSection = useCallback((sectionId: string) => {
		const sectionElement = sectionRefs.current[sectionId];
		lockedIdRef.current = sectionId;
		clearPendingUnlock();
		setActiveId(sectionId);
		if (!sectionElement || !scrollContainer) {
			lockedIdRef.current = null;
			return;
		}

		const unlockSpy = () => {
			if (lockedIdRef.current !== sectionId) return;
			const nextActiveId = resolveActiveId(scrollContainer);
			if (nextActiveId === sectionId) {
				lockedIdRef.current = null;
				setActiveId(sectionId);
				return;
			}

			// The scrollport can finish before an ancestor's entry transform. Recompute
			// once against the settled visual geometry while the selected id is still
			// locked, then let the spy resolve the corrected position next frame.
			scrollContainer.scrollTo({
				top: buildChapterJumpTarget(scrollContainer, sectionElement, stickyHeaderSelector),
				behavior: "auto",
			});
			settleFrameRef.current = window.requestAnimationFrame(() => {
				settleFrameRef.current = null;
				if (lockedIdRef.current !== sectionId) return;
				lockedIdRef.current = null;
				const settledActiveId = resolveActiveId(scrollContainer);
				if (settledActiveId) {
					setActiveId(settledActiveId);
				}
			});
		};

		scrollContainer.scrollTo({
			top: buildChapterJumpTarget(scrollContainer, sectionElement, stickyHeaderSelector),
			behavior: shouldReduceMotion ? "auto" : "smooth",
		});

		// Unlock on whichever lands first: native scrollend, or the timeout fallback.
		const onScrollEnd = () => {
			clearPendingUnlock();
			unlockSpy();
		};
		scrollContainer.addEventListener("scrollend", onScrollEnd);
		pendingScrollEndRef.current = { container: scrollContainer, handler: onScrollEnd };
		unlockTimeoutRef.current = setTimeout(() => {
			clearPendingUnlock();
			unlockSpy();
		}, shouldReduceMotion ? 0 : CHAPTER_SCROLL_LOCK_MS);
	}, [clearPendingUnlock, resolveActiveId, scrollContainer, shouldReduceMotion, stickyHeaderSelector]);

	// Derive rather than sync: a section-set change must not leave a stale active id.
	const resolvedActiveId = activeId != null && sectionIds.includes(activeId)
		? activeId
		: sectionIds[0] ?? null;

	return { activeId: resolvedActiveId, registerSection, selectSection };
}
