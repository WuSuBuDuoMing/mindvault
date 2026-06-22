'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2, MessageSquare, Calendar, Clock, Sparkles, Code } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useTranslation, useLocale } from '@/i18n/locale-context'
import { translateCategory } from '@/i18n'

interface Conversation {
  id: string
  title: string
  summary: string | null
  messageCount: number
  createdAt: string
}

interface Project {
  id: string
  name: string
  summary: string | null
  category: string
  createdAt: string
  updatedAt: string
  conversations: {
    conversation: Conversation
  }[]
}

interface TimelineItem {
  id: string
  title: string
  date: string
  type: 'conversation'
  conversationId: string
}

export default function ProjectDetailPage() {
  const params = useParams()
  const { t, locale } = useTranslation()
  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchProject(params.id as string)
    }
  }, [params.id])

  const fetchProject = async (id: string) => {
    try {
      const response = await fetch(`/api/projects/${id}`)
      if (response.ok) {
        const data = await response.json()
        setProject(data)
      }
    } catch (error) {
      console.error('Failed to fetch project:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!project) return

    setExporting(true)
    try {
      const response = await fetch(`/api/projects/${project.id}/export`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `project-${project.name.toLowerCase().replace(/\s+/g, '-')}.md`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Failed to export:', error)
    } finally {
      setExporting(false)
    }
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
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
    return colors[category] || colors.other
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'code': return '💻'
      case 'course': return '📚'
      case 'prompt': return '✨'
      case 'creative': return '✍️'
      case 'research': return '🔬'
      case 'business': return '💼'
      case 'data': return '📊'
      case 'design': return '🎨'
      default: return '📁'
    }
  }

  const buildTimeline = (conversations: Project['conversations']): TimelineItem[] => {
    return conversations
      .map(({ conversation }) => ({
        id: conversation.id,
        title: conversation.title,
        date: conversation.createdAt,
        type: 'conversation' as const,
        conversationId: conversation.id,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{t('project-detail.not-found-title')}</h2>
            <p className="text-muted-foreground">
              {t('project-detail.not-found-desc')}
            </p>
          </div>
        </div>
      </div>
    )
  }

  const timeline = buildTimeline(project.conversations)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/projects">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-2xl">{getCategoryIcon(project.category)}</span>
              <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">{project.name}</h2>
              <Badge className={getCategoryColor(project.category)}>
                {translateCategory(locale, project.category)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {t('project-detail.n-conversations', { count: project.conversations.length })} • {t('project-detail.created')}{' '}
              {new Date(project.createdAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')} • {t('project-detail.last-updated')}{' '}
              {new Date(project.updatedAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')}
            </p>
          </div>
        </div>
        <Button onClick={handleExport} disabled={exporting} size="sm">
          {exporting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {t('project-detail.export-project')}
        </Button>
      </div>

      {/* Summary */}
      {project.summary && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">{t('project-detail.project-summary')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground leading-relaxed">{project.summary}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Conversations List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  {t('project-detail.conversations-title')}
                </CardTitle>
                <Badge variant="secondary">{project.conversations.length}</Badge>
              </div>
              <CardDescription>
                {t('project-detail.conversations-desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {project.conversations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>{t('project-detail.no-conversations')}</p>
                  <p className="text-xs mt-1">{t('project-detail.import-to-see')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {project.conversations.map(({ conversation }, index) => (
                    <Link
                      key={conversation.id}
                      href={`/conversations/${conversation.id}`}
                      className="block p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-mono">
                              #{index + 1}
                            </span>
                            <h4 className="font-medium text-sm truncate">{conversation.title}</h4>
                          </div>
                          {conversation.summary && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {conversation.summary}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                          <div className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            <span>{conversation.messageCount}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{new Date(conversation.createdAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Timeline */}
        <div>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('project-detail.timeline')}
              </CardTitle>
              <CardDescription>
                {t('project-detail.timeline-desc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">{t('project-detail.no-activity')}</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

                  <div className="space-y-4">
                    {timeline.map((item) => (
                      <Link
                        key={item.id}
                        href={`/conversations/${item.conversationId}`}
                        className="relative flex items-start gap-4 pl-8 hover:bg-muted/30 -ml-2 p-2 rounded-md transition-colors group"
                      >
                        {/* Timeline dot */}
                        <div className="absolute left-2.5 top-3.5 w-3 h-3 rounded-full border-2 border-primary bg-background group-hover:bg-primary transition-colors" />

                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                            {item.title}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {new Date(item.date).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Project Stats */}
          <Card className="mt-4">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">{t('project-detail.statistics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('project-detail.total-conversations')}</span>
                  <span className="font-medium">{project.conversations.length}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('project-detail.total-messages')}</span>
                  <span className="font-medium">
                    {project.conversations.reduce((sum, c) => sum + c.conversation.messageCount, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('project-detail.avg-messages-conv')}</span>
                  <span className="font-medium">
                    {project.conversations.length > 0
                      ? Math.round(
                          project.conversations.reduce((sum, c) => sum + c.conversation.messageCount, 0) /
                          project.conversations.length
                        )
                      : 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('project-detail.category')}</span>
                  <Badge variant="outline" className="text-xs">
                    {translateCategory(locale, project.category)}
                  </Badge>
                </div>
                <div className="border-t pt-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('project-detail.created')}</span>
                    <span className="font-medium">
                      {new Date(project.createdAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-muted-foreground">{t('project-detail.last-updated')}</span>
                    <span className="font-medium">
                      {new Date(project.updatedAt).toLocaleDateString(locale === 'zh-CN' ? 'zh-CN' : 'en-US')}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
