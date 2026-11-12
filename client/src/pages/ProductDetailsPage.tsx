import { useParams } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Spinner } from '../components/ui/Spinner'
import { useProduct } from '../hooks/useProduct'

export function ProductDetailsPage() {
  const { id = '' } = useParams()
  const { data, status, error, retry } = useProduct(id)

  if (status === 'loading') {
    return <Spinner />
  }
  if (status === 'error') {
    return <ErrorState message={error ?? 'Unable to load this product.'} onRetry={retry} />
  }
  if (!data) {
    return <EmptyState title="This product is unavailable." />
  }

  return (
    <main>
      <h1>{data.title}</h1>
      <p>{data.category}</p>
      <p>{data.description}</p>
      <p>{Number(data.price).toFixed(2)}</p>
      <img src={data.imageUrl} alt={data.title} />
    </main>
  )
}
