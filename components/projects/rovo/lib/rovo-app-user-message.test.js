const test = require("node:test");
const assert = require("node:assert/strict");

const {
	createRovoAppUserMessage,
} = require("./rovo-app-user-message.ts");

test("createRovoAppUserMessage seeds a visible user turn with files and text", () => {
	const message = createRovoAppUserMessage({
		id: "user-1",
		createdAt: "2026-03-18T00:00:00.000Z",
		text: "Explain CSS",
		files: [
			{
				type: "file",
				filename: "notes.txt",
				mediaType: "text/plain",
				url: "https://example.com/notes.txt",
			},
		],
	});

	assert.equal(message.role, "user");
	assert.equal(message.metadata?.origin, "rovodev");
	assert.equal(message.metadata?.createdAt, "2026-03-18T00:00:00.000Z");
	assert.equal(message.parts[0].type, "file");
	assert.deepEqual(message.parts[1], {
		type: "text",
		text: "Explain CSS",
		state: "done",
	});
});
