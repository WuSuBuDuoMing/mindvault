import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { exportProjectToMarkdown } from '@/lib/export/markdown'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        conversations: {
          include: {
            conversation: {
              include: {
                messages: {
                  orderBy: { orderIndex: 'asc' },
                },
                prompts: true,
                codeSnippets: true,
              },
            },
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      )
    }

    const markdown = exportProjectToMarkdown({
      name: project.name,
      summary: project.summary,
      category: project.category,
      conversations: project.conversations.map((cp) => ({
        title: cp.conversation.title,
        summary: cp.conversation.summary,
        createdAt: cp.conversation.createdAt,
        messages: cp.conversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
          createdAt: m.createdAt,
        })),
        prompts: cp.conversation.prompts.map((p) => ({
          title: p.title,
          content: p.content,
          tags: p.tags,
        })),
        codeSnippets: cp.conversation.codeSnippets.map((s) => ({
          language: s.language,
          code: s.code,
          description: s.description,
        })),
      })),
    })

    const filename = `project-${project.name.toLowerCase().replace(/\s+/g, '-')}.md`

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error exporting project:', error)
    return NextResponse.json(
      { error: 'Failed to export project' },
      { status: 500 }
    )
  }
}
