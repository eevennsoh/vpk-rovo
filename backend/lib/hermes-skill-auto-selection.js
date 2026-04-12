function normalizeText(value) {
	return typeof value === "string"
		? value.trim().toLowerCase()
		: "";
}

function tokenize(value) {
	return normalizeText(value)
		.split(/[^a-z0-9]+/u)
		.filter((token) => token.length >= 3);
}

function scoreSkillForPrompt(skill, promptText) {
	const prompt = normalizeText(promptText);
	if (!prompt) {
		return 0;
	}

	const title = normalizeText(skill.title);
	const name = normalizeText(skill.name);
	const description = normalizeText(skill.description);
	const id = normalizeText(skill.id);
	let score = 0;

	if (title && prompt.includes(title)) {
		score += 10;
	}
	if (name && prompt.includes(name)) {
		score += 8;
	}
	if (id && prompt.includes(id)) {
		score += 8;
	}

	const promptTokens = new Set(tokenize(prompt));
	const skillTokens = new Set([
		...tokenize(title),
		...tokenize(name),
		...tokenize(description),
	]);
	for (const token of skillTokens) {
		if (promptTokens.has(token)) {
			score += 1;
		}
	}

	return score;
}

function rankHermesSkillCandidates({
	promptText,
	selectedSkillIds = [],
	skills = [],
	minScore = 2,
}) {
	const selectedSkillIdSet = new Set(
		Array.isArray(selectedSkillIds)
			? selectedSkillIds.filter((skillId) => typeof skillId === "string" && skillId.trim())
			: [],
	);

	return skills
		.filter((skill) => skill && skill.enabled !== false && !selectedSkillIdSet.has(skill.id))
		.map((skill) => ({
			skill,
			score: scoreSkillForPrompt(skill, promptText),
		}))
		.filter((item) => item.score >= minScore)
		.sort((left, right) => right.score - left.score || left.skill.id.localeCompare(right.skill.id));
}

function shouldDisambiguateRankedCandidates(rankedCandidates, maxSkills = 3) {
	if (!Array.isArray(rankedCandidates) || rankedCandidates.length <= 1) {
		return false;
	}

	const [firstCandidate, secondCandidate] = rankedCandidates;
	if (!firstCandidate || !secondCandidate) {
		return false;
	}

	return (
		secondCandidate.score >= firstCandidate.score - 2
		|| rankedCandidates.length > maxSkills
	);
}

function autoSelectHermesSkillIds({
	promptText,
	selectedSkillIds = [],
	skills = [],
	maxSkills = 3,
	minScore = 2,
}) {
	return rankHermesSkillCandidates({
		promptText,
		selectedSkillIds,
		skills,
		minScore,
	})
		.slice(0, maxSkills)
		.map((item) => item.skill.id);
}

module.exports = {
	autoSelectHermesSkillIds,
	rankHermesSkillCandidates,
	scoreSkillForPrompt,
	shouldDisambiguateRankedCandidates,
};
