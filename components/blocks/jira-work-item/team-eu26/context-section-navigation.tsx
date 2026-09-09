"use client";

import {
	createContext,
	use,
	useCallback,
	useEffect,
	useId,
	useMemo,
	useState,
	useSyncExternalStore,
	type ReactNode,
} from "react";

import { useScrollSpySections } from "@/components/blocks/jira-work-item/team-eu26/hooks/use-scroll-spy-sections";
import {
	areSectionTabsEqual,
	isScrollAnchoredSectionId,
	workItemSectionElementId,
	workItemSectionHeadingId,
	type WorkItemSectionId,
	type WorkItemSectionTab,
} from "@/components/blocks/jira-work-item/team-eu26/lib/work-item-section-tabs";

interface SectionNavigationValue {
	/** Count pill on the Activity tab. Null until a panel publishes one. */
	activityCount: number | null;
	activeSectionId: WorkItemSectionId | null;
	/** Count on the Insights tab. Null until a panel publishes a positive one. */
	insightsCount: number | null;
	/** True while Insights is shown beside the Description/Activity body. */
	insightsSelected: boolean;
	clearInsights: () => void;
	registerSection: (sectionId: WorkItemSectionId, node: HTMLElement | null) => void;
	/** Instance-namespaced DOM ids, so co-mounted demos cannot collide. */
	sectionElementId: (sectionId: WorkItemSectionId) => string;
	sectionHeadingId: (sectionId: WorkItemSectionId) => string;
	/**
	 * The element that actually scrolls at the current breakpoint. Consumers that
	 * run their own scroll-linked behaviour (the guided-review chapter spy) should
	 * use this rather than the wide-mode ref, which does not scroll below 860px.
	 */
	scrollContainer: HTMLElement | null;
	sections: readonly WorkItemSectionTab[];
	selectSection: (sectionId: WorkItemSectionId) => void;
	setActivityCount: (count: number | null) => void;
	setInsightsCount: (count: number | null) => void;
	setNarrowScrollContainer: (element: HTMLElement | null) => void;
	/** Safe to call every render — identical tab lists are ignored. */
	setSections: (next: readonly WorkItemSectionTab[]) => void;
	setWideScrollContainer: (element: HTMLElement | null) => void;
}

const SectionNavigationContext = createContext<SectionNavigationValue | null>(null);

const NO_SECTIONS: readonly WorkItemSectionTab[] = [];
const DEFAULT_HEADER_COLLAPSE_OFFSET = 16;

export type WorkItemHeaderVariant = "expanded" | "compact";

/**
 * Owns the single section tab bar shared by the work item and pull-request
 * views: which sections exist, which one the scroll position is on, and how to
 * anchor to one.
 *
 * A provider rather than props because the nav renders in the left-column
 * chrome while the sections render inside the scrollport — DOM siblings with no
 * parent/child data path between them.
 */
