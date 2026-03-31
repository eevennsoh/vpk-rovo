/**
 * OpenAI Realtime WebSocket relay module.
 *
 * Manages a bidirectional WebSocket relay between a browser client and
 * OpenAI's Realtime API. Keeps API keys server-side and enables
 * server-side context injection.
 *
 * Architecture:
 *   Browser ──WS──> Express ──WS──> OpenAI Realtime API
 *                     ↑
 *               context injection
 *               session management
 */

const WebSocket = require("ws");
const { getRealtimeConfig, getAuthToken, getEnvVars } = require("./ai-gateway-helpers");

// ─── Constants ───────────────────────────────────────────────────────────────

const ARTIFACT_ANNOTATION_CONTEXT_INSTRUCTIONS = [
	"When artifact annotations are provided as system context, treat them as viewer-selected notes from the user.",
	"Reference annotation numbers when helpful.",
	"Use the annotation text together with the artifact context and the user's spoken request.",
	"If steering an active artifact, preserve the annotation intent while applying the new changes.",
].join(" ");

const ROVO_SYSTEM_INSTRUCTIONS = `You are Rovo, a collaborative AI voice assistant that bridges voice conversation with RovoDev, Atlassian's AI workspace assistant.

## Your role
You are the voice interface. You handle casual conversation, brainstorming, and general knowledge directly. For anything requiring workspace access, data lookup, code changes, artifact creation, or Atlassian product queries, you delegate to RovoDev using the delegate_to_rovo function.

## When to delegate (call delegate_to_rovo)
Only delegate when the user explicitly asks for a task that requires workspace access:
- User asks about their tickets, projects, pages, or workspace data
- User wants code changes, file creation, or artifact generation
- User asks to build, create, design, or implement something concrete
- User references specific files, components, or Atlassian products
- A brainstorming conversation converges and the user says "build that", "do it", "make it", etc.

These requests MUST delegate immediately:
- "create me an artifact about Apple"
- "make a document/report/memo/spec about X"
- "build a component/page/app for Y"
- "write code that does Z"
- "check my Jira/Confluence/workspace data"
- "create a card / generate a preview / make an inline artifact"

## When to handle locally (NO delegation)
Handle these yourself — do NOT call delegate_to_rovo:
- Casual chat, greetings, small talk ("hello", "how are you", "thanks")
- General knowledge questions ("what is React?", "explain closures")
- Brainstorming and ideation that hasn't converged into an actionable task
- Opinions, advice, or recommendations
- Clarifying questions — ask follow-ups before delegating if the request is vague
- Meta-questions about the voice interface itself
- Simple yes/no or factual answers
- Summarizing or explaining things you already know
When in doubt, handle it locally.
Exception: if the user asks to create/build/generate/write an artifact, document, code output, UI, page, card, or other concrete deliverable, you MUST delegate instead of replying conversationally.

## Delegation behavior
1. When you decide to delegate, call delegate_to_rovo immediately — do not emit text tokens before the function call
2. Synthesize the full conversation context into a clear prompt — don't just echo the last utterance
3. After RovoDev returns results (injected as system context), narrate a concise summary
4. Stay aware of prior results for follow-up questions
5. Do not say things like "I'm putting that together" or ask a follow-up yourself for explicit artifact/build requests. Delegate first and let RovoDev decide whether a clarification card or artifact preview is needed.

## Steering active generation
When results are being generated and the user gives modification instructions ("make it bigger", "add a chart", "change the color"), delegate those as well — RovoDev will apply them as steers to the active generation.

## Ending the session
When the user wants to end the voice conversation (e.g. "stop", "goodbye", "end call", "shut down", "that's all", "I'm done"), say a brief goodbye and call the end_voice_session function.

Keep responses concise and natural — you're in a voice conversation, not writing an essay.

${ARTIFACT_ANNOTATION_CONTEXT_INSTRUCTIONS}`;

const SUPPORTED_CONTEXT_TYPES = new Set([
	"initial_context",
	"thread_context",
	"artifact_complete",
	"thread_message",
	"artifact_annotations",
	"artifact_context",
	"delegation_error",
]);

// ─── Tools ────────────────────────────────────────────────────────────────────

