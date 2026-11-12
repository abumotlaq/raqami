import { useCallback } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useApiResource } from '../hooks/useApiResource'
import { getAdminProducts } from '../services/api'

export function AdminProductsPage() {
  const { token } = useAuth()
  const loadProducts = useCallback(() => getAdminProducts(token), [token])
  const { status, error, retry } = useApiResource(loadProducts)

  if (status === 'loading') {
    return <Spinner />
  }
  if (status === 'error') {
    return (
      <ErrorState
        message={error ?? 'Unable to load admin products.'}
        onRetry={retry}
      />
    )
  }

  return (
    <main>
      <h1>Admin products</h1>
      <p role="status">PENDING_CONTRACT: Admin product response shape is not defined.</p>
      <EmptyState title="Product records and forms are unavailable until their API contracts are confirmed." />
    </main>
  )
}
