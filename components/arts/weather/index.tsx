"use client";

import * as React from "react";

import Bands from "@/components/website/demos/visual/shaders/bands";
import LiquidGradient from "@/components/website/demos/visual/shaders/liquid-gradient";
import WaveGradient from "@/components/website/demos/visual/shaders/wave-gradient";
import { cn } from "@/lib/utils";

import { CityRailEditor } from "./city-popover";
import { DigitDisplay } from "./digit-display";
import { useCities } from "./use-cities";
import { useCurrentWeather } from "./use-current-weather";
import { useLocationClock } from "./use-location-clock";
import { WeatherIcon } from "./weather-icon";
import {
	WidgetCard,
	WidgetGridOverlay,
	WidgetScrewDots,
} from "./widget-card";

export interface WeatherProps {
	className?: string;
}

function formatTemperature(value: number | null): string {
	if (value === null || Number.isNaN(value)) return "--";
	return `${Math.round(value)}`;
}

function CloverGlyph({ size = 24 }: { size?: number }) {
	return (
		<svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="currentColor"
			aria-hidden="true"
		>
			<path d="M12 2C10.9 2 10 2.9 10 4C10 5.1 10.9 6 12 6C13.1 6 14 5.1 14 4C14 2.9 13.1 2 12 2ZM12 18C10.9 18 10 18.9 10 20C10 21.1 10.9 22 12 22C13.1 22 14 21.1 14 20C14 18.9 13.1 18 12 18ZM4 10C2.9 10 2 10.9 2 12C2 13.1 2.9 14 4 14C5.1 14 6 13.1 6 12C6 10.9 5.1 10 4 10ZM20 10C18.9 10 18 10.9 18 12C18 13.1 18.9 14 20 14C21.1 14 22 13.1 22 12C22 10.9 21.1 10 20 10ZM7.05 5.64C5.94 5.64 5.05 6.53 5.05 7.64C5.05 8.75 5.94 9.64 7.05 9.64C8.16 9.64 9.05 8.75 9.05 7.64C9.05 6.53 8.16 5.64 7.05 5.64ZM16.95 14.36C15.84 14.36 14.95 15.25 14.95 16.36C14.95 17.47 15.84 18.36 16.95 18.36C18.06 18.36 18.95 17.47 18.95 16.36C18.95 15.25 18.06 14.36 16.95 14.36ZM7.05 14.36C5.94 14.36 5.05 15.25 5.05 16.36C5.05 17.47 5.94 18.36 7.05 18.36C8.16 18.36 9.05 17.47 9.05 16.36C9.05 15.25 8.16 14.36 7.05 14.36ZM16.95 5.64C15.84 5.64 14.95 6.53 14.95 7.64C14.95 8.75 15.84 9.64 16.95 9.64C18.06 9.64 18.95 8.75 18.95 7.64C18.95 6.53 18.06 5.64 16.95 5.64Z" />
		</svg>
	);
}

const SLIDER_WIDTH = 200;
const TIME_WIDTH = 400;
const HUMIDITY_WIDTH = 200;
const TEMPERATURE_WIDTH = 400;
const PILL_HEIGHT = 380;
const GRID_CELL_SIZE = 14;

type ThemeMode = "auto" | "light" | "dark";
type ResolvedTheme = "light" | "dark";

const THEME_PALETTE: Record<ResolvedTheme, { background: string; foreground: string }> = {
	light: { background: "#FFFFFF", foreground: "#0F0F12" },
	dark: { background: "#0F0F12", foreground: "#F5F5F5" },
};

/**
 * Resolve the active theme. In "auto" mode, light from 7am (07:00) up to 7pm (19:00),
 * dark from 7pm (19:00) up to 7am (07:00), based on the currently selected location's
 * local hour.
 */
function resolveAutoTheme(hourString: string): ResolvedTheme {
	const hour = Number.parseInt(hourString, 10);
	if (Number.isNaN(hour)) return "light";
	return hour >= 7 && hour < 19 ? "light" : "dark";
}

