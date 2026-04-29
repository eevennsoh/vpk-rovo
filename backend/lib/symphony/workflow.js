"use strict";

const fs = require("fs");
const path = require("path");
const { SymphonyWorkflowError } = require("./errors");

const FRONT_MATTER_RE = /^---\s*\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/;

function countIndent(line) {
	const match = /^ */.exec(line);
	return match ? match[0].length : 0;
}

function splitKeyValue(content) {
	const index = content.indexOf(":");
	if (index <= 0) {
		return null;
	}

	return {
		key: content.slice(0, index).trim(),
		value: content.slice(index + 1).trim(),
	};
}

function stripInlineComment(value) {
	let quote = null;
	for (let index = 0; index < value.length; index += 1) {
		const char = value[index];
		if ((char === "\"" || char === "'") && value[index - 1] !== "\\") {
			quote = quote === char ? null : quote || char;
		}
		if (!quote && char === "#" && (index === 0 || /\s/.test(value[index - 1]))) {
			return value.slice(0, index).trimEnd();
		}
	}
	return value;
}

function parseInlineArray(value) {
	const body = value.slice(1, -1).trim();
	if (!body) {
		return [];
	}

	const values = [];
	let current = "";
	let quote = null;
	for (let index = 0; index < body.length; index += 1) {
		const char = body[index];
		if ((char === "\"" || char === "'") && body[index - 1] !== "\\") {
			quote = quote === char ? null : quote || char;
			current += char;
			continue;
		}
		if (!quote && char === ",") {
			values.push(parseScalar(current.trim()));
			current = "";
			continue;
		}
		current += char;
	}
	if (current.trim()) {
		values.push(parseScalar(current.trim()));
	}

	return values;
}

function parseScalar(rawValue) {
	const value = stripInlineComment(rawValue).trim();
	if (value === "") {
		return "";
	}
	if (value === "null" || value === "~") {
		return null;
	}
	if (value === "true") {
		return true;
	}
	if (value === "false") {
		return false;
	}
	if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'"))) {
		const inner = value.slice(1, -1);
		return value[0] === "\"" ? inner.replace(/\\"/g, "\"").replace(/\\n/g, "\n") : inner.replace(/''/g, "'");
	}
	if (value.startsWith("[") && value.endsWith("]")) {
		return parseInlineArray(value);
	}
	if (/^-?\d+$/.test(value)) {
		return Number.parseInt(value, 10);
	}
	if (/^-?\d+\.\d+$/.test(value)) {
		return Number.parseFloat(value);
	}
	return value;
}

function nextContentLine(lines, startIndex) {
	for (let index = startIndex; index < lines.length; index += 1) {
		const trimmed = lines[index].trim();
		if (trimmed && !trimmed.startsWith("#")) {
			return { index, indent: countIndent(lines[index]), content: trimmed };
		}
	}
	return null;
}

function collectBlockScalar(lines, startIndex, parentIndent, style) {
	const block = [];
	let index = startIndex;
	let blockIndent = null;
	while (index < lines.length) {
		const line = lines[index];
		const trimmed = line.trim();
		if (!trimmed) {
			block.push("");
			index += 1;
			continue;
		}

		const indent = countIndent(line);
		if (indent <= parentIndent) {
			break;
		}

		if (blockIndent === null || indent < blockIndent) {
			blockIndent = indent;
		}
		block.push(line);
		index += 1;
	}

	const normalized = block.map((line) => {
		if (!line.trim()) {
			return "";
		}
		return line.slice(blockIndent || parentIndent + 1);
	});

	const literal = normalized.join("\n");
	const text = style.startsWith(">") ? literal.replace(/\n+/g, " ").trimEnd() : literal;
	return { value: style.endsWith("-") ? text.replace(/\n+$/g, "") : `${text}\n`, index };
}

function parseList(lines, startIndex, indent) {
	const result = [];
	let index = startIndex;
	while (index < lines.length) {
		const line = lines[index];
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			index += 1;
			continue;
		}

		const currentIndent = countIndent(line);
		if (currentIndent < indent) {
			break;
		}
		if (currentIndent > indent) {
			throw new SymphonyWorkflowError("Invalid YAML indentation in list", { line: index + 1 });
		}
		if (!trimmed.startsWith("-")) {
			break;
		}

		const itemValue = trimmed.slice(1).trim();
		if (!itemValue) {
			const next = nextContentLine(lines, index + 1);
			if (!next) {
				result.push(null);
				index += 1;
				continue;
			}
			if (next.content.startsWith("-")) {
				const parsed = parseList(lines, next.index, next.indent);
				result.push(parsed.value);
				index = parsed.index;
				continue;
			}
			const parsed = parseMap(lines, next.index, next.indent);
			result.push(parsed.value);
			index = parsed.index;
			continue;
		}

		const keyValue = splitKeyValue(itemValue);
		if (keyValue && !itemValue.startsWith("\"") && !itemValue.startsWith("'")) {
			const item = {};
			item[keyValue.key] = keyValue.value ? parseScalar(keyValue.value) : null;
			result.push(item);
			index += 1;
			continue;
		}

		result.push(parseScalar(itemValue));
		index += 1;
	}

	return { value: result, index };
}

