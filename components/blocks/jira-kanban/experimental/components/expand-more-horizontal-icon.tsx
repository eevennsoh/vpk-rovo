import GrowHorizontalIcon from "@atlaskit/icon/core/grow-horizontal";

/** Extends the existing grow glyph with boundaries for the full-column step. */
export function ExpandMoreHorizontalIcon() {
	return (
		<span aria-hidden="true" className="relative inline-flex size-4 items-center justify-center text-icon-subtle">
			<span className="scale-75"><GrowHorizontalIcon label="" /></span>
			<svg className="absolute inset-0" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
				<path d="M0 1h1.5v14H0zM14.5 1H16v14h-1.5z" />
			</svg>
		</span>
	);
}
