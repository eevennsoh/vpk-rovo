"use client";

import { useEffect, useRef, type ReactNode, type RefObject } from "react";

/** CSS custom properties published for sticky code-review chrome under the PR header. */
const PULL_REQUEST_DETAIL_HEADER_HEIGHT_VAR = "--pull-request-detail-header-height";
const PULL_REQUEST_DETAIL_SCROLLPORT_HEIGHT_VAR = "--pull-request-detail-scrollport-height";

interface PullRequestStickyHeaderShellProps {
	children: ReactNode;
	scrollContainerRef: RefObject<HTMLElement | null>;
}

/**
 * Sticky PR header wrapper that publishes measured header + scrollport heights
 * for Files-tab code-review sticky offsets.
 *
 * Files-tab code-review chrome uses the measured height to sit directly below
 * this header without leaving a blank clipping zone between the sticky layers.
 */
export function PullRequestStickyHeaderShell({
	children,
	scrollContainerRef,
}: Readonly<PullRequestStickyHeaderShellProps>) {
	const stickyHeaderRef = useRef<HTMLDivElement | null>(null);

	useEffect(() => {
		const header = stickyHeaderRef.current;
		const root = header?.closest<HTMLElement>("[data-jira-work-item-pull-request-detail]");
		if (!header || !root) return;

		const syncStickyMetrics = () => {
			root.style.setProperty(
				PULL_REQUEST_DETAIL_HEADER_HEIGHT_VAR,
				`${header.offsetHeight}px`,
			);
			const scrollport = scrollContainerRef.current;
			if (scrollport) {
				root.style.setProperty(
					PULL_REQUEST_DETAIL_SCROLLPORT_HEIGHT_VAR,
					`${scrollport.clientHeight}px`,
				);
			}
		};

		syncStickyMetrics();
		if (typeof ResizeObserver === "undefined") {
			return;
		}

		const observer = new ResizeObserver(syncStickyMetrics);
		observer.observe(header);
		const scrollport = scrollContainerRef.current;
		if (scrollport) {
			observer.observe(scrollport);
		}
		return () => observer.disconnect();
	}, [scrollContainerRef]);

	return (
		<div className="z-10 shrink-0 bg-surface @[860px]/agentlayout:sticky @[860px]/agentlayout:top-0" ref={stickyHeaderRef}>
			{children}
		</div>
	);
}
