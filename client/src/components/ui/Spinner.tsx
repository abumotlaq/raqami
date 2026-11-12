type SpinnerProps = {
  label?: string
}

export function Spinner({ label = 'Loading' }: SpinnerProps) {
  return (
    <span role="status" aria-live="polite">
      {label}
    </span>
  )
}
