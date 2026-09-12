import type { ReactNode, RefObject } from "react";
import type { HTMLMotionProps } from "motion/react";

export type PullRequestHeaderStatus = "Open" | "Merged";
export type PullRequestHeaderVariant = "expanded" | "compact";
/** Controls the Merge split-button primary label in the title-row action group. */
export type PullRequestHeaderMergeState =
	| "checks-failed"
	| "checks-running"
	| "merge-conflicts"
	| "review-required"
	| "ready";
/** Merge strategy selected in the merge options chevron menu. */
export type PullRequestHeaderMergeMethod = "squash" | "merge" | "rebase";

/**
 * Optional Submit review control rendered after the merge split button.
 * Hosts (guided PR detail) supply this when a review composer can open.
 */
export interface PullRequestHeaderSubmitReviewAction {
	ariaLabel: string;
	/** Checked chapters + inline comments; rendered as an end-slot Badge when set. */
	badge?: string;
	disabled?: boolean;
	label: string;
	onClick: () => void;
}

export interface PullRequestHeaderProps
	extends Omit<HTMLMotionProps<"header">, "children"> {
	/** Controlled presentation. Overrides scroll-driven collapse when provided. */
	variant?: PullRequestHeaderVariant;
	/** Scrollable element that automatically collapses the header when scrolled. */
	scrollContainerRef?: RefObject<HTMLElement | null>;
	/** Scroll distance in pixels before the header collapses. Defaults to 16. */
	collapseOffset?: number;
	/**
	 * Tab navigation rendered on the header's bottom edge. Keep the matching
	 * Tabs root outside this component so its panels can remain beside it.
	 */
	tabNavigation?: ReactNode;
	/** Pull request number shown as subtle `#N` before the title. */
	number: number;
	/** Pull request title shown after the number. */
	title: string;
	/** Review state rendered as a status lozenge. */
	status: PullRequestHeaderStatus;
	/** Target / base branch shown after the arrow (e.g. `main`). */
	baseBranch?: string | null;
	/** Source / head branch shown before the arrow. */
	headBranch?: string | null;
	/** Owner/name path (e.g. `acme/storefront`). */
	repository: string;
	/**
	 * Merge split-button primary label state.
	 * `"checks-failed"` → "Checks failed", `"checks-running"` → "Checks running",
	 * `"merge-conflicts"` → "Merge conflicts", `"review-required"` →
	 * "Require approval", `"ready"` → "Merge" (method still chosen in the
	 * chevron menu). Defaults to `"ready"`.
	 * Primary actions are enabled when their matching callback is available.
	 * The chevron menu stays available for merge method + Auto merge.
	 */
	mergeState?: PullRequestHeaderMergeState;
	/** Controlled merge method selection (chevron menu radio group). */
	mergeMethod?: PullRequestHeaderMergeMethod;
	/** Uncontrolled merge method default. Defaults to `"squash"`. */
	defaultMergeMethod?: PullRequestHeaderMergeMethod;
	/** Called when a merge method radio option is selected. */
	onMergeMethodChange?: (method: PullRequestHeaderMergeMethod) => void;
	/** Controlled Auto merge switch state (menu option). */
	autoMerge?: boolean;
	/** Uncontrolled Auto merge default. Defaults to `true` (on). */
	defaultAutoMerge?: boolean;
	/** Called when the Auto merge switch (merge options menu) changes. */
	onAutoMergeChange?: (enabled: boolean) => void;
	/** Called when the Merge primary action is activated (`ready` only). */
	onMergeClick?: () => void;
	/**
	 * Called when the Checks running primary is activated (`checks-running` only).
	 * Consumers typically expand the CI checks disclosure in the metadata rail.
	 */
	onChecksRunningClick?: () => void;
	/** Called when the Checks failed primary is activated (`checks-failed` only). */
	onChecksFailedClick?: () => void;
	/** Called when the Merge conflicts primary is activated (`merge-conflicts` only). */
	onMergeConflictsClick?: () => void;
	/** Called when the Require approval primary is activated (`review-required` only). */
	onReviewRequiredClick?: () => void;
	/**
	 * Optional Submit review button after the merge split control.
	 * Omitted when guided review is unavailable for the open PR.
	 * Hidden entirely when `status` is `"Merged"` (header shows Revert PR instead).
	 */
	submitReviewAction?: PullRequestHeaderSubmitReviewAction;
	/**
	 * Pull request URL used by More actions → Copy link and Open in {SCM}.
	 * Those items stay disabled when omitted.
	 */
	url?: string;
	/**
	 * SCM product name for More actions → "Open in {name}" (e.g. `"GitHub"`).
	 * When omitted, derived from `url` hostname (`github.com` → GitHub, etc.).
	 */
	scmProviderName?: string;
	/**
	 * Called when More actions → Convert to draft is selected.
	 * Item is omitted for merged PRs; stays disabled when omitted (pass a no-op stub to enable for demos).
	 */
	onConvertToDraftClick?: () => void;
	/**
	 * Called when More actions → Close pull request is selected.
	 * Item is omitted for merged PRs; stays disabled when omitted (pass a no-op stub to enable for demos).
	 */
	onClosePullRequestClick?: () => void;
}
