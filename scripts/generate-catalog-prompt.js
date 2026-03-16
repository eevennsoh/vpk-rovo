/**
 * Generates the catalog-based system prompt for genui inline mode.
 *
 * Runs `catalog.prompt({ mode: "inline" })` which auto-generates:
 * - All component types with props from Zod schemas
 * - Slot information (which components accept children)
 * - Critical defaultRules (integrity check, self-check, visible/on placement)
 * - SpecStream format rules (JSONL patches, /root, /elements/<key>)
 *
 * Output: backend/lib/generated-catalog-prompt.json
 *
 * Usage: node --experimental-strip-types scripts/generate-catalog-prompt.js
 */

const fs = require("node:fs");
const path = require("node:path");

const { catalog } = require("../lib/json-render/catalog.ts");

const basePrompt = catalog.prompt({ mode: "inline" });

const output = {
	generatedAt: new Date().toISOString(),
	prompt: basePrompt,
};

const outPath = path.join(__dirname, "..", "backend", "lib", "generated-catalog-prompt.json");
fs.writeFileSync(outPath, JSON.stringify(output, null, "\t") + "\n");

console.log(`[generate-catalog-prompt] Wrote ${basePrompt.length} chars to ${outPath}`);
