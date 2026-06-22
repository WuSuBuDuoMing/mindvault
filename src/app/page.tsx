'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  MessageSquare,
  FolderOpen,
  Sparkles,
  Code,
  Clock,
  ArrowRight,
  Database,
  HardDrive,
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useTranslation, useLocale } from '@/i18n/locale-context'
import { translateCategory } from '@/i18n'

interface DashboardData {
  stats: {
    conversationCount: number
    messageCount: number
    projectCount: number
    promptCount: number
    codeSnippetCount: number
    latestImport: string | null
    latestBatch: {
      conversationCount: number
      messageCount: number
      status: string
    } | null
  }
  recentConversations: Array<{
    id: string
    title: string
    messageCount: number
    updatedAt: string
  }>
  recentProjects: Array<{
    id: string
    name: string
    category: string
    updatedAt: string
    _count: { conversations: number }
  }>
  topKeywords: Array<{ keyword: string; count: number }>
  topCategories: Array<{ category: string; count: number }>
  recentActivity: Array<{
    id: string
    title: string
    date: string
    type: string
    meta: string
    project: string | null
  }>
}

const categoryColors: Record<string, string> = {
  code: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  course: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  prompt: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  creative: 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300',
  research: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  business: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  data: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-300',
  design: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  other: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
}

export default function DashboardPage() {
  const { t, locale } = useTranslation()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')
  }

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { stats, recentConversations, recentProjects, topKeywords, topCategories, recentActivity } = data

  const statCards = [
    { nameKey: 'dashboard.conversations', value: stats.conversationCount, icon: MessageSquare, href: '/conversations' },
    { nameKey: 'dashboard.messages', value: stats.messageCount, icon: MessageSquare, href: '/conversations' },
    { nameKey: 'dashboard.projects', value: stats.projectCount, icon: FolderOpen, href: '/projects' },
    { nameKey: 'dashboard.prompts', value: stats.promptCount, icon: Sparkles, href: '/prompts' },
    { nameKey: 'dashboard.code-snippets', value: stats.codeSnippetCount, icon: Code, href: '/code' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h2>
        <p className="text-muted-foreground">
          {t('dashboard.subtitle')}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.nameKey} href={stat.href}>
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {t(stat.nameKey)}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Quick Start */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.quick-start')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {t('dashboard.quick-start-desc')}
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/import"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {t('dashboard.import-conversations')}
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                {t('dashboard.search-all')}
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('dashboard.recent-conversations')}</CardTitle>
              <Link
                href="/conversations"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                {t('common.view-all')} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentConversations.length === 0 ? (
              <div className="flex items-start gap-3 py-2">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{t('dashboard.no-imports-yet')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.import-first')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentConversations.map((conv) => (
                  <Link
                    key={conv.id}
                    href={`/conversations/${conv.id}`}
                    className="flex items-center justify-between hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">
                        {conv.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('common.messages-count', { count: conv.messageCount })} • {formatDate(conv.updatedAt)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Projects */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('dashboard.recent-projects')}</CardTitle>
              <Link
                href="/projects"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                {t('common.view-all')} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="flex items-start gap-3 py-2">
                <FolderOpen className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">{t('dashboard.no-projects-yet')}</p>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboard.projects-auto')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {recentProjects.map((project) => (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="flex items-center justify-between hover:bg-muted/50 p-2 -mx-2 rounded-md transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{project.name}</p>
                        <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColors[project.category] || categoryColors.other}`}>
                          {translateCategory(locale, project.category)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('dashboard.conversations-label', { count: project._count.conversations })} • {formatDate(project.updatedAt)}
                      </p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Keywords & Category Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.top-keywords')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topKeywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.keywords-appear')}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {topKeywords.map(({ keyword, count }) => {
                  const size = count >= 5 ? 'text-base' : count >= 3 ? 'text-sm' : 'text-xs'
                  return (
                    <span
                      key={keyword}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-muted ${size}`}
                    >
                      {keyword}
                      <span className="text-muted-foreground">({count})</span>
                    </span>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.category-distribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.categories-appear')}
              </p>
            ) : (
              <div className="space-y-3">
                {topCategories.map(({ category, count }) => {
                  const total = topCategories.reduce((s, c) => s + c.count, 0)
                  const percentage = Math.round((count / total) * 100)
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{translateCategory(locale, category)}</span>
                        <span className="text-muted-foreground">{count} {t('dashboard.conversations-label', { count: '' }).trim()}</span>
                      </div>
                      <div
                        className="h-2 bg-muted rounded-full overflow-hidden"
                        style={{ '--bar-width': `${percentage}%` } as React.CSSProperties}
                      >
                        <div className="h-full bg-primary rounded-full w-[var(--bar-width)]" />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System Status & Last Import */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {t('dashboard.import-status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.latestImport ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <div className={`h-2 w-2 rounded-full ${
                    stats.latestBatch?.status === 'completed' ? 'bg-green-500' :
                    stats.latestBatch?.status === 'completed_with_errors' ? 'bg-yellow-500' :
                    stats.latestBatch?.status === 'processing' ? 'bg-blue-500 animate-pulse' :
                    'bg-green-500'
                  }`} />
                  <span className="text-muted-foreground">{t('dashboard.last-import')}</span>
                  <span className="font-medium">
                    {formatDate(stats.latestImport)}
                  </span>
                </div>
                {stats.latestBatch && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">{t('dashboard.batch-conversations')}</p>
                      <p className="font-medium">{stats.latestBatch.conversationCount}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">{t('dashboard.batch-messages')}</p>
                      <p className="font-medium">{stats.latestBatch.messageCount}</p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.total')}: {stats.conversationCount.toLocaleString()} {t('dashboard.conversations-label', { count: '' }).trim()},{' '}
                  {stats.messageCount.toLocaleString()} {t('dashboard.messages')}
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                <span>{t('dashboard.no-imports')}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-4 w-4" />
              {t('dashboard.system-status')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('dashboard.database')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium">{t('dashboard.sqlite-local')}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('dashboard.analysis')}</span>
                </div>
                <span className="font-medium">{t('dashboard.rule-based-local')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{t('dashboard.search-engine')}</span>
                </div>
                <span className="font-medium">{t('dashboard.sqlite-like')}</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg mt-2">
                <p className="text-xs text-muted-foreground">
                  {t('dashboard.privacy-note')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity Timeline */}
      {recentActivity.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{t('dashboard.recent-activity')}</CardTitle>
              <Link
                href="/conversations"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                {t('common.view-all')} <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <Link
                    key={activity.id}
                    href={`/conversations/${activity.id}`}
                    className="relative flex items-start gap-4 pl-8 hover:bg-muted/30 -ml-2 p-2 rounded-md transition-colors group"
                  >
                    <div className="absolute left-2.5 top-3 w-3 h-3 rounded-full border-2 border-primary bg-background group-hover:bg-primary transition-colors" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                          {activity.title}
                        </p>
                        {activity.project && (
                          <Badge variant="outline" className="text-xs flex-shrink-0">
                            {activity.project}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{activity.meta}</span>
                        <span>•</span>
                        <span>{formatDateTime(activity.date)}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
