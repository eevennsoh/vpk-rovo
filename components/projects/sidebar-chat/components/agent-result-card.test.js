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
const CHAT_PANEL_SOURCE = fs.readFileSync(
	path.join(__dirname, "../page.tsx"),
	"utf8",
);
const MESSAGE_TURNS_SOURCE = fs.readFileSync(
	path.join(__dirname, "../../shared/message-turns.tsx"),
	"utf8",
);

test("AgentResultCard renders created agent profile description", () => {
	assert.match(
		AGENT_RESULT_CARD_SOURCE,
		/import \{ AgentCard \} from "@\/components\/blocks\/agent-card";/u,
	);
	assert.match(AGENT_RESULT_CARD_SOURCE, /data-testid="rovo-agent-result-card"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /export function isGeneratedAgentResult/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /return agent\?\.action === "create";/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /if \(!isGeneratedAgentResult\(agent\)\) \{[\s\S]*return null;[\s\S]*\}/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /function getAgentDescription\(agent: AgentResult\): string/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /RFP Drafter monitors Drafting tickets, reads Jira context/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /DEFAULT_GENERATED_AGENT_AVATAR_SRC = "\/avatar-agent\/teamwork-agents\/blocker-checker\.svg";/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /function getAgentDisplayName\(agent: AgentResult\): string/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /const RFP_DRAFTING_AGENT_ID = "rfp-drafting-agent";/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /agent\.agentId === RFP_DRAFTING_AGENT_ID \? "RFP Drafter" : agent\.name/u);
	assert.match(
		AGENT_RESULT_CARD_SOURCE,
		/<AgentCard[\s\S]*avatarSrc=\{avatarSrc\}[\s\S]*coverSrc=\{avatarSrc\}[\s\S]*description=\{description\}[\s\S]*inputActionLabel=\{`Chat with \$\{displayName\}`\}[\s\S]*inputPlaceholder=\{`Chat with \$\{displayName\}`\}[\s\S]*name=\{displayName\}[\s\S]*onInputAction=\{handleSelectAgent\}[\s\S]*onVoiceInput=\{handleSelectAgent\}[\s\S]*partnerName=\{DEFAULT_AGENT_PARTNER_NAME\}[\s\S]*\/>/u,
	);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /ArtifactCard/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /SkillTag/u);
});

test("AgentResultCard dispatches a generic select-agent event", () => {
	assert.match(
		AGENT_RESULT_CARD_SOURCE,
		/export const ROVO_AGENT_RESULT_SELECT_EVENT = "rovo:select-agent-result";/u,
	);
	assert.match(
		AGENT_RESULT_CARD_SOURCE,
		/onSelectAgent\?\.\(agent\);[\s\S]*window\.dispatchEvent\(new CustomEvent\(ROVO_AGENT_RESULT_SELECT_EVENT, \{[\s\S]*agentId: agent\.agentId,[\s\S]*source: "agent-result-card"/u,
	);
});

test("MessageBubble leaves generated result cards outside the assistant message", () => {
	assert.doesNotMatch(MESSAGE_BUBBLE_SOURCE, /getMessageAgentResult/u);
	assert.doesNotMatch(MESSAGE_BUBBLE_SOURCE, /AgentResultCard/u);
	assert.doesNotMatch(MESSAGE_BUBBLE_SOURCE, /ArtifactResultCard/u);
});

test("ChatPanel renders generated result cards after the turn container", () => {
	assert.match(MESSAGE_TURNS_SOURCE, /renderTurnAfter\?:/u);
	assert.match(
		MESSAGE_TURNS_SOURCE,
		/<\/div>[\s\S]*\{hasRenderedTurnAfter \? renderedTurnAfter : null\}/u,
	);
	assert.match(CHAT_PANEL_SOURCE, /getMessageAgentResult/u);
	assert.match(CHAT_PANEL_SOURCE, /getMessageArtifactResult/u);
	assert.match(CHAT_PANEL_SOURCE, /hasTurnCompleteSignal/u);
	assert.match(CHAT_PANEL_SOURCE, /import \{ ArtifactResultCard, type ArtifactResult \} from "\.\/components\/artifact-result-card";/u);
	assert.match(CHAT_PANEL_SOURCE, /import \{ AgentResultCard, isGeneratedAgentResult \} from "\.\/components\/agent-result-card";/u);
	assert.match(CHAT_PANEL_SOURCE, /const handleAgentResultSelect = useCallback\(\(agent: RovoDataParts\["agent-result"\]\) => \{[\s\S]*selectableAgents\.some\(\(selectableAgent\) => selectableAgent\.id === agent\.agentId\)[\s\S]*selectAgent\(agent\.agentId\);/u);
	assert.match(
		CHAT_PANEL_SOURCE,
		/renderTurnAfter=\{\(turn\) => \{[\s\S]*const generatedAgentResult =[\s\S]*isGeneratedAgentResult\(agentResult\) && hasTurnCompleteSignal\(message\)[\s\S]*if \(artifactResult && !generatedAgentResult\)[\s\S]*if \(generatedAgentResult\)[\s\S]*className="w-full space-y-2" data-testid="rovo-generated-result-group"[\s\S]*<ArtifactResultCard[\s\S]*<AgentResultCard[\s\S]*onSelectAgent=\{handleAgentResultSelect\}/u,
	);
});
