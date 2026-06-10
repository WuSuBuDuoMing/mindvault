import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const prompts = await prisma.promptItem.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        conversation: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })

    const lines: string[] = []

    lines.push('# Prompt Library')
    lines.push('')
    lines.push(`Exported on ${new Date().toLocaleDateString()}`)
    lines.push(`Total: ${prompts.length} prompts`)
    lines.push('')
    lines.push('---')
    lines.push('')

    for (const prompt of prompts) {
      if (prompt.title) {
        lines.push(`## ${prompt.title}`)
      } else {
        lines.push('## Untitled Prompt')
      }
      lines.push('')

      lines.push(`- **Source:** [${prompt.conversation.title}](/conversations/${prompt.conversation.id})`)
      lines.push(`- **Created:** ${new Date(prompt.createdAt).toLocaleDateString()}`)
      if (prompt.tags) {
        try {
          const tags = JSON.parse(prompt.tags) as string[]
          if (tags.length > 0) {
            lines.push(`- **Tags:** ${tags.join(', ')}`)
          }
        } catch { /* ignore */ }
      }
      if (prompt.isFavorite) {
        lines.push('- **Favorite:** ⭐ Yes')
      }
      lines.push('')
      lines.push('```')
      lines.push(prompt.content)
      lines.push('```')
      lines.push('')
      lines.push('---')
      lines.push('')
    }

    const markdown = lines.join('\n')

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="prompts-${new Date().toISOString().split('T')[0]}.md"`,
      },
    })
  } catch (error) {
    console.error('Error exporting prompts:', error)
    return NextResponse.json(
      { error: 'Failed to export prompts' },
      { status: 500 }
    )
  }
}