const SESSION_TOOLS = [
	{
		type: "function",
		name: "end_voice_session",
		description: "End the voice conversation session. Call this when the user wants to stop talking, says goodbye, or asks to end/close/shut down the voice mode.",
		parameters: {
			type: "object",
			properties: {},
			required: [],
		},
	},
	{
		type: "function",
		name: "delegate_to_rovo",
		description:
			"Delegate a task to RovoDev, Atlassian's AI assistant. " +
			"Use when the user asks for anything requiring workspace access, " +
			"data lookup, code changes, file creation, artifact generation, " +
			"or Atlassian product queries. Synthesize the user's request " +
			"into a clear, actionable prompt.",
		parameters: {
			type: "object",
			properties: {
				prompt: {
					type: "string",
					description:
						"A clean, actionable prompt synthesized from the voice conversation. " +
						"Write it as if the user typed it directly. " +
						"Include all relevant details, constraints, and file names mentioned.",
				},
				intent_type: {
					type: "string",
					enum: ["code_change", "investigation", "explanation", "review", "deployment", "other"],
					description: "The primary type of task being delegated.",
				},
				conversation_summary: {
					type: "string",
					description: "A 1-3 sentence summary of the voice conversation leading to this delegation.",
				},
				urgency: {
					type: "string",
					enum: ["low", "normal", "high"],
				},
				referenced_files: {
					type: "array",
					items: { type: "string" },
					description: "File paths or component names the user mentioned.",
				},
			},
			required: ["prompt", "intent_type"],
		},
	},
];

const SESSION_STATE = {
	NOT_INITIALIZED: "not_initialized",
	READY: "ready",
	CLOSED: "closed",
};

const OPENAI_HEARTBEAT_INTERVAL_MS = 20_000;
const REALTIME_SESSION_REFRESH_MS = 55 * 60 * 1_000;

// ─── OpenAI Realtime event types ─────────────────────────────────────────────

const OPENAI_EVENT = {
	// Server events (OpenAI → us)
	SESSION_CREATED: "session.created",
	SESSION_UPDATED: "session.updated",
	RESPONSE_AUDIO_DELTA: "response.audio.delta",
	RESPONSE_AUDIO_DONE: "response.audio.done",
	RESPONSE_CREATED: "response.created",
	RESPONSE_TEXT_DELTA: "response.text.delta",
	RESPONSE_TEXT_DONE: "response.text.done",
	RESPONSE_DONE: "response.done",
	RESPONSE_AUDIO_TRANSCRIPT_DELTA: "response.audio_transcript.delta",
	RESPONSE_AUDIO_TRANSCRIPT_DONE: "response.audio_transcript.done",
	CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED:
		"conversation.item.input_audio_transcription.completed",
	CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_DELTA:
		"conversation.item.input_audio_transcription.delta",
	INPUT_AUDIO_BUFFER_SPEECH_STARTED: "input_audio_buffer.speech_started",
	INPUT_AUDIO_BUFFER_SPEECH_STOPPED: "input_audio_buffer.speech_stopped",
	ERROR: "error",
	RESPONSE_FUNCTION_CALL_ARGUMENTS_DONE:
		"response.function_call_arguments.done",

	// Client events (us → OpenAI)
	SESSION_UPDATE: "session.update",
	INPUT_AUDIO_BUFFER_APPEND: "input_audio_buffer.append",
	INPUT_AUDIO_BUFFER_COMMIT: "input_audio_buffer.commit",
	CONVERSATION_ITEM_CREATE: "conversation.item.create",
	RESPONSE_CANCEL: "response.cancel",
	RESPONSE_CREATE: "response.create",
};

// ─── Session class ───────────────────────────────────────────────────────────

class RealtimeSession {
	/**
	 * @param {WebSocket} clientWs — browser-side WebSocket
	 * @param {object} [options]
	 * @param {string} [options.instructions] — system prompt override
	 * @param {Function} [options.onLog] — log callback
	 */
	constructor(clientWs, options = {}) {
		this._clientWs = clientWs;
		this._openaiWs = null;
		this._state = SESSION_STATE.NOT_INITIALIZED;
		this._instructions = options.instructions || ROVO_SYSTEM_INSTRUCTIONS;
		this._log = options.onLog || (() => {});
		this._transcriptBuffer = "";
		this._openaiHeartbeatInterval = null;
		this._awaitingOpenAIPong = false;
		this._sessionRefreshTimer = null;
		this._plannedCloseReason = null;
	}

