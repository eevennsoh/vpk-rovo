const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const PROGRESS_TRACKER_SOURCE = fs.readFileSync(path.join(__dirname, "progress-tracker.tsx"), "utf8");
const SPINNER_SOURCE = fs.readFileSync(path.join(__dirname, "spinner.tsx"), "utf8");
const EXPERIMENTAL_SPINNER_SOURCE = fs.readFileSync(path.join(__dirname, "spinner-experimental.tsx"), "utf8");
const EXPERIMENTAL_SPINNER_STYLES = fs.readFileSync(path.join(__dirname, "spinner-experimental.module.css"), "utf8");
const SPINNER_DETAIL_SOURCE = fs.readFileSync(path.join(__dirname, "../../app/data/details/ui/spinner.ts"), "utf8");
const TAILWIND_THEME_SOURCE = fs.readFileSync(path.join(__dirname, "../../app/tailwind-theme.css"), "utf8");

test("ProgressTracker supports optional bylines and warning steps without replacing default labels", () => {
	assert.match(PROGRESS_TRACKER_SOURCE, /export type ProgressTrackerStepState = "todo" \| "current" \| "done" \| "warning"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /label: React\.ReactNode/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /byline\?: React\.ReactNode/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /labelClassName\?: string/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /bylineClassName\?: string/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /import WarningIcon from "@atlaskit\/icon\/core\/warning"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /import \{ Spinner \} from "@\/components\/ui\/spinner"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /state === "warning"[\s\S]*token\("color\.icon\.warning"\)/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /state === "current"[\s\S]*<Spinner size="xs" className="text-text-subtle" \/>/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /<div className="flex size-3 items-center justify-center">/u);
	assert.doesNotMatch(PROGRESS_TRACKER_SOURCE, /currentSpinner/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /data-slot="progress-tracker-label"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /data-slot="progress-tracker-byline"/u);
	assert.match(PROGRESS_TRACKER_SOURCE, /typeof step\.label === "string" \? step\.label\.trim\(\) : ""/u);
});

