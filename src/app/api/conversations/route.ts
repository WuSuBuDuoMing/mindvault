import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getPaginationParams, createPaginationResult } from '@/lib/pagination'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const sortBy = searchParams.get('sortBy') || 'newest'
    const favorites = searchParams.get('favorites') === 'true'

    const { skip, page: currentPage, limit: pageSize } = getPaginationParams({ page, limit })

    // Build where clause
    const where: any = {}

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { summary: { contains: search } },
      ]
    }

    if (favorites) {
      where.isFavorite = true
    }

    // Build orderBy clause
    let orderBy: any = { updatedAt: 'desc' }
    switch (sortBy) {
      case 'oldest':
        orderBy = { createdAt: 'asc' }
        break
      case 'mostMessages':
        orderBy = { messageCount: 'desc' }
        break
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' }
        break
    }

    // Execute queries
    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        orderBy,
        skip,
        take: pageSize,
        include: {
          projects: {
            include: {
              project: {
                select: {
                  name: true,
                  category: true,
                },
              },
            },
          },
          tags: {
            include: {
              tag: true,
            },
          },
        },
      }),
      prisma.conversation.count({ where }),
    ])

    const result = createPaginationResult(conversations, total, currentPage, pageSize)

    return NextResponse.json(result.data, {
      headers: {
        'X-Total-Count': result.pagination.total.toString(),
        'X-Page': result.pagination.page.toString(),
        'X-Total-Pages': result.pagination.totalPages.toString(),
        'X-Has-Next': result.pagination.hasNext.toString(),
        'X-Has-Prev': result.pagination.hasPrev.toString(),
      },
    })
  } catch (error) {
    console.error('Error fetching conversations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}
