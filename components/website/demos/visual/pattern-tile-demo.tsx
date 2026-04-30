"use client";

import { useMemo, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import { ShaderColorInput } from "./shader-color-controls";
import PatternTile, {
	ANIMATABLE_PATTERNS,
	BLEND_MODE_TYPES,
	FILL_TYPES,
	PATTERN_TYPES,
	POSITION_TYPES,
	type PatternBlendMode,
	type PatternDirection,
	type PatternFill,
	type PatternPosition,
	type PatternType,
} from "./pattern-tile";

const DEFAULT_PATTERN_TYPE: PatternType = "wave-lines";
const DEFAULT_FRONT = "#FFFFFF";
const DEFAULT_BACK = "#22DDDD";
const DEFAULT_SCALE = 10;
const DEFAULT_OPACITY = 1;
const DEFAULT_BLEND_MODE: PatternBlendMode = "normal";
const DEFAULT_FILL: PatternFill = "tile";
const DEFAULT_POSITION: PatternPosition = "center";
const DEFAULT_ANIMATE = false;
const DEFAULT_DIRECTION: PatternDirection = "left";
const DEFAULT_DIAGONAL = true;
const DEFAULT_DURATION = 5;

const DIRECTION_OPTIONS = [
	{ value: "left", label: "Left" },
	{ value: "right", label: "Right" },
	{ value: "top", label: "Top" },
	{ value: "bottom", label: "Bottom" },
] as const;

const DIAGONAL_OPTIONS = [
	{ value: "true", label: "Top-Left" },
	{ value: "false", label: "Bottom-Right" },
] as const;

export default function PatternTileDemo() {
	const [patternType, setPatternType] = useState<PatternType>(DEFAULT_PATTERN_TYPE);
	const [front, setFront] = useState(DEFAULT_FRONT);
	const [backColor, setBackColor] = useState(DEFAULT_BACK);
	const [backTransparent, setBackTransparent] = useState(false);
	const back = backTransparent ? "transparent" : backColor;
	const [scale, setScale] = useState(DEFAULT_SCALE);
	const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
	const [blendMode, setBlendMode] = useState<PatternBlendMode>(DEFAULT_BLEND_MODE);
	const [fill, setFill] = useState<PatternFill>(DEFAULT_FILL);
	const [position, setPosition] = useState<PatternPosition>(DEFAULT_POSITION);
	const [shouldAnimate, setShouldAnimate] = useState(DEFAULT_ANIMATE);
	const [direction, setDirection] = useState<PatternDirection>(DEFAULT_DIRECTION);
	const [diagonal, setDiagonal] = useState(DEFAULT_DIAGONAL);
	const [duration, setDuration] = useState(DEFAULT_DURATION);

	const canAnimate = ANIMATABLE_PATTERNS.includes(patternType);
	const isWiggle = patternType === "wiggle";
	const isTile = fill === "tile";

	const config = useMemo(
		() => ({ patternType, front, back, scale, opacity, blendMode, fill, position, shouldAnimate, direction, diagonal, duration }),
		[patternType, front, back, scale, opacity, blendMode, fill, position, shouldAnimate, direction, diagonal, duration],
	);

	return (
		<div className="flex w-full max-w-2xl flex-col" style={{ gap: token("space.400") }}>
			<div
				className="w-full overflow-hidden rounded-lg"
				style={{ boxShadow: token("elevation.shadow.raised") }}
			>
				<PatternTile
					patternType={patternType}
					front={front}
					back={back}
					scale={scale}
					opacity={opacity}
					blendMode={blendMode}
					fill={fill}
					position={position}
					shouldAnimate={shouldAnimate}
					direction={direction}
					diagonal={diagonal}
					duration={duration}
					style={{ height: 400 }}
				/>
			</div>

			<GUI.Panel title="Pattern controls" values={config}>
				<GUI.Select
					id="pattern-type"
					label="Type"
					description="The background pattern style."
					value={patternType}
					options={PATTERN_TYPES}
					onChange={(next) => setPatternType(next as PatternType)}
				/>
				<ShaderColorInput
					id="pattern-front"
					label="Front"
					value={front}
					defaultValue={DEFAULT_FRONT}
					onChange={setFront}
				/>
				<ShaderColorInput
					id="pattern-back"
					label="Back"
					value={backColor}
					defaultValue={DEFAULT_BACK}
					onChange={setBackColor}
					disabled={backTransparent}
				/>
				<GUI.Toggle
					id="pattern-back-transparent"
					label="Transparent back"
					description="Use a transparent background."
					checked={backTransparent}
					onChange={setBackTransparent}
				/>
				<GUI.Control
					id="pattern-scale"
					label="Scale"
					description="Size multiplier for the pattern tiles."
					value={scale}
					defaultValue={DEFAULT_SCALE}
					min={1}
					max={100}
					step={1}
					unit="px"
					onChange={setScale}
				/>
				<GUI.Control
					id="pattern-opacity"
					label="Opacity"
					description="Pattern opacity."
					value={opacity}
					defaultValue={DEFAULT_OPACITY}
					min={0}
					max={1}
					step={0.01}
					onChange={setOpacity}
				/>
				<GUI.Select
					id="pattern-blend-mode"
					label="Blend"
					description="Background blend mode."
					value={blendMode}
					options={BLEND_MODE_TYPES}
					onChange={(next) => setBlendMode(next as PatternBlendMode)}
				/>
				<GUI.Select
					id="pattern-fill"
					label="Fill"
					description="How the pattern image fills the container."
					value={fill}
					options={FILL_TYPES}
					onChange={(next) => setFill(next as PatternFill)}
				/>
				<GUI.Select
					id="pattern-position"
					label="Position"
					description="Image position within the container."
					value={position}
					options={POSITION_TYPES}
					onChange={(next) => setPosition(next as PatternPosition)}
				/>
				{canAnimate && isTile ? (
					<>
						<GUI.Toggle
							id="pattern-animate"
							label="Animate"
							description="Enable looping background animation."
							checked={shouldAnimate}
							onChange={setShouldAnimate}
						/>
						{shouldAnimate ? (
							<>
								{isWiggle ? (
									<GUI.Select
										id="pattern-diagonal"
										label="Direction"
										description="Diagonal animation direction."
										value={String(diagonal)}
										options={DIAGONAL_OPTIONS}
										onChange={(next) => setDiagonal(next === "true")}
									/>
								) : (
									<GUI.Select
										id="pattern-direction"
										label="Direction"
										description="Animation scroll direction."
										value={direction}
										options={DIRECTION_OPTIONS}
										onChange={(next) => setDirection(next as PatternDirection)}
									/>
								)}
								<GUI.Control
									id="pattern-duration"
									label="Duration"
									description="Animation loop duration in seconds."
									value={duration}
									defaultValue={DEFAULT_DURATION}
									min={0.1}
									max={50}
									step={0.1}
									unit="s"
									onChange={setDuration}
								/>
							</>
						) : null}
					</>
				) : null}
			</GUI.Panel>
		</div>
	);
}
