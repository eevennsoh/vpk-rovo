import type { CSSProperties } from "react";

export const SCROLL_MASK_DEFAULT_FADE_SIZE = "var(--ds-space-400)";
export const SCROLL_MASK_DEFAULT_SCROLLBAR_WIDTH = "10px";

export interface ScrollMaskStyleOptions {
	fadeSize?: number | string;
	scrollbarWidth?: number | string;
}

type ScrollMaskCssProperties = CSSProperties & {
	"--scroll-mask-fade-size": string;
	"--scroll-mask-scrollbar-width": string;
};

function toCssLength(value: number | string): string {
	return typeof value === "number" ? `${value}px` : value;
}

export function buildScrollMaskStyle({
	fadeSize = SCROLL_MASK_DEFAULT_FADE_SIZE,
	scrollbarWidth = SCROLL_MASK_DEFAULT_SCROLLBAR_WIDTH,
}: ScrollMaskStyleOptions = {}): ScrollMaskCssProperties {
	const resolvedFadeSize = toCssLength(fadeSize);
	const resolvedScrollbarWidth = toCssLength(scrollbarWidth);
	const maskImage = [
		"linear-gradient(to bottom, transparent 0, black var(--scroll-mask-fade-size), black calc(100% - var(--scroll-mask-fade-size)), transparent 100%)",
		"linear-gradient(black, black)",
	].join(", ");
	const maskSize = `calc(100% - ${resolvedScrollbarWidth}) 100%, ${resolvedScrollbarWidth} 100%`;

	return {
		"--scroll-mask-fade-size": resolvedFadeSize,
		"--scroll-mask-scrollbar-width": resolvedScrollbarWidth,
		maskImage,
		WebkitMaskImage: maskImage,
		maskPosition: "0 0, 100% 0",
		WebkitMaskPosition: "0 0, 100% 0",
		maskRepeat: "no-repeat, no-repeat",
		WebkitMaskRepeat: "no-repeat, no-repeat",
		maskSize,
		WebkitMaskSize: maskSize,
	};
}
