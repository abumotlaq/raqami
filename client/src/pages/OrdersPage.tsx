import { useCallback } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useApiResource } from '../hooks/useApiResource'
import { getOrders } from '../services/api'
import type { Order, OrderStatus, Paginated } from '../types/api'

type OrderSummary = Pick<Order, 'id' | 'status' | 'total' | 'createdAt'>

function isOrderStatus(value: unknown): value is OrderStatus {
  return value === 'pending' || value === 'paid' || value === 'failed'
}

function isOrderSummary(value: unknown): value is OrderSummary {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false
  }
  const record = value as Record<string, unknown>
  return (
    typeof record.id === 'string' &&
    isOrderStatus(record.status) &&
    typeof record.total === 'string' &&
    typeof record.createdAt === 'string'
  )
}

export function OrdersPage() {
  const { token } = useAuth()
  const loadOrders = useCallback(() => getOrders(token), [token])
  const { data, status, error, retry } =
    useApiResource<Paginated<unknown>>(loadOrders)

  if (status === 'loading') {
    return <Spinner />
  }
  if (status === 'error') {
    return (
      <ErrorState
        message={error ?? 'Unable to load orders.'}
        onRetry={retry}
      />
    )
  }

  if (!data || data.data.length === 0) {
    return <EmptyState title="No orders are available." />
  }

  const orders = data.data.filter(isOrderSummary)
  if (orders.length !== data.data.length) {
    return (
      <ErrorState
        message="The server returned an order without all confirmed fields."
        onRetry={retry}
      />
    )
  }

  return (
    <main>
      <h1>Orders</h1>
      <ul>
        {orders.map((order) => (
          <li key={order.id}>
            <p>{order.id}</p>
            <p>{order.status}</p>
            <p>{Number(order.total).toFixed(2)}</p>
            <time dateTime={order.createdAt}>{order.createdAt}</time>
          </li>
        ))}
      </ul>
    </main>
  )
}
