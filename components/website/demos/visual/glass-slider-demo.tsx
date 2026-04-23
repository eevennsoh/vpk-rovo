"use client";

import { useCallback, useEffect, useState } from "react";
import { CityRailEditor } from "@/components/arts/awake/city-popover";
import { useCities } from "@/components/arts/awake/use-cities";
import { ThemeToggle } from "@/components/utils/theme-wrapper";

const CITY_RAIL_TRACK_INSET = 24;
const SLIDER_RAIL_WIDTH = 170;
const SLIDER_HEIGHT = 440;

const demoAudioPool = new Map<string, HTMLAudioElement>();

function playDemoSound(src: string, volume = 1) {
	if (typeof window === "undefined") return;
	let audio = demoAudioPool.get(src);
	if (!audio) {
		audio = new Audio(src);
		audio.preload = "auto";
		demoAudioPool.set(src, audio);
	}
	audio.volume = Math.max(0, Math.min(1, volume));
	try {
		audio.currentTime = 0;
	} catch {
		// metadata not yet loaded — safe to skip
	}
	audio.play().catch(() => {
		// NotAllowedError before first user gesture; the triggering
		// keydown itself is a gesture, so the next press succeeds.
	});
}

function isTypingTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	const tag = target.tagName;
	return (
		tag === "INPUT" ||
		tag === "TEXTAREA" ||
		tag === "SELECT" ||
		target.isContentEditable
	);
}

function isSliderTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	return (
		target.getAttribute("role") === "slider" ||
		Boolean(target.closest('[role="slider"]'))
	);
}

function isInteractiveTarget(target: EventTarget | null) {
	if (!(target instanceof HTMLElement)) return false;
	return Boolean(target.closest("button, a, [role='button'], [role='radio']"));
}

export default function GlassSliderDemo() {
	const { cities, selectedIndex, setSelectedIndex, addCity, removeCity } = useCities();
	const [isCityManagerOpen, setIsCityManagerOpen] = useState(false);
	const [openRequestKey, setOpenRequestKey] = useState(0);
	const [keyboardNavigationPulseKey, setKeyboardNavigationPulseKey] = useState(0);

	const handleOpenChange = useCallback((open: boolean) => {
		setIsCityManagerOpen(open);
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;

		const handleKeyDown = (event: KeyboardEvent) => {
			const target = event.target;
			if (
				isTypingTarget(target) ||
				isSliderTarget(target) ||
				isInteractiveTarget(target) ||
				isCityManagerOpen
			) {
				return;
			}

			if (event.key === "ArrowUp" || event.key === "ArrowDown") {
				const delta = event.key === "ArrowUp" ? 1 : -1;
				const nextSelectedIndex = Math.max(
					0,
					Math.min(selectedIndex + delta, cities.length - 1),
				);
				if (nextSelectedIndex === selectedIndex) return;

				event.preventDefault();
				playDemoSound("/sound/click-002.mp3", 1);
				setSelectedIndex(nextSelectedIndex);
				setKeyboardNavigationPulseKey((current) => current + 1);
				return;
			}

			if (event.key === "Enter") {
				event.preventDefault();
				setOpenRequestKey((current) => current + 1);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [cities.length, isCityManagerOpen, selectedIndex, setSelectedIndex]);

	return (
		<div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden px-6 py-8">
			<div
				className="relative z-10"
				style={{
					width: SLIDER_RAIL_WIDTH + CITY_RAIL_TRACK_INSET,
					height: SLIDER_HEIGHT,
				}}
			>
				<CityRailEditor
					cities={cities}
					selectedIndex={selectedIndex}
					setSelectedIndex={setSelectedIndex}
					addCity={addCity}
					removeCity={removeCity}
					openRequestKey={openRequestKey}
					onOpenChange={handleOpenChange}
					keyboardNavigationPulseKey={keyboardNavigationPulseKey}
					width={SLIDER_RAIL_WIDTH + CITY_RAIL_TRACK_INSET}
					height={SLIDER_HEIGHT}
				/>
			</div>
			<div className="absolute top-4 right-4 z-20">
				<ThemeToggle />
			</div>
		</div>
	);
}
