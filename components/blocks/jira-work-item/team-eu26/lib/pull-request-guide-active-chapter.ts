/**
 * Guided-review chapter jump + scroll-spy helpers.
 * Active highlight follows chapter tops past the sticky activation line, not
 * IntersectionObserver ratios (tall middle chapters otherwise steal the last one).
 */

export const CHAPTER_SCROLL_GAP_PX = 24;
/** Hold the clicked chapter while smooth scroll settles before spy resumes. */
export const CHAPTER_SCROLL_LOCK_MS = 600;
/** Treat near-max scroll as the last chapter so short tails can still win. */
export const CHAPTER_BOTTOM_SNAP_PX = 2;

/**
 * Lowest bottom edge among the sticky elements matching `selector` inside the
 * scrollport, falling back to the scrollport's own top when none are present.
 *
 * Takes the max rather than the first match: a stacked page can pin more than
 * one sticky band (in narrow mode the section nav and the pull-request detail
 * header are both inside the scrollport), and `querySelector` would return
 * whichever comes first in DOM order — under-measuring the activation line.
 * Identical to the single-match behaviour for zero or one hit.
 */
export function resolveStickyHeaderBottom(
	scrollContainer: HTMLElement,
	selector: string,
): number {
	const scrollContainerTop = scrollContainer.getBoundingClientRect().top;
	let stickyHeaderBottom = scrollContainerTop;
	for (const element of scrollContainer.querySelectorAll<HTMLElement>(selector)) {
		stickyHeaderBottom = Math.max(stickyHeaderBottom, element.getBoundingClientRect().bottom);
	}
	return stickyHeaderBottom;
}

export function buildChapterJumpTarget(
	scrollContainer: HTMLElement,
	chapterElement: HTMLElement,
	stickyHeaderSelector = "[data-jira-work-item-pull-request-detail-header]",
): number {
	const chapterRect = chapterElement.getBoundingClientRect();
	const stickyHeaderBottom = resolveStickyHeaderBottom(scrollContainer, stickyHeaderSelector);
	// Element scrolling floors fractional targets in Chromium. Round toward the
	// section so it cannot settle a subpixel below the spy's activation line.
	const targetTop = Math.ceil(
		scrollContainer.scrollTop +
		(chapterRect.top - stickyHeaderBottom) -
		CHAPTER_SCROLL_GAP_PX,
	);

	return Math.max(
		0,
		Math.min(targetTop, scrollContainer.scrollHeight - scrollContainer.clientHeight),
	);
}

export function getChapterContentTop(
	scrollContainer: HTMLElement,
	chapterElement: HTMLElement,
): number {
	const scrollContainerRect = scrollContainer.getBoundingClientRect();
	const chapterRect = chapterElement.getBoundingClientRect();
	return scrollContainer.scrollTop + (chapterRect.top - scrollContainerRect.top);
}

function areResolvedChapterTopsReady(tops: readonly (number | null)[]): boolean {
	if (tops.length === 0) return false;
	for (const top of tops) {
		if (top == null) return false;
	}
	// Before layout settles, every section can report the same top (often 0).
	// Treating that as "all crossed" would incorrectly select the last chapter.
	if (tops.length > 1 && tops.every((top) => top === tops[0])) {
		return false;
	}
	for (let index = 1; index < tops.length; index += 1) {
		const previous = tops[index - 1];
		const current = tops[index];
		if (previous == null || current == null || current < previous) {
			return false;
		}
	}
	return true;
}

export function areChapterTopsReady(
	chapterIds: readonly string[],
	getChapterTop: (chapterId: string) => number | null,
): boolean {
	return areResolvedChapterTopsReady(chapterIds.map(getChapterTop));
}

export function resolveActiveChapterId(options: {
	activationOffset: number;
	chapterIds: readonly string[];
	getChapterTop: (chapterId: string) => number | null;
	maxScrollTop: number;
	scrollTop: number;
}): string | null {
	const { activationOffset, chapterIds, getChapterTop, maxScrollTop, scrollTop } = options;
	if (chapterIds.length === 0) return null;
	const chapterTops = chapterIds.map(getChapterTop);
	if (!areResolvedChapterTopsReady(chapterTops)) {
		return chapterIds[0] ?? null;
	}

	const lastChapterId = chapterIds[chapterIds.length - 1] ?? null;
	// Require real scroll range so a near-empty first paint cannot snap to the last chapter.
	if (
		lastChapterId &&
		maxScrollTop > CHAPTER_BOTTOM_SNAP_PX &&
		scrollTop >= maxScrollTop - CHAPTER_BOTTOM_SNAP_PX
	) {
		return lastChapterId;
	}

	let activeId = chapterIds[0] ?? null;
	for (const [index, chapterId] of chapterIds.entries()) {
		const top = chapterTops[index];
		if (top == null) continue;
		if (top - scrollTop <= activationOffset) {
			activeId = chapterId;
			continue;
		}
		break;
	}

	return activeId;
}
