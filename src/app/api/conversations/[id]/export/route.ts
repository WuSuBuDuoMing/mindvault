import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { exportConversationToMarkdown } from '@/lib/export/markdown'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id: params.id },
      include: {
        messages: {
          orderBy: { orderIndex: 'asc' },
        },
        prompts: true,
        codeSnippets: true,
      },
    })

    if (!conversation) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    const markdown = exportConversationToMarkdown({
      title: conversation.title,
      summary: conversation.summary,
      keywords: conversation.keywords ? JSON.parse(conversation.keywords) : undefined,
      createdAt: conversation.createdAt,
      messages: conversation.messages.map((m) => ({
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
      })),
      prompts: conversation.prompts.map((p) => ({
        title: p.title,
        content: p.content,
        tags: p.tags,
      })),
      codeSnippets: conversation.codeSnippets.map((s) => ({
        language: s.language,
        code: s.code,
        description: s.description,
      })),
    })

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="conversation-${conversation.id}.md"`,
      },
    })
  } catch (error) {
    console.error('Error exporting conversation:', error)
    return NextResponse.json(
      { error: 'Failed to export conversation' },
      { status: 500 }
    )
  }
}
