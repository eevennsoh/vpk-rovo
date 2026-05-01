const assert = require("node:assert/strict");
const test = require("node:test");

const helpers = import("./gui-values.ts");

test("selectMountedGUIValues keeps legacy copy-all behavior without registered keys", async () => {
	const { selectMountedGUIValues } = await helpers;
	const values = { always: true, hidden: "still copied" };

	assert.equal(selectMountedGUIValues(values, []), values);
});

test("selectMountedGUIValues copies only mounted registered keys", async () => {
	const { selectMountedGUIValues } = await helpers;
	const values = {
		always: true,
		hidden: "not copied",
		nested: { mode: "visible" },
	};

	assert.deepEqual(
		selectMountedGUIValues(values, ["nested", "missing", "always"]),
		{
			nested: { mode: "visible" },
			always: true,
		},
	);
});
