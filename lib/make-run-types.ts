import type { AgentExecutionUpdate } from "@/lib/rovo-ui-messages";
import type { VisualIdentity } from "@/components/projects/shared/lib/visual-identity";
import type { Spec } from "@json-render/react";

export type AgentRunStatus = "running" | "completed" | "failed";
export type AgentRunSourceSurface = "future-chat" | "make";
export type AgentRunAppShellPolicy = "embedded_feature" | "standalone_app";

export type AgentRunTaskStatus =
	| "todo"
	| "in-progress"
	| "done"
	| "failed"
	| "blocked-failed";

export interface AgentRunPlanTask {
	id: string;
	label: string;
	agent: string;
	blockedBy: string[];
}

export interface AgentRunPlan {
	title: string;
	description?: string;
	shortDescription?: string;
	visualIdentity?: VisualIdentity;
	agents: string[];
	tasks: AgentRunPlanTask[];
}

export interface AgentRunTask {
	id: string;
	label: string;
	agentName: string;
	agentId: string;
	blockedBy: string[];
	status: AgentRunTaskStatus;
	attempts: number;
	startedAt: string | null;
	completedAt: string | null;
	error: string | null;
	output: string | null;
	outputSummary: string | null;
}

export interface AgentRunAgent {
	agentId: string;
	agentName: string;
	status: "idle" | "working" | "failed";
	currentTaskId: string | null;
	currentTaskLabel: string | null;
	latestContent: string;
	updatedAt: string;
}

export interface AgentRunDirective {
	id: string;
	agentId: string;
	agentName: string;
	message: string;
	createdAt: string;
}

export interface AgentRunSummary {
	content: string;
	partial: boolean;
	createdAt: string;
}

export interface AgentRunGenuiWidget {
	id: string;
	title: string;
	spec: Spec;
	createdAt: string;
	status: "ready" | "failed";
	error?: string;
}

export interface AgentRunGenuiSummary {
	widgets: AgentRunGenuiWidget[];
	spec?: Spec;
	partial: boolean;
	createdAt: string;
	status: "ready" | "failed";
	error?: string;
}

export type AgentRunShareTarget = "confluence" | "slack";

export interface AgentRunConfluenceShareInput {
	baseUrl?: string;
	spaceKey?: string;
	title?: string;
	parentPageId?: string;
}

export interface AgentRunShareRequest {
	target: AgentRunShareTarget;
	confluence?: AgentRunConfluenceShareInput;
}

export interface AgentRunShareResponse {
	ok: true;
	target: AgentRunShareTarget;
	externalUrl?: string;
	messageTs?: string;
}

export interface AgentRun {
	runId: string;
	status: AgentRunStatus;
	error: string | null;
	createdAt: string;
	updatedAt: string;
	completedAt: string | null;
	plan: AgentRunPlan;
	tasks: AgentRunTask[];
	agents: AgentRunAgent[];
	directives: AgentRunDirective[];
	summary: AgentRunSummary | null;
	genuiSummary: AgentRunGenuiSummary | null;
	userPrompt: string;
	customInstruction?: string;
	agentCount?: number;
	conversationContext: Array<{ type: "user" | "assistant"; content: string }>;
	sourceSurface?: AgentRunSourceSurface;
	appShellPolicy?: AgentRunAppShellPolicy;
	iteration: number;
	activeBatchId: string | null;
	createdFiles?: string[];
}

export type AgentRunListItem = Pick<
	AgentRun,
	| "runId"
	| "status"
	| "error"
	| "createdAt"
	| "updatedAt"
	| "completedAt"
	| "plan"
	| "tasks"
	| "agentCount"
> &
	Partial<Pick<AgentRun, "summary" | "genuiSummary">>;

export type AgentRunStreamEvent =
	| {
			type: "snapshot";
			timestamp: string;
			run: AgentRun;
	  }
	| {
			type:
				| "run.started"
				| "task.claimed"
				| "task.completed"
				| "task.failed"
				| "task.blocked"
				| "task.retrying"
				| "directive.recorded"
				| "run.completed"
				| "run.resumed"
				| "run.summary-ready"
				| "run.failed";
			timestamp: string;
			run: AgentRun;
			taskId?: string;
			error?: string;
			attempt?: number;
			directive?: AgentRunDirective;
			update?: AgentExecutionUpdate | null;
	  }
	| {
			type: "agent.update";
			timestamp: string;
			runId: string;
			update: AgentExecutionUpdate;
	  };

export function isAgentRunStreamEvent(value: unknown): value is AgentRunStreamEvent {
	if (!value || typeof value !== "object") {
		return false;
	}

	const type = (value as { type?: unknown }).type;
	return typeof type === "string";
}
