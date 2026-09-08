"use client";

import { useEffect, useRef, useState } from "react";

import type {
	JiraSessionFlyoutHandle,
	JiraSessionFlyoutSurfaceProps,
} from "@/components/blocks/product-sidebar/variants/jira-session-flyout";

type Point = { x: number; y: number };
const HOVER_INTENT_GRACE_MS = 300;

/** The cone ends at the popup's near edge and works for either collision-resolved side. */
function isHeadingIntoPopup(origin: Point, point: Point, popup: DOMRect): boolean {
	const edge = popup.left > origin.x ? popup.left : popup.right;
	const distance = edge - origin.x;
	const progress = (point.x - origin.x) / distance;
	if (distance === 0 || progress <= 0 || progress > 1) return false;
	const top = origin.y + (popup.top - 4 - origin.y) * progress;
	const bottom = origin.y + (popup.bottom + 4 - origin.y) * progress;
	return point.y >= top && point.y <= bottom;
}

/** Base UI keeps a popup open on exit; this guards switching between dense sibling triggers. */
export function useAgentSessionRailHoverIntent(handle: JiraSessionFlyoutHandle) {
	const popupRef = useRef<HTMLDivElement>(null);
	const activeTrigger = useRef<Element | null>(null);
	const origin = useRef<Point | null>(null);
	const pending = useRef<Element | null>(null);
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const [activeItemId, setActiveItemId] = useState<string | null>(null);

	function clearPending() {
		if (timeout.current !== null) clearTimeout(timeout.current);
		timeout.current = null;
		pending.current = null;
	}

	useEffect(() => {
		function trackPointer(event: MouseEvent) {
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (popupRef.current?.contains(target)) {
				clearPending();
				origin.current = null;
				return;
			}
			if (activeTrigger.current?.contains(target)) {
				clearPending();
				origin.current = { x: event.clientX, y: event.clientY };
				return;
			}
			const candidate = pending.current;
			if (!candidate) return;
			const popup = popupRef.current?.getBoundingClientRect();
			if (origin.current && popup && isHeadingIntoPopup(origin.current, { x: event.clientX, y: event.clientY }, popup)) return;
			clearPending();
			if (candidate.contains(target)) handle.open(candidate.id);
			else handle.close();
		}
		document.addEventListener("mousemove", trackPointer);
		return () => {
			document.removeEventListener("mousemove", trackPointer);
			clearPending();
		};
	}, [handle]);

	const onOpenChange: NonNullable<JiraSessionFlyoutSurfaceProps["onOpenChange"]> = (open, details) => {
		const trigger = details.trigger;
		if (open && trigger && trigger !== activeTrigger.current && details.reason === "trigger-hover") {
			const popup = popupRef.current?.getBoundingClientRect();
			const point = { x: details.event.clientX, y: details.event.clientY };
			if (handle.isOpen && origin.current && popup && isHeadingIntoPopup(origin.current, point, popup)) {
				details.cancel();
				pending.current = trigger;
				// A stationary pointer over another row means interest in that row.
				// Keep one deadline across multiple crossed rows, rather than extending it.
				if (timeout.current === null) {
					timeout.current = setTimeout(() => {
						const candidate = pending.current;
						clearPending();
						if (candidate?.isConnected && candidate.matches(":hover")) handle.open(candidate.id);
					}, HOVER_INTENT_GRACE_MS);
				}
				return;
			}
		}
		clearPending();
		activeTrigger.current = open ? trigger ?? null : null;
		origin.current = open && details.reason === "trigger-hover"
			? { x: details.event.clientX, y: details.event.clientY }
			: null;
		setActiveItemId(open ? trigger?.getAttribute("data-session-id") ?? null : null);
	};

	return { activeItemId, onOpenChange, popupRef };
}