	get state() {
		return this._state;
	}

	get isReady() {
		return this._state === SESSION_STATE.READY;
	}

	// ── Lifecycle ─────────────────────────────────────────────────────────

	/**
	 * Open connection to OpenAI Realtime API and wire up bidirectional relay.
	 * Supports two auth modes:
	 *   1. Direct OpenAI: OPENAI_REALTIME_API_KEY set → Bearer token
	 *   2. AI Gateway:    ASAP credentials set → ASAP JWT + gateway headers
	 */
	async connect() {
		const config = getRealtimeConfig();
		const envVars = getEnvVars();
		const useGateway = !config.apiKey && process.env.ASAP_PRIVATE_KEY;

		if (!config.apiKey && !useGateway) {
			this._sendToClient({
				type: "error",
				error: {
					message: "No auth configured — set OPENAI_REALTIME_API_KEY or ASAP credentials",
					code: "config_missing",
				},
			});
			return;
		}

		const wsUrl = `${config.wsUrl}?model=${encodeURIComponent(config.model)}`;
		let headers;

		if (useGateway) {
			const token = await getAuthToken();
			headers = {
				Authorization: `bearer ${token}`,
				"OpenAI-Beta": "realtime=v1",
				"X-Atlassian-UseCaseId": envVars.AI_GATEWAY_USE_CASE_ID,
				"X-Atlassian-CloudId": envVars.AI_GATEWAY_CLOUD_ID,
				"X-Atlassian-UserId": envVars.AI_GATEWAY_USER_ID,
			};
			this._log("REALTIME", `Connecting via AI Gateway: ${config.wsUrl} (model: ${config.model})`);
		} else {
			headers = {
				Authorization: `Bearer ${config.apiKey}`,
				"OpenAI-Beta": "realtime=v1",
			};
			this._log("REALTIME", `Connecting to OpenAI Realtime: ${config.wsUrl} (model: ${config.model})`);
		}

		this._openaiWs = new WebSocket(wsUrl, { headers });

		this._openaiWs.on("open", () => {
			this._log("REALTIME", "Connected to OpenAI Realtime API");
			this._startOpenAIHeartbeat();
			this._scheduleSessionRefresh();
			// Session update (with tools) is deferred to session.created
			// to avoid a race where OpenAI's application layer isn't ready yet.
		});

		this._openaiWs.on("message", (data) => {
			this._handleOpenAIMessage(data);
		});

		this._openaiWs.on("pong", () => {
			this._awaitingOpenAIPong = false;
		});

		this._openaiWs.on("close", (code, reason) => {
			const plannedCloseReason = this._plannedCloseReason;
			this._plannedCloseReason = null;
			this._clearSessionMaintenanceTimers();
			this._log("REALTIME", `OpenAI WS closed: ${code} ${reason}`);
			this._state = SESSION_STATE.CLOSED;
			if (plannedCloseReason === null) {
				this._sendToClient({
					type: "error",
					error: { message: "OpenAI connection closed", code: "connection_closed" },
				});
			}
			// Close the client WebSocket so the browser's onclose handler
			// fires and triggers reconnection. Without this, the client
			// stays connected to the backend but audio is silently dropped.
			if (
				this._clientWs &&
				this._clientWs.readyState === WebSocket.OPEN
			) {
				this._clientWs.close(
					1001,
					plannedCloseReason === "session_refresh"
						? "Realtime session refresh"
						: plannedCloseReason === "heartbeat_timeout"
							? "Realtime upstream heartbeat timeout"
							: "OpenAI upstream closed"
				);
			}
		});

		this._openaiWs.on("error", (err) => {
			this._log("REALTIME", `OpenAI WS error: ${err.message}`);
			this._sendToClient({
				type: "error",
				error: { message: err.message, code: "connection_error" },
			});
		});
	}

	/**
	 * Close the OpenAI session and clean up.
	 */
	close() {
		this._state = SESSION_STATE.CLOSED;
		this._plannedCloseReason = null;
		this._clearSessionMaintenanceTimers();
		if (this._openaiWs) {
			if (
				this._openaiWs.readyState === WebSocket.OPEN ||
				this._openaiWs.readyState === WebSocket.CONNECTING
			) {
				this._openaiWs.close();
			}
			this._openaiWs = null;
		}
		this._log("REALTIME", "Session closed");
	}

