"use client";

import * as React from "react";

import { useTheme } from "@/components/utils/theme-wrapper";
import Bands from "@/components/website/demos/visual/shaders/bands";
import LiquidGradient from "@/components/website/demos/visual/shaders/liquid-gradient";
import Noise, {
	type NoiseBlendMode,
} from "@/components/website/demos/visual/shaders/noise";
import WaveGradient from "@/components/website/demos/visual/shaders/wave-gradient";
import LightbulbIcon from "@atlaskit/icon/core/lightbulb";

import { Footer } from "@/components/ui/footer";
import { GlassTabs } from "@/components/ui/glass-tabs";
import { ReturnIcon } from "@/components/ui/vpk-icons";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

import { CityRailEditor } from "./city-popover";
import { DigitDisplay, FlipText } from "./digit-display";
import { useCities } from "./use-cities";
import { useCurrentWeather } from "./use-current-weather";
import { type LocationClock, useLocationClock } from "./use-location-clock";
import { useWakeLock } from "./use-wake-lock";
import { WeatherIcon } from "./weather-icon";
import {
	WidgetCard,
	WidgetGridOverlay,
	WidgetScrewDots,
} from "./widget-card";

function playSound(src: string) {
	if (typeof window === "undefined") return;
	const audio = new Audio(src);
	audio.volume = 0.5;
	audio.play().catch(() => {});
}

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

function ThemeControl({
	mode,
	onChange,
	isVisible,
	keyboardSelectionPulseKey,
}: {
	mode: WeatherThemeMode;
	onChange: (mode: WeatherThemeMode) => void;
	isVisible: boolean;
	keyboardSelectionPulseKey: number;
}) {
	const options: { value: WeatherThemeMode; label: string }[] = [
		{ value: "location", label: "Location" },
		{ value: "system", label: "System" },
		{ value: "light", label: "Light" },
		{ value: "dark", label: "Dark" },
	];

	return (
		<div
			className="absolute left-1/2 top-4 z-20 -translate-x-1/2"
			style={{ pointerEvents: isVisible ? "auto" : "none" }}
		>
			<motion.div
				animate={isVisible
					? { opacity: 1, filter: "blur(0px)", transform: "scale(1) translateY(0px)" }
					: { opacity: 0, filter: "blur(16px)", transform: "scale(0.82) translateY(-16px)" }
				}
				initial={{ opacity: 0, filter: "blur(16px)", transform: "scale(0.82) translateY(-16px)" }}
				transition={{ duration: 0.35, ease: [0, 0.4, 0, 1] }}
				style={{
					transformOrigin: "top center",
					willChange: "opacity, filter, transform",
				}}
			>
				{/*
				 * Position GlassTabs in a relative container so the wake-lock
				 * button can hang off the right edge using absolute positioning.
				 * This keeps the tabs perfectly centered on the page.
				 */}
				<div className="relative">
					<GlassTabs
						aria-label="Theme"
						options={options}
						value={mode}
						onChange={(value) => {
							playSound("/sound/click-003.mp3");
							onChange(value);
						}}
						onHover={() => {
							playSound("/sound/click-003.mp3");
						}}
						keyboardSelectionPulseKey={keyboardSelectionPulseKey}
					/>
					<div className="absolute left-full top-1/2 ml-2 -translate-y-1/2">
						<WakeLockControl />
					</div>
				</div>
			</motion.div>
		</div>
	);
}

