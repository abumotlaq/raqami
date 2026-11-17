import { useCallback } from 'react'
import { Link } from 'react-router-dom'
import { DownloadButton } from '../components/library/DownloadButton'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useApiResource } from '../hooks/useApiResource'
import { getLibrary } from '../services/api'
import type { LibraryResponse } from '../types/api'

export function LibraryPage() {
  const { token } = useAuth()
  const loadLibrary = useCallback(() => getLibrary(token), [token])
  const { data, status, error, retry } =
    useApiResource<LibraryResponse>(loadLibrary)

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
  if (!data || data.data.length === 0) {
    return (
      <main className="space-y-md p-md">
        <h1 className="text-heading">Library</h1>
        <EmptyState title="Your library is empty." />
        <Link to="/">Browse products</Link>
      </main>
    )
  }

  return (
    <main className="space-y-md p-md">
      <h1 className="text-heading">Library</h1>
      <ul className="grid gap-md sm:grid-cols-2">
        {data.data.map(({ product, purchasedAt }) => (
          <li
            className="space-y-sm rounded-card border border-border bg-surface p-md"
            key={product.id}
          >
            <h2 className="text-subheading">{product.title}</h2>
            <p>
              Purchased{' '}
              <time dateTime={purchasedAt}>{purchasedAt}</time>
            </p>
            <DownloadButton productId={product.id} />
          </li>
        ))}
      </ul>
    </main>
  )
}
