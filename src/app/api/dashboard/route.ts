import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
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

  const recentConversations = await prisma.conversation.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 5,
    select: {
      id: true,
      title: true,
      messageCount: true,
      updatedAt: true,
    },
  })

  const recentProjects = await prisma.project.findMany({
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

  // Top keywords
  const conversations = await prisma.conversation.findMany({
    where: { keywords: { not: null } },
    select: { keywords: true },
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
  const topKeywords = Array.from(keywordCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([keyword, count]) => ({ keyword, count }))

  // Top categories
  const projects = await prisma.project.findMany({
    select: {
      category: true,
      _count: { select: { conversations: true } },
    },
  })
  const topCategories = projects
    .sort((a, b) => b._count.conversations - a._count.conversations)
    .slice(0, 5)
    .map(p => ({ category: p.category, count: p._count.conversations }))

  // Recent activity
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
          project: { select: { name: true } },
        },
        take: 1,
      },
    },
  })
  const recentActivity = recentConvs.map((conv) => ({
    id: conv.id,
    title: conv.title,
    date: conv.updatedAt.toISOString(),
    type: 'conversation' as const,
    meta: `${conv.messageCount} messages`,
    project: conv.projects[0]?.project.name || null,
  }))

  return NextResponse.json({
    stats: {
      conversationCount,
      messageCount,
      projectCount,
      promptCount,
      codeSnippetCount,
      latestImport: latestImport?.importedAt?.toISOString() || null,
      latestBatch: latestBatch ? {
        conversationCount: latestBatch.conversationCount,
        messageCount: latestBatch.messageCount,
        status: latestBatch.status,
      } : null,
    },
    recentConversations: recentConversations.map(c => ({
      ...c,
      updatedAt: c.updatedAt.toISOString(),
    })),
    recentProjects: recentProjects.map(p => ({
      ...p,
      updatedAt: p.updatedAt.toISOString(),
    })),
    topKeywords,
    topCategories,
    recentActivity,
  })
}
