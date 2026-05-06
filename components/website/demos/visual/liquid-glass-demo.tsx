"use client";

import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";

import { GUI } from "@/components/utils/gui";
import { token } from "@/lib/tokens";

import LiquidGlass, { type LiquidGlassPointerInput } from "./shaders/liquid-glass";
import { LiquidGlassButton } from "./shaders/liquid-glass-button";
import WaveGradient from "./shaders/wave-gradient";

const StableBackground = memo(function StableBackground() {
	return <WaveGradient className="absolute inset-0 h-full w-full" />;
});

const DEFAULT_WIDTH = 300;
const DEFAULT_HEIGHT = 190;
const DEFAULT_BORDER_RADIUS = 32;
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
const DEFAULT_POINTER_LAYERS = true;
const DEFAULT_POINTER_CONTAINER_TRACKING = true;
const DEFAULT_POINTER_ACTIVATION_RADIUS = 180;
const DEFAULT_BUTTON_ELASTICITY = 0.35;
const DEFAULT_BUTTON_MAGNET_DISTANCE = 10;
const DEFAULT_BUTTON_HOVER_AREA = 24;
const DEFAULT_BUTTON_PRESS_SCALE = 0.92;

type DragTarget = "surface" | "button";

interface DragPosition {
	x: number;
	y: number;
}

