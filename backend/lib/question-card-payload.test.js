const test = require("node:test");
const assert = require("node:assert/strict");

const {
	sanitizeQuestionCardPayload,
	buildQuestionCardPayloadFromRequestUserInput,
	findRequestUserInputQuestionContainer,
	isSelfReferentialFreeTextOption,
} = require("./question-card-payload");

test("keeps generated options even when questions share identical option sets", () => {
	const payload = sanitizeQuestionCardPayload(
		{
			type: "question-card",
			sessionId: "clarification-fixed",
			questions: [
				{
					id: "q-1",
					label: "Which stack should we use?",
					kind: "single-select",
					options: [
						{ id: "react", label: "React" },
						{ id: "vue", label: "Vue" },
					],
				},
				{
					id: "q-2",
					label: "Which framework should we prefer?",
					kind: "single-select",
					options: [
						{ id: "react", label: "React" },
						{ id: "vue", label: "Vue" },
					],
				},
			],
		},
		{
			createSessionId: () => "clarification-fixed",
		}
	);

	assert.ok(payload);
	assert.equal(payload.questions[0].options.length, 2);
	assert.equal(payload.questions[1].options.length, 2);
});

test("preserves multi-select kind from question payload", () => {
	const payload = sanitizeQuestionCardPayload(
		{
			type: "question-card",
			sessionId: "clarification-multi",
			questions: [
				{
					id: "q-1",
					label: "Which channels should we include?",
					kind: "multi-select",
					options: [
						{ label: "Slack" },
						{ label: "Email" },
					],
				},
			],
		},
		{
			createSessionId: () => "clarification-multi",
		}
	);

	assert.ok(payload);
	assert.equal(payload.questions[0].kind, "multi-select");
});

test("falls back to single-select when kind is missing or invalid", () => {
	const payload = sanitizeQuestionCardPayload(
		{
			type: "question-card",
			sessionId: "clarification-kind-default",
			questions: [
				{
					id: "q-1",
					label: "Pick a release track",
					options: [{ label: "Stable" }],
				},
				{
					id: "q-2",
					label: "Pick a deployment mode",
					kind: "not-a-real-kind",
					options: [{ label: "Rolling" }],
				},
			],
		},
		{
			createSessionId: () => "clarification-kind-default",
		}
	);

	assert.ok(payload);
	assert.equal(payload.questions[0].kind, "single-select");
	assert.equal(payload.questions[1].kind, "single-select");
});

test("request_user_input conversion keeps multi-select questions", () => {
	const payload = buildQuestionCardPayloadFromRequestUserInput(
		{
			title: "Scope details",
			questions: [
				{
					id: "q-1",
					question: "Which integrations should be enabled?",
					kind: "multi-select",
					options: [
						{ label: "Slack" },
						{ label: "Google Drive" },
					],
				},
			],
		},
		{
			sessionId: "request-user-input-1",
			createSessionId: () => "request-user-input-1",
		}
	);

	assert.ok(payload);
	assert.equal(payload.questions[0].kind, "multi-select");
	assert.equal(payload.questions[0].options.length, 2);
});

test("request_user_input conversion accepts choices alias for options", () => {
	const payload = buildQuestionCardPayloadFromRequestUserInput(
		{
			title: "Confluence draft scope",
			questions: [
				{
					id: "q-1",
					question: "Which page type should I draft?",
					choices: [
						"Status update",
						"Project brief",
					],
				},
			],
		},
		{
			sessionId: "request-user-input-choices",
			createSessionId: () => "request-user-input-choices",
		}
	);

	assert.ok(payload);
	assert.equal(payload.questions[0].options.length, 2);
	assert.equal(payload.questions[0].options[0].label, "Status update");
	assert.equal(payload.questions[0].options[1].label, "Project brief");
});

test("request_user_input conversion accepts snake_case answer option aliases", () => {
	const payload = buildQuestionCardPayloadFromRequestUserInput(
		{
			title: "Release scope",
			questions: [
				{
					id: "q-1",
					question: "Which channels should we include?",
					answer_options: [
						{ label: "Slack" },
						{ value: "Email digest" },
					],
				},
			],
		},
		{
			sessionId: "request-user-input-answer-options",
			createSessionId: () => "request-user-input-answer-options",
		}
	);

	assert.ok(payload);
	assert.equal(payload.questions[0].options.length, 2);
	assert.equal(payload.questions[0].options[0].label, "Slack");
	assert.equal(payload.questions[0].options[1].label, "Email digest");
});

