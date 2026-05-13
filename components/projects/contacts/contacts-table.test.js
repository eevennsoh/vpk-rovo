const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const CONTACTS_TABLE_SOURCE = fs.readFileSync(
	path.join(__dirname, "contacts-table.tsx"),
	"utf8",
);

test("Contacts table rows expose keyboard-accessible detail activation", () => {
	assert.match(CONTACTS_TABLE_SOURCE, /<button\s+type="button"/);
	assert.match(CONTACTS_TABLE_SOURCE, /onSelectContact\(contact\);/);
	assert.match(CONTACTS_TABLE_SOURCE, /aria-label=\{`Open contact details for \$\{contact\.name\}`\}/);
	assert.match(CONTACTS_TABLE_SOURCE, /event\.stopPropagation\(\);/);
	assert.doesNotMatch(CONTACTS_TABLE_SOURCE, /role="button"/);
	assert.doesNotMatch(CONTACTS_TABLE_SOURCE, /tabIndex=\{0\}/);
	assert.doesNotMatch(CONTACTS_TABLE_SOURCE, /className=\{cn\(\s*"cursor-pointer transition-colors",\s*selectedContactId === contact\.id && "bg-bg-selected"\s*\)\}/);
});
