import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const batches = await prisma.importBatch.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json(batches)
  } catch (error) {
    console.error('Error fetching import history:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import history' },
      { status: 500 }
    )
  }
}