function WakeLockControl() {
	const { isSupported, isEnabled, isActive, error, toggle } = useWakeLock();

	const disabled = !isSupported;
	const labelOn = "Allow screen to sleep";
	const labelOff = "Keep screen awake";
	const tooltip = disabled
		? "Keep awake is not supported in this browser"
		: isEnabled
			? labelOn
			: labelOff;

	return (
		<button
			type="button"
			role="switch"
			aria-checked={isEnabled}
			aria-label={tooltip}
			title={tooltip}
			disabled={disabled}
			// Skip the Tab order so users can't accidentally trap focus on
			// this control and disable the global weather keyboard
			// shortcuts (Enter opens the city manager, arrows navigate).
			tabIndex={-1}
			onClick={(event) => {
				playSound("/sound/click-003.mp3");
				void toggle();
				// Return focus to <body> so the global weather keyboard
				// shortcuts keep working — the global keydown handler
				// swallows events that originate from focused buttons.
				event.currentTarget.blur();
			}}
			className={cn(
				"relative flex size-7 cursor-pointer items-center justify-center rounded-full",
				"border border-border bg-surface-overlay/70 backdrop-blur-md",
				"text-text-subtle transition-colors duration-normal",
				"hover:bg-surface-hovered hover:text-text",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focused",
				"disabled:cursor-not-allowed disabled:opacity-50",
				isEnabled && "border-border-selected text-text-selected bg-surface-selected/40",
			)}
			data-active={isActive ? "true" : undefined}
			data-error={error ? "true" : undefined}
		>
			<LightbulbIcon
				label=""
				color="currentColor"
				spacing="none"
			/>
		</button>
	);
}

function WeatherKeyboardHints({
	isVisible,
	isEditing,
}: {
	isVisible: boolean;
	isEditing: boolean;
}) {
	return (
		<div className="absolute bottom-0 left-1/2 z-20 w-full max-w-[calc(100%-2rem)] -translate-x-1/2 px-4">
			<motion.div
				animate={isVisible
					? { opacity: 1, filter: "blur(0px)" }
					: { opacity: 0, filter: "blur(16px)" }
				}
				initial={{ opacity: 0, filter: "blur(16px)" }}
				transition={{ duration: 0.35, ease: [0, 0.4, 0, 1] }}
				style={{
					willChange: "opacity, filter",
					pointerEvents: isVisible ? "auto" : "none",
				}}
			>
				<Footer
					hideIcon
					style={{ fontFamily: "'JetBrains Mono', monospace" }}
				>
					{!isEditing && (
						<>
							<span>
								<kbd className="font-sans">←</kbd> <kbd className="font-sans">→</kbd> theme
							</span>
							<span aria-hidden>•</span>
						</>
					)}
					<span>
						<kbd className="font-sans">↑</kbd> <kbd className="font-sans">↓</kbd> city
					</span>
					<span aria-hidden>•</span>
					<span className="inline-flex items-center gap-1">
						<ReturnIcon className="size-3.5" />
						update cities
					</span>
					{isEditing && (
						<>
							<span aria-hidden>•</span>
							<span>
								<kbd className="font-sans">ESC</kbd> to cancel
							</span>
						</>
					)}
				</Footer>
			</motion.div>
		</div>
	);
}

// `CityRailEditor` subtracts this many pixels (TRACK_INSET) from the
// `width` prop internally to derive the visible rail width. Re-export
// the value here so we can compensate when sizing the slider to match
// the Humidity card width directly beneath it in the 2×2 grid.
const CITY_RAIL_TRACK_INSET = 24;

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

// Layout anchors describe the *target* sizes the design was authored
// against at three reference container widths. Between (and outside) those
// anchors we linearly interpolate every numeric value so the layout grows
// fluidly with whatever space the component actually has, instead of
// snapping at hard CSS breakpoints.
//
// `containerWidth` is the width of the cards row (the parent of all four
// pills + the slider), measured at runtime via `ResizeObserver`.
interface SizeAnchor extends ResponsiveSizes {
	containerWidth: number;
}

// 2×2 grid anchors — used while the container is narrow enough that the
// horizontal 4-card layout cannot fit. The container width here is the
// width of one *row* of the 2×2 grid (slider + time, or humidity + temp).
const GRID_ANCHOR_SMALL: SizeAnchor = {
	containerWidth: 320,
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
};

const GRID_ANCHOR_LARGE: SizeAnchor = {
	containerWidth: 484, // 170 + 12 (gap) + 300 + small breathing room
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
};

// Horizontal anchors — used while the container is wide enough for the
// row layout (slider + time + humidity + temperature in a single row).
// The container width here is the width of the entire row.
const ROW_ANCHOR_SMALL: SizeAnchor = {
	// 170 + 300 + 170 + 300 + 3*12 (gaps) = 976. Use a slightly smaller
	// number so we begin the row layout the moment it can geometrically
	// fit, then start scaling values up from there.
	containerWidth: 940,
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
};

