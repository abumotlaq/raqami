import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { FieldErrors as FieldErrorsList } from '../components/ui/FieldErrors'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { ApiResponseError, getErrorMessage } from '../services/api'
import type { FieldErrors, RegisterRequestBody } from '../types/api'

export function RegisterPage() {
  const { register, status, user } = useAuth()
  const location = useLocation()
  const [values, setValues] = useState<RegisterRequestBody>({
    name: '',
    email: '',
    password: '',
  })
  const [message, setMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)

  if (status !== 'ready') {
    return <Spinner />
  }
  if (user) {
    return <Navigate to="/" replace state={location.state} />
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    setFieldErrors(null)
    try {
      await register(values)
    } catch (requestError: unknown) {
      setMessage(getErrorMessage(requestError))
      if (requestError instanceof ApiResponseError) {
        setFieldErrors(requestError.errors)
      }
    }
  }

  return (
    <main className="space-y-md p-md">
      <h1 className="text-heading">Create an account</h1>
      {message ? <ErrorState message={message} /> : null}
      <form className="grid gap-md" onSubmit={handleSubmit}>
        <label className="grid gap-xs">
          Name
          <input
            autoComplete="name"
            className="rounded-control border border-border bg-surface px-md py-sm"
            name="name"
            required
            value={values.name}
            onChange={(event) =>
              setValues((current) => ({ ...current, name: event.target.value }))
            }
          />
          <FieldErrorsList messages={fieldErrors?.name} />
        </label>
        <label className="grid gap-xs">
          Email
          <input
            autoComplete="email"
            className="rounded-control border border-border bg-surface px-md py-sm"
            name="email"
            type="email"
            required
            value={values.email}
            onChange={(event) =>
              setValues((current) => ({ ...current, email: event.target.value }))
            }
          />
          <FieldErrorsList messages={fieldErrors?.email} />
        </label>
        <label className="grid gap-xs">
          Password
          <input
            autoComplete="new-password"
            className="rounded-control border border-border bg-surface px-md py-sm"
            name="password"
            type="password"
            minLength={8}
            required
            value={values.password}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                password: event.target.value,
              }))
            }
          />
          <FieldErrorsList messages={fieldErrors?.password} />
        </label>
        <button
          className="rounded-control bg-primary px-md py-sm text-primary-foreground"
          type="submit"
        >
          Register
        </button>
      </form>
      <p>
        <Link to="/login">Log in</Link>
      </p>
    </main>
  )
}
