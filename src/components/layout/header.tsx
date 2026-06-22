'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, Search } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Sidebar } from './sidebar'
import { ThemeToggle } from '@/components/theme-toggle'
import { LocaleToggle } from '@/components/locale-toggle'
import { useState, useCallback } from 'react'
import { useTranslation } from '@/i18n/locale-context'

export function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [sheetOpen, setSheetOpen] = useState(false)
  const { t } = useTranslation()

  const getPageTitle = () => {
    if (pathname === '/') return t('header.dashboard')
    const titleMap: Record<string, string> = {
      'import': t('sidebar.import'),
      'conversations': t('sidebar.conversations'),
      'projects': t('sidebar.projects'),
      'prompts': t('sidebar.prompts'),
      'code': t('sidebar.code-snippets'),
      'search': t('sidebar.search'),
      'settings': t('sidebar.settings'),
    }
    const segments = pathname.split('/').filter(Boolean)
    const firstSegment = segments[0]
    return firstSegment ? (titleMap[firstSegment] || firstSegment) : t('header.dashboard')
  }

  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault()
      if (searchQuery.trim()) {
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
      }
    },
    [searchQuery, router]
  )

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
      {/* Mobile sidebar */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('header.toggle-nav')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="flex flex-col p-0 w-72">
          <Sidebar onNavigate={() => setSheetOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Page title */}
      <div className="w-full flex-1">
        <h1 className="text-lg font-semibold md:text-2xl">{getPageTitle()}</h1>
      </div>

      {/* Search, Locale, and Theme */}
      <div className="flex items-center gap-2">
        <form onSubmit={handleSearch} className="hidden lg:block">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('header.search-placeholder')}
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[300px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </form>
        <LocaleToggle />
        <ThemeToggle />
      </div>
    </header>
  )
}
