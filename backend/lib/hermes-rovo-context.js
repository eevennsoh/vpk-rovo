const {
	getHermesMemory,
} = require("./hermes-memory");
const {
	getHermesSkill,
} = require("./hermes-skills");

function truncateText(value, maxChars) {
	if (typeof value !== "string") {
		return "";
	}

	const trimmedValue = value.trim();
	if (trimmedValue.length <= maxChars) {
		return trimmedValue;
	}

	return `${trimmedValue.slice(0, maxChars - 1).trimEnd()}…`;
}

function buildHermesMemoryContextDescription(memories) {
	const sections = [];

	for (const memory of memories) {
		if (!memory || !Array.isArray(memory.entries) || memory.entries.length === 0) {
			continue;
		}

		const label = memory.target === "user" ? "User memory" : "Core memory";
		const entryLines = memory.entries
			.slice(-8)
			.map((entry) => `- ${truncateText(entry.content ?? entry.text ?? "", 320)}`)
			.filter((line) => line !== "- ");

		if (entryLines.length === 0) {
			continue;
		}

		sections.push(`${label}:\n${entryLines.join("\n")}`);
	}

	if (sections.length === 0) {
		return null;
	}

	return [
		"[Hermes Memory]",
		"Treat these as durable cross-session memories and user facts.",
		sections.join("\n\n"),
		"[End Hermes Memory]",
	].join("\n");
}

function buildHermesSkillsContextDescription(skills) {
	const skillBlocks = skills
		.filter(Boolean)
		.map((skill) => {
			const title = typeof skill.title === "string" && skill.title.trim()
				? skill.title.trim()
				: skill.name;
			const description = typeof skill.description === "string" && skill.description.trim()
				? skill.description.trim()
				: skill.summary;
			const content = truncateText(skill.content ?? "", 6000);
			return [
				`<skill id="${skill.id}">`,
				`Title: ${title}`,
				description ? `Summary: ${description}` : null,
				"Instructions:",
				content,
				"</skill>",
			]
				.filter(Boolean)
				.join("\n");
		});

	if (skillBlocks.length === 0) {
		return null;
	}

	return [
		"[Hermes Skills]",
		"These user-selected Hermes skills are loaded as procedural memory for this turn.",
		skillBlocks.join("\n\n"),
		"[End Hermes Skills]",
	].join("\n");
}

async function buildRovoAppHermesContextDescription({
	selectedSkillIds,
}) {
	const [memory, user] = await Promise.all([
		getHermesMemory("memory"),
		getHermesMemory("user"),
	]);
	const memoryContext = buildHermesMemoryContextDescription([memory, user]);

	const normalizedSkillIds = Array.isArray(selectedSkillIds)
		? Array.from(
			new Set(
				selectedSkillIds.filter((skillId) => typeof skillId === "string" && skillId.trim().length > 0),
			),
		)
		: [];
	const selectedSkills = await Promise.all(
		normalizedSkillIds.map(async (skillId) => {
			const segments = skillId.split("/").filter(Boolean);
			if (segments.length < 2) {
				return null;
			}
			const name = segments[segments.length - 1];
			const category = segments.slice(0, -1).join("__");
			try {
				return await getHermesSkill(category, name);
			} catch {
				return null;
			}
		}),
	);
	const skillsContext = buildHermesSkillsContextDescription(selectedSkills.filter(Boolean));

	return [memoryContext, skillsContext].filter(Boolean).join("\n\n") || null;
}

module.exports = {
	buildHermesMemoryContextDescription,
	buildHermesSkillsContextDescription,
	buildRovoAppHermesContextDescription,
};
