const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

const AGENTS_VIEW_SOURCE = fs.readFileSync(path.join(__dirname, "page.tsx"), "utf8");
const AGENTS_DEMO_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/website/demos/projects/agents-demo.tsx"),
	"utf8",
);
const DETAILS_ACCORDION_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/agents/components/work-item-modal/details-accordion.tsx"),
	"utf8",
);
const ATTACHMENTS_SECTION_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "components/projects/agents/components/work-item-modal/attachments-section.tsx"),
	"utf8",
);
const ROVO_CHAT_CONTEXT_SOURCE = fs.readFileSync(
	path.join(process.cwd(), "app/contexts/context-rovo-chat.tsx"),
	"utf8",
);

async function loadRfpContextHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export { BOARD_COLUMNS } from "./components/projects/agents/data/board-data";
				export {
					AGENTS_BOARD_CONTEXT_LABEL,
					RFP_101_WORK_ITEM,
					formatActiveJiraWorkItemContext,
					formatAgentsBoardContext,
					getAgentsWorkItemForCard,
					resolveAgentsChatScreenContext,
				} from "./components/projects/agents/data/rfp-work-items";
				export { mergeRovoContextDescriptions } from "./lib/rovo-context";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "rfp-context-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text);
}

test("RFP-101 active work item formats a bounded hidden Jira context block", async () => {
	const harness = await loadRfpContextHarness();
	const context = harness.formatActiveJiraWorkItemContext(harness.RFP_101_WORK_ITEM);

	assert.match(context, /^\[Active Jira Work Item Context\]/);
	assert.match(context, /\[End Active Jira Work Item Context\]$/);
	assert.match(context, /Enterprise Evaluation Account/);
	assert.match(context, /Description: A large enterprise customer is evaluating Atlassian/);
	assert.match(context, /Due date: Sep 8, 2025/);
	assert.match(context, /Labels: qualification, enterprise/);
	assert.doesNotMatch(context, /competitive-replacement/);
	assert.match(context, /multi-thousand users/);
	assert.match(context, /incumbent service-management, CMDB/);
	assert.match(context, /Response team needs:/);
	assert.match(context, /RFP-105: Build requirement matrix/);
	assert.match(context, /enterprise-rfp-requirements\.pdf/);
	assert.match(context, /Recent activity:/);
	assert.match(context, /Sales engineering can own JSM workflows/);
});

test("RFP-101 includes the mixed static attachment placeholder set", async () => {
	const harness = await loadRfpContextHarness();
	const attachments = harness.RFP_101_WORK_ITEM.attachments;

	assert.equal(attachments.length, 7);
	assert.deepEqual(
		attachments.map((attachment) => attachment.ext),
		["page", "xlsx", "docx", "pdf", "mp3", "png", "mp4"],
	);
	assert.ok(
		attachments
			.filter((attachment) => attachment.ext !== "mp3")
			.every((attachment) => attachment.previewSrc?.startsWith("/illustration-ai/agents-attachments/")),
	);
	assert.equal(
		attachments.find((attachment) => attachment.ext === "mp3")?.previewSrc,
		undefined,
	);
	assert.ok(
		attachments.every((attachment) => !("sourceHref" in attachment)),
	);
	assert.deepEqual(
		attachments
			.filter((attachment) => attachment.sourceProduct)
			.map((attachment) => attachment.sourceLabel),
		["Confluence page", "Loom video"],
	);

	const context = harness.formatActiveJiraWorkItemContext(harness.RFP_101_WORK_ITEM);
	assert.match(context, /rfp-intake-notes\.page/);
	assert.match(context, /proposal-audio-briefing\.mp3/);
	assert.match(context, /proposal-walkthrough\.mp4/);
});

test("board fallback formats bounded visible /agents context", async () => {
	const harness = await loadRfpContextHarness();
	const context = harness.formatAgentsBoardContext();

	assert.match(context, /^\[Agents Board Context\]/);
	assert.match(context, /\[End Agents Board Context\]$/);
	assert.match(context, /Enterprise RFP Response/);
	assert.match(context, /RFP Intake: 7 work items/);
	assert.match(context, /RFP-101: Qualify enterprise service-management RFP/);
	assert.ok(context.length < 1_500);
});

