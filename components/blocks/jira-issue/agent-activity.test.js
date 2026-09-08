const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { join } = require("node:path");
const { test } = require("node:test");

const AGENT_ACTIVITY_SOURCE = readFileSync(join(__dirname, "agent-activity.tsx"), "utf8");
const AGENT_ACTIVITY_STARTUP_SOURCE = readFileSync(join(__dirname, "agent-activity-startup.tsx"), "utf8");
const TEXT_EFFECTS_SOURCE = readFileSync(join(__dirname, "../../visual/text-effects/index.tsx"), "utf8");
const GENERATIVE_ACTIONS_SOURCE = readFileSync(
	join(__dirname, "../../projects/jira-golden-journeys-v4/hooks/use-jira-golden-journeys-v4-generative-actions.ts"),
	"utf8",
);

test("Needs input titles stay solid; only cycling tool-call labels shimmer", () => {
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/isAwaitingInput \? \(\s*<span[\s\S]*\{summary\.label\}[\s\S]*<AnimatedDots/u,
	);
	assert.doesNotMatch(
		AGENT_ACTIVITY_SOURCE,
		/isAwaitingInput \? \([\s\S]*?<Shimmer[\s\S]*?\{summary\.label\}/u,
	);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/const isCycling = !shouldReduceMotion && labels\.length > 1;/u,
	);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/isCycling \? \(\s*<Shimmer[\s\S]*duration=\{JIRA_ISSUE_AGENT_SHIMMER_DURATION\}[\s\S]*spread=\{JIRA_ISSUE_AGENT_SHIMMER_SPREAD\}[\s\S]*\{label\}[\s\S]*<\/Shimmer>\s*\) : label/u,
	);
	assert.match(
		AGENT_ACTIVITY_SOURCE,
		/if \(!isCycling\) \{\s*return undefined;/u,
	);
});

test("new Jira agent and skill sessions use the staged startup presentation", () => {
	assert.match(GENERATIVE_ACTIONS_SOURCE, /startupSequence: "jira-work-item-start"/u);
	assert.match(GENERATIVE_ACTIONS_SOURCE, /startedAtMs: Date\.now\(\)/u);
	assert.match(
		GENERATIVE_ACTIONS_SOURCE,
		/progressJiraGoldenJourneysV4WorkItemOnStart\(\s*linkJiraKanbanAgentSession\(columns, card\.code, activity\),\s*card\.code,\s*\)/u,
	);
	assert.match(AGENT_ACTIVITY_STARTUP_SOURCE, /import TextEffects from "@\/components\/visual\/text-effects";/u);
	assert.match(
		AGENT_ACTIVITY_STARTUP_SOURCE,
		/import \{ configForEffect \} from "@\/components\/visual\/text-effects\/data";/u,
	);
	assert.match(AGENT_ACTIVITY_STARTUP_SOURCE, /text="Let's get started"/u);
	assert.match(AGENT_ACTIVITY_STARTUP_SOURCE, /presentation="inline"/u);
	assert.match(AGENT_ACTIVITY_STARTUP_SOURCE, /splitBy: "word"/u);
	assert.match(AGENT_ACTIVITY_STARTUP_SOURCE, /jira-agent-wave-motion/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /Gathering context/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /<TWGLoader label="" size="small" \/>/u);
	assert.match(AGENT_ACTIVITY_STARTUP_SOURCE, /<Shimmer[\s\S]*>\s*\{label\}\s*<\/Shimmer>/u);
	assert.match(AGENT_ACTIVITY_STARTUP_SOURCE, /shouldReduceMotion \? "working"/u);
	assert.match(AGENT_ACTIVITY_STARTUP_SOURCE, /Date\.now\(\) - startedAtMs/u);
	assert.match(AGENT_ACTIVITY_SOURCE, /featuredActivity\?\.startedAtMs/u);
	assert.match(TEXT_EFFECTS_SOURCE, /import \{ AnimatePresence, motion,/u);
	assert.match(
		TEXT_EFFECTS_SOURCE,
		/presentation === "inline"[\s\S]*<AnimatePresence initial>\s*<span className=\{cn\("inline-block", className\)\} lang="en">\s*\{renderedText\}[\s\S]*<\/AnimatePresence>/u,
	);
	assert.doesNotMatch(TEXT_EFFECTS_SOURCE, /<AnimatePresence initial>\s*<span key=\{animationKey\}/u);
});
