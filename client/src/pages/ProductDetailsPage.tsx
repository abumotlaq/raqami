import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import { useProduct } from '../hooks/useProduct'
import { getErrorMessage } from '../services/api'

export function ProductDetailsPage() {
  const { id = '' } = useParams()
  const { data, status, error, retry } = useProduct(id)
  const { user } = useAuth()
  const { addItem } = useCart()
  const navigate = useNavigate()
  const location = useLocation()
  const [isAdding, setIsAdding] = useState(false)
  const [cartError, setCartError] = useState<string | null>(null)
  const [added, setAdded] = useState(false)

  async function handleAddToCart() {
    if (!user) {
      navigate('/login', {
        state: {
          from: `${location.pathname}${location.search}${location.hash}`,
        },
      })
      return
    }

    setCartError(null)
    setAdded(false)
    setIsAdding(true)
    try {
      await addItem(id)
      setAdded(true)
    } catch (requestError: unknown) {
      setCartError(getErrorMessage(requestError))
    } finally {
      setIsAdding(false)
    }
  }

  if (status === 'loading') {
    return <Spinner />
  }
  if (status === 'error') {
    return (
      <ErrorState
        message={error ?? 'Unable to load this product.'}
        onRetry={retry}
      />
    )
  }
  if (!data) {
    return <EmptyState title="This product is unavailable." />
  }

  return (
    <main className="space-y-md p-md">
      <h1 className="text-heading">{data.title}</h1>
      <p>{data.category}</p>
      <p>{data.description}</p>
      <p>{Number(data.price).toFixed(2)}</p>
      <img className="w-full" src={data.imageUrl} alt={data.title} />
      {cartError ? <ErrorState message={cartError} /> : null}
      {added ? <p role="status">Added to cart.</p> : null}
      <button
        className="rounded-control bg-primary px-md py-sm text-primary-foreground"
        type="button"
        disabled={isAdding}
        onClick={() => void handleAddToCart()}
      >
        {isAdding ? 'Adding to cart' : 'Add to cart'}
      </button>
      {user ? <Link to="/cart">View cart</Link> : null}
    </main>
  )
}
