import { useState } from 'react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { Pagination } from '../components/ui/Pagination'
import { Spinner } from '../components/ui/Spinner'
import { useProducts } from '../hooks/useProducts'

export function HomePage() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const { data, status, error, retry } = useProducts({
    search: search || undefined,
    category: category || undefined,
    page,
    per_page: perPage,
  })

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function updateCategory(value: string) {
    setCategory(value)
    setPage(1)
  }

  return (
    <main className="space-y-md p-md">
      <h1 className="text-heading">Products</h1>
      <section aria-label="Product filters" className="grid gap-md sm:grid-cols-2">
        <label className="grid gap-xs">
          Search
          <input
            className="rounded-control border border-border bg-surface px-md py-sm"
            name="search"
            type="search"
            value={search}
            onChange={(event) => updateSearch(event.target.value)}
          />
        </label>
        <label className="grid gap-xs">
          Category
          <input
            className="rounded-control border border-border bg-surface px-md py-sm"
            name="category"
            value={category}
            onChange={(event) => updateCategory(event.target.value)}
          />
        </label>
      </section>

      {status === 'loading' ? <Spinner /> : null}
      {status === 'error' ? (
        <ErrorState
          message={error ?? 'Unable to load products.'}
          onRetry={retry}
        />
      ) : null}
      {status === 'success' && data?.data.length === 0 ? (
        <EmptyState title="No products match these filters." />
      ) : null}
      {status === 'success' && data && data.data.length > 0 ? (
        <>
          <ul className="grid gap-md sm:grid-cols-2 lg:grid-cols-3">
            {data.data.map((product) => (
              <li
                className="space-y-sm rounded-card border border-border bg-surface p-md"
                key={product.id}
              >
                <Link to={`/products/${encodeURIComponent(product.id)}`}>
                  <img
                    className="w-full rounded-control"
                    src={product.imageUrl}
                    alt={product.title}
                  />
                  <h2 className="text-subheading">{product.title}</h2>
                </Link>
                <p>{product.category}</p>
                <p>{Number(product.price).toFixed(2)}</p>
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
        </>
      ) : null}
    </main>
  )
}
