const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const SOURCE = fs.readFileSync(path.join(__dirname, "shader-color-controls.tsx"), "utf8");

test("ShaderColorInput buffers partial text colors until the value is a complete hex color", () => {
	assert.match(SOURCE, /const \[textDraft, setTextDraft\] = useState<string \| null>\(null\);/);
	assert.match(SOURCE, /const displayValue = textDraft \?\? value;/);
	assert.match(
		SOURCE,
		/function commitTextValue\(nextValue: string\) \{\n\t\tsetTextDraft\(nextValue\);\n\t\tif \(isHexColor\(nextValue\)\) \{\n\t\t\tonChange\(nextValue\);/,
	);
	assert.match(SOURCE, /value=\{displayValue\}/);
	assert.match(
		SOURCE,
		/onFocus=\{\(\) => \{\n\t\t\t\t\t\tsetTextDraft\(value\);\n\t\t\t\t\t\}\}/,
	);
	assert.match(
		SOURCE,
		/onBlur=\{\(\) => \{\n\t\t\t\t\t\tsetTextDraft\(null\);\n\t\t\t\t\t\}\}/,
	);
});
