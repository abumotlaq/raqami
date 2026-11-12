type EmptyStateProps = {
  title: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  title,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <section>
      <p>{title}</p>
      {actionLabel && onAction ? (
        <button type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}
