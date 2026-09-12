"use client";

import { useMemo, useState } from "react";

import {
	ThinkingOrb,
	type OrbSize,
	type OrbState,
	type OrbTheme,
} from "@/components/visual/thinking-orbs";
import { GUI } from "@/components/utils/gui";
import { useTheme } from "@/components/utils/theme-wrapper";
import { cn } from "@/lib/utils";

const ORB_STATES: readonly OrbState[] = [
	"working",
	"searching",
	"solving",
	"listening",
	"connecting",
	"weaving",
	"composing",
	"breathing",
	"shaping",
];

const ORB_SIZES: readonly OrbSize[] = [64, 20];

const STATE_OPTIONS = ORB_STATES.map((state) => ({
	value: state,
	label: state.charAt(0).toUpperCase() + state.slice(1),
}));

const SIZE_OPTIONS = ORB_SIZES.map((size) => ({
	value: String(size),
	label: `${size}px`,
}));

const THEME_OPTIONS: readonly { value: OrbTheme; label: string }[] = [
	{ value: "auto", label: "Auto" },
	{ value: "light", label: "Light" },
	{ value: "dark", label: "Dark" },
];

function formatState(state: OrbState): string {
	return state.charAt(0).toUpperCase() + state.slice(1);
}

function ThinkingOrbsStateDemo({ state }: Readonly<{ state: OrbState }>) {
	const { actualTheme } = useTheme();

	return (
		<div
			data-testid={`thinking-orbs-${state}-example`}
			className={cn(
				"flex min-h-48 w-full flex-col items-center justify-center gap-6 rounded-xl border px-0 py-6 sm:flex-row sm:gap-12 sm:p-8",
				actualTheme === "dark"
					? "border-white/10 bg-[#0C0D12]"
					: "border-black/10 bg-[#F7F8F9]",
			)}
		>
			{ORB_SIZES.map((size) => (
				<div key={size} className="flex flex-col items-center gap-3">
					<ThinkingOrb
						state={state}
						size={size}
						theme={actualTheme}
						gravity
					/>
					<span
						className={cn(
							"text-xs",
							actualTheme === "dark" ? "text-white/60" : "text-black/60",
						)}
					>
						{size}px
					</span>
				</div>
			))}
		</div>
	);
}

export function ThinkingOrbsDemoWorking() {
	return <ThinkingOrbsStateDemo state="working" />;
}

export function ThinkingOrbsDemoSearching() {
	return <ThinkingOrbsStateDemo state="searching" />;
}

export function ThinkingOrbsDemoSolving() {
	return <ThinkingOrbsStateDemo state="solving" />;
}

export function ThinkingOrbsDemoListening() {
	return <ThinkingOrbsStateDemo state="listening" />;
}

export function ThinkingOrbsDemoConnecting() {
	return <ThinkingOrbsStateDemo state="connecting" />;
}

export function ThinkingOrbsDemoWeaving() {
	return <ThinkingOrbsStateDemo state="weaving" />;
}

export function ThinkingOrbsDemoComposing() {
	return <ThinkingOrbsStateDemo state="composing" />;
}

export function ThinkingOrbsDemoBreathing() {
	return <ThinkingOrbsStateDemo state="breathing" />;
}

export function ThinkingOrbsDemoShaping() {
	return <ThinkingOrbsStateDemo state="shaping" />;
}

