"use client"

import { InteractivePortrait } from "@/features/home/components/interactive-portrait"

type AboutPortraitProps = {
  name: string
}

export function AboutPortrait({ name }: AboutPortraitProps) {
  return <InteractivePortrait name={name} />
}
