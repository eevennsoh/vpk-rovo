import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

// @ts-expect-error Node's strip-types test runner requires the explicit .ts extension here.
import { buildScrollMaskStyle } from "./lib.ts";

const ROOT = process.cwd();

function readWorkspaceFile(filePath: string): string {
	return fs.readFileSync(path.join(ROOT, filePath), "utf8");
}

test("buildScrollMaskStyle preserves the scrollbar gutter as an opaque mask track", () => {
	const style = buildScrollMaskStyle();

	assert.equal(style["--scroll-mask-fade-size"], "32px");
	assert.equal(style["--scroll-mask-scrollbar-width"], "10px");
	assert.equal(
		style.maskImage,
		"linear-gradient(to bottom, transparent 0, black var(--scroll-mask-fade-size), black calc(100% - var(--scroll-mask-fade-size)), transparent 100%), linear-gradient(black, black)",
	);
	assert.equal(style.WebkitMaskImage, style.maskImage);
	assert.equal(style.maskRepeat, "no-repeat, no-repeat");
	assert.equal(style.WebkitMaskRepeat, "no-repeat, no-repeat");
	assert.equal(style.maskPosition, "0 0, 100% 0");
	assert.equal(style.WebkitMaskPosition, "0 0, 100% 0");
	assert.equal(style.maskSize, "calc(100% - 10px) 100%, 10px 100%");
	assert.equal(style.WebkitMaskSize, "calc(100% - 10px) 100%, 10px 100%");
});

test("buildScrollMaskStyle resolves numeric fade and scrollbar values to pixels", () => {
	const style = buildScrollMaskStyle({ fadeSize: 24, scrollbarWidth: 12 });

	assert.equal(style["--scroll-mask-fade-size"], "24px");
	assert.equal(style["--scroll-mask-scrollbar-width"], "12px");
	assert.equal(style.maskSize, "calc(100% - 12px) 100%, 12px 100%");
});

test("Scroll Mask is wired into the Visual catalog route and demo registry", () => {
	assert.match(
		readWorkspaceFile("app/data/components.ts"),
		/visualComponent\("scroll-mask", "Scroll Mask", "@\/components\/visual\/scroll-mask"\)/,
	);
	assert.match(
		readWorkspaceFile("app/data/component-manifest.ts"),
		/visualComponent\("scroll-mask", "Scroll Mask", "@\/components\/visual\/scroll-mask"\)/,
	);
	assert.match(
		readWorkspaceFile("app/data/details/visual.ts"),
		/"scroll-mask": \{[\s\S]*import \{ ScrollMask \} from "@\/components\/visual\/scroll-mask";/,
	);
	assert.match(
		readWorkspaceFile("components/website/registry.ts"),
		/"scroll-mask": dynamic\(\(\) => import\("\.\/demos\/visual\/scroll-mask-demo"\)/,
	);
});
