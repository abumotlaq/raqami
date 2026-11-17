import { useCallback, useState } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Pagination } from '../components/ui/Pagination'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useApiResource } from '../hooks/useApiResource'
import { getOrders } from '../services/api'
import type { Order, Paginated } from '../types/api'

export function OrdersPage() {
  const { token } = useAuth()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const loadOrders = useCallback(
    () => getOrders({ page, per_page: perPage }, token),
    [page, perPage, token],
  )
  const { data, status, error, retry } =
    useApiResource<Paginated<Order>>(loadOrders)

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
    return (
      <main className="space-y-md p-md">
        <h1 className="text-heading">Orders</h1>
        <EmptyState title="No orders are available." />
        {data ? (
          <Pagination
            meta={data.meta}
            onPageChange={setPage}
            onPerPageChange={(value) => {
              setPerPage(value)
              setPage(1)
            }}
          />
        ) : null}
      </main>
    )
  }

  return (
    <main className="space-y-md p-md">
      <h1 className="text-heading">Orders</h1>
      <ul className="grid gap-md">
        {data.data.map((order) => (
          <li
            className="space-y-sm rounded-card border border-border bg-surface p-md"
            key={order.id}
          >
            <h2 className="text-subheading">Order {order.id}</h2>
            <p>Status: {order.status}</p>
            <p>Total: {Number(order.total).toFixed(2)}</p>
            <time dateTime={order.createdAt}>{order.createdAt}</time>
            <ul className="grid gap-sm">
              {order.items.map((item) => (
                <li key={item.productId}>
                  {item.title} — {Number(item.unitPrice).toFixed(2)}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      <Pagination
        meta={data.meta}
        onPageChange={setPage}
        onPerPageChange={(value) => {
          setPerPage(value)
          setPage(1)
        }}
      />
    </main>
  )
}