	_clearSessionMaintenanceTimers() {
		if (this._openaiHeartbeatInterval !== null) {
			clearInterval(this._openaiHeartbeatInterval);
			this._openaiHeartbeatInterval = null;
		}
		if (this._sessionRefreshTimer !== null) {
			clearTimeout(this._sessionRefreshTimer);
			this._sessionRefreshTimer = null;
		}
		this._awaitingOpenAIPong = false;
	}

	_startOpenAIHeartbeat() {
		this._clearSessionMaintenanceTimers();
		this._openaiHeartbeatInterval = setInterval(() => {
			const ws = this._openaiWs;
			if (!ws || ws.readyState !== WebSocket.OPEN) {
				return;
			}

			if (this._awaitingOpenAIPong) {
				this._plannedCloseReason = "heartbeat_timeout";
				this._log("REALTIME", "OpenAI heartbeat timed out; reconnecting session");
				ws.terminate();
				return;
			}

			this._awaitingOpenAIPong = true;
			try {
				ws.ping();
			} catch (error) {
				this._plannedCloseReason = "heartbeat_timeout";
				this._log("REALTIME", `Failed to ping OpenAI Realtime: ${error.message}`);
				ws.terminate();
			}
		}, OPENAI_HEARTBEAT_INTERVAL_MS);
	}

	_scheduleSessionRefresh() {
		this._sessionRefreshTimer = setTimeout(() => {
			const ws = this._openaiWs;
			if (!ws || this._state === SESSION_STATE.CLOSED) {
				return;
			}

			this._plannedCloseReason = "session_refresh";
			this._log("REALTIME", "Refreshing Realtime session before max lifetime");
			if (
				ws.readyState === WebSocket.OPEN ||
				ws.readyState === WebSocket.CONNECTING
			) {
				ws.close(1000, "session refresh");
			}
		}, REALTIME_SESSION_REFRESH_MS);
	}

	// ── Client message handling ───────────────────────────────────────────

	/**
	 * Handle an incoming message from the browser client.
	 * @param {string} raw — JSON string
	 */
	handleClientMessage(raw) {
		let msg;
		try {
			msg = JSON.parse(raw);
		} catch {
			this._log("REALTIME", `Invalid JSON from client: ${String(raw).slice(0, 100)}`);
			return;
		}

		switch (msg.type) {
			case "audio_buffer_append":
				this._relayAudioAppend(msg);
				break;
			case "audio_buffer_commit":
				this._relayAudioCommit();
				break;
			case "session_update":
				this._handleClientSessionUpdate(msg);
				break;
			case "context_inject":
				this._handleContextInject(msg);
				break;
			case "text_message_from_user":
				this._handleTextMessageFromUser(msg);
				break;
			case "response_create":
				this._handleResponseCreate();
				break;
			default:
				this._log("REALTIME", `Unknown client message type: ${msg.type}`);
		}
	}

	// ── Audio relay ───────────────────────────────────────────────────────

	_relayAudioAppend(msg) {
		if (!this.isReady || !this._openaiWs) {
			return;
		}

		this._sendToOpenAI({
			type: OPENAI_EVENT.INPUT_AUDIO_BUFFER_APPEND,
			audio: msg.audio,
		});
	}

	_relayAudioCommit() {
		if (!this.isReady || !this._openaiWs) {
			return;
		}

		this._sendToOpenAI({
			type: OPENAI_EVENT.INPUT_AUDIO_BUFFER_COMMIT,
		});
	}

	// ── Session update ────────────────────────────────────────────────────

	_sendSessionUpdate(config) {
		this._sendToOpenAI({
			type: OPENAI_EVENT.SESSION_UPDATE,
			session: {
				instructions: this._instructions,
				modalities: ["audio", "text"],
				voice: config.voice,
				input_audio_format: "pcm16",
				output_audio_format: "pcm16",
				temperature: 0.6,
				max_response_output_tokens: "inf",
				tools: SESSION_TOOLS,
				input_audio_transcription: {
					model: "gpt-4o-mini-transcribe",
				},
				turn_detection: {
					type: "semantic_vad",
					eagerness: "auto",
					create_response: true,
					interrupt_response: true,
				},
			},
		});
	}

