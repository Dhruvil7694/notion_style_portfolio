type PublicEmptyStateProps = {
  message: string
}

export function PublicEmptyState({ message }: PublicEmptyStateProps) {
  return <p className="kb-empty-message">{message}</p>
}
