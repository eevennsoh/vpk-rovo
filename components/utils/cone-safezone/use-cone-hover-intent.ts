"use client";

import { useCallback, useEffect, useRef } from "react";
import { useDirection } from "@base-ui/react/direction-provider";

import type { HoverCardProps } from "@/components/ui/hover-card";
import { getConePolygon, isHeadingIntoPopup, resolveConeSide, type ConePolygon, type HoverPoint, type HoverSide } from "./geometry";

/** Extend Base UI's short, speed-sensitive cone without changing other dismissals. */
export function useConeHoverIntent(
	open: boolean,
	onOpenChange: NonNullable<HoverCardProps["onOpenChange"]>,
	onClose: () => void,
	graceMs: number,
	getActiveTrigger: () => Element | null,
) {
	const direction = useDirection();
	const popupRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<Element | null>(null);
	const origin = useRef<HoverPoint | null>(null);
	const travellingFrom = useRef<"trigger" | "popup">("trigger");
	const pointer = useRef<HoverPoint | null>(null);
	const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
	const onCloseRef = useRef(onClose);
	useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
	const getTrigger = useCallback(() => getActiveTrigger() ?? triggerRef.current, [getActiveTrigger]);

	const clearPending = useCallback(() => {
		if (timeout.current !== null) clearTimeout(timeout.current);
		timeout.current = null;
	}, []);

	const getGeometry = useCallback((point: HoverPoint | null): { origin: HoverPoint; destination: DOMRect; side: HoverSide } | null => {
		const popup = popupRef.current;
		let side = resolveConeSide(popup?.dataset.side, direction);
		if (!popup || !point) return null;
		let destination = popup.getBoundingClientRect();
		if (travellingFrom.current === "popup") {
			const trigger = getTrigger();
			const parent = trigger?.closest('[data-slot="hover-card-content"]') ?? trigger;
			if (!parent) return null;
			destination = parent.getBoundingClientRect();
			const { x, y } = point;
			// The nested card can overlap the parent's x-range while sitting below it.
			// Approach the nearer-facing axis of the actual parent rectangle.
			const dx = Math.max(destination.left - x, x - destination.right, 0);
			const dy = Math.max(destination.top - y, y - destination.bottom, 0);
			side = dy > dx
				? (y < destination.top ? "bottom" : "top")
				: (x < destination.left ? "right" : "left");
		}
		if (side !== "left" && side !== "right" && side !== "top" && side !== "bottom") return null;
		return { origin: point, destination, side };
	}, [direction, getTrigger]);

	const isInCone = useCallback(() => {
		const geometry = getGeometry(origin.current);
		return geometry !== null && pointer.current !== null
			? isHeadingIntoPopup(geometry.origin, pointer.current, geometry.destination, geometry.side)
			: false;
	}, [getGeometry]);

	const getDebugCone = useCallback((): ConePolygon | null => {
		const trigger = getTrigger()?.getBoundingClientRect();
		const point = pointer.current ?? (trigger ? { x: trigger.left + trigger.width / 2, y: trigger.top + trigger.height / 2 } : null);
		const geometry = getGeometry(point);
		return geometry ? getConePolygon(geometry.origin, geometry.destination, geometry.side) : null;
	}, [getGeometry, getTrigger]);

	const deferClose = useCallback(() => {
		clearPending();
		timeout.current = setTimeout(() => {
			clearPending();
			onCloseRef.current();
		}, graceMs);
	}, [clearPending, graceMs]);

	useEffect(() => {
		if (!open) return;
		const doc = popupRef.current?.ownerDocument ?? document;
		function trackPointer(event: MouseEvent) {
			pointer.current = { x: event.clientX, y: event.clientY };
			const target = event.target;
			if (!(target instanceof Node)) return;
			if (getTrigger()?.contains(target)) {
				origin.current = pointer.current;
				travellingFrom.current = "trigger";
				clearPending();
			} else if (popupRef.current?.contains(target)) {
				origin.current = pointer.current;
				travellingFrom.current = "popup";
				clearPending();
			} else if (timeout.current !== null) {
				if (event.buttons === 0 && isInCone()) deferClose();
				else {
					clearPending();
					onCloseRef.current();
				}
			}
		}
		function cancelIntent() {
			origin.current = null;
			clearPending();
		}
		// Capture the current point before Base UI processes its hover close timer.
		doc.addEventListener("mousemove", trackPointer, true);
		doc.addEventListener("pointerdown", cancelIntent, true);
		return () => {
			doc.removeEventListener("mousemove", trackPointer, true);
			doc.removeEventListener("pointerdown", cancelIntent, true);
			cancelIntent();
		};
	}, [open, clearPending, deferClose, isInCone, getTrigger]);

	const handleOpenChange: NonNullable<HoverCardProps["onOpenChange"]> = (nextOpen, details) => {
		if (!nextOpen && details.reason === "trigger-hover" && isInCone()) {
			details.cancel();
			deferClose();
			return;
		}
		onOpenChange(nextOpen, details);
		if (details.isCanceled) return;
		clearPending();
		triggerRef.current = nextOpen ? details.trigger ?? null : null;
		travellingFrom.current = "trigger";
		origin.current = nextOpen && details.reason === "trigger-hover"
			? { x: details.event.clientX, y: details.event.clientY }
			: null;
		pointer.current = origin.current;
	};

	return { onOpenChange: handleOpenChange, popupRef, getDebugCone };
}
