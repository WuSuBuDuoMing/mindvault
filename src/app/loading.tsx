'use client'

import { Loader2 } from 'lucide-react'
import { useTranslation, useLocale } from '@/i18n/locale-context'

export default function Loading() {
  const { t, locale } = useTranslation()
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
      </div>
    </div>
  )
}
