import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Pagination } from '../components/ui/Pagination'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useApiResource } from '../hooks/useApiResource'
import { getAdminOrders } from '../services/api'
import type { AdminOrder, Paginated } from '../types/api'

export function AdminOrdersPage() {
  const { token } = useAuth()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const loadOrders = useCallback(
    () => getAdminOrders({ page, per_page: perPage }, token),
    [page, perPage, token],
  )
  const { data, status, error, retry } =
    useApiResource<Paginated<AdminOrder>>(loadOrders)

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
  if (!data || data.data.length === 0) {
    return (
      <main className="space-y-md p-md">
        <h1 className="text-heading">Admin orders</h1>
        <EmptyState title="No orders are available." />
        <Link to="/admin/products">Manage products</Link>
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
      <h1 className="text-heading">Admin orders</h1>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr>
              <th className="border-b border-border p-sm">Order</th>
              <th className="border-b border-border p-sm">Status</th>
              <th className="border-b border-border p-sm">Total</th>
              <th className="border-b border-border p-sm">Buyer</th>
              <th className="border-b border-border p-sm">Items</th>
            </tr>
          </thead>
          <tbody>
            {data.data.map((order) => (
              <tr key={order.id}>
                <td className="border-b border-border p-sm">{order.id}</td>
                <td className="border-b border-border p-sm">{order.status}</td>
                <td className="border-b border-border p-sm">
                  {Number(order.total).toFixed(2)}
                </td>
                <td className="border-b border-border p-sm">
                  <p>{order.user.name}</p>
                  <p>{order.user.email}</p>
                </td>
                <td className="border-b border-border p-sm">
                  <ul className="grid gap-xs">
                    {order.items.map((item) => (
                      <li key={item.productId}>
                        {item.title} — {Number(item.unitPrice).toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
