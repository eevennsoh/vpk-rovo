/**
 * Scroll a kanban column so the bottom of an appended create group stays in
 * view — the last card's chin, not only its title.
 *
 * Aligning to the group's top (or to `scrollHeight` while the slot is still
 * height 0) leaves the growing card under the fold. Follow the last arriving
 * card's bottom as the slot expands. Gap drops must not call this.
 */

export interface CreatedCardRevealMetrics {
	readonly containerClientHeight: number;
	readonly containerScrollHeight: number;
	readonly containerScrollTop: number;
	readonly targetHeight: number;
	readonly targetOffsetTop: number;
}

const REVEAL_EPSILON_PX = 1;
const USER_SCROLL_AWAY_PX = 2;

export function getCreatedCardRevealScrollTop(
	metrics: CreatedCardRevealMetrics,
): number {
	const maxScroll = Math.max(0, metrics.containerScrollHeight - metrics.containerClientHeight);
	const targetBottom = metrics.targetOffsetTop + metrics.targetHeight;
	const visibleBottom = metrics.containerScrollTop + metrics.containerClientHeight;
	const fullyVisible = targetBottom <= visibleBottom + REVEAL_EPSILON_PX
		&& metrics.targetOffsetTop >= metrics.containerScrollTop - REVEAL_EPSILON_PX;

	if (fullyVisible) {
		return metrics.containerScrollTop;
	}

	return Math.max(0, Math.min(targetBottom - metrics.containerClientHeight, maxScroll));
}

export function shouldReleaseCreatedCardFollow(
	lastProgrammaticScrollTop: number,
	nextScrollTop: number,
	thresholdPx: number = USER_SCROLL_AWAY_PX,
): boolean {
	return nextScrollTop + thresholdPx < lastProgrammaticScrollTop;
}

export function readCreatedCardRevealMetrics(
	container: HTMLElement,
	target: HTMLElement,
): CreatedCardRevealMetrics {
	const containerRect = container.getBoundingClientRect();
	const targetRect = target.getBoundingClientRect();

	return {
		containerClientHeight: container.clientHeight,
		containerScrollHeight: container.scrollHeight,
		containerScrollTop: container.scrollTop,
		targetHeight: targetRect.height,
		targetOffsetTop: targetRect.top - containerRect.top + container.scrollTop,
	};
}

export function subscribeCreatedCardBottomReveal(
	container: HTMLElement,
	targets: readonly HTMLElement[],
): () => void {
	const lastTarget = targets.at(-1);
	if (lastTarget === undefined) {
		return () => {};
	}

	let released = false;
	let lastProgrammaticScrollTop = container.scrollTop;
	let frameId = 0;

	const reveal = () => {
		if (released) {
			return;
		}

		const nextTop = getCreatedCardRevealScrollTop(
			readCreatedCardRevealMetrics(container, lastTarget),
		);
		if (Math.abs(nextTop - container.scrollTop) <= REVEAL_EPSILON_PX) {
			lastProgrammaticScrollTop = container.scrollTop;
			return;
		}

		container.scrollTo({ behavior: "auto", top: nextTop });
		lastProgrammaticScrollTop = container.scrollTop;
	};

	const onScroll = () => {
		if (released) {
			return;
		}
		if (shouldReleaseCreatedCardFollow(lastProgrammaticScrollTop, container.scrollTop)) {
			released = true;
		}
	};

	container.addEventListener("scroll", onScroll, { passive: true });
	const observer = new ResizeObserver(reveal);
	observer.observe(container);
	for (const target of targets) {
		observer.observe(target);
	}
	reveal();
	frameId = window.requestAnimationFrame(reveal);

	return () => {
		released = true;
		window.cancelAnimationFrame(frameId);
		container.removeEventListener("scroll", onScroll);
		observer.disconnect();
	};
}
