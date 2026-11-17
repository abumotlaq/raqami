import { useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { ApiResponseError, createOrder, getErrorMessage } from '../services/api'
import type { ApiErrorCode } from '../types/api'

export function CartPage() {
  const { state, refreshCart, removeItem } = useCart()
  const { token } = useAuth()
  const navigate = useNavigate()
  const checkoutInProgress = useRef(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null)
  const [checkoutCode, setCheckoutCode] = useState<ApiErrorCode | null>(null)

  async function handleCheckout() {
    if (!state.cart?.items.length || checkoutInProgress.current) return

    checkoutInProgress.current = true
    setCheckoutMessage(null)
    setCheckoutCode(null)
    setIsProcessing(true)
    try {
      const order = await createOrder(token)
      void refreshCart().catch(() => undefined)
      navigate(`/checkout/result/${encodeURIComponent(order.id)}`)
    } catch (requestError: unknown) {
      setCheckoutMessage(getErrorMessage(requestError))
      if (requestError instanceof ApiResponseError) {
        setCheckoutCode(requestError.code)
      }
    } finally {
      checkoutInProgress.current = false
      setIsProcessing(false)
    }
  }

  if (state.status === 'idle' || state.status === 'loading') {
    return <Spinner />
  }
  if (state.status === 'error') {
    return (
      <ErrorState
        message={state.error ?? 'Unable to load the cart.'}
        onRetry={() => void refreshCart().catch(() => undefined)}
      />
    )
  }
  if (!state.cart || state.cart.items.length === 0) {
    return (
      <main className="space-y-md p-md">
        <h1 className="text-heading">Cart</h1>
        <EmptyState title="Your cart is empty." />
        <Link to="/">Browse products</Link>
      </main>
    )
  }

  return (
    <main className="space-y-md p-md">
      <h1 className="text-heading">Cart</h1>
      {checkoutMessage ? (
        <ErrorState
          message={checkoutMessage}
          onRetry={
            checkoutCode === 'PAYMENT_FAILED'
              ? () => void handleCheckout()
              : undefined
          }
        />
      ) : null}
      <ul className="grid gap-md">
        {state.cart.items.map(({ product, quantity }) => (
          <li
            className="flex flex-wrap items-center justify-between gap-md rounded-card border border-border bg-surface p-md"
            key={product.id}
          >
            <div className="space-y-xs">
              <h2 className="text-subheading">{product.title}</h2>
              <p>{Number(product.price).toFixed(2)}</p>
              <p>Quantity: {quantity}</p>
            </div>
            <button
              className="rounded-control border border-border px-md py-sm"
              type="button"
              disabled={isProcessing}
              onClick={() =>
                void removeItem(product.id).catch(() => undefined)
              }
            >
              Remove
            </button>
          </li>
        ))}
      </ul>
      <p>Total: {Number(state.cart.total).toFixed(2)}</p>
      <button
        className="rounded-control bg-primary px-md py-sm text-primary-foreground"
        type="button"
        disabled={isProcessing || state.cart.items.length === 0}
        onClick={() => void handleCheckout()}
      >
        {isProcessing ? 'Processing' : 'Proceed to checkout'}
      </button>
      {isProcessing ? <Spinner label="Processing checkout" /> : null}
    </main>
  )
}
