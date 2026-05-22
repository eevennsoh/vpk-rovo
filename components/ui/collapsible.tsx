"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"

function Collapsible(props: CollapsiblePrimitive.Root.Props) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

type CollapsibleTriggerProps = Omit<CollapsiblePrimitive.Trigger.Props, "render"> & {
  render?: React.ReactElement
}

function CollapsibleTrigger({ render, ...props }: CollapsibleTriggerProps) {
  const Trigger = CollapsiblePrimitive.Trigger as React.ComponentType<CollapsibleTriggerProps>
  return (
    <Trigger data-slot="collapsible-trigger" suppressHydrationWarning render={render} {...props} />
  )
}

type CollapsibleContentProps = Omit<CollapsiblePrimitive.Panel.Props, "render"> & {
  render?: React.ReactElement
}

function CollapsibleContent({ render, hiddenUntilFound = true, ...props }: CollapsibleContentProps) {
  const Panel = CollapsiblePrimitive.Panel as React.ComponentType<CollapsibleContentProps>
  return (
    <Panel
      data-slot="collapsible-content"
      suppressHydrationWarning
      hiddenUntilFound={hiddenUntilFound}
      render={render}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
