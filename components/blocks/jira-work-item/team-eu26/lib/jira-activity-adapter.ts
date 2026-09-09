import {
	formatSessionTimestamp,
	getAgentActivityActorId,
	type ActivityEvent,
	type AgentActivityEvent,
	type AgentSessionThreadReply,
	type AgentSessionStatus,
	type HumanActivityEvent,
	type StaticChangedFilesActivityEvent,
	type StaticEventActivityEvent,
	type StaticTimelineActor,
} from "@/components/blocks/jira-work-item/data/session-state";
import type {
	JiraActivityActor,
	JiraActivityChangedFilesEntry,
	JiraActivityCommentEntry,
	JiraActivityEntry,
	JiraActivityEventEntry,
	JiraActivityPriority,
	JiraActivitySegment,
} from "@/components/blocks/jira-activity";
import type { AgentListItem } from "@/components/blocks/agent-list";
import type { ThirdPartyLogoName } from "@/components/ui/data/logo-third-party-data";
import { getDeterministicAgentAvatarSrc } from "@/lib/agent-avatars";

import { statusVariant } from "@/components/blocks/jira-work-item/team-eu26/components/detail-field-editor-data";
import {
	toActivityMentionSegments,
	type ActivityMentionTarget,
} from "./activity-mention-segments";

export const JIRA_WORK_ITEM_CURRENT_USER: JiraActivityActor = {
	id: "jira-work-item-current-user",
	name: "Venn",
	kind: "person",
	avatarSrc: "/avatar-user/venn/venn.png",
};

/**
 * Opt-in activity composition for a lead agent and its delegated sessions.
 * Sessions remain independent in the work-item model while Activity presents
 * the delegated agents as replies beneath one lead card.
 */
export interface ActivitySessionThreadConfig {
	parentSessionId: string;
	childSessionIds: readonly string[];
	visibleSessionIds: readonly string[];
	/** Set false to keep the initial scroll position; defaults to following the latest row. */
	autoScroll?: boolean;
	/**
	 * Initial expand state for nested replies on the lead session card.
	 * Omit to keep the Activity default (expanded). Build collapses the
	 * Code Planner consultation so the Claude checklist stays focused.
	 */
	defaultRepliesExpanded?: boolean;
}

export function composeActivitySessionThread(
	events: readonly ActivityEvent[],
	config?: Readonly<ActivitySessionThreadConfig>,
): ActivityEvent[] {
	if (!config) return [...events];

	const childSessionIds = new Set(config.childSessionIds);
	const visibleSessionIds = new Set(config.visibleSessionIds);
	const childReplies = events.flatMap((event): AgentSessionThreadReply[] => {
		if (
			event.kind !== "agent"
			|| !childSessionIds.has(event.sessionId)
			|| !visibleSessionIds.has(event.sessionId)
		) {
			return [];
		}

		return [
			{
				id: `${event.id}-thread-reply`,
				sessionId: event.sessionId,
				agentId: event.agentId,
				agentName: event.agentName,
				agentAvatarSrc: event.agentAvatarSrc,
				...(event.agentBrandName ? { agentBrandName: event.agentBrandName } : {}),
				content: event.responsePreview ?? event.commandPreview,
				createdAtMs: event.createdAtMs,
			},
			...(event.threadReplies ?? []),
		];
	});

	return events.flatMap((event): ActivityEvent[] => {
		if (event.kind !== "agent") return [event];
		if (childSessionIds.has(event.sessionId)) return [];
		if (event.sessionId !== config.parentSessionId) return [event];
		if (!visibleSessionIds.has(event.sessionId)) return [];

		return [{
			...event,
			threadReplies: [...(event.threadReplies ?? []), ...childReplies]
				.sort((left, right) => left.createdAtMs - right.createdAtMs),
		}];
	});
}

/**
 * Stamps lead-thread presentation defaults (e.g. collapsed nested replies)
 * onto mapped Activity entries after session composition.
 */
export function applyActivitySessionThreadPresentation(
	entries: readonly JiraActivityEntry[],
	config?: Readonly<ActivitySessionThreadConfig>,
): JiraActivityEntry[] {
	if (!config || config.defaultRepliesExpanded === undefined) return [...entries];

	return entries.map((entry) => {
		if (entry.kind !== "comment") return entry;
		if (entry.sessionItem?.id !== config.parentSessionId) return entry;
		if (!(entry.replies && entry.replies.length > 0)) return entry;
		return {
			...entry,
			defaultRepliesExpanded: config.defaultRepliesExpanded,
		};
	});
}

