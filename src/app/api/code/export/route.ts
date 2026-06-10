import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const snippets = await prisma.codeSnippet.findMany({
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

    lines.push('# Code Snippets Library')
    lines.push('')
    lines.push(`Exported on ${new Date().toLocaleDateString()}`)
    lines.push(`Total: ${snippets.length} snippets`)
    lines.push('')
    lines.push('---')
    lines.push('')

    for (const snippet of snippets) {
      const title = snippet.description || `${snippet.language || 'Code'} Snippet`
      lines.push(`## ${title}`)
      lines.push('')

      lines.push(`- **Language:** ${snippet.language || 'Unknown'}`)
      lines.push(`- **Source:** [${snippet.conversation.title}](/conversations/${snippet.conversation.id})`)
      lines.push(`- **Created:** ${new Date(snippet.createdAt).toLocaleDateString()}`)
      lines.push(`- **Lines:** ${snippet.code.split('\n').length}`)
      lines.push('')
      lines.push(`\`\`\`${snippet.language || ''}`)
      lines.push(snippet.code)
      lines.push('```')
      lines.push('')
      lines.push('---')
      lines.push('')
    }

    const markdown = lines.join('\n')

    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="code-snippets-${new Date().toISOString().split('T')[0]}.md"`,
      },
    })
  } catch (error) {
    console.error('Error exporting code snippets:', error)
    return NextResponse.json(
      { error: 'Failed to export code snippets' },
      { status: 500 }
    )
  }
}
