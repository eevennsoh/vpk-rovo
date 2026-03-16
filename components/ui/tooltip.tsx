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
						"data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 data-[side=bottom]:slide-in-from-top-1 data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1 data-[side=top]:slide-in-from-bottom-1 data-[side=inline-start]:slide-in-from-right-1 data-[side=inline-end]:slide-in-from-left-1 w-fit max-w-xs rounded-md bg-bg-neutral-bold px-3 py-1.5 text-xs text-text-inverse shadow-md outline-hidden origin-(--transform-origin) duration-fast ease-out",
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
