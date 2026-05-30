"use client";

import * as React from "react";

import { GlassTabs } from "@/components/visual/glass-tabs";
import { ThemeToggle, ThemeWrapper } from "@/components/utils/theme-wrapper";

const GLASS_TAB_OPTIONS = [
	{ value: "location", label: "Location" },
	{ value: "system", label: "System" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
] as const;

type GlassTabsDemoValue = (typeof GLASS_TAB_OPTIONS)[number]["value"];

const CLICK_SOUND_SRC = "/sound/click-003.mp3";

let cachedClickAudio: HTMLAudioElement | null = null;
function getCachedClickAudio(): HTMLAudioElement | null {
	if (typeof window === "undefined") return null;
	if (!cachedClickAudio) {
		cachedClickAudio = new Audio(CLICK_SOUND_SRC);
		cachedClickAudio.preload = "auto";
	}
	return cachedClickAudio;
}

// Browser autoplay policies block Audio.play() until the page has received a
// user activation (click/keydown/pointerdown/touchstart). Hover events don't
// count, so the very first hover would be silent. We prime the cached element
// with a muted play+pause on the first qualifying gesture; subsequent plays
// (including hover) then succeed for the rest of the session.
let audioUnlocked = false;
function unlockClickAudio() {
	if (audioUnlocked) return;
	audioUnlocked = true;
	const audio = getCachedClickAudio();
	if (!audio) return;
	const previousVolume = audio.volume;
	audio.volume = 0;
	audio.play()
		.then(() => {
			audio.pause();
			audio.currentTime = 0;
			audio.volume = previousVolume;
		})
		.catch(() => {
			audio.volume = previousVolume;
		});
}

function ensureAudioUnlockListener() {
	if (typeof window === "undefined") return;
	const w = window as unknown as { __vpkGlassTabsDemoAudioBound?: boolean };
	if (w.__vpkGlassTabsDemoAudioBound) return;
	w.__vpkGlassTabsDemoAudioBound = true;
	const handler = () => {
		unlockClickAudio();
		window.removeEventListener("pointerdown", handler, true);
		window.removeEventListener("keydown", handler, true);
		window.removeEventListener("touchstart", handler, true);
	};
	window.addEventListener("pointerdown", handler, true);
	window.addEventListener("keydown", handler, true);
	window.addEventListener("touchstart", handler, true);
}

if (typeof window !== "undefined") {
	ensureAudioUnlockListener();
}

function playClickSound(volume = 0.5) {
	const audio = getCachedClickAudio();
	if (!audio) return;
	ensureAudioUnlockListener();
	audio.volume = Math.max(0, Math.min(1, volume));
	try {
		audio.currentTime = 0;
	} catch {
		// Some browsers throw if metadata isn't loaded yet — safe to skip.
	}
	audio.play().catch(() => {
		// Autoplay policies may still block this on the very first gesture;
		// the next click/keypress will prime the element for the session.
	});
}

function isTypingTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable;
}

// Skip the global handler when focus is on an interactive control that likely
// handles its own arrow keys (e.g. the GlassTabs radios themselves).
function isInteractiveTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(
		target.closest("button, a, [role='button'], [role='radio'], [role='slider']"),
	);
}

export default function GlassTabsDemo() {
	const [value, setValue] = React.useState<GlassTabsDemoValue>("location");
	const valueRef = React.useRef(value);
	valueRef.current = value;

	React.useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
			if (event.metaKey || event.ctrlKey || event.altKey) return;
			if (isTypingTarget(event.target) || isInteractiveTarget(event.target)) return;

			const currentIndex = GLASS_TAB_OPTIONS.findIndex(
				(option) => option.value === valueRef.current,
			);
			const safeIndex = currentIndex === -1 ? 0 : currentIndex;
			const delta = event.key === "ArrowLeft" ? -1 : 1;
			const nextIndex = Math.max(
				0,
				Math.min(safeIndex + delta, GLASS_TAB_OPTIONS.length - 1),
			);

			event.preventDefault();
			if (nextIndex === safeIndex) return;

			playClickSound(1);
			setValue(GLASS_TAB_OPTIONS[nextIndex].value);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, []);

	const handleChange = React.useCallback((next: GlassTabsDemoValue) => {
		playClickSound(1);
		setValue(next);
	}, []);

	const handleHover = React.useCallback(() => {
		playClickSound();
	}, []);

	return (
		<ThemeWrapper>
			<div className="relative flex h-screen w-full items-center justify-center overflow-hidden px-6 py-10">
				<div className="absolute top-4 right-4">
					<ThemeToggle />
				</div>
				<GlassTabs
					aria-label="Awake theme"
					options={GLASS_TAB_OPTIONS}
					value={value}
					onChange={handleChange}
					onHover={handleHover}
				/>
			</div>
		</ThemeWrapper>
	);
}