const ROW_ANCHOR_LARGE: SizeAnchor = {
	// 200 + 400 + 200 + 400 + 3*12 (gaps) = 1236.
	containerWidth: 1236,
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
};

// Below this container width we drop back to the 2×2 grid layout.
// Must be >= ROW_ANCHOR_SMALL.containerWidth (940) so the cards never
// overflow their parent in row mode — otherwise `overflow-hidden` on the
// outer container clips the leftmost card (the city slider).
const ROW_LAYOUT_MIN_WIDTH = ROW_ANCHOR_SMALL.containerWidth;

function lerp(a: number, b: number, t: number): number {
	return a + (b - a) * t;
}

function clamp01(t: number): number {
	if (t < 0) return 0;
	if (t > 1) return 1;
	return t;
}

function interpolateSizes(
	a: SizeAnchor,
	b: SizeAnchor,
	width: number,
): ResponsiveSizes {
	const span = b.containerWidth - a.containerWidth;
	const t = span <= 0 ? 0 : clamp01((width - a.containerWidth) / span);
	const mix = (key: keyof ResponsiveSizes) =>
		lerp(a[key] as number, b[key] as number, t);
	return {
		sliderWidth: mix("sliderWidth"),
		timeWidth: mix("timeWidth"),
		humidityWidth: mix("humidityWidth"),
		temperatureWidth: mix("temperatureWidth"),
		pillHeight: mix("pillHeight"),
		gridCellSize: mix("gridCellSize"),
		timeFontPx: mix("timeFontPx"),
		humidityFontPx: mix("humidityFontPx"),
		temperatureFontPx: mix("temperatureFontPx"),
		weatherIconSize: mix("weatherIconSize"),
		labelFontPx: mix("labelFontPx"),
		footnoteFontPx: mix("footnoteFontPx"),
		labelInsetPx: mix("labelInsetPx"),
		screwInsetX: {
			time: lerp(a.screwInsetX.time, b.screwInsetX.time, t),
			humidity: lerp(a.screwInsetX.humidity, b.screwInsetX.humidity, t),
			temperature: lerp(
				a.screwInsetX.temperature,
				b.screwInsetX.temperature,
				t,
			),
		},
		screwInsetY: lerp(a.screwInsetY, b.screwInsetY, t),
	};
}

interface FluidLayout {
	sizes: ResponsiveSizes;
	layout: "grid" | "row";
}

function computeFluidLayout(containerWidth: number): FluidLayout {
	if (containerWidth >= ROW_LAYOUT_MIN_WIDTH) {
		// Row layout: grow from ROW_ANCHOR_SMALL up to ROW_ANCHOR_LARGE.
		// `interpolateSizes` clamps `t` to [0, 1], so once the container
		// width exceeds `ROW_ANCHOR_LARGE.containerWidth` we cap at the
		// large anchor — the design stops scaling on very wide monitors
		// instead of growing unbounded.
		return {
			layout: "row",
			sizes: interpolateSizes(
				ROW_ANCHOR_SMALL,
				ROW_ANCHOR_LARGE,
				containerWidth,
			),
		};
	}
	// 2×2 grid layout — interpolate between the two grid anchors using
	// the per-row width (which is roughly half the available container
	// width once we factor in inner gaps).
	const rowWidth = containerWidth;
	return {
		layout: "grid",
		sizes: interpolateSizes(
			GRID_ANCHOR_SMALL,
			GRID_ANCHOR_LARGE,
			rowWidth,
		),
	};
}

