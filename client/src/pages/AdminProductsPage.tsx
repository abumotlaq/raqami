import { useCallback, useState, type FormEvent } from 'react'
import { EmptyState } from '../components/ui/EmptyState'
import { ErrorState } from '../components/ui/ErrorState'
import { FieldErrors as FieldErrorsList } from '../components/ui/FieldErrors'
import { Pagination } from '../components/ui/Pagination'
import { Spinner } from '../components/ui/Spinner'
import { useAuth } from '../context/AuthContext'
import { useApiResource } from '../hooks/useApiResource'
import {
  ApiResponseError,
  createAdminProduct,
  getAdminProducts,
  getErrorMessage,
  updateAdminProduct,
  uploadAdminProductFile,
} from '../services/api'
import type {
  AdminProduct,
  AdminProductCreateRequestBody,
  FieldErrors,
} from '../types/api'

interface ProductFormValues extends AdminProductCreateRequestBody {
  isActive: boolean
}

function emptyForm(): ProductFormValues {
  return {
    title: '',
    category: '',
    price: '',
    description: '',
    imageUrl: '',
    isActive: true,
  }
}

export function AdminProductsPage() {
  const { token } = useAuth()
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(12)
  const [form, setForm] = useState<ProductFormValues>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [busyProductId, setBusyProductId] = useState<string | null>(null)
  const [operationError, setOperationError] = useState<string | null>(null)
  const loadProducts = useCallback(
    () => getAdminProducts({ page, per_page: perPage }, token),
    [page, perPage, token],
  )
  const { data, status, error, retry } = useApiResource(loadProducts)

  function startEditing(product: AdminProduct) {
    setEditingId(product.id)
    setForm({
      title: product.title,
      category: product.category,
      price: product.price,
      description: product.description,
      imageUrl: product.imageUrl,
      isActive: product.isActive,
    })
    setFormMessage(null)
    setFieldErrors(null)
    setSuccessMessage(null)
  }

  function cancelEditing() {
    setEditingId(null)
    setForm(emptyForm())
    setFormMessage(null)
    setFieldErrors(null)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormMessage(null)
    setFieldErrors(null)
    setOperationError(null)
    setSuccessMessage(null)

    try {
      if (editingId) {
        await updateAdminProduct(editingId, form, token)
        setSuccessMessage('Product updated.')
      } else {
        await createAdminProduct(form, token)
        setSuccessMessage('Product created.')
      }
      cancelEditing()
      retry()
    } catch (requestError: unknown) {
      setFormMessage(getErrorMessage(requestError))
      if (requestError instanceof ApiResponseError) {
        setFieldErrors(requestError.errors)
      }
    }
  }

  async function handleUpload(productId: string, file: File | undefined) {
    if (!file) return
    setOperationError(null)
    setSuccessMessage(null)
    setBusyProductId(productId)
    try {
      await uploadAdminProductFile(productId, file, token)
      setSuccessMessage('Product file uploaded.')
      retry()
    } catch (requestError: unknown) {
      setOperationError(getErrorMessage(requestError))
    } finally {
      setBusyProductId(null)
    }
  }

  if (status === 'loading') {
    return <Spinner />
  }
  if (status === 'error') {
    return <ErrorState message={error ?? 'Unable to load admin products.'} onRetry={retry} />
  }
  if (!data) {
    return <EmptyState title="Product data is unavailable." />
  }

  return (
    <main className="space-y-md p-md">
      <h1 className="text-heading">Admin products</h1>
      {successMessage ? <p role="status">{successMessage}</p> : null}
      {operationError ? <ErrorState message={operationError} /> : null}

      <section className="space-y-md rounded-card border border-border bg-surface p-md">
        <h2 className="text-subheading">
          {editingId ? 'Edit product' : 'Create product'}
        </h2>
        {formMessage ? <ErrorState message={formMessage} /> : null}
        <form className="grid gap-md" onSubmit={handleSubmit}>
          <label className="grid gap-xs">
            Title
            <input
              className="rounded-control border border-border bg-surface px-md py-sm"
              name="title"
              required
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />
            <FieldErrorsList messages={fieldErrors?.title} />
          </label>
          <label className="grid gap-xs">
            Category
            <input
              className="rounded-control border border-border bg-surface px-md py-sm"
              name="category"
              required
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value,
                }))
              }
            />
            <FieldErrorsList messages={fieldErrors?.category} />
          </label>
          <label className="grid gap-xs">
            Price
            <input
              className="rounded-control border border-border bg-surface px-md py-sm"
              name="price"
              inputMode="decimal"
              required
              value={form.price}
              onChange={(event) =>
                setForm((current) => ({ ...current, price: event.target.value }))
              }
            />
            <FieldErrorsList messages={fieldErrors?.price} />
          </label>
          <label className="grid gap-xs">
            Description
            <textarea
              className="rounded-control border border-border bg-surface px-md py-sm"
              name="description"
              required
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
            />
            <FieldErrorsList messages={fieldErrors?.description} />
          </label>
          <label className="grid gap-xs">
            Image URL
            <input
              className="rounded-control border border-border bg-surface px-md py-sm"
              name="imageUrl"
              type="url"
              required
              value={form.imageUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  imageUrl: event.target.value,
                }))
              }
            />
            <FieldErrorsList messages={fieldErrors?.imageUrl} />
          </label>
          <label className="flex items-center gap-sm">
            <input
              name="isActive"
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
            />
            Active
          </label>
          <div className="flex flex-wrap gap-sm">
            <button
              className="rounded-control bg-primary px-md py-sm text-primary-foreground"
              type="submit"
            >
              {editingId ? 'Save changes' : 'Create product'}
            </button>
            {editingId ? (
              <button
                className="rounded-control border border-border px-md py-sm"
                type="button"
                onClick={cancelEditing}
              >
                Cancel
              </button>
            ) : null}
          </div>
        </form>
      </section>

      {data.data.length === 0 ? (
        <EmptyState title="No products are available." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="border-b border-border p-sm">Title</th>
                <th className="border-b border-border p-sm">Category</th>
                <th className="border-b border-border p-sm">Price</th>
                <th className="border-b border-border p-sm">Active</th>
                <th className="border-b border-border p-sm">File uploaded</th>
                <th className="border-b border-border p-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.data.map((product) => (
                <tr key={product.id}>
                  <td className="border-b border-border p-sm">{product.title}</td>
                  <td className="border-b border-border p-sm">{product.category}</td>
                  <td className="border-b border-border p-sm">
                    {Number(product.price).toFixed(2)}
                  </td>
                  <td className="border-b border-border p-sm">
                    {String(product.isActive)}
                  </td>
                  <td className="border-b border-border p-sm">
                    {String(product.hasFile)}
                  </td>
                  <td className="border-b border-border p-sm">
                    <div className="grid gap-sm">
                      <button
                        className="rounded-control border border-border px-md py-sm"
                        type="button"
                        onClick={() => startEditing(product)}
                      >
                        Edit
                      </button>
                      <label className="grid gap-xs">
                        Upload file
                        <input
                          aria-label={`Upload file for ${product.title}`}
                          type="file"
                          disabled={busyProductId === product.id}
                          onChange={(event) => {
                            const file = event.target.files?.[0]
                            void handleUpload(product.id, file)
                            event.currentTarget.value = ''
                          }}
                        />
                      </label>
                      {busyProductId === product.id ? (
                        <Spinner label="Uploading file" />
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
