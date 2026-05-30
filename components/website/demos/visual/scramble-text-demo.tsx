"use client";

import { useEffect, useMemo, useState } from "react";
import { stagger } from "motion/react";
import { ScrambleText } from "motion-plus/react";
import RefreshIcon from "@atlaskit/icon/core/refresh";

import { Button } from "@/components/ui/button";
import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";
import { cn } from "@/lib/utils";

// Exact charset used by all three motion.dev scramble-text examples
const MOTION_SPECIAL_CHARS = "!@#$%^&*()_+-=[]{}|;:,.<>?/~`░▒▓█▀▄■□▪▫●○◆◇◈◊※†‡";
const ALPHANUMERIC_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const BINARY_CHARS = "01";
const KATAKANA_CHARS = "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン";

// Exact word list from the official "Normal" example
const NORMAL_WORDS = [
	"Animate",
	"Spring",
	"Easing",
	"Damping",
	"Physics",
	"Stagger",
	"Transform",
	"Variants",
	"Motion Value",
	"Timeline",
	"Gestures",
	"Drag",
	"Hover",
	"Layout",
	"Viewport",
	"State Change",
];

const HEADLINE_CLASSES = "block text-center font-mono text-3xl font-medium tracking-tight text-text sm:text-4xl";

type ScramblePreviewTileProps = Readonly<{
	label: string;
	value: string;
	children: React.ReactNode;
	className?: string;
}>;

function ScramblePreviewTile({ label, value, children, className }: ScramblePreviewTileProps) {
	return (
		<div
			className={cn("flex min-h-56 flex-col rounded-lg border border-border bg-surface-raised p-4", className)}
		>
			<div className="flex items-baseline justify-between gap-3 font-mono text-xs">
				<span className="text-text-subtle">{label}</span>
				<span className="shrink-0 text-text-subtlest">{value}</span>
			</div>
			<div className="mt-4 flex min-h-40 flex-1 items-center justify-center overflow-hidden rounded-md bg-surface px-4">
				{children}
			</div>
		</div>
	);
}

function NormalScene() {
	const [index, setIndex] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			setIndex((i) => (i + 1) % NORMAL_WORDS.length);
		}, 2000);
		return () => clearInterval(id);
	}, []);

	return (
		<ScrambleText className={HEADLINE_CLASSES} chars={MOTION_SPECIAL_CHARS}>
			{NORMAL_WORDS[index]}
		</ScrambleText>
	);
}

function HoverScene() {
	const [active, setActive] = useState(false);

	return (
		<span
			className="cursor-pointer select-none"
			onPointerEnter={() => setActive(true)}
			onPointerLeave={() => setActive(false)}
		>
			<ScrambleText className={HEADLINE_CLASSES} active={active} chars={MOTION_SPECIAL_CHARS}>
				Hover me
			</ScrambleText>
		</span>
	);
}

function StaggerScene() {
	const [active, setActive] = useState(true);
	const centerStagger = useMemo(() => stagger(0.1, { from: "center" }), []);

	useEffect(() => {
		const id = setInterval(() => {
			setActive(false);
			requestAnimationFrame(() => setActive(true));
		}, 2000);
		return () => clearInterval(id);
	}, []);

	return (
		<ScrambleText
			className={HEADLINE_CLASSES}
			active={active}
			delay={centerStagger}
			chars={MOTION_SPECIAL_CHARS}
		>
			Stagger
		</ScrambleText>
	);
}

const CHARSET_OPTIONS = [
	{ value: "motion-special", label: "Motion special (default)" },
	{ value: "alphanumeric", label: "Alphanumeric (A–Z a–z 0–9)" },
	{ value: "binary", label: "Binary (0, 1)" },
	{ value: "katakana", label: "Katakana" },
	{ value: "custom", label: "Custom" },
] as const;

type CharsetKey = (typeof CHARSET_OPTIONS)[number]["value"];

const STAGGER_FROM_OPTIONS = [
	{ value: "first", label: "first → last" },
	{ value: "center", label: "center → out" },
	{ value: "last", label: "last → first" },
] as const;

type StaggerFrom = (typeof STAGGER_FROM_OPTIONS)[number]["value"];

function resolveCharsForPreset(preset: Exclude<CharsetKey, "custom">): string {
	switch (preset) {
		case "motion-special":
			return MOTION_SPECIAL_CHARS;
		case "alphanumeric":
			return ALPHANUMERIC_CHARS;
		case "binary":
			return BINARY_CHARS;
		case "katakana":
			return KATAKANA_CHARS;
	}
}

function matchPreset(value: string): Exclude<CharsetKey, "custom"> | null {
	if (value === MOTION_SPECIAL_CHARS) return "motion-special";
	if (value === ALPHANUMERIC_CHARS) return "alphanumeric";
	if (value === BINARY_CHARS) return "binary";
	if (value === KATAKANA_CHARS) return "katakana";
	return null;
}

