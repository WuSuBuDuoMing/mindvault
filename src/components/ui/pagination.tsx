'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation } from '@/i18n/locale-context'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const { t } = useTranslation()

  if (totalPages <= 1) return null

  const getVisiblePages = () => {
    const delta = 2
    const range: number[] = []
    const rangeWithDots: (number | string)[] = []

    for (
      let i = Math.max(2, page - delta);
      i <= Math.min(totalPages - 1, page + delta);
      i++
    ) {
      range.push(i)
    }

    if (page - delta > 2) {
      rangeWithDots.push(1, '...')
    } else {
      rangeWithDots.push(1)
    }

    rangeWithDots.push(...range)

    if (page + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages)
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages)
    }

    return rangeWithDots
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
      >
        <ChevronLeft className="h-4 w-4" />
        {t('common.previous')}
      </Button>

      {getVisiblePages().map((pageNumber, index) => {
        if (pageNumber === '...') {
          return (
            <span key={`dots-${index}`} className="px-2 text-muted-foreground">
              ...
            </span>
          )
        }

        return (
          <Button
            key={pageNumber}
            variant={page === pageNumber ? 'default' : 'outline'}
            size="sm"
            onClick={() => onPageChange(pageNumber as number)}
          >
            {pageNumber}
          </Button>
        )
      })}

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
      >
        {t('common.next')}
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  )
}
