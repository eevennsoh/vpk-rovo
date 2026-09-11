"use client";

import { useCallback, useRef } from "react";
import type { HoverCardProps } from "@/components/ui/hover-card";

/** A portalled artifact preview must outlive a hover-close request from its parent. */
export function useConeFamily(
	handle: { close: () => void },
	onOpenChange: HoverCardProps["onOpenChange"],
) {
	const previews = useRef(new Set<string>());
	const popupRef = useRef<HTMLDivElement | null>(null);
	const triggerRef = useRef<Element | null>(null);
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
			&& !triggerRef.current?.matches(":hover, :focus-within")) {
			handle.close();
		}
	}, [handle]);
	const handleOpenChange: NonNullable<HoverCardProps["onOpenChange"]> = (open, details) => {
		if (!open && details.reason === "trigger-hover" && previews.current.size > 0) {
			details.cancel();
			return;
		}
		onOpenChange?.(open, details);
		if (!details.isCanceled) {
			triggerRef.current = open ? details.trigger ?? null : null;
			previews.current.clear();
		}
	};
	return { popupRef, onOpenChange: handleOpenChange, onPreviewOpenChange };
}
