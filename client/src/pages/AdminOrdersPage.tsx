import { useCallback } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useApiResource } from '../hooks/useApiResource'
import { getAdminOrders } from '../services/api'

export function AdminOrdersPage() {
  const { token } = useAuth()
  const loadOrders = useCallback(() => getAdminOrders(token), [token])
  const { status, error, retry } = useApiResource(loadOrders)

  if (status === 'loading') {
    return <Spinner />
  }
  if (status === 'error') {
    return (
      <ErrorState
        message={error ?? 'Unable to load admin orders.'}
        onRetry={retry}
      />
    )
  }

  return (
    <main>
      <h1>Admin orders</h1>
      <p role="status">PENDING_CONTRACT: Admin order pagination and item fields are not defined.</p>
      <EmptyState title="Order records are unavailable until the response contract is confirmed." />
    </main>
  )
}