test("Spinner preserves the CodePen chasing-tail motion without competing rotation drivers", () => {
	assert.match(SPINNER_SOURCE, /default: "text-icon-subtlest"/u);
	assert.match(SPINNER_SOURCE, /defaultVariants: \{[\s\S]*variant: "default"/u);
	assert.match(SPINNER_SOURCE, /variant = "default"/u);
	assert.match(SPINNER_DETAIL_SOURCE, /name: "size",[\s\S]*default: `"default"`,[\s\S]*name: "variant",[\s\S]*default: `"default"`,/u);
	assert.match(SPINNER_SOURCE, /import \{ useReducedMotion \} from "motion\/react"/u);
	assert.match(SPINNER_SOURCE, /<svg/u);
	assert.match(SPINNER_SOURCE, /<circle/u);
	assert.match(SPINNER_SOURCE, /transform="rotate\(-90 25 25\)"/u);
	assert.match(
		SPINNER_SOURCE,
		/"spin calc\(var\(--duration-slowest\) \* 2\) var\(--ease-linear\) infinite"/u,
	);
	assert.match(SPINNER_SOURCE, /strokeDasharray="56 200"/u);
	assert.match(SPINNER_SOURCE, /strokeDashoffset="0"/u);
	assert.match(
		SPINNER_SOURCE,
		/const ROVO_RAINBOW_BANDS = \[[\s\S]*\{ color: "#FCA700", share: 0\.3, start: 0 \}[\s\S]*\{ color: "#6A9A23", share: 0\.18, start: 0\.3 \}[\s\S]*\{ color: "#1868DB", share: 0\.21, start: 0\.48 \}[\s\S]*\{ color: "#AF59E1", share: 0\.31, start: 0\.69 \}/u,
	);
	assert.match(SPINNER_SOURCE, /<mask[\s\S]*id=\{tailMaskId\}[\s\S]*maskUnits="userSpaceOnUse"/u);
	assert.match(SPINNER_SOURCE, /\{ROVO_RAINBOW_BANDS\.map\(\(band\) => \{/u);
	assert.match(SPINNER_SOURCE, /const segmentLength = SPINNER_CIRCUMFERENCE \* band\.share/u);
	assert.match(SPINNER_SOURCE, /strokeDasharray=\{`\$\{segmentLength\} \$\{SPINNER_CIRCUMFERENCE - segmentLength\}`\}/u);
	assert.match(SPINNER_SOURCE, /strokeDashoffset=\{-SPINNER_CIRCUMFERENCE \* band\.start\}/u);
	assert.doesNotMatch(SPINNER_SOURCE, /linearGradient|ROVO_RAINBOW_STOPS/u);
	assert.match(SPINNER_SOURCE, /phaseOffsetMs\?: number/u);
	assert.match(SPINNER_SOURCE, /const SPINNER_LOOP_DURATION_MS = 1200/u);
	assert.match(SPINNER_SOURCE, /normalizeSpinnerPhaseOffsetMs\(phaseOffsetMs\)/u);
	assert.match(SPINNER_SOURCE, /animationDelay: shouldReduceMotion \? undefined : negativePhaseOffset/u);
	assert.equal(SPINNER_SOURCE.match(/begin=\{negativePhaseOffset\}/gu)?.length, 2);
	assert.doesNotMatch(SPINNER_SOURCE, /pathLength|pathOffset/u);
	assert.doesNotMatch(SPINNER_SOURCE, /animateTransform/u);
	assert.doesNotMatch(SPINNER_SOURCE, /animate-spin/u);
	assert.match(
		SPINNER_SOURCE,
		/<animate[\s\S]*attributeName="stroke-dasharray"[\s\S]*dur="1\.2s"[\s\S]*keyTimes="0;0\.5;1"[\s\S]*repeatCount="indefinite"[\s\S]*values="1 200;89 200;89 200"/u,
	);
	assert.match(
		SPINNER_SOURCE,
		/<animate[\s\S]*attributeName="stroke-dashoffset"[\s\S]*dur="1\.2s"[\s\S]*keyTimes="0;0\.5;1"[\s\S]*repeatCount="indefinite"[\s\S]*values="0;-35;-124"/u,
	);
	assert.match(SPINNER_SOURCE, /const tailAnimations = shouldReduceMotion \? null : \(/u);
});

test("Spinner exposes the Jira prototype morph only as an experimental variant", () => {
	assert.match(SPINNER_SOURCE, /experimental: ""/u);
	assert.match(SPINNER_SOURCE, /variant === "experimental"/u);
	assert.match(SPINNER_SOURCE, /<ExperimentalSpinner/u);
	assert.match(EXPERIMENTAL_SPINNER_SOURCE, /const HEX =/u);
	assert.match(EXPERIMENTAL_SPINNER_SOURCE, /const SPARKLE =/u);
	assert.match(EXPERIMENTAL_SPINNER_SOURCE, /styles\.rotatorMotion/u);
	assert.match(EXPERIMENTAL_SPINNER_SOURCE, /styles\.morphMotion/u);
	assert.match(EXPERIMENTAL_SPINNER_STYLES, /@keyframes rotate-shape/u);
	assert.match(EXPERIMENTAL_SPINNER_STYLES, /@keyframes morph-shape/u);
	assert.match(EXPERIMENTAL_SPINNER_SOURCE, /shouldReduceMotion \? HEX : SPARKLE/u);
	assert.match(SPINNER_DETAIL_SOURCE, /`experimental`/u);
	assert.match(SPINNER_DETAIL_SOURCE, /spinner-demo-experimental/u);
});

test("Shimmer keeps its token-backed CSS sweep animation", () => {
	assert.match(TAILWIND_THEME_SOURCE, /@keyframes text-shimmer-motion[\s\S]*background-position: var\(--text-shimmer-start-position\), 0% center;[\s\S]*background-position: 0% center, 0% center;/u);
	assert.match(TAILWIND_THEME_SOURCE, /@utility shimmer-sweep-motion[\s\S]*animation: text-shimmer-motion var\(--text-shimmer-duration\) var\(--ease-linear\) infinite;/u);
});