test("request_user_input conversion parses questions nested under tool-result output", () => {
	const payload = buildQuestionCardPayloadFromRequestUserInput(
		{
			output: JSON.stringify({
				title: "Atlassian site selection",
				questions: [
					{
						id: "site_selection",
						question: "Which Atlassian site(s)?",
						options: [
							"softwareteams.atlassian.net",
							"atlassian-team-25.atlassian.net",
						],
					},
				],
			}),
		},
		{
			sessionId: "request-user-input-tool-result-output",
			createSessionId: () => "request-user-input-tool-result-output",
		}
	);

	assert.ok(payload);
	assert.equal(payload.title, "Atlassian site selection");
	assert.equal(payload.questions.length, 1);
	assert.equal(payload.questions[0].options.length, 2);
	assert.equal(payload.questions[0].options[0].label, "softwareteams.atlassian.net");
});

test("request_user_input conversion supports 8 preset options for clarification cards", () => {
	const optionLabels = Array.from(
		{ length: 12 },
		(_, index) => `site-${index + 1}.atlassian.net`
	);
	const payload = buildQuestionCardPayloadFromRequestUserInput(
		{
			result: {
				questions: [
					{
						id: "site_selection",
						question: "Which Atlassian site(s)?",
						options: optionLabels,
					},
				],
			},
		},
		{
			sessionId: "request-user-input-8-options",
			createSessionId: () => "request-user-input-8-options",
			maxPresetOptions: 8,
		}
	);

	assert.ok(payload);
	assert.equal(payload.questions[0].options.length, 8);
	assert.equal(payload.questions[0].options[0].label, "site-1.atlassian.net");
	assert.equal(payload.questions[0].options[7].label, "site-8.atlassian.net");
});

// ── findRequestUserInputQuestionContainer tests ──

test("findRequestUserInputQuestionContainer detects question JSON in a plain object", () => {
	const result = findRequestUserInputQuestionContainer({
		title: "Help me clarify",
		questions: [
			{ question: "Which site?", options: ["Site A", "Site B"] },
		],
	});

	assert.ok(result);
	assert.equal(result.questions.length, 1);
});

test("findRequestUserInputQuestionContainer detects question JSON in a stringified object", () => {
	const jsonStr = JSON.stringify({
		title: "Pick a scope",
		questions: [
			{ question: "Which team?", options: ["Team A"] },
		],
	});

	const result = findRequestUserInputQuestionContainer(jsonStr);

	assert.ok(result);
	assert.equal(result.questions.length, 1);
});

test("findRequestUserInputQuestionContainer detects questions nested under tool input keys", () => {
	const result = findRequestUserInputQuestionContainer({
		input: {
			payload: {
				questions: [
					{ question: "Which integration?", options: ["Slack", "Email"] },
				],
			},
		},
	});

	assert.ok(result);
	assert.equal(result.questions.length, 1);
});

test("findRequestUserInputQuestionContainer returns null for non-question content", () => {
	assert.equal(findRequestUserInputQuestionContainer("echo hello"), null);
	assert.equal(findRequestUserInputQuestionContainer({ command: "ls -la" }), null);
	assert.equal(findRequestUserInputQuestionContainer(null), null);
	assert.equal(findRequestUserInputQuestionContainer(undefined), null);
	assert.equal(findRequestUserInputQuestionContainer(""), null);
});

test("findRequestUserInputQuestionContainer detects questions embedded in bash cat heredoc output", () => {
	const bashOutput = `cat << 'EOF'\n${JSON.stringify({
		questions: [
			{ question: "Which deployment target?", options: ["Staging", "Production"] },
		],
	})}\nEOF`;

	const result = findRequestUserInputQuestionContainer(bashOutput);

	assert.ok(result);
	assert.equal(result.questions.length, 1);
});

test("findRequestUserInputQuestionContainer accepts an array of questions directly", () => {
	const result = findRequestUserInputQuestionContainer([
		{ question: "Which site?", options: ["A", "B"] },
		{ question: "Which team?", options: ["X", "Y"] },
	]);

	assert.ok(result);
	assert.equal(result.questions.length, 2);
});

// ── isSelfReferentialFreeTextOption tests ──

test("isSelfReferentialFreeTextOption returns true for meta-options pointing to free-text input", () => {
	const selfReferential = [
		"I'll describe it now",
		"I'll type it out",
		"Let me describe it myself",
		"I'll describe it",
		"I'll type it",
		"I'll write it out",
		"I will describe it now",
		"Use the free-text field",
		"Type it out",
		"Describe it myself",
		"I'll provide it myself",
		"I'll explain it myself",
		"Write it out",
		"I'll enter it myself",
		"Type this out",
		"I'll specify it myself",
		// paste/share/send + pronoun
		"I'll paste it in",
		"I'll share it with you",
		"I'll send it next",
		"Let me paste it here",
		"Paste it in the next message",
		"Share it with you",
		"Send it over",
	];

	for (const label of selfReferential) {
		assert.equal(
			isSelfReferentialFreeTextOption(label),
			true,
			`Expected true for: "${label}"`
		);
	}
});

