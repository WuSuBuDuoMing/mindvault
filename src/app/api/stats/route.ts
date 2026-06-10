import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const [conversations, projects, prompts, codeSnippets] = await Promise.all([
      prisma.conversation.count(),
      prisma.project.count(),
      prisma.promptItem.count(),
      prisma.codeSnippet.count(),
    ])

    return NextResponse.json({
      conversations,
      projects,
      prompts,
      codeSnippets,
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