function useFluidWeatherLayout(): {
	measureRef: React.RefObject<HTMLDivElement | null>;
	layout: FluidLayout;
} {
	// We measure the *available* width by attaching the observer to a
	// zero-height sentinel element that fills the parent. This avoids any
	// feedback loop where the cards' own intrinsic widths feed back into
	// the layout decision.
	const measureRef = React.useRef<HTMLDivElement | null>(null);
	// Default to the largest row layout on first paint to match the
	// historical desktop look and avoid a flash on first measurement.
	const [layout, setLayout] = React.useState<FluidLayout>(() =>
		computeFluidLayout(ROW_ANCHOR_LARGE.containerWidth),
	);

	React.useEffect(() => {
		const node = measureRef.current;
		if (!node || typeof ResizeObserver === "undefined") return;
		const update = (width: number) => {
			setLayout((prev) => {
				const next = computeFluidLayout(width);
				// Avoid spamming React with no-op state updates from
				// sub-pixel resize ticks.
				if (
					prev.layout === next.layout &&
					Math.abs(prev.sizes.timeWidth - next.sizes.timeWidth) < 0.5 &&
					Math.abs(prev.sizes.pillHeight - next.sizes.pillHeight) < 0.5
				) {
					return prev;
				}
				return next;
			});
		};
		const observer = new ResizeObserver((entries) => {
			for (const entry of entries) {
				update(entry.contentRect.width);
			}
		});
		observer.observe(node);
		// Prime with the current width so we don't wait for the first
		// resize event after mount.
		update(node.getBoundingClientRect().width);
		return () => observer.disconnect();
	}, []);

	return { measureRef, layout };
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
					: <FlipText text={clock.seconds} />
				</span>
			</div>
		</WidgetCard>
	);
}

function WeatherDateSummary({
	clock,
}: {
	clock: LocationClock;
}) {
	const weekdayShort = clock.isReady
		? clock.weekday.slice(0, 3).toUpperCase()
		: "---";
	const monthShort = clock.isReady
		? clock.month.slice(0, 3).toUpperCase()
		: "---";

	return (
		<div
			className="text-text-subtle relative z-10 flex items-center gap-2 text-[13px] uppercase tracking-[0.36em] transition-colors duration-slow"
			style={{ fontFamily: "'BBH Bartle', sans-serif" }}
		>
			<span>{weekdayShort}</span>
			<span style={{ fontSize: 16 }}>—</span>
			<span>
				{monthShort} {clock.isReady ? clock.day : "--"}
			</span>
		</div>
	);
}

function SelectedWeatherClock({
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
	onFooterAnimationComplete,
}: WeatherTimeCardProps & {
	onFooterAnimationComplete?: () => void;
}) {
	const clock = useLocationClock(timezone);

	return (
		<>
			<motion.div
				initial={{ opacity: 0, filter: "blur(16px)", scale: 0.5, y: 140 }}
				animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
				transition={{
					scale: { type: "spring", stiffness: 180, damping: 12, mass: 0.6, delay: 0.2 },
					y: { type: "spring", stiffness: 180, damping: 12, mass: 0.6, delay: 0.2 },
					filter: { duration: 0.5, ease: [0, 0.4, 0, 1], delay: 0.2 },
					opacity: { duration: 0.4, ease: [0, 0.4, 0, 1], delay: 0.2 },
				}}
				style={{ willChange: "opacity, filter, transform" }}
			>
				<WeatherTimeCard
					timezone={timezone}
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
			</motion.div>

			<motion.div
				initial={{ opacity: 0, y: 24, filter: "blur(12px)" }}
				animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
				transition={{ type: "spring", stiffness: 160, damping: 14, mass: 0.5, delay: 0.44 }}
				style={{ willChange: "opacity, filter, transform" }}
				onAnimationComplete={onFooterAnimationComplete}
			>
				<WeatherDateSummary clock={clock} />
			</motion.div>
		</>
	);
}

