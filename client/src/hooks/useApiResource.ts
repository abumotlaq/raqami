import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage } from '../services/api'
import type { DataStatus } from './useProducts'

export interface ApiResource<T> {
  data: T | null
  status: DataStatus
  error: string | null
  retry: () => void
}

export function useApiResource<T>(
  load: () => Promise<T>,
): ApiResource<T> {
  const [retryCount, setRetryCount] = useState(0)
  const [data, setData] = useState<T | null>(null)
  const [status, setStatus] = useState<DataStatus>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError(null)

    void load()
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
  }, [load, retryCount])

  const retry = useCallback(() => {
    setRetryCount((current) => current + 1)
  }, [])

  return { data, status, error, retry }
}
