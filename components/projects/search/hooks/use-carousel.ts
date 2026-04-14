"use client";

import { useRef, useCallback } from "react";

interface UseCarouselOptions {
	cardWidth: number;
	gap: number;
}

interface UseCarouselReturn {
	carouselRef: React.RefObject<HTMLDivElement | null>;
	scrollPrev: () => void;
	scrollNext: () => void;
}

/**
 * Hook for managing carousel scroll behavior
 */
export function useCarousel({ cardWidth, gap }: Readonly<UseCarouselOptions>): UseCarouselReturn {
	const carouselRef = useRef<HTMLDivElement>(null);

	const scrollPrev = useCallback((): void => {
		if (carouselRef.current) {
			const scrollAmount = cardWidth + gap;
			carouselRef.current.scrollBy({ left: -scrollAmount, behavior: "smooth" });
		}
	}, [cardWidth, gap]);

	const scrollNext = useCallback((): void => {
		if (carouselRef.current) {
			const scrollAmount = cardWidth + gap;
			carouselRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
		}
	}, [cardWidth, gap]);

	return {
		carouselRef,
		scrollPrev,
		scrollNext,
	};
}