export default function ThinkingOrbsDemo() {
	const { actualTheme } = useTheme();
	const [state, setState] = useState<OrbState>("listening");
	const [size, setSize] = useState<OrbSize>(64);
	const [theme, setTheme] = useState<OrbTheme>("auto");
	const [speed, setSpeed] = useState(1);
	const [paused, setPaused] = useState(false);
	const [gravity, setGravity] = useState(true);
	const [gravityReach, setGravityReach] = useState(2.5);
	const [gravityPull, setGravityPull] = useState(0.12);
	const [cursorGravity, setCursorGravity] = useState(true);
	const [ariaLabel, setAriaLabel] = useState("");
	const resolvedTheme = theme === "auto" ? actualTheme : theme;
	const values = useMemo(
		() => ({
			state,
			size,
			theme,
			speed,
			paused,
			gravity,
			gravityReach,
			gravityPull,
			cursorGravity,
			ariaLabel,
		}),
		[
			state,
			size,
			theme,
			speed,
			paused,
			gravity,
			gravityReach,
			gravityPull,
			cursorGravity,
			ariaLabel,
		],
	);

	return (
		<div className="mx-auto flex w-full max-w-5xl flex-col gap-4 p-4 sm:p-6">
			<div
				data-testid="thinking-orbs-preview"
				data-state={state}
				data-size={size}
				data-speed={speed}
				data-paused={paused}
				data-gravity={gravity}
				data-cursor-gravity={cursorGravity}
				data-theme={theme}
				className={cn(
					"flex min-h-72 items-center justify-center rounded-xl border p-8 transition-colors duration-medium motion-reduce:transition-none",
					resolvedTheme === "dark"
						? "border-white/10 bg-[#0C0D12]"
						: "border-black/10 bg-[#F7F8F9]",
				)}
			>
				<ThinkingOrb
					state={state}
					size={size}
					theme={theme === "auto" ? actualTheme : theme}
					speed={speed}
					paused={paused}
					gravity={
						gravity
							? { radius: size * gravityReach, pull: size * gravityPull }
							: false
					}
					cursorGravity={cursorGravity}
					aria-label={ariaLabel || undefined}
				/>
			</div>

			<GUI.Panel title="Thinking Orbs controls" values={values}>
				<GUI.Section title="Variant" borderTop={false}>
					<GUI.Select
						id="thinking-orbs-state"
						label="State"
						value={state}
						defaultValue="listening"
						options={STATE_OPTIONS}
						onChange={setState}
					/>
					<GUI.SegmentedControl
						id="thinking-orbs-size"
						label="Size"
						value={String(size)}
						options={SIZE_OPTIONS}
						onChange={(next) => setSize(Number(next) as OrbSize)}
						valueKeys="size"
					/>
					<GUI.SegmentedControl
						id="thinking-orbs-theme"
						label="Theme"
						description="Auto follows the active VPK light or dark theme."
						value={theme}
						options={THEME_OPTIONS}
						onChange={setTheme}
					/>
				</GUI.Section>

				<GUI.Section title="Animation">
					<GUI.Control
						id="thinking-orbs-speed"
						label="Speed"
						description="Multiplier applied to the selected state's tuned base speed."
						value={speed}
						defaultValue={1}
						min={0.25}
						max={3}
						step={0.05}
						unit="×"
						onChange={setSpeed}
					/>
					<GUI.Toggle
						id="thinking-orbs-paused"
						label="Paused"
						description="Freezes every orb on its current representative frame."
						checked={paused}
						onChange={setPaused}
					/>
				</GUI.Section>

				<GUI.Section title="Dot gravity">
					<GUI.Toggle
						id="thinking-orbs-gravity"
						label="Dots bend to cursor"
						description="Dots bend toward the pointer with an inverse-square falloff and ease back when it leaves. Ignored under reduced motion and while paused."
						checked={gravity}
						onChange={setGravity}
					/>
					<GUI.Control
						id="thinking-orbs-gravity-reach"
						label="Reach"
						description="Influence radius from the orb's centre, as a multiple of its size."
						value={gravityReach}
						defaultValue={2.5}
						min={1}
						max={6}
						step={0.1}
						unit="×"
						onChange={setGravityReach}
					/>
					<GUI.Control
						id="thinking-orbs-gravity-pull"
						label="Pull"
						description="Peak displacement at the pointer, as a fraction of the orb's size."
						value={gravityPull}
						defaultValue={0.12}
						min={0}
						max={0.4}
						step={0.01}
						unit="×"
						onChange={setGravityPull}
					/>
				</GUI.Section>

				<GUI.Section title="Cursor gravity">
					<GUI.Toggle
						id="thinking-orbs-cursor-gravity"
						label="Pointer bends to orb"
						description="The inverse effect: the native cursor is swapped for a drawn replica whose tip stays pinned while its body leans and trails toward the nearest orb. Needs a fine pointer; off under reduced motion."
						checked={cursorGravity}
						onChange={setCursorGravity}
					/>
				</GUI.Section>

				<GUI.Section title="Accessibility">
					<GUI.TextInput
						id="thinking-orbs-label"
						label="Accessible label"
						description="Leave empty to use the component's state-specific default."
						value={ariaLabel}
						placeholder={`${formatState(state)}…`}
						onChange={setAriaLabel}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
