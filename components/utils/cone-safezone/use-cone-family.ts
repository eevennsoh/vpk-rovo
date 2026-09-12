"use client";

import { useCallback, useRef } from "react";
import type { HoverCardProps } from "@/components/ui/hover-card";

/** A portalled artifact preview must outlive a hover-close request from its parent. */
export function useConeFamily(
	handle: { close: () => void },
	onOpenChange: HoverCardProps["onOpenChange"],
	onOpenChangeComplete: HoverCardProps["onOpenChangeComplete"],
	getActiveTrigger: () => Element | null,
) {
	const previews = useRef(new Set<string>());
	const popupRef = useRef<HTMLDivElement | null>(null);
	const triggerRef = useRef<Element | null>(null);
	const pendingFocusTrigger = useRef<HTMLElement | null>(null);
	const onPreviewOpenChange = useCallback((id: string, open: boolean) => {
		if (open) {
			previews.current.add(id);
			return;
		}
		if (!previews.current.delete(id)) return;
		// A controlled child close does not emit Base UI's internal floating.closed
		// event. Reconcile against actual DOM hover (React portals bubble enter/leave).
		if (previews.current.size === 0
			&& !popupRef.current?.matches(":hover, :focus-within")
			&& !(getActiveTrigger() ?? triggerRef.current)?.matches(":hover, :focus-within")) {
			handle.close();
		}
	}, [handle, getActiveTrigger]);
	const handleOpenChange: NonNullable<HoverCardProps["onOpenChange"]> = (open, details) => {
		if (!open && details.reason === "trigger-hover" && previews.current.size > 0) {
			details.cancel();
			return;
		}
		const activeElement = document.activeElement;
		const activeTrigger = getActiveTrigger() ?? triggerRef.current;
		const shouldRestoreFocus = !open && details.reason === "escape-key"
			&& activeElement instanceof HTMLElement
			&& popupRef.current?.contains(activeElement)
			&& activeTrigger instanceof HTMLElement;
		onOpenChange?.(open, details);
		if (!details.isCanceled) {
			pendingFocusTrigger.current = shouldRestoreFocus ? activeTrigger : null;
			triggerRef.current = open ? details.trigger ?? null : null;
			previews.current.clear();
		}
	};
	const handleOpenChangeComplete = useCallback((open: boolean) => {
		onOpenChangeComplete?.(open);
		if (open) return;
		const trigger = pendingFocusTrigger.current;
		pendingFocusTrigger.current = null;
		window.requestAnimationFrame(() => {
			if (document.activeElement === document.body && trigger?.isConnected) trigger.focus();
		});
	}, [onOpenChangeComplete]);
	return { popupRef, onOpenChange: handleOpenChange, onOpenChangeComplete: handleOpenChangeComplete, onPreviewOpenChange };
}
