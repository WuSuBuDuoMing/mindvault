import { NextResponse } from 'next/server'
import { searchAll, type SearchOptions } from '@/lib/search'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')

    if (!query) {
      return NextResponse.json([])
    }

    // Parse advanced search options
    const options: SearchOptions = {}

    // Type filter (comma-separated)
    const typesParam = searchParams.get('types')
    if (typesParam) {
      options.types = typesParam
        .split(',')
        .map((t) => t.trim())
        .filter((t) => ['conversation', 'prompt', 'code', 'project'].includes(t)) as SearchOptions['types']
    }

    // Tag filter (comma-separated)
    const tagsParam = searchParams.get('tags')
    if (tagsParam) {
      options.tags = tagsParam.split(',').map((t) => t.trim()).filter(Boolean)
    }

    // Date range filter
    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) {
      options.dateFrom = new Date(dateFrom)
    }
    const dateTo = searchParams.get('dateTo')
    if (dateTo) {
      options.dateTo = new Date(dateTo)
    }

    // Limit
    const limit = searchParams.get('limit')
    if (limit) {
      options.limit = parseInt(limit, 10)
    }

    // Fuzzy search
    const fuzzy = searchParams.get('fuzzy')
    if (fuzzy === 'true') {
      options.fuzzy = true
    }

    const response = await searchAll(query, options)
    return NextResponse.json(response)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    )
  }
}
