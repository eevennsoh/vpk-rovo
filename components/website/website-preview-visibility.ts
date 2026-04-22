export const PREVIEW_LOAD_ROOT_MARGIN_PX = 400;

export function isPreviewWithinLoadRange(
	rect: Readonly<{ top: number; bottom: number }>,
	viewportHeight: number,
	rootMarginPx = PREVIEW_LOAD_ROOT_MARGIN_PX,
) {
	return rect.top < viewportHeight + rootMarginPx && rect.bottom > -rootMarginPx;
}
