import type {
	ControlPlaneJob,
	ControlPlaneMemoryEntry,
	ControlPlaneSkill,
} from "./control-plane-data";

export function normalizeRouteSegment(value: string): string {
	return value
		.trim()
		.toLowerCase()
		.replace(/[^a-z0-9]+/gu, "-")
		.replace(/^-+|-+$/gu, "");
}

export function splitMemoryEntries(rawText: string): string[] {
	return rawText
		.split(/\n§\n/gu)
		.map((entry) => entry.trim())
		.filter((entry) => entry.length > 0);
}

export function joinMemoryEntries(entries: ReadonlyArray<string>): string {
	return entries.filter((entry) => entry.trim().length > 0).join("\n§\n");
}

export function calculateUsage(current: number, capacity: number): {
	percentage: number;
	remaining: number;
} {
	const safeCurrent = Number.isFinite(current) && current > 0 ? current : 0;
	const safeCapacity = Number.isFinite(capacity) && capacity > 0 ? capacity : 0;
	const percentage =
		safeCapacity === 0
			? 0
			: Math.min(100, Math.round((safeCurrent / safeCapacity) * 100));

	return {
		percentage,
		remaining: Math.max(0, safeCapacity - safeCurrent),
	};
}

export function summarizeJobs(jobs: ReadonlyArray<ControlPlaneJob>): {
	failed: number;
	paused: number;
	running: number;
	scheduled: number;
	total: number;
} {
	return jobs.reduce(
		(summary, job) => {
			summary.total += 1;
			summary[job.status] += 1;
			return summary;
		},
		{
			failed: 0,
			paused: 0,
			running: 0,
			scheduled: 0,
			total: 0,
		},
	);
}

export function findSkillByRouteSegments(
	skills: ReadonlyArray<ControlPlaneSkill>,
	categorySegment: string,
	skillSegment: string,
): ControlPlaneSkill | null {
	const normalizedCategory = normalizeRouteSegment(categorySegment);
	const normalizedSkill = normalizeRouteSegment(skillSegment);

	return (
		skills.find((skill) => {
			return (
				normalizeRouteSegment(skill.category) === normalizedCategory &&
				normalizeRouteSegment(skill.slug) === normalizedSkill
			);
		}) ?? null
	);
}

export function groupSkillsByCategory(skills: ReadonlyArray<ControlPlaneSkill>): Array<{
	category: string;
	skills: ControlPlaneSkill[];
}> {
	const groups = new Map<string, ControlPlaneSkill[]>();

	for (const skill of skills) {
		const category = skill.category.trim() || "uncategorized";
		const group = groups.get(category) ?? [];
		group.push(skill);
		groups.set(category, group);
	}

	return Array.from(groups.entries())
		.sort(([left], [right]) => left.localeCompare(right))
		.map(([category, items]) => ({
			category,
			skills: items.sort((left, right) => left.name.localeCompare(right.name)),
		}));
}

export function getMemoryEntryUsage(entries: ReadonlyArray<ControlPlaneMemoryEntry>): number {
	return entries.reduce((total, entry) => total + entry.text.length, 0);
}

const CONTROL_PLANE_DATE_TIME_FORMAT = new Intl.DateTimeFormat("en-US", {
	dateStyle: "medium",
	timeStyle: "short",
});

export function formatControlPlaneDateTime(value: string | null | undefined): string {
	if (!value) {
		return "Not scheduled";
	}

	const date = new Date(value);
	if (Number.isNaN(date.getTime())) {
		return "Not scheduled";
	}

	return CONTROL_PLANE_DATE_TIME_FORMAT.format(date);
}

