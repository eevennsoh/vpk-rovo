const test = require("node:test")
const assert = require("node:assert/strict")

const { genuiChatHandler } = require("./genui-chat-handler")

function createMockResponse() {
	return {
		headers: new Map(),
		headersSent: false,
		statusCode: 200,
		jsonBody: null,
		textBody: "",
		setHeader(name, value) {
			this.headers.set(name, value)
		},
		flushHeaders() {
			this.headersSent = true
		},
		write(chunk) {
			this.headersSent = true
			this.textBody += String(chunk)
		},
		status(code) {
			this.statusCode = code
			return this
		},
		json(payload) {
			this.headersSent = true
			this.jsonBody = payload
			return this
		},
		end(chunk = "") {
			if (chunk) {
				this.textBody += String(chunk)
			}
			this.headersSent = true
			return this
		},
	}
}

test("genui chat returns 503 when Rovo is unavailable", async () => {
	const response = createMockResponse()

	await genuiChatHandler(
		{
			body: {
				messages: [
					{
						role: "user",
						content: "Create a simple dashboard UI.",
					},
				],
				streamResponse: false,
			},
		},
		response,
		{
			isRovoAvailable: async () => false,
		},
	)

	assert.equal(response.statusCode, 503)
	assert.deepEqual(response.jsonBody, {
		error: "Rovo Serve is required but not available",
		details:
			"Rovo Serve is required but not available. Please start Rovo Serve with 'pnpm run rovo' before using UI Generation.",
		backendSelected: "rovo",
		failureStage: "unavailable",
	})
})