test("non-RFP-101 work items format a lightweight active work item context", async () => {
	const harness = await loadRfpContextHarness();
	const workItem = harness.getAgentsWorkItemForCard({
		code: "RFP-102",
		title: "Parse supplier questionnaire and requested files",
	});

	assert.equal(workItem.code, "RFP-102");
	assert.equal(workItem.title, "Parse supplier questionnaire and requested files");
	assert.match(workItem.description, /Review the supplier packet/);
	assert.ok(workItem.description.length > 250);

	const context = harness.formatActiveJiraWorkItemContext(workItem);
	assert.match(context, /^\[Active Jira Work Item Context\]/);
	assert.match(context, /Key: RFP-102/);
	assert.match(context, /Title: Parse supplier questionnaire and requested files/);
	assert.match(context, /Description: Review the supplier packet/);
	assert.match(context, /customer-reference requests/);
	assert.match(context, /\[End Active Jira Work Item Context\]$/);
	assert.equal(harness.formatActiveJiraWorkItemContext(null), undefined);
});

test("every visible agents board card resolves to a substantial work item description", async () => {
	const harness = await loadRfpContextHarness();
	const cards = harness.BOARD_COLUMNS.flatMap((column) => column.cards);

	assert.equal(cards.length, 16);

	for (const card of cards) {
		const workItem = harness.getAgentsWorkItemForCard(card);
		assert.equal(workItem.code, card.code);
		assert.equal(workItem.title, card.title);
		assert.equal(typeof workItem.description, "string", `${card.code} is missing a description`);
		assert.ok(workItem.description.length > 220, `${card.code} description is too short`);
	}
});

test("work item labels are derived from visible board card tags", async () => {
	const harness = await loadRfpContextHarness();
	const cards = harness.BOARD_COLUMNS.flatMap((column) => column.cards);
	const rfp101Card = cards.find((card) => card.code === "RFP-101");

	assert.ok(rfp101Card);
	assert.deepEqual(
		harness.RFP_101_WORK_ITEM.labels,
		rfp101Card.tags.map((tag) => tag.text),
	);
	assert.deepEqual(harness.RFP_101_WORK_ITEM.labelTags, rfp101Card.tags);

	for (const card of cards) {
		const workItem = harness.getAgentsWorkItemForCard(card);
		assert.deepEqual(
			workItem.labels,
			card.tags.map((tag) => tag.text),
			`${card.code} label text should match board`,
		);
		assert.deepEqual(workItem.labelTags, card.tags, `${card.code} label colors should match board`);
	}
});

test("work item details render the board tag model", () => {
	assert.match(DETAILS_ACCORDION_SOURCE, /const labelTags: WorkItemLabelTag\[\] = workItem\.labelTags\?\.length/);
	assert.match(DETAILS_ACCORDION_SOURCE, /<TagGroup className="gap-1">/);
	assert.match(DETAILS_ACCORDION_SOURCE, /<Tag key=\{label\.text\} color=\{label\.color\}>/);
	assert.doesNotMatch(DETAILS_ACCORDION_SOURCE, /enterprise-rfp", "q4-sales/);
});

test("agents attachment grid mixes simple file icons with source product logos", () => {
	assert.match(ATTACHMENTS_SECTION_SOURCE, /from "@\/components\/ui\/icon-tile";/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /from "@\/components\/ui\/logo";/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /from "@\/components\/ui\/vpk-icons";/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /AtlassianLogo/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /ATTACHMENT_SOURCE_LABELS/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /name=\{file\.sourceProduct\}/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /FileChartColumnIcon/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /Music2Icon/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /VideoIcon/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /<MoreHorizontalIcon size="small" \/>/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /<PlusIcon size="small" \/>/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /<IconTile[\s\S]*size="medium"/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /variant="redBold"/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /icon=\{<Music2Icon \/>\}/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /size=\{12\}/);
	assert.match(ATTACHMENTS_SECTION_SOURCE, /\{renderAttachmentIcon\(file\)\}/);
	assert.doesNotMatch(ATTACHMENTS_SECTION_SOURCE, /icon=\{renderAttachmentIcon\(file\)\}/);
	assert.doesNotMatch(ATTACHMENTS_SECTION_SOURCE, /\/website\/vpk-logo-dark\.svg/);
	assert.doesNotMatch(ATTACHMENTS_SECTION_SOURCE, /label="VPK"/);
	assert.doesNotMatch(ATTACHMENTS_SECTION_SOURCE, /showVpkLogo/);
	assert.doesNotMatch(ATTACHMENTS_SECTION_SOURCE, /\{file\.date\}/);
	assert.doesNotMatch(ATTACHMENTS_SECTION_SOURCE, /\{file\.ext\}\s*<\/span>/);
	assert.doesNotMatch(ATTACHMENTS_SECTION_SOURCE, /uppercase/);
	assert.doesNotMatch(ATTACHMENTS_SECTION_SOURCE, /@atlaskit\/icon\/core/);
	assert.doesNotMatch(ATTACHMENTS_SECTION_SOURCE, /ConfluenceIcon|LoomIcon|Google|Microsoft/);
});

