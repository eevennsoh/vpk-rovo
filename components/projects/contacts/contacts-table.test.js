const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const CONTACTS_TABLE_SOURCE = fs.readFileSync(
	path.join(__dirname, "contacts-table.tsx"),
	"utf8",
);

test("Contacts table rows expose keyboard-accessible detail activation", () => {
	assert.match(CONTACTS_TABLE_SOURCE, /type KeyboardEvent/);
	assert.match(CONTACTS_TABLE_SOURCE, /function handleRowKeyDown\(event: KeyboardEvent<HTMLTableRowElement>, contact: Contact\)/);
	assert.match(CONTACTS_TABLE_SOURCE, /event\.key !== "Enter" && event\.key !== " "/);
	assert.match(CONTACTS_TABLE_SOURCE, /event\.preventDefault\(\);/);
	assert.match(CONTACTS_TABLE_SOURCE, /onSelectContact\(contact\);/);
	assert.match(CONTACTS_TABLE_SOURCE, /role="button"/);
	assert.match(CONTACTS_TABLE_SOURCE, /tabIndex=\{0\}/);
	assert.match(CONTACTS_TABLE_SOURCE, /aria-label=\{`Open contact details for \$\{contact\.name\}`\}/);
	assert.match(CONTACTS_TABLE_SOURCE, /onKeyDown=\{\(event\) => handleRowKeyDown\(event, contact\)\}/);
	assert.doesNotMatch(CONTACTS_TABLE_SOURCE, /className=\{cn\(\s*"cursor-pointer transition-colors",\s*selectedContactId === contact\.id && "bg-bg-selected"\s*\)\}/);
});
