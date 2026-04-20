"use client";

import * as React from "react";

import { useTheme } from "@/components/utils/theme-wrapper";
import Bands from "@/components/website/demos/visual/shaders/bands";
import LiquidGradient from "@/components/website/demos/visual/shaders/liquid-gradient";
import Noise, {
	type NoiseBlendMode,
} from "@/components/website/demos/visual/shaders/noise";
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

type WeatherThemeMode = "location" | "system" | "light" | "dark";

const THEME_MODE_ORDER: WeatherThemeMode[] = [
	"location",
	"system",
	"light",
	"dark",
];

const THEME_MODE_STORAGE_KEY = "weather-theme-mode";

function isWeatherThemeMode(value: string | null): value is WeatherThemeMode {
	return (
		value === "location" ||
		value === "system" ||
		value === "light" ||
		value === "dark"
	);
}

function formatTemperature(value: number | null): string {
	if (value === null || Number.isNaN(value)) return "--";
	return `${Math.round(value)}`;
}

function countryCodeToFlag(countryCode: string): string {
	return [...countryCode.toUpperCase()]
		.map((c) => String.fromCodePoint(0x1f1e6 - 65 + c.charCodeAt(0)))
		.join("");
}

function ThemeControl({
	mode,
	onChange,
}: {
	mode: WeatherThemeMode;
	onChange: (mode: WeatherThemeMode) => void;
}) {
	const options: { value: WeatherThemeMode; label: string }[] = [
		{ value: "location", label: "Location" },
		{ value: "system", label: "System" },
		{ value: "light", label: "Light" },
		{ value: "dark", label: "Dark" },
	];
	const [isVisible, setIsVisible] = React.useState(false);

	React.useEffect(() => {
		const isOverSlider = (target: EventTarget | null) => {
			if (!(target instanceof Element)) return false;
			return Boolean(target.closest('[role="slider"]'));
		};

		const handlePointerMove = (event: PointerEvent) => {
			if (isOverSlider(event.target)) {
				setIsVisible(false);
				return;
			}

			setIsVisible(event.clientY < window.innerHeight / 2);
		};
		const handlePointerLeave = () => setIsVisible(false);

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerleave", handlePointerLeave);
		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerleave", handlePointerLeave);
		};
	}, []);

	return (
		<div
			role="radiogroup"
			aria-label="Theme"
			className="absolute left-1/2 top-4 z-20 flex -translate-x-1/2 items-center gap-1 rounded-full border border-border/70 bg-surface-overlay/85 p-1 text-[11px] font-medium uppercase tracking-[0.2em] shadow-xs backdrop-blur transition-opacity duration-normal"
			style={{
				opacity: isVisible ? 1 : 0,
				pointerEvents: isVisible ? "auto" : "none",
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
					className={cn(
							"rounded-full px-2.5 py-1 transition-colors duration-normal",
							isActive
								? "bg-bg-neutral-bold text-text-inverse"
								: "text-text-subtle hover:bg-bg-neutral-subtle-hovered hover:text-text active:bg-bg-neutral-subtle-pressed",
						)}
					>
						{option.label}
					</button>
				);
			})}
		</div>
	);
}

// `CityRailEditor` subtracts this many pixels (TRACK_INSET) from the
// `width` prop internally to derive the visible rail width. Re-export
// the value here so we can compensate when sizing the slider to match
// the Humidity card width directly beneath it in the 2×2 grid.
const CITY_RAIL_TRACK_INSET = 24;

type WeatherBreakpoint = "base" | "md" | "lg";

interface ResponsiveSizes {
	sliderWidth: number;
	timeWidth: number;
	humidityWidth: number;
	temperatureWidth: number;
	pillHeight: number;
	gridCellSize: number;
	timeFontPx: number;
	humidityFontPx: number;
	temperatureFontPx: number;
	weatherIconSize: number;
	labelFontPx: number;
	footnoteFontPx: number;
	labelInsetPx: number;
	screwInsetX: { time: number; humidity: number; temperature: number };
	screwInsetY: number;
}

