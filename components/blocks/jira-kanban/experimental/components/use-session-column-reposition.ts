"use client";

import { useEffect, useLayoutEffect, useRef, type KeyboardEvent, type PointerEvent, type RefObject } from "react";

import { useSessionColumnPlacement } from "./session-column-placement";

const SESSION_COLUMN_GAP_PROXIMITY_RANGE_PX = 120;

interface ColumnDrag {
	pointerId: number;
	startX: number;
	x: number;
	startLeft: number;
	active: boolean;
	preview: number;
	highlightedIndex: number | null;
	frame: number;
	element: HTMLDivElement;
	captureElement: HTMLElement;
	centers: number[];
	scrollLeft: number;
	scrollport: HTMLElement;
}

function revealSlot(rootRef: RefObject<HTMLDivElement | null>) {
	requestAnimationFrame(() => {
		rootRef.current?.querySelector<HTMLElement>("[data-session-column-slot]")?.scrollIntoView({ block: "nearest", inline: "nearest" });
	});
}

/** Moves the existing surface; the session list is never cloned or remounted. */
export function useSessionColumnReposition({ hostRef, width, onStart, disabled }: Readonly<{
	hostRef: RefObject<HTMLDivElement | null>;
	width: number;
	onStart: () => void;
	disabled: boolean;
}>) {
	const placement = useSessionColumnPlacement();
	const drag = useRef<ColumnDrag | null>(null);
	const suppressClick = useRef(false);
	const shifted = placement !== null && placement.index > 0;
	const setWidth = placement?.setWidth;
	const setPreview = placement?.setPreview;
	const setHighlightedIndex = placement?.setHighlightedIndex;

	useLayoutEffect(() => {
		setWidth?.(width);
	}, [setWidth, width]);

	useLayoutEffect(() => {
		const root = placement?.rootRef.current;
		const host = hostRef.current;
		if (!host) return;
		if (!root) {
			host.style.transform = "";
			host.style.clipPath = "";
			return;
		}
		const sync = () => {
			if (drag.current?.active) return;
			const slot = root.querySelector<HTMLElement>("[data-session-column-slot]");
			if (!shifted || !slot) {
				host.style.transform = "";
				host.style.clipPath = "";
				return;
			}
			const rootBox = root.getBoundingClientRect();
			const slotBox = slot.getBoundingClientRect();
			// Surface translates 24px and owns a 2px leading border; status content
			// begins 6px inside its slot. Keep their painted leading edges aligned.
			const left = slotBox.left - rootBox.left - 20;
			host.style.transform = `translateX(${left}px)`;
			const scrollport = root.querySelector<HTMLElement>("[data-jira-kanban-scrollport]");
			if (scrollport) {
				const box = scrollport.getBoundingClientRect();
				const hostLeft = rootBox.left + left;
				host.style.clipPath = `inset(-8px ${Math.max(0, hostLeft + width + 42 - box.right)}px -8px ${Math.max(0, box.left - hostLeft)}px)`;
			}
		};
		sync();
		const observer = new ResizeObserver(sync);
		observer.observe(root);
		const slot = root.querySelector("[data-session-column-slot]");
		if (slot) observer.observe(slot);
		root.addEventListener("scroll", sync, true);
		return () => {
			observer.disconnect();
			root.removeEventListener("scroll", sync, true);
		};
	}, [hostRef, placement?.index, placement?.preview, placement?.rootRef, shifted, width]);

	useEffect(() => () => {
		if (drag.current) {
			cancelAnimationFrame(drag.current.frame);
			drag.current = null;
			setPreview?.(null);
			setHighlightedIndex?.(null);
		}
	}, [setPreview, setHighlightedIndex]);

	const finish = (commit: boolean) => {
		const current = drag.current;
		if (!current || !placement) return;
		cancelAnimationFrame(current.frame);
		drag.current = null;
		if (current.captureElement.hasPointerCapture(current.pointerId)) current.captureElement.releasePointerCapture(current.pointerId);
		if (current.active) {
			suppressClick.current = true;
			current.element.style.transform = `translateX(${current.startLeft}px)`;
			placement.move(commit ? current.preview : placement.index);
			if (commit && current.preview > 0) revealSlot(placement.rootRef);
		}
	};

	const onPointerDownCapture = (event: PointerEvent<HTMLDivElement>) => {
		if (!placement || disabled || event.button !== 0 || !event.isPrimary) return;
		const target = event.target as HTMLElement;
		if (!target.closest("[data-agent-session-column-header]")) return;
		// The expand button doubles as a compact drag handle; other header actions
		// (filters, selection, menus) retain their existing interactions.
		const control = target.closest("button, a, input, [role=separator]");
		if (control && !control.hasAttribute("data-session-column-move-handle") && !control.getAttribute("aria-label")?.startsWith("Expand")) return;
		const root = placement.rootRef.current;
		const scrollport = root?.querySelector<HTMLElement>("[data-jira-kanban-scrollport]");
		if (!root || !scrollport) return;
		const element = event.currentTarget;
		const captureElement = (control ?? target.closest("[data-agent-session-column-header]")) as HTMLElement;
		captureElement.setPointerCapture(event.pointerId);
		suppressClick.current = false;
		drag.current = {
			pointerId: event.pointerId,
			startX: event.clientX,
			x: event.clientX,
			startLeft: element.getBoundingClientRect().left - root.getBoundingClientRect().left,
			active: false,
			preview: placement.index,
			highlightedIndex: null,
			frame: 0,
			element,
			captureElement,
			centers: [...scrollport.querySelectorAll<HTMLElement>("[data-jira-kanban-column]")].map((column) => {
				const box = column.getBoundingClientRect();
				return box.left + box.width / 2;
			}),
			scrollLeft: scrollport.scrollLeft,
			scrollport,
		};
	};

	const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
		const current = drag.current;
		if (!current || !placement || current.pointerId !== event.pointerId) return;
		current.x = event.clientX;
		if (!current.active && Math.abs(current.x - current.startX) < 6) return;
		event.preventDefault();
		if (current.active) return;
		current.active = true;
		const firstColumn = current.scrollport.querySelector<HTMLElement>("[data-jira-kanban-column]");
		const firstCard = firstColumn?.querySelector<HTMLElement>("article");
		if (firstColumn && firstCard) {
			placement.rootRef.current?.style.setProperty(
				"--session-column-marker-top",
				`${Math.max(0, firstCard.getBoundingClientRect().top - firstColumn.getBoundingClientRect().top)}px`,
			);
		}
		placement.setPreview(current.preview);
		placement.setHighlightedIndex(null);
		onStart();
		const track = () => {
			if (drag.current !== current) return;
			current.element.style.transform = `translateX(${current.startLeft + current.x - current.startX}px)`;
			current.element.style.clipPath = "";
			const box = current.scrollport.getBoundingClientRect();
			const scroll = current.x > box.right - 40 ? 12 : current.x < box.left + 40 ? -12 : 0;
			if (scroll) current.scrollport.scrollLeft += scroll;
			const offset = current.scrollport.scrollLeft - current.scrollLeft;
			const next = current.centers.filter((center) => current.x > center - offset).length;
			if (next !== current.preview) {
				current.preview = next;
				placement.setPreview(next);
			}
			const marker = placement.rootRef.current?.querySelector<HTMLElement>(`[data-session-column-drop-marker="${next}"]`);
			const highlightedIndex = marker
				&& Math.abs(current.x - marker.getBoundingClientRect().left) <= SESSION_COLUMN_GAP_PROXIMITY_RANGE_PX
				? next
				: null;
			if (highlightedIndex !== current.highlightedIndex) {
				current.highlightedIndex = highlightedIndex;
				placement.setHighlightedIndex(highlightedIndex);
			}
			current.frame = requestAnimationFrame(track);
		};
		track();
	};

	const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
		if (event.key === "Escape" && drag.current) {
			event.preventDefault();
			event.stopPropagation();
			finish(false);
			return;
		}
		if (!placement || disabled || !(event.target as HTMLElement).closest("[data-agent-session-column-header]")) return;
		const isMoveHandle = (event.target as HTMLElement).closest("[data-session-column-move-handle]");
		if (!isMoveHandle && !event.altKey) return;
		const next = event.key === "ArrowLeft" ? placement.index - 1
			: event.key === "ArrowRight" ? placement.index + 1
				: event.key === "Home" ? 0 : event.key === "End" ? placement.titles.length : null;
		if (next === null) return;
		event.preventDefault();
		event.stopPropagation();
		onStart();
		placement.move(next);
		if (next > 0) revealSlot(placement.rootRef);
	};

	return {
		enabled: placement !== null && !disabled,
		shifted,
		dragging: placement?.preview !== null && placement?.preview !== undefined,
		bindings: {
			onPointerDownCapture,
			onPointerMove,
			onPointerUp: () => finish(true),
			onPointerCancel: () => finish(false),
			onLostPointerCapture: () => finish(false),
			onKeyDownCapture,
			onClickCapture: (event: React.MouseEvent<HTMLDivElement>) => {
				if (!suppressClick.current) return;
				suppressClick.current = false;
				event.preventDefault();
				event.stopPropagation();
			},
		},
	};
}
