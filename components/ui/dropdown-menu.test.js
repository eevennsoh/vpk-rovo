const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const source = fs.readFileSync(
	path.join(__dirname, "dropdown-menu.tsx"),
	"utf8",
);

test("dropdown menu item maps onSelect to Base UI click activation", () => {
	assert.match(
		source,
		/type DropdownMenuItemClickHandler = NonNullable<MenuPrimitive\.Item\.Props\["onClick"\]>;/u,
	);
	assert.match(
		source,
		/interface DropdownMenuItemProps extends Omit<MenuPrimitive\.Item\.Props, "onSelect">/u,
	);
	assert.match(
		source,
		/const handleClick: DropdownMenuItemClickHandler = \(event\) => \{\s*onClick\?\.\(event\);[\s\S]*onSelect\?\.\(event\);[\s\S]*event\.preventBaseUIHandler\(\);[\s\S]*\};/u,
	);
	assert.match(source, /onClick=\{handleClick\}/u);
});
