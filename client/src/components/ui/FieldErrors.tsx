interface FieldErrorsProps {
  messages?: string[]
}

export function FieldErrors({ messages }: FieldErrorsProps) {
  if (!messages?.length) return null

  return (
    <ul role="alert" className="text-caption">
      {messages.map((message, index) => (
        <li key={`${message}-${index}`}>{message}</li>
      ))}
    </ul>
  )
}