const AGENT_STATUS_TAG = {
	running: { text: "Working", color: "blue" },
	waiting: { text: "Waiting for you", color: "yellow" },
	completed: { text: "Done", color: "green" },
} as const satisfies Record<AgentSessionStatus, NonNullable<JiraActivityCommentEntry["tag"]>>;

const AGENT_SESSION_STATE = {
	running: "running",
	waiting: "needs-input",
	completed: "complete",
} as const;

interface AgentSessionLookup {
	bySessionId: ReadonlyMap<string, AgentListItem>;
	byAgentId: ReadonlyMap<string, AgentListItem>;
}

function actorIdFromName(name: string): string {
	const normalizedName = name
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-|-$/gu, "");
	return `jira-work-item-person-${normalizedName || "unknown"}`;
}

function humanAuthorActor(author: Readonly<HumanActivityEvent["author"]>): JiraActivityActor {
	if (author.brandName) {
		return {
			id: actorIdFromName(author.name),
			name: author.name,
			kind: "agent",
			brandName: author.brandName,
		};
	}

	if (author.name === JIRA_WORK_ITEM_CURRENT_USER.name) {
		return author.avatarUrl
			? { ...JIRA_WORK_ITEM_CURRENT_USER, avatarSrc: author.avatarUrl }
			: JIRA_WORK_ITEM_CURRENT_USER;
	}

	return {
		id: actorIdFromName(author.name),
		name: author.name,
		kind: "person",
		...(author.avatarUrl ? { avatarSrc: author.avatarUrl } : {}),
	};
}

function humanActor(event: Readonly<HumanActivityEvent>): JiraActivityActor {
	return humanAuthorActor(event.author);
}

function agentActor(agent: Readonly<{
	id: string;
	name: string;
	avatarSrc?: string;
	brandName?: ThirdPartyLogoName;
}>): JiraActivityActor {
	const usesRovoLogo = agent.id.startsWith("skill:");
	const avatarSrc = usesRovoLogo
		? undefined
		: agent.avatarSrc ?? getDeterministicAgentAvatarSrc(agent.id);
	return {
		id: getAgentActivityActorId(agent.id),
		name: agent.name,
		kind: "agent",
		...(agent.brandName
			? { brandName: agent.brandName }
			: usesRovoLogo
				? { vpkLogo: "rovo" as const }
				: { avatarSrc }),
	};
}

function resolveInvoker(event: Readonly<AgentActivityEvent>): AgentListItem["invokedBy"] {
	if (!event.invokedBy) return undefined;
	const name = event.invokedBy.name === "You"
		? JIRA_WORK_ITEM_CURRENT_USER.name
		: event.invokedBy.name;
	const avatarSrc = event.invokedBy.avatarSrc
		?? (name === JIRA_WORK_ITEM_CURRENT_USER.name
			? JIRA_WORK_ITEM_CURRENT_USER.avatarSrc
			: undefined);
	return {
		name,
		...(avatarSrc ? { avatarSrc } : {}),
	};
}

function agentSessionItem(event: Readonly<AgentActivityEvent>): AgentListItem {
	const usesRovoLogo = event.agentId.startsWith("skill:");
	const avatarSrc = usesRovoLogo
		? undefined
		: event.agentAvatarSrc ?? getDeterministicAgentAvatarSrc(event.agentId);
	const invokedBy = resolveInvoker(event);

	return {
		id: event.sessionId,
		title: event.title,
		state: AGENT_SESSION_STATE[event.status],
		agent: {
			name: event.agentName,
			...(event.agentBrandName
				? { brandName: event.agentBrandName }
				: usesRovoLogo
					? { vpkLogo: "rovo" as const }
					: { avatarSrc }),
		},
		branch: event.branch,
		elapsedSeconds: event.elapsedSeconds,
		...(invokedBy ? { invokedBy } : {}),
	};
}

function createAgentSessionLookup(events: readonly ActivityEvent[]): AgentSessionLookup {
	const bySessionId = new Map<string, AgentListItem>();
	const byAgentId = new Map<string, AgentListItem>();
	for (const event of events) {
		if (event.kind !== "agent") continue;
		const item = agentSessionItem(event);
		bySessionId.set(event.sessionId, item);
		byAgentId.set(event.agentId, item);
	}
	return { bySessionId, byAgentId };
}

