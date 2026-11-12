import { useCallback, useEffect, useState } from 'react'
import { getErrorMessage, getOrder } from '../services/api'
import type { Order } from '../types/api'
import type { DataStatus } from './useProducts'

export interface OrderResultResource {
  data: Order | null
  status: DataStatus
  error: string | null
  isPolling: boolean
  retry: () => void
}

export function useOrderResult(
  orderId: string,
  token: string | null,
): OrderResultResource {
  const [retryCount, setRetryCount] = useState(0)
  const [data, setData] = useState<Order | null>(null)
  const [status, setStatus] = useState<DataStatus>('loading')
  const [error, setError] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(false)

  useEffect(() => {
    let active = true
    setStatus('loading')
    setError(null)

    void getOrder(orderId, token)
      .then((order) => {
        if (!active) return
        setData(order)
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
  }, [orderId, retryCount, token])

  useEffect(() => {
    if (status !== 'success' || data?.status !== 'pending') return

    let active = true
    const timer = window.setTimeout(() => {
      setIsPolling(true)
      void getOrder(orderId, token)
        .then((order) => {
          if (!active) return
          setData(order)
          setIsPolling(false)
        })
        .catch((requestError: unknown) => {
          if (!active) return
          setError(getErrorMessage(requestError))
          setStatus('error')
          setIsPolling(false)
        })
    }, 3000)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [data?.status, orderId, status, token])

  const retry = useCallback(() => {
    setRetryCount((current) => current + 1)
  }, [])

  return { data, status, error, isPolling, retry }
}
