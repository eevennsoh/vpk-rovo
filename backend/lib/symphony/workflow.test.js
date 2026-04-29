"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
	extractWorkflowFrontMatter,
	parseYamlMapping,
	renderStrictTemplate,
} = require("./workflow");

test("parseYamlMapping supports nested maps, arrays, and block scalars", () => {
	const parsed = parseYamlMapping(`
tracker:
  team: ENG
  active_states: [Todo, Ready]
hooks:
  pre_start: |-
    echo "$SYMPHONY_ISSUE_IDENTIFIER"
dispatch:
  max_parallel: 2
`);

	assert.deepEqual(parsed.tracker.active_states, ["Todo", "Ready"]);
	assert.equal(parsed.tracker.team, "ENG");
	assert.equal(parsed.dispatch.max_parallel, 2);
	assert.equal(parsed.hooks.pre_start, "echo \"$SYMPHONY_ISSUE_IDENTIFIER\"");
});

test("extractWorkflowFrontMatter requires YAML front matter", () => {
	assert.throws(
		() => extractWorkflowFrontMatter("# no front matter"),
		/error: Workflow file must start with YAML front matter/i,
	);
});

test("renderStrictTemplate renders issue data and rejects unknown variables", () => {
	const issue = {
		description: "Fix the retry path.",
		identifier: "ENG-123",
		labels: ["bug", "codex"],
		title: "Retry failed job",
	};

	const rendered = renderStrictTemplate(
		"{{ issue.identifier }}: {{ issue.title }}\n{% for label in issue.labels %}- {{ label }}\n{% endfor %}Attempt {{ attempt }}",
		{ attempt: 2, issue },
	);

	assert.equal(rendered, "ENG-123: Retry failed job\n- bug\n- codex\nAttempt 2");
	assert.throws(() => renderStrictTemplate("{{ issue.missing }}", { issue }), /Unknown template variable/);
	assert.throws(() => renderStrictTemplate("{{ issue.title | upcase }}", { issue }), /Unsupported template filter/);
});
