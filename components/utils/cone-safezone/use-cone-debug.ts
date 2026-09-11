"use client";

import { useEffect } from "react";
import type { ConePolygon } from "./geometry";

/** Drawing has its own lifetime; it must not depend on a pending hover dismissal. */
export function useConeDebug(
	open: boolean,
	getCone: () => ConePolygon | null,
	onChange?: (cone: ConePolygon | null) => void,
) {
	useEffect(() => {
		if (!open || !onChange) return;
		let frame = 0;
		let previous: string | undefined;
		function draw() {
			const cone = getCone();
			const signature = cone?.map(({ x, y }) => `${x},${y}`).join(" ") ?? "";
			// Follow pointer and popup positioning at most once per frame. A parked
			// cursor keeps its cone without repeatedly rendering unchanged geometry.
			if (signature !== previous) {
				previous = signature;
				onChange?.(cone);
			}
			frame = requestAnimationFrame(draw);
		}
		frame = requestAnimationFrame(draw);
		return () => cancelAnimationFrame(frame);
	}, [open, getCone, onChange]);
}