function ThemeToggle({
	mode,
	resolved,
	onChange,
}: {
	mode: ThemeMode;
	resolved: ResolvedTheme;
	onChange: (mode: ThemeMode) => void;
}) {
	const options: { value: ThemeMode; label: string }[] = [
		{ value: "auto", label: "Auto" },
		{ value: "light", label: "Light" },
		{ value: "dark", label: "Dark" },
	];
	const isDark = resolved === "dark";
	return (
		<div
			role="radiogroup"
			aria-label="Theme"
			className="absolute right-4 top-4 z-20 flex items-center gap-1 rounded-full p-1 text-[11px] font-medium uppercase tracking-[0.2em]"
			style={{
				background: isDark ? "rgba(245,245,245,0.08)" : "rgba(15,15,18,0.06)",
				backdropFilter: "blur(8px)",
				border: `1px solid ${isDark ? "rgba(245,245,245,0.16)" : "rgba(15,15,18,0.12)"}`,
			}}
		>
			{options.map((option) => {
				const isActive = mode === option.value;
				return (
					<button
						key={option.value}
						type="button"
						role="radio"
						aria-checked={isActive}
						onClick={() => onChange(option.value)}
						className="rounded-full px-2.5 py-1 transition-colors"
						style={{
							background: isActive
								? isDark
									? "rgba(245,245,245,0.92)"
									: "rgba(15,15,18,0.92)"
								: "transparent",
							color: isActive
								? isDark
									? "#0F0F12"
									: "#FFFFFF"
								: isDark
									? "rgba(245,245,245,0.7)"
									: "rgba(15,15,18,0.6)",
						}}
					>
						{option.label}
						{option.value === "auto" && isActive ? (
							<span
								className="ml-1 opacity-70"
								aria-hidden="true"
							>
								· {resolved === "dark" ? "Dark" : "Light"}
							</span>
						) : null}
					</button>
				);
			})}
		</div>
	);
}

