"use client";

import CloudIcon from "@atlaskit/icon-lab/core/cloud";
import DevicesIcon from "@atlaskit/icon/core/devices";

import {
	AgentListIdentity,
	AgentListPrStatusIcon,
	AgentListTime,
} from "@/components/blocks/agent-list/agent-list-card";
import { isLocalAgentListItem } from "@/components/blocks/agent-list/agent-list-session";
import { AgentAvatarVisual } from "@/components/ui-custom/agent-avatar-visual";
import { AnimatedDots } from "@/components/ui-custom/animated-dots";
import { Shimmer } from "@/components/ui-custom/shimmer";
import { cn } from "@/lib/utils";

import {
	toAgentSessionMetadataSegments,
	type AgentSessionMetadataSegment,
} from "./agent-session-long-metadata";
import type { AgentSessionItem } from "./agent-session-types";

/** The `·` between metadata chunks. Decorative — the chunks read fine without it. */
function MetadataDot() {
	return (
		<span aria-hidden="true" className="shrink-0 text-text-subtlest">
			·
		</span>
	);
}

/**
 * Where the session runs.
 *
 * `cloud` comes from icon-lab because `@atlaskit/icon/core` only ships
 * `cloud-arrow-up` (an upload action, not a location); `devices` is core. Same
 * pairing the Jira session flyout's Session row uses, so the glyph means the
 * same thing wherever it appears.
 */
export function AgentSessionHostSegment({ isLocal }: Readonly<{ isLocal: boolean }>) {
	return (
		<span className="flex shrink-0 items-center gap-1 text-text-subtle" title="Session host">
			<span aria-hidden="true" className="grid size-4 shrink-0 place-items-center">
				{isLocal ? (
					<DevicesIcon color="currentColor" label="" size="small" />
				) : (
					<CloudIcon color="currentColor" label="" size="small" />
				)}
			</span>
			{isLocal ? "Local" : "Cloud"}
		</span>
	);
}

/**
 * Short-form provenance metadata: `Claude · Local · 2m`.
 *
 * Which agent, where it ran, when it last moved. Pull request details stay in
 * the flyout, which has the room to name them.
 */
export function AgentSessionProvenanceMetadata({ item }: Readonly<{ item: AgentSessionItem }>) {
	return (
		<span className="flex w-full min-w-0 items-center gap-1 text-xs text-text-subtlest">
			{/* The only flexible segment, so a long agent name owns the ellipsis. */}
			<span className="min-w-0 truncate text-text-subtle" title={item.agent.name}>
				{item.agent.name}
			</span>
			<MetadataDot />
			<AgentSessionHostSegment isLocal={isLocalAgentListItem(item)} />
			<MetadataDot />
			<span className="shrink-0 text-nowrap" title="Last update">
				<AgentListTime item={item} />
			</span>
		</span>
	);
}

/** `#1306: Add guest checkout`, the identifier convention shared with Smart Links. */
function toArtifactLabel(item: AgentSessionItem): string | undefined {
	const number = item.sessionDetails?.pullRequestNumber;
	if (number === undefined) {
		return undefined;
	}

	const title = item.sessionDetails?.pullRequestTitle;
	return title === undefined ? `#${number}` : `#${number}: ${title}`;
}

/**
 * The agent mark inside the metadata line.
 *
 * A bare session shows its agent at 16px, flush with the text. A session with a
 * known invoker shows the shared agent+person composite instead, whose smallest
 * supported footprint is a 24px frame — the pair is the point, so it gets the
 * extra 8px rather than collapsing into an unreadable overlap.
 */
function LongMetadataIdentity({ item }: Readonly<{ item: AgentSessionItem }>) {
	if (item.invokedBy) {
		return <AgentListIdentity agent={item.agent} attributedBy={item.invokedBy} sizePx={24} />;
	}

	return (
		<span className="flex size-4 shrink-0 items-center justify-center">
			<AgentAvatarVisual
				avatarClassName="after:border-0"
				avatarSrc={item.agent.avatarSrc}
				brandName={item.agent.brandName}
				label=""
				sizePx={16}
				vpkLogo={item.agent.vpkLogo}
			/>
		</span>
	);
}

function LongMetadataSegment({
	item,
	segment,
}: Readonly<{ item: AgentSessionItem; segment: AgentSessionMetadataSegment }>) {
	switch (segment.kind) {
		case "agent":
			return (
				<span className="flex shrink-0 items-center gap-1">
					<LongMetadataIdentity item={item} />
					<span className="text-text-subtle" title={segment.label}>
						{segment.label}
					</span>
				</span>
			);
		case "host":
			return <AgentSessionHostSegment isLocal={segment.label === "Local"} />;
		case "status":
			return segment.isPending ? (
				<span className="inline-flex shrink-0 items-baseline" title={segment.label}>
					<Shimmer as="span" duration={1.4} spread={2}>
						{segment.label ?? ""}
					</Shimmer>
					<AnimatedDots />
				</span>
			) : (
				<span className="shrink-0 text-text-subtle">{segment.label}</span>
			);
		case "artifact":
			return (
				<span className="flex min-w-0 shrink items-center gap-1">
					<AgentListPrStatusIcon status={segment.prStatus ?? "created"} />
					<span className="min-w-0 truncate text-text-subtle" title={segment.label}>
						{segment.label}
					</span>
				</span>
			);
		case "time":
			return (
				<span className="shrink-0 text-nowrap" title="Last update">
					<AgentListTime item={item} />
				</span>
			);
	}
}

/**
 * Long-form metadata: `<mark> Claude · Local · Working · #1306: … · 2m`.
 *
 * The chunk list comes from {@link toAgentSessionMetadataSegments}, which is
 * pure and unit-tested; this component only decides how each chunk looks.
 */
export function AgentSessionLongMetadata({ item }: Readonly<{ item: AgentSessionItem }>) {
	// Deliberately not `getAgentListHost`, which answers "cloud" for a payload
	// that simply never said. Undefined here means the row stays quiet about
	// where it ran rather than asserting a default onto the card.
	const declaredHost = item.host ?? item.sessionDetails?.host;
	const segments = toAgentSessionMetadataSegments({
		agentName: item.agent.name,
		artifactLabel: toArtifactLabel(item),
		host: declaredHost,
		prStatus: item.prStatus,
		state: item.state,
	});

	return (
		<span className="flex w-full min-w-0 items-center gap-1 text-xs text-text-subtlest">
			{segments.map((segment, index) => (
				// Only the artifact chunk may shrink. Everything else is short and
				// load-bearing — a shrinkable wrapper around unshrinkable content
				// collapses the `·` separators and clips the agent name to "Cla…".
				<span
					className={cn(
						"flex items-center gap-1",
						segment.kind === "artifact" ? "min-w-0 shrink" : "shrink-0",
					)}
					key={segment.kind}
				>
					{index > 0 ? <MetadataDot /> : null}
					<LongMetadataSegment item={item} segment={segment} />
				</span>
			))}
		</span>
	);
}
