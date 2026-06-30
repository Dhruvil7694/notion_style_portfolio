import type { ProjectChallenge } from "@/features/portfolio/lib/project-case-study"
import { CardSplitAccordion } from "@/shared/ui/card-split-accordion"

type ChallengeListProps = {
  items: ProjectChallenge[]
}

export function ChallengeList({ items }: ChallengeListProps) {
  if (items.length === 0) {
    return null
  }

  const accordionItems = items.map((item, index) => ({
    content: item.solution,
    id: `${item.challenge}-${index}`,
    title: item.challenge,
  }))

  return (
    <CardSplitAccordion
      className="case-study-challenges-accordion"
      items={accordionItems}
    />
  )
}
