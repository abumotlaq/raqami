import { useCallback } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useApiResource } from '../hooks/useApiResource'
import { getLibrary } from '../services/api'

export function LibraryPage() {
  const { token } = useAuth()
  const loadLibrary = useCallback(() => getLibrary(token), [token])
  const { status, error, retry } = useApiResource(loadLibrary)

  if (status === 'loading') {
    return <Spinner />
  }
  if (status === 'error') {
    return (
      <ErrorState
        message={error ?? 'Unable to load the library.'}
        onRetry={retry}
      />
    )
  }

  return (
    <main>
      <h1>Library</h1>
      <p role="status">PENDING_CONTRACT: Library items cannot be displayed until the GET /library item shape is confirmed.</p>
      <EmptyState title="Library items are unavailable until the API contract is confirmed." />
    </main>
  )
}
