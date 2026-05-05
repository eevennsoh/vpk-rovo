"use client";

import { memo, useCallback, useMemo, useRef, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import LiquidGlass from "./shaders/liquid-glass";
import WaveGradient from "./shaders/wave-gradient";

const StableBackground = memo(function StableBackground() {
	return <WaveGradient className="absolute inset-0 h-full w-full" />;
});

const DEFAULT_WIDTH = 200;
const DEFAULT_HEIGHT = 400;
const DEFAULT_BORDER_RADIUS = 50;
const DEFAULT_BORDER_WIDTH = 0.05;
const DEFAULT_BRIGHTNESS = 50;
const DEFAULT_OPACITY = 0.93;
const DEFAULT_BLUR = 8;
const DEFAULT_DISPLACE = 5;
const DEFAULT_BG_OPACITY = 0;
const DEFAULT_SATURATION = 1;
const DEFAULT_DISTORTION_SCALE = -180;
const DEFAULT_DISPERSION = 0;
const DEFAULT_RED_OFFSET = 50;
const DEFAULT_GREEN_OFFSET = -1;
const DEFAULT_BLUE_OFFSET = -19;
const DEFAULT_BORDER_OPACITY = 0.35;

export default function LiquidGlassDemo() {
	const [width, setWidth] = useState(DEFAULT_WIDTH);
	const [height, setHeight] = useState(DEFAULT_HEIGHT);
	const [borderRadius, setBorderRadius] = useState(DEFAULT_BORDER_RADIUS);
	const [borderWidth, setBorderWidth] = useState(DEFAULT_BORDER_WIDTH);
	const [brightness, setBrightness] = useState(DEFAULT_BRIGHTNESS);
	const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
	const [blur, setBlur] = useState(DEFAULT_BLUR);
	const [displace, setDisplace] = useState(DEFAULT_DISPLACE);
	const [backgroundOpacity, setBackgroundOpacity] = useState(DEFAULT_BG_OPACITY);
	const [saturation, setSaturation] = useState(DEFAULT_SATURATION);
	const [distortionScale, setDistortionScale] = useState(DEFAULT_DISTORTION_SCALE);
	const [dispersion, setDispersion] = useState(DEFAULT_DISPERSION);
	const [redOffset, setRedOffset] = useState(DEFAULT_RED_OFFSET);
	const [greenOffset, setGreenOffset] = useState(DEFAULT_GREEN_OFFSET);
	const [blueOffset, setBlueOffset] = useState(DEFAULT_BLUE_OFFSET);
	const [borderOpacity, setBorderOpacity] = useState(DEFAULT_BORDER_OPACITY);

	const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
	const [position, setPosition] = useState({ x: 0, y: 0 });

	const onPointerDown = useCallback((e: React.PointerEvent) => {
		e.currentTarget.setPointerCapture(e.pointerId);
		dragRef.current = {
			startX: e.clientX,
			startY: e.clientY,
			originX: position.x,
			originY: position.y,
		};
	}, [position]);

	const onPointerMove = useCallback((e: React.PointerEvent) => {
		if (!dragRef.current) return;
		setPosition({
			x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
			y: dragRef.current.originY + (e.clientY - dragRef.current.startY),
		});
	}, []);

	const onPointerUp = useCallback(() => {
		dragRef.current = null;
	}, []);

	const config = useMemo(
		() => ({
			width,
			height,
			borderRadius,
			borderWidth,
			brightness,
			opacity,
			blur,
			displace,
			backgroundOpacity,
			saturation,
			distortionScale,
			dispersion,
			redOffset,
			greenOffset,
			blueOffset,
			borderOpacity,
		}),
		[backgroundOpacity, blueOffset, blur, borderOpacity, borderRadius, borderWidth, brightness, displace, dispersion, distortionScale, greenOffset, height, opacity, redOffset, saturation, width],
	);

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
						minHeight: 420,
						height: "min(72vh, 560px)",
					}}
				>
					<div className="absolute inset-0 flex items-center justify-center">
						<div className="relative h-3/4 w-3/4 overflow-hidden rounded-2xl">
							<StableBackground />
						</div>
					</div>
					<div
						className="absolute z-10 cursor-grab select-none active:cursor-grabbing"
						style={{
							left: `calc(50% - ${width / 2}px + ${position.x}px)`,
							top: `calc(50% - ${height / 2}px + ${position.y}px)`,
							touchAction: "none",
						}}
						onPointerDown={onPointerDown}
						onPointerMove={onPointerMove}
						onPointerUp={onPointerUp}
						onPointerCancel={onPointerUp}
					>
						<LiquidGlass
							width={width}
							height={height}
							borderRadius={borderRadius}
							borderWidth={borderWidth}
							brightness={brightness}
							opacity={opacity}
							blur={blur}
							displace={displace}
							backgroundOpacity={backgroundOpacity}
							saturation={saturation}
							distortionScale={distortionScale}
							dispersion={dispersion}
							redOffset={redOffset}
							greenOffset={greenOffset}
							blueOffset={blueOffset}
							xChannel="R"
							yChannel="G"
							borderOpacity={borderOpacity}
						/>
					</div>
				</div>
			</div>

			<GUI.Panel title="Glass controls" values={config}>
				<GUI.Control
					id="lg-width"
					label="Width"
					value={width}
					defaultValue={DEFAULT_WIDTH}
					min={80}
					max={400}
					step={1}
					unit="px"
					onChange={setWidth}
				/>
				<GUI.Control
					id="lg-height"
					label="Height"
					value={height}
					defaultValue={DEFAULT_HEIGHT}
					min={80}
					max={600}
					step={1}
					unit="px"
					onChange={setHeight}
				/>
				<GUI.Control
					id="lg-border-radius"
					label="Radius"
					value={borderRadius}
					defaultValue={DEFAULT_BORDER_RADIUS}
					min={0}
					max={200}
					step={1}
					unit="px"
					onChange={setBorderRadius}
				/>
				<GUI.Control
					id="lg-distortion-scale"
					label="Distortion scale"
					value={distortionScale}
					defaultValue={DEFAULT_DISTORTION_SCALE}
					min={-360}
					max={360}
					step={1}
					onChange={setDistortionScale}
				/>
				<GUI.Control
					id="lg-dispersion"
					label="Dispersion"
					value={dispersion}
					defaultValue={DEFAULT_DISPERSION}
					min={0}
					max={100}
					step={1}
					onChange={setDispersion}
				/>
				<GUI.Control
					id="lg-chromatic-offset-r"
					label="Red offset"
					value={redOffset}
					defaultValue={DEFAULT_RED_OFFSET}
					min={-50}
					max={50}
					step={1}
					onChange={setRedOffset}
				/>
				<GUI.Control
					id="lg-chromatic-offset-g"
					label="Green offset"
					value={greenOffset}
					defaultValue={DEFAULT_GREEN_OFFSET}
					min={-50}
					max={50}
					step={1}
					onChange={setGreenOffset}
				/>
				<GUI.Control
					id="lg-chromatic-offset-b"
					label="Blue offset"
					value={blueOffset}
					defaultValue={DEFAULT_BLUE_OFFSET}
					min={-50}
					max={50}
					step={1}
					onChange={setBlueOffset}
				/>
				<GUI.Control
					id="lg-border-width"
					label="Border width"
					value={borderWidth}
					defaultValue={DEFAULT_BORDER_WIDTH}
					min={0}
					max={0.5}
					step={0.01}
					onChange={setBorderWidth}
				/>
				<GUI.Control
					id="lg-brightness"
					label="Brightness"
					value={brightness}
					defaultValue={DEFAULT_BRIGHTNESS}
					min={0}
					max={100}
					step={1}
					onChange={setBrightness}
				/>
				<GUI.Control
					id="lg-opacity"
					label="Opacity"
					value={opacity}
					defaultValue={DEFAULT_OPACITY}
					min={0}
					max={1}
					step={0.01}
					onChange={setOpacity}
				/>
				<GUI.Control
					id="lg-blur"
					label="Blur"
					value={blur}
					defaultValue={DEFAULT_BLUR}
					min={0}
					max={30}
					step={0.1}
					unit="px"
					onChange={setBlur}
				/>
				<GUI.Control
					id="lg-displace"
					label="Displace"
					value={displace}
					defaultValue={DEFAULT_DISPLACE}
					min={0}
					max={100}
					step={0.1}
					onChange={setDisplace}
				/>
				<GUI.Control
					id="lg-bg-opacity"
					label="Frost"
					value={backgroundOpacity}
					defaultValue={DEFAULT_BG_OPACITY}
					min={0}
					max={1}
					step={0.01}
					onChange={setBackgroundOpacity}
				/>
				<GUI.Control
					id="lg-saturation"
					label="Saturation"
					value={saturation}
					defaultValue={DEFAULT_SATURATION}
					min={0}
					max={3}
					step={0.1}
					onChange={setSaturation}
				/>
				<GUI.Control
					id="lg-border-opacity"
					label="Border opacity"
					value={borderOpacity}
					defaultValue={DEFAULT_BORDER_OPACITY}
					min={0}
					max={1}
					step={0.01}
					onChange={setBorderOpacity}
				/>
			</GUI.Panel>
		</div>
	);
}
