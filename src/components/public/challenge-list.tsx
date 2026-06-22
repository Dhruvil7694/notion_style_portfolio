import type { ProjectChallenge } from "@/lib/public/project-case-study"

type ChallengeListProps = {
  items: ProjectChallenge[]
}

export function ChallengeList({ items }: ChallengeListProps) {
  if (items.length === 0) {
    return null
  }

  return (
    <div className="case-study-challenges">
      {items.map((item, index) => (
        <article className="case-study-challenge" key={`${item.challenge}-${index}`}>
          <p className="case-study-challenge-problem">{item.challenge}</p>
          <p className="case-study-challenge-solution">{item.solution}</p>
        </article>
      ))}
    </div>
  )
}
