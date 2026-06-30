"use client"

import { Collapsible as CollapsiblePrimitive } from "@base-ui/react/collapsible"
import { createContext, useContext, useId } from "react"

const CollapsiblePanelIdContext = createContext<string | undefined>(undefined)

function Collapsible({ ...props }: CollapsiblePrimitive.Root.Props) {
  const panelId = useId()

  return (
    <CollapsiblePanelIdContext.Provider value={panelId}>
      <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
    </CollapsiblePanelIdContext.Provider>
  )
}

function CollapsibleTrigger({ ...props }: CollapsiblePrimitive.Trigger.Props) {
  return (
    <CollapsiblePrimitive.Trigger data-slot="collapsible-trigger" {...props} />
  )
}

function CollapsibleContent({
  id,
  ...props
}: CollapsiblePrimitive.Panel.Props) {
  const contextPanelId = useContext(CollapsiblePanelIdContext)

  return (
    <CollapsiblePrimitive.Panel
      data-slot="collapsible-content"
      id={id ?? contextPanelId}
      {...props}
    />
  )
}

export { Collapsible, CollapsibleContent, CollapsibleTrigger }
