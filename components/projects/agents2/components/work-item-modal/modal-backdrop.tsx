"use client";

import { token } from "@/lib/tokens";
import { useWorkItemModal } from "@/app/contexts/context-work-item-modal";

export function ModalBackdrop() {
	const { meta } = useWorkItemModal();

	return (
		<div
			onClick={meta.onClose}
			style={{
				position: "fixed",
				top: 0,
				left: 0,
				right: 0,
				bottom: 0,
				backgroundColor: token("color.blanket"),
				zIndex: 500,
			}}
		/>
	);
}
