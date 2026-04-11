const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildHermesSkillDisambiguationPrompt,
	parseStructuredHermesSkillSelection,
	resolveAmbiguousAutoSelectedSkillIds,
} = require("./hermes-skill-disambiguation");

test("buildHermesSkillDisambiguationPrompt lists scored candidates", () => {
	const input = buildHermesSkillDisambiguationPrompt({
		promptText: "Use the wiki and arxiv skills for this paper search.",
		maxSkills: 2,
		rankedCandidates: [
			{
				score: 8,
				skill: {
					id: "research/llm-wiki",
					title: "Karpathy's LLM Wiki",
					description: "Persistent wiki.",
				},
			},
			{
				score: 7,
				skill: {
					id: "research/arxiv",
					title: "Arxiv Search",
					description: "Search research papers.",
				},
			},
		],
	});

	assert.match(input.system, /structured-skill-selection/u);
	assert.match(input.prompt, /research\/llm-wiki/u);
	assert.match(input.prompt, /score 8/u);
});

test("parseStructuredHermesSkillSelection accepts structured JSON output", () => {
	const parsed = parseStructuredHermesSkillSelection([
		"```json",
		"{",
		'  "mode": "structured-skill-selection",',
		'  "selectedSkillIds": ["research/arxiv", "research/llm-wiki"]',
		"}",
		"```",
	].join("\n"));

	assert.deepEqual(parsed, {
		mode: "structured-skill-selection",
		selectedSkillIds: ["research/arxiv", "research/llm-wiki"],
	});
});

test("resolveAmbiguousAutoSelectedSkillIds filters non-candidate ids", async () => {
	const selected = await resolveAmbiguousAutoSelectedSkillIds({
		maxSkills: 2,
		promptText: "Use the wiki and arxiv skills for this paper search.",
		rankedCandidates: [
			{
				score: 8,
				skill: {
					id: "research/llm-wiki",
					title: "Karpathy's LLM Wiki",
					description: "Persistent wiki.",
				},
			},
			{
				score: 7,
				skill: {
					id: "research/arxiv",
					title: "Arxiv Search",
					description: "Search research papers.",
				},
			},
		],
		runBackgroundTaskImpl: async () => ({
			structuredResult: {
				mode: "structured-skill-selection",
				selectedSkillIds: ["research/arxiv", "unknown/skill", "research/llm-wiki"],
			},
		}),
	});

	assert.deepEqual(selected, ["research/arxiv", "research/llm-wiki"]);
});