export default function Weather({
	className,
}: WeatherProps) {
	const {
		cities,
		selectedIndex,
		selected,
		setSelectedIndex,
		addCity,
		removeCity,
	} = useCities();

	const clock = useLocationClock(selected.timezone);
	const weather = useCurrentWeather(
		selected.latitude,
		selected.longitude,
		selected.timezone,
	);

	const [themeMode, setThemeMode] = React.useState<ThemeMode>("auto");
	const autoTheme = resolveAutoTheme(clock.hours);
	const resolvedTheme: ResolvedTheme =
		themeMode === "auto" ? autoTheme : themeMode;
	const palette = THEME_PALETTE[resolvedTheme];

	const temperature = formatTemperature(weather.temperatureCelsius);
	const weekdayShort = clock.isReady
		? clock.weekday.slice(0, 3).toUpperCase()
		: "---";
	const monthShort = clock.isReady
		? clock.month.slice(0, 3).toUpperCase()
		: "---";

	return (
		<div
			className={cn(
				"relative isolate flex h-full w-full flex-col items-center justify-center gap-14 overflow-hidden px-4 py-8 transition-colors duration-500",
				className,
			)}
			style={{ background: palette.background, color: palette.foreground }}
		>
			<ThemeToggle
				mode={themeMode}
				resolved={resolvedTheme}
				onChange={setThemeMode}
			/>
			{/* Top: clover + city name */}
			<div className="relative z-10 flex flex-col items-center gap-2">
				<CloverGlyph size={28} />
				<span
					className="text-[15px] font-medium uppercase tracking-[0.36em]"
					style={{ letterSpacing: "0.36em" }}
				>
					{selected.name}
				</span>
			</div>

			{/* Middle: 4 capsule pills */}
			<div className="relative z-10 flex items-center gap-3">
				{/* Pill 1: City Slider */}
				<CityRailEditor
					cities={cities}
					selectedIndex={selectedIndex}
					setSelectedIndex={setSelectedIndex}
					addCity={addCity}
					removeCity={removeCity}
					height={PILL_HEIGHT}
					width={SLIDER_WIDTH}
				/>

				{/* Pill 2: Time (HH / MM) */}
				<WidgetCard
					className="flex flex-col"
					style={{ width: TIME_WIDTH, height: PILL_HEIGHT }}
					background={
						<LiquidGradient
							className="h-full w-full"
							seed={648}
							speed={0.3}
							scale={0.42}
							turbAmp={0.6}
							turbFreq={0.1}
							turbIter={7}
							waveFreq={3.8}
							exposure={1.1}
							contrast={1.1}
							saturation={1}
						/>
					}
					overlay={
						<>
							<WidgetGridOverlay opacity={0.42} cellSize={GRID_CELL_SIZE} />
							<WidgetScrewDots />
						</>
					}
				>
					<div
						className="flex h-full flex-col items-center justify-start gap-0 pt-14"
						style={{ color: "#FFFFFF" }}
					>
						<span
							className="font-mono text-[11px] uppercase tracking-[0.3em] opacity-70"
							style={{ color: "#FFFFFF", marginBottom: 8 }}
						>
							Time
						</span>
						<DigitDisplay
							className="text-[72px]"
							weight={180}
							tracking={-0.04}
							style={{ color: "#FFFFFF", lineHeight: 0.95, fontFamily: "var(--font-ark-es)" }}
						>
							{clock.hours}
						</DigitDisplay>
						<DigitDisplay
							className="text-[72px]"
							weight={180}
							tracking={-0.04}
							style={{ color: "#FFFFFF", lineHeight: 0.95, fontFamily: "var(--font-ark-es)" }}
						>
							{clock.minutes}
						</DigitDisplay>
							<span
								className="font-mono text-[13px] tabular-nums opacity-60"
								style={{ color: "#FFFFFF", marginTop: 10, fontFamily: "'DotGothic16', sans-serif" }}
							>
							: {clock.seconds}
						</span>
					</div>
				</WidgetCard>

				{/* Pill 3: Humidity */}
				<WidgetCard
					className="flex flex-col"
					style={{ width: HUMIDITY_WIDTH, height: PILL_HEIGHT }}
					background={
						<Bands
							className="h-full w-full"
							seed={210}
							speed={0.3}
							ephemeralAmp={0}
							lensScale={3.7}
							lensSpacingX={1}
							lensSpacingY={0.01}
							lensRadius={0.58}
							dispersionStrength={0.4}
							edgeDisp={2}
						/>
					}
					overlay={
						<>
							<WidgetGridOverlay opacity={0.42} cellSize={GRID_CELL_SIZE} />
							<WidgetScrewDots />
						</>
					}
				>
					<div
						className="flex h-full flex-col items-center justify-between pb-10 pt-14"
						style={{ color: "#FFFFFF" }}
					>
						<div className="flex flex-col items-center gap-0">
							<span
								className="font-mono text-[11px] uppercase tracking-[0.3em] opacity-70"
								style={{ color: "#FFFFFF", marginBottom: 8 }}
							>
								Humid %
							</span>
							{(weather.humidity === null
								? ["—", "—"]
								: String(Math.round(weather.humidity)).split("")
							).map((digit, i) => (
									<DigitDisplay
										key={i}
										className="text-[72px]"
										weight={400}
										tracking={-0.04}
										style={{ color: "#FFFFFF", lineHeight: 0.95, fontFamily: "'DotGothic16', sans-serif" }}
									>
									{digit}
								</DigitDisplay>
							))}
						</div>
							<span
								className="text-[14px] opacity-60"
								style={{ color: "#FFFFFF", fontFamily: "'DotGothic16', sans-serif" }}
							>
							湿度
						</span>
					</div>
				</WidgetCard>

				{/* Pill 4: Temperature + weather icon */}
				<WidgetCard
					className="flex flex-col"
					style={{ width: TEMPERATURE_WIDTH, height: PILL_HEIGHT }}
					background={
						<WaveGradient
							className="h-full w-full"
							seed={26}
							speed={2.85}
							freqX={0.9}
							freqY={6}
							angle={105}
							amplitude={1.6}
							softness={1.4}
							blend={0.5}
						/>
					}
					overlay={
						<>
							<WidgetGridOverlay opacity={0.42} cellSize={GRID_CELL_SIZE} />
							<WidgetScrewDots />
						</>
					}
				>
					<div
						className="flex h-full flex-col items-center justify-between pb-10 pt-14"
						style={{ color: "#FFFFFF" }}
					>
						<div className="flex flex-col items-center gap-1">
							<span
								className="font-mono text-[11px] uppercase tracking-[0.3em] opacity-70"
								style={{ color: "#FFFFFF", marginBottom: 4 }}
							>
								Temp °C
							</span>
								<DigitDisplay
									className="text-[72px]"
									weight={200}
									tracking={-0.04}
									style={{ color: "#FFFFFF", lineHeight: 0.95, fontFamily: "'Bitcount Grid Single', sans-serif" }}
								>
								{temperature}
							</DigitDisplay>
							<div className="flex items-center gap-1" style={{ marginTop: 4 }}>
								<WeatherIcon
									weatherCode={weather.weatherCode}
									isDay={weather.isDay}
									size={22}
									style={{ color: "rgba(255,255,255,0.85)" }}
								/>
							</div>
						</div>
							<span
								className="text-[14px] opacity-60"
								style={{ color: "#FFFFFF", fontFamily: "'Bitcount Grid Single', sans-serif" }}
							>
							温度
						</span>
					</div>
				</WidgetCard>
			</div>

			{/* Bottom: weekday + flower + month day */}
			<div
				className="relative z-10 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.36em]"
				style={{ color: palette.foreground }}
			>
				<span>{weekdayShort}</span>
				<span style={{ fontSize: 16 }}>✿</span>
				<span>
					{monthShort} {clock.isReady ? clock.day : "--"}
				</span>
			</div>
		</div>
	);
}
