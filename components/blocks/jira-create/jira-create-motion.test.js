const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const esbuild = require("esbuild");
const { loadCjsModuleFromText } = require(path.join(process.cwd(), "scripts/lib/esbuild-cjs-loader.js"));

async function loadMotionHarness() {
	const result = await esbuild.build({
		stdin: {
			contents: `
				export {
					getJiraCreateArrivalDelayS,
					getJiraCreateMotion,
					getJiraCreateSlotTransition,
					JIRA_CREATE_CARD_STAGGER_S,
					JIRA_CREATE_HIDDEN_SCALE,
				} from "./components/blocks/jira-create/lib/jira-create-motion";
			`,
			loader: "ts",
			resolveDir: process.cwd(),
			sourcefile: "jira-create-motion-harness.ts",
		},
		bundle: true,
		format: "cjs",
		platform: "node",
		tsconfig: path.join(process.cwd(), "tsconfig.json"),
		write: false,
	});

	return loadCjsModuleFromText(result.outputFiles[0].text, "jira-create-motion-harness.cjs");
}

test("create motion treats the whole card as one fade-and-scale entrance", async () => {
	const harness = await loadMotionHarness();
	const motion = harness.getJiraCreateMotion(false);

	assert.equal(motion.card.hidden.scale, harness.JIRA_CREATE_HIDDEN_SCALE);
	assert.equal(motion.card.hidden.scale, 0.8);
	assert.equal(motion.card.hidden.opacity, 0);
	assert.equal(motion.card.show.scale, 1);
	assert.equal(motion.card.show.opacity, 1);
	assert.equal(motion.backdrop, undefined);
	assert.equal(motion.item, undefined);
	assert.equal(motion.surface, undefined);
	assert.equal(motion.card.show.transition.staggerChildren, undefined);
	assert.equal(harness.JIRA_CREATE_CARD_STAGGER_S, 0.15);
});

test("the card scales up over duration-slower while opacity lands at duration-medium", async () => {
	const harness = await loadMotionHarness();
	const motion = harness.getJiraCreateMotion(false);

	// duration-slower: long enough to watch the card grow into the seam it made.
	assert.equal(motion.card.show.transition.duration, 0.4);
	assert.deepEqual(motion.card.show.transition.ease, [0, 0.4, 0, 1]);
	// duration-medium: readable well before the scale settles.
	assert.equal(motion.card.show.transition.opacity.duration, 0.2);
	// The slot pushes the cards below it apart on the same curve as the scale.
	assert.deepEqual(harness.getJiraCreateSlotTransition(false), {
		duration: 0.4,
		ease: [0, 0.4, 0, 1],
		delay: 0,
	});
});

test("an arrival delay applies to the scale and the opacity override alike", async () => {
	const harness = await loadMotionHarness();
	const motion = harness.getJiraCreateMotion(false, harness.JIRA_CREATE_CARD_STAGGER_S);

	assert.equal(motion.card.show.transition.delay, 0.15);
	// A per-value transition replaces the defaults outright, so a delay that is
	// only set at the top level would leave opacity starting early.
	assert.equal(motion.card.show.transition.opacity.delay, 0.15);
});

test("create motion drops travel under reduced motion and keeps a fade", async () => {
	const harness = await loadMotionHarness();
	const motion = harness.getJiraCreateMotion(true);

	assert.equal(motion.card.hidden.scale, undefined);
	assert.equal(motion.card.hidden.y, undefined);
	assert.equal(motion.card.hidden.opacity, 0);
	assert.equal(motion.card.show.opacity, 1);
	assert.equal(motion.card.show.scale, undefined);
});

test("create arrival delay staggers between cards and ignores unknown codes", async () => {
	const harness = await loadMotionHarness();

	assert.equal(harness.getJiraCreateArrivalDelayS(["PAY-1"], "PAY-1"), 0);
	assert.equal(harness.getJiraCreateArrivalDelayS(["PAY-1", "PAY-2"], "PAY-1"), 0);
	assert.equal(
		harness.getJiraCreateArrivalDelayS(["PAY-1", "PAY-2"], "PAY-2"),
		harness.JIRA_CREATE_CARD_STAGGER_S,
	);
	assert.equal(harness.getJiraCreateArrivalDelayS(["PAY-1", "PAY-2"], "PAY-9"), 0);
});

test("create motion source names the VPK duration and easing tokens", () => {
	const source = readFileSync(
		path.join(__dirname, "lib/jira-create-motion.ts"),
		"utf8",
	);

	assert.match(source, /duration-slower \+ ease-out/);
	assert.match(source, /duration-medium \+ ease-out/);
	assert.match(source, /duration-fast \+ ease-in/);
	assert.match(source, /duration-normal/);
	assert.doesNotMatch(source, /staggerChildren/);
});