export function SectionNavigationProvider({
	active,
	children,
}: Readonly<{
	active: boolean;
	children: ReactNode;
}>) {
	const [sections, setSectionsState] = useState(NO_SECTIONS);
	const instanceId = useId();
	const [insightsSelected, setInsightsSelected] = useState(false);
	const [pendingSectionId, setPendingSectionId] = useState<WorkItemSectionId | null>(null);
	const [activityCount, setActivityCount] = useState<number | null>(null);
	const [insightsCount, setInsightsCount] = useState<number | null>(null);
	const [wideScrollContainer, setWideScrollContainer] = useState<HTMLElement | null>(null);
	const [narrowScrollContainer, setNarrowScrollContainer] = useState<HTMLElement | null>(null);
	const [wideScrollerActive, setWideScrollerActive] = useState(false);

	const setSections = useCallback((next: readonly WorkItemSectionTab[]) => {
		setSectionsState((current) => (areSectionTabsEqual(current, next) ? current : next));
	}, []);

	useEffect(() => {
		// Modal content stays mounted while hidden. Re-resolve when it opens so a
		// zero-width closed layout cannot leave the narrow scrollport selected.
		if (!active || !wideScrollContainer || !narrowScrollContainer) {
			setWideScrollerActive(false);
			return;
		}
		// Below the 860px container breakpoint the wide scrollport is
		// `display: contents` — it has no box and does not scroll. Read the
		// applied style instead of mirroring the breakpoint in JS, so the two
		// can never drift apart.
		const syncActiveScroller = () => {
			setWideScrollerActive(
				window.getComputedStyle(wideScrollContainer).display !== "contents",
			);
		};
		syncActiveScroller();
		// Observe the narrow scroller: it always has a box, whereas the wide one
		// vanishes from layout at exactly the moment we need to notice.
		const observer = new ResizeObserver(syncActiveScroller);
		observer.observe(narrowScrollContainer);
		return () => observer.disconnect();
	}, [active, narrowScrollContainer, wideScrollContainer]);

	const scrollContainer = wideScrollerActive ? wideScrollContainer : narrowScrollContainer;
	const sectionIds = useMemo(
		() => sections.filter((section) => isScrollAnchoredSectionId(section.id)).map((section) => section.id),
		[sections],
	);
	const { activeId, registerSection, selectSection } = useScrollSpySections({
		scrollContainer,
		sectionIds,
	});
	const clearInsights = useCallback(() => {
		setInsightsSelected(false);
	}, []);
	const selectSectionWithSurface = useCallback((sectionId: WorkItemSectionId) => {
		if (sectionId === "insights") {
			setPendingSectionId(null);
			setInsightsSelected(true);
			scrollContainer?.scrollTo({ top: 0 });
			return;
		}
		setInsightsSelected(false);
		setPendingSectionId(sectionId);
	}, [scrollContainer]);

	useEffect(() => {
		if (insightsSelected || pendingSectionId == null) return;
		const frame = window.requestAnimationFrame(() => {
			selectSection(pendingSectionId);
			setPendingSectionId((current) => current === pendingSectionId ? null : current);
		});
		return () => window.cancelAnimationFrame(frame);
	}, [insightsSelected, pendingSectionId, selectSection]);

	const sectionElementId = useCallback(
		(sectionId: WorkItemSectionId) => workItemSectionElementId(instanceId, sectionId),
		[instanceId],
	);
	const sectionHeadingId = useCallback(
		(sectionId: WorkItemSectionId) => workItemSectionHeadingId(instanceId, sectionId),
		[instanceId],
	);

	const value = useMemo<SectionNavigationValue>(() => ({
		activityCount,
		activeSectionId: insightsSelected ? "insights" : activeId as WorkItemSectionId | null,
		clearInsights,
		insightsCount,
		insightsSelected,
		registerSection,
		scrollContainer,
		sectionElementId,
		sectionHeadingId,
		sections,
		selectSection: selectSectionWithSurface,
		setActivityCount,
		setInsightsCount,
		setNarrowScrollContainer,
		setSections,
		setWideScrollContainer,
	}), [activeId, activityCount, clearInsights, insightsCount, insightsSelected, registerSection, scrollContainer, sectionElementId, sectionHeadingId, sections, selectSectionWithSurface, setSections]);

	return <SectionNavigationContext value={value}>{children}</SectionNavigationContext>;
}

export function useSectionNavigation(): SectionNavigationValue {
	const value = use(SectionNavigationContext);
	if (!value) {
		throw new Error("useSectionNavigation must be used within a SectionNavigationProvider");
	}
	return value;
}

/**
 * Resolves the work-item header's discrete scroll state from the active wide or
 * narrow body scroller. `useSyncExternalStore` lets React skip re-renders while
 * scrolling within a state; only crossing the collapse threshold updates it.
 */
export function useWorkItemHeaderVariant(
	collapseOffset = DEFAULT_HEADER_COLLAPSE_OFFSET,
): WorkItemHeaderVariant {
	const { scrollContainer } = useSectionNavigation();
	const subscribe = useCallback((onStoreChange: () => void) => {
		if (!scrollContainer) return () => undefined;

		scrollContainer.addEventListener("scroll", onStoreChange, { passive: true });
		return () => scrollContainer.removeEventListener("scroll", onStoreChange);
	}, [scrollContainer]);
	const getSnapshot = useCallback(
		() => (scrollContainer?.scrollTop ?? 0) >= collapseOffset ? "compact" : "expanded",
		[collapseOffset, scrollContainer],
	);

	return useSyncExternalStore(subscribe, getSnapshot, () => "expanded");
}

/**
 * Publishes the tab list for whichever body is mounted. Kept as a hook so the
 * work-item and pull-request stacks declare their sections next to the markup
 * that renders them.
 */
export function usePublishSections(next: readonly WorkItemSectionTab[]): void {
	const { setSections } = useSectionNavigation();
	useEffect(() => {
		setSections(next);
	}, [next, setSections]);
}

/**
 * Publishes the Activity tab's count from whichever activity panel is mounted.
 * Keep the last value on unmount so leaving Insights does not blank the
 * tab number while Description/Activity remount.
 */
export function usePublishActivityCount(count: number): void {
	const { setActivityCount } = useSectionNavigation();
	useEffect(() => {
		setActivityCount(count);
	}, [count, setActivityCount]);
}

/**
 * Publishes the Insights tab's count from the same source the composer
 * "new insights" pill used. Zero hides the number; keep a positive value
 * on unmount so leaving Insights does not blank the tab.
 */
export function usePublishInsightsCount(count: number): void {
	const { setInsightsCount } = useSectionNavigation();
	useEffect(() => {
		setInsightsCount(count > 0 ? count : null);
	}, [count, setInsightsCount]);
}
