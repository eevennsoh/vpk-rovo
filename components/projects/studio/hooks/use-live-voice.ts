"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { API_ENDPOINTS } from "@/lib/api-config";

const TTS_MAX_INPUT_LENGTH = 4000;
const VAD_SAMPLE_RATE = 16000;

export type LiveVoiceState = "idle" | "recording" | "processing" | "speaking";

export interface LiveVoiceTranscriptionOptions {
	language?: string;
	model?: string;
	provider?: string;
}

export interface UseLiveVoiceOptions {
	onBargeInStart?: () => void | Promise<void>;
	onTranscription: (text: string) => void | Promise<void>;
	preferBrowserRecognition?: boolean;
	transcriptionOptions?: LiveVoiceTranscriptionOptions;
}

export interface UseLiveVoiceResult {
	cancelPendingTranscription: () => void;
	state: LiveVoiceState;
	start: () => void;
	stop: () => void;
	stopSpeaking: () => void;
	speak: (text: string) => void;
}

function isGenericTranscriptionErrorMessage(message: string): boolean {
	const normalizedMessage = message.trim().toLowerCase();
	return (
		normalizedMessage === "internal server error" ||
		normalizedMessage === "request failed"
	);
}

/**
 * Convert a Float32Array of PCM samples to a base64-encoded WAV string.
 */
function float32ToWavBase64(
	samples: Float32Array,
	sampleRate: number,
): string {
	const numChannels = 1;
	const bitsPerSample = 16;
	const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
	const blockAlign = numChannels * (bitsPerSample / 8);
	const dataSize = samples.length * (bitsPerSample / 8);
	const buffer = new ArrayBuffer(44 + dataSize);
	const view = new DataView(buffer);

	// WAV header
	const writeString = (offset: number, str: string) => {
		for (let i = 0; i < str.length; i++) {
			view.setUint8(offset + i, str.charCodeAt(i));
		}
	};

	writeString(0, "RIFF");
	view.setUint32(4, 36 + dataSize, true);
	writeString(8, "WAVE");
	writeString(12, "fmt ");
	view.setUint32(16, 16, true); // subchunk1 size
	view.setUint16(20, 1, true); // PCM format
	view.setUint16(22, numChannels, true);
	view.setUint32(24, sampleRate, true);
	view.setUint32(28, byteRate, true);
	view.setUint16(32, blockAlign, true);
	view.setUint16(34, bitsPerSample, true);
	writeString(36, "data");
	view.setUint32(40, dataSize, true);

	// Convert float32 [-1, 1] to int16
	let offset = 44;
	for (let i = 0; i < samples.length; i++) {
		const clamped = Math.max(-1, Math.min(1, samples[i]));
		const int16 = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
		view.setInt16(offset, int16, true);
		offset += 2;
	}

	// Convert to base64 in chunks to avoid stack overflow
	const bytes = new Uint8Array(buffer);
	let binary = "";
	const chunkSize = 8192;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}
	return btoa(binary);
}

async function sendForTranscription(
	audio: string,
	mimeType: string,
	options: LiveVoiceTranscriptionOptions = {},
	signal?: AbortSignal,
): Promise<string> {
	const response = await fetch(API_ENDPOINTS.SPEECH_TRANSCRIPTION, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
		body: JSON.stringify({
			audio,
			mimeType,
			...(options.language ? { language: options.language } : {}),
			...(options.model ? { model: options.model } : {}),
			...(options.provider ? { provider: options.provider } : {}),
		}),
		signal,
	});

	if (!response.ok) {
		let errorMessage = `Transcription failed: ${response.status}`;

		try {
			const payload = (await response.json()) as {
				details?: unknown;
				error?: unknown;
				message?: unknown;
			};
			const primaryMessage =
				typeof payload.error === "string" && payload.error.trim()
					? payload.error.trim()
					: typeof payload.message === "string" && payload.message.trim()
						? payload.message.trim()
						: null;
			const detailsMessage =
				typeof payload.details === "string" && payload.details.trim()
					? payload.details.trim()
					: null;

			if (primaryMessage && !isGenericTranscriptionErrorMessage(primaryMessage)) {
				errorMessage = primaryMessage;
			} else if (detailsMessage) {
				errorMessage = detailsMessage;
			} else if (primaryMessage) {
				errorMessage = primaryMessage;
			}
		} catch {
			// Keep the HTTP status fallback when the response body is empty or invalid.
		}

		throw new Error(errorMessage);
	}

	const result = (await response.json()) as { text: string };
	return result.text?.trim() ?? "";
}

