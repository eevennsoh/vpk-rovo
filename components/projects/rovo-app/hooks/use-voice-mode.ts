"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TTS_MAX_INPUT_LENGTH = 4000;

export interface VoiceModeHookResult {
	isSpeaking: boolean;
	speak: (text: string) => void;
	stopSpeaking: () => void;
}

export function useVoiceMode(): VoiceModeHookResult {
	const [isSpeaking, setIsSpeaking] = useState(false);
	const abortRef = useRef<AbortController | null>(null);
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const blobUrlRef = useRef<string | null>(null);

	const cleanup = useCallback(() => {
		if (abortRef.current) {
			abortRef.current.abort();
			abortRef.current = null;
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
		setIsSpeaking(false);
	}, []);

	const speak = useCallback(
		(text: string) => {
			const trimmed = text.trim();
			if (!trimmed) {
				return;
			}

			cleanup();

			const controller = new AbortController();
			abortRef.current = controller;
			setIsSpeaking(true);

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
					// Guard: if this request was superseded by a newer speak() call, bail out
					if (abortRef.current !== controller) {
						return;
					}

					if (!response.ok) {
						throw new Error(`TTS failed: ${response.status}`);
					}

					const blob = await response.blob();

					// Re-check after async blob read
					if (abortRef.current !== controller) {
						return;
					}

					const url = URL.createObjectURL(blob);
					blobUrlRef.current = url;

					const audio = new Audio(url);
					audioRef.current = audio;

					audio.onended = () => {
						setIsSpeaking(false);
						if (blobUrlRef.current === url) {
							URL.revokeObjectURL(url);
							blobUrlRef.current = null;
						}
						audioRef.current = null;
					};

					audio.onerror = () => {
						setIsSpeaking(false);
						if (blobUrlRef.current === url) {
							URL.revokeObjectURL(url);
							blobUrlRef.current = null;
						}
						audioRef.current = null;
					};

					await audio.play();
				})
				.catch((error: unknown) => {
					if (error instanceof Error && error.name === "AbortError") {
						return;
					}
					console.error("[VoiceMode] TTS synthesis failed:", error);
					setIsSpeaking(false);
				});
		},
		[cleanup],
	);

	const stopSpeaking = useCallback(() => {
		cleanup();
	}, [cleanup]);

	useEffect(() => {
		return () => {
			cleanup();
		};
	}, [cleanup]);

	return { isSpeaking, speak, stopSpeaking };
}
