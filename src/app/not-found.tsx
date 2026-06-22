'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, Search } from 'lucide-react'
import { useTranslation, useLocale } from '@/i18n/locale-context'

export default function NotFound() {
  const { t, locale } = useTranslation()
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-6xl font-bold text-muted-foreground/30">
            404
          </div>
          <CardTitle className="text-xl">{t('not-found.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {t('not-found.description')}
          </p>
          <div className="flex gap-3 justify-center">
            <Link href="/">
              <Button variant="default">
                <Home className="h-4 w-4 mr-2" />
                {t('not-found.dashboard')}
              </Button>
            </Link>
            <Link href="/search">
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                {t('not-found.search')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
