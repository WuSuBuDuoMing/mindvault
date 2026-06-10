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

    return NextResponse.json(prompts)
  } catch (error) {
    console.error('Error fetching prompts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch prompts' },
      { status: 500 }
    )
  }
}