test("isSelfReferentialFreeTextOption returns false for concrete options", () => {
	const concrete = [
		"I'll type the attendees",
		"I'll type the channel",
		"I'll type the project key",
		"I'll type the summary",
		"I'll type the message",
		"I'll type the time",
		"I have a Jira ticket",
		"I have a Figma design",
		"React",
		"Vue",
		"Slack",
		"#general",
		"Marketing site",
		"I'll describe the requirements",
		// paste/share/send + concrete noun (no deferral)
		"I'll share the Figma URL",
		"I'll paste the Jira link",
		"I'll send the project details",
		"I'll paste the error log",
	];

	for (const label of concrete) {
		assert.equal(
			isSelfReferentialFreeTextOption(label),
			false,
			`Expected false for: "${label}"`
		);
	}
});

test("isSelfReferentialFreeTextOption handles edge cases", () => {
	assert.equal(isSelfReferentialFreeTextOption(null), false);
	assert.equal(isSelfReferentialFreeTextOption(undefined), false);
	assert.equal(isSelfReferentialFreeTextOption(""), false);
	assert.equal(isSelfReferentialFreeTextOption(123), false);
});

test("isSelfReferentialFreeTextOption catches deferral patterns", () => {
	const deferrals = [
		"I'll paste it in the next message",
		"I'll share the URL in the next reply",
		"I'll send it in my next response",
		"I'll provide the details in the following message",
		"Paste it in the next message",
	];

	for (const label of deferrals) {
		assert.equal(
			isSelfReferentialFreeTextOption(label),
			true,
			`Expected true for: "${label}"`
		);
	}
});

// ── extractSelfReferentialPlaceholder tests ──

test("extractSelfReferentialPlaceholder returns description from filtered option", () => {
	const { extractSelfReferentialPlaceholder } = require("./question-card-payload");
	const result = extractSelfReferentialPlaceholder([
		{ label: "I'll paste it in the next message", description: "Share the Figma URL so I can extract specs" },
	]);
	assert.equal(result, "Share the Figma URL so I can extract specs");
});

test("extractSelfReferentialPlaceholder returns label when no description", () => {
	const { extractSelfReferentialPlaceholder } = require("./question-card-payload");
	const result = extractSelfReferentialPlaceholder([
		{ label: "I'll paste it in the next message" },
	]);
	assert.equal(result, "I'll paste it in the next message");
});

test("extractSelfReferentialPlaceholder returns null for all concrete options", () => {
	const { extractSelfReferentialPlaceholder } = require("./question-card-payload");
	const result = extractSelfReferentialPlaceholder([
		{ label: "React", description: "Use React framework" },
		{ label: "Vue", description: "Use Vue framework" },
	]);
	assert.equal(result, null);
});

test("extractSelfReferentialPlaceholder picks first self-referential from mixed options", () => {
	const { extractSelfReferentialPlaceholder } = require("./question-card-payload");
	const result = extractSelfReferentialPlaceholder([
		{ label: "Use design system" },
		{ label: "Start from scratch" },
		{ label: "I'll paste it next", description: "Paste a Figma URL" },
	]);
	assert.equal(result, "Paste a Figma URL");
});

test("extractSelfReferentialPlaceholder returns null for empty/invalid input", () => {
	const { extractSelfReferentialPlaceholder } = require("./question-card-payload");
	assert.equal(extractSelfReferentialPlaceholder(null), null);
	assert.equal(extractSelfReferentialPlaceholder([]), null);
	assert.equal(extractSelfReferentialPlaceholder([null, undefined]), null);
});

test("normalizeRequestUserInputOptions strips self-referential options", () => {
	const { normalizeRequestUserInputOptions } = require("./question-card-payload");
	const result = normalizeRequestUserInputOptions([
		{ label: "I have a Jira ticket", description: "I'll share the URL" },
		{ label: "I have a Figma design", description: "I'll share a Figma link" },
		{ label: "I'll describe it now", description: "I'll type out what I want in the free-text field" },
	]);

	assert.equal(result.length, 2);
	assert.equal(result[0].label, "I have a Jira ticket");
	assert.equal(result[1].label, "I have a Figma design");
});
