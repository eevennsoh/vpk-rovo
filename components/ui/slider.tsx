"use client";

import * as React from "react";
import { Slider as SliderPrimitive } from "@base-ui/react/slider";

import { cn } from "@/lib/utils";

export type SliderProps = SliderPrimitive.Root.Props;

function Slider({ className, defaultValue, value, min = 0, max = 100, ...props }: Readonly<SliderProps>) {
	const values = React.useMemo(() => {
		if (Array.isArray(value)) return value;
		if (typeof value === "number") return [value];
		if (Array.isArray(defaultValue)) return defaultValue;
		if (typeof defaultValue === "number") return [defaultValue];
		return [min];
	}, [value, defaultValue, min]);

	return (
		<SliderPrimitive.Root
			className={cn("w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-auto", className)}
			data-slot="slider"
			defaultValue={defaultValue}
			value={value}
			min={min}
			max={max}
			thumbAlignment="edge"
			{...props}
		>
			<SliderPrimitive.Control className="relative flex w-full cursor-pointer touch-none items-center select-none before:pointer-events-none before:absolute before:top-1/2 before:start-0 before:size-1 before:-translate-y-1/2 before:rounded-full before:bg-bg-neutral-bold-pressed after:pointer-events-none after:absolute after:top-1/2 after:end-0 after:size-1 after:-translate-y-1/2 after:rounded-full after:bg-bg-neutral-bold-pressed data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-disabled data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-40 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col data-[orientation=vertical]:before:top-auto data-[orientation=vertical]:before:bottom-0 data-[orientation=vertical]:before:start-1/2 data-[orientation=vertical]:before:-translate-x-1/2 data-[orientation=vertical]:before:translate-y-0 data-[orientation=vertical]:after:top-0 data-[orientation=vertical]:after:end-auto data-[orientation=vertical]:after:start-1/2 data-[orientation=vertical]:after:-translate-x-1/2 data-[orientation=vertical]:after:translate-y-0">
				<SliderPrimitive.Track
					data-slot="slider-track"
					className="bg-bg-neutral rounded-full relative grow overflow-hidden select-none data-[orientation=horizontal]:h-1.5 data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-1.5"
				>
					<SliderPrimitive.Indicator data-slot="slider-range" className="bg-bg-neutral-bold select-none data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full" />
				</SliderPrimitive.Track>
				{Array.from({ length: values.length }, (_, index) => (
					<SliderPrimitive.Thumb
						data-slot="slider-thumb"
						key={index}
						className="relative z-10 block size-4 shrink-0 cursor-pointer select-none rounded-full bg-bg-neutral-bold outline-2 outline-offset-2 outline-transparent transition-[background-color,outline-color] duration-medium ease-in-out after:absolute after:-inset-3 hover:bg-bg-neutral-bold-hovered active:bg-bg-neutral-bold-pressed focus-visible:outline-ring disabled:pointer-events-none disabled:bg-bg-disabled"
					/>
				))}
			</SliderPrimitive.Control>
		</SliderPrimitive.Root>
	);
}

export { Slider };
