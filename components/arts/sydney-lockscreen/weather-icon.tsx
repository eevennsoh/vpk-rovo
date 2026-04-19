"use client";

import * as React from "react";

import { CloudDrizzle } from "@/components/animate-ui/icons/cloud-drizzle";
import { CloudLightning } from "@/components/animate-ui/icons/cloud-lightning";
import { CloudMoon } from "@/components/animate-ui/icons/cloud-moon";
import { CloudRain } from "@/components/animate-ui/icons/cloud-rain";
import { CloudSnow } from "@/components/animate-ui/icons/cloud-snow";
import { CloudSun } from "@/components/animate-ui/icons/cloud-sun";
import { Moon } from "@/components/animate-ui/icons/moon";
import { Sun } from "@/components/animate-ui/icons/sun";

type AnimatedWeatherIconComponent = React.ComponentType<{
	size?: number;
	animate?: boolean;
	loop?: boolean;
	loopDelay?: number;
	className?: string;
}>;

export interface WeatherIconProps {
	weatherCode: number | null;
	isDay: boolean;
	size?: number;
	loop?: boolean;
	className?: string;
	style?: React.CSSProperties;
}

interface IconChoice {
	Icon: AnimatedWeatherIconComponent;
	label: string;
}

function pickIcon(weatherCode: number | null, isDay: boolean): IconChoice {
	const ClearIcon = isDay ? Sun : Moon;
	const PartlyIcon = isDay ? CloudSun : CloudMoon;

	if (weatherCode === null || Number.isNaN(weatherCode)) {
		return { Icon: ClearIcon, label: "Clear" };
	}

	// WMO weather code mapping (https://open-meteo.com/en/docs).
	if (weatherCode === 0) {
		return { Icon: ClearIcon, label: isDay ? "Clear sky" : "Clear night" };
	}
	if (weatherCode === 1 || weatherCode === 2) {
		return { Icon: PartlyIcon, label: "Partly cloudy" };
	}
	if (weatherCode === 3) {
		return { Icon: PartlyIcon, label: "Overcast" };
	}
	if (weatherCode === 45 || weatherCode === 48) {
		return { Icon: PartlyIcon, label: "Fog" };
	}
	if (weatherCode >= 51 && weatherCode <= 57) {
		return { Icon: CloudDrizzle, label: "Drizzle" };
	}
	if (
		(weatherCode >= 61 && weatherCode <= 67) ||
		(weatherCode >= 80 && weatherCode <= 82)
	) {
		return { Icon: CloudRain, label: "Rain" };
	}
	if (
		(weatherCode >= 71 && weatherCode <= 77) ||
		weatherCode === 85 ||
		weatherCode === 86
	) {
		return { Icon: CloudSnow, label: "Snow" };
	}
	if (weatherCode >= 95 && weatherCode <= 99) {
		return { Icon: CloudLightning, label: "Thunderstorm" };
	}
	return { Icon: ClearIcon, label: "Clear" };
}

export function WeatherIcon({
	weatherCode,
	isDay,
	size = 28,
	loop = true,
	className,
	style,
}: WeatherIconProps) {
	const { Icon, label } = React.useMemo(
		() => pickIcon(weatherCode, isDay),
		[weatherCode, isDay],
	);

	return (
		<span aria-label={label} role="img" className={className} style={style}>
			<Icon size={size} animate loop loopDelay={loop ? 600 : 0} />
		</span>
	);
}

export function getWeatherLabel(weatherCode: number | null, isDay: boolean): string {
	return pickIcon(weatherCode, isDay).label;
}
