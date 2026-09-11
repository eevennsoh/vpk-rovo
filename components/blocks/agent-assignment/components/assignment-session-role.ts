import type { AgentAssignmentStatusKind } from "@/components/blocks/agent-assignment/components/assigned-agent-status";
import type { AgentSessionRole } from "@/components/blocks/agent-session/agent-session-types";

/**
 * Needs-input is an owner action: the current user can answer. Passing through
 * a source `viewer` role would swap the question-mark lifecycle for an info
 * hint on a session they can interact with.
 */
export function assignmentSessionRole(
	statusKind: AgentAssignmentStatusKind,
	role?: AgentSessionRole,
): AgentSessionRole | undefined {
	return statusKind === "needs-input" ? "owner" : role;
}
