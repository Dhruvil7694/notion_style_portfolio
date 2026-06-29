type CharacterCounterProps = {
  value: string
  max: number
}

export function CharacterCounter({ value, max }: CharacterCounterProps) {
  const length = value.length
  const isNearLimit = length >= max * 0.85

  return (
    <p
      className={
        isNearLimit ? "text-amber-600 text-xs" : "text-muted-foreground text-xs"
      }
    >
      {length}/{max}
    </p>
  )
}
