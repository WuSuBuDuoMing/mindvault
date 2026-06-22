'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard,
  Import,
  MessageSquare,
  FolderOpen,
  Sparkles,
  Code,
  Search,
  Settings,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useTranslation } from '@/i18n/locale-context'

interface NavCounts {
  conversations: number
  projects: number
  prompts: number
  codeSnippets: number
}

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const [counts, setCounts] = useState<NavCounts | null>(null)
  const { t } = useTranslation()

  const navigation = [
    { nameKey: 'sidebar.dashboard', href: '/', icon: LayoutDashboard, countKey: null },
    { nameKey: 'sidebar.import', href: '/import', icon: Import, countKey: null },
    { nameKey: 'sidebar.conversations', href: '/conversations', icon: MessageSquare, countKey: 'conversations' as const },
    { nameKey: 'sidebar.projects', href: '/projects', icon: FolderOpen, countKey: 'projects' as const },
    { nameKey: 'sidebar.prompts', href: '/prompts', icon: Sparkles, countKey: 'prompts' as const },
    { nameKey: 'sidebar.code-snippets', href: '/code', icon: Code, countKey: 'codeSnippets' as const },
    { nameKey: 'sidebar.search', href: '/search', icon: Search, countKey: null },
  ]

  const bottomNavigation = [
    { nameKey: 'sidebar.settings', href: '/settings', icon: Settings },
  ]

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const response = await fetch('/api/stats')
        if (response.ok) {
          const data = await response.json()
          setCounts(data)
        }
      } catch {
        // Silently fail - counts are optional
      }
    }
    fetchCounts()
  }, [])

  return (
    <div className="flex h-full max-h-screen flex-col gap-2">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold" onClick={onNavigate}>
          <MessageSquare className="h-6 w-6" />
          <span className="">{t('common.app-name')}</span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {navigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href ||
              (item.href !== '/' && pathname.startsWith(item.href))
            const count = item.countKey && counts ? counts[item.countKey] : null

            return (
              <Link
                key={item.nameKey}
                href={item.href}
                onClick={onNavigate}
              >
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-secondary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{t(item.nameKey)}</span>
                  {count !== null && count > 0 && (
                    <Badge variant="secondary" className="ml-auto h-5 px-1.5 text-xs">
                      {count > 999 ? '999+' : count}
                    </Badge>
                  )}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-auto border-t py-2">
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {bottomNavigation.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href

            return (
              <Link
                key={item.nameKey}
                href={item.href}
                onClick={onNavigate}
              >
                <Button
                  variant={isActive ? 'secondary' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-3',
                    isActive && 'bg-secondary'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {t(item.nameKey)}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