const SIZE_PRESETS: Record<WeatherBreakpoint, ResponsiveSizes> = {
	// Mobile (<640px) — small 2×2 grid. The slider sits in the top-left
	// cell directly above the Humidity card, so its width matches the
	// Humidity card width to keep the column edges aligned.
	base: {
		sliderWidth: 110,
		timeWidth: 196,
		humidityWidth: 110,
		temperatureWidth: 196,
		pillHeight: 220,
		gridCellSize: 8,
		timeFontPx: 52,
		humidityFontPx: 44,
		temperatureFontPx: 48,
		weatherIconSize: 36,
		labelFontPx: 9,
		footnoteFontPx: 11,
		labelInsetPx: 16,
		screwInsetX: { time: 22, humidity: 14, temperature: 22 },
		screwInsetY: 12,
	},
	// Tablet (≥640px, <1024px) — medium 2×2 grid.
	md: {
		sliderWidth: 170,
		timeWidth: 300,
		humidityWidth: 170,
		temperatureWidth: 300,
		pillHeight: 320,
		gridCellSize: 12,
		timeFontPx: 84,
		humidityFontPx: 72,
		temperatureFontPx: 80,
		weatherIconSize: 56,
		labelFontPx: 10,
		footnoteFontPx: 12,
		labelInsetPx: 28,
		screwInsetX: { time: 44, humidity: 28, temperature: 44 },
		screwInsetY: 18,
	},
	// Desktop (≥1024px) — original horizontal 4-card layout.
	lg: {
		sliderWidth: 200,
		timeWidth: 400,
		humidityWidth: 200,
		temperatureWidth: 400,
		pillHeight: 380,
		gridCellSize: 14,
		timeFontPx: 104,
		humidityFontPx: 88,
		temperatureFontPx: 96,
		weatherIconSize: 72,
		labelFontPx: 11,
		footnoteFontPx: 13,
		labelInsetPx: 40,
		screwInsetX: { time: 60, humidity: 40, temperature: 60 },
		screwInsetY: 24,
	},
};

