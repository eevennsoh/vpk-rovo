const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildHermesSkillsCatalogDescription,
	buildRovoAppHermesContextDescription,
} = require("./hermes-rovo-context");

test("buildHermesSkillsCatalogDescription summarizes installed Hermes skills for discoverability", () => {
	const description = buildHermesSkillsCatalogDescription([
		{
			description: "Persistent markdown wiki for LLM discoveries and notes.",
			enabled: true,
			id: "research/llm-wiki",
			name: "llm-wiki",
			source: "vendored-upstream",
			title: "Karpathy's LLM Wiki",
		},
		{
			description: "Creative coding with p5.js.",
			enabled: false,
			id: "creative/p5js",
			name: "p5js",
			source: "vendored-upstream",
			title: "p5.js Production Pipeline",
		},
	]);

	assert.match(description, /\[Hermes Skills Catalog\]/);
	assert.match(description, /research\/llm-wiki \(enabled, vendored-upstream\)/);
	assert.match(description, /creative\/p5js \(disabled, vendored-upstream\)/);
	assert.match(description, /Only skills in the \[Hermes Skills\] section are actively loaded for this turn\./);
});

test("buildRovoAppHermesContextDescription includes installed skill catalog and selected skill content", async () => {
	const description = await buildRovoAppHermesContextDescription({
		getCompiledContextImpl: async () => ({
			profile: {
				content: "- Prefers concise answers.",
			},
			operations: {
				content: "- Keep the runtime loop on RovoDev.",
			},
		}),
		getSkillImpl: async () => ({
			content: "# LLM Wiki\n\nUse the wiki for linked knowledge capture.",
			description: "Persistent markdown wiki for LLM discoveries and notes.",
			id: "research/llm-wiki",
			name: "llm-wiki",
			source: "vendored-upstream",
			title: "Karpathy's LLM Wiki",
		}),
		listSkillsImpl: async () => [
			{
				description: "Persistent markdown wiki for LLM discoveries and notes.",
				enabled: true,
				id: "research/llm-wiki",
				name: "llm-wiki",
				source: "vendored-upstream",
				title: "Karpathy's LLM Wiki",
			},
			{
				description: "Creative coding with p5.js.",
				enabled: true,
				id: "creative/p5js",
				name: "p5js",
				source: "vendored-upstream",
				title: "p5.js Production Pipeline",
			},
		],
		selectedSkillIds: ["research/llm-wiki"],
	});

	assert.match(description, /\[Hermes Memory\]/);
	assert.match(description, /\[Hermes Skills Catalog\]/);
	assert.match(description, /creative\/p5js \(enabled, vendored-upstream\)/);
	assert.match(description, /\[Hermes Skills\]/);
	assert.match(description, /<skill id="research\/llm-wiki">/);
	assert.match(description, /Use the wiki for linked knowledge capture\./);
});

test("buildRovoAppHermesContextDescription merges pinned and auto-selected skill ids", async () => {
	const description = await buildRovoAppHermesContextDescription({
		getCompiledContextImpl: async () => ({}),
		getSkillImpl: async (category, name) => ({
			content: `# ${name}\n\n${category} skill content.`,
			description: `${name} description`,
			id: `${category}/${name}`,
			name,
			source: "local",
			title: name,
		}),
		listSkillsImpl: async () => [],
		selectedSkillIds: ["research/llm-wiki"],
		autoSelectedSkillIds: ["research/arxiv"],
	});

	assert.match(description, /<skill id="research\/llm-wiki">/);
	assert.match(description, /<skill id="research\/arxiv">/);
});