function getReplySessionItem(
	reply: Readonly<AgentSessionThreadReply>,
	sessionLookup: Readonly<AgentSessionLookup>,
): AgentListItem | undefined {
	return (
		(reply.sessionId ? sessionLookup.bySessionId.get(reply.sessionId) : undefined)
		?? sessionLookup.byAgentId.get(reply.agentId)
	);
}

function mapHumanEvent(
	event: Readonly<HumanActivityEvent>,
	referenceTimeMs?: number,
	mentionTargets: readonly ActivityMentionTarget[] = [],
): JiraActivityCommentEntry {
	return {
		id: event.id,
		kind: "comment",
		actor: humanActor(event),
		timestamp: formatSessionTimestamp(event.createdAtMs, referenceTimeMs),
		body: toActivityMentionSegments(event.content, mentionTargets),
		...(event.reactions ? { reactions: event.reactions } : {}),
		...(event.progressChecklist ? { progressChecklist: event.progressChecklist } : {}),
		...(event.outputs ? { outputs: event.outputs } : {}),
		...(event.threadReplies
			? {
				replies: event.threadReplies.map((reply) => ({
					id: reply.id,
					actor: humanAuthorActor({
						name: reply.authorName,
						avatarUrl: reply.authorAvatarSrc,
					}),
					timestamp: formatSessionTimestamp(reply.createdAtMs, referenceTimeMs),
					body: reply.content,
				})),
			}
			: {}),
		// Human comments opt in to Reply. The flag was previously false only to
		// suppress the always-mounted composer under every human comment; now that
		// Reply-to-reveal is the default, the affordance costs nothing until used.
		allowReply: true,
	};
}

function mapAgentEvent(
	event: Readonly<AgentActivityEvent>,
	referenceTimeMs?: number,
	sessionLookup?: Readonly<AgentSessionLookup>,
): JiraActivityCommentEntry {
	const statusTag = event.status === "waiting" && event.waitingOn?.kind === "agent"
		? { text: `Waiting for ${event.waitingOn.agentName}`, color: "yellow" as const }
		: AGENT_STATUS_TAG[event.status];

	return {
		id: event.id,
		kind: "comment",
		actor: agentActor({
			id: event.agentId,
			name: event.agentName,
			avatarSrc: event.agentAvatarSrc,
			brandName: event.agentBrandName,
		}),
		timestamp: formatSessionTimestamp(event.createdAtMs, referenceTimeMs),
		tag: statusTag,
		body: event.responsePreview ? [{ type: "text", text: event.responsePreview }] : [],
		collapsible: {
			label: "Prompt",
			content: [{ type: "text", text: event.commandPreview }],
		},
		allowReply: event.status !== "completed",
		...(event.progressChecklist ? { progressChecklist: event.progressChecklist } : {}),
		...(event.outputs ? { outputs: event.outputs } : {}),
		...(event.imageAttachment ? { imageAttachment: event.imageAttachment } : {}),
		...(event.threadReplies
			? {
				replies: event.threadReplies.map((reply) => {
					const sessionItem = sessionLookup ? getReplySessionItem(reply, sessionLookup) : undefined;
					return {
						id: reply.id,
						actor: agentActor({
							id: reply.agentId,
							name: reply.agentName,
							avatarSrc: reply.agentAvatarSrc,
							brandName: reply.agentBrandName,
						}),
						timestamp: formatSessionTimestamp(reply.createdAtMs, referenceTimeMs),
						body: reply.content,
						...(sessionItem ? { sessionItem } : {}),
					};
				}),
			}
			: {}),
		sessionItem: agentSessionItem(event),
	};
}

function staticActor(actor: Readonly<StaticTimelineActor>): JiraActivityActor {
	return {
		id: actor.id,
		name: actor.name,
		kind: actor.kind,
		// Prefer brand marks over template avatars (e.g. Claude Code → `claude`).
		...(actor.brandName
			? { brandName: actor.brandName as ThirdPartyLogoName }
			: actor.avatarSrc
				? { avatarSrc: actor.avatarSrc }
				: {}),
	};
}

