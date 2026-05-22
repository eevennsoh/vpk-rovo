"use client"

import { PreviewCard as PreviewCardPrimitive } from "@base-ui/react/preview-card"

import { cn } from "@/lib/utils"

type HoverCardProps = Omit<PreviewCardPrimitive.Root.Props, "openDelay" | "closeDelay"> & {
  openDelay?: number
  closeDelay?: number
}

function HoverCard({ openDelay, closeDelay, ...props }: HoverCardProps) {
  const Root = PreviewCardPrimitive.Root as React.ComponentType<HoverCardProps>
  return (
    <Root
      data-slot="hover-card"
      openDelay={openDelay}
      closeDelay={closeDelay}
      {...props}
    />
  )
}

function HoverCardTrigger(props: PreviewCardPrimitive.Trigger.Props) {
  return (
    <PreviewCardPrimitive.Trigger data-slot="hover-card-trigger" {...props} />
  )
}

function HoverCardContent({
  className,
  side = "bottom",
  sideOffset = 4,
  align = "center",
  alignOffset = 4,
  ...props
}: PreviewCardPrimitive.Popup.Props &
  Pick<
    PreviewCardPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset"
  >) {
  return (
    <PreviewCardPrimitive.Portal data-slot="hover-card-portal">
      <PreviewCardPrimitive.Positioner
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className="isolate z-50"
      >
        <PreviewCardPrimitive.Popup
          data-slot="hover-card-content"
          className={cn(
            "bg-popover text-popover-foreground w-64 rounded-lg p-2.5 text-sm shadow-xl z-50 origin-(--transform-origin) outline-hidden transition-[opacity,scale,translate] duration-fast ease-out data-starting-style:opacity-0 data-starting-style:scale-95 data-ending-style:opacity-0 data-ending-style:scale-95 data-[side=bottom]:data-starting-style:-translate-y-1 data-[side=top]:data-starting-style:translate-y-1 data-[side=left]:data-starting-style:translate-x-1 data-[side=right]:data-starting-style:-translate-x-1 data-[side=inline-start]:data-starting-style:translate-x-1 data-[side=inline-end]:data-starting-style:-translate-x-1 data-[side=bottom]:data-ending-style:-translate-y-1 data-[side=top]:data-ending-style:translate-y-1 data-[side=left]:data-ending-style:translate-x-1 data-[side=right]:data-ending-style:-translate-x-1 data-[side=inline-start]:data-ending-style:translate-x-1 data-[side=inline-end]:data-ending-style:-translate-x-1",
            className
          )}
          {...props}
        />
      </PreviewCardPrimitive.Positioner>
    </PreviewCardPrimitive.Portal>
  )
}

export { HoverCard, HoverCardTrigger, HoverCardContent }
