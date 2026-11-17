import { useEffect, useState } from 'react'
import type { PaginationMeta } from '../../types/api'

interface PaginationProps {
  meta: PaginationMeta
  onPageChange: (page: number) => void
  onPerPageChange: (perPage: number) => void
}

export function Pagination({
  meta,
  onPageChange,
  onPerPageChange,
}: PaginationProps) {
  const [perPage, setPerPage] = useState(String(meta.perPage))

  useEffect(() => {
    setPerPage(String(meta.perPage))
  }, [meta.perPage])

  function updatePerPage(value: string) {
    setPerPage(value)
    const parsed = Number(value)
    if (Number.isInteger(parsed) && parsed >= 1 && parsed <= 100) {
      onPerPageChange(parsed)
    }
  }

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-md">
      <button
        type="button"
        className="rounded-control border border-border bg-surface px-md py-sm"
        disabled={meta.currentPage <= 1}
        onClick={() => onPageChange(meta.currentPage - 1)}
      >
        Previous
      </button>
      <span>
        Page {meta.currentPage} of {meta.lastPage} ({meta.total} items)
      </span>
      <button
        type="button"
        className="rounded-control border border-border bg-surface px-md py-sm"
        disabled={meta.currentPage >= meta.lastPage}
        onClick={() => onPageChange(meta.currentPage + 1)}
      >
        Next
      </button>
      <label className="flex items-center gap-sm">
        Items per page
        <input
          aria-label="Items per page"
          className="w-24 rounded-control border border-border bg-surface px-sm py-xs"
          type="number"
          min={1}
          max={100}
          value={perPage}
          onChange={(event) => updatePerPage(event.target.value)}
        />
      </label>
    </nav>
  )
}
