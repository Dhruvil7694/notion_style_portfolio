type KeyTakeawaysListProps = {
  items: string[]
  title?: string
}

export function KeyTakeawaysList({
  items,
  title = "Key Takeaways",
}: KeyTakeawaysListProps) {
  const takeaways = items.filter(Boolean)

  if (takeaways.length === 0) {
    return null
  }

  return (
    <section className="knowledge-takeaways">
      {title ? <h2 className="knowledge-section-title">{title}</h2> : null}
      <ul className="knowledge-takeaways-list">
        {takeaways.map((item) => (
          <li className="knowledge-takeaways-item" key={item}>
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}
