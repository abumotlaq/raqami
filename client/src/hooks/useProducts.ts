import { useEffect, useState } from 'react'
import {
  getErrorMessage,
  getProducts as getProductsRequest,
  type ProductsQuery,
} from '../services/api'
import type { Paginated, Product } from '../types/api'

export type DataStatus = 'loading' | 'success' | 'error'

export interface UseProductsResult {
  data: Paginated<Product> | null
  status: DataStatus
  error: string | null
  retry: () => void
}

export function useProducts(params: ProductsQuery = {}): UseProductsResult {
  const { search, category, page, per_page } = params
  const [retryCount, setRetryCount] = useState(0)
  const [data, setData] = useState<Paginated<Product> | null>(null)
  const [status, setStatus] = useState<DataStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError(null)

    void getProductsRequest({ search, category, page, per_page })
      .then((result) => {
        if (!active) return
        setData(result)
        setStatus('success')
      })
      .catch((requestError: unknown) => {
        if (!active) return
        setData(null)
        setError(getErrorMessage(requestError))
        setStatus('error')
      })

    return () => {
      active = false
    }
  }, [search, category, page, per_page, retryCount])

  return {
    data,
    status,
    error,
    retry: () => setRetryCount((current) => current + 1),
  }
}
