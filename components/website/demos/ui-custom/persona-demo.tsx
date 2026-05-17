"use client";

import { useState } from "react";

import { Persona, type PersonaState } from "@/components/ui-custom/persona";
import { Button } from "@/components/ui/button";

// — Default: single idle persona —

export default function PersonaDemo() {
	return (
		<div className="flex items-center justify-center">
			<Persona state="idle" variant="obsidian" className="size-20" />
		</div>
	);
}

// — State management: cycle through states with buttons —

const STATES: { label: string; value: PersonaState }[] = [
	{ label: "Idle", value: "idle" },
	{ label: "Listen", value: "listening" },
	{ label: "Think", value: "thinking" },
	{ label: "Speak", value: "speaking" },
	{ label: "Sleep", value: "asleep" },
];

export function PersonaDemoStates() {
	const [state, setState] = useState<PersonaState>("idle");

	return (
		<div className="flex flex-col items-center gap-6">
			<Persona state={state} variant="opal" className="size-32" />
			<div className="flex flex-wrap items-center justify-center gap-2">
				{STATES.map((s) => (
					<Button
						key={s.value}
						variant={state === s.value ? "default" : "outline"}
						size="sm"
						onClick={() => setState(s.value)}
					>
						{s.label}
					</Button>
				))}
			</div>
		</div>
	);
}

// — All variants: grid showing every visual variant —

const VARIANTS = ["obsidian", "mana", "opal", "halo", "glint", "command"] as const;

export function PersonaDemoVariants() {
	return (
		<div className="flex flex-wrap items-center justify-center gap-6">
			{VARIANTS.map((variant) => (
				<div key={variant} className="flex flex-col items-center gap-2">
					<Persona state="idle" variant={variant} className="size-20" />
					<span className="text-xs text-text-subtle capitalize">{variant}</span>
				</div>
			))}
		</div>
	);
}

// — Custom styling: large persona with border —

export function PersonaDemoCustomStyling() {
	return (
		<div className="flex items-center justify-center">
			<Persona
				state="thinking"
				variant="halo"
				className="size-64 rounded-full border border-border"
			/>
		</div>
	);
}
