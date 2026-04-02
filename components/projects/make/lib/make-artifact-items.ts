import { GALLERY_ITEMS } from "@/components/blocks/make-gallery/data/gallery-items";
import type {
	MakeItem,
	MakeItemRunMeta,
} from "@/components/blocks/make-item/lib/types";
import type { AgentRunListItem } from "@/lib/make-run-types";
import {
	resolvePlanDisplayTitle,
	sanitizePlanDescription,
} from "@/components/projects/shared/lib/plan-identity";

export interface MakeSidebarAppItem {
	runId: string;
	title: string;
	updatedAt: string;
	status: "running" | "completed";
}

type RunnableMakeRun = AgentRunListItem & {
	status: "running" | "completed";
};

const APP_GALLERY_TEMPLATE =
	GALLERY_ITEMS.find((item) => item.type === "apps") ?? {
		id: "sprint-board",
		ascii: "",
		color: "text-text-subtle",
		description: "",
	};

function toDateTimestamp(value: string): number {
	const timestamp = Date.parse(value);
	return Number.isFinite(timestamp) ? timestamp : 0;
}

function sortRunsByRecency(leftRun: AgentRunListItem, rightRun: AgentRunListItem): number {
	const updatedDelta =
		toDateTimestamp(rightRun.updatedAt) - toDateTimestamp(leftRun.updatedAt);
	if (updatedDelta !== 0) {
		return updatedDelta;
	}

	const createdDelta =
		toDateTimestamp(rightRun.createdAt) - toDateTimestamp(leftRun.createdAt);
	if (createdDelta !== 0) {
		return createdDelta;
	}

	return rightRun.runId.localeCompare(leftRun.runId);
}

function formatRunDate(value: string): string {
	const timestamp = Date.parse(value);
	if (!Number.isFinite(timestamp)) {
		return "Unknown";
	}

	return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(timestamp);
}

function getRunAgentCount(run: AgentRunListItem): number {
	const taskAgentCount = new Set(
		run.tasks
			.map((task) => task.agentName)
			.filter((agentName): agentName is string => Boolean(agentName)),
	).size;
	const planAgentCount = Array.isArray(run.plan.agents) ? run.plan.agents.length : 0;
	return Math.max(taskAgentCount, planAgentCount, 1);
}

const DEFAULT_USER = { name: "User", src: "/avatar-human/austin-lambert.png" };

function getRunMaintainers(): Array<{ name: string; src?: string }> {
	return [DEFAULT_USER];
}

function resolveRunTitle(run: AgentRunListItem): string {
	return resolvePlanDisplayTitle(run.plan.title, run.plan.tasks);
}

function resolveRunDescription(run: AgentRunListItem): string {
	if (!run.plan.shortDescription && !run.plan.description && APP_GALLERY_TEMPLATE.description) {
		return APP_GALLERY_TEMPLATE.description;
	}
	return sanitizePlanDescription(
		run.plan.shortDescription ?? run.plan.description,
		run.tasks.length,
	);
}

function toRunMeta(run: RunnableMakeRun): MakeItemRunMeta {
	return {
		runId: run.runId,
		status: run.status,
		taskCount: run.tasks.length,
		agentCount: getRunAgentCount(run),
	};
}

function isRunnableArtifactStatus(
	status: AgentRunListItem["status"],
): status is "running" | "completed" {
	return status === "running" || status === "completed";
}

export function selectMakeArtifactRuns(
	runs: ReadonlyArray<AgentRunListItem>,
): RunnableMakeRun[] {
	return runs
		.filter((run): run is RunnableMakeRun => isRunnableArtifactStatus(run.status))
		.sort(sortRunsByRecency);
}

export function mapRunsToMakeGalleryItems(
	runs: ReadonlyArray<AgentRunListItem>,
): MakeItem[] {
	return selectMakeArtifactRuns(runs).map((run) => {
		const runMeta = toRunMeta(run);
		return {
			id: run.runId,
			title: resolveRunTitle(run),
			description: resolveRunDescription(run),
			type: "apps",
			ascii: APP_GALLERY_TEMPLATE.ascii,
			color: APP_GALLERY_TEMPLATE.color,
			animationId: APP_GALLERY_TEMPLATE.id,
			lastUpdated: formatRunDate(run.updatedAt),
			users: runMeta.taskCount,
			rating: runMeta.status === "completed" ? 5 : 4,
			ratingCount: `${runMeta.agentCount} agents`,
			maintainers: getRunMaintainers(),
			runMeta,
		};
	});
}

export function mapRunsToSidebarAppItems(
	runs: ReadonlyArray<AgentRunListItem>,
): MakeSidebarAppItem[] {
	return selectMakeArtifactRuns(runs).map((run) => ({
		runId: run.runId,
		title: resolveRunTitle(run),
		updatedAt: run.updatedAt,
		status: run.status,
	}));
}
