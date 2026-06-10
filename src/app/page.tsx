import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
import { prisma } from '@/lib/db'

async function getStats() {
  const [
    conversationCount,
    messageCount,
    projectCount,
    promptCount,
    codeSnippetCount,
    latestImport,
    latestBatch,
  ] = await Promise.all([
    prisma.conversation.count(),
    prisma.message.count(),
    prisma.project.count(),
    prisma.promptItem.count(),
    prisma.codeSnippet.count(),
    prisma.conversation.findFirst({
      orderBy: { importedAt: 'desc' },
      select: { importedAt: true },
    }),
    prisma.importBatch.findFirst({
      orderBy: { createdAt: 'desc' },
    }),
  ])

  return {
    conversationCount,
    messageCount,
    projectCount,
    promptCount,
    codeSnippetCount,
    latestImport: latestImport?.importedAt || null,
    latestBatch,
  }
}

async function getRecentConversations() {
  return prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      messageCount: true,
      updatedAt: true,
    },
  })
}

async function getRecentProjects() {
  return prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 4,
    select: {
      id: true,
      name: true,
      category: true,
      updatedAt: true,
      _count: {
        select: { conversations: true },
      },
    },
  })
}

async function getTopKeywords() {
  const conversations = await prisma.conversation.findMany({
    where: {
      keywords: { not: null },
    },
    select: {
      keywords: true,
    },
    take: 100,
  })

  const keywordCount = new Map<string, number>()
  for (const conv of conversations) {
    if (conv.keywords) {
      try {
        const keywords = JSON.parse(conv.keywords) as string[]
        for (const kw of keywords) {
          keywordCount.set(kw, (keywordCount.get(kw) || 0) + 1)
        }
      } catch { /* ignore */ }
    }
  }

  return Array.from(keywordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, count]) => ({ keyword, count }))
}

async function getTopCategories() {
  const projects = await prisma.project.findMany({
    select: {
      category: true,
      _count: {
        select: { conversations: true },
      },
    },
  })

  return projects
    .sort((a, b) => b._count.conversations - a._count.conversations)
    .slice(0, 5)
    .map(p => ({ category: p.category, count: p._count.conversations }))
}

async function getRecentActivity() {
  const recentConvs = await prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 10,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      messageCount: true,
      projects: {
        select: {
          project: {
            select: { name: true },
          },
        },
        take: 1,
      },
    },
  })

  return recentConvs.map((conv) => ({
    id: conv.id,
    title: conv.title,
    date: conv.updatedAt,
    type: 'conversation' as const,
    meta: `${conv.messageCount} messages`,
    project: conv.projects[0]?.project.name || null,
  }))
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

export default async function DashboardPage() {
  const stats = await getStats()
  const recentConversations = await getRecentConversations()
  const recentProjects = await getRecentProjects()
  const topKeywords = await getTopKeywords()
  const topCategories = await getTopCategories()
  const recentActivity = await getRecentActivity()

  const statCards = [
    { name: 'Conversations', value: stats.conversationCount, icon: MessageSquare, href: '/conversations' },
    { name: 'Messages', value: stats.messageCount, icon: MessageSquare, href: '/conversations' },
    { name: 'Projects', value: stats.projectCount, icon: FolderOpen, href: '/projects' },
    { name: 'Prompts', value: stats.promptCount, icon: Sparkles, href: '/prompts' },
    { name: 'Code Snippets', value: stats.codeSnippetCount, icon: Code, href: '/code' },
  ]

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Your Claude conversation knowledge base
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {statCards.map((stat) => {
          const Icon = stat.icon
          return (
            <Link key={stat.name} href={stat.href}>
              <Card className="hover:bg-muted/50 transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {stat.name}
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
            <CardTitle className="text-lg">Quick Start</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Import your Claude conversation history to get started.
            </p>
            <div className="flex flex-col gap-2">
              <Link
                href="/import"
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Import Conversations
              </Link>
              <Link
                href="/search"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Search All Data
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Conversations */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent Conversations</CardTitle>
              <Link
                href="/conversations"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentConversations.length === 0 ? (
              <div className="flex items-start gap-3 py-2">
                <Clock className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">No imports yet</p>
                  <p className="text-xs text-muted-foreground">
                    Import your first conversation to get started
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
                        {conv.messageCount} messages • {new Date(conv.updatedAt).toLocaleDateString()}
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
              <CardTitle className="text-lg">Recent Projects</CardTitle>
              <Link
                href="/projects"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentProjects.length === 0 ? (
              <div className="flex items-start gap-3 py-2">
                <FolderOpen className="mt-0.5 h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">No projects yet</p>
                  <p className="text-xs text-muted-foreground">
                    Projects are created automatically when you import conversations
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
                          {project.category}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {project._count.conversations} conversations • {new Date(project.updatedAt).toLocaleDateString()}
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
        {/* Top Keywords */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            {topKeywords.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Keywords will appear here after importing conversations
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

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Categories will appear here after importing conversations
              </p>
            ) : (
              <div className="space-y-3">
                {topCategories.map(({ category, count }) => {
                  const total = topCategories.reduce((s, c) => s + c.count, 0)
                  const percentage = Math.round((count / total) * 100)
                  return (
                    <div key={category} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="capitalize">{category}</span>
                        <span className="text-muted-foreground">{count} conversations</span>
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
        {/* Last Import Info */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Import Status
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
                  <span className="text-muted-foreground">Last import:</span>
                  <span className="font-medium">
                    {stats.latestImport.toLocaleDateString()} at{' '}
                    {stats.latestImport.toLocaleTimeString()}
                  </span>
                </div>
                {stats.latestBatch && (
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">Batch conversations</p>
                      <p className="font-medium">{stats.latestBatch.conversationCount}</p>
                    </div>
                    <div className="p-2 rounded bg-muted/50">
                      <p className="text-muted-foreground">Batch messages</p>
                      <p className="font-medium">{stats.latestBatch.messageCount}</p>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Total: {stats.conversationCount.toLocaleString()} conversations,{' '}
                  {stats.messageCount.toLocaleString()} messages
                </p>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/50" />
                <span>No imports yet</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-4 w-4" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Database</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="font-medium">SQLite (Local)</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Analysis</span>
                </div>
                <span className="font-medium">Rule-based (Local)</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Search</span>
                </div>
                <span className="font-medium">SQLite LIKE</span>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg mt-2">
                <p className="text-xs text-muted-foreground">
                  All data is stored locally on your machine. No data is sent to external servers.
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
              <CardTitle className="text-lg">Recent Activity</CardTitle>
              <Link
                href="/conversations"
                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
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
                        <span>
                          {new Date(activity.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
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
