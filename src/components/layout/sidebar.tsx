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

interface NavCounts {
  conversations: number
  projects: number
  prompts: number
  codeSnippets: number
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard, countKey: null },
  { name: 'Import', href: '/import', icon: Import, countKey: null },
  { name: 'Conversations', href: '/conversations', icon: MessageSquare, countKey: 'conversations' as const },
  { name: 'Projects', href: '/projects', icon: FolderOpen, countKey: 'projects' as const },
  { name: 'Prompts', href: '/prompts', icon: Sparkles, countKey: 'prompts' as const },
  { name: 'Code Snippets', href: '/code', icon: Code, countKey: 'codeSnippets' as const },
  { name: 'Search', href: '/search', icon: Search, countKey: null },
]

const bottomNavigation = [
  { name: 'Settings', href: '/settings', icon: Settings },
]

interface SidebarProps {
  onNavigate?: () => void
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname()
  const [counts, setCounts] = useState<NavCounts | null>(null)

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
          <span className="">ClaudeNote</span>
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
                key={item.name}
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
                  <span className="flex-1 text-left">{item.name}</span>
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
                key={item.name}
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
                  {item.name}
                </Button>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