interface DragState extends DragPosition {
	target: DragTarget;
	startX: number;
	startY: number;
}

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
	const [pointerLayers, setPointerLayers] = useState(DEFAULT_POINTER_LAYERS);
	const [pointerContainerTracking, setPointerContainerTracking] = useState(
		DEFAULT_POINTER_CONTAINER_TRACKING,
	);
	const [pointerActivationRadius, setPointerActivationRadius] = useState(
		DEFAULT_POINTER_ACTIVATION_RADIUS,
	);
	const [buttonElasticity, setButtonElasticity] = useState(DEFAULT_BUTTON_ELASTICITY);
	const [buttonMagnetDistance, setButtonMagnetDistance] = useState(
		DEFAULT_BUTTON_MAGNET_DISTANCE,
	);
	const [buttonHoverArea, setButtonHoverArea] = useState(DEFAULT_BUTTON_HOVER_AREA);
	const [buttonPressScale, setButtonPressScale] = useState(DEFAULT_BUTTON_PRESS_SCALE);
	const [surfacePosition, setSurfacePosition] = useState<DragPosition>({
		x: -90,
		y: 0,
	});
	const [buttonPosition, setButtonPosition] = useState<DragPosition>({
		x: 190,
		y: 0,
	});
	const [surfacePointerInput, setSurfacePointerInput] =
		useState<LiquidGlassPointerInput | null>(null);

	const previewRef = useRef<HTMLDivElement>(null);
	const surfaceRef = useRef<HTMLDivElement>(null);
	const dragRef = useRef<DragState | null>(null);
	const lastClientPointerRef = useRef<DragPosition | null>(null);

	const getSurfacePointerInput = useCallback((
		clientX: number,
		clientY: number,
	): LiquidGlassPointerInput | null => {
		const activeElement = pointerContainerTracking
			? previewRef.current
			: surfaceRef.current;
		if (!activeElement) return null;
		const rect = activeElement.getBoundingClientRect();
		return {
			kind: "client",
			x: clientX,
			y: clientY,
			active:
				clientX >= rect.left &&
				clientX <= rect.right &&
				clientY >= rect.top &&
				clientY <= rect.bottom,
		};
	}, [pointerContainerTracking]);

	const startDrag = useCallback((
		target: DragTarget,
		event: React.PointerEvent<HTMLElement>,
	) => {
		event.currentTarget.setPointerCapture(event.pointerId);
		const origin = target === "surface" ? surfacePosition : buttonPosition;
		dragRef.current = {
			target,
			startX: event.clientX,
			startY: event.clientY,
			x: origin.x,
			y: origin.y,
		};
	}, [buttonPosition, surfacePosition]);

	const moveDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
		const drag = dragRef.current;
		if (!drag) return;
		const nextPosition = {
			x: drag.x + event.clientX - drag.startX,
			y: drag.y + event.clientY - drag.startY,
		};
		if (drag.target === "surface") {
			setSurfacePosition(nextPosition);
		} else {
			setButtonPosition(nextPosition);
		}
	}, []);

	const stopDrag = useCallback(() => {
		dragRef.current = null;
	}, []);

	const handlePointerLayersChange = useCallback((nextPointerLayers: boolean) => {
		setPointerLayers(nextPointerLayers);
		if (!nextPointerLayers) {
			setPointerContainerTracking(false);
		}
	}, []);

	useEffect(() => {
		const deactivateSurfacePointer = () => {
			const previous = lastClientPointerRef.current;
			setSurfacePointerInput(
				previous
					? {
							kind: "client",
							x: previous.x,
							y: previous.y,
							active: false,
						}
					: null,
			);
		};
		const handlePointerMove = (event: PointerEvent) => {
			lastClientPointerRef.current = {
				x: event.clientX,
				y: event.clientY,
			};
			if (pointerLayers) {
				setSurfacePointerInput(getSurfacePointerInput(event.clientX, event.clientY));
			}
		};

		window.addEventListener("pointermove", handlePointerMove, { passive: true });
		window.addEventListener("pointercancel", deactivateSurfacePointer);
		window.addEventListener("blur", deactivateSurfacePointer);
		return () => {
			window.removeEventListener("pointermove", handlePointerMove);
			window.removeEventListener("pointercancel", deactivateSurfacePointer);
			window.removeEventListener("blur", deactivateSurfacePointer);
		};
	}, [getSurfacePointerInput, pointerLayers]);

	useEffect(() => {
		if (!pointerLayers) {
			setSurfacePointerInput(null);
			return;
		}
		const lastClientPointer = lastClientPointerRef.current;
		setSurfacePointerInput(
			lastClientPointer
				? getSurfacePointerInput(lastClientPointer.x, lastClientPointer.y)
				: null,
		);
	}, [getSurfacePointerInput, pointerLayers]);

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
			pointerLayers,
			pointerContainerTracking,
			pointerActivationRadius,
			buttonElasticity,
			buttonMagnetDistance,
			buttonHoverArea,
			buttonPressScale,
		}),
		[backgroundOpacity, blueOffset, blur, borderOpacity, borderRadius, borderWidth, brightness, buttonElasticity, buttonHoverArea, buttonMagnetDistance, buttonPressScale, displace, dispersion, distortionScale, greenOffset, height, opacity, pointerActivationRadius, pointerContainerTracking, pointerLayers, redOffset, saturation, width],
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
					ref={previewRef}
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
						ref={surfaceRef}
						className="absolute z-10 cursor-grab select-none active:cursor-grabbing"
						style={{
							left: `calc(50% - ${width / 2}px + ${surfacePosition.x}px)`,
							top: `calc(50% - ${height / 2}px + ${surfacePosition.y}px)`,
							touchAction: "none",
						}}
						onPointerDown={(event) => startDrag("surface", event)}
						onPointerMove={moveDrag}
						onPointerUp={stopDrag}
						onPointerCancel={stopDrag}
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
							pointerLayers={pointerLayers}
							pointerInput={pointerLayers ? surfacePointerInput : null}
							pointerActivationRadius={pointerActivationRadius}
						/>
					</div>
					<div
						className="absolute z-20 w-max cursor-grab select-none active:cursor-grabbing"
						style={{
							left: `calc(50% + ${buttonPosition.x}px)`,
							top: `calc(50% + ${buttonPosition.y}px)`,
							transform: "translate(-50%, -50%)",
							touchAction: "none",
						}}
					>
						<LiquidGlassButton
							aria-label="Interactive glass button"
							elasticity={buttonElasticity}
							magnetDistance={buttonMagnetDistance}
							hoverArea={buttonHoverArea}
							pressScale={buttonPressScale}
							className="w-28"
							onPointerDown={(event) => startDrag("button", event)}
							onPointerMove={moveDrag}
							onPointerUp={stopDrag}
							onPointerCancel={stopDrag}
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
				<GUI.Section title="Pointer layers">
					<GUI.Toggle
						id="lg-pointer-layers"
						label="Advanced edge layer"
						description="Adds an opt-in token-colored edge sheen without moving the glass surface."
						checked={pointerLayers}
						onChange={handlePointerLayersChange}
					/>
					<GUI.Toggle
						id="lg-pointer-container-tracking"
						label="Stage tracking"
						description={
							pointerLayers
								? "Tracks pointer movement over the whole preview stage instead of only the glass card."
								: "Requires Advanced edge layer because it only changes where the edge sheen reads pointer input."
						}
						checked={pointerLayers && pointerContainerTracking}
						disabled={!pointerLayers}
						onChange={setPointerContainerTracking}
					/>
					<GUI.Control
						id="lg-pointer-activation-radius"
						label="Pointer radius"
						value={pointerActivationRadius}
						defaultValue={DEFAULT_POINTER_ACTIVATION_RADIUS}
						min={0}
						max={360}
						step={1}
						unit="px"
						onChange={setPointerActivationRadius}
					/>
				</GUI.Section>
				<GUI.Section title="Button controls">
					<GUI.Control
						id="lg-button-elasticity"
						label="Elasticity"
						value={buttonElasticity}
						defaultValue={DEFAULT_BUTTON_ELASTICITY}
						min={0}
						max={1}
						step={0.01}
						onChange={setButtonElasticity}
					/>
					<GUI.Control
						id="lg-button-magnet-distance"
						label="Magnet distance"
						value={buttonMagnetDistance}
						defaultValue={DEFAULT_BUTTON_MAGNET_DISTANCE}
						min={0}
						max={40}
						step={1}
						unit="px"
						onChange={setButtonMagnetDistance}
					/>
					<GUI.Control
						id="lg-button-hover-area"
						label="Hover area"
						value={buttonHoverArea}
						defaultValue={DEFAULT_BUTTON_HOVER_AREA}
						min={0}
						max={96}
						step={1}
						unit="px"
						onChange={setButtonHoverArea}
					/>
					<GUI.Control
						id="lg-button-press-scale"
						label="Press scale"
						value={buttonPressScale}
						defaultValue={DEFAULT_BUTTON_PRESS_SCALE}
						min={0.75}
						max={1}
						step={0.01}
						onChange={setButtonPressScale}
					/>
				</GUI.Section>
			</GUI.Panel>
		</div>
	);
}