test("agents chat screen resolver switches from board fallback to active work item", async () => {
	const harness = await loadRfpContextHarness();

	const boardContext = harness.resolveAgentsChatScreenContext(null);
	assert.deepEqual(boardContext.chatContextBar, {
		label: harness.AGENTS_BOARD_CONTEXT_LABEL,
		iconName: "board",
		signature: "agents-board:enterprise-rfp-response",
	});
	assert.match(boardContext.contextDescription, /^\[Agents Board Context\]/);

	const workItemContext = harness.resolveAgentsChatScreenContext(harness.RFP_101_WORK_ITEM);
	assert.deepEqual(workItemContext.chatContextBar, {
		label: "RFP-101: Qualify enterprise service-management RFP",
		iconName: "work-item",
		signature: "agents-work-item:RFP-101",
	});
	assert.match(workItemContext.contextDescription, /^\[Active Jira Work Item Context\]/);
});

test("Rovo context merging preserves active work item context and suggestion context", async () => {
	const harness = await loadRfpContextHarness();
	const merged = harness.mergeRovoContextDescriptions(
		"[Active Jira Work Item Context]\nKey: RFP-101\n[End Active Jira Work Item Context]",
		"[Work Summary Scope]\nSearch Jira and Confluence.\n[End Work Summary Scope]",
	);

	assert.equal(
		merged,
		[
			"[Active Jira Work Item Context]\nKey: RFP-101\n[End Active Jira Work Item Context]",
			"[Work Summary Scope]\nSearch Jira and Confluence.\n[End Work Summary Scope]",
		].join("\n\n"),
	);
});

test("Rovo provider merges default context with per-prompt context", () => {
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/import \{ mergeRovoContextDescriptions \} from "@\/lib\/rovo-context";/,
	);
	assert.match(
		ROVO_CHAT_CONTEXT_SOURCE,
		/contextDescription: mergeRovoContextDescriptions\(\s*defaultOptions\.contextDescription,\s*options\.contextDescription\s*\)/,
	);
});

test("Agents view opens the richer active work item through the presentation controller", () => {
	assert.match(AGENTS_VIEW_SOURCE, /const workItem = getAgentsWorkItemForCard\(card\);/);
	assert.match(AGENTS_VIEW_SOURCE, /workItemPresentation\.openModal\(workItem\)/);
	assert.match(AGENTS_VIEW_SOURCE, /workItem=\{selectedWorkItem\}/);
});

test("Agents demo feeds active work item context into RovoChatProvider defaults", () => {
	assert.match(
		AGENTS_DEMO_SOURCE,
		/resolveAgentsChatScreenContext\(workItemPresentation\.state\.workItem\)/,
	);
	assert.match(AGENTS_DEMO_SOURCE, /contextDescription: mergeRovoContextDescriptions/);
	assert.match(AGENTS_DEMO_SOURCE, /agentsChatScreenContext\.contextDescription/);
	assert.match(AGENTS_DEMO_SOURCE, /<RovoChatProvider defaultPromptOptions=\{chatPromptOptions\}>/);
	assert.match(AGENTS_DEMO_SOURCE, /chatContextBar=\{agentsChatScreenContext\.chatContextBar\}/);
});
