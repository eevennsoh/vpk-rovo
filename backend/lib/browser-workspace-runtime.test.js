const test = require("node:test")
const assert = require("node:assert/strict")

const {
	AgentBrowserRuntime,
	DEFAULT_SCREENCAST_MAX_HEIGHT,
	DEFAULT_SCREENCAST_MAX_WIDTH,
} = require("./browser-workspace-runtime")

class TestAgentBrowserRuntime extends AgentBrowserRuntime {
	constructor(options = {}) {
		super({
			sessionId: "test-workspace",
			...options,
		})
		this.commands = []
		this.jsonCommands = []
		this.jsonResults = new Map()
		this.screencastBuffers = []
	}

	async _ensureInstalled() {}

	async _runCommand(args) {
		this.commands.push(args.map((value) => String(value)))
		return ""
	}

	async _runJsonCommand(args) {
		const normalizedArgs = args.map((value) => String(value))
		const key = normalizedArgs.join(" ")
		this.jsonCommands.push(normalizedArgs)
		if (!this.jsonResults.has(key)) {
			throw new Error(`Unexpected JSON command: ${key}`)
		}

		return this.jsonResults.get(key)
	}

	async _captureScreencastFrameBuffer() {
		const nextBuffer =
			this.screencastBuffers.shift() || Buffer.from("not-a-jpeg")
		this.commands.push(["capture-screencast-frame"])
		return nextBuffer
	}
}

test("browser workspace runtime reads tab state through agent-browser JSON commands", async () => {
	const runtime = new TestAgentBrowserRuntime()
	runtime.jsonResults.set("tab", {
		tabs: [
			{
				active: false,
				index: 0,
				title: "One",
				type: "page",
				url: "https://example.com/one",
			},
			{
				active: true,
				index: 1,
				title: "Two",
				type: "page",
				url: "https://example.com/two",
			},
		],
	})

	const state = await runtime.getState()

	assert.deepEqual(runtime.commands, [
		["open", "about:blank"],
		["set", "viewport", "1280", "900", "1"],
	])
	assert.deepEqual(runtime.jsonCommands, [["tab"]])
	assert.equal(state.activeTabIndex, 1)
	assert.equal(state.title, "Two")
	assert.equal(state.url, "https://example.com/two")
	assert.equal(state.tabs.length, 2)
})

test("browser workspace runtime snapshot normalizes ref keys for interactive mode", async () => {
	const runtime = new TestAgentBrowserRuntime()
	runtime.jsonResults.set("snapshot -i", {
		snapshot:
			'- button "Sign in" [ref=e1]\n- link "More info" [ref=e2]',
		refs: {
			e1: {
				role: "button",
				name: "Sign in",
				unused: true,
			},
			e2: {
				role: "link",
				name: "More info",
			},
		},
	})

	const snapshot = await runtime.snapshot({ interactive: true })

	assert.deepEqual(runtime.commands, [
		["open", "about:blank"],
		["set", "viewport", "1280", "900", "1"],
	])
	assert.deepEqual(runtime.jsonCommands, [["snapshot", "-i"]])
	assert.equal(snapshot.snapshot.includes("[ref=@e1]"), true)
	assert.deepEqual(snapshot.refs, {
		"@e1": {
			role: "button",
			name: "Sign in",
		},
		"@e2": {
			role: "link",
			name: "More info",
		},
	})
})

test("browser workspace runtime screencast emits jpeg frames with capped fallback metadata", async () => {
	let capturedFrame = null
	const runtime = new TestAgentBrowserRuntime({
		viewport: {
			width: 1400,
			height: 1000,
		},
		deviceScaleFactor: 2,
	})

	await runtime.startScreencast((frame) => {
		capturedFrame = frame
	})
	await runtime.stopScreencast()

	assert.deepEqual(runtime.commands, [
		["open", "about:blank"],
		["set", "viewport", "1400", "1000", "2"],
		["capture-screencast-frame"],
	])
	assert.equal(typeof capturedFrame?.data, "string")
	assert.deepEqual(capturedFrame?.metadata, {
		deviceWidth: DEFAULT_SCREENCAST_MAX_WIDTH,
		deviceHeight: DEFAULT_SCREENCAST_MAX_HEIGHT,
		pageScaleFactor: 2,
	})
})
