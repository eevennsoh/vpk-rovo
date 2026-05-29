"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import RefreshIcon from "@atlaskit/icon/core/refresh";

import { Button } from "@/components/ui/button";

import { SAMPLE_TEXT, type TracingConfig } from "./data";
import { buildTracingLayers } from "./lib";

/** Tracks the OS "reduce motion" preference so the trace can degrade to a static state. */
function usePrefersReducedMotion(): boolean {
	const [reduced, setReduced] = useState(false);

	useEffect(() => {
		const query = window.matchMedia("(prefers-reduced-motion: reduce)");
		const update = () => setReduced(query.matches);
		update();
		query.addEventListener("change", update);
		return () => query.removeEventListener("change", update);
	}, []);

	return reduced;
}

type VisualTracingProps = Readonly<{
	config: TracingConfig;
	text?: string;
}>;

export default function VisualTracing({ config, text = SAMPLE_TEXT }: VisualTracingProps) {
	const layers = useMemo(() => buildTracingLayers(config), [config]);
	const charCount = text.trim().length;
	const durationMs = (charCount / Math.max(config.cps, 1)) * 1000;
	const reducedMotion = usePrefersReducedMotion();

	const [open, setOpen] = useState(false);
	const [animating, setAnimating] = useState(false);
	const [cycle, setCycle] = useState(0);

	// Each replay parks the light off-screen with the transition disabled; the
	// cycle effect below then re-enables it and sweeps to the open position.
	const replay = useCallback(() => {
		setAnimating(false);
		setOpen(false);
		setCycle((current) => current + 1);
	}, []);

	useEffect(() => {
		if (reducedMotion) {
			setAnimating(false);
			setOpen(true);
			return;
		}
		const frame = requestAnimationFrame(() => {
			setAnimating(true);
			setOpen(true);
		});
		return () => cancelAnimationFrame(frame);
	}, [cycle, reducedMotion]);

	useEffect(() => {
		if (reducedMotion || !config.autoLoop) return;
		const timer = setTimeout(replay, durationMs + config.loopDelay * 1000);
		return () => clearTimeout(timer);
	}, [cycle, config.autoLoop, config.loopDelay, durationMs, reducedMotion, replay]);

	const textStyle: React.CSSProperties = {
		display: layers.display,
		color: "transparent",
		backgroundImage: layers.backgroundImage,
		backgroundRepeat: layers.backgroundRepeat,
		backgroundSize: layers.backgroundSize,
		backgroundPosition: open ? layers.openPosition : layers.closedPosition,
		WebkitBackgroundClip: layers.backgroundClip,
		backgroundClip: layers.backgroundClip,
		transition: animating ? `background-position ${durationMs}ms linear` : "none",
	};

	return (
		<div className="flex w-full flex-col items-center gap-8">
			<p
				lang="en"
				style={{ ...textStyle, maxWidth: "34ch" }}
				className="text-center text-2xl font-semibold leading-relaxed sm:text-3xl"
			>
				{text}
			</p>
			<Button variant="secondary" onClick={replay} disabled={reducedMotion}>
				<RefreshIcon label="" size="small" />
				Replay
			</Button>
		</div>
	);
}
