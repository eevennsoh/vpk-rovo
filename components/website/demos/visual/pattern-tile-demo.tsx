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
	STROKE_LINE_CAP_TYPES,
	STROKE_LINE_JOIN_TYPES,
	STROKE_STYLE_TYPES,
	type PatternBlendMode,
	type PatternDirection,
	type PatternFill,
	type PatternPosition,
	type PatternStrokeLineCap,
	type PatternStrokeLineJoin,
	type PatternStrokeOptions,
	type PatternStrokeStyle,
	type PatternType,
} from "./pattern-tile";

const DEFAULT_PATTERN_TYPE: PatternType = "grid";
const DEFAULT_FRONT = "#FFFFFF";
const DEFAULT_BACK = "#22DDDD";
const DEFAULT_SCALE = 10;
const DEFAULT_STROKE_STYLE: PatternStrokeStyle = "solid";
const DEFAULT_STROKE_WIDTH = 1;
const DEFAULT_STROKE_DASH = 6;
const DEFAULT_STROKE_GAP = 6;
const DEFAULT_STROKE_DASH_OFFSET = 0;
const DEFAULT_STROKE_DASH_ARRAY = "";
const DEFAULT_STROKE_LINE_CAP: PatternStrokeLineCap = "butt";
const DEFAULT_STROKE_LINE_JOIN: PatternStrokeLineJoin = "miter";
const DEFAULT_STROKE_MITER_LIMIT = 4;
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
	const [strokeStyle, setStrokeStyle] = useState<PatternStrokeStyle>(DEFAULT_STROKE_STYLE);
	const [strokeWidth, setStrokeWidth] = useState(DEFAULT_STROKE_WIDTH);
	const [strokeDash, setStrokeDash] = useState(DEFAULT_STROKE_DASH);
	const [strokeGap, setStrokeGap] = useState(DEFAULT_STROKE_GAP);
	const [strokeDashOffset, setStrokeDashOffset] = useState(DEFAULT_STROKE_DASH_OFFSET);
	const [strokeDashArray, setStrokeDashArray] = useState(DEFAULT_STROKE_DASH_ARRAY);
	const [strokeLineCap, setStrokeLineCap] = useState<PatternStrokeLineCap>(DEFAULT_STROKE_LINE_CAP);
	const [strokeLineJoin, setStrokeLineJoin] = useState<PatternStrokeLineJoin>(DEFAULT_STROKE_LINE_JOIN);
	const [strokeMiterLimit, setStrokeMiterLimit] = useState(DEFAULT_STROKE_MITER_LIMIT);
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
	const isGrid = patternType === "grid";
	const normalizedStrokeDashArray = strokeDashArray.trim();

	const stroke = useMemo<PatternStrokeOptions>(
		() => ({
			style: strokeStyle,
			width: strokeWidth,
			dash: strokeDash,
			gap: strokeGap,
			dashArray: normalizedStrokeDashArray || undefined,
			dashOffset: strokeDashOffset,
			lineCap: strokeLineCap,
			lineJoin: strokeLineJoin,
			miterLimit: strokeMiterLimit,
		}),
		[
			strokeStyle,
			strokeWidth,
			strokeDash,
			strokeGap,
			normalizedStrokeDashArray,
			strokeDashOffset,
			strokeLineCap,
			strokeLineJoin,
			strokeMiterLimit,
		],
	);

	const config = useMemo(
		() => ({
			patternType,
			front,
			back,
			scale,
			stroke: isGrid ? stroke : undefined,
			opacity,
			blendMode,
			fill,
			position,
			shouldAnimate,
			direction,
			diagonal,
			duration,
		}),
		[
			patternType,
			front,
			back,
			scale,
			stroke,
			isGrid,
			opacity,
			blendMode,
			fill,
			position,
			shouldAnimate,
			direction,
			diagonal,
			duration,
		],
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
					stroke={isGrid ? stroke : undefined}
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
				{isGrid ? (
					<GUI.Section title="Grid stroke">
						<GUI.Select
							id="pattern-stroke-style"
							label="Style"
							description="Switch between solid and dashed grid strokes."
							value={strokeStyle}
							options={STROKE_STYLE_TYPES}
							onChange={(next) => setStrokeStyle(next as PatternStrokeStyle)}
						/>
						<GUI.Control
							id="pattern-stroke-width"
							label="Width"
							description="Stroke width for each grid line."
							value={strokeWidth}
							defaultValue={DEFAULT_STROKE_WIDTH}
							min={0.5}
							max={12}
							step={0.5}
							unit="px"
							onChange={setStrokeWidth}
						/>
						{strokeStyle === "dashed" ? (
							<>
								<GUI.Control
									id="pattern-stroke-dash"
									label="Dash"
									description="Dash segment length used when no custom dash array is set."
									value={strokeDash}
									defaultValue={DEFAULT_STROKE_DASH}
									min={1}
									max={80}
									step={1}
									unit="px"
									onChange={setStrokeDash}
								/>
								<GUI.Control
									id="pattern-stroke-gap"
									label="Gap"
									description="Gap length used when no custom dash array is set."
									value={strokeGap}
									defaultValue={DEFAULT_STROKE_GAP}
									min={1}
									max={80}
									step={1}
									unit="px"
									onChange={setStrokeGap}
								/>
								<GUI.TextInput
									id="pattern-stroke-dash-array"
									label="Dash array"
									description="Optional CSS stroke-dasharray value, such as 12 4 2 4."
									placeholder="dash gap ..."
									value={strokeDashArray}
									onChange={setStrokeDashArray}
								/>
								<GUI.Control
									id="pattern-stroke-dash-offset"
									label="Dash offset"
									description="CSS stroke-dashoffset for shifting the dash pattern."
									value={strokeDashOffset}
									defaultValue={DEFAULT_STROKE_DASH_OFFSET}
									min={0}
									max={80}
									step={1}
									unit="px"
									onChange={setStrokeDashOffset}
								/>
							</>
						) : null}
						<GUI.Select
							id="pattern-stroke-line-cap"
							label="Line cap"
							description="CSS stroke-linecap for dash ends."
							value={strokeLineCap}
							options={STROKE_LINE_CAP_TYPES}
							onChange={(next) => setStrokeLineCap(next as PatternStrokeLineCap)}
						/>
						<GUI.Select
							id="pattern-stroke-line-join"
							label="Line join"
							description="CSS stroke-linejoin for grid intersections."
							value={strokeLineJoin}
							options={STROKE_LINE_JOIN_TYPES}
							onChange={(next) => setStrokeLineJoin(next as PatternStrokeLineJoin)}
						/>
						<GUI.Control
							id="pattern-stroke-miter-limit"
							label="Miter limit"
							description="CSS stroke-miterlimit used when line join is miter."
							value={strokeMiterLimit}
							defaultValue={DEFAULT_STROKE_MITER_LIMIT}
							min={1}
							max={20}
							step={1}
							onChange={setStrokeMiterLimit}
						/>
					</GUI.Section>
				) : null}
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
