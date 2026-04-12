import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { clamp } from "@/lib/utils";

const COLLAPSE_THRESHOLD_OFFSET = 40;
const COLLAPSE_VISUAL_MIN_WIDTH = 80;

interface UseSidebarResizeOptions {
	defaultWidth: number;
	maxWidth: number;
	minWidth: number;
	onCollapse?: () => void;
}

interface UseSidebarResizeResult {
	isResizeHandleHovered: boolean;
	isResizing: boolean;
	onResizeHandleDoubleClick: (event: MouseEvent) => void;
	onResizeHandlePointerDown: (event: ReactPointerEvent) => void;
	onResizeHandlePointerEnter: () => void;
	onResizeHandlePointerLeave: () => void;
	sidebarWidth: number;
	willCollapse: boolean;
}

export function useSidebarResize({
	defaultWidth,
	maxWidth,
	minWidth,
	onCollapse,
}: UseSidebarResizeOptions): UseSidebarResizeResult {
	const [sidebarWidth, setSidebarWidth] = useState(defaultWidth);
	const [isResizing, setIsResizing] = useState(false);
	const [isResizeHandleHovered, setIsResizeHandleHovered] = useState(false);
	const [willCollapse, setWillCollapse] = useState(false);
	const startXRef = useRef(0);
	const startWidthRef = useRef(defaultWidth);
	const lastValidWidthRef = useRef(defaultWidth);
	const willCollapseRef = useRef(false);
	const collapseThreshold = minWidth - COLLAPSE_THRESHOLD_OFFSET;

	const onResizeHandlePointerEnter = useCallback(() => {
		setIsResizeHandleHovered(true);
	}, []);

	const onResizeHandlePointerLeave = useCallback(() => {
		setIsResizeHandleHovered(false);
	}, []);

	const onResizeHandleDoubleClick = useCallback(
		(event: MouseEvent) => {
			event.preventDefault();
			event.stopPropagation();
			setSidebarWidth(defaultWidth);
			lastValidWidthRef.current = defaultWidth;
			willCollapseRef.current = false;
			setWillCollapse(false);
		},
		[defaultWidth],
	);

	const onResizeHandlePointerDown = useCallback(
		(event: ReactPointerEvent) => {
			event.preventDefault();
			startXRef.current = event.clientX;
			startWidthRef.current = sidebarWidth;
			willCollapseRef.current = false;
			setWillCollapse(false);
			setIsResizing(true);
			(event.target as HTMLElement).setPointerCapture(event.pointerId);
		},
		[sidebarWidth],
	);

	useEffect(() => {
		if (!isResizing) {
			return;
		}

		const handlePointerMove = (event: PointerEvent) => {
			const delta = event.clientX - startXRef.current;
			const rawWidth = startWidthRef.current + delta;
			const shouldCollapse = rawWidth < collapseThreshold;
			willCollapseRef.current = shouldCollapse;
			setWillCollapse(shouldCollapse);

			if (shouldCollapse) {
				setSidebarWidth(Math.max(rawWidth, COLLAPSE_VISUAL_MIN_WIDTH));
			} else {
				setSidebarWidth(clamp(rawWidth, minWidth, maxWidth));
			}
		};

		const handlePointerUp = (event: PointerEvent) => {
			if (willCollapseRef.current && onCollapse) {
				setSidebarWidth(lastValidWidthRef.current);
				onCollapse();
			} else {
				const finalDelta = event.clientX - startXRef.current;
				const finalWidth = clamp(startWidthRef.current + finalDelta, minWidth, maxWidth);
				lastValidWidthRef.current = finalWidth;
				setSidebarWidth(finalWidth);
			}
			willCollapseRef.current = false;
			setWillCollapse(false);
			setIsResizing(false);
		};

		document.addEventListener("pointermove", handlePointerMove);
		document.addEventListener("pointerup", handlePointerUp);
		return () => {
			document.removeEventListener("pointermove", handlePointerMove);
			document.removeEventListener("pointerup", handlePointerUp);
		};
	}, [collapseThreshold, isResizing, maxWidth, minWidth, onCollapse]);

	useEffect(() => {
		if (!isResizing && sidebarWidth >= minWidth) {
			lastValidWidthRef.current = sidebarWidth;
		}
	}, [isResizing, minWidth, sidebarWidth]);

	return {
		isResizeHandleHovered,
		isResizing,
		onResizeHandleDoubleClick,
		onResizeHandlePointerDown,
		onResizeHandlePointerEnter,
		onResizeHandlePointerLeave,
		sidebarWidth,
		willCollapse,
	};
}
