import type { ReactElement } from "react";
import MergeFailureIcon from "@atlaskit/icon/core/merge-failure";
import MergeSuccessIcon from "@atlaskit/icon/core/merge-success";
import PullRequestIcon from "@atlaskit/icon/core/pull-request";

import type {
	SmartLinkAvatar,
	SmartLinkItem,
} from "@/components/blocks/smart-link/components/smart-link";
import { SMART_LINK_MODAL_ACTIONS } from "@/components/blocks/smart-link/data/smart-link-actions";

/** Status values shared with Jira issue pull-request chrome. */
export type PullRequestSmartLinkStatus = "Open" | "Merged" | "Failed";

export interface PullRequestSmartLinkInput {
	id: string;
	number: number;
	title: string;
	status: PullRequestSmartLinkStatus;
	additions: number;
	deletions: number;
	/** Number of files touched by the diff, rendered alongside the +/- counts. */
	files?: number;
	/**
	 * Owner/name path (e.g. `acme/storefront`). Builds the GitHub URL; it is
	 * not shown on the card — the provider mark and `#N` already say where the
	 * change lives.
	 */
	repository?: string;
	/** Source branch the PR merges from (e.g. `feature/shop-4821-guest-checkout`). */
	branch?: string;
	/** Branch the PR merges into (e.g. `main`). */
	targetBranch?: string;
	/** Absolute or hash URL. When omitted, builds a GitHub PR URL from `repository`. */
	href?: string;
	author?: SmartLinkAvatar;
	description?: string;
}

function pullRequestFrontSlot(
	status: PullRequestSmartLinkStatus,
): {
	icon: ReactElement;
	status: NonNullable<SmartLinkItem["status"]>;
} {
	switch (status) {
		case "Open":
			return {
				icon: <PullRequestIcon label="" />,
				status: { label: "Open", variant: "success" },
			};
		case "Merged":
			return {
				icon: <MergeSuccessIcon label="" />,
				status: { label: "Merged", variant: "discovery" },
			};
		case "Failed":
			return {
				icon: <MergeFailureIcon label="" />,
				status: { label: "Failed", variant: "danger" },
			};
		default: {
			const _exhaustive: never = status;
			return _exhaustive;
		}
	}
}

function resolvePullRequestHref(input: Readonly<PullRequestSmartLinkInput>): string {
	if (input.href) return input.href;
	if (input.repository) {
		return `https://github.com/${input.repository}/pull/${input.number}`;
	}
	return `#pull-request-${input.number}`;
}

/**
 * Normalize pull-request story/activity fields into a SmartLinkItem with the
 * `pull-request` variant (GitHub chip + flyout details).
 */
export function toPullRequestSmartLink(
	input: Readonly<PullRequestSmartLinkInput>,
): SmartLinkItem {
	const frontSlot = pullRequestFrontSlot(input.status);

	return {
		id: input.id,
		href: resolvePullRequestHref(input),
		// The number prefixes the title (`#1847: Add guest checkout…`) so the card,
		// flyout, and inline chip all identify the PR the same way.
		title: `#${input.number}: ${input.title}`,
		variant: "pull-request",
		provider: { name: "GitHub", logo: { kind: "third-party", name: "github" } },
		// The front slot encodes Open / Merged / Failed with the same glyphs Jira
		// issue chrome uses. The GitHub logo still identifies the provider.
		icon: { kind: "icon", icon: frontSlot.icon },
		status: frontSlot.status,
		author: input.author,
		codeStats: {
			files: input.files,
			additions: input.additions,
			deletions: input.deletions,
		},
		branchPath:
			input.branch || input.targetBranch
				? { branch: input.branch, targetBranch: input.targetBranch }
				: undefined,
		description: input.description,
		actions: SMART_LINK_MODAL_ACTIONS,
	};
}
