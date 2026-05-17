const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const AGENT_RESULT_CARD_SOURCE = fs.readFileSync(
	path.join(__dirname, "agent-result-card.tsx"),
	"utf8",
);
const MESSAGE_BUBBLE_SOURCE = fs.readFileSync(
	path.join(__dirname, "message-bubble.tsx"),
	"utf8",
);

test("AgentResultCard renders the created agent summary with the agent icon", () => {
	assert.match(
		AGENT_RESULT_CARD_SOURCE,
		/import \{ ArtifactCard, type ArtifactCardProps \} from "@\/components\/ui-custom\/artifact";/u,
	);
	assert.match(AGENT_RESULT_CARD_SOURCE, /data-testid="rovo-agent-result-card"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /iconName: "ai-agent"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /descriptionParts\.push\(`Assigned to \$\{agent\.assignedColumn\}`\);/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /description=\{getAgentDescription\(agent\)\}/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /displayMode="preview"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /Open agent details/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /agent\.tools\.filter/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /<ArtifactCard[\s\S]*visualIdentity=\{AGENT_RESULT_VISUAL_IDENTITY\}/u);
});

test("AgentResultCard dispatches a generic open-agent event", () => {
	assert.match(
		AGENT_RESULT_CARD_SOURCE,
		/export const ROVO_AGENT_RESULT_OPEN_EVENT = "rovo:open-agent-result";/u,
	);
	assert.match(
		AGENT_RESULT_CARD_SOURCE,
		/window\.dispatchEvent\(new CustomEvent\(ROVO_AGENT_RESULT_OPEN_EVENT, \{[\s\S]*agentId: agent\.agentId,[\s\S]*source: "agent-result-card"/u,
	);
});

test("MessageBubble renders agent result data parts alongside artifact result cards", () => {
	assert.match(
		MESSAGE_BUBBLE_SOURCE,
		/getMessageAgentResult/u,
	);
	assert.match(
		MESSAGE_BUBBLE_SOURCE,
		/import \{ AgentResultCard \} from "\.\/agent-result-card";/u,
	);
	assert.match(
		MESSAGE_BUBBLE_SOURCE,
		/const agentResult = getMessageAgentResult\(message\);/u,
	);
	assert.match(
		MESSAGE_BUBBLE_SOURCE,
		/<AgentResultCard agent=\{agentResult\} \/>/u,
	);
});