	_handleClientSessionUpdate(msg) {
		if (!this.isReady || !this._openaiWs) {
			return;
		}

		const config = getRealtimeConfig();
		const session = {
			instructions: msg.instructions || this._instructions,
			modalities: msg.modalities || ["audio", "text"],
			voice: msg.voice || config.voice,
			input_audio_format: "pcm16",
			output_audio_format: "pcm16",
			temperature: typeof msg.temperature === "number" ? msg.temperature : 0.6,
			max_response_output_tokens: "inf",
			tools: SESSION_TOOLS,
			input_audio_transcription: {
				model: "gpt-4o-mini-transcribe",
			},
			turn_detection: msg.turn_detection || {
				type: "semantic_vad",
				eagerness: "auto",
				create_response: true,
				interrupt_response: true,
			},
		};

		this._sendToOpenAI({
			type: OPENAI_EVENT.SESSION_UPDATE,
			session,
		});
	}

	// ── Context injection ─────────────────────────────────────────────────

	_handleContextInject(msg) {
		if (!this.isReady || !this._openaiWs) {
			return;
		}

		// Client sends { type: "context_inject", data: { type, summary, content } }
		const data = msg.data || msg;
		const contextType = data.type || data.contextType;
		const content = data.content || data.summary;

		if (!SUPPORTED_CONTEXT_TYPES.has(contextType)) {
			this._log("REALTIME", `Unknown context_inject contextType: ${contextType}`);
			return;
		}

		const text =
			typeof content === "string"
				? content
				: JSON.stringify(content);

		this._sendToOpenAI({
			type: OPENAI_EVENT.CONVERSATION_ITEM_CREATE,
			item: {
				type: "message",
				role: "system",
				content: [
					{
						type: "input_text",
						text,
					},
				],
			},
		});
		this._log("REALTIME", `Context injected: ${contextType}`);
	}

	// ── Response creation ─────────────────────────────────────────────────

	_handleResponseCreate() {
		if (!this.isReady || !this._openaiWs) {
			return;
		}

		this._sendToOpenAI({
			type: OPENAI_EVENT.RESPONSE_CREATE,
			response: {},
		});
		this._log("REALTIME", "Response creation requested");
	}

	_handleTextMessageFromUser(msg) {
		if (!this.isReady || !this._openaiWs) {
			return;
		}

		const text = typeof msg.text === "string" ? msg.text.trim() : "";
		if (!text) {
			return;
		}

		this._sendToOpenAI({
			type: OPENAI_EVENT.CONVERSATION_ITEM_CREATE,
			item: {
				type: "message",
				role: "user",
				content: [
					{
						type: "input_text",
						text,
					},
				],
			},
		});
		this._sendToOpenAI({
			type: OPENAI_EVENT.RESPONSE_CREATE,
			response: {},
		});
		this._log("REALTIME", "Text message received from user");
	}

	// ── OpenAI event handling ─────────────────────────────────────────────

