import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { getErrorMessage } from '../services/api'

export function LoginPage() {
  const { login, status, user } = useAuth()
  const [error, setError] = useState<string | null>(null)

  if (status !== 'ready') {
    return <Spinner />
  }
  if (user) {
    return <Navigate to="/" replace />
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    void login().catch((requestError: unknown) => {
      setError(getErrorMessage(requestError))
    })
  }

  return (
    <main>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <button type="submit">Log in</button>
      </form>
      {error ? <ErrorState message={error} /> : null}
    </main>
  )
}
