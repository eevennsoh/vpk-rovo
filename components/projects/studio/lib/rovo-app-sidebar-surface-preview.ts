import {
	INITIAL_CONTROL_PLANE_JOBS,
	INITIAL_CONTROL_PLANE_SETTINGS,
	INITIAL_CONTROL_PLANE_SKILLS,
} from "@/components/projects/control-plane/lib/control-plane-data";

export interface RovoAppSidebarSurfacePreviewRow {
	label: string;
	value: string;
}

export interface RovoAppSidebarSurfacePreview {
	description: string;
	footerLabel: string;
	footerValue: string;
	rows: readonly RovoAppSidebarSurfacePreviewRow[];
	title: string;
}

interface RovoAppSidebarSurfacePreviewInput {
	description?: string;
	label: string;
	selected: boolean;
}

type ControlPlaneSurfaceLabel = "Jobs" | "Memories" | "Skills" | "Settings";

function getJobsPreview(): Pick<RovoAppSidebarSurfacePreview, "rows" | "footerLabel" | "footerValue"> {
	const rows = INITIAL_CONTROL_PLANE_JOBS.map((job) => ({
		label: job.name,
		value: job.status.charAt(0).toUpperCase() + job.status.slice(1),
	}));
	const running = INITIAL_CONTROL_PLANE_JOBS.filter((j) => j.status === "running").length;
	const scheduled = INITIAL_CONTROL_PLANE_JOBS.filter((j) => j.status === "scheduled").length;
	const parts: string[] = [];
	if (running > 0) parts.push(`${running} running`);
	if (scheduled > 0) parts.push(`${scheduled} scheduled`);
	return {
		rows,
		footerLabel: "Active",
		footerValue: parts.length > 0 ? parts.join(", ") : "None",
	};
}

function getMemoriesPreview(): Pick<RovoAppSidebarSurfacePreview, "rows" | "footerLabel" | "footerValue"> {
	const queuedCount = 2;
	return {
		rows: [
			{ label: "Profile context", value: "Compiled" },
			{ label: "Runtime context", value: "Compiled" },
			{ label: "Proposal queue", value: `${queuedCount} queued` },
		],
		footerLabel: "Mode",
		footerValue: "Wiki-backed",
	};
}

function getSkillsPreview(): Pick<RovoAppSidebarSurfacePreview, "rows" | "footerLabel" | "footerValue"> {
	const rows = INITIAL_CONTROL_PLANE_SKILLS.map((skill) => ({
		label: skill.name,
		value: skill.enabled ? "Enabled" : "Disabled",
	}));
	const enabledCount = INITIAL_CONTROL_PLANE_SKILLS.filter((s) => s.enabled).length;
	return {
		rows,
		footerLabel: "Active",
		footerValue: `${enabledCount} of ${INITIAL_CONTROL_PLANE_SKILLS.length} enabled`,
	};
}

function getSettingsPreview(): Pick<RovoAppSidebarSurfacePreview, "rows" | "footerLabel" | "footerValue"> {
	const { providerRoutes, runtimeMirroring } = INITIAL_CONTROL_PLANE_SETTINGS;
	return {
		rows: [
			{ label: "Chat", value: providerRoutes.chat },
			{ label: "Summarization", value: providerRoutes.summarization },
			{ label: "Jobs", value: providerRoutes.jobs },
		],
		footerLabel: "Mirroring",
		footerValue: runtimeMirroring ? "On" : "Off",
	};
}

const SURFACE_PREVIEW_BUILDERS: Record<
	ControlPlaneSurfaceLabel,
	() => Pick<RovoAppSidebarSurfacePreview, "rows" | "footerLabel" | "footerValue">
> = {
	Jobs: getJobsPreview,
	Memories: getMemoriesPreview,
	Skills: getSkillsPreview,
	Settings: getSettingsPreview,
};

export function getRovoAppSidebarSurfacePreview({
	description,
	label,
}: Readonly<RovoAppSidebarSurfacePreviewInput>): RovoAppSidebarSurfacePreview | null {
	if (label === "New chat") {
		return null;
	}

	if (!(label in SURFACE_PREVIEW_BUILDERS) || !description) {
		return null;
	}

	const builder = SURFACE_PREVIEW_BUILDERS[label as ControlPlaneSurfaceLabel];

	return {
		description,
		title: label,
		...builder(),
	};
}