function parseMap(lines, startIndex = 0, indent = 0) {
	const result = {};
	let index = startIndex;
	while (index < lines.length) {
		const line = lines[index];
		const trimmed = line.trim();
		if (!trimmed || trimmed.startsWith("#")) {
			index += 1;
			continue;
		}

		const currentIndent = countIndent(line);
		if (currentIndent < indent) {
			break;
		}
		if (currentIndent > indent) {
			throw new SymphonyWorkflowError("Invalid YAML indentation in map", { line: index + 1 });
		}
		if (trimmed.startsWith("-")) {
			throw new SymphonyWorkflowError("Workflow front matter must be a YAML mapping", { line: index + 1 });
		}

		const entry = splitKeyValue(trimmed);
		if (!entry || !entry.key) {
			throw new SymphonyWorkflowError("Invalid YAML mapping entry", { line: index + 1 });
		}

		if (entry.value === "|" || entry.value === "|-" || entry.value === ">" || entry.value === ">-") {
			const parsed = collectBlockScalar(lines, index + 1, currentIndent, entry.value);
			result[entry.key] = parsed.value;
			index = parsed.index;
			continue;
		}

		if (!entry.value) {
			const next = nextContentLine(lines, index + 1);
			if (!next || next.indent <= currentIndent) {
				result[entry.key] = {};
				index += 1;
				continue;
			}
			const parsed = next.content.startsWith("-")
				? parseList(lines, next.index, next.indent)
				: parseMap(lines, next.index, next.indent);
			result[entry.key] = parsed.value;
			index = parsed.index;
			continue;
		}

		result[entry.key] = parseScalar(entry.value);
		index += 1;
	}

	return { value: result, index };
}

function parseYamlMapping(source) {
	const lines = source.replace(/\r\n/g, "\n").split("\n");
	const parsed = parseMap(lines, 0, 0);
	return parsed.value;
}

function extractWorkflowFrontMatter(source, filePath = "WORKFLOW.md") {
	const match = FRONT_MATTER_RE.exec(source);
	if (!match) {
		throw new SymphonyWorkflowError("Workflow file must start with YAML front matter", { filePath });
	}

	const config = parseYamlMapping(match[1]);
	const body = source.slice(match[0].length);
	return { body, config };
}

function getPathValue(scope, expression) {
	const parts = expression.split(".").filter(Boolean);
	let value = scope;
	for (const part of parts) {
		if (value === null || value === undefined || typeof value !== "object" || !(part in value)) {
			throw new SymphonyWorkflowError(`Unknown template variable: ${expression}`);
		}
		value = value[part];
	}
	return value;
}

function stringifyTemplateValue(value) {
	if (value === null || value === undefined) {
		return "";
	}
	if (typeof value === "string") {
		return value;
	}
	if (typeof value === "number" || typeof value === "boolean") {
		return String(value);
	}
	return JSON.stringify(value);
}

function renderStrictTemplate(template, scope) {
	let rendered = String(template);

	rendered = rendered.replace(
		/\{%\s*for\s+([A-Za-z_][A-Za-z0-9_]*)\s+in\s+([A-Za-z_][A-Za-z0-9_.]*)\s*%\}([\s\S]*?)\{%\s*endfor\s*%\}/g,
		(_match, localName, listPath, body) => {
			const value = getPathValue(scope, listPath);
			if (!Array.isArray(value)) {
				throw new SymphonyWorkflowError(`Template variable is not iterable: ${listPath}`);
			}
			return value.map((item) => renderStrictTemplate(body, { ...scope, [localName]: item })).join("");
		},
	);

	rendered = rendered.replace(
		/\{%\s*if\s+([A-Za-z_][A-Za-z0-9_.]*)\s*%\}([\s\S]*?)(?:\{%\s*else\s*%\}([\s\S]*?))?\{%\s*endif\s*%\}/g,
		(_match, valuePath, truthyBody, falsyBody = "") => {
			const value = getPathValue(scope, valuePath);
			return renderStrictTemplate(value ? truthyBody : falsyBody, scope);
		},
	);

	rendered = rendered.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_match, expression) => {
		if (expression.includes("|")) {
			throw new SymphonyWorkflowError(`Unsupported template filter in expression: ${expression.trim()}`);
		}
		return stringifyTemplateValue(getPathValue(scope, expression.trim()));
	});

	if (/\{%|\{\{/.test(rendered)) {
		throw new SymphonyWorkflowError("Unsupported template syntax remains after rendering");
	}

	return rendered;
}

function loadWorkflowFile(filePath) {
	const source = fs.readFileSync(filePath, "utf8");
	const workflow = extractWorkflowFrontMatter(source, filePath);
	return {
		...workflow,
		filePath: path.resolve(filePath),
		mtimeMs: fs.statSync(filePath).mtimeMs,
	};
}

class WorkflowRuntime {
	constructor(filePath, logger = console) {
		this.filePath = path.resolve(filePath);
		this.logger = logger;
		this.current = loadWorkflowFile(this.filePath);
	}

	reloadIfChanged() {
		const stat = fs.statSync(this.filePath);
		if (stat.mtimeMs === this.current.mtimeMs) {
			return false;
		}

		this.current = loadWorkflowFile(this.filePath);
		this.logger.info?.("[symphony] workflow reloaded", { filePath: this.filePath });
		return true;
	}
}

module.exports = {
	WorkflowRuntime,
	extractWorkflowFrontMatter,
	loadWorkflowFile,
	parseYamlMapping,
	renderStrictTemplate,
};
