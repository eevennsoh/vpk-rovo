#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { TEMPLATE_DEFINITIONS } from "../templates/catalog.mjs";
import { buildExamplePayload } from "./example-payloads.mjs";
import { renderPayloadToFile } from "./render.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SKILL_ROOT = path.resolve(__dirname, "..");
const EXAMPLE_INPUT_DIR = path.join(SKILL_ROOT, "examples", "input");
const EXAMPLE_OUTPUT_DIR = path.join(SKILL_ROOT, "examples", "output");

function writeJson(filePath, value) {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, `${JSON.stringify(value, null, "\t")}\n`, "utf8");
}

function writeGallery() {
	const payload = {
		template: "design-system",
		title: "vpk-html Example Gallery",
		slug: "vpk-html-example-gallery",
		subtitle: "Tracked example outputs for every addressable template.",
		audience: "VPK developers",
		theme: {
			initialMode: "light",
			allowToggle: true,
		},
		sections: [
			{
				type: "catalog",
				heading: "Template outputs",
				body: "Each card opens a rendered example for that template. The examples are intentionally content-rich so the gallery behaves like documentation, not a renderer smoke test.",
				cards: TEMPLATE_DEFINITIONS.map(definition => ({
					title: definition.id,
					body: definition.description,
					status: definition.family,
					meta: definition.interaction,
					href: `output/${definition.id}.html`,
				})),
			},
		],
		sources: [],
		assets: [],
		options: {
			print: true,
			interactive: true,
			useAlgebrica: false,
		},
	};

	return renderPayloadToFile(payload, ".agents/skills/vpk-html/examples/gallery.html", {
		overwrite: true,
	});
}

async function main() {
	try {
		fs.mkdirSync(EXAMPLE_INPUT_DIR, { recursive: true });
		fs.mkdirSync(EXAMPLE_OUTPUT_DIR, { recursive: true });

		for (const definition of TEMPLATE_DEFINITIONS) {
			const payload = buildExamplePayload(definition);
			writeJson(path.join(EXAMPLE_INPUT_DIR, `${definition.id}.json`), payload);
			renderPayloadToFile(payload, `.agents/skills/vpk-html/examples/output/${definition.id}.html`, {
				overwrite: true,
			});
		}

		const galleryPath = writeGallery();
		console.log(`wrote ${TEMPLATE_DEFINITIONS.length} examples`);
		console.log(path.relative(process.cwd(), galleryPath));
	} catch (error) {
		console.error(error.message);
		process.exitCode = 1;
	}
}

if (process.argv[1] === __filename) {
	await main();
}
