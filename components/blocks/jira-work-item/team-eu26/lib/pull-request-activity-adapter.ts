import type {
	JiraActivityActor,
	JiraActivityEntry,
	JiraActivitySegment,
} from "@/components/blocks/jira-activity";

import type {
	PullRequestActivity,
	PullRequestActivityActor,
} from "./pull-request-detail-data";

function adaptActor(actor: PullRequestActivityActor): JiraActivityActor {
	const appBrandName = actor.kind === "app"
		? actor.id === "codex"
			? "openai-codex" as const
			: actor.id.startsWith("github") ? "github" as const : undefined
		: undefined;
	const brandName = actor.brandName ?? appBrandName;
	return {
		id: actor.id,
		name: actor.name,
		kind: actor.kind,
		// Prefer brand marks over template avatars (e.g. Claude Code → `claude`).
		...(brandName
			? { brandName }
			: actor.avatarSrc
				? { avatarSrc: actor.avatarSrc }
				: {}),
	};
}

function adaptDetail(detail: { label: string; body: string } | undefined) {
	return detail
		? {
				label: detail.label,
				content: [{ type: "text", text: detail.body }] as const,
			}
		: undefined;
}

function reviewBody(activity: Extract<PullRequestActivity, { kind: "review-submitted" }>): JiraActivitySegment[] {
	const decision = activity.decision === "approved"
		? "Approved this pull request. "
		: activity.decision === "changes-requested"
			? "Requested changes. "
			: "Reviewed this pull request. ";
	return [
		{ type: "text", text: decision + activity.body },
		...(activity.filePath
			? [
					{ type: "text", text: " Reviewed " } as const,
					{ type: "link", text: activity.filePath } as const,
				]
			: []),
	];
}

function reviewCommentBody(
	activity: Extract<PullRequestActivity, { kind: "review-comment" }>,
): JiraActivitySegment[] {
	return [
		{ type: "text", text: activity.body },
		{ type: "text", text: " Commented on " },
		{ type: "link", text: activity.filePath },
	];
}

function adaptReplies(replies: readonly {
	id: string;
	actor: PullRequestActivityActor;
	timestamp: string;
	body: string;
}[] | undefined) {
	return replies?.map((reply) => ({
		id: reply.id,
		actor: adaptActor(reply.actor),
		timestamp: reply.timestamp,
		body: reply.body,
	}));
}

function adaptActivity(activity: PullRequestActivity): JiraActivityEntry {
	const base = {
		id: `pull-request-${activity.id}`,
		actor: adaptActor(activity.actor),
		timestamp: activity.timestamp,
	};

	switch (activity.kind) {
		case "opened":
			return {
				...base,
				kind: "event",
				// Open-PR rows use the pull-request glyph; the actor still appears
				// as an inline mention Tag in the action line.
				icon: "pull-request",
				segments: [
					{ type: "text", text: "opened the pull request from " },
					{ type: "code", text: activity.headBranch },
					{ type: "text", text: " into " },
					{ type: "code", text: activity.baseBranch },
				],
			};
		case "commits-pushed":
			return {
				...base,
				kind: "event",
				// Commit/push rows use the commit glyph in the gutter; the actor
				// still appears as an inline mention Tag in the action line.
				icon: "commit",
				segments: [
					{
						type: "text",
						text: `pushed ${activity.commitCount} ${activity.commitCount === 1 ? "commit" : "commits"} ending in `,
					},
					{ type: "code", text: activity.headSha },
				],
			};
		case "checks-completed":
			return {
				...base,
				kind: "event",
				// Connected-app rows use the ADS app glyph; the GitHub product
				// mark stays on the inline mention Tag.
				icon: "app",
				segments: [
					{ type: "text", text: "completed checks: " },
					{
						type: "lozenge",
						text: `${activity.passed}/${activity.total} passed`,
						variant: activity.passed === activity.total ? "success" : "danger",
					},
				],
			};
		case "comment-posted":
			return {
				...base,
				kind: "comment",
				tag: activity.tag ? { text: activity.tag } : undefined,
				body: [{ type: "text", text: activity.body }],
				collapsible: adaptDetail(activity.detail),
				allowReply: false,
			};
		case "review-submitted":
			return {
				...base,
				kind: "comment",
				statusLozenge: activity.decision === "approved"
					? { text: "Approved", variant: "success" }
					: activity.decision === "changes-requested"
						? { text: "Changes requested", variant: "danger" }
						: { text: "Reviewed", variant: "information" },
				body: reviewBody(activity),
				collapsible: adaptDetail(activity.detail),
				replies: adaptReplies(activity.replies),
				allowReply: activity.allowReply ?? false,
				allowResolve: activity.allowResolve ?? false,
				resolved: activity.resolved ?? false,
			};
		case "review-comment":
			return {
				...base,
				kind: "comment",
				parentId: `pull-request-${activity.parentActivityId}`,
				body: reviewCommentBody(activity),
				replies: adaptReplies(activity.replies),
				allowReply: activity.allowReply ?? true,
				allowResolve: activity.allowResolve ?? true,
				resolved: activity.resolved ?? false,
			};
		case "thread-resolved":
			return {
				...base,
				kind: "event",
				segments: [
					{ type: "text", text: "resolved a review thread in " },
					{ type: "link", text: activity.filePath },
				],
			};
		case "ready-to-merge":
			return {
				...base,
				kind: "event",
				icon: "app",
				segments: [
					{ type: "text", text: "marked the pull request " },
					{ type: "lozenge", text: "Ready to merge", variant: "success" },
				],
			};
	}
}

/** Adapts provider-neutral SCM activity into Jira Activity's oldest-first timeline contract. */
export function adaptPullRequestActivity(
	activity: readonly PullRequestActivity[],
): JiraActivityEntry[] {
	return activity
		.map((item, index) => ({ item, index }))
		.sort((left, right) => (
			left.item.occurredAtMs - right.item.occurredAtMs
			|| left.index - right.index
		))
		.map(({ item }) => adaptActivity(item));
}

/** Stable reset key that changes whenever provider activity payload content changes. */
export function getPullRequestActivityRevision(
	activity: readonly PullRequestActivity[],
): string {
	return JSON.stringify(activity);
}
