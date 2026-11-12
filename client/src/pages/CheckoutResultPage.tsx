import { useParams } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useOrderResult } from '../hooks/useOrderResult'

export function CheckoutResultPage() {
  const { orderId = '' } = useParams()
  const { token } = useAuth()
  const { data, status, error, isPolling, retry } = useOrderResult(
    orderId,
    token,
  )

  if (status === 'loading') {
    return (
      <main>
        <h1>Processing order</h1>
        <Spinner />
      </main>
    )
  }
  if (status === 'error') {
    return (
      <ErrorState
        message={error ?? 'Unable to load this order.'}
        onRetry={retry}
      />
    )
  }
  if (!data) {
    return <EmptyState title="This order is unavailable." />
  }
  if (data.status === 'pending') {
    return (
      <main>
        <h1>Order pending</h1>
        <p>Waiting for the order status to update.</p>
        {isPolling ? <Spinner label="Checking order status" /> : null}
        <p>{data.id}</p>
        <p>{data.status}</p>
      </main>
    )
  }

  return (
    <main>
      <h1>{data.status === 'paid' ? 'Order successful' : 'Order failed'}</h1>
      <p>{data.id}</p>
      <p>{data.status}</p>
      <p>{Number(data.total).toFixed(2)}</p>
      <time dateTime={data.createdAt}>{data.createdAt}</time>
    </main>
  )
}
