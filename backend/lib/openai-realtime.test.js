const assert = require("node:assert/strict");
const test = require("node:test");
const WebSocket = require("ws");

const {
	RealtimeSession,
	ROVO_SYSTEM_INSTRUCTIONS,
	SESSION_STATE,
} = require("./openai-realtime");

function createReadySession() {
	const openaiMessages = [];
	const logEntries = [];
	const clientMessages = [];
	const clientWs = {
		readyState: WebSocket.OPEN,
		send(payload) {
			clientMessages.push(JSON.parse(payload));
		},
	};
	const session = new RealtimeSession(clientWs, {
		onLog: (scope, message) => {
			logEntries.push({ scope, message });
		},
	});

	session._state = SESSION_STATE.READY;
	session._openaiWs = {
		readyState: WebSocket.OPEN,
		send(payload) {
			openaiMessages.push(JSON.parse(payload));
		},
		close() {},
		ping() {},
		terminate() {},
	};

	return {
		clientMessages,
		session,
		openaiMessages,
		logEntries,
	};
}

function assertSystemMessage(openaiMessage, expectedText) {
	assert.equal(openaiMessage.type, "conversation.item.create");
	assert.equal(openaiMessage.item?.type, "message");
	assert.equal(openaiMessage.item?.role, "system");
	assert.equal(openaiMessage.item?.content?.[0]?.type, "input_text");
	assert.equal(openaiMessage.item?.content?.[0]?.text, expectedText);
}

test("system instructions include artifact annotation guidance", () => {
	assert.match(
		ROVO_SYSTEM_INSTRUCTIONS,
		/artifact annotations are provided as system context/iu,
	);
});

test("system instructions force delegation for explicit artifact requests", () => {
	assert.match(
		ROVO_SYSTEM_INSTRUCTIONS,
		/create me an artifact about Apple/iu,
	);
	assert.match(
		ROVO_SYSTEM_INSTRUCTIONS,
		/MUST delegate immediately/iu,
	);
	assert.match(
		ROVO_SYSTEM_INSTRUCTIONS,
		/Do not say things like "I'm putting that together"/iu,
	);
});

test("accepts initial_context injections", () => {
	const { session, openaiMessages, logEntries } = createReadySession();

	session._handleContextInject({
		type: "context_inject",
		data: {
			type: "initial_context",
			content: "Initial voice context",
		},
	});

	assert.equal(openaiMessages.length, 1);
	assertSystemMessage(openaiMessages[0], "Initial voice context");
	assert.deepEqual(logEntries.at(-1), {
		scope: "REALTIME",
		message: "Context injected: initial_context",
	});
});

test("accepts thread_context injections", () => {
	const { session, openaiMessages, logEntries } = createReadySession();

	session._handleContextInject({
		type: "context_inject",
		data: {
			type: "thread_context",
			summary: "User asked to refine the active artifact.",
		},
	});

	assert.equal(openaiMessages.length, 1);
	assertSystemMessage(
		openaiMessages[0],
		"User asked to refine the active artifact.",
	);
	assert.deepEqual(logEntries.at(-1), {
		scope: "REALTIME",
		message: "Context injected: thread_context",
	});
});

test("accepts artifact_annotations injections", () => {
	const { session, openaiMessages, logEntries } = createReadySession();
	const annotationContext = [
		"[Artifact Annotations]",
		"Artifact kind: code",
		"",
		"#1: \"Make this larger\"",
	].join("\n");

	session._handleContextInject({
		type: "context_inject",
		data: {
			type: "artifact_annotations",
			content: annotationContext,
		},
	});

	assert.equal(openaiMessages.length, 1);
	assertSystemMessage(openaiMessages[0], annotationContext);
	assert.deepEqual(logEntries.at(-1), {
		scope: "REALTIME",
		message: "Context injected: artifact_annotations",
	});
});

test("accepts artifact_context injections", () => {
	const { session, openaiMessages, logEntries } = createReadySession();

	session._handleContextInject({
		type: "context_inject",
		data: {
			type: "artifact_context",
			content: "Artifact open: Landing page draft",
		},
	});

	assert.equal(openaiMessages.length, 1);
	assertSystemMessage(openaiMessages[0], "Artifact open: Landing page draft");
	assert.deepEqual(logEntries.at(-1), {
		scope: "REALTIME",
		message: "Context injected: artifact_context",
	});
});