function PlaygroundScene() {
	const [text, setText] = useState("Scramble me!");
	const [active, setActive] = useState(true);
	const [duration, setDuration] = useState(1);
	const [perpetual, setPerpetual] = useState(false);
	const [delaySec, setDelaySec] = useState(0);
	const [staggerEnabled, setStaggerEnabled] = useState(false);
	const [staggerStep, setStaggerStep] = useState(0.1);
	const [staggerFrom, setStaggerFrom] = useState<StaggerFrom>("center");
	const [intervalSec, setIntervalSec] = useState(0.05);
	const [charsetKey, setCharsetKey] = useState<CharsetKey>("motion-special");
	const [charsValue, setCharsValue] = useState(MOTION_SPECIAL_CHARS);
	const [replayKey, setReplayKey] = useState(0);

	const resolvedChars = charsValue.length > 0 ? charsValue : MOTION_SPECIAL_CHARS;
	const resolvedDelay = useMemo(
		() => (staggerEnabled ? stagger(staggerStep, { from: staggerFrom }) : delaySec),
		[staggerEnabled, staggerStep, staggerFrom, delaySec],
	);
	const resolvedDuration = perpetual ? Infinity : duration;

	const handleCharsetChange = (next: CharsetKey) => {
		setCharsetKey(next);
		if (next !== "custom") {
			setCharsValue(resolveCharsForPreset(next));
		}
	};

	const handleCharsValueChange = (next: string) => {
		setCharsValue(next);
		const matched = matchPreset(next);
		setCharsetKey(matched ?? "custom");
	};

	const config = useMemo(
		() => ({
			text,
			active,
			duration: perpetual ? "Infinity" : duration,
			delay: staggerEnabled ? `stagger(${staggerStep}, { from: '${staggerFrom}' })` : delaySec,
			interval: intervalSec,
			chars: charsetKey === "custom" ? `"${charsValue}"` : charsetKey,
		}),
		[text, active, duration, perpetual, delaySec, staggerEnabled, staggerStep, staggerFrom, intervalSec, charsetKey, charsValue],
	);

	const replay = () => setReplayKey((k) => k + 1);

	return (
		<div className="flex w-full flex-col" style={{ gap: token("space.300") }}>
			<ScramblePreviewTile label="Playground" value="all props live">
				<ScrambleText
					key={`playground-${replayKey}`}
					className={HEADLINE_CLASSES}
					active={active}
					duration={resolvedDuration}
					delay={resolvedDelay}
					interval={intervalSec}
					chars={resolvedChars}
				>
					{text}
				</ScrambleText>
			</ScramblePreviewTile>

			<GUI.Panel title="Playground controls" values={config}>
				<GUI.Section title="Text" borderTop={false}>
					<GUI.TextInput
						id="scramble-playground-text"
						label="children"
						value={text}
						onChange={setText}
						placeholder="Scramble me!"
					/>
				</GUI.Section>

				<GUI.Section title="Playback">
					<GUI.Toggle
						id="scramble-playground-active"
						label="active"
						description="When false, snaps to the final text. Drives the hover pattern."
						checked={active}
						onChange={setActive}
					/>
					<Button onClick={replay} variant="default" className="w-full">
						<RefreshIcon label="" size="small" />
						<span>Play again</span>
					</Button>
				</GUI.Section>

				<GUI.Section title="Timing">
					<GUI.Toggle
						id="scramble-playground-perpetual"
						label="duration: Infinity"
						description="Scramble perpetually until active becomes false (the hover pattern)."
						checked={perpetual}
						onChange={setPerpetual}
					/>
					{!perpetual ? (
						<GUI.Control
							id="scramble-playground-duration"
							label="duration (s)"
							value={duration}
							defaultValue={1}
							min={0.1}
							max={5}
							step={0.1}
							onChange={setDuration}
						/>
					) : null}
					<GUI.Control
						id="scramble-playground-interval"
						label="interval (s)"
						value={intervalSec}
						defaultValue={0.05}
						min={0.01}
						max={0.5}
						step={0.01}
						onChange={setIntervalSec}
					/>
				</GUI.Section>

				<GUI.Section title="Delay & stagger">
					<GUI.Toggle
						id="scramble-playground-stagger"
						label="use stagger() for delay"
						description="When off, delay is a constant; when on, delay = stagger(step, { from }) per character."
						checked={staggerEnabled}
						onChange={setStaggerEnabled}
					/>
					{staggerEnabled ? (
						<>
							<GUI.Control
								id="scramble-playground-stagger-step"
								label="stagger step (s)"
								value={staggerStep}
								defaultValue={0.1}
								min={0.01}
								max={0.5}
								step={0.01}
								onChange={setStaggerStep}
							/>
							<GUI.Select
								id="scramble-playground-stagger-from"
								label="stagger from"
								value={staggerFrom}
								options={STAGGER_FROM_OPTIONS}
								onChange={setStaggerFrom}
							/>
						</>
					) : (
						<GUI.Control
							id="scramble-playground-delay"
							label="delay (s)"
							value={delaySec}
							defaultValue={0}
							min={0}
							max={3}
							step={0.05}
							onChange={setDelaySec}
						/>
					)}
				</GUI.Section>

				<GUI.Section title="Character set">
					<GUI.Select
						id="scramble-playground-charset"
						label="chars preset"
						value={charsetKey}
						options={CHARSET_OPTIONS}
						onChange={handleCharsetChange}
					/>
					<GUI.TextInput
						id="scramble-playground-chars"
						label="chars"
						value={charsValue}
						onChange={handleCharsValueChange}
						placeholder={MOTION_SPECIAL_CHARS}
						description="Each character is sampled at random while scrambling. Editing this auto-switches the preset to Custom."
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}

export default function ScrambleTextDemo() {
	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div className="flex flex-col gap-1">
				<span className="text-sm font-semibold text-text">Scramble Text</span>
				<span className="text-xs text-text-subtle">
					Three reference scenes mirror the official motion.dev examples (charset, words, stagger, timing).
					Use the Playground below to live-tweak every prop.
				</span>
			</div>

			<div className="grid w-full gap-3">
				<ScramblePreviewTile label="Normal" value="auto-cycles every 2s">
					<NormalScene />
				</ScramblePreviewTile>

				<ScramblePreviewTile label="Hover" value="active toggles on hover">
					<HoverScene />
				</ScramblePreviewTile>

				<ScramblePreviewTile label="Stagger from center" value="stagger(0.1, { from: 'center' })">
					<StaggerScene />
				</ScramblePreviewTile>
			</div>

			<PlaygroundScene />
		</div>
	);
}
