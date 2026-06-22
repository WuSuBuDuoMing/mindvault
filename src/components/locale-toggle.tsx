'use client'

import { Languages } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLocale } from '@/i18n/locale-context'

export function LocaleToggle() {
  const { locale, setLocale } = useLocale()

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9"
      onClick={() => setLocale(locale === 'zh-CN' ? 'en' : 'zh-CN')}
      title={locale === 'zh-CN' ? 'Switch to English' : '切换到简体中文'}
    >
      <Languages className="h-4 w-4" />
      <span className="sr-only">{locale === 'zh-CN' ? 'Switch to English' : '切换到简体中文'}</span>
    </Button>
  )
}
