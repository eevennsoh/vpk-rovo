"use client"

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

type TabsProps = TabsPrimitive.Root.Props

function Tabs({
	className,
	orientation = "horizontal",
	...props
}: Readonly<TabsProps>) {
	const isHorizontal = orientation === "horizontal"
	return (
		<TabsPrimitive.Root
			data-slot="tabs"
			data-orientation={orientation}
			{...(isHorizontal
				? { "data-horizontal": "" }
				: { "data-vertical": "" })}
			className={cn(
				"group/tabs flex data-horizontal:flex-col data-vertical:gap-2",
				className
			)}
			{...props}
		/>
	)
}

const tabsListVariants = cva(
	"group-data-horizontal/tabs:h-8 group/tabs-list text-text-subtle inline-flex w-fit items-center justify-center group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col",
	{
		variants: {
			variant: {
				default: "rounded-lg p-[3px] bg-muted",
				line: "gap-0 bg-transparent border-b border-border",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

interface TabsListProps
	extends TabsPrimitive.List.Props,
		VariantProps<typeof tabsListVariants> {}

function TabsList({
	className,
	variant = "default",
	...props
}: Readonly<TabsListProps>) {
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			data-variant={variant}
			className={cn(tabsListVariants({ variant }), className)}
			{...props}
		/>
	)
}

type TabsTriggerProps = TabsPrimitive.Tab.Props

function TabsTrigger({ className, ...props }: Readonly<TabsTriggerProps>) {
	return (
		<TabsPrimitive.Tab
			data-slot="tabs-trigger"
			className={cn(
				"gap-1.5 rounded-md border border-transparent px-3 py-0.5 text-sm font-medium [&_svg:not([class*='size-'])]:size-4 focus-visible:border-ring focus-visible:ring-ring/50 text-text-subtle relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center whitespace-nowrap transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start group-data-[variant=line]/tabs-list:h-full group-data-[variant=line]/tabs-list:rounded-none group-data-[variant=line]/tabs-list:border-0 focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-(--opacity-disabled) aria-disabled:pointer-events-none aria-disabled:opacity-(--opacity-disabled) [&_svg]:pointer-events-none [&_svg]:shrink-0",
				// Default (pill) variant states
				"group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=default]/tabs-list:hover:bg-bg-neutral-subtle-hovered group-data-[variant=default]/tabs-list:active:bg-bg-neutral-subtle-pressed group-data-[variant=default]/tabs-list:data-active:bg-surface group-data-[variant=default]/tabs-list:data-active:text-text",
				// Line variant states — selected uses blue text (ADS text.selected)
				"group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:hover:bg-bg-neutral-subtle-hovered group-data-[variant=line]/tabs-list:hover:rounded-md group-data-[variant=line]/tabs-list:active:bg-bg-neutral-subtle-pressed group-data-[variant=line]/tabs-list:active:rounded-md group-data-[variant=line]/tabs-list:data-active:bg-transparent group-data-[variant=line]/tabs-list:data-active:text-text-selected",
				// Selected indicator (underline for line variant)
				"after:content-[''] after:pointer-events-none after:bg-border-selected after:absolute after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:-bottom-px group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:right-0 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
				className
			)}
			{...props}
		/>
	)
}

type TabsContentProps = TabsPrimitive.Panel.Props

function TabsContent({ className, ...props }: Readonly<TabsContentProps>) {
	return (
		<TabsPrimitive.Panel
			data-slot="tabs-content"
			className={cn("text-sm flex-1 outline-none", className)}
			{...props}
		/>
	)
}

export {
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	tabsListVariants,
	type TabsProps,
	type TabsListProps,
	type TabsTriggerProps,
	type TabsContentProps,
}
