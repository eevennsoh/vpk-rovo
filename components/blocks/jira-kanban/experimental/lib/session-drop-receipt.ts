import type { AgentSessionItem } from "@/components/blocks/agent-session";
import type {
	JiraDropzoneMember,
	SessionDropReceipt,
	SessionReceiptId,
} from "@/components/blocks/jira-dropzone";

import type { BoardAgentSessionDragPointer } from "./board-agent-session-drag";
import type { SessionTransferPlan, SessionTransferStep } from "./session-transfer-plan";

export function toJiraDropzoneMember(session: AgentSessionItem): JiraDropzoneMember {
	return {
		avatarSrc: session.agent.avatarSrc,
		brandName: session.agent.brandName,
		id: session.id,
		name: session.agent.name,
		vpkLogo: session.agent.vpkLogo,
	};
}

export function toSessionDropReceipt(input: {
	readonly plan: SessionTransferPlan;
	readonly pointer: BoardAgentSessionDragPointer;
}): SessionDropReceipt | null {
	if (input.plan.kind !== "commit" || input.plan.summary.verb !== "create-board") {
		return null;
	}
	const steps: Extract<SessionTransferStep, { kind: "create-board" }>[] = [];
	for (const step of input.plan.steps) {
		if (step.kind !== "create-board") {
			return null;
		}
		steps.push(step);
	}
	const [firstStep, ...restSteps] = steps;
	if (!firstStep) {
		return null;
	}
	if (restSteps.some((step) => step.columnTitle !== firstStep.columnTitle)) {
		return null;
	}
	const members = steps.map((step) => toJiraDropzoneMember(step.session));
	const [firstMember, ...restMembers] = members;
	if (!firstMember) {
		return null;
	}
	const from = { x: input.pointer.x, y: input.pointer.y };
	const title = firstStep.columnTitle;
	return {
		drop: "stagger",
		from,
		id: `${members.map((member) => member.id).sort().join("|")}::${title}::${from.x},${from.y}` as SessionReceiptId,
		members: [firstMember, ...restMembers],
		title,
	};
}