function withStatusLozengeVariants(
	segments: StaticEventActivityEvent["segments"],
): StaticEventActivityEvent["segments"] {
	return segments.map((segment) => {
		if (segment.type !== "lozenge") return segment;
		return {
			...segment,
			variant: statusVariant(segment.text),
		};
	});
}

function isJiraActivityPriority(value: string): value is JiraActivityPriority {
	switch (value) {
		case "Highest":
		case "High":
		case "Medium":
		case "Low":
		case "Lowest":
			return true;
		default:
			return false;
	}
}

const SET_PRIORITY_MARKER = "set priority to ";

function withPrioritySegments(
	segments: StaticEventActivityEvent["segments"],
): JiraActivitySegment[] {
	return segments.flatMap((segment): JiraActivitySegment[] => {
		if (segment.type !== "text") return [segment];
		const markerIndex = segment.text.lastIndexOf(SET_PRIORITY_MARKER);
		if (markerIndex === -1) return [segment];
		const prefix = segment.text.slice(0, markerIndex + SET_PRIORITY_MARKER.length);
		const priorityText = segment.text.slice(markerIndex + SET_PRIORITY_MARKER.length);
		if (!isJiraActivityPriority(priorityText)) return [segment];
		return [
			{ type: "text", text: prefix },
			{ type: "priority", text: priorityText },
		];
	});
}

function mapStaticEvent(
	event: Readonly<StaticEventActivityEvent>,
	referenceTimeMs?: number,
): JiraActivityEventEntry {
	return {
		id: event.id,
		kind: "event",
		actor: staticActor(event.actor),
		timestamp: formatSessionTimestamp(event.createdAtMs, referenceTimeMs),
		...(event.pullRequest
			? { icon: "pull-request" }
			: event.icon
				? { icon: event.icon }
				: {}),
		...(event.showActor === undefined ? {} : { showActor: event.showActor }),
		...(event.showTimestamp === undefined ? {} : { showTimestamp: event.showTimestamp }),
		// Status transitions share the dropdown's statusVariant tone map.
		segments: withPrioritySegments(
			event.icon === "status"
				? withStatusLozengeVariants(event.segments)
				: event.segments,
		),
		...(event.pullRequest ? { pullRequest: event.pullRequest } : {}),
	};
}

function mapStaticChangedFiles(
	event: Readonly<StaticChangedFilesActivityEvent>,
	referenceTimeMs?: number,
): JiraActivityChangedFilesEntry {
	return {
		id: event.id,
		kind: "changed-files",
		actor: staticActor(event.actor),
		timestamp: formatSessionTimestamp(event.createdAtMs, referenceTimeMs),
		summary: event.summary,
		description: event.description,
		...(event.branch ? { branch: event.branch } : {}),
		...(event.tag ? { tag: event.tag } : {}),
		...(event.sessionItem ? { sessionItem: event.sessionItem } : {}),
		...(event.outputs ? { outputs: event.outputs } : {}),
	};
}

/** Collect reaction-directory actors without building the full rendered timeline. */
export function collectActivityActors(
	events: readonly ActivityEvent[],
): JiraActivityActor[] {
	const actorsById = new Map<string, JiraActivityActor>();
	const addActor = (actor: JiraActivityActor) => actorsById.set(actor.id, actor);

	for (const event of events) {
		if (event.kind === "human") {
			addActor(humanActor(event));
			for (const reply of event.threadReplies ?? []) {
				addActor(humanAuthorActor({
					name: reply.authorName,
					avatarUrl: reply.authorAvatarSrc,
				}));
			}
			continue;
		}

		if (event.kind === "agent") {
			addActor(agentActor({
				id: event.agentId,
				name: event.agentName,
				avatarSrc: event.agentAvatarSrc,
				brandName: event.agentBrandName,
			}));
			for (const reply of event.threadReplies ?? []) {
				addActor(agentActor({
					id: reply.agentId,
					name: reply.agentName,
					avatarSrc: reply.agentAvatarSrc,
					brandName: reply.agentBrandName,
				}));
			}
			continue;
		}

		addActor(staticActor(event.actor));
	}

	return [...actorsById.values()];
}

/**
 * Mentionable agents for authored comment copy, derived from the same stream
 * being mapped. Deriving it here keeps callers from hand-maintaining a parallel
 * roster that could drift from the agents actually on screen.
 *
 * The roster spans every place an agent surfaces — its own session event, a
 * delegated thread reply, and static timeline actors — because
 * `composeActivitySessionThread` folds delegated sessions into the lead agent's
 * replies and removes their standalone events. Collecting sessions alone would
 * silently drop every delegated agent from the roster.
 */
