const { getNonEmptyString } = require("./shared-utils");
const { parseStructuredJsonResponse } = require("./rovo-task-executor");

function buildHermesSkillDisambiguationPrompt({ promptText, rankedCandidates, maxSkills }) {
	const candidateBlock = rankedCandidates
		.map(({ skill, score }, index) => (
			`${index + 1}. ${skill.id} (score ${score})\nTitle: ${skill.title}\nSummary: ${skill.description ?? "None"}`
		))
		.join("\n\n");

	return {
		system: [
			"[Hermes Skill Resolver]",
			"Choose the Hermes skills that should be auto-loaded for the user's prompt.",
			"Only choose from the provided candidates.",
			`Return JSON with mode \`structured-skill-selection\` and up to ${maxSkills} \`selectedSkillIds\`.`,
			"If no skill should be auto-loaded, return an empty array.",
			"[End Hermes Skill Resolver]",
		].join("\n"),
		prompt: [
			`User prompt:\n${promptText}`,
			`Candidates:\n${candidateBlock}`,
		].join("\n\n"),
	};
}

function parseStructuredHermesSkillSelection(text) {
	const payload = parseStructuredJsonResponse(text);
	if (!payload || getNonEmptyString(payload.mode) !== "structured-skill-selection") {
		return null;
	}

	const selectedSkillIds = Array.isArray(payload.selectedSkillIds)
		? payload.selectedSkillIds.filter((skillId) => typeof skillId === "string" && skillId.trim().length > 0)
		: [];

	return {
		mode: "structured-skill-selection",
		selectedSkillIds,
	};
}

async function resolveAmbiguousAutoSelectedSkillIds({
	maxSkills = 3,
	promptText,
	rankedCandidates,
	runBackgroundTaskImpl,
}) {
	const candidateIds = new Set(rankedCandidates.map((candidate) => candidate.skill.id));
	const executionInput = buildHermesSkillDisambiguationPrompt({
		promptText,
		rankedCandidates,
		maxSkills,
	});
	const payload = await runBackgroundTaskImpl({
		...executionInput,
		parseStructuredResult: parseStructuredHermesSkillSelection,
	});
	const selectedSkillIds = payload.structuredResult?.selectedSkillIds ?? [];

	return selectedSkillIds
		.filter((skillId) => candidateIds.has(skillId))
		slice(0, maxSkills);
}

module.exports = {
	buildHermesSkillDisambiguationPrompt,
	parseStructuredHermesSkillSelection,
	resolveAmbiguousAutoSelectedSkillIds,
};
