import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useCart } from '../context/CartContext'

export function CartPage() {
  const { state, refreshCart } = useCart()

  if (state.status === 'idle' || state.status === 'loading') {
    return <Spinner />
  }
  if (state.status === 'error') {
    return (
      <ErrorState
        message={state.error ?? 'Unable to load the cart.'}
        onRetry={() => void refreshCart()}
      />
    )
  }

  return (
    <main>
      <h1>Cart</h1>
      <p role="status">PENDING_CONTRACT: The cart cannot be displayed until the GET /cart item shape is confirmed.</p>
      <EmptyState title="Cart contents are unavailable until the API contract is confirmed." />
      <button type="button" disabled>
        Proceed to checkout
      </button>
    </main>
  )
}
