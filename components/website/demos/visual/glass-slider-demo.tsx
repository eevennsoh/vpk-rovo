"use client";

import { token } from "@/lib/tokens";

import { CityRailEditor } from "@/components/arts/weather/city-popover";
import { useCities } from "@/components/arts/weather/use-cities";

// CityRailEditor subtracts this many pixels (TRACK_INSET) from `width`
// internally to derive the visible rail width, so the demo adds it back
// here to match the rendered slider width used by the weather screen.
const CITY_RAIL_TRACK_INSET = 24;
const SLIDER_RAIL_WIDTH = 170;
const SLIDER_HEIGHT = 440;

export default function GlassSliderDemo() {
	const { cities, selectedIndex, setSelectedIndex, addCity } =
		useCities();

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="relative overflow-hidden border border-border"
				style={{
					borderRadius: 28,
					boxShadow: token("elevation.shadow.raised"),
					backgroundColor: token("elevation.surface"),
				}}
			>
				<div
					className="relative flex w-full items-center justify-center overflow-hidden px-6 py-8"
					style={{
						minHeight: 520,
						height: "min(72vh, 620px)",
					}}
				>
					<div
						className="relative z-10"
						style={{
							width: SLIDER_RAIL_WIDTH + CITY_RAIL_TRACK_INSET,
							height: SLIDER_HEIGHT,
						}}
					>
						<CityRailEditor
							cities={cities}
							selectedIndex={selectedIndex}
							setSelectedIndex={setSelectedIndex}
							addCity={addCity}
							width={SLIDER_RAIL_WIDTH + CITY_RAIL_TRACK_INSET}
							height={SLIDER_HEIGHT}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}