function useWeatherBreakpoint(): WeatherBreakpoint {
	const subscribe = React.useCallback((notify: () => void) => {
		if (typeof window === "undefined") return () => {};
		const mqlMd = window.matchMedia("(min-width: 640px)");
		const mqlLg = window.matchMedia("(min-width: 1024px)");
		mqlMd.addEventListener("change", notify);
		mqlLg.addEventListener("change", notify);
		return () => {
			mqlMd.removeEventListener("change", notify);
			mqlLg.removeEventListener("change", notify);
		};
	}, []);

	const getSnapshot = React.useCallback((): WeatherBreakpoint => {
		if (typeof window === "undefined") return "lg";
		if (window.matchMedia("(min-width: 1024px)").matches) return "lg";
		if (window.matchMedia("(min-width: 640px)").matches) return "md";
		return "base";
	}, []);

	// Default to "lg" on the server / first render to match the
	// historical desktop layout and avoid layout flashes for desktop
	// users (the most common case).
	const getServerSnapshot = React.useCallback((): WeatherBreakpoint => "lg", []);

	return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

interface WeatherTimeCardProps {
	timezone: string;
	sizes: ResponsiveSizes;
	gridColor: string;
	gridBlendMode: "multiply" | "screen";
	noiseBlendMode: NoiseBlendMode;
	noiseOpacity: number;
	noiseColor: string;
	shaderTextClass: string;
	shaderScrewColor: string;
	shaderLabelColor: string;
	shaderFootnoteColor: string;
	cutoutFillColor: string;
	cutoutTextShadow: string;
	debossTextShadow: string;
	debossDotShadow: string;
}

function WeatherTimeCard({
	timezone,
	sizes,
	gridColor,
	gridBlendMode,
	noiseBlendMode,
	noiseOpacity,
	noiseColor,
	shaderTextClass,
	shaderScrewColor,
	shaderLabelColor,
	shaderFootnoteColor,
	cutoutFillColor,
	cutoutTextShadow,
	debossTextShadow,
	debossDotShadow,
}: WeatherTimeCardProps) {
	const clock = useLocationClock(timezone);

	return (
		<WidgetCard
			className="flex flex-col"
			style={{ width: sizes.timeWidth, height: sizes.pillHeight }}
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
					<WidgetGridOverlay
						color={gridColor}
						blendMode={gridBlendMode}
						opacity={0.42}
						cellSize={sizes.gridCellSize}
					/>
					<WidgetScrewDots
						color={shaderScrewColor}
						insetX={sizes.screwInsetX.time}
						insetY={sizes.screwInsetY}
						boxShadow={debossDotShadow}
					/>
					<Noise
						className="absolute inset-0"
						opacity={noiseOpacity}
						grainSize={140}
						seed={7}
						color={noiseColor}
						blendMode={noiseBlendMode}
					/>
				</>
			}
		>
			<div className={cn("relative flex h-full flex-col items-center justify-center", shaderTextClass)}>
				<span
					className="absolute font-mono uppercase tracking-[0.3em]"
					style={{
						color: shaderLabelColor,
						top: sizes.labelInsetPx,
						fontSize: sizes.labelFontPx,
						textShadow: debossTextShadow,
					}}
				>
					Time
				</span>
				<div className="flex flex-col items-center gap-0">
					<DigitDisplay
						weight={180}
						tracking={-0.04}
						style={{
							color: cutoutFillColor,
							lineHeight: 0.92,
							fontFamily: "var(--font-ark-es)",
							fontSize: sizes.timeFontPx,
							textShadow: cutoutTextShadow,
						}}
					>
						{clock.hours}
					</DigitDisplay>
					<DigitDisplay
						weight={180}
						tracking={-0.04}
						style={{
							color: cutoutFillColor,
							lineHeight: 0.92,
							fontFamily: "var(--font-ark-es)",
							fontSize: sizes.timeFontPx,
							textShadow: cutoutTextShadow,
						}}
					>
						{clock.minutes}
					</DigitDisplay>
				</div>
				<span
					className="absolute font-mono tabular-nums"
					style={{
						color: shaderFootnoteColor,
						fontFamily: "'DotGothic16', sans-serif",
						bottom: sizes.labelInsetPx,
						fontSize: sizes.footnoteFontPx,
						textShadow: debossTextShadow,
					}}
				>
					: {clock.seconds}
				</span>
			</div>
		</WidgetCard>
	);
}

function WeatherDateSummary({
	timezone,
}: {
	timezone: string;
}) {
	const clock = useLocationClock(timezone);
	const weekdayShort = clock.isReady
		? clock.weekday.slice(0, 3).toUpperCase()
		: "---";
	const monthShort = clock.isReady
		? clock.month.slice(0, 3).toUpperCase()
		: "---";

	return (
		<div
			className="text-text-subtle relative z-10 flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.36em]"
			style={{ fontFamily: "var(--font-alpha-lyrae)" }}
		>
			<span>{weekdayShort}</span>
			<span style={{ fontSize: 16 }}>✿</span>
			<span>
				{monthShort} {clock.isReady ? clock.day : "--"}
			</span>
		</div>
	);
}

