"use client";

import { useMemo } from "react";

import type { JiraActivityEventEntry } from "@/components/blocks/jira-activity";
import {
	getPullRequestIdentity,
	JIRA_WORK_ITEM_CURRENT_USER,
} from "@/components/blocks/jira-work-item/team-eu26/lib/jira-activity-adapter";
import {
	DEFAULT_PULL_REQUEST_SORT_MODE,
	sortPullRequestEntries,
	type PullRequestSortMode,
} from "@/components/blocks/jira-work-item/team-eu26/lib/pull-request-phases";
import {
	PullRequest,
	type PullRequestAuthor,
	type PullRequestProps,
} from "@/components/blocks/pull-request";

function resolvePullRequestAuthor(entry: JiraActivityEventEntry): PullRequestAuthor | undefined {
	const pullRequest = entry.pullRequest;
	if (!pullRequest) return undefined;

	const name =
		pullRequest.authorName ??
		(entry.actor.kind === "person" ? entry.actor.name : undefined);
	if (!name) return undefined;

	const avatarUrl =
		pullRequest.authorAvatarSrc
		?? (name === JIRA_WORK_ITEM_CURRENT_USER.name
			? JIRA_WORK_ITEM_CURRENT_USER.avatarSrc
			: undefined)
		?? (entry.actor.kind === "person" && entry.actor.name === name
			? entry.actor.avatarSrc
			: undefined);

	return {
		name,
		...(avatarUrl ? { avatarUrl } : {}),
	};
}

/** Maps a PR activity entry to Pull Request block props for list/Select rows. */
export function toPanelPullRequestProps(entry: JiraActivityEventEntry): PullRequestProps | null {
	const pullRequest = entry.pullRequest;
	if (!pullRequest) return null;

	const timestampMs = pullRequest.updatedAtMs ?? pullRequest.createdAtMs;
	const author = resolvePullRequestAuthor(entry);

	return {
		number: pullRequest.number,
		title: pullRequest.title,
		status: pullRequest.status,
		additions: pullRequest.additions,
		deletions: pullRequest.deletions,
		...(pullRequest.repository ? { repository: pullRequest.repository } : {}),
		...(pullRequest.branch ? { branch: pullRequest.branch } : {}),
		...(pullRequest.targetBranch ? { targetBranch: pullRequest.targetBranch } : {}),
		...(typeof timestampMs === "number" ? { timestampMs } : {}),
		...(author ? { author } : {}),
	};
}

function PullRequestCard({
	entry,
	selected,
	onSelectEntry,
}: Readonly<{
	entry: JiraActivityEventEntry;
	selected: boolean;
	onSelectEntry: (entry: JiraActivityEventEntry) => void;
}>) {
	const item = toPanelPullRequestProps(entry);
	if (!item) return null;

	const number = entry.pullRequest?.number;
	const pullRequest = entry.pullRequest;
	if (number == null || !pullRequest) return null;
	const identity = getPullRequestIdentity(pullRequest);

	return (
		<li
			className="min-w-0"
			data-jira-work-item-pull-request-card={number}
			data-jira-work-item-pull-request-identity={identity}
			data-selected={selected ? "true" : undefined}
		>
			<PullRequest
				{...item}
				className="min-w-0 max-w-full"
				selected={selected}
				onActivate={() => onSelectEntry(entry)}
			/>
		</li>
	);
}

/**
 * Flat pull-request list of selectable Pull Request block cards — no phase
 * accordion chrome. Sort mode is owned by the caller; "By me" uses the signed-in
 * viewer name. ContextResources uses PullRequestsSelect for the interactive
 * control; this panel remains available for card-list surfaces.
 */
export function PullRequestsPanel({
	currentUserName = JIRA_WORK_ITEM_CURRENT_USER.name,
	entries,
	selectedIdentity,
	sortMode = DEFAULT_PULL_REQUEST_SORT_MODE,
	onSelectEntry,
}: Readonly<{
	/** Display name of the signed-in viewer for the "By me" sort. */
	currentUserName?: string;
	entries: readonly JiraActivityEventEntry[];
	selectedIdentity: string | null;
	sortMode?: PullRequestSortMode;
	onSelectEntry: (entry: JiraActivityEventEntry) => void;
}>) {
	const orderedEntries = useMemo(
		() => sortPullRequestEntries(entries, sortMode, currentUserName),
		[currentUserName, entries, sortMode],
	);

	if (orderedEntries.length === 0) {
		return (
			<p
				className="px-2 py-3 text-center text-xs text-text-subtlest"
				data-jira-work-item-pull-request-empty
				data-jira-work-item-pull-requests
			>
				No pull requests
			</p>
		);
	}

	return (
		<ul
			aria-label="Pull requests"
			className="flex min-w-0 flex-col gap-2"
			data-jira-work-item-pull-requests
		>
			{orderedEntries.map((entry) => {
				const identity = entry.pullRequest
					? getPullRequestIdentity(entry.pullRequest)
					: entry.id;
				return (
					<PullRequestCard
						entry={entry}
						key={identity}
						selected={identity === selectedIdentity}
						onSelectEntry={onSelectEntry}
					/>
				);
			})}
		</ul>
	);
}
