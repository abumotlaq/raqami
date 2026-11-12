import { useEffect, useState } from 'react'
import { getErrorMessage, getProduct } from '../services/api'
import type { Product } from '../types/api'
import type { DataStatus } from './useProducts'

export interface UseProductResult {
  data: Product | null
  status: DataStatus
  error: string | null
  retry: () => void
}

export function useProduct(id: string): UseProductResult {
  const [retryCount, setRetryCount] = useState(0)
  const [data, setData] = useState<Product | null>(null)
  const [status, setStatus] = useState<DataStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError(null)

    void getProduct(id)
      .then((product) => {
        if (!active) return
        setData(product)
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
  }, [id, retryCount])

  return {
    data,
    status,
    error,
    retry: () => setRetryCount((current) => current + 1),
  }
}