// Lazily import MicVAD to avoid SSR issues with ONNX/WASM
type MicVADInstance = {
	start: () => Promise<void>;
	pause: () => Promise<void>;
	destroy: () => Promise<void>;
	listening: boolean;
};

async function createMicVAD(callbacks: {
	onSpeechStart: () => void;
	onSpeechRealStart: () => void;
	onSpeechEnd: (audio: Float32Array) => void;
	onVADMisfire: () => void;
}): Promise<MicVADInstance> {
	const { MicVAD } = await import("@ricky0123/vad-web");
	return MicVAD.new({
		baseAssetPath: "/vad/",
		onnxWASMBasePath: "/vad/",
		startOnLoad: true,
		positiveSpeechThreshold: 0.3,
		negativeSpeechThreshold: 0.15,
		minSpeechMs: 400,
		redemptionMs: 1400,
		onSpeechStart: callbacks.onSpeechStart,
		onSpeechRealStart: callbacks.onSpeechRealStart,
		onSpeechEnd: callbacks.onSpeechEnd,
		onVADMisfire: callbacks.onVADMisfire,
	});
}

export function useLiveVoice({
	onBargeInStart,
	onTranscription,
	preferBrowserRecognition = false,
	transcriptionOptions = {},
}: UseLiveVoiceOptions): UseLiveVoiceResult {
	const [state, setState] = useState<LiveVoiceState>("idle");
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const blobUrlRef = useRef<string | null>(null);
	const activeRef = useRef(false);
	const stateRef = useRef<LiveVoiceState>("idle");
	const onBargeInStartRef = useRef(onBargeInStart);
	const onTranscriptionRef = useRef(onTranscription);
	const transcriptionOptionsRef = useRef(transcriptionOptions);
	const transcriptionAbortRef = useRef<AbortController | null>(null);
	const ttsAbortRef = useRef<AbortController | null>(null);
	const vadRef = useRef<MicVADInstance | null>(null);
	const recognitionRef = useRef<SpeechRecognition | null>(null);
	const shouldRestartRecognitionRef = useRef(false);
	const hasRecognitionBargedInRef = useRef(false);

	useEffect(() => {
		onBargeInStartRef.current = onBargeInStart;
	}, [onBargeInStart]);

	useEffect(() => {
		onTranscriptionRef.current = onTranscription;
	}, [onTranscription]);

	useEffect(() => {
		transcriptionOptionsRef.current = transcriptionOptions;
	}, [transcriptionOptions]);

	const setVoiceState = useCallback((nextState: LiveVoiceState) => {
		stateRef.current = nextState;
		setState(nextState);
	}, []);

	const cleanupTranscription = useCallback(() => {
		if (transcriptionAbortRef.current) {
			transcriptionAbortRef.current.abort();
			transcriptionAbortRef.current = null;
		}
	}, []);

	const cleanupTts = useCallback(() => {
		if (ttsAbortRef.current) {
			ttsAbortRef.current.abort();
			ttsAbortRef.current = null;
		}
		if (audioRef.current) {
			audioRef.current.onended = null;
			audioRef.current.onerror = null;
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current = null;
		}
		if (blobUrlRef.current) {
			URL.revokeObjectURL(blobUrlRef.current);
			blobUrlRef.current = null;
		}
	}, []);

	const destroyVad = useCallback(async () => {
		const vad = vadRef.current;
		vadRef.current = null;
		if (vad) {
			try {
				if (vad.listening) {
					await vad.pause();
				}
				await vad.destroy();
			} catch {
				// Ignore errors during cleanup
			}
		}
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") {
			return;
		}

		const SpeechRecognitionCtor =
			window.SpeechRecognition || window.webkitSpeechRecognition;
		if (!SpeechRecognitionCtor) {
			return;
		}

		const speechRecognition = new SpeechRecognitionCtor();
		speechRecognition.continuous = true;
		speechRecognition.interimResults = true;
		speechRecognition.lang = "en-US";

		const handleStart = () => {
			if (!activeRef.current) {
				return;
			}

			if (stateRef.current !== "speaking") {
				setVoiceState("recording");
			}
		};

		const handleResult = (event: Event) => {
			const speechEvent = event as SpeechRecognitionEvent;
			let finalTranscript = "";
			let hasInterimTranscript = false;

			for (
				let index = speechEvent.resultIndex;
				index < speechEvent.results.length;
				index += 1
			) {
				const transcript =
					speechEvent.results[index]?.[0]?.transcript?.trim() ?? "";
				if (!transcript) {
					continue;
				}

				if (speechEvent.results[index].isFinal) {
					finalTranscript += `${finalTranscript ? " " : ""}${transcript}`;
				} else {
					hasInterimTranscript = true;
				}
			}

			if (
				activeRef.current &&
				(hasInterimTranscript || finalTranscript.length > 0) &&
				!hasRecognitionBargedInRef.current
			) {
				hasRecognitionBargedInRef.current = true;
				void Promise.resolve(onBargeInStartRef.current?.()).catch((error) => {
					console.error(
						"[LiveVoice] Speech recognition barge-in handler failed:",
						error,
					);
				});
			}

			const trimmedFinalTranscript = finalTranscript.trim();
			if (!trimmedFinalTranscript || !activeRef.current) {
				return;
			}

			hasRecognitionBargedInRef.current = false;
			void Promise.resolve(
				onTranscriptionRef.current(trimmedFinalTranscript),
			).catch((error) => {
				console.error(
					"[LiveVoice] Speech recognition transcription callback failed:",
					error,
				);
			});
			if (stateRef.current !== "speaking") {
				setVoiceState("recording");
			}
		};

		const handleError = (event: Event) => {
			const speechError = event as SpeechRecognitionErrorEvent;
			console.error("[LiveVoice] Speech recognition error:", speechError.error);
			hasRecognitionBargedInRef.current = false;

			if (
				speechError.error === "not-allowed" ||
				speechError.error === "service-not-allowed"
			) {
				activeRef.current = false;
				shouldRestartRecognitionRef.current = false;
				setVoiceState("idle");
			}
		};

		const handleEnd = () => {
			hasRecognitionBargedInRef.current = false;
			if (!activeRef.current || !shouldRestartRecognitionRef.current) {
				if (!activeRef.current) {
					setVoiceState("idle");
				}
				return;
			}

			window.setTimeout(() => {
				if (!activeRef.current || !shouldRestartRecognitionRef.current) {
					return;
				}

				try {
					speechRecognition.start();
				} catch (error) {
					console.error(
						"[LiveVoice] Failed to restart speech recognition:",
						error,
					);
					setVoiceState("idle");
				}
			}, 120);
		};

		speechRecognition.addEventListener("start", handleStart);
		speechRecognition.addEventListener("result", handleResult);
		speechRecognition.addEventListener("error", handleError);
		speechRecognition.addEventListener("end", handleEnd);

		recognitionRef.current = speechRecognition;
		return () => {
			shouldRestartRecognitionRef.current = false;
			speechRecognition.removeEventListener("start", handleStart);
			speechRecognition.removeEventListener("result", handleResult);
			speechRecognition.removeEventListener("error", handleError);
			speechRecognition.removeEventListener("end", handleEnd);
			try {
				speechRecognition.stop();
			} catch {
				// Ignore stop errors during cleanup
			}
			recognitionRef.current = null;
		};
	}, [setVoiceState]);

	const cancelPendingTranscription = useCallback(() => {
		cleanupTranscription();
		if (activeRef.current && stateRef.current === "processing") {
			setVoiceState("recording");
		}
	}, [cleanupTranscription, setVoiceState]);

	const stop = useCallback(() => {
		activeRef.current = false;
		shouldRestartRecognitionRef.current = false;
		hasRecognitionBargedInRef.current = false;
		cancelPendingTranscription();
		cleanupTts();
		void destroyVad();
		try {
			recognitionRef.current?.stop();
		} catch {
			// Ignore speech recognition stop errors
		}
		setVoiceState("idle");
	}, [cancelPendingTranscription, cleanupTts, destroyVad, setVoiceState]);

	const start = useCallback(() => {
		stop();
		activeRef.current = true;
		setVoiceState("recording");

		if (preferBrowserRecognition && recognitionRef.current) {
			shouldRestartRecognitionRef.current = true;
			hasRecognitionBargedInRef.current = false;
			try {
				recognitionRef.current.start();
				return;
			} catch (error) {
				console.warn(
					"[LiveVoice] Falling back to VAD transcription after speech recognition start failure:",
					error,
				);
				shouldRestartRecognitionRef.current = false;
			}
		}

		void createMicVAD({
			onSpeechStart: () => {
				if (activeRef.current && stateRef.current !== "speaking") {
					setVoiceState("recording");
				}
			},
			onSpeechRealStart: () => {
				if (!activeRef.current) {
					return;
				}

				if (stateRef.current === "speaking") {
					setVoiceState("recording");
				}

				void Promise.resolve(onBargeInStartRef.current?.()).catch((error) => {
					console.error("[LiveVoice] Barge-in handler failed:", error);
				});
			},
			onSpeechEnd: async (audio: Float32Array) => {
				if (!activeRef.current) return;

				setVoiceState("processing");
				const base64 = float32ToWavBase64(audio, VAD_SAMPLE_RATE);

				cleanupTranscription();
				const controller = new AbortController();
				transcriptionAbortRef.current = controller;

				try {
					const text = await sendForTranscription(
						base64,
						"audio/wav",
						transcriptionOptionsRef.current,
						controller.signal,
					);

					if (text && activeRef.current) {
						void Promise.resolve(onTranscriptionRef.current(text)).catch((error) => {
							console.error("[LiveVoice] Transcription callback failed:", error);
						});
					}
				} catch (error: unknown) {
					if (error instanceof Error && error.name === "AbortError") {
						return;
					}
					console.error("[LiveVoice] Transcription error:", error);
				} finally {
					if (transcriptionAbortRef.current === controller) {
						transcriptionAbortRef.current = null;
					}
				}

				if (activeRef.current) {
					setVoiceState("recording");
				}
			},
			onVADMisfire: () => {
				// Speech too short, ignore
			},
		}).then((vad) => {
			if (activeRef.current) {
				vadRef.current = vad;
			} else {
				// User stopped before VAD finished initializing
				void vad.destroy();
			}
		}).catch((error) => {
			console.error("[LiveVoice] Failed to initialize VAD:", error);
			if (activeRef.current) {
				activeRef.current = false;
				setVoiceState("idle");
			}
		});
	}, [cleanupTranscription, preferBrowserRecognition, setVoiceState, stop]);

	const speak = useCallback(
		(text: string) => {
			const trimmed = text.trim();
			if (!trimmed) return;

			cleanupTts();

			const controller = new AbortController();
			ttsAbortRef.current = controller;
			setVoiceState("speaking");

			const truncated = trimmed.slice(0, TTS_MAX_INPUT_LENGTH);

			void fetch("/api/sound-generation", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					input: truncated,
					model: "tts-latest",
					provider: "google",
					responseFormat: "mp3",
				}),
				signal: controller.signal,
			})
				.then(async (response) => {
					if (ttsAbortRef.current !== controller) return;
					if (!response.ok) {
						throw new Error(`TTS failed: ${response.status}`);
					}

					const blob = await response.blob();
					if (ttsAbortRef.current !== controller) return;

					const url = URL.createObjectURL(blob);
					blobUrlRef.current = url;

					const audio = new Audio(url);
					audioRef.current = audio;

					const finishSpeaking = () => {
						if (ttsAbortRef.current === controller) {
							ttsAbortRef.current = null;
						}
						if (blobUrlRef.current === url) {
							URL.revokeObjectURL(url);
							blobUrlRef.current = null;
						}
						audioRef.current = null;

						if (activeRef.current) {
							setVoiceState("recording");
						} else {
							setVoiceState("idle");
						}
					};

					audio.onended = finishSpeaking;
					audio.onerror = finishSpeaking;

					await audio.play();
				})
				.catch((error: unknown) => {
					if (error instanceof Error && error.name === "AbortError") {
						return;
					}
					console.error("[LiveVoice] TTS synthesis failed:", error);
					if (ttsAbortRef.current === controller) {
						ttsAbortRef.current = null;
					}

					if (activeRef.current) {
						setVoiceState("recording");
					} else {
						setVoiceState("idle");
					}
				});
		},
		[cleanupTts, setVoiceState],
	);

	const stopSpeaking = useCallback(() => {
		cleanupTts();
		if (activeRef.current) {
			setVoiceState("recording");
		} else {
			setVoiceState("idle");
		}
	}, [cleanupTts, setVoiceState]);

	useEffect(() => {
		return () => {
			activeRef.current = false;
			cancelPendingTranscription();
			cleanupTts();
			void destroyVad();
		};
	}, [cancelPendingTranscription, cleanupTts, destroyVad]);

	return {
		cancelPendingTranscription,
		state,
		start,
		stop,
		stopSpeaking,
		speak,
	};
}