function collectMentionTargets(events: readonly ActivityEvent[]): ActivityMentionTarget[] {
	const targetsByName = new Map<string, ActivityMentionTarget>();

	function addTarget(name: string, actor: Readonly<JiraActivityActor>) {
		if (!name || targetsByName.has(name)) return;
		targetsByName.set(name, {
			name,
			...(actor.vpkLogo
				? { vpkLogo: actor.vpkLogo }
				: {
					...(actor.avatarSrc ? { avatarSrc: actor.avatarSrc } : {}),
					...(actor.brandName ? { brandName: actor.brandName } : {}),
				}),
		});
	}

	for (const event of events) {
		if (event.kind === "agent") {
			addTarget(event.agentName, agentActor({
				id: event.agentId,
				name: event.agentName,
				avatarSrc: event.agentAvatarSrc,
				brandName: event.agentBrandName,
			}));
			for (const reply of event.threadReplies ?? []) {
				addTarget(reply.agentName, agentActor({
					id: reply.agentId,
					name: reply.agentName,
					avatarSrc: reply.agentAvatarSrc,
					brandName: reply.agentBrandName,
				}));
			}
			continue;
		}

		if (event.kind !== "human" && event.actor.kind === "agent") {
			addTarget(event.actor.name, staticActor(event.actor));
		}
	}

	return [...targetsByName.values()];
}

/**
 * Mention roster for authored copy. Prefer the uncomposed session source when
 * callers stage Activity visibility (`composeActivitySessionThread` with an
 * empty/partial `visibleSessionIds`): agent cards can stay hidden while
 * `@Agent` chips on the just-submitted comment still resolve immediately.
 */
function resolveMentionTargets(
	events: readonly ActivityEvent[],
	sessionSourceEvents?: readonly ActivityEvent[],
): ActivityMentionTarget[] {
	if (!sessionSourceEvents || sessionSourceEvents === events) {
		return collectMentionTargets(events);
	}
	return collectMentionTargets([...sessionSourceEvents, ...events]);
}

/** Convert the already-chronological Jira Work Item activity stream for Jira Activity. */
export function mapActivityEventsToJiraEntries(
	events: readonly ActivityEvent[],
	referenceTimeMs?: number,
	sessionSourceEvents?: readonly ActivityEvent[],
): JiraActivityEntry[] {
	const mentionTargets = resolveMentionTargets(events, sessionSourceEvents);
	const sessionLookup = createAgentSessionLookup(sessionSourceEvents ?? events);
	return events.map((event) => {
		switch (event.kind) {
			case "human":
				return mapHumanEvent(event, referenceTimeMs, mentionTargets);
			case "agent":
				return mapAgentEvent(event, referenceTimeMs, sessionLookup);
			case "event":
				return mapStaticEvent(event, referenceTimeMs);
			case "changed-files":
				return mapStaticChangedFiles(event, referenceTimeMs);
		}
	});
}

/**
 * Stable identity for collapsing Open → Merged updates of the same PR while
 * keeping same-numbered PRs from different repositories distinct.
 */
export function getPullRequestIdentity(
	pullRequest: NonNullable<StaticEventActivityEvent["pullRequest"]>,
): string {
	if (pullRequest.url) return pullRequest.url;
	if (pullRequest.repository) return `${pullRequest.repository}#${pullRequest.number}`;
	return `#${pullRequest.number}`;
}

/**
 * Unique pull-request events for the metadata rail (newest first).
 * Later updates for the same PR identity win so Open → Merged collapses to one row.
 */
export function selectPullRequestEntries(
	events: readonly ActivityEvent[],
	referenceTimeMs?: number,
): JiraActivityEventEntry[] {
	const seenIdentities = new Set<string>();
	const entries: JiraActivityEventEntry[] = [];

	for (let index = events.length - 1; index >= 0; index -= 1) {
		const event = events[index];
		if (event?.kind !== "event" || !event.pullRequest) continue;
		const identity = getPullRequestIdentity(event.pullRequest);
		if (seenIdentities.has(identity)) continue;
		seenIdentities.add(identity);
		entries.push(mapStaticEvent(event, referenceTimeMs));
	}

	return entries;
}
