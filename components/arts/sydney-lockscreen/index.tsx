"use client";

import * as React from "react";

import Holo from "@/components/website/demos/visual/shaders/holo";
import { cn } from "@/lib/utils";

import { CityPopover } from "./city-popover";
import { DigitDisplay } from "./digit-display";
import { useCities } from "./use-cities";
import { useCurrentWeather } from "./use-current-weather";
import { useLocationClock } from "./use-location-clock";
import { VerticalElasticSlider } from "./vertical-elastic-slider";
import { WeatherIcon, getWeatherLabel } from "./weather-icon";
import {
	WidgetCard,
	WidgetGridOverlay,
	WidgetScrewDots,
} from "./widget-card";

export interface SydneyLockscreenProps {
	className?: string;
}

const CONTRAST_TINT =
	"linear-gradient(180deg, rgba(0, 0, 0, 0.05) 0%, rgba(0, 0, 0, 0.45) 100%)";

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

const PILL_WIDTH = 150;
const PILL_HEIGHT = 380;
const PILL_RADIUS = PILL_WIDTH / 2;

export default function SydneyLockscreen({
	className,
}: SydneyLockscreenProps) {
	const {
		cities,
		selectedIndex,
		selected,
		setSelectedIndex,
		addCity,
		removeCity,
		isAdded,
	} = useCities();

	const clock = useLocationClock(selected.timezone);
	const weather = useCurrentWeather(
		selected.latitude,
		selected.longitude,
		selected.timezone,
	);

	const temperature = formatTemperature(weather.temperatureCelsius);
	const weatherLabel = getWeatherLabel(weather.weatherCode, weather.isDay);

	const weekdayShort = clock.isReady
		? clock.weekday.slice(0, 3).toUpperCase()
		: "---";
	const monthShort = clock.isReady
		? clock.month.slice(0, 3).toUpperCase()
		: "---";

	return (
		<div
			className={cn(
				"flex h-full w-full flex-col items-center justify-between px-4 py-8",
				className,
			)}
			style={{ background: "#F4F2EE", color: "#0F0F12" }}
		>
			{/* Top: clover + city name */}
			<div className="flex flex-col items-center gap-2">
				<CloverGlyph size={28} />
				<span
					className="text-[15px] font-medium uppercase tracking-[0.36em]"
					style={{ letterSpacing: "0.36em" }}
				>
					{selected.name}
				</span>
			</div>

			{/* Middle: 4 capsule pills */}
			<div className="flex items-center gap-3">
				{/* Pill 1: City Slider */}
				<div
					className="relative flex flex-col items-center gap-2"
					style={{ width: PILL_WIDTH, height: PILL_HEIGHT }}
				>
					{/* + button (opens popover) */}
					<div className="relative z-30 flex shrink-0 items-center justify-center">
						<CityPopover
							onAddCity={addCity}
							isAdded={isAdded}
						/>
					</div>

					{/* Slider */}
					<div
						className="flex-1 overflow-hidden"
						style={{
							width: PILL_WIDTH - 24,
							borderRadius: PILL_RADIUS,
							border: "1px solid rgba(0,0,0,0.12)",
						}}
					>
						<VerticalElasticSlider
							min={0}
							max={Math.max(0, cities.length - 1)}
							step={1}
							value={selectedIndex}
							onValueChange={setSelectedIndex}
							formatValue={(v) => cities[v]?.name?.slice(0, 6) ?? ""}
							label="Cities"
							className="h-full"
						/>
					</div>

					{/* - button (remove current city) */}
					<button
						type="button"
						onClick={() => removeCity(selectedIndex)}
						disabled={cities.length <= 1}
						className={cn(
							"relative z-30 flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors",
							cities.length <= 1
								? "opacity-20"
								: "hover:bg-black/10 active:bg-black/15",
						)}
						aria-label="Remove city"
					>
						<svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
					</button>
				</div>

				{/* Pill 2: Time (HH / MM) */}
				<WidgetCard
					radius={PILL_RADIUS}
					className="flex flex-col"
					style={{ width: PILL_WIDTH, height: PILL_HEIGHT }}
					contrastTint={CONTRAST_TINT}
					background={
						<Holo
							className="h-full w-full"
							seed={210}
							speed={0.45}
							scale={1.1}
							warp={4}
							fringeFreq={0.32}
							bandSpread={1.4}
							exposure={9.5}
							saturation={2.2}
						/>
					}
					overlay={
						<>
							<WidgetGridOverlay opacity={0.3} cellSize={16} />
							<WidgetScrewDots />
						</>
					}
				>
					<div
						className="flex h-full flex-col items-center justify-center gap-0"
						style={{ color: "#FFFFFF" }}
					>
						<DigitDisplay
							className="text-[72px]"
							weight={180}
							tracking={-0.04}
							style={{ color: "#FFFFFF", lineHeight: 0.95 }}
						>
							{clock.hours}
						</DigitDisplay>
						<DigitDisplay
							className="text-[72px]"
							weight={180}
							tracking={-0.04}
							style={{ color: "#FFFFFF", lineHeight: 0.95 }}
						>
							{clock.minutes}
						</DigitDisplay>
					</div>
				</WidgetCard>

				{/* Pill 3: Humidity */}
				<WidgetCard
					radius={PILL_RADIUS}
					className="flex flex-col"
					style={{ width: PILL_WIDTH, height: PILL_HEIGHT }}
					contrastTint={CONTRAST_TINT}
					background={
						<Holo
							className="h-full w-full"
							seed={88}
							speed={0.6}
							scale={1.6}
							warp={3}
							fringeFreq={0.5}
							bandSpread={1}
							exposure={8}
							saturation={2}
						/>
					}
					overlay={
						<>
							<WidgetGridOverlay opacity={0.25} cellSize={14} />
							<WidgetScrewDots />
						</>
					}
				>
					<div
						className="flex h-full flex-col items-center justify-center gap-0"
						style={{ color: "#FFFFFF" }}
					>
						<DigitDisplay
							className="text-[72px]"
							weight={180}
							tracking={-0.04}
							style={{ color: "#FFFFFF", lineHeight: 0.95 }}
						>
							{weather.humidity === null
								? "--"
								: Math.round(weather.humidity)}
						</DigitDisplay>
						<DigitDisplay
							className="text-[40px]"
							weight={180}
							tracking={-0.02}
							style={{ color: "rgba(255,255,255,0.8)", lineHeight: 1 }}
						>
							%
						</DigitDisplay>
					</div>
				</WidgetCard>

				{/* Pill 4: Temperature + weather icon */}
				<WidgetCard
					radius={PILL_RADIUS}
					className="flex flex-col"
					style={{ width: PILL_WIDTH, height: PILL_HEIGHT }}
					contrastTint={CONTRAST_TINT}
					background={
						<Holo
							className="h-full w-full"
							seed={314}
							speed={0.5}
							scale={1.3}
							warp={6}
							fringeFreq={0.42}
							bandSpread={1.6}
							exposure={9}
							saturation={2.5}
						/>
					}
					overlay={
						<>
							<WidgetGridOverlay opacity={0.3} cellSize={12} />
							<WidgetScrewDots />
						</>
					}
				>
					<div
						className="flex h-full flex-col items-center justify-center gap-1"
						style={{ color: "#FFFFFF" }}
					>
						<DigitDisplay
							className="text-[72px]"
							weight={180}
							tracking={-0.04}
							style={{ color: "#FFFFFF", lineHeight: 0.95 }}
						>
							{temperature}
						</DigitDisplay>
						<div className="flex items-center gap-1">
							<WeatherIcon
								weatherCode={weather.weatherCode}
								isDay={weather.isDay}
								size={22}
								style={{ color: "rgba(255,255,255,0.85)" }}
							/>
							<DigitDisplay
								className="text-[40px]"
								weight={180}
								tracking={-0.02}
								style={{
									color: "rgba(255,255,255,0.8)",
									lineHeight: 1,
								}}
							>
								°C
							</DigitDisplay>
						</div>
					</div>
				</WidgetCard>
			</div>

			{/* Bottom: weekday + flower + month day */}
			<div
				className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-[0.36em]"
				style={{ color: "#0F0F12" }}
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
