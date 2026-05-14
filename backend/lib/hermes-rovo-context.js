const {
	readCompiledContextDocuments,
} = require("./wiki-memory-provider");
const {
	getHermesSkill,
	listHermesSkills,
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

function buildHermesMemoryContextDescription(compiledContexts) {
	const sections = [];

	for (const [key, value] of Object.entries(compiledContexts ?? {})) {
		const content = truncateText(value?.content ?? "", 4_000);
		if (!content) {
			continue;
		}

		const label = key === "profile" ? "Profile context" : "Work context";
		sections.push(`${label}:\n${content}`);
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

function buildHermesSkillsCatalogDescription(skills) {
	const skillLines = skills
		.filter(Boolean)
		.map((skill) => {
			const skillId = typeof skill.id === "string" && skill.id.trim()
				? skill.id.trim()
				: null;
			if (!skillId) {
				return null;
			}

			const title = typeof skill.title === "string" && skill.title.trim()
				? skill.title.trim()
				: skill.name;
			const summary = typeof skill.description === "string" && skill.description.trim()
				? skill.description.trim()
				: skill.summary;
			const statusLabel = skill.enabled === false ? "disabled" : "enabled";
			const sourceLabel = typeof skill.source === "string" && skill.source.trim()
				? skill.source.trim()
				: "unknown";
			const detail = summary ? `: ${truncateText(summary, 140)}` : "";
			return `- ${skillId} (${statusLabel}, ${sourceLabel}) — ${title}${detail}`;
		})
		.filter(Boolean);

	if (skillLines.length === 0) {
		return null;
	}

	return [
		"[Hermes Skills Catalog]",
		"These Hermes skills are installed and discoverable in this environment.",
		"Use this catalog to determine which skills exist. Only skills in the [Hermes Skills] section are actively loaded for this turn.",
		skillLines.join("\n"),
		"[End Hermes Skills Catalog]",
	].join("\n");
}

async function buildRovoAppHermesContextDescription({
	autoSelectedSkillIds,
	selectedSkillIds,
	listSkillsImpl = listHermesSkills,
	getCompiledContextImpl = readCompiledContextDocuments,
	getSkillImpl = getHermesSkill,
}) {
	const compiledContexts = await getCompiledContextImpl();
	const memoryContext = buildHermesMemoryContextDescription(compiledContexts);
	const allSkills = await listSkillsImpl();
	const skillsCatalogContext = buildHermesSkillsCatalogDescription(allSkills);

	const normalizedSkillIds = Array.from(
		new Set(
			[
				...(Array.isArray(selectedSkillIds) ? selectedSkillIds : []),
				...(Array.isArray(autoSelectedSkillIds) ? autoSelectedSkillIds : []),
			].filter((skillId) => typeof skillId === "string" && skillId.trim().length > 0),
		),
	);
	const selectedSkills = await Promise.all(
		normalizedSkillIds.map(async (skillId) => {
			const segments = skillId.split("/").filter(Boolean);
			if (segments.length === 0) {
				return null;
			}
			const name = segments[segments.length - 1];
			const category = segments.length === 1
				? "local"
				: segments.slice(0, -1).join("__");
			try {
				return await getSkillImpl(category, name);
			} catch {
				return null;
			}
		}),
	);
	const skillsContext = buildHermesSkillsContextDescription(selectedSkills.filter(Boolean));

	return [memoryContext, skillsCatalogContext, skillsContext].filter(Boolean).join("\n\n") || null;
}

module.exports = {
	buildHermesSkillsCatalogDescription,
	buildHermesMemoryContextDescription,
	buildHermesSkillsContextDescription,
	buildRovoAppHermesContextDescription,
};
