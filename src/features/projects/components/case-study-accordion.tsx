"use client"

import { createContext, type ReactNode, useContext, useState } from "react"

type CaseStudyAccordionContextValue = {
  openIndex: number | null
  setOpenIndex: (index: number | null) => void
}

const CaseStudyAccordionContext =
  createContext<CaseStudyAccordionContextValue | null>(null)

export function useCaseStudyAccordion() {
  return useContext(CaseStudyAccordionContext)
}

type CaseStudyAccordionProps = {
  children: ReactNode
  defaultOpenIndex?: number | null
}

export function CaseStudyAccordion({
  children,
  defaultOpenIndex = 0,
}: CaseStudyAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(defaultOpenIndex)

  return (
    <CaseStudyAccordionContext.Provider value={{ openIndex, setOpenIndex }}>
      <div className="project-case-study-sections">{children}</div>
    </CaseStudyAccordionContext.Provider>
  )
}