	_handleOpenAIMessage(data) {
		let event;
		try {
			event = JSON.parse(data.toString());
		} catch {
			this._log("REALTIME", `Invalid JSON from OpenAI: ${String(data).slice(0, 100)}`);
			return;
		}

		switch (event.type) {
			case OPENAI_EVENT.SESSION_CREATED:
				this._state = SESSION_STATE.READY;
				this._log("REALTIME", `Session created: ${event.session?.id || "unknown"}`);
				this._sendSessionUpdate(getRealtimeConfig());
				this._sendToClient({ type: "session_ready", sessionId: event.session?.id });
				break;

			case OPENAI_EVENT.SESSION_UPDATED:
				this._log("REALTIME", `Session updated — tools: ${event.session?.tools?.length ?? 0}`);
				break;

			case OPENAI_EVENT.RESPONSE_AUDIO_DELTA:
				this._sendToClient({
					type: "audio_delta",
					delta: event.delta,
				});
				break;

			case OPENAI_EVENT.RESPONSE_CREATED:
				this._sendToClient({
					type: "response_created",
					responseId: event.response?.id ?? event.response_id,
				});
				break;

			case OPENAI_EVENT.RESPONSE_AUDIO_DONE:
				// Audio stream for this response is complete — no client action needed
				break;

			case OPENAI_EVENT.RESPONSE_TEXT_DELTA:
				this._sendToClient({
					type: "text_delta",
					delta: event.delta,
					itemId: event.item_id,
					responseId: event.response_id,
				});
				break;

			case OPENAI_EVENT.RESPONSE_TEXT_DONE:
				// Text stream complete
				break;

			case OPENAI_EVENT.RESPONSE_AUDIO_TRANSCRIPT_DELTA:
				this._sendToClient({
					type: "audio_transcript_delta",
					delta: event.delta,
					itemId: event.item_id,
					responseId: event.response_id,
				});
				break;

			case OPENAI_EVENT.RESPONSE_AUDIO_TRANSCRIPT_DONE:
				// Audio transcript complete
				break;

			case OPENAI_EVENT.RESPONSE_DONE:
				this._sendToClient({
					type: "response_done",
					responseId: event.response?.id ?? event.response_id,
				});
				break;

			case OPENAI_EVENT.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_DELTA:
				this._log("REALTIME", `Transcription delta: ${JSON.stringify(event.delta)}`);
				this._sendToClient({
					type: "transcription_delta",
					delta: event.delta,
				});
				break;

			case OPENAI_EVENT.CONVERSATION_ITEM_INPUT_AUDIO_TRANSCRIPTION_COMPLETED:
				this._log("REALTIME", `Transcription completed: ${JSON.stringify(event.transcript)}`);
				this._sendToClient({
					type: "transcription_completed",
					transcript: event.transcript,
				});
				break;

			case OPENAI_EVENT.INPUT_AUDIO_BUFFER_SPEECH_STARTED:
				this._sendToClient({ type: "speech_started" });
				break;

			case OPENAI_EVENT.INPUT_AUDIO_BUFFER_SPEECH_STOPPED:
				this._sendToClient({ type: "speech_stopped" });
				break;

			case OPENAI_EVENT.RESPONSE_FUNCTION_CALL_ARGUMENTS_DONE:
				if (event.name === "delegate_to_rovo") {
					// Send function_call_output back to OpenAI so GPT can continue
					// speaking its verbal acknowledgment while RovoDev works
					this._sendToOpenAI({
						type: OPENAI_EVENT.CONVERSATION_ITEM_CREATE,
						item: {
							type: "function_call_output",
							call_id: event.call_id,
							output: JSON.stringify({ status: "delegated", message: "Task sent to RovoDev for processing." }),
						},
					});
					this._sendToOpenAI({
						type: OPENAI_EVENT.RESPONSE_CREATE,
						response: {},
					});
				}
				// Forward all function calls to the client
				this._sendToClient({
					type: "function_call",
					name: event.name,
					arguments: event.arguments,
					callId: event.call_id,
				});
				break;

			case OPENAI_EVENT.ERROR: {
				const errorCode = event.error?.code || "unknown";
				const errorMessage = event.error?.message || "Unknown error";
				// input_audio_buffer_commit_empty is a warning, not a fatal error
				if (errorCode === "input_audio_buffer_commit_empty") {
					this._log("REALTIME", `OpenAI warning: ${errorMessage}`);
				} else {
					this._log("REALTIME", `OpenAI error: ${errorCode} — ${errorMessage}`);
					this._sendToClient({
						type: "error",
						error: { message: errorMessage, code: errorCode },
					});
				}
				break;
			}

			default:
				// Log unrecognized events for debugging but don't forward them
				this._log("REALTIME", `Unhandled OpenAI event: ${event.type}`);
		}
	}

	// ── Transport helpers ─────────────────────────────────────────────────

	_sendToOpenAI(payload) {
		if (
			!this._openaiWs ||
			this._openaiWs.readyState !== WebSocket.OPEN
		) {
			return;
		}

		try {
			this._openaiWs.send(JSON.stringify(payload));
		} catch (err) {
			this._log("REALTIME", `Failed to send to OpenAI: ${err.message}`);
		}
	}

	_sendToClient(payload) {
		if (
			!this._clientWs ||
			this._clientWs.readyState !== WebSocket.OPEN
		) {
			return;
		}

		try {
			this._clientWs.send(JSON.stringify(payload));
		} catch (err) {
			this._log("REALTIME", `Failed to send to client: ${err.message}`);
		}
	}
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
	RealtimeSession,
	ROVO_SYSTEM_INSTRUCTIONS,
	SESSION_STATE,
};
