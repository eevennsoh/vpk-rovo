const assert = require("node:assert/strict");
const test = require("node:test");

const {
	buildHermesSkillCompanionExecutionInput,
	buildHermesSkillCompanionMessages,
	parseStructuredHermesSkillFallback,
	runHermesSkillCompanionReview,
} = require("./hermes-skill-companion");

test("buildHermesSkillCompanionMessages includes installed skills and latest turn text", () => {
	const messages = buildHermesSkillCompanionMessages({
		conversationHistory: [
			{ type: "user", content: "Please make this workflow reusable." },
		],
		installedSkills: [
			{
				id: "research/llm-wiki",
				title: "Karpathy's LLM Wiki",
				description: "Persistent markdown wiki.",
			},
		],
		latestAssistantMessage: "I created a reusable wiki ingest process.",
		latestUserMessage: "Please make this workflow reusable.",
	});

	assert.equal(messages.length, 2);
	assert.match(messages[0].content, /\[Hermes Skill Companion\]/u);
	assert.match(messages[1].content, /Installed Hermes skills:/u);
	assert.match(messages[1].content, /research\/llm-wiki/u);
});

test("parseStructuredHermesSkillFallback accepts create actions with bundle files", () => {
	const parsed = parseStructuredHermesSkillFallback([
		"```json",
		"{",
		'  "mode": "structured-skill-fallback",',
		'  "actions": [',
		"    {",
		'      "action": "create",',
		'      "category": "research",',
		'      "name": "llm-wiki-helper",',
		'      "rationale": "Reusable wiki ingestion workflow.",',
		'      "files": [',
		'        { "path": "SKILL.md", "content": "# Wiki Helper\\n\\nUse this skill." }',
		"      ]",
		"    }",
		"  ]",
		"}",
		"```",
	].join("\n"));

	assert.equal(parsed?.mode, "structured-skill-fallback");
	assert.equal(parsed?.actions.length, 1);
	assert.equal(parsed?.actions[0].action, "create");
	assert.equal(parsed?.actions[0].files[0].path, "SKILL.md");
});

test("runHermesSkillCompanionReview upserts pending drafts from structured fallback output", async () => {
	const upsertedDrafts = [];
	const result = await runHermesSkillCompanionReview({
		conversationHistory: [
			{ type: "user", content: "This should become a reusable skill." },
		],
		executeBackgroundTaskImpl: async () => ({
			didRun: true,
			responseText: [
				"```json",
				"{",
				'  "mode": "structured-skill-fallback",',
				'  "actions": [',
				"    {",
				'      "action": "create",',
				'      "category": "research",',
				'      "name": "llm-wiki-helper",',
				'      "rationale": "Reusable wiki ingestion workflow.",',
				'      "summary": "Wiki helper",',
				'      "files": [',
				'        { "path": "SKILL.md", "content": "# Wiki Helper\\n\\nUse this skill." }',
				"      ]",
				"    }",
				"  ]",
				"}",
				"```",
			].join("\n"),
			structuredResult: {
				mode: "structured-skill-fallback",
				summary: "Create a helper skill.",
				actions: [
					{
						action: "create",
						category: "research",
						name: "llm-wiki-helper",
						rationale: "Reusable wiki ingestion workflow.",
						summary: "Wiki helper",
						files: [
							{ path: "SKILL.md", content: "# Wiki Helper\n\nUse this skill." },
						],
					},
				],
			},
		}),
		installedSkillsImpl: async () => [],
		latestAssistantMessage: "I created a reusable wiki ingestion process.",
		latestUserMessage: "This should become a reusable skill.",
		sourceThreadId: "thread-1",
		upsertDraftImpl: async (draftInput) => {
			upsertedDrafts.push(draftInput);
			return {
				id: "draft-1",
				status: "pending",
				...draftInput,
			};
		},
	});

	assert.equal(result.didReview, true);
	assert.equal(upsertedDrafts.length, 1);
	assert.equal(upsertedDrafts[0].sourceThreadId, "thread-1");
	assert.equal(result.structuredSkillActions.length, 1);
	assert.equal(result.structuredSkillActions[0].draft.id, "draft-1");
});

test("buildHermesSkillCompanionExecutionInput preserves the prompt payload", () => {
	const input = buildHermesSkillCompanionExecutionInput({
		conversationHistory: [
			{ type: "assistant", content: "This flow can be reused." },
		],
		installedSkills: [],
		latestAssistantMessage: "This flow can be reused.",
		latestUserMessage: "Turn this into a skill.",
	});

	assert.match(input.system, /\[Hermes Skill Companion\]/u);
	assert.match(input.prompt, /Latest user message:/u);
});
