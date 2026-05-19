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
		/import \{ ArtifactCard, type ArtifactCardProps \} from "@\/components\/ui-custom\/artifact";/u,
	);
	assert.match(
		AGENT_RESULT_CARD_SOURCE,
		/import \{ RFP_DRAFTING_AGENT_AVATAR_SRC \} from "@\/components\/projects\/agents\/lib\/rfp-demo-state";/u,
	);
	assert.match(
		AGENT_RESULT_CARD_SOURCE,
		/import \{ SkillTag, SkillTagGroup, type SkillTagColor \} from "@\/components\/ui\/skill-tag";/u,
	);
	assert.match(AGENT_RESULT_CARD_SOURCE, /data-testid="rovo-agent-result-card"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /iconName: "ai-agent"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /AGENT_RESULT_DESCRIPTION = "Agent \\u2022 Version 1";/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /const description = agent\.description\?\.trim\(\) \|\| AGENT_RESULT_DESCRIPTION;/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /description=\{description\}/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /function getAgentLongDescription\(agent: AgentResult\): string/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /RFP Drafter monitors Drafting tickets, reads Jira context/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /const profileDescription = getAgentLongDescription\(agent\)\.trim\(\) \|\| description;/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, />Agent description<\/h4>[\s\S]*\{profileDescription\}/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /Assigned to \$\{agent\.assignedColumn\}/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /displayMode="preview"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /Chat with agent/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /RFP_DRAFTING_AGENT_TOOLS/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /function getAgentTools/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /agent\.tools\.filter/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /function getAgentDisplayName\(agent: AgentResult\): string/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /const RFP_DRAFTING_AGENT_ID = "rfp-drafting-agent";/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /agent\.agentId === RFP_DRAFTING_AGENT_ID \? "RFP Drafter" : agent\.name/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /title=\{displayName\}/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /function getAgentIdentityAvatarSrc\(agent: AgentResult\): string \| undefined/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /agent\.agentId === RFP_DRAFTING_AGENT_ID \? RFP_DRAFTING_AGENT_AVATAR_SRC : undefined/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /const identityAvatarSrc = getAgentIdentityAvatarSrc\(agent\);/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /vpk-html draft attachment/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, />Skills<\/h4>[\s\S]*<SkillTagGroup>[\s\S]*tools\.map[\s\S]*<SkillTag/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /"jira\.work_items": "get-jira-workitems"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /"teamwork_graph\.search": "teamwork-graph"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /"generate_pdf\.render_document": "generate-pdf"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /"jira\.attach_pdf": "attach-file"/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /\{getSkillTagLabel\(tool\)\}/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /function formatAgentTriggerLabel\(trigger: string\): string/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /replace\(\/\\bticket\\b\/giu, "work item"\)/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /replace\(\/\\\.\$\/u, ""\)/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, />Trigger<\/h4>[\s\S]*<AutomationIcon label="" size="small" \/>[\s\S]*<span>\{formatAgentTriggerLabel\(agent\.trigger\)\}<\/span>/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /function getSkillTagIcon\(tool: string\): ReactNode/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /function getSkillTagColor\(tool: string\): SkillTagColor/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /AGENT_CAPABILITIES/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /getAgentCapabilities/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /capabilities\.map/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, />Capabilities<\/h4>/u);
	assert.match(AGENT_RESULT_CARD_SOURCE, /text-icon-subtle/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /text-icon-brand/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /divide-y/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, /sm:grid-cols-2/u);
	assert.doesNotMatch(AGENT_RESULT_CARD_SOURCE, />Guardrail</u);
	assert.match(
		AGENT_RESULT_CARD_SOURCE,
		/<ArtifactCard[\s\S]*identityAvatarSrc=\{identityAvatarSrc\}[\s\S]*visualIdentity=\{identityAvatarSrc \? undefined : AGENT_RESULT_VISUAL_IDENTITY\}[\s\S]*>[\s\S]*\{profileDescription\}[\s\S]*<\/ArtifactCard>/u,
	);
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
	assert.match(CHAT_PANEL_SOURCE, /import \{ ArtifactResultCard, type ArtifactResult \} from "\.\/components\/artifact-result-card";/u);
	assert.match(CHAT_PANEL_SOURCE, /import \{ AgentResultCard \} from "\.\/components\/agent-result-card";/u);
	assert.match(CHAT_PANEL_SOURCE, /const handleAgentResultSelect = useCallback\(\(agent: RovoDataParts\["agent-result"\]\) => \{[\s\S]*selectableAgents\.some\(\(selectableAgent\) => selectableAgent\.id === agent\.agentId\)[\s\S]*selectAgent\(agent\.agentId\);/u);
	assert.match(
		CHAT_PANEL_SOURCE,
		/renderTurnAfter=\{\(turn\) => \{[\s\S]*const generatedResults = turn\.flatMap[\s\S]*getMessageArtifactResult\(message\)[\s\S]*getMessageAgentResult\(message\)[\s\S]*className="w-full space-y-2" data-testid="rovo-generated-result-group"[\s\S]*<ArtifactResultCard[\s\S]*<AgentResultCard[\s\S]*onSelectAgent=\{handleAgentResultSelect\}/u,
	);
});
