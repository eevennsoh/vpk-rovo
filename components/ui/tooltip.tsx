"use client"

import { Tooltip as TooltipPrimitive } from "@base-ui/react/tooltip"

import { cn } from "@/lib/utils"

type TooltipProviderProps = TooltipPrimitive.Provider.Props & {
	delay?: number
}

function TooltipProvider({
	delay = 0,
	...props
}: Readonly<TooltipProviderProps>) {
	return (
		<TooltipPrimitive.Provider
			data-slot="tooltip-provider"
			delay={delay}
			{...props}
		/>
	)
}

type TooltipProps = TooltipPrimitive.Root.Props

function Tooltip(props: Readonly<TooltipProps>) {
	return <TooltipPrimitive.Root data-slot="tooltip" {...props} />
}

type TooltipTriggerProps = TooltipPrimitive.Trigger.Props

function TooltipTrigger(props: Readonly<TooltipTriggerProps>) {
	return (
		<TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
	)
}

interface TooltipContentProps
	extends TooltipPrimitive.Popup.Props,
		Pick<
			TooltipPrimitive.Positioner.Props,
			"align" | "alignOffset" | "side" | "sideOffset"
		> {}

function TooltipContent({
	className,
	side = "top",
	sideOffset = 4,
	align = "center",
	alignOffset = 0,
	children,
	...props
}: Readonly<TooltipContentProps>) {
	return (
		<TooltipPrimitive.Portal>
			<TooltipPrimitive.Positioner
				align={align}
				alignOffset={alignOffset}
				side={side}
				sideOffset={sideOffset}
				className="isolate z-50"
			>
				<TooltipPrimitive.Popup
					data-slot="tooltip-content"
					className={cn(
						"w-fit max-w-xs rounded-md bg-bg-neutral-bold px-3 py-1.5 text-xs text-text-inverse shadow-md outline-hidden origin-(--transform-origin) transition-[opacity,scale,translate] duration-fast ease-out data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95 data-[side=bottom]:data-starting-style:-translate-y-0.5 data-[side=top]:data-starting-style:translate-y-0.5 data-[side=left]:data-starting-style:translate-x-0.5 data-[side=right]:data-starting-style:-translate-x-0.5 data-[side=inline-start]:data-starting-style:translate-x-0.5 data-[side=inline-end]:data-starting-style:-translate-x-0.5 data-[side=bottom]:data-ending-style:-translate-y-0.5 data-[side=top]:data-ending-style:translate-y-0.5 data-[side=left]:data-ending-style:translate-x-0.5 data-[side=right]:data-ending-style:-translate-x-0.5 data-[side=inline-start]:data-ending-style:translate-x-0.5 data-[side=inline-end]:data-ending-style:-translate-x-0.5",
						className
					)}
					{...props}
				>
					{children}
				</TooltipPrimitive.Popup>
			</TooltipPrimitive.Positioner>
		</TooltipPrimitive.Portal>
	)
}

export {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
	TooltipProvider,
	type TooltipProps,
	type TooltipTriggerProps,
	type TooltipContentProps,
	type TooltipProviderProps,
}