export default function Weather({
	className,
}: WeatherProps) {
	const { setTheme, actualTheme } = useTheme();
	const {
		cities,
		selectedIndex,
		selected,
		setSelectedIndex,
		addCity,
		removeCity,
	} = useCities();

	const breakpoint = useWeatherBreakpoint();
	const sizes = SIZE_PRESETS[breakpoint];

	const weather = useCurrentWeather(
		selected.latitude,
		selected.longitude,
		selected.timezone,
	);

	// Local "weather theme mode" with an extra "location" option that
	// defers to whether the focused city is currently day or night.
	const [weatherMode, setWeatherMode] = React.useState<WeatherThemeMode>(
		"location",
	);

	// Hydrate weatherMode from localStorage once on the client to avoid
	// SSR/hydration mismatches.
	React.useEffect(() => {
		if (typeof window === "undefined") return;
		try {
			const stored = window.localStorage.getItem(THEME_MODE_STORAGE_KEY);
			if (isWeatherThemeMode(stored)) {
				setWeatherMode(stored);
			}
		} catch {
			// ignore
		}
	}, []);

	const updateWeatherMode = React.useCallback((next: WeatherThemeMode) => {
		setWeatherMode(next);
		if (typeof window !== "undefined") {
			try {
				window.localStorage.setItem(THEME_MODE_STORAGE_KEY, next);
			} catch {
				// ignore
			}
		}
	}, []);

	// Drive the underlying ThemeWrapper based on the selected weatherMode.
	// "location" → derive light/dark from the focused city's `isDay`.
	// "system" / "light" / "dark" → pass through to the underlying theme.
	React.useEffect(() => {
		if (weatherMode === "location") {
			setTheme(weather.isDay ? "light" : "dark");
		} else {
			setTheme(weatherMode);
		}
	}, [weatherMode, weather.isDay, setTheme]);

	// Hijack the left/right arrow keys to cycle the theme mode.
	React.useEffect(() => {
		if (typeof window === "undefined") return;
		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

			// Avoid hijacking when the user is typing in an input/textarea
			// or interacting with another focusable control like a slider.
			const target = event.target;
			if (target instanceof HTMLElement) {
				const tag = target.tagName;
				if (
					tag === "INPUT" ||
					tag === "TEXTAREA" ||
					tag === "SELECT" ||
					target.isContentEditable ||
					target.getAttribute("role") === "slider" ||
					target.closest('[role="slider"]')
				) {
					return;
				}
			}

			event.preventDefault();
			const currentIndex = THEME_MODE_ORDER.indexOf(weatherMode);
			const safeIndex = currentIndex === -1 ? 0 : currentIndex;
			const delta = event.key === "ArrowLeft" ? -1 : 1;
			const nextIndex =
				(safeIndex + delta + THEME_MODE_ORDER.length) %
				THEME_MODE_ORDER.length;
			updateWeatherMode(THEME_MODE_ORDER[nextIndex]);
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [weatherMode, updateWeatherMode]);

	const isDarkTheme = actualTheme === "dark";
	const noiseBlendMode: NoiseBlendMode = isDarkTheme
		? "soft-light"
		: "multiply";
	const noiseOpacity = 0.3;
	const noiseColor = "var(--ds-text)";
	const gridColor = "color-mix(in srgb, var(--ds-text-inverse) 18%, transparent)";
	const gridBlendMode = isDarkTheme ? "multiply" : "screen";
	const shaderTextClass = "text-text-inverse";
	const shaderScrewColor = "var(--ds-text-inverse)";
	const shaderLabelColor = "color-mix(in srgb, var(--ds-text-inverse) 72%, transparent)";
	const shaderFootnoteColor = "color-mix(in srgb, var(--ds-text-inverse) 60%, transparent)";
	const cutoutFillColor = "var(--ds-surface)";
	const cutoutShadowColor = isDarkTheme
		? "rgb(0 0 0 / 0.36)"
		: "rgb(0 0 0 / 0.24)";
	const cutoutHighlightColor = isDarkTheme
		? "rgb(255 255 255 / 0.16)"
		: "rgb(255 255 255 / 0.12)";
	const cutoutAmbientColor = isDarkTheme
		? "rgb(0 0 0 / 0.2)"
		: "rgb(0 0 0 / 0.12)";

	// Small labels stay lightly debossed on the card surface. The hero
	// numerals and icon use the page background color so they read like
	// holes punched through the card rather than raised embossing.
	const debossTextShadow =
		"0 1px 0 color-mix(in srgb, var(--ds-text-inverse) 38%, transparent), 0 -1px 0 color-mix(in srgb, var(--ds-text) 32%, transparent)";
	const cutoutTextShadow = [
		`-0.75px -0.75px 0 ${cutoutShadowColor}`,
		`0.75px 0.75px 0 ${cutoutHighlightColor}`,
		`1.5px 1.5px 3px ${cutoutAmbientColor}`,
	].join(", ");
	const cutoutIconFilter = [
		`drop-shadow(-0.75px -0.75px 0 ${cutoutShadowColor})`,
		`drop-shadow(0.75px 0.75px 0 ${cutoutHighlightColor})`,
		`drop-shadow(1.5px 1.5px 3px ${cutoutAmbientColor})`,
	].join(" ");
	const debossDotShadow =
		"inset 0 1px 0.5px color-mix(in srgb, var(--ds-text) 45%, transparent), 0 1px 0 color-mix(in srgb, var(--ds-text-inverse) 40%, transparent)";

	const temperature = formatTemperature(weather.temperatureCelsius);

	return (
		<div
			className={cn(
				"bg-surface text-text relative isolate flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden px-4 py-6 transition-[background-color,color] duration-slow sm:gap-10 sm:py-8 lg:gap-14",
				className,
			)}
		>
			<ThemeControl
				mode={weatherMode}
				onChange={updateWeatherMode}
			/>

			<div className="text-text relative z-10 flex flex-col items-center gap-2">
				<span className="text-[28px] leading-none" aria-hidden="true">
					{countryCodeToFlag(selected.countryCode)}
				</span>
				<span
					className="text-[15px] font-medium uppercase tracking-[0.36em]"
					style={{
						letterSpacing: "0.36em",
						fontFamily: "var(--font-alpha-lyrae)",
					}}
				>
					{selected.name}
				</span>
			</div>

			<div className="relative z-10 grid grid-cols-[auto_auto] items-center justify-center gap-2 sm:gap-3 lg:flex lg:gap-3">
				<CityRailEditor
					cities={cities}
					selectedIndex={selectedIndex}
					setSelectedIndex={setSelectedIndex}
					addCity={addCity}
					removeCity={removeCity}
					height={sizes.pillHeight}
					// CityRailEditor subtracts a 24px TRACK_INSET internally to
					// derive the visible rail width, so we add it back here to
					// make the slider's visible pill match the Humidity card
					// width directly underneath it in the 2×2 grid.
					width={sizes.sliderWidth + CITY_RAIL_TRACK_INSET}
				/>

				<WeatherTimeCard
					timezone={selected.timezone}
					sizes={sizes}
					gridColor={gridColor}
					gridBlendMode={gridBlendMode}
					noiseBlendMode={noiseBlendMode}
					noiseOpacity={noiseOpacity}
					noiseColor={noiseColor}
					shaderTextClass={shaderTextClass}
					shaderScrewColor={shaderScrewColor}
					shaderLabelColor={shaderLabelColor}
					shaderFootnoteColor={shaderFootnoteColor}
					cutoutFillColor={cutoutFillColor}
					cutoutTextShadow={cutoutTextShadow}
					debossTextShadow={debossTextShadow}
					debossDotShadow={debossDotShadow}
				/>

				<WidgetCard
					className="flex flex-col"
					style={{ width: sizes.humidityWidth, height: sizes.pillHeight }}
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
							<WidgetGridOverlay
								color={gridColor}
								blendMode={gridBlendMode}
								opacity={0.42}
								cellSize={sizes.gridCellSize}
							/>
							<WidgetScrewDots
								color={shaderScrewColor}
								insetX={sizes.screwInsetX.humidity}
								insetY={sizes.screwInsetY}
								boxShadow={debossDotShadow}
							/>
							<Noise
								className="absolute inset-0"
								opacity={noiseOpacity}
								grainSize={140}
								seed={13}
								color={noiseColor}
								blendMode={noiseBlendMode}
							/>
						</>
					}
				>
					<div className={cn("relative flex h-full flex-col items-center justify-center", shaderTextClass)}>
						<span
							className="absolute font-mono uppercase tracking-[0.3em]"
							style={{
								color: shaderLabelColor,
								top: sizes.labelInsetPx,
								fontSize: sizes.labelFontPx,
								textShadow: debossTextShadow,
							}}
						>
							Humid %
						</span>
						<div className="flex flex-col items-center gap-0">
							{(weather.humidity === null
								? ["—", "—"]
								: String(Math.round(weather.humidity)).split("")
							).map((digit, i) => (
								<DigitDisplay
									key={i}
									weight={400}
									tracking={-0.04}
									style={{
										color: cutoutFillColor,
										lineHeight: 0.92,
										fontFamily: "'DotGothic16', sans-serif",
										fontSize: sizes.humidityFontPx,
										textShadow: cutoutTextShadow,
									}}
								>
									{digit}
								</DigitDisplay>
							))}
						</div>
						<span
							className="absolute"
							style={{
								color: shaderFootnoteColor,
								fontFamily: "'DotGothic16', sans-serif",
								bottom: sizes.labelInsetPx,
								fontSize: sizes.footnoteFontPx + 1,
								textShadow: debossTextShadow,
							}}
						>
							湿度
						</span>
					</div>
				</WidgetCard>

				<WidgetCard
					className="flex flex-col"
					style={{ width: sizes.temperatureWidth, height: sizes.pillHeight }}
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
							<WidgetGridOverlay
								color={gridColor}
								blendMode={gridBlendMode}
								opacity={0.42}
								cellSize={sizes.gridCellSize}
							/>
							<WidgetScrewDots
								color={shaderScrewColor}
								insetX={sizes.screwInsetX.temperature}
								insetY={sizes.screwInsetY}
								boxShadow={debossDotShadow}
							/>
							<Noise
								className="absolute inset-0"
								opacity={noiseOpacity}
								grainSize={140}
								seed={7}
								color={noiseColor}
								blendMode={noiseBlendMode}
							/>
						</>
					}
				>
					<div className={cn("relative flex h-full flex-col items-center justify-center", shaderTextClass)}>
						<span
							className="absolute font-mono uppercase tracking-[0.3em]"
							style={{
								color: shaderLabelColor,
								top: sizes.labelInsetPx,
								fontSize: sizes.labelFontPx,
								textShadow: debossTextShadow,
							}}
						>
							Temp °C
						</span>
						<div className="flex flex-col items-center gap-0">
							<DigitDisplay
								weight={200}
								tracking={-0.04}
								style={{
									color: cutoutFillColor,
									lineHeight: 0.92,
									fontFamily: "'Bitcount Grid Single', sans-serif",
									fontSize: sizes.temperatureFontPx,
									textShadow: cutoutTextShadow,
								}}
							>
								{temperature}
							</DigitDisplay>
							<div
								className="-mt-1 flex items-center gap-1"
								style={{ filter: cutoutIconFilter }}
							>
								<WeatherIcon
									weatherCode={weather.weatherCode}
									isDay={weather.isDay}
									size={sizes.weatherIconSize}
									style={{ color: cutoutFillColor }}
								/>
							</div>
						</div>
						<span
							className="absolute"
							style={{
								color: shaderFootnoteColor,
								fontFamily: "'DotGothic16', sans-serif",
								bottom: sizes.labelInsetPx,
								fontSize: sizes.footnoteFontPx + 1,
								textShadow: debossTextShadow,
							}}
						>
							温度
						</span>
					</div>
				</WidgetCard>
			</div>

			<WeatherDateSummary timezone={selected.timezone} />
		</div>
	);
}
