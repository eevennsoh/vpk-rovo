/**
 * Seed guided-review progress when opening a PR.
 * Always starts unchecked — approval evidence lives on Approvers / merge state,
 * not as stale Guide chapter checkmarks (which would inflate Submit review's badge).
 */
export function resolveInitialReviewedChapterIds(
	_review?: { readonly chapters: readonly { readonly id: string }[] } | null,
	_approvalState?: "available" | "approved",
): ReadonlySet<string> {
	return new Set();
}
