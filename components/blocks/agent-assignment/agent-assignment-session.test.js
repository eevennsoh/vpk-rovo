const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");

function readProjectFile(filePath) {
	return fs.readFileSync(path.join(process.cwd(), filePath), "utf8");
}

test("Default uses the activity row and long session cards; Simple keeps the facepile", () => {
	const source = readProjectFile("components/blocks/agent-assignment/components/agent-assignment.tsx");
	const field = readProjectFile("components/blocks/agent-assignment/components/agent-assignment-default-field.tsx");
	const sessionMenu = readProjectFile(
		"components/blocks/agent-assignment/components/assigned-agents-session-menu.tsx",
	);
	const mapper = readProjectFile("components/blocks/agent-assignment/components/assignment-session.ts");
	const page = readProjectFile("components/blocks/agent-assignment/page.tsx");
	const details = readProjectFile("app/data/details/blocks/agent-assignment.ts");

	assert.match(source, /variant\?: AgentAssignmentVariant;/u);
	assert.match(source, /variant = "default"/u);
	assert.match(source, /variant === "simple" \? \(/u);
	assert.match(source, /<AssignedAgentsMenu/u);
	assert.match(source, /<AssignedAgentsSessionMenu/u);
	assert.match(source, /onContinueInAgent=\{onContinueExistingSession/u);
	assert.match(source, /onDeleteSession=\{undefined\}/u);
	assert.doesNotMatch(source, /onDeleteSession=\{onAssignedAgentIdsChange/u);
	assert.match(source, /onRenameSession=\{onRenameAssignedAgent/u);
	assert.match(source, /onToggleVisibility=\{onAssignedAgentIdsChange/u);
	assert.match(source, /variant === "default"[\s\S]*view === "assigned"[\s\S]*reason === "focus-out"/u);
	assert.match(source, /<AgentAssignmentDefaultField assignedAgents=\{assignedAgents\} \/>/u);
	assert.match(source, /aria-label=\{shown\.length === 0 \? "Assign agent" : triggerLabel\}/u);

	assert.match(field, /<JiraIssueAgentActivityRows/u);
	assert.match(field, /showAssignmentFlyout=\{false\}/u);
	assert.match(field, /avatarLayout="animated"/u);
	assert.match(field, /inheritChinSurface/u);
	assert.match(mapper, /export function toAssignmentActivity/u);
	assert.match(mapper, /export function toAssignmentSessionItem/u);
	assert.match(mapper, /state: assignmentSessionState\(statusKind\)/u);

	assert.match(sessionMenu, /<AgentSessionCard/u);
	assert.match(sessionMenu, /density="long"/u);
	assert.match(sessionMenu, /padding="compact"/u);
	assert.doesNotMatch(sessionMenu, /showMoreMenu=\{false\}/u);
	assert.match(sessionMenu, /onContinueInAgent=\{onContinueInAgent\}/u);
	assert.match(sessionMenu, /onDeleteSession=\{onDeleteSession\}/u);
	assert.match(sessionMenu, /onRenameSession=\{onRenameSession\}/u);
	assert.match(sessionMenu, /onToggleVisibility=\{onToggleVisibility\}/u);
	assert.match(sessionMenu, /moreMenuPositionerClassName="z-\[600\]"/u);
	assert.match(sessionMenu, /moreMenuPortalled=\{false\}/u);
	assert.match(sessionMenu, /className="flex w-full flex-col gap-0 p-1"/u);
	assert.doesNotMatch(sessionMenu, /gap-1/u);
	assert.match(mapper, /\.\.\.\(agent\.invokedBy \? \{ invokedBy: agent\.invokedBy \} : \{\}\)/u);
	assert.doesNotMatch(mapper, /DEFAULT_ASSIGNMENT_INVOKER/u);
	assert.doesNotMatch(mapper, /Priya Raman/u);
	assert.match(mapper, /\.\.\.\(agent\.host !== undefined \? \{ host: agent\.host \} : \{\}\)/u);
	assert.match(mapper, /\.\.\.\(agent\.role !== undefined \? \{ role: agent\.role \} : \{\}\)/u);
	assert.doesNotMatch(mapper, /host: "cloud"/u);
	const demoAgents = readProjectFile("components/blocks/agent-assignment/demo-assigned-agents.ts");
	assert.match(demoAgents, /invokedBy: DEMO_INVOKERS\[agent\.id\]/u);
	assert.match(demoAgents, /host: demoStatus\.host/u);
	assert.match(demoAgents, /role: demoStatus\.role/u);
	assert.match(demoAgents, /"github-copilot": \{[\s\S]*name: "Priya Raman"/u);
	assert.match(sessionMenu, /toAssignmentSessionItem\(row\)/u);
	assert.doesNotMatch(sessionMenu, /density="short"/u);
	assert.match(sessionMenu, /Assign agent/u);
	assert.doesNotMatch(mapper, /timeLabel: agent\.statusLabel/u);

	assert.match(page, /variant = "default"/u);
	assert.match(page, /variant=\{variant\}/u);
	assert.ok(details.indexOf('title: "Default"') < details.indexOf('title: "Simple"'));
});