test("text_message_from_user creates a user message and requests a response", () => {
	const { session, openaiMessages, logEntries } = createReadySession();

	session.handleClientMessage(JSON.stringify({
		type: "text_message_from_user",
		text: "Build a login form",
	}));

	assert.equal(openaiMessages.length, 2);
	assert.equal(openaiMessages[0].type, "conversation.item.create");
	assert.equal(openaiMessages[0].item?.role, "user");
	assert.equal(openaiMessages[0].item?.content?.[0]?.type, "input_text");
	assert.equal(openaiMessages[0].item?.content?.[0]?.text, "Build a login form");
	assert.equal(openaiMessages[1].type, "response.create");
	assert.deepEqual(logEntries.at(-1), {
		scope: "REALTIME",
		message: "Text message received from user",
	});
});

test("session updates request audio and text assistant output", () => {
	const { session, openaiMessages } = createReadySession();

	session._sendSessionUpdate({ voice: "alloy" });

	assert.equal(openaiMessages.length, 1);
	assert.equal(openaiMessages[0].type, "session.update");
	assert.deepEqual(openaiMessages[0].session?.modalities, ["audio", "text"]);
	assert.equal(openaiMessages[0].session?.voice, "alloy");
});

test("text and transcript deltas forward item ids to the client", () => {
	const { session, clientMessages } = createReadySession();

	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.created",
		response: { id: "response-1" },
	})));
	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.text.delta",
		delta: "Hello",
		item_id: "assistant-item-1",
		response_id: "response-1",
	})));
	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.audio_transcript.delta",
		delta: " there",
		item_id: "assistant-item-1",
		response_id: "response-1",
	})));
	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.done",
		response: { id: "response-1" },
	})));

	assert.deepEqual(clientMessages, [
		{
			type: "response_created",
			responseId: "response-1",
		},
		{
			type: "text_delta",
			delta: "Hello",
			itemId: "assistant-item-1",
			responseId: "response-1",
		},
		{
			type: "audio_transcript_delta",
			delta: " there",
			itemId: "assistant-item-1",
			responseId: "response-1",
		},
		{
			type: "response_done",
			responseId: "response-1",
		},
	]);
});

test("unknown context types log and no-op", () => {
	const { session, openaiMessages, logEntries } = createReadySession();

	session._handleContextInject({
		type: "context_inject",
		data: {
			type: "unsupported_context",
			content: "Ignored",
		},
	});

	assert.equal(openaiMessages.length, 0);
	assert.deepEqual(logEntries.at(-1), {
		scope: "REALTIME",
		message: "Unknown context_inject contextType: unsupported_context",
	});
});

test("heartbeat terminates the upstream session when pong is missing", (t) => {
	t.mock.timers.enable({ apis: ["setInterval"] });

	const { session } = createReadySession();
	let pingCount = 0;
	let terminateCount = 0;
	session._openaiWs.ping = () => {
		pingCount += 1;
	};
	session._openaiWs.terminate = () => {
		terminateCount += 1;
	};

	session._startOpenAIHeartbeat();
	t.mock.timers.tick(20_000);
	assert.equal(pingCount, 1);
	assert.equal(terminateCount, 0);

	t.mock.timers.tick(20_000);
	assert.equal(terminateCount, 1);
	assert.equal(session._plannedCloseReason, "heartbeat_timeout");

	session._clearSessionMaintenanceTimers();
	t.mock.timers.reset();
});

test("session refresh closes the upstream connection before max lifetime", (t) => {
	t.mock.timers.enable({ apis: ["setTimeout"] });

	const { session } = createReadySession();
	let closeArgs = null;
	session._openaiWs.close = (code, reason) => {
		closeArgs = { code, reason };
	};

	session._scheduleSessionRefresh();
	t.mock.timers.tick(55 * 60 * 1_000);

	assert.deepEqual(closeArgs, {
		code: 1000,
		reason: "session refresh",
	});
	assert.equal(session._plannedCloseReason, "session_refresh");

	session._clearSessionMaintenanceTimers();
	t.mock.timers.reset();
});
