import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useProducts } from '../hooks/useProducts'

export function HomePage() {
  const { data, status, error, retry } = useProducts()

  if (status === 'loading') {
    return <Spinner />
  }
  if (status === 'error') {
    return <ErrorState message={error ?? 'Unable to load products.'} onRetry={retry} />
  }
  if (!data || data.data.length === 0) {
    return <EmptyState title="No products are available." />
  }

  return (
    <main>
      <h1>Products</h1>
      <ul>
        {data.data.map((product) => (
          <li key={product.id}>
            <Link to={`/products/${encodeURIComponent(product.id)}`}>
              {product.title}
            </Link>
            <p>{product.category}</p>
            <p>{Number(product.price).toFixed(2)}</p>
          </li>
        ))}
      </ul>
    </main>
  )
}
