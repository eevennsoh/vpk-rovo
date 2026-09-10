import type { AgentListHost, AgentListPrStatus, AgentListState } from "@/components/blocks/agent-list";

/**
 * One `·`-separated chunk of a long-form session row's metadata line.
 *
 * The line is a sentence about provenance — who ran this, where, how it is
 * going, what it produced, and when it last moved — and every middle clause is
 * optional. A session with no declared host, no artifact, or no interesting
 * status simply drops that clause rather than rendering an em-dash placeholder.
 */
export type AgentSessionMetadataSegmentKind = "agent" | "host" | "status" | "artifact" | "time";

export interface AgentSessionMetadataSegment {
	readonly kind: AgentSessionMetadataSegmentKind;
	/** Plain text for the chunk. The `time` chunk carries none — the row clocks it. */
	readonly label?: string;
	/**
	 * Whether the chunk describes work still in flight, which the renderer marks
	 * with the shimmer + animated-dots treatment the rest of the system uses for
	 * a live agent.
	 */
	readonly isPending?: boolean;
	/** Pull-request lifecycle for the artifact chunk, selecting its glyph. */
	readonly prStatus?: AgentListPrStatus;
}

export interface AgentSessionMetadataInput {
	readonly agentName: string;
	/**
	 * Resolved session host, or `undefined` when the row never declared one.
	 *
	 * Deliberately not defaulted here: `getAgentListHost` answers `"cloud"` for a
	 * payload that simply never said, which is the right default for behavior but
	 * the wrong claim to print on a card. A row that does not know where it ran
	 * should stay quiet rather than assert the cloud.
	 */
	readonly host?: AgentListHost;
	readonly state: AgentListState;
	/** Pre-formatted artifact name, e.g. `#1306: Add guest checkout`. */
	readonly artifactLabel?: string;
	readonly prStatus?: AgentListPrStatus;
}

/** Status copy per lifecycle state, shared by the metadata line and its tooltip. */
export const AGENT_SESSION_STATUS_LABEL: Readonly<Record<AgentListState, string>> = {
	attention: "Needs attention",
	complete: "Complete",
	"needs-input": "Needs input",
	running: "Working",
};

/** States whose status copy shimmers, because the agent has not finished. */
const PENDING_STATES: ReadonlySet<AgentListState> = new Set<AgentListState>(["needs-input", "running"]);

/**
 * Ordered metadata chunks for a long-form session row.
 *
 * Pure and total: same input, same array, no clock and no DOM. The renderer
 * turns each chunk into a glyph plus text, which keeps the "what do we say"
 * decision testable apart from the "how does it look" one.
 */
export function toAgentSessionMetadataSegments(
	input: AgentSessionMetadataInput,
): readonly AgentSessionMetadataSegment[] {
	const segments: AgentSessionMetadataSegment[] = [
		{ kind: "agent", label: input.agentName },
	];

	if (input.host !== undefined) {
		segments.push({ kind: "host", label: input.host === "local" ? "Local" : "Cloud" });
	}

	segments.push({
		isPending: PENDING_STATES.has(input.state),
		kind: "status",
		label: AGENT_SESSION_STATUS_LABEL[input.state],
	});

	if (input.artifactLabel !== undefined && input.artifactLabel.length > 0) {
		segments.push({
			kind: "artifact",
			label: input.artifactLabel,
			prStatus: input.prStatus ?? "created",
		});
	}

	segments.push({ kind: "time" });

	return segments;
}
