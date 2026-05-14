const assert = require("node:assert/strict");
const test = require("node:test");

const {
	autoSelectHermesSkillIds,
	rankHermesSkillCandidates,
	scoreSkillForPrompt,
	selectHermesSkillIdsFromRankedCandidates,
} = require("./hermes-skill-auto-selection");

test("scoreSkillForPrompt strongly prefers exact skill name and title matches", () => {
	const score = scoreSkillForPrompt(
		{
			id: "research/llm-wiki",
			name: "llm-wiki",
			title: "Karpathy's LLM Wiki",
			description: "Persistent markdown wiki for linked knowledge capture.",
		},
		"Can you use the llm-wiki skill to build a persistent wiki for this research?",
	);

	assert.equal(score >= 10, true);
});

test("autoSelectHermesSkillIds skips pinned and disabled skills", () => {
	const selected = autoSelectHermesSkillIds({
		promptText: "Use the wiki and the p5js creative coding skill.",
		selectedSkillIds: ["research/llm-wiki"],
		skills: [
			{
				id: "research/llm-wiki",
				name: "llm-wiki",
				title: "Karpathy's LLM Wiki",
				description: "Persistent wiki.",
				enabled: true,
			},
			{
				id: "creative/p5js",
				name: "p5js",
				title: "p5.js Production Pipeline",
				description: "Creative coding skill.",
				enabled: false,
			},
			{
				id: "research/arxiv",
				name: "arxiv",
				title: "Arxiv Search",
				description: "Search research papers.",
				enabled: true,
			},
		],
	});

	assert.deepEqual(selected, []);
});

test("autoSelectHermesSkillIds returns the highest-scoring enabled skills", () => {
	const selected = autoSelectHermesSkillIds({
		promptText: "Please use arxiv and llm wiki research workflows for this paper search.",
		skills: [
			{
				id: "research/llm-wiki",
				name: "llm-wiki",
				title: "Karpathy's LLM Wiki",
				description: "Persistent research wiki.",
				enabled: true,
			},
			{
				id: "research/arxiv",
				name: "arxiv",
				title: "Arxiv Search",
				description: "Find research papers.",
				enabled: true,
			},
			{
				id: "creative/p5js",
				name: "p5js",
				title: "p5.js Production Pipeline",
				description: "Creative coding.",
				enabled: true,
			},
		],
	});

	assert.deepEqual(selected, ["research/arxiv", "research/llm-wiki"]);
});

test("selectHermesSkillIdsFromRankedCandidates preserves auto-selection ordering without reranking", () => {
	const input = {
		promptText: "Please use arxiv and llm wiki research workflows for this paper search.",
		skills: [
			{
				id: "research/llm-wiki",
				name: "llm-wiki",
				title: "Karpathy's LLM Wiki",
				description: "Persistent research wiki.",
				enabled: true,
			},
			{
				id: "research/arxiv",
				name: "arxiv",
				title: "Arxiv Search",
				description: "Find research papers.",
				enabled: true,
			},
			{
				id: "creative/p5js",
				name: "p5js",
				title: "p5.js Production Pipeline",
				description: "Creative coding.",
				enabled: true,
			},
		],
	};
	const rankedCandidates = rankHermesSkillCandidates(input);

	assert.deepEqual(
		selectHermesSkillIdsFromRankedCandidates(rankedCandidates),
		autoSelectHermesSkillIds(input),
	);
});