export default function Weather({
	className,
}: WeatherProps) {
	const { setTheme, actualTheme } = useTheme();
	const [pointerViewportZone, setPointerViewportZone] = React.useState<"top" | "bottom" | null>(null);
	const [isPointerOverSlider, setIsPointerOverSlider] = React.useState(false);
	const [isThemeKeyboardVisible, setIsThemeKeyboardVisible] = React.useState(false);
	const [themeNavigationPulseKey, setThemeNavigationPulseKey] = React.useState(0);
	const [openCityManagerRequestKey, setOpenCityManagerRequestKey] = React.useState(0);
	const [isCityManagerOpen, setIsCityManagerOpen] = React.useState(false);
	const [cityNavigationPulseKey, setCityNavigationPulseKey] = React.useState(0);
	const [isEntranceAnimating, setIsEntranceAnimating] = React.useState(true);
	const themeKeyboardVisibleTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
	const {
		cities,
		selectedIndex,
		selected,
		setSelectedIndex,
		addCity,
		removeCity,
	} = useCities();

	const { measureRef, layout: fluidLayout } = useFluidWeatherLayout();
	const sizes = fluidLayout.sizes;
	const isRowLayout = fluidLayout.layout === "row";
	const sliderOverlapMarginBottom =
		!isRowLayout
			? -Math.round(sizes.pillHeight * 0.18)
			: 0;

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

	const revealThemeControlFromKeyboard = React.useCallback(() => {
		setIsThemeKeyboardVisible(true);
		if (themeKeyboardVisibleTimeoutRef.current !== null) {
			clearTimeout(themeKeyboardVisibleTimeoutRef.current);
		}
		themeKeyboardVisibleTimeoutRef.current = setTimeout(() => {
			setIsThemeKeyboardVisible(false);
			themeKeyboardVisibleTimeoutRef.current = null;
		}, 1200);
	}, []);

	React.useEffect(() => {
		return () => {
			if (themeKeyboardVisibleTimeoutRef.current !== null) {
				clearTimeout(themeKeyboardVisibleTimeoutRef.current);
			}
		};
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

	React.useEffect(() => {
		if (typeof window === "undefined") return;

		const isOverSlider = (target: EventTarget | null) => {
			if (!(target instanceof Element)) return false;
			return Boolean(target.closest('[role="slider"]'));
		};

		const handlePointerMove = (event: PointerEvent) => {
			setPointerViewportZone(
				event.clientY < window.innerHeight / 2 ? "top" : "bottom",
			);
			setIsPointerOverSlider(isOverSlider(event.target));
		};

		const handlePointerLeave = () => {
			setPointerViewportZone(null);
			setIsPointerOverSlider(false);
		};

		window.addEventListener("pointermove", handlePointerMove);
		window.addEventListener("pointerleave", handlePointerLeave);
		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointerleave", handlePointerLeave);
		};
	}, []);

	// Global weather-scene keyboard shortcuts:
	// left/right step through the theme, up/down move between cities, and Enter
	// opens the city manager. Text inputs and focused interactive
	// controls keep their native keyboard behavior.
	React.useEffect(() => {
		if (typeof window === "undefined") return;

		const isTypingTarget = (target: EventTarget | null) => {
			if (!(target instanceof HTMLElement)) return false;
			const tag = target.tagName;
			return (
				tag === "INPUT" ||
				tag === "TEXTAREA" ||
				tag === "SELECT" ||
				target.isContentEditable
			);
		};

		const isSliderTarget = (target: EventTarget | null) => {
			if (!(target instanceof HTMLElement)) return false;
			return (
				target.getAttribute("role") === "slider" ||
				Boolean(target.closest('[role="slider"]'))
			);
		};

		const isInteractiveTarget = (target: EventTarget | null) => {
			if (!(target instanceof HTMLElement)) return false;
			return Boolean(target.closest("button, a, [role='button'], [role='radio']"));
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (isEntranceAnimating) return;
			const target = event.target;
			const typingTarget = isTypingTarget(target);
			const sliderTarget = isSliderTarget(target);
			const interactiveTarget = isInteractiveTarget(target);

			if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
				if (typingTarget || sliderTarget || interactiveTarget) return;

				event.preventDefault();
				revealThemeControlFromKeyboard();
				const currentIndex = THEME_MODE_ORDER.indexOf(weatherMode);
				const safeIndex = currentIndex === -1 ? 0 : currentIndex;
				const delta = event.key === "ArrowLeft" ? -1 : 1;
				const nextIndex = Math.max(
					0,
					Math.min(safeIndex + delta, THEME_MODE_ORDER.length - 1),
				);
				if (nextIndex === safeIndex) {
					return;
				}
				playSound("/sound/click-003.mp3");
				setThemeNavigationPulseKey((current) => current + 1);
				updateWeatherMode(THEME_MODE_ORDER[nextIndex]);
				return;
			}

			if (event.key === "ArrowUp" || event.key === "ArrowDown") {
				if (
					typingTarget ||
					sliderTarget ||
					interactiveTarget ||
					isCityManagerOpen
				) {
					return;
				}

				const delta = event.key === "ArrowUp" ? 1 : -1;
				const nextSelectedIndex = Math.max(
					0,
					Math.min(selectedIndex + delta, cities.length - 1),
				);
				if (nextSelectedIndex === selectedIndex) {
					return;
				}

				event.preventDefault();
				playSound("/sound/click-002.mp3");
				setSelectedIndex(nextSelectedIndex);
				setCityNavigationPulseKey((current) => current + 1);
				return;
			}

			if (event.key === "Enter") {
				if (
					typingTarget ||
					sliderTarget ||
					interactiveTarget ||
					isCityManagerOpen
				) {
					return;
				}

				event.preventDefault();
				setOpenCityManagerRequestKey((current) => current + 1);
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [
		isEntranceAnimating,
		isCityManagerOpen,
		cities.length,
		selectedIndex,
		setSelectedIndex,
		weatherMode,
		revealThemeControlFromKeyboard,
		updateWeatherMode,
	]);

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
			ref={measureRef}
			className={cn(
				"bg-surface text-text relative isolate flex h-full w-full flex-col items-center justify-center gap-6 overflow-hidden px-6 pt-6 pb-0 transition-[background-color,color] duration-slow sm:gap-10 sm:pt-8 lg:gap-14",
				className,
			)}
		>
			<ThemeControl
				mode={weatherMode}
				onChange={updateWeatherMode}
				isVisible={
					isThemeKeyboardVisible ||
					(pointerViewportZone === "top" && !isPointerOverSlider)
				}
				keyboardSelectionPulseKey={themeNavigationPulseKey}
			/>

			<motion.div
				initial={{ opacity: 0, y: 40, filter: "blur(12px)" }}
				animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
				transition={{ type: "spring", stiffness: 120, damping: 14, mass: 0.7 }}
				style={{ willChange: "opacity, filter, transform" }}
			>
				<div className="text-text relative z-10 flex flex-col items-center gap-2">
					<span
						className="text-[15px] font-medium uppercase tracking-[0.36em]"
						style={{
							letterSpacing: "0.36em",
							fontFamily: "'BBH Bartle', sans-serif",
						}}
					>
						{selected.name}
					</span>
				</div>
			</motion.div>

			<div
				className={cn(
					"relative z-10 justify-center",
					// Top-align in the 2×2 grid so the slider and the time
					// card share the same top edge — the slider's negative
					// `marginBottom` (used to overlap the HUMID card below)
					// would otherwise interact with `items-center` and push
					// the slider down inside its row track. In the row
					// layout we keep `items-center` so all four pills sit
					// on the same horizontal centerline.
					isRowLayout
						? "flex items-center gap-3"
						: "grid grid-cols-[auto_auto] items-start gap-2",
				)}
			>
				<motion.div
					className={isRowLayout ? "order-2" : "col-start-2 row-start-1"}
					initial={{ opacity: 0, filter: "blur(16px)", scale: 0.5, y: 140 }}
					animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
					transition={{
						scale: { type: "spring", stiffness: 180, damping: 12, mass: 0.6, delay: 0.2 },
						y: { type: "spring", stiffness: 180, damping: 12, mass: 0.6, delay: 0.2 },
						filter: { duration: 0.5, ease: [0, 0.4, 0, 1], delay: 0.2 },
						opacity: { duration: 0.4, ease: [0, 0.4, 0, 1], delay: 0.2 },
					}}
					style={{ willChange: "opacity, filter, transform" }}
					// Mark the entrance as complete so the global weather
					// keyboard shortcuts (Enter, arrows) are re-enabled. The
					// previous standalone <WeatherDateSummary> motion.div that
					// fired this callback was removed during the
					// `SelectedWeatherClock` extraction refactor.
					onAnimationComplete={() => setIsEntranceAnimating(false)}
				>
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
				</motion.div>

				<motion.div
					className={isRowLayout ? "order-3" : "col-start-1 row-start-2"}
					initial={{ opacity: 0, filter: "blur(16px)", scaleY: 0, y: 80 }}
					animate={{ opacity: 1, filter: "blur(0px)", scaleY: 1, y: 0 }}
					transition={{
						scaleY: { type: "spring", stiffness: 180, damping: 12, mass: 0.6, delay: 0.3 },
						y: { type: "spring", stiffness: 180, damping: 12, mass: 0.6, delay: 0.3 },
						filter: { duration: 0.5, ease: [0, 0.4, 0, 1], delay: 0.3 },
						opacity: { duration: 0.4, ease: [0, 0.4, 0, 1], delay: 0.3 },
					}}
					style={{ transformOrigin: "bottom center", willChange: "opacity, filter, transform" }}
				>
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
				</motion.div>

				<motion.div
					className={isRowLayout ? "order-4" : "col-start-2 row-start-2"}
					initial={{ opacity: 0, filter: "blur(16px)", scale: 0.5, y: 140 }}
					animate={{ opacity: 1, filter: "blur(0px)", scale: 1, y: 0 }}
					transition={{
						scale: { type: "spring", stiffness: 180, damping: 12, mass: 0.6, delay: 0.4 },
						y: { type: "spring", stiffness: 180, damping: 12, mass: 0.6, delay: 0.4 },
						filter: { duration: 0.5, ease: [0, 0.4, 0, 1], delay: 0.4 },
						opacity: { duration: 0.4, ease: [0, 0.4, 0, 1], delay: 0.4 },
					}}
					style={{ willChange: "opacity, filter, transform" }}
				>
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
				</motion.div>

				<motion.div
					// IMPORTANT: do NOT add `relative z-N` (or any
					// stacking-context-creating CSS) to this wrapper. The
					// slider's `LiquidGlass` shell uses
					// `backdrop-filter: url(#filter)` to displace whatever
					// is painted *behind* it (the chromatic-dispersion
					// effect). `backdrop-filter` only samples content from
					// the slider's own ancestor stacking contexts — the
					// moment this wrapper becomes its own stacking context
					// (`position: relative; z-index: …`,
					// `will-change: transform`, `transform`, `filter`,
					// `isolation: isolate`, etc.), the HUMID card sibling
					// below the slider gets clipped out of the backdrop
					// snapshot and only the page background is refracted.
					// We instead push the *neighbouring* widget cards
					// behind the slider (see `negative-z` comments below).
					className={isRowLayout ? "order-1" : "col-start-1 row-start-1"}
					initial={{ opacity: 0, filter: "blur(16px)", scaleY: 0, y: 80 }}
					animate={{ opacity: 1, filter: "blur(0px)", scaleY: 1, y: 0 }}
					transition={{
						scaleY: { type: "spring", stiffness: 180, damping: 12, mass: 0.6, delay: 0.1 },
						y: { type: "spring", stiffness: 180, damping: 12, mass: 0.6, delay: 0.1 },
						filter: { duration: 0.5, ease: [0, 0.4, 0, 1], delay: 0.1 },
						opacity: { duration: 0.4, ease: [0, 0.4, 0, 1], delay: 0.1 },
					}}
					style={{
						marginBottom: sliderOverlapMarginBottom,
						transformOrigin: "bottom center",
					}}
				>
					<CityRailEditor
						cities={cities}
						selectedIndex={selectedIndex}
						setSelectedIndex={setSelectedIndex}
						addCity={addCity}
						openRequestKey={openCityManagerRequestKey}
						onOpenChange={setIsCityManagerOpen}
						keyboardNavigationPulseKey={cityNavigationPulseKey}
						removeCity={removeCity}
						height={sizes.pillHeight}
						// CityRailEditor subtracts a 24px TRACK_INSET internally to
						// derive the visible rail width, so we add it back here to
						// make the slider's visible pill match the Humidity card
						// width directly underneath it in the 2×2 grid.
						width={sizes.sliderWidth + CITY_RAIL_TRACK_INSET}
					/>
				</motion.div>
			</div>

			<WeatherKeyboardHints isVisible={pointerViewportZone === "bottom"} isEditing={isCityManagerOpen} />
		</div>
	);
}
