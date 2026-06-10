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

    return NextResponse.json(snippets)
  } catch (error) {
    console.error('Error fetching code snippets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch code snippets' },
      { status: 500 }
    )
  }
}
