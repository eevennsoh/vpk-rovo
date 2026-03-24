"use client";

import { useState, useCallback, useEffect, useRef, useId } from "react";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	CardDescription,
	CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import PlayIcon from "@atlaskit/icon/core/video-play-overlay";
import PauseIcon from "@atlaskit/icon/core/video-pause-overlay";
import RefreshIcon from "@atlaskit/icon/core/refresh";
import CheckCircleIcon from "@atlaskit/icon/core/check-circle";
import ClockIcon from "@atlaskit/icon/core/clock";
import BreakIcon from "@atlaskit/icon/core/heart";
import SettingsIcon from "@atlaskit/icon/core/settings";
import DeleteIcon from "@atlaskit/icon/core/delete";
import ChartIcon from "@atlaskit/icon/core/dashboard";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type TimerPhase = "focus" | "short-break" | "long-break";
type TimerStatus = "idle" | "running" | "paused";

interface SessionLog {
	id: string;
	phase: TimerPhase;
	durationMinutes: number;
	completedAt: number;
	taskLabel: string;
}

interface TimerSettings {
	focusMinutes: number;
	shortBreakMinutes: number;
	longBreakMinutes: number;
	sessionsBeforeLongBreak: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SETTINGS: TimerSettings = {
	focusMinutes: 25,
	shortBreakMinutes: 5,
	longBreakMinutes: 15,
	sessionsBeforeLongBreak: 4,
};

const PHASE_CONFIG: Record<
	TimerPhase,
	{ label: string; color: string; bgRing: string; bgAccent: string }
> = {
	focus: {
		label: "Focus",
		color: "text-icon-danger",
		bgRing: "stroke-bg-danger-bold",
		bgAccent: "bg-bg-danger-subtler",
	},
	"short-break": {
		label: "Short Break",
		color: "text-icon-success",
		bgRing: "stroke-bg-success-bold",
		bgAccent: "bg-bg-success-subtler",
	},
	"long-break": {
		label: "Long Break",
		color: "text-icon-information",
		bgRing: "stroke-bg-information-bold",
		bgAccent: "bg-bg-information-subtler",
	},
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(totalSeconds: number): string {
	const m = Math.floor(totalSeconds / 60);
	const s = totalSeconds % 60;
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function phaseDuration(phase: TimerPhase, settings: TimerSettings): number {
	switch (phase) {
		case "focus":
			return settings.focusMinutes * 60;
		case "short-break":
			return settings.shortBreakMinutes * 60;
		case "long-break":
			return settings.longBreakMinutes * 60;
	}
}

function timeAgo(timestamp: number): string {
	const seconds = Math.floor((Date.now() - timestamp) / 1000);
	if (seconds < 60) return "just now";
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ago`;
	const days = Math.floor(hours / 24);
	return `${days}d ago`;
}

// ---------------------------------------------------------------------------
// Circular progress ring
// ---------------------------------------------------------------------------

function ProgressRing({
	progress,
	phase,
	size = 220,
	strokeWidth = 8,
	children,
}: Readonly<{
	progress: number;
	phase: TimerPhase;
	size?: number;
	strokeWidth?: number;
	children: React.ReactNode;
}>) {
	const radius = (size - strokeWidth) / 2;
	const circumference = 2 * Math.PI * radius;
	const offset = circumference * (1 - progress);

	return (
		<div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
			<svg width={size} height={size} className="-rotate-90">
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					strokeWidth={strokeWidth}
					className="stroke-border"
				/>
				<circle
					cx={size / 2}
					cy={size / 2}
					r={radius}
					fill="none"
					strokeWidth={strokeWidth}
					strokeLinecap="round"
					strokeDasharray={circumference}
					strokeDashoffset={offset}
					className={cn(PHASE_CONFIG[phase].bgRing, "transition-[stroke-dashoffset] duration-500")}
				/>
			</svg>
			<div className="absolute inset-0 flex flex-col items-center justify-center">
				{children}
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
	icon: Icon,
	label,
	value,
	accent,
}: Readonly<{
	icon: typeof ClockIcon;
	label: string;
	value: string | number;
	accent: string;
}>) {
	return (
		<div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3 transition-colors">
			<div className={cn("flex size-9 shrink-0 items-center justify-center rounded-lg", accent)}>
				<Icon label="" size="small" />
			</div>
			<div className="min-w-0">
				<p className="text-xs text-text-subtlest">{label}</p>
				<p className="text-lg font-semibold leading-snug text-text">{value}</p>
			</div>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Session log row
// ---------------------------------------------------------------------------

function SessionRow({ session }: Readonly<{ session: SessionLog }>) {
	const config = PHASE_CONFIG[session.phase];
	return (
		<div className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-surface-raised">
			<Badge variant={session.phase === "focus" ? "danger" : session.phase === "short-break" ? "success" : "info"}>
				{config.label}
			</Badge>
			<span className="flex-1 truncate text-sm text-text">
				{session.taskLabel || "Untitled session"}
			</span>
			<span className="text-xs text-text-subtlest">{session.durationMinutes}m</span>
			<span className="text-xs text-text-subtlest">{timeAgo(session.completedAt)}</span>
		</div>
	);
}

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------

export default function PomodoroTimerApp() {
	const inputId = useId();
	const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
	const [showSettings, setShowSettings] = useState(false);

	const [phase, setPhase] = useState<TimerPhase>("focus");
	const [status, setStatus] = useState<TimerStatus>("idle");
	const [secondsLeft, setSecondsLeft] = useState(phaseDuration("focus", DEFAULT_SETTINGS));
	const [focusCount, setFocusCount] = useState(0);
	const [sessions, setSessions] = useState<SessionLog[]>([]);
	const [taskLabel, setTaskLabel] = useState("");

	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	// -- timer tick --
	useEffect(() => {
		if (status !== "running") return;

		intervalRef.current = setInterval(() => {
			setSecondsLeft((prev) => {
				if (prev <= 1) {
					clearInterval(intervalRef.current!);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => {
			if (intervalRef.current) clearInterval(intervalRef.current);
		};
	}, [status]);

	// -- handle timer reaching zero --
	useEffect(() => {
		if (secondsLeft !== 0 || status !== "running") return;

		const timeoutId = window.setTimeout(() => {
			const totalDuration = phaseDuration(phase, settings);
			const durationMinutes = Math.round(totalDuration / 60);

			setSessions((prev) => [
				{
					id: crypto.randomUUID(),
					phase,
					durationMinutes,
					completedAt: Date.now(),
					taskLabel: phase === "focus" ? taskLabel : `${PHASE_CONFIG[phase].label}`,
				},
				...prev,
			]);

			if (phase === "focus") {
				const newCount = focusCount + 1;
				setFocusCount(newCount);

				if (newCount % settings.sessionsBeforeLongBreak === 0) {
					setPhase("long-break");
					setSecondsLeft(phaseDuration("long-break", settings));
				} else {
					setPhase("short-break");
					setSecondsLeft(phaseDuration("short-break", settings));
				}
			} else {
				setPhase("focus");
				setSecondsLeft(phaseDuration("focus", settings));
			}

			setStatus("idle");
		}, 0);

		return () => {
			window.clearTimeout(timeoutId);
		};
	}, [secondsLeft, status, phase, focusCount, settings, taskLabel]);

	// -- actions --
	const start = useCallback(() => setStatus("running"), []);
	const pause = useCallback(() => setStatus("paused"), []);

	const reset = useCallback(() => {
		setStatus("idle");
		setSecondsLeft(phaseDuration(phase, settings));
	}, [phase, settings]);

	const skipPhase = useCallback(
		(nextPhase: TimerPhase) => {
			setStatus("idle");
			setPhase(nextPhase);
			setSecondsLeft(phaseDuration(nextPhase, settings));
		},
		[settings],
	);

	const clearSessions = useCallback(() => setSessions([]), []);

	// -- derived --
	const totalDuration = phaseDuration(phase, settings);
	const progress = totalDuration > 0 ? (totalDuration - secondsLeft) / totalDuration : 0;
	const phaseConfig = PHASE_CONFIG[phase];

	const todayFocusMinutes = sessions
		.filter((s) => s.phase === "focus")
		.reduce((sum, s) => sum + s.durationMinutes, 0);

	const todayBreakMinutes = sessions
		.filter((s) => s.phase !== "focus")
		.reduce((sum, s) => sum + s.durationMinutes, 0);

	const todayCompleted = sessions.filter((s) => s.phase === "focus").length;

	return (
		<div className="mx-auto flex min-h-svh w-full max-w-2xl flex-col gap-5 px-4 py-8">
			{/* Header */}
			<div className="flex items-end justify-between">
				<div>
					<h1 className="flex items-center gap-2 text-2xl font-bold text-text">
						<ClockIcon label="" size="medium" />
						Pomodoro Timer
					</h1>
					<p className="mt-1 text-sm text-text-subtle">
						Focus in bursts. Rest with purpose.
					</p>
				</div>
				<Button
					variant="ghost"
					size="icon-sm"
					onClick={() => setShowSettings((v) => !v)}
					aria-label="Toggle settings"
				>
					<SettingsIcon label="" size="small" />
				</Button>
			</div>

			{/* Stats */}
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
				<StatCard
					icon={CheckCircleIcon}
					label="Sessions"
					value={todayCompleted}
					accent="bg-bg-success-subtler text-icon-success"
				/>
				<StatCard
					icon={ClockIcon}
					label="Focus Time"
					value={`${todayFocusMinutes}m`}
					accent="bg-bg-danger-subtler text-icon-danger"
				/>
				<StatCard
					icon={BreakIcon}
					label="Break Time"
					value={`${todayBreakMinutes}m`}
					accent="bg-bg-information-subtler text-icon-information"
				/>
				<StatCard
					icon={ChartIcon}
					label="Streak"
					value={focusCount}
					accent="bg-bg-neutral text-icon"
				/>
			</div>

			{/* Settings panel */}
			{showSettings ? (
				<Card>
					<CardHeader>
						<CardTitle>Settings</CardTitle>
						<CardDescription>Customize your timer durations</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
							<label className="flex flex-col gap-1">
								<span className="text-xs font-medium text-text-subtlest">Focus (min)</span>
								<Input
									type="number"
									min={1}
									max={120}
									value={settings.focusMinutes}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const v = Math.max(1, Math.min(120, Number(e.target.value) || 1));
										setSettings((s) => ({ ...s, focusMinutes: v }));
										if (phase === "focus" && status === "idle") setSecondsLeft(v * 60);
									}}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className="text-xs font-medium text-text-subtlest">Short Break</span>
								<Input
									type="number"
									min={1}
									max={30}
									value={settings.shortBreakMinutes}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const v = Math.max(1, Math.min(30, Number(e.target.value) || 1));
										setSettings((s) => ({ ...s, shortBreakMinutes: v }));
										if (phase === "short-break" && status === "idle") setSecondsLeft(v * 60);
									}}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className="text-xs font-medium text-text-subtlest">Long Break</span>
								<Input
									type="number"
									min={1}
									max={60}
									value={settings.longBreakMinutes}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const v = Math.max(1, Math.min(60, Number(e.target.value) || 1));
										setSettings((s) => ({ ...s, longBreakMinutes: v }));
										if (phase === "long-break" && status === "idle") setSecondsLeft(v * 60);
									}}
								/>
							</label>
							<label className="flex flex-col gap-1">
								<span className="text-xs font-medium text-text-subtlest">Before Long Break</span>
								<Input
									type="number"
									min={1}
									max={10}
									value={settings.sessionsBeforeLongBreak}
									onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
										const v = Math.max(1, Math.min(10, Number(e.target.value) || 1));
										setSettings((s) => ({ ...s, sessionsBeforeLongBreak: v }));
									}}
								/>
							</label>
						</div>
					</CardContent>
				</Card>
			) : null}

			{/* Timer */}
			<Card>
				<CardContent className="flex flex-col items-center gap-6 py-8">
					{/* Phase selector */}
					<div className="flex gap-2">
						{(["focus", "short-break", "long-break"] as TimerPhase[]).map((p) => (
							<Button
								key={p}
								variant={phase === p ? "outline" : "ghost"}
								size="sm"
								onClick={() => skipPhase(p)}
								disabled={status === "running"}
								className={cn(phase === p && "ring-1 ring-ring")}
							>
								{PHASE_CONFIG[p].label}
							</Button>
						))}
					</div>

					{/* Task label input */}
					{phase === "focus" ? (
						<div className="flex w-full max-w-xs gap-2">
							<Input
								id={inputId}
								placeholder="What are you working on?"
								value={taskLabel}
								onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTaskLabel(e.target.value)}
								className="text-center text-sm"
								disabled={status === "running"}
								autoComplete="off"
							/>
						</div>
					) : null}

					{/* Progress ring + time */}
					<ProgressRing progress={progress} phase={phase}>
						<span className={cn("text-4xl font-bold tabular-nums tracking-tight", phaseConfig.color)}>
							{formatTime(secondsLeft)}
						</span>
						<span className="mt-1 text-xs font-medium text-text-subtlest">
							{phaseConfig.label}
						</span>
					</ProgressRing>

					{/* Controls */}
					<div className="flex items-center gap-3">
						{status === "running" ? (
							<Button variant="outline" size="lg" onClick={pause}>
								<PauseIcon label="" size="small" />
								Pause
							</Button>
						) : (
							<Button size="lg" onClick={start}>
								<PlayIcon label="" size="small" />
								{status === "paused" ? "Resume" : "Start"}
							</Button>
						)}
						<Button variant="ghost" size="icon" onClick={reset} aria-label="Reset timer">
							<RefreshIcon label="" size="small" />
						</Button>
					</div>

					{/* Session dots */}
					{settings.sessionsBeforeLongBreak > 1 ? (
						<div className="flex items-center gap-2">
							{Array.from({ length: settings.sessionsBeforeLongBreak }).map((_, i) => (
								<div
									key={i}
									className={cn(
										"size-2.5 rounded-full transition-colors",
										i < (focusCount % settings.sessionsBeforeLongBreak)
											? "bg-bg-danger-bold"
											: "bg-border",
									)}
								/>
							))}
							<span className="ml-1 text-xs text-text-subtlest">
								{focusCount % settings.sessionsBeforeLongBreak} / {settings.sessionsBeforeLongBreak}
							</span>
						</div>
					) : null}
				</CardContent>
			</Card>

			{/* Session history */}
			<Card className="flex-1">
				<CardHeader>
					<CardTitle>
						Session History{" "}
						<Badge variant="default" className="ml-1">
							{sessions.length}
						</Badge>
					</CardTitle>
					<CardAction>
						{sessions.length > 0 ? (
							<Button variant="ghost" size="xs" onClick={clearSessions}>
								<DeleteIcon label="" size="small" />
								Clear
							</Button>
						) : null}
					</CardAction>
				</CardHeader>
				<CardContent className="flex flex-col gap-0.5">
					{sessions.length === 0 ? (
						<div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
							<ClockIcon label="" size="medium" />
							<p className="text-sm font-medium text-text-subtle">
								No sessions yet — start your first focus!
							</p>
						</div>
					) : (
						sessions.map((session) => (
							<SessionRow key={session.id} session={session} />
						))
					)}
				</CardContent>
			</Card>

			{/* Footer */}
			<p className="text-center text-xs text-text-subtlest">
				Built with VPK • {focusCount} focus session{focusCount !== 1 ? "s" : ""} completed
			</p>
		</div>
	);
}
