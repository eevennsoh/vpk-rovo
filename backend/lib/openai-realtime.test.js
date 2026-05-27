const assert = require("node:assert/strict");
const test = require("node:test");
const WebSocket = require("ws");

const {
	parseScreenAssistantVisionResponse,
	RealtimeSession,
	ROVO_SYSTEM_INSTRUCTIONS,
	SESSION_STATE,
} = require("./openai-realtime");
const { getRealtimeConfig } = require("./ai-gateway-helpers");

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

test("realtime config defaults to the current realtime model", () => {
	const previousModel = process.env.OPENAI_REALTIME_MODEL;
	delete process.env.OPENAI_REALTIME_MODEL;

	try {
		assert.equal(getRealtimeConfig().model, "gpt-realtime-2");
	} finally {
		if (previousModel === undefined) {
			delete process.env.OPENAI_REALTIME_MODEL;
		} else {
			process.env.OPENAI_REALTIME_MODEL = previousModel;
		}
	}
});

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

test("parses structured screen assistant vision responses", () => {
	assert.deepEqual(
		parseScreenAssistantVisionResponse(
			JSON.stringify({
				agentDraftPatch: {
					name: "Support Triage Agent",
				},
				point: {
					label: "Instructions",
					x: 120.7,
					y: 240.2,
				},
				target: {
					fieldId: "instructions",
					id: "studio-agent-config:instructions",
					label: "Instructions",
					rect: {
						height: 80,
						width: 420,
						x: 40,
						y: 100,
					},
				},
				text: "I filled in the instructions.",
			}),
			"voice-turn-1",
		),
		{
			agentDraftPatch: {
				name: "Support Triage Agent",
			},
			point: {
				label: "Instructions",
				x: 121,
				y: 240,
			},
			target: {
				fieldId: "instructions",
				id: "studio-agent-config:instructions",
				label: "Instructions",
				rect: {
					height: 80,
					width: 420,
					x: 40,
					y: 100,
				},
			},
			text: "I filled in the instructions.",
			turnId: "voice-turn-1",
			type: "screen_assistant_result",
		},
	);
});

test("parses legacy POINT responses as screen assistant fallback", () => {
	assert.deepEqual(
		parseScreenAssistantVisionResponse(
			"That button starts live voice. [POINT:450,320:Voice button]",
			"voice-turn-2",
		),
		{
			point: {
				label: "Voice button",
				x: 450,
				y: 320,
			},
			text: "That button starts live voice.",
			turnId: "voice-turn-2",
			type: "screen_assistant_result",
		},
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

test("session updates use the GA realtime audio session schema", () => {
	const { session, openaiMessages } = createReadySession();

	session._sendSessionUpdate({ voice: "alloy" });

	assert.equal(openaiMessages.length, 1);
	assert.equal(openaiMessages[0].type, "session.update");
	assert.deepEqual(openaiMessages[0].session?.output_modalities, ["audio"]);
	assert.equal(openaiMessages[0].session?.audio?.output?.voice, "alloy");
	assert.deepEqual(openaiMessages[0].session?.audio?.input?.format, {
		type: "audio/pcm",
		rate: 24_000,
	});
	assert.deepEqual(openaiMessages[0].session?.audio?.output?.format, {
		type: "audio/pcm",
		rate: 24_000,
	});
	assert.equal(openaiMessages[0].session?.max_output_tokens, "inf");
	assert.equal("modalities" in openaiMessages[0].session, false);
	assert.equal("input_audio_format" in openaiMessages[0].session, false);
	assert.equal("output_audio_format" in openaiMessages[0].session, false);
	assert.equal("max_response_output_tokens" in openaiMessages[0].session, false);
});

test("client session updates preserve configurable realtime voice options", () => {
	const { session, openaiMessages } = createReadySession();

	session.handleClientMessage(JSON.stringify({
		type: "session_update",
		config: {
			instructions: "Use a quiet voice.",
			voice: "verse",
			turn_detection: {
				type: "semantic_vad",
				eagerness: "low",
				create_response: true,
				interrupt_response: true,
			},
		},
	}));

	assert.equal(openaiMessages.length, 1);
	assert.equal(openaiMessages[0].type, "session.update");
	assert.equal(openaiMessages[0].session?.instructions, "Use a quiet voice.");
	assert.deepEqual(openaiMessages[0].session?.output_modalities, ["audio"]);
	assert.equal(openaiMessages[0].session?.audio?.output?.voice, "verse");
	assert.equal(
		openaiMessages[0].session?.audio?.input?.turn_detection?.eagerness,
		"low",
	);
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

test("modern realtime output delta events are normalized for the client", () => {
	const { session, clientMessages } = createReadySession();

	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.created",
		response: { id: "response-2" },
	})));
	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.output_audio.delta",
		delta: "audio-base64",
		response_id: "response-2",
	})));
	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.output_text.delta",
		delta: "Hello",
		item_id: "assistant-item-2",
		response_id: "response-2",
	})));
	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.output_audio_transcript.delta",
		delta: " there",
		item_id: "assistant-item-2",
		response_id: "response-2",
	})));
	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.done",
		response: { id: "response-2" },
	})));

	assert.deepEqual(clientMessages, [
		{
			type: "response_created",
			responseId: "response-2",
		},
		{
			type: "audio_delta",
			delta: "audio-base64",
		},
		{
			type: "text_delta",
			delta: "Hello",
			itemId: "assistant-item-2",
			responseId: "response-2",
		},
		{
			type: "audio_transcript_delta",
			delta: " there",
			itemId: "assistant-item-2",
			responseId: "response-2",
		},
		{
			type: "response_done",
			responseId: "response-2",
		},
	]);
});

test("benign realtime item lifecycle events are ignored without unhandled logs", () => {
	const { session, clientMessages, logEntries } = createReadySession();

	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "conversation.item.created",
		item: { id: "item-1", type: "message" },
	})));
	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.output_item.added",
		response_id: "response-3",
		item: { id: "item-2", type: "message" },
	})));
	session._handleOpenAIMessage(Buffer.from(JSON.stringify({
		type: "response.content_part.added",
		response_id: "response-3",
		item_id: "item-2",
		part: { type: "output_text" },
	})));

	assert.deepEqual(clientMessages, []);
	assert.equal(
		logEntries.some(({ message }) => /Unhandled OpenAI event/.test(message)),
		false,
	);
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
