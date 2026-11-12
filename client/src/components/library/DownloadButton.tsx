import { useState } from 'react'
import { ErrorState } from '../ui/ErrorState'
import { ApiResponseError, getDownloadLink, getErrorMessage } from '../../services/api'
import { useAuth } from '../../context/AuthContext'

interface DownloadButtonProps {
  productId: string
}

export function DownloadButton({ productId }: DownloadButtonProps) {
  const { token } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDownload() {
    setError(null)
    setIsLoading(true)
    const downloadTab = window.open('', '_blank')

    if (!downloadTab) {
      setError('Allow pop-ups to open the download in a new tab.')
      setIsLoading(false)
      return
    }

    downloadTab.opener = null
    try {
      const link = await getDownloadLink(productId, token)
      downloadTab.location.href = link.url
    } catch (requestError: unknown) {
      downloadTab.close()
      const message = getErrorMessage(requestError)
      const notPurchased =
        requestError instanceof ApiResponseError &&
        requestError.status === 403

      setError(
        notPurchased
          ? `${message} This product has not been purchased.`
          : message,
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <button type="button" disabled={isLoading} onClick={handleDownload}>
        {isLoading ? 'Preparing download' : 'Download'}
      </button>
      {error ? <ErrorState message={error} onRetry={handleDownload} /> : null}
    </div>
  )
}
