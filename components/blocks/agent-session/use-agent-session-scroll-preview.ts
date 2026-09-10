"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
	JiraSessionFlyoutHandle,
	JiraSessionFlyoutSurfaceProps,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";

interface ScrollPreview {
	port: HTMLElement;
	scrollTop: number;
	scrolled: boolean;
}

/** Keep the current column preview readable as rows pass a stationary pointer. */
export function useAgentSessionScrollPreview(handle: JiraSessionFlyoutHandle) {
	const popupRef = useRef<HTMLDivElement>(null);
	const preview = useRef<ScrollPreview | null>(null);
	const [anchor, setAnchor] = useState<JiraSessionFlyoutSurfaceProps["anchor"]>();

	const anchorToTrigger = useCallback((trigger: Element | undefined) => {
		const port = trigger?.closest<HTMLElement>("[data-agent-session-column-scrollport]");
		if (!port || !trigger) {
			preview.current = null;
			setAnchor(undefined);
			return;
		}
		const rect = trigger.getBoundingClientRect();
		preview.current = { port, scrollTop: port.scrollTop, scrolled: false };
		// Base UI still owns collision handling; only the reference rectangle is
		// stable. No per-scroll React render or moving-row hover work is needed.
		setAnchor({ getBoundingClientRect: () => rect });
	}, []);

	useEffect(() => {
		function resumePointer(event: PointerEvent) {
			const active = preview.current;
			if (!active || (!active.scrolled && active.port.scrollTop === active.scrollTop)) return;
			const target = event.target;
			if (!(target instanceof Element) || popupRef.current?.contains(target)) return;
			const trigger = target.closest<HTMLElement>('[data-slot="hover-card-trigger"]');
			if (trigger && active.port.contains(trigger)) {
				anchorToTrigger(trigger);
				handle.open(trigger.id);
			} else {
				handle.close();
			}
		}
		function dismissOnResize() {
			if (preview.current) handle.close();
		}
		function trackScroll(event: Event) {
			if (preview.current?.port === event.target) preview.current.scrolled = true;
		}
		document.addEventListener("pointermove", resumePointer, true);
		document.addEventListener("scroll", trackScroll, true);
		window.addEventListener("resize", dismissOnResize);
		return () => {
			document.removeEventListener("pointermove", resumePointer, true);
			document.removeEventListener("scroll", trackScroll, true);
			window.removeEventListener("resize", dismissOnResize);
		};
	}, [anchorToTrigger, handle]);

	const onOpenChange: NonNullable<JiraSessionFlyoutSurfaceProps["onOpenChange"]> = (open, details) => {
		const active = preview.current;
		if (details.reason === "trigger-hover" && active && (active.scrolled || active.port.scrollTop !== active.scrollTop)) {
			// Scroll-induced leave/enter events are not a request to change sessions.
			details.cancel();
			return;
		}
		anchorToTrigger(open ? details.trigger : undefined);
	};

	return { anchor, onOpenChange, popupRef, positionMethod: anchor ? "fixed" as const : undefined };
}
